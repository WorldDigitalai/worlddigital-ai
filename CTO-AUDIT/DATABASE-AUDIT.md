# Database audit

## Inventory (Atlas API and database commands, 2026-11-04)

- **Cluster:** `worlddigital-ai`, **FREE (M0)**, GCP `CENTRAL_US`, MongoDB 8.0.36, state IDLE, no open alerts.
- **Database `worlddigital_ai`:** 14 collections, 296 documents, 5.0 MB data, 10.0 MB storage, 30 indexes (1.0 MB).
  M0 storage limit is 512 MB.

| Collection | Purpose | Indexes (live) | Retention |
|---|---|---|---|
| `tool_jobs` | Previews and paid reports | `_id`, `expires_at` (TTL), `paid+paid_at` | TTL (code: previews 30 days, paid 1 year) |
| `tool_cache`, `tool_limits` | Same-request cache, per-IP daily limits | TTL `expires_at` (per `store.py`) | TTL |
| `tool_paid` | Stripe session → job | TTL | **1 year** |
| `tool_free_used` | One free preview per domain | `_id` only | Forever (by design) |
| `tool_audit` | Site-audit results | `_id` | Overwritten |
| `billing_customers` / `billing_invoices` / `billing_subscriptions` | Mercury billing (dormant) | number unique, status+due, status+next_invoice | 1 / 1 / 0 documents |
| `rag_chunks` | Knowledge base chunks and embeddings | `source+url`, `text_hash`, `source+content_type`, `content_hash` + 2 search indexes | Synced |
| `rag_pages`, `rag_meta`, `rag_tenants` | Page records, metrics, customers | as created by `ensure_indexes()` | – |
| `rag_sync` | Sync runs | `_id`, `started` | **No TTL** (DB-05) |
| `rag_questions` | Chat and API questions (redacted) | `_id`, `expires_at` TTL | 180 days |

The worker's Durable Object (SQLite) is a second, separate store: posts, media, leads, sessions, AI jobs.

## Findings

| ID | Severity | Finding | Evidence | Fix | Approval |
|---|---|---|---|---|---|
| DB-01 | **HIGH** | **No backups.** M0 has none. The data includes paid-order records (needed to re-send reports), billing records, customer knowledge bases and private documents | Cluster type FREE | Cheapest: a nightly `mongodump` GitHub Action to an encrypted Cloud Storage bucket with 30-day retention (cents per month). Or move to Flex/M10 with built-in backups when customer KBs start | Yes (new bucket) |
| DB-02 | HIGH | The app uses the only DB user, **`atlasAdmin`** (can drop any database or create users) | Atlas user list | Dedicated user with `readWrite@worlddigital_ai` (SEC-02) | Yes |
| DB-03 | MEDIUM | Network access `0.0.0.0/0` | Atlas access list | Accept, with a long random password and the least-privilege user. Private endpoints need a paid tier | Decision |
| DB-04 | MEDIUM | Durable Object data (blog posts, media, leads) has **no export**. Recovery depends on Cloudflare platform features (**UNVERIFIED**) | No backup job in `workers/ai-site` | Weekly admin-token export of posts and media to the same backup bucket | Yes |
| DB-05 | LOW | `rag_sync` grows without limit (each run keeps its URL list) | Indexes `_id`, `started` | TTL 180 days on `finished` | No (safe) |
| DB-06 | LOW | Paid orders expire after 1 year, so the order link stops working | `store.py` TTL | Confirm intent; Stripe keeps the payment record either way | Decision |
| DB-07 | INFO | No slow queries or missing indexes for current access paths: every lookup is by `_id` or an indexed field. Search runs in Atlas Search | Code review + index list | – | – |

## Connections and consistency

- One `MongoClient` per process (pool). The URI comes from Secret Manager, uses TLS, and the `retryWrites=true` default applies.
- **Writes:**
  - Billing pings the DB before calling Mercury, so no half-created invoices.
  - Paid unlock is idempotent.
  - RAG embeds before deleting old chunks, so a failure keeps the old version.
- There are no multi-document transactions. None of the flows needs one today.

## Scalability (estimates)

| Scale | What holds | What breaks first |
|---|---|---|
| 1,000 customers | Access patterns are all keyed; Cloud Run 3 instances | M0 limits: 512 MB storage (reached around 100 customer knowledge bases at about 4 MB each), shared CPU, 100 operations/s guidance, 3 search indexes. **Move to M10 (or Flex) before onboarding paying KB customers** |
| 10,000 customers | M10/M20 with the same schema | `rag_chunks` around 40 GB if every customer has a KB, which needs M30+ or per-customer chunk caps. Raise Cloud Run `max-instances` |
| 100,000 customers | Same design, sharded by `source` | Cluster sharding on `source`, a dedicated vector search node, and a background ingestion queue (Cloud Run Jobs). Only worth designing once real usage exists |

No database replacement is justified: MongoDB with Atlas Vector Search fits every current and planned workload.
