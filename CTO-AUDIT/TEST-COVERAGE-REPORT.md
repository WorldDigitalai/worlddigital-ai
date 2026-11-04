# Test coverage report

## Suites (all run on 2026-11-04)

| Suite | Location | Tests | Result | Runs in CI before deploy |
|---|---|---|---|---|
| Backend API | `worlddigital-ai/backend/tests` (`test_api`, `test_billing`, `test_rag`, …) | 48 | ✅ 48 passed | ✅ `deploy-backend.yml` (also on pull requests) |
| Site worker | `worlddigital-ai/workers/ai-site/test` (ai-panel, buffer, md, tools, kb) | 20 | ✅ 20 passed | ✅ `deploy-ai-site.yml` |
| Crawl-file worker | `workers/ai-crawl-files/test` | 6 | ✅ 6 passed | ✅ |
| Report worker (.us) | `worlddigital-us/workers/report/tests` | 44 | ✅ 44 passed | ✅ `deploy-report.yml` |
| Unsubscribe worker (.us) | `workers/unsubscribe/tests` | 3 | ✅ 3 passed | ✅ |
| .us pre-publish check | `tools/check_site.py` (links, anchors, images, structured data, titles, sitemap) | 18 pages | ✅ passed | ✅ blocks deploy |
| .us responsive check | `tools/responsive_check.py`, 9 screen sizes | per page | Not run today (needs the live site); nightly run of 2026-11-03 succeeded | ✅ blocks deploy + nightly |
| Live SEO crawl | `tools/site_audit.py`, `seo_deep_audit.py` | 65 pages | ✅ 0 broken links; 2 duplicate titles | Weekly |
| Lighthouse | `lighthouse-ai.yml`, `.us lighthouse-audit.yml` | main pages | ⚠️ .ai mobile regression (PERF-01) | Push + schedule |
| Knowledge-base quality | `rag_eval.json` via `rag-index.yml` | 23 questions | ✅ 21/23, fails the job below 75% | Nightly |

Total automated tests run today: **121 unit/integration tests passing**, plus the build, link, SEO and quality checks above.

## What's covered well

- **Payments:** preview, checkout session creation, paid-order unlock and email-once logic (`test_api.py`, Stripe mocked).
- **Billing:** plan signup, one-off invoice, renewals, receipts, idempotency, cancel. Server-only header added today.
- **Knowledge base:** sync, pruning, batching, model change, retries, wrong vector size, metadata, noindex, canonical and
  robots exclusion, tenant isolation, private-knowledge isolation, prompt injection, public API limits, quality metrics.
- **Authorization:** token required on every internal endpoint; billing unreachable via the public proxy (all bypass variants).
- **Security helpers:** escaping on admin pages; contact-detail redaction; SSRF-safe customer fetching (mocked).

## Gaps

| Gap | Risk | Recommendation |
|---|---|---|
| No end-to-end browser test of the money path (preview → Stripe test checkout → order page → download) | A front-end break in the widget wouldn't be caught | One Playwright test against `wrangler dev` + the backend dev server (`tests/dev_server.py` already exists) with Stripe test mode |
| Admin routes (sign-in, CSRF rejection, save/publish) have no worker tests | Regressions in auth flow | Unit tests calling `handleAdmin` with a fake store |
| Public forms (`/api/site/contact`, honeypot, Turnstile fail) untested | – | Unit tests with a fake `REPORT` binding |
| No load test | Unknown limits of 3 Cloud Run instances / M0 | A short k6 or Locust run against a staging revision (PR #3 tags revisions) |
| No security scanning in CI | Dependency advisories found only by manual audit | `pip-audit` + `npm audit --omit=dev` steps (fast, free) |
| Root `npm run test:site` broken (BUG-06) | Confusing for contributors | Point it at `npm test` |
| Durable Object store logic (`store.js`, 328 lines) mostly untested | Data bugs in posts, leads or sessions | Tests with Miniflare's DO support |
