// Website search: GET /search?q=...  (docs/rag.md)
// Results come from the knowledge base (hybrid AI + keyword search over our public pages, one result per page),
// cached at the edge for an hour per query. If the backend is unavailable, page titles and descriptions are
// matched here instead. "Get an AI answer" calls the public answer API (/api/rag/answer, limited per IP).
// Search pages are noindex: they are for visitors, not for search engines.
import { page, esc, SITE } from './layout.js';
import { PAGES } from './pages.js';

const TTL = 3600;
const norm = (q) => String(q || '').replace(/\s+/g, ' ').trim().slice(0, 200);

const CSS = `<style>
.sr-form{display:flex;gap:10px;margin:18px 0 6px;flex-wrap:wrap}
.sr-form input{flex:1 1 260px;min-width:0;font:inherit;font-size:17px;padding:12px 14px;border:1.5px solid #B9C7D8;border-radius:12px;min-height:48px}
.sr-form input:focus{outline:2px solid #0D5EC7;outline-offset:1px;border-color:#0D5EC7}
.sr-form .btn{min-height:48px}
.sr-meta{color:#5A6B80;font-size:14px;margin:8px 0 18px}
.sr-list{list-style:none;padding:0;margin:0}
.sr-list li{padding:16px 0;border-top:1px solid #DCE5EF}
.sr-list a.sr-t{font-family:Sora,Inter,sans-serif;font-weight:600;font-size:18px;color:#0D5EC7;text-decoration:none;display:inline-block;min-height:24px;line-height:1.35}
.sr-list a.sr-t:hover{text-decoration:underline}
.sr-u{color:#2E7D4F;font-size:13px;margin:2px 0 6px;overflow-wrap:anywhere}
.sr-list p{margin:0;color:#33445A;font-size:15.5px;line-height:1.55;overflow-wrap:anywhere}
.sr-list mark{background:#FFF1B8;color:inherit;padding:0 1px;border-radius:3px}
.sr-ai{margin:6px 0 22px;padding:16px 18px;border:1px solid #DCE5EF;border-radius:14px;background:#F6F9FC}
.sr-ai p{margin:8px 0 0;line-height:1.6;overflow-wrap:anywhere}
.sr-ai ol{margin:8px 0 0;padding-left:22px}.sr-ai li{margin:4px 0;overflow-wrap:anywhere}
.sr-ai .btn{min-height:44px}
.sr-tags{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}
.sr-tags a{border:1px solid #DCE5EF;border-radius:999px;padding:8px 14px;text-decoration:none;color:#0E1A2B;font-size:14.5px;min-height:24px}
.sr-tags a:hover{border-color:#0D5EC7;color:#0D5EC7}
</style>`;

const SUGGEST = ['local SEO', 'AI search visibility', 'keyword research', 'Google Ads', 'custom software', 'EHR integration', 'pricing'];

function highlight(text, q) {
  const words = [...new Set((q.toLowerCase().match(/[a-z0-9]{3,}/g) || []))].slice(0, 8)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return esc(text);
  // split the raw text first, then escape each part: marks never land inside an HTML entity
  return String(text).split(new RegExp(`(${words.join('|')})`, 'gi'))
    .map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join('');
}

// Backup when the knowledge base is unavailable: match page titles and descriptions.
function localSearch(q) {
  const words = (q.toLowerCase().match(/[a-z0-9]{3,}/g) || []).slice(0, 8);
  if (!words.length) return [];
  return Object.entries(PAGES)
    .filter(([, p]) => !p.noindex && p.sitemap !== null)
    .map(([path, p]) => {
      const hay = `${p.title} ${p.description} ${p.keywords || ''}`.toLowerCase();
      const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0) + (String(p.title).toLowerCase().includes(w) ? 1 : 0), 0);
      return { url: SITE + (path === '/' ? '/' : path), title: String(p.title).replace(/\s*\|\s*WorldDigital\.ai$/, ''), snippet: p.description, score };
    })
    .filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
}

async function results(q, req, env, ctx) {
  const key = new Request(`${SITE}/__search?q=${encodeURIComponent(q.toLowerCase())}`);
  const cache = caches.default;
  const hit = await cache.match(key).catch(() => null);
  if (hit) return hit.json();
  if (env.TOOLS_API_URL) {
    try {
      const res = await fetch(env.TOOLS_API_URL.replace(/\/$/, '') + '/api/rag/site-search', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { 'x-internal-token': env.TOOLS_API_TOKEN || '', 'x-wd-server': '1', 'content-type': 'application/json', 'cf-connecting-ip': req.headers.get('CF-Connecting-IP') || '' },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const d = await res.json();
        const out = { results: (d.results || []).filter((r) => String(r.url).startsWith(SITE)), method: d.method || '' };
        // AI results are cached for everyone; keyword-only answers (daily AI limit reached) only briefly
        const ttl = /hybrid|vector|scan/.test(out.method) ? TTL : 300;
        ctx.waitUntil(cache.put(key, new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}` } })));
        return out;
      }
    } catch {}
  }
  return { results: localSearch(q), method: 'local' };
}

export async function searchPage(req, env, url, ctx, prod) {
  const q = norm(url.searchParams.get('q'));
  const d = q ? await results(q, req, env, ctx) : { results: [] };
  const list = d.results.map((r) => {
    const path = r.url.replace(SITE, '') || '/';
    return `<li><a class="sr-t" href="${esc(path)}">${highlight(r.title || path, q)}</a><div class="sr-u">worlddigital.ai${esc(path === '/' ? '' : path)}</div><p>${highlight(r.snippet || '', q)}</p></li>`;
  }).join('');
  const tags = `<div class="sr-tags">${SUGGEST.map((s) => `<a href="/search?q=${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>`;
  const body = `<section class="sec"><div class="wrap" style="max-width:820px">
<nav aria-label="Breadcrumb" class="crumbs"><a href="/">Home</a> › <span>Search</span></nav>
<h1 class="h" style="font-size:clamp(30px,5vw,42px)">${q ? `Results for “${esc(q)}”` : 'Search WorldDigital.ai'}</h1>
<form class="sr-form" action="/search" method="get" role="search">
<label for="sr-q" class="sr-only" style="position:absolute;left:-9999px">Search the site</label>
<input id="sr-q" type="search" name="q" value="${esc(q)}" placeholder="Search products, services, guides…" maxlength="200" enterkeyhint="search" ${q ? '' : 'autofocus'}>
<button class="btn red" type="submit">Search</button>
</form>
${q ? `<p class="sr-meta">${d.results.length ? `${d.results.length} page${d.results.length === 1 ? '' : 's'} found` : 'No pages matched.'}${d.method === 'local' ? ' (quick search: page titles only right now)' : ''}</p>
<div class="sr-ai" id="sr-ai"><strong>Want a direct answer?</strong> <span style="color:#5A6B80">AI reads our pages and answers with sources.</span>
<div style="margin-top:10px"><button class="btn ghost" type="button" id="sr-ask">Get an AI answer</button></div><div id="sr-out" aria-live="polite"></div></div>
${list ? `<ol class="sr-list">${list}</ol>` : `<p>Try other words, or one of these:</p>${tags}`}` : `<p style="color:#5A6B80">Search every page and blog post. Search understands meaning, so plain questions work too.</p>${tags}`}
</div></section>
${q ? `<script>(function(){var b=document.getElementById('sr-ask'),o=document.getElementById('sr-out');if(!b)return;
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
b.addEventListener('click',function(){b.disabled=true;b.textContent='Thinking…';o.textContent='';
var p=el('p','');p.style.whiteSpace='pre-line';var got=false;
function fail(m){b.disabled=false;b.textContent='Get an AI answer';if(!got){o.textContent='';o.appendChild(el('p','',m||'Could not get an answer right now. Please try again.'))}}
function sources(d){if(!d.sources||!d.sources.length)return;var ol=el('ol');d.sources.forEach(function(s){var li=el('li'),a=el('a','',s.title||s.url);
if(/^https:\\/\\/worlddigital\\.ai(\\/|$)/.test(s.url)){a.href=s.url.replace('https://worlddigital.ai','')||'/'}li.appendChild(a);ol.appendChild(li)});o.appendChild(el('p','','Sources:'));o.appendChild(ol)}
function line(t){if(!t.trim())return;var d;try{d=JSON.parse(t)}catch(e){return}
if(d.type==='text'){if(!got){got=true;b.remove();o.appendChild(p)}p.textContent+=d.text}
else if(d.type==='done'){p.textContent=p.textContent.trim();sources(d)}else if(d.type==='error'){fail(d.error)}}
fetch('/api/rag/answer-stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:${JSON.stringify(q).replace(/</g, '\\u003c')}})})
.then(function(r){if(!r.ok||!r.body||!/ndjson/.test(r.headers.get('content-type')||'')){return r.json().catch(function(){return{}}).then(function(d){fail(d.error)})}
var rd=r.body.getReader(),dec=new TextDecoder(),buf='';
function pump(){return rd.read().then(function(x){if(x.done){if(buf)line(buf);return}buf+=dec.decode(x.value,{stream:true});var parts=buf.split('\\n');buf=parts.pop();parts.forEach(line);return pump()})}
return pump()})
.catch(function(){fail()})})})();</script>` : ''}`;
  const html = page({ path: '/search', title: q ? `${q} – Search | WorldDigital.ai` : 'Search | WorldDigital.ai', description: 'Search WorldDigital.ai products, services and guides.',
    noindex: true, body: CSS + body, cta: false, tools: false, prod });
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
