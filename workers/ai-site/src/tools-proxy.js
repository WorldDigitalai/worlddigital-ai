// Forwards /api/tools/* to the Python tools API (backend/, deployed on Cloud Run).
// vars: TOOLS_API_URL (e.g. https://worlddigital-ai-api-xxxx.run.app)   secret: TOOLS_API_TOKEN
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

export async function toolsProxy(req, env, url) {
  if (!env.TOOLS_API_URL) {
    return new Response(JSON.stringify({ error: 'The tool is being set up. Please try again later.' }), { status: 503, headers: JSON_HEADERS });
  }
  if (!['GET', 'POST'].includes(req.method)) return new Response('Method not allowed', { status: 405 });
  // Billing is never reachable from the browser: only the site's own form handler, the admin and the cron call it.
  if (/^\/api\/tools\/billing/i.test(url.pathname)) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: JSON_HEADERS });
  const headers = new Headers({
    'x-internal-token': env.TOOLS_API_TOKEN || '',
    'cf-connecting-ip': req.headers.get('CF-Connecting-IP') || '',
    'user-agent': req.headers.get('User-Agent') || '',
  });
  if (req.method === 'POST') headers.set('content-type', 'application/json');
  try {
    const res = await fetch(env.TOOLS_API_URL.replace(/\/$/, '') + url.pathname + url.search, {
      method: req.method,
      headers,
      body: req.method === 'POST' ? await req.text() : undefined,
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
      method, headers: { 'x-internal-token': env.TOOLS_API_TOKEN || '', 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs),
    });
    let data = {}; try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 502, data: { error: 'The backend is busy right now. Please try again in a minute.' } };
  }
}
