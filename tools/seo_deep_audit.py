#!/usr/bin/env python3
"""Deep SEO check of worlddigital.ai and worlddigital.us: canonical, breadcrumbs, metadata,
structured data and internal links, for every sitemap page. Writes seo-deep.md (and appends to
$GITHUB_STEP_SUMMARY). Every finding is listed; pages with no findings are summarised as OK.
"""
import collections, concurrent.futures as cf, json, os, re, urllib.parse, urllib.request, urllib.error
from html.parser import HTMLParser

SITES = ["https://worlddigital.ai", "https://worlddigital.us"]
UA = "Mozilla/5.0 (compatible; WorldDigitalSEOAudit/1.0; +https://worlddigital.ai)"
HOSTS = ("worlddigital.ai", "worlddigital.us")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


OPEN = urllib.request.build_opener(NoRedirect)


def get(url, method="GET"):
    req = urllib.request.Request(url, method=method, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        r = OPEN.open(req, timeout=25)
        return r.status, dict(r.headers), (r.read(3_000_000).decode("utf-8", "replace") if method == "GET" else "")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers or {}), ""
    except Exception as e:
        return 0, {}, str(e)[:100]


def resolve(url, hops=5):
    """Follow redirects; return (final_status, final_url, number_of_hops)."""
    n = 0
    while n <= hops:
        s, h, _ = get(url)
        if s in (301, 302, 307, 308):
            url = urllib.parse.urljoin(url, h.get("Location") or h.get("location") or "")
            n += 1
            continue
        return s, url, n
    return -1, url, n


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""; self._t = False; self.meta = {}; self.prop = {}; self.links = []; self.canon = []
        self.ld = []; self._ld = False; self._buf = ""; self.crumb_nav = False; self.crumbs = []; self._in_crumb = 0
        self.h1 = []; self._h1 = False; self.lang = None; self.anchors = []; self._a = None
        self.faq_q = []; self._sum = False; self._sumbuf = ""

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag == "html": self.lang = a.get("lang")
        if tag == "title": self._t = True
        if tag == "meta":
            if a.get("name"): self.meta[a["name"].lower()] = a.get("content", "")
            if a.get("property"): self.prop[a["property"].lower()] = a.get("content", "")
        if tag == "link" and (a.get("rel") or "").lower() == "canonical": self.canon.append(a.get("href", ""))
        if tag == "script" and a.get("type") == "application/ld+json": self._ld = True; self._buf = ""
        if tag == "nav" and "breadcrumb" in (a.get("aria-label") or "").lower(): self._in_crumb = 1; self.crumb_nav = True
        elif tag == "nav" and self._in_crumb: self._in_crumb += 1
        if tag == "a":
            self._a = {"href": a.get("href"), "rel": a.get("rel") or "", "text": ""}
            if self._in_crumb and a.get("href"): self.crumbs.append(a["href"])
        if tag == "h1": self._h1 = True; self.h1.append("")
        if tag in ("summary", "h2", "h3", "h4", "dt"): self._sum = True; self._sumbuf = ""

    def handle_endtag(self, tag):
        if tag == "title": self._t = False
        if tag == "script" and self._ld: self._ld = False; self.ld.append(self._buf)
        if tag == "nav" and self._in_crumb: self._in_crumb -= 1
        if tag == "a" and self._a: self.anchors.append(self._a); self._a = None
        if tag == "h1": self._h1 = False
        if tag in ("summary", "h2", "h3", "h4", "dt") and self._sum: self._sum = False; self.faq_q.append(" ".join(self._sumbuf.split()))

    def handle_data(self, d):
        if self._t: self.title += d
        if self._ld: self._buf += d
        if self._a is not None: self._a["text"] += d
        if self._h1: self.h1[-1] += d
        if self._sum: self._sumbuf += d


def nodes(obj):
    """Every dict in a JSON-LD blob (walks @graph and nested values)."""
    if isinstance(obj, dict):
        yield obj
        for v in obj.values(): yield from nodes(v)
    elif isinstance(obj, list):
        for v in obj: yield from nodes(v)


def types(n):
    t = n.get("@type")
    return t if isinstance(t, list) else [t] if t else []


REQUIRED = {
    "Organization": ["name", "url"], "ProfessionalService": ["name"], "WebSite": ["name", "url"],
    "BreadcrumbList": ["itemListElement"], "FAQPage": ["mainEntity"], "Question": ["name", "acceptedAnswer"],
    "Answer": ["text"], "Service": ["name"], "BlogPosting": ["headline", "datePublished", "author", "image"],
    "Article": ["headline", "datePublished", "author"], "Person": ["name"], "WebApplication": ["name", "offers"],
    "Offer": ["price", "priceCurrency"], "SocialMediaPosting": ["datePublished", "author", "text"], "ItemList": ["itemListElement"],
    "CollectionPage": ["name"], "WebPage": ["name"], "ProfilePage": ["mainEntity"], "Blog": ["name"],
}


def norm(u):
    p = urllib.parse.urlparse(u)
    return f"{p.scheme}://{p.netloc}{p.path.rstrip('/') or '/'}" + (f"?{p.query}" if p.query else "")


def audit(url, site):
    s, h, body = get(url)
    f = []
    if s != 200:
        return {"url": url, "f": [f"status {s}"], "links": [], "meta": {}}
    p = P(); p.feed(body)
    path = urllib.parse.urlparse(url).path or "/"
    # ---- canonical
    if len(p.canon) != 1: f.append(f"canonical: {len(p.canon)} canonical tags")
    can = p.canon[0] if p.canon else ""
    if can and norm(can) != norm(url): f.append(f"canonical: points to {can}")
    if can and not can.startswith("https://"): f.append("canonical: not absolute https")
    lh = h.get("Link") or h.get("link") or ""
    if 'rel="canonical"' in lh and can and can not in lh: f.append("canonical: HTTP Link header disagrees")
    ogu = p.prop.get("og:url")
    if not ogu: f.append("metadata: no og:url")
    elif can and norm(ogu) != norm(can): f.append(f"metadata: og:url {ogu} differs from canonical")
    # ---- metadata
    t = " ".join(p.title.split()); d = p.meta.get("description", "")
    if not t: f.append("metadata: no title")
    elif not 25 <= len(t) <= 66: f.append(f"metadata: title {len(t)} chars")
    if not d: f.append("metadata: no meta description")
    elif not 100 <= len(d) <= 165: f.append(f"metadata: description {len(d)} chars")
    for k in ("og:title", "og:description", "og:image", "og:type"):
        if not p.prop.get(k): f.append(f"metadata: no {k}")
    if not p.meta.get("twitter:card"): f.append("metadata: no twitter:card")
    if not p.meta.get("viewport"): f.append("metadata: no viewport")
    if p.lang != "en" and not (p.lang or "").startswith("en"): f.append(f"metadata: html lang={p.lang}")
    rb = p.meta.get("robots", "")
    if "noindex" in rb: f.append("metadata: page in sitemap is noindex")
    if len([x for x in p.h1 if x.strip()]) != 1: f.append(f"metadata: {len(p.h1)} H1 tags")
    # ---- structured data
    blobs = []
    for raw in p.ld:
        try: blobs.append(json.loads(raw))
        except Exception as e: f.append(f"schema: invalid JSON-LD ({str(e)[:60]})")
    all_nodes = [n for b in blobs for n in nodes(b)]
    tset = collections.Counter(t for n in all_nodes for t in types(n))
    for n in all_nodes:
        for ty in types(n):
            for k in REQUIRED.get(ty, []):
                if ty == "Offer" and k in ("price", "priceCurrency") and n.get("itemOffered"):
                    continue  # quote-based service offer: price is optional
                if n.get(k) in (None, "", []) and not ("@id" in n and len(n) <= 2):
                    f.append(f"schema: {ty} missing {k}")
    if not tset: f.append("schema: none")
    if tset.get("FAQPage", 0) > 1: f.append(f"schema: {tset['FAQPage']} FAQPage blocks (Google allows one)")
    faq_names = [" ".join(str(q.get("name", "")).split()) for n in all_nodes if "FAQPage" in types(n) for q in (n.get("mainEntity") or [])]
    if faq_names:
        vis = set(p.faq_q)
        miss = [q for q in faq_names if q not in vis]
        if miss: f.append(f"schema: {len(miss)} FAQ questions not visible on page, e.g. '{miss[0][:60]}'")
    for n in all_nodes:
        for k in ("url", "item", "image", "logo"):
            v = n.get(k)
            if isinstance(v, str) and v.startswith("http://"): f.append(f"schema: {k} uses http://")
    # ---- breadcrumbs
    bl = [n for n in all_nodes if "BreadcrumbList" in types(n)]
    if path != "/":
        if not bl: f.append("breadcrumbs: no BreadcrumbList schema")
        if not p.crumb_nav: f.append("breadcrumbs: no visible breadcrumb nav")
    for b in bl:
        items = sorted(b.get("itemListElement") or [], key=lambda x: x.get("position", 0))
        pos = [i.get("position") for i in items]
        if pos != list(range(1, len(items) + 1)): f.append(f"breadcrumbs: positions {pos}")
        for i in items[:-1]:
            if not i.get("item"): f.append(f"breadcrumbs: '{i.get('name')}' has no item URL")
        if items:
            last = items[-1].get("item")
            last = last.get("@id") if isinstance(last, dict) else last
            if last and norm(last) != norm(url): f.append(f"breadcrumbs: last item {last} is not this page")
            if items[0].get("item") and norm(items[0]["item"] if isinstance(items[0]["item"], str) else items[0]["item"].get("@id", "")) != norm(site + "/"):
                f.append("breadcrumbs: first item is not the home page")
    # ---- links on page
    links = []
    for a in p.anchors:
        href = (a["href"] or "").strip()
        if not href or href.startswith(("mailto:", "tel:", "javascript:", "#", "sms:", "whatsapp:")): continue
        full = urllib.parse.urljoin(url, href).split("#")[0]
        host = urllib.parse.urlparse(full).netloc.replace("www.", "")
        if host in HOSTS:
            links.append(full)
            if "nofollow" in a["rel"]: f.append(f"links: internal nofollow -> {href}")
            if not " ".join(a["text"].split()) and "aria-label" not in a: pass
        if full.startswith("http://") and host in HOSTS: f.append(f"links: http:// internal link {href}")
    bc_urls = [urllib.parse.urljoin(url, c) for c in p.crumbs]
    return {"url": url, "f": f, "links": links, "crumbs": bc_urls,
            "meta": {"title": t, "desc": d, "can": can}}


def main():
    md, totals = [], collections.Counter()
    with cf.ThreadPoolExecutor(12) as ex:
        for site in SITES:
            host = urllib.parse.urlparse(site).netloc
            _, _, sm = get(site + "/sitemap.xml")
            urls = [u.strip() for u in re.findall(r"<loc>([^<]+)</loc>", sm) if "/media/" not in u]
            res = list(ex.map(lambda u: audit(u, site), urls))
            # duplicate titles / descriptions
            for key, label in (("title", "title"), ("desc", "description")):
                c = collections.Counter(r["meta"].get(key) for r in res if r["meta"].get(key))
                for v, n in c.items():
                    if n > 1:
                        for r in res:
                            if r["meta"].get(key) == v: r["f"].append(f"metadata: duplicate {label} ({n} pages)")
            # internal links: status, redirects, orphans
            inbound = collections.defaultdict(set)
            for r in res:
                for l in set(r["links"]) | set(r.get("crumbs", [])):
                    inbound[norm(l)].add(r["url"])
            checked = dict(zip(inbound, ex.map(resolve, inbound)))
            broken = {u: v for u, v in checked.items() if v[0] != 200}
            redir = {u: v for u, v in checked.items() if v[0] == 200 and v[2] > 0}
            chains = {u: v for u, v in redir.items() if v[2] > 1}
            smset = {norm(u) for u in urls}
            orphans = [u for u in urls if not (inbound.get(norm(u), set()) - {u}) and norm(u) != norm(site + "/")]
            nonsitemap = sorted(u for u, v in checked.items() if v[0] == 200 and v[2] == 0 and norm(u) not in smset
                                and urllib.parse.urlparse(u).netloc.replace("www.", "") == host
                                and not re.search(r"\.(txt|xml|pdf|png|jpg|svg|webp|ico)$|/media/|/api/", u))
            bad = [r for r in res if r["f"]]
            cats = collections.Counter(x.split(":")[0] for r in res for x in r["f"])
            md.append(f"## {host}: {len(urls)} pages\n")
            md.append("| Check | Findings |\n|---|---|")
            for c in ("canonical", "breadcrumbs", "metadata", "schema", "links"):
                md.append(f"| {c} | {cats.get(c, 0)} |")
            md.append(f"| internal links | {len(checked)} unique, {len(broken)} broken, {len(redir)} redirecting, {len(chains)} chains, {len(orphans)} orphan pages |\n")
            for r in bad:
                md.append(f"- **{urllib.parse.urlparse(r['url']).path or '/'}**: " + "; ".join(sorted(set(r["f"]))))
            for u, (s, fu, n) in sorted(broken.items()):
                md.append(f"- BROKEN link {u} ({s}) from {', '.join(sorted(inbound[u])[:3])}")
            for u, (s, fu, n) in sorted(redir.items()):
                md.append(f"- link redirects ({n} hop{'s' if n > 1 else ''}): {u} -> {fu}, from {', '.join(sorted(inbound[u])[:2])}")
            for u in orphans: md.append(f"- ORPHAN (no internal links point here): {u}")
            for u in nonsitemap:
                _, _, b = get(u); pp = P(); pp.feed(b)
                if "noindex" not in pp.meta.get("robots", ""):
                    md.append(f"- linked and indexable but not in sitemap: {u}")
            if not bad and not broken and not redir and not orphans: md.append("- All checks passed.")
            md.append("")
            totals[host] = sum(cats.values()) + len(broken) + len(redir) + len(orphans)
    out = "\n".join(md)
    print(out)
    open("seo-deep.md", "w").write(out)
    if os.environ.get("GITHUB_STEP_SUMMARY"): open(os.environ["GITHUB_STEP_SUMMARY"], "a").write(out)


if __name__ == "__main__":
    main()
