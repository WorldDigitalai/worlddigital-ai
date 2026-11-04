# CTO recommendations

## Final assessment (scores out of 100; judgement based on the evidence in these reports)

| Area | Score | Why |
|---|---|---|
| 1. Overall technical maturity | **62** | Clean, well-tested code for a small team; weak operations (backups, alerting, change control) |
| 2. Production readiness | **70** | The marketing sites, tools and payments run reliably with tests gating every deploy. Missing: Stripe webhook, backups, rollback |
| 3. Security readiness | **62** | Strong code-level controls. One critical config-level hole was found and closed. DB privileges, plaintext secrets and an unused payment vendor remain |
| 4. Scalability | **60** | The architecture scales (Workers, Cloud Run, Atlas). Current limits are the free M0 tier and 3 Cloud Run instances, both one setting away |
| 5. Infrastructure reliability | **50** | Single region, no backups, no backend alerting, deploy-on-push without rollback |
| 6. AI architecture quality | **80** | Grounded, cited, injection-tested, isolated RAG with nightly quality metrics. Cost tracking missing |
| 7. Database reliability | **40** | No backups; admin-level app user; free tier |
| 8. Customer experience | **58** | Fast sites, useful free tools, good support paths. No accounts; Sign in dead end; mobile speed regression |
| 9. Enterprise readiness | **25** | Gaps in logging, DR, incident response and access reviews. No certifications (none claimed) |
| 10. Financial efficiency | **85** | Near-zero hosting cost, scale-to-zero, free DB tier, no redundant services. AI spend unmeasured |

## Five biggest technical risks

1. **Data loss:** no database backups (DB-01) and no Durable Object export (DB-04).
2. **Credential blast radius:** the app runs as `atlasAdmin` with internet-wide network access (SEC-02).
3. **Unsafe deploys:** every push to `main` goes live with no staging and no automatic rollback (CLD-01, SEC-06).
4. **Lost paid orders:** fulfilment depends on the browser returning (BUG-02).
5. **Unwatched outages and spend:** no backend alerting (CLD-05) and no AI token tracking (AI-02).

## Five highest-value improvements

1. Nightly encrypted backups with a tested restore.
2. Finish PR #3: safe deploy with auto-rollback, secrets in Secret Manager, a budget, least-privilege deploy.
3. Least-privilege DB user, and remove Mercury entirely.
4. Stripe webhook for guaranteed delivery.
5. Restore mobile speed by deferring the ad tag (69 → 95+), which directly helps conversion.

## Fix immediately

- ✅ SEC-01 (done today). Check logs for earlier use (SEC-11).
- Backups, least-privilege DB user, Mercury removal, PR #3.

## Improve later

Stripe webhook, token tracking, alerting, CSP, Astro upgrade, admin and end-to-end tests, the Atlas tier before customer
knowledge bases, and the customer portal in the existing stack.

## Do not change

- **Cloudflare Workers** for both sites: fast (LCP 0.4 s on .us), cheap, SEO-clean.
- **Cloud Run + FastAPI** for the tools API: tested, scale-to-zero, keyless deploys.
- **MongoDB Atlas with built-in Vector Search:** no separate vector database needed at any planned scale.
- **The knowledge base design:** sources, isolation, quality test.
- **GitHub Actions** as the scheduler.
- **The admin magic-link sign-in.**

Don't rebuild the archived Next.js app. Build the portal incrementally on what exists.

## Safe, reversible fixes I can make next (each tested, on a branch, deployed only with your approval)

| # | Fix | Finding |
|---|---|---|
| 1 | Build the backend image from the lock file | BUG-05 |
| 2 | Root `test:site` script | BUG-06 |
| 3 | `/pricing` → `/tools` redirect | BUG-08 |
| 4 | TTL on `rag_sync` | BUG-09 |
| 5 | Trim the public health output (keeping what the deploy check needs) | SEC-08 |
| 6 | `anthropic-wif-test.yml` manual-only (both repos) | SEC-10 |
| 7 | Same-tier model fallback + fallback metric | AI-01 |
| 8 | Autopilot similarity guard | BUG-03 |
| 9 | Turnstile check on tool previews via the existing binding | SEC-05 |
| 10 | Add worlddigital.ai and the API to the nightly monitor email | CLD-05 |
| 11 | Token usage tracking per feature on the admin page | AI-02 |
| 12 | Alt text on the .us home image | SEO-03 |

## Needs your approval or action (credentials, billing, cloud, product)

| Item | What's needed |
|---|---|
| SEC-11 | Search Cloud Run logs (console) |
| DB-01 / DB-04 | OK to create a backup bucket (cents per month) |
| SEC-02 | OK to create the DB user and new secret version; you rotate the old password |
| SEC-03 | OK to remove Mercury config; you revoke the token in Mercury |
| CLD-01 / SEC-04 / CLD-08 | You run `tools/gcp/phase1-hardening.sh` (PR #3), then I merge |
| PERF-01 | Look at Cloudflare → what serves `/5cex/` (or give me access) |
| BUG-02 | Stripe webhook secret |
| UX-01 | Hide "Sign in" until the portal exists? |
| BUG-03 | Which duplicate post to keep |
| CLD-04 | Confirm the GCP project's billing account |
