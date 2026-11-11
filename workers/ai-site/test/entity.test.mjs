// 2026-11-10 audit: one connected entity graph, one company identity, no retired prices.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { page, ORG, WEBSITE, IDENTITY, SITE } from '../src/layout.js';
import { PAGES } from '../src/pages.js';
import { LLMS, LLMS_FULL } from '../src/crawl-text.js';
import { authorNode, byline } from '../src/blog.js';
import { PRICE_FIX_2026_11 } from '../src/price-fix.js';

const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const render = (path) => page({ ...PAGES[path], path, prod: true });
const types = (n) => [].concat(n['@type']);

test('every indexable page carries the Organization, WebSite and one WebPage tied to both', () => {
  for (const path of ['/', '/about', '/ai-seo-agency', '/generative-engine-optimization', '/houston']) {
    const nodes = ld(render(path));
    assert.equal(nodes.filter((n) => n['@id'] === ORG['@id']).length, 1, `${path}: one Organization`);
    assert.equal(nodes.filter((n) => n['@id'] === WEBSITE['@id']).length, 1, `${path}: one WebSite`);
    const pages = nodes.filter((n) => types(n).includes('WebPage'));
    assert.equal(pages.length, 1, `${path}: one WebPage`);
    assert.equal(pages[0]['@id'], `${SITE}${path === '/' ? '/' : path}#webpage`);
    assert.deepEqual(pages[0].isPartOf, { '@id': WEBSITE['@id'] });
    assert.deepEqual(pages[0].about, { '@id': ORG['@id'] });
  }
});

test('service pages point their WebPage at the page Service, which has its own @id', () => {
  const nodes = ld(render('/ai-seo-agency'));
  const svc = nodes.find((n) => types(n).includes('Service'));
  assert.equal(svc['@id'], `${SITE}/ai-seo-agency#service`);
  assert.deepEqual(svc.provider, { '@id': ORG['@id'] });
  assert.deepEqual(nodes.find((n) => types(n).includes('WebPage')).mainEntity, { '@id': svc['@id'] });
});

test('pages that already describe themselves (ContactPage, CollectionPage) get no extra WebPage', () => {
  const nodes = ld(render('/contact'));
  assert.ok(nodes.some((n) => types(n).includes('ContactPage')));
  assert.ok(!nodes.some((n) => types(n).includes('WebPage')));
});

test('noindex pages carry no company graph', () => {
  assert.equal(ld(page({ path: '/x', title: 'x', description: 'x', body: '', noindex: true })).length, 0);
});

test('the Organization states the AI marketing identity and links founder and third-party records', () => {
  assert.equal(ORG['@type'], 'Organization');
  assert.equal(ORG.description, IDENTITY);
  assert.match(IDENTITY, /AI marketing company/);
  assert.equal(ORG.founder['@id'], 'https://worlddigital.us/#person');
  assert.ok(ORG.alternateName.includes('WorldDigital'));
  for (const u of ['crunchbase.com/organization/worlddigital-ai', 'cbinsights.com/company/worlddigitalai', 'producthunt.com/products/world-digital-ai']) {
    assert.ok(ORG.sameAs.some((s) => s.includes(u)), u);
  }
});

test('no "software company" self-description is left on key pages, metadata or llms files', () => {
  for (const path of ['/', '/about', '/contact', '/career']) {
    const html = render(path).replace(/<script[\s\S]*?<\/script>/g, '');
    assert.ok(!/\bsoftware company\b/i.test(html), `${path} still says software company`);
  }
  assert.match(PAGES['/'].title, /AI Marketing Company/);
  assert.match(PAGES['/about'].title, /AI Marketing Company/);
  assert.ok(!/software company/i.test(LLMS) && !/software company/i.test(LLMS_FULL));
  assert.match(LLMS, /^# WorldDigital\.ai — AI Marketing Company/);
  assert.match(LLMS, /Not related to World Digital \(worldigital\.com\)/);
});

test('blog authors resolve to the company or the founder, never an unlinked organization', () => {
  for (const a of [undefined, '', 'WorldDigital.ai Team', 'WorldDigital.ai']) {
    assert.equal(byline({ author: a }), 'WorldDigital.ai');
    assert.deepEqual(authorNode({ author: a }), { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'WorldDigital.ai' });
  }
  assert.equal(authorNode({ author: 'Ahmad Awwad' })['@id'], 'https://worlddigital.us/#person');
  assert.deepEqual(authorNode({ author: 'Jane Doe' }), { '@type': 'Person', name: 'Jane Doe' });
});

test('the retired $49.99 offer is gone from the blog seeds and the live-post fix covers it', () => {
  const slugs = new Set(PRICE_FIX_2026_11.map((f) => f.slug));
  assert.equal(slugs.size, 4);
  for (const s of slugs) assert.ok(PRICE_FIX_2026_11.some((f) => f.slug === s && /49\.99/.test(f.old)), `${s}: a fix removes the price`);
  for (const f of PRICE_FIX_2026_11) {
    assert.ok(!/49\.99/.test(f.new), `${f.slug}: new text has no old price`);
    const md = readFileSync(new URL(`../content/blog/${f.slug}.md`, import.meta.url), 'utf8');
    assert.ok(md.includes(f.new) && !md.includes(f.old), `${f.slug}: seed file matches the fix`);
  }
  for (const s of slugs) assert.ok(!/49\.99/.test(readFileSync(new URL(`../content/blog/${s}.md`, import.meta.url), 'utf8')));
});
