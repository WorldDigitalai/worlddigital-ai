import test from 'node:test';
import assert from 'node:assert/strict';
import { aiPanelHtml, aiPanelClient, COMPETITORS } from '../src/ai-panel.js';
import { callAi, cleanAutopilot, nextLocalHour, slugify, AUTOPILOT_DEFAULTS } from '../src/autopilot.js';

test('callAi posts to the admin API with the token', async () => {
  const seen = {};
  const orig = globalThis.fetch;
  globalThis.fetch = async (u, init) => { Object.assign(seen, { u, init }); return new Response('{"ideas":[]}', { status: 200 }); };
  try {
    const r = await callAi({ TOOLS_API_URL: 'https://api.test/', TOOLS_API_TOKEN: 'tok' }, 'research', { topic: 'ai seo' });
    assert.deepEqual(r, { ideas: [] });
    assert.equal(seen.u, 'https://api.test/api/admin/blog/research');
    assert.equal(seen.init.headers['x-internal-token'], 'tok');
    globalThis.fetch = async () => new Response('<html>oops</html>', { status: 503 });
    await assert.rejects(callAi({ TOOLS_API_URL: 'https://api.test' }, 'draft', {}), /busy/);
    globalThis.fetch = async () => new Response('{"error":"Pick an idea"}', { status: 400 });
    await assert.rejects(callAi({ TOOLS_API_URL: 'https://api.test' }, 'draft', {}), /Pick an idea/);
  } finally { globalThis.fetch = orig; }
  await assert.rejects(callAi({}, 'draft', {}), /being set up/);
});

test('autopilot settings, schedule and slugs', () => {
  const c = cleanAutopilot({ enabled: 1, every_days: '3.5', hour: 9, mode: 'x', topics: 'AI SEO, Local SEO,, GEO', competitors: ['HubSpot'], words: 99 });
  assert.equal(c.enabled, true); assert.equal(c.every_days, 3.5); assert.equal(c.mode, 'publish');
  assert.deepEqual(c.topics, ['AI SEO', 'Local SEO', 'GEO']); assert.equal(c.words, AUTOPILOT_DEFAULTS.words);
  assert.equal(cleanAutopilot({ mode: 'draft', every_days: 5 }).every_days, 2);
  const t = nextLocalHour(Date.parse('2026-11-02T20:00:00Z'), 9); // 2pm Houston -> next day 9am CST = 15:00Z
  assert.equal(new Date(t).toISOString(), '2026-11-03T15:00:00.000Z');
  assert.equal(slugify('WorldDigital.ai vs HubSpot: Which Is Best?'), 'worlddigital-ai-vs-hubspot-which-is-best');
});

test('panel lists competitors and its browser code parses', () => {
  const h = aiPanelHtml();
  for (const n of ['HubSpot', 'Fiverr', 'Semrush', 'BrightLocal']) assert.ok(h.includes(`data-comp="${n}"`));
  assert.ok(Object.values(COMPETITORS).flat().length >= 25);
  assert.doesNotThrow(() => new Function(`(${aiPanelClient.toString()})`));
});
