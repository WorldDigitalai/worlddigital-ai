"""Site audit for our own domains, powered by DataForSEO (keywords, SERP, on-page, AI answers).

Only runs for Settings.test_domains and is cached, so it can't be used to spend DataForSEO credit on other sites.
"""
from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor

import httpx

from .config import Settings

US = 2840

TARGETS = [
    "ai seo agency", "ai seo services", "seo agency for small business", "seo services for small business",
    "local seo services", "generative engine optimization", "answer engine optimization", "ai search optimization",
    "google ads management", "google ads agency", "ppc management services", "keyword research services",
    "keyword research tool", "content marketing services", "seo content writing services",
    "small business website design", "digital marketing agency for small business", "ai marketing agency",
    "multi location seo", "franchise seo", "free seo audit", "seo checker", "houston seo company",
    "web design murfreesboro tn", "seo for enterprise", "chatgpt seo", "how to rank in chatgpt",
]

SERP_CHECK = ["ai seo agency", "ai seo services", "generative engine optimization agency", "seo services for small business",
              "keyword research tool", "content marketing services", "google ads agency for small business",
              "houston seo company", "web design murfreesboro tn", "free seo audit"]

LLM_PROMPTS = [
    "What are the best AI SEO agencies for small businesses in the US and Canada?",
    "Which company can help my business show up in ChatGPT and Google AI Overviews?",
    "Recommend an affordable SEO and Google Ads agency for a small business.",
]


def _post(s: Settings, path: str, tasks: list[dict], timeout: int = 120) -> list:
    res = httpx.post(f"{s.dataforseo_base}{path}", auth=(s.dataforseo_login, s.dataforseo_password), json=tasks,
                     timeout=timeout)
    data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
    if res.status_code >= 400:
        raise RuntimeError(f"{path} {res.status_code} {str(data.get('status_message', res.text))[:200]}")
    return data.get("tasks") or []


def _safe(fn):
    try:
        return fn()
    except Exception as e:  # noqa: BLE001
        return {"error": f"{type(e).__name__}: {str(e)[:300]}"}


def ranked_keywords(s: Settings, domain: str) -> dict:
    t = _post(s, "/v3/dataforseo_labs/google/ranked_keywords/live", [{
        "target": domain, "location_code": US, "language_code": "en", "limit": 100,
        "order_by": ["keyword_data.keyword_info.search_volume,desc"]}])[0]
    r = (t.get("result") or [{}])[0] or {}
    items = []
    for it in r.get("items") or []:
        kd, se = it.get("keyword_data") or {}, (it.get("ranked_serp_element") or {}).get("serp_item") or {}
        items.append({"kw": kd.get("keyword"), "vol": (kd.get("keyword_info") or {}).get("search_volume"),
                      "pos": se.get("rank_group"), "url": (se.get("relative_url") or se.get("url") or "")[:80],
                      "type": se.get("type")})
    return {"total": r.get("total_count"), "metrics": (r.get("metrics") or {}).get("organic"), "items": items,
            "status": t.get("status_message")}


def target_volumes(s: Settings) -> dict:
    t = _post(s, "/v3/keywords_data/google_ads/search_volume/live", [{
        "keywords": TARGETS, "location_code": US, "language_code": "en"}])[0]
    rows = [{"kw": r.get("keyword"), "vol": r.get("search_volume"), "cpc": r.get("cpc"), "comp": r.get("competition")}
            for r in (t.get("result") or [])]
    return {"items": sorted(rows, key=lambda r: -(r["vol"] or 0)), "status": t.get("status_message")}


def serp(s: Settings, domain: str) -> list:
    def one(k):
        t = _post(s, "/v3/serp/google/organic/live/regular",
                  [{"keyword": k, "location_code": US, "language_code": "en", "depth": 30}])[0]
        r = (t.get("result") or [{}])[0] or {}
        items = [i for i in (r.get("items") or []) if i.get("type") == "organic"]
        ours = next((i for i in items if domain in (i.get("domain") or "")), None)
        ai = next((i for i in (r.get("items") or []) if i.get("type") == "ai_overview"), None)
        ai_refs = [x.get("domain") for x in ((ai or {}).get("references") or [])][:10]
        return {"kw": k, "our_pos": ours and ours.get("rank_group"), "our_url": ours and ours.get("url"),
                "top5": [i.get("domain") for i in items[:5]],
                "features": sorted({i.get("type") for i in (r.get("items") or [])} - {"organic"}),
                "ai_overview_refs": ai_refs, "status": t.get("status_message")}
    with ThreadPoolExecutor(5) as ex:
        return list(ex.map(lambda k: _safe(lambda: one(k)), SERP_CHECK))


def onpage(s: Settings, origin: str, paths: list[str]) -> list:
    def one(p):
        t = _post(s, "/v3/on_page/instant_pages", [{"url": origin + p, "enable_javascript": False}])[0]
        r = (t.get("result") or [{}])[0] or {}
        it = (r.get("items") or [{}])[0] or {}
        meta = it.get("meta") or {}
        checks = it.get("checks") or {}
        bad = sorted(k for k, v in checks.items() if v is True and k not in GOOD_CHECKS)
        return {"url": p, "status": it.get("status_code"), "score": it.get("onpage_score"),
                "title": meta.get("title"), "title_len": meta.get("title_length"),
                "desc_len": meta.get("description_length"), "h1": (meta.get("htags") or {}).get("h1"),
                "words": (meta.get("content") or {}).get("plain_text_word_count"),
                "readability": (meta.get("content") or {}).get("flesch_kincaid_readability_index"),
                "internal_links": meta.get("internal_links_count"),
                "size_kb": round((it.get("size") or 0) / 1024), "load_ms": (it.get("page_timing") or {}).get("duration_time"),
                "issues": bad, "task": t.get("status_message")}
    with ThreadPoolExecutor(5) as ex:
        return list(ex.map(lambda p: _safe(lambda: one(p)), paths))


# OnPage "checks" that are True when things are GOOD.
GOOD_CHECKS = {"is_https", "has_html_doctype", "canonical", "seo_friendly_url", "seo_friendly_url_characters_check",
               "seo_friendly_url_dynamic_check", "seo_friendly_url_keywords_check", "seo_friendly_url_relative_length_check",
               "has_meta_title", "has_meta_description", "is_www", "has_render_blocking_resources_false", "is_http"}


def llm(s: Settings, brand: str) -> list:
    out = []
    for prompt in LLM_PROMPTS:
        def one(prompt=prompt):
            t = _post(s, "/v3/ai_optimization/chat_gpt/llm_responses/live", [{
                "user_prompt": prompt, "model_name": "gpt-4o-mini", "web_search": True}], timeout=150)[0]
            r = (t.get("result") or [{}])[0] or {}
            text = " ".join(str(m.get("text") or "") for it in (r.get("items") or [])
                            for m in (it.get("sections") or [it]))[:6000]
            cited = [a.get("url") for it in (r.get("items") or []) for a in (it.get("annotations") or []) if a.get("url")]
            doms = sorted({re.sub(r"^www\.", "", (re.findall(r"https?://([^/]+)", u) or [""])[0]) for u in cited} - {""})
            return {"prompt": prompt, "mentioned": bool(re.search(brand, text, re.I)) or any(brand.lower() in (u or "").lower() for u in cited),
                    "answer": text[:900], "cited_domains": doms[:15],
                    "status": t.get("status_message"), "cost": t.get("cost")}
        out.append(_safe(one))
    return out


def run(s: Settings, domain: str) -> dict:
    origin = f"https://{domain}"
    sm = httpx.get(f"{origin}/sitemap.xml", timeout=20).text
    paths = [u.replace(origin, "") or "/" for u in re.findall(r"<loc>([^<]+)</loc>", sm)][:60]
    with ThreadPoolExecutor(5) as ex:
        f = {
            "ranked": ex.submit(_safe, lambda: ranked_keywords(s, domain)),
            "targets": ex.submit(_safe, lambda: target_volumes(s)),
            "serp": ex.submit(_safe, lambda: serp(s, domain)),
            "onpage": ex.submit(_safe, lambda: onpage(s, origin, paths)),
            "llm": ex.submit(_safe, lambda: llm(s, "worlddigital")),
        }
        return {"paths": len(paths), **{k: v.result() for k, v in f.items()}}
