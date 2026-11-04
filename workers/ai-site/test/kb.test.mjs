import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kbPage } from '../src/admin.js';

const ed = { email: 'a@b.co', csrf: 'x' };
test('knowledge base page renders status, questions and customers, escaping input', async () => {
  const st = { sites: { ai: { pages: 41, chunks: 230, last_update: '2026-11-03T09:40:00Z' } }, eval: { total: 12, passed: 11, score: 92, at: '2026-11-03T09:45:00Z' },
    search_indexes: { vector: 'exists', text: 'exists' } };
  const qs = { total: 2, uncovered: 1, questions: [{ q: '<script>x</script>price?', covered: false, at: '2026-11-02T10:00:00Z', top_url: 'https://worlddigital.ai/tools' }] };
  const html = await kbPage('n', ed, st, qs, [{ id: 't1', name: 'Bayou "Dental"', website: 'https://bayoudental.com', pages: 3, docs: 1, chunks: 9 }]).text();
  assert.match(html, /41 pages · 230 chunks/);
  assert.match(html, /11\/12 passed \(92%\)/);
  assert.match(html, /meaning: exists/);
  assert.ok(!html.includes('<script>x</script>') && html.includes('&lt;script&gt;'));
  assert.match(html, /not covered/);
  assert.match(html, /data-t-del="t1"/);
  assert.ok(!html.split('</style>')[1].includes('worlddigital.us'));
});
test('empty state and backend error', async () => {
  const html = await kbPage('n', ed, { error: 'Knowledge base error' }, {}, []).text();
  assert.match(html, /not run yet/);
  assert.match(html, /No customers yet/);
  assert.match(html, /Knowledge base error/);
});
