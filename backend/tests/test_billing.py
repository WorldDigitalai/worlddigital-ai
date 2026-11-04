"""Mercury billing: plan signup, one-off invoices, monthly renewals, paid receipts. Mercury and Resend are mocked."""
import json
from datetime import date

import mongomock
import pytest
import respx
from fastapi.testclient import TestClient
import httpx

from app import billing as billing_mod
from app import main
from app.store import Store

TOKEN = "test-token"


class Merc:
    def __init__(self):
        self.customers, self.invoices, self.emails = [], {}, []

    def customer(self, req):
        b = json.loads(req.content); self.customers.append(b)
        return httpx.Response(200, json={"id": f"00000000-0000-0000-0000-{len(self.customers):012d}", **b})

    def invoice(self, req):
        b = json.loads(req.content)
        assert b["sendEmailOption"] == "SendNow" and b["achDebitEnabled"] is True and b["destinationAccountId"] == "acct-1"
        assert b["lineItems"][0]["unitPrice"] > 0 and b["invoiceNumber"]
        iid = f"10000000-0000-0000-0000-{len(self.invoices) + 1:012d}"
        self.invoices[iid] = {"id": iid, "status": "Unpaid", "slug": f"s{len(self.invoices)}", **b}
        return httpx.Response(200, json=self.invoices[iid])

    def get(self, req):
        iid = req.url.path.rsplit("/", 1)[-1]
        return httpx.Response(200, json=self.invoices[iid])

    def email(self, req):
        self.emails.append(json.loads(req.content)); return httpx.Response(200, json={"id": "e"})


@pytest.fixture
def env(monkeypatch):
    for k, v in {"TOOLS_API_TOKEN": TOKEN, "MERCURY_API_TOKEN": "mt", "MERCURY_ACCOUNT_ID": "acct-1",
                 "RESEND_API_KEY": "re_x", "BILLING_NOTIFY": "owner@example.com"}.items():
        monkeypatch.setenv(k, v)
    main.settings.cache_clear()
    main.set_store(Store(mongomock.MongoClient()["t"]))
    main._billing = None
    m = Merc()
    with respx.mock(assert_all_called=False) as r:
        r.post("https://api.mercury.com/api/v1/ar/customers").mock(side_effect=m.customer)
        r.post("https://api.mercury.com/api/v1/ar/invoices").mock(side_effect=m.invoice)
        r.get(url__regex=r"https://api.mercury.com/api/v1/ar/invoices/.+").mock(side_effect=m.get)
        r.post(url__regex=r"https://api.mercury.com/api/v1/ar/invoices/.+/cancel").mock(return_value=httpx.Response(200, json={"status": "Cancelled"}))
        r.post("https://api.resend.com/emails").mock(side_effect=m.email)
        yield TestClient(main.app), m
    main._billing = None
    main.settings.cache_clear()


H = {"x-internal-token": TOKEN, "x-wd-server": "1"}


def test_plan_signup_creates_customer_and_emailed_invoice(env):
    c, m = env
    r = c.post("/api/tools/billing/plan", headers=H, json={"name": "Ana", "email": "Ana@Shop.com", "company": "Ana's Shop", "website": "anashop.com"})
    assert r.status_code == 200 and r.json()["ok"], r.text
    assert m.customers == [{"name": "Ana's Shop", "email": "ana@shop.com"}]
    inv = list(m.invoices.values())[0]
    assert inv["lineItems"][0]["unitPrice"] == 199.99 and inv["invoiceNumber"].startswith("WD-SEO-")
    assert {e["to"][0] for e in m.emails} == {"ana@shop.com", "owner@example.com"}
    # same website again: no second plan or invoice
    again = c.post("/api/tools/billing/plan", headers=H, json={"name": "Ana", "email": "ana@shop.com", "website": "anashop.com"}).json()
    assert again["already"] and len(m.invoices) == 1


def test_bad_input_and_token(env):
    c, _ = env
    assert c.post("/api/tools/billing/plan", headers=H, json={"name": "", "email": "x"}).status_code == 400
    assert c.post("/api/tools/billing/plan", json={"name": "A", "email": "a@b.co", "website": "a.co"}).status_code in (401, 403)


def test_one_off_invoice(env):
    c, m = env
    r = c.post("/api/tools/billing/invoice", headers=H, json={"name": "Clinic", "email": "ops@clinic.org", "due_days": 10,
               "items": [{"name": "EHR integration, phase 1", "quantity": 1, "unitPrice": 4500}, {"name": "", "unitPrice": 5}]})
    assert r.status_code == 200 and r.json()["amount"] == 4500.0
    inv = list(m.invoices.values())[0]
    assert len(inv["lineItems"]) == 1 and inv["invoiceNumber"].startswith("WD-")


def test_renewal_and_paid_receipt(env, monkeypatch):
    c, m = env
    c.post("/api/tools/billing/plan", headers=H, json={"name": "Bo", "email": "bo@x.com", "website": "bo.com"})
    first = list(m.invoices)[0]
    m.invoices[first]["status"] = "Paid"
    m.emails.clear()
    out = c.post("/api/tools/billing/run", headers=H).json()
    assert out["paid"] == 1 and out["renewals"] == 0
    assert any("Payment received" in e["subject"] for e in m.emails)
    # running again does not send the receipt twice
    assert c.post("/api/tools/billing/run", headers=H).json()["paid"] == 0
    # a month later: one renewal invoice, and only one even if the job runs twice
    nxt = billing_mod.add_month(billing_mod.today())
    monkeypatch.setattr(billing_mod, "today", lambda: nxt)
    assert c.post("/api/tools/billing/run", headers=H).json()["renewals"] == 1
    assert c.post("/api/tools/billing/run", headers=H).json()["renewals"] == 0
    assert len(m.invoices) == 2
    assert c.get("/api/tools/billing", headers=H).json()["subscriptions"][0]["next_invoice"] > nxt.isoformat()


def test_add_month_clamps():
    assert billing_mod.add_month(date(2026, 1, 31)) == date(2026, 2, 28)
    assert billing_mod.add_month(date(2026, 12, 15)) == date(2027, 1, 15)


def test_not_configured(monkeypatch):
    monkeypatch.setenv("TOOLS_API_TOKEN", TOKEN); monkeypatch.delenv("MERCURY_API_TOKEN", raising=False)
    main.settings.cache_clear(); main.set_store(Store(mongomock.MongoClient()["t"])); main._billing = None
    r = TestClient(main.app).post("/api/tools/billing/plan", headers=H, json={"name": "A", "email": "a@b.co", "website": "a.co"})
    assert r.status_code == 503
    main._billing = None; main.settings.cache_clear()


def test_cancel_invoice(env):
    c, m = env
    num = c.post("/api/tools/billing/invoice", headers=H, json={"name": "T", "email": "t@x.com", "items": [{"name": "Test", "unitPrice": 1}]}).json()["invoice"]
    r = c.post("/api/tools/billing/cancel-invoice", headers=H, json={"number": num})
    assert r.status_code == 200 and r.json()["status"] == "Cancelled"
    assert c.post("/api/tools/billing/cancel-invoice", headers=H, json={"number": "nope"}).status_code == 404


def test_billing_needs_server_header(env):
    c, _ = env
    for path in ("/api/tools/billing", "/api/tools/%62illing"):
        assert c.get(path, headers={"x-internal-token": TOKEN}).status_code == 403
    assert c.post("/api/tools/billing/run", headers={"x-internal-token": TOKEN}).status_code == 403
    assert c.get("/api/tools/billing", headers=H).status_code == 200
