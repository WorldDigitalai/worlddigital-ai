// Markdown for AI agents: a request with `Accept: text/markdown` gets the page as clean Markdown
// (main content only, no styles, scripts, navigation or footer).
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&middot;': '·', '&rarr;': '→', '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”', '&mdash;': '—', '&ndash;': '–' };
const decode = (s) => s.replace(/&[a-z#0-9]+;/gi, (e) => ENT[e] ?? (/^&#(\d+);$/.test(e) ? String.fromCharCode(+e.slice(2, -1)) : e));

export function htmlToMarkdown(html, url) {
  const title = decode((/<title>([^<]*)<\/title>/i.exec(html) || [, ''])[1]);
  const desc = decode((/<meta name="description" content="([^"]*)"/i.exec(html) || [, ''])[1]);
  let m = (/<main[^>]*>([\s\S]*?)<\/main>/i.exec(html) || [, html])[1];
  m = m.replace(/<(script|style|noscript|svg|form|template)[\s\S]*?<\/\1>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (x, n, t) => `\n\n${'#'.repeat(+n)} ${t.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (x, href, t) => {
      const txt = t.replace(/<[^>]+>/g, '').trim();
      if (!txt) return '';
      const abs = href.startsWith('/') ? `https://worlddigital.ai${href}` : href;
      return `[${txt}](${abs})`;
    })
    .replace(/<img [^>]*alt="([^"]+)"[^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '\n- ').replace(/<\/li>/gi, '')
    .replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, (x, t) => `\n\n**${t.replace(/<[^>]+>/g, '').trim()}**\n`)
    .replace(/<(b|strong)>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|details|tr|table|ul|ol|blockquote|dd|dt)>/gi, '\n\n')
    .replace(/<t[dh][^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, '');
  m = decode(m).split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  // page facts for AI agents and our knowledge base (one line each, no line breaks inside values)
  const one = (v) => String(v || '').replace(/\s+/g, ' ').trim();
  const canonical = (/<link rel="canonical" href="([^"]+)"/i.exec(html) || [, url])[1];
  const lang = (/<html[^>]*\blang="([^"]+)"/i.exec(html) || [, 'en'])[1];
  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(html);
  const ld = (k) => decode((new RegExp(`"${k}":"([^"]*)"`).exec(html) || [, ''])[1]);
  const blog = /"@type":"BlogPosting"/.test(html);
  const type = blog ? 'blog_post' : /\/(tools|free-seo-report|keyword-research|content-marketing)\b/.test(url) ? 'product_page'
    : /\/blog(\/topic\/|$|\?)/.test(url) ? 'blog_index' : 'website_page';
  const meta = [['title', title], ['description', desc], ['url', url], ['canonical', decode(canonical)], ['language', lang], ['type', type],
    ['published', blog ? ld('datePublished') : ''], ['modified', blog ? ld('dateModified') : ''], ['category', blog ? ld('articleSection') : ''],
    ['robots', noindex ? 'noindex' : '']].filter(([, v]) => one(v)).map(([k, v]) => `${k}: ${one(v)}`).join('\n');
  return `---\n${meta}\n---\n\n${m}\n`;
}

export const wantsMarkdown = (req) => /text\/markdown/i.test(req.headers.get('Accept') || '') && !/text\/html/i.test(req.headers.get('Accept') || '');
