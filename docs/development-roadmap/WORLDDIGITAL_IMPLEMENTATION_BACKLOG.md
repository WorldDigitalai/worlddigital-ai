# WorldDigital Implementation Backlog

**Purpose.** A prioritized, executable task list. Each item says whether it needs founder approval (new paid service, IAM or infrastructure change, production behavior change, destructive change).
**Scope.** Phases 1–3 in detail; later phases as epics.
**Dependencies.** [Roadmap](WORLDDIGITAL_MASTER_ROADMAP.md).
**Status.** All PROPOSED unless marked.

Priority: P0 = do first; P1 = this phase; P2 = next. Effort: S ≤ 2 days, M ≤ 1 week, L > 1 week.

## Phase 1
| ID | P | Task | Repo / place | Effort | Approval? |
|---|---|---|---|---|---|
| B-01 | P0 | ✅ DONE 2026-11-02 (PR #2). Merge this documentation | worlddigital-ai `docs/` | S | Yes (PR review) |
| B-02 | P0 | IN PROGRESS: `tools/gcp/phase1-hardening.sh` step 1. Billing budget + alerts on the GCP project | GCP console | S | Yes (billing) |
| B-03 | P0 | IN PROGRESS: script step 2 + `deploy-backend.yml` secret sync, with automatic rollback. Move `TOOLS_API_TOKEN` and the Resend key into Secret Manager references | worlddigital-ai | S | Yes (prod config) |
| B-04 | P0 | IN PROGRESS: script steps 3–4 + `site-audit.yml`. Create a read-only service account for `site-audit.yml`; reduce `github-deploy` roles | GCP IAM | S | Yes (IAM) |
| B-05 | P0 | IN PROGRESS: founder works through the [checklist](../security/WORLDDIGITAL_SECURITY_ARCHITECTURE.md#account-security-checklist-s-7). MFA review on GitHub, Cloudflare, Google, Stripe, Atlas, Resend, DataForSEO | accounts | S | – |
| B-06 | P1 | Stripe webhook → record purchases server-side (GA4 Measurement Protocol + Google Ads offline conversion + BigQuery); keep the client event until reconciled | worlddigital-us report Worker or Cloud Run | M | Yes (prod behavior) |
| B-07 | P1 | Cloudflare Access on report admin paths | Cloudflare | S | Yes |
| B-08 | P1 | Decide the project structure (`worlddigital-prod`/`-dev`); write the migration plan | docs | S | Yes |
| B-09 | P1 | Fix "WorldDigital.ai Corporation" → full legal name in `home.html` | worlddigital-ai | S | Yes (copy) |
| B-10 | P1 | Remove the duplicate Search Console `_prefix` export from analysis (or stop it) | GSC / BigQuery | S | Yes |
| B-11 | P2 | Dependabot + container scanning | both | S | – |
| B-12 | P2 | Install the backend from `uv.lock` in the Dockerfile | worlddigital-ai | S | Yes (prod build) |

## Phase 2
| ID | P | Task | Effort | Approval? |
|---|---|---|---|---|
| B-20 | P0 | Dataform repo; port `refresh_raw_tables.sql`; daily schedule | M | Yes (new service, ≈$0) |
| B-21 | P0 | Freshness assertions → 10 pm monitor email | S | – |
| B-22 | P1 | AI-visibility direct load to `geo_raw` | M | Yes |
| B-23 | P1 | Staging + core models with `tenant_id = 'worlddigital'` | M | – |
| B-24 | P1 | Populate `marketing_marts` (opportunities, visibility scores) | M | – |
| B-25 | P1 | Server-side events: tool preview, tool paid, report requested, lead → BigQuery (hashed ids) | M | Yes |
| B-26 | P2 | Terraform for GCP resources | M | Yes |
| B-27 | P2 | Owner dashboard (SEO + AI visibility + ads) for tenant 0 | M | – |

## Phase 3
| ID | P | Task | Effort |
|---|---|---|---|
| B-30 | P0 | Model card template + `ml_registry` table | S |
| B-31 | P0 | Seasonal-naïve baselines for clicks, sessions, leads | S |
| B-32 | P1 | `ARIMA_PLUS` forecasts + backtest report | M |
| B-33 | P1 | Recommenders: `seo.improve_ctr`, `seo.new_content`, `geo.earn_citation`, `ads.pause_wasted_terms` | L |
| B-34 | P1 | Keyword-opportunity score in the keyword tool | M |
| B-35 | P2 | Drift and accuracy monitors | M |

## Epics (Phases 4–6)
E-4.1 LLM gateway + evaluation harness · E-4.2 NLP labeling of queries and AI answers · E-4.3 RAG on `pgvector` · E-4.4 Creative description · E-5.1 Tenancy (Cloud SQL + RLS + auth) · E-5.2 Intelligence API v1 · E-5.3 Google Ads + Meta read connectors · E-5.4 Customer dashboards · E-5.5 Deletion workflow · E-6.1 Approval-gated executor · E-6.2 Monitoring agents · E-6.3 Learned recommendation ranking.

## Related
[Roadmap](WORLDDIGITAL_MASTER_ROADMAP.md) · [Security gaps](../security/WORLDDIGITAL_SECURITY_ARCHITECTURE.md#gaps-proposed-fixes)
