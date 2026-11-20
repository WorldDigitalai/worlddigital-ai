"""Collectors: parsing of each provider's answer, isolation of failures, honest status for missing keys, and the summary shape."""
import time
from datetime import datetime, timezone

import mongomock
import pytest

from app import collectors as C
from app.config import Settings


def _s(**kw):
    base = dict(stripe_secret_key="sk_test", resend_api_key="re_x", dataforseo_login="a@b.c", dataforseo_password="pw")
    return Settings(**{**base, **kw})


def _now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.000000+00")


def test_stripe_counts_revenue_refunds_failures_and_balance(monkeypatch):
    t = int(time.time())
    pages = iter([
        {"data": [{"id": "ch_1", "created": t, "paid": True, "status": "succeeded", "currency": "usd", "amount": 19999, "amount_refunded": 0},
                  {"id": "ch_2", "created": t, "paid": True, "status": "succeeded", "currency": "usd", "amount": 4999, "amount_refunded": 4999},
                  {"id": "ch_3", "created": t, "paid": False, "status": "failed", "currency": "usd", "amount": 100},
                  {"id": "ch_4", "created": t, "paid": True, "status": "succeeded", "currency": "eur", "amount": 9900}], "has_more": True},
        {"data": [{"id": "ch_5", "created": t - 86400, "paid": True, "status": "succeeded", "currency": "usd", "amount": 1000}], "has_more": False}])
    monkeypatch.setattr(C, "_get", lambda url, **kw: {"available": [{"amount": 12345, "currency": "usd"}], "pending": [{"amount": 500, "currency": "usd"}]} if url.endswith("/balance") else next(pages))
    out = C.stripe(_s(), None)
    today, yest = C._today(), C._day(t - 86400)
    assert out[today]["payments"] == 2 and out[today]["revenue_usd"] == 249.98 and out[today]["refunded_usd"] == 49.99 and out[today]["failed"] == 1
    assert out[yest]["revenue_usd"] == 10.0
    assert out[today]["balance_available_usd"] == 123.45 and out[today]["balance_pending_usd"] == 5.0   # euro charge is not counted as dollars


def test_resend_counts_by_last_event(monkeypatch):
    ev = lambda i, e: {"id": i, "created_at": _now_iso(), "last_event": e}  # noqa: E731
    monkeypatch.setattr(C, "_get", lambda url, **kw: {"data": [ev("1", "delivered"), ev("2", "opened"), ev("3", "clicked"), ev("4", "bounced"), ev("5", "complained")], "has_more": False})
    m = C.resend(_s(), None)[C._today()]
    assert m == {"sent": 5, "delivered": 3, "opened": 2, "clicked": 1, "bounced": 1, "complained": 1}


def test_ai_usage_prices_each_provider_per_day():
    db = mongomock.MongoClient().db
    day = C._today()
    db["rag_meta"].insert_one({"_id": f"ai:{day}", "day": day, "by_model": {
        "gpt-5_4-mini": {"calls": 2, "in": 1_000_000, "out": 100_000}, "claude-haiku-5-5": {"calls": 3, "in": 2_000_000, "out": 1_000_000},
        "cerebras:qwen-3_8-27b": {"calls": 4, "in": 1_000_000, "out": 1_000_000}}})
    m = C.ai_usage(_s(), db)[day]
    assert m["openai_calls"] == 2 and m["openai_est_cost_usd"] == pytest.approx(0.75 + 0.45)
    assert m["claude_est_cost_usd"] == pytest.approx(0.20 + 0.50) and m["claude_tokens_in"] == 2_000_000
    assert m["cerebras_est_cost_usd"] == pytest.approx(0.99 + 1.49)


def test_run_isolates_failures_and_reports_missing_keys(monkeypatch):
    db = mongomock.MongoClient().db
    monkeypatch.setattr(C, "stripe", lambda s, d: (_ for _ in ()).throw(RuntimeError("stripe answered 401: bad key")))
    monkeypatch.setattr(C, "resend", lambda s, d: {C._today(): {"sent": 7, "delivered": 6}})
    for p in C.REGISTRY:   # the registry holds the functions: point it at the patched ones
        p["fn"] = {"stripe": C.stripe, "resend": C.resend}.get(p["id"], p["fn"])
    for k in ("OPENAI_ADMIN_KEY", "ANTHROPIC_ADMIN_KEY", "MERCURY_API_TOKEN", "CLOUDFLARE_API_TOKEN", "GOOGLE_SERVICE_ACCOUNT_B64"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setattr(C, "dataforseo", lambda s, d: {C._today(): {"balance_usd": 50.0}})
    for p in C.REGISTRY:
        if p["id"] == "dataforseo":
            p["fn"] = C.dataforseo
    done = C.run(_s(), db)
    assert done["stripe"] == "error" and done["resend"] == "ok" and done["dataforseo"] == "ok"   # stripe failing did not stop resend
    assert done["openai_billing"] == "needs_key" and done["mercury"] == "needs_key" and done["google_analytics"] == "needs_key" and done["tiktok"] == "not_connected"
    assert "OPENAI_ADMIN_KEY" in db["provider_status"].find_one({"_id": "openai_billing"})["message"]
    assert "401" in db["provider_status"].find_one({"_id": "stripe"})["message"]
    assert db["provider_metrics"].find_one({"_id": f"resend:{C._today()}"})["m"]["sent"] == 7
    C.run(_s(), db, "resend")   # running twice overwrites the day, it does not add to it
    assert db["provider_metrics"].count_documents({"provider": "resend"}) == 1 and db["provider_metrics"].find_one({"provider": "resend"})["m"]["sent"] == 7


def test_summary_zero_fills_days_and_sums_or_takes_latest():
    db = mongomock.MongoClient().db
    today = C._today()
    db["provider_metrics"].insert_one({"_id": f"stripe:{today}", "provider": "stripe", "day": today, "m": {"revenue_usd": 100.0, "balance_available_usd": 42.0}})
    db["provider_status"].insert_one({"_id": "stripe", "state": "ok", "message": "", "at": datetime.now(timezone.utc)})
    r = C.summary(db, 7)
    st = next(p for p in r["providers"] if p["id"] == "stripe")
    rev = next(m for m in st["metrics"] if m["key"] == "revenue_usd")
    assert len(rev["series"]) == 7 and rev["series"][-1]["v"] == 100.0 and rev["series"][0]["v"] == 0 and rev["value"] == 100.0
    assert next(m for m in st["metrics"] if m["key"] == "balance_available_usd")["value"] == 42.0 and st["state"] == "ok" and st["at"]
    assert next(p for p in r["providers"] if p["id"] == "tiktok")["state"] == "waiting"


def test_ai_cards_round_trip_through_the_database():
    """Collect for real (no stubs) and read the summary back: every AI card must show the numbers that were collected."""
    db = mongomock.MongoClient().db
    day = C._today()
    db["rag_meta"].insert_one({"_id": f"ai:{day}", "day": day, "by_model": {"gpt-5_4-mini": {"calls": 2, "in": 1_000_000, "out": 100_000},
                                                                        "claude-haiku-5-5": {"calls": 3, "in": 2_000_000, "out": 1_000_000}}})
    db["rag_meta"].insert_one({"_id": f"openai:{day}", "day": day, "usd": 0.5})
    C.run(_s(), db, "openai"); C.run(_s(), db, "claude")
    out = {p["id"]: p for p in C.summary(db, 7)["providers"]}
    val = lambda pid, key: next(m for m in out[pid]["metrics"] if m["key"] == key)  # noqa: E731
    assert val("openai", "openai_calls")["value"] == 2 and val("openai", "openai_calls")["has_data"]
    assert val("openai", "openai_est_cost_usd")["value"] == pytest.approx(1.2)   # token pricing wins over the older spend counter
    assert val("claude", "claude_calls")["value"] == 3 and val("claude", "claude_tokens_in")["value"] == 2_000_000
    assert not val("cerebras", "cerebras_calls")["has_data"]   # nothing collected = honest empty, not zeros
    # a day that only has the knowledge-base spend counter still shows OpenAI spend
    db["rag_meta"].delete_one({"_id": f"ai:{day}"})
    C.run(_s(), db, "openai")
    again = {p["id"]: p for p in C.summary(db, 7)["providers"]}
    assert next(m for m in again["openai"]["metrics"] if m["key"] == "openai_est_cost_usd")["value"] == pytest.approx(0.5)


def test_google_collectors_parse_reports(monkeypatch):
    monkeypatch.setenv("GA4_PROPERTY_ID", "properties/123456")
    monkeypatch.setenv("SEARCH_CONSOLE_SITE", "sc-domain:worlddigital.ai")
    seen = []

    def fake(url, scope, body):
        seen.append(url)
        if "analyticsdata" in url:
            return {"rows": [{"dimensionValues": [{"value": "20261119"}], "metricValues": [{"value": "12"}, {"value": "15"}, {"value": "40"}, {"value": "9"}]}]}
        return {"rows": [{"keys": ["2026-11-18"], "clicks": 3, "impressions": 120, "position": 8.456}]}
    monkeypatch.setattr(C, "_google_post", fake)
    ga = C.google_analytics(_s(), None)
    assert ga == {"2026-11-19": {"ga_users": 12.0, "ga_sessions": 15.0, "ga_views": 40.0, "ga_engaged": 9.0}} and "properties/123456:runReport" in seen[0]
    gsc = C.search_console(_s(), None)
    assert gsc == {"2026-11-18": {"gsc_clicks": 3, "gsc_impressions": 120, "gsc_position": 8.5}} and "sc-domain%3Aworlddigital.ai" in seen[1]


def test_google_needs_the_key_and_names_the_email_when_refused(monkeypatch):
    for k in ("GOOGLE_SERVICE_ACCOUNT_B64", "GA4_PROPERTY_ID"):
        monkeypatch.delenv(k, raising=False)
    gp = next(p for p in C.REGISTRY if p["id"] == "google_analytics")
    assert C._have(_s(), gp) == ["GOOGLE_SERVICE_ACCOUNT_B64", "GA4_PROPERTY_ID"]
    monkeypatch.setattr(C, "_google_token", lambda scope: ("tok", "viewer@proj.iam.gserviceaccount.com"))

    class R:
        status_code, text = 403, "no access"
    monkeypatch.setattr(C.httpx, "post", lambda *a, **k: R())
    with pytest.raises(RuntimeError) as e:
        C._google_post("https://x", "scope", {})
    assert "viewer@proj.iam.gserviceaccount.com" in str(e.value)


def test_buffer_collects_per_day_and_maps_metric_names(monkeypatch):
    monkeypatch.setenv("BUFFER_API_TOKEN", "tok")
    calls = []

    class R:
        status_code = 200
        headers = {"content-type": "application/json"}
        text = ""

        def __init__(self, d):
            self._d = d

        def json(self):
            return self._d

    def fake_post(url, json=None, **kw):
        calls.append(json["variables"])
        if "account" in json["query"]:
            return R({"data": {"account": {"organizations": [{"id": "org1"}]}}})
        day = json["variables"]["s"][:10]
        if day == C._today():
            return R({"data": {"aggregatedPostMetrics": {"metrics": [{"name": "Posts", "type": "postCount", "value": 3}, {"name": "Reactions", "type": "reactions", "value": 10}, {"name": "Impressions", "type": "impressions", "value": 400}, {"name": "Weird", "type": "weird", "value": 1}], "metricsUpdatedAt": "x"}}})
        return R({"data": {"aggregatedPostMetrics": {"metrics": [], "metricsUpdatedAt": None}}})   # days without posts are skipped
    monkeypatch.setattr(C.httpx, "post", fake_post)
    out = C.buffer(_s(), None)
    assert out == {C._today(): {"buffer_posts": 3.0, "buffer_reactions": 10.0, "buffer_impressions": 400.0}}
    assert len(calls) == 31 and all(c.get("o") in (None, "org1") for c in calls)


def test_get_waits_and_retries_on_429(monkeypatch):
    seq = iter([429, 429, 200])
    slept = []

    class R:
        def __init__(self, code):
            self.status_code, self.headers, self.text = code, {"retry-after": "1"}, "slow down"

        def json(self):
            return {"ok": True}
    monkeypatch.setattr(C.httpx, "get", lambda url, **kw: R(next(seq)))
    monkeypatch.setattr(C.time, "sleep", lambda s: slept.append(s))
    assert C._get("https://api.example.com/x") == {"ok": True} and slept == [1.0, 1.0]


def test_connector_filled_provider_stays_connected_and_expires():
    from datetime import datetime, timedelta, timezone
    db = mongomock.MongoClient().db
    s = _s()
    db["provider_push"].insert_one({"_id": "bird", "at": datetime.now(timezone.utc)})
    assert C.run(s, db, only="bird")["bird"] == "ok"
    db["provider_push"].replace_one({"_id": "bird"}, {"_id": "bird", "at": datetime.now(timezone.utc) - timedelta(hours=60)})
    assert C.run(s, db, only="bird")["bird"] == "not_connected"
