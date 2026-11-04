# Third-party integrations

Verified by reading the live code paths (not `archive/`). "Live check" means observed today on production.

| Integration | Used for | Auth | Retries / errors | Webhooks | Status |
|---|---|---|---|---|---|
| **OpenAI** | Chat, previews, blog, images, TTS, embeddings | API key in Secret Manager | Model fallback list; embeddings retry 429/5xx with backoff (`rag.py`); chat calls don't retry | – | ✅ Live (health `openai: true`). Cost not tracked (AI-02) |
| **DataForSEO** | Keyword data (backend), free report and AI visibility (.us worker) | Login/password in Secret Manager / Cloudflare secret | Errors surfaced as friendly messages; daily cap 50 on free reports | – | ✅ Live (health `dataforseo: true`). The .us nightly check reports the balance |
| **Stripe** | One-time Checkout ($9.99 / $24.99), SEO plan payment link | Live secret key in Secret Manager (health `stripe_mode: live`) | Payment verified server-side before unlock | ❌ **None** (BUG-02) | ✅ Live, gap: webhook |
| **Resend** | Report emails, receipts, admin sign-in, form notifications, follow-ups | API key (Secret Manager + Cloudflare secret) | Follow-ups use an idempotency key (.us); admin errors logged | Delivery status read by the .us follow-up job | ✅ Live |
| **Buffer** | Share new blog posts to LinkedIn, Facebook, Instagram, X, Google Business, TikTok, YouTube | `BUFFER_API_TOKEN` (Cloudflare secret) | Share job queued in the DO; per-channel result emailed | – | ✅ Configured (7 channels). The Social hub syncs posts at deploy (395 posts) |
| **Cloudflare Turnstile** | Forms, admin sign-in, free report | Secret in the report worker; .ai verifies via service binding | Fails closed | – | ✅ Live on forms. ❌ Not on tool previews (SEC-05) |
| **Google Search Console** | Indexing, bulk export to BigQuery | Google account; WIF for BigQuery | – | – | ✅ Export read weekly |
| **GA4 + GTM** | Analytics | Public tag ids | GTM deferred until interaction; internal traffic excluded | – | ✅ Live. The Google Ads tag (outside the repo) slows mobile (PERF-01) |
| **IndexNow** | Ping Bing and others on deploy | Key file on both sites | – | – | ✅ |
| **MongoDB Atlas** | All backend data | URI in Secret Manager; user is `atlasAdmin` (SEC-02) | DB ping before billing | – | ✅ Live, needs least privilege and backups |
| **Mercury** | Invoicing (abandoned for Stripe) | Token as plaintext env var | Retries + DB ping | – | ⚠️ **Still connected; remove** (SEC-03) |
| **Anthropic** | CI test of token exchange only | GitHub OIDC | – | – | ⚠️ Runs on every push; no production use (SEC-10) |

## Not integrated (despite the brief)

Google Ads API, Meta Business / Facebook / Instagram Ads API, Snapchat Ads, TikTok Ads, LinkedIn Ads, YouTube API,
HubSpot, Zapier and Vertex AI. The ad-platform names appear only as content (page copy and post platforms), not as API
integrations. There's therefore no OAuth token refresh, API version or ad-account permission handling to audit. When ad
accounts are connected in the future, OAuth refresh tokens should go in Secret Manager or encrypted fields, stored per
tenant.

## Recommendations

1. Stripe webhook with signature verification (BUG-02).
2. Remove Mercury: env vars, revoke the token, 410 on the plan route (SEC-03).
3. Turnstile on previews via the existing binding (SEC-05).
4. Token usage logging for OpenAI (AI-02).
5. Make `anthropic-wif-test.yml` manual-only.
