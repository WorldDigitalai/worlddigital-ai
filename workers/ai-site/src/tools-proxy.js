import { humanOk } from './human.js';
// Forwards /api/tools/* to the Python tools API (backend/, deployed on Cloud Run).
// vars: TOOLS_API_URL (e.g. https://worlddigital-ai-api-xxxx.run.app)   secret: TOOLS_API_TOKEN
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

export async function toolsProxy(req, env, url) {
  if (!env.TOOLS_API_URL) {
    return new Response(JSON.stringify({ error: 'The tool is being set up. Please try again later.' }), { status: 503, headers: JSON_HEADERS });
  }
  if (!['GET', 'POST'].includes(req.method)) return new Response('Method not allowed', { status: 405 });
  // Billing is never reachable from the browser: only the site's own form handler, the admin and the cron call it.
  // No tool route uses encoded characters; refusing them stops encoded paths (e.g. %62illing) slipping past the checks below.
  if (url.pathname.includes('%')) return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: JSON_HEADERS });
  if (/^\/api\/tools\/+billing/i.test(url.pathname)) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: JSON_HEADERS });
  const headers = new Headers({
    'x-internal-token': env.TOOLS_API_TOKEN || '',
    'x-wd-public': '1', // marks requests that came through this public proxy (the health check then hides its details)
    'cf-connecting-ip': req.headers.get('CF-Connecting-IP') || '',
    'user-agent': req.headers.get('User-Agent') || '',
  });
  if (req.method === 'POST') headers.set('content-type', 'application/json');
  // Free previews cost real DataForSEO and OpenAI credits: require the human check before they reach the backend.
  let body;
  if (req.method === 'POST') {
    body = await req.text();
    if (/^\/api\/tools\/(keywords|content)\/preview$/.test(url.pathname)) {
      let tok = '';
      try { tok = String(JSON.parse(body).turnstile || ''); } catch {}
      if (!(await humanOk(env, tok, req.headers.get('CF-Connecting-IP') || ''))) {
        return new Response(JSON.stringify({ error: 'Please complete the quick human check and try again.' }), { status: 403, headers: JSON_HEADERS });
      }
    }
  }
  try {
    const res = await fetch(env.TOOLS_API_URL.replace(/\/$/, '') + url.pathname + url.search, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(90000),
    });
    const out = new Headers();
    for (const h of ['content-type', 'content-disposition', 'cache-control']) if (res.headers.get(h)) out.set(h, res.headers.get(h));
    out.set('X-Content-Type-Options', 'nosniff');
    return new Response(res.body, { status: res.status, headers: out });
  } catch {
    return new Response(JSON.stringify({ error: 'The tool is busy right now. Please try again in a minute.' }), { status: 502, headers: JSON_HEADERS });
  }
}

// Server-side call to the tools API (billing etc.). Returns {ok, status, data}.
export async function backend(env, method, path, body, timeoutMs = 60000) {
  if (!env.TOOLS_API_URL) return { ok: false, status: 503, data: { error: 'The backend is being set up. Please try again later.' } };
  try {
    const res = await fetch(env.TOOLS_API_URL.replace(/\/$/, '') + path, {
      // x-wd-server marks a server-side call: the public proxy above never sends it, so billing stays unreachable from browsers
      method, headers: { 'x-internal-token': env.TOOLS_API_TOKEN || '', 'x-wd-server': '1', 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs),
    });
    let data = {}; try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 502, data: { error: 'The backend is busy right now. Please try again in a minute.' } };
  }
}

// Public answer API: POST /api/rag/answer {query} -> grounded answer from worlddigital.ai pages, with source links.
// Only the public site is searchable here (never private or customer knowledge). Limited per IP per day by the backend.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
export async function ragAnswer(req, env) {
  const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...JSON_HEADERS, ...CORS, 'X-Content-Type-Options': 'nosniff' } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return out({ error: 'Use POST with JSON: {"query": "your question"}' }, 405);
  if (!env.TOOLS_API_URL) return out({ error: 'The knowledge API is being set up. Please try again later.' }, 503);
  let b; try { b = JSON.parse((await req.text()).slice(0, 4000)); } catch { return out({ error: 'Send JSON: {"query": "your question"}' }, 400); }
  const query = String((b && (b.query || b.q)) || '').trim();
  if (!query) return out({ error: 'Send JSON: {"query": "your question"}' }, 400);
  if (query.length > 500) return out({ error: 'Please keep the question under 500 characters.' }, 400);
  const types = Array.isArray(b.types) ? b.types.slice(0, 5).map(String) : undefined;
  try {
    const res = await fetch(env.TOOLS_API_URL.replace(/\/$/, '') + '/api/rag/answer', {
      method: 'POST', signal: AbortSignal.timeout(60000),
      headers: { 'x-internal-token': env.TOOLS_API_TOKEN || '', 'content-type': 'application/json', 'cf-connecting-ip': req.headers.get('CF-Connecting-IP') || '' },
      body: JSON.stringify({ query, types }),
    });
    let d = {}; try { d = await res.json(); } catch {}
    return out(res.ok ? d : { error: d.error || 'Could not answer right now.' }, res.status);
  } catch {
    return out({ error: 'The knowledge API is busy right now. Please try again in a minute.' }, 502);
  }
}

// Stripe webhook: Stripe calls https://worlddigital.ai/api/stripe/webhook. The raw body and Stripe-Signature are passed
// through unchanged (the backend verifies the signature and re-checks the payment with Stripe before unlocking).
export async function stripeWebhook(req, env) {
  const out = (o, status) => new Response(JSON.stringify(o), { status, headers: JSON_HEADERS });
  if (req.method !== 'POST') return out({ error: 'POST only' }, 405);
  if (!env.TOOLS_API_URL) return out({ error: 'not configured' }, 503);
  const sig = req.headers.get('Stripe-Signature') || '';
  if (!sig) return out({ error: 'missing signature' }, 400);
  const body = await req.arrayBuffer();
  if (body.byteLength > 512 * 1024) return out({ error: 'too large' }, 413);
  try {
    const res = await fetch(env.TOOLS_API_URL.replace(/\/$/, '') + '/api/stripe/webhook', {
      method: 'POST', body, signal: AbortSignal.timeout(60000),
      headers: { 'x-internal-token': env.TOOLS_API_TOKEN || '', 'content-type': 'application/json', 'stripe-signature': sig },
    });
    return new Response(res.body, { status: res.status, headers: JSON_HEADERS });
  } catch {
    return out({ error: 'busy' }, 502); // Stripe retries failed deliveries for up to 3 days
  }
}
