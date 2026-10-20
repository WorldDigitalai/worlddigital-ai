"""End-to-end tests: FastAPI + in-memory MongoDB (mongomock) + mocked OpenAI, DataForSEO, Stripe, Resend.
No network needed."""
import io
import json
import re
from urllib.parse import parse_qs

import httpx
import mongomock
import pytest
import respx
from docx import Document
from fastapi.testclient import TestClient
from openpyxl import load_workbook

from app import main
from app.store import Store

CUSTOMER = """<!doctype html><html><head><title>Bayou City Plumbing | 24/7 Plumber in Houston</title>
<meta name="description" content="Licensed Houston plumbers for leaks, water heaters and drain cleaning."></head>
<body><nav>Home</nav><h1>Houston's trusted plumbers</h1><h2>Water heater repair</h2>
<p>Family-owned since 2009. We fix leaks and clear drains across Houston.</p><footer>x</footer></body></html>"""


def kw(keyword, i):
    return {"keyword": keyword, "search_volume": 5000 - i * 90, "cpc": 3 + i * 0.37,
            "competition": ["LOW", "MEDIUM", "HIGH"][i % 3]}


class Mocks:
    def __init__(self):
        self.checkouts, self.emails, self.openai = {}, [], 0

    def chat(self, request):
        self.openai += 1
        user = json.loads(request.content)["messages"][1]["content"]
        if "seed search phrases" in user:
            out = {"seeds": ["plumber houston", "water heater repair"]}
        elif "Choose the 10 keywords" in user:
            out = {"keywords": [{"index": i, "intent": "Local" if i % 2 else "Transactional",
                                 "reason": f"Ready-to-book plumbing searches, idx {i}.", "page": "Water heater page"}
                                for i in (0, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21)]}
        else:
            keys = re.findall(r"^- (\w+): [^,]+, max (\d+)", user, re.M)
            out = {"items": [{"angle": f"Angle {n + 1}", "fields": {
                k: (f"Variation {n + 1} {k}: Same-day Houston plumbing you can trust – call today ✅ " * 20)
                for k, _ in keys}} for n in range(5)]}
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(out)}}]})

    def stripe_create(self, request):
        p = {k: v[0] for k, v in parse_qs(request.content.decode()).items()}
        sid = f"cs_test_{len(self.checkouts) + 1}abc"
        self.checkouts[sid] = p
        return httpx.Response(200, json={"id": sid, "url": f"https://checkout.stripe.test/{sid}"})

    def stripe_get(self, request):
        sid = request.url.path.rsplit("/", 1)[-1]
        p = self.checkouts.get(sid)
        if not p:
            return httpx.Response(404, json={"error": {"message": "No such session"}})
        return httpx.Response(200, json={"id": sid, "payment_status": "paid", "customer_details": {"email": "buyer@example.com"},
                                         "metadata": {"job_id": p["metadata[job_id]"], "format": p["metadata[format]"]}})


@pytest.fixture
def env(monkeypatch):
    for k, v in {"OPENAI_API_KEY": "t", "OPENAI_BASE": "https://openai.test", "DATAFORSEO_LOGIN": "t",
                 "DATAFORSEO_PASSWORD": "t", "DATAFORSEO_BASE": "https://dfs.test", "STRIPE_SECRET_KEY": "sk_test_x",
                 "STRIPE_BASE": "https://stripe.test", "RESEND_API_KEY": "t", "RESEND_BASE": "https://resend.test",
                 "TEST_SITE_BASE": "https://site.test", "PUBLIC_ORIGIN": "https://worlddigital.ai",
                 "PREVIEW_DAILY_LIMIT": "3", "INTERNAL_TOKEN": "secret-token"}.items():
        monkeypatch.setenv(k, v)
    main.settings.cache_clear()
    st = Store(mongomock.MongoClient()["test"])
    st.ensure_indexes()
    main.set_store(st)
    m = Mocks()
    with respx.mock(assert_all_called=False) as r:
        r.post("https://openai.test/v1/chat/completions").mock(side_effect=m.chat)
        r.post(url__regex=r"https://dfs\.test/.*keywords_for_site.*").mock(
            return_value=httpx.Response(200, json={"tasks": [{"status_code": 20000, "result": [kw("plumber", 0)]}]}))
        r.post(url__regex=r"https://dfs\.test/.*keywords_for_keywords.*").mock(
            return_value=httpx.Response(200, json={"tasks": [{"status_code": 20000, "result": [
                kw(f"houston plumbing service {i}", i) for i in range(40)]}]}))
        r.post("https://stripe.test/v1/checkout/sessions").mock(side_effect=m.stripe_create)
        r.get(url__regex=r"https://stripe\.test/v1/checkout/sessions/.*").mock(side_effect=m.stripe_get)
        r.post("https://resend.test/emails").mock(side_effect=lambda req: (m.emails.append(json.loads(req.content)),
                                                                            httpx.Response(200, json={"id": "em_1"}))[1])
        r.get(url__regex=r"https://site\.test/.*").mock(return_value=httpx.Response(200, text=CUSTOMER,
                                                                                    headers={"content-type": "text/html"}))
        yield TestClient(main.app, headers={"x-internal-token": "secret-token", "cf-connecting-ip": "1.2.3.4"}), m
    main.set_store(None)


def test_keyword_flow(env):
    c, m = env
    r = c.post("/api/tools/keywords/preview", json={"url": "https://www.bayoucityplumbing.com/about", "country": "us"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert len(d["items"]) == 3 and d["locked"] == 7 and d["total"] == 10
    assert all(k["volume"] and k["cpc"] is not None and k["intent"] for k in d["items"])
    assert d["input"]["domain"] == "bayoucityplumbing.com"
    assert not re.search(r"houston plumbing service (9|11|13|15|17|19|21)\b", r.text), "locked keywords leaked"

    calls = m.openai
    assert c.post("/api/tools/keywords/preview", json={"url": "bayoucityplumbing.com", "country": "us"}).status_code == 200
    assert m.openai == calls, "repeat preview should come from cache"

    r = c.post("/api/tools/checkout", json={"id": d["id"], "format": "xlsx"})
    assert r.status_code == 200
    sid = r.json()["url"].rsplit("/", 1)[-1]
    p = m.checkouts[sid]
    assert p["line_items[0][price_data][unit_amount]"] == "999" and p["line_items[0][price_data][currency]"] == "usd"
    assert p["mode"] == "payment" and p["automatic_tax[enabled]"] == "true" and p["metadata[format]"] == "xlsx"
    assert p["success_url"] == "https://worlddigital.ai/services/keyword-research?order={CHECKOUT_SESSION_ID}#tool"

    r = c.get(f"/api/tools/order?session={sid}")
    assert r.status_code == 200 and len(r.json()["items"]) == 10
    assert len(m.emails) == 1 and m.emails[0]["to"] == ["buyer@example.com"]
    assert m.emails[0]["attachments"][0]["filename"] == "keyword-research-bayoucityplumbing-com.xlsx"
    c.get(f"/api/tools/order?session={sid}")
    assert len(m.emails) == 1, "order page reload must not email again"

    files = {}
    for fmt in ("pdf", "xlsx", "docx"):
        r = c.get(f"/api/tools/download?session={sid}&format={fmt}")
        assert r.status_code == 200 and len(r.content) > 1000
        assert f'filename="keyword-research-bayoucityplumbing-com.{fmt}"' in r.headers["content-disposition"]
        files[fmt] = r.content
    assert files["pdf"].startswith(b"%PDF")
    ws = load_workbook(io.BytesIO(files["xlsx"])).active
    assert ws["B5"].value == "plumber" and ws["C5"].value == 5000 and ws["D5"].number_format == '"$"#,##0.00'
    assert ws.max_row == 14
    doc = Document(io.BytesIO(files["docx"]))
    assert doc.tables[0].rows[1].cells[1].text == "plumber" and len(doc.tables[0].rows) == 11

    assert c.get("/api/tools/download?session=cs_test_nothere&format=pdf").status_code == 404
    assert c.get("/api/tools/order?session=hack").status_code == 400
    r = c.get(f"/api/tools/job?id={d['id']}")
    assert r.status_code == 200 and len(r.json()["items"]) == 3


def test_content_flow(env):
    c, m = env
    r = c.post("/api/tools/content/preview", json={"url": "bayoucityplumbing.com", "platform": "google_ads", "kind": "post"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert len(d["items"]) == 1 and d["locked"] == 4 and d["input"]["kind"] == "ad"
    assert all(len(f["text"]) <= f["max"] for f in d["items"][0]["fields"])
    assert "Variation 2" not in r.text
    r = c.post("/api/tools/checkout", json={"id": d["id"], "format": "docx"})
    sid = r.json()["url"].rsplit("/", 1)[-1]
    assert m.checkouts[sid]["line_items[0][price_data][unit_amount]"] == "2499"
    assert len(c.get(f"/api/tools/order?session={sid}").json()["items"]) == 5
    pdf = c.get(f"/api/tools/download?session={sid}&format=pdf").content
    assert pdf.startswith(b"%PDF")
    r = c.post("/api/tools/content/preview", json={"url": "bayoucityplumbing.com", "platform": "instagram", "kind": "post"})
    assert r.status_code == 200
    sid2 = c.post("/api/tools/checkout", json={"id": r.json()["id"]}).json()["url"].rsplit("/", 1)[-1]
    assert c.get(f"/api/tools/download?session={sid2}&format=pdf").content.startswith(b"%PDF"), "emoji text must not break the PDF"


def test_validation_and_limits(env):
    c, _ = env
    assert c.post("/api/tools/keywords/preview", json={"url": "localhost"}).status_code == 400
    assert c.post("/api/tools/keywords/preview", json={"url": "10.0.0.1"}).status_code == 400
    assert c.post("/api/tools/content/preview", json={"url": "a.com", "platform": "myspace"}).status_code == 400
    for i in range(3):
        assert c.post("/api/tools/keywords/preview", json={"url": f"business{i}.com"}).status_code == 200
    r = c.post("/api/tools/keywords/preview", json={"url": "business9.com"})
    assert r.status_code == 429 and "limit" in r.json()["error"]


def test_requires_internal_token(env):
    c, _ = env
    r = TestClient(main.app).post("/api/tools/keywords/preview", json={"url": "a.com"})
    assert r.status_code == 403
    assert TestClient(main.app).get("/api/tools/health").status_code == 200


def test_one_free_preview_per_website(env):
    c, _ = env
    first = c.post("/api/tools/content/preview", json={"url": "acme-roofing.com", "platform": "instagram", "kind": "post"}).json()
    assert first["notice"] is None and len(first["items"]) == 1
    # Same request again: the same preview comes back, with the "already generated" message.
    again = c.post("/api/tools/content/preview", json={"url": "www.acme-roofing.com", "platform": "instagram", "kind": "post"}).json()
    assert again["id"] == first["id"] and "already been generated" in again["notice"]
    # Different platform for the same website: nothing free, everything locked until paid.
    other = c.post("/api/tools/content/preview", json={"url": "acme-roofing.com", "platform": "linkedin", "kind": "post"}).json()
    assert other["items"] == [] and other["locked"] == 5 and "already been generated" in other["notice"]
    assert c.post("/api/tools/checkout", json={"id": other["id"], "format": "pdf"}).status_code == 200
    # Our own sites stay unlimited for testing.
    for plat in ("instagram", "linkedin", "facebook"):
        d = c.post("/api/tools/content/preview", json={"url": "worlddigital.us", "platform": plat, "kind": "post"}).json()
        assert d["notice"] is None and len(d["items"]) == 1
