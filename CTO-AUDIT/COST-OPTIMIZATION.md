# Cost optimization

**Verified** means observed in config or an account API today. Everything else is an **estimate**: list prices change, and
no billing dashboard was accessible.

## Current costs

| Item | Status | Monthly |
|---|---|---|
| MongoDB Atlas M0 | **Verified** (`instanceType: FREE`) | $0 |
| GitHub (private repos, free plan) | **Verified** (branch protection blocked: "Upgrade to GitHub Pro") | $0 |
| Cloud Run (0–3 instances, scale to zero) | Config verified; bill **UNVERIFIED** | Estimate $0–15 (free tier covers low traffic) |
| Cloud Build, Artifact Registry, Secret Manager, BigQuery | Used; bill **UNVERIFIED** | Estimate $0–10 |
| Cloudflare Workers, Durable Objects, KV, Turnstile | Used; plan **UNVERIFIED** | $0–5 (Workers Paid is $5/month if on it) |
| OpenAI | Used; spend **UNVERIFIED**, not tracked in code (AI-02) | See below |
| DataForSEO | Used; balance reported nightly by the .us monitor | Pay-as-you-go |
| Resend, Buffer, Stripe fees | Used | Plan / per-transaction |
| Possible leftover Cloud NAT + reserved IP + router from the Mercury work | **UNVERIFIED** | If still present, roughly $30–45/month for nothing. Check first |

## AI usage per operation (token budgets from code; prices are assumptions)

| Operation | Tokens (from `max_tokens` in code) | Estimate |
|---|---|---|
| Embed the whole site (49 pages) | about 100k | under $0.01 (`text-embedding-3-small`, about $0.02 per million) |
| Chat answer | up to 600 out + about 4k in | about $0.002–0.01 |
| Knowledge-base answer | 900 out + about 5k in | about $0.003–0.01 |
| Content pack preview | 3,500 out | about $0.01–0.03 |
| Blog draft (Autopilot) | up to 7,000 (×4 for reasoning models) | about $0.05–0.30 + image + TTS |
| Nightly quality test | 23 answers | about $0.10–0.25 per night |

## Scenarios (estimates)

Assumed per active customer per month: one SEO plan, a 60-page knowledge base (about 4 MB), 50 chat questions,
2 content packs and 1 keyword report.

| Active customers | Database | Cloud Run | AI (OpenAI) | DataForSEO | Total infra + AI | Revenue at $199.99 |
|---|---|---|---|---|---|---|
| 100 | M0 is full at about 100 KBs, so Flex/M10, about $10–60 | $0–20 | about $30–60 | about $10–30 | **about $60–170** | about $20k |
| 1,000 | M10/M20, about $60–150 | $30–80 | about $300–600 | about $100–300 | **about $500–1,100** | about $200k |
| 10,000 | M30–M40, about $400–1,000 (about 40 GB of chunks) | $200–500 | about $3k–6k | about $1k–3k | **about $5k–10k** | about $2M |
| 100,000 | Sharded M50+, about $3k–8k | $2k–5k | about $30k–60k | about $10k–30k | **about $45k–100k** | about $20M |

Infrastructure and AI stay well under 1% of revenue in every scenario. The biggest lever is AI token use, not hosting.

## Savings and guardrails (in priority order)

1. **Check for and delete leftover NAT, router and static IP** (CLD-09), if still present.
2. **Track tokens per feature** (AI-02), so spend is a number, not a guess.
3. **Stop silent fallback to pricier models** (AI-01).
4. **Set an OpenAI project budget** and the Google Cloud budget that PR #3 adds.
5. **Autopilot duplicate guard** (BUG-03): no wasted drafts, images or videos.
6. **Turnstile on previews** (SEC-05): stops bots spending DataForSEO and OpenAI credits.
7. **Make `anthropic-wif-test.yml` manual-only:** fewer Actions minutes on every push.
8. Before onboarding paying knowledge-base customers, choose the Atlas tier (backups included) rather than outgrowing M0 by surprise.

## Not worth changing

Cloudflare Workers (cheapest option for both sites), Cloud Run (scale-to-zero), MongoDB with built-in vector search (no
separate vector database bill), GitHub Actions as the scheduler (no Cloud Scheduler or Pub/Sub cost).
