// Shares new blog posts to every connected Buffer channel (Buffer GraphQL API, https://api.buffer.com).
// Secret: BUFFER_API_TOKEN (Buffer > Settings > API). Channels: BUFFER_CHANNELS var, JSON {channelId: service}.
// YouTube needs a video, so it is skipped for blog posts.

const API = 'https://api.buffer.com';

// JSON -> GraphQL input literal. Keys listed in ENUM_KEYS are written unquoted (GraphQL enums).
const ENUM_KEYS = new Set(['schedulingType', 'mode', 'type', 'button']);
export function gqlLiteral(v, key = '') {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return '[' + v.map((x) => gqlLiteral(x)).join(', ') + ']';
  if (typeof v === 'object') return '{' + Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => `${k}: ${gqlLiteral(x, k)}`).join(', ') + '}';
  if (typeof v === 'string' && ENUM_KEYS.has(key)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v)) throw new Error('bad enum ' + v);
    return v;
  }
  return JSON.stringify(v);
}

export function channelsOf(env) {
  try { const o = JSON.parse(env.BUFFER_CHANNELS || '{}'); return Object.entries(o).filter(([id, svc]) => /^[a-f0-9]{24}$/.test(id) && typeof svc === 'string'); }
  catch { return []; }
}

// One createPost input per channel. texts: {linkedin, facebook, instagram, x, google, tiktok}
export function buildInputs(channels, { url, title, texts, imageUrl, mode = 'shareNow' }) {
  const base = (channelId) => ({ channelId, schedulingType: 'automatic', mode });
  const img = imageUrl ? [{ image: { url: imageUrl, metadata: { altText: `Illustration for ${title}`.slice(0, 200) } } }] : null;
  const link = { url, title };
  const out = [];
  for (const [id, svc] of channels) {
    if (svc === 'linkedin') out.push({ svc, input: { ...base(id), text: texts.linkedin, metadata: { linkedin: { linkAttachment: link } } } });
    else if (svc === 'facebook') out.push({ svc, input: { ...base(id), text: texts.facebook, metadata: { facebook: { type: 'post', linkAttachment: link } } } });
    else if (svc === 'twitter') out.push({ svc, input: { ...base(id), text: texts.x } });
    else if (svc === 'googlebusiness') out.push({ svc, input: { ...base(id), text: texts.google, ...(img ? { assets: img } : {}),
      metadata: { google: { type: 'whats_new', detailsWhatsNew: { button: 'learn_more', link: url } } } } });
    else if (svc === 'instagram' && img) out.push({ svc, input: { ...base(id), text: texts.instagram, assets: img, metadata: { instagram: { type: 'post', shouldShareToFeed: true, isAiGenerated: true } } } });
    else if (svc === 'tiktok' && img) out.push({ svc, input: { ...base(id), text: texts.tiktok, assets: img, metadata: { tiktok: { title: title.slice(0, 90) } } } });
  }
  return out;
}

export async function createPost(env, input) {
  const query = `mutation { createPost(input: ${gqlLiteral(input)}) { ... on PostActionSuccess { post { id status } } ... on MutationError { message } } }`;
  const r = await fetch(API, { method: 'POST', body: JSON.stringify({ query }), signal: AbortSignal.timeout(60000),
    headers: { Authorization: `Bearer ${env.BUFFER_API_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'WorldDigitalBlog/1.0' } });
  let d; try { d = await r.json(); } catch { return { ok: false, error: `Buffer answered ${r.status}` }; }
  if (d.errors) return { ok: false, error: d.errors.map((e) => e.message).join('; ').slice(0, 300) };
  const c = d.data && d.data.createPost;
  if (c && c.post) return { ok: true, id: c.post.id, status: c.post.status };
  return { ok: false, error: (c && c.message) || `Buffer answered ${r.status}` };
}

export async function shareToBuffer(env, opts) {
  if (!env.BUFFER_API_TOKEN) return { skipped: 'BUFFER_API_TOKEN is not set' };
  const chans = channelsOf(env);
  if (!chans.length) return { skipped: 'No Buffer channels configured' };
  const results = {};
  for (const { svc, input } of buildInputs(chans, opts)) results[svc] = await createPost(env, input);
  for (const [, svc] of chans) if (!results[svc]) results[svc] = { ok: false, error: svc === 'youtube' ? 'Skipped: YouTube needs a video' : 'Skipped: needs an image' };
  return results;
}
