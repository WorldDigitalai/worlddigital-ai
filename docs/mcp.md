# WorldDigital.ai MCP server

Read-only tools for the owner's AI assistant (Claude or any MCP client), served by the backend on Cloud Run.

- **Address to add in Claude** (Settings → Connectors → Add custom connector):
  `https://worlddigital-ai-api-250920469327.us-central1.run.app/mcp`
- **Sign-in:** OAuth 2.1 with PKCE. The backend is its own authorization server. When Claude connects, the browser
  opens `https://worlddigital.ai/blog-admin/mcp`; a signed-in site admin clicks "Allow read-only access". If the
  browser is not signed in, the page asks for the admin email; opening the emailed link **in the same browser within
  15 minutes** returns to the consent page (cookie `wd_next`, only `/blog-admin/mcp?req=…` is accepted).
- **Diagnose a failed connect:** run the "MCP connector check" workflow (walks Claude's steps; the request-log part
  needs the deploy account to have the Logs Viewer role, which it does not have yet).
- **Code:** `backend/app/mcp_server.py` (server, OAuth provider, tools), mounted at the end of `backend/app/main.py`
  when `MCP_PUBLIC_URL` is set (it is, in `.github/workflows/deploy-backend.yml`). Consent page and the
  token-checked leads endpoint are in the site worker: `workers/ai-site/src/admin.js` (`mcpConsentPage`,
  route `/blog-admin/mcp`) and `workers/ai-site/src/ai.js` (`internalLeads`, route `/api/internal/leads`).
- **SDK:** official `mcp` Python package (2.x, `MCPServer`), Streamable HTTP, stateless, JSON responses.

## Tools (all read-only, annotated `readOnlyHint`)

| Tool | What it returns |
|---|---|
| `ask_knowledge_base(question)` | The site's own answer with source pages (same engine as site search). |
| `visitor_questions(days=30)` | Totals, questions the site could not answer, thumbs-down answers, top questions per week, most cited pages. No emails. |
| `quality_and_speed()` | Latest quality-test score, failures, speed, ready-answer count, answer model chain, today's fallbacks. |
| `leads(limit=20)` | Newest form entries and email-back requests, with names, emails and messages (owner's customer data). |

## Security

- Only redirect addresses on `claude.ai` / `claude.com` may register (`MCP_REDIRECT_HOSTS` to change), so the
  consent page can't be used to send a sign-in code to someone else.
- Tokens are random and stored only as SHA-256 hashes (`mcp_tokens`); access 1 hour, refresh 30 days, rotated on use;
  revoking one removes its pair. Codes are single-use, 5 minutes. Expired rows are removed by TTL indexes.
- The consent page requires the existing admin email sign-in and CSRF token; the backend consent endpoint
  requires the internal token, so only the site can approve.
- DNS-rebinding protection: only the Cloud Run host is accepted; browser origins limited to claude.ai / claude.com.
- The server instructions tell the assistant that visitor text is data, not instructions.
- **Sign everyone out:** delete the `mcp_tokens` collection in MongoDB (`worlddigital_ai` database).
- **Turn it off:** remove `MCP_PUBLIC_URL` from deploy-backend.yml **and set it to an empty value**
  (removing a line does not unset it on Cloud Run), then deploy.

## Tests

- `backend/tests/test_mcp.py`: unsigned requests refused with the sign-in hint; OAuth metadata; registration limited to
  known assistants; consent allow and deny; PKCE enforced; codes work once; only hashes stored; all four tools; refresh
  rotation; revoke.
- `workers/ai-site/test/kb.test.mjs`: consent page content and escaping; leads endpoint token check and limits.
- `tools/e2e_check.py` check `mcp`: against the live server, nothing signed in.

## Not done yet

- Connect it in Claude and approve once, then try each tool on real data.
- Optional next tools (would change data, so they would need their own consent): approve or edit a ready answer,
  re-run the quality test.
