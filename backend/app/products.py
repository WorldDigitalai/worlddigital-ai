"""The two paid tools: 10-keyword research report and 5-piece content pack.

Pure logic plus calls into services.py; no web framework or database code here.
"""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from .config import Settings
from .services import ApiError, keywords_for_keywords, keywords_for_site, openai_json, read_site

COUNTRIES = {
    "us": {"label": "United States", "in_text": "the United States", "code": 2840},
    "ca": {"label": "Canada", "in_text": "Canada", "code": 2124},
}

PRODUCTS = {
    "keywords": {"name": "Keyword Research Report (10 keywords)", "price_cents": 999, "total": 10, "free": 3,
                 "path": "/services/keyword-research"},
    "content": {"name": "Marketing Content Pack (5 pieces)", "price_cents": 2499, "total": 5, "free": 1,
                "path": "/services/content-marketing"},
}


def F(key, label, max_):
    return {"key": key, "label": label, "max": max_}


# Platform formats for the content pack; limits are enforced after generation.
PLATFORMS = {
    "google_ads": {"label": "Google Search Ads", "kinds": ["ad"], "ad": [
        F("headline1", "Headline 1", 30), F("headline2", "Headline 2", 30), F("headline3", "Headline 3", 30),
        F("description1", "Description 1", 90), F("description2", "Description 2", 90)]},
    "facebook": {"label": "Facebook", "kinds": ["ad", "post"], "ad": [
        F("primary", "Primary text", 300), F("headline", "Headline", 40), F("description", "Description", 30),
        F("cta", "Call-to-action button", 20), F("visual", "Image / video idea", 220)], "post": [
        F("text", "Post", 500), F("hashtags", "Hashtags", 80), F("visual", "Image / video idea", 220)]},
    "instagram": {"label": "Instagram", "kinds": ["ad", "post"], "ad": [
        F("caption", "Caption", 300), F("headline", "Headline", 40), F("cta", "Call-to-action button", 20),
        F("visual", "Reel / image idea", 220)], "post": [
        F("caption", "Caption", 600), F("hashtags", "Hashtags", 160), F("visual", "Reel / image idea", 220)]},
    "linkedin": {"label": "LinkedIn", "kinds": ["ad", "post"], "ad": [
        F("intro", "Intro text", 150), F("headline", "Headline", 70), F("cta", "Call-to-action button", 20),
        F("visual", "Image idea", 220)], "post": [F("text", "Post", 1300), F("hashtags", "Hashtags", 60)]},
    "x": {"label": "X (Twitter)", "kinds": ["ad", "post"], "ad": [
        F("text", "Post text", 280), F("headline", "Card headline", 70)], "post": [F("text", "Post", 280)]},
    "tiktok": {"label": "TikTok", "kinds": ["ad", "post"], "ad": [
        F("adtext", "Ad text", 100), F("hook", "Hook (first 3 seconds)", 120), F("script", "Video script", 700),
        F("cta", "Call to action", 40)], "post": [
        F("hook", "Hook (first 3 seconds)", 120), F("script", "Video script", 700), F("caption", "Caption", 150),
        F("hashtags", "Hashtags", 100)]},
    "youtube_shorts": {"label": "YouTube Shorts", "kinds": ["ad", "post"], "ad": [
        F("headline", "Headline", 30), F("hook", "Hook (first 3 seconds)", 120),
        F("script", "Script (under 60 seconds)", 800), F("cta", "Call to action", 40)], "post": [
        F("title", "Title", 100), F("script", "Script (under 60 seconds)", 800), F("description", "Description", 300)]},
    "snapchat": {"label": "Snapchat", "kinds": ["ad", "post"], "ad": [
        F("headline", "Headline", 34), F("script", "Snap ad script (3–10 seconds)", 350),
        F("cta", "Call to action", 20)], "post": [F("script", "Story script", 350), F("caption", "Caption", 80)]},
}

INTENTS = ("Transactional", "Commercial", "Informational", "Local")


def fit(text, max_: int) -> str:
    """Trim to a character limit at a word boundary."""
    s = " ".join(str(text or "").split(" ")).strip()
    if len(s) <= max_:
        return s
    cut = s[: max_ + 1]
    i = cut.rfind(" ")
    out = cut[:i] if i > max_ * 0.6 else s[:max_]
    return out.rstrip(" ,;:–—-")


def site_context(site: dict | None, url: str) -> str:
    if not site:
        return f"Website: {url}\n(The page could not be read; infer the business from the domain name.)"
    parts = [f"Website: {url}"]
    if site.get("title"):
        parts.append(f"Title: {site['title']}")
    if site.get("description"):
        parts.append(f"Meta description: {site['description']}")
    if site.get("headings"):
        parts.append("Headings: " + " | ".join(site["headings"]))
    if site.get("text"):
        parts.append(f"Page text: {site['text']}")
    return "\n".join(parts)


# ── Keyword research ────────────────────────────────────────────────────────

def generate_keywords(s: Settings, *, url: str, domain: str, country: str) -> dict:
    loc = COUNTRIES.get(country, COUNTRIES["us"])
    site = read_site(url, fetch_base=s.test_site_base)
    ctx = site_context(site, url)

    seen: dict[str, dict] = {}

    def add_all(rows):
        for k in rows:
            if k["keyword"] and k["keyword"] not in seen:
                seen[k["keyword"]] = k

    try:
        add_all(keywords_for_site(s, domain, loc["code"]))
    except ApiError as e:
        print("keywords_for_site failed:", e)

    if sum(1 for k in seen.values() if (k["volume"] or 0) > 0) < 25:
        seeds = openai_json(s, system="You are an SEO strategist. Reply with JSON only.", max_tokens=500, user=(
            f"{ctx}\n\nList 15 short seed search phrases (2-4 words) that a potential customer in {loc['label']} would type "
            "into Google to find this business's products or services. Use generic service terms, not the brand name. "
            'JSON: {"seeds": ["..."]}'))
        lst = [str(x).lower().strip() for x in seeds.get("seeds") or [] if str(x).strip()]
        if lst:
            add_all(keywords_for_keywords(s, lst, loc["code"]))

    candidates = sorted((k for k in seen.values() if (k["volume"] or 0) > 0 and len(k["keyword"]) <= 80),
                        key=lambda k: -k["volume"])[:150]
    if len(candidates) < 10:
        raise ApiError(f"only {len(candidates)} candidates", 422,
                       "We couldn't find enough search data for that website yet. Try your main domain, "
                       "or a site with a few pages of content.")

    table = "\n".join(f"{i} | {k['keyword']} | {k['volume']} | {k['cpc'] if k['cpc'] is not None else '-'} | "
                      f"{k['competition'] or '-'}" for i, k in enumerate(candidates))
    pick = openai_json(s, max_tokens=1500, temperature=0.2,
                       system="You are a senior SEO strategist for SMBs, SMEs and enterprises. You only choose keywords "
                              "from the provided list. Reply with JSON only.",
                       user=(f"{ctx}\n\nMarket: {loc['label']}\n\nCandidate keywords (index | keyword | monthly searches | "
                             f"CPC USD | competition):\n{table}\n\nChoose the 10 keywords that would bring this business the "
                             "most valuable customers: relevant to what it actually sells, with buying intent, realistic to "
                             "rank or bid on, and a mix of volumes. Skip competitor brand names and anything unrelated. Rank "
                             "them best first; the first 3 must be the strongest.\nFor each give: index, intent (one of: "
                             "Transactional, Commercial, Informational, Local), reason (max 18 words, specific to this "
                             "business), page (the page to target it with, max 8 words).\n"
                             'JSON: {"keywords":[{"index":0,"intent":"","reason":"","page":""}]}'))

    items, used = [], set()
    for p in pick.get("keywords") or []:
        try:
            k = candidates[int(p.get("index"))]
        except (TypeError, ValueError, IndexError):
            continue
        if k["keyword"] in used:
            continue
        used.add(k["keyword"])
        items.append({**k, "intent": p.get("intent") if p.get("intent") in INTENTS else "Commercial",
                      "reason": fit(p.get("reason"), 140), "page": fit(p.get("page"), 60)})
        if len(items) == 10:
            break
    for k in candidates:  # top up if the model returned fewer than 10
        if len(items) >= 10:
            break
        if k["keyword"] not in used:
            used.add(k["keyword"])
            items.append({**k, "intent": "Commercial", "reason": "High search demand related to your services.",
                          "page": "Relevant service page"})

    return {"items": items, "meta": {"country": loc["label"], "country_text": loc["in_text"],
                                     "site_title": (site or {}).get("title") or domain}}


# ── Content pack ────────────────────────────────────────────────────────────

def generate_content(s: Settings, *, url: str, domain: str, platform: str, kind: str, offer: str = "") -> dict:
    p = PLATFORMS.get(platform)
    if not p:
        raise ApiError("bad platform", 400, "Choose a platform.")
    k = kind if kind in p["kinds"] else p["kinds"][0]
    fields = p[k]
    site = read_site(url, fetch_base=s.test_site_base)
    ctx = site_context(site, url)
    spec = "\n".join(f"- {f['key']}: {f['label']}, max {f['max']} characters" for f in fields)
    shape = ",".join(f'"{f["key"]}":""' for f in fields)
    out = openai_json(s, max_tokens=3500, temperature=0.7,
                      system="You are a senior performance copywriter for SMBs, SMEs and enterprises in the United States "
                             "and Canada. You write specific, benefit-led copy that follows each platform's policies and "
                             "character limits. Never invent prices, discounts, awards, statistics or testimonials that "
                             "aren't in the brief. Reply with JSON only.",
                      user=(f"{ctx}\n" + (f"\nWhat to promote: {offer}\n" if offer else "") +
                            f"\nWrite 5 different {p['label']} {'ads' if k == 'ad' else 'organic posts'} for this business. "
                            "Each must use a different angle (for example: main benefit, problem/solution, social proof "
                            "without invented numbers, offer or urgency without invented discounts, how it works). The "
                            f"first one must be the strongest.\nFields and hard character limits:\n{spec}\n"
                            f'JSON: {{"items":[{{"angle":"short angle name","fields":{{{shape}}}}}]}}'))
    items = []
    for i, it in enumerate((out.get("items") or [])[:5]):
        vals = it.get("fields") or {}
        items.append({"angle": fit(it.get("angle") or f"Variation {i + 1}", 60),
                      "fields": [{"label": f["label"], "max": f["max"], "text": fit(vals.get(f["key"]), f["max"])}
                                 for f in fields]})
    if len(items) < 5:
        raise ApiError("content short", 502, "The generator returned too little. Please try again.")
    return {"items": items, "meta": {"platform": p["label"], "kind": k, "site_title": (site or {}).get("title") or domain}}


# ── Report layouts shared by PDF, Word and Excel ───────────────────────────

def pack_title(job: dict) -> str:
    label, kind = job["meta"]["platform"], job["meta"]["kind"]
    if kind == "ad" and label.lower().endswith("ads"):
        return f"{label} Pack"
    return f"{label} {'Ad' if kind == 'ad' else 'Post'} Pack"


def report_title(job: dict) -> str:
    return "Keyword Research Report" if job["type"] == "keywords" else pack_title(job)


def _today() -> str:
    d = datetime.now(ZoneInfo("America/Chicago"))
    return f"{d:%B} {d.day}, {d.year}"


def _num(n):
    return "–" if n is None else f"{n:,}"


def _cpc(n):
    return "–" if n is None else f"${n:.2f}"


def _comp(c):
    return c[0] + c[1:].lower() if c else "–"


def report_blocks(job: dict) -> list[dict]:
    d = job["input"]["domain"]
    if job["type"] == "keywords":
        where = job["meta"].get("country_text") or job["meta"]["country"]
        return [
            {"type": "title", "text": "Keyword Research Report"},
            {"type": "subtitle", "text": f"{d}  ·  {job['meta']['country']}  ·  {_today()}"},
            {"type": "p", "text": f"These are the 10 search terms most likely to bring {d} valuable customers in {where}, "
                                  f"ranked best first. Monthly searches and cost per click are Google Ads averages for {where}."},
            {"type": "table",
             "headers": ["#", "Keyword", "Monthly searches", "CPC", "Competition", "Intent", "Why it matters",
                         "Best page to target it"],
             "weights": [5, 15, 10, 7, 14, 13, 21, 15],
             "rows": [[str(i + 1), k["keyword"], _num(k["volume"]), _cpc(k["cpc"]), _comp(k["competition"]), k["intent"],
                       k["reason"], k["page"]] for i, k in enumerate(job["items"])]},
            {"type": "h1", "text": "How to use this list"},
            {"type": "p", "text": "1. Give each keyword one page. Put the keyword in the page title, the main heading and the first paragraph."},
            {"type": "p", "text": "2. Start with Transactional and Local keywords: they bring people ready to buy. Use Informational ones for blog posts and FAQs."},
            {"type": "p", "text": "3. For Google Ads, the CPC column is a starting bid. High competition means you'll pay more per click; low competition is the quickest win."},
            {"type": "p", "text": "Need help putting this into action? Reply to the email with this report or visit worlddigital.ai."},
        ]
    kind = "ads" if job["meta"]["kind"] == "ad" else "posts"
    blocks = [{"type": "title", "text": pack_title(job)},
              {"type": "subtitle", "text": f"{d}  ·  5 ready-to-use {kind}  ·  {_today()}"}]
    for i, it in enumerate(job["items"]):
        blocks.append({"type": "h1", "text": f"{i + 1}. {it['angle']}"})
        for f in it["fields"]:
            blocks.append({"type": "label", "text": f"{f['label'].upper()}  ({len(f['text'])}/{f['max']})"})
            blocks.append({"type": "p", "text": f["text"] or "–"})
    blocks.append({"type": "p", "text": "Tip: test two or three of these against each other and keep the one with the best "
                                        "results. Character counts are shown so you can paste each field straight into the platform."})
    return blocks


def report_table(job: dict) -> dict:
    if job["type"] == "keywords":
        return {"title": "Keyword Research Report",
                "subtitle": f"{job['input']['domain']} · {job['meta']['country']} · Google Ads monthly averages",
                "sheet": "Keywords",
                "headers": ["#", "Keyword", "Monthly searches", "CPC (USD)", "Competition", "Intent", "Why it matters",
                            "Best page to target it"],
                "widths": [5, 34, 17, 11, 13, 15, 60, 34],
                "formats": [None, None, "#,##0", '"$"#,##0.00', None, None, None, None],
                "rows": [[i + 1, k["keyword"], k["volume"], k["cpc"], k["competition"] or "", k["intent"], k["reason"],
                          k["page"]] for i, k in enumerate(job["items"])]}
    labels = [f["label"] for f in job["items"][0]["fields"]]
    return {"title": pack_title(job), "subtitle": f"{job['input']['domain']} · 5 variations", "sheet": "Content",
            "headers": ["#", "Angle", *labels],
            "widths": [5, 24, *[60 if any(w in l.lower() for w in ("script", "post", "caption", "primary", "text", "intro"))
                                else 32 for l in labels]],
            "formats": [None] * (len(labels) + 2),
            "rows": [[i + 1, it["angle"], *[f["text"] for f in it["fields"]]] for i, it in enumerate(job["items"])]}
