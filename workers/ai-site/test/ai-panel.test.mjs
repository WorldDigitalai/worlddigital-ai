import test from 'node:test';
import assert from 'node:assert/strict';
import { aiProxy, aiPanelHtml, aiPanelClient, COMPETITORS } from '../src/ai-panel.js';

test('AI proxy forwards to the admin API with the token, not the public tools path', async () => {
  const seen = {};
  const orig = globalThis.fetch;
  globalThis.fetch = async (u, init) => { Object.assign(seen, { u, init }); return new Response('{"ideas":[]}', { status: 200 }); };
  try {
    const req = new Request('https://worlddigital.ai/blog-admin/ai/research', { method: 'POST', body: '{"topic":"ai seo"}' });
    const r = await aiProxy(req, { TOOLS_API_URL: 'https://api.test/', TOOLS_API_TOKEN: 'tok' }, 'research');
    assert.equal(r.status, 200);
    assert.equal(seen.u, 'https://api.test/api/admin/blog/research');
    assert.equal(seen.init.headers['x-internal-token'], 'tok');
    assert.equal(JSON.parse(seen.init.body).topic, 'ai seo');
  } finally { globalThis.fetch = orig; }
});

test('AI proxy: not configured, bad body, upstream errors', async () => {
  const req = () => new Request('https://worlddigital.ai/blog-admin/ai/draft', { method: 'POST', body: '{}' });
  assert.equal((await aiProxy(req(), {}, 'draft')).status, 503);
  const bad = new Request('https://worlddigital.ai/blog-admin/ai/draft', { method: 'POST', body: 'nope' });
  assert.equal((await aiProxy(bad, { TOOLS_API_URL: 'https://api.test' }, 'draft')).status, 400);
  const orig = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html>oops</html>', { status: 503 });
  try {
    const r = await aiProxy(req(), { TOOLS_API_URL: 'https://api.test' }, 'draft');
    assert.equal(r.status, 503);
    assert.match((await r.json()).error, /busy/);
  } finally { globalThis.fetch = orig; }
});

test('panel lists competitors and its browser code parses', () => {
  const h = aiPanelHtml();
  for (const n of ['HubSpot', 'Fiverr', 'Semrush', 'BrightLocal']) assert.ok(h.includes(`data-comp="${n}"`));
  assert.ok(Object.values(COMPETITORS).flat().length >= 25);
  assert.doesNotThrow(() => new Function(`(${aiPanelClient.toString()})`));
});
