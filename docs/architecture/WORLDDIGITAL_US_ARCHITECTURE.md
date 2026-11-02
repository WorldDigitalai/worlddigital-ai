# WorldDigital.us Architecture (technical audit)

**Purpose.** A technical audit of worlddigital.us and the services its repository hosts for both sites.
**Scope.** Repository `WorldDigitalai/worlddigital-us` at commit `8098231` (2026-10-28) and the live site.
**Dependencies.** [Product Architecture](WORLDDIGITAL_PRODUCT_ARCHITECTURE.md), [Data Pipelines](../data-infrastructure/WORLDDIGITAL_DATA_PIPELINES.md).
**Status.** Everything in §1–§4 is EXISTING (verified in code). §5 is PROPOSED.

## 1. Frontend

| Item | Finding |
|---|---|
| Framework | Astro 5.18.2 + Tailwind CSS 4.3.3, static output; CSS inlined per page; fonts self-hosted |
| Hosting | Cloudflare Worker `worlddigitalus` serving `web/dist` as static assets (`404-page` handling) |
| Pages | 18 routes: `/`, `/about`, `/free-seo-report`, `/seo-ai-visibility`, `/sem-paid-media`, `/website-build-management`, `/ehr-emr-integration`, `/houston`, `/murfreesboro`, `/local-seo-checklist`, `/google-business-profile-checklist`, `/get-recommended-by-chatgpt`, `/social`, `/thank-you`, `/unsubscribe`, `/privacy`, `/terms`, `404` |
| Structured data | JSON-LD per page in `src/data/schema/` |
| Crawl files | `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, IndexNow keys in `public/` |
| Analytics | GA4 `G-PWBFJSFNR8`, Google Ads `AW-16853962405`, GTM `GTM-NLTRH4RJ`, loaded on first interaction; worlddigital.ai's GA4 is deliberately disabled here to stop double counting; internal-traffic opt-out with `?wd_internal=1` |
| Conversions | `book_call_click` (Calendar links), `generate_lead`, `form_submit`; **`purchase` ($199.99) fires on `/thank-you` from a client-side `sessionStorage` flag** |
| Payments | Stripe-hosted checkout and customer billing portal (links) |
| Contact | Google Calendar booking, WhatsApp click-to-chat, email |

## 2. Backend services hosted in this repo

| Service | Language | Bindings | Cron | Purpose |
|---|---|---|---|---|
| `worlddigital-report` | Python Worker (`src/entry.py`, logic in `report_core.py`, `followup.py`, `monitor.py`, `research.py`) | KV `REPORTS`; service `UNSUB`; secrets `DFS_LOGIN`, `DFS_PASSWORD`, `TURNSTILE_SECRET`, `RESEND_API_KEY` | every 15 min | Free report for **both** sites (DataForSEO + Lighthouse), daily cap 50, 24h follow-up email with idempotency, nightly monitor email at 10 pm Chicago, weekly AI-visibility run (5 prompts × ChatGPT, Perplexity, Gemini, Claude), key-protected `/research` endpoint (SHA-256 key, 12 calls/day) |
| `worlddigital-unsubscribe` | Python Worker | – | – | Unsubscribe from report emails (Resend) |
| `workers/legacy-js/` | JavaScript | – | – | Previous versions kept for rollback reference |

## 3. Tooling and data

| Path | What it does | Status |
|---|---|---|
| `tools/check_site.py` | Blocks deploy on broken links, invalid JSON-LD, missing meta, sitemap errors | EXISTING (in CI) |
| `tools/responsive_check.py` | 9 viewport sizes; blocks deploy; nightly on live site | EXISTING (in CI) |
| `tools/indexnow.py` | Pings search engines after deploy | EXISTING |
| `tools/bigquery/refresh_raw_tables.sql` | Rebuilds `seo_raw.gsc_daily`, `analytics_raw.ga4_landing_pages`, `ads_raw.google_ads_daily` for the last 35 days | IN PROGRESS: manual, last run 2026-10-27 |
| `tools/bigquery/ai_visibility_sql.py` | Generates SQL to load one AI-visibility JSON into `geo_raw` | IN PROGRESS: manual |
| `data/ai-visibility/*.json` | Weekly runs, committed by the `ai-visibility-snapshot` workflow | EXISTING (2 runs so far) |

## 4. CI/CD

| Workflow | Trigger | Does |
|---|---|---|
| `deploy-web.yml` | `web/**` on main | Build → `check_site.py` → `responsive_check.py` → `wrangler deploy` → IndexNow |
| `deploy-report.yml`, `deploy-unsubscribe.yml` | worker paths on main | pytest → `pywrangler deploy` |
| `nightly-responsive.yml` | 9:30 pm Chicago | Live responsive check; posts the result (GitHub OIDC-signed) to the report Worker |
| `lighthouse-audit.yml` | schedule | Lighthouse scores |
| `ai-visibility-snapshot.yml` | Tuesdays | Saves the AI-visibility run to `data/` |
| `anthropic-wif-test.yml` | every push | Tests exchanging a GitHub OIDC token for an Anthropic token (output redacted) |

## 5. Findings and recommendations

| # | Finding | Severity | Recommendation |
|---|---|---|---|
| US-1 | Purchase conversion is set client-side; anyone visiting `/thank-you` with the flag can fire a $199.99 purchase | High for data quality (ML labels, Ads bidding) | Record purchases from a Stripe webhook (`checkout.session.completed`, `invoice.paid`) and send them to GA4 Measurement Protocol, Google Ads offline conversions and BigQuery. PROPOSED |
| US-2 | BigQuery loaders are manual | Medium | Schedule them (see [Data Pipelines](../data-infrastructure/WORLDDIGITAL_DATA_PIPELINES.md)). PROPOSED |
| US-3 | The report Worker's admin endpoints are on a public workers.dev hostname, protected by a header key | Low | Fine for now; rotate the research key yearly; consider Cloudflare Access for admin paths. PROPOSED |
| US-4 | Leads (free-report emails) live only in KV and Resend | Medium | Mirror lead events (no raw email in analytics) into `worlddigital_core.leads` for funnel analytics. PROPOSED |
| US-5 | No staging Worker | Low | Use `wrangler versions upload` + preview URLs for risky changes. PROPOSED |

**Keep as is:** the static architecture, the CSS-inlining approach (PageSpeed 96–100), the pre-deploy safety gates and the nightly monitor. These are strengths.

## Related
[Master](../WORLDDIGITAL_MASTER_ARCHITECTURE.md) · [Monitoring](../reliability/WORLDDIGITAL_MONITORING_AND_OBSERVABILITY.md) · [Testing](../testing/WORLDDIGITAL_TESTING_STRATEGY.md)
