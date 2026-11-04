"""RAG (retrieval-augmented generation) over WorldDigital.ai's own content.

index():  reads every page in https://worlddigital.ai/sitemap.xml (as Markdown, which the site serves on
          `Accept: text/markdown`) plus /llms-full.txt, splits them into heading-aware chunks, embeds them with
          OpenAI (text-embedding-3-small) and stores them in MongoDB `rag_chunks`. Unchanged pages are skipped
          (content hash), removed pages are deleted. Safe to run any number of times (nightly job).
search(): Atlas Vector Search ($vectorSearch on the `rag_vector` index); falls back to an exact cosine scan
          when the index is not ready yet (or in tests), which is fine for a site-sized corpus.
answer(): answers a question only from the retrieved chunks, with numbered citations to our pages.
context(): compact facts + links for other generators (the blog draft writer uses it).
"""
from __future__ import annotations

import hashlib
import logging
import math
import re
from datetime import datetime, timezone

import httpx

from .config import Settings
from .services import ApiError, openai_json

log = logging.getLogger("worlddigital.rag")

SITE = "https://worlddigital.ai"
EMBED_MODEL = "text-embedding-3-small"
DIMS = 1536
INDEX_NAME = "rag_vector"
CHUNK_CHARS = 2200
OVERLAP = 250
# Sections repeated on most pages (site-wide bands): indexed once from their own page, not 40 times.
BOILERPLATE = re.compile(r"^(Try our SEO tools, no sign-up|Start free, or tell us what to build\.?|Let.s grow your business\.?)$", re.I)
SKIP = re.compile(r"/(media|blog-admin|api)/|\.(xml|txt|png|jpg|webp|pdf)$")


def now():
    return datetime.now(timezone.utc)


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


# ── Fetching and chunking ───────────────────────────────────────────────────

def _get(url: str, md: bool = False) -> str:
    r = httpx.get(url, headers={"Accept": "text/markdown" if md else "*/*", "User-Agent": "WorldDigitalRAG/1.0"},
                  timeout=30, follow_redirects=True)
    r.raise_for_status()
    return r.text


def site_pages(base: str = SITE) -> list[str]:
    xml = _get(f"{base}/sitemap.xml")
    urls = [u.strip() for u in re.findall(r"<loc>([^<]+)</loc>", xml)]
    return [u for u in dict.fromkeys(urls) if not SKIP.search(u)]


def _title(md: str, url: str) -> str:
    m = re.search(r"^title:\s*(.+)$", md, re.M) or re.search(r"^#\s+(.+)$", md, re.M)
    return (m.group(1).strip() if m else url.replace(SITE, "") or "/")[:160]


def chunk(md: str) -> list[str]:
    """Split on headings, then pack sections into ~CHUNK_CHARS chunks that keep their heading for context."""
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
    out, buf = [], ""
    for head, text in sections:
        if not text or (head and BOILERPLATE.match(head)):
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


# ── Index ───────────────────────────────────────────────────────────────────

class Rag:
    def __init__(self, s: Settings, db):
        self.s, self.db = s, db
        self.chunks = db["rag_chunks"]
        self.pages = db["rag_pages"]

    def ensure_vector_index(self) -> str:
        try:
            names = {i.get("name") for i in self.chunks.list_search_indexes()}
            if INDEX_NAME in names:
                return "exists"
            from pymongo.operations import SearchIndexModel
            self.chunks.create_search_index(SearchIndexModel(name=INDEX_NAME, type="vectorSearch", definition={
                "fields": [{"type": "vector", "path": "embedding", "numDimensions": DIMS, "similarity": "cosine"},
                           {"type": "filter", "path": "source"}]}))
            return "created"
        except Exception as e:  # noqa: BLE001  (mongomock / no search support: cosine fallback is used)
            return f"unavailable: {type(e).__name__}"

    def index(self, base: str = SITE, extra: list[str] | None = None) -> dict:
        urls = site_pages(base) + [f"{base}/llms-full.txt"] + list(extra or [])
        stats = {"pages": 0, "updated": 0, "unchanged": 0, "chunks": 0, "removed": 0, "duplicates": 0, "errors": []}
        seen = set()
        if self.pages.find_one({"_id": "__version"}, {"v": 1}) != {"_id": "__version", "v": 2}:
            self.pages.delete_many({})  # chunking rules changed: rebuild everything once
            self.chunks.delete_many({})
            self.pages.insert_one({"_id": "__version", "v": 2})
        seen.add("__version")
        for url in urls:
            try:
                md = _get(url, md=True)
            except Exception as e:  # noqa: BLE001
                stats["errors"].append(f"{url}: {type(e).__name__}")
                continue
            stats["pages"] += 1
            seen.add(url)
            h = hashlib.sha256(md.encode()).hexdigest()
            prev = self.pages.find_one({"_id": url})
            if prev and prev.get("hash") == h:
                stats["unchanged"] += 1
                continue
            title = _title(md, url)
            parts = []
            for p in chunk(md):  # identical text already indexed from another page adds nothing but noise
                ph = hashlib.sha256(" ".join(p.split()).encode()).hexdigest()
                if self.chunks.find_one({"text_hash": ph, "url": {"$ne": url}}, {"_id": 1}):
                    stats["duplicates"] += 1
                    continue
                parts.append((p, ph))
            if not parts:
                self.pages.replace_one({"_id": url}, {"_id": url, "hash": h, "title": title, "chunks": 0, "updated": now()}, upsert=True)
                continue
            vecs = embed(self.s, [f"{title}\n{p}" for p, _ in parts])
            self.chunks.delete_many({"url": url})
            self.chunks.insert_many([{"_id": f"{url}#{i}", "url": url, "title": title, "text": p, "text_hash": ph, "embedding": v,
                                      "source": "site", "updated": now()} for i, ((p, ph), v) in enumerate(zip(parts, vecs))])
            self.pages.replace_one({"_id": url}, {"_id": url, "hash": h, "title": title, "chunks": len(parts), "updated": now()}, upsert=True)
            stats["updated"] += 1
            stats["chunks"] += len(parts)
        if stats["pages"] >= max(5, len(urls) // 2):  # only prune when the crawl clearly worked
            gone = [p["_id"] for p in self.pages.find({"_id": {"$nin": list(seen)}}, {"_id": 1})]
            if gone:
                self.chunks.delete_many({"url": {"$in": gone}})
                self.pages.delete_many({"_id": {"$in": gone}})
                stats["removed"] = len(gone)
        stats["vector_index"] = self.ensure_vector_index()
        stats["total_chunks"] = self.chunks.count_documents({})
        return stats

    # ── Retrieval ───────────────────────────────────────────────────────────
    def search(self, query: str, k: int = 6) -> list[dict]:
        query = " ".join(str(query or "").split())[:500]
        if not query:
            raise ApiError("empty query", 400, "Type a question first.")
        q = embed(self.s, [query])[0]
        proj = {"_id": 0, "url": 1, "title": 1, "text": 1}
        try:
            hits = list(self.chunks.aggregate([
                {"$vectorSearch": {"index": INDEX_NAME, "path": "embedding", "queryVector": q, "numCandidates": max(50, k * 10), "limit": k}},
                {"$project": {**proj, "score": {"$meta": "vectorSearchScore"}}}]))
            if hits:
                return hits
        except Exception as e:  # noqa: BLE001
            log.info("vector search unavailable (%s); using cosine scan", type(e).__name__)
        qn = math.sqrt(sum(x * x for x in q)) or 1
        scored = []
        for d in self.chunks.find({}, {**proj, "embedding": 1}):
            v = d.pop("embedding", None) or []
            vn = math.sqrt(sum(x * x for x in v)) or 1
            scored.append({**d, "score": sum(a * b for a, b in zip(q, v)) / (qn * vn)})
        return sorted(scored, key=lambda d: d["score"], reverse=True)[:k]

    def answer(self, question: str, k: int = 6) -> dict:
        hits = self.search(question, k)
        if not hits:
            return {"answer": "The knowledge base is empty. Run the index first.", "sources": []}
        ctx = "\n\n".join(f"[{i + 1}] {h['title']} ({h['url']})\n{h['text'][:1800]}" for i, h in enumerate(hits))
        out = openai_json(self.s, max_tokens=900, temperature=0.2,
                          system=("You answer questions about WorldDigital.ai using ONLY the numbered sources. Cite them "
                                  "like [1]. If the sources do not contain the answer, say you don't know and suggest "
                                  "contacting support@worlddigital.ai. Never invent prices, features or promises. JSON only."),
                          user=f"Sources:\n{ctx}\n\nQuestion: {question}\n\nJSON: {{\"answer\":\"\",\"used\":[1]}}")
        used = [int(n) for n in (out.get("used") or []) if str(n).isdigit() and 0 < int(n) <= len(hits)]
        srcs, seen = [], set()
        for n in used or range(1, len(hits) + 1):
            h = hits[n - 1]
            if h["url"] not in seen:
                seen.add(h["url"]); srcs.append({"n": n, "title": h["title"], "url": h["url"]})
        return {"answer": str(out.get("answer") or "").strip(), "sources": srcs}

    def context(self, query: str, k: int = 5, chars: int = 900) -> str:
        """Relevant facts from our own pages, for other generators (e.g. the blog draft writer)."""
        try:
            hits = self.search(query, k)
        except ApiError:
            return ""
        out, seen = [], set()
        for h in hits:
            path = h["url"].replace(SITE, "") or "/"
            out.append(f"- From {h['title']} ({path}): {' '.join(h['text'].split())[:chars]}")
            seen.add(path)
        return "\n".join(out)

    def status(self) -> dict:
        return {"pages": self.pages.count_documents({"_id": {"$ne": "__version"}}), "chunks": self.chunks.count_documents({}),
                "vector_index": self.ensure_vector_index(),
                "last_update": (lambda d: d.isoformat() if d else None)(max((p["updated"] for p in self.pages.find({"updated": {"$exists": True}}, {"updated": 1})), default=None))}
