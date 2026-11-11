"""Competitor analysis as a WD-IEE plan: computed gaps, validated AI output, missing sources, reuse and limits.
DataForSEO, OpenAI and the websites are mocked."""
import json

import httpx
import mongomock
import pytest
import respx

from app import competitor, main
from app.store import Store

H = {"x-internal-token": "secret-token"}
PAGE = "<html><head><title>{t}</title><meta name='description' content='Plumbers in Houston'></head><body><h1>{t}</h1><p>We fix leaks.</p></body></html>"
RANKED = {
    "you.com": [("plumber houston", 5000, 4), ("water heater repair", 3000, 35), ("leak repair", 900, 8)],
    "rival-a.com": [("plumber houston", 5000, 2), ("water heater repair", 3000, 5), ("drain cleaning houston", 2000, 3), ("far keyword", 800, 60)],
    "rival-b.com": [("drain cleaning houston", 2000, 9), ("emergency plumber", 4000, 1), ("leak repair", 900, 3)],
}


class World:
    def __init__(self):
        self.calls, self.ai, self.fail, self.ai_out = [], [], set(), None

    def dfs(self, request):
        target = json.loads(request.content)[0]["target"]
        kind = "rank" if "domain_rank_overview" in str(request.url) else "keywords" if "ranked_keywords" in str(request.url) else "links"
        self.calls.append((kind, target))
        if (kind, target) in self.fail or kind in self.fail:
            return httpx.Response(200, json={"tasks": [{"status_code": 40501, "status_message": "not available"}]})
        if kind == "rank":
            result = [{"items": [{"metrics": {"organic": {"count": 120, "etv": 950.4, "pos_1": 2, "pos_2_3": 5, "pos_4_10": 20}}}]}]
        elif kind == "keywords":
            result = [{"items": [{"keyword_data": {"keyword": k, "keyword_info": {"search_volume": v}},
                                  "ranked_serp_element": {"serp_item": {"rank_absolute": p}}} for k, v, p in RANKED.get(target, [])]}]
        else:
            result = [{"referring_main_domains": 42, "backlinks": 310, "rank": 180}]
        return httpx.Response(200, json={"tasks": [{"status_code": 20000, "result": result}]})

    def chat(self, request):
        self.ai.append(json.loads(request.content)["messages"][1]["content"])
        out = self.ai_out or {"summary": "You trail on drain cleaning.", "actions": [
            {"do": "Build a drain cleaning page for Houston.", "gap": 1}, {"do": "Ask customers for reviews.", "gap": None},
            {"do": "Target a keyword that is not in the list.", "gap": 99}, {"do": "   "}, "junk"]}
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(out)}}], "usage": {"prompt_tokens": 500, "completion_tokens": 80}})


@pytest.fixture
def world(monkeypatch):
    for k, v in {"OPENAI_API_KEY": "t", "OPENAI_BASE": "https://openai.test", "DATAFORSEO_LOGIN": "t", "DATAFORSEO_PASSWORD": "t",
                 "DATAFORSEO_BASE": "https://dfs.test", "TEST_SITE_BASE": "https://site.test", "INTERNAL_TOKEN": "secret-token",
                 "COMPETITOR_DAILY_LIMIT": "3"}.items():
        monkeypatch.setenv(k, v)
    monkeypatch.delenv("AI_ROUTES", raising=False)
    main.settings.cache_clear()
    st = Store(mongomock.MongoClient()["test"])
    st.ensure_indexes()
    main.set_store(st)
    w = World()
    with respx.mock(assert_all_called=False) as r:
        r.post(url__regex=r"https://dfs\.test/.*").mock(side_effect=w.dfs)
        r.post("https://openai.test/v1/chat/completions").mock(side_effect=w.chat)
        r.get(url__regex=r"https://site\.test/.*").mock(side_effect=lambda req: httpx.Response(
            200, text=PAGE.format(t=req.url.params["u"]), headers={"content-type": "text/html"}))
        from fastapi.testclient import TestClient
        yield TestClient(main.app, headers=H), w
    main.set_store(None)
    main.settings.cache_clear()


def test_plans_are_built_and_checked_for_every_size():
    assert sorted(competitor.PLANS) == [2, 3, 4]
    p = competitor.PLANS[3]
    assert len(p.levels[0]) == 12 and p.levels[1:] == [["technical", "gaps"], ["insights"], ["report"]]   # 4 lookups x 3 sites at once


def test_full_analysis_gaps_are_computed_and_ai_output_is_validated(world):
    c, w = world
    r = c.post("/api/admin/competitors", json={"domain": "https://www.you.com/", "competitors": ["rival-a.com", "rival-b.com", "you.com"]})
    assert r.status_code == 200, r.text
    out = r.json()
    assert [s["site"] for s in out["sites"]] == ["you.com", "rival-a.com", "rival-b.com"] and out["sites"][0]["you"]
    assert out["sites"][0]["visibility"] == {"keywords": 120, "visits": 950, "top3": 7, "top10": 27}
    assert out["sites"][1]["backlinks"] == {"referring_domains": 42, "backlinks": 310, "rank": 180}
    gaps = {g["keyword"]: g for g in out["gaps"]}
    # emergency plumber: only rival-b ranks. water heater repair: you are at 35, rival-a at 5. drain cleaning: both rivals.
    assert list(gaps) == ["emergency plumber", "water heater repair", "drain cleaning houston"]
    assert gaps["water heater repair"]["your_position"] == 35 and gaps["emergency plumber"]["your_position"] is None
    assert [x["site"] for x in gaps["drain cleaning houston"]["competitors"]] == ["rival-a.com", "rival-b.com"]
    assert "plumber houston" not in gaps and "leak repair" not in gaps and "far keyword" not in gaps   # you rank / rival below 20
    # AI output: the bad index is dropped to no keyword, empty and junk actions are removed
    assert out["actions"] == [{"do": "Build a drain cleaning page for Houston.", "keyword": "water heater repair"},
                              {"do": "Ask customers for reviews.", "keyword": None},
                              {"do": "Target a keyword that is not in the list.", "keyword": None}]
    assert out["unavailable"] == [] and out["technical"][0]["readable"] and out["technical"][0]["has_description"]
    assert len(w.calls) == 9 and len(w.ai) == 1 and "emergency plumber" in w.ai[0]
    assert out["run"]["ms"] >= 0
    run = main.store().db["engine_runs"].find_one()
    assert run["plan"] == "competitors-2" and len(run["tasks"]) == 16 and "rival" not in str(run)


def test_lookups_are_reused_for_a_day_and_runs_are_capped(world):
    c, w = world
    body = {"domain": "you.com", "competitors": ["rival-a.com"]}
    assert c.post("/api/admin/competitors", json=body).status_code == 200
    assert len(w.calls) == 6
    assert c.post("/api/admin/competitors", json={"domain": "you.com", "competitors": ["rival-b.com"]}).status_code == 200
    assert len(w.calls) == 9                                    # you.com reused; only the new competitor is looked up
    assert c.post("/api/admin/competitors", json=body).status_code == 200 and len(w.calls) == 9
    r = c.post("/api/admin/competitors", json=body)             # 4th run today with a limit of 3
    assert r.status_code == 429 and len(w.calls) == 9
    m = c.get("/api/admin/meter?days=1").json()
    assert m["paths"]["tool_competitors"]["n"] == 3 and m["engine"]["competitors-1"]["tasks"]["rank:0"]["cached"] == 2


def test_a_missing_source_is_reported_not_fatal_and_never_cached(world):
    c, w = world
    w.fail = {"links", ("keywords", "rival-a.com")}
    w.ai_out = {"summary": "ok", "actions": []}
    out = c.post("/api/admin/competitors", json={"domain": "you.com", "competitors": ["rival-a.com"]}).json()
    assert out["unavailable"] == ["backlinks for you.com", "keywords for rival-a.com", "backlinks for rival-a.com"]
    assert out["sites"][0]["backlinks"] is None and out["gaps"] == [] and out["sites"][0]["visibility"]["keywords"] == 120
    w.fail = set()
    n = len(w.calls)
    out = c.post("/api/admin/competitors", json={"domain": "you.com", "competitors": ["rival-a.com"]}).json()
    assert out["unavailable"] == [] and len(w.calls) == n + 3   # only the three failed lookups are asked again


def test_ai_failure_still_returns_the_data_and_no_data_is_an_honest_error(world):
    c, w = world
    w.ai_out = "not an object"
    out = c.post("/api/admin/competitors", json={"domain": "you.com", "competitors": ["rival-a.com"]}).json()
    assert out["gaps"] and out["actions"] == [] and out["summary"] == "" and out["unavailable"] == ["written summary"]
    w.fail = {"rank", "keywords", "links"}
    r = c.post("/api/admin/competitors", json={"domain": "nodata.com", "competitors": ["nodata2.com"]})
    assert r.status_code == 422 and "couldn't get search data" in r.json()["error"]


def test_input_rules_and_guard(world):
    c, w = world
    from fastapi.testclient import TestClient
    assert TestClient(main.app).post("/api/admin/competitors", json={"domain": "you.com", "competitors": ["a.com"]}).status_code == 403
    assert c.post("/api/admin/competitors", json={"domain": "you.com", "competitors": []}).status_code == 400
    assert c.post("/api/admin/competitors", json={"domain": "you.com", "competitors": ["you.com"]}).status_code == 400
    assert c.post("/api/admin/competitors", json={"domain": "localhost", "competitors": ["a.com"]}).status_code == 400
    assert w.calls == []
