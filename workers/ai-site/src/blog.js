// Public blog: /blog, /blog/<slug>, /blog/feed.xml. Posts live in the Store (Durable Object).
import { page, esc, SITE, REPORT, crumbs } from './layout.js';
import { mdToHtml, mdToText, readMinutes, parseFrontmatter } from './md.js';
import p1 from '../content/blog/how-ai-marketing-automation-works.md';
import p2 from '../content/blog/google-ads-management-local-businesses.md';
import p3 from '../content/blog/essential-strategies-for-effective-digital-marketing-in-2026.md';
import p4 from '../content/blog/best-google-ads-automation-tool.md';
import p5 from '../content/blog/why-businesses-need-omnichannel-ads.md';
import p6 from '../content/blog/snapchat-marketing-strategies.md';
import p7 from '../content/blog/tiktok-vs-instagram-ads.md';
import p8 from '../content/blog/youtube-shorts-marketing-guide.md';

const SEED_FILES = {
  'how-ai-marketing-automation-works': p1, 'google-ads-management-local-businesses': p2,
  'essential-strategies-for-effective-digital-marketing-in-2026': p3, 'best-google-ads-automation-tool': p4,
  'why-businesses-need-omnichannel-ads': p5, 'snapchat-marketing-strategies': p6, 'tiktok-vs-instagram-ads': p7,
  'youtube-shorts-marketing-guide': p8,
};

export function seedPosts() {
  return Object.entries(SEED_FILES).map(([slug, text]) => {
    const { meta, body } = parseFrontmatter(text);
    return { slug, title: meta.title, description: meta.description, excerpt: meta.excerpt, category: meta.category, body: body.trim(),
      published_at: `${meta.date}T15:00:00.000Z` };
  });
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Chicago' });
const catSlug = (c) => String(c || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Trim to a search-snippet length at a word boundary.
const clip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; const c = t.slice(0, n - 1); return `${c.slice(0, c.lastIndexOf(' ')).replace(/[,;:\s]+$/, '')}…`; };
const cover = (p) => (p.cover_id ? `/media/${p.cover_id}` : null);

function card(p) {
  const img = cover(p);
  return `<a class="card post-card" href="/blog/${p.slug}">
${img ? `<img src="${img}" alt="${esc(p.cover_alt || p.title || '')}" loading="lazy" width="640" height="360">` : ''}
<span class="chip" style="align-self:flex-start">${esc(p.category || 'Guide')}</span>
<h2 class="h" style="font-size:21px;line-height:1.3">${esc(p.title)}</h2>
<p class="muted" style="margin:0;line-height:1.55">${esc(p.excerpt || p.description || '')}</p>
<span class="muted" style="font-size:14px;margin-top:auto">${esc(fmtDate(p.published_at))} · ${p.chars ? Math.max(1, Math.ceil(p.chars / 1250)) : readMinutes(p.body || '')} min read</span>
</a>`;
}

export function blogIndex(posts, { category, prod }) {
  const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  const shown = category ? posts.filter((p) => catSlug(p.category) === category) : posts;
  const catName = category ? cats.find((c) => catSlug(c) === category) : null;
  const filters = `<nav class="filters" aria-label="Topics"><a href="/blog"${!category ? ' aria-current="page"' : ''}>All</a>${cats.map((c) => `<a href="/blog?topic=${catSlug(c)}"${catSlug(c) === category ? ' aria-current="page"' : ''}>${esc(c)}</a>`).join('')}</nav>`;
  const body = `<section style="background:#fff;border-bottom:1px solid #DCE5EF"><div class="wrap" style="padding-top:60px;padding-bottom:44px">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / ${catName ? `<a href="/blog">Blog</a> / ${esc(catName)}` : 'Blog'}</nav>
<div class="eyebrow" style="margin-top:14px">Blog &amp; guides</div>
<h1 class="h hero-h" style="font-size:50px;line-height:1.08;margin-top:12px">${catName ? esc(catName) : 'Marketing guides for growing businesses'}</h1>
<p style="font-size:18px;line-height:1.6;color:#33445A;margin:16px 0 0;max-width:720px">Plain-English guides on SEO, AI search, Google Ads and growing a local business online.</p>
${filters}
</div></section>
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="grid3">${shown.map(card).join('') || '<p class="muted">No posts yet.</p>'}</div></div></section>`;
  return page({
    path: '/blog', canonical: category ? `${SITE}/blog?topic=${category}` : `${SITE}/blog`, prod,
    title: catName ? `${catName} Guides | WorldDigital.ai Blog` : 'Blog: SEO, AI Search & Google Ads Guides | WorldDigital.ai',
    description: catName
      ? clip(`${catName} guides for small and growing businesses: ${shown.length} plain-English article${shown.length === 1 ? '' : 's'} from the WorldDigital.ai team, with practical steps you can use today.`, 160)
      : 'Plain-English guides for local businesses on SEO, AI search visibility (AEO, GEO), Google Ads and digital marketing, from the WorldDigital.ai team.',
    schema: [{ '@context': 'https://schema.org', '@type': 'Blog', name: 'WorldDigital.ai Blog', url: `${SITE}/blog`, publisher: { '@id': `${SITE}/#org` },
      blogPost: shown.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}`, datePublished: p.published_at,
        image: cover(p) ? SITE + cover(p) : `${SITE}/og.png`, author: { '@type': 'Organization', name: p.author || 'WorldDigital.ai Team', url: `${SITE}/about` } })) },
    crumbs(catName ? [['Home', '/'], ['Blog', '/blog'], [catName, `/blog?topic=${category}`]] : [['Home', '/'], ['Blog', '/blog']])],
    body,
  });
}

export function blogPost(p, others, { prod, preview = false }) {
  const html = mdToHtml(p.body, { title: p.title });
  const minutes = readMinutes(p.body);
  const img = cover(p);
  const related = others.filter((o) => o.slug !== p.slug).sort((a, b) => (a.category === p.category ? -1 : 0) - (b.category === p.category ? -1 : 0)).slice(0, 3);
  const date = p.published_at || p.publish_at || p.updated_at;
  const body = `${preview ? '<div style="background:#FEF3C7;color:#92400E;padding:12px 16px;text-align:center;font-weight:700">Preview: this post is not live yet</div>' : ''}
<article>
<header style="background:#fff;border-bottom:1px solid #DCE5EF"><div class="wrap" style="max-width:860px;padding-top:52px;padding-bottom:36px">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a> / ${esc(p.category || 'Guide')}</nav>
<a class="chip" href="/blog?topic=${catSlug(p.category)}" style="margin-top:16px;text-decoration:none">${esc(p.category || 'Guide')}</a>
<h1 class="h" style="font-size:44px;line-height:1.12;margin-top:14px">${esc(p.title)}</h1>
${p.excerpt ? `<p style="font-size:19px;line-height:1.6;color:#33445A;margin:16px 0 0">${esc(p.excerpt)}</p>` : ''}
<p class="muted" style="margin:18px 0 0;font-size:15px">${esc(p.author || 'WorldDigital.ai Team')} · <time datetime="${esc(date)}">${esc(fmtDate(date))}</time> · ${minutes} min read</p>
</div></header>
<div class="wrap" style="max-width:860px;padding-top:36px;padding-bottom:20px">
${img ? `<img src="${img}" alt="${esc(p.cover_alt || p.title || '')}" width="1200" height="675" style="border-radius:16px;width:100%;margin-bottom:28px">` : ''}
<div class="prose">${html}</div>
<aside class="card" style="margin:40px 0 0;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;background:#0E1A2B;border-color:#0E1A2B;color:#fff">
<div style="max-width:520px"><div class="eyebrow" style="color:#93C5FD">WorldDigital.ai</div><h2 class="h" style="font-size:24px;color:#fff;margin-top:6px">Want more customers from Google and AI search?</h2><p style="color:#C9D6E6;margin:8px 0 0">SEO, AEO and GEO in one flat plan, $199.99 a month, no contract. Google Ads quoted after a short call.</p></div>
<div style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn red" href="${REPORT}">Get my free SEO report</a><a class="btn ghost" style="background:transparent;color:#fff;border-color:#93C5FD" href="/contact">Contact us</a></div>
</aside>
</div>
</article>
${related.length ? `<section class="sec" style="padding-top:40px"><div class="wrap"><div class="eyebrow">Keep reading</div><div class="grid3" style="margin-top:18px">${related.map(card).join('')}</div></div></section>` : ''}`;
  return page({
    path: `/blog/${p.slug}`, prod, noindex: preview, ogType: 'article',
    title: ((t) => (t.length <= 42 ? `${t} | WorldDigital.ai` : t))(p.seo_title || p.title), ogTitle: p.seo_title || p.title,
    description: clip(p.description || p.excerpt || mdToText(p.body), 158),
    ogImage: img ? SITE + img : undefined,
    extraHead: `<meta property="article:published_time" content="${esc(date)}"><meta property="article:modified_time" content="${esc(p.updated_at || date)}"><meta property="article:section" content="${esc(p.category || '')}">`,
    schema: [{
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description || p.excerpt || '',
      datePublished: date, dateModified: p.updated_at || date, mainEntityOfPage: `${SITE}/blog/${p.slug}`,
      image: img ? SITE + img : `${SITE}/og.png`, articleSection: p.category || undefined, wordCount: mdToText(p.body).split(' ').length,
      author: { '@type': 'Organization', name: p.author || 'WorldDigital.ai Team', url: `${SITE}/about` }, publisher: { '@id': `${SITE}/#org` },
    }, crumbs([['Home', '/'], ['Blog', '/blog'], [p.title, `/blog/${p.slug}`]])],
    body,
  });
}

export function feed(posts) {
  const x = (s) => esc(s);
  const items = posts.slice(0, 30).map((p) => `<item><title>${x(p.title)}</title><link>${SITE}/blog/${p.slug}</link><guid isPermaLink="true">${SITE}/blog/${p.slug}</guid><pubDate>${new Date(p.published_at).toUTCString()}</pubDate><category>${x(p.category || '')}</category><description>${x(p.description || p.excerpt || '')}</description></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>WorldDigital.ai Blog</title><link>${SITE}/blog</link><atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/><description>Guides on SEO, AI search and Google Ads for local businesses.</description><language>en-us</language>${items}</channel></rss>`;
}
