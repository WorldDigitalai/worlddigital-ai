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

// Never slows or breaks a page: runs after the response is sent and swallows its own errors.
export function trackHit(req, env, ctx, url, res, store) {
  ctx.waitUntil((async () => { const v = await visitFrom(req, url, res, env); if (v) await store(env).recordHit(v); })().catch((e) => console.log('track', e.message)));
}
