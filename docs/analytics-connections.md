# Connecting services to Analytics

`/blog-admin/analytics` > **Connected services** pulls numbers from each provider every 15 minutes (`backend/app/collectors.py`).
A card says **Connected**, **Needs a key** (the exact secret name is on the card), **Error** (the provider's own message) or **Not connected**.
Add a key as a **GitHub secret** with the name below (repo Settings > Secrets and variables > Actions), then push any change to `backend/**`
(or re-run "Deploy tools API"): the deploy passes it to the backend. **Collect now** then shows the result.
Run the manual workflow **Collect check (connected services)** to print every provider's state without opening the site.

| Card | GitHub secret(s) | Where to get it |
|---|---|---|
| OpenAI, Claude, Cerebras, Groq | none | counted by the site itself |
| Stripe, Resend, DataForSEO | already set | |
| OpenAI billing | `OPENAI_ADMIN_KEY` | platform.openai.com > Settings > Organization > Admin keys |
| Anthropic billing | `ANTHROPIC_ADMIN_KEY` | console.anthropic.com > Settings > Admin keys (`sk-ant-admin...`) |
| Mercury | `MERCURY_API_TOKEN` | Mercury > Settings > API tokens (read-only) |
| Cloudflare traffic | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | dash.cloudflare.com > My Profile > API Tokens (Analytics: Read), zone ID on the zone's Overview page |
| Google Analytics 4 | `GOOGLE_SERVICE_ACCOUNT_B64`, `GA4_PROPERTY_ID` | see Google below; property ID: GA4 Admin > Property settings (digits only) |
| Search Console | `GOOGLE_SERVICE_ACCOUNT_B64`, `SEARCH_CONSOLE_SITE` | see Google below; site is `sc-domain:worlddigital.ai` or the exact URL-prefix property |
| Buffer | uses `BUFFER_API_TOKEN` (already set) | |

**Google (one service account for both).** In Google Cloud create a service account, create a JSON key for it, and enable the
"Google Analytics Data API" and "Google Search Console API" in that project. Add the service account's email as a **Viewer** on the GA4 property
(Admin > Property access management) and as a **user** on the Search Console property (Settings > Users and permissions).
Store the key as one line: `base64 -w0 key.json` and paste the result as the secret `GOOGLE_SERVICE_ACCOUNT_B64`. If Google refuses, the card names the email to add.

Not built yet (needs access this repo does not have): Google Ads (developer token + OAuth refresh token), Bird, TikTok Ads.
