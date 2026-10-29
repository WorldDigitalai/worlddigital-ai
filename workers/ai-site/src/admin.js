// Private blog editor at /blog-admin. One-time email sign-in links, only for ADMIN_EMAILS.
import { esc, CSS, SITE } from './layout.js';
import { mdToHtml } from './md.js';
import { blogPost } from './blog.js';
import { humanOk, widget } from './human.js';

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
</style></head><body>${body}${script ? `<script nonce="${nonce}">${script}</script>` : ''}</body></html>`;
}

function topbar(email, csrf) {
  return `<div class="ad-top"><div class="wrap"><a href="/blog-admin">WorldDigital.ai · Blog editor</a>
<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><a href="/blog" target="_blank" rel="noopener">View blog ↗</a><a href="/blog-admin/leads">Form entries</a><span style="color:#C9D6E6;font-size:14px">${esc(email)}</span>
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
<div><div class="pv"><div class="eyebrow">Live preview</div><h1 class="h" id="pv-t" style="font-size:32px;margin-top:10px"></h1><p id="pv-e" style="font-size:17px;color:#33445A"></p><div class="prose" id="pv"></div></div></div>
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
upd()})();`;
  return new Response(shell(isNew ? 'New post' : p.title, body, nonce, script), { headers: headers(nonce) });
}

function leadsPage(nonce, ed, leads) {
  const rowsHtml = leads.map((l) => {
    let d = {}; try { d = JSON.parse(l.data); } catch {}
    const kv = Object.entries(d).map(([k, v]) => `<div><span class="muted">${esc(k)}:</span> ${esc(v)}</div>`).join('');
    return `<tr><td style="white-space:nowrap">${esc(fmt(l.created_at))}</td><td>${l.kind === 'waitlist' ? 'Autopilot early list' : l.kind === 'contact' ? 'Contact form' : 'Job application'}</td><td style="font-size:14.5px">${kv}</td></tr>`;
  }).join('');
  const body = `${topbar(ed.email, ed.csrf)}<main class="wrap" style="padding-top:36px;padding-bottom:60px"><h1 class="h" style="font-size:32px">Form entries</h1>
<p class="muted">Autopilot early-list sign-ups and job applications from the website. Each one is also emailed to you.</p>
<div style="overflow-x:auto;margin-top:16px;border:1px solid #DCE5EF;border-radius:14px"><table class="list"><thead><tr><th>When</th><th>Form</th><th>Details</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="3">Nothing yet.</td></tr>'}</tbody></table></div></main>`;
  return new Response(shell('Form entries', body, nonce), { headers: headers(nonce) });
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set(['feed', 'feed.xml', 'admin', 'editor', 'new', 'page', 'topic', 'rss']);

function validate(d) {
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

  if (path === '/blog-admin/logout' && method === 'POST') {
    await store.endSession(ed.hash);
    return new Response(null, { status: 303, headers: { Location: '/blog-admin', 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } });
  }
  if (path === '/blog-admin' && method === 'GET') return dashboard(nonce, ed, await store.listPosts({ all: true }), url.searchParams.get('m') || '');
  if (path === '/blog-admin/leads' && method === 'GET') return leadsPage(nonce, ed, await store.listLeads());
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

export { mdToHtml, SITE };
