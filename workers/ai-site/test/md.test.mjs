import test from 'node:test';
import assert from 'node:assert/strict';
import { mdToHtml, readMinutes, parseFrontmatter } from '../src/md.js';
import { isAppPath } from '../src/routing.js';

test('headings, lists, bold, links', () => {
  const h = mdToHtml('## Title\n\nSome **bold** and [a link](/services).\n\n- one\n- two\n\n1. a\n2. b');
  assert.match(h, /<h2 id="title">Title<\/h2>/);
  assert.match(h, /<strong>bold<\/strong>/);
  assert.match(h, /<a href="\/services">a link<\/a>/);
  assert.match(h, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(h, /<ol><li>a<\/li><li>b<\/li><\/ol>/);
});

test('escapes HTML and drops unsafe links', () => {
  const h = mdToHtml('<script>alert(1)</script> [x](javascript:alert(1)) ![i](data:image/png;base64,AAA)');
  assert.ok(!h.includes('<script>'));
  assert.ok(!h.includes('javascript:'));
  assert.ok(!h.includes('data:image'));
  assert.ok(h.includes('&lt;script&gt;'));
});

test('external links open in a new tab, own links do not', () => {
  assert.match(mdToHtml('[g](https://google.com)'), /rel="noopener" target="_blank"/);
  assert.doesNotMatch(mdToHtml('[w](https://worlddigital.ai/blog)'), /target/);
});

test('tables', () => {
  const h = mdToHtml('| A | B |\n|---|---|\n| 1 | 2 |');
  assert.match(h, /<th scope="col">A<\/th>/);
  assert.match(h, /<th scope="row">1<\/th><td>2<\/td>/);
});

test('frontmatter and reading time', () => {
  const { meta, body } = parseFrontmatter('---\ntitle: Hi: there\ndate: 2026-05-07\n---\nBody');
  assert.equal(meta.title, 'Hi: there');
  assert.equal(body, 'Body');
  assert.equal(readMinutes('word '.repeat(450)), 3);
});

test('app paths pass through, site pages do not', () => {
  for (const p of ['/login', '/dashboard', '/dashboard/x', '/api/stripe/webhook', '/signup', '/_next/static/a.js', '/subscribe']) assert.ok(isAppPath(p), p);
  for (const p of ['/', '/blog', '/services', '/about', '/api/site/waitlist', '/help']) assert.ok(!isAppPath(p), p);
});
