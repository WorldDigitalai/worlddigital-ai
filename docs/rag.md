# WorldDigital.ai knowledge base (RAG)

The knowledge base gives every AI feature on worlddigital.ai one shared, cited source of truth: the website chat
(AI Ahmad), the blog draft writer, the admin "Ask" box, the public answer API, and future internal agents.

It runs on what already exists: the FastAPI backend on Cloud Run, the existing MongoDB Atlas database
(`worlddigital_ai`) with Atlas Vector Search and Atlas Search, and OpenAI for embeddings and answers. No other
database, vector store or queue is used.

## Architecture

```
worlddigital.ai (Cloudflare Worker)                         Backend (FastAPI, Cloud Run)              MongoDB Atlas (worlddigital_ai)
 ├ any page with Accept: text/markdown ──── read by ───────▶ app/rag.py  Rag.index / index_url ───▶ rag_pages   one record per page
 │   (front matter: title, description,                       │  sitemap + robots.txt + llms-full    rag_chunks  chunks + embeddings
 │    canonical, language, type, dates,                       │  clean → chunk → embed (OpenAI)      rag_sync    sync runs (history)
 │    category, robots)                                       │                                      rag_meta    metrics, eval, last success
 ├ /blog-admin/kb  (admin page) ── backend() ─────────────▶ /api/admin/rag/*  (token)               rag_tenants customer knowledge bases
 ├ blog publish / update / unpublish ──────────────────────▶ /api/admin/rag/index-url               rag_questions chat + API questions (180 days)
 ├ /api/tools/chat  (AI Ahmad) ─────────────────────────────▶ /api/tools/chat → Rag.context(["ai"])
 └ /api/rag/answer  (public, CORS) ─────────────────────────▶ /api/rag/answer → Rag.answer(["ai"])
GitHub Actions "Knowledge base (RAG) index", nightly 09:37 UTC ─▶ batched incremental sync, then quality test
```

### Knowledge kept apart (sources)

Every chunk has exactly one `source`, and every search states which sources it may see. The filter is applied
inside the Atlas query and checked again on the results.

| Source | What | Who can search it |
|---|---|---|
| `ai` | Public worlddigital.ai pages, blog posts and `/llms-full.txt` | Chat, blog writer, public API, admin |
| `internal` | Private company documents added in the admin | Admin only (never chat or public API) |
| `tenant:<id>` | One customer's website and documents | Admin only, and only on its own (mixing sources is refused) |

worlddigital.us is deliberately not indexed.

## Content discovery and cleaning

- **Discovery:** `sitemap.xml` (sitemap indexes supported) plus `/llms-full.txt`. Media, admin, API, thank-you and
  404 URLs are skipped. `robots.txt` rules for `User-agent: *` and `WorldDigitalRAG` are respected.
- **Reading:** each page is requested with `Accept: text/markdown`. The site worker returns the main content as
  Markdown (navigation, footer, scripts and forms removed), with front matter: `title`, `description`, `url`,
  `canonical`, `language`, `type` (`website_page`, `product_page`, `blog_post`, `blog_index`), and for blog posts
  `published`, `modified` and `category`. A page marked noindex gets `robots: noindex`.
- **Excluded:** noindex pages, pages whose canonical URL is another page, and robots.txt-disallowed URLs. These are
  counted in each sync (`skipped_noindex`, `skipped_canonical`, `skipped_robots`). If they were indexed before,
  they are removed.
- **Repeated content:** site-wide bands ("Try our SEO tools…") are dropped by heading. Any section longer than 60
  characters that already exists on another page is indexed only once. So is any identical chunk.

## Chunking and embeddings

- **Chunking:** split on H1 to H3 headings, then packed into chunks of about `RAG_CHUNK_TOKENS` (550 tokens, about
  2,200 characters). Long sections are split on line breaks with `RAG_CHUNK_OVERLAP_TOKENS` (80 tokens) of overlap,
  and keep their heading. Each chunk stores `section`, its first sub-heading.
- **Embeddings:** `RAG_EMBED_MODEL` (default `text-embedding-3-small`, 1536 dimensions). The size comes from the
  model or `RAG_EMBED_DIMS`.
  - Batches of 96 texts.
  - Retries with backoff on 429, 5xx and network errors, honouring `Retry-After`.
  - Every returned vector is checked against the expected size.
  - On failure, the page's previous chunks are kept and the error is counted.
- **Change detection:** a page is re-embedded only if:
  - its SHA-256 content hash changed,
  - the embedding model changed, or
  - the page record format (`SCHEMA`) changed.

  A full sync re-embeds everything.

## MongoDB collections

| Collection | Key | Contents |
|---|---|---|
| `rag_pages` | `"{source}\|{url}"` | `url`, `source`, `hash`, `title`, `kind` (page/doc), `content_type`, `category`, `language`, `description`, `canonical_url`, `published_at`, `last_modified`, `chunks`, `sections` (hashes), `schema`, `embedding_model`, `embedding_dims`, `last_crawled`, `updated`, `status` |
| `rag_chunks` | `"{source}\|{url}#{n}"` | `page_id`, `url`, `title`, `section`, `chunk_index`, `text`, `text_hash`, `content_hash`, `embedding`, `embedding_model`, `embedding_dims`, `source`, `kind`, `content_type`, `category`, `language`, `published_at`, `updated` |
| `rag_sync` | run id | `source`, `mode` (incremental/full/page), `trigger` (nightly/manual/admin/publish), `started`, `finished`, `duration_ms`, `status` (running/ok/partial/failed/abandoned), `urls`, `done`, `seen`, `stats` (counts, `errors`, `removed_urls`) |
| `rag_meta` | `metrics:YYYY-MM-DD`, `eval`, `last_success:ai` | daily counters (searches, answers, public answers, embedding errors and their total ms), the last quality report, last successful sync |
| `rag_questions` | auto | redacted question, reply, `covered`, `top_url`, `channel` (chat/api), `at`, `expires_at` (TTL, 180 days) |
| `rag_tenants` | tenant id | customer name, website, note |

Field names follow the existing collections. The spec's `worlddigital_knowledge` maps to `rag_chunks`, and its
`worlddigital_vector_index` maps to `rag_vector`. Renaming them would mean a full rebuild and a third Atlas Search
index, which is the M0 limit.

### Indexes

Regular indexes:
- `rag_chunks`: `(source, url)`, `text_hash`, `(source, content_type)`, `content_hash`
- `rag_pages`: `(source, sections)`, `(source, content_type)`
- `rag_sync`: `started`
- `rag_questions`: TTL on `expires_at`

Atlas Search indexes on `rag_chunks`:

```json
{ "name": "rag_vector", "type": "vectorSearch", "definition": { "fields": [
  { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
  { "type": "filter", "path": "source" }, { "type": "filter", "path": "content_type" },
  { "type": "filter", "path": "category" }, { "type": "filter", "path": "language" } ] } }

{ "name": "rag_text", "type": "search", "definition": { "mappings": { "dynamic": false, "fields": {
  "text": { "type": "string" }, "title": { "type": "string" }, "source": { "type": "token" },
  "content_type": { "type": "token" }, "category": { "type": "token" }, "language": { "type": "token" } } } } }
```

`Rag.ensure_indexes()` creates both search indexes when they are missing. It updates them only when a needed
filter field is missing or the vector size changed. It never drops an index.

## Retrieval and answers

- **Search:** `$rankFusion` combines `$vectorSearch` (meaning, weight 0.6) and `$search` (exact words, weight 0.4).
  The same filters apply to both: source, content type, category, language. If hybrid search isn't available (for
  example while an index builds), it falls back to vector-only, then to an exact cosine scan.
- **Answers:**
  - Retrieved text is sent inside `<source n="1" title="…" url="…">` tags, with any `<source` / `</source` in page
    text escaped.
  - The prompt says to answer only from the sources, cite them like [1], never invent products, prices,
    features, statistics or partnerships, and state what is not documented (`undocumented`).
  - It also says to treat source text as untrusted reference material, never instructions.
  - `covered: false` when the sources don't answer the question.
- **Website chat:** retrieval results are added to its fixed facts inside `<website_detail>` tags, under the same
  untrusted-content rule.

## API

All `/api/admin/rag/*` endpoints, and `/api/rag/search`, need the `x-internal-token` header
(`TOOLS_API_TOKEN`). The public worker proxy for `/api/tools/*` never forwards them.

| Method | Path | Body | Purpose |
|---|---|---|---|
| GET | `/api/admin/rag` | | Monitoring (counts, sync, usage, config, indexes, last quality report) |
| GET | `/api/admin/rag/history?limit=` | | Sync runs |
| POST | `/api/admin/rag/index` | `{full, run, batch, trigger}` | Start or continue a sync. With `batch`, each call handles that many URLs; pass back `run` until `finished` |
| POST | `/api/admin/rag/index-url` | `{url}` | Re-index or remove one page |
| POST | `/api/admin/rag/search` | `{q, k, sources, types, categories, language}` | Raw hits (admin; may include `internal`) |
| POST | `/api/admin/rag/ask` | `{q, sources, types}` | Cited answer with passages, search method and time |
| POST | `/api/admin/rag/eval` | | Run the quality test |
| GET | `/api/admin/rag/questions?days=` | | Chat and API questions |
| POST | `/api/admin/rag/internal` | `{action: list\|add-doc\|remove-doc, title, text, url}` | Private company knowledge |
| POST | `/api/admin/rag/tenants` | `{action, tenant, …}` | Customer knowledge bases |
| POST | `/api/rag/search` | `{query, limit, types, categories, language}` | Public-site retrieval for our own agents |
| POST | `/api/rag/answer` | `{query, types}` | Public-site answer with sources. Limited per IP per day (`RAG_API_DAILY_LIMIT`) and in total (`RAG_API_DAILY_TOTAL`) |

The site worker exposes only `POST https://worlddigital.ai/api/rag/answer` publicly (CORS `*`, 500-character limit,
client IP forwarded for the limit). It's listed in `/llms.txt`.

## Sync

- **Nightly:** GitHub Actions `rag-index.yml` at 09:37 UTC runs an incremental sync in batches of 20, fails if the
  run isn't `ok`, then runs the quality test. It fails below 75%. A manual run can choose a full rebuild and ask a
  test question.
- **On publish:** the blog editor re-indexes a post when it's published, updated or unpublished. A changed slug
  also removes the old URL.
- **Admin:** "Sync changed pages" and "Full rebuild" on `/blog-admin/kb`. Both run in batches of 15 from the
  browser.
- **Removal:**
  - A page missing from the sitemap is pruned at the end of a run, but only if the run read at least half the pages.
  - A 404, 410, redirect, noindex or non-canonical page is removed right away by `index-url`.
- **Stuck runs:** a run left `running` for more than 30 minutes is marked `abandoned` when the next one starts.

## Monitoring (admin page `/blog-admin/kb`)

- **Counts:** URLs found in the sitemap, website pages, blog posts and chunks.
- **Sync status:** last successful sync, pages waiting to sync, failed syncs in the last 30 days, errors in the
  last sync, pages removed in the last 30 days, and the full sync history.
- **Usage, last 30 days:** searches with average time, answers with average time, public API answers, embedding
  errors, and chat questions with the share not covered.
- **Answer quality:** right page found (hit rate and MRR), right page cited, answer correct, made-up answers,
  average and p95 answer time.
- **Tools:** an Ask box with a scope selector (public, public plus private, private only) and a content-type
  filter, the private company knowledge list, and customer knowledge bases.

Admin access uses the existing magic-link sign-in limited to `ADMIN_EMAILS`, with a CSRF token on every change.
Changes are written to the admin log.

## Quality test (`backend/app/rag_eval.json`)

Each case has `q`, plus `expect` (words that must appear in the answer), `urls` (path fragments that should be
retrieved and cited), or `negative: true` for questions the site has no answer to. For a negative case, the
assistant must say it doesn't know. Reported metrics:

- **Retrieval hit rate:** the expected page appears among the retrieved passages.
- **MRR:** the mean of 1 / rank of the first expected page.
- **Citation accuracy:** the expected page is among the cited sources.
- **Answer accuracy:** the expected words appear, and the answer is marked covered.
- **Unsupported-answer rate:** the share of negative questions that got answered anyway. This is the
  hallucination check.
- **Latency:** average and p95 per answer.

## Security

- **Secrets:** all secrets live in environment variables or GitHub secrets (`MONGODB_URI`, `OPENAI_API_KEY`,
  `TOOLS_API_TOKEN`). Nothing is hard-coded. MongoDB connects over TLS with the driver's connection pool, using
  one client per process.
- **Customer sites:** read through `_fetch_page`, which allows public IPs only (checked on every redirect) and
  caps each page at 1.5 MB. At most 60 pages per customer.
- **Input limits:** questions are limited to 500 characters and documents to 400,000 characters. Content types
  are checked against a fixed list.
- **Stored questions:** emails and phone numbers are removed before storing, IP addresses are never stored, and
  questions are deleted after 180 days. The privacy policy says so.
- **Rate limits:** the public API is limited per IP and in total. The chat keeps its own daily limit.

## Environment variables

| Variable | Default | Used for |
|---|---|---|
| `MONGODB_URI`, `MONGODB_DB` | –, `worlddigital_ai` | Database |
| `OPENAI_API_KEY`, `OPENAI_BASE` | –, `https://api.openai.com` | Embeddings and answers |
| `OPENAI_MODEL` | `gpt-5.4-mini` | Answer model (falls back through a list if not allowed) |
| `RAG_EMBED_MODEL` | `text-embedding-3-small` | Embedding model. Changing it re-embeds on the next sync and updates the vector index size |
| `RAG_EMBED_DIMS` | from the model | Override the vector size |
| `RAG_CHUNK_TOKENS`, `RAG_CHUNK_OVERLAP_TOKENS` | `550`, `80` | Chunking |
| `RAG_API_DAILY_LIMIT`, `RAG_API_DAILY_TOTAL` | `30`, `1000` | Public answer API limits |
| `CHAT_DAILY_LIMIT` | `40` | Website chat limit per IP |
| `TOOLS_API_TOKEN` | – | Worker ↔ backend and workflow ↔ backend auth |
| Worker: `TOOLS_API_URL`, `TOOLS_API_TOKEN`, `ADMIN_EMAILS` | | Backend address, token, admin sign-in |

## Tests

- **Backend:** `cd backend && uv run pytest`. `tests/test_rag.py` mocks the site, OpenAI and Atlas. It covers:
  - incremental sync, pruning, batched runs and history, full sync
  - re-embedding on a model change, retry on 429, wrong vector size
  - metadata and filters; noindex, canonical and robots.txt exclusion; boilerplate and duplicates
  - single-page re-index and removal
  - hybrid fallback, cited answers, prompt-injection escaping
  - chat grounding and logging, redaction
  - private knowledge isolation, customer isolation
  - the public API (limits, validation, no passages)
  - quality metrics and token checks
- **Worker:** `cd workers/ai-site && npm test`. It covers the admin page rendering and escaping, and the Markdown
  metadata.

## Deployment

1. Push to `main`. `deploy-backend.yml` deploys the backend to Cloud Run, and `deploy-ai-site.yml` deploys the
   worker. Each runs the tests first.
2. Run the "Knowledge base (RAG) index" workflow, or wait for the nightly run. Pages in an older record format are
   re-processed automatically by this normal sync, with no bulk delete. The search indexes are updated in place
   with the new filter fields; Atlas rebuilds them in the background, and search uses the fallbacks meanwhile.
3. Check the workflow notices, or `/blog-admin/kb`, for the sync and quality results.

## Costs (November 2026, at current traffic)

| Item | Estimate |
|---|---|
| Embeddings | About 100k tokens for a full rebuild of the site (about 50 pages). That's well under one cent at `text-embedding-3-small` pricing (about $0.02 per million tokens). Nightly syncs re-embed only changed pages, close to $0. Each question embeds about 20 tokens |
| Answers | Most of the cost. About 3–5k input tokens per answer with the configured mini model: fractions of a cent each, so a few dollars per thousand questions. Check current OpenAI pricing |
| Quality test | 23 answers per night, about 30 × 23 ≈ 700 answers a month |
| MongoDB Atlas | M0 free tier: about 10 MB of 512 MB used, 2 of 3 search indexes. Each customer knowledge base adds roughly 4 MB. Move to a paid tier (backups) before storing paying customers' documents, or past about 350 MB |
| Cloud Run, GitHub Actions | Within free usage at current volume |
