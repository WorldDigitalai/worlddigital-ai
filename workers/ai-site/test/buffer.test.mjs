import test from 'node:test';
import assert from 'node:assert/strict';
import { gqlLiteral, buildInputs, shareToBuffer, channelsOf } from '../src/buffer.js';

const CH = JSON.stringify({ '6acc2f87778b240e2fdfccfb': 'linkedin', '6acc2ffb778b240e2fdfcf19': 'facebook', '6acc2fdf778b240e2fdfcea3': 'instagram',
  '6ad042d2778b240e2f128689': 'twitter', '6ad04365778b240e2f1299e1': 'googlebusiness', '6ad04526778b240e2f12ad54': 'tiktok', '6ad04301778b240e2f128cef': 'youtube' });
const texts = { linkedin: 'LI', facebook: 'FB', instagram: 'IG "quoted"', x: 'X https://worlddigital.ai/blog/a', google: 'GBP', tiktok: 'TT' };

test('GraphQL literal: enums unquoted, strings escaped', () => {
  const s = gqlLiteral({ mode: 'shareNow', text: 'He said "hi"\nok', metadata: { facebook: { type: 'post' } }, n: 1, b: true });
  assert.equal(s, '{mode: shareNow, text: "He said \\"hi\\"\\nok", metadata: {facebook: {type: post}}, n: 1, b: true}');
  assert.throws(() => gqlLiteral({ mode: 'x } evil' }));
});

test('one input per channel with the right format; YouTube skipped', () => {
  const ins = buildInputs(channelsOf({ BUFFER_CHANNELS: CH }), { url: 'https://worlddigital.ai/blog/a', title: 'A', texts, imageUrl: 'https://worlddigital.ai/media/abc' });
  const by = Object.fromEntries(ins.map((x) => [x.svc, x.input]));
  assert.deepEqual(Object.keys(by).sort(), ['facebook', 'googlebusiness', 'instagram', 'linkedin', 'tiktok', 'twitter']);
  assert.equal(by.instagram.assets[0].image.url, 'https://worlddigital.ai/media/abc');
  assert.equal(by.instagram.metadata.instagram.shouldShareToFeed, true);
  assert.equal(by.facebook.metadata.facebook.linkAttachment.url, 'https://worlddigital.ai/blog/a');
  assert.equal(by.googlebusiness.metadata.google.detailsWhatsNew.button, 'learn_more');
  assert.ok(ins.every((x) => x.input.schedulingType === 'automatic' && x.input.mode === 'shareNow'));
  // No image: Instagram and TikTok can't be posted
  const noImg = buildInputs(channelsOf({ BUFFER_CHANNELS: CH }), { url: 'u', title: 'A', texts, imageUrl: null }).map((x) => x.svc);
  assert.ok(!noImg.includes('instagram') && !noImg.includes('tiktok'));
});

test('shareToBuffer posts each channel and reports per-channel results', async () => {
  const orig = globalThis.fetch, sent = [];
  globalThis.fetch = async (u, init) => {
    const q = JSON.parse(init.body).query; sent.push(q);
    assert.equal(init.headers.Authorization, 'Bearer tok');
    if (q.includes('6ad042d2778b240e2f128689')) return new Response(JSON.stringify({ data: { createPost: { message: 'Queue limit reached' } } }));
    return new Response(JSON.stringify({ data: { createPost: { post: { id: 'p1', status: 'sending' } } } }));
  };
  try {
    const r = await shareToBuffer({ BUFFER_API_TOKEN: 'tok', BUFFER_CHANNELS: CH }, { url: 'https://worlddigital.ai/blog/a', title: 'A', texts, imageUrl: 'https://worlddigital.ai/media/abc' });
    assert.equal(sent.length, 6);
    assert.ok(sent[0].startsWith('mutation { createPost(input: {channelId: "'));
    assert.equal(r.linkedin.ok, true); assert.equal(r.twitter.ok, false); assert.match(r.twitter.error, /Queue limit/);
    assert.match(r.youtube.error, /video/);
  } finally { globalThis.fetch = orig; }
  assert.deepEqual(await shareToBuffer({}, {}), { skipped: 'BUFFER_API_TOKEN is not set' });
});

test('with a video: YouTube Short and TikTok video (sound is checked by the backend)', () => {
  const v = 'https://worlddigital.ai/media/0123456789abcdef0123.mp4';
  const ins = buildInputs(channelsOf({ BUFFER_CHANNELS: CH }), { url: 'https://worlddigital.ai/blog/a', title: 'Local SEO guide', texts, imageUrl: 'https://worlddigital.ai/media/abc', videoUrl: v });
  const by = Object.fromEntries(ins.map((x) => [x.svc, x.input]));
  assert.equal(by.youtube.assets[0].video.url, v);
  assert.equal(by.youtube.metadata.youtube.title, 'Local SEO guide #Shorts');
  assert.equal(by.youtube.metadata.youtube.categoryId, '28');
  assert.ok(by.youtube.text.includes('https://worlddigital.ai/blog/a'));
  assert.equal(by.tiktok.assets[0].video.url, v);
  assert.equal(by.instagram.assets[0].image.url, 'https://worlddigital.ai/media/abc');
  assert.ok(gqlLiteral(by.youtube).includes('video: {url: "' + v + '"'));
});
