"""AI blog assistant for the private blog editor (/blog-admin).

research(): what is trending for a topic over the past 3 months and which posts to write.
  - Google Trends (DataForSEO): interest over 90 days for up to 5 phrases + rising/top related searches
  - Google Ads keyword data (DataForSEO): volume, CPC, competition and a 3-month trend from monthly searches
  - Live Google results (DataForSEO SERP): who ranks (web search), "People also ask" (AEO),
    and the sources cited in Google's AI Overview (GEO)
  - OpenAI ranks the best post ideas, including "X vs Y" and "alternatives" posts against competitors

draft(): writes a full post (title, address, summary, Google title/description, Markdown body)
grounded in the live Google results for its keyword. Drafts only; a person reviews and publishes.
"""
from __future__ import annotations

import re

import httpx
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from zoneinfo import ZoneInfo

from .config import Settings
from .services import ApiError, _dfs, _num, openai_json, record_usage

COUNTRIES = {"us": ("United States", 2840), "ca": ("Canada", 2124)}

# Default phrases for "What's trending now" (our products and services).
DEFAULT_SEEDS = ["ai seo", "generative engine optimization", "answer engine optimization", "local seo",
                 "google ads management"]

# Competitors by what they compete with. Shown as chips in the editor for "vs" and "alternatives" posts.
COMPETITORS = {
    "All-in-one marketing": ["HubSpot", "Thryv", "Keap"],
    "Freelance marketplaces": ["Fiverr", "Upwork"],
    "SEO software": ["Semrush", "Ahrefs", "Moz", "SE Ranking", "Ubersuggest"],
    "AI search visibility": ["Profound", "Otterly.ai", "Peec AI"],
    "Local SEO & reviews": ["BrightLocal", "Yext", "Birdeye", "Podium", "Whitespark", "Local Falcon"],
    "AI content": ["Jasper", "Surfer SEO", "Copy.ai"],
    "Agencies": ["WebFX", "Scorpion", "Thrive Agency"],
    "Website builders": ["Wix", "Squarespace", "GoDaddy"],
    "EHR/EMR integration": ["Redox", "Health Gorilla"],
}
# Who the posts are written for. "midlarge" is the default for Autopilot (requested Nov 2026).
AUDIENCES = {
    "small": "small businesses (owner-led, about 1-50 employees)",
    "midlarge": ("mid-size and large companies (about 50 to 5,000+ employees: multi-location brands, B2B firms, "
                 "healthcare groups, manufacturers, professional services) and the marketing, IT and operations "
                 "leaders who buy for them"),
    "all": "businesses of every size",
}
AUDIENCE_RULES = {
    "small": "Write for the owner who does it all: simple steps, low cost, quick wins.",
    "midlarge": ("Write for decision-makers at larger companies: speak to scale (many locations, pages, brands or "
                 "teams), integration with their existing systems (CRM, ERP, EHR, analytics), security and compliance "
                 "only where factual, ownership of accounts and data, reporting and ROI, and how a vendor is evaluated "
                 "and onboarded. Do not frame the reader as a solo owner. The natural next step is a discovery call "
                 "and a fixed-scope proposal (/contact, /custom-software), not a $9.99 tool."),
    "all": "Write so a reader at any company size gets value; note where advice differs by size.",
}


def _aud(a) -> str:
    return a if a in AUDIENCES else "midlarge"


POST_TYPES = {
    "vs": "Comparison (X vs Y)", "alternatives": "Alternatives / best options", "how-to": "How-to guide",
    "list": "List / best-of", "what-is": "Explainer (what is …)", "local": "Local (city) guide",
    "pricing": "Cost / pricing guide",
}

ABOUT_US = """WorldDigital.ai (WorldDigital.ai Corporation LLC) is a software company with hubs in Houston, TX and
Murfreesboro, TN, serving businesses across the US and Canada. BBB A+ rated, 5.0 on Google.
Software (every tool has a free version, pay once, no subscription):
- Free SEO & AI Visibility Report (/free-seo-report): on-page SEO, mobile speed, Google rankings, backlinks and
  ChatGPT mentions with top fixes in about 60 seconds. Data from DataForSEO and Google Lighthouse.
- Keyword Research (/services/keyword-research): 3 keywords free, 10 for $9.99 one-time.
- Content Generator (/services/content-marketing): ads and posts for Google, Facebook, Instagram, LinkedIn, X,
  TikTok, YouTube Shorts and Snapchat. 1 free, 5 for $24.99 one-time.
Custom software (custom quote, fixed-scope proposal after a discovery call): web apps & portals, AI automation &
agents, APIs & integrations, EHR & EMR integration (/ehr-emr-integration) (/custom-software).
Add-on services: SEO & AI Search plan $199.99/month, no contract, covers SEO, AEO and GEO (/ai-seo-agency);
Google Ads & PPC management (/google-ads-agency); websites (/build); local SEO (/local-seo-services);
GEO (/generative-engine-optimization). Contact: /contact, support@worlddigital.ai, (832) 834-0680.
Every account stays in the client's name. Replies within one business day."""


def _clean_phrase(p: str) -> str:
    """Google Trends rejects some characters; keep phrases short and plain."""
    p = re.sub(r"[<>|\"\-+=~!:*()\[\]{}]", " ", str(p or "")).lower()
    return " ".join(p.split())[:100]


def _country(c) -> tuple[str, int]:
    return COUNTRIES.get(str(c or "us").lower(), COUNTRIES["us"])


# ── Data sources ────────────────────────────────────────────────────────────

def trends_graph(s: Settings, phrases: list[str], loc: int) -> dict:
    """Relative Google search interest (0-100) over the past 90 days, plus % change first vs last 4 weeks."""
    res = _dfs(s, "/v3/keywords_data/google_trends/explore/live", {
        "keywords": phrases[:5], "location_code": loc, "language_code": "en", "type": "web",
        "time_range": "past_90_days", "item_types": ["google_trends_graph"]}, timeout=60)
    items = [it for r in res for it in (r.get("items") or []) if it.get("type") == "google_trends_graph"]
    if not items:
        return {"keywords": phrases[:5], "points": [], "change": []}
    g = items[0]
    kws = g.get("keywords") or phrases[:5]
    points = []
    for d in g.get("data") or []:
        if d.get("missing_data"):
            continue
        v = d.get("values")
        v = v if isinstance(v, list) else [v]
        points.append({"date": d.get("date_from"), "values": [x if _num(x) is not None else 0 for x in v]})
    change = []
    for i, _ in enumerate(kws):
        series = [p["values"][i] if i < len(p["values"]) else 0 for p in points]
        n = max(1, min(4, len(series) // 3))
        first, last = sum(series[:n]) / n if series else 0, sum(series[-n:]) / n if series else 0
        change.append(round((last - first) / first * 100) if first else (100 if last else 0))
    return {"keywords": kws, "points": points, "averages": g.get("averages") or [], "change": change}


def trends_queries(s: Settings, phrase: str, loc: int) -> dict:
    """Rising and top related Google searches for one phrase, past 90 days."""
    res = _dfs(s, "/v3/keywords_data/google_trends/explore/live", {
        "keywords": [phrase], "location_code": loc, "language_code": "en", "type": "web",
        "time_range": "past_90_days", "item_types": ["google_trends_queries_list"]}, timeout=60)
    out = {"rising": [], "top": []}
    for r in res:
        for it in r.get("items") or []:
            if it.get("type") != "google_trends_queries_list":
                continue
            data = it.get("data") or {}
            for k in ("rising", "top"):
                for q in data.get(k) or []:
                    if q.get("query"):
                        out[k].append({"query": str(q["query"]).lower(), "value": str(q.get("value") or "")})
    out["rising"], out["top"] = out["rising"][:15], out["top"][:15]
    return out


def keyword_ideas(s: Settings, seeds: list[str], loc: int) -> list[dict]:
    """Related keywords with volume, CPC, competition and a 3-month trend from Google Ads monthly searches."""
    rows = _dfs(s, "/v3/keywords_data/google_ads/keywords_for_keywords/live", {
        "keywords": seeds[:20], "location_code": loc, "language_code": "en", "search_partners": False,
        "sort_by": "search_volume"}, timeout=60)
    out, seen = [], set()
    for r in rows:
        kw = str(r.get("keyword") or "").lower().strip()
        vol = _num(r.get("search_volume"))
        if not kw or kw in seen or not vol:
            continue
        seen.add(kw)
        months = sorted((m for m in r.get("monthly_searches") or [] if _num(m.get("search_volume")) is not None),
                        key=lambda m: (m.get("year") or 0, m.get("month") or 0))
        trend = None
        if len(months) >= 6:
            recent = sum(m["search_volume"] for m in months[-3:])
            before = sum(m["search_volume"] for m in months[-6:-3])
            trend = round((recent - before) / before * 100) if before else None
        cpc = _num(r.get("cpc"))
        out.append({"keyword": kw, "volume": vol, "cpc": round(cpc, 2) if cpc is not None else None,
                    "competition": r.get("competition") or None, "trend": trend})
    return out


def serp(s: Settings, keyword: str, loc: int) -> dict:
    """Live Google results: top organic pages, People also ask, AI Overview sources, related searches."""
    res = _dfs(s, "/v3/serp/google/organic/live/advanced", {
        "keyword": keyword, "location_code": loc, "language_code": "en", "device": "desktop", "depth": 10,
        "people_also_ask_click_depth": 1, "load_async_ai_overview": True}, timeout=60)
    out = {"organic": [], "questions": [], "ai_overview": {"present": False, "sources": [], "text": ""}, "related": []}
    for r in res:
        for it in r.get("items") or []:
            t = it.get("type")
            if t == "organic" and len(out["organic"]) < 10:
                out["organic"].append({"rank": it.get("rank_group"), "domain": it.get("domain"),
                                       "title": it.get("title"), "url": it.get("url"),
                                       "snippet": (it.get("description") or "")[:300]})
            elif t == "people_also_ask":
                for q in it.get("items") or []:
                    if q.get("title") and q["title"] not in out["questions"]:
                        out["questions"].append(q["title"])
            elif t == "ai_overview":
                ao = out["ai_overview"]
                ao["present"] = True
                texts = [x.get("text") or "" for x in it.get("items") or [] if isinstance(x, dict)]
                ao["text"] = " ".join(texts)[:1200]
                refs = list(it.get("references") or [])
                for x in it.get("items") or []:
                    refs += (x.get("references") or []) if isinstance(x, dict) else []
                for ref in refs:
                    d = ref.get("domain")
                    if d and d not in [x["domain"] for x in ao["sources"]]:
                        ao["sources"].append({"domain": d, "title": ref.get("title"), "url": ref.get("url")})
            elif t == "related_searches":
                out["related"] += [str(x) for x in it.get("items") or [] if isinstance(x, str)]
    out["questions"] = out["questions"][:10]
    out["ai_overview"]["sources"] = out["ai_overview"]["sources"][:10]
    out["related"] = out["related"][:10]
    return out


def _safe(fn, *args, default=None):
    """One data source failing (or not available on the plan) should not sink the whole research."""
    try:
        return fn(*args), None
    except ApiError as e:
        print(f"blog research: {fn.__name__} failed: {e}", flush=True)
        return default, fn.__name__


# ── Research ────────────────────────────────────────────────────────────────

def research(s: Settings, *, topic: str = "", country: str = "us", competitors: list[str] | None = None,
             audience: str = "midlarge", industry: str = "") -> dict:
    label, loc = _country(country)
    topic = _clean_phrase(topic)
    seeds = [topic] if topic else list(DEFAULT_SEEDS)
    audience, industry = _aud(audience), _clean_phrase(industry)[:60]
    if topic:
        if audience == "small":
            seeds += [f"{topic} for small business", f"best {topic}", f"{topic} tools"]
        else:
            seeds += [f"{topic} for {industry}" if industry else f"{topic} services", f"enterprise {topic}",
                      f"{topic} agency", f"best {topic}"]
    seeds = [x for x in dict.fromkeys(_clean_phrase(x) for x in seeds) if x][:5]
    main_kw = seeds[0]

    with ThreadPoolExecutor(max_workers=4) as pool:
        f_graph = pool.submit(_safe, trends_graph, s, seeds, loc, default={"keywords": seeds, "points": [], "change": []})
        f_q = pool.submit(_safe, trends_queries, s, main_kw, loc, default={"rising": [], "top": []})
        f_kw = pool.submit(_safe, keyword_ideas, s, seeds, loc, default=[])
        f_serp = pool.submit(_safe, serp, s, main_kw, loc,
                             default={"organic": [], "questions": [], "ai_overview": {"present": False, "sources": []},
                                      "related": []})
        (graph, e1), (queries, e2), (kws, e3), (sr, e4) = f_graph.result(), f_q.result(), f_kw.result(), f_serp.result()
    failed = [e for e in (e1, e2, e3, e4) if e]
    if len(failed) == 4:
        raise ApiError("all research sources failed", 502, "Google data is not available right now. Try again in a minute.")

    # Best keywords: real volume, prefer rising and lower competition.
    comp_w = {"LOW": 1.0, "MEDIUM": 0.8, "HIGH": 0.6}
    for k in kws:
        k["score"] = round((k["volume"] ** 0.5) * comp_w.get(k["competition"] or "", 0.8)
                           * (1 + max(-50, min(200, k["trend"] or 0)) / 200), 1)
    kws.sort(key=lambda k: -k["score"])
    kws = kws[:25]

    comp_names = [c for c in (competitors or []) if isinstance(c, str)][:6]
    trend_lines = "\n".join(f"- {k}: {c:+d}% (first vs last weeks of 90 days)"
                            for k, c in zip(graph.get("keywords") or [], graph.get("change") or []))
    kw_lines = "\n".join(f"- {k['keyword']} | {k['volume']}/mo | CPC {k['cpc'] if k['cpc'] is not None else '-'} | "
                         f"{k['competition'] or '-'} | 3-mo trend {('%+d%%' % k['trend']) if k['trend'] is not None else '-'}"
                         for k in kws[:20])
    serp_lines = "\n".join(f"- #{o['rank']} {o['domain']}: {o['title']}" for o in sr["organic"])
    month = datetime.now(ZoneInfo("America/Chicago")).strftime("%B %Y")
    comp_list = "; ".join(f"{g}: {', '.join(v)}" for g, v in COMPETITORS.items())

    ai = openai_json(s, max_tokens=2500, temperature=0.5, timeout=150, effort="low",
                     system=("You are the head of content and SEO (including AEO and GEO: being the answer in Google's "
                             "AI Overviews and getting cited by ChatGPT, Gemini and Perplexity) for WorldDigital.ai. "
                             "You plan blog posts that bring in customers. You only use the data given. Reply with JSON only."),
                     user=(f"About us:\n{ABOUT_US}\n\nMarket: {label}. Month: {month}. Topic: {topic or 'our products and services overall'}\n"
                           f"Audience: {AUDIENCES[audience]}.{(' Industry focus: ' + industry + '.') if industry else ''}\n\n"
                           f"Google Trends, past 3 months:\n{trend_lines or '(no data)'}\n"
                           f"Rising related searches: {', '.join(q['query'] + ' (+' + q['value'] + '%)' for q in queries['rising']) or '(none)'}\n"
                           f"Top related searches: {', '.join(q['query'] for q in queries['top']) or '(none)'}\n\n"
                           f"Keywords (keyword | monthly searches | CPC USD | competition | 3-month trend):\n{kw_lines or '(no data)'}\n\n"
                           f"Google page 1 for \"{main_kw}\":\n{serp_lines or '(no data)'}\n"
                           f"People also ask: {' | '.join(sr['questions']) or '(none)'}\n"
                           f"Google AI Overview shown: {'yes' if sr['ai_overview']['present'] else 'no'}; cites: "
                           f"{', '.join(x['domain'] for x in sr['ai_overview']['sources']) or '(none)'}\n\n"
                           f"Known competitors: {comp_list}\n"
                           f"{'The editor wants comparisons with: ' + ', '.join(comp_names) if comp_names else ''}\n\n"
                           "Suggest 12 blog posts, best first, that are trending now and that we can realistically rank for "
                           "and be cited by AI for. Include at least 4 comparison posts (type \"vs\", e.g. \"WorldDigital.ai vs "
                           "HubSpot vs WebFX for multi-location SEO\") and 2 \"alternatives\" posts against the competitors "
                           "most relevant to this topic, and use rising searches where they fit what we sell. Never suggest "
                           "a post about something we do not offer. Every idea must speak to the audience above"
                           f"{(' and, where it fits, the ' + industry + ' industry') if industry else ''}: "
                           f"{AUDIENCE_RULES[audience]}\n"
                           "For each: title (max 70 chars), keyword (the main search phrase, from the data when possible), "
                           f"type (one of {', '.join(POST_TYPES)}), competitors (names, only for vs/alternatives), "
                           "why (max 22 words, cite the data: trend %, volume or AI Overview), score (1-100).\n"
                           "Also list the 8 competitors that matter most for this topic with what they offer that we "
                           "compete with (max 12 words), and 3 short notes on what the top-ranking and AI-cited pages do "
                           "that our post should also do.\n"
                           'JSON: {"ideas":[{"title":"","keyword":"","type":"","competitors":[],"why":"","score":0}],'
                           '"competitors":[{"name":"","offers":""}],"notes":[""]}'))

    ideas = []
    for it in ai.get("ideas") or []:
        if not isinstance(it, dict) or not it.get("title"):
            continue
        ideas.append({"title": str(it["title"])[:120], "keyword": _clean_phrase(it.get("keyword") or it["title"])[:80],
                      "type": it.get("type") if it.get("type") in POST_TYPES else "how-to",
                      "competitors": [str(c)[:40] for c in it.get("competitors") or [] if c][:4],
                      "why": str(it.get("why") or "")[:200], "score": _num(it.get("score")) or 0})
    ideas.sort(key=lambda x: -x["score"])
    return {
        "topic": topic, "country": country if country in COUNTRIES else "us", "market": label, "month": month,
        "trend": graph, "rising": queries["rising"], "top": queries["top"], "keywords": kws, "serp": sr,
        "ideas": ideas[:15],
        "competitors": [{"name": str(c.get("name"))[:40], "offers": str(c.get("offers") or "")[:120]}
                        for c in ai.get("competitors") or [] if isinstance(c, dict) and c.get("name")][:10],
        "notes": [str(n)[:240] for n in ai.get("notes") or [] if n][:5],
        "unavailable": failed,
    }


# ── Draft a full post ───────────────────────────────────────────────────────

def _slug(t: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", t.lower().replace("&", " and ")).strip("-")
    return s[:80].rstrip("-")


def draft(s: Settings, *, title: str, keyword: str = "", type: str = "how-to", competitors: list[str] | None = None,
          notes: str = "", country: str = "us", words: int = 1600, facts: str = "", audience: str = "midlarge",
          industry: str = "") -> dict:
    label, loc = _country(country)
    title = " ".join(str(title or "").split())[:140]
    if not title:
        raise ApiError("no title", 400, "Pick an idea or type a title first.")
    keyword = _clean_phrase(keyword or title)[:80]
    ptype = type if type in POST_TYPES else "how-to"
    comps = [str(c)[:40] for c in (competitors or []) if c][:5]
    words = max(800, min(int(_num(words) or 1600), 2500))
    sr, _ = _safe(serp, s, keyword, loc, default={"organic": [], "questions": [], "ai_overview": {"present": False, "sources": [], "text": ""}, "related": []})
    month = datetime.now(ZoneInfo("America/Chicago")).strftime("%B %Y")

    research_text = "\n".join(f"- #{o['rank']} {o['domain']} — {o['title']}: {o['snippet']}" for o in sr["organic"])
    type_rules = {
        "vs": (f"A fair comparison of {', '.join(['WorldDigital.ai'] + comps) if comps else 'the options in the title'}. "
               "Start with a short verdict (who each option is best for). Include a Markdown comparison table "
               "(rows: what it is, best for, pricing model, free option, SEO/AEO/GEO coverage, done-for-you help, "
               "contract). Then a section per option with honest pros and cons, including where a competitor is the "
               "better choice. End with how to choose."),
        "alternatives": (f"The best alternatives to {', '.join(comps) or 'the product in the title'}, with WorldDigital.ai "
                         "as one honest option, not every one. A comparison table, then a short section per alternative "
                         "with who it is best for."),
        "list": "A ranked or grouped list with a one-paragraph explanation per item and a summary table.",
        "how-to": "Numbered steps the reader's team can follow, with examples.",
        "what-is": "A plain-English definition first, then how it works, why it matters now, and how to start.",
        "local": "Specific to the city in the title: local search behaviour, Google Maps, and a local checklist.",
        "pricing": "Real cost ranges with what drives the price, a table, and how to avoid overpaying.",
    }[ptype]

    out = openai_json(s, max_tokens=7000, temperature=0.6, timeout=240, effort="low",
                      system=("You write blog posts for WorldDigital.ai that rank on Google and get cited by AI answers "
                              "(ChatGPT, Gemini, Perplexity, Google AI Overviews). Plain, confident English for busy "
                              "decision-makers: short sentences, no hype, no filler, no em-dash overuse. You are honest: "
                              "you never invent statistics, studies, quotes, customer stories, awards or competitor "
                              "prices. You state a competitor fact only if it appears in the research or is widely known "
                              "and stable; otherwise say it varies and to check their current pricing page. "
                              "Reply with JSON only."),
                      user=(f"About us (facts you may use):\n{ABOUT_US}\n\nMarket: {label}. Today: {month}.\n"
                            f"Reader: {AUDIENCES[_aud(audience)]}.{(' Industry: ' + industry[:60] + '.') if industry else ''} "
                            f"{AUDIENCE_RULES[_aud(audience)]}\n"
                            f"Post title: {title}\nMain keyword: {keyword}\nPost type: {POST_TYPES[ptype]}. {type_rules}\n"
                            f"{'Editor notes: ' + notes[:1000] if notes else ''}\n\n"
                            f"{'From our own website (accurate facts and pages you may cite and link to with the relative path shown):' + chr(10) + facts[:5000] + chr(10) + chr(10) if facts else ''}"
                            f"Google page 1 for \"{keyword}\" (research; do not copy):\n{research_text or '(not available)'}\n"
                            f"People also ask: {' | '.join(sr['questions']) or '(none)'}\n"
                            f"AI Overview summary: {sr['ai_overview'].get('text') or '(none)'}\n"
                            f"Related searches: {', '.join(sr['related']) or '(none)'}\n\n"
                            f"Write the full post, about {words} words, in Markdown (## and ### headings, lists, tables, "
                            "**bold**; no # H1, the title is shown separately). Structure for SEO, AEO and GEO:\n"
                            "1. Open with a 2-3 sentence direct answer to the main question (the snippet AI tools quote).\n"
                            "2. Use the main keyword naturally in the first 100 words and in one ## heading.\n"
                            "3. Headings phrased as the questions people search; answer each in its first sentence.\n"
                            "4. At least one table or numbered list that summarises the key facts.\n"
                            f"5. Mention it is current as of {month} where facts can change.\n"
                            "6. Link to 2-4 of our pages with relative links like [free SEO report](/free-seo-report) "
                            "where they genuinely help; no links to competitors' sites.\n"
                            "7. A '## Frequently asked questions' section with 4-6 questions (use People also ask) as "
                            "### headings, each answered in 2-3 sentences.\n"
                            "8. End with a short next step that fits the post (e.g. run the free report or contact us).\n"
                            "Also return: seo_title (max 60 chars, keyword first), description (140-158 chars), "
                            "excerpt (1-2 sentences, max 200 chars), category (2-3 words, e.g. 'AI SEO', 'Comparisons', "
                            "'Local SEO'), image_idea (a cover photo idea, max 20 words).\n"
                            'JSON: {"title":"","seo_title":"","description":"","excerpt":"","category":"","image_idea":"","body":""}'))

    body = str(out.get("body") or "").strip()
    if len(body) < 400:
        raise ApiError("draft too short", 502, "The writer returned an empty draft. Please try again.")
    body = re.sub(r"^# [^\n]*\n+", "", body)  # the title is shown separately
    t = " ".join(str(out.get("title") or title).split())[:140]
    return {"title": t, "slug": _slug(t), "seo_title": str(out.get("seo_title") or "")[:90],
            "description": str(out.get("description") or "")[:200], "excerpt": str(out.get("excerpt") or "")[:300],
            "category": str(out.get("category") or ("Comparisons" if ptype in ("vs", "alternatives") else ""))[:40],
            "image_idea": str(out.get("image_idea") or "")[:200], "body": body[:120000], "keyword": keyword,
            "sources": [{"domain": o["domain"], "title": o["title"], "url": o["url"]} for o in sr["organic"][:5]]}


# ── Social posts for Buffer + cover image ──────────────────────────────────

SOCIAL_LIMITS = {"linkedin": 1300, "facebook": 900, "instagram": 2000, "x": 250, "google": 1400, "tiktok": 900}


def social(s: Settings, *, title: str, excerpt: str = "", url: str, keyword: str = "", category: str = "",
           audience: str = "midlarge") -> dict:
    """One caption per platform for a new blog post. Links: X/LinkedIn/Facebook/Google carry the URL;
    Instagram and TikTok say 'link in bio' (links in captions are not clickable there)."""
    title = " ".join(str(title or "").split())[:140]
    if not title or not str(url).startswith("https://"):
        raise ApiError("bad social input", 400, "A title and a page address are needed.")
    out = openai_json(s, max_tokens=1800, temperature=0.7, timeout=90, effort="low",
                      system=(f"You write social posts for WorldDigital.ai that make {AUDIENCES[_aud(audience)]} click through to "
                              "a new blog post. Plain, specific, no hype, no clickbait, no invented numbers. Reply with JSON only."),
                      user=(f"Blog post: {title}\nSummary: {excerpt[:400]}\nMain keyword: {keyword}\nTopic: {category}\n\n"
                            "Write one post per platform, each opening with a hook from the post's real content:\n"
                            "- linkedin: 3-5 short lines, professional, end with 3 hashtags (max 1200 chars)\n"
                            "- facebook: 2-3 friendly sentences (max 600 chars)\n"
                            "- instagram: caption with line breaks, end with 'Link in bio.' and 8-12 relevant hashtags (max 1800 chars)\n"
                            "- x: one punchy sentence plus 1-2 hashtags (max 220 chars, the link is added after)\n"
                            "- google: 2-3 sentences for a Google Business Profile update, no hashtags, no links (max 900 chars)\n"
                            "- tiktok: short caption, end with 'Link in bio.' and 4-6 hashtags (max 600 chars)\n"
                            "Do not include any URLs; we add them. Do not use emoji more than twice per post.\n"
                            'JSON: {"linkedin":"","facebook":"","instagram":"","x":"","google":"","tiktok":""}'))
    res = {}
    for k, n in SOCIAL_LIMITS.items():
        t = re.sub(r"https?://\S+", "", str(out.get(k) or "")).strip()
        res[k] = t[:n].rstrip() if t else title
    for k in ("linkedin", "facebook", "x"):
        res[k] = f"{res[k]}\n\n{url}" if k != "x" else f"{res[k][:250].rstrip()} {url}"
    return res


_IMAGE_MODELS = ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"]


def cover_image(s: Settings, *, title: str, keyword: str = "", idea: str = "") -> dict:
    """A square cover photo for the post (also used for Instagram/TikTok/Google). JPEG, base64."""
    if not s.openai_api_key:
        raise ApiError("OPENAI_API_KEY missing", 503, "The image generator is being set up.")
    prompt = (f"Modern, clean editorial illustration for a business blog post titled \"{title[:140]}\" "
              f"(topic: {keyword or title}). {idea[:200]} Flat vector style with soft depth, navy (#0E1A2B), "
              "warm red (#C13A2A) and white, plenty of empty space, professional and optimistic. "
              "Absolutely no text, letters, numbers, logos, brand marks or real people's faces.")
    last = None
    for model in _IMAGE_MODELS:
        body = {"model": model, "prompt": prompt, "size": "1024x1024", "quality": "medium", "n": 1,
                "output_format": "jpeg", "output_compression": 82}
        res = httpx.post(f"{s.openai_base}/v1/images/generations", headers={"Authorization": f"Bearer {s.openai_api_key}"},
                         json=body, timeout=180)
        if res.status_code in (400, 403, 404) and "model" in res.text:
            last = res
            print(f"image model {model} refused: {res.status_code} {res.text[:200]}", flush=True)
            continue
        if res.status_code >= 400:
            raise ApiError(f"OpenAI images {res.status_code}: {res.text[:300]}", 502, "The cover image could not be made.")
        b64 = ((res.json().get("data") or [{}])[0]).get("b64_json")
        if not b64:
            raise ApiError("no image returned", 502, "The cover image could not be made.")
        record_usage("blog_ai.cover_image", model, res.json().get("usage"), units=1)
        return {"b64": b64, "type": "image/jpeg", "alt": f"Illustration for {title[:120]}", "model": model}
    raise ApiError(f"no image model available: {last.status_code if last else '-'} {last.text[:200] if last else ''}", 502,
                   "The cover image could not be made.")
