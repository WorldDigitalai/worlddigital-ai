"""Clients for OpenAI, DataForSEO, Stripe, Resend and reading customer websites."""
from __future__ import annotations

import base64
import ipaddress
import json
import re
from urllib.parse import urlencode, urlparse

import httpx

from .config import Settings


class ApiError(Exception):
    """An error with a message that is safe to show the customer."""

    def __init__(self, detail: str, status: int = 500, public: str | None = None):
        super().__init__(detail)
        self.status = status
        self.public = public or "Something went wrong. Please try again."


def _json(res: httpx.Response, service: str):
    if res.status_code >= 400:
        raise ApiError(f"{service} {res.status_code}: {res.text[:300]}", 502)
    try:
        return res.json()
    except ValueError as e:
        raise ApiError(f"{service} returned non-JSON", 502) from e


# ── OpenAI ──────────────────────────────────────────────────────────────────

def openai_json(s: Settings, *, system: str, user: str, max_tokens: int = 2500, temperature: float = 0.4) -> dict:
    if not s.openai_api_key:
        raise ApiError("OPENAI_API_KEY missing", 503, "The generator is being set up. Please try again later.")
    res = httpx.post(
        f"{s.openai_base}/v1/chat/completions",
        headers={"Authorization": f"Bearer {s.openai_api_key}"},
        json={
            "model": s.openai_model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        },
        timeout=60,
    )
    data = _json(res, "OpenAI")
    content = ((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "{}"
    try:
        return json.loads(content)
    except ValueError as e:
        raise ApiError("OpenAI returned invalid JSON", 502) from e


# ── DataForSEO (Google Ads keyword data) ───────────────────────────────────

def _dfs(s: Settings, path: str, task: dict) -> list:
    if not (s.dataforseo_login and s.dataforseo_password):
        raise ApiError("DataForSEO credentials missing", 503, "The keyword tool is being set up. Please try again later.")
    res = httpx.post(f"{s.dataforseo_base}{path}", auth=(s.dataforseo_login, s.dataforseo_password), json=[task], timeout=60)
    data = _json(res, "DataForSEO")
    t = (data.get("tasks") or [None])[0]
    if not t or (t.get("status_code") or 0) >= 40000:
        raise ApiError(f"DataForSEO task error: {t and t.get('status_code')} {t and t.get('status_message')}", 502)
    return t.get("result") or []


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def normalize_kw(r: dict) -> dict:
    cpc = _num(r.get("cpc"))
    return {
        "keyword": str(r.get("keyword") or "").lower().strip(),
        "volume": _num(r.get("search_volume")),
        "cpc": round(cpc, 2) if cpc is not None else None,
        "competition": r.get("competition") or None,
    }


def keywords_for_site(s: Settings, domain: str, location_code: int) -> list[dict]:
    rows = _dfs(s, "/v3/keywords_data/google_ads/keywords_for_site/live", {
        "target": domain, "location_code": location_code, "language_code": "en",
        "search_partners": False, "sort_by": "search_volume",
    })
    return [k for k in map(normalize_kw, rows) if k["keyword"]]


def keywords_for_keywords(s: Settings, seeds: list[str], location_code: int) -> list[dict]:
    rows = _dfs(s, "/v3/keywords_data/google_ads/keywords_for_keywords/live", {
        "keywords": seeds[:20], "location_code": location_code, "language_code": "en",
        "search_partners": False, "sort_by": "search_volume",
    })
    return [k for k in map(normalize_kw, rows) if k["keyword"]]


# ── Stripe ──────────────────────────────────────────────────────────────────

def _form(obj: dict, prefix: str = "", out: list | None = None) -> list:
    out = [] if out is None else out
    for k, v in obj.items():
        if v is None:
            continue
        key = f"{prefix}[{k}]" if prefix else k
        if isinstance(v, dict):
            _form(v, key, out)
        elif isinstance(v, bool):
            out.append((key, "true" if v else "false"))
        else:
            out.append((key, str(v)))
    return out


def _stripe(s: Settings, method: str, path: str, body: dict | None = None) -> dict:
    if not s.stripe_secret_key:
        raise ApiError("STRIPE_SECRET_KEY missing", 503, "Checkout is being set up. Please try again later.")
    res = httpx.request(
        method, f"{s.stripe_base}{path}",
        headers={"Authorization": f"Bearer {s.stripe_secret_key}", "Content-Type": "application/x-www-form-urlencoded"},
        content=urlencode(_form(body)) if body else None, timeout=20,
    )
    return _json(res, "Stripe")


def create_checkout_session(s: Settings, params: dict) -> dict:
    return _stripe(s, "POST", "/v1/checkout/sessions", params)


def get_checkout_session(s: Settings, session_id: str) -> dict:
    return _stripe(s, "GET", f"/v1/checkout/sessions/{session_id}")


# ── Resend ──────────────────────────────────────────────────────────────────

def send_email(s: Settings, *, to: str, subject: str, html: str, attachment: tuple[str, bytes] | None = None) -> dict:
    if not s.resend_api_key:
        return {"skipped": True}
    body = {"from": s.email_from, "to": [to], "reply_to": s.email_reply_to, "subject": subject, "html": html}
    if attachment:
        body["attachments"] = [{"filename": attachment[0], "content": base64.b64encode(attachment[1]).decode()}]
    res = httpx.post(f"{s.resend_base}/emails", headers={"Authorization": f"Bearer {s.resend_api_key}"}, json=body, timeout=20)
    return _json(res, "Resend")


def verify_turnstile(s: Settings, token: str | None, ip: str | None) -> None:
    if not s.turnstile_secret:
        return
    res = httpx.post("https://challenges.cloudflare.com/turnstile/v0/siteverify",
                     data={"secret": s.turnstile_secret, "response": token or "", "remoteip": ip or ""}, timeout=10)
    if not res.json().get("success"):
        raise ApiError("turnstile failed", 403, "Please complete the quick check and try again.")


# ── Customer websites ──────────────────────────────────────────────────────

_HOST_RE = re.compile(r"^[a-z0-9.-]+\.[a-z]{2,}$")


def parse_site_url(raw: str | None) -> tuple[str, str]:
    """Return (url, domain) for a public website, or raise a customer-friendly error."""
    s = str(raw or "").strip()
    if not s:
        raise ApiError("empty url", 400, "Enter your website address.")
    if not re.match(r"^https?://", s, re.I):
        s = "https://" + s
    try:
        u = urlparse(s)
    except ValueError as e:
        raise ApiError("bad url", 400, "That doesn't look like a website address.") from e
    host = (u.hostname or "").lower()
    is_ip = True
    try:
        ipaddress.ip_address(host)
    except ValueError:
        is_ip = False
    if is_ip or not _HOST_RE.match(host) or host.endswith(".local") or host == "localhost":
        raise ApiError("bad host", 400, "Enter a public website address, like yourbusiness.com.")
    url = u._replace(fragment="").geturl()
    return url, re.sub(r"^www\.", "", host)


def _strip(html: str) -> str:
    html = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", html)
    html = re.sub(r"<[^>]+>", " ", html)
    html = html.replace("&nbsp;", " ").replace("&amp;", "&").replace("&#39;", "'").replace("&rsquo;", "'")
    return re.sub(r"\s+", " ", html).strip()


def read_site(url: str, *, fetch_base: str = "") -> dict | None:
    """Fetch a page and return its title, description, headings and body text (None if unreadable)."""
    target = f"{fetch_base}/?u={url}" if fetch_base else url
    try:
        res = httpx.get(target, headers={"User-Agent": "Mozilla/5.0 (compatible; WorldDigitalBot/1.0; +https://worlddigital.ai)",
                                          "Accept": "text/html"}, follow_redirects=True, timeout=10)
    except httpx.HTTPError:
        return None
    if res.status_code >= 400 or "html" not in res.headers.get("content-type", ""):
        return None
    html = res.text[:400_000]
    title = re.search(r"(?is)<title[^>]*>(.*?)</title>", html)
    desc = re.search(r"""(?is)<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)""", html) or \
        re.search(r"""(?is)<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']""", html)
    headings = [h for h in (_strip(m) for m in re.findall(r"(?is)<h[1-3][^>]*>(.*?)</h[1-3]>", html)) if h][:20]
    body = re.sub(r"(?is)<(header|nav|footer)[^>]*>.*?</\1>", " ", html)
    return {
        "title": _strip(title.group(1)) if title else "",
        "description": re.sub(r"\s+", " ", desc.group(1)).strip() if desc else "",
        "headings": headings,
        "text": _strip(body)[:3500],
    }
