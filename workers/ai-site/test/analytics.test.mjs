import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, deviceOf, browserOf, visitFrom, windowOf, buildReport, buildRealtime, trackHit } from '../src/analytics.js';
import { analyticsPage, analyticsData } from '../src/admin.js';

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const html = (status = 200, type = 'text/html; charset=utf-8') => new Response('x', { status, headers: { 'Content-Type': type } });
const req = (path = '/', h = {}, cf = { country: 'US' }) => {
  const r = new Request('https://worlddigital.ai' + path, { headers: { 'User-Agent': CHROME, 'Sec-Fetch-Dest': 'document', 'CF-Connecting-IP': '1.2.3.4', ...h } });
  Object.defineProperty(r, 'cf', { value: cf }); return r;
};
const visit = (path, h, res = html(), cf) => { const r = req(path, h, cf); return visitFrom(r, new URL(r.url), res, {}); };

test('channels: search, AI assistants, social, paid, email, direct, own site, other sites', () => {
  const c = (ref, q = '') => classify(ref, new URLSearchParams(q), 'worlddigital.ai');
  assert.equal(c('www.google.com'), 'search'); assert.equal(c('duckduckgo.com'), 'search');
  assert.equal(c('chatgpt.com'), 'ai'); assert.equal(c('perplexity.ai'), 'ai'); assert.equal(c('gemini.google.com'), 'ai');   // AI wins over "google"
  assert.equal(c('linkedin.com'), 'social'); assert.equal(c('t.co'), 'social');
  assert.equal(c('', 'gclid=abc'), 'paid'); assert.equal(c('google.com', 'utm_medium=cpc'), 'paid');
  assert.equal(c('', 'utm_medium=email'), 'email'); assert.equal(c(''), 'direct');
  assert.equal(c('worlddigital.ai'), 'internal'); assert.equal(c('example.org'), 'referral');
});

test('device and browser', () => {
  assert.equal(deviceOf(CHROME), 'desktop'); assert.equal(deviceOf(IPHONE), 'mobile'); assert.equal(deviceOf('Mozilla/5.0 (iPad; CPU OS 18_0)'), 'tablet');
  assert.equal(browserOf(CHROME), 'Chrome'); assert.equal(browserOf(IPHONE), 'Safari'); assert.equal(browserOf(CHROME + ' Edg/130.0'), 'Edge'); assert.equal(browserOf('Mozilla/5.0 Firefox/131.0'), 'Firefox');
});

test('a real page view is counted with country, device, channel and a daily anonymous id', async () => {
  const v = await visit('/services/', { Referer: 'https://www.google.com/' });
  assert.equal(v.path, '/services'); assert.equal(v.country, 'US'); assert.equal(v.device, 'desktop'); assert.equal(v.channel, 'search'); assert.equal(v.ref, 'google.com');
  assert.match(v.vid, /^[0-9a-f]{16}$/); assert.ok(!JSON.stringify(v).includes('1.2.3.4'), 'the IP address is never stored');
  assert.equal((await visit('/services', { 'User-Agent': IPHONE })).device, 'mobile');
  assert.equal((await visit('/', {}, html(), {})).country, 'XX');
  assert.equal((await visit('/x', { Referer: 'https://worlddigital.ai/' })).ref, '');   // our own site is not a "referrer"
});

test('not counted: bots, non-browser requests, prefetch, the owner, admin/api paths, errors and non-pages', async () => {
  assert.equal(await visit('/', { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }), null);
  assert.equal(await visit('/', { 'User-Agent': CHROME + ' HeadlessChrome/130' }), null);
  assert.equal(await visit('/', { 'Sec-Fetch-Dest': 'empty' }), null);
  assert.equal(await visit('/', { 'Sec-Purpose': 'prefetch' }), null);
  assert.equal(await visit('/', { Cookie: '__Host-wd_editor=abc' }), null);
  for (const p of ['/blog-admin/kb', '/api/tools/health', '/cdn-cgi/speculation']) assert.equal(await visit(p), null, p);
  assert.equal(await visit('/', {}, html(404)), null); assert.equal(await visit('/app.js', {}, html(200, 'application/javascript')), null);
  const post = new Request('https://worlddigital.ai/', { method: 'POST', headers: { 'User-Agent': CHROME, 'Sec-Fetch-Dest': 'document' } });
  assert.equal(await visitFrom(post, new URL(post.url), html(), {}), null);
});

test('the analytics page loads its script and never trusts data inline', async () => {
  const res = analyticsPage('nonce123', { email: 'a@b.c', csrf: 'x' });
  const h = await res.text();
  assert.match(res.headers.get('Content-Security-Policy'), /script-src 'nonce-nonce123'/);
  for (const id of ['rtnum', 'rtbars', 'tiles', 'main', 'pages', 'channels', 'countries', 'devices', 'browsers', 'svc', 'collectnow']) assert.ok(h.includes(`id="${id}"`), id);
  assert.ok(h.includes('<script nonce="nonce123">') && h.includes('/blog-admin/analytics/data') && h.includes('Last 30 days') && h.includes('/blog-admin/analytics/providers') && h.includes('Connected services'));
});


const DAY = 864e5, OFF = -6 * 36e5;   // US Central in winter
const row = (ts, o = {}) => ({ ts, path: '/', ref: '', channel: 'direct', country: 'US', device: 'desktop', browser: 'Chrome', vid: 'a', ...o });

test('report: totals, per-day visitors, previous period and top lists from rows read once', () => {
  const now = Date.UTC(2026, 10, 20, 18, 0, 0);                     // 12:00 Central, Nov 20
  const w = windowOf(now, '7d', OFF);
  assert.equal(w.n, 7); assert.equal(w.to - w.from, 7 * DAY); assert.equal(w.pFrom, w.from - 7 * DAY);
  const rows = [
    row(now - 1000, { vid: 'a', path: '/' }), row(now - 2000, { vid: 'a', path: '/blog' }), row(now - 3000, { vid: 'b', path: '/', channel: 'ai', ref: 'chatgpt.com' }),
    row(now - 2 * DAY, { vid: 'a', path: '/' }),                      // same person, another day: counts as a visitor again
    row(now - 8 * DAY, { vid: 'z', path: '/old' }),                   // previous period
  ];
  const r = buildReport(rows, w, now);
  assert.deepEqual(r.totals, { pv: 4, v: 3 }); assert.deepEqual(r.prevTotals, { pv: 1, v: 1 });
  assert.equal(r.series.length, 7); assert.equal(r.series.reduce((a, x) => a + x.pv, 0), 4); assert.equal(r.series[6].pv, 3); assert.equal(r.series[6].v, 2);
  assert.equal(r.prev.reduce((a, x) => a + x.pv, 0), 1);
  assert.deepEqual(r.pages[0], { k: '/', pv: 3, v: 3 }); assert.deepEqual(r.channels.find((c) => c.k === 'ai'), { k: 'ai', pv: 1, v: 1 });
  assert.deepEqual(r.referrers, [{ k: 'chatgpt.com', pv: 1, v: 1 }]);   // empty referrers (direct visits) are left out
  assert.equal(windowOf(now, 'today', OFF).n, 24); assert.equal(windowOf(now, '90d', OFF).n, 90);
});

test('realtime: users per minute over 30 minutes, 5-minute users, top pages', () => {
  const now = Date.UTC(2026, 10, 20, 18, 0, 30);
  const rows = [row(now - 20e3, { vid: 'a', path: '/x' }), row(now - 40e3, { vid: 'a', path: '/x' }), row(now - 3 * 60e3, { vid: 'b', path: '/y' }), row(now - 20 * 60e3, { vid: 'c', path: '/x' })];
  const r = buildRealtime(rows, [], now);
  assert.equal(r.minutes.length, 30); assert.equal(r.users30, 3); assert.equal(r.users5, 2);
  assert.equal(r.minutes[29].u, 1); assert.equal(r.minutes.reduce((a, m) => a + m.pv, 0), 4); assert.equal(r.pages[0].k, '/x'); assert.equal(r.pages[0].pv, 3);
});

test('the Analytics page cannot use up the database allowance: history is cached, the live strip is read at most every 10 s', async () => {
  let reports = 0, lives = 0;
  const store = { report: async (r) => ({ range: r, n: ++reports }), realtime: async () => ({ users30: ++lives }) };
  const t0 = Date.now() + 10 * 3600e3;                              // a fresh moment, so earlier tests' cache does not interfere
  for (let i = 0; i < 40; i++) await analyticsData(store, '30d', t0 + i * 1000);   // one open tab polling every second for 40 s
  assert.equal(reports, 1, 'history is read once, not on every refresh'); assert.ok(lives <= 4, `live strip read ${lives} times in 40 s`);
  await analyticsData(store, '30d', t0 + 31 * 60e3);                // history older than 30 minutes is read again
  assert.equal(reports, 2);
  const d = await analyticsData(store, '7d', t0); assert.equal(d.range, '7d'); assert.ok('rt' in d && 'cached_s' in d);
});

test('Refresh now: skips the cache once, then is throttled for 15 s', async () => {
  let reports = 0, lives = 0;
  const store = { report: async () => ({ n: ++reports }), realtime: async () => ({ users30: ++lives }) };
  const t0 = Date.now() + 50 * 3600e3;
  await analyticsData(store, '7d', t0);
  const a = await analyticsData(store, '7d', t0 + 1000, true); assert.equal(reports, 2); assert.equal(a.throttled, false);   // fresh: history read again
  const b = await analyticsData(store, '7d', t0 + 4000, true); assert.equal(reports, 2); assert.equal(b.throttled, true);     // spam-clicking costs nothing
  const c = await analyticsData(store, '7d', t0 + 17000, true); assert.equal(reports, 3); assert.equal(c.throttled, false);
  const h = await analyticsPage('n', { email: 'a@b.c', csrf: 'x' }).text(); assert.ok(h.includes('id="refresh"') && h.includes('Refresh now'));
});

test('hits are written in batches: the first at once, a burst together, never one database call per page view', async () => {
  const batches = [], store = () => ({ recordHits: async (b) => { batches.push(b.length); } });
  const jobs = [], ctx = { waitUntil: (p) => jobs.push(p) };
  const mk = () => { const r = req('/p'); return [r, new URL(r.url), html()]; };
  for (let i = 0; i < 12; i++) { const [r, u, res] = mk(); trackHit(r, {}, ctx, u, res, store); }
  await Promise.all(jobs);
  assert.equal(batches.length, 1, 'only the first hit is written at once'); assert.equal(batches[0], 1);
});

test('database down: pages come back from the last good copy, or from the bundled posts, instead of a 500', async () => {
  const worker = (await import('../src/index.js')).default;
  const mem = new Map();
  globalThis.caches = { default: { match: async (k) => { const r = mem.get(k); return r ? r.clone() : undefined; }, put: async (k, r) => { mem.set(k, r); } } };
  const env = { STORE: { idFromName: () => 'x', get: () => new Proxy({}, { get: () => async () => { throw new Error('Exceeded allowed rows read in Durable Objects free tier.'); } }) } };
  const go = (path) => worker.fetch(new Request('https://worlddigital.ai' + path), env, { waitUntil() {} });
  // 1. nothing cached: the bundled posts answer, uncached, marked as a fallback
  const idx = await go('/blog');
  assert.equal(idx.status, 200); assert.equal(idx.headers.get('X-Fallback'), '1'); assert.equal(idx.headers.get('Cache-Control'), 'no-store');
  assert.match(await idx.text(), /<h1|<title>/i);
  const map = await go('/sitemap.xml'); assert.equal(map.status, 200);
  const slug = [...(await map.text()).matchAll(/<loc>https:\/\/worlddigital\.ai\/blog\/([a-z0-9-]+)<\/loc>/g)][0][1];
  const post = await go('/blog/' + slug); assert.equal(post.status, 200); assert.equal(post.headers.get('X-Fallback'), '1');
  const missing = await go('/blog/a-post-written-after-the-bundle'); assert.equal(missing.status, 503); assert.equal(missing.headers.get('Retry-After'), '300');
  assert.equal(mem.size, 0, 'fallback pages are never cached over a good copy');
  // 2. a spare good copy exists: it is preferred
  mem.set('https://worlddigital.ai/blog/some-cached-post?__stale=1', new Response('<html>last good post</html>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
  const old = await go('/blog/some-cached-post'); assert.equal(old.status, 200); assert.match(await old.text(), /last good post/);
  // 3. pages that need the database for real (admin) still answer with the error page
  const adm = await go('/blog-admin/login'); assert.equal(adm.status, 503); assert.equal(adm.headers.get('Retry-After'), '300');
});

test('devices by source: each visitor counted once per day under its source and device', () => {
  const now = Date.UTC(2026, 10, 20, 18, 0, 0), w = windowOf(now, '7d', OFF);
  const rows = [
    row(now - 1000, { vid: 'a', channel: 'search', device: 'desktop' }), row(now - 2000, { vid: 'a', channel: 'search', device: 'desktop' }),
    row(now - 3000, { vid: 'b', channel: 'search', device: 'mobile' }), row(now - 4000, { vid: 'c', channel: 'social', device: 'mobile' }),
  ];
  const d = buildReport(rows, w, now).deviceByChannel;
  assert.deepEqual(d[0], { k: 'search', v: 2, desktop: 1, mobile: 1, tablet: 0 });
  assert.deepEqual(d[1], { k: 'social', v: 1, desktop: 0, mobile: 1, tablet: 0 });
});
