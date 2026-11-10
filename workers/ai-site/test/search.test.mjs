import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchPage } from '../src/search.js';
import { internalAi } from '../src/ai.js';

const store = new Map();
globalThis.caches = { default: { match: async (k) => store.get(k.url)?.clone(), put: async (k, r) => { store.set(k.url, r); } } };
const ctx = { waitUntil: (p) => p };
const req = (u) => new Request(u, { headers: { 'CF-Connecting-IP': '1.2.3.4' } });

test('search page renders backend results, escapes and highlights, and is noindex', async () => {
  const realFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (u, o) => {
    sent = { u, o };
    return new Response(JSON.stringify({ method: 'hybrid', results: [
      { url: 'https://worlddigital.ai/local-seo-services', title: 'Local SEO <b>services</b>', snippet: 'We help local businesses rank in Maps.' },
      { url: 'https://evil.example/x', title: 'Not ours', snippet: 'x' }] }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const env = { TOOLS_API_URL: 'https://api.test', TOOLS_API_TOKEN: 't' };
    const url = new URL('https://worlddigital.ai/search?q=local%20seo%20%3Cscript%3E');
    const res = await searchPage(req(url), env, url, ctx, true);
    const html = await res.text();
    assert.equal(res.headers.get('X-Robots-Tag'), 'noindex');
    assert.match(html, /noindex, nofollow/);
    assert.ok(html.includes('href="/local-seo-services"'));
    assert.ok(!html.includes('evil.example'));
    assert.ok(html.includes('<mark>Local</mark> <mark>SEO</mark> &lt;b&gt;services&lt;/b&gt;'));
    assert.ok(!html.includes('<script>"'), 'query is not injected raw');
    assert.ok(html.includes('\\u003cscript>'), 'query in the answer script is escaped');
    assert.equal(sent.u, 'https://api.test/api/rag/site-search');
    assert.equal(JSON.parse(sent.o.body).query, 'local seo <script>');
    assert.equal(sent.o.headers['cf-connecting-ip'], '1.2.3.4');
    // second request is served from the edge cache
    globalThis.fetch = async () => { throw new Error('should be cached'); };
    const again = await (await searchPage(req(url), env, url, ctx, true)).text();
    assert.ok(again.includes('href="/local-seo-services"'));
  } finally { globalThis.fetch = realFetch; }
});

test('search falls back to page titles when the backend is down; empty query shows suggestions', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('down', { status: 502 });
  try {
    const url = new URL('https://worlddigital.ai/search?q=keyword+research+tool');
    const html = await (await searchPage(req(url), { TOOLS_API_URL: 'https://api.test' }, url, ctx, true)).text();
    assert.match(html, /page titles only/);
    assert.match(html, /href="\/services\/keyword-research"/);
    const empty = new URL('https://worlddigital.ai/search');
    const e = await (await searchPage(req(empty), {}, empty, ctx, true)).text();
    assert.match(e, /Search WorldDigital\.ai/);
    assert.match(e, /\/search\?q=local%20SEO/);
    assert.ok(!e.includes('Get an AI answer'));
  } finally { globalThis.fetch = realFetch; }
});

test('internal AI endpoint: token, model allowlist, embed and rerank', async () => {
  const calls = [];
  const env = { TOOLS_API_TOKEN: 'secret', AI: { run: async (m, i) => {
    calls.push([m, i]);
    return m.includes('reranker') ? { response: [{ id: 1, score: 0.9 }, { id: 0, score: 0.2 }] } : { data: i.text.map(() => [0.1, 0.2]) };
  } } };
  const post = (body, token = 'secret') => internalAi(new Request('https://worlddigital.ai/api/internal/ai', {
    method: 'POST', headers: { 'x-internal-token': token }, body: JSON.stringify(body) }), env);
  assert.equal((await post({ op: 'embed', texts: ['a'] }, 'wrong')).status, 403);
  assert.equal((await post({ op: 'embed', model: '@cf/meta/llama-3-8b', texts: ['a'] })).status, 400);
  assert.equal((await post({ op: 'embed', texts: [] })).status, 400);
  const e = await (await post({ op: 'embed', texts: ['a', 'b'] })).json();
  assert.equal(e.vectors.length, 2);
  assert.equal(calls[0][0], '@cf/baai/bge-m3');
  assert.equal(calls[0][1].truncate_inputs, true);
  const r = await (await post({ op: 'rerank', query: 'q', texts: ['x', 'y'] })).json();
  assert.deepEqual(r.scores, [0.2, 0.9]);
});

test('official profile links are the same everywhere (footer, structured data, About, Help, llms.txt)', async () => {
  const { SOCIAL } = await import('../src/layout.js');
  const { readFile } = await import('node:fs/promises');
  const about = await readFile(new URL('../src/pages/about.html', import.meta.url), 'utf8');
  const help = await readFile(new URL('../src/pages/help.html', import.meta.url), 'utf8');
  const llms = await readFile(new URL('../src/crawl-text.js', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/layout.js', import.meta.url), 'utf8');
  assert.equal(SOCIAL.length, 8);
  for (const [name, url] of SOCIAL) {
    for (const [where, text] of [['about', about], ['help', help], ['llms', llms]]) assert.ok(text.includes(url), `${name} missing on ${where}`);
    if (name !== 'Google Business Profile' && name !== 'Snapchat') assert.ok(layout.split(url).length >= 3, `${name} not in footer`);
  }
  assert.ok(!/facebook\.com\/worlddigitalai|youtube\.com\/@worlddigitalai|linkedin\.com\/company\/worlddigitalai/.test(layout + about + help), 'old unverified links remain');
});
