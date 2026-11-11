"""WD-IEE: plan checks, parallel and sequential runs, optional and required failures, retries, the execution cache,
shared in-flight work, run records, and the keyword tool running as a plan. No network."""
import threading
import time

import pytest

from app import engine, main
from app.engine import MemoryCache, Plan, PlanError, Task, execute

from test_api import env  # noqa: F401  (the API fixture: mocked OpenAI, DataForSEO, customer site)


def slow(value, seconds=0.2, log=None):
    def fn(ctx):
        time.sleep(seconds)
        if log is not None:
            log.append(value)
        return value
    return fn


def test_a_wrong_plan_fails_when_it_is_built():
    ok = lambda c: 1  # noqa: E731
    with pytest.raises(PlanError, match="duplicate"):
        Plan("p", [Task("a", ok), Task("a", ok)])
    with pytest.raises(PlanError, match="unknown"):
        Plan("p", [Task("a", ok, needs=("missing",))])
    with pytest.raises(PlanError, match="cycle"):
        Plan("p", [Task("a", ok, needs=("b",)), Task("b", ok, needs=("a",))])
    with pytest.raises(PlanError, match="cache_key"):
        Plan("p", [Task("a", ok, cache_ttl=60)])
    with pytest.raises(PlanError, match="reserved"):
        Plan("p", [Task("input", ok)])
    p = Plan("p", [Task("a", ok), Task("b", ok), Task("c", ok, needs=("a", "b")), Task("d", ok, needs=("c",))])
    assert p.levels == [["a", "b"], ["c"], ["d"]]


def test_independent_tasks_run_together_and_dependents_wait():
    plan = Plan("p", [Task("a", slow(1)), Task("b", slow(2)), Task("c", slow(3)),
                      Task("sum", lambda c: c["a"] + c["b"] + c["c"] + c["input"]["x"], needs=("a", "b", "c"))])
    par = execute(plan, {"x": 10}, workers=4, sink=None, cache=None)
    seq = execute(plan, {"x": 10}, workers=1, sink=None, cache=None)
    assert par.results["sum"] == seq.results["sum"] == 16
    assert seq.ms >= 590 and par.ms < 400                      # three 0.2 s tasks: one after another vs together
    assert [t["task"] for t in par.tasks] == ["a", "b", "c", "sum"] and all(t["status"] == "ok" for t in par.tasks)
    assert par.record()["task_ms"] >= 590                      # the work done is the same; only the waiting changes


def test_one_worker_runs_in_plan_order():
    log = []
    plan = Plan("p", [Task("a", slow("a", 0.01, log)), Task("b", slow("b", 0.01, log)), Task("c", slow("c", 0.01, log), needs=("a",))])
    execute(plan, {}, workers=1, sink=None, cache=None)
    assert log == ["a", "b", "c"]


def test_optional_failure_uses_the_default_and_required_failure_raises_the_original_error():
    class Boom(Exception):
        pass

    def bad(ctx):
        raise Boom("nope")
    records = []
    plan = Plan("p", [Task("maybe", bad, optional=True, default=[]), Task("use", lambda c: len(c["maybe"]), needs=("maybe",))])
    run = execute(plan, {}, sink=records.append, cache=None)
    assert run.ok and run.results == {"maybe": [], "use": 0}
    assert records[0]["tasks"][0]["status"] == "defaulted" and records[0]["tasks"][0]["error"] == "Boom"

    plan = Plan("p", [Task("must", bad), Task("after", lambda c: 1, needs=("must",))])
    with pytest.raises(Boom):
        execute(plan, {}, sink=records.append, cache=None)
    rec = records[1]
    assert rec["ok"] is False and [t["status"] for t in rec["tasks"]] == ["failed", "skipped"]
    assert "nope" not in str(rec)                              # records carry error types, never messages or data

    def broken_sink(_):
        raise RuntimeError("db down")
    assert execute(Plan("p", [Task("a", lambda c: 1)]), {}, sink=broken_sink, cache=None).ok   # a sink never breaks a run


def test_retries_only_the_named_errors_with_growing_waits():
    calls, waits = [], []

    def flaky(ctx):
        calls.append(1)
        if len(calls) < 3:
            raise TimeoutError("slow")
        return "ok"
    run = execute(Plan("p", [Task("a", flaky, retries=3, retry_on=(TimeoutError,))]), {}, sink=None, cache=None, sleep=waits.append)
    assert run.results["a"] == "ok" and run.tasks[0]["attempts"] == 3
    assert len(waits) == 2 and 0.375 <= waits[0] <= 0.5 and 0.75 <= waits[1] <= 1.0

    calls.clear()
    with pytest.raises(TimeoutError):
        execute(Plan("p", [Task("a", flaky, retries=1, retry_on=(TimeoutError,))]), {}, sink=None, cache=None, sleep=waits.append)
    assert len(calls) == 2
    calls.clear()
    with pytest.raises(TimeoutError):                           # not named: not retried
        execute(Plan("p", [Task("a", flaky, retries=3, retry_on=(ValueError,))]), {}, sink=None, cache=None)
    assert len(calls) == 1


def test_execution_cache_keys_versions_policies_and_failures():
    calls = []

    def work(ctx):
        calls.append(ctx["input"]["domain"])
        if ctx["input"]["domain"] == "bad.com":
            raise ValueError("fail")
        return {"rows": [1, 2]}
    key = lambda c: [c["input"]["domain"]]  # noqa: E731
    plan = Plan("p", [Task("t", work, cache_ttl=60, cache_key=key)])
    cache = MemoryCache()
    assert execute(plan, {"domain": "a.com", "noise": 1}, cache=cache, sink=None).tasks[0]["status"] == "ok"
    hit = execute(plan, {"domain": "a.com", "noise": 2}, cache=cache, sink=None)        # only the named input matters
    assert hit.tasks[0]["status"] == "cached" and hit.results["t"] == {"rows": [1, 2]} and calls == ["a.com"]
    assert execute(plan, {"domain": "b.com"}, cache=cache, sink=None).tasks[0]["status"] == "ok"        # other input
    v2 = Plan("p", [Task("t", work, cache_ttl=60, cache_key=key, version=2)])
    assert execute(v2, {"domain": "a.com"}, cache=cache, sink=None).tasks[0]["status"] == "ok"          # new version
    assert execute(plan, {"domain": "a.com"}, cache=cache, policy="always", sink=None).tasks[0]["status"] == "ok"
    assert execute(plan, {"domain": "a.com"}, cache=cache, policy="never", sink=None).tasks[0]["status"] == "ok"
    assert calls == ["a.com", "b.com", "a.com", "a.com", "a.com"]
    for _ in range(2):                                          # a failure is never cached
        with pytest.raises(ValueError):
            execute(plan, {"domain": "bad.com"}, cache=cache, sink=None)
    assert calls.count("bad.com") == 2
    with pytest.raises(ValueError):
        execute(plan, {}, policy="sometimes")

    class Down:
        def get(self, k):
            raise ConnectionError()

        def set(self, k, v, ttl):
            raise ConnectionError()
    r = execute(plan, {"domain": "c.com"}, cache=Down(), sink=None)                       # a broken cache costs nothing
    assert r.ok and r.tasks[0]["cache_error"] == "ConnectionError"


def test_identical_work_in_flight_is_done_once():
    calls = []

    def work(ctx):
        calls.append(1)
        time.sleep(0.2)
        return "x"
    plan = Plan("p", [Task("t", work, cache_ttl=60, cache_key=lambda c: c["input"]["k"])])
    out = []
    threads = [threading.Thread(target=lambda: out.append(execute(plan, {"k": 1}, cache=MemoryCache(), sink=None))) for _ in range(3)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert len(calls) == 1 and [r.results["t"] for r in out] == ["x"] * 3
    assert sorted(r.tasks[0]["status"] for r in out) == ["ok", "shared", "shared"]
    assert engine._inflight == {}


def test_keyword_tool_runs_as_a_plan_with_records_and_a_reused_lookup(env, monkeypatch):  # noqa: F811
    c, m = env
    from app.products import KEYWORD_PLAN
    assert KEYWORD_PLAN.levels == [["site", "site_keywords"], ["seeds"], ["pick"]]
    r = c.post("/api/tools/keywords/preview", json={"url": "bayoucityplumbing.com", "country": "us"})
    assert r.status_code == 200 and len(r.json()["items"]) == 3      # the free preview shows 3 of the 10
    runs = list(main.store().db["engine_runs"].find())
    assert len(runs) == 1 and runs[0]["plan"] == "keywords" and runs[0]["ok"]
    assert [t["task"] for t in runs[0]["tasks"]] == ["site", "site_keywords", "seeds", "pick"]
    assert "bayou" not in str(runs[0]).lower()                  # the record holds timings, not customer data

    from app import products
    real, seen = products.keywords_for_site, []
    monkeypatch.setattr(products, "keywords_for_site", lambda *a, **k: (seen.append(a[1:]), real(*a, **k))[1])
    lookups = lambda: len(seen)  # noqa: E731
    before = lookups()
    r = c.post("/api/tools/keywords/preview", json={"url": "bayoucityplumbing.com", "country": "ca"})   # other market: new lookup
    assert r.status_code == 200 and lookups() == before + 1
    from app.products import generate_keywords
    out = generate_keywords(main.settings(), url="https://bayoucityplumbing.com", domain="bayoucityplumbing.com", country="us")
    assert len(out["items"]) == 10 and lookups() == before + 1   # same site and market within a day: lookup reused
    last = main.store().db["engine_runs"].find_one({"tasks.status": "cached"})
    assert last and [t["status"] for t in last["tasks"]][1] == "cached"
    summary = c.get("/api/admin/meter?days=1").json()
    assert summary["engine"]["keywords"]["runs"] == 3 and summary["engine"]["keywords"]["tasks"]["site_keywords"]["cached"] == 1
    assert summary["paths"]["tool_keywords"]["n"] == 2 and summary["features"]["products_generate_keywords"]["calls"] >= 2


def test_keyword_tool_survives_a_failed_site_lookup(env, monkeypatch):  # noqa: F811
    c, m = env
    from app import products

    def down(*a, **k):
        raise products.ApiError("DataForSEO 500", 502)
    monkeypatch.setattr(products, "keywords_for_site", down)
    r = c.post("/api/tools/keywords/preview", json={"url": "bayoucityplumbing.com", "country": "us"})
    assert r.status_code == 200 and len(r.json()["items"]) == 3     # seeds cover it, as before
    run = main.store().db["engine_runs"].find_one()
    assert run["tasks"][1]["status"] == "defaulted" and run["ok"]


def test_benchmark_runs_both_ways_on_our_own_site_only(env):  # noqa: F811
    c, m = env
    assert c.post("/api/admin/engine/benchmark", json={"url": "someoneelse.com"}).status_code == 400
    b = c.post("/api/admin/engine/benchmark", json={}).json()
    assert b["sequential"]["workers"] == 1 and b["parallel"]["workers"] == 2 and b["saved_ms"] == b["sequential"]["ms"] - b["parallel"]["ms"]
    assert set(b["parallel"]["tasks"]) == {"site", "site_keywords", "seeds", "pick"}
    assert main.store().db["engine_cache"].count_documents({}) == 0     # cache off: both runs did the real work
