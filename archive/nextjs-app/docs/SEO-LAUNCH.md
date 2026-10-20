# SEO launch checklist — worlddigital.ai

Everything in the code is done. These steps need someone logged in to the
Google, Bing and hosting accounts.

## 1. Environment variables (hosting / Replit Secrets)

| Variable | What it does | Where to get it |
|---|---|---|
| `GOOGLE_SITE_VERIFICATION` | Renders the Google ownership meta tag | Search Console → Settings → Ownership verification → HTML tag (the `content` value only) |
| `BING_SITE_VERIFICATION` | Renders the `msvalidate.01` tag | Bing Webmaster Tools → Add site → HTML meta tag (the `content` value only) |
| `INDEXNOW_KEY` | Serves `/indexnow.txt` so Bing accepts instant URL submissions | Any 8–128 character string of letters, numbers and dashes, e.g. a UUID |
| `API_INTERNAL_URL` | Lets the sitemap, llms.txt and blog pages read CMS posts server-side | The API's internal URL, e.g. `http://localhost:8080/api` |
| `NEXT_PUBLIC_SITE_URL` | Canonical domain (defaults to `https://worlddigital.ai`) | Leave unset in production |

Google is already verified by `public/googlef03ea4130dd21e15.html`; the meta tag is a backup.

## 2. Google Search Console

1. Property: **Domain** `worlddigital.ai` (covers www and non-www).
2. Sitemaps → submit `https://worlddigital.ai/sitemap.xml`.
3. URL Inspection → "Request indexing" for the priority pages: `/`, `/services`, `/enterprise`, `/ai-marketing-automation`, `/google-ads-agency`, `/meta-ads-agency`, `/ai-seo-agency`.
4. Settings → robots.txt report: confirm it was fetched with no errors.
5. After 3–7 days check **Pages** (indexing), **Core Web Vitals** and **Enhancements** (FAQ, Breadcrumbs).
6. No country targeting setting exists anymore; US + Canada is signalled by `hreflang` (en-US / en-CA), `areaServed` schema and the copy.

## 3. Bing Webmaster Tools (also feeds Copilot, DuckDuckGo, Yahoo, ChatGPT search)

1. Add site → **Import from Google Search Console** (fastest) or verify with the meta tag.
2. Sitemaps → submit `https://worlddigital.ai/sitemap.xml`.
3. After each deploy run `npm run indexnow` (from `frontend/`, with `INDEXNOW_KEY` set) to push every URL to Bing instantly.

## 4. AI assistants

- `https://worlddigital.ai/llms.txt` lists every page with a one-line summary and is regenerated hourly.
- `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended and others on public pages, and blocks private areas.

## 5. Adding a new public page

Add it to `PUBLIC_PAGES` in `frontend/lib/seo.ts` and give it metadata with
`pageMetadata()` from the same file. The sitemap, llms.txt and hreflang tags
update automatically. Blog posts written in the admin panel need nothing.
