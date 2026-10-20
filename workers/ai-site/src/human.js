// Cloudflare Turnstile check, verified by the report worker (it holds the secret).
export async function humanOk(env, token, ip) {
  if (env.TS_REQUIRED !== '1') return true;
  if (!token || !env.REPORT) return false;
  try {
    const r = await env.REPORT.fetch('https://report/verify-human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ip }) });
    return !!(await r.json()).ok;
  } catch { return false; }
}

export const widget = (env) => `<div class="cf-turnstile" data-sitekey="${env?.TS_SITEKEY || '0x4AAAAAAFRt-4be4VSc7r_H'}" data-size="flexible" data-theme="light" style="margin:16px 0 0"></div>`;
