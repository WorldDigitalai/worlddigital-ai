import test from 'node:test';
import assert from 'node:assert/strict';
import { ROBOTS, LLMS, LLMS_FULL, SITEMAP } from '../src/files.js';
import worker from '../src/index.js';

test('robots.txt is one group, so AI bots also respect the private-area Disallows', () => {
  const groups = ROBOTS.split(/\n\s*\n/).filter((g) => /^User-agent:/m.test(g));
  assert.equal(groups.length, 1);
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Googlebot']) {
    assert.match(ROBOTS, new RegExp(`^User-agent: ${bot}$`, 'm'));
  }
  for (const p of ['/dashboard/', '/api/', '/login', '/subscribe']) assert.match(ROBOTS, new RegExp(`^Disallow: ${p}$`, 'm'));
  assert.match(ROBOTS, /^Sitemap: https:\/\/worlddigital\.ai\/sitemap\.xml$/m);
});

test('no social-platform service pages and no old $49.99 plans', () => {
  const all = LLMS + LLMS_FULL + SITEMAP;
  for (const p of ['meta-ads-agency', 'facebook-ads-management', 'instagram-marketing', 'tiktok-ads-agency', 'snapchat-ads-agency', 'linkedin-ads-agency', 'x-ads-agency', 'youtube-shorts-marketing<', 'tiktok-marketing', 'snapchat-marketing<']) {
    assert.ok(!all.includes(`/${p}`), p);
  }
  assert.ok(!all.includes('49.99'));
});

test('sitemap is valid-looking XML with absolute URLs', () => {
  assert.match(SITEMAP, /^<\?xml version="1.0"/);
  const locs = [...SITEMAP.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 15);
  assert.ok(locs.every((u) => u.startsWith('https://worlddigital.ai/')));
  assert.equal(new Set(locs).size, locs.length);
});

test('worker serves the four files with the right types', async () => {
  for (const [p, type] of [['/robots.txt', 'text/plain'], ['/llms.txt', 'text/plain'], ['/llms-full.txt', 'text/plain'], ['/sitemap.xml', 'application/xml']]) {
    const r = await worker.fetch(new Request(`https://worlddigital.ai${p}`));
    assert.equal(r.status, 200);
    assert.ok(r.headers.get('Content-Type').startsWith(type));
  }
});

test('retired social pages 301 to /services (with or without slash, query kept)', async () => {
  for (const p of ['/meta-ads-agency', '/services/meta-ads', '/services/Image-Generator/', '/tiktok-marketing/', '/X-ADS-AGENCY', '/youtube-shorts-marketing?utm_source=x']) {
    const r = await worker.fetch(new Request(`https://worlddigital.ai${p}`));
    assert.equal(r.status, 301, p);
    assert.ok(r.headers.get('Location').startsWith('https://worlddigital.ai/services'), p);
  }
  const r = await worker.fetch(new Request('https://worlddigital.ai/youtube-shorts-marketing?utm_source=x'));
  assert.equal(r.headers.get('Location'), 'https://worlddigital.ai/services?utm_source=x');
});

test('blog posts about social platforms are not redirected', async () => {
  const { RETIRED } = await import('../src/index.js');
  for (const p of ['/blog/tiktok-vs-instagram-ads', '/blog/snapchat-marketing-strategies', '/blog/youtube-shorts-marketing-guide']) {
    assert.ok(!RETIRED.includes(p));
  }
});
