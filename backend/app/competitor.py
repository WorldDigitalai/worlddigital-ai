"""Competitor SEO analysis, run as a WD-IEE plan (engine.py).

For your site and one to three competitors, these run at the same time, per site:
  page       read the home page once (title, description, headings, text)
  rank       search visibility: ranking keywords and estimated monthly visits (DataForSEO Labs domain_rank_overview)
  keywords   the keywords the site ranks for (DataForSEO Labs ranked_keywords)
  links      backlink summary (DataForSEO backlinks/summary)
Then, from those results:
  technical  page basics compared side by side (computed, no AI)
  gaps       keywords a competitor ranks for in the top 20 and you do not (computed, no AI)
  insights   the AI reads the computed facts and writes a summary and actions
  report     merges everything and validates it: every number comes from the data, and an action may only name a
             gap keyword that is really in the list

Every data task is optional: a source that fails is reported as unavailable instead of sinking the report. Data
lookups are reused for a day per site. One run makes at most 3 DataForSEO calls per site (12 for four sites) and
one AI call. The same three DataForSEO endpoints already power the free SEO report.
"""
from __future__ import annotations

from . import engine
from .config import Settings
from .services import ApiError, _dfs, openai_json, read_site

MAX_COMPETITORS = 3
LOC = {"location_code": 2840, "language_code": "en"}   # United States, English
TOP = 20                                               # "ranks" = position 20 or better
DAY = 86400


def _site(ctx: dict, i: int) -> str:
    return ctx["input"]["sites"][i]


def _page(i: int):
    return lambda ctx: read_site(f"https://{_site(ctx, i)}/", fetch_base=ctx["input"]["s"].test_site_base)


def _rank(i: int):
    def fn(ctx: dict) -> dict:
        res = _dfs(ctx["input"]["s"], "/v3/dataforseo_labs/google/domain_rank_overview/live", {"target": _site(ctx, i), **LOC})
        org = ((((res or [{}])[0] or {}).get("items") or [{}])[0].get("metrics") or {}).get("organic") or {}
        top3 = (org.get("pos_1") or 0) + (org.get("pos_2_3") or 0)
        return {"keywords": org.get("count") or 0, "visits": round(org.get("etv") or 0),
                "top3": top3, "top10": top3 + (org.get("pos_4_10") or 0)}
    return fn


def _keywords(i: int):
    def fn(ctx: dict) -> list[dict]:
        res = _dfs(ctx["input"]["s"], "/v3/dataforseo_labs/google/ranked_keywords/live", {
            "target": _site(ctx, i), **LOC, "limit": 100, "order_by": ["ranked_serp_element.serp_item.etv,desc"]})
        out = []
        for it in ((res or [{}])[0] or {}).get("items") or []:
            kd = it.get("keyword_data") or {}
            pos = ((it.get("ranked_serp_element") or {}).get("serp_item") or {}).get("rank_absolute")
            if kd.get("keyword") and isinstance(pos, int):
                out.append({"keyword": str(kd["keyword"]).lower().strip(),
                            "volume": (kd.get("keyword_info") or {}).get("search_volume") or 0, "position": pos})
        return out
    return fn


def _links(i: int):
    def fn(ctx: dict) -> dict:
        res = _dfs(ctx["input"]["s"], "/v3/backlinks/summary/live", {
            "target": _site(ctx, i), "include_subdomains": True, "backlinks_status_type": "live"})
        r = (res or [{}])[0] or {}
        return {"referring_domains": r.get("referring_main_domains") or r.get("referring_domains") or 0,
                "backlinks": r.get("backlinks") or 0, "rank": r.get("rank") or 0}
    return fn


def _technical(n: int):
    def fn(ctx: dict) -> list[dict]:
        rows = []
        for i in range(n):
            p = ctx[f"page:{i}"]
            rows.append({"site": _site(ctx, i), "readable": bool(p), **({} if not p else {
                "title": p["title"], "title_length": len(p["title"]), "has_description": bool(p["description"]),
                "description_length": len(p["description"]), "headings": len(p["headings"]), "words": len(p["text"].split())})})
        return rows
    return fn


def _gaps(n: int):
    def fn(ctx: dict) -> list[dict]:
        """Keywords at least one competitor ranks for in the top 20 where you are absent or below 20."""
        mine = {k["keyword"]: k["position"] for k in ctx["keywords:0"] or []}
        gaps: dict[str, dict] = {}
        for i in range(1, n):
            for k in ctx[f"keywords:{i}"] or []:
                if k["position"] > TOP or mine.get(k["keyword"], 999) <= TOP:
                    continue
                g = gaps.setdefault(k["keyword"], {"keyword": k["keyword"], "volume": k["volume"],
                                                   "your_position": mine.get(k["keyword"]), "competitors": []})
                g["competitors"].append({"site": _site(ctx, i), "position": k["position"]})
        return sorted(gaps.values(), key=lambda g: (-g["volume"], g["keyword"]))[:30]
    return fn


def _insights(n: int):
    def fn(ctx: dict) -> dict:
        sites = ctx["input"]["sites"]
        lines = []
        for i in range(n):
            r, l, p = ctx[f"rank:{i}"], ctx[f"links:{i}"], ctx[f"page:{i}"]
            lines.append(f"{'YOU' if i == 0 else 'COMPETITOR'} {sites[i]}: "
                         + (f"{r['keywords']} ranking keywords, about {r['visits']} visits a month, {r['top10']} in the top 10" if r else "visibility unavailable")
                         + "; " + (f"{l['referring_domains']} linking websites" if l else "backlinks unavailable")
                         + "; " + (f"title \"{p['title'][:90]}\"" if p else "page unreadable"))
        gaps = ctx["gaps"]
        table = "\n".join(f"{j} | {g['keyword']} | {g['volume']} | " + ", ".join(f"{c['site']} #{c['position']}" for c in g["competitors"])
                          for j, g in enumerate(gaps)) or "(no gaps found)"
        return openai_json(ctx["input"]["s"], max_tokens=900, temperature=0.2, feature="competitor.insights",
                           system="You are a senior SEO strategist. Use only the facts given. Never state a number that is not "
                                  "in the facts. Reply with JSON only.",
                           user=("Facts:\n" + "\n".join(lines) + "\n\nKeyword gaps (index | keyword | monthly searches | who ranks):\n" + table
                                 + "\n\nWrite a plain-English summary (max 60 words) of where YOU stand against the competitors, and up to "
                                   "5 actions, most valuable first. Each action: what to do (max 22 words) and, when it targets a gap "
                                   "keyword, that keyword's index from the list (otherwise null).\n"
                                   'JSON: {"summary": "", "actions": [{"do": "", "gap": 0}]}'))
    return fn


def _report(n: int):
    def fn(ctx: dict) -> dict:
        sites, gaps = ctx["input"]["sites"], ctx["gaps"]
        ins = ctx["insights"] if isinstance(ctx["insights"], dict) else {}   # anything else from the AI is ignored
        rows, missing = [], []
        for i in range(n):
            row = {"site": sites[i], "you": i == 0, "visibility": ctx[f"rank:{i}"], "backlinks": ctx[f"links:{i}"],
                   "keywords_found": len(ctx[f"keywords:{i}"] or [])}
            missing += [f"{name} for {sites[i]}" for name, key in (("search visibility", "rank"), ("keywords", "keywords"), ("backlinks", "links"))
                        if ctx[f"{key}:{i}"] is None]
            rows.append(row)
        if all(r["visibility"] is None and not r["keywords_found"] and r["backlinks"] is None for r in rows):
            raise ApiError("no competitor data", 422, "We couldn't get search data for these websites. Check the addresses and try again.")
        actions = []
        for a in (ins.get("actions") or [])[:5]:
            if not isinstance(a, dict) or not str(a.get("do") or "").strip():
                continue
            g = a.get("gap")
            ok = isinstance(g, int) and not isinstance(g, bool) and 0 <= g < len(gaps)
            actions.append({"do": " ".join(str(a["do"]).split())[:220], "keyword": gaps[g]["keyword"] if ok else None})
        return {"sites": rows, "technical": ctx["technical"], "gaps": gaps,
                "summary": " ".join(str(ins.get("summary") or "").split())[:500], "actions": actions,
                "unavailable": missing + ([] if ins else ["written summary"])}
    return fn


def build(n: int) -> engine.Plan:
    """The plan for your site plus n-1 competitors. Built and checked once per size, at import."""
    tasks = []
    for i in range(n):
        key = (lambda i: lambda c: [c["input"]["sites"][i]])(i)
        tasks += [engine.Task(f"page:{i}", _page(i), optional=True),
                  engine.Task(f"rank:{i}", _rank(i), optional=True, cache_ttl=DAY, cache_key=key),
                  engine.Task(f"keywords:{i}", _keywords(i), optional=True, cache_ttl=DAY, cache_key=key),
                  engine.Task(f"links:{i}", _links(i), optional=True, cache_ttl=DAY, cache_key=key)]
    every = lambda *kinds: tuple(f"{k}:{i}" for k in kinds for i in range(n))  # noqa: E731
    tasks += [engine.Task("technical", _technical(n), needs=every("page")),
              engine.Task("gaps", _gaps(n), needs=every("keywords")),
              engine.Task("insights", _insights(n), needs=("gaps", *every("rank", "links", "page")), optional=True),
              engine.Task("report", _report(n), needs=("technical", "gaps", "insights", *every("rank", "keywords", "links")))]
    return engine.Plan(f"competitors-{n - 1}", tasks)


PLANS = {n: build(n) for n in range(2, MAX_COMPETITORS + 2)}


def analyze(s: Settings, *, domain: str, competitors: list[str], workers: int = 8, policy: str = "if_needed") -> dict:
    sites = [domain] + [c for c in dict.fromkeys(competitors) if c != domain]
    if not 2 <= len(sites) <= MAX_COMPETITORS + 1:
        raise ApiError("bad competitor count", 400, f"Give 1 to {MAX_COMPETITORS} competitor websites, different from yours.")
    run = engine.execute(PLANS[len(sites)], {"s": s, "sites": sites}, workers=workers, policy=policy)
    return {**run.results["report"], "run": {"id": run.id, "ms": run.ms, "task_ms": sum(t["ms"] for t in run.tasks)}}
