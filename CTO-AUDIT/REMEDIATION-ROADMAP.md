# Remediation roadmap

## All findings by severity

| ID | Sev | Description | Evidence (report) | Root cause | Business impact | Fix | Effort | Risk of fix | Depends on | Approval |
|---|---|---|---|---|---|---|---|---|---|---|
| SEC-01 | CRITICAL | Billing reachable via encoded path | SECURITY | Raw-path regex vs decoding server | Billing data exposure, invoice abuse | Done | – | – | – | **Done, verified** |
| SEC-11 | CRITICAL (follow-up) | Was SEC-01 used before today? | SECURITY | No log review possible | Unknown exposure of 1 customer record | Search Cloud Run logs | 30 min | None | Console access | You |
| DB-01 | HIGH | No database backups | DATABASE | M0 has none, no dump job | Permanent loss of orders, billing, KBs | Nightly encrypted `mongodump` to Cloud Storage (or paid tier) | 0.5 day | Low | Bucket | Yes |
| SEC-02 / DB-02 | HIGH | App DB user is `atlasAdmin`, open network | DATABASE | Setup used the admin user | A leaked URI gives full cluster control | Least-privilege user, rotate | 1 hour | Low (new secret version, rollback by version) | – | Yes |
| SEC-03 | HIGH | Mercury still connected, plaintext token, live plan route | SECURITY | Revert didn't remove config | Abuse surface for an unused vendor | Remove env, revoke token, 410 route | 1 hour | Low | – | Yes |
| BUG-02 | HIGH | No Stripe webhook | BUG | Pull-based fulfilment | Lost deliveries, refunds | `checkout.session.completed` webhook with signature check | 1 day | Low | Webhook secret | Yes |
| PERF-01 | HIGH | Mobile home 99 → 69, BP 100 → 79 | SEO-PERF | Tag injected at Cloudflare/GTM loads on page load | Slower mobile, lower conversion | Defer Ads tag; find `/5cex/` | 2 hours | Low | Cloudflare dashboard | You / me |
| CLD-01 | HIGH | No staging, no protection, no rollback | CLOUD | Free plan; simple pipeline | A bad push takes production down | Finish PR #3 (safe deploy) | 1 hour of your time | Low (script has rollback) | Cloud Shell | You |
| UX-01 | HIGH | "Sign in" goes to a placeholder | PRODUCT | Portal retired | Trust and conversion | Hide link until portal exists | 15 min | None | – | Product decision |
| SEC-04 | MEDIUM | Secrets as plaintext env vars | SECURITY | Early setup | Visible to project viewers | PR #3 | – | – | PR #3 | You |
| SEC-05 | MEDIUM | No human check on previews | SECURITY | Backend secret unset | Bots spend DataForSEO and OpenAI credits | Verify Turnstile in the worker via the existing binding | 2 hours | Low | – | Safe |
| SEC-06 | MEDIUM | No branch protection | SECURITY | Free plan | No change control evidence | GitHub Team or process | – | – | Budget | Decision |
| SEC-07 | MEDIUM | .us Astro and other advisories | SECURITY | Dependencies behind | Low real exposure (static) | Upgrade in a branch + existing checks | 0.5 day | Medium (major version) | – | Yes |
| BUG-03 | MEDIUM | Autopilot duplicates | BUG | Exact-match dedupe | Cannibalisation, wasted AI spend | Similarity guard + redirect one post | 2 hours | Low | – | Guard safe; redirect is a content choice |
| BUG-05 | MEDIUM | Docker ignores lock file | BUG | Unpinned `pip install` | Untested versions in production | Install from `uv export --frozen` | 30 min | Low | – | Safe |
| BUG-07 | MEDIUM | Dormant `/api/site/plan` live | BUG | Kept after revert | See SEC-03 | 410 | 10 min | None | – | With SEC-03 |
| AI-01 | MEDIUM | Silent fallback to pricier models | AI | Fallback list mixes tiers | Surprise AI bills | Same-tier fallback + metric | 1 hour | Low | – | Safe |
| AI-02 | MEDIUM | No token tracking | AI | `usage` discarded | Spend invisible | Per-feature daily token metrics on the admin page | 0.5 day | Low | – | Safe |
| CLD-04 | MEDIUM | Production in a "POC" GCP project | CLOUD | Initial setup | Could be a trial or sandbox | Confirm billing ownership | 15 min | None | Console | You |
| CLD-05 | MEDIUM | No backend alerting | CLOUD | Not set up | Outages go unnoticed | Add .ai + API to the .us nightly monitor; Cloud Monitoring uptime check | 2 hours | Low | – | Safe (monitor) |
| DB-04 | MEDIUM | Durable Object data not exported | DATABASE | Not built | Blog and leads loss risk | Weekly export | 0.5 day | Low | DB-01 bucket | Yes |
| CLD-09 | LOW | Mercury/NAT leftovers | CLOUD | Earlier experiment | Possible monthly cost | Delete workflows; check console | 30 min | None | Console | Yes |
| SEC-08 | LOW | Health endpoint reveals config | SECURITY | Diagnostic convenience | Minor info leak | Trim public output | 30 min | Low | Deploy workflow reads it | Safe |
| SEC-09 | LOW | No CSP on public pages | SECURITY | Not added | XSS defence-in-depth | Report-only CSP | 1 hour | Low | – | Safe |
| SEC-10 | LOW | `anthropic-wif-test` on every push | SECURITY | Test workflow left on | Minutes, token churn | Manual-only | 5 min | None | – | Safe |
| BUG-06 | LOW | Root `test:site` broken | BUG | Missing loader | Contributor confusion | Use `npm test` | 5 min | None | – | Safe |
| BUG-08 | LOW | `/pricing` 404 | BUG | No redirect | Lost visits | 301 | 5 min | None | – | Safe |
| BUG-09 / DB-05 | LOW | `rag_sync` unbounded | DATABASE | No TTL | Slow growth | TTL 180 days | 10 min | None | – | Safe |
| BUG-10 | LOW | Lint and deprecations | BUG | – | Maintenance | Clean up; bump actions | 1 hour | None | – | Safe |
| SEO-03 | LOW | .us image without alt | SEO | – | Accessibility | Add alt | 5 min | None | – | Safe |
| DB-06 | LOW | Paid orders expire after 1 year | DATABASE | TTL choice | Old order links stop working | Confirm intent | – | – | – | Decision |

## 30 days

1. ✅ SEC-01 (done). You: check logs (SEC-11).
2. Backups (DB-01) and a tested restore.
3. Least-privilege DB user (SEC-02); remove Mercury (SEC-03, BUG-07, CLD-09).
4. Run the PR #3 script and merge (safe deploy, Secret Manager, budget, narrower roles).
5. Fix the mobile tag regression (PERF-01).
6. Safe batch: BUG-05, BUG-06, BUG-08, BUG-09, SEC-08, SEC-10, AI-01, BUG-03 guard, SEC-05.
7. Decide on the Sign in link (UX-01).

## 60 days

1. Stripe webhook (BUG-02).
2. Token and cost tracking on the admin page (AI-02); OpenAI project budget.
3. Alerting: .ai + API in the nightly monitor, Cloud Monitoring uptime check (CLD-05).
4. Durable Object export (DB-04).
5. CI security scan steps; end-to-end money-path test (TEST-COVERAGE-REPORT.md).
6. Astro upgrade on .us in a branch (SEC-07).

## 90 days

1. Report-only CSP, then enforce (SEC-09).
2. Admin and forms tests; a load test against a tagged revision.
3. Incident plan and runbooks (DB down, key leak, Stripe/OpenAI outage).
4. Choose the Atlas tier before customer knowledge bases go live (M10/Flex with backups).
5. GitHub Team for branch protection, if budget allows.

## 12 months

1. **Customer portal in the existing stack:** magic-link accounts; purchases, reports and knowledge base per customer under
   the tested tenant isolation. Self-serve export and delete.
2. **Ad-account integrations (if the product needs them):** Google Ads first, OAuth tokens per tenant in Secret Manager,
   with refresh and rate-limit handling.
3. SOC 2 readiness programme (policies, access reviews, evidence), only if enterprise deals require it.
4. Scale steps as usage grows: Cloud Run max instances, Atlas tier, background ingestion jobs.
