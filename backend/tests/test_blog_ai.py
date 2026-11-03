"""Blog editor AI assistant: research (Trends + keywords + SERP + ideas) and full drafts. Mocked, no network."""
import json

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app import blog_ai, main

TRENDS_GRAPH = {"tasks": [{"status_code": 20000, "result": [{"items": [{
    "type": "google_trends_graph", "keywords": ["ai seo", "local seo"],
    "data": [{"date_from": f"2026-08-{d:02d}", "values": [20 + d, 50], "missing_data": False} for d in range(1, 29)]
    + [{"date_from": "2026-10-30", "values": [0, 0], "missing_data": True}],
    "averages": [34, 50]}]}]}]}
TRENDS_Q = {"tasks": [{"status_code": 20000, "result": [{"items": [{
    "type": "google_trends_queries_list",
    "data": {"rising": [{"query": "AI SEO tools", "value": "350"}], "top": [{"query": "ai seo", "value": "100"}]}}]}]}]}


def kfk(i):
    months = [{"year": 2026, "month": m, "search_volume": 100 if m <= 6 else 200} for m in range(4, 10)]
    return {"keyword": f"ai seo idea {i}", "search_volume": 1000 - i * 10, "cpc": 4.5, "competition": "LOW",
            "monthly_searches": months}


SERP = {"tasks": [{"status_code": 20000, "result": [{"items": [
    {"type": "ai_overview", "items": [{"text": "AI SEO means optimizing for AI answers.",
                                       "references": [{"domain": "hubspot.com", "title": "AI SEO", "url": "https://hubspot.com/x"}]}]},
    {"type": "organic", "rank_group": 1, "domain": "semrush.com", "title": "What is AI SEO", "url": "https://semrush.com/a",
     "description": "AI SEO guide"},
    {"type": "people_also_ask", "items": [{"type": "people_also_ask_element", "title": "Is AI SEO worth it?"}]},
    {"type": "related_searches", "items": ["ai seo tools free"]},
]}]}]}


class Calls:
    def __init__(self):
        self.prompts, self.dfs = [], []

    def chat(self, request):
        user = json.loads(request.content)["messages"][1]["content"]
        self.prompts.append(user)
        if "Suggest 12 blog posts" in user:
            out = {"ideas": [{"title": "WorldDigital.ai vs HubSpot vs Fiverr for small business SEO", "keyword": "hubspot vs fiverr",
                              "type": "vs", "competitors": ["HubSpot", "Fiverr"], "why": "Rising +350%", "score": 92},
                             {"title": "What is AI SEO?", "keyword": "ai seo", "type": "what-is", "why": "AI Overview shown", "score": 80},
                             {"title": "bad", "type": "nonsense", "score": 10}],
                   "competitors": [{"name": "HubSpot", "offers": "All-in-one CRM and marketing"}], "notes": ["Answer first."]}
        else:
            out = {"title": "WorldDigital.ai vs HubSpot vs Fiverr", "seo_title": "HubSpot vs Fiverr vs WorldDigital.ai",
                   "description": "d" * 150, "excerpt": "Which one fits a small business.", "category": "Comparisons",
                   "image_idea": "Three laptops", "body": "# Should be removed\n\nShort answer first.\n\n" + "## Section\n\nText. " * 80}
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(out)}}]})

    def dfs_route(self, request):
        self.dfs.append((request.url.path, json.loads(request.content)[0]))
        p, task = request.url.path, json.loads(request.content)[0]
        if p.endswith("google_trends/explore/live"):
            return httpx.Response(200, json=TRENDS_Q if task["item_types"] == ["google_trends_queries_list"] else TRENDS_GRAPH)
        if p.endswith("keywords_for_keywords/live"):
            return httpx.Response(200, json={"tasks": [{"status_code": 20000, "result": [kfk(i) for i in range(30)]}]})
        if p.endswith("organic/live/advanced"):
            return httpx.Response(200, json=SERP)
        return httpx.Response(404)


@pytest.fixture
def client(monkeypatch):
    for k, v in {"OPENAI_API_KEY": "t", "OPENAI_BASE": "https://openai.test", "DATAFORSEO_LOGIN": "t",
                 "DATAFORSEO_PASSWORD": "t", "DATAFORSEO_BASE": "https://dfs.test", "INTERNAL_TOKEN": "secret-token"}.items():
        monkeypatch.setenv(k, v)
    main.settings.cache_clear()
    c = Calls()
    with respx.mock(assert_all_called=False) as r:
        r.post("https://openai.test/v1/chat/completions").mock(side_effect=c.chat)
        r.post(url__regex=r"https://dfs\.test/.*").mock(side_effect=c.dfs_route)
        yield TestClient(main.app, headers={"x-internal-token": "secret-token"}), c


def test_research_combines_trends_keywords_serp_and_ideas(client):
    c, calls = client
    r = c.post("/api/admin/blog/research", json={"topic": "AI SEO!", "country": "us", "competitors": ["HubSpot", 5]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["topic"] == "ai seo" and d["market"] == "United States"
    graph = [t for p, t in calls.dfs if p.endswith("explore/live") and t["item_types"] == ["google_trends_graph"]][0]
    assert graph["time_range"] == "past_90_days" and len(graph["keywords"]) <= 5
    assert d["trend"]["change"][0] > 0 and d["trend"]["change"][1] == 0 and len(d["trend"]["points"]) == 28
    assert d["rising"][0] == {"query": "ai seo tools", "value": "350"}
    assert d["keywords"][0]["trend"] == 100 and len(d["keywords"]) == 25
    assert d["serp"]["questions"] == ["Is AI SEO worth it?"]
    assert d["serp"]["ai_overview"]["present"] and d["serp"]["ai_overview"]["sources"][0]["domain"] == "hubspot.com"
    assert d["ideas"][0]["type"] == "vs" and d["ideas"][0]["competitors"] == ["HubSpot", "Fiverr"]
    assert all(i["type"] in blog_ai.POST_TYPES for i in d["ideas"])
    assert "comparisons with: HubSpot" in calls.prompts[0] and "+350%" in calls.prompts[0]
    assert d["unavailable"] == []


def test_research_survives_one_source_failing(client, monkeypatch):
    c, _ = client

    def serp(*a):
        raise blog_ai.ApiError("DataForSEO task error: 40200 Payment required", 502)
    monkeypatch.setattr(blog_ai, "serp", serp)
    d = c.post("/api/admin/blog/research", json={}).json()
    assert d["unavailable"] == ["serp"] and d["ideas"] and d["topic"] == ""
    assert d["trend"]["keywords"]  # default seeds still researched


def test_draft_returns_full_post_fields(client):
    c, calls = client
    r = c.post("/api/admin/blog/draft", json={"title": "WorldDigital.ai vs HubSpot vs Fiverr", "type": "vs",
                                               "competitors": ["HubSpot", "Fiverr"], "keyword": "hubspot vs fiverr"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["slug"] == "worlddigital-ai-vs-hubspot-vs-fiverr" and d["category"] == "Comparisons"
    assert not d["body"].startswith("# ") and len(d["body"]) > 400
    assert d["sources"][0]["domain"] == "semrush.com"
    prompt = calls.prompts[-1]
    assert "comparison table" in prompt and "HubSpot, Fiverr" in prompt and "Is AI SEO worth it?" in prompt
    assert c.post("/api/admin/blog/draft", json={"title": " "}).status_code == 400


def test_admin_blog_requires_token(client):
    c, _ = client
    assert c.post("/api/admin/blog/research", json={}, headers={"x-internal-token": "nope"}).status_code == 403


def test_social_captions_per_platform(client, monkeypatch):
    c, calls = client
    texts = {"linkedin": "Big news https://evil.test", "facebook": "FB", "instagram": "IG Link in bio. #seo",
             "x": "x" * 400, "google": "GBP update", "tiktok": "TT"}
    monkeypatch.setattr(blog_ai, "openai_json", lambda *a, **k: texts)
    r = c.post("/api/admin/blog/social", json={"title": "AI SEO", "url": "https://worlddigital.ai/blog/ai-seo"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert "evil.test" not in d["linkedin"] and d["linkedin"].endswith("https://worlddigital.ai/blog/ai-seo")
    assert len(d["x"].rsplit(" ", 1)[0]) <= 250 and d["x"].endswith("https://worlddigital.ai/blog/ai-seo")
    assert "https://" not in d["instagram"] and "https://" not in d["google"]
    assert c.post("/api/admin/blog/social", json={"title": "x", "url": "javascript:1"}).status_code == 400


def test_cover_image_falls_back_between_models(client):
    c, _ = client
    seen = []

    def img(request):
        body = json.loads(request.content)
        seen.append(body["model"])
        if body["model"] == "gpt-image-1.5":
            return httpx.Response(404, json={"error": {"message": "The model gpt-image-1.5 does not exist"}})
        assert body["output_format"] == "jpeg" and "no text" in body["prompt"].lower()
        return httpx.Response(200, json={"data": [{"b64_json": "QUJD"}]})
    with respx.mock(assert_all_called=False) as r:
        r.post("https://openai.test/v1/images/generations").mock(side_effect=img)
        d = c.post("/api/admin/blog/image", json={"title": "HubSpot vs Fiverr"}).json()
    assert d["b64"] == "QUJD" and d["type"] == "image/jpeg" and seen == ["gpt-image-1.5", "gpt-image-1"]
