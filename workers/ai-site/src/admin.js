import { backend } from './tools-proxy.js';
// Private blog editor at /blog-admin. One-time email sign-in links, only for ADMIN_EMAILS.
import { esc, CSS, SITE } from './layout.js';
import { mdToHtml } from './md.js';
import { blogPost } from './blog.js';
import { humanOk, widget } from './human.js';
import { AI_CSS, aiPanelHtml, aiPanelClient, TYPES } from './ai-panel.js';

const COOKIE = '__Host-wd_editor';
const SESSION_MS = 7 * 86400e3;
const LINK_MS = 20 * 60e3;
const MAX_IMAGE = 1900 * 1024;
const IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/gif'];

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const randomToken = () => { const b = new Uint8Array(32); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)));
}
const getCookie = (req, name) => {
  const c = req.headers.get('Cookie') || '';
  for (const part of c.split(/;\s*/)) { const i = part.indexOf('='); if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1)); }
  return null;
};
const admins = (env) => String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

function headers(nonce, extra = {}, ts = false) {
  const tsSrc = ts ? ' https://challenges.cloudflare.com' : '';
  return {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': `default-src 'self'; script-src 'nonce-${nonce}'${tsSrc}; frame-src${tsSrc || " 'none'"}; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'${tsSrc}; frame-ancestors 'none'; form-action 'self'; base-uri 'none'`,
    'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff', ...extra,
  };
}
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function shell(title, body, nonce, script = '', ts = false) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Blog editor · WorldDigital.ai</title><meta name="robots" content="noindex, nofollow"><link rel="icon" href="/icon.svg" type="image/svg+xml">

${ts ? `<script nonce="${nonce}" src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : ''}<style>${CSS}
.ad-top{background:#0E1A2B;color:#fff}.ad-top a{color:#fff;text-decoration:none;font-weight:600}.ad-top .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:60px;flex-wrap:wrap}
.ad-top button{background:none;border:1px solid #33506F;color:#fff;border-radius:10px;padding:8px 12px;font:inherit;cursor:pointer}
.ed{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start}@media(max-width:1000px){.ed{grid-template-columns:1fr}}
.tool{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.tool button{min-height:38px;padding:6px 10px;border:1px solid #B9C7D8;background:#fff;border-radius:8px;font:inherit;font-size:14px;cursor:pointer;font-weight:600}
#body{min-height:520px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:14.5px;line-height:1.6}
.count{font-size:13px;color:#4A5B70;font-weight:500;float:right}.count.over{color:#B42318;font-weight:700}
.serp{border:1px solid #DCE5EF;border-radius:12px;padding:14px;background:#fff;margin-top:10px}.serp .t{color:#1A0DAB;font-size:19px;line-height:1.3}.serp .u{color:#0D652D;font-size:14px}.serp .d{color:#4D5156;font-size:14px;margin-top:4px}
.bar{position:sticky;bottom:0;background:#fff;border-top:1px solid #DCE5EF;padding:12px 0;z-index:10;margin-top:24px}.bar .wrap{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.status{font-weight:700;font-size:14px;padding:4px 10px;border-radius:99px;background:#EEF2F7}.status.published{background:#DCFCE7;color:#14532D}.status.scheduled{background:#FEF3C7;color:#92400E}
.msg{font-weight:600}.msg.err{color:#B42318}.msg.ok{color:#15803D}
.list td,.list th{padding:12px 10px;border-bottom:1px solid #DCE5EF;text-align:left;vertical-align:top}.list{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden}
.cover-prev{max-width:100%;border-radius:12px;margin-top:10px;display:block}
.pv{background:#F4F8FC;border:1px solid #DCE5EF;border-radius:16px;padding:22px;position:sticky;top:12px;max-height:calc(100vh - 120px);overflow:auto}
${AI_CSS}
</style></head><body>${body}${script ? `<script nonce="${nonce}">${script}</script>` : ''}</body></html>`;
}

function topbar(email, csrf) {
  return `<div class="ad-top"><div class="wrap"><a href="/blog-admin">WorldDigital.ai · Blog editor</a>
<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><a href="/blog" target="_blank" rel="noopener">View blog ↗</a><a href="/blog-admin/leads">Form entries</a><a href="/blog-admin/kb">Knowledge base</a><span style="color:#C9D6E6;font-size:14px">${esc(email)}</span>
<form method="post" action="/blog-admin/logout" style="margin:0"><input type="hidden" name="csrf" value="${esc(csrf)}"><button type="submit">Sign out</button></form></div></div></div>`;
}

async function sendEmail(env, to, subject, html, replyTo) {
  if (!env.RESEND_API_KEY) { console.log('No RESEND_API_KEY; sign-in link not emailed.'); return false; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || 'WorldDigital.ai <login@worlddigital.ai>', to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) console.log('Resend error', r.status, (await r.text()).slice(0, 300));
  return r.ok;
}
export { sendEmail };

async function currentEditor(env, store, req) {
  const tok = getCookie(req, COOKIE);
  if (!tok) return null;
  const hash = await sha256(tok);
  const email = await store.getSession(hash);
  if (!email || !admins(env).includes(email)) return null;
  const csrf = await hmac(await store.secret(), `csrf:${hash}`);
  return { email, hash, csrf };
}

function sameOrigin(req, url) {
  const o = req.headers.get('Origin');
  if (o) return o === url.origin;
  const r = req.headers.get('Referer');
  return !!r && r.startsWith(url.origin + '/');
}

function loginPage(nonce, { sent = false, error = '', notice = '' } = {}) {
  const body = `<main class="wrap" style="max-width:480px;padding-top:70px;padding-bottom:70px"><div class="card">
<div class="eyebrow">WorldDigital.ai</div><h1 class="h" style="font-size:28px;margin-top:8px">Blog editor</h1>
${sent ? `<p style="line-height:1.6">If that email can use the editor, a sign-in link is on its way. It works once and expires in 20 minutes.</p><p><a href="/blog-admin">Use a different email</a></p>`
  : `<p class="muted">We’ll email you a one-time sign-in link. No password needed.</p>
${error ? `<p class="msg err" role="alert">${esc(error)}</p>` : ''}${notice ? `<p class="msg ok" role="status">${esc(notice)}</p>` : ''}
<form method="post" action="/blog-admin/login"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required>
${widget()}<button class="btn red" type="submit" style="width:100%;margin-top:16px">Email me a sign-in link</button></form>`}
</div></main>`;
  return new Response(shell('Sign in', body, nonce, '', true), { headers: headers(nonce, {}, true) });
}

function fmt(iso) { return iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago' }) : ''; }

function dashboard(nonce, ed, posts, flash) {
  const rowsHtml = posts.map((p) => {
    const st = p.live ? 'published' : p.status;
    const when = p.live ? `Live since ${fmt(p.published_at)}` : p.status === 'scheduled' ? `Goes live ${fmt(p.publish_at)}` : `Edited ${fmt(p.updated_at)}`;
    return `<tr><td><a href="/blog-admin/edit/${encodeURIComponent(p.slug)}" style="font-weight:700">${esc(p.title)}</a><div class="muted" style="font-size:13.5px">/blog/${esc(p.slug)}</div></td>
<td><span class="status ${st}">${st === 'published' ? 'Live' : st === 'scheduled' ? 'Scheduled' : 'Draft'}</span></td><td class="muted" style="font-size:14px">${esc(p.category || '')}</td><td class="muted" style="font-size:14px">${esc(when)}</td>
<td>${p.live ? `<a href="/blog/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">View ↗</a>` : `<a href="/blog-admin/preview/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">Preview ↗</a>`}</td></tr>`;
  }).join('');
  const body = `${topbar(ed.email, ed.csrf)}<main class="wrap" style="padding-top:36px;padding-bottom:60px">
<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px"><h1 class="h" style="font-size:32px">Posts</h1><a class="btn red" href="/blog-admin/new">+ New post</a></div>
${flash ? `<p class="msg ok" role="status">${esc(flash)}</p>` : ''}
<div style="overflow-x:auto;margin-top:20px;border:1px solid #DCE5EF;border-radius:14px"><table class="list"><thead><tr><th>Title</th><th>Status</th><th>Topic</th><th>Date</th><th></th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="5">No posts yet.</td></tr>'}</tbody></table></div>
</main>`;
  return new Response(shell('Posts', body, nonce), { headers: headers(nonce) });
}

function editorPage(nonce, ed, p, cats) {
  const isNew = !p;
  p = p || { title: '', slug: '', category: '', excerpt: '', seo_title: '', description: '', body: '', cover_id: '', cover_alt: '', status: 'draft' };
  const st = p.live ? 'published' : p.status;
  const localDT = (iso) => { if (!iso) return ''; const d = new Date(iso); const z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
  const body = `${topbar(ed.email, ed.csrf)}
<main class="wrap" style="padding-top:28px">
<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><a href="/blog-admin">← All posts</a><h1 class="h" style="font-size:28px">${isNew ? 'New post' : 'Edit post'}</h1>
<span class="status ${st}" id="st">${st === 'published' ? 'Live' : st === 'scheduled' ? `Scheduled · ${esc(fmt(p.publish_at))}` : 'Draft'}</span></div>
<div class="ed" style="margin-top:18px">
<div>
<label for="title">Title</label><input id="title" maxlength="140" value="${esc(p.title)}" placeholder="e.g. How to rank on Google Maps in Houston">
<label for="slug">Page address <span class="muted" style="font-weight:400">worlddigital.ai/blog/…</span></label><input id="slug" maxlength="90" value="${esc(p.slug)}" pattern="[a-z0-9]+(-[a-z0-9]+)*">
<p class="muted" style="font-size:13px;margin:6px 0 0" id="slughint">${p.live ? 'This post is live. If you change the address, the old one redirects to the new one automatically.' : 'Filled in from the title. Lowercase letters, numbers and dashes.'}</p>
<div class="two"><div><label for="cat">Topic</label><input id="cat" list="cats" maxlength="40" value="${esc(p.category || '')}" placeholder="e.g. Local SEO"><datalist id="cats">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
<div><label for="cover">Cover photo <span class="muted" style="font-weight:400">(optional)</span></label><input id="cover" type="file" accept="image/*"></div></div>
<input type="hidden" id="cover_id" value="${esc(p.cover_id || '')}">
<div id="coverbox" ${p.cover_id ? '' : 'hidden'}><img id="coverimg" class="cover-prev" alt="" src="${p.cover_id ? `/media/${esc(p.cover_id)}` : ''}"><label for="cover_alt">Describe the photo (for Google and screen readers)</label><input id="cover_alt" maxlength="160" value="${esc(p.cover_alt || '')}"><button type="button" class="btn ghost" id="rmcover" style="margin-top:8px;min-height:40px">Remove photo</button></div>
<label for="excerpt">Short summary <span class="count" id="c-ex"></span></label><textarea id="excerpt" maxlength="300" style="min-height:80px" placeholder="One or two sentences under the title.">${esc(p.excerpt || '')}</textarea>
<label for="body">Post</label>
<div class="tool" role="toolbar" aria-label="Formatting">
<button type="button" data-md="h2">Heading</button><button type="button" data-md="h3">Subheading</button><button type="button" data-md="b"><b>B</b> Bold</button><button type="button" data-md="i"><i>I</i> Italic</button><button type="button" data-md="ul">• List</button><button type="button" data-md="ol">1. List</button><button type="button" data-md="q">“ Quote</button><button type="button" data-md="a">Link</button><button type="button" data-md="img">Photo</button><button type="button" data-md="tbl">Table</button>
</div>
<input type="file" id="imgfile" accept="image/*" hidden>
<textarea id="body" spellcheck="true" placeholder="Write here. Use the buttons above for headings, lists, links and photos.">${esc(p.body || '')}</textarea>
<p class="muted" style="font-size:13px" id="wc"></p>
<details style="margin-top:8px" open><summary>Google search settings</summary>
<label for="seo_title">Title on Google <span class="count" id="c-st"></span></label><input id="seo_title" maxlength="90" value="${esc(p.seo_title || '')}" placeholder="Leave empty to use the post title">
<label for="desc">Description on Google <span class="count" id="c-ds"></span></label><textarea id="desc" maxlength="200" style="min-height:80px" placeholder="What the post covers, in about 150 characters.">${esc(p.description || '')}</textarea>
<div class="serp" aria-label="Google preview"><div class="u">worlddigital.ai › blog › <span id="s-u"></span></div><div class="t" id="s-t"></div><div class="d" id="s-d"></div></div>
</details>
</div>
<div><div class="tabs" role="tablist" aria-label="Side panel"><button type="button" role="tab" data-tab="ai" aria-selected="false">✨ AI assistant</button><button type="button" role="tab" data-tab="pv" aria-selected="true">Live preview</button></div>
${aiPanelHtml()}<div class="pv" id="pvpanel" role="tabpanel"><div class="eyebrow">Live preview</div><h1 class="h" id="pv-t" style="font-size:32px;margin-top:10px"></h1><p id="pv-e" style="font-size:17px;color:#33445A"></p><div class="prose" id="pv"></div></div></div>
</div>
</main>
<div class="bar"><div class="wrap">
<button class="btn ghost" type="button" data-act="draft">${p.live ? 'Save &amp; unpublish' : p.status === 'scheduled' ? 'Save changes' : 'Save draft'}</button>
<button class="btn red" type="button" data-act="publish">${p.live ? 'Update live post' : 'Publish now'}</button>
<span style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap"><input type="datetime-local" id="when" aria-label="Publish date and time" style="width:auto;min-height:44px" value="${esc(localDT(p.status === 'scheduled' ? p.publish_at : ''))}"><button class="btn ghost" type="button" data-act="schedule">Schedule</button></span>
${!isNew ? `<a class="btn ghost" href="${p.live ? `/blog/${esc(p.slug)}` : `/blog-admin/preview/${esc(p.slug)}`}" target="_blank" rel="noopener" id="viewlink">${p.live ? 'View live ↗' : 'Full preview ↗'}</a>` : ''}
<span class="msg" id="msg" role="status" aria-live="polite"></span>
</div></div>`;
  const script = `
window.WD_AI=${JSON.stringify({ isNew, types: TYPES }).replace(/</g, '\\u003c')};
var CSRF=${JSON.stringify(ed.csrf)}, ORIG=${JSON.stringify(isNew ? null : p.slug)}, LIVE=${p.live ? 'true' : 'false'};
var __name=function(f){return f};
var md=${mdToHtml.toString()};
var $=function(id){return document.getElementById(id)};
var dirty=false, slugEdited=${isNew ? 'false' : 'true'};
function slugify(s){return s.toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)}
function cnt(id,el,max,ideal){var n=$(el).value.length;var c=$(id);c.textContent=n+' / '+ideal;c.className='count'+(n>max?' over':'')}
function upd(){var t=$('title').value;if(!slugEdited)$('slug').value=slugify(t);
$('pv-t').textContent=t||'Your title';$('pv-e').textContent=$('excerpt').value;$('pv').innerHTML=md($('body').value);
var words=($('body').value.match(/\\S+/g)||[]).length;$('wc').textContent=words+' words · about '+Math.max(1,Math.round(words/220))+' min read';
cnt('c-st','seo_title',60,60);cnt('c-ds','desc',160,160);cnt('c-ex','excerpt',300,200);
$('s-u').textContent=$('slug').value||'…';$('s-t').textContent=($('seo_title').value||t||'Title')+' | WorldDigital.ai';$('s-d').textContent=$('desc').value||$('excerpt').value||'Add a description so Google shows the right summary.';
try{localStorage.setItem('wd-draft-'+(ORIG||'new'),JSON.stringify(data('autosave')))}catch(e){}}
['title','excerpt','body','seo_title','desc','cat','cover_alt'].forEach(function(id){var el=$(id);if(el)el.addEventListener('input',function(){dirty=true;upd()})});
$('slug').addEventListener('input',function(){slugEdited=true;dirty=true;this.value=this.value.toLowerCase().replace(/[^a-z0-9-]/g,'-');upd()});
window.addEventListener('beforeunload',function(e){if(dirty){e.preventDefault();e.returnValue=''}});
function wrapSel(a,b,ph){var ta=$('body'),s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e)||ph;ta.setRangeText(a+sel+b,s,e,'end');ta.focus();dirty=true;upd()}
function linePrefix(pre,ph){var ta=$('body'),s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e)||ph;var out=sel.split('\\n').map(function(l,i){return (typeof pre==='function'?pre(i):pre)+l}).join('\\n');var before=s>0&&ta.value[s-1]!=='\\n'?'\\n\\n':'';ta.setRangeText(before+out+'\\n',s,e,'end');ta.focus();dirty=true;upd()}
document.querySelector('.tool').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var k=b.getAttribute('data-md');
if(k==='h2')linePrefix('## ','Heading');if(k==='h3')linePrefix('### ','Subheading');if(k==='b')wrapSel('**','**','bold text');if(k==='i')wrapSel('*','*','italic text');
if(k==='ul')linePrefix('- ','List item');if(k==='ol')linePrefix(function(i){return (i+1)+'. '},'List item');if(k==='q')linePrefix('> ','Quote');
if(k==='a'){var u=prompt('Link address (https://…, or /page on this site)');if(u)wrapSel('[','](' + u.trim() + ')','link text')}
if(k==='tbl')linePrefix('','| Column 1 | Column 2 |\\n|---|---|\\n| Value | Value |');
if(k==='img')$('imgfile').click()});
function shrink(file){return new Promise(function(res,rej){if(file.type==='image/gif'&&file.size<${MAX_IMAGE})return res(file);var img=new Image();img.onload=function(){var max=1600,w=img.naturalWidth,h=img.naturalHeight;if(w>max){h=Math.round(h*max/w);w=max}
var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);var q=0.85;(function go(){c.toBlob(function(b){if(!b)return rej(new Error('This photo could not be read.'));if(b.size>${MAX_IMAGE}&&q>0.4){q-=0.15;go()}else res(b)},'image/webp',q)})()};img.onerror=function(){rej(new Error('This file is not a photo we can use.'))};img.src=URL.createObjectURL(file)})}
function upload(file,alt){say('Uploading photo…','');return shrink(file).then(function(b){var fd=new FormData();fd.append('file',b,'photo.webp');fd.append('alt',alt||'');
return fetch('/blog-admin/upload',{method:'POST',body:fd,headers:{'X-CSRF':CSRF}}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||'Upload failed');say('Photo uploaded.','ok');return j})})}).catch(function(e){say(e.message,'err');throw e})}
$('imgfile').addEventListener('change',function(){var f=this.files[0];this.value='';if(!f)return;var alt=prompt('Describe the photo in a few words (helps Google and screen readers)')||'';upload(f,alt).then(function(j){linePrefix('','!['+alt.replace(/[\\[\\]]/g,'')+']('+j.url+')')})});
$('cover').addEventListener('change',function(){var f=this.files[0];this.value='';if(!f)return;upload(f,$('cover_alt').value).then(function(j){$('cover_id').value=j.id;$('coverimg').src=j.url;$('coverbox').hidden=false;dirty=true;upd()})});
$('rmcover').addEventListener('click',function(){$('cover_id').value='';$('coverbox').hidden=true;dirty=true});
function data(act){return {originalSlug:ORIG,action:act,title:$('title').value.trim(),slug:$('slug').value.trim(),category:$('cat').value.trim(),excerpt:$('excerpt').value.trim(),body:$('body').value,
seo_title:$('seo_title').value.trim(),description:$('desc').value.trim(),cover_id:$('cover_id').value,cover_alt:$('cover_alt').value.trim(),publish_at:$('when').value?new Date($('when').value).toISOString():''}}
function say(t,k){var m=$('msg');m.textContent=t;m.className='msg '+(k||'')}
document.querySelector('.bar').addEventListener('click',function(e){var b=e.target.closest('button[data-act]');if(!b)return;var act=b.getAttribute('data-act');
if(act==='draft'&&LIVE&&!confirm('Take this post off the blog and keep it as a draft?'))return;
if(act==='publish'&&!LIVE&&!confirm('Publish this post on worlddigital.ai now?'))return;
if(act==='schedule'&&!$('when').value){say('Pick a date and time first.','err');$('when').focus();return}
var d=data(act==='draft'?(LIVE?'unpublish':'save'):(act==='publish'&&LIVE?'update':act));
document.querySelectorAll('.bar button').forEach(function(x){x.disabled=true});say('Saving…','');
fetch('/blog-admin/save',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF':CSRF},body:JSON.stringify(d)}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})}).then(function(x){
document.querySelectorAll('.bar button').forEach(function(y){y.disabled=false});
if(!x.ok){say(x.j.error||'Could not save.','err');return}
dirty=false;try{localStorage.removeItem('wd-draft-'+(ORIG||'new'))}catch(e){}
location.href='/blog-admin/edit/'+encodeURIComponent(x.j.slug)+'?saved='+encodeURIComponent(x.j.message||'Saved.')}).catch(function(){document.querySelectorAll('.bar button').forEach(function(y){y.disabled=false});say('No connection. Your text is still here; try again.','err')})});
(function(){var q=new URLSearchParams(location.search).get('saved');if(q){say(q,'ok');history.replaceState(null,'',location.pathname)}
try{var s=localStorage.getItem('wd-draft-'+(ORIG||'new'));if(s){var o=JSON.parse(s);if(o.body&&o.body!==$('body').value&&confirm('You have unsaved changes from earlier on this device. Restore them?')){['title','slug','excerpt','body'].forEach(function(k){$(k).value=o[k]||''});$('cat').value=o.category||'';$('seo_title').value=o.seo_title||'';$('desc').value=o.description||'';dirty=true}}}catch(e){}
upd()})();
(${aiPanelClient.toString()})();`;
  return new Response(shell(isNew ? 'New post' : p.title, body, nonce, script), { headers: headers(nonce) });
}


function kbPage(nonce, ed, st, qs, tenants, internal) {
  const n = (v) => (v == null ? '–' : Number(v).toLocaleString('en-US'));
  const ms = (v) => (v == null ? '–' : `${(v / 1000).toFixed(1)} s`);
  const ai = (st.sites || {}).ai || {};
  const ct = st.content || {}; const sy = st.sync || {}; const us = st.usage_30d || {}; const cf = st.config || {};
  const ev = st.eval && st.eval.total ? st.eval : null; const em = (ev && ev.metrics) || {};
  const pc = (v) => (v == null ? '–' : `${v}%`);
  const idx = Object.entries(st.search_indexes || {}).map(([k, v]) => `${k === 'vector' ? 'meaning' : 'keywords'}: ${esc(v)}`).join(' · ') || 'unknown';
  const stat = (label, value, sub = '') => `<div><div class="muted" style="font-size:13px">${label}</div><div style="font-size:20px;font-weight:700">${value}</div>${sub ? `<div class="muted" style="font-size:13px">${sub}</div>` : ''}</div>`;
  const grid = (items) => `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-top:10px">${items.join('')}</div>`;
  const badge = (s) => `<span class="status ${s === 'ok' ? 'published' : s === 'running' ? '' : 'scheduled'}">${esc(s || '')}</span>`;
  const hist = (sy.history || []).map((r) => `<tr><td style="white-space:nowrap">${esc(fmt(r.started))}</td><td>${esc(r.mode === 'page' ? 'one page' : r.mode)}<div class="muted" style="font-size:12px">${esc(r.trigger || '')}</div></td><td>${badge(r.status)}</td>
<td>${r.mode === 'page' ? esc((r.url || '').replace('https://worlddigital.ai', '') || '/') : `${n(r.done)}/${n(r.total)} read · ${n(r.updated)} updated · ${n(r.unchanged)} unchanged`}${r.removed ? ` · ${n(r.removed)} removed` : ''}</td><td>${r.errors ? `<b style="color:#B42318">${n(r.errors)}</b>` : '0'}</td><td>${ms(r.duration_ms)}</td></tr>`).join('');
  const errs = (sy.recent_errors || []).map((e) => `<li>${esc(e)}</li>`).join('');
  const removed = (sy.removed_30d || []).map((u) => `<li>${esc(u.replace('https://worlddigital.ai', '') || '/')}</li>`).join('');
  const qrows = (qs.questions || []).slice(0, 60).map((q) => `<tr><td style="white-space:nowrap">${esc(fmt(q.at))}</td><td>${esc(q.q)}<div class="muted" style="font-size:12px">${q.channel === 'api' ? 'public API' : 'website chat'}</div></td><td>${q.covered ? '<span class="status published">answered</span>' : '<span class="status scheduled">not covered</span>'}</td><td style="font-size:13px">${q.top_url ? esc(q.top_url.replace('https://worlddigital.ai', '') || '/') : ''}</td></tr>`).join('');
  const trows = (tenants || []).map((t) => `<tr><td><b>${esc(t.name)}</b><div class="muted" style="font-size:13px">${esc(t.website || 'no website')}</div></td><td>${n(t.pages)} pages · ${n(t.docs)} docs · ${n(t.chunks)} chunks</td>
<td style="white-space:nowrap"><button type="button" data-t-ask="${esc(t.id)}" data-name="${esc(t.name)}">Ask</button> <button type="button" data-t-doc="${esc(t.id)}" data-name="${esc(t.name)}">Add document</button> ${t.website ? `<button type="button" data-t-site="${esc(t.id)}">Re-read website</button>` : ''} <button type="button" data-t-del="${esc(t.id)}" data-name="${esc(t.name)}">Delete</button></td></tr>`).join('');
  const irows = (internal || []).map((d) => `<tr><td><b>${esc(d.title)}</b></td><td>${n(d.chunks)} chunks</td><td style="white-space:nowrap">${esc(fmt(d.updated))}</td><td><button type="button" data-i-del="${esc(d.url)}" data-name="${esc(d.title)}">Remove</button></td></tr>`).join('');
  const au = st.ai_usage_30d || {};
  const NAMES = { products_generate_keywords: 'Keyword research', products_generate_content: 'Content packs', chat_reply: 'Website chat',
    rag_answer: 'Knowledge base answers', rag_embed: 'Knowledge base embeddings', blog_ai_research: 'Blog research', blog_ai_draft: 'Blog drafts', blog_ai_social: 'Social copy',
    blog_ai_cover_image: 'Cover images', blog_video_voiceover: 'Video voice-over', blog_video_write_script: 'Video scripts' };
  const aiRows = (au.features || []).map((r) => `<tr><td>${esc(NAMES[r.feature] || r.feature.replace(/_/g, ' '))}</td><td>${n(r.calls)}</td><td>${n(r.in)}</td><td>${n(r.out)}</td><td>${r.units ? n(r.units) : ''}</td></tr>`).join('');
  const aiTable = `<h3 class="h" style="font-size:17px;margin-top:16px">AI usage (OpenAI, last 30 days)</h3>${au.fallbacks ? `<p style="color:#B42318;font-weight:700">${n(au.fallbacks)} calls used a different model than the configured one (fallback): check the OpenAI project's model access.</p>` : ''}
<div style="overflow-x:auto;border:1px solid #DCE5EF;border-radius:14px;margin-top:8px"><table class="list"><thead><tr><th>Feature</th><th>Calls</th><th>Input tokens</th><th>Output tokens</th><th>Images / characters</th></tr></thead><tbody>${aiRows || '<tr><td colspan="5">No AI calls recorded yet.</td></tr>'}</tbody></table></div>
<p class="muted" style="font-size:13px;margin-top:6px">Models used: ${Object.entries(au.models || {}).map(([m, c]) => `${esc(m.replace(/_/g, '.'))} (${n(c)})`).join(', ') || '–'} · total ${n(au.tokens_in)} input and ${n(au.tokens_out)} output tokens</p>`;
  const table = (head, rows, empty, cols) => `<div style="overflow-x:auto;border:1px solid #DCE5EF;border-radius:14px;margin-top:10px"><table class="list"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${cols}">${empty}</td></tr>`}</tbody></table></div>`;
  const body = `${topbar(ed.email, ed.csrf)}<main class="wrap" style="padding-top:36px;padding-bottom:60px"><h1 class="h" style="font-size:32px">Knowledge base</h1>
<p class="muted">What AI Ahmad, the blog assistant and the public answer API know about worlddigital.ai. It refreshes every night and whenever you publish, update or unpublish a post.${st.error ? ` <b style="color:#B42318">${esc(st.error)}</b>` : ''}</p>
<div class="card" style="margin-top:14px"><h2 class="h" style="font-size:20px">Content</h2>${grid([
    stat('Found in sitemap', n(ct.discovered)), stat('Website pages', n(ct.website_pages)), stat('Blog posts', n(ct.blog_posts)),
    stat('Chunks', n(ct.chunks != null ? ct.chunks : ai.chunks)), stat('Last successful sync', esc(fmt(sy.last_success) || 'never')),
    stat('Waiting to sync', n(sy.pending)), stat('Failed syncs (30 days)', n(sy.failed_30d)), stat('Embedding errors (30 days)', n(us.embed_errors))])}
<p style="margin-top:14px"><button type="button" id="quick">Sync changed pages</button> <button type="button" id="full">Full rebuild (re-reads and re-embeds every page)</button> <span id="smsg" class="muted"></span></p>
${errs ? `<details style="margin-top:8px"><summary>Errors in the last sync (${(sy.recent_errors || []).length})</summary><ul style="font-size:14px">${errs}</ul></details>` : ''}
${removed ? `<details style="margin-top:8px"><summary>Pages removed in the last 30 days (${(sy.removed_30d || []).length})</summary><ul style="font-size:14px">${removed}</ul></details>` : ''}</div>
<div class="card" style="margin-top:14px"><h2 class="h" style="font-size:20px">Answer quality</h2>${ev ? grid([
    stat('Test questions passed', `${n(ev.passed)}/${n(ev.total)}`, `${ev.score}% · ${esc(fmt(ev.at))}`), stat('Right page found', pc(em.retrieval_hit_rate), `rank score ${em.mrr == null ? '–' : em.mrr}`),
    stat('Right page cited', pc(em.citation_accuracy)), stat('Answer correct', pc(em.answer_accuracy)),
    stat('Made-up answers', pc(em.unsupported_answer_rate), 'to questions the site does not cover'), stat('Answer time', ms(em.avg_ms), `slowest 5%: ${ms(em.p95_ms)}`)]) : '<p class="muted">Not run yet.</p>'}
<p style="margin-top:12px"><button type="button" id="evalb">Run quality test</button> <span id="emsg" class="muted"></span></p><div id="evout"></div></div>
<div class="card" style="margin-top:14px"><h2 class="h" style="font-size:20px">Use (last 30 days)</h2>${grid([
    stat('Searches', n(us.searches), `avg ${ms(us.avg_search_ms)}`), stat('Answers (admin and tests)', n(us.answers), `avg ${ms(us.avg_answer_ms)}`),
    stat('Public API answers', n(us.public_answers)), stat('Chat questions', n(qs.total), `${n(qs.uncovered)} not covered`)])}
${aiTable}
<p class="muted" style="font-size:13px;margin-top:10px">Search indexes: ${idx} · Model: ${esc(cf.embedding_model || '')} (${n(cf.embedding_dims)} dimensions) · Chunks: about ${n(cf.chunk_tokens)} tokens, ${n(cf.overlap_tokens)} overlap</p></div>
<h2 class="h" style="font-size:22px;margin-top:28px">Ask the knowledge base</h2>
<form id="ask" class="card" style="margin-top:10px"><label>Question</label><input name="q" maxlength="500" required placeholder="e.g. How much is the content pack?">
<div class="two"><div><label>Search in</label><select name="scope"><option value="ai">Public website</option><option value="ai+internal">Public website + private company knowledge</option><option value="internal">Private company knowledge only</option></select></div>
<div><label>Content type</label><select name="type"><option value="">Everything</option><option value="website_page">Website pages</option><option value="product_page">Product pages</option><option value="blog_post">Blog posts</option></select></div></div>
<input type="hidden" name="tenant" value=""><p class="muted" id="askwho" style="font-size:14px;margin:6px 0 0"></p>
<p style="margin-top:12px"><button class="btn" type="submit" id="askb">Ask</button> <span id="amsg" class="muted"></span></p><div id="aout"></div></form>
<h2 class="h" style="font-size:22px;margin-top:28px">Sync history</h2>${table(['When', 'Type', 'Result', 'Pages', 'Errors', 'Time'], hist, 'No syncs yet.', 6)}
<h2 class="h" style="font-size:22px;margin-top:28px">Chat questions (last 30 days)</h2>
<p class="muted">Questions the knowledge base could not answer are ideas for new pages or posts. Emails and phone numbers are removed, and questions are deleted after 180 days.</p>
${table(['When', 'Question', 'Result', 'Best page'], qrows, 'No questions yet.', 4)}
<h2 class="h" style="font-size:22px;margin-top:32px">Private company knowledge</h2>
<p class="muted">Internal documents (processes, approved answers, technical notes). Only searchable here: never used by the website chat or the public API.</p>
<form id="inew" class="card" style="margin-top:10px"><label>Title</label><input name="title" maxlength="160" required placeholder="e.g. Onboarding checklist">
<label>Text</label><textarea name="text" rows="8" maxlength="200000" required placeholder="Paste the document text here"></textarea>
<p style="margin-top:12px"><button class="btn" type="submit">Add</button> <span id="imsg" class="muted"></span></p></form>
${table(['Document', 'Size', 'Added', ''], irows, 'No private documents yet.', 4)}
<h2 class="h" style="font-size:22px;margin-top:32px">Customer knowledge bases</h2>
<p class="muted">A private knowledge base per customer, built from their website and documents you add. Each one is kept separate: it never mixes with ours or with another customer's.</p>
<form id="tnew" class="card" style="margin-top:10px"><div class="two"><div><label>Customer name *</label><input name="name" required maxlength="120"></div><div><label>Website</label><input name="website" maxlength="200" placeholder="clinic.com"></div></div>
<p style="margin-top:12px"><button class="btn" type="submit">Create</button> <span id="tmsg" class="muted"></span></p></form>
${table(['Customer', 'Contents', ''], trows, 'No customers yet.', 3)}
<form id="tdoc" class="card" style="margin-top:14px;display:none"><h3 class="h" style="font-size:19px" id="tdoch">Add document</h3><label>Title</label><input name="title" maxlength="160" placeholder="e.g. Price list 2026">
<label>Text</label><textarea name="text" rows="10" maxlength="200000" required placeholder="Paste the document text here"></textarea><input type="hidden" name="tenant">
<p style="margin-top:12px"><button class="btn" type="submit">Add to knowledge base</button> <button type="button" id="tdocx">Close</button> <span id="dmsg" class="muted"></span></p></form></main>`;
  const script = `var CSRF=${JSON.stringify(ed.csrf)};function $(i){return document.getElementById(i)}
function post(u,b){return fetch(u,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF':CSRF},body:JSON.stringify(b||{})}).then(function(r){return r.json().catch(function(){return {}}).then(function(j){return {ok:r.ok,j:j}})}).catch(function(){return {ok:false,j:{error:'Network problem. Try again.'}}})}
function el(tag,txt,css){var e=document.createElement(tag);if(txt!=null)e.textContent=txt;if(css)e.style.cssText=css;return e}
function err(x,d){return (x.j&&(x.j.error||x.j.detail))||d}
function sync(full){var b1=$('quick'),b2=$('full');b1.disabled=b2.disabled=true;$('smsg').textContent='Starting…';
(function step(run){post('/blog-admin/kb/index',{full:full,run:run,batch:15}).then(function(x){if(!x.ok){b1.disabled=b2.disabled=false;$('smsg').textContent=err(x,'Sync failed.');return}var d=x.j;
$('smsg').textContent=(full?'Rebuilding: ':'Syncing: ')+d.done+' of '+d.total+' pages…';if(!d.finished)return step(d.run);
$('smsg').textContent='Done: '+d.updated+' updated, '+d.unchanged+' unchanged, '+d.removed+' removed'+(d.errors&&d.errors.length?', '+d.errors.length+' errors':'')+'.';setTimeout(function(){location.reload()},1800)})})(null)}
$('quick').onclick=function(){sync(false)};
$('full').onclick=function(){if(confirm('Re-read and re-embed every page? It takes a few minutes and costs a few cents of OpenAI usage.'))sync(true)};
$('evalb').onclick=function(){$('emsg').textContent='Testing answers… one to two minutes.';post('/blog-admin/kb/eval',{}).then(function(x){if(!x.ok){$('emsg').textContent=err(x,'Test failed.');return}$('emsg').textContent=x.j.passed+'/'+x.j.total+' passed ('+x.j.score+'%).';var o=$('evout');o.textContent='';(x.j.results||[]).filter(function(r){return !r.ok}).forEach(function(r){o.appendChild(el('div','✗ '+r.q+(r.why?' ('+r.why+')':r.missing&&r.missing.length?' (missing: '+r.missing.join(', ')+')':!r.source_ok?' (expected page not cited)':' (expected page not found)'),'font-size:14px;color:#B42318;margin-top:4px'))});setTimeout(function(){location.reload()},4000)})};
function showAnswer(x){var o=$('aout');o.textContent='';$('askb').disabled=false;if(!x.ok){$('amsg').textContent=err(x,'Could not answer.');return}$('amsg').textContent=x.j.covered===false?'Not covered by the knowledge base.':'';
o.appendChild(el('p',x.j.answer,'margin-top:12px;font-size:16.5px;line-height:1.6'));if(x.j.undocumented)o.appendChild(el('p','Not documented: '+x.j.undocumented,'font-size:14px;color:#92400E'));
o.appendChild(el('div','Search: '+(x.j.method||'–')+(x.j.ms!=null?' · '+(x.j.ms/1000).toFixed(1)+' s':''),'font-size:13px;color:#4A5B70'));
(x.j.sources||[]).forEach(function(s,i){var d=el('div',null,'font-size:14px;margin-top:4px');d.appendChild(el('b','['+(s.n||i+1)+'] '));if(/^https:/.test(s.url)){var a=el('a',s.title||s.url);a.href=s.url;a.target='_blank';a.rel='noopener';d.appendChild(a)}else d.appendChild(el('span',(s.title||s.url)+' (private document)'));o.appendChild(d)});
if((x.j.passages||[]).length){var det=el('details',null,'margin-top:10px');det.appendChild(el('summary','Passages found ('+x.j.passages.length+')'));x.j.passages.forEach(function(p){var b=el('div',null,'border-top:1px solid #DCE5EF;padding:8px 0;font-size:14px;white-space:pre-wrap');b.appendChild(el('b',(p.title||p.url)+(p.section&&p.section!==p.title?' › '+p.section:'')+(p.content_type?' · '+p.content_type:'')+(p.score!=null?' · '+Number(p.score).toFixed(3):'')+'\\n'));b.appendChild(document.createTextNode(p.text||''));det.appendChild(b)});o.appendChild(det)}}
$('ask').onsubmit=function(e){e.preventDefault();var f=e.target,t=f.tenant.value;$('askb').disabled=true;$('amsg').textContent='Thinking…';
var sc=f.scope.value==='ai+internal'?['ai','internal']:[f.scope.value];
(t?post('/blog-admin/kb/tenants',{action:'ask',tenant:t,q:f.q.value}):post('/blog-admin/kb/ask',{q:f.q.value,sources:sc,types:f.type.value?[f.type.value]:null})).then(showAnswer)};
$('inew').onsubmit=function(e){e.preventDefault();var f=e.target;$('imsg').textContent='Adding…';post('/blog-admin/kb/internal',{action:'add-doc',title:f.title.value,text:f.text.value}).then(function(x){$('imsg').textContent=x.ok?'Added ('+x.j.chunks+' chunks).':err(x,'Could not add.');if(x.ok)setTimeout(function(){location.reload()},1200)})};
document.querySelectorAll('[data-i-del]').forEach(function(b){b.onclick=function(){if(!confirm('Remove "'+b.dataset.name+'" from private company knowledge?'))return;post('/blog-admin/kb/internal',{action:'remove-doc',url:b.dataset.iDel}).then(function(x){if(x.ok)location.reload();else alert(err(x,'Could not remove.'))})}});
$('tnew').onsubmit=function(e){e.preventDefault();var f=e.target;$('tmsg').textContent='Creating…';post('/blog-admin/kb/tenants',{action:'create',name:f.name.value,website:f.website.value}).then(function(x){if(!x.ok){$('tmsg').textContent=err(x,'Could not create.');return}
if(!f.website.value){location.reload();return}$('tmsg').textContent='Created. Reading the website…';post('/blog-admin/kb/tenants',{action:'index-site',tenant:x.j.id}).then(function(y){$('tmsg').textContent=y.ok?'Done: '+y.j.pages+' pages read.':err(y,'Created, but the website could not be read.');setTimeout(function(){location.reload()},1500)})})};
document.querySelectorAll('[data-t-ask]').forEach(function(b){b.onclick=function(){var f=$('ask');f.tenant.value=b.dataset.tAsk;f.scope.disabled=f.type.disabled=true;$('askwho').textContent='Searching: '+b.dataset.name+' (customer knowledge base) · ';var r=el('a','switch back');r.href='#';r.onclick=function(e){e.preventDefault();f.tenant.value='';f.scope.disabled=f.type.disabled=false;$('askwho').textContent=''};$('askwho').appendChild(r);f.scrollIntoView({behavior:'smooth'});f.q.focus()}});
document.querySelectorAll('[data-t-doc]').forEach(function(b){b.onclick=function(){var f=$('tdoc');f.style.display='block';f.tenant.value=b.dataset.tDoc;$('tdoch').textContent='Add document for '+b.dataset.name;f.scrollIntoView({behavior:'smooth'})}});
$('tdocx').onclick=function(){$('tdoc').style.display='none'};
$('tdoc').onsubmit=function(e){e.preventDefault();var f=e.target;$('dmsg').textContent='Adding…';post('/blog-admin/kb/tenants',{action:'add-doc',tenant:f.tenant.value,title:f.title.value,text:f.text.value}).then(function(x){$('dmsg').textContent=x.ok?'Added ('+x.j.chunks+' chunks).':err(x,'Could not add.');if(x.ok)setTimeout(function(){location.reload()},1200)})};
document.querySelectorAll('[data-t-site]').forEach(function(b){b.onclick=function(){b.disabled=true;b.textContent='Reading…';post('/blog-admin/kb/tenants',{action:'index-site',tenant:b.dataset.tSite}).then(function(x){b.textContent=x.ok?'Done: '+x.j.pages+' pages':'Failed';if(!x.ok)alert(err(x,'Could not read the website.'));else setTimeout(function(){location.reload()},1200)})}});
document.querySelectorAll('[data-t-del]').forEach(function(b){b.onclick=function(){if(!confirm('Delete the knowledge base for '+b.dataset.name+'? Everything in it is removed. This cannot be undone.'))return;post('/blog-admin/kb/tenants',{action:'delete',tenant:b.dataset.tDel}).then(function(x){if(x.ok)location.reload();else alert(err(x,'Could not delete.'))})}});`;
  return new Response(shell('Knowledge base', body, nonce, script), { headers: headers(nonce) });
}

function leadsPage(nonce, ed, leads) {
  const rowsHtml = leads.map((l) => {
    let d = {}; try { d = JSON.parse(l.data); } catch {}
    const kv = Object.entries(d).map(([k, v]) => `<div><span class="muted">${esc(k)}:</span> ${esc(v)}</div>`).join('');
    return `<tr><td style="white-space:nowrap">${esc(fmt(l.created_at))}</td><td>${l.kind === 'waitlist' ? 'Autopilot early list' : l.kind === 'contact' ? 'Contact form' : l.kind === 'plan' ? 'SEO plan sign-up' : 'Job application'}</td><td style="font-size:14.5px">${kv}</td></tr>`;
  }).join('');
  const body = `${topbar(ed.email, ed.csrf)}<main class="wrap" style="padding-top:36px;padding-bottom:60px"><h1 class="h" style="font-size:32px">Form entries</h1>
<p class="muted">Autopilot early-list sign-ups and job applications from the website. Each one is also emailed to you.</p>
<div style="overflow-x:auto;margin-top:16px;border:1px solid #DCE5EF;border-radius:14px"><table class="list"><thead><tr><th>When</th><th>Form</th><th>Details</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="3">Nothing yet.</td></tr>'}</tbody></table></div></main>`;
  return new Response(shell('Form entries', body, nonce), { headers: headers(nonce) });
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set(['feed', 'feed.xml', 'admin', 'editor', 'new', 'page', 'topic', 'rss']);

export function validate(d) {
  const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, n);
  const out = {
    originalSlug: d.originalSlug ? clean(d.originalSlug, 90) : null, action: d.action, title: clean(d.title, 140).trim(), slug: clean(d.slug, 90).trim(),
    category: clean(d.category, 40).trim(), excerpt: clean(d.excerpt, 300).trim(), body: clean(d.body, 120000), seo_title: clean(d.seo_title, 90).trim(),
    description: clean(d.description, 200).trim(), cover_id: /^[a-f0-9]{20}$/.test(d.cover_id || '') ? d.cover_id : '', cover_alt: clean(d.cover_alt, 160).trim(),
  };
  if (!['save', 'publish', 'update', 'schedule', 'unpublish', 'autosave'].includes(out.action)) return { error: 'Unknown action.' };
  if (!out.title) return { error: 'Please add a title.' };
  if (!SLUG_RE.test(out.slug) || RESERVED.has(out.slug)) return { error: 'The page address can only use lowercase letters, numbers and single dashes.' };
  if (['publish', 'update', 'schedule'].includes(out.action)) {
    if (out.body.trim().length < 200) return { error: 'The post is very short. Add at least a few paragraphs before publishing.' };
    if (!out.description && !out.excerpt) return { error: 'Add a short summary or a Google description before publishing.' };
  }
  if (out.action === 'schedule') {
    const t = Date.parse(d.publish_at || '');
    if (!t || t < Date.now() + 5 * 60e3) return { error: 'Pick a time at least 5 minutes from now.' };
    if (t > Date.now() + 366 * 86400e3) return { error: 'Pick a date within the next year.' };
    out.publish_at = new Date(t).toISOString();
  }
  return out;
}

export async function handleAdmin(req, env, url, store, ctx, { pingNow, prod }) {
  const nonce = randomToken().slice(0, 22);
  const path = url.pathname.replace(/\/+$/, '') || '/blog-admin';
  const method = req.method;
  if (method === 'POST' && !sameOrigin(req, url)) return new Response('Forbidden', { status: 403 });

  // --- sign in ---
  if (path === '/blog-admin/login' && method === 'POST') {
    let f; try { f = await req.formData(); } catch { return loginPage(nonce, { error: 'Please enter your email and try again.' }); }
    const email = String(f.get('email') || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return loginPage(nonce, { error: 'Please enter a valid email address.' });
    if (!(await humanOk(env, String(f.get('cf-turnstile-response') || ''), req.headers.get('CF-Connecting-IP') || ''))) return loginPage(nonce, { error: 'Please complete the quick human check and try again.' });
    if (admins(env).includes(email)) {
      const token = randomToken();
      if (await store.addLoginToken(await sha256(token), email, LINK_MS)) {
        const link = `${url.origin}/blog-admin/verify?t=${token}`;
        const sent = await sendEmail(env, email, 'Your sign-in link for the WorldDigital.ai blog editor',
          `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#0E1A2B"><p>Click the button to sign in to the blog editor. The link works once and expires in 20 minutes.</p>
<p><a href="${link}" style="display:inline-block;background:#C13A2A;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Open the blog editor</a></p>
<p style="color:#4A5B70;font-size:14px">If you didn't ask for this, you can ignore this email.</p><p style="font-size:14px;color:#33445A"><b>WorldDigital.ai</b><br>SEO &amp; AI search (GEO, AEO) &middot; Google Ads &amp; PPC &middot; Content &middot; Websites<br>worlddigital.ai</p></div>`);
        if (!sent && env.DEV_SHOW_LINK === '1') return loginPage(nonce, { notice: `Dev mode: ${link}` });
      }
    }
    return loginPage(nonce, { sent: true });
  }
  if (path === '/blog-admin/verify' && method === 'GET') {
    const t = url.searchParams.get('t') || '';
    const body = `<main class="wrap" style="max-width:480px;padding-top:70px"><div class="card"><h1 class="h" style="font-size:26px">Sign in to the blog editor</h1><p class="muted">Click below to open the editor on this device.</p>
<form method="post" action="/blog-admin/verify"><input type="hidden" name="t" value="${esc(t)}"><button class="btn red" type="submit" style="width:100%">Open the blog editor</button></form></div></main>`;
    return new Response(shell('Sign in', body, nonce), { headers: headers(nonce) });
  }
  if (path === '/blog-admin/verify' && method === 'POST') {
    let f; try { f = await req.formData(); } catch { return loginPage(nonce, { error: 'That sign-in link is not valid. Enter your email for a new one.' }); }
    const email = await store.useLoginToken(await sha256(String(f.get('t') || '')));
    if (!email || !admins(env).includes(email)) return loginPage(nonce, { error: 'That sign-in link has expired or was already used. Enter your email for a new one.' });
    const tok = randomToken();
    await store.addSession(await sha256(tok), email, SESSION_MS);
    return new Response(null, { status: 303, headers: { Location: '/blog-admin', 'Set-Cookie': `${COOKIE}=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MS / 1000}`, 'Cache-Control': 'no-store' } });
  }

  const ed = await currentEditor(env, store, req);
  if (!ed) {
    if (method === 'GET') return loginPage(nonce);
    return json({ error: 'Your session ended. Open the editor in a new tab, sign in, then save again. Your text is kept on this page.' }, 401);
  }
  // CSRF for everything that changes data
  if (method === 'POST') {
    const sent = req.headers.get('X-CSRF') || (req.headers.get('Content-Type') || '').includes('form') && (await req.clone().formData()).get('csrf');
    if (sent !== ed.csrf) return json({ error: 'Security check failed. Reload the page and try again.' }, 403);
  }

  const ai = /^\/blog-admin\/ai\/(research|draft|job|autopilot)$/.exec(path);
  if (ai && method === 'POST') {
    let d; try { d = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }
    if (!d || typeof d !== 'object' || JSON.stringify(d).length > 8000) return json({ error: 'Bad request.' }, 400);
    if (ai[1] === 'job') { const j = await store.aiJob(d.id); return j ? json(j) : json({ error: 'That job was not found.' }, 404); }
    if (ai[1] === 'autopilot') {
      if (d.action === 'save') return json({ ok: true, settings: await store.setAutopilot(d.settings || {}, ed.email) });
      if (d.action === 'run') { const r = await store.aiStart('autopilot', {}, ed.email); return json(r, r.error ? 429 : 200); }
      return json({ settings: await store.getAutopilot() });
    }
    if (!env.TOOLS_API_URL) return json({ error: 'The AI assistant is being set up. Please try again later.' }, 503);
    const r = await store.aiStart(ai[1], { ...d, publish: ai[1] === 'draft' && d.publish === true }, ed.email);
    return json(r, r.error ? 429 : 200);
  }
  if (path === '/blog-admin/logout' && method === 'POST') {
    await store.endSession(ed.hash);
    return new Response(null, { status: 303, headers: { Location: '/blog-admin', 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } });
  }
  if (path === '/blog-admin' && method === 'GET') return dashboard(nonce, ed, await store.listPosts({ all: true }), url.searchParams.get('m') || '');
  if (path === '/blog-admin/leads' && method === 'GET') return leadsPage(nonce, ed, await store.listLeads());
  if (path === '/blog-admin/kb' && method === 'GET') {
    const [st, qs, tn, it] = await Promise.all([backend(env, 'GET', '/api/admin/rag'), backend(env, 'GET', '/api/admin/rag/questions?days=30'),
      backend(env, 'POST', '/api/admin/rag/tenants', { action: 'list' }), backend(env, 'POST', '/api/admin/rag/internal', { action: 'list' })]);
    return kbPage(nonce, ed, st.ok ? st.data : { error: st.data.error || 'Could not load the knowledge base.' }, qs.ok ? qs.data : {},
      tn.ok ? tn.data.tenants : [], it.ok ? it.data.docs : []);
  }
  const kb = /^\/blog-admin\/kb\/(index|ask|eval|tenants|internal)$/.exec(path);
  if (kb && method === 'POST') {
    let b = {}; try { b = await req.json(); } catch {}
    if (!b || typeof b !== 'object' || JSON.stringify(b).length > 210000) return json({ error: 'Bad request.' }, 400);
    const SCOPES = ['ai', 'internal'];
    const call = {
      index: () => backend(env, 'POST', '/api/admin/rag/index', { source: 'ai', full: b.full === true, run: typeof b.run === 'string' ? b.run.slice(0, 40) : null,
        batch: Math.max(1, Math.min(Number(b.batch) || 15, 40)), trigger: 'admin' }, 280000),
      eval: () => backend(env, 'POST', '/api/admin/rag/eval', {}, 280000),
      ask: () => backend(env, 'POST', '/api/admin/rag/ask', { q: String(b.q || '').slice(0, 500),
        sources: (Array.isArray(b.sources) ? b.sources : ['ai']).filter((x) => SCOPES.includes(x)), types: Array.isArray(b.types) ? b.types.slice(0, 3) : null }, 90000),
      internal: () => backend(env, 'POST', '/api/admin/rag/internal', { action: b.action, title: b.title, text: b.text, url: b.url }, 120000),
      tenants: () => backend(env, 'POST', '/api/admin/rag/tenants', b, b.action === 'index-site' ? 280000 : 90000),
    }[kb[1]];
    const r = await call();
    const quiet = kb[1] === 'ask' || (kb[1] === 'index' && b.run) || (['tenants', 'internal'].includes(kb[1]) && ['ask', 'list', 'docs'].includes(b.action));
    if (!quiet) {
      await store.log(ed.email, `kb_${kb[1]}${b.action ? '_' + b.action : ''}${b.full ? '_full' : ''}`, JSON.stringify({ tenant: b.tenant, name: b.name || b.title, status: r.status }).slice(0, 300));
    }
    return json(r.ok ? r.data : { error: r.data.error || 'Knowledge base request failed.' }, r.ok ? 200 : (r.status || 500));
  }
  if (path === '/blog-admin/new' && method === 'GET') {
    const cats = [...new Set((await store.listPosts({ all: true })).map((p) => p.category).filter(Boolean))];
    return editorPage(nonce, ed, null, cats);
  }
  const m = /^\/blog-admin\/(edit|preview)\/([a-z0-9-]+)$/.exec(path);
  if (m && method === 'GET') {
    const p = await store.getPost(m[2]);
    if (!p || p.redirect) return new Response('Post not found', { status: 404 });
    if (m[1] === 'preview') {
      const others = await store.listPosts();
      const r = blogPost(p, others, { prod: false, preview: !p.live });
      return new Response(r, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    }
    const cats = [...new Set((await store.listPosts({ all: true })).map((x) => x.category).filter(Boolean))];
    return editorPage(nonce, ed, p, cats);
  }
  if (path === '/blog-admin/save' && method === 'POST') {
    let d; try { d = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }
    const v = validate(d);
    if (v.error) return json({ error: v.error }, 400);
    if (v.action === 'autosave') return json({ ok: true });
    const r = await store.savePost(v, ed.email);
    if (r.error === 'slug_taken') return json({ error: 'Another post already uses this page address. Change it a little.' }, 409);
    const messages = { save: 'Draft saved.', unpublish: 'Saved as a draft. It is no longer on the blog.', publish: 'Published. It is live on the blog now.',
      update: 'Live post updated.', schedule: 'Scheduled. It will go live automatically at the time you picked.' };
    if (prod && (v.action === 'publish' || v.action === 'update')) ctx.waitUntil(pingNow());
    if (v.action === 'publish') ctx.waitUntil(store.queueShare(r.slug).catch((e) => console.log('queue share', e.message)));
    // keep the knowledge base current: re-read this post now (an unpublished post is removed from it)
    if (prod && ['publish', 'update', 'unpublish'].includes(v.action)) {
      const urls = [`${SITE}/blog/${r.slug}`, ...(v.originalSlug && v.originalSlug !== r.slug ? [`${SITE}/blog/${v.originalSlug}`] : [])];
      ctx.waitUntil(Promise.all(urls.map((u) => backend(env, 'POST', '/api/admin/rag/index-url', { url: u }, 120000)))
        .then((rs) => rs.forEach((x) => { if (!x.ok) console.log('kb re-index', x.status, JSON.stringify(x.data).slice(0, 200)); })));
    }
    return json({ ok: true, slug: r.slug, status: r.status, message: messages[v.action] });
  }
  if (path === '/blog-admin/upload' && method === 'POST') {
    let f; try { f = await req.formData(); } catch { return json({ error: 'No photo received.' }, 400); }
    const file = f.get('file');
    if (!file || typeof file === 'string') return json({ error: 'No photo received.' }, 400);
    if (!IMAGE_TYPES.includes(file.type)) return json({ error: 'Please upload a JPG, PNG, WebP or GIF photo.' }, 400);
    if (file.size > MAX_IMAGE) return json({ error: 'That photo is too large. Try a smaller one.' }, 400);
    const bytes = await file.arrayBuffer();
    const head = new Uint8Array(bytes.slice(0, 12));
    const isImg = (head[0] === 0xFF && head[1] === 0xD8) || (head[0] === 0x89 && head[1] === 0x50) || (head[0] === 0x47 && head[1] === 0x49) ||
      (head[0] === 0x52 && head[1] === 0x49 && head[8] === 0x57 && head[9] === 0x45);
    if (!isImg) return json({ error: 'That file is not a photo we can use.' }, 400);
    const id = await store.putMedia(bytes, file.type, String(f.get('alt') || '').slice(0, 160), ed.email);
    return json({ ok: true, id, url: `/media/${id}` });
  }
  return new Response('Not found', { status: 404 });
}

export { mdToHtml, SITE, kbPage };
