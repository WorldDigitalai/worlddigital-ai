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

## No other changes were made

All other findings are documented with proposed fixes and wait for approval (see the list of safe fixes in
CTO-RECOMMENDATIONS.md). No production database, credential, billing, cloud setting or customer data was modified. The
only live data writes during the audit were read-only probes and a manual run of the weekly SEO crawl (which updates
issue #1, as it does every week).
