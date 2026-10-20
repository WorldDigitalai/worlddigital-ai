import test from 'node:test';
import assert from 'node:assert/strict';
import { withTool, toolWidget } from '../src/tools-widget.js';
import { toolsProxy } from '../src/tools-proxy.js';

test('widget goes right after the hero section', () => {
  const body = '<section>hero</section><section>steps</section>';
  const out = withTool(body, 'keywords');
  assert.ok(out.indexOf('id="tool"') > out.indexOf('hero') && out.indexOf('id="tool"') < out.indexOf('steps'));
  assert.ok(out.includes('Get 3 free keywords') && out.includes('$9.99'));
  assert.ok(toolWidget('content').includes('Which platform is it for?') && toolWidget('content').includes('$24.99'));
  assert.ok(!toolWidget('keywords').includes('</script></script>'));
});

test('/api/tools answers 503 when the API is not configured', async () => {
  const r = await toolsProxy(new Request('https://worlddigital.ai/api/tools/keywords/preview', { method: 'POST', body: '{}' }), {}, new URL('https://worlddigital.ai/api/tools/keywords/preview'));
  assert.equal(r.status, 503);
});

test('proxy forwards path, body, token and visitor IP', async () => {
  const seen = {};
  const orig = globalThis.fetch;
  globalThis.fetch = async (u, init) => { Object.assign(seen, { u, init }); return new Response('{"ok":1}', { headers: { 'content-type': 'application/json' } }); };
  try {
    const req = new Request('https://worlddigital.ai/api/tools/order?session=cs_test_1', { headers: { 'CF-Connecting-IP': '9.9.9.9' } });
    const r = await toolsProxy(req, { TOOLS_API_URL: 'https://api.test/', TOOLS_API_TOKEN: 'tok' }, new URL(req.url));
    assert.equal(r.status, 200);
    assert.equal(seen.u, 'https://api.test/api/tools/order?session=cs_test_1');
    assert.equal(seen.init.headers.get('x-internal-token'), 'tok');
    assert.equal(seen.init.headers.get('cf-connecting-ip'), '9.9.9.9');
  } finally { globalThis.fetch = orig; }
});
