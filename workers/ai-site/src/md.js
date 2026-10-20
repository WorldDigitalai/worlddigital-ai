// Small, safe Markdown renderer used by the blog and the editor's live preview.
// Supports: ## / ### / #### headings, paragraphs, - and 1. lists, > quotes, | tables |,
// **bold**, *italic*, `code`, [links](url), ![images](url), --- rules.
// All text is HTML-escaped; only http(s), mailto, tel, relative and #anchor URLs are kept.
// Self-contained (no imports) so its source can be shipped to the browser as-is.
export function mdToHtml(src) {
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(u)) return u.replace(/"/g, '%22');
    return '';
  }
  function slugify(s) { return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }
  function inline(s) {
    var out = esc(s);
    var codes = [];
    out = out.replace(/`([^`]+)`/g, function (m, c) { codes.push('<code>' + c + '</code>'); return '\u0000' + (codes.length - 1) + '\u0000'; });
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, u) { var s2 = safeUrl(u.replace(/&amp;/g, '&')); return s2 ? '<img src="' + s2 + '" alt="' + alt + '" loading="lazy">' : ''; });
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      var s2 = safeUrl(u.replace(/&amp;/g, '&'));
      if (!s2) return t;
      var ext = /^https?:\/\//i.test(s2) && !/^https?:\/\/(www\.)?worlddigital\.(ai|us)(\/|$)/i.test(s2);
      return '<a href="' + s2 + '"' + (ext ? ' rel="noopener" target="_blank"' : '') + '>' + t + '</a>';
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, '$1<em>$2</em>');
    out = out.replace(/\u0000(\d+)\u0000/g, function (m, i) { return codes[+i]; });
    return out;
  }
  var lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  var html = [], i = 0, para = [];
  function flush() { if (para.length) { html.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
  while (i < lines.length) {
    var line = lines[i];
    var t = line.trim();
    if (!t) { flush(); i++; continue; }
    var h = /^(#{2,4})\s+(.+)$/.exec(t);
    if (h) { flush(); var lvl = h[1].length, txt = inline(h[2].replace(/\s+#+$/, '')); html.push('<h' + lvl + ' id="' + slugify(txt) + '">' + txt + '</h' + lvl + '>'); i++; continue; }
    if (/^#\s+/.test(t)) { flush(); html.push('<h2>' + inline(t.replace(/^#\s+/, '')) + '</h2>'); i++; continue; }
    if (/^(-{3,}|\*{3,})$/.test(t)) { flush(); html.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(t)) {
      flush(); var q = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      html.push('<blockquote><p>' + inline(q.join(' ')) + '</p></blockquote>'); continue;
    }
    if (/^\|.*\|$/.test(t)) {
      flush(); var rows = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) { rows.push(lines[i].trim()); i++; }
      var cells = function (r) { return r.slice(1, -1).split('|').map(function (c) { return c.trim(); }); };
      var head = cells(rows[0]), body = rows.slice(1);
      if (body.length && /^[\s|:-]+$/.test(body[0])) body = body.slice(1);
      html.push('<div class="tbl"><table><thead><tr>' + head.map(function (c) { return '<th scope="col">' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        body.map(function (r) { return '<tr>' + cells(r).map(function (c, k) { return k === 0 ? '<th scope="row">' + inline(c) + '</th>' : '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
      continue;
    }
    var ul = /^[-*+]\s+(.+)$/, ol = /^\d+[.)]\s+(.+)$/;
    if (ul.test(t) || ol.test(t)) {
      flush(); var ordered = ol.test(t) && !ul.test(t), re = ordered ? ol : ul, items = [];
      while (i < lines.length && re.test(lines[i].trim())) { items.push(inline(re.exec(lines[i].trim())[1])); i++; }
      var tag = ordered ? 'ol' : 'ul';
      html.push('<' + tag + '>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</' + tag + '>'); continue;
    }
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(t)) { flush(); html.push(inline(t)); i++; continue; }
    para.push(t); i++;
  }
  flush();
  return html.join('\n');
}

export function mdToText(src) {
  return String(src || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*`|_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function readMinutes(src) { return Math.max(1, Math.ceil(mdToText(src).split(' ').length / 200)); }

export function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const l of m[1].split('\n')) { const k = l.indexOf(':'); if (k > 0) meta[l.slice(0, k).trim()] = l.slice(k + 1).trim(); }
  return { meta, body: m[2] };
}
