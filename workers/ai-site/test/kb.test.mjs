import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kbPage } from '../src/admin.js';
import { htmlToMarkdown } from '../src/markdown.js';

const ed = { email: 'a@b.co', csrf: 'x' };
const st = {
  sites: { ai: { pages: 49, chunks: 209 } },
  content: { discovered: 52, website_pages: 30, blog_posts: 18, chunks: 209 },
  sync: { last_success: '2026-11-03T09:40:00Z', pending: 0, failed_30d: 1, recent_errors: ['https://worlddigital.ai/x: ReadTimeout'],
    removed_30d: ['https://worlddigital.ai/blog/old'], history: [
      { started: '2026-11-03T09:37:00Z', mode: 'incremental', trigger: 'nightly', status: 'ok', done: 49, total: 49, updated: 1, unchanged: 48, removed: 0, errors: 0, duration_ms: 41000 },
      { started: '2026-11-03T10:00:00Z', mode: 'page', trigger: 'publish', status: 'ok', url: 'https://worlddigital.ai/blog/new', errors: 0, duration_ms: 2100 }] },
  usage_30d: { searches: 120, avg_search_ms: 640, answers: 30, avg_answer_ms: 3900, public_answers: 7, embed_errors: 0 },
  config: { embedding_model: 'text-embedding-3-small', embedding_dims: 1536, chunk_tokens: 550, overlap_tokens: 80 },
  eval: { total: 23, passed: 22, score: 96, at: '2026-11-03T09:45:00Z', metrics: { retrieval_hit_rate: 100, mrr: 0.91, citation_accuracy: 95, answer_accuracy: 95, unsupported_answer_rate: 0, avg_ms: 3800, p95_ms: 6100 } },
  search_indexes: { vector: 'ready', text: 'ready' },
};

test('knowledge base page shows monitoring, history, quality metrics and escapes input', async () => {
  const qs = { total: 2, uncovered: 1, questions: [{ q: '<script>x</script>price?', covered: false, at: '2026-11-02T10:00:00Z', top_url: 'https://worlddigital.ai/tools', channel: 'api' }] };
  const html = await kbPage('n', ed, st, qs, [{ id: 't1', name: 'Bayou "Dental"', website: 'https://bayoudental.com', pages: 3, docs: 1, chunks: 9 }],
    [{ url: 'doc:onboarding-1', title: 'Onboarding <b>', chunks: 4, updated: '2026-11-01T00:00:00Z' }]).text();
  const body = html.split('</style>')[1];
  for (const s of ['Found in sitemap', '>52<', 'Blog posts', '>18<', 'Failed syncs', 'ReadTimeout', '/blog/old', '22/23', 'Made-up answers', '0%',
    'Public API answers', '>7<', 'nightly', 'one page', '/blog/new', 'meaning: ready', 'text-embedding-3-small', 'Private company knowledge', 'data-i-del="doc:onboarding-1"', 'public API'])
    assert.ok(body.includes(s), `missing ${s}`);
  assert.ok(!body.includes('<script>x</script>') && body.includes('&lt;script&gt;') && body.includes('Onboarding &lt;b&gt;'));
  assert.match(body, /data-t-del="t1"/);
  assert.ok(!body.includes('worlddigital.us'));
});

test('empty state and backend error', async () => {
  const html = await kbPage('n', ed, { error: 'Knowledge base error' }, {}, [], []).text();
  assert.match(html, /Not run yet/);
  assert.match(html, /No customers yet/);
  assert.match(html, /No private documents yet/);
  assert.match(html, /Knowledge base error/);
});

test('markdown for agents carries page metadata', () => {
  const md = htmlToMarkdown('<html lang="en"><title>Post</title><meta name="description" content="D"><link rel="canonical" href="https://worlddigital.ai/blog/x">'
    + '<script type="application/ld+json">{"@type":"BlogPosting","datePublished":"2026-10-01","dateModified":"2026-10-05","articleSection":"AI Marketing"}</script>'
    + '<main><h1>Hi</h1><p>Body</p></main>', 'https://worlddigital.ai/blog/x');
  for (const s of ['type: blog_post', 'published: 2026-10-01', 'modified: 2026-10-05', 'category: AI Marketing', 'canonical: https://worlddigital.ai/blog/x', 'language: en'])
    assert.ok(md.includes(s), s);
  const hidden = htmlToMarkdown('<html lang="en"><title>T</title><meta name="robots" content="noindex, nofollow"><main><p>x</p></main>', 'https://worlddigital.ai/tools');
  assert.ok(hidden.includes('robots: noindex') && hidden.includes('type: product_page'));
});
