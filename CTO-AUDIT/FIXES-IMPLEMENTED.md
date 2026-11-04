# Fixes implemented

Only changes that were implemented, tested and verified are listed. Everything else is a proposal in
REMEDIATION-ROADMAP.md.

## 1. SEC-01 / BUG-01: billing reachable from the public tools proxy (CRITICAL)

- **Approval:** given in chat on 2026-11-04 ("Deploy fix now").
- **Commit:** `b6f8fbf` on `main` (also on branch `cto-audit`), rebased onto the other session's blog-video commits
  `741af1d` / `2852935` without touching them.

### Original implementation (recorded before the change)

`workers/ai-site/src/tools-proxy.js`:

```js
if (/^\/api\/tools\/billing/i.test(url.pathname)) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: JSON_HEADERS });
```

Backend billing routes used only `dependencies=[Depends(guard)]`.

### Change

1. **Proxy** (`tools-proxy.js`):
   - Any `/api/tools/*` path containing `%` is refused with 400. No tool route uses encoded characters.
   - The billing block also matches repeated slashes (`/^\/api\/tools\/+billing/i`).
2. **Server-side calls** (`backend()` in `tools-proxy.js`) now send `x-wd-server: 1`. The public proxy builds its own
   headers and never forwards that one.
3. **Backend** (`backend/app/main.py`): a new `server_only` dependency on all 6 billing routes requires `x-wd-server: 1`.
   Without it they return 403.
4. **Workflows:** `billing-admin.yml` and `billing-daily.yml` send the header.
5. **Tests:**
   - `test_billing_needs_server_header`: 403 without the header, including the encoded path.
   - Worker test: `/api/tools/%62illing`, `/%62illing/invoice`, `/billing`, `//billing/run`, `/BILLING` and `/bill%69ng`
     are all refused and never forwarded, while `/api/tools/health` is forwarded.

### Verification

| Check | Before | After |
|---|---|---|
| Backend tests | 45 passed | **48 passed** |
| Worker tests | 18 passed | **20 passed** |
| `GET /api/tools/%62illing/no-such-path-audit` (live) | 404 `{"detail":"Not Found"}` **from the backend** | 400 `{"error":"Bad request"}` from the worker |
| `GET /api/tools/bill%69ng` (live) | – | 400 |
| `GET /api/tools//billing`, `/api/tools/billing` (live) | 404 worker | 404 worker |
| `GET /api/tools/health` (live) | 200 | 200 (tools unaffected) |
| Deploys | – | `Deploy tools API` ✅, `Deploy worlddigital.ai site` ✅ |

### Rollback

`git revert b6f8fbf` and push. Both deploy workflows redeploy the previous behaviour.

## 2. Batch of 2026-11-04 (approved in chat: "fix all those", Mercury billing removed completely)

Before/after test results: backend 41 → **44**, site worker 20 → **23**, crawl-file 6, root `test:site` failing → **23 pass**,
.us report worker 44 → **45**, unsubscribe 3. Live verification is in section 3.

| Finding | What changed | Files | Test |
|---|---|---|---|
| SEC-03, BUG-07 (Mercury) | Mercury billing removed completely: admin billing page and routes, backend billing endpoints and module, Mercury settings, `MERCURY_*` deploy variables, the billing workflows and the static-IP diagnostic workflows. `/api/site/plan` answers 410. Stripe tool purchases and the SEO plan link are unchanged. The billing collections in MongoDB (1 customer, 1 invoice) are kept, not deleted | `admin.js`, `index.js`, `main.py`, `config.py`, `billing.py` (deleted), `deploy-backend.yml`, 4 workflows deleted | Billing tests removed with the module; proxy still refuses every billing path (test kept) |
| BUG-05 | Production image installs exactly the tested versions (`requirements.lock` from `uv.lock`); CI fails if the lock export is stale | `Dockerfile`, `requirements.lock`, `deploy-backend.yml` | Clean-venv install + app import |
| BUG-06 | Root `npm run test:site` runs the real test command | `package.json` | 23 pass |
| BUG-08 | `/pricing` → 301 `/tools` | `pages.js` | Live check |
| BUG-09 | 180-day TTL on `rag_sync` | `rag.py` | – |
| SEC-08 | Public health shows only `{ok, database}`; details only with the token and not through the public proxy; deploy health check sends the token and fails on a token or MongoDB problem | `main.py`, `tools-proxy.js`, `deploy-backend.yml` | `test_health_hides_configuration_from_the_public` |
| SEC-09 | Baseline CSP and Permissions-Policy on every page without its own policy | `index.js` | Live headers |
| SEC-10 | `anthropic-wif-test.yml` manual only, both repos | 2 workflows | – |
| UX-01 | "Sign in" link removed from the menu (portal pages stay for old bookmarks) | `layout.js` | – |
| AI-01, AI-02 | Every OpenAI call (chat, previews, blog, images, speech, embeddings) records feature, model, input and output tokens per day; calls on a model other than the configured one are counted as fallbacks and shown in red. New "AI usage" table on `/blog-admin/kb` | `services.py`, `main.py`, `rag.py`, `blog_ai.py`, `blog_video.py`, `admin.js` | `test_ai_usage_is_counted_per_feature_and_fallbacks_flagged` |
| BUG-03, SEO-01 | Autopilot skips ideas and drafts whose title overlaps an existing post by 75% or more. The newer duplicate ("…free-and-paid-picks") became an archived draft (kept, editable) and its address 301-redirects to the older "…free-and-paid-options" post (verified live) | `autopilot.js`, `store.js` | Similarity test |
| SEC-05 | Tool previews require the Turnstile human check (widget renders it; the site verifies it through the existing report-worker binding before forwarding) | `tools-src/*`, `tools-widget.js`, `tools-proxy.js` | Preview human-check test |
| BUG-02 | Signed Stripe webhook at `https://worlddigital.ai/api/stripe/webhook`: verifies the signature (5-minute window), re-checks the payment with Stripe, unlocks and emails once (shared guard with the order page). **Off until `STRIPE_WEBHOOK_SECRET` is set** (owner step) | `main.py`, `config.py`, `tools-proxy.js`, `index.js` | Webhook test: signature, age, idempotency, ignored events |
| AI-04 | Plain summary of what the products do on `/tools`, and the platforms list on `/services` | `pages.js`, `services.html` | Nightly quality test |
| DB-01, DB-04 | Nightly encrypted backup (`backup.yml`): MongoDB data that can't be rebuilt, plus blog posts, redirects, media, leads and settings (never sign-in tokens, sessions or the signing key), encrypted with AES-256 and kept 30 days as private artifacts. Restore: `tools/restore_backup.py` and `POST /api/site/backup` (adds missing rows only) | `backup.py`, `main.py`, `store.js`, `index.js`, `backup.yml`, `tools/restore_backup.py` | `test_backup_round_trip` (dates survive, embeddings excluded, private documents kept, restoring twice is harmless); encrypt/decrypt round trip |
| CLD-05 | The 10 pm nightly email now also checks every worlddigital.ai sitemap page, robots.txt, llms.txt, the tools API health through the site, and that billing paths stay refused | `.us workers/report/src/{entry,monitor}.py` | `test_worlddigital_ai_checks` |
| SEC-11 | Manual "Security log search" workflow reads the Cloud Run request logs for billing requests (time, status, path only) | `log-search.yml` | Run after deploy (section 3) |
| SEC-07 | .us on Astro 7.4.5 (critical/high advisories gone; `npm audit`: 0). CSS kept compatible with Safari 14+ (`cssTarget`). Workflows on Node 24 | `.us web/package*.json`, `astro.config.mjs`, workflows | Built HTML identical on all 18 pages (`compare_builds.py`), pre-publish check passed, responsive check 0 problems on 9 sizes |
| CLD-10 | Actions moved to Node 24 versions (checkout v5, setup-node v5, setup-python v6, upload-artifact v5, setup-uv v7, Google auth / deploy-cloudrun / setup-gcloud v3), both repos | all workflows | CI runs (section 3) |
| BUG-10 | Lint: unused import, `raise … from`, ambiguous names | `main.py`, `rag.py` | `ruff`: all checks passed (E, F, W, B) |
| SEO-03 | **No change needed.** The image is the decorative logo inside an `aria-hidden` block with `alt=""`, which is correct. The audit check counted empty alt as missing (false positive) | – | – |

## 3. Live verification (2026-11-04, after deploy `bd0f52e` / .us `a4e1770`)

| Check | Result |
|---|---|
| Deploys | Tools API ✅, site ✅, .us website ✅, report API ✅, unsubscribe ✅. Crawl-file worker: code uploaded, **route sync refused** by the Cloudflare token (`/zones/…/workers/routes`: "No access"). It also failed on 2026-10-20; existing routes still serve (robots, llms and sitemap all 200) |
| `GET /api/tools/health` (public) | `{"ok": true, "database": true}` only |
| `/api/tools/%62illing` / `/api/tools/billing` | 400 / 404 |
| `POST /api/site/plan` | 410 |
| `/pricing` | 301 → `/tools` |
| Tool preview without the human check | 403 "Please complete the quick human check"; Turnstile present in the tool form |
| `/api/stripe/webhook` | No signature 400; signed but secret not set yet 503 (off, as intended) |
| `/api/site/backup` without token | 403 |
| CSP / Permissions-Policy on pages | Present |
| "Sign in" in menu | Gone |
| Duplicate post | `…free-and-paid-picks` 301 → `…free-and-paid-options` (the older one); only the kept post is in the sitemap |
| `/tools` and `/services` summaries | Live |
| Backup workflow, first run | ✅ 12 posts, 1 redirect, 4 leads, 3 media files; MongoDB: 17 tool jobs, 2 free-used, 1 audit, 1 billing customer, 1 invoice, 49 RAG pages, 4 meta, 3 questions, 1 sync run. Encrypted artifact, 30 days |
| Knowledge-base quality test | **22/23 (96%)**, up from 21: right page found 100% (MRR 0.90), cited 95%, answers correct 100%, made-up answers 0%, avg 1.6 s |
| Log search workflow | Ran, but the deploy account has **no permission to read logs**, so SEC-11 stays an owner step (Logs Explorer query below) |
| Note | The nightly knowledge-base run (09:37 UTC) did not start on 2026-11-04 (GitHub occasionally skips scheduled runs); all runs that day were manual |

Logs Explorer query for SEC-11 (Google Cloud console → Logging → Logs Explorer, last 30 days):

```
resource.type="cloud_run_revision"
resource.labels.service_name="worlddigital-ai-api"
(httpRequest.requestUrl:"illing" OR httpRequest.requestUrl:"%62" OR httpRequest.requestUrl:"%69")
```

## Not changed (needs the owner)

| Item | Why it needs you |
|---|---|
| SEC-02 least-privilege DB user | Creating a database user and its password is a credential change. Steps in CTO-RECOMMENDATIONS.md |
| Revoke the Mercury token | In Mercury: Settings → API tokens |
| CLD-01, SEC-04, CLD-08 | Run `tools/gcp/phase1-hardening.sh` from PR #3 in Cloud Shell, then merge PR #3 |
| Cloudflare token | Give the CI token "Zone → Workers Routes: Edit" on worlddigital.ai so the crawl-file deploy can sync its routes |
| PERF-01 mobile speed | The slow `/5cex/` script and the Google Ads tag are set in Cloudflare / Google Tag Manager, not in code |
| BUG-02 switch-on | Create the webhook in Stripe and store its signing secret (steps in the chat reply) |
| CLD-04, CLD-09 | Check the GCP project's billing account; check that the old NAT, router and static IP are deleted |
| SEC-06 | Branch protection needs GitHub Team (paid) |
| DB-06 | Whether paid orders should stay longer than 1 year |

No production credentials, cloud settings or customer data were changed. The billing records in MongoDB were kept.
