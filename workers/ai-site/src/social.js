// /social: our published posts from Buffer (data/social.json, refreshed nightly by tools/fetch_social.py).
import data from '../data/social.json';
import { SITE, SOCIAL, crumbs, esc } from './layout.js';

const posts = (data.posts || []).filter((p) => p.text);
const PER_PAGE = 24;
const fmt = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '');
const labels = [...new Set(posts.map((p) => p.platformLabel))].sort();
const COLORS = { LinkedIn: '#0A66C2', Instagram: '#C13584', Facebook: '#0F63D6', YouTube: '#D93025', TikTok: '#111111', X: '#0E1A2B', 'Google Business': '#1765CC' };

// Top performing first (weighted engagement), newest first on ties, so the page opens on the best posts.
const sorted = [...posts].sort((a, b) => (b.score - a.score) || (b.date > a.date ? 1 : -1));

const card = (p, i) => `<article class="sf-card" data-p="${esc(p.platformLabel)}" data-s="${p.score}" data-d="${esc(p.date)}"${i >= PER_PAGE ? ' hidden' : ''}>
${p.thumb ? `<div class="sf-thumb"><img class="sf-bg" src="${esc(p.thumb)}" alt="${esc(`${p.platformLabel} post image (background)`)}" aria-hidden="true" loading="lazy" decoding="async" referrerpolicy="no-referrer"><img class="sf-img" src="${esc(p.thumb)}" alt="${esc(`${p.platformLabel} post: ${p.text.slice(0, 80)}`)}" loading="lazy" decoding="async" width="400" height="400" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></div>` : ''}
<div class="sf-body"><div class="sf-meta"><span class="sf-badge" style="--c:${COLORS[p.platformLabel] || '#0D5EC7'}">${esc(p.platformLabel)}</span><time datetime="${esc(p.date)}">${fmt(p.date)}</time></div>
<p class="sf-text">${esc(p.text)}</p>
${p.link ? `<a class="sf-link" href="${esc(p.link)}" target="_blank" rel="noopener">View on ${esc(p.platformLabel)} <span aria-hidden="true">→</span></a>` : ''}</div></article>`;

const CSS = `<style>
.sf-bar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;margin-bottom:22px}
.sf-filters{display:flex;flex-wrap:wrap;gap:8px}
.sf-filters button{min-height:44px;padding:8px 16px;border-radius:99px;border:1.5px solid #DCE5EF;background:#fff;font:inherit;font-weight:600;font-size:14.5px;color:#33445A;cursor:pointer}
.sf-filters button[aria-pressed=true]{background:#0D5EC7;border-color:#0D5EC7;color:#fff}
.sf-sort{display:flex;align-items:center;gap:10px;margin:0;font-weight:600;font-size:14.5px}
.sf-sort select{width:auto;min-height:44px}
.sf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.sf-card{background:#fff;border:1px solid #DCE5EF;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;content-visibility:auto;contain-intrinsic-size:auto 460px}
/* Whole image, never cropped: square frame, the picture contained, a blurred copy of it filling the sides
   (portrait carousel slides, 9:16 video covers and wide images all fit). */
.sf-thumb{position:relative;aspect-ratio:1/1;background:#0E1A2B;overflow:hidden}.sf-thumb img{position:absolute;inset:0;width:100%;height:100%;display:block}.sf-img{object-fit:contain}.sf-bg{object-fit:cover;filter:blur(22px) brightness(.8);transform:scale(1.25)}
.sf-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
.sf-meta{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#4A5B70}
.sf-badge{display:inline-block;padding:4px 10px;border-radius:99px;font-weight:700;font-size:12.5px;color:#fff;background:var(--c)}
.sf-text{margin:0;font-size:15px;line-height:1.55;color:#33445A;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}
.sf-link{margin-top:auto;font-weight:700;font-size:14.5px;text-decoration:none}
.sf-more{display:block;margin:28px auto 0;min-height:48px;padding:12px 22px;border-radius:12px;border:1.5px solid #0D5EC7;background:#fff;color:#0D5EC7;font:inherit;font-weight:700;cursor:pointer}
.sf-updated{text-align:center;font-size:13.5px;color:#4A5B70;margin:14px 0 0}
</style>`;

const JS = `<script>(function(){var g=document.getElementById('sf-grid');if(!g)return;var cards=[].slice.call(g.children),f='all',sort='top',shown=${PER_PAGE},more=document.getElementById('sf-more');
function by(a,b){var da=a.getAttribute('data-d'),db=b.getAttribute('data-d');if(sort==='top'){var s=+b.getAttribute('data-s')-+a.getAttribute('data-s');if(s)return s}return db>da?1:db<da?-1:0}
function apply(){var list=cards.filter(function(c){return f==='all'||c.getAttribute('data-p')===f}).sort(by);cards.forEach(function(c){c.hidden=true});list.forEach(function(c,i){g.appendChild(c);c.hidden=i>=shown});more.hidden=list.length<=shown}
[].forEach.call(document.querySelectorAll('.sf-filters button'),function(b){b.addEventListener('click',function(){f=b.getAttribute('data-f');shown=${PER_PAGE};[].forEach.call(document.querySelectorAll('.sf-filters button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});apply()})});
document.getElementById('sf-sort').addEventListener('change',function(e){sort=e.target.value;apply()});
more.addEventListener('click',function(){shown+=${PER_PAGE};apply()});more.hidden=cards.length<=shown})();</script>`;

export const SOCIAL_UPDATED = data.updated || '';

export const socialBody = `${CSS}
<section style="background:#fff;border-bottom:1px solid #DCE5EF"><div class="wrap" style="padding-top:56px;padding-bottom:56px">
<nav aria-label="Breadcrumb" style="font-size:14px" class="muted"><a href="/">Home</a> / Social Hub</nav>
<div class="eyebrow" style="margin-top:18px">Social Hub</div>
<h1 class="h hero-h" style="font-size:52px;line-height:1.08;margin-top:12px;max-width:860px">The WorldDigital.ai <span style="color:#0D5EC7">Social Hub.</span></h1>
<p style="font-size:19px;line-height:1.6;color:#33445A;margin:18px 0 0;max-width:760px">Short SEO, AI search and marketing tips for SMBs, SMEs and enterprises, from our ${esc(labels.join(', ').replace(/, ([^,]*)$/, ' and $1'))} channels. Filter by platform, or see the top performing posts first.</p>
<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:26px"><a class="btn red" href="/free-seo-report">Get my free SEO report</a><a class="btn ghost" href="/contact">Contact us</a></div>
<p class="sf-follow" style="margin:22px 0 0;font-size:15px;line-height:2"><strong>Follow us:</strong> ${SOCIAL.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener me" style="display:inline-block;min-height:24px">${esc(n)}</a>`).join(' · ')}</p>
</div></section>

<section class="sec"><div class="wrap">
<div class="sf-bar">
<div class="sf-filters" role="group" aria-label="Filter by platform"><button type="button" data-f="all" aria-pressed="true">All</button>${labels.map((l) => `<button type="button" data-f="${esc(l)}" aria-pressed="false">${esc(l)}</button>`).join('')}</div>
<label class="sf-sort" for="sf-sort">Sort by <select id="sf-sort"><option value="top">Top performing</option><option value="new">Newest</option></select></label>
</div>
<div class="sf-grid" id="sf-grid">
${sorted.map(card).join('\n')}
</div>
<button type="button" class="sf-more" id="sf-more">Show more posts</button>
<p class="sf-updated">${posts.length} posts · updated nightly from our social channels</p>
</div></section>
${JS}`;

// CollectionPage + the posts themselves, so search engines and AI tools can read each one.
export const socialSchema = [
  {
    '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${SITE}/social#page`, url: `${SITE}/social`,
    name: 'WorldDigital.ai Social Hub', about: { '@id': `${SITE}/#org` },
    ...(SOCIAL_UPDATED ? { dateModified: SOCIAL_UPDATED.replace('Z', ':00Z') } : {}),
    mainEntity: {
      '@type': 'ItemList', numberOfItems: posts.length,
      itemListElement: sorted.slice(0, 50).map((p, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: {
          // Google's discussion-forum rules: author needs a name and the post needs text, an image or a video.
          '@type': 'SocialMediaPosting', headline: p.text.slice(0, 110), text: p.text.slice(0, 1000), datePublished: p.date, url: p.link || undefined,
          ...(p.thumb ? { image: p.thumb } : {}),
          author: { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'WorldDigital.ai', url: `${SITE}/` },
          publisher: { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'WorldDigital.ai', url: `${SITE}/` },
        },
      })),
    },
  },
  crumbs([['Home', '/'], ['Social Hub', '/social']]),
];
