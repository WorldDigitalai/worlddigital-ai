// First-party visitor analytics (no cookies, no IP stored). Every real page view of a public page is counted in the Store
// (table "hits") and shown live at /blog-admin/analytics. A visitor is a salted hash of day + IP + browser: the same person
// counts once per day, and nothing can be traced back to them. Admin visits, bots and prefetches are not counted.

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pagespeed|monitor|uptime|curl|wget|python|go-http|axios|node-fetch|java\/|httpclient|scrapy|phantom|selenium|playwright|puppeteer|bytespider|gptbot|claude|perplexity/i;
const AI = /chatgpt\.com|openai\.com|perplexity|claude\.ai|gemini\.google|copilot\.microsoft|bard\.google|phind|poe\.com|deepseek|grok|meta\.ai|mistral|you\.com/;
const SEARCH = /google\.|bing\.com|duckduckgo|yahoo\.|ecosia|brave\.com|baidu|yandex|startpage|qwant/;
const SOCIAL = /facebook|instagram|linkedin|lnkd\.in|(^|\.)t\.co$|twitter|(^|\.)x\.com$|tiktok|youtube|youtu\.be|reddit|pinterest|threads\.net|whatsapp|snapchat|bsky/;
const SKIP_PATH = /^\/(blog-admin|api|cdn-cgi|hp91|ask-preview)(\/|$)/;

export function classify(refHost, params, ownHost) {
  const src = String(params.get('utm_source') || '').toLowerCase(), med = String(params.get('utm_medium') || '').toLowerCase();
  if (params.get('gclid') || /^(cpc|ppc|paid|paidsearch|paid_social)$/.test(med)) return 'paid';
  if (med === 'email' || src === 'email' || src === 'newsletter') return 'email';
  const h = String(refHost || src || '').toLowerCase();
  if (!h || h === ownHost) return refHost === ownHost ? 'internal' : 'direct';
  if (AI.test(h)) return 'ai';
  if (SEARCH.test(h)) return 'search';
  if (SOCIAL.test(h)) return 'social';
  return 'referral';
}

export const deviceOf = (ua) => (/ipad|tablet|kindle|silk/i.test(ua) ? 'tablet' : /mobi|android|iphone|ipod/i.test(ua) ? 'mobile' : 'desktop');
export const browserOf = (ua) => (/edg(e|a|ios)?\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung' : /firefox|fxios/i.test(ua) ? 'Firefox'
  : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Other');

async function sha(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// The row to store for this request, or null when it is not a real page view.
export async function visitFrom(req, url, res, env = {}) {
  if (req.method !== 'GET' || !res || res.status !== 200) return null;
  if (!(res.headers.get('Content-Type') || '').startsWith('text/html')) return null;
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (SKIP_PATH.test(path)) return null;
  const h = req.headers, ua = h.get('User-Agent') || '';
  if (!ua || BOT.test(ua)) return null;
  if (h.get('Sec-Fetch-Dest') !== 'document') return null;            // real browser navigations only (not frames, scripts, fetches, bots)
  if (/prefetch|prerender/i.test(h.get('Sec-Purpose') || h.get('Purpose') || '')) return null;
  if ((h.get('Cookie') || '').includes('wd_editor')) return null;     // the owner's own visits
  let refHost = '';
  try { refHost = new URL(h.get('Referer') || '').hostname.replace(/^www\./, ''); } catch {}
  const own = url.hostname.replace(/^www\./, '');
  const day = new Date().toISOString().slice(0, 10);
  const ip = h.get('CF-Connecting-IP') || '';
  return {
    ts: Date.now(), path: path.slice(0, 200), ref: refHost === own ? '' : refHost.slice(0, 80), channel: classify(refHost, url.searchParams, own),
    country: /^[A-Z]{2}$/.test(req.cf?.country || '') ? req.cf.country : 'XX', device: deviceOf(ua), browser: browserOf(ua),
    vid: await sha(`${day}|${ip}|${ua}|${env.ANALYTICS_SALT || 'wd'}`),
  };
}

// ---- report building (pure: the Store reads the rows once, this shapes them; tested without a database) ----
// One pass over the rows instead of ~20 queries that each scan the table: Cloudflare's free plan allows 5 million database rows read a day.
export function windowOf(now, range, off) {
  const DAY = 864e5, H = 36e5, hourly = range === 'today', bucket = hourly ? H : DAY;
  const n = hourly ? 24 : range === '30d' ? 30 : range === '90d' ? 90 : 7;
  const firstB = hourly ? Math.floor((now + off) / DAY) * 24 : Math.floor((now + off) / DAY) - (n - 1);
  const from = firstB * bucket - off, to = from + n * bucket;
  return { hourly, bucket, n, firstB, from, to, pFrom: from - n * bucket, off };
}

// Visitors per source split by device: shows which channel is desktop-heavy (a visitor counts once per day, like every other number here).
function deviceByChannel(list, dayKey, lim = 8) {
  const m = new Map();
  for (const r of list) {
    if (!r.channel) continue;
    const g = m.get(r.channel) || { k: r.channel, sets: { desktop: new Set(), mobile: new Set(), tablet: new Set() }, all: new Set() };
    (g.sets[r.device] || g.sets.desktop).add(dayKey(r)); g.all.add(dayKey(r)); m.set(r.channel, g);
  }
  return [...m.values()].sort((a, b) => b.all.size - a.all.size).slice(0, lim)
    .map((g) => ({ k: g.k, v: g.all.size, desktop: g.sets.desktop.size, mobile: g.sets.mobile.size, tablet: g.sets.tablet.size }));
}

export function buildReport(rows, w, now = Date.now()) {
  const DAY = 864e5, { off, bucket, n, firstB, from, to } = w;
  const dayKey = (r) => `${r.vid}:${Math.floor((r.ts + off) / DAY)}`;
  const series = (list, base) => {
    const pv = new Array(n).fill(0), sets = Array.from({ length: n }, () => new Set());
    for (const r of list) { const i = Math.floor((r.ts + off) / bucket) - base; if (i >= 0 && i < n) { pv[i]++; sets[i].add(r.vid); } }
    return pv.map((c, i) => ({ t: (base + i) * bucket - off, pv: c, v: sets[i].size }));
  };
  const total = (list) => ({ pv: list.length, v: new Set(list.map(dayKey)).size });
  const top = (list, key, lim = 10) => {
    const m = new Map();
    for (const r of list) { const k = key(r); if (k == null || k === '') continue; const g = m.get(k) || { k, pv: 0, set: new Set() }; g.pv++; g.set.add(dayKey(r)); m.set(k, g); }
    return [...m.values()].sort((a, b) => b.pv - a.pv || b.set.size - a.set.size).slice(0, lim).map((g) => ({ k: g.k, pv: g.pv, v: g.set.size }));
  };
  const cur = rows.filter((r) => r.ts >= from && r.ts < to), prev = rows.filter((r) => r.ts < from);
  return {
    now, range: w.hourly ? 'today' : n === 30 ? '30d' : n === 90 ? '90d' : '7d', tz: 'America/Chicago', from, to, bucket, n,
    series: series(cur, firstB), prev: series(prev, firstB - n), totals: total(cur), prevTotals: total(prev),
    pages: top(cur, (r) => r.path), channels: top(cur, (r) => r.channel, 8), referrers: top(cur, (r) => r.ref), countries: top(cur, (r) => r.country),
    devices: top(cur, (r) => r.device, 4), browsers: top(cur, (r) => r.browser, 6),
    deviceByChannel: deviceByChannel(cur, dayKey),
  };
}

export function buildRealtime(rows, latest, now = Date.now()) {
  const m0 = Math.floor(now / 60000), mins = Array.from({ length: 30 }, () => new Set()), pvs = new Array(30).fill(0);
  const u30 = new Set(), u5 = new Set();
  for (const r of rows) {
    const i = Math.floor(r.ts / 60000) - (m0 - 29);
    if (i >= 0 && i < 30) { mins[i].add(r.vid); pvs[i]++; }
    u30.add(r.vid); if (r.ts >= now - 5 * 60e3) u5.add(r.vid);
  }
  const top = (key, lim) => { const m = new Map(); for (const r of rows) { const k = key(r); if (k) m.set(k, (m.get(k) || 0) + 1); } return [...m].sort((a, b) => b[1] - a[1]).slice(0, lim).map(([k, pv]) => ({ k, pv, v: pv })); };
  return { minutes: mins.map((s, i) => ({ t: (m0 - 29 + i) * 60000, u: s.size, pv: pvs[i] })), users30: u30.size, users5: u5.size,
    pages: top((r) => r.path, 8), countries: top((r) => r.country, 8), channels: top((r) => r.channel, 6), latest };
}

// ---- recording: hits are batched so a busy site does not call the database once per page view ----
let pending = [], lastFlush = 0;
const FLUSH_MS = 30000, FLUSH_MAX = 200;

// Never slows or breaks a page: runs after the response is sent and swallows its own errors. The first hit after 30 quiet seconds is
// written at once (a quiet site shows up live); during a burst the hits are written together at most every 30 seconds.
export function trackHit(req, env, ctx, url, res, store) {
  ctx.waitUntil((async () => {
    const v = await visitFrom(req, url, res, env);
    if (!v) return;
    pending.push(v); if (pending.length > FLUSH_MAX * 5) pending = pending.slice(-FLUSH_MAX);
    const now = Date.now();
    if (now - lastFlush < FLUSH_MS && pending.length < FLUSH_MAX) return;
    lastFlush = now;
    const batch = pending; pending = [];
    await store(env).recordHits(batch);
  })().catch((e) => console.log('track', e.message)));
}
