# Security audit

## Summary

One **critical** issue was found and closed during the audit: billing was reachable from the internet through an
encoded web address. The rest of the code is in good shape: constant-time token checks that fail closed, a hardened admin
sign-in, SSRF protection and tested customer isolation. The biggest remaining risks are in configuration rather than
code: the database user and its network access, plaintext secrets in the Cloud Run config, a payment provider that's
still connected but unused, and no branch protection.

## Findings

| ID | Severity | Finding | Evidence | Fix | Status |
|---|---|---|---|---|---|
| SEC-01 | **CRITICAL** | Billing endpoints reachable through `/api/tools/%62illing…` (reads billing records; can try to create, email or cancel Mercury invoices) | Live probe and local repro (BUG-01) | Proxy refuses encoded paths; backend billing requires `x-wd-server` | **Fixed and verified live** (`b6f8fbf`) |
| SEC-02 | HIGH | The app connects as the project's only database user, which has the **`atlasAdmin`** role, and the access list allows **`0.0.0.0/0`** | Atlas API: user `ahmadawwad_db_user` → `atlasAdmin@admin`; access list `0.0.0.0/0` + one /32 | New user with `readWrite` on `worlddigital_ai` only, new `MONGODB_URI` secret version, then rotate the old password. Keep `0.0.0.0/0` (Cloud Run has no fixed IP since the NAT was removed) and accept it with a long random password | Needs approval (credentials) |
| SEC-03 | HIGH | Mercury still connected though no longer used; token passed as a **plaintext env var** | Health `"mercury": true`; `deploy-backend.yml` `MERCURY_API_TOKEN=${{ secrets… }}` under `env_vars` | Remove the two `MERCURY_*` lines, revoke the token in Mercury, 410 on `/api/site/plan` | Needs approval |
| SEC-04 | MEDIUM | `TOOLS_API_TOKEN` and `RESEND_API_KEY` are also plaintext Cloud Run env vars (visible to anyone with Cloud Run viewer access) | `deploy-backend.yml` `env_vars` | **Open PR #3** already moves them to Secret Manager, with safe deploy, a budget and a least-privilege deploy account. Run its Cloud Shell script, then merge | Needs you to run the script |
| SEC-05 | MEDIUM | Backend Turnstile not configured, so paid-cost previews (DataForSEO + OpenAI) are limited only by 6/IP/day and one free preview per domain | Health `"turnstile": false`; `verify_turnstile()` returns early without `TURNSTILE_SECRET` | Verify the widget token in the worker through the existing `REPORT` `/verify-human` binding (as the forms do), so no new secret is needed | Safe fix, proposed |
| SEC-06 | MEDIUM | No branch protection; any push to `main` deploys to production | GitHub API: "Upgrade to GitHub Pro…" | GitHub Team (paid) for required reviews, or keep the test gates plus PR #3's automatic rollback | Decision |
| SEC-07 | MEDIUM | .us build dependencies: `astro` (critical: XSS in `define:vars` / spread props, server-island replay), `sharp` (libvips CVEs), `zod`, `vite`, `undici` | `npm audit` in `web/` | Real exposure is low: the site is static, built from our own content, with no server islands or user input at build time. Still upgrade to the patched Astro release in a branch and re-run `check_site.py` and the responsive check | Proposed |
| SEC-08 | LOW | Public health endpoint reveals configuration (Stripe live mode, which providers are connected) | `GET /api/tools/health` | Return only `ok` publicly; full detail only with the token | Safe fix, proposed |
| SEC-09 | LOW | Public pages have no Content-Security-Policy (the admin has a strict nonce CSP) | Live headers on `/` and `/tools` | Start with `Content-Security-Policy-Report-Only` | Proposed |
| SEC-10 | LOW | `anthropic-wif-test.yml` exchanges a GitHub OIDC token for an Anthropic token on **every push** in both repos | Workflow file | Make it manual-only or remove it | Safe fix, proposed |
| SEC-11 | INFO | No access logs were reviewed, so **whether SEC-01 was used before today is UNVERIFIED** | No Cloud Run log access from this workspace | Search Cloud Run request logs for `%62illing`, `bill%`, or `/api/tools/billing` with no `x-wd-server`. The billing collections hold 1 customer and 1 invoice record | You (Cloud console) |

## Checked and sound (keep as is)

| Area | Evidence |
|---|---|
| Worker → backend auth | `guard()` in `main.py`: `hmac.compare_digest`, 503 when the token is unset (fail closed) |
| Admin sign-in | Magic link (hashed, single use, 20 min), Turnstile, `__Host-` cookie with HttpOnly/Secure/SameSite=Lax, 7-day session, HMAC CSRF on every POST, Origin/Referer check, nonce CSP, `X-Frame-Options: DENY`, `noindex`. Only `ADMIN_EMAILS` can sign in |
| XSS | Server-rendered HTML escapes user and AI text (`esc()`); admin pages build DOM with `textContent`; tests cover escaping |
| SSRF | Customer sites go through `_fetch_page`: public IPs only, re-checked on every redirect, 1.5 MB cap |
| File upload | Admin only, type allow-list, 1.9 MB cap, magic-byte check (`admin.js` upload handler) |
| NoSQL injection | Values are used as values, never as query operators; ids are strings; inputs are type-checked and length-capped |
| Customer isolation (knowledge bases) | Tenant searches can only ever see their own chunks. Mixing sources is refused, and both cases are tested (`test_customer_knowledge_base_is_isolated`, `test_internal_knowledge_stays_private`) |
| Rate limits | Chat 40/IP/day, previews 6/IP/day + one free per domain, public answer API 30/IP/day and 1,000/day in total, free report daily cap 50 (.us), lead dedupe by IP hash |
| Stripe | Payment verified server-side with Stripe (`payment_status == "paid"`) before unlocking; session ids pattern-checked; live key only in Secret Manager |
| Transport | HSTS with preload on .ai; TLS to MongoDB; Cloudflare in front of both sites |
| GitHub → GCP | Workload Identity Federation, no stored service-account key |
| Personal data | Chat and API questions are stored with emails and phone numbers redacted, without IP, and deleted after 180 days |

## Not applicable or not present

- OAuth 2.0 / Google Sign-In / JWT sessions / passwords: there are **no customer accounts**. The admin uses magic links.
  Re-audit when the customer portal is rebuilt.
- Stripe webhooks: none exist (see BUG-02); add one with signature verification.
- Multi-tenant ad accounts, campaigns and reports: no such features exist in the live code (only in `archive/`, which isn't deployed).
- SQL injection: there's no SQL database in the request paths; the Durable Object uses parameterised `sql.exec(?, …)`.

## UNVERIFIED (no access)

Cloud IAM bindings and Secret Manager access, Cloudflare WAF/bot rules, OpenAI/Stripe/DataForSEO account settings (spend
caps, restricted keys, 2FA), and GitHub organisation 2FA.
