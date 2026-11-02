# WorldDigital Brand and Project Inventory

**Purpose.** Lists every name, domain, repository, cloud resource and identifier the WorldDigital ecosystem uses, flags conflicts, and recommends one official naming convention.
**Scope.** Both repositories (`WorldDigitalai/worlddigital-ai`, `WorldDigitalai/worlddigital-us`), the live sites, the Cloudflare account, the Google Cloud project and BigQuery.
**Dependencies.** None. Other documents link here for names.
**Status.** EXISTING (inventory as found on 2026-11-02). Every rename below is a **recommendation only**. Nothing was renamed.

## 1. Method

A case-insensitive search for `world[ _-.]digital` plus suffixes (`ai`, `us`, `corporation`, `llc`, service names) ran across both repositories. It excluded `.git`, `node_modules`, build output, lockfiles and binary files. The words "World" and "Digital" on their own are generic English and were **not** counted. Every unusual match was opened and read for context before it was classified.

## 2. Brand variations found

| Variation | Occurrences | Files | Context | Classification |
|---|---|---|---|---|
| `worlddigital.ai` | 1,258 | 194 | URLs, emails, routes | Domain (official) |
| `WorldDigital.ai` | 910 | 179 | Brand name in copy, titles, schema | **Official brand name** |
| `worlddigital.us` | 587 | 76 | URLs, routes | Domain (official) |
| `worlddigitalai` | 410 | 61 | Social handles, archived package names, email | Handle (official on social) |
| `WorldDigital.ai Corporation LLC` | 108 | 35 | Footer, legal pages, JSON-LD | **Official legal name** |
| `WorldDigital` | 51 | 41 | Short brand in archived UI and docs | Informal |
| `World Digital.ai` | 40 | 2 | Social Hub data (`social.json`), from platform display names | Inconsistent spacing; fix on the platforms |
| `WorldDigitalai` | 31 | 8 | GitHub organization name | Account identifier |
| `Worlddigitalai` | 31 | 5 | Archived email templates | Legacy |
| `worlddigital` | 22 | 14 | Scripts, workflow names | Technical prefix |
| `worlddigital-report`, `worlddigital-unsubscribe`, `worlddigital-ai-site`, `worlddigital-ai-crawl-files`, `worlddigital-ai-api` | 49 | – | Worker and Cloud Run service names | Production resources (**do not rename**) |
| `worlddigitalus` | 3 | 3 | Worker name for worlddigital.us (no hyphen) | Production resource; inconsistent pattern |
| `worlddigital_ai` | 5 | 5 | MongoDB database, BigQuery dataset | Data resource |
| `worlddigitalai-corporation-llc` | 7 | 7 | LinkedIn/BBB style slugs in JSON-LD | External profile slug |
| `WorldDigital AI` / `World Digital AI` / `WORLDDIGITAL.AI` | 11 | 5 | Archived app manifest, blog, prompts | Legacy |
| `WorldDigital.ai Corporation` | 1 | 1 | `home.html` copy | **Inconsistent**: missing "LLC" |
| `WorldDigital.us` | 6 | 1 | `llms-full.txt` | Domain written as a brand |
| `WorldDigitalBot`, `WorldDigitalSiteAudit`, `worlddigital-bot` | 3 | 3 | User agents, git bot name | Technical identifiers |
| `WorldDigitalReport` | 2 | 2 | Legacy JS Worker | Legacy |
| `worlddigitalai.com` | 1 | 1 | `hello@worlddigitalai.com` in the archived landing page | **Possible conflict**: a domain the company may not own |
| `worlddigitalai-llc-solutions` | 2 | 2 | A third-party profile URL (halo.science) seen in AI-visibility data | External listing, not controlled |
| `WorldDigitalAI` | 2 | 1 | Archived code; also the Hugging Face account name | Account identifier |

Not counted: "World Digital" inside AI-visibility prompts and answers. These are search phrases and answers, not company assets.

## 3. Domains and websites

| Domain | Role | Hosting | Status |
|---|---|---|---|
| worlddigital.ai | Company platform, tools, blog | Cloudflare Worker `worlddigital-ai-site` | EXISTING |
| www.worlddigital.ai | Treated as production host in code | Same | EXISTING |
| worlddigital.us | Founder site (Ahmad Awwad) and free report | Cloudflare Worker `worlddigitalus` | EXISTING |
| worlddigital-report.ahmad-awwad-7a0.workers.dev | Report API and monitor status | Cloudflare | EXISTING (public workers.dev address) |
| worlddigital-ai-api-250920469327.us-central1.run.app | Paid tools API | Cloud Run | EXISTING (public URL, token-protected) |
| worlddigitalai.com | Seen once in archived code | Unknown | NEEDS VERIFICATION |

## 4. Repositories and folders

| Repository | Visibility | Contains | Last push |
|---|---|---|---|
| `WorldDigitalai/worlddigital-ai` | Private | `workers/ai-site`, `workers/ai-crawl-files`, `backend/` (Cloud Run API), `tools/`, `archive/nextjs-app/`, `docs/` | 2026-10-29 |
| `WorldDigitalai/worlddigital-us` | Private | `web/` (Astro), `workers/report`, `workers/unsubscribe`, `workers/legacy-js`, `tools/` incl. `tools/bigquery`, `data/ai-visibility` | 2026-10-29 |

**Local folder `WorldDigital/` (with `WORLDDIGITAL_MASTER/`, `World/`, `Digital/`, `WorldDigitalAI/`, …):** not found on the linked laptop. The home, Documents and Downloads folders contained no such directory. If it exists on another drive or in OneDrive, see the open questions in [README](README.md#open-questions-that-need-your-input).

## 5. Cloud and account identifiers

| Resource | Identifier | Status |
|---|---|---|
| Cloudflare account | `7a05f2ae447b2e57f5c902dc6f593d22` | EXISTING |
| Google Cloud project | `cs-poc-0zqkvyxapah85tnxz2byzqa` (number `250920469327`) | EXISTING |
| Cloud Run service | `worlddigital-ai-api`, us-central1 | EXISTING |
| Deploy service account | `github-deploy@…` | EXISTING |
| Workload Identity pool / provider | `github` / `github` | EXISTING |
| Workers KV | `REPORTS` (`7106b01b…`) | EXISTING |
| Durable Object | `Store` (SQLite), id name `site` | EXISTING |
| MongoDB Atlas database | `worlddigital_ai` | EXISTING (cluster name NEEDS VERIFICATION) |
| GA4 properties | worlddigital.ai `G-C6V00GEZP6` (BQ `analytics_474505729`); worlddigital.us `G-PWBFJSFNR8` (BQ `analytics_557240757`) | EXISTING |
| Google Ads | tag `AW-16853962405`; account `442-763-5466` (transfer config `6b177602-…`) | EXISTING |
| Google Tag Manager | `GTM-NLTRH4RJ` | EXISTING |
| Resend segment | `0eb3f7cf-…` | EXISTING |
| Turnstile site key | `0x4AAAAAAFRt-…` | EXISTING (public by design) |
| Anthropic workload identity | federation rule, organization, service account and workspace ids in `anthropic-wif-test.yml` | EXISTING (test workflow) |
| Social handles | `worlddigitalai` on Facebook, Instagram, LinkedIn, X, YouTube, TikTok, Snapchat | EXISTING |

## 6. BigQuery datasets

| Dataset | Contents | Rows | Status |
|---|---|---|---|
| `searchconsole_worlddigitalai` | Search Console bulk export, worlddigital.ai | ~22k | EXISTING, daily |
| `searchconsole_worlddigitalus` | Search Console bulk export, worlddigital.us (domain property) | ~4.6k | EXISTING, daily |
| `searchconsole_worlddigitalus_prefix` | **Same data again** (URL-prefix property) | ~4.6k | Duplicate; see §8 |
| `analytics_474505729`, `analytics_557240757` | GA4 event exports | 42.8k / 2.8k events | EXISTING, daily |
| `ads_raw` | Google Ads Data Transfer (≈110 tables + views) + `google_ads_daily` | small | EXISTING, daily |
| `seo_raw`, `analytics_raw`, `geo_raw` | Normalized tables loaded by `refresh_raw_tables.sql` and `ai_visibility_sql.py` | 6,001 / 331 / 233 | IN PROGRESS (manual, last 2026-10-27) |
| `marketing_marts` | 11 mart tables; only `ai_prompt_universe` (8,136) and `keyword_universe` (118) have rows | – | IN PROGRESS (stale since 2026-08-27) |
| `social_raw` | `social_daily` | 0 | IN PROGRESS (empty) |
| `worlddigital_core` | 14 tenant-scoped tables (`tenants`, `users`, `businesses`, `campaigns`, …) | 0 | IN PROGRESS (schema only) |
| `worlddigital_ai` | `ai_recommendations`, `ai_actions`, `ai_decisions`, `ai_reports` | 0 | IN PROGRESS (schema only) |
| `worlddigital_analytics` | 7 views (`roas_metrics`, `marketing_funnel`, …) | – | IN PROGRESS |
| `worlddigital_audit` | `data_sync_events` | 0 | IN PROGRESS |
| `worlddigital_raw` | `raw_google_ads` (with `pubsub_message_id`) | 0 | IN PROGRESS |
| `worlddigital_staging` | no tables | – | IN PROGRESS (empty) |

## 7. Existing documentation and APIs

| Item | Location | Note |
|---|---|---|
| Repo READMEs | both repos | Accurate and current; the best existing architecture docs |
| Keyword map | `worlddigital-ai/docs/worlddigital-ai-keywords.md` and `worlddigital-us/docs/worlddigital-ai-keywords.md` | **Two diverged copies** of the same document |
| `fetch_social.py` | both repos' `tools/` | **Two diverged copies** |
| SEO launch checklist | `archive/nextjs-app/docs/SEO-LAUNCH.md` | Legacy (Replit era) |
| Public APIs | See [API Architecture](integrations/WORLDDIGITAL_API_ARCHITECTURE.md) | |

## 8. Duplicates and naming conflicts

| # | Issue | Risk | Recommendation (needs approval) |
|---|---|---|---|
| N-1 | Both domains present the brand "WorldDigital.ai"; worlddigital.us is also "Ahmad Awwad's site" | Search engines and AI answers may merge or confuse the two | Keep "WorldDigital.ai" as the company brand on both. Brand worlddigital.us explicitly as "Ahmad Awwad · WorldDigital.ai" |
| N-2 | Legal name appears as "WorldDigital.ai Corporation LLC" and once as "WorldDigital.ai Corporation" | Inconsistent entity data in schema and AI answers | Use the full legal name everywhere; fix the one copy in `home.html` |
| N-3 | "World Digital.ai" display name on some social platforms | Entity mismatch | Change the display names on the platforms |
| N-4 | `hello@worlddigitalai.com` in archived code | Mail to a domain you may not own | Confirm ownership. If you don't own it, never reuse that address |
| N-5 | Worker `worlddigitalus` vs `worlddigital-*` pattern | Cosmetic | Leave as is. Renaming a Worker changes its deployment identity |
| N-6 | Duplicate Search Console exports for worlddigital.us | Double storage; risk of double counting | Pick one property (domain) for analytics; stop or ignore the prefix export |
| N-7 | Duplicated keyword map and `fetch_social.py` | Drift | Keep the copy in the repo that owns the page; reference it from the other |
| N-8 | Google Cloud project named `cs-poc-…` hosts production | Confusing; a POC project may lack production guardrails | See AD-9 in the [master](WORLDDIGITAL_MASTER_ARCHITECTURE.md#15-architectural-decisions-log) |
| N-9 | GitHub org `WorldDigitalai` vs Hugging Face `WorldDigitalAI` | Cosmetic | Leave as is |

## 9. Recommended official naming conventions

| Thing | Convention | Example |
|---|---|---|
| Brand in copy | `WorldDigital.ai` | "WorldDigital.ai helps…" |
| Legal entity | `WorldDigital.ai Corporation LLC` | footer, contracts, schema `legalName` |
| Founder site label | `Ahmad Awwad · WorldDigital.ai` | worlddigital.us titles |
| New Cloudflare Workers | `wd-<product>-<role>` | `wd-intel-api` |
| New GCP projects | `worlddigital-<env>` (+ `-data`, `-phi` when needed) | `worlddigital-prod`, `worlddigital-dev` |
| New Cloud Run services | `wd-<domain>-<role>` | `wd-connector-google-ads` |
| BigQuery datasets | `<layer>_<domain>`: `raw_`, `stg_`, `core_`, `mart_`, `ml_` | `ml_forecasts` |
| BigQuery tables | `snake_case`, singular entity or `daily_<metric>` | `daily_campaign_metrics` |
| Docs | `WORLDDIGITAL_<TOPIC>.md` | this file |

The existing datasets (`seo_raw`, `worlddigital_core`, …) keep their names. The convention applies to new resources only.

## Related documents
[Master Architecture](WORLDDIGITAL_MASTER_ARCHITECTURE.md) · [Data Architecture](data-infrastructure/WORLDDIGITAL_DATA_ARCHITECTURE.md) · [Google Cloud Architecture](google-cloud/WORLDDIGITAL_GOOGLE_CLOUD_ARCHITECTURE.md)
