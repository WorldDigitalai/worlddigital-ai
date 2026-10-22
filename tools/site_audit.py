#!/usr/bin/env python3
"""Crawl worlddigital.ai and worlddigital.us like a search engine and report every problem.

For each sitemap URL: status, redirects, X-Robots-Tag, title/description length, canonical,
robots meta, H1 count, JSON-LD validity and types. Then every internal link found on those pages
is checked, and the home page is fetched as Googlebot, Bingbot and the main AI crawlers.
Writes a Markdown report (also to $GITHUB_STEP_SUMMARY) and site-audit.json.
"""
import concurrent.futures as cf, json, os, re, sys, urllib.parse, urllib.request, urllib.error
from html.parser import HTMLParser

SITES = ["https://worlddigital.ai", "https://worlddigital.us"]
UA = "Mozilla/5.0 (compatible; WorldDigitalSiteAudit/1.0; +https://worlddigital.ai)"
BOTS = {
    "Googlebot": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Bingbot": "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "GPTBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
    "OAI-SearchBot": "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
    "ClaudeBot": "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "PerplexityBot": "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


OPEN = urllib.request.build_opener(NoRedirect)


def fetch(url, ua=UA, follow=True, hops=5):
    chain = []
    for _ in range(hops):
        req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "text/html,*/*"})
        try:
            r = OPEN.open(req, timeout=25)
            body = r.read(3_000_000).decode("utf-8", "replace")
            return {"status": r.status, "url": url, "chain": chain, "headers": dict(r.headers), "body": body}
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 307, 308) and follow:
                chain.append((e.code, url))
                url = urllib.parse.urljoin(url, e.headers.get("Location", ""))
                continue
            return {"status": e.code, "url": url, "chain": chain, "headers": dict(e.headers or {}), "body": ""}
        except Exception as e:  # network error
            return {"status": 0, "url": url, "chain": chain, "headers": {}, "body": "", "error": str(e)[:120]}
    return {"status": -1, "url": url, "chain": chain, "headers": {}, "body": "", "error": "too many redirects"}


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title, self.in_title, self.h1, self.links, self.ld, self.in_ld, self.meta, self.canon = "", False, 0, set(), [], False, {}, None
        self.imgs_no_alt = 0

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag == "title": self.in_title = True
        elif tag == "h1": self.h1 += 1
        elif tag == "a" and a.get("href"): self.links.add(a["href"])
        elif tag == "meta" and a.get("name"): self.meta[a["name"].lower()] = a.get("content", "")
        elif tag == "link" and a.get("rel") == "canonical": self.canon = a.get("href")
        elif tag == "script" and a.get("type") == "application/ld+json": self.in_ld, self._buf = True, ""
        elif tag == "img" and not (a.get("alt") or "").strip() and a.get("alt") != "": self.imgs_no_alt += 1

    def handle_endtag(self, tag):
        if tag == "title": self.in_title = False
        if tag == "script" and self.in_ld: self.in_ld = False; self.ld.append(self._buf)

    def handle_data(self, d):
        if self.in_title: self.title += d
        if self.in_ld: self._buf += d


def sitemap_urls(site):
    r = fetch(site + "/sitemap.xml")
    urls = re.findall(r"<loc>([^<]+)</loc>", r["body"])
    # sitemap index -> child sitemaps
    if "<sitemapindex" in r["body"]:
        out = []
        for sm in urls: out += re.findall(r"<loc>([^<]+)</loc>", fetch(sm)["body"])
        urls = out
    return [u.strip() for u in urls if "/media/" not in u]


def audit_page(url):
    r = fetch(url)
    issues = []
    if r["status"] != 200: issues.append(f"status {r['status']}")
    if r["chain"]: issues.append("sitemap URL redirects -> " + r["url"])
    xr = (r["headers"].get("X-Robots-Tag") or r["headers"].get("x-robots-tag") or "")
    if "noindex" in xr.lower(): issues.append("X-Robots-Tag noindex")
    p = Page(); p.feed(r["body"])
    t, d = p.title.strip(), p.meta.get("description", "")
    rb = p.meta.get("robots", "")
    if "noindex" in rb: issues.append("meta robots noindex")
    if not t: issues.append("no title")
    elif len(t) > 66: issues.append(f"title {len(t)} chars")
    if not d: issues.append("no description")
    elif not 70 <= len(d) <= 165: issues.append(f"description {len(d)} chars")
    if not p.canon: issues.append("no canonical")
    elif p.canon.rstrip("/") != url.rstrip("/"): issues.append(f"canonical -> {p.canon}")
    if p.h1 != 1: issues.append(f"{p.h1} H1s")
    if p.imgs_no_alt: issues.append(f"{p.imgs_no_alt} images without alt")
    types = []
    for raw in p.ld:
        try:
            j = json.loads(raw)
            for n in (j.get("@graph") if isinstance(j, dict) and "@graph" in j else [j]):
                tp = n.get("@type") if isinstance(n, dict) else None
                types += tp if isinstance(tp, list) else [tp] if tp else []
        except Exception:
            issues.append("invalid JSON-LD")
    if not types: issues.append("no schema")
    return {"url": url, "status": r["status"], "title": t, "tlen": len(t), "dlen": len(d), "h1": p.h1,
            "schema": sorted(set(types)), "issues": issues, "links": sorted(p.links), "bytes": len(r["body"])}


def main():
    report, data, all_links = [], {}, {}
    with cf.ThreadPoolExecutor(12) as ex:
        for site in SITES:
            host = urllib.parse.urlparse(site).netloc
            urls = sitemap_urls(site)
            pages = list(ex.map(audit_page, urls))
            data[host] = {"sitemap_count": len(urls), "pages": pages}
            for pg in pages:
                for h in pg["links"]:
                    full = urllib.parse.urljoin(pg["url"], h).split("#")[0]
                    if full.startswith(("https://worlddigital.ai", "https://worlddigital.us")):
                        all_links.setdefault(full, set()).add(pg["url"])
        # every internal link
        checked = dict(zip(all_links, ex.map(lambda u: fetch(u, follow=True), all_links)))
        broken = {u: r["status"] for u, r in checked.items() if r["status"] != 200}
        redirected = {u: r["url"] for u, r in checked.items() if r["status"] == 200 and r["chain"]}
        # crawlers
        bots = {}
        for site in SITES:
            for name, ua in BOTS.items():
                r = fetch(site + "/", ua=ua)
                bots[f"{site} {name}"] = r["status"]
            for f in ("/robots.txt", "/llms.txt", "/llms-full.txt"):
                bots[f"{site}{f}"] = fetch(site + f)["status"]

    for host, d in data.items():
        bad = [p for p in d["pages"] if p["issues"]]
        report.append(f"## {host}: {d['sitemap_count']} pages in sitemap, {len(bad)} with issues\n")
        report.append("| Page | Status | Title len | Desc len | Schema | Issues |\n|---|---|---|---|---|---|")
        for p in d["pages"]:
            path = urllib.parse.urlparse(p["url"]).path or "/"
            report.append(f"| {path} | {p['status']} | {p['tlen']} | {p['dlen']} | {', '.join(p['schema'][:6])} | {'; '.join(p['issues']) or 'OK'} |")
        report.append("")
    report.append(f"## Internal links: {len(all_links)} checked, {len(broken)} broken, {len(redirected)} redirect\n")
    for u, s in sorted(broken.items()):
        report.append(f"- BROKEN {s}: {u} (linked from {', '.join(sorted(all_links[u])[:3])})")
    for u, f in sorted(redirected.items()):
        report.append(f"- redirect: {u} -> {f} (linked from {', '.join(sorted(all_links[u])[:2])})")
    report.append("\n## Crawler access\n")
    for k, v in bots.items(): report.append(f"- {k}: {v}")
    md = "\n".join(report)
    print(md)
    open("site-audit.md", "w").write(md)
    json.dump({"sites": data, "broken": broken, "redirected": redirected, "bots": bots}, open("site-audit.json", "w"), indent=1, default=list)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        open(os.environ["GITHUB_STEP_SUMMARY"], "a").write(md)


if __name__ == "__main__":
    main()
