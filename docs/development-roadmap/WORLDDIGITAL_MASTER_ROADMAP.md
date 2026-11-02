# WorldDigital Master Roadmap

**Purpose.** A phased plan from today's stack to the Intelligence Engine. Each phase has an entry gate, so nothing is built before the data or the customers exist to justify it.
**Scope.** Six phases from the project brief.
**Dependencies.** [Backlog](WORLDDIGITAL_IMPLEMENTATION_BACKLOG.md) (task detail), [Cost Analysis](../financial-planning/WORLDDIGITAL_COST_ANALYSIS.md) (cost detail), [Testing](../testing/WORLDDIGITAL_TESTING_STRATEGY.md).
**Status.** Phase 1 IN PROGRESS (this documentation is its first deliverable). Phases 2–6 PROPOSED.

Effort is in engineer-weeks (ew) for one experienced full-stack/data engineer working with AI assistance. Running costs are incremental monthly estimates; see [Cost Analysis](../financial-planning/WORLDDIGITAL_COST_ANALYSIS.md).

## Phase 1: Assessment and foundation (now → +4 weeks)
| | |
|---|---|
| Goal | A documented, safe foundation before any customer data |
| Tasks | This audit and diagrams ✔ · billing budgets · move 2 env-var secrets to Secret Manager · split deploy and read-only service accounts · create `worlddigital-dev` / `worlddigital-prod` projects (plan the move) · server-side Stripe conversions · MFA audit · Cloudflare Access on admin endpoints |
| Dependencies | Founder approval for the new projects and IAM changes |
| Complexity | Low–medium · **3–4 ew** |
| Infrastructure | Secret Manager, IAM, Billing; no new paid services |
| Running cost | ≈ $0 |
| Deliverables | `docs/` merged; security backlog items S-1, S-2, S-4, S-5 closed; budgets live |
| Testing | Deploys still pass; purchase events reconcile with Stripe for 2 weeks |

## Phase 2: Data intelligence (+1 → +3 months)
| | |
|---|---|
| Entry gate | Phase 1 security items done |
| Goal | Automated, tested, tenant-ready data, starting with WorldDigital as tenant 0 |
| Tasks | Dataform repo · schedule `refresh_raw_tables` logic · direct AI-visibility load · staging + core models with `tenant_id` · populate `marketing_marts` · freshness alerts in the 10 pm email · server-side tool and lead events → BigQuery · Terraform for GCP resources |
| Complexity | Medium · **6–8 ew** |
| Infrastructure | Dataform, Cloud Scheduler, Cloud Run jobs, (Pub/Sub when connectors start) |
| Running cost | ≈ $5–25/mo |
| Deliverables | Marts refresh daily; an SEO + AI-visibility dashboard for WorldDigital's own sites; data tests green for 30 days |
| Testing | Dataform assertions; row-count reconciliation vs the Search Console UI |

## Phase 3: Machine learning (+3 → +6 months)
| | |
|---|---|
| Entry gate | ≥ 90 days of clean daily series for tenant 0; conversion labels recorded server-side |
| Goal | First useful predictions, baselines first |
| Tasks | Baselines for all models · `ARIMA_PLUS` forecasts (clicks, sessions, leads) · rule-based inefficient-spend and SEO-opportunity recommenders writing to `ai_recommendations` · keyword-opportunity score · model cards + registry table · drift SQL |
| Complexity | Medium · **6–10 ew** |
| Infrastructure | BigQuery ML only |
| Running cost | ≈ $0–20/mo at current data volume |
| Deliverables | Weekly forecast with intervals; ≥ 3 recommendation types live for tenant 0; backtest report showing forecast vs baseline |
| Testing | Backtests (≥ 3 folds), recommendation unit tests, golden datasets |
| Note | Lead scoring, churn, CLV and conversion models **wait** for their data gates ([Model Development](../machine-learning/WORLDDIGITAL_ML_MODEL_DEVELOPMENT.md)) |

## Phase 4: Deep learning (+6 → +12 months, selective)
| | |
|---|---|
| Entry gate | A specific task where pretrained models clearly add value (an evaluation exists) |
| Goal | Use pretrained transformers and vision where they help |
| Tasks | LLM gateway + evaluation harness · query intent and topic clustering · AI-answer extraction · embeddings + `pgvector` RAG · creative description (Vision + multimodal LLM) · benchmark a neural forecaster against `ARIMA_PLUS` |
| Complexity | Medium–high · **8–12 ew** |
| Infrastructure | LLM APIs, Vision API, Cloud SQL `pgvector`, Vertex custom training jobs (on demand) |
| Running cost | ≈ $50–300/mo (mostly LLM and API usage, scales with tenants) |
| Deliverables | Intent/topic labels in GSC marts; RAG answers with citations; creative attribute tables |
| Testing | Labeled evaluation sets (≥ 200 items/task); cost per call tracked |

## Phase 5: Intelligence Engine (+4 → +12 months; can overlap with 3–4)
| | |
|---|---|
| Entry gate | Founder decision to rebuild the customer portal; ≥ 3 design-partner customers willing to connect accounts |
| Goal | Customers see their own intelligence |
| Tasks | Cloud SQL tenancy + RLS · customer sign-in + RBAC · Intelligence API v1 · Google Ads + Meta read connectors · dashboards on worlddigital.ai · per-tenant forecasts and recommendations · isolation test suite · deletion workflow |
| Complexity | High · **14–20 ew** |
| Infrastructure | Cloud SQL (HA when paying), Pub/Sub, Scheduler, Cloud Run |
| Running cost | ≈ $60–250/mo base + per-tenant usage |
| Deliverables | 3 design partners onboarded; zero cross-tenant leaks in tests; weekly recommendations delivered |
| Testing | Isolation tests, connector contract tests, load test of 100 tenants |

## Phase 6: Advanced AI automation (+12 months →)
| | |
|---|---|
| Entry gate | ≥ 6 months of recommendation outcome data; acceptance rate ≥ 30%; platform mutate-scope approvals; legal review of terms |
| Goal | Controlled, approved execution and learning loops |
| Tasks | Executor with policy limits, dry-run diffs, revert · monitoring agents · learned ranking of recommendations · pooled benchmarks (consent-based) · supervised models whose gates have been met |
| Complexity | High · **12–20 ew** |
| Infrastructure | Vertex AI Training + Registry as models justify |
| Running cost | Scales with tenants |
| Deliverables | Approved actions executed with audit; measured uplift vs control |
| Testing | Simulation against historical data; canary tenants; kill-switch drills |

## 5–10 year view
Once outcome data across many consenting tenants exists, the defensible assets are: (1) a cross-channel, outcome-labeled dataset of marketing actions → results for SMBs, (2) AI-search visibility history across assistants, and (3) trusted automation workflows. Fine-tuned domain models (intent, recommendation ranking, creative scoring) become reasonable at that point. A foundation model never becomes the goal.

## Related
[Master](../WORLDDIGITAL_MASTER_ARCHITECTURE.md) · [Backlog](WORLDDIGITAL_IMPLEMENTATION_BACKLOG.md)
