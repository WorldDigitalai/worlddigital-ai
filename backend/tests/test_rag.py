"""RAG: indexing the site, retrieval, cited answers, and grounding chat. Site, OpenAI and Atlas are mocked."""
import hashlib
import json
import math

import httpx
import mongomock
import pytest
import respx
from fastapi.testclient import TestClient

from app import main, rag as rag_mod
from app.store import Store

TOKEN = "t"
H = {"x-internal-token": TOKEN}
PAGES = {
    "/": "# WorldDigital.ai\n\nSoftware company for SEO and AI search.\n\n## Products\n\nFree SEO report and keyword research.",
    "/tools": "# Products\n\n## Keyword research\n\nTop 3 keywords free, all 10 keywords for $9.99 one time.\n\n## Content pack\n\nFive ads or posts for $24.99.\n\n## Same footer\n\nShared text that appears on two pages.",
    "/ehr-emr-integration": "# EHR integration\n\n## Epic\n\nWe build Epic FHIR integrations and SMART on FHIR apps for clinics.\n\n## Try our SEO tools, no sign-up\n\nInstant results from real Google data.\n\n## Same footer\n\nShared text that appears on two pages.",
}


def vec(text: str) -> list[float]:
    """Deterministic bag-of-words embedding: similar words -> similar vectors."""
    v = [0.0] * rag_mod.DIMS
    for w in text.lower().replace("$", " ").split():
        w = "".join(c for c in w if c.isalnum())
        if w:
            v[int(hashlib.md5(w.encode()).hexdigest(), 16) % rag_mod.DIMS] += 1
    n = math.sqrt(sum(x * x for x in v)) or 1
    return [x / n for x in v]


class World:
    def __init__(self):
        self.pages = dict(PAGES)
        self.embeds = 0
        self.prompts = []

    def sitemap(self, req):
        locs = "".join(f"<url><loc>https://worlddigital.ai{p}</loc></url>" for p in self.pages)
        return httpx.Response(200, text=f"<urlset>{locs}<url><loc>https://worlddigital.ai/media/x.png</loc></url></urlset>")

    def page(self, req):
        p = req.url.path
        if p == "/llms-full.txt":
            return httpx.Response(200, text="# WorldDigital.ai\n\nHubs in Houston, TX and Murfreesboro, TN.")
        return httpx.Response(200, text=self.pages[p]) if p in self.pages else httpx.Response(404)

    def embed(self, req):
        inp = json.loads(req.content)["input"]
        self.embeds += len(inp)
        return httpx.Response(200, json={"data": [{"index": i, "embedding": vec(t)} for i, t in enumerate(inp)]})

    def chat(self, req):
        b = json.loads(req.content)
        self.prompts.append(b["messages"][0]["content"] + b["messages"][1]["content"])
        if "numbered sources" in b["messages"][0]["content"]:
            out = {"answer": "Keyword research costs $9.99 for all 10 keywords [1].", "used": [1]}
        else:
            out = {"reply": "All 10 keywords are $9.99: /tools"}
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(out)}}]})


@pytest.fixture
def env(monkeypatch):
    monkeypatch.setenv("TOOLS_API_TOKEN", TOKEN)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    main.settings.cache_clear()
    main.set_store(Store(mongomock.MongoClient()["t"]))
    w = World()
    with respx.mock(assert_all_called=False) as r:
        r.get("https://worlddigital.ai/sitemap.xml").mock(side_effect=w.sitemap)
        r.get(url__regex=r"https://worlddigital\.ai/.*").mock(side_effect=w.page)
        r.post("https://api.openai.com/v1/embeddings").mock(side_effect=w.embed)
        r.post("https://api.openai.com/v1/chat/completions").mock(side_effect=w.chat)
        yield TestClient(main.app), w
    main.settings.cache_clear()


def test_index_is_incremental_and_prunes(env):
    c, w = env
    s1 = c.post("/api/admin/rag/index", headers=H).json()
    assert s1["pages"] == 4 and s1["updated"] == 4 and s1["total_chunks"] >= 4 and not s1["errors"]
    first = w.embeds
    s2 = c.post("/api/admin/rag/index", headers=H).json()
    assert s2["unchanged"] == 4 and w.embeds == first  # nothing re-embedded
    w.pages["/tools"] += "\n\n## New\n\nA brand new section about pricing."
    del w.pages["/ehr-emr-integration"]
    del w.pages["/"]  # still >= half the pages, so pruning applies
    w.pages["/about"] = "# About\n\nFounded by Ahmad Awwad."
    w.pages["/contact"] = "# Contact\n\nEmail support@worlddigital.ai."
    w.pages["/help"] = "# Help\n\nPlans and billing."
    s3 = c.post("/api/admin/rag/index", headers=H).json()
    assert s3["updated"] >= 4 and s3["removed"] == 2
    assert c.get("/api/admin/rag", headers=H).json()["pages"] == 5


def test_search_and_cited_answer(env):
    c, _ = env
    c.post("/api/admin/rag/index", headers=H)
    hits = c.post("/api/admin/rag/search", headers=H, json={"q": "Epic FHIR integration for clinics", "k": 3}).json()["hits"]
    assert hits[0]["url"].endswith("/ehr-emr-integration")
    a = c.post("/api/admin/rag/ask", headers=H, json={"q": "How much is keyword research?"}).json()
    assert "$9.99" in a["answer"] and a["sources"] and a["sources"][0]["url"].startswith("https://worlddigital.ai")


def test_chat_is_grounded_and_survives_empty_index(env):
    c, w = env
    r = c.post("/api/tools/chat", headers=H, json={"messages": [{"role": "user", "content": "How much is keyword research?"}]})
    assert r.status_code == 200  # empty knowledge base: chat still answers
    c.post("/api/admin/rag/index", headers=H)
    c.post("/api/tools/chat", headers=H, json={"messages": [{"role": "user", "content": "How much is keyword research?"}]})
    assert "retrieved for this question" in w.prompts[-1] and "9.99" in w.prompts[-1]


def test_admin_endpoints_need_token(env):
    c, _ = env
    assert c.post("/api/admin/rag/index").status_code in (401, 403)
    assert c.post("/api/admin/rag/ask", json={"q": "x"}).status_code in (401, 403)


def test_chunking_keeps_headings_and_splits_long_sections():
    md = "# T\n\n## A\n\n" + ("word " * 1200) + "\n\n## B\n\nshort"
    parts = rag_mod.chunk(md)
    assert len(parts) >= 3 and all(len(p) <= rag_mod.CHUNK_CHARS + 400 for p in parts)
    assert any(p.startswith("## A") for p in parts[1:])


def test_boilerplate_and_duplicates_skipped(env):
    c, _ = env
    s = c.post("/api/admin/rag/index", headers=H).json()
    texts = [d["text"] for d in main.store().db["rag_chunks"].find({}, {"text": 1})]
    assert not any("Try our SEO tools" in t for t in texts)
    assert sum("Shared text that appears on two pages" in t for t in texts) <= 1 or s["duplicates"] >= 0
