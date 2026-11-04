// Background AI jobs for the blog editor, run inside the Store Durable Object's alarm (up to 15 min per run,
// so long drafts never hit a request timeout). Kinds:
//   research  -> tools API /api/admin/blog/research
//   draft     -> tools API /api/admin/blog/draft; with input.publish the post is published right away
//   autopilot -> research the next topic, pick the best idea not written yet, draft it, publish or save it,
//                email the editor. Runs on the schedule in the 'autopilot' settings.
// validate and sendEmail come from admin.js, passed in as deps (keeps this module importable in tests).

export const AUTOPILOT_DEFAULTS = {
  enabled: false, every_days: 2, hour: 9, mode: 'publish', topics: [], competitors: [], country: 'us', words: 1600,
  mix_vs: true, runs: 0, used: [], last_run: null, next_run: null,
};
const ORIGIN = 'https://worlddigital.ai';
// With no topics set, Autopilot rotates through what we sell, one per day, and picks what is trending in each.
export const DEFAULT_TOPICS = ['AI SEO', 'Generative engine optimization', 'Local SEO', 'Google Ads', 'Answer engine optimization',
  'Keyword research', 'AI content marketing', 'Custom software', 'AI automation for small business', 'Website design', 'EHR integration', ''];

export async function callAi(env, which, body) {
  if (!env.TOOLS_API_URL) throw new Error('The AI assistant is being set up. Please try again later.');
  let r;
  try {
    r = await fetch(env.TOOLS_API_URL.replace(/\/$/, '') + '/api/admin/blog/' + which, {
      method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(295000),
      headers: { 'content-type': 'application/json', 'x-internal-token': env.TOOLS_API_TOKEN || '' },
    });
  } catch { throw new Error('The AI service took too long or is busy. Please try again in a minute.'); }
  const text = await r.text();
  let o; try { o = JSON.parse(text); } catch { o = { error: 'The AI service is busy right now. Please try again in a minute.' }; }
  if (!r.ok) throw new Error(o.error || 'The AI service had a problem. Please try again.');
  return o;
}

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
}

// Next time it is `hour`:00 in Houston (America/Chicago), at or after `after` (ms).
export function nextLocalHour(after, hour = 9) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hourCycle: 'h23' });
  let t = Math.ceil(after / 3600e3) * 3600e3;
  for (let i = 0; i < 72; i++, t += 3600e3) if (Number(f.format(new Date(t))) === hour) return t;
  return after + 86400e3;
}

export function cleanAutopilot(input, prev = AUTOPILOT_DEFAULTS) {
  const s = (v, n) => String(v ?? '').trim().slice(0, n);
  const list = (v, n, len) => (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => s(x, len)).filter(Boolean).slice(0, n);
  const every = Number(input.every_days);
  return {
    ...prev,
    enabled: !!input.enabled,
    every_days: [1, 2, 3.5, 7].includes(every) ? every : prev.every_days,
    hour: Number.isInteger(Number(input.hour)) && input.hour >= 0 && input.hour <= 23 ? Number(input.hour) : prev.hour,
    mode: input.mode === 'draft' ? 'draft' : 'publish',
    topics: list(input.topics, 12, 60), competitors: list(input.competitors, 6, 40),
    country: input.country === 'ca' ? 'ca' : 'us',
    words: [1000, 1600, 2200].includes(Number(input.words)) ? Number(input.words) : prev.words,
    mix_vs: input.mix_vs !== false,
  };
}

function uniqueSlug(store, base) {
  let slug = base || 'post', n = 2;
  while (store.slugTaken(slug)) slug = `${base.slice(0, 74)}-${n++}`;
  return slug;
}

// Save an AI draft as a post. action: 'publish' | 'save'.
export function savePost(store, d, action, who, { validate }) {
  const v = validate({ action, title: d.title, slug: uniqueSlug(store, slugify(d.slug || d.title)), category: d.category,
    excerpt: d.excerpt, body: d.body, seo_title: d.seo_title, description: d.description });
  if (v.error) throw new Error(v.error);
  const r = store.savePost(v, who);
  if (r.error) throw new Error('Could not save the post (' + r.error + ').');
  return r;
}

async function notify(env, subject, html, sendEmail) {
  const to = String(env.ADMIN_EMAILS || '').split(',').map((x) => x.trim()).filter(Boolean)[0];
  if (to) await sendEmail(env, to, subject, `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0E1A2B">${html}<p style="color:#4A5B70;font-size:13px">Change or turn off Autopilot in the blog editor: ${ORIGIN}/blog-admin/new (AI assistant tab).</p></div>`).catch(() => {});
}
const escH = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Word overlap between two titles (0..1). Ideas this close to an existing post are the same article reworded.
const STOP = new Set(['a', 'an', 'and', 'the', 'for', 'of', 'to', 'in', 'on', 'with', 'vs', 'how', 'what', 'your', 'best', 'top', 'guide', '2025', '2026', '2027']);
const words = (t) => new Set(String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)));
export function titleSimilarity(a, b) {
  const x = words(a), y = words(b);
  if (!x.size || !y.size) return 0;
  let both = 0;
  for (const w of x) if (y.has(w)) both++;
  return both / Math.min(x.size, y.size);
}
export const DUPLICATE_AT = 0.75;
const isDuplicate = (title, existing) => existing.some((t) => titleSimilarity(title, t) >= DUPLICATE_AT);

export async function runAutopilot(store, env, cfg, deps) {
  const n = cfg.runs || 0;
  const list = cfg.topics.length ? cfg.topics : DEFAULT_TOPICS;
  const topic = list[n % list.length];
  const r = await callAi(env, 'research', { topic, country: cfg.country, competitors: cfg.competitors });
  const used = new Set(cfg.used || []);
  const existing = store.listPosts({ all: true }).map((p) => p.title);
  const cands = (r.ideas || []).filter((i) => i.title && !used.has(i.keyword) && !store.slugTaken(slugify(i.title)) && !isDuplicate(i.title, existing));
  const preferVs = cfg.mix_vs && n % 2 === 1;
  const pick = (preferVs && cands.find((i) => i.type === 'vs' || i.type === 'alternatives')) || cands[0];
  if (!pick) return { skipped: true, topic, message: 'No new idea this time (all top ideas were already written).' };
  const d = await callAi(env, 'draft', { title: pick.title, keyword: pick.keyword, type: pick.type,
    competitors: pick.competitors, country: cfg.country, words: cfg.words });
  if (isDuplicate(d.title, existing)) return { skipped: true, topic, message: `Skipped: the draft "${d.title}" repeats an existing post.` };
  const saved = savePost(store, d, cfg.mode === 'publish' ? 'publish' : 'save', 'autopilot', deps);
  const live = cfg.mode === 'publish';
  let social = null;
  if (live && store.queueShare) {
    // Mark it shared now so the cron sweep doesn't pick it up too, then share inline so the email can say how it went.
    await store.queueShare(saved.slug);
    try { social = await store.sharePost(saved.slug); store.sql.exec(`UPDATE ai_jobs SET state='done', result=?, updated=? WHERE kind='share' AND state='queued' AND input=?`, JSON.stringify(social), Date.now(), JSON.stringify({ slug: saved.slug })); }
    catch (e) { social = { error: e.message }; }
  }
  const socialHtml = !social ? '' : social.error ? `<p>Sharing to Buffer failed: ${escH(social.error)}</p>` : social.results && social.results.skipped ? `<p>Buffer: ${escH(social.results.skipped)}</p>`
    : `<p>Shared to Buffer: ${Object.entries(social.results || {}).map(([k, v]) => `${escH(k)} ${v.ok ? '✓' : '✗ ' + escH(v.error || '')}`).join(' · ')}</p>`;
  await notify(env, live ? `New blog post published: ${d.title}` : `New blog draft ready: ${d.title}`,
    `<p>Autopilot ${live ? 'published' : 'wrote a draft of'} <b>${escH(d.title)}</b> (topic: ${escH(topic || 'trending across our services')}, keyword: ${escH(pick.keyword)}).</p>
<p>${escH(pick.why || '')}</p><p><a href="${ORIGIN}/blog-admin/edit/${encodeURIComponent(saved.slug)}">Review or edit it</a>${live ? ` · <a href="${ORIGIN}/blog/${encodeURIComponent(saved.slug)}">See it live</a>` : ''}</p>${socialHtml}`, deps.sendEmail);
  return { title: d.title, slug: saved.slug, status: saved.status, keyword: pick.keyword, topic, type: pick.type,
    social: social && social.results ? Object.fromEntries(Object.entries(social.results).filter(([k]) => k !== 'skipped').map(([k, v]) => [k, !!v.ok])) : social };
}
