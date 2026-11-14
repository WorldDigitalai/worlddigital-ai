# worlddigital.ai

Company site, blog and paid self-serve tools for **WorldDigital.ai** (SEO, AI search and paid ads for SMBs, SMEs and enterprises in the US and Canada).

| Part | Tech | Runs on | Folder | Deploys via |
|---|---|---|---|---|
| Website, blog, blog editor | JavaScript Cloudflare Worker, SQLite Durable Object | Cloudflare (`worlddigital-ai-site`, route `worlddigital.ai/*`) | `workers/ai-site/` | `deploy-ai-site.yml` |
| Crawl-file forwarder | JavaScript Cloudflare Worker | Cloudflare (`worlddigital-ai-crawl-files`) | `workers/ai-crawl-files/` | `deploy-ai-crawl-files.yml` |
| **Tools API**: keyword research ($9.99, 10 keywords) and content packs ($24.99, 5 pieces) | **Python** FastAPI + **MongoDB** Atlas, OpenAI, DataForSEO, Stripe Checkout, Resend | Google Cloud Run (`worlddigital-ai-api`) | `backend/` | `deploy-backend.yml` |
| Old Next.js + Express app (Replit) | archived, not deployed | – | `archive/nextjs-app/` | – |

The free SEO report (`/free-seo-report`) is served by `worlddigital-report`, which still lives in the **worlddigital-us** repo (shared by both sites).

## How the paid tools work

```
visitor ─▶ worlddigital.ai/services/keyword-research   (ai-site worker renders page + widget)
        ─▶ POST /api/tools/keywords/preview            (ai-site forwards to backend with X-Internal-Token)
             backend: read site ▸ DataForSEO keyword data ▸ OpenAI ranks 10 ▸ save job in MongoDB
             returns 3 keywords + the *lengths* of the other 7 (blurred placeholders; real data never leaves the server)
        ─▶ "Unlock all 10 — $9.99" ▸ POST /api/tools/checkout ▸ Stripe Checkout (one-time, automatic tax)
        ─▶ back to ?order=cs_… ▸ GET /api/tools/order  (verifies payment with Stripe, unlocks, emails the file once)
        ─▶ GET /api/tools/download?format=pdf|xlsx|docx
```
Content packs are the same, with a platform choice (Google Search Ads, Facebook, Instagram, LinkedIn, X, TikTok, YouTube Shorts, Snapchat), ad or post, and character limits enforced per field. Free previews: 3/10 keywords, 1/5 content pieces; 6 new previews per visitor IP per day; identical requests within 24h are served from cache.

MongoDB collections (db `worlddigital_ai`): `tool_jobs`, `tool_cache`, `tool_paid`, `tool_limits`, all with TTL indexes (previews kept 30 days, paid orders 1 year).

The widget is hidden on the site until `TOOLS_API_URL` is set in `workers/ai-site/wrangler.jsonc`, so the site can deploy before the backend is ready.

## Local development

```bash
cd workers/ai-site && node --test test/*.test.mjs        # site tests
node workers/ai-site/tools-src/build.mjs                  # rebuild the widget after editing tools-src/
cd backend && uv run pytest -q                            # API tests (in-memory MongoDB, mocked APIs, no network)
cd backend && uv run python tests/dev_server.py           # API on :8090 with mocks
cd workers/ai-site && npx wrangler dev --local --port 8791 # site; .dev.vars: TOOLS_API_URL=http://127.0.0.1:8090, TOOLS_API_TOKEN=dev-token
```

## Setup (one time)

**GitHub → Settings → Secrets and variables → Actions**
- `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit), `CLOUDFLARE_ACCOUNT_ID` = `7a05f2ae447b2e57f5c902dc6f593d22`
- `RESEND_API_KEY` (blog editor sign-in emails), `TOOLS_API_TOKEN` (same value as the backend's `INTERNAL_TOKEN`)
- (No Google key needed in GitHub: the deploy signs in with Workload Identity Federation.)

**Google Cloud**: run `backend/setup-gcp.sh` once in Google Cloud Shell. It sets up keyless GitHub sign-in (Workload Identity Federation), permissions, and asks for each secret (MONGODB_URI, OPENAI_API_KEY, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD, STRIPE_SECRET_KEY, RESEND_API_KEY, INTERNAL_TOKEN).

**MongoDB Atlas**: create a database user for the API; Network Access must allow Cloud Run (0.0.0.0/0 with a strong password, or a Cloud NAT static IP).

**Then**: push to `main` → backend deploys and prints its URL → put it in `TOOLS_API_URL` (`workers/ai-site/wrangler.jsonc`) → push → the widget appears on both service pages.

## Rules worth keeping
- Never invent testimonials, results, prices or certifications. Say "A+ BBB rating", never "accredited".
- Prices shown in the widget must match `backend/app/products.py`.
- Update the page's keywords and JSON-LD in `workers/ai-site/src/pages.js` when a page changes.
- Every new video (social reels, YouTube Shorts, TikTok, and any video made from a blog post) must have real sound:
  a voiceover, music or sound effects. Never ship a silent track; check with `ffmpeg -i x.mp4 -af volumedetect -f null -`
  (max_volume near -91 dB means silent).
- Every new video and reel is 7 seconds or less, voice included. `backend/app/blog_video.py` enforces this with
  `MAX_SECONDS`; check any other video with `ffprobe -show_entries format=duration x.mp4`.
