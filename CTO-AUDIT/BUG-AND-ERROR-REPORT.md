# Bug and error report

## Checks actually run (2026-11-04)

| Check | Command | Result |
|---|---|---|
| Backend tests | `cd backend && uv run pytest -q` | **48 passed** (after today's fix; 45 before) |
| Backend lint | `ruff check app --select E,F,W,B,S` | 20 findings, none a runtime defect (details below) |
| Backend dependency audit | `pip-audit` on `uv export --no-dev` (85 packages) | **No known vulnerabilities** |
| Site worker tests | `cd workers/ai-site && npm test` | **20 passed** |
| Site worker build | `wrangler deploy --dry-run` | Builds: 664 KiB, 177 KiB gzip |
| Crawl-file worker tests | `node --test test/*.test.mjs` | **6 passed** |
| Root repo script | `npm run test:site` | **1 failure** (BUG-06) |
| Root npm audit | `npm audit` | 3 (2 moderate, 1 high): `undici` inside `wrangler`/`miniflare`, dev tooling only |
| .us build | `npx astro build` | 18 pages built |
| .us pre-publish check | `tools/check_site.py web/dist` | Passed: 18 pages, 15 sitemap URLs |
| .us report worker tests | `uv run pytest` | **44 passed** |
| .us unsubscribe tests | `uv run pytest` | **3 passed** |
| .us npm audit | `npm audit` | 9 (1 critical, 4 high, 3 moderate, 1 low), see SECURITY-AUDIT.md |
| Live SEO crawl | `site-audit.yml` run 41858241454 | 65 pages, 0 broken links; 2 duplicate titles (BUG-03) |
| Live Lighthouse | `lighthouse-ai.yml` on `b6f8fbf` | Mobile home Performance 69, Best Practices 79 (BUG-04) |
| Knowledge-base quality test | `rag-index.yml` (2026-11-04) | 21/23 passed, 0% made-up answers |

There's no TypeScript in either repo, so no type check applies. No PHP exists.

## Findings

### BUG-01 (CRITICAL, fixed today): billing reachable from the public tools proxy
- **Evidence:** before the fix, `GET https://worlddigital.ai/api/tools/%62illing/no-such-path-audit` returned the backend's
  `{"detail":"Not Found"}`, while `/api/tools/billing/...` returned the worker's `{"error":"Not found"}`. Reproduced locally:
  the backend served `GET /api/tools/%62illing` with billing data.
- **Root cause:** the worker blocked billing with a regex on the raw, still-encoded path. Uvicorn decodes `%62` to `b` before
  routing.
- **Fix:** see FIXES-IMPLEMENTED.md (commit `b6f8fbf`, deployed and re-verified).

### BUG-02 (HIGH): paid orders depend on the customer returning to the site
- **Evidence:** `backend/app/main.py` `paid_job()` / `order()`. The order is unlocked and the file emailed only when the
  browser loads `?order=cs_…`. There's no Stripe webhook anywhere in the code (`grep -ri webhook backend/app` finds none).
- **Root cause:** fulfilment is pull-based.
- **Impact:** a buyer who closes the tab after paying gets no email and no unlocked report until they contact support.
- **Fix:** add a `checkout.session.completed` webhook with Stripe signature verification that calls the same `paid_job()` +
  `deliver_email()`. Effort: about 1 day. Needs a webhook secret in Secret Manager (approval).

### BUG-03 (MEDIUM): Autopilot published near-duplicate posts
- **Evidence:** the live crawl flagged a duplicate title on `/blog/best-ai-seo-tools-for-2026-free-and-paid-picks` and
  `/blog/best-ai-seo-tools-for-2026-free-and-paid-options`.
- **Root cause:** `workers/ai-site/src/autopilot.js` line 91 skips an idea only if its keyword or slug matches exactly.
  Reworded titles pass.
- **Impact:** the two pages compete with each other in Google (keyword cannibalisation) and look like thin content.
- **Fix:** skip ideas whose title is very similar to an existing post (word overlap), and redirect one post to the other
  (content decision).

### BUG-04 (HIGH): mobile performance regression on the home page
- **Evidence:** Lighthouse mobile `/`: Performance 69, total blocking time 3,640 ms, LCP 1.8 s. A first-party script at
  `https://worlddigital.ai/5cex/` takes 2,313 ms of script time. Best Practices is 79 on every page because of a
  third-party cookie from `googleads.g.doubleclick.net` (Google Ads tag `AW-16853962405`). Earlier runs scored 100.
- **Root cause:** `/5cex/` isn't in either repo, so it's injected at Cloudflare (likely a Google tag gateway or Zaraz
  path; **UNVERIFIED**). The Google Ads tag loads on page load, unlike GTM, which `layout.js` defers until the first interaction.
- **Fix:** find the `/5cex/` source in the Cloudflare dashboard, and load the Ads/Analytics tags after interaction like GTM.

### BUG-05 (MEDIUM): production image is not built from the lock file
- **Evidence:** `backend/Dockerfile` runs `pip install "fastapi>=0.115" …` with version ranges. Tests run against `uv.lock`
  (`uv sync --frozen` in `deploy-backend.yml`).
- **Impact:** production can run different library versions than the ones tested, and a new release can break a deploy
  with no code change.
- **Fix:** `uv export --frozen --no-dev > requirements.txt` and `pip install -r requirements.txt` in the Dockerfile.

### BUG-06 (LOW): root `npm run test:site` fails
- **Evidence:** `# pass 15 # fail 1`. The script runs `node --test` without the text loader that `workers/ai-site/package.json` uses.
- **Fix:** make the root script call `npm test` in `workers/ai-site`.

### BUG-07 (MEDIUM): dormant plan sign-up route still live
- **Evidence:** `workers/ai-site/src/index.js` line ~251 still routes `POST /api/site/plan` to `formSubmit('plan')`, which calls
  backend billing to create a Mercury customer and invoice. Health shows `"mercury": true`.
- **Impact:** after the Stripe revert nothing links to it, but it still accepts submissions (behind Turnstile and per-IP limits).
- **Fix:** answer 410 on that route and remove the Mercury config (approval).

### BUG-08 (LOW): `/pricing` returns 404
- **Evidence:** live check: `/pricing` gives 404, `/ai-seo-pricing` gives 200.
- **Fix:** 301 `/pricing` to `/tools` (or `/ai-seo-pricing`).

### BUG-09 (LOW): sync history grows forever
- **Evidence:** `rag_sync` has no TTL index (only `_id`, `started`). Each run stores its URL list.
- **Fix:** TTL of 180 days on `finished`.

### BUG-10 (LOW): lint and deprecation items
- **Lint:** 6× `raise` without `from` inside `except` (B904), 3× `zip()` without `strict=`, 2× ambiguous variable `l`, 1 unused
  import (`report_title` in `main.py`), 3× silent `except: pass` in `rag.py` index creation.
- **Test warnings:** `starlette.testclient` deprecates `httpx`; `mongomock` uses `datetime.utcnow()`.
- **GitHub Actions:** Node 20 actions are deprecated, and `ubuntu-latest` moves to Ubuntu 26 (annotations on every run).

### Not found
- No memory leaks or race conditions observed in the code paths reviewed. Billing is protected by a DB ping before calls,
  and idempotency keys guard renewals and receipts (tested). Paid-order unlock is idempotent (`mark_emailed`).
- No broken internal links, routes or buttons on the crawled pages (67 internal links on .ai and .us, 0 broken).
- Forms were not submitted (that would send real emails and leads). Form validation was reviewed in code only.
