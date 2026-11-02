# WorldDigital Master Architecture

**Purpose.** This is the single source of truth for how the WorldDigital ecosystem (worlddigital.ai and worlddigital.us) is built today and how it should grow into an AI, machine learning and deep learning platform. It summarizes each area and links to the detailed documents. It does not repeat them.

**Scope.** Both production websites, their backends, the shared Google Cloud data warehouse, external integrations, and the proposed Intelligence Engine.
**Owner.** Ahmad Awwad, Founder and CEO, WorldDigital.ai Corporation LLC (Houston, TX).
**Last verified.** 2026-11-02, from repository code at `worlddigital-ai@993c158` and `worlddigital-us@8098231`, the live sites, and read-only BigQuery metadata queries.

## Status labels

| Label | Meaning |
|---|---|
| **EXISTING** | Verified in code, live site, or BigQuery metadata on the date above |
| **IN PROGRESS** | Partly built: a schema, a scaffold, or a manual process that is not yet automated |
| **PROPOSED** | Recommended; not built |
| **NEEDS VERIFICATION** | Referenced in code or docs, but not confirmed from this session (usually Google Cloud console state) |

---

## 1. Executive technical overview

WorldDigital runs a **lean, edge-first stack that already works**. Both sites are served by Cloudflare Workers. One Python API runs on Google Cloud Run for the paid tools. A BigQuery warehouse receives daily Search Console, GA4 and Google Ads exports for both sites.

Five facts shape every recommendation in this documentation set:

1. **Production is healthy and well-tested.** Both repos have CI tests, pre-deploy safety checks, nightly monitoring and documented rollback. The plan builds on this; it does not rewrite it.
2. **There are no customer accounts today.** The old customer portal (Next.js + Express on Replit) is archived and its sign-in pages show "being rebuilt." Multi-tenancy is a greenfield decision, and that is an advantage.
3. **A multi-tenant analytics schema already exists but is empty.** Tables such as `worlddigital_core.tenants`, `worlddigital_ai.ai_recommendations` and `worlddigital_ai.ai_actions` (with `requires_approval`) were created on 2026-09-22/23 with `tenant_id` on every row. None hold data yet. **IN PROGRESS**
4. **The data volume is far too small to train proprietary models yet.** Since late September, worlddigital.ai has 25,141 Search Console impressions and 27 clicks; worlddigital.us has 3,005 impressions and 3 clicks; Google Ads shows 29 clicks for about $14 (Oct 22–29). The near-term intelligence must come from rules, statistics, BigQuery ML forecasting and LLMs, plus instrumentation that captures ground truth. Proprietary models become possible once customer data, with consent, accumulates. See [ML Model Development](machine-learning/WORLDDIGITAL_ML_MODEL_DEVELOPMENT.md).
5. **Production runs in a Google Cloud project named like a proof of concept** (`cs-poc-0zqkvyxapah85tnxz2byzqa`) with no separate dev or staging project. Fixing this comes before any customer data arrives. See [Google Cloud Architecture](google-cloud/WORLDDIGITAL_GOOGLE_CLOUD_ARCHITECTURE.md).

**Recommended direction:** build one shared **WorldDigital Intelligence Engine** on Google Cloud: tenant-scoped data in BigQuery, transactional data in Cloud SQL, model training and scoring through BigQuery ML first, and Vertex AI only when a model beats its baseline. Both sites consume it through one API. Every action that spends money or changes a campaign requires recorded human approval.

## 2. Architecture diagram index

Mermaid sources live in [`architecture/diagrams/`](architecture/diagrams/) and render on GitHub. Each is embedded and explained in the document listed.

| # | Diagram | Source | Explained in |
|---|---|---|---|
| 1 | Overall ecosystem | [WORLDDIGITAL_ECOSYSTEM_MAP.mmd](architecture/diagrams/WORLDDIGITAL_ECOSYSTEM_MAP.mmd) | [Product Architecture](architecture/WORLDDIGITAL_PRODUCT_ARCHITECTURE.md) |
| 2 | AI and ML lifecycle | [WORLDDIGITAL_AI_ML_ARCHITECTURE.mmd](architecture/diagrams/WORLDDIGITAL_AI_ML_ARCHITECTURE.mmd) | [Machine Learning Architecture](machine-learning/WORLDDIGITAL_MACHINE_LEARNING_ARCHITECTURE.md) |
| 3 | Advertising intelligence | [WORLDDIGITAL_ADVERTISING_INTELLIGENCE.mmd](architecture/diagrams/WORLDDIGITAL_ADVERTISING_INTELLIGENCE.mmd) | [AI Platform Architecture](architecture/WORLDDIGITAL_AI_PLATFORM_ARCHITECTURE.md) |
| 4 | Deep learning | [WORLDDIGITAL_DEEP_LEARNING_ARCHITECTURE.mmd](architecture/diagrams/WORLDDIGITAL_DEEP_LEARNING_ARCHITECTURE.mmd) | [Deep Learning Architecture](deep-learning/WORLDDIGITAL_DEEP_LEARNING_ARCHITECTURE.md) |
| 5 | Google Cloud infrastructure | [WORLDDIGITAL_GOOGLE_CLOUD_INFRASTRUCTURE.mmd](architecture/diagrams/WORLDDIGITAL_GOOGLE_CLOUD_INFRASTRUCTURE.mmd) | [Google Cloud Architecture](google-cloud/WORLDDIGITAL_GOOGLE_CLOUD_ARCHITECTURE.md) |
| 6 | Customer data and security | [WORLDDIGITAL_CUSTOMER_DATA_SECURITY.mmd](architecture/diagrams/WORLDDIGITAL_CUSTOMER_DATA_SECURITY.mmd) | [Customer Data Isolation](security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md) |
| 7 | Data pipeline | [WORLDDIGITAL_DATA_PIPELINE.mmd](architecture/diagrams/WORLDDIGITAL_DATA_PIPELINE.mmd) | [Data Pipelines](data-infrastructure/WORLDDIGITAL_DATA_PIPELINES.md) |
| 8 | Deployment workflow | [WORLDDIGITAL_DEPLOYMENT_WORKFLOW.mmd](architecture/diagrams/WORLDDIGITAL_DEPLOYMENT_WORKFLOW.mmd) | [Deployment Architecture](google-cloud/WORLDDIGITAL_DEPLOYMENT_ARCHITECTURE.md) |

Diagram colors: green = EXISTING (for BigQuery tables this means the schema exists; several are still empty, see the [inventory](WORLDDIGITAL_BRAND_AND_PROJECT_INVENTORY.md#6-bigquery-datasets)), orange dashed = PROPOSED, grey = NEEDS VERIFICATION, red = an approval or permission gate.

## 3. WorldDigital.ai architecture (summary)

| Component | Tech | Runs on | Status |
|---|---|---|---|
| Company site, blog, blog editor | JavaScript Worker + SQLite Durable Object (`posts`, `media`, `sessions`, `leads`, `audit`) | Cloudflare `worlddigital-ai-site`, route `worlddigital.ai/*` | EXISTING |
| Paid tools API: keyword research ($9.99), content packs ($24.99) | Python FastAPI, MongoDB Atlas, OpenAI, DataForSEO, Stripe Checkout, Resend | Cloud Run `worlddigital-ai-api` (us-central1) | EXISTING |
| Crawl-file forwarder | JavaScript Worker | Cloudflare `worlddigital-ai-crawl-files` | EXISTING, marked for retirement in its own config |
| Old customer app (Next.js + Express, ads/social integrations) | TypeScript | Not deployed | Archived in `archive/nextjs-app/` |

Detail: [AI Platform Architecture](architecture/WORLDDIGITAL_AI_PLATFORM_ARCHITECTURE.md).

## 4. WorldDigital.us architecture (summary)

| Component | Tech | Runs on | Status |
|---|---|---|---|
| Founder site + lead magnet | Astro 5 + Tailwind v4, static | Cloudflare `worlddigitalus` | EXISTING |
| Free SEO & AI-visibility report (serves **both** sites) | Python Worker, DataForSEO, Turnstile, KV, Resend | Cloudflare `worlddigital-report` | EXISTING |
| 24-hour follow-up email, nightly site monitor, weekly AI-visibility run | Same Worker, 15-minute cron | Cloudflare | EXISTING |
| Unsubscribe API | Python Worker | Cloudflare `worlddigital-unsubscribe` | EXISTING |
| BigQuery loaders (Search Console, GA4, Ads, AI visibility) | SQL + Python, run by hand | Laptop / Cloud Shell | IN PROGRESS (manual) |

Detail: [WorldDigital.us Architecture](architecture/WORLDDIGITAL_US_ARCHITECTURE.md).

## 5. Unified ecosystem architecture

The two sites already share infrastructure: one Cloudflare account, one Google Cloud project, one report Worker, one BigQuery warehouse. The recommended product split:

- **worlddigital.ai** is the **platform**: the self-serve tools, the future customer portal, dashboards, and Advertising and Creative Intelligence.
- **worlddigital.us** is the **acquisition and trust front door**: the founder brand, the free report, local SEO, and a funnel into the platform.
- **Shared Intelligence Engine** (PROPOSED): one API and one data platform both sites call, so no capability is built twice.

Detail: [Product Architecture](architecture/WORLDDIGITAL_PRODUCT_ARCHITECTURE.md) (includes Diagram 1).

## 6. AI infrastructure

EXISTING: OpenAI chat completions (default model `gpt-5.4-mini`, with an automatic fallback list) for keyword ranking and content packs; a weekly AI-visibility run that asks ChatGPT, Perplexity, Gemini and Claude five tracking prompts.
PROPOSED: a provider-neutral LLM gateway, per-tenant retrieval (RAG), an evaluation harness for prompts, and AI agents that recommend but never act without approval.

Detail: [AI Strategy](artificial-intelligence/WORLDDIGITAL_AI_STRATEGY.md) · [Generative AI](deep-learning/WORLDDIGITAL_GENERATIVE_AI.md) · [NLP and Transformers](deep-learning/WORLDDIGITAL_NLP_AND_TRANSFORMERS.md).

## 7. Machine learning architecture

No ML models exist today. The plan, in this order: baselines first, then BigQuery ML (ARIMA_PLUS forecasting, boosted trees, k-means), then Vertex AI custom training only when a model beats its baseline on held-out data. Each model has an entry gate based on data volume.

Detail: [Machine Learning Architecture](machine-learning/WORLDDIGITAL_MACHINE_LEARNING_ARCHITECTURE.md) · [Model Development](machine-learning/WORLDDIGITAL_ML_MODEL_DEVELOPMENT.md) · [Predictive Analytics](machine-learning/WORLDDIGITAL_PREDICTIVE_ANALYTICS.md) · [Recommendation Engine](machine-learning/WORLDDIGITAL_RECOMMENDATION_ENGINE.md).

## 8. Deep learning architecture

Deep learning is consumed as **pretrained models through APIs** (LLMs, embeddings, vision). WorldDigital does not train neural networks from scratch, and does not train a foundation model. A neural model replaces a classical one only after a documented benchmark.

Detail: [Deep Learning Architecture](deep-learning/WORLDDIGITAL_DEEP_LEARNING_ARCHITECTURE.md) · [Computer Vision](deep-learning/WORLDDIGITAL_COMPUTER_VISION.md).

## 9. Data architecture

| Store | Holds | Status |
|---|---|---|
| BigQuery (17 datasets, US multi-region) | Search Console, GA4, Google Ads exports; AI visibility; empty multi-tenant `worlddigital_*` schemas; `marketing_marts` | EXISTING (exports live; marts and core empty) |
| MongoDB Atlas `worlddigital_ai` | Tool jobs, cache, paid orders, rate limits (TTL indexes) | EXISTING |
| Durable Object SQLite | Blog posts, media, editor sessions, leads, audit | EXISTING |
| Workers KV `REPORTS` | Free reports, follow-up jobs, AI-visibility runs | EXISTING |
| Cloud SQL Postgres | Tenants, users, OAuth connections, approvals | PROPOSED |
| Cloud Storage | Training snapshots, model artifacts, exports | PROPOSED |

Detail: [Data Architecture](data-infrastructure/WORLDDIGITAL_DATA_ARCHITECTURE.md) · [Data Pipelines](data-infrastructure/WORLDDIGITAL_DATA_PIPELINES.md) · [Feature Engineering](data-infrastructure/WORLDDIGITAL_FEATURE_ENGINEERING.md) · [Data Governance](data-infrastructure/WORLDDIGITAL_DATA_GOVERNANCE.md).

## 10. Google Cloud infrastructure

EXISTING: Cloud Run, Secret Manager (7 secrets), Cloud Build / Artifact Registry source deploys, Workload Identity Federation for GitHub (no stored keys), BigQuery with three managed export feeds.
PROPOSED: separate dev and prod projects, Cloud Scheduler + Pub/Sub + Cloud Run jobs for ingestion, Cloud SQL, Cloud Storage, Vertex AI (training and registry only, no always-on endpoints at first), and a separate project for any healthcare workloads.
NEEDS VERIFICATION: Cloud Monitoring alerts, billing budgets, organization and folder structure, MongoDB Atlas network rules.

Detail: [Google Cloud Architecture](google-cloud/WORLDDIGITAL_GOOGLE_CLOUD_ARCHITECTURE.md) · [Deployment Architecture](google-cloud/WORLDDIGITAL_DEPLOYMENT_ARCHITECTURE.md).

## 11. Security architecture

Strong today: keyless GitHub-to-Google sign-in, secrets kept out of the repo, a fail-closed internal token between the site and the API, Turnstile on forms, HSTS and security headers, one-time email sign-in for the blog editor, and an audit table.
Gaps to close before customer data arrives: two secrets passed as plain Cloud Run environment variables, an over-broad deploy service account, no staging environment, client-side purchase tracking, and no customer identity system yet.

Detail: [Security Architecture](security/WORLDDIGITAL_SECURITY_ARCHITECTURE.md) · [Customer Data Isolation](security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md).

## 12. API architecture

EXISTING: `/api/tools/*` (FastAPI behind the site Worker), the report Worker endpoints (`/`, `/research`, `/followups`, `/monitor/responsive`, `/verify-human`, `?status=`), and the unsubscribe API.
PROPOSED: a versioned Intelligence API (`/v1/...`) with tenant-scoped authentication, used by both sites.

Detail: [API Architecture](integrations/WORLDDIGITAL_API_ARCHITECTURE.md).

## 13. Integration architecture

EXISTING: DataForSEO, OpenAI, Stripe, Resend, Cloudflare Turnstile, Buffer (Social Hub), Google Calendar booking, WhatsApp click-to-chat, GA4, Google Tag Manager, Google Ads tag, IndexNow, the Search Console / GA4 / Google Ads BigQuery exports, Anthropic Workload Identity (test workflow).
PROPOSED: per-tenant OAuth connectors for Google Ads, Meta, TikTok and Snapchat. Working client code for these already exists in the archived app and can be reused.

Detail: [External Integrations](integrations/WORLDDIGITAL_EXTERNAL_INTEGRATIONS.md).

## 14. Reliability, testing, roadmap and cost

- [Backup and Disaster Recovery](reliability/WORLDDIGITAL_BACKUP_AND_DISASTER_RECOVERY.md)
- [Monitoring and Observability](reliability/WORLDDIGITAL_MONITORING_AND_OBSERVABILITY.md)
- [Testing Strategy](testing/WORLDDIGITAL_TESTING_STRATEGY.md)
- [Master Roadmap](development-roadmap/WORLDDIGITAL_MASTER_ROADMAP.md) (six phases with entry gates)
- [Implementation Backlog](development-roadmap/WORLDDIGITAL_IMPLEMENTATION_BACKLOG.md) (prioritized, with approval flags)
- [Cost Analysis](financial-planning/WORLDDIGITAL_COST_ANALYSIS.md)
- [Technology Stack](architecture/WORLDDIGITAL_TECHNOLOGY_STACK.md)
- [Brand and Project Inventory](WORLDDIGITAL_BRAND_AND_PROJECT_INVENTORY.md)

## 15. Architectural decisions (log)

| # | Decision | Status | Why |
|---|---|---|---|
| AD-1 | Keep Cloudflare Workers as the web edge for both sites | Accepted (existing) | Fast, cheap, well-tested, PageSpeed 96–100 |
| AD-2 | Google Cloud is the data and intelligence plane | Proposed | BigQuery, Search Console, GA4 and Google Ads data already land there |
| AD-3 | BigQuery for analytics; Cloud SQL Postgres for transactional tenant data | Proposed | BigQuery is not a transactional database; Postgres row-level security fits tenancy |
| AD-4 | Keep MongoDB Atlas for the current paid tools; do not migrate now | Proposed | It works; migrating adds risk with no business value today |
| AD-5 | Baselines, then BigQuery ML, then Vertex AI | Proposed | Data volume is small; avoid always-on model endpoints |
| AD-6 | No autonomous spend: every material change needs a recorded approval | Proposed | Business, legal and platform-policy risk |
| AD-7 | Per-tenant models by default; pooled training only with written consent | Proposed | Contractual and privacy obligations |
| AD-8 | Healthcare (PHI) only in a separate project under a BAA | Proposed | HIPAA; keep the marketing stack out of scope |
| AD-9 | Create separate prod and dev projects before onboarding customers | Proposed | The current project name and IAM suggest a proof-of-concept setup |

Change process: when a decision changes, update the supporting document, then this table, then any affected diagram, then the roadmap, then check the links. (Repeated in [docs/README.md](README.md).)

## 16. Open questions for the founder

These are listed in [docs/README.md](README.md#open-questions-that-need-your-input), so there is one list to maintain.
