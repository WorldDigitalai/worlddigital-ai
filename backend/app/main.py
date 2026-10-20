"""worlddigital.ai tools API (FastAPI).

The Cloudflare site worker forwards https://worlddigital.ai/api/tools/* here, adding
X-Internal-Token and the visitor's IP (CF-Connecting-IP).

  POST /api/tools/keywords/preview   {url, country}                  -> 3 of 10 keywords
  POST /api/tools/content/preview    {url, platform, kind, offer}    -> 1 of 5 pieces
  GET  /api/tools/job?id=            restore a preview (back from a cancelled checkout)
  POST /api/tools/checkout           {id, format}                    -> Stripe Checkout URL
  GET  /api/tools/order?session=     verify payment, return everything, email the file once
  GET  /api/tools/download?session=&format=pdf|xlsx|docx
  GET  /api/tools/health
"""
from __future__ import annotations

import hashlib
import html
import json
import logging
import re
import uuid
from functools import lru_cache

from fastapi import BackgroundTasks, Depends, FastAPI, Request
from fastapi.responses import JSONResponse, Response
from pymongo import MongoClient

from .config import Settings
from .exports import FORMATS, build_file
from .products import COUNTRIES, PLATFORMS, PRODUCTS, generate_content, generate_keywords, report_title
from .services import ApiError, create_checkout_session, get_checkout_session, parse_site_url, send_email, verify_turnstile
from .store import Store, now

log = logging.getLogger("worlddigital.api")

app = FastAPI(title="worlddigital.ai tools API", docs_url=None, redoc_url=None)


@lru_cache
def settings() -> Settings:
    return Settings()


_store: Store | None = None


def store() -> Store:
    global _store
    if _store is None:
        s = settings()
        if not s.mongodb_uri:
            raise ApiError("MONGODB_URI missing", 503, "The tool is being set up. Please try again later.")
        _store = Store(MongoClient(clean_mongo_uri(s.mongodb_uri), appname="worlddigital-ai-api", serverSelectionTimeoutMS=8000)[s.mongodb_db])
        _store.ensure_indexes()
    return _store


def set_store(st: Store | None) -> None:
    """Tests inject a mongomock-backed store here."""
    global _store
    _store = st


@app.exception_handler(ApiError)
def api_error(_req: Request, e: ApiError):
    print(f"error {e.status}: {e}")
    return JSONResponse({"error": e.public}, status_code=e.status, headers={"Cache-Control": "no-store"})


def guard(request: Request) -> None:
    s = settings()
    if s.internal_token and request.headers.get("x-internal-token") != s.internal_token:
        raise ApiError("bad internal token", 403, "Forbidden")


def client_ip(request: Request) -> str:
    return request.headers.get("cf-connecting-ip") or (request.client.host if request.client else "unknown")


def public_preview(job: dict) -> dict:
    p = PRODUCTS[job["type"]]
    locked = job["items"][p["free"]:]
    return {
        "id": job["_id"], "type": job["type"],
        "input": {k: job["input"].get(k) for k in ("domain", "country", "platform", "kind")},
        "meta": job["meta"], "items": job["items"][: p["free"]], "locked": len(locked), "total": len(job["items"]),
        "price": p["price_cents"] / 100,
        # Lengths only, so blurred rows look real without sending the content.
        "lockedShapes": [{"len": len(it["keyword"])} if job["type"] == "keywords"
                         else {"fields": [{"label": f["label"], "len": len(f["text"])} for f in it["fields"]]}
                         for it in locked],
    }


def json_ok(data, status=200):
    return JSONResponse(data, status_code=status, headers={"Cache-Control": "no-store"})


# ── Previews ────────────────────────────────────────────────────────────────

def _preview(request: Request, body: dict, kind: str):
    s, st = settings(), store()
    url, domain = parse_site_url(body.get("url"))
    inp: dict = {"url": url, "domain": domain}
    if kind == "keywords":
        inp["country"] = body.get("country") if body.get("country") in COUNTRIES else "us"
    else:
        plat = body.get("platform")
        if plat not in PLATFORMS:
            raise ApiError("bad platform", 400, "Choose a platform.")
        kinds = PLATFORMS[plat]["kinds"]
        inp.update(platform=plat, kind=body.get("kind") if body.get("kind") in kinds else kinds[0],
                   offer=str(body.get("offer") or "")[:300])

    key = f"{kind}:" + hashlib.sha256(json.dumps({**inp, "url": domain}, sort_keys=True).encode()).hexdigest()
    cached = st.get_job(st.cached_job_id(key))
    if cached:
        return json_ok(public_preview(cached))

    verify_turnstile(s, body.get("turnstile"), client_ip(request))
    if not st.hit(client_ip(request), s.preview_daily_limit):
        raise ApiError("rate limited", 429, f"You've reached today's limit of {s.preview_daily_limit} free previews. "
                                            "Come back tomorrow, or unlock a report you've already previewed.")

    result = generate_keywords(s, **inp) if kind == "keywords" else generate_content(s, **inp)
    job = {"_id": str(uuid.uuid4()), "type": kind, "input": inp, "items": result["items"], "meta": result["meta"],
           "created": now(), "paid": False}
    st.save_job(job)
    st.put_cache(key, job["_id"])
    return json_ok(public_preview(job))


@app.post("/api/tools/keywords/preview", dependencies=[Depends(guard)])
async def keywords_preview(request: Request):
    body = await request.json()
    from starlette.concurrency import run_in_threadpool
    return await run_in_threadpool(_preview, request, body if isinstance(body, dict) else {}, "keywords")


@app.post("/api/tools/content/preview", dependencies=[Depends(guard)])
async def content_preview(request: Request):
    body = await request.json()
    from starlette.concurrency import run_in_threadpool
    return await run_in_threadpool(_preview, request, body if isinstance(body, dict) else {}, "content")


@app.get("/api/tools/job", dependencies=[Depends(guard)])
def get_job(id: str = ""):
    job = store().get_job(id)
    if not job:
        raise ApiError("no job", 404, "That preview has expired. Please generate a new one.")
    return json_ok(public_preview(job))


# ── Checkout and orders ─────────────────────────────────────────────────────

@app.post("/api/tools/checkout", dependencies=[Depends(guard)])
async def checkout(request: Request):
    body = await request.json()
    s, st = settings(), store()
    job = st.get_job((body or {}).get("id"))
    if not job:
        raise ApiError("no job", 404, "That preview has expired. Please generate a new one.")
    fmt = body.get("format") if body.get("format") in FORMATS else "pdf"
    p = PRODUCTS[job["type"]]
    detail = (f"{job['input']['domain']} · {job['meta']['country']}" if job["type"] == "keywords"
              else f"{job['meta']['platform']} {job['meta']['kind']}s for {job['input']['domain']}")
    origin = s.public_origin.rstrip("/")
    session = create_checkout_session(s, {
        "mode": "payment",
        "client_reference_id": job["_id"],
        "success_url": f"{origin}{p['path']}?order={{CHECKOUT_SESSION_ID}}#tool",
        "cancel_url": f"{origin}{p['path']}?preview={job['_id']}#tool",
        "line_items": {"0": {"quantity": 1, "price_data": {
            "currency": "usd", "unit_amount": p["price_cents"], "tax_behavior": s.stripe_tax_behavior,
            "product_data": {"name": p["name"], "description": f"{detail} · {FORMATS[fmt][2]} file"}}}},
        "automatic_tax": {"enabled": s.stripe_automatic_tax},
        "metadata": {"job_id": job["_id"], "format": fmt, "product": job["type"], "domain": job["input"]["domain"]},
        "payment_intent_data": {"description": f"{p['name']} – {job['input']['domain']}",
                                "metadata": {"job_id": job["_id"], "product": job["type"]}},
        "customer_creation": "if_required",
    })
    job["format"] = fmt
    st.save_job(job)
    return json_ok({"url": session["url"]})


_SESSION_RE = re.compile(r"^cs_(test|live)_[A-Za-z0-9]+$")


def paid_job(session_id: str) -> dict:
    s, st = settings(), store()
    if not _SESSION_RE.match(session_id or ""):
        raise ApiError("bad session", 400, "That order link isn't valid.")
    jid = st.paid_job_id(session_id)
    if jid:
        job = st.get_job(jid)
        if job and job.get("paid"):
            return job
    try:
        sess = get_checkout_session(s, session_id)
    except ApiError as e:
        raise ApiError(str(e), 404, "We couldn't find that order. Email ahmad.awwad@worlddigital.ai with your receipt "
                                    "and we'll sort it out.") from e
    if sess.get("payment_status") != "paid":
        raise ApiError("unpaid", 402, "We haven't received this payment yet. If you just paid, refresh in a moment.")
    job = st.get_job((sess.get("metadata") or {}).get("job_id"))
    if not job:
        raise ApiError("job gone", 410, "We couldn't find this order's report. Email ahmad.awwad@worlddigital.ai with "
                                        "your receipt and we'll send it right away.")
    if not job.get("paid"):
        job.update(paid=True, session_id=session_id, paid_at=now(),
                   email=(sess.get("customer_details") or {}).get("email") or sess.get("customer_email"),
                   format=(sess.get("metadata") or {}).get("format") or job.get("format") or "pdf")
        st.save_job(job)
    st.put_paid(session_id, job["_id"])
    return job


def deliver_email(job: dict) -> None:
    s, st = settings(), store()
    if not job.get("email") or not st.mark_emailed(job["_id"]):
        return
    try:
        data, filename, _ = build_file(job, job.get("format") or "pdf")
        what = "10-keyword research report" if job["type"] == "keywords" else f"{job['meta']['platform']} {job['meta']['kind']} pack"
        link = f"{s.public_origin.rstrip('/')}{PRODUCTS[job['type']]['path']}?order={job['session_id']}#tool"
        d = html.escape(job["input"]["domain"])
        res = send_email(s, to=job["email"], subject=f"Your {what} for {job['input']['domain']}", attachment=(filename, data), html=(
            '<div style="font-family:Arial,sans-serif;color:#0E1A2B;line-height:1.5;max-width:560px">'
            f"<p>Hi,</p><p>Thanks for your purchase. Your <b>{html.escape(what)}</b> for <b>{d}</b> is attached as a "
            f"{FORMATS[job.get('format') or 'pdf'][2]} file.</p>"
            f'<p>You can also download it as PDF, Excel or Word any time from <a href="{html.escape(link)}">your order page</a>.</p>'
            "<p>Questions, or want help putting it to work? Just reply to this email.</p><p>— WorldDigital.ai</p></div>"))
        if res.get("skipped"):
            st.unmark_emailed(job["_id"])
    except Exception as e:  # noqa: BLE001 - never fail the order page because of email
        print("email failed:", e)
        st.unmark_emailed(job["_id"])


@app.get("/api/tools/order", dependencies=[Depends(guard)])
def order(background: BackgroundTasks, session: str = ""):
    job = paid_job(session)
    background.add_task(deliver_email, job)
    return json_ok({"id": job["_id"], "type": job["type"], "input": {"domain": job["input"]["domain"]}, "meta": job["meta"],
                    "items": job["items"], "format": job.get("format"), "email": job.get("email"),
                    "session": job["session_id"], "paid": True})


@app.get("/api/tools/download", dependencies=[Depends(guard)])
def download(session: str = "", format: str = ""):
    job = paid_job(session)
    data, filename, ctype = build_file(job, format or job.get("format") or "pdf")
    return Response(data, media_type=ctype, headers={
        "Content-Disposition": f'attachment; filename="{filename}"', "Cache-Control": "private, no-store"})


def clean_mongo_uri(raw: str) -> str:
    """Accept a pasted Atlas string as-is: trim quotes/spaces, drop <> around the password, encode user and password."""
    from urllib.parse import quote_plus, unquote_plus
    u = (raw or "").strip().strip("'\"").replace("\n", "").replace("\r", "")
    if "://" not in u or "@" not in u:
        return u
    scheme, rest = u.split("://", 1)
    userinfo, host = rest.rsplit("@", 1)
    user, _, pw = userinfo.partition(":")
    pw = pw.strip().removeprefix("<").removesuffix(">")
    return f"{scheme}://{quote_plus(unquote_plus(user.strip()))}:{quote_plus(unquote_plus(pw))}@{host.strip()}"


@app.get("/api/tools/health")
def health():
    s = settings()
    mongo, mongo_error = False, None
    try:
        store().db.command("ping")
        mongo = True
    except Exception as e:  # noqa: BLE001
        log.warning("mongodb ping failed: %s", type(e).__name__)
        # Never echo the message: it can contain the host or credentials.
        mongo_error = type(e).__name__
    if not s.mongodb_uri.strip().strip("'\"").startswith(("mongodb://", "mongodb+srv://")):
        mongo_error = "MONGODB_URI is not a connection string (it must start with mongodb+srv://)"
    key = s.stripe_secret_key
    return {"ok": True, "configured": {
        "mongodb": mongo, "openai": bool(s.openai_api_key), "dataforseo": bool(s.dataforseo_login and s.dataforseo_password),
        "stripe": bool(key), "stripe_mode": ("live" if key.startswith(("sk_live", "rk_live")) else "test") if key else None,
        "resend": bool(s.resend_api_key), "turnstile": bool(s.turnstile_secret), "internal_token": bool(s.internal_token)}, "mongodb_error": mongo_error}
