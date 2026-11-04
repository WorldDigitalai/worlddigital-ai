"""worlddigital.ai tools API (FastAPI).

The Cloudflare site worker forwards https://worlddigital.ai/api/tools/* here, adding
X-Internal-Token and the visitor's IP (CF-Connecting-IP).

  POST /api/tools/keywords/preview   {url, country}                  -> 3 of 10 keywords
  POST /api/tools/content/preview    {url, platform, kind, offer}    -> 1 of 5 pieces
  GET  /api/tools/job?id=            restore a preview (back from a cancelled checkout)
  POST /api/tools/checkout           {id, format}                    -> Stripe Checkout URL
  GET  /api/tools/order?session=     verify payment, return everything, email the file once
  GET  /api/tools/download?session=&format=pdf|xlsx|docx
  POST /api/tools/chat               {messages}                      -> AI Ahmad reply (site chat widget)
  GET  /api/tools/health

Blog editor only (the site forwards these from /blog-admin/ai/* for a signed-in editor; the public
/api/tools proxy never reaches them):
  POST /api/admin/blog/research      {topic, country, competitors}   -> trends, keywords, SERP, post ideas
  POST /api/admin/blog/draft         {title, keyword, type, competitors, notes, country, words} -> full post
  POST /api/admin/blog/social        {title, excerpt, url, keyword, category} -> one caption per platform
  POST /api/admin/blog/image         {title, keyword, idea}               -> cover image (JPEG, base64)
  POST /api/tools/billing/plan       {name, email, company, website, plan}  -> Mercury customer + first invoice (emailed)
  POST /api/tools/billing/invoice    {name, email, company, items[], due_days, memo} -> one-off Mercury invoice
  POST /api/tools/billing/run        daily: renewal invoices, paid-status sync, receipts
  POST /api/tools/billing/cancel     {id}
  GET  /api/tools/billing            subscriptions + invoices
  (billing paths are blocked on the public site proxy; only the site's own form handler, admin and cron call them)
"""
from __future__ import annotations

import hashlib
import hmac
import html
import json
import logging
import re
import uuid
from functools import lru_cache

from fastapi import BackgroundTasks, Depends, FastAPI, Request
from fastapi.responses import JSONResponse, Response
from starlette.concurrency import run_in_threadpool
from pymongo import MongoClient

from . import blog_ai, chat
from .rag import Rag
from .billing import Billing
from .config import Settings
from .exports import FORMATS, build_file
from .products import COUNTRIES, PLATFORMS, PRODUCTS, generate_content, generate_keywords, report_title
from .services import ApiError, create_checkout_session, get_checkout_session, parse_site_url, send_email, verify_turnstile
from .store import Store, now

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
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
        _store = Store(MongoClient(clean_mongo_uri(s.mongodb_uri), tz_aware=True, appname="worlddigital-ai-api", serverSelectionTimeoutMS=8000)[s.mongodb_db])
        _store.ensure_indexes()
    return _store


def set_store(st: Store | None) -> None:
    """Tests inject a mongomock-backed store here."""
    global _store
    _store = st


@app.exception_handler(ApiError)
def api_error(_req: Request, e: ApiError):
    log.error("error %s: %s", e.status, e)
    # Cloudflare replaces 502 bodies with its own page, so upstream failures go out as 503.
    return JSONResponse({"error": e.public}, status_code=503 if e.status == 502 else e.status, headers={"Cache-Control": "no-store"})


def guard(request: Request) -> None:
    s = settings()
    want = (s.internal_token or "").strip()
    got = (request.headers.get("x-internal-token") or "").strip()
    if not want:  # fail closed: never serve the tools without the site's shared token configured
        raise ApiError("TOOLS_API_TOKEN missing", 503, "The tool is being set up. Please try again later.")
    if not hmac.compare_digest(got.encode(), want.encode()):
        log.warning("bad internal token (got %d chars, want %d)", len(got), len(want))
        raise ApiError("bad internal token", 403, "Forbidden")


def client_ip(request: Request) -> str:
    return request.headers.get("cf-connecting-ip") or (request.client.host if request.client else "unknown")


async def body_of(request: Request) -> dict:
    """The JSON body as a dict; a malformed body is a 400, not a server error."""
    try:
        body = await request.json()
    except Exception as e:  # noqa: BLE001
        raise ApiError("bad json", 400, "Something was wrong with that request. Please try again.") from e
    return body if isinstance(body, dict) else {}


def public_preview(job: dict) -> dict:
    p = PRODUCTS[job["type"]]
    free = job.get("free", p["free"])
    locked = job["items"][free:]
    return {
        "id": job["_id"], "type": job["type"],
        "input": {k: job["input"].get(k) for k in ("domain", "country", "platform", "kind")},
        "meta": job["meta"], "items": job["items"][:free], "locked": len(locked), "total": len(job["items"]),
        "price": p["price_cents"] / 100,
        "notice": job.get("_notice"),
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
    test_site = domain in s.test_domains
    used = None if test_site else st.free_used(kind, domain)
    notice = None
    if used:
        what = "keyword preview" if kind == "keywords" else "content preview"
        notice = (f"A free {what} for {domain} has already been generated. "
                  f"Each website gets one free preview; unlock the full report to get more.")
        prior = st.get_job(used.get("job_id"))
        cached = st.get_job(st.cached_job_id(key))
        same = cached or (prior if prior and prior["input"] == inp else None)
        if same:
            return json_ok(public_preview({**same, "_notice": notice}))
    else:
        cached = st.get_job(st.cached_job_id(key))
        if cached:
            return json_ok(public_preview(cached))

    verify_turnstile(s, body.get("turnstile"), client_ip(request))
    if not test_site and not st.hit(client_ip(request), s.preview_daily_limit):
        raise ApiError("rate limited", 429, f"You've reached today's limit of {s.preview_daily_limit} free previews. "
                                            "Come back tomorrow, or unlock a report you've already previewed.")

    result = generate_keywords(s, **inp) if kind == "keywords" else generate_content(s, **inp)
    job = {"_id": str(uuid.uuid4()), "type": kind, "input": inp, "items": result["items"], "meta": result["meta"],
           "created": now(), "paid": False}
    if used:
        job["free"] = 0  # free preview already used for this website: everything stays locked until paid
    st.save_job(job)
    st.put_cache(key, job["_id"])
    if not test_site and not used:
        st.mark_free(kind, domain, job["_id"])
    return json_ok(public_preview({**job, "_notice": notice}))


@app.post("/api/tools/keywords/preview", dependencies=[Depends(guard)])
async def keywords_preview(request: Request):
    body = await body_of(request)
    return await run_in_threadpool(_preview, request, body, "keywords")


@app.post("/api/tools/content/preview", dependencies=[Depends(guard)])
async def content_preview(request: Request):
    body = await body_of(request)
    return await run_in_threadpool(_preview, request, body, "content")


@app.get("/api/tools/job", dependencies=[Depends(guard)])
def get_job(id: str = ""):
    job = store().get_job(id)
    if not job:
        raise ApiError("no job", 404, "That preview has expired. Please generate a new one.")
    return json_ok(public_preview(job))


# ── Checkout and orders ─────────────────────────────────────────────────────

@app.post("/api/tools/checkout", dependencies=[Depends(guard)])
async def checkout(request: Request):
    body = await body_of(request)
    return await run_in_threadpool(_checkout, body)


def _checkout(body: dict):
    s, st = settings(), store()
    job = st.get_job(body.get("id"))
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
        raise ApiError(str(e), 404, "We couldn't find that order. Email support@worlddigital.ai with your receipt "
                                    "and we'll sort it out.") from e
    if sess.get("payment_status") != "paid":
        raise ApiError("unpaid", 402, "We haven't received this payment yet. If you just paid, refresh in a moment.")
    job = st.get_job((sess.get("metadata") or {}).get("job_id"))
    if not job:
        raise ApiError("job gone", 410, "We couldn't find this order's report. Email support@worlddigital.ai with "
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
        log.error("delivery email failed: %s", e)
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


MONGO_USER = "ahmadawwad_db_user"
MONGO_HOST = "worlddigital-ai.dfgex0b.mongodb.net"


# ── Blog editor AI assistant ────────────────────────────────────────────────

def _strs(v, n=6):
    return [str(x)[:40] for x in v if isinstance(x, str) and x.strip()][:n] if isinstance(v, list) else []


@app.post("/api/admin/blog/research", dependencies=[Depends(guard)])
async def blog_research(request: Request):
    b = await body_of(request)
    return json_ok(await run_in_threadpool(blog_ai.research, settings(), topic=str(b.get("topic") or "")[:100],
                                           country=str(b.get("country") or "us"), competitors=_strs(b.get("competitors"))))


@app.post("/api/admin/blog/draft", dependencies=[Depends(guard)])
async def blog_draft(request: Request):
    b = await body_of(request)
    return json_ok(await run_in_threadpool(
        blog_ai.draft, settings(), title=str(b.get("title") or ""), keyword=str(b.get("keyword") or ""),
        type=str(b.get("type") or "how-to"), competitors=_strs(b.get("competitors"), 5),
        notes=str(b.get("notes") or "")[:1000], country=str(b.get("country") or "us"), words=b.get("words") or 1600,
        facts=(await run_in_threadpool(_rag_facts, f"{b.get('title') or ''} {b.get('keyword') or ''}", 6, 900))[0]))


@app.post("/api/admin/blog/social", dependencies=[Depends(guard)])
async def blog_social(request: Request):
    b = await body_of(request)
    return json_ok(await run_in_threadpool(blog_ai.social, settings(), title=str(b.get("title") or ""),
                                           excerpt=str(b.get("excerpt") or "")[:500], url=str(b.get("url") or "")[:300],
                                           keyword=str(b.get("keyword") or "")[:100], category=str(b.get("category") or "")[:60]))


@app.post("/api/admin/blog/image", dependencies=[Depends(guard)])
async def blog_image(request: Request):
    b = await body_of(request)
    return json_ok(await run_in_threadpool(blog_ai.cover_image, settings(), title=str(b.get("title") or "")[:140],
                                           keyword=str(b.get("keyword") or "")[:100], idea=str(b.get("idea") or "")[:200]))


# ── Site audit (our own domains only) ───────────────────────────────────────

def _run_audit(domain: str) -> None:
    from . import audit
    st = store()
    try:
        result = audit.run(settings(), domain)
        st.db["tool_audit"].update_one({"_id": domain}, {"$set": {"state": "done", "result": result, "finished": now()}})
    except Exception as e:  # noqa: BLE001
        log.exception("audit failed")
        st.db["tool_audit"].update_one({"_id": domain}, {"$set": {"state": "error", "error": str(e)[:500], "finished": now()}})


@app.get("/api/tools/site-audit", dependencies=[Depends(guard)])
def site_audit(background: BackgroundTasks, domain: str = "worlddigital.ai", fresh: int = 0):
    s, st = settings(), store()
    domain = domain.lower().removeprefix("www.")
    if domain not in s.test_domains:
        raise ApiError("audit domain", 403, "Audits run only for our own sites.")
    doc = st.db["tool_audit"].find_one({"_id": domain})
    from datetime import timedelta, timezone
    if doc and doc.get("started") and doc["started"].tzinfo is None:
        doc["started"] = doc["started"].replace(tzinfo=timezone.utc)
    stale = not doc or (doc.get("state") != "running" and (now() - doc.get("started", now())).total_seconds() > 6 * 3600)
    stuck = doc and doc.get("state") == "running" and (now() - doc["started"]).total_seconds() > 900
    if stale or stuck or (fresh and doc and doc.get("state") != "running"
                          and (now() - doc.get("started", now())) > timedelta(minutes=30)):
        st.db["tool_audit"].replace_one({"_id": domain}, {"_id": domain, "state": "running", "started": now()}, upsert=True)
        background.add_task(_run_audit, domain)
        return json_ok({"state": "running"})
    doc.pop("_id", None)
    return json_ok({k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in doc.items()})


def clean_mongo_uri(raw: str) -> str:
    """Accept a pasted Atlas string as-is: trim quotes/spaces, drop <> around the password, encode user and password."""
    from urllib.parse import quote_plus, unquote_plus
    u = (raw or "").strip().strip("'\"").replace("\n", "").replace("\r", "")
    if not u.startswith(("mongodb://", "mongodb+srv://")):
        # Only the password was saved: build the Atlas address from the known user and cluster.
        u = (f"mongodb+srv://{MONGO_USER}:{u.removeprefix('<').removesuffix('>')}@{MONGO_HOST}"
             "/?retryWrites=true&w=majority&appName=worlddigital-ai")
    if "@" not in u:
        return u
    scheme, rest = u.split("://", 1)
    userinfo, host = rest.rsplit("@", 1)
    user, _, pw = userinfo.partition(":")
    pw = pw.strip().removeprefix("<").removesuffix(">")
    return f"{scheme}://{quote_plus(unquote_plus(user.strip()))}:{quote_plus(unquote_plus(pw))}@{host.strip()}"


_billing: Billing | None = None


def _billing_call(name, *args):
    """Billing endpoints are internal (token-guarded), so unexpected errors are returned with their cause."""
    # A freshly started instance can take a while to open its first MongoDB connection through the NAT:
    # make sure the database answers before anything is sent to Mercury, so a slow start never half-creates an invoice.
    import time
    for attempt in range(3):
        try:
            store().db.command("ping")
            break
        except Exception as e:  # noqa: BLE001
            if attempt == 2:
                raise ApiError(f"billing db {type(e).__name__}: {e}", 503, "Billing is busy right now. Please try again in a minute.")
            time.sleep(2)
    try:
        return getattr(billing(), name)(*args)
    except ApiError:
        raise
    except Exception as e:  # noqa: BLE001
        log.exception("billing error")
        raise ApiError(f"billing {type(e).__name__}: {e}", 500, f"Billing error: {type(e).__name__}: {str(e)[:300]}")


def billing() -> Billing:
    global _billing
    if _billing is None:
        _billing = Billing(settings(), store().db)
        _billing.ensure_indexes()
    return _billing


@app.post("/api/tools/billing/plan", dependencies=[Depends(guard)])
async def billing_plan(request: Request):
    return json_ok(await run_in_threadpool(_billing_call, "start_plan", await body_of(request)))


@app.post("/api/tools/billing/invoice", dependencies=[Depends(guard)])
async def billing_invoice(request: Request):
    return json_ok(await run_in_threadpool(_billing_call, "one_off", await body_of(request)))


@app.post("/api/tools/billing/run", dependencies=[Depends(guard)])
async def billing_run():
    return json_ok(await run_in_threadpool(_billing_call, "run"))


@app.post("/api/tools/billing/cancel", dependencies=[Depends(guard)])
async def billing_cancel(request: Request):
    return json_ok(await run_in_threadpool(_billing_call, "cancel_plan", str((await body_of(request)).get("id") or "")))


@app.post("/api/tools/billing/cancel-invoice", dependencies=[Depends(guard)])
async def billing_cancel_invoice(request: Request):
    return json_ok(await run_in_threadpool(_billing_call, "cancel_invoice", str((await body_of(request)).get("number") or "")))


@app.get("/api/tools/billing", dependencies=[Depends(guard)])
async def billing_overview():
    return json_ok(await run_in_threadpool(_billing_call, "overview"))


# ── RAG: knowledge base (docs/rag.md) ──────────────────────────────────────
# Internal, token-guarded (the public /api/tools proxy never reaches these):
#   GET  /api/admin/rag                  monitoring          POST /api/admin/rag/index    {full, run, batch, trigger}
#   POST /api/admin/rag/index-url        {url}               POST /api/admin/rag/search   {q, k, sources, types, categories, language}
#   POST /api/admin/rag/ask              {q, sources, ...}   POST /api/admin/rag/eval     golden questions
#   GET  /api/admin/rag/questions?days=  chat questions      GET  /api/admin/rag/history  sync runs
#   POST /api/admin/rag/internal         {action: list|add-doc|remove-doc}   private company knowledge
#   POST /api/admin/rag/tenants          {action, ...}       customer knowledge bases
#   POST /api/rag/search                 {query, limit, types, categories, language}   for our own agents
#   POST /api/rag/answer                 {query}   public site knowledge only; the worker exposes it, rate-limited per IP
def rag() -> Rag:
    return Rag(settings(), store().db)


def _rag_call(fn):
    """Internal, token-guarded endpoints: report the cause of unexpected errors."""
    try:
        return fn()
    except ApiError:
        raise
    except Exception as e:  # noqa: BLE001
        log.exception("rag error")
        raise ApiError(f"rag {type(e).__name__}: {e}", 500, f"Knowledge base error: {type(e).__name__}: {str(e)[:300]}")


def _rag_facts(query: str, k: int = 5, chars: int = 900):
    """Never lets the knowledge base break chat or drafts: on any problem, answer without it."""
    try:
        return rag().context(query, k, chars)
    except Exception as e:  # noqa: BLE001
        log.warning("rag context skipped: %s", e)
        return "", []


def _rag_filters(b: dict) -> dict:
    return {"types": b.get("types") or b.get("content_types"), "categories": b.get("categories"), "language": b.get("language")}


def _rag_query(b: dict) -> str:
    q = " ".join(str(b.get("q") or b.get("query") or "").split())
    if not q:
        raise ApiError("empty query", 400, "Type a question first.")
    if len(q) > 500:
        raise ApiError("long query", 400, "Please keep the question under 500 characters.")
    return q


@app.get("/api/admin/rag", dependencies=[Depends(guard)])
async def rag_status():
    return json_ok(await run_in_threadpool(_rag_call, lambda: rag().status()))


@app.get("/api/admin/rag/history", dependencies=[Depends(guard)])
async def rag_history(limit: int = 30):
    return json_ok({"runs": await run_in_threadpool(_rag_call, lambda: rag().sync_history(max(1, min(int(limit), 100))))})


@app.post("/api/admin/rag/index", dependencies=[Depends(guard)])
async def rag_index(request: Request):
    b = await body_of(request)
    if str(b.get("source") or "ai") != "ai":
        raise ApiError("bad source", 400, "Unknown site.")
    trigger = str(b.get("trigger") or "manual")[:20]
    return json_ok(await run_in_threadpool(_rag_call, lambda: rag().index(
        "ai", full=b.get("full") is True, run_id=b.get("run") or None, batch=max(0, min(int(b.get("batch") or 0), 100)), trigger=trigger)))


@app.post("/api/admin/rag/index-url", dependencies=[Depends(guard)])
async def rag_index_url(request: Request):
    b = await body_of(request)
    return json_ok(await run_in_threadpool(_rag_call, lambda: rag().index_url(str(b.get("url") or ""), str(b.get("trigger") or "publish")[:20])))


@app.post("/api/admin/rag/search", dependencies=[Depends(guard)])
async def rag_search(request: Request):
    b = await body_of(request)
    q = _rag_query(b)
    return json_ok({"hits": await run_in_threadpool(_rag_call, lambda: rag().search(
        q, max(1, min(int(b.get("k") or 6), 12)), b.get("sources"), allow_internal=True, **_rag_filters(b)))})


@app.post("/api/admin/rag/ask", dependencies=[Depends(guard)])
async def rag_ask(request: Request):
    b = await body_of(request)
    q = _rag_query(b)
    return json_ok(await run_in_threadpool(_rag_call, lambda: rag().answer(q, sources=b.get("sources"), allow_internal=True, **_rag_filters(b))))


@app.post("/api/admin/rag/eval", dependencies=[Depends(guard)])
async def rag_eval():
    return json_ok(await run_in_threadpool(_rag_call, lambda: rag().evaluate()))


@app.get("/api/admin/rag/questions", dependencies=[Depends(guard)])
async def rag_questions(days: int = 30):
    return json_ok(await run_in_threadpool(_rag_call, lambda: rag().questions_report(days)))


@app.post("/api/admin/rag/internal", dependencies=[Depends(guard)])
async def rag_internal(request: Request):
    b = await body_of(request)
    ops = {
        "list": lambda r: {"docs": r.internal_docs()},
        "add-doc": lambda r: r.internal_add_doc(b.get("title") or "", b.get("text") or ""),
        "remove-doc": lambda r: r.internal_remove_doc(str(b.get("url") or "")),
    }
    a = str(b.get("action") or "list")
    if a not in ops:
        raise ApiError("bad action", 400, "Unknown action.")
    return json_ok(await run_in_threadpool(_rag_call, lambda: ops[a](rag())))


@app.post("/api/admin/rag/tenants", dependencies=[Depends(guard)])
async def rag_tenants(request: Request):
    b = await body_of(request)
    a, t = str(b.get("action") or "list"), str(b.get("tenant") or "")
    ops = {
        "list": lambda r: {"tenants": r.tenant_list()},
        "create": lambda r: r.tenant_create(b.get("name"), b.get("website") or "", b.get("note") or ""),
        "docs": lambda r: {"docs": r.tenant_docs(t)},
        "add-doc": lambda r: r.tenant_add_doc(t, b.get("title") or "", b.get("text") or ""),
        "remove-doc": lambda r: r.tenant_remove_doc(t, str(b.get("url") or "")),
        "index-site": lambda r: r.tenant_index_site(t),
        "delete": lambda r: r.tenant_delete(t),
        "ask": lambda r: r.answer(_rag_query(b), sources=[f"tenant:{t}"]),
    }
    if a not in ops:
        raise ApiError("bad action", 400, "Unknown action.")
    return json_ok(await run_in_threadpool(_rag_call, lambda: ops[a](rag())))


@app.post("/api/rag/search", dependencies=[Depends(guard)])
async def rag_api_search(request: Request):
    """Retrieval over the public site for our own agents (spec: POST /api/rag/search)."""
    b = await body_of(request)
    q = _rag_query(b)
    hits = await run_in_threadpool(_rag_call, lambda: rag().search(q, max(1, min(int(b.get("limit") or 5), 12)), ["ai"], **_rag_filters(b)))
    return json_ok({"query": q, "results": [{"url": h["url"], "title": h["title"], "section": h.get("section"),
                                             "content_type": h.get("content_type"), "score": h.get("score"),
                                             "content": h["text"]} for h in hits]})


@app.post("/api/rag/answer", dependencies=[Depends(guard)])
async def rag_api_answer(request: Request):
    """Grounded answers from the public site only, with source links. Reached through the site worker."""
    s = settings()
    b = await body_of(request)
    q = _rag_query(b)
    ip = client_ip(request)
    if not store().hit("rag:" + ip, s.rag_api_daily_limit) or not store().hit("rag:all", s.rag_api_daily_total):
        raise ApiError("rate limited", 429, "Daily question limit reached. Please try again tomorrow, or see https://worlddigital.ai/contact.")
    out = await run_in_threadpool(_rag_call, lambda: rag().answer(q, 6, ["ai"], public=True, **_rag_filters(b)))
    await run_in_threadpool(lambda: rag().log_question(q, out["answer"], out["covered"],
                                                       [{"url": x["url"]} for x in out["sources"]], channel="api"))
    return json_ok({"query": q, **out})


# ── Site chat (AI Ahmad) ────────────────────────────────────────────────────
@app.post("/api/tools/chat", dependencies=[Depends(guard)])
async def chat_reply(request: Request):
    s, body = settings(), await body_of(request)
    messages = chat.clean_messages(body.get("messages"))
    if not store().hit("chat:" + client_ip(request), s.chat_daily_limit):
        raise ApiError("rate limited", 429, "You've reached today's chat limit. Please use the contact page and we'll reply within one business day.")
    facts, hits = await run_in_threadpool(_rag_facts, messages[-1]["content"], 4, 700)
    text, covered = await run_in_threadpool(chat.reply, s, messages, facts)
    await run_in_threadpool(lambda: rag().log_question(messages[-1]["content"], text, covered, hits))
    return json_ok({"reply": text})


@app.get("/api/tools/health")
def health(request: Request):
    s = settings()
    got = (request.headers.get("x-internal-token") or "").strip()
    token_match = bool(got) and hmac.compare_digest(got.encode(), (s.internal_token or "").strip().encode())
    mongo, mongo_error = False, None
    try:
        store().db.command("ping")
        mongo = True
    except Exception as e:  # noqa: BLE001
        log.warning("mongodb ping failed: %s", type(e).__name__)
        # Never echo the message: it can contain the host or credentials.
        mongo_error = "wrong password" if type(e).__name__ == "OperationFailure" else type(e).__name__
    key = s.stripe_secret_key
    return {"ok": True, "site_token_match": token_match, "mongodb_error": mongo_error, "configured": {
        "mongodb": mongo,
        # True only when the value has the shape of a real key (catches a pasted placeholder name).
        "openai": s.openai_api_key.startswith("sk-"),
        "dataforseo": bool(s.dataforseo_password) and "@" in s.dataforseo_login,
        "stripe": key.startswith(("sk_test_", "sk_live_", "rk_test_", "rk_live_")),
        "stripe_mode": ("live" if key.startswith(("sk_live", "rk_live")) else "test") if key else None,
        "mercury": bool(s.mercury_api_token and s.mercury_account_id),
        "resend": s.resend_api_key.startswith("re_"), "turnstile": bool(s.turnstile_secret),
        "internal_token": bool(s.internal_token)}}
