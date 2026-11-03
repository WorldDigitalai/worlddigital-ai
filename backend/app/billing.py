"""Mercury invoicing: the $199.99/month SEO plan and one-off invoices (custom software, services).

Mercury creates the invoice and emails it to the customer (pay by ACH debit or bank transfer; card
only if Stripe is connected inside Mercury). Mercury has no recurring billing and no "invoice paid"
event, so a daily job (POST /api/tools/billing/run) creates each month's renewal invoice and polls
open invoices; when one turns Paid we email the customer a receipt and alert the team.

Settings: MERCURY_API_TOKEN (read-write, IP allowlisted), MERCURY_ACCOUNT_ID (checking account that
receives payments), MERCURY_CARD (true only once Stripe is connected in Mercury), BILLING_NOTIFY.

Collections: billing_customers (email -> Mercury customer id), billing_subscriptions, billing_invoices.
"""
from __future__ import annotations

import calendar
import html
import logging
import re
import uuid
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

from .config import Settings
from .services import ApiError, send_email
from .store import now

log = logging.getLogger("worlddigital.billing")
TZ = ZoneInfo("America/Chicago")

PLANS = {
    "seo": {"name": "SEO & AI Search Visibility plan", "amount": 199.99,
            "description": "SEO, AI SEO, AEO and GEO for one website, one month. Tax included.", "code": "SEO"},
}


def today() -> date:
    return datetime.now(TZ).date()


def add_month(d: date) -> date:
    m = d.month % 12 + 1
    y = d.year + (1 if d.month == 12 else 0)
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


# ── Mercury API ─────────────────────────────────────────────────────────────

class Mercury:
    def __init__(self, s: Settings):
        if not s.mercury_api_token or not s.mercury_account_id:
            raise ApiError("mercury not configured", 503, "Billing is being set up. Please email support@worlddigital.ai.")
        self.s = s
        self.h = {"Authorization": f"Bearer {s.mercury_api_token}", "Accept": "application/json"}

    def _call(self, method: str, path: str, body: dict | None = None) -> dict:
        try:
            r = httpx.request(method, f"{self.s.mercury_base}{path}", headers=self.h, json=body, timeout=30)
        except httpx.HTTPError as e:
            raise ApiError(f"mercury network {e}", 503, "Billing is busy right now. Please try again in a minute.")
        if r.status_code >= 400:
            log.error("Mercury %s %s -> %s %s", method, path, r.status_code, r.text[:400])
            hint = " (Mercury's invoicing API needs the Plus plan and a read-write token from an allowlisted IP.)" if r.status_code in (401, 403) else ""
            raise ApiError(f"mercury {r.status_code}: {r.text[:300]}{hint}", 502, "We could not create your invoice. Please email support@worlddigital.ai.")
        return r.json() if r.content else {}

    def create_customer(self, name: str, email: str) -> dict:
        return self._call("POST", "/ar/customers", {"name": name, "email": email})

    def create_invoice(self, *, customer_id: str, number: str, items: list[dict], invoice_date: date, due: date,
                       memo: str = "", note: str = "", period: tuple[date, date] | None = None) -> dict:
        body = {
            "customerId": customer_id, "destinationAccountId": self.s.mercury_account_id,
            "invoiceNumber": number, "invoiceDate": invoice_date.isoformat(), "dueDate": due.isoformat(),
            "lineItems": [{"name": i["name"][:200], "description": i.get("description") or None,
                           "quantity": float(i.get("quantity") or 1), "unitPrice": round(float(i["unitPrice"]), 2)} for i in items],
            "achDebitEnabled": True, "creditCardEnabled": self.s.mercury_card, "useRealAccountNumber": False,
            "ccEmails": [], "sendEmailOption": "SendNow",
            "payerMemo": memo or None, "internalNote": note or None,
        }
        if period:
            body["servicePeriodStartDate"], body["servicePeriodEndDate"] = period[0].isoformat(), period[1].isoformat()
        return self._call("POST", "/ar/invoices", body)

    def get_invoice(self, invoice_id: str) -> dict:
        return self._call("GET", f"/ar/invoices/{invoice_id}")

    def cancel_invoice(self, invoice_id: str) -> dict:
        return self._call("POST", f"/ar/invoices/{invoice_id}/cancel")


# ── Billing logic ───────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def _clean(v, n=200) -> str:
    return re.sub(r"\s+", " ", str(v or "")).strip()[:n]


class Billing:
    def __init__(self, s: Settings, db):
        self.s = s
        self.customers = db["billing_customers"]
        self.subs = db["billing_subscriptions"]
        self.invoices = db["billing_invoices"]
        self._m: Mercury | None = None

    @property
    def m(self) -> Mercury:
        if self._m is None:
            self._m = Mercury(self.s)
        return self._m

    def ensure_indexes(self) -> None:
        self.invoices.create_index("number", unique=True)
        self.invoices.create_index([("status", 1), ("due", 1)])
        self.subs.create_index([("status", 1), ("next_invoice", 1)])

    # customers
    def customer(self, name: str, email: str, company: str = "") -> str:
        email = email.lower()
        doc = self.customers.find_one({"_id": email})
        if doc:
            return doc["mercury_id"]
        c = self.m.create_customer(company or name, email)
        cid = c.get("id") or (c.get("customer") or {}).get("id")
        if not cid:
            raise ApiError(f"mercury customer response without id: {str(c)[:200]}", 502, "We could not create your invoice. Please email support@worlddigital.ai.")
        self.customers.insert_one({"_id": email, "mercury_id": cid, "name": name, "company": company, "created": now()})
        return cid

    # invoices
    def _invoice(self, *, email: str, customer_id: str, number: str, items: list[dict], due_days: int,
                 kind: str, sub_id: str | None = None, memo: str = "", period=None) -> dict:
        existing = self.invoices.find_one({"number": number})
        if existing:  # idempotent: the daily job or a retry never bills twice
            return existing
        d = today()
        res = self.m.create_invoice(customer_id=customer_id, number=number, items=items, invoice_date=d,
                                    due=d + timedelta(days=due_days), memo=memo, period=period,
                                    note=f"worlddigital.ai {kind}{f' {sub_id}' if sub_id else ''}")
        inv = res.get("invoice", res)
        doc = {"_id": inv.get("id") or str(uuid.uuid4()), "number": number, "mercury_id": inv.get("id"), "email": email,
               "kind": kind, "sub_id": sub_id, "amount": round(sum(float(i["unitPrice"]) * float(i.get("quantity") or 1) for i in items), 2),
               "items": items, "status": inv.get("status") or "Unpaid", "slug": inv.get("slug"), "date": d.isoformat(),
               "due": (d + timedelta(days=due_days)).isoformat(), "created": now(), "paid_notified": False}
        self.invoices.insert_one(doc)
        return doc

    def start_plan(self, body: dict) -> dict:
        plan = PLANS.get(body.get("plan") or "seo")
        name, email = _clean(body.get("name"), 120), _clean(body.get("email"), 200).lower()
        company, site = _clean(body.get("company"), 160), _clean(body.get("website"), 200)
        if not plan or not name or not EMAIL_RE.match(email) or not site:
            raise ApiError("bad plan request", 400, "Please enter your name, email and business website.")
        active = self.subs.find_one({"email": email, "plan": body.get("plan") or "seo", "status": {"$in": ["active", "past_due"]}, "website": site})
        if active:
            return {"ok": True, "already": True, "message": "You already have this plan for that website. Check your inbox for the invoice from Mercury, or email support@worlddigital.ai."}
        cid = self.customer(name, email, company)
        sub_id = uuid.uuid4().hex[:10].upper()
        start = today()
        period = (start, add_month(start) - timedelta(days=1))
        items = [{"name": plan["name"], "description": f"{plan['description']} Website: {site}. Service period {period[0]:%b %-d} to {period[1]:%b %-d, %Y}.",
                  "quantity": 1, "unitPrice": plan["amount"]}]
        self.subs.insert_one({"_id": sub_id, "email": email, "name": name, "company": company, "website": site,
                              "plan": body.get("plan") or "seo", "amount": plan["amount"], "customer_id": cid,
                              "status": "active", "started": start.isoformat(), "next_invoice": add_month(start).isoformat(), "created": now()})
        inv = self._invoice(email=email, customer_id=cid, number=f"WD-{plan['code']}-{sub_id}-{start:%Y%m}", items=items, due_days=3,
                            kind="plan", sub_id=sub_id, period=period, memo="Thank you for choosing WorldDigital.ai. Your plan starts as soon as this invoice is paid.")
        self._mail(email, f"Your WorldDigital.ai plan: invoice {inv['number']} is on its way",
                   f"<p>Hi {html.escape(name)},</p><p>Thanks for starting the <b>{plan['name']}</b> for <b>{html.escape(site)}</b>.</p>"
                   f"<p>Mercury, our bank, has just emailed you invoice <b>{inv['number']}</b> for <b>${plan['amount']:.2f}</b>. "
                   "You can pay it by bank (ACH) from the secure link in that email. Your first audit starts as soon as it is paid.</p>"
                   "<p>Your next invoice arrives automatically each month. To cancel, just reply to this email.</p><p>WorldDigital.ai</p>")
        self._notify(f"New plan signup: {site} ({email})", f"<p>{html.escape(name)} {html.escape(company)} &lt;{html.escape(email)}&gt;<br>Website: {html.escape(site)}<br>"
                     f"Plan: {plan['name']} ${plan['amount']:.2f}/month<br>Invoice {inv['number']} sent by Mercury.</p>")
        return {"ok": True, "invoice": inv["number"], "message": "Done! Mercury just emailed your first invoice. Your plan starts as soon as it is paid."}

    def one_off(self, body: dict) -> dict:
        name, email, company = _clean(body.get("name"), 120), _clean(body.get("email"), 200).lower(), _clean(body.get("company"), 160)
        items = []
        for i in body.get("items") or []:
            try:
                if _clean(i.get("name")) and float(i.get("unitPrice")) >= 0:
                    items.append({"name": _clean(i["name"], 200), "description": _clean(i.get("description"), 500),
                                  "quantity": float(i.get("quantity") or 1), "unitPrice": round(float(i["unitPrice"]), 2)})
            except (TypeError, ValueError):
                pass
        if not name or not EMAIL_RE.match(email) or not items:
            raise ApiError("bad invoice request", 400, "Add the client's name, email and at least one line item with a price.")
        cid = self.customer(name, email, company)
        inv = self._invoice(email=email, customer_id=cid, number=f"WD-{today():%Y%m%d}-{uuid.uuid4().hex[:6].upper()}", items=items,
                            due_days=int(body.get("due_days") or 14), kind="one-off", memo=_clean(body.get("memo"), 500))
        return {"ok": True, "invoice": inv["number"], "amount": inv["amount"]}

    def cancel_plan(self, sub_id: str) -> dict:
        sub = self.subs.find_one({"_id": sub_id})
        if not sub:
            raise ApiError("no such plan", 404, "Plan not found.")
        self.subs.update_one({"_id": sub_id}, {"$set": {"status": "cancelled", "cancelled": now()}})
        return {"ok": True}

    def run(self) -> dict:
        """Daily: create due renewal invoices, then sync open invoices and send receipts."""
        out = {"renewals": 0, "paid": 0, "checked": 0, "errors": []}
        d = today()
        for sub in self.subs.find({"status": {"$in": ["active", "past_due"]}, "next_invoice": {"$lte": d.isoformat()}}):
            try:
                start = date.fromisoformat(sub["next_invoice"])
                period = (start, add_month(start) - timedelta(days=1))
                plan = PLANS[sub["plan"]]
                items = [{"name": plan["name"], "description": f"{plan['description']} Website: {sub['website']}. Service period {period[0]:%b %-d} to {period[1]:%b %-d, %Y}.",
                          "quantity": 1, "unitPrice": sub["amount"]}]
                self._invoice(email=sub["email"], customer_id=sub["customer_id"], number=f"WD-{plan['code']}-{sub['_id']}-{start:%Y%m}",
                              items=items, due_days=7, kind="plan", sub_id=sub["_id"], period=period)
                self.subs.update_one({"_id": sub["_id"]}, {"$set": {"next_invoice": add_month(start).isoformat()}})
                out["renewals"] += 1
            except ApiError as e:
                out["errors"].append(f"renewal {sub['_id']}: {e}")
        for inv in self.invoices.find({"status": {"$in": ["Unpaid", "Processing"]}, "mercury_id": {"$ne": None}}):
            out["checked"] += 1
            try:
                cur = self.m.get_invoice(inv["mercury_id"])
            except ApiError as e:
                out["errors"].append(f"status {inv['number']}: {e}")
                continue
            st = (cur.get("invoice", cur).get("status") or inv["status"])
            if st != inv["status"]:
                self.invoices.update_one({"_id": inv["_id"]}, {"$set": {"status": st, "status_at": now()}})
            if st == "Paid" and not inv.get("paid_notified"):
                if self.invoices.find_one_and_update({"_id": inv["_id"], "paid_notified": False}, {"$set": {"paid_notified": True, "paid_at": now()}}):
                    out["paid"] += 1
                    self._mail(inv["email"], f"Payment received: invoice {inv['number']}",
                               f"<p>Thank you! We received your payment of <b>${inv['amount']:.2f}</b> for invoice <b>{inv['number']}</b>.</p>"
                               "<p>Mercury keeps the paid invoice for your records. Questions? Just reply to this email.</p><p>WorldDigital.ai</p>")
                    self._notify(f"Invoice paid: {inv['number']} ${inv['amount']:.2f}", f"<p>{html.escape(inv['email'])} paid {inv['number']} (${inv['amount']:.2f}).</p>")
                    if inv.get("sub_id"):
                        self.subs.update_one({"_id": inv["sub_id"], "status": "past_due"}, {"$set": {"status": "active"}})
            elif st == "Unpaid" and inv.get("sub_id") and inv["due"] < (d - timedelta(days=14)).isoformat():
                if self.subs.find_one_and_update({"_id": inv["sub_id"], "status": "active"}, {"$set": {"status": "past_due"}}):
                    self._notify(f"Past due: {inv['number']}", f"<p>{html.escape(inv['email'])} has not paid {inv['number']} (due {inv['due']}). The plan is marked past due.</p>")
        return out

    def overview(self) -> dict:
        subs = list(self.subs.find({}, {"_id": 1, "email": 1, "name": 1, "website": 1, "status": 1, "next_invoice": 1, "amount": 1, "started": 1}).sort("created", -1).limit(200))
        invs = list(self.invoices.find({}, {"_id": 0, "number": 1, "email": 1, "amount": 1, "status": 1, "date": 1, "due": 1, "kind": 1}).sort("created", -1).limit(200))
        return {"configured": bool(self.s.mercury_api_token and self.s.mercury_account_id), "subscriptions": subs, "invoices": invs}

    # email
    def _mail(self, to: str, subject: str, body: str) -> None:
        try:
            send_email(self.s, to=to, subject=subject, html=f'<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">{body}</div>')
        except Exception as e:  # an email failure must never undo an invoice that Mercury already sent
            log.error("billing email to %s failed: %s", to, e)

    def _notify(self, subject: str, body: str) -> None:
        self._mail(self.s.billing_notify, subject, body)
