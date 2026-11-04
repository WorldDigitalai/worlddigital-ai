// worlddigital.ai company site (Cloudflare Worker).
// Owns the public marketing pages, blog and blog editor. Everything else (login, dashboard, /api, sign-up,
// Stripe webhooks, app assets) passes straight through to the existing worlddigital.ai app.
import { page, faqSchema, esc, SITE } from './layout.js';
import { PAGES, REDIRECTS } from './pages.js';
import { blogIndex, blogPost, feed, seedPosts } from './blog.js';
import { handleAdmin, sendEmail, sha256 } from './admin.js';
import { ROBOTS, LLMS, LLMS_FULL, UPDATED } from './crawl-text.js';
import { SOCIAL_UPDATED } from './social.js';
import { INDEXNOW_KEY, PROD_HOSTS, isAppPath } from './routing.js';
import { toolsProxy, ragAnswer, stripeWebhook } from './tools-proxy.js';
import { withTool } from './tools-widget.js';
import { humanOk } from './human.js';
import { htmlToMarkdown, wantsMarkdown } from './markdown.js';
export { Store } from './store.js';

const RAW = new WeakSet(); // app responses we must not touch
let seeded = false;
const store = (env) => env.STORE.get(env.STORE.idFromName('site'));

async function ensureSeed(st) {
  if (seeded) return;
  await st.seed(seedPosts());
  seeded = true;
}

function withHeaders(res, prod, extra = {}) {
  const h = new Headers(res.headers);
  if (!h.has('X-Content-Type-Options')) h.set('X-Content-Type-Options', 'nosniff');
  if (!h.has('Referrer-Policy')) h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!h.has('X-Frame-Options')) h.set('X-Frame-Options', 'SAMEORIGIN');
  // Safe baseline that cannot break analytics or Turnstile: no plugins, no <base> hijack, no framing by other sites.
  if (!h.has('Content-Security-Policy')) h.set('Content-Security-Policy', "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests");
  if (!h.has('Permissions-Policy')) h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), usb=()');
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (!prod) h.set('X-Robots-Tag', 'noindex, nofollow');
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
const html = (body, status = 200, cache = 'public, max-age=0, s-maxage=300') => new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache } });
const text = (body, type) => new Response(body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=600' } });
const redirect = (to, status = 301) => new Response(null, { status, headers: { Location: to, 'Cache-Control': status === 301 ? 'public, max-age=86400' : 'no-store' } });

function notFound(prod) {
  return html(page({
    path: '/404', title: 'Page not found | WorldDigital.ai', description: 'This page could not be found.', noindex: true, prod,
    body: `<section class="sec"><div class="wrap" style="max-width:760px"><div class="eyebrow">404</div><h1 class="h" style="font-size:44px;margin-top:10px">We couldn’t find that page.</h1>
<p class="muted" style="font-size:18px">It may have moved. Try one of these:</p><p style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px"><a class="btn red" href="/">Home</a><a class="btn ghost" href="/services">Services</a><a class="btn ghost" href="/blog">Blog</a></p></div></section>`,
  }), 404, 'no-store');
}

// The old customer app is retired. Its sign-in addresses get a clear page instead of the dead app's error.
const PORTAL = ['/login', '/signup', '/dashboard', '/account', '/forgot-password', '/reset-password', '/onboarding', '/billing', '/settings'];
function portalPage(prod) {
  return html(page({
    path: '/login', title: 'Customer portal | WorldDigital.ai', description: 'Sign-in for WorldDigital.ai customers.', noindex: true, prod, cta: false,
    body: `<section class="sec"><div class="wrap" style="max-width:760px"><div class="eyebrow">Customer portal</div><h1 class="h" style="font-size:42px;margin-top:10px">Our customer portal is being rebuilt.</h1>
<p class="muted" style="font-size:18px;line-height:1.6">Your plan, reports and billing aren’t affected. For anything you need right now, message us and we’ll reply within one business day.</p>
<p style="display:flex;flex-wrap:wrap;gap:12px;margin-top:22px"><a class="btn ghost" href="/tools">Start free</a><a class="btn ghost" href="mailto:support@worlddigital.ai">Email support@worlddigital.ai</a><a class="btn ghost" href="/help">Help center</a></p></div></section>`,
  }), 200, 'no-store');
}

const SECURITY_TXT = `Contact: mailto:support@worlddigital.ai
Expires: 2027-10-20T00:00:00.000Z
Preferred-Languages: en
Canonical: https://worlddigital.ai/.well-known/security.txt
`;

function sitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  // Real change dates: stamping every page with today teaches Google to ignore lastmod.
  const mod = (p) => (p === '/social' && SOCIAL_UPDATED ? SOCIAL_UPDATED.slice(0, 10) : PAGES[p]?.sitemap?.lastmod || UPDATED);
  const img = (u) => `<image:image><image:loc>${u}</image:loc></image:image>`;
  const urls = Object.entries(PAGES).filter(([, o]) => o.sitemap !== null && !o.noindex).map(([p, o]) => `<url><loc>${SITE}${p === '/' ? '/' : p}</loc><lastmod>${mod(p)}</lastmod><changefreq>${o.sitemap?.changefreq || 'monthly'}</changefreq><priority>${o.sitemap?.priority || '0.5'}</priority>${img(`${SITE}/og.png`)}</url>`);
  urls.push(`<url><loc>${SITE}/blog</loc><lastmod>${(posts[0]?.updated_at || today).slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  // Blog topic pages (/blog?topic=...) are indexable with their own title and canonical, so list them too.
  const topics = new Map();
  for (const p of posts) if (p.category) { const k = String(p.category).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); const d = (p.updated_at > p.published_at ? p.updated_at : p.published_at).slice(0, 10); if (k && (!topics.has(k) || topics.get(k) < d)) topics.set(k, d); }
  for (const [k, d] of topics) urls.push(`<url><loc>${SITE}/blog?topic=${k}</loc><lastmod>${d}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`);
  for (const p of posts) urls.push(`<url><loc>${SITE}/blog/${p.slug}</loc><lastmod>${(p.updated_at > p.published_at ? p.updated_at : p.published_at).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${p.cover_id ? img(`${SITE}/media/${p.cover_id}`) : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
}

function llms(posts, full) {
  const list = posts.slice(0, 40).map((p) => `- [${p.title}](${SITE}/blog/${p.slug}) — ${p.description || p.excerpt || ''}`).join('\n');
  const topics = Object.entries(PAGES).filter(([, o]) => o.keywords).map(([p, o]) => `- ${SITE}${p === '/' ? '/' : p} — ${o.keywords}`).join('\n');
  return `${full ? LLMS_FULL : LLMS}\n## Topics by page (search terms each page answers)\n${topics}\n\n## Blog posts\n${list}\n`;
}

async function pingIndexNow(env, urls) {
  if (!urls.length) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'worlddigital.ai', key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: urls }),
    });
  } catch (e) { console.log('IndexNow failed', e.message); }
}
async function pingNew(env) {
  const st = store(env);
  const slugs = await st.unpinged();
  if (!slugs.length) return;
  await pingIndexNow(env, [...slugs.map((s) => `${SITE}/blog/${s}`), `${SITE}/blog`, `${SITE}/sitemap.xml`]);
  await st.markPinged(slugs);
}

async function siteBackup(req, env, url) {
  const j = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  const want = env.TOOLS_API_TOKEN || '';
  const got = req.headers.get('x-internal-token') || '';
  const [a, b] = await Promise.all([sha256(want), sha256(got)]);
  if (!want || a !== b) return j({ error: 'Forbidden' }, 403);
  const part = url.searchParams.get('part') || 'data';
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const s = store(env);
  if (req.method === 'GET') return j(part === 'media' ? { offset, items: await s.exportMedia(offset, 10) } : await s.exportData());
  if (req.method === 'POST') {
    const body = await req.json().catch(() => null);
    return j(part === 'media' ? { added: await s.importMedia(body && body.items) } : { added: await s.importData(body) });
  }
  return j({ error: 'GET or POST' }, 405);
}

async function formSubmit(req, env, ctx, kind) {
  const isJson = (req.headers.get('Accept') || '').includes('json');
  const reply = (ok, message, status = 200) => isJson
    ? new Response(JSON.stringify({ ok, message }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
    : html(page({ path: '/thanks', title: 'Thank you | WorldDigital.ai', description: message, noindex: true, body: `<section class="sec"><div class="wrap" style="max-width:720px"><h1 class="h" style="font-size:38px">${ok ? 'Thank you!' : 'Something went wrong'}</h1><p style="font-size:18px">${esc(message)}</p><p><a class="btn red" href="/">Back to home</a></p></div></section>` }), status, 'no-store');
  const url = new URL(req.url);
  const o = req.headers.get('Origin');
  if (o && o !== url.origin) return reply(false, 'Please submit the form from our website.', 403);
  let f; try { f = await req.formData(); } catch { return reply(false, 'Please fill in the form and try again.', 400); }
  if (String(f.get('company_site') || '')) return reply(true, 'Thanks! We got it.'); // honeypot: quietly ignore bots
  if (!(await humanOk(env, String(f.get('cf-turnstile-response') || ''), req.headers.get('CF-Connecting-IP') || ''))) return reply(false, 'Please complete the quick human check and try again.', 403);
  const g = (k, n = 300) => String(f.get(k) || '').trim().slice(0, n);
  const email = g('email', 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply(false, 'Please enter a valid email address.', 400);
  let data, subject, message;
  if (kind === 'contact') {
    data = { name: g('name', 120), email, company: g('company', 160), website: g('website', 200), topic: g('topic', 120), message: g('message', 4000) };
    if (!data.name || !data.topic || !data.message) return reply(false, 'Please fill in your name, topic and message.', 400);
    subject = `Contact: ${data.topic} (${data.name}${data.company ? `, ${data.company}` : ''})`;
    message = 'Thanks! Your message is on its way. We reply within one business day.';
  } else if (kind === 'waitlist') {
    data = { business: g('business', 120), email };
    if (!data.business) return reply(false, 'Please enter your business name.', 400);
    subject = `Autopilot early list: ${data.business}`;
    message = 'You’re on the early list. We’ll email you when Social & Email Autopilot opens.';
  } else {
    data = { first_name: g('first_name', 80), last_name: g('last_name', 80), email, phone: g('phone', 40), position: g('position', 120),
      experience: g('experience', 40), linkedin: g('linkedin'), portfolio: g('portfolio'), why: g('why', 3000) };
    if (!data.first_name || !data.last_name || !data.position || !data.experience || !data.why) return reply(false, 'Please fill in all the required fields.', 400);
    subject = `Job application: ${data.first_name} ${data.last_name} (${data.position})`;
    message = 'Thanks for applying! We read every application and reply within 5 business days.';
  }
  const ipHash = await sha256(`${req.headers.get('CF-Connecting-IP') || ''}|wd`);
  const ok = await store(env).addLead(kind, data, ipHash.slice(0, 32));
  if (!ok) return reply(false, 'We already received several submissions from you. Please email support@worlddigital.ai instead.', 429);
  const rows = Object.entries(data).map(([k, v]) => `<tr><td style="padding:6px 12px;color:#4A5B70">${esc(k)}</td><td style="padding:6px 12px">${esc(v)}</td></tr>`).join('');
  ctx.waitUntil(sendEmail(env, env.NOTIFY_EMAIL || 'support@worlddigital.ai', subject,
    `<div style="font-family:Arial,sans-serif;font-size:15px"><p>New website form entry from worlddigital.ai.</p><table>${rows}</table><p><a href="${SITE}/blog-admin/leads">See all entries</a></p></div>`, kind === 'contact' ? email : undefined));
  return reply(true, message);
}

async function handle(req, env, ctx) {
  const url = new URL(req.url);
  const prod = PROD_HOSTS.has(url.hostname);
  const path = url.pathname;
  const passthrough = async () => {
    if (!prod) return redirect(`${SITE}${path}${url.search}`, 302);
    const r = await fetch(req);
    RAW.add(r);
    return r;
  };

  if (path.length > 1 && path.endsWith('/') && !path.startsWith('/api/')) {
    const clean = path.replace(/\/+$/, '');
    if (PAGES[clean] || clean.startsWith('/blog')) return redirect(clean + url.search);
  }
  // Old blog subdomain (if routed here): send each post to its new address.
  if (url.hostname === 'blog.worlddigital.ai') {
    const slug = path.replace(/^\/+|\/+$/g, '').split('/').pop() || '';
    return redirect(/^[a-z0-9-]+$/.test(slug) && !/sitemap|feed|author|tag|category|wp-/.test(slug) ? `${SITE}/blog/${slug}` : `${SITE}/blog`);
  }
  // Links copied with trailing punctuation, e.g. "/murfreesboro):" from Markdown lists.
  if (/[):.,;'"\]>]+$/.test(path) && path.length > 1) {
    const clean = path.replace(/[):.,;'"\]>]+$/, '') || '/';
    if (clean !== path) return redirect(clean + url.search);
  }
  if (path === '/favicon.svg') return redirect('/icon.svg');
  const lower = path.toLowerCase();
  if (REDIRECTS[lower]) return redirect(REDIRECTS[lower] + url.search);
  if (path !== lower && (PAGES[lower] || lower.startsWith('/blog'))) return redirect(lower + url.search);

  // Paid keyword/content tools: Python API in backend/ (Cloud Run + MongoDB).
  if (lower.startsWith('/api/tools/')) return toolsProxy(req, env, url);
  // Public knowledge API (answers from our own pages, with sources): docs/rag.md
  if (lower === '/api/rag/answer') return ragAnswer(req, env);
  if (lower === '/api/stripe/webhook') return stripeWebhook(req, env);

  // Old customer app: retired. LEGACY_APP=1 sends these addresses to it again.
  const legacy = env.LEGACY_APP === '1';
  if (isAppPath(lower)) {
    if (legacy) return passthrough();
    if ((req.method === 'GET' || req.method === 'HEAD') && PORTAL.some((p) => lower === p || lower.startsWith(`${p}/`))) return portalPage(prod);
    if (lower.startsWith('/api/')) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    return notFound(prod);
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    if (PAGES[path]) {
      // Paid tools show only once the Python API is configured (TOOLS_API_URL).
      const o = PAGES[path].tool && env.TOOLS_API_URL ? { ...PAGES[path], body: withTool(PAGES[path].body, PAGES[path].tool) } : PAGES[path];
      const schema = [].concat(o.schema || []);
      const faq = faqSchema(o.body);
      if (faq) schema.push(faq);
      return html(page({ ...o, path, schema, prod }));
    }
    if (path === '/robots.txt') return text(prod ? ROBOTS : 'User-agent: *\nDisallow: /\n', 'text/plain; charset=utf-8');
    if (path === `/${INDEXNOW_KEY}.txt`) return text(INDEXNOW_KEY, 'text/plain; charset=utf-8');
    if (path === '/.well-known/security.txt' || path === '/security.txt') return text(SECURITY_TXT, 'text/plain; charset=utf-8');
    // Merged blog topic: the old "AI & Marketing" topic page moves to "AI Marketing".
    if (path === '/blog' && url.searchParams.get('topic') === 'ai-and-marketing') return redirect('/blog?topic=ai-marketing');
    if (['/sitemap.xml', '/sitemap.txt', '/llms.txt', '/llms-full.txt', '/blog', '/blog/feed.xml'].includes(path) || path.startsWith('/blog/')) {
      const st = store(env);
      await ensureSeed(st);
      const posts = await st.listPosts();
      if (path === '/sitemap.xml') return text(sitemap(posts), 'application/xml; charset=utf-8');
      if (path === '/sitemap.txt') return text([...sitemap(posts).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !u.includes('/media/')).join('\n') + '\n', 'text/plain; charset=utf-8');
      if (path === '/llms.txt') return text(llms(posts, false), 'text/plain; charset=utf-8');
      if (path === '/llms-full.txt') return text(llms(posts, true), 'text/plain; charset=utf-8');
      if (path === '/blog/feed.xml') return text(feed(posts), 'application/rss+xml; charset=utf-8');
      if (path === '/blog') {
        const topic = (url.searchParams.get('topic') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
        return html(blogIndex(posts, { category: topic || null, prod }), 200, 'public, max-age=0, s-maxage=60');
      }
      const slug = decodeURIComponent(path.slice(6)).toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug)) return redirect('/blog'); // old WordPress addresses (tags, feeds, sitemaps)
      const p = await st.getPost(slug);
      if (p?.redirect) return redirect(`/blog/${p.redirect}`);
      if (!p) return redirect('/blog'); // retired post from the old site: the blog, not a dead end
      if (!p.live) return notFound(prod);
      return html(blogPost(p, posts, { prod }), 200, 'public, max-age=0, s-maxage=60');
    }
    const media = /^\/media\/([a-f0-9]{20})(?:\.(?:mp4|jpg|png|webp))?$/.exec(path);
    if (media) {
      const m = await store(env).getMedia(media[1]);
      if (!m) return new Response('Not found', { status: 404 });
      return new Response(m.bytes, { headers: { 'Content-Type': m.type, 'Cache-Control': 'public, max-age=31536000, immutable', 'Content-Security-Policy': "default-src 'none'" } });
    }
  }

  if (path === '/blog-admin' || path.startsWith('/blog-admin/')) {
    const st = store(env);
    await ensureSeed(st);
    return handleAdmin(req, env, url, st, ctx, { pingNow: () => pingNew(env), prod });
  }
  if (req.method === 'POST' && path === '/api/site/waitlist') return formSubmit(req, env, ctx, 'waitlist');
  if (req.method === 'POST' && path === '/api/site/apply') return formSubmit(req, env, ctx, 'apply');
  if (req.method === 'POST' && path === '/api/site/contact') return formSubmit(req, env, ctx, 'contact');
  // Backup (backup.yml): GET ?part=data | ?part=media&offset=N; POST the same to restore (adds missing rows only).
  // Needs the backend token; sign-in secrets and sessions are never included.
  if (path === '/api/site/backup') return siteBackup(req, env, url);
  // The Mercury plan sign-up was retired (SEO plan is paid by Stripe link): answer 410 Gone.
  if (path === '/api/site/plan') return new Response(JSON.stringify({ ok: false, message: 'This sign-up has moved. See https://worlddigital.ai/ai-seo-pricing.' }), { status: 410, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

  // Anything else: our own 404 (the old app only when LEGACY_APP=1).
  if (prod && legacy) return passthrough();
  return notFound(prod);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const prod = PROD_HOSTS.has(url.hostname);
    if (url.hostname === 'www.worlddigital.ai') return redirect(`${SITE}${url.pathname}${url.search}`);
    // Edge cache for pages built from the blog database (blog, sitemap, llms.txt, feed): crawlers get them
    // without a database round trip. Signed-in editors (cookie) always get a fresh copy.
    const cacheable = prod && req.method === 'GET' && !req.headers.get('Cookie') && !wantsMarkdown(req) &&
      (/^\/blog(\/|$)/.test(url.pathname) || ['/sitemap.xml', '/sitemap.txt', '/llms.txt', '/llms-full.txt'].includes(url.pathname) ||
       // static marketing pages (same HTML for everyone): served from the edge for 5 minutes, like the blog
       (!url.search && !!PAGES[url.pathname] && !PAGES[url.pathname].noindex));
    const cache = caches.default;
    if (cacheable) {
      const hit = await cache.match(req.url);
      if (hit) return hit;
    }
    try {
      const res = await handle(req, env, ctx);
      // Responses from the app pass through unchanged.
      if (RAW.has(res)) return res;
      let out = withHeaders(res, prod);
      // AI agents asking for Markdown get the same page as clean Markdown.
      if (wantsMarkdown(req) && out.status === 200 && (out.headers.get('Content-Type') || '').startsWith('text/html')) {
        const md = htmlToMarkdown(await out.text(), url.origin + url.pathname);
        out = withHeaders(new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300', Vary: 'Accept' } }), prod);
        return out;
      }
      if (cacheable && out.status === 200) ctx.waitUntil(cache.put(req.url, out.clone()));
      return out;
    } catch (e) {
      console.log('error', e.stack || e.message);
      return withHeaders(html('<!doctype html><title>Error</title><p style="font-family:sans-serif;padding:40px">Something went wrong. Please try again in a moment, or email support@worlddigital.ai.</p>', 500, 'no-store'), prod);
    }
  },
  async scheduled(event, env, ctx) {
    if (env.PING_SEARCH === '1') ctx.waitUntil(pingNew(env));
    ctx.waitUntil(store(env).autopilotTick().catch((e) => console.log('autopilot tick', e.message)));
  },
};
