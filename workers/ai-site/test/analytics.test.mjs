import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, deviceOf, browserOf, visitFrom } from '../src/analytics.js';
import { analyticsPage } from '../src/admin.js';

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
  for (const id of ['rtnum', 'rtbars', 'tiles', 'main', 'pages', 'channels', 'countries', 'devices', 'browsers']) assert.ok(h.includes(`id="${id}"`), id);
  assert.ok(h.includes('<script nonce="nonce123">') && h.includes('/blog-admin/analytics/data') && h.includes('Last 30 days'));
});
