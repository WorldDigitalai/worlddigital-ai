"""Collects daily numbers from every connected service into rag-independent rows, so the admin Analytics page can graph them.

  provider_metrics   one row per provider and day:  {_id: "stripe:2026-11-20", provider, day, m: {metric: number}}
  provider_status    one row per provider:           {_id: "stripe", state: ok | needs_key | error, message, at}

Run every 15 minutes by the site worker (POST /api/admin/collect) and by the "Collect now" button. Every collector is
isolated: one that fails records its own error and never stops the others. A provider without its key shows exactly
which variable to add; nothing is ever invented. Re-collected days overwrite themselves, so running twice is safe.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone

import httpx

from .config import Settings

log = logging.getLogger("collect")
WINDOW_DAYS = 35   # days re-read from each provider on every run


def _day(ts: float | int) -> str:
    return datetime.fromtimestamp(float(ts), timezone.utc).strftime("%Y-%m-%d")


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _start_ts(days: int = WINDOW_DAYS) -> int:
    d = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
    return int(d.timestamp())


def _get(url: str, **kw) -> dict:
    r = httpx.get(url, timeout=kw.pop("timeout", 25), **kw)
    if r.status_code >= 400:
        raise RuntimeError(f"{url.split('?')[0].split('//')[1][:60]} answered {r.status_code}: {r.text[:160]}")
    return r.json()


# ---- collectors: each returns {day: {metric: value}} ---------------------------------------------------------------

def stripe(s: Settings, db) -> dict:
    auth = (s.stripe_secret_key, "")
    out: dict = {}
    after = None
    for _ in range(30):   # up to 3000 charges
        q = {"limit": 100, "created[gte]": _start_ts()}
        if after:
            q["starting_after"] = after
        data = _get(f"{s.stripe_base}/v1/charges", params=q, auth=auth)
        for c in data.get("data") or []:
            m = out.setdefault(_day(c["created"]), {})
            if c.get("paid") and c.get("status") == "succeeded" and (c.get("currency") or "usd") == "usd":
                m["payments"] = m.get("payments", 0) + 1
                m["revenue_usd"] = round(m.get("revenue_usd", 0) + (c.get("amount") or 0) / 100, 2)
                m["refunded_usd"] = round(m.get("refunded_usd", 0) + (c.get("amount_refunded") or 0) / 100, 2)
            elif c.get("status") == "failed":
                m["failed"] = m.get("failed", 0) + 1
        if not data.get("has_more") or not data.get("data"):
            break
        after = data["data"][-1]["id"]
    bal = _get(f"{s.stripe_base}/v1/balance", auth=auth)
    usd = lambda arr: sum(x.get("amount", 0) for x in arr or [] if x.get("currency") == "usd") / 100  # noqa: E731
    out.setdefault(_today(), {}).update(balance_available_usd=round(usd(bal.get("available")), 2), balance_pending_usd=round(usd(bal.get("pending")), 2))
    return out


def resend(s: Settings, db) -> dict:
    out: dict = {}
    after, start = None, _start_ts()
    for _ in range(40):   # up to 4000 emails
        q = {"limit": 100, **({"after": after} if after else {})}
        data = _get(f"{s.resend_base}/emails", params=q, headers={"Authorization": f"Bearer {s.resend_api_key}"})
        rows = data.get("data") or []
        for e in rows:
            try:
                ts = datetime.fromisoformat(str(e["created_at"]).replace(" ", "T").replace("+00", "+00:00").replace("Z", "+00:00")).timestamp()
            except (KeyError, ValueError):
                continue
            if ts < start:
                continue
            m = out.setdefault(_day(ts), {})
            m["sent"] = m.get("sent", 0) + 1
            ev = str(e.get("last_event") or "")
            for k, names in (("delivered", ("delivered", "opened", "clicked")), ("opened", ("opened", "clicked")), ("clicked", ("clicked",)),
                             ("bounced", ("bounced",)), ("complained", ("complained",))):
                if ev in names:
                    m[k] = m.get(k, 0) + 1
        if not data.get("has_more") or not rows or min(str(e.get("created_at") or "9") for e in rows) < _day(start):
            break
        after = rows[-1]["id"]
    return out


def dataforseo(s: Settings, db) -> dict:
    d = _get(f"{s.dataforseo_base}/v3/appendix/user_data", auth=(s.dataforseo_login, s.dataforseo_password))
    money = (((d.get("tasks") or [{}])[0].get("result") or [{}])[0].get("money") or {})
    if "balance" not in money:
        raise RuntimeError("DataForSEO did not return a balance")
    return {_today(): {"balance_usd": round(float(money["balance"]), 2)}}


def openai_billing(s: Settings, db) -> dict:
    key = _env("OPENAI_ADMIN_KEY")
    d = _get(f"{s.openai_base}/v1/organization/costs", params={"start_time": _start_ts(), "bucket_width": "1d", "limit": WINDOW_DAYS},
             headers={"Authorization": f"Bearer {key}"})
    return {_day(b["start_time"]): {"billed_usd": round(sum(float((r.get("amount") or {}).get("value") or 0) for r in b.get("results") or []), 4)}
            for b in d.get("data") or []}


def anthropic_billing(s: Settings, db) -> dict:
    key = _env("ANTHROPIC_ADMIN_KEY")
    start = datetime.fromtimestamp(_start_ts(), timezone.utc).strftime("%Y-%m-%dT00:00:00Z")
    d = _get("https://api.anthropic.com/v1/organizations/cost_report", params={"starting_at": start, "bucket_width": "1d", "limit": WINDOW_DAYS},
             headers={"x-api-key": key, "anthropic-version": "2023-06-01"})
    # amounts are decimal strings in cents
    return {str(b["starting_at"])[:10]: {"billed_usd": round(sum(float(r.get("amount") or 0) for r in b.get("results") or []) / 100, 4)} for b in d.get("data") or []}


def mercury(s: Settings, db) -> dict:
    d = _get("https://api.mercury.com/api/v1/accounts", headers={"Authorization": f"Bearer {_env('MERCURY_API_TOKEN')}"})
    accts = [a for a in d.get("accounts") or [] if str(a.get("status") or "active").lower() == "active"]
    return {_today(): {"balance_usd": round(sum(float(a.get("availableBalance") or 0) for a in accts), 2), "accounts": len(accts)}}


def cloudflare(s: Settings, db) -> dict:
    q = ("query($z:String!,$d:Date!){viewer{zones(filter:{zoneTag:$z}){httpRequests1dGroups(limit:100,filter:{date_geq:$d},orderBy:[date_ASC])"
         "{dimensions{date} sum{requests pageViews bytes threats} uniq{uniques}}}}}")
    since = datetime.fromtimestamp(_start_ts(), timezone.utc).strftime("%Y-%m-%d")
    r = httpx.post("https://api.cloudflare.com/client/v4/graphql", headers={"Authorization": f"Bearer {_env('CLOUDFLARE_API_TOKEN')}"},
                   json={"query": q, "variables": {"z": _env("CLOUDFLARE_ZONE_ID"), "d": since}}, timeout=25)
    d = r.json()
    if r.status_code >= 400 or d.get("errors"):
        raise RuntimeError(f"Cloudflare answered {r.status_code}: {str(d.get('errors'))[:160]}")
    zs = (d.get("data") or {}).get("viewer", {}).get("zones") or []
    return {g["dimensions"]["date"]: {"requests": g["sum"]["requests"], "page_views": g["sum"]["pageViews"], "visitors": g["uniq"]["uniques"],
                                      "gb": round(g["sum"]["bytes"] / 1e9, 3), "threats": g["sum"]["threats"]} for g in (zs[0]["httpRequests1dGroups"] if zs else [])}


# ---- Google (Analytics 4 and Search Console) through a service account ------------------------------------------------
# Needs GOOGLE_SERVICE_ACCOUNT_B64 (the service-account JSON key, base64 on one line), the service account added as a viewer of the
# GA4 property / Search Console site, and the "Google Analytics Data API" / "Google Search Console API" enabled in its project.
_gtok: dict = {}


def _google_account() -> dict:
    import base64
    import json
    raw = _env("GOOGLE_SERVICE_ACCOUNT_B64")
    try:
        return json.loads(base64.b64decode(raw).decode())
    except Exception as e:  # noqa: BLE001
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_B64 is not a base64 service-account JSON key") from e


def _google_token(scope: str) -> tuple[str, str]:
    """(access token, service-account email); tokens are reused for 50 minutes."""
    acct = _google_account()
    hit = _gtok.get(scope)
    if hit and hit[1] > time.time():
        return hit[0], acct["client_email"]
    import jwt   # PyJWT (installed with the MCP library)
    now = int(time.time())
    assertion = jwt.encode({"iss": acct["client_email"], "scope": scope, "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3000},
                           acct["private_key"], algorithm="RS256")
    r = httpx.post("https://oauth2.googleapis.com/token", data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion}, timeout=25)
    if r.status_code >= 400:
        raise RuntimeError(f"Google sign-in answered {r.status_code}: {r.text[:160]}")
    _gtok[scope] = (r.json()["access_token"], now + 3000)
    return _gtok[scope][0], acct["client_email"]


def _google_post(url: str, scope: str, body: dict) -> dict:
    tok, email = _google_token(scope)
    r = httpx.post(url, headers={"Authorization": f"Bearer {tok}"}, json=body, timeout=30)
    if r.status_code in (401, 403):
        raise RuntimeError(f"Google refused ({r.status_code}). Add {email} as a viewer of this property/site, and enable the API in its Google Cloud project. {r.text[:140]}")
    if r.status_code >= 400:
        raise RuntimeError(f"Google answered {r.status_code}: {r.text[:200]}")
    return r.json()


def google_analytics(s: Settings, db) -> dict:
    prop = _env("GA4_PROPERTY_ID").replace("properties/", "")
    d = _google_post(f"https://analyticsdata.googleapis.com/v1beta/properties/{prop}:runReport", "https://www.googleapis.com/auth/analytics.readonly",
                     {"dateRanges": [{"startDate": f"{WINDOW_DAYS - 1}daysAgo", "endDate": "today"}], "dimensions": [{"name": "date"}],
                      "metrics": [{"name": "activeUsers"}, {"name": "sessions"}, {"name": "screenPageViews"}, {"name": "engagedSessions"}], "limit": 100})
    out = {}
    for r in d.get("rows") or []:
        day = r["dimensionValues"][0]["value"]
        v = [float(x["value"]) for x in r["metricValues"]]
        out[f"{day[:4]}-{day[4:6]}-{day[6:]}"] = {"ga_users": v[0], "ga_sessions": v[1], "ga_views": v[2], "ga_engaged": v[3]}
    return out


def search_console(s: Settings, db) -> dict:
    from urllib.parse import quote
    site = _env("SEARCH_CONSOLE_SITE")
    start = datetime.fromtimestamp(_start_ts(), timezone.utc).strftime("%Y-%m-%d")
    d = _google_post(f"https://searchconsole.googleapis.com/webmasters/v3/sites/{quote(site, safe='')}/searchAnalytics/query", "https://www.googleapis.com/auth/webmasters.readonly",
                     {"startDate": start, "endDate": _today(), "dimensions": ["date"], "rowLimit": 100})
    return {r["keys"][0]: {"gsc_clicks": r.get("clicks", 0), "gsc_impressions": r.get("impressions", 0), "gsc_position": round(r.get("position", 0), 1)} for r in d.get("rows") or []}


def buffer(s: Settings, db) -> dict:
    """Social posts and their results per day (Buffer GraphQL API: aggregatedPostMetrics over one-day windows; free plans allow 31 days)."""
    from concurrent.futures import ThreadPoolExecutor
    key = _env("BUFFER_API_TOKEN")

    def gql(query: str, variables: dict | None = None) -> dict:
        r = httpx.post("https://api.buffer.com", json={"query": query, "variables": variables or {}}, timeout=30,
                       headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "User-Agent": "WorldDigitalBlog/1.0"})
        d = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        if r.status_code >= 400 or d.get("errors"):
            raise RuntimeError(f"Buffer answered {r.status_code}: {str(d.get('errors') or r.text)[:200]}")
        return d["data"]

    orgs = (gql("{ account { organizations { id } } }").get("account") or {}).get("organizations") or []
    if not orgs:
        raise RuntimeError("Buffer returned no organization for this token")
    org = orgs[0]["id"]
    days = [datetime.now(timezone.utc).date() - timedelta(days=i) for i in range(30)]
    names = {"postcount": "buffer_posts", "reactions": "buffer_reactions", "comments": "buffer_comments", "impressions": "buffer_impressions", "reach": "buffer_reach"}
    q = ("query($o: OrganizationId!, $s: DateTime!, $e: DateTime!) { aggregatedPostMetrics(input: {organizationId: $o, startDateTime: $s, endDateTime: $e}) "
         "{ metrics { name value } metricsUpdatedAt } }")

    def one(d):
        a = gql(q, {"o": org, "s": f"{d}T00:00:00Z", "e": f"{d}T23:59:59Z"}).get("aggregatedPostMetrics") or {}
        out = {}
        for m in a.get("metrics") or []:
            k = names.get(str(m.get("name") or "").lower().replace("_", "").replace(" ", ""))
            if k and m.get("value") is not None:
                out[k] = float(m["value"])
        return d.isoformat(), out
    with ThreadPoolExecutor(5) as ex:
        return {day: m for day, m in ex.map(one, days) if m and m.get("buffer_posts", 1)}


def ai_usage(s: Settings, db) -> dict:
    """Calls, tokens and estimated dollars per AI provider and day, from the site's own counters (every feature, every call)."""
    from . import rag as R
    out: dict = {}
    for d in db["rag_meta"].find({"_id": {"$regex": "^ai:"}}):
        day = d.get("day")
        if not day or day < _day(_start_ts()):
            continue
        for mkey, v in (d.get("by_model") or {}).items():
            model = mkey.replace("_", ".") if mkey.startswith(("gpt", "claude", "text-embedding", "o1", "o3", "o4")) else mkey
            p = R.Rag.provider_of(model)
            if p is None:
                continue
            tin, tout, calls = int(v.get("in") or 0), int(v.get("out") or 0), int(v.get("calls") or 0)
            pin, pout = (R.CLAUDE_PRICES if p == "claude" else R.FAST_PRICES.get(p) or R.OPENAI_PRICES.get(model, R.OPENAI_PRICE_DEFAULT))
            m = out.setdefault(day, {})
            for k, x in ((f"{p}_calls", calls), (f"{p}_tokens_in", tin), (f"{p}_tokens_out", tout), (f"{p}_est_cost_usd", (tin * pin + tout * pout) / 1e6)):
                m[k] = round(m.get(k, 0) + x, 4)
    for d in db["rag_meta"].find({"_id": {"$regex": "^openai:"}}):   # older days: the knowledge-base OpenAI spend counter
        day = d.get("day")
        if day and day >= _day(_start_ts()) and "openai_est_cost_usd" not in out.get(day, {}):
            out.setdefault(day, {})["openai_est_cost_usd"] = round(float(d.get("usd") or 0), 4)
    return out


def _env(name: str) -> str:
    import os
    return (os.environ.get(name) or "").strip()


# ---- registry ------------------------------------------------------------------------------------------------------
# metric: (key, label, unit, "sum" over the range | "latest" value). needs: variables that switch it on (all must be set).
AI_METRICS = lambda p: [(f"{p}_est_cost_usd", "Estimated spend", "usd", "sum"), (f"{p}_calls", "Calls", "n", "sum"), (f"{p}_tokens_in", "Tokens in", "n", "sum"), (f"{p}_tokens_out", "Tokens out", "n", "sum")]  # noqa: E731

REGISTRY = [
    {"id": "openai", "name": "OpenAI", "group": "AI providers", "fn": ai_usage, "shared": "ai", "metrics": AI_METRICS("openai"), "needs": []},
    {"id": "claude", "name": "Claude (Anthropic)", "group": "AI providers", "fn": ai_usage, "shared": "ai", "metrics": AI_METRICS("claude"), "needs": []},
    {"id": "cerebras", "name": "Cerebras", "group": "AI providers", "fn": ai_usage, "shared": "ai", "metrics": AI_METRICS("cerebras"), "needs": []},
    {"id": "groq", "name": "Groq", "group": "AI providers", "fn": ai_usage, "shared": "ai", "metrics": AI_METRICS("groq"), "needs": []},
    {"id": "openai_billing", "name": "OpenAI billing (provider-reported)", "group": "AI providers", "fn": openai_billing, "metrics": [("billed_usd", "Billed", "usd", "sum")], "needs": ["OPENAI_ADMIN_KEY"]},
    {"id": "anthropic_billing", "name": "Anthropic billing (provider-reported)", "group": "AI providers", "fn": anthropic_billing, "metrics": [("billed_usd", "Billed", "usd", "sum")], "needs": ["ANTHROPIC_ADMIN_KEY"]},
    {"id": "stripe", "name": "Stripe", "group": "Revenue", "fn": stripe, "metrics": [("revenue_usd", "Revenue", "usd", "sum"), ("payments", "Payments", "n", "sum"), ("refunded_usd", "Refunded", "usd", "sum"), ("balance_available_usd", "Available balance", "usd", "latest")], "needs": ["STRIPE_SECRET_KEY"]},
    {"id": "mercury", "name": "Mercury", "group": "Revenue", "fn": mercury, "metrics": [("balance_usd", "Bank balance", "usd", "latest")], "needs": ["MERCURY_API_TOKEN"]},
    {"id": "resend", "name": "Resend (email)", "group": "Email", "fn": resend, "metrics": [("sent", "Sent", "n", "sum"), ("delivered", "Delivered", "n", "sum"), ("opened", "Opened", "n", "sum"), ("bounced", "Bounced", "n", "sum")], "needs": ["RESEND_API_KEY"]},
    {"id": "dataforseo", "name": "DataForSEO", "group": "SEO data", "fn": dataforseo, "metrics": [("balance_usd", "Account balance", "usd", "latest")], "needs": ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"]},
    {"id": "cloudflare", "name": "Cloudflare traffic", "group": "Website", "fn": cloudflare, "metrics": [("requests", "Requests", "n", "sum"), ("page_views", "Page views", "n", "sum"), ("visitors", "Visitors", "n", "sum"), ("threats", "Threats blocked", "n", "sum")], "needs": ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"]},
    # Not collected yet: they need credentials this site does not hold (or a different kind of sign-in). Shown so nothing is hidden.
    {"id": "google_analytics", "name": "Google Analytics 4", "group": "Website", "fn": google_analytics, "metrics": [("ga_users", "Users", "n", "sum"), ("ga_sessions", "Sessions", "n", "sum"), ("ga_views", "Page views", "n", "sum"), ("ga_engaged", "Engaged sessions", "n", "sum")], "needs": ["GOOGLE_SERVICE_ACCOUNT_B64", "GA4_PROPERTY_ID"]},
    {"id": "search_console", "name": "Google Search Console", "group": "Website", "fn": search_console, "metrics": [("gsc_clicks", "Clicks from Google", "n", "sum"), ("gsc_impressions", "Impressions", "n", "sum"), ("gsc_position", "Average position", "n", "latest")], "needs": ["GOOGLE_SERVICE_ACCOUNT_B64", "SEARCH_CONSOLE_SITE"]},
    {"id": "google_ads", "name": "Google Ads", "group": "Not connected yet", "fn": None, "metrics": [], "needs": ["a Google Ads developer token and OAuth refresh token"]},
    {"id": "buffer", "name": "Buffer (social posts)", "group": "Marketing & social", "fn": buffer, "metrics": [("buffer_posts", "Posts sent", "n", "sum"), ("buffer_reactions", "Reactions", "n", "sum"), ("buffer_comments", "Comments", "n", "sum"), ("buffer_impressions", "Impressions", "n", "sum"), ("buffer_reach", "Reach", "n", "sum")], "needs": ["BUFFER_API_TOKEN"]},
    {"id": "bird", "name": "Bird (SMS, WhatsApp, email)", "group": "Not connected yet", "fn": None, "metrics": [], "needs": ["BIRD_API_KEY"]},
    {"id": "tiktok", "name": "TikTok Ads", "group": "Not connected yet", "fn": None, "metrics": [], "needs": ["TikTok Business API access token"]},
]


def _have(s: Settings, p: dict) -> list[str]:
    """The variables a provider still needs (empty = ready). Keys held in Settings or the environment both count."""
    held = {"STRIPE_SECRET_KEY": s.stripe_secret_key, "RESEND_API_KEY": s.resend_api_key, "DATAFORSEO_LOGIN": s.dataforseo_login, "DATAFORSEO_PASSWORD": s.dataforseo_password}
    return [v for v in p["needs"] if not (held.get(v) if v in held else _env(v))]


def run(s: Settings, db, only: str | None = None) -> dict:
    """Runs the collectors (all, or one), stores the days and each provider's status. Returns {provider: state}."""
    done: dict = {}
    cache: dict = {}
    for p in REGISTRY:
        if only and p["id"] != only:
            continue
        status = {"state": "ok", "message": "", "at": datetime.now(timezone.utc)}
        try:
            if not p["fn"]:
                status.update(state="not_connected", message="Needs " + "; ".join(p["needs"]))
            elif _have(s, p):
                status.update(state="needs_key", message="Add " + ", ".join(_have(s, p)) + " to switch this on")
            else:
                key = p.get("shared") or p["id"]
                if key not in cache:
                    cache[key] = p["fn"](s, db)
                rows = cache[key]
                wanted = {m[0] for m in p["metrics"]}
                assert not any("." in k for k in wanted), "metric names must not contain dots"
                for day, mets in rows.items():
                    mets = {k: v for k, v in mets.items() if k in wanted}
                    if mets:
                        db["provider_metrics"].update_one({"_id": f"{p['id']}:{day}"}, {"$set": {"provider": p["id"], "day": day, **{f"m.{k}": v for k, v in mets.items()}}}, upsert=True)
        except Exception as e:  # noqa: BLE001  one provider's failure must never stop the rest
            log.warning("collect %s: %s", p["id"], str(e)[:200])
            status.update(state="error", message=str(e)[:240])
        db["provider_status"].replace_one({"_id": p["id"]}, {"_id": p["id"], **status}, upsert=True)
        done[p["id"]] = status["state"]
    return done


def summary(db, days: int = 30) -> dict:
    """Everything the Analytics page shows for the connected services, zero-filled per day."""
    days = max(1, min(int(days), 90))
    labels = [(datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d") for i in range(days)]
    stat = {d["_id"]: d for d in db["provider_status"].find({})}
    rows: dict = {}
    for d in db["provider_metrics"].find({"day": {"$gte": labels[0]}}):
        rows.setdefault(d["provider"], {})[d["day"]] = d.get("m") or {}
    out = []
    for p in REGISTRY:
        st = stat.get(p["id"]) or {}
        at = st.get("at")
        mets = []
        for key, label, unit, how in p["metrics"]:
            vals = [(rows.get(p["id"], {}).get(day) or {}).get(key) for day in labels]
            seen = [v for v in vals if v is not None]
            mets.append({"key": key, "label": label, "unit": unit, "how": how, "series": [{"day": d, "v": v or 0} for d, v in zip(labels, vals)],
                         "value": round(sum(seen), 2) if how == "sum" else (seen[-1] if seen else None), "has_data": bool(seen)})
        out.append({"id": p["id"], "name": p["name"], "group": p["group"], "state": st.get("state") or "waiting", "message": st.get("message") or "",
                    "at": at.replace(tzinfo=timezone.utc).timestamp() if isinstance(at, datetime) else None, "metrics": mets})
    return {"days": days, "providers": out}
