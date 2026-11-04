# SEO and performance audit

## Evidence used

- Live crawl `site-audit.yml` run 41858241454 (2026-11-04 15:30 UTC): every sitemap URL on both sites, the deep SEO check,
  internal links and crawler access.
- Lighthouse `lighthouse-ai.yml` on commit `b6f8fbf` (2026-11-04), and the .us `lighthouse-audit.yml` of 2026-10-29
  (run 40816653598), which also scored .ai.
- Browser measurements on worlddigital.us (2026-11-04).

## Results

| Check | worlddigital.ai | worlddigital.us |
|---|---|---|
| Sitemap pages | 50, all 200 | 15, all 200 |
| Titles / descriptions / canonical / breadcrumbs / schema | 0 issues except **2 duplicate titles** (BUG-03) | 0 issues |
| Internal links | 52 unique, 0 broken, 0 redirecting, 0 chains, 0 orphans | 24 unique, 0 broken |
| robots.txt, llms.txt, llms-full.txt | 200 | 200 |
| Googlebot, Bingbot, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot | all 200 | all 200 |
| Structured data | Organization, ProfessionalService, WebSite, FAQPage, Service, Offer, BlogPosting, BreadcrumbList, WebApplication, ItemList | Person, ProfilePage, Organization, Service, FAQPage, Article, BreadcrumbList |
| Markdown for AI agents | `Accept: text/markdown` on any page, with metadata front matter (verified on a live blog post) | – |
| Public answer API for agents | `POST /api/rag/answer`, listed in llms.txt (verified live) | – |

## Lighthouse

| Page (mobile) | 2026-10-29 | 2026-11-04 |
|---|---|---|
| .ai `/` | **99** perf · 100 BP · TBT 130 ms | **69** perf · **79** BP · TBT **3,640 ms**, LCP 1.8 s, CLS 0 |
| .ai `/social` | – | 63 perf |
| .ai `/services`, `/ai-seo-agency`, `/google-ads-agency`, `/services/content-marketing` | 100 | 85–89 perf |
| .ai, every page | BP 100 | BP 78–79 |
| .ai desktop `/` | 100 | 88 perf |
| .us mobile pages | 96–99 | not re-run (unchanged code) |
| .us desktop pages | 100 | – |
| .us live measurement (browser) | – | TTFB 186 ms, LCP 404 ms, 457 KB transferred, 1 H1, canonical OK |

### PERF-01 (HIGH): regression on worlddigital.ai since 2026-10-29
- **What Lighthouse shows:** a first-party script at `https://worlddigital.ai/5cex/` uses 2,313 ms of main-thread script on
  mobile and causes the long tasks. Best Practices drops on every page because of a third-party cookie from
  `googleads.g.doubleclick.net` (Google Ads tag `AW-16853962405`).
- **Root cause (strongly indicated, UNVERIFIED):**
  - Neither `/5cex/` nor `AW-16853962405` appears in either repository.
  - So the tag is being added at Cloudflare (for example Google tag gateway or Zaraz) or inside the GTM container.
  - Either way, it runs on page load. The site's own code deliberately loads GTM only after the first interaction
    (`layout.js`).
- **Fix:**
  1. In Cloudflare, find what serves `/5cex/` and set it to load after interaction, or move the Ads tag into the deferred
     GTM container.
  2. Re-run `lighthouse-ai.yml`. The target is back to 95+ mobile and 100 Best Practices.
  3. Keep conversion tracking working. Check in Google Ads that conversions still record afterwards.

## Other findings

| ID | Severity | Finding | Fix |
|---|---|---|---|
| SEO-01 | MEDIUM | Two near-duplicate Autopilot posts with the same title | Redirect one to the other; add the Autopilot similarity guard (BUG-03) |
| SEO-02 | LOW | `/pricing` 404 | 301 to `/tools` |
| SEO-03 | – | ~~worlddigital.us home: 1 image without `alt`~~ **Corrected:** it is a decorative logo with `alt=""` inside an `aria-hidden` block, which is correct | No change |
| SEO-04 | LOW | Sign-in link and portal pages (`/login`, `/signup`, `/dashboard`, `/onboarding`) answer 200 with a placeholder | They are `noindex`, so no SEO harm. A UX issue (PRODUCT-UX-AUDIT.md) |
| SEO-05 | INFO | Knowledge base shows `/tools` and the ads pages aren't the best answer for "products" and "advertising platforms" questions | Short summary paragraph at the top of those pages; helps AI answers too |

## Visibility in Google, ChatGPT, Gemini, Perplexity and Bing

- **Verified:**
  - Every major search and AI crawler gets 200 on both sites.
  - llms.txt and llms-full.txt are served on both.
  - Search Console data is exported to BigQuery weekly.
  - Indexing was verified page by page in an earlier session: all .us pages indexed, .ai fully indexed except
    `/murfreesboro`, which was submitted.
  - The `.us` repo runs an AI-visibility snapshot (DataForSEO AI-answer data) into BigQuery.
- **UNVERIFIED:** current rankings and citations in each AI assistant. The snapshot data is in BigQuery and wasn't queried
  in this audit. Bing Webmaster Tools isn't connected in the browser used.

## Keep as is

Server-rendered HTML, inlined critical CSS, self-hosted fonts, edge caching (`s-maxage=300`), per-page JSON-LD, the
pre-publish link and schema checks on .us, and the weekly crawl. These are why SEO is clean. Only the tag loading needs
attention.
