# WorldDigital Cost Analysis

**Purpose.** Estimated infrastructure and development costs by phase, so every new service has a stated business value.
**Scope.** Cloud, third-party APIs and engineering effort.
**Dependencies.** [Roadmap](../development-roadmap/WORLDDIGITAL_MASTER_ROADMAP.md), [Technology Stack](../architecture/WORLDDIGITAL_TECHNOLOGY_STACK.md).
**Status.** Estimates only. List prices change: **verify with the Google Cloud pricing calculator and vendor pages before approving spend.** Actual current bills were not visible from this session (NEEDS VERIFICATION).

## Current running cost (estimated)
| Item | Basis | Estimate / month |
|---|---|---|
| Cloudflare Workers | Paid plan if enabled (Durable Objects with SQLite need it, or the free tier's limits) | $0–5 + usage |
| Cloud Run API | Scales to zero, light traffic | $0–5 |
| BigQuery | < 1 GB stored, small queries (within free tiers of 10 GB storage and 1 TiB queries) | ≈ $0 |
| Secret Manager, Cloud Build, Artifact Registry | Small | $0–3 |
| MongoDB Atlas | Depends on tier (shared free tier vs dedicated) | $0–60 |
| DataForSEO | Pay-as-you-go; the nightly check reports the balance | usage |
| OpenAI | Per token; small at current volume | usage |
| Resend, Stripe | Plan / per transaction | plan + fees |

## Incremental running cost by phase (infrastructure only)
| Phase | New services | Estimate / month | Business value |
|---|---|---|---|
| 1 | none | ≈ $0 | Risk reduction |
| 2 | Dataform (free), Scheduler (a few jobs ≈ cents), Cloud Run jobs (minutes/day) | $5–25 | Daily trustworthy data; saves manual work |
| 3 | BigQuery ML training and scoring at current volume | $0–20 | Forecasts and recommendations |
| 4 | LLM + Vision API usage; Cloud SQL smallest tier for `pgvector` | $50–300 | NLP labels, RAG, creative insight |
| 5 | Cloud SQL with HA (when paying tenants), Pub/Sub, more jobs | $60–250 base + per-tenant usage | Sellable platform |
| 6 | Vertex AI training jobs on demand | usage-based, per job | Better models once data justifies them |

**Avoided costs (by design):** Cloud Composer (≈ $300+/mo minimum), always-on Vertex AI prediction endpoints (≈ $70+/mo each at the smallest machine), Vertex Vector Search index endpoints, GKE, always-on GPUs.

**Per-tenant variable cost drivers:** LLM tokens (cap per plan), DataForSEO calls, BigQuery bytes scanned (clustering by `tenant_id` keeps it low), connector API calls. Track these in the LLM gateway and audit tables so pricing can be set with margin.

## Development effort
| Phase | Effort (engineer-weeks) |
|---|---|
| 1 Foundation | 3–4 |
| 2 Data intelligence | 6–8 |
| 3 Machine learning | 6–10 |
| 4 Deep learning (selective) | 8–12 |
| 5 Intelligence Engine | 14–20 |
| 6 Advanced automation | 12–20 |
| **Total** | **49–74** |

Multiply by your loaded weekly cost for the people doing the work. Phases 3 and 4 can overlap with Phase 5 once the tenancy foundation exists.

## Related
[Master](../WORLDDIGITAL_MASTER_ARCHITECTURE.md) · [Backlog](../development-roadmap/WORLDDIGITAL_IMPLEMENTATION_BACKLOG.md)
