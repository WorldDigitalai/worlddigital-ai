"""Provider layer and meter: routing by configuration, fallback to OpenAI, trials that never fall back, and the
per-feature speed, cost, cache and error counters. Every provider is mocked; no network."""
import json

import httpx
import mongomock
import pytest
import respx

from app import main, providers, services
from app.config import Settings
from app.store import Store

GROQ = "https://groq.test/openai/v1/chat/completions"
OPENAI = "https://openai.test/v1/chat/completions"


def sse(*events) -> httpx.Response:
    body = "".join(f"data: {json.dumps(e)}\n\n" for e in events) + "data: [DONE]\n\n"
    return httpx.Response(200, text=body, headers={"content-type": "text/event-stream"})


def words(*pieces, usage=None):
    return sse(*[{"choices": [{"delta": {"content": p}}]} for p in pieces], *([{"choices": [], "usage": usage}] if usage else []))


@pytest.fixture
def env(monkeypatch):
    for k, v in {"OPENAI_API_KEY": "t", "OPENAI_BASE": "https://openai.test", "GROQ_API_KEY": "gk",
                 "GROQ_BASE": "https://groq.test/openai/v1", "INTERNAL_TOKEN": "secret-token"}.items():
        monkeypatch.setenv(k, v)
    monkeypatch.delenv("AI_ROUTES", raising=False)
    monkeypatch.delenv("CEREBRAS_API_KEY", raising=False)
    main.settings.cache_clear()
    st = Store(mongomock.MongoClient()["test"])
    st.ensure_indexes()
    main.set_store(st)
    services._working_model.clear()
    with respx.mock(assert_all_called=False) as r:
        yield r, monkeypatch
    services._working_model.clear()
    main.set_store(None)
    main.settings.cache_clear()


def meter():
    return main.meter_summary(1)


def test_routes_are_configuration_and_need_a_key(env):
    _, mp = env
    assert providers.pick(Settings(), "chat.reply") is None                       # no routes: OpenAI as before
    mp.setenv("AI_ROUTES", '{"chat.reply": "groq:openai/gpt-oss-120b", "*": "cerebras:gpt-oss-120b"}')
    t = providers.pick(Settings(), "chat.reply")
    assert (t.provider, t.model, t.key) == ("groq", "openai/gpt-oss-120b", "gk")
    assert providers.pick(Settings(), "other.feature") is None                    # cerebras has no key: not used
    assert providers.pick(Settings(), "chat.reply", "gpt-5.4-nano") is None       # an explicit OpenAI model wins
    assert providers.pick(Settings(), "x", "groq:openai/gpt-oss-20b").model == "openai/gpt-oss-20b"
    mp.setenv("AI_ROUTES", "not json")
    assert providers.pick(Settings(), "chat.reply") is None


def test_cost_uses_list_prices_and_never_guesses():
    assert providers.cost_micro("gpt-5.4-mini", 2300, 70) == round(2300 * 0.75 + 70 * 4.5)
    assert providers.cost_micro("gpt-5.4-mini", 2300, 70, cached=2000) == round(300 * 0.75 + 2000 * 0.075 + 70 * 4.5)
    assert providers.cost_micro("groq:openai/gpt-oss-120b", 2300, 70) == round(2300 * 0.15 + 70 * 0.6)
    assert providers.cost_micro("cerebras:gpt-oss-120b", 2300, 70) is None        # price not verified: not invented


def test_without_routes_openai_is_called_exactly_as_before_and_metered(env):
    r, _ = env
    oa = r.post(OPENAI).mock(return_value=words("Hello", " there", usage={
        "prompt_tokens": 1000, "completion_tokens": 20, "prompt_tokens_details": {"cached_tokens": 600}}))
    groq = r.post(GROQ).mock(return_value=words("no"))
    assert "".join(services.openai_stream(Settings(), system="s", user="u", feature="rag.answer")) == "Hello there"
    assert oa.call_count == 1 and groq.call_count == 0
    sent = json.loads(oa.calls[0].request.content)
    assert sent["model"] == "gpt-5.4-mini" and sent["reasoning_effort"] == "none"
    f = meter()["features"]["rag_answer"]
    assert f["calls"] == 1 and f["errors"] == 0 and f["avg_ms"] is not None and f["avg_first_ms"] is not None
    assert f["cached_share"] == 0.6 and f["cost_usd"] == round((400 * 0.75 + 600 * 0.075 + 20 * 4.5) / 1e6, 4)
    assert meter()["fallbacks"] == 0


def test_a_routed_feature_streams_from_groq(env):
    r, mp = env
    mp.setenv("AI_ROUTES", '{"rag.answer": "groq:openai/gpt-oss-120b"}')
    oa = r.post(OPENAI).mock(return_value=words("no"))
    groq = r.post(GROQ).mock(return_value=sse(
        {"choices": [{"delta": {"reasoning": "thinking"}}]},                      # reasoning is never shown
        {"choices": [{"delta": {"content": "Fast"}}]}, {"choices": [{"delta": {"content": " answer"}}]},
        {"choices": [], "x_groq": {"usage": {"prompt_tokens": 2300, "completion_tokens": 70}}}))
    assert "".join(services.openai_stream(Settings(), system="s", user="u", max_tokens=450, feature="rag.answer")) == "Fast answer"
    assert groq.call_count == 1 and oa.call_count == 0
    req = groq.calls[0].request
    sent = json.loads(req.content)
    assert req.headers["authorization"] == "Bearer gk" and sent["model"] == "openai/gpt-oss-120b"
    assert sent["reasoning_effort"] == "low" and sent["max_completion_tokens"] == 1800 and sent["stream"] is True
    m = meter()
    assert m["models"] == {"groq:openai/gpt-oss-120b": 1} and m["fallbacks"] == 0
    assert m["features"]["rag_answer"]["cost_usd"] == round((2300 * 0.15 + 70 * 0.6) / 1e6, 4)


@pytest.mark.parametrize("failure", [httpx.Response(429, json={"error": "rate limit"}), httpx.Response(503, text="down"),
                                     httpx.ConnectTimeout("slow")])
def test_a_routed_feature_falls_back_to_openai_and_is_counted(env, failure):
    r, mp = env
    mp.setenv("AI_ROUTES", '{"*": "groq:openai/gpt-oss-120b"}')
    r.post(GROQ).mock(side_effect=failure if isinstance(failure, Exception) else None, return_value=None if isinstance(failure, Exception) else failure)
    oa = r.post(OPENAI).mock(return_value=words("From", " OpenAI", usage={"prompt_tokens": 10, "completion_tokens": 2}))
    assert "".join(services.openai_stream(Settings(), system="s", user="u", feature="rag.answer")) == "From OpenAI"
    assert oa.call_count == 1
    m = meter()
    assert m["fallbacks"] == 1 and m["features"]["rag_answer"]["errors"] == 1 and m["features"]["rag_answer"]["calls"] == 2


def test_no_fallback_once_the_visitor_has_seen_words(env):
    r, mp = env
    mp.setenv("AI_ROUTES", '{"*": "groq:openai/gpt-oss-120b"}')
    r.post(GROQ).mock(return_value=sse({"choices": [{"delta": {"content": "Half an"}}]}, {"error": {"message": "overloaded"}}))
    oa = r.post(OPENAI).mock(return_value=words("no"))
    got = []
    with pytest.raises(services.ApiError):
        for piece in services.openai_stream(Settings(), system="s", user="u", feature="rag.answer"):
            got.append(piece)
    assert got == ["Half an"] and oa.call_count == 0                               # never two answers glued together


def test_a_trial_model_never_falls_back(env):
    r, _ = env
    r.post(GROQ).mock(return_value=httpx.Response(500, text="boom"))
    oa = r.post(OPENAI).mock(return_value=words("no"))
    with pytest.raises(services.ApiError):
        list(services.openai_stream(Settings(), system="s", user="u", feature="rag.answer", model="groq:openai/gpt-oss-20b"))
    assert oa.call_count == 0                                                      # a trial must show its own result
    with pytest.raises(services.ApiError) as e:                                    # provider without a key: said plainly
        list(services.openai_stream(Settings(), system="s", user="u", model="cerebras:gpt-oss-120b"))
    assert "no API key" in str(e.value) and oa.call_count == 0


def test_an_explicit_openai_model_is_not_a_fallback(env):
    r, _ = env
    r.post(OPENAI).mock(return_value=words("ok", usage={"prompt_tokens": 5, "completion_tokens": 1}))
    list(services.openai_stream(Settings(), system="s", user="u", feature="rag.answer", model="gpt-5.4-nano"))
    assert meter()["fallbacks"] == 0 and meter()["features"]["rag_answer"]["unpriced_calls"] == 1


def test_json_calls_route_drop_refused_fields_and_fall_back(env):
    r, mp = env
    mp.setenv("AI_ROUTES", '{"chat.reply": "groq:openai/gpt-oss-120b"}')
    seen = []

    def groq(request):
        body = json.loads(request.content)
        seen.append(body)
        if "reasoning_effort" in body:
            return httpx.Response(400, json={"error": {"message": "reasoning_effort is not supported"}})
        return httpx.Response(200, json={"choices": [{"message": {"content": '{"reply": "hi"}'}}],
                                         "usage": {"prompt_tokens": 100, "completion_tokens": 10}})
    r.post(GROQ).mock(side_effect=groq)
    oa = r.post(OPENAI).mock(return_value=httpx.Response(200, json={
        "choices": [{"message": {"content": '{"reply": "from openai"}'}}], "usage": {"prompt_tokens": 1, "completion_tokens": 1}}))
    s = Settings()
    assert services.openai_json(s, system="s", user="u", feature="chat.reply") == {"reply": "hi"}
    assert len(seen) == 2 and "reasoning_effort" not in seen[1] and seen[1]["response_format"] == {"type": "json_object"}
    assert services.openai_json(s, system="s", user="u", feature="chat.reply") == {"reply": "hi"}
    assert len(seen) == 3 and "reasoning_effort" not in seen[2] and oa.call_count == 0   # refusal remembered
    services._effort_refused.discard(("groq:openai/gpt-oss-120b", "low"))

    r.post(GROQ).mock(return_value=httpx.Response(200, json={"choices": [{"message": {"content": "not json"}}]}))
    assert services.openai_json(s, system="s", user="u", feature="chat.reply") == {"reply": "from openai"}
    m = meter()
    assert m["fallbacks"] == 1 and m["features"]["chat_reply"]["errors"] == 1


def test_meter_endpoint_is_token_guarded_and_times_the_chat_path(env):
    from fastapi.testclient import TestClient
    r, _ = env
    r.post(OPENAI).mock(return_value=httpx.Response(500, text="down"))
    with pytest.raises(services.ApiError):
        services.openai_json(Settings(), system="s", user="u", feature="chat.reply")
    main._record_path("chat", 1200)
    main._record_path("chat", 800)
    main._record_path("tool_keywords", 9000, ok=False)
    assert TestClient(main.app).get("/api/admin/meter").status_code == 403
    m = TestClient(main.app, headers={"x-internal-token": "secret-token"}).get("/api/admin/meter?days=1").json()
    assert m["paths"]["chat"] == {"n": 2, "errors": 0, "avg_ms": 1000} and m["paths"]["tool_keywords"]["errors"] == 1
    assert m["features"]["chat_reply"]["errors"] >= 1
