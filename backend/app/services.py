"""Clients for OpenAI, DataForSEO, Stripe, Resend and reading customer websites."""
from __future__ import annotations

import base64
import ipaddress
import json
import re
import time
from urllib.parse import urlencode, urlparse

import httpx

from . import providers
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

_MODELS = ["gpt-5.4-mini", "gpt-5.5", "gpt-6-luna", "gpt-5.4", "gpt-5.2"]
_working_model: list[str] = []  # remembered after the first model the project is allowed to use

# AI usage: every OpenAI call reports (feature, model, input tokens, output tokens, fallback) here.
# main.py points it at MongoDB (daily counters shown on the admin knowledge-base page). Never raises.
_usage_sink = None


def set_usage_sink(fn) -> None:
    global _usage_sink
    _usage_sink = fn


def record_usage(feature: str, model: str, usage: dict | None = None, *, fallback: bool = False, units: int = 0,
                 ms: int | None = None, first_ms: int | None = None, error: bool = False) -> None:
    """Counts one AI call. The meter fields are optional: ms = whole call, first_ms = time to the first words of a
    streamed answer, error = the call failed. Cached input tokens and list-price cost are worked out here."""
    if not _usage_sink:
        return
    try:
        u = usage or {}
        tin = int(u.get("prompt_tokens") or u.get("input_tokens") or 0)
        tout = int(u.get("completion_tokens") or u.get("output_tokens") or 0)
        cached = int(((u.get("prompt_tokens_details") or u.get("input_tokens_details") or {}).get("cached_tokens")) or 0)
        base = dict(feature=feature, model=model, tokens_in=tin, tokens_out=tout, fallback=fallback, units=units)
        meter = dict(ms=ms, first_ms=first_ms, error=error, cached=cached,
                     cost_micro=None if error else providers.cost_micro(model, tin, tout, cached))
        try:
            _usage_sink(**base, **meter)
        except TypeError:  # a sink that only takes the original fields
            _usage_sink(**base)
    except Exception:  # noqa: BLE001  usage tracking must never break a request
        pass


def _ms(t0: float) -> int:
    return round((time.perf_counter() - t0) * 1000)


def _caller() -> str:
    import sys
    f = sys._getframe(2)
    return f"{f.f_globals.get('__name__', '').rsplit('.', 1)[-1]}.{f.f_code.co_name}"


# One shared HTTP client: connections to OpenAI and the site worker stay open between calls, which saves a new
# secure handshake (about 0.1-0.2 s) on every embedding, answer and rerank. Thread-safe.
http = httpx.Client(timeout=60, limits=httpx.Limits(max_connections=40, max_keepalive_connections=20, keepalive_expiry=300))

_effort_refused: set[tuple[str, str]] = set()   # (model, effort) pairs OpenAI rejected: not sent again


# ── Other providers that speak the OpenAI chat protocol (Groq, Cerebras): see providers.py ──────────────────────

def _compat_post(target, body: dict, timeout: float, *, stream: bool):
    """One request, asked again once without a field the provider rejects (reasoning_effort, stream_options)."""
    headers = {"Authorization": f"Bearer {target.key}"}
    t = httpx.Timeout(timeout, connect=5)
    for _ in range(3):
        if stream:
            r = http.send(http.build_request("POST", f"{target.base}/chat/completions", headers=headers, json=body, timeout=t), stream=True)
            if r.status_code < 400:
                return r
            r.read()
            r.close()
        else:
            r = http.post(f"{target.base}/chat/completions", headers=headers, json=body, timeout=t)
            if r.status_code < 400:
                return r
        dropped = next((k for k in ("reasoning_effort", "stream_options") if r.status_code == 400 and k in body and k in r.text), None)
        if not dropped:
            raise ApiError(f"{target.provider} {r.status_code}: {r.text[:300]}", 502)
        if dropped == "reasoning_effort":
            _effort_refused.add((target.label, body["reasoning_effort"]))
        body.pop(dropped)
    raise ApiError(f"{target.provider} kept rejecting the request", 502)


def _compat_body(target, system: str, user: str, max_tokens: int, temperature: float) -> dict:
    effort = providers.effort_for(target.model)
    body = {"model": target.model, "temperature": temperature,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "max_completion_tokens": max_tokens * 4 if effort and effort != "none" else max_tokens}  # room for reasoning
    if effort and (target.label, effort) not in _effort_refused:
        body["reasoning_effort"] = effort
    return body


def _compat_stream(target, *, system: str, user: str, max_tokens: int, temperature: float, timeout: float, feature: str):
    t0, first, usage = time.perf_counter(), None, None
    body = {**_compat_body(target, system, user, max_tokens, temperature), "stream": True, "stream_options": {"include_usage": True}}
    try:
        r = _compat_post(target, body, timeout, stream=True)
        try:
            for line in r.iter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:].strip()
                if data == "[DONE]":
                    break
                try:
                    ev = json.loads(data)
                except ValueError:
                    continue
                if ev.get("error"):  # these providers can report an error in the middle of a stream
                    raise ApiError(f"{target.provider} stream error: {str(ev['error'])[:200]}", 502)
                usage = ev.get("usage") or (ev.get("x_groq") or {}).get("usage") or usage
                for ch in ev.get("choices") or []:
                    piece = (ch.get("delta") or {}).get("content")
                    if piece:
                        first = first if first is not None else _ms(t0)
                        yield piece
        finally:
            r.close()
    except (ApiError, httpx.HTTPError):
        record_usage(feature, target.label, usage, ms=_ms(t0), first_ms=first, error=True)
        raise
    if first is None:
        record_usage(feature, target.label, usage, ms=_ms(t0), error=True)
        raise ApiError(f"{target.provider} wrote nothing", 502)
    record_usage(feature, target.label, usage, ms=_ms(t0), first_ms=first)


def _compat_json(target, *, system: str, user: str, max_tokens: int, temperature: float, timeout: float, feature: str) -> dict:
    t0 = time.perf_counter()
    body = {**_compat_body(target, system, user, max_tokens, temperature), "response_format": {"type": "json_object"}}
    try:
        data = _json(_compat_post(target, body, timeout, stream=False), target.provider)
        out = json.loads(((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "")
        if not isinstance(out, dict):
            raise ValueError("not an object")
    except (ApiError, httpx.HTTPError, ValueError) as e:
        record_usage(feature, target.label, None, ms=_ms(t0), error=True)
        raise e if isinstance(e, ApiError) else ApiError(f"{target.provider}: {type(e).__name__}: {e}", 502) from e
    record_usage(feature, target.label, data.get("usage"), ms=_ms(t0))
    return out


def openai_stream(s: Settings, *, system: str, user: str, max_tokens: int = 500, temperature: float = 0.2,
                  timeout: float = 60, effort: str | None = "none", feature: str | None = None, model: str | None = None,
                  tier: str | None = None):
    """Yields the model's text as it is written (chat completions with stream=True), so callers can show the first
    words in well under a second. Reasoning models get reasoning_effort (default "none": answer straight away);
    a model that does not take it is asked again without."""
    feature = feature or _caller()
    if not s.openai_api_key:
        raise ApiError("OPENAI_API_KEY missing", 503, "The generator is being set up. Please try again later.")
    target, rerouted = providers.pick(s, feature, model), False
    if not target and providers.split(model)[0] != "openai":
        raise ApiError(f"no API key for {model}", 503, "The generator is being set up. Please try again later.")
    if target:
        wrote = False
        try:
            for piece in _compat_stream(target, system=system, user=user, max_tokens=max_tokens, temperature=temperature,
                                        timeout=timeout, feature=feature):
                wrote = True
                yield piece
            return
        except (ApiError, httpx.HTTPError) as e:
            # A provider named in the model (a trial) never falls back: the trial must show its own result.
            # A routed feature falls back to OpenAI, but only if the visitor has not been shown anything yet.
            if wrote or model:
                raise
            print(f"{target.label} failed for {feature}, using OpenAI: {e}", flush=True)
            rerouted = True
    asked = model
    model = model or (_working_model or [s.openai_model])[0]
    reasoning = model.startswith(("gpt-5", "o1", "o3", "o4"))
    t0, first = time.perf_counter(), None
    body = {"model": model, "stream": True, "stream_options": {"include_usage": True}, **({"service_tier": tier} if tier else {}),
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}
    if reasoning:
        body["max_completion_tokens"] = max_tokens * 4
        if effort and (model, effort) not in _effort_refused:
            body["reasoning_effort"] = effort
    else:
        body.update(max_tokens=max_tokens, temperature=temperature)
    headers = {"Authorization": f"Bearer {s.openai_api_key}"}
    for _ in range(3):
        with http.stream("POST", f"{s.openai_base}/v1/chat/completions", headers=headers, json=body, timeout=timeout) as r:
            if r.status_code == 400:
                r.read()
                if "reasoning_effort" in r.text and "reasoning_effort" in body:
                    _effort_refused.add((model, body.pop("reasoning_effort")))  # this model does not take this value
                    print(f"openai {model}: reasoning_effort refused: {r.text[:200]}", flush=True)
                    continue
            if r.status_code >= 400:
                r.read()
                record_usage(feature, model, None, ms=_ms(t0), error=True)
                _json(r, "OpenAI")  # raises with the error
            usage = None
            for line in r.iter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:].strip()
                if data == "[DONE]":
                    break
                try:
                    ev = json.loads(data)
                except ValueError:
                    continue
                usage = ev.get("usage") or usage
                for ch in ev.get("choices") or []:
                    piece = (ch.get("delta") or {}).get("content")
                    if piece:
                        first = first if first is not None else _ms(t0)
                        yield piece
            # a model the caller did not ask for is a fallback: counted, so a pricier model never runs unnoticed
            record_usage(feature, model, usage, fallback=rerouted or (not asked and model != s.openai_model),
                         ms=_ms(t0), first_ms=first)
            return
    raise ApiError("OpenAI stream failed", 502)


def openai_json(s: Settings, *, system: str, user: str, max_tokens: int = 2500, temperature: float = 0.4,
                timeout: float = 90, effort: str | None = None, feature: str | None = None) -> dict:
    feature = feature or _caller()
    if not s.openai_api_key:
        raise ApiError("OPENAI_API_KEY missing", 503, "The generator is being set up. Please try again later.")
    target, rerouted = providers.pick(s, feature), False
    if target:
        try:
            return _compat_json(target, system=system, user=user, max_tokens=max_tokens, temperature=temperature,
                                timeout=timeout, feature=feature)
        except ApiError as e:
            print(f"{target.label} failed for {feature}, using OpenAI: {e}", flush=True)
            rerouted = True
    candidates = _working_model or [s.openai_model] + [m for m in _MODELS if m != s.openai_model]
    last = None
    for model in candidates:
        t0 = time.perf_counter()
        reasoning = model.startswith(("gpt-5", "o1", "o3", "o4"))
        body = {"model": model, "response_format": {"type": "json_object"},
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}
        if reasoning:
            body["max_completion_tokens"] = max_tokens * 4  # room for reasoning tokens
            if effort and (model, effort) not in _effort_refused:
                body["reasoning_effort"] = effort
        else:
            body.update(max_tokens=max_tokens, temperature=temperature)
        res = http.post(f"{s.openai_base}/v1/chat/completions", headers={"Authorization": f"Bearer {s.openai_api_key}"},
                         json=body, timeout=timeout)
        if res.status_code == 400 and "reasoning_effort" in res.text and "reasoning_effort" in body:
            _effort_refused.add((model, body.pop("reasoning_effort")))  # this model does not take it; ask again without
            res = http.post(f"{s.openai_base}/v1/chat/completions", headers={"Authorization": f"Bearer {s.openai_api_key}"},
                             json=body, timeout=timeout)
        if res.status_code in (403, 404) and "model" in res.text:
            last = res
            print(f"openai model {model} refused: {res.status_code} {res.text[:200]}", flush=True)
            continue  # this project can't use this model; try the next
        if res.status_code >= 400:
            record_usage(feature, model, None, ms=_ms(t0), error=True)
        data = _json(res, "OpenAI")
        if not _working_model:
            _working_model.append(model)
            print(f"openai model in use: {model}")
        # a model other than the configured one is a fallback: counted, so a pricier model never runs unnoticed
        record_usage(feature, model, data.get("usage"), fallback=rerouted or model != s.openai_model, ms=_ms(t0))
        content = ((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "{}"
        try:
            return json.loads(content)
        except ValueError as e:
            raise ApiError("OpenAI returned invalid JSON", 502) from e
    _json(last, "OpenAI")  # raises with the last error
    raise ApiError("no OpenAI model available", 502)


# ── DataForSEO (Google Ads keyword data) ───────────────────────────────────

def _dfs(s: Settings, path: str, task: dict, timeout: float = 60) -> list:
    if not (s.dataforseo_login and s.dataforseo_password):
        raise ApiError("DataForSEO credentials missing", 503, "The keyword tool is being set up. Please try again later.")
    res = httpx.post(f"{s.dataforseo_base}{path}", auth=(s.dataforseo_login, s.dataforseo_password), json=[task], timeout=timeout)
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


_MAX_PAGE = 1_500_000  # bytes read from a customer page


def _public_host(host: str) -> bool:
    """True only if every address the host resolves to is on the public internet (no internal or metadata IPs)."""
    import socket
    try:
        infos = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
    except OSError:
        return False
    ips = {i[4][0] for i in infos}
    return bool(ips) and all(ipaddress.ip_address(ip.split("%")[0]).is_global for ip in ips)


def _fetch_page(url: str) -> httpx.Response | None:
    """GET a customer page safely: public addresses only (checked on every redirect), at most 1.5 MB."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; WorldDigitalBot/1.0; +https://worlddigital.ai)", "Accept": "text/html"}
    with httpx.Client(timeout=10, follow_redirects=False, headers=headers) as client:
        for _ in range(4):
            u = urlparse(url)
            if u.scheme not in ("http", "https") or not u.hostname or not _public_host(u.hostname):
                return None
            with client.stream("GET", url) as res:
                if res.is_redirect and res.headers.get("location"):
                    url = str(res.url.join(res.headers["location"]))
                    continue
                body = b""
                for chunk in res.iter_bytes():
                    body += chunk
                    if len(body) >= _MAX_PAGE:
                        break
                return httpx.Response(res.status_code, headers={"content-type": res.headers.get("content-type", "")},
                                      content=body[:_MAX_PAGE], request=res.request)
    return None


def read_site(url: str, *, fetch_base: str = "") -> dict | None:
    """Fetch a page and return its title, description, headings and body text (None if unreadable)."""
    try:
        if fetch_base:  # tests: a mock server stands in for the customer's site
            res = httpx.get(f"{fetch_base}/?u={url}", headers={"Accept": "text/html"}, follow_redirects=True, timeout=10)
        else:
            res = _fetch_page(url)
    except httpx.HTTPError:
        return None
    if res is None:
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
