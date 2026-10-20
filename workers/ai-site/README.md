# worlddigital-ai-site

The worlddigital.ai company website, blog and private blog editor, as one Cloudflare Worker.

| Part | Where |
|---|---|
| Pages (same addresses as the old site, new company design) | `src/pages/*.html`, registered in `src/pages.js` |
| Header, footer, styles, SEO tags | `src/layout.js` |
| Blog (`/blog`, `/blog/<slug>`, `/blog/feed.xml`) | `src/blog.js`; first 8 posts seeded from `content/blog/*.md` |
| Blog editor (`/blog-admin`) | `src/admin.js`: one-time email sign-in for `ADMIN_EMAILS`, drafts, schedule, publish, unpublish, photos |
| Storage (posts, photos, sign-in, form entries) | `src/store.js`, one SQLite Durable Object |
| robots.txt, sitemap.xml, llms.txt (include blog posts automatically) | `src/index.js`, `src/crawl-text.js` |
| Redirects (old social-platform pages etc.) | `REDIRECTS` in `src/pages.js` |
| App passthrough (login, dashboard, /api, sign-up, Stripe) | `src/routing.js` |

## Status: live on worlddigital.ai (since 2026-10-16)
The workers.dev address still works as a noindex preview. The ai-crawl-files worker now just forwards its routes here.

## Go-live checklist
1. Ahmad approves the preview.
2. GitHub secret `RESEND_API_KEY` is set (sign-in emails for the editor).
3. Uncomment the `routes` block in `wrangler.jsonc`; set `PING_SEARCH` to `"1"`.
4. Remove the routes from `workers/ai-crawl-files/wrangler.jsonc` (this site now serves those files and redirects).
5. Push; check `/`, `/blog`, `/login`, `/dashboard`, Stripe webhooks and a test sign-in.
Rollback: comment the routes out again and redeploy; the old app serves everything again.

## Local
```bash
npx wrangler dev --local --port 8791      # .dev.vars: DEV_SHOW_LINK=1 shows the sign-in link on screen
node --test test/*.test.mjs
```
