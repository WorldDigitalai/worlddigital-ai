# WorldDigital Technology Stack

**Purpose.** The single list of technologies in use and recommended, with a reason for each choice. Other documents link here instead of repeating stack details.
**Scope.** Both sites, the backend, data and AI/ML.
**Dependencies.** [Master](../WORLDDIGITAL_MASTER_ARCHITECTURE.md).
**Status.** Per row.

## In use

| Layer | Technology | Where | Status |
|---|---|---|---|
| Edge / hosting | Cloudflare Workers, static assets, KV, Durable Objects (SQLite), Turnstile, cron triggers | both sites | EXISTING |
| Frontend | Hand-written HTML templates in a JS Worker (worlddigital.ai); Astro 5 + Tailwind 4 (worlddigital.us) | – | EXISTING |
| Backend | Python 3.13 FastAPI on Cloud Run; Python Cloudflare Workers; JavaScript Workers | – | EXISTING |
| Databases | MongoDB Atlas; Durable Object SQLite; Workers KV; BigQuery | – | EXISTING |
| AI | OpenAI chat completions (JSON mode) | tools API | EXISTING |
| SEO data | DataForSEO, Google Lighthouse | report + tools | EXISTING |
| Payments / email | Stripe; Resend | – | EXISTING |
| Analytics | GA4 ×2, GTM, Google Ads tag, Search Console bulk export, Google Ads Data Transfer | – | EXISTING |
| CI/CD | GitHub Actions, wrangler / pywrangler, `google-github-actions/deploy-cloudrun`, Workload Identity Federation, uv | – | EXISTING |
| Social | Buffer (Social Hub data) | ai-site | EXISTING |

## Recommended additions (in roadmap order)

| Need | Choice | Why this one | Rejected alternatives |
|---|---|---|---|
| Scheduled SQL, data tests, lineage | **Dataform** (BigQuery-native, free) | SQL-only, version-controlled, runs in BigQuery | dbt Cloud (extra vendor), Airflow/Composer (≈$300+/mo minimum, overkill) |
| Job scheduling | Cloud Scheduler → Cloud Run jobs | Scales to zero; a few cents a month | Always-on VMs |
| Async ingestion | Pub/Sub | Decouples connectors from loaders; `raw_google_ads.pubsub_message_id` already expects it | – |
| Transactional tenant data | **Cloud SQL for PostgreSQL** + row-level security + `pgvector` | Real transactions, RLS for tenancy, vectors in the same database at small scale | Firestore (no RLS), keeping Mongo for tenancy (weaker relational integrity) |
| Tabular ML + forecasting | **BigQuery ML** (`ARIMA_PLUS`, `BOOSTED_TREE_*`, `KMEANS`, `LOGISTIC_REG`) | Trains where the data is, no serving infrastructure, pay per query | Vertex AutoML at this data size |
| Custom training + registry | Vertex AI Training + Model Registry | Only when BigQuery ML is beaten; pay per job | Always-on Vertex endpoints at first |
| Deep learning framework | **PyTorch** + Hugging Face Transformers (when needed) | Ecosystem, pretrained models | TensorFlow (no in-house code depends on it) |
| LLMs | Provider-neutral gateway: OpenAI (current), with Gemini on Vertex AI and Claude (API or Vertex) as options | Avoid lock-in; pick per task on cost and quality evaluation | Single hard-coded vendor |
| Embeddings / vector search | `pgvector` first; BigQuery `VECTOR_SEARCH` for analytics-side retrieval | No always-on index cost | Vertex AI Vector Search (has an always-on endpoint cost; revisit when there are millions of vectors) |
| Vision | Cloud Vision API + multimodal LLM | No training needed | Training CNNs from scratch |
| Observability | Cloud Logging/Monitoring + Workers observability + Sentry (optional) | Already partly on | – |

## Not recommended now
Training a foundation model; Kubernetes (GKE); Vertex AI Pipelines (until there are 3 or more production models); a feature store product (BigQuery views are enough at this scale). Each has a revisit trigger in the [roadmap](../development-roadmap/WORLDDIGITAL_MASTER_ROADMAP.md).

## Related
[Google Cloud](../google-cloud/WORLDDIGITAL_GOOGLE_CLOUD_ARCHITECTURE.md) · [Cost Analysis](../financial-planning/WORLDDIGITAL_COST_ANALYSIS.md)
