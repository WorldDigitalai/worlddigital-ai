// AI assistant side panel for the blog editor (/blog-admin/new and /edit).
// Research: Google Trends (past 3 months), keyword volume/CPC/trend, live Google results (web search),
// People also ask (AEO) and AI Overview sources (GEO) -> ranked post ideas incl. "vs" and "alternatives" posts.
// Draft: one click writes the full post into the editor, or writes and publishes it (Write & publish).
// Work runs as background jobs in the Store Durable Object (src/autopilot.js) which call the Python tools API
// (backend/app/blog_ai.py); the page polls /blog-admin/ai/job. Autopilot writes and publishes on a schedule.

export const COMPETITORS = {
  'All-in-one marketing': ['HubSpot', 'Thryv', 'Keap'],
  'Freelance marketplaces': ['Fiverr', 'Upwork'],
  'SEO software': ['Semrush', 'Ahrefs', 'Moz', 'SE Ranking', 'Ubersuggest'],
  'AI search visibility': ['Profound', 'Otterly.ai', 'Peec AI'],
  'Local SEO & reviews': ['BrightLocal', 'Yext', 'Birdeye', 'Podium', 'Whitespark', 'Local Falcon'],
  'AI content': ['Jasper', 'Surfer SEO', 'Copy.ai'],
  'Agencies': ['WebFX', 'Scorpion', 'Thrive Agency'],
  'Website builders': ['Wix', 'Squarespace', 'GoDaddy'],
  'EHR/EMR integration': ['Redox', 'Health Gorilla'],
};
const TOPICS = ['AI SEO', 'Generative engine optimization', 'Answer engine optimization', 'Local SEO', 'Google Ads',
  'Keyword research', 'AI content generator', 'Custom software', 'AI automation', 'EHR integration', 'Website design'];
export const TYPES = { vs: 'Comparison (vs)', alternatives: 'Alternatives', 'how-to': 'How-to guide', list: 'List / best-of',
  'what-is': 'Explainer', local: 'Local guide', pricing: 'Pricing guide' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const AI_CSS = `
.tabs{display:flex;gap:6px;margin-bottom:12px}.tabs button{flex:1;min-height:42px;border:1px solid #B9C7D8;background:#fff;border-radius:10px;font:inherit;font-weight:700;cursor:pointer}
.tabs button[aria-selected=true]{background:#0E1A2B;color:#fff;border-color:#0E1A2B}
.ai{background:#fff;border:1px solid #DCE5EF;border-radius:16px;padding:18px;position:sticky;top:12px;max-height:calc(100vh - 140px);overflow:auto}
.ai h3{font-size:16px;margin:18px 0 8px}.ai h3:first-child{margin-top:0}.ai .sub{font-size:13px;color:#4A5B70;margin:4px 0 8px}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{border:1px solid #B9C7D8;background:#fff;border-radius:99px;padding:5px 11px;font:inherit;font-size:13.5px;cursor:pointer}
.chip[aria-pressed=true]{background:#C13A2A;border-color:#C13A2A;color:#fff}.chip.r{border-color:#86EFAC;background:#F0FDF4}
.grp{font-size:12px;font-weight:700;color:#4A5B70;text-transform:uppercase;letter-spacing:.04em;margin:10px 0 4px}
.idea{border:1px solid #DCE5EF;border-radius:12px;padding:12px;margin:8px 0}.idea b{display:block;font-size:15.5px;line-height:1.35}
.idea .m{font-size:13px;color:#4A5B70;margin:4px 0 8px}.badge{display:inline-block;font-size:12px;font-weight:700;border-radius:99px;padding:2px 8px;background:#EEF2F7;margin-right:6px}
.badge.vs{background:#FEE2E2;color:#991B1B}.badge.alternatives{background:#FEF3C7;color:#92400E}
.kt{width:100%;border-collapse:collapse;font-size:13px}.kt td,.kt th{padding:6px 4px;border-bottom:1px solid #EEF2F7;text-align:left}.kt .n{text-align:right;white-space:nowrap}
.up{color:#15803D;font-weight:700}.down{color:#B42318;font-weight:700}
.spark{display:flex;align-items:center;gap:8px;font-size:13.5px;margin:4px 0}.spark svg{flex:none}
.ai .row{display:flex;gap:6px;flex-wrap:wrap}.ai .row>*{flex:1;min-width:120px}
.ai ul{margin:6px 0 0 18px;padding:0;font-size:14px;line-height:1.5}
.ai .btn{min-height:40px;padding:8px 14px;font-size:14.5px}
.wdt-spin{display:inline-block;width:14px;height:14px;border:2px solid #DCE5EF;border-top-color:#C13A2A;border-radius:50%;margin-right:8px;vertical-align:-2px;animation:wdspin .8s linear infinite}
@keyframes wdspin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.wdt-spin{animation:none}}`;

export function aiPanelHtml() {
  const compChips = Object.entries(COMPETITORS).map(([g, names]) => `<div class="grp">${esc(g)}</div><div class="chips">${names.map((n) =>
    `<button type="button" class="chip" data-comp="${esc(n)}" aria-pressed="false">${esc(n)}</button>`).join('')}</div>`).join('');
  return `<div class="ai" id="aipanel" role="tabpanel" aria-label="AI assistant">
<h3>1. Find what’s trending (past 3 months)</h3>
<p class="sub">Google Trends, keyword volume and cost per click, live Google results, “People also ask” (AEO) and AI Overview sources (GEO).</p>
<div class="row"><input id="ai-topic" maxlength="100" placeholder="Topic, e.g. AI SEO (empty = all our services)"><select id="ai-country" aria-label="Market" style="flex:0 0 auto;width:auto"><option value="us">United States</option><option value="ca">Canada</option></select></div>
<div class="chips" style="margin-top:8px">${TOPICS.map((t) => `<button type="button" class="chip" data-topic="${esc(t)}">${esc(t)}</button>`).join('')}</div>
<button type="button" class="btn red" id="ai-go" style="width:100%;margin-top:10px">Find trending post ideas</button>
<details style="margin-top:14px"><summary><b>2. Compare with competitors</b> <span class="muted" style="font-size:13px">(for “vs” posts)</span></summary>
<p class="sub">Pick 1–3. Ideas will include comparisons with them, or write a vs post right away.</p>${compChips}
<div class="row" style="margin-top:10px"><button type="button" class="btn ghost" id="ai-vs">Write “vs” draft</button><button type="button" class="btn red" id="ai-vs-pub">Write &amp; publish “vs”</button></div></details>
<details style="margin-top:12px"><summary><b>Or write from your own title</b></summary>
<input id="ai-title" maxlength="140" placeholder="e.g. Best AI SEO tools for Houston businesses" style="margin-top:8px">
<div class="row" style="margin-top:6px"><select id="ai-type" aria-label="Post type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select>
<select id="ai-words" aria-label="Length"><option value="1000">Short (~1,000 words)</option><option value="1600" selected>Standard (~1,600 words)</option><option value="2200">Long (~2,200 words)</option></select></div>
<textarea id="ai-notes" maxlength="1000" style="min-height:60px;margin-top:6px" placeholder="Notes for the writer (optional): points to cover, offer to mention…"></textarea>
<div class="row" style="margin-top:8px"><button type="button" class="btn ghost" id="ai-own">Write draft</button><button type="button" class="btn red" id="ai-own-pub">Write &amp; publish</button></div></details>
<details style="margin-top:12px" id="ap"><summary><b>3. Autopilot</b> <span class="muted" style="font-size:13px" id="ap-state">(off)</span></summary>
<p class="sub">Finds the best trending idea, writes it and publishes it for you on a schedule. You get an email for every post.</p>
<label style="display:flex;gap:8px;align-items:center;font-weight:700;margin-top:6px"><input type="checkbox" id="ap-on" style="width:auto;min-height:0"> Autopilot on</label>
<div class="row" style="margin-top:6px"><label style="margin:0">How often<select id="ap-every"><option value="1">Every day</option><option value="2" selected>Every 2 days</option><option value="3.5">Twice a week</option><option value="7">Once a week</option></select></label>
<label style="margin:0">Time (Houston)<select id="ap-hour">${Array.from({ length: 24 }, (_, h) => `<option value="${h}"${h === 9 ? ' selected' : ''}>${h === 0 ? '12 am' : h < 12 ? h + ' am' : h === 12 ? '12 pm' : (h - 12) + ' pm'}</option>`).join('')}</select></label></div>
<label style="margin-top:6px">Each new post<select id="ap-mode"><option value="publish">Publish it automatically</option><option value="draft">Save as a draft for me to review</option></select></label>
<label style="margin-top:6px">Topics to rotate <span class="muted" style="font-weight:400">(comma-separated; empty = trending across all our services)</span><input id="ap-topics" maxlength="600" placeholder="AI SEO, Local SEO, Google Ads, GEO"></label>
<label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="ap-vs" checked style="width:auto;min-height:0"> Every other post is a comparison (vs / alternatives), using the competitors picked above</label>
<div class="row" style="margin-top:10px"><button type="button" class="btn red" id="ap-save">Save Autopilot</button><button type="button" class="btn ghost" id="ap-run">Run one now</button></div>
<p class="sub" id="ap-info" style="margin-top:8px"></p></details>
<p class="msg" id="ai-msg" role="status" aria-live="polite" style="margin-top:12px"></p>
<div id="ai-out"></div>
<p class="sub" style="margin-top:14px">“Write draft” fills the editor for you to review. “Write &amp; publish” and Autopilot publish without review, so spot-check competitor details on live posts.</p>
</div>`;
}

// Runs in the browser inside the editor script (uses its $, upd, say and dirty).
export function aiPanelClient() {
  var A = window.WD_AI || {}, R = null, busy = false;
  var e = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmtN = function (n) { return n == null ? '–' : Number(n).toLocaleString('en-US'); };
  var pct = function (n) { return n == null ? '–' : '<span class="' + (n >= 0 ? 'up' : 'down') + '">' + (n > 0 ? '+' : '') + n + '%</span>'; };
  var tabs = document.querySelectorAll('.tabs button');
  function tab(name) {
    tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === name)); });
    $('aipanel').hidden = name !== 'ai'; $('pvpanel').hidden = name !== 'pv';
    try { localStorage.setItem('wd-ai-tab', name); } catch (x) {}
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { tab(b.getAttribute('data-tab')); }); });
  var saved = null; try { saved = localStorage.getItem('wd-ai-tab'); } catch (x) {}
  tab(A.isNew ? 'ai' : (saved === 'ai' ? 'ai' : 'pv'));

  function msg(t, k) { var m = $('ai-msg'); m.innerHTML = t; m.className = 'msg ' + (k || ''); }
  function picked() { return [].slice.call(document.querySelectorAll('[data-comp][aria-pressed=true]')).map(function (b) { return b.getAttribute('data-comp'); }); }
  document.querySelectorAll('[data-comp]').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      if (on && picked().length >= 3) { msg('Pick up to 3 competitors.', 'err'); return; }
      b.setAttribute('aria-pressed', String(on));
    });
  });
  document.querySelectorAll('[data-topic]').forEach(function (b) {
    b.addEventListener('click', function () { $('ai-topic').value = b.getAttribute('data-topic'); research(); });
  });

  function post(path, body) {
    return fetch('/blog-admin/ai/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': CSRF }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.'); return j; }); });
  }
  // Start a background job and poll it until it is done (survives slow AI; resumes after a reload).
  function job(kind, body, onDone, onErr) {
    post(kind, body).then(function (j) {
      if (!j.id) throw new Error('The AI job could not start. Please try again.');
      try { localStorage.setItem('wd-ai-pending', JSON.stringify({ id: j.id, kind: kind, publish: !!body.publish })); } catch (x) {}
      poll(j.id, onDone, onErr);
    }).catch(onErr);
  }
  function poll(id, onDone, onErr) {
    var tries = 0;
    (function go() {
      post('job', { id: id }).then(function (j) {
        if (j.state === 'done' || j.state === 'error') { try { localStorage.removeItem('wd-ai-pending'); } catch (x) {} }
        if (j.state === 'done') return onDone(j.result);
        if (j.state === 'error') return onErr(new Error(j.error || 'The AI job failed. Please try again.'));
        if (++tries > 200) return onErr(new Error('This is taking unusually long. Check the posts list in a few minutes.'));
        setTimeout(go, 3000);
      }).catch(function (x) { if (/not found/i.test(x.message) || ++tries > 200) { try { localStorage.removeItem('wd-ai-pending'); } catch (y) {} return onErr(x); } setTimeout(go, 5000); });
    })();
  }
  function lock(on, steps) {
    busy = on; document.querySelectorAll('.ai button').forEach(function (b) { b.disabled = on; });
    clearInterval(lock.t);
    if (on) { var i = 0; msg(steps[0]); lock.t = setInterval(function () { i = Math.min(i + 1, steps.length - 1); msg(steps[i]); }, 9000); }
  }

  function spark(points, i) {
    var v = points.map(function (p) { return p.values[i] || 0; }); if (!v.length) return '';
    var max = Math.max.apply(null, v.concat([1])), w = 120, h = 28;
    var d = v.map(function (y, x) { return (x ? 'L' : 'M') + (x * w / Math.max(1, v.length - 1)).toFixed(1) + ' ' + (h - 2 - y / max * (h - 4)).toFixed(1); }).join(' ');
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="#C13A2A" stroke-width="2"/></svg>';
  }
  function ideaCard(it, i) {
    return '<div class="idea"><b>' + e(it.title) + '</b><div class="m"><span class="badge ' + e(it.type) + '">' + e(A.types[it.type] || it.type) + '</span>' +
      'Keyword: ' + e(it.keyword) + (it.competitors && it.competitors.length ? ' · vs ' + e(it.competitors.join(', ')) : '') + ' · Score ' + e(it.score) +
      '<br>' + e(it.why) + '</div><div class="row"><button type="button" class="btn ghost" data-idea="' + i + '">Write draft</button><button type="button" class="btn red" data-idea="' + i + '" data-pub="1">Write &amp; publish</button></div></div>';
  }
  function render(d) {
    R = d; var h = '';
    var t = d.trend || {};
    if (t.points && t.points.length) {
      h += '<h3>Google Trends · past 3 months · ' + e(d.market) + '</h3>' + (t.keywords || []).map(function (k, i) {
        return '<div class="spark">' + spark(t.points, i) + '<span><b>' + e(k) + '</b> ' + pct((t.change || [])[i]) + '</span></div>';
      }).join('');
    }
    if (d.rising && d.rising.length) {
      h += '<h3>Rising searches</h3><p class="sub">Click one to research it.</p><div class="chips">' + d.rising.map(function (q) {
        return '<button type="button" class="chip r" data-rise="' + e(q.query) + '">' + e(q.query) + ' <b>+' + e(q.value) + '%</b></button>';
      }).join('') + '</div>';
    }
    if (d.ideas && d.ideas.length) h += '<h3>Best posts to write now</h3>' + d.ideas.map(ideaCard).join('');
    if (d.keywords && d.keywords.length) {
      h += '<h3>Best keywords</h3><div style="overflow-x:auto"><table class="kt"><thead><tr><th>Keyword</th><th class="n">Searches/mo</th><th class="n">CPC</th><th>Comp.</th><th class="n">3-mo</th></tr></thead><tbody>' +
        d.keywords.slice(0, 15).map(function (k) {
          return '<tr><td>' + e(k.keyword) + '</td><td class="n">' + fmtN(k.volume) + '</td><td class="n">' + (k.cpc == null ? '–' : '$' + k.cpc.toFixed(2)) + '</td><td>' + e((k.competition || '–').toLowerCase()) + '</td><td class="n">' + pct(k.trend) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    var s = d.serp || {};
    if (s.questions && s.questions.length) h += '<h3>People also ask (AEO)</h3><p class="sub">Answer these in your post; drafts use them for the FAQ.</p><ul>' + s.questions.map(function (q) { return '<li>' + e(q) + '</li>'; }).join('') + '</ul>';
    if (s.ai_overview) {
      h += '<h3>Google AI Overview (GEO)</h3><p class="sub">' + (s.ai_overview.present ? 'Shown for this search. Sites it cites:' : 'Not shown for this search right now.') + '</p>' +
        (s.ai_overview.sources && s.ai_overview.sources.length ? '<ul>' + s.ai_overview.sources.map(function (x) { return '<li>' + e(x.domain) + (x.title ? ' — ' + e(x.title) : '') + '</li>'; }).join('') + '</ul>' : '');
    }
    if (s.organic && s.organic.length) h += '<h3>Who ranks on Google page 1</h3><ul>' + s.organic.map(function (o) { return '<li>#' + e(o.rank) + ' <b>' + e(o.domain) + '</b> — ' + e(o.title) + '</li>'; }).join('') + '</ul>';
    if (d.competitors && d.competitors.length) h += '<h3>Competitors for this topic</h3><ul>' + d.competitors.map(function (c) { return '<li><b>' + e(c.name) + '</b> — ' + e(c.offers) + '</li>'; }).join('') + '</ul>';
    if (d.notes && d.notes.length) h += '<h3>What top pages do</h3><ul>' + d.notes.map(function (n) { return '<li>' + e(n) + '</li>'; }).join('') + '</ul>';
    if (d.unavailable && d.unavailable.length) h += '<p class="sub">Some Google data was not available this time (' + e(d.unavailable.join(', ')) + ').</p>';
    $('ai-out').innerHTML = h;
    $('ai-out').querySelectorAll('[data-idea]').forEach(function (b) {
      b.addEventListener('click', function () { var it = R.ideas[+b.getAttribute('data-idea')]; write({ title: it.title, keyword: it.keyword, type: it.type, competitors: it.competitors }, b.getAttribute('data-pub') === '1'); });
    });
    $('ai-out').querySelectorAll('[data-rise]').forEach(function (b) {
      b.addEventListener('click', function () { $('ai-topic').value = b.getAttribute('data-rise'); research(); });
    });
  }

  function research() {
    if (busy) return;
    lock(true, ['<span class="wdt-spin"></span>Checking Google Trends for the past 3 months…', 'Pulling keyword volume and cost per click…', 'Reading live Google results and AI Overviews…', 'Ranking the best posts to write…']);
    job('research', { topic: $('ai-topic').value.trim(), country: $('ai-country').value, competitors: picked() }, researched, failed);
  }
  function researched(d) {
    lock(false); msg('Done. ' + (d.ideas || []).length + ' post ideas, best first.', 'ok'); render(d);
    try { localStorage.setItem('wd-ai-last', JSON.stringify(d)); } catch (x) {}
  }
  function failed(x) { lock(false); msg(e(x.message), 'err'); }
  $('ai-go').addEventListener('click', research);
  $('ai-topic').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); research(); } });

  function filled() { return ['title', 'excerpt', 'body'].some(function (k) { return $(k).value.trim(); }); }
  function write(o, publish) {
    if (busy) return;
    if (publish && !confirm('Write this post and publish it on worlddigital.ai right away, without review?')) return;
    if (!publish && filled() && !confirm('Replace what is in the editor now with a new AI draft?')) return;
    o.publish = !!publish;
    o.country = $('ai-country').value; o.words = +$('ai-words').value || 1600;
    if (!o.notes) o.notes = $('ai-notes').value.trim();
    lock(true, ['<span class="wdt-spin"></span>Researching the live Google results for “' + e(o.keyword || o.title) + '”…', 'Writing the post (about a minute)…', 'Adding the comparison table and FAQ…', 'Almost done…']);
    job('draft', o, drafted, failed);
  }
  function drafted(d) {
      lock(false);
      if (d.published) { dirty = false; msg('Published: ' + e(d.title), 'ok'); location.href = '/blog-admin/edit/' + encodeURIComponent(d.slug) + '?saved=' + encodeURIComponent('Written and published. It is live on the blog now.'); return; }
      $('title').value = d.title; if (!LIVE) { $('slug').value = d.slug; slugEdited = true; }
      $('cat').value = d.category || $('cat').value; $('excerpt').value = d.excerpt; $('body').value = d.body;
      $('seo_title').value = d.seo_title; $('desc').value = d.description; dirty = true; upd(); tab('pv');
      msg('Draft written into the editor. Review it, add a cover photo' + (d.image_idea ? ' (idea: ' + e(d.image_idea) + ')' : '') + ', then save or publish.', 'ok');
      say('AI draft added. Not saved yet.', 'ok');
  }
  function vsPost(publish) {
    var c = picked(); if (!c.length) { msg('Pick at least one competitor first.', 'err'); return; }
    var topic = $('ai-topic').value.trim(), yr = new Date().getFullYear();
    write({ title: 'WorldDigital.ai vs ' + c.join(' vs ') + (topic ? ' for ' + topic : '') + ': which is best for small business in ' + yr + '?',
      keyword: c.map(function (x) { return x.toLowerCase(); }).join(' vs ') + (topic ? ' ' + topic.toLowerCase() : ''), type: 'vs', competitors: c }, publish);
  }
  $('ai-vs').addEventListener('click', function () { vsPost(false); });
  $('ai-vs-pub').addEventListener('click', function () { vsPost(true); });
  function own(publish) {
    var t = $('ai-title').value.trim(); if (!t) { msg('Type a title first.', 'err'); $('ai-title').focus(); return; }
    write({ title: t, keyword: t, type: $('ai-type').value, competitors: picked() }, publish);
  }
  $('ai-own').addEventListener('click', function () { own(false); });
  $('ai-own-pub').addEventListener('click', function () { own(true); });

  // ---- Autopilot ----
  var when = function (ms) { return ms ? new Date(ms).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago' }) : ''; };
  function apShow(c) {
    $('ap-on').checked = !!c.enabled; $('ap-every').value = String(c.every_days); $('ap-hour').value = String(c.hour);
    $('ap-mode').value = c.mode; $('ap-topics').value = (c.topics || []).join(', '); $('ap-vs').checked = c.mix_vs !== false;
    (c.competitors || []).forEach(function (n) { var b = document.querySelector('[data-comp="' + n.replace(/"/g, '') + '"]'); if (b) b.setAttribute('aria-pressed', 'true'); });
    $('ap-state').textContent = c.enabled ? '(on · next post ' + when(c.next_run) + ')' : '(off)';
    var l = c.last_run, info = c.enabled ? 'Next post: ' + when(c.next_run) + ' (Houston time). ' : 'Autopilot is off. ';
    if (l) info += l.error ? 'Last run failed: ' + l.error : l.skipped ? 'Last run: ' + l.message : 'Last post: “' + l.title + '” (' + (l.status === 'published' ? 'published' : 'draft') + ', ' + new Date(l.at).toLocaleDateString('en-US') + ').';
    $('ap-info').textContent = info;
  }
  function apSettings() {
    return { enabled: $('ap-on').checked, every_days: +$('ap-every').value, hour: +$('ap-hour').value, mode: $('ap-mode').value,
      topics: $('ap-topics').value, competitors: picked(), country: $('ai-country').value, words: +$('ai-words').value || 1600, mix_vs: $('ap-vs').checked };
  }
  $('ap-save').addEventListener('click', function () {
    var s = apSettings();
    if (s.enabled && s.mode === 'publish' && !confirm('Autopilot will publish a new AI-written post on worlddigital.ai ' + $('ap-every').selectedOptions[0].textContent.toLowerCase() + ' without review. Turn it on?')) return;
    post('autopilot', { action: 'save', settings: s }).then(function (r) { apShow(r.settings); msg(r.settings.enabled ? 'Autopilot saved. Next post ' + e(when(r.settings.next_run)) + '.' : 'Autopilot is off.', 'ok'); }).catch(failed);
  });
  $('ap-run').addEventListener('click', function () {
    if (busy) return;
    var s = apSettings();
    if (!confirm('Run Autopilot now? It will ' + (s.mode === 'publish' ? 'write and publish' : 'write a draft of') + ' one post using the saved settings (save first if you changed them).')) return;
    lock(true, ['<span class="wdt-spin"></span>Autopilot: finding the best trending idea…', 'Autopilot: writing the post (1–3 minutes)…', 'Autopilot: almost done…']);
    job('autopilot', { action: 'run' }, function (r) {
      lock(false);
      if (r.skipped) { msg(e(r.message), ''); return; }
      msg('Autopilot ' + (r.status === 'published' ? 'published' : 'saved a draft of') + ' “' + e(r.title) + '”. <a href="/blog-admin/edit/' + encodeURIComponent(r.slug) + '">Open it</a>', 'ok');
      post('autopilot', { action: 'get' }).then(function (x) { apShow(x.settings); });
    }, failed);
  });
  post('autopilot', { action: 'get' }).then(function (r) { apShow(r.settings); }).catch(function () {});
  // A job that was still running when the page was reloaded
  try {
    var pend = JSON.parse(localStorage.getItem('wd-ai-pending') || 'null');
    if (pend && pend.id) {
      lock(true, ['<span class="wdt-spin"></span>Still working on your ' + (pend.kind === 'research' ? 'research' : 'post') + '…']);
      poll(pend.id, pend.kind === 'research' ? researched : pend.kind === 'draft' ? drafted : function () { lock(false); msg('Autopilot finished. See the posts list.', 'ok'); }, failed);
    }
  } catch (x) {}
  try { var last = JSON.parse(localStorage.getItem('wd-ai-last') || 'null'); if (last) { render(last); $('ai-topic').value = last.topic || ''; msg('Showing your last research (' + e(last.month || '') + '). Run it again for fresh data.'); } } catch (x) {}
}
