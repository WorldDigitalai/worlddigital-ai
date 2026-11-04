"""RAG: indexing (both sites + customers), retrieval, isolation, cited answers, chat logging, evaluation.
Sites, customer sites, OpenAI and Atlas are mocked."""
import hashlib
import json
import math

import httpx
import mongomock
import pytest
import respx
from fastapi.testclient import TestClient

from app import main, rag as rag_mod, services
from app.store import Store

TOKEN = "t"
H = {"x-internal-token": TOKEN}
AI = {
    "/": "# WorldDigital.ai\n\nSoftware company for SEO and AI search.\n\n## Products\n\nFree SEO report and keyword research.",
    "/tools": "# Products\n\n## Keyword research\n\nTop 3 keywords free, all 10 keywords for $9.99 one time.\n\n## Content pack\n\nFive ads or posts for $24.99.\n\n## Same footer\n\nShared text that appears on two pages, like a footer band with our hours and contact details.",
    "/ehr-emr-integration": "# EHR integration\n\n## Epic\n\nWe build Epic FHIR integrations and SMART on FHIR apps for clinics.\n\n## Try our SEO tools, no sign-up\n\nInstant results from real Google data.\n\n## Same footer\n\nShared text that appears on two pages, like a footer band with our hours and contact details.",
}
US = {"/": "<html><title>Ahmad Awwad</title><body><nav>menu</nav><main><h1>Ahmad Awwad</h1><p>Digital marketing strategist in Houston and Murfreesboro.</p></main><footer>foot</footer></body></html>"}
CUST = {"/": "<html><title>Bayou Dental</title><main><h1>Bayou Dental</h1><p>Teeth whitening costs $299 at Bayou Dental in Houston.</p></main></html>"}


def vec(text: str) -> list[float]:
    v = [0.0] * rag_mod.DIMS
    for w in text.lower().replace("$", " ").split():
        w = "".join(c for c in w if c.isalnum())
        if w:
            v[int(hashlib.md5(w.encode()).hexdigest(), 16) % rag_mod.DIMS] += 1
    n = math.sqrt(sum(x * x for x in v)) or 1
    return [x / n for x in v]


class World:
    def __init__(self):
        self.ai, self.us = dict(AI), dict(US)
        self.embeds = 0
        self.prompts = []

    def sitemap(self, pages, host):
        def f(req):
            locs = "".join(f"<url><loc>https://{host}{p}</loc></url>" for p in pages)
            return httpx.Response(200, text=f"<urlset>{locs}<url><loc>https://{host}/media/x.png</loc></url></urlset>")
        return f

    def page(self, pages, full):
        def f(req):
            p = req.url.path
            if p == "/llms-full.txt":
                return httpx.Response(200, text=full)
            return httpx.Response(200, text=pages[p], headers={"content-type": "text/html"}) if p in pages else httpx.Response(404)
        return f

    def embed(self, req):
        inp = json.loads(req.content)["input"]
        self.embeds += len(inp)
        return httpx.Response(200, json={"data": [{"index": i, "embedding": vec(t)} for i, t in enumerate(inp)]})

    def chat(self, req):
        b = json.loads(req.content)
        sysmsg, user = b["messages"][0]["content"], b["messages"][1]["content"]
        self.prompts.append(sysmsg + user)
        if "numbered sources" in sysmsg:
            if "Bayou" in sysmsg:
                out = {"answer": "Teeth whitening is $299 [1].", "used": [1], "covered": True}
            elif "9.99" in user:
                out = {"answer": "All 10 keywords cost $9.99; 3 are free [1].", "used": [1], "covered": True}
            else:
                out = {"answer": "I don't know.", "used": [], "covered": False}
        else:
            out = {"reply": "All 10 keywords are $9.99: /tools", "covered": "retrieved for this question" in sysmsg}
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(out)}}]})


@pytest.fixture
def env(monkeypatch):
    monkeypatch.setenv("TOOLS_API_TOKEN", TOKEN)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    main.settings.cache_clear()
    main.set_store(Store(mongomock.MongoClient()["t"]))
    w = World()
    # customer sites are fetched through the SSRF-safe fetcher; stand it in for the mock customer
    monkeypatch.setattr(rag_mod, "_fetch_page", lambda url: httpx.Response(200, text=CUST.get(httpx.URL(url).path, ""), headers={"content-type": "text/html"})
                        if httpx.URL(url).path in CUST else httpx.Response(404, headers={"content-type": "text/html"}))
    with respx.mock(assert_all_called=False) as r:
        r.get("https://worlddigital.ai/sitemap.xml").mock(side_effect=w.sitemap(w.ai, "worlddigital.ai"))
        r.get("https://worlddigital.us/sitemap.xml").mock(side_effect=w.sitemap(w.us, "worlddigital.us"))
        r.get("https://bayoudental.com/sitemap.xml").mock(side_effect=w.sitemap(CUST, "bayoudental.com"))
        r.get(url__regex=r"https://worlddigital\.ai/.*").mock(side_effect=w.page(w.ai, "# WorldDigital.ai\n\nHubs in Houston, TX and Murfreesboro, TN."))
        r.get(url__regex=r"https://worlddigital\.us/.*").mock(side_effect=w.page(w.us, "# Ahmad\n\nPersonal consulting site."))
        r.post("https://api.openai.com/v1/embeddings").mock(side_effect=w.embed)
        r.post("https://api.openai.com/v1/chat/completions").mock(side_effect=w.chat)
        yield TestClient(main.app), w
    main.settings.cache_clear()


def db():
    return main.store().db


def test_index_is_incremental_and_prunes(env):
    c, w = env
    s1 = c.post("/api/admin/rag/index", headers=H, json={"source": "ai"}).json()
    assert s1["pages"] == 4 and s1["updated"] == 4 and not s1["errors"], s1
    first = w.embeds
    s2 = c.post("/api/admin/rag/index", headers=H, json={"source": "ai"}).json()
    assert s2["unchanged"] == 4 and w.embeds == first
    del w.ai["/ehr-emr-integration"]
    w.ai["/about"] = "# About\n\nFounded by Ahmad Awwad."
    s3 = c.post("/api/admin/rag/index", headers=H, json={"source": "ai"}).json()
    assert s3["removed"] == 1 and s3["updated"] == 1
    assert c.get("/api/admin/rag", headers=H).json()["sites"]["ai"]["pages"] == 4


def test_boilerplate_and_duplicates_skipped(env):
    c, _ = env
    c.post("/api/admin/rag/index", headers=H, json={"source": "ai"})
    texts = [d["text"] for d in db()["rag_chunks"].find({}, {"text": 1})]
    assert not any("Try our SEO tools" in t for t in texts)
    assert sum("Shared text that appears on two pages" in t for t in texts) == 1


def test_us_site_is_not_indexed(env):
    c, _ = env
    assert c.post("/api/admin/rag/index", headers=H, json={"source": "us"}).status_code == 400
    assert c.post("/api/admin/rag/index-url", headers=H, json={"url": "https://worlddigital.us/"}).status_code == 400
    assert "us" not in c.get("/api/admin/rag", headers=H).json()["sites"]


def test_index_one_url_and_removal(env):
    c, w = env
    c.post("/api/admin/rag/index", headers=H, json={"source": "ai"})
    w.ai["/blog/new-post"] = "# New post\n\n## Hello\n\nA fresh post about local SEO checklists for dentists."
    r = c.post("/api/admin/rag/index-url", headers=H, json={"url": "https://worlddigital.ai/blog/new-post"}).json()
    assert r["updated"] == 1 and r["chunks"] >= 1
    assert db()["rag_chunks"].count_documents({"url": "https://worlddigital.ai/blog/new-post"}) >= 1
    del w.ai["/blog/new-post"]
    r = c.post("/api/admin/rag/index-url", headers=H, json={"url": "https://worlddigital.ai/blog/new-post"}).json()
    assert r["removed"] == 1 and db()["rag_chunks"].count_documents({"url": "https://worlddigital.ai/blog/new-post"}) == 0
    assert c.post("/api/admin/rag/index-url", headers=H, json={"url": "https://evil.example/x"}).status_code == 400


def test_search_and_cited_answer(env):
    c, _ = env
    c.post("/api/admin/rag/index", headers=H, json={"source": "ai"})
    hits = c.post("/api/admin/rag/search", headers=H, json={"q": "Epic FHIR integration for clinics", "k": 3}).json()["hits"]
    assert hits[0]["url"].endswith("/ehr-emr-integration")
    a = c.post("/api/admin/rag/ask", headers=H, json={"q": "How much is keyword research? 9.99"}).json()
    assert "$9.99" in a["answer"] and a["sources"][0]["url"].startswith("https://worlddigital.ai") and a["passages"]


def test_chat_is_grounded_logged_and_survives_empty_index(env):
    c, w = env
    q = {"messages": [{"role": "user", "content": "How much is keyword research?"}]}
    assert c.post("/api/tools/chat", headers=H, json=q).status_code == 200  # empty knowledge base: still answers
    c.post("/api/admin/rag/index", headers=H, json={"source": "ai"})
    c.post("/api/tools/chat", headers=H, json=q)
    assert "retrieved for this question" in w.prompts[-1] and "9.99" in w.prompts[-1]
    rep = c.get("/api/admin/rag/questions", headers=H).json()
    assert rep["total"] == 2 and rep["uncovered"] == 1 and rep["questions"][0]["q"] == "How much is keyword research?"
    assert "ip" not in json.dumps(rep["questions"]).lower().replace("ship", "")


def test_customer_knowledge_base_is_isolated(env):
    c, _ = env
    c.post("/api/admin/rag/index", headers=H, json={"source": "ai"})
    t = c.post("/api/admin/rag/tenants", headers=H, json={"action": "create", "name": "Bayou Dental", "website": "bayoudental.com"}).json()
    tid = t["id"]
    s = c.post("/api/admin/rag/tenants", headers=H, json={"action": "index-site", "tenant": tid}).json()
    assert s["pages"] == 1 and s["chunks"] >= 1
    d = c.post("/api/admin/rag/tenants", headers=H, json={"action": "add-doc", "tenant": tid, "title": "Price list",
                                                          "text": "Cleaning is $99. Implants start at $2,500. Open Saturdays."}).json()
    assert d["updated"] == 1
    a = c.post("/api/admin/rag/tenants", headers=H, json={"action": "ask", "tenant": tid, "q": "teeth whitening price"}).json()
    assert "$299" in a["answer"] and all("bayoudental.com" in s["url"] or s["url"].startswith("doc:") for s in a["sources"])
    # our sites never see customer data, and a customer search never sees ours
    ai_hits = c.post("/api/admin/rag/search", headers=H, json={"q": "teeth whitening Bayou Dental", "sources": ["ai"]}).json()["hits"]
    assert all(h["source"] == "ai" for h in ai_hits)
    t_hits = c.post("/api/admin/rag/search", headers=H, json={"q": "keyword research price", "sources": [f"tenant:{tid}"]}).json()["hits"]
    assert all(h["source"] == f"tenant:{tid}" for h in t_hits)
    assert c.post("/api/admin/rag/search", headers=H, json={"q": "x", "sources": ["ai", f"tenant:{tid}"]}).status_code == 400
    assert c.post("/api/admin/rag/search", headers=H, json={"q": "x", "sources": ["tenant:nope"]}).status_code == 404
    lst = c.post("/api/admin/rag/tenants", headers=H, json={"action": "list"}).json()["tenants"]
    assert lst[0]["pages"] == 1 and lst[0]["docs"] == 1
    c.post("/api/admin/rag/tenants", headers=H, json={"action": "delete", "tenant": tid})
    assert db()["rag_chunks"].count_documents({"source": f"tenant:{tid}"}) == 0


def test_evaluation_reports_passes_and_failures(env, monkeypatch, tmp_path):
    c, _ = env
    c.post("/api/admin/rag/index", headers=H, json={"source": "ai"})
    f = tmp_path / "eval.json"
    f.write_text(json.dumps([{"q": "keyword research 9.99", "expect": ["9.99"], "source": "worlddigital.ai"},
                             {"q": "Do you sell boats?", "expect": ["boats"]}]))
    monkeypatch.setattr(rag_mod, "EVAL_FILE", f)
    r = c.post("/api/admin/rag/eval", headers=H).json()
    assert r["total"] == 2 and r["passed"] == 1 and r["score"] == 50
    assert c.get("/api/admin/rag", headers=H).json()["eval"]["score"] == 50


def test_admin_endpoints_need_token(env):
    c, _ = env
    for path in ("/api/admin/rag/index", "/api/admin/rag/ask", "/api/admin/rag/tenants", "/api/admin/rag/eval"):
        assert c.post(path, json={}).status_code in (401, 403)


def test_chunking_and_html():
    parts = rag_mod.chunk("# T\n\n## A\n\n" + ("word " * 1200) + "\n\n## B\n\nshort")
    assert len(parts) >= 3 and any(p.startswith("## A") for p in parts[1:])
    md = rag_mod.html_to_md("<title>X</title><main><h2>Price</h2><p>$5 &amp; up</p><script>bad()</script></main>", "https://x.com/")
    assert "## Price" in md and "$5 & up" in md and "bad()" not in md


def test_redact_contact_details():
    r = rag_mod.redact("Call me at (615) 555-0142 or +1 713 555 0199, mail ana@shop.com. Plan is $199.99 for 2026")
    assert "555" not in r and "ana@" not in r and r.count("[phone]") == 2 and "[email]" in r and "$199.99" in r and "2026" in r
