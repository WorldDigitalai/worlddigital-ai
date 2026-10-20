// worlddigital.ai company site (Cloudflare Worker).
// Owns the public marketing pages, blog and blog editor. Everything else (login, dashboard, /api, sign-up,
// Stripe webhooks, app assets) passes straight through to the existing worlddigital.ai app.
import { page, faqSchema, esc, SITE } from './layout.js';
import { PAGES, REDIRECTS } from './pages.js';
import { blogIndex, blogPost, feed, seedPosts } from './blog.js';
import { handleAdmin, sendEmail, sha256 } from './admin.js';
import { ROBOTS, LLMS, LLMS_FULL } from './crawl-text.js';
import { INDEXNOW_KEY, PROD_HOSTS, isAppPath } from './routing.js';
import { toolsProxy } from './tools-proxy.js';
import { withTool } from './tools-widget.js';
import { humanOk } from './human.js';
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
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (!prod) h.set('X-Robots-Tag', 'noindex, nofollow');
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
const html = (body, status = 200, cache = 'public, max-age=0, s-maxage=300') => new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache } });
const text = (body, type) => new Response(body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' } });
const redirect = (to, status = 301) => new Response(null, { status, headers: { Location: to, 'Cache-Control': status === 301 ? 'public, max-age=86400' : 'no-store' } });

function notFound(prod) {
  return html(page({
    path: '/404', title: 'Page not found | WorldDigital.ai', description: 'This page could not be found.', noindex: true, prod,
    body: `<section class="sec"><div class="wrap" style="max-width:760px"><div class="eyebrow">404</div><h1 class="h" style="font-size:44px;margin-top:10px">We couldn’t find that page.</h1>
<p class="muted" style="font-size:18px">It may have moved. Try one of these:</p><p style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px"><a class="btn red" href="/">Home</a><a class="btn ghost" href="/services">Services</a><a class="btn ghost" href="/blog">Blog</a></p></div></section>`,
  }), 404, 'no-store');
}

function sitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const img = (u) => `<image:image><image:loc>${u}</image:loc></image:image>`;
  const urls = Object.entries(PAGES).filter(([, o]) => o.sitemap !== null && !o.noindex).map(([p, o]) => `<url><loc>${SITE}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod><changefreq>${o.sitemap?.changefreq || 'monthly'}</changefreq><priority>${o.sitemap?.priority || '0.5'}</priority>${img(`${SITE}/og.png`)}</url>`);
  urls.push(`<url><loc>${SITE}/blog</loc><lastmod>${(posts[0]?.updated_at || today).slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  for (const p of posts) urls.push(`<url><loc>${SITE}/blog/${p.slug}</loc><lastmod>${(p.updated_at > p.published_at ? p.updated_at : p.published_at).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${p.cover_id ? img(`${SITE}/media/${p.cover_id}`) : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
}

function llms(posts, full) {
  const list = posts.slice(0, 40).map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description || p.excerpt || ''}`).join('\n');
  const topics = Object.entries(PAGES).filter(([, o]) => o.keywords).map(([p, o]) => `- ${SITE}${p === '/' ? '/' : p}: ${o.keywords}`).join('\n');
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
  if (kind === 'waitlist') {
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
    `<div style="font-family:Arial,sans-serif;font-size:15px"><p>New website form entry from worlddigital.ai.</p><table>${rows}</table><p><a href="${SITE}/blog-admin/leads">See all entries</a></p></div>`));
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
  const lower = path.toLowerCase();
  if (REDIRECTS[lower]) return redirect(REDIRECTS[lower] + url.search);

  // Paid keyword/content tools: Python API in backend/ (Cloud Run + MongoDB).
  if (lower.startsWith('/api/tools/')) return toolsProxy(req, env, url);

  // Customer app: untouched.
  if (isAppPath(lower)) return passthrough();

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
    if (['/sitemap.xml', '/llms.txt', '/llms-full.txt', '/blog', '/blog/feed.xml'].includes(path) || path.startsWith('/blog/')) {
      const st = store(env);
      await ensureSeed(st);
      const posts = await st.listPosts();
      if (path === '/sitemap.xml') return text(sitemap(posts), 'application/xml; charset=utf-8');
      if (path === '/llms.txt') return text(llms(posts, false), 'text/plain; charset=utf-8');
      if (path === '/llms-full.txt') return text(llms(posts, true), 'text/plain; charset=utf-8');
      if (path === '/blog/feed.xml') return text(feed(posts), 'application/rss+xml; charset=utf-8');
      if (path === '/blog') {
        const topic = (url.searchParams.get('topic') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
        return html(blogIndex(posts, { category: topic || null, prod }), 200, 'public, max-age=0, s-maxage=60');
      }
      const slug = decodeURIComponent(path.slice(6)).toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug)) return notFound(prod);
      const p = await st.getPost(slug);
      if (p?.redirect) return redirect(`/blog/${p.redirect}`);
      if (!p || !p.live) return notFound(prod);
      return html(blogPost(p, posts, { prod }), 200, 'public, max-age=0, s-maxage=60');
    }
    const media = /^\/media\/([a-f0-9]{20})$/.exec(path);
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

  // Anything else belongs to the existing app (or is a 404 on the preview address).
  if (prod) return passthrough();
  return notFound(prod);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const prod = PROD_HOSTS.has(url.hostname);
    if (url.hostname === 'www.worlddigital.ai') return redirect(`${SITE}${url.pathname}${url.search}`);
    try {
      const res = await handle(req, env, ctx);
      // Responses from the app pass through unchanged.
      if (RAW.has(res)) return res;
      return withHeaders(res, prod);
    } catch (e) {
      console.log('error', e.stack || e.message);
      return withHeaders(html('<!doctype html><title>Error</title><p style="font-family:sans-serif;padding:40px">Something went wrong. Please try again in a moment, or email support@worlddigital.ai.</p>', 500, 'no-store'), prod);
    }
  },
  async scheduled(event, env, ctx) {
    if (env.PING_SEARCH === '1') ctx.waitUntil(pingNew(env));
  },
};
