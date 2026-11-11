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

// Streamed version of the answer API: the answer arrives as it is written (NDJSON lines, see backend
// /api/rag/answer-stream), so visitors see the first words in under a second. Same limits as /api/rag/answer.
// Shared plumbing for the public knowledge-base endpoints: JSON in, backend call with the visitor's IP, JSON or stream out.
const kbOut = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...JSON_HEADERS, ...CORS, 'X-Content-Type-Options': 'nosniff' } });
async function kbBody(req) {
  if (req.method === 'OPTIONS') return { res: new Response(null, { status: 204, headers: CORS }) };
  if (req.method !== 'POST') return { res: kbOut({ error: 'Use POST with JSON.' }, 405) };
  try { const b = JSON.parse((await req.text()).slice(0, 6000)); if (b && typeof b === 'object') return { b }; } catch {}
  return { res: kbOut({ error: 'Send JSON.' }, 400) };
}
function kbCall(req, env, path, body, timeout = 20000) {
  // our own automated site tests are marked so they are not counted as visitor questions
  const test = /WorldDigitalSiteTest/.test(req.headers.get('User-Agent') || '');
  return fetch(env.TOOLS_API_URL.replace(/\/$/, '') + path, {
    method: 'POST', signal: AbortSignal.timeout(timeout),
    headers: { 'x-internal-token': env.TOOLS_API_TOKEN || '', 'content-type': 'application/json',
      'cf-connecting-ip': req.headers.get('CF-Connecting-IP') || '', ...(test ? { 'x-wd-test': '1' } : {}) },
    body: JSON.stringify(body),
  });
}
async function kbJson(req, env, path, body) {
  if (!env.TOOLS_API_URL) return kbOut({ error: 'Not available right now.' }, 503);
  try {
    const res = await kbCall(req, env, path, body);
    let d = {}; try { d = await res.json(); } catch {}
    return kbOut(res.ok ? d : { error: d.error || 'Could not save that right now.' }, res.status);
  } catch { return kbOut({ error: 'Busy right now. Please try again in a minute.' }, 502); }
}
async function kbStream(req, env, path, body) {
  if (!env.TOOLS_API_URL) return kbOut({ error: 'The knowledge API is being set up. Please try again later.' }, 503);
  const query = String(body.query || '').trim();
  if (!query) return kbOut({ error: 'Send JSON: {"query": "your question"}' }, 400);
  if (query.length > 500) return kbOut({ error: 'Please keep the question under 500 characters.' }, 400);
  try {
    const res = await kbCall(req, env, path, { ...body, query }, 60000);
    if (!res.ok) { let d = {}; try { d = await res.json(); } catch {} return kbOut({ error: d.error || 'Could not answer right now.' }, res.status); }
    return new Response(res.body, { status: 200, headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...CORS } });
  } catch { return kbOut({ error: 'The knowledge API is busy right now. Please try again in a minute.' }, 502); }
}
const str = (v, n) => String(v == null ? '' : v).slice(0, n);

// Streamed version of the answer API: the answer arrives as it is written (NDJSON lines, see backend
// /api/rag/answer-stream), so visitors see the first words in under a second. Same limits as /api/rag/answer.
// The last line ("done") carries the question id (for ratings and hand-off), follow-up suggestions and sources.
export async function ragAnswerStream(req, env) {
  const { b, res } = await kbBody(req); if (res) return res;
  return kbStream(req, env, '/api/rag/answer-stream', { query: b.query || b.q, channel: b.channel === 'search' ? 'search' : 'api' });
}

// Thumbs up / down on an answer: {id, vote: "up" | "down"}
export async function ragFeedback(req, env) {
  const { b, res } = await kbBody(req); if (res) return res;
  return kbJson(req, env, '/api/rag/feedback', { id: str(b.id, 20), vote: str(b.vote, 4) });
}

// "Want us to email you?": {email, question, id}. Saved with the question; on our own site it is also a form entry
// (Form entries in the admin) and we get the usual notification email. `notify` is given by the router.
export async function ragHandoff(req, env, notify) {
  const { b, res } = await kbBody(req); if (res) return res;
  const body = { email: str(b.email, 200).trim(), question: str(b.question, 800), id: str(b.id, 20), name: str(b.name, 120) };
  const out = await kbJson(req, env, '/api/rag/handoff', body);
  if (out.status === 200 && notify) await notify({ email: body.email.toLowerCase(), question: body.question, name: body.name });
  return out;
}

// Client "Ask AI" widget (/ask.js): the same three calls for a customer's own knowledge base. The embed key picks the
// customer; the backend checks that the calling website is the customer's.
export async function askEmbed(req, env, action) {
  const { b, res } = await kbBody(req); if (res) return res;
  const base = { key: str(b.key, 32), origin: str(req.headers.get('Origin') || req.headers.get('Referer') || '', 300) };
  if (action === 'answer') return kbStream(req, env, '/api/rag/embed/answer-stream', { ...base, query: b.query || b.q });
  if (action === 'info') return kbJson(req, env, '/api/rag/embed/info', base);
  if (action === 'feedback') return kbJson(req, env, '/api/rag/feedback', { id: str(b.id, 20), vote: str(b.vote, 4) });
  if (action === 'handoff') return kbJson(req, env, '/api/rag/handoff', { ...base, email: str(b.email, 200).trim(), question: str(b.question, 800), id: str(b.id, 20) });
  return kbOut({ error: 'Not found.' }, 404);
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
