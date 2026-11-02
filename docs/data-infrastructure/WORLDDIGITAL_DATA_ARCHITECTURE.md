# WorldDigital Data Architecture

**Purpose.** Which data lives in which store, and the layered warehouse design.
**Scope.** All operational and analytical data for both sites and the future platform.
**Dependencies.** [Data Pipelines](WORLDDIGITAL_DATA_PIPELINES.md), [Data Governance](WORLDDIGITAL_DATA_GOVERNANCE.md), [Inventory §6](../WORLDDIGITAL_BRAND_AND_PROJECT_INVENTORY.md#6-bigquery-datasets).
**Status.** Per row.

## Operational stores

| Store | Data | Owner service | Status | Decision |
|---|---|---|---|---|
| Durable Object SQLite (`Store`) | Blog posts, media blobs, editor sessions, site leads, audit | worlddigital-ai-site | EXISTING | Keep |
| Workers KV `REPORTS` | Free reports, follow-up jobs, AI-visibility runs (120-day TTL) | worlddigital-report | EXISTING | Keep; mirror events to BigQuery |
| MongoDB Atlas `worlddigital_ai` | Tool jobs, cache, paid orders, limits (TTL) | worlddigital-ai-api | EXISTING | Keep (AD-4) |
| Cloud SQL Postgres | Tenants, users, roles, ad-account connections, approvals, action log, embeddings (`pgvector`) | Intelligence API | PROPOSED | System of record for tenancy |
| Cloud Storage | Training snapshots, model artifacts, creatives, report PDFs | Jobs | PROPOSED | – |

## Warehouse layers (BigQuery, US multi-region)

| Layer | Existing datasets | Contents | Rules |
|---|---|---|---|
| Landing (Google-managed) | `searchconsole_*`, `analytics_*`, `ads_raw.p_ads_*` | Native exports | Never modified by WorldDigital code |
| Raw | `seo_raw`, `analytics_raw`, `geo_raw`, `social_raw`, `worlddigital_raw` | Append-only copies and API payloads | Partition by date; keep source payload |
| Staging | `worlddigital_staging` (empty) | Typed, deduplicated, validated | Data tests must pass |
| Core | `worlddigital_core` (14 tables, empty) | Conformed, `tenant_id` on every row | Row access policies by tenant |
| AI | `worlddigital_ai` (4 tables, empty) | Recommendations, actions, decisions, reports | Append-only audit semantics |
| Marts | `marketing_marts`, `worlddigital_analytics` (views) | Dashboard-ready | Built by Dataform |
| ML (new) | `ml_features`, `ml_predictions` (PROPOSED) | Feature views, model outputs | Model id + version on every row |
| Audit | `worlddigital_audit` | Sync events | Retain 400 days |

## Key design points
- **BigQuery is analytical, not transactional.** Tenants and users are created in Postgres and replicated to `worlddigital_core.tenants/users` (no secrets, minimal PII).
- **WorldDigital itself is tenant 0.** Its own Search Console, GA4 and Ads data flows through the same core tables, so every feature is tested on real data before customers see it.
- **Partitioning and clustering:** partition every daily table by `date`; cluster by `tenant_id`, then the main dimension. This keeps per-tenant query costs proportional to the tenant's own data.
- **Duplicate Search Console export:** use `searchconsole_worlddigitalus` (domain property). Leave `_prefix` out of the marts.

## Related
[Feature Engineering](WORLDDIGITAL_FEATURE_ENGINEERING.md) · [Customer Data Isolation](../security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md)
