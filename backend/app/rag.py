"""RAG (retrieval-augmented generation): our own sites, and private knowledge bases per customer.

Sources (every chunk has exactly one; searches always say which sources they may see):
  "ai"         worlddigital.ai pages (sitemap, read as Markdown via `Accept: text/markdown`) + /llms-full.txt
  "tenant:<id>" a customer's own website and the documents added for them. Strictly isolated: a tenant
               search can only ever see that tenant's chunks, and site searches never see tenant chunks.

index(source)      incremental crawl (content hash per page; unchanged pages are skipped, removed pages pruned)
index_url(url)     re-index one page right away (used when a blog post is published)
search(q, sources) hybrid retrieval: Atlas Vector Search + Atlas Search (keywords) fused with $rankFusion;
                   falls back to vector-only, then to an exact cosine scan (tests, or while indexes build)
answer(q, sources) answer only from retrieved chunks, with numbered citations
log_question()     chat questions (no IP, 180-day TTL) with whether the knowledge base covered them
evaluate()         golden questions (rag_eval.json) -> pass/fail per question, run nightly after indexing
"""
from __future__ import annotations

import hashlib
import json
import logging
import math
import pathlib
import re
import uuid
from datetime import datetime, timedelta, timezone
from html import unescape

import httpx

from .config import Settings
from .services import ApiError, _fetch_page, openai_json

log = logging.getLogger("worlddigital.rag")

SITES = {"ai": "https://worlddigital.ai"}  # worlddigital.us is intentionally not indexed
SITE = SITES["ai"]
EMBED_MODEL = "text-embedding-3-small"
DIMS = 1536
INDEX_NAME = "rag_vector"
TEXT_INDEX = "rag_text"
VERSION = 4
CHUNK_CHARS = 2200
OVERLAP = 250
MAX_TENANT_PAGES = 60
SKIP = re.compile(r"/(media|blog-admin|api)/|\.(xml|png|jpg|jpeg|webp|gif|svg|pdf|zip)$|/thank-you|/unsubscribe|/404")
BOILERPLATE = re.compile(r"^(Try our SEO tools, no sign-up|Try my SEO tools, no sign-up|Start free, or tell us what to build\.?|Let.s grow your business\.?)$", re.I)
QUESTION_TTL = timedelta(days=180)
EVAL_FILE = pathlib.Path(__file__).with_name("rag_eval.json")


_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(\.[\w-]+)+")
_PHONE = re.compile(r"(?<!\w)(\+?\d[\d\s().-]{7,}\d)(?!\w)")


def redact(text: str) -> str:
    """Strip contact details visitors type into chat before anything is stored."""
    return _PHONE.sub("[phone]", _EMAIL.sub("[email]", str(text or "")))


def now():
    return datetime.now(timezone.utc)


def _iso(d):
    return d.isoformat() if isinstance(d, datetime) else d


# ── Embeddings ──────────────────────────────────────────────────────────────

def embed(s: Settings, texts: list[str]) -> list[list[float]]:
    if not s.openai_api_key:
        raise ApiError("no OpenAI key", 503, "The knowledge base is being set up.")
    out: list[list[float]] = []
    for i in range(0, len(texts), 96):
        batch = [t[:8000] for t in texts[i:i + 96]]
        r = httpx.post(f"{s.openai_base}/v1/embeddings", headers={"Authorization": f"Bearer {s.openai_api_key}"},
                       json={"model": EMBED_MODEL, "input": batch}, timeout=60)
        if r.status_code >= 400:
            raise ApiError(f"embeddings {r.status_code}: {r.text[:200]}", 502, "The knowledge base is busy. Please try again.")
        out += [d["embedding"] for d in sorted(r.json()["data"], key=lambda d: d["index"])]
    return out


# ── Fetching, HTML to text, chunking ────────────────────────────────────────

def _get(url: str, md: bool = False) -> str:
    r = httpx.get(url, headers={"Accept": "text/markdown" if md else "text/html,*/*", "User-Agent": "WorldDigitalRAG/1.0"},
                  timeout=30, follow_redirects=True)
    r.raise_for_status()
    return r.text


def html_to_md(html: str, url: str) -> str:
    """Main content of an HTML page as light Markdown (headings kept for chunking; nav, footer, scripts dropped)."""
    title = re.search(r"(?is)<title[^>]*>(.*?)</title>", html)
    m = re.search(r"(?is)<main[^>]*>(.*?)</main>", html)
    body = m.group(1) if m else (re.search(r"(?is)<body[^>]*>(.*?)</body>", html) or [None, html])[1]
    body = re.sub(r"(?is)<(script|style|noscript|svg|template|form|nav|header|footer|iframe)\b.*?</\1>", " ", body)
    body = re.sub(r"(?is)<h([1-4])[^>]*>(.*?)</h\1>", lambda x: "\n\n" + "#" * int(x.group(1)) + " " + re.sub(r"<[^>]+>", "", x.group(2)).strip() + "\n\n", body)
    body = re.sub(r"(?is)<summary[^>]*>(.*?)</summary>", lambda x: "\n\n**" + re.sub(r"<[^>]+>", "", x.group(1)).strip() + "**\n", body)
    body = re.sub(r"(?i)<li[^>]*>", "\n- ", body)
    body = re.sub(r"(?i)</(p|div|section|article|details|tr|ul|ol|blockquote|table|dd|dt)>|<br\s*/?>", "\n\n", body)
    body = re.sub(r"(?i)<t[dh][^>]*>", " | ", body)
    text = unescape(re.sub(r"<[^>]+>", " ", body))
    text = "\n".join(re.sub(r"[ \t]+", " ", l).strip() for l in text.split("\n"))
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    t = unescape(re.sub(r"\s+", " ", title.group(1))).strip() if title else url
    return f"---\ntitle: {t}\nurl: {url}\n---\n\n{text}\n"


def site_pages(base: str) -> list[str]:
    xml = _get(f"{base}/sitemap.xml")
    urls = [u.strip() for u in re.findall(r"<loc>([^<]+)</loc>", xml)]
    if "<sitemapindex" in xml:  # sitemap index: read the child sitemaps (customer sites)
        out = []
        for sm in urls[:10]:
            try:
                out += [u.strip() for u in re.findall(r"<loc>([^<]+)</loc>", _get(sm))]
            except Exception:  # noqa: BLE001
                pass
        urls = out
    return [u for u in dict.fromkeys(urls) if not SKIP.search(u)]


def _title(md: str, url: str) -> str:
    m = re.search(r"^title:\s*(.+)$", md, re.M) or re.search(r"^#\s+(.+)$", md, re.M)
    return (m.group(1).strip() if m else url)[:160]


def _sec_hash(text: str) -> str:
    return hashlib.sha256(" ".join(text.split()[1:]).lower().encode()).hexdigest()[:20]  # body without the heading line


def sections(md: str) -> list[tuple[str, str]]:
    """(heading, text) per heading section, front matter and boilerplate bands removed."""
    md = re.sub(r"^---\n.*?\n---\n", "", md, flags=re.S)  # front matter
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    sections, cur, head = [], [], ""
    for line in md.split("\n"):
        if re.match(r"^#{1,3}\s", line):
            if cur:
                sections.append((head, "\n".join(cur).strip()))
            head, cur = line.lstrip("# ").strip(), [line]
        else:
            cur.append(line)
    if cur:
        sections.append((head, "\n".join(cur).strip()))
    return [(h, t) for h, t in sections if t and not (h and BOILERPLATE.match(h))]


def chunk(md: str, skip: set[str] | frozenset = frozenset()) -> list[str]:
    """Split on headings, then pack sections into ~CHUNK_CHARS chunks that keep their heading for context.
    Sections whose hash is in `skip` (already indexed from another page) are left out."""
    out, buf = [], ""
    for head, text in sections(md):
        if _sec_hash(text) in skip:
            continue
        while len(text) > CHUNK_CHARS:  # long section: split with overlap, keep the heading
            cut = text.rfind("\n", 0, CHUNK_CHARS)
            cut = cut if cut > CHUNK_CHARS // 2 else CHUNK_CHARS
            piece, text = text[:cut], (f"## {head}\n" if head else "") + text[max(0, cut - OVERLAP):]
            if buf:
                out.append(buf); buf = ""
            out.append(piece)
        if len(buf) + len(text) > CHUNK_CHARS and buf:
            out.append(buf); buf = ""
        buf = f"{buf}\n\n{text}".strip()
    if buf:
        out.append(buf)
    return [c for c in out if len(c.strip()) > 20]


def _source_of(url: str) -> str | None:
    for k, base in SITES.items():
        if url.startswith(base + "/") or url == base:
            return k
    return None


def _slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")[:40] or uuid.uuid4().hex[:8]


# ── The knowledge base ──────────────────────────────────────────────────────

class Rag:
    def __init__(self, s: Settings, db):
        self.s, self.db = s, db
        self.chunks = db["rag_chunks"]
        self.pages = db["rag_pages"]
        self.tenants = db["rag_tenants"]
        self.questions = db["rag_questions"]
        self.meta = db["rag_meta"]

    # indexes ------------------------------------------------------------------
    def ensure_indexes(self) -> dict:
        res = {}
        try:
            self.questions.create_index("expires_at", expireAfterSeconds=0)
            self.chunks.create_index([("source", 1), ("url", 1)])
            self.chunks.create_index("text_hash")
            self.pages.create_index([("source", 1), ("sections", 1)])
        except Exception:  # noqa: BLE001
            pass
        try:
            names = {i.get("name") for i in self.chunks.list_search_indexes()}
            from pymongo.operations import SearchIndexModel
            if INDEX_NAME not in names:
                self.chunks.create_search_index(SearchIndexModel(name=INDEX_NAME, type="vectorSearch", definition={
                    "fields": [{"type": "vector", "path": "embedding", "numDimensions": DIMS, "similarity": "cosine"},
                               {"type": "filter", "path": "source"}]}))
                res["vector"] = "created"
            else:
                res["vector"] = "exists"
            if TEXT_INDEX not in names:
                self.chunks.create_search_index(SearchIndexModel(name=TEXT_INDEX, type="search", definition={
                    "mappings": {"dynamic": False, "fields": {"text": {"type": "string"}, "title": {"type": "string"},
                                                               "source": {"type": "token"}}}}))
                res["text"] = "created"
            else:
                res["text"] = "exists"
        except Exception as e:  # noqa: BLE001  (mongomock / no Atlas Search: the cosine fallback is used)
            res = {"vector": f"unavailable: {type(e).__name__}", "text": f"unavailable: {type(e).__name__}"}
        return res

    def _migrate(self) -> None:
        v = self.meta.find_one({"_id": "version"})
        if not v or v.get("v") != VERSION:
            # Chunking/source rules changed: rebuild site chunks once (tenant documents are kept).
            self.chunks.delete_many({"source": {"$not": {"$regex": "^tenant:"}}})
            self.pages.delete_many({"source": {"$not": {"$regex": "^tenant:"}}})
            self.pages.delete_many({"_id": "__version"})
            self.meta.replace_one({"_id": "version"}, {"_id": "version", "v": VERSION, "at": now()}, upsert=True)

    # writing ------------------------------------------------------------------
    def _store_page(self, *, url: str, md: str, source: str, stats: dict, kind: str = "page") -> None:
        h = hashlib.sha256(md.encode()).hexdigest()
        key = f"{source}|{url}"
        prev = self.pages.find_one({"_id": key})
        if prev and prev.get("hash") == h:
            stats["unchanged"] += 1
            return
        title = _title(md, url)
        mine = [_sec_hash(t) for _, t in sections(md) if len(t) > 60]  # short sections may repeat legitimately
        seen = {h for d in self.pages.find({"source": source, "_id": {"$ne": key}, "sections": {"$in": mine}}, {"sections": 1})
                for h in d.get("sections", [])} & set(mine)
        stats["duplicates"] += len(seen)
        parts = []
        for p in chunk(md, seen):  # identical text already indexed from another page of the same source adds only noise
            ph = hashlib.sha256(" ".join(p.split()).encode()).hexdigest()
            if self.chunks.find_one({"text_hash": ph, "source": source, "url": {"$ne": url}}, {"_id": 1}):
                stats["duplicates"] += 1
                continue
            parts.append((p, ph))
        self.chunks.delete_many({"source": source, "url": url})
        if parts:
            vecs = embed(self.s, [f"{title}\n{p}" for p, _ in parts])
            self.chunks.insert_many([{"_id": f"{source}|{url}#{i}", "url": url, "title": title, "text": p, "text_hash": ph,
                                      "embedding": v, "source": source, "kind": kind, "updated": now()}
                                     for i, ((p, ph), v) in enumerate(zip(parts, vecs))])
        self.pages.replace_one({"_id": key}, {"_id": key, "url": url, "source": source, "hash": h, "title": title,
                                              "kind": kind, "chunks": len(parts), "sections": [m for m in mine if m not in seen],
                                              "updated": now()}, upsert=True)
        stats["updated"] += 1
        stats["chunks"] += len(parts)

    def _new_stats(self) -> dict:
        return {"pages": 0, "updated": 0, "unchanged": 0, "chunks": 0, "removed": 0, "duplicates": 0, "errors": []}

    def index(self, source: str = "ai", base: str | None = None) -> dict:
        """Incremental crawl of our site."""
        if source not in SITES:
            raise ApiError("bad source", 400, "Unknown site.")
        self._migrate()
        base = base or SITES[source]
        stats = self._new_stats()
        try:
            urls = site_pages(base) + [f"{base}/llms-full.txt"]
        except Exception as e:  # noqa: BLE001
            raise ApiError(f"sitemap {e}", 502, f"Could not read the sitemap of {base}.")
        seen = set()
        for url in urls:
            try:
                raw = _get(url, md=(source == "ai"))
                md = raw if (source == "ai" or url.endswith(".txt")) else html_to_md(raw, url)
            except Exception as e:  # noqa: BLE001
                stats["errors"].append(f"{url}: {type(e).__name__}")
                continue
            stats["pages"] += 1
            seen.add(f"{source}|{url}")
            self._store_page(url=url, md=md, source=source, stats=stats)
        if stats["pages"] >= max(3, len(urls) // 2):  # prune only when the crawl clearly worked
            gone = [p["_id"] for p in self.pages.find({"source": source, "kind": {"$ne": "doc"}, "_id": {"$nin": list(seen)}}, {"_id": 1, "url": 1})]
            for key in gone:
                url = key.split("|", 1)[1]
                self.chunks.delete_many({"source": source, "url": url})
            if gone:
                self.pages.delete_many({"_id": {"$in": gone}})
            stats["removed"] = len(gone)
        stats["search_indexes"] = self.ensure_indexes()
        stats["total_chunks"] = self.chunks.count_documents({"source": source})
        stats["source"] = source
        return stats

    def index_url(self, url: str) -> dict:
        """Re-index (or remove) one page of our sites right away, e.g. a blog post that was just published."""
        source = _source_of(url or "")
        if not source:
            raise ApiError("not our site", 400, "Only worlddigital.ai and worlddigital.us pages can be indexed here.")
        stats = self._new_stats()
        try:
            r = httpx.get(url, headers={"Accept": "text/markdown" if source == "ai" else "text/html", "User-Agent": "WorldDigitalRAG/1.0"},
                          timeout=30, follow_redirects=True)
        except httpx.HTTPError as e:
            raise ApiError(f"fetch {e}", 502, "Could not read that page.")
        if r.status_code in (404, 410) or (r.history and str(r.url) != url):  # gone or redirected: drop it
            n = self.chunks.delete_many({"source": source, "url": url}).deleted_count
            self.pages.delete_many({"_id": f"{source}|{url}"})
            return {**stats, "removed": 1 if n else 0, "url": url}
        if r.status_code >= 400:
            raise ApiError(f"fetch {r.status_code}", 502, f"That page returned {r.status_code}.")
        md = r.text if source == "ai" else html_to_md(r.text, url)
        stats["pages"] = 1
        self._store_page(url=url, md=md, source=source, stats=stats)
        return {**stats, "url": url}

    # customer knowledge bases (tenants) ----------------------------------------
    def tenant_create(self, name: str, website: str = "", note: str = "") -> dict:
        name = " ".join(str(name or "").split())[:120]
        if not name:
            raise ApiError("no name", 400, "Give the customer a name.")
        site = str(website or "").strip()
        if site and not re.match(r"^https?://", site):
            site = "https://" + site
        if site and not re.match(r"^https?://([a-z0-9-]+\.)+[a-z]{2,}(/.*)?$", site, re.I):
            raise ApiError("bad site", 400, "Enter a valid website, for example clinic.com.")
        tid = _slugify(name)
        if self.tenants.find_one({"_id": tid}):
            tid = f"{tid}-{uuid.uuid4().hex[:4]}"
        doc = {"_id": tid, "name": name, "website": site.rstrip("/"), "note": str(note or "")[:500], "created": now()}
        self.tenants.insert_one(doc)
        return {"id": tid, "name": name, "website": doc["website"]}

    def _tenant(self, tid: str) -> dict:
        t = self.tenants.find_one({"_id": str(tid or "")})
        if not t:
            raise ApiError("no tenant", 404, "Customer knowledge base not found.")
        return t

    def tenant_list(self) -> list[dict]:
        out = []
        for t in self.tenants.find({}).sort("created", -1):
            src = f"tenant:{t['_id']}"
            out.append({"id": t["_id"], "name": t["name"], "website": t.get("website", ""),
                        "pages": self.pages.count_documents({"source": src, "kind": "page"}),
                        "docs": self.pages.count_documents({"source": src, "kind": "doc"}),
                        "chunks": self.chunks.count_documents({"source": src}), "created": _iso(t.get("created"))})
        return out

    def tenant_docs(self, tid: str) -> list[dict]:
        self._tenant(tid)
        return [{"url": p["url"], "title": p["title"], "kind": p.get("kind"), "chunks": p.get("chunks", 0), "updated": _iso(p.get("updated"))}
                for p in self.pages.find({"source": f"tenant:{tid}"}).sort("updated", -1)]

    def tenant_add_doc(self, tid: str, title: str, text: str) -> dict:
        self._tenant(tid)
        title = " ".join(str(title or "").split())[:160] or "Document"
        text = str(text or "").strip()
        if len(text) < 30:
            raise ApiError("too short", 400, "Paste at least a few sentences of text.")
        if len(text) > 400_000:
            raise ApiError("too long", 400, "That document is too long (max about 400,000 characters). Split it into parts.")
        url = f"doc:{_slugify(title)}-{hashlib.sha256(text.encode()).hexdigest()[:8]}"
        stats = self._new_stats()
        self._store_page(url=url, md=f"---\ntitle: {title}\n---\n\n{text}", source=f"tenant:{tid}", stats=stats, kind="doc")
        return {**stats, "url": url}

    def tenant_remove_doc(self, tid: str, url: str) -> dict:
        self._tenant(tid)
        src = f"tenant:{tid}"
        n = self.chunks.delete_many({"source": src, "url": url}).deleted_count
        self.pages.delete_many({"_id": f"{src}|{url}"})
        return {"ok": True, "removed_chunks": n}

    def tenant_index_site(self, tid: str) -> dict:
        t = self._tenant(tid)
        base = t.get("website")
        if not base:
            raise ApiError("no site", 400, "This customer has no website set.")
        src = f"tenant:{tid}"
        stats = self._new_stats()
        try:
            urls = site_pages(base)[:MAX_TENANT_PAGES]
        except Exception:  # noqa: BLE001  no sitemap: index the home page only
            urls = [base + "/"]
        seen = set()
        for url in urls:
            res = _fetch_page(url)  # public addresses only, size-capped (customer sites are untrusted)
            if res is None or res.status_code >= 400 or "html" not in res.headers.get("content-type", ""):
                stats["errors"].append(f"{url}: unreadable")
                continue
            stats["pages"] += 1
            seen.add(f"{src}|{url}")
            self._store_page(url=url, md=html_to_md(res.text[:600_000], url), source=src, stats=stats)
        if stats["pages"] >= max(1, len(urls) // 2):
            gone = [p["_id"] for p in self.pages.find({"source": src, "kind": "page", "_id": {"$nin": list(seen)}}, {"_id": 1})]
            for key in gone:
                self.chunks.delete_many({"source": src, "url": key.split("|", 1)[1]})
            if gone:
                self.pages.delete_many({"_id": {"$in": gone}})
            stats["removed"] = len(gone)
        self.ensure_indexes()
        return {**stats, "tenant": tid}

    def tenant_delete(self, tid: str) -> dict:
        self._tenant(tid)
        src = f"tenant:{tid}"
        n = self.chunks.delete_many({"source": src}).deleted_count
        self.pages.delete_many({"source": src})
        self.tenants.delete_one({"_id": tid})
        return {"ok": True, "removed_chunks": n}

    # retrieval ----------------------------------------------------------------
    def _sources(self, sources) -> list[str]:
        if isinstance(sources, str):
            sources = [sources]
        out = [s for s in (sources or ["ai"]) if s in SITES or (isinstance(s, str) and s.startswith("tenant:"))]
        tenants = [s for s in out if s.startswith("tenant:")]
        if tenants and len(out) > 1:
            raise ApiError("mixed sources", 400, "A customer knowledge base can only be searched on its own.")
        for s in tenants:
            self._tenant(s.split(":", 1)[1])
        return out or ["ai"]

    def search(self, query: str, k: int = 6, sources=None) -> list[dict]:
        query = " ".join(str(query or "").split())[:500]
        if not query:
            raise ApiError("empty query", 400, "Type a question first.")
        srcs = self._sources(sources)
        q = embed(self.s, [query])[0]
        proj = {"_id": 0, "url": 1, "title": 1, "text": 1, "source": 1}
        vfilter = {"source": {"$in": srcs}}
        vec_stage = {"$vectorSearch": {"index": INDEX_NAME, "path": "embedding", "queryVector": q,
                                       "numCandidates": max(60, k * 12), "limit": max(k * 2, 10), "filter": vfilter}}
        text_stage = {"$search": {"index": TEXT_INDEX, "compound": {
            "must": [{"text": {"query": query, "path": ["text", "title"]}}],
            "filter": [{"in": {"path": "source", "value": srcs}}]}}}
        try:  # hybrid: meaning + exact words, fused by rank
            hits = list(self.chunks.aggregate([
                {"$rankFusion": {"input": {"pipelines": {"vector": [vec_stage], "text": [text_stage, {"$limit": max(k * 2, 10)}]}},
                                 "combination": {"weights": {"vector": 0.6, "text": 0.4}}, "scoreDetails": False}},
                {"$limit": k}, {"$project": {**proj, "score": {"$meta": "score"}}}]))
            if hits:
                return [dict(h, method="hybrid") for h in hits if h.get("source") in srcs]
        except Exception as e:  # noqa: BLE001
            log.info("hybrid search unavailable (%s)", type(e).__name__)
        try:
            hits = list(self.chunks.aggregate([dict(vec_stage, **{"$vectorSearch": {**vec_stage["$vectorSearch"], "limit": k}}),
                                               {"$project": {**proj, "score": {"$meta": "vectorSearchScore"}}}]))
            if hits:
                return [dict(h, method="vector") for h in hits if h.get("source") in srcs]
        except Exception as e:  # noqa: BLE001
            log.info("vector search unavailable (%s); using cosine scan", type(e).__name__)
        qn = math.sqrt(sum(x * x for x in q)) or 1
        words = set(re.findall(r"[a-z0-9$.]{3,}", query.lower()))
        scored = []
        for d in self.chunks.find({"source": {"$in": srcs}}, {**proj, "embedding": 1}):
            v = d.pop("embedding", None) or []
            vn = math.sqrt(sum(x * x for x in v)) or 1
            kw = sum(1 for w in words if w in d["text"].lower()) / (len(words) or 1)
            scored.append({**d, "score": 0.8 * sum(a * b for a, b in zip(q, v)) / (qn * vn) + 0.2 * kw, "method": "scan"})
        return sorted(scored, key=lambda d: d["score"], reverse=True)[:k]

    def answer(self, question: str, k: int = 6, sources=None) -> dict:
        srcs = self._sources(sources)
        hits = self.search(question, k, srcs)
        tenant = srcs[0].startswith("tenant:")
        who = self._tenant(srcs[0].split(":", 1)[1])["name"] if tenant else "WorldDigital.ai"
        if not hits:
            return {"answer": "The knowledge base is empty. Index it first.", "sources": [], "covered": False}
        ctx = "\n\n".join(f"[{i + 1}] {h['title']} ({h['url']})\n{h['text'][:1800]}" for i, h in enumerate(hits))
        out = openai_json(self.s, max_tokens=900, temperature=0.2,
                          system=(f"You answer questions about {who} using ONLY the numbered sources. Cite them like [1]. "
                                  "If the sources do not contain the answer, say you don't know and set covered to false. "
                                  "Never invent prices, features or promises. JSON only."),
                          user=f"Sources:\n{ctx}\n\nQuestion: {question}\n\nJSON: {{\"answer\":\"\",\"used\":[1],\"covered\":true}}")
        used = [int(n) for n in (out.get("used") or []) if str(n).isdigit() and 0 < int(n) <= len(hits)]
        srcl, seen = [], set()
        for n in used or range(1, len(hits) + 1):
            h = hits[n - 1]
            if h["url"] not in seen:
                seen.add(h["url"]); srcl.append({"n": n, "title": h["title"], "url": h["url"]})
        return {"answer": str(out.get("answer") or "").strip(), "sources": srcl, "covered": bool(out.get("covered", True)),
                "method": hits[0].get("method"), "passages": [{"title": h["title"], "url": h["url"], "text": h["text"][:600]} for h in hits]}

    def context(self, query: str, k: int = 5, chars: int = 900, sources=None) -> tuple[str, list[dict]]:
        """Relevant facts from our own pages for other generators (chat, blog drafts). Returns (text, hits)."""
        try:
            hits = self.search(query, k, sources or ["ai"])
        except ApiError:
            return "", []
        out = []
        for h in hits:
            path = h["url"].replace(SITE, "") or "/"
            out.append(f"- From {h['title']} ({path}): {' '.join(h['text'].split())[:chars]}")
        return "\n".join(out), hits

    # chat question log ---------------------------------------------------------
    def log_question(self, question: str, reply: str, covered: bool, hits: list[dict]) -> None:
        try:
            self.questions.insert_one({"q": redact(question)[:800], "reply": redact(reply)[:1200], "covered": bool(covered),
                                       "top_url": hits[0]["url"] if hits else None, "at": now(),
                                       "expires_at": now() + QUESTION_TTL})
        except Exception as e:  # noqa: BLE001  logging must never break the chat
            log.warning("question log failed: %s", e)

    def questions_report(self, days: int = 30, limit: int = 100) -> dict:
        since = now() - timedelta(days=max(1, min(int(days or 30), 180)))
        rows = list(self.questions.find({"at": {"$gte": since}}, {"_id": 0}).sort("at", -1).limit(limit))
        total = self.questions.count_documents({"at": {"$gte": since}})
        uncovered = self.questions.count_documents({"at": {"$gte": since}, "covered": False})
        return {"days": days, "total": total, "uncovered": uncovered,
                "questions": [{**r, "at": _iso(r["at"]), "expires_at": None} for r in rows]}

    # answer-quality tests ------------------------------------------------------
    def evaluate(self) -> dict:
        cases = json.loads(EVAL_FILE.read_text())
        results, passed = [], 0
        for c in cases:
            try:
                a = self.answer(c["q"], sources=c.get("sources") or ["ai"])
            except ApiError as e:
                results.append({"q": c["q"], "ok": False, "why": e.public}); continue
            text = a["answer"].lower()
            urls = [s["url"] for s in a["sources"]]
            miss = [w for w in c.get("expect", []) if w.lower() not in text]
            src_ok = not c.get("source") or any(c["source"] in u for u in urls)
            ok = not miss and src_ok and a.get("covered", True)
            passed += ok
            results.append({"q": c["q"], "ok": ok, "missing": miss, "source_ok": src_ok, "answer": a["answer"][:300], "sources": urls[:3]})
        report = {"total": len(cases), "passed": passed, "score": round(100 * passed / (len(cases) or 1)), "results": results, "at": now()}
        self.meta.replace_one({"_id": "eval"}, {"_id": "eval", **report}, upsert=True)
        return {**report, "at": _iso(report["at"])}

    def status(self) -> dict:
        def last(src):
            d = max((p["updated"] for p in self.pages.find({"source": src, "updated": {"$exists": True}}, {"updated": 1})), default=None)
            return _iso(d)
        ev = self.meta.find_one({"_id": "eval"}, {"_id": 0}) or {}
        return {"sites": {s: {"pages": self.pages.count_documents({"source": s}), "chunks": self.chunks.count_documents({"source": s}),
                              "last_update": last(s)} for s in SITES},
                "tenants": self.tenants.count_documents({}),
                "search_indexes": self.ensure_indexes(),
                "eval": {k: _iso(v) for k, v in ev.items() if k in ("total", "passed", "score", "at")},
                "questions_30d": self.questions.count_documents({"at": {"$gte": now() - timedelta(days=30)}})}
