// Shared page shell for worlddigital.ai: head (SEO + analytics), header, footer, CSS.
import { CHAT_HTML } from './chat.js';
export const SITE = 'https://worlddigital.ai';
export const CONTACT = '/contact';
export const START = '/tools';
export const REPORT = '/free-seo-report';
export const GBP = 'https://share.google/FB4831wKavklYkwE8';
export const BBB = 'https://www.bbb.org/us/tn/murfreesboro/profile/marketing-software/worlddigitalai-corporation-llc-0573-37385441';
const GA4 = 'G-C6V00GEZP6';
const GTM = 'GTM-P7FV5QN6';
const ADS = 'AW-16853962405'; // Google Ads conversion tag (loaded on first interaction, like GA4 and GTM)

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const CSS = `
@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:optional;src:url(/fonts/inter-var-latin.woff2) format("woff2")}
@font-face{font-family:"Inter Fallback";src:local("Arial");ascent-override:90.44%;descent-override:22.52%;line-gap-override:0%;size-adjust:107.12%}
@font-face{font-family:Sora;font-style:normal;font-weight:100 800;font-display:optional;src:url(/fonts/sora-var-latin.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:500;font-display:swap;src:url(/fonts/plex-mono-500-latin.woff2) format("woff2")}
:root{--ink:#0E1A2B;--ink2:#33445A;--muted:#4A5B70;--line:#DCE5EF;--bg:#F4F8FC;--blue:#0D5EC7;--blue2:#0B4FA8;--red:#C13A2A;--green:#15803D}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:#F4F8FC;font-family:Inter,"Inter Fallback",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0E1A2B;line-height:1.5}
img{max-width:100%;height:auto}
a{color:#0D5EC7}a:hover{color:#0B4FA8}
:focus-visible{outline:3px solid #93C5FD;outline-offset:2px}
.skip{position:absolute;left:-999px;top:8px;background:#fff;padding:10px 14px;border-radius:8px;z-index:50}.skip:focus{left:8px}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.h{font-family:Sora,Inter,sans-serif;letter-spacing:-0.02em;margin:0;overflow-wrap:break-word}
.eyebrow{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#0B4FA8}
.top{background:#fff;border-bottom:1px solid #DCE5EF;position:sticky;top:0;z-index:20}
.topin{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:72px}
.brand{font-family:Sora,Inter,sans-serif;font-weight:800;font-size:21px;color:#0E1A2B;text-decoration:none;display:flex;align-items:center;gap:10px}
.brand img{width:36px;height:36px;border-radius:9px;box-shadow:0 0 0 1px #DCE5EF}
.brand small{display:block;font-family:Inter,sans-serif;font-weight:500;font-size:12px;color:#4A5B70;letter-spacing:.01em}
.nav{display:flex;gap:20px;font-size:15px;white-space:nowrap}
.nav a{color:#33445A;text-decoration:none;font-weight:500;display:inline-flex;align-items:center;min-height:44px}.nav a:hover,.nav a[aria-current=page]{color:#0D5EC7}
.menu{display:none}
.btn{white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 20px;border-radius:12px;font-weight:700;font-size:15.5px;text-decoration:none;border:0;cursor:pointer;font-family:inherit}
.btn.red{background:#C13A2A;color:#fff}.btn.red:hover{background:#A42F21;color:#fff}
.btn.green{background:#15803D;color:#fff}.btn.ghost{background:#fff;color:#0D5EC7;border:1.5px solid #0D5EC7}
.card{background:#fff;border:1px solid #DCE5EF;border-radius:18px;padding:26px}
.muted{color:#4A5B70}
.chip{display:inline-block;padding:6px 12px;border-radius:99px;background:#EAF2FB;color:#0B4FA8;font-size:13.5px;font-weight:600}
.sec{padding:72px 0}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.grid4{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
.tick{display:flex;gap:10px;align-items:flex-start;line-height:1.5}
.tick svg{flex:none;margin-top:3px}
.svc{text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:10px}
.kv{display:grid;grid-template-columns:max-content 1fr;gap:12px 24px;font-size:15.5px;margin:0}.kv dt{color:#4A5B70}.kv dd{margin:0;font-weight:600}
.foot{background:#0E1A2B;color:#C9D6E6;padding:56px 0 32px}
.foot a{color:#E6EDF6;text-decoration:none}.foot a:hover{text-decoration:underline}
.foot p a[href$="-policy"],.foot p a[href="/terms-and-conditions"]{text-decoration:underline;text-underline-offset:2px}.foot h2.fh{font-family:Sora,Inter,sans-serif;color:#fff;font-size:15px;margin:0 0 12px}
table.cmp{width:100%;border-collapse:collapse;font-size:15px;background:#fff;border-radius:16px;overflow:hidden}
table.cmp th,table.cmp td{padding:14px 16px;border-bottom:1px solid #DCE5EF;text-align:left;vertical-align:top}
table.cmp th{background:#F7FAFD;color:#33445A;font-weight:600}
details{border-bottom:1px solid #DCE5EF;padding:16px 0}
summary{font-weight:700;cursor:pointer;font-size:16.5px}
.crumbs{font-size:14px;color:#4A5B70}.crumbs a{color:#4A5B70}
label{display:block;font-weight:600;font-size:14.5px;margin:14px 0 6px}
input,select,textarea{width:100%;min-height:48px;padding:10px 12px;border:1.5px solid #B9C7D8;border-radius:10px;font:inherit;background:#fff;color:#0E1A2B}
textarea{min-height:120px;resize:vertical}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0 16px}
.hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}
.socials{display:flex;flex-wrap:wrap;gap:10px;margin:32px 0 0}.soc{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;border:1px solid #33506F;color:#fff;transition:background .15s,transform .15s}.soc svg{width:19px;height:19px;fill:currentColor}.soc:hover{background:#0D5EC7;transform:translateY(-2px)}.form-msg{margin:12px 0 0;font-weight:600}.form-msg.ok{color:#15803D}.form-msg.err{color:#B42318}
.cta{background:#0D5EC7;color:#fff;padding:64px 0}
.prose{font-size:17.5px;line-height:1.75;color:#1F2D3D}
.prose h2{font-family:Sora,Inter,sans-serif;font-size:28px;line-height:1.25;margin:44px 0 12px;letter-spacing:-.01em}
.prose h3{font-family:Sora,Inter,sans-serif;font-size:21px;margin:32px 0 10px}
.prose p{margin:0 0 18px}.prose ul,.prose ol{padding-left:22px;margin:0 0 18px}.prose li{margin:6px 0}
.prose blockquote{margin:0 0 18px;padding:12px 18px;border-left:4px solid #0D5EC7;background:#fff;border-radius:0 12px 12px 0}
.prose img{border-radius:14px;display:block;margin:8px 0 22px}
.prose .tbl{overflow-x:auto;margin:0 0 22px;border:1px solid #DCE5EF;border-radius:14px;background:#fff}
.prose table{width:100%;border-collapse:collapse;font-size:15.5px}.prose th,.prose td{padding:12px 14px;border-bottom:1px solid #DCE5EF;text-align:left}.prose th{background:#F7FAFD}
.post-card{display:flex;flex-direction:column;gap:10px;text-decoration:none;color:inherit;height:100%}
.post-card img{border-radius:12px;aspect-ratio:16/9;object-fit:cover;width:100%}
.post-card:hover h2,.post-card:hover h3{color:#0D5EC7}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.filters a{padding:8px 14px;border-radius:99px;border:1px solid #DCE5EF;background:#fff;text-decoration:none;color:#33445A;font-weight:600;font-size:14.5px}.filters a[aria-current=page]{background:#0E1A2B;color:#fff;border-color:#0E1A2B}
/* Tap targets: at least 24px tall for links that stand alone (breadcrumbs, table cells), per WCAG 2.2 target size */
.crumbs a,nav[aria-label=Breadcrumb] a,table a,dd a,.sf-link{display:inline-block;min-height:24px;line-height:24px}
@media (max-width:1260px){.brand small{display:none}.nav{gap:16px;font-size:14.5px}}
@media (max-width:1000px){.nav{display:none}.menu{display:block}.top .btn.red{display:none}}@media (max-width:720px){.nav-cta .btn.ghost{display:none}}
@media (max-width:420px){.brand small{display:none}}
@media (max-width:720px){.sec{padding:48px 0}.hero-h{font-size:36px!important}.kv{grid-template-columns:1fr}.wrap{padding:0 16px}h2.h{font-size:30px!important}}
.menu summary{list-style:none;border:1.5px solid #B9C7D8;border-radius:10px;padding:10px 14px;font-size:15px}.menu summary::-webkit-details-marker{display:none}
.menu{border:0;padding:0;position:relative}.menu nav{position:absolute;right:0;top:52px;background:#fff;border:1px solid #DCE5EF;border-radius:14px;padding:10px;display:flex;flex-direction:column;min-width:230px;box-shadow:0 20px 40px -20px rgba(14,26,43,.35)}
.menu nav a{padding:12px 12px;border-radius:10px;text-decoration:none;color:#0E1A2B;font-weight:600}.menu nav a:hover{background:#EAF2FB}

/* ===== Same look as worlddigital.us (Design direction A · Analyst's Desk) ===== */
:root{--shadow:0 1px 2px rgba(14,26,43,.04),0 18px 36px -26px rgba(14,26,43,.4);--navy:#0E1A2B;--mono-blue:#0B4FA8}
body{-webkit-font-smoothing:antialiased;overflow-x:hidden}
.h,h1,h2,h3{font-family:Sora,Inter,"Inter Fallback",system-ui,sans-serif}
h2.h{font-weight:700;letter-spacing:-.025em}
.hero-h{font-weight:800;letter-spacing:-.035em}
.eyebrow{font-weight:500;letter-spacing:.06em}
.btn{border-radius:10px;transition:transform .15s,box-shadow .15s,background .15s}
.btn.red{box-shadow:0 8px 18px -10px rgba(193,58,42,.55)}.btn.red:hover{transform:translateY(-1px)}
.btn.green{background:#108043;box-shadow:0 8px 20px -8px rgba(16,128,67,.55)}.btn.green:hover{background:#0B6635;color:#fff;transform:translateY(-1px)}
.btn.ghost{border:1px solid #DCE5EF;color:#0E1A2B}.btn.ghost:hover{border-color:#0D5EC7;color:#0D5EC7}
.chip{background:#fff;border:1px solid #DCE5EF;border-radius:8px;color:#33445A}
.card{border-radius:16px;transition:transform .2s,box-shadow .2s}
a.card:hover,.svc:hover,.post-card:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
.hero-sky{background:linear-gradient(135deg,#EAF2FB 0%,#F1F6FC 20%,#F7FAFD 45%,#F7FAFD 75%,#EEF3F9 100%)!important}
.ic{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;margin-bottom:6px;flex:none}.ic svg{width:24px;height:24px}
.ic-blue{background:#E8F0FA;color:#0B4FA8}.ic-mix{background:#ECEFFA;color:#3346A0}.ic-red{background:#FBECE9;color:#A8321F}.ic-green{background:#E3F4EA;color:#146C3A}
.tags{list-style:none;padding:0;margin:4px 0 0;display:flex;flex-wrap:wrap;gap:6px}.tags li{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;background:#F1F6FD;color:#0B4FA8}
.stats{display:grid;background:#0E1A2B;border-radius:18px;padding:28px 32px;gap:24px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));box-shadow:0 30px 60px -30px rgba(14,26,43,.6)}
.stat{color:#fff;text-decoration:none;display:block}.stat b{display:block;font-family:Sora,Inter,sans-serif;color:#fff;font-weight:700;font-size:clamp(22px,2.4vw,28px);letter-spacing:-.03em}
.stat span{display:block;font-size:14px;color:#B7C5D6;margin-top:4px;line-height:1.45}
a.stat span{text-decoration:underline;text-decoration-color:rgba(183,197,214,.5);text-underline-offset:3px}a.stat:hover span{color:#fff}
.clients{margin:34px 0 0;text-align:center}
.clients-h{font:500 13px/1.4 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#4A5B70;margin:0 0 16px}
.clients-row{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;justify-content:center;gap:14px}
.clients-row li{background:#fff;border:1px solid #DCE5EF;border-radius:14px;width:176px;height:96px;padding:10px 14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(14,21,32,.04)}
.clients-row img{max-height:74px;max-width:148px;width:auto;height:auto;object-fit:contain}
.tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px}
.tcard{margin:0;background:#fff;border:1px solid #DCE5EF;border-radius:18px;padding:22px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:16px}
.tcard blockquote{margin:0;font-size:16px;line-height:1.6;color:#0E1A2B;flex:1}
.tcard figcaption{display:flex;gap:12px;align-items:center}
.tcard figcaption img{width:48px;height:48px;object-fit:contain;border:1px solid #DCE5EF;border-radius:10px;padding:4px;background:#fff}
.tcard figcaption b{display:block;font-size:15px}.tcard figcaption small{display:block;color:#4A5B70;font-size:13.5px}
.tstat{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:#33445A;background:#FFF8E8;border:1px solid #F3E1B4;border-radius:99px;padding:6px 12px;align-self:flex-start;text-decoration:none}.tstat:hover{border-color:#E8C772;color:#33445A}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:32px 0 0;padding:0;list-style:none}
.step{background:#fff;border-radius:16px;padding:22px;border:1px solid #DCE5EF}
.step b{display:block;font-family:'IBM Plex Mono',ui-monospace,monospace;color:#0B4FA8;font-weight:500;font-size:14px;letter-spacing:.06em;margin-bottom:10px}.step b::after{content:" ·"}
.step h3{font-size:17px;font-weight:800;margin:0 0 4px}.step p{font-size:14.5px;color:#4A5B70;margin:0;line-height:1.55}
main details:not(.rp-fix-ai){background:#fff;border:1px solid #DCE5EF;border-radius:14px;padding:0;margin:0 0 12px;transition:box-shadow .2s,border-color .2s}
main details:not(.rp-fix-ai)[open]{border-color:rgba(29,127,232,.35);box-shadow:var(--shadow)}
main details:not(.rp-fix-ai)>summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 20px;font-weight:800;letter-spacing:-.01em}
main details:not(.rp-fix-ai)>summary::-webkit-details-marker{display:none}
main details:not(.rp-fix-ai)>summary::after{content:"+";flex:0 0 28px;height:28px;border-radius:50%;background:#EEF6FF;color:#0B4FA8;display:grid;place-items:center;font-weight:700;font-size:18px;line-height:1}
main details:not(.rp-fix-ai)[open]>summary::after{content:"\\2212";background:#C13A2A;color:#fff}
main details:not(.rp-fix-ai)>:not(summary){padding:0 20px;margin-top:0}main details:not(.rp-fix-ai)>:last-child{padding-bottom:20px;margin-bottom:0}
.cta-sec{padding:56px 0}
.cta-band{background:#0E1A2B;color:#fff;border-radius:22px;padding:44px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;box-shadow:0 30px 60px -30px rgba(14,26,43,.6)}

.nav-cta{display:flex;align-items:center;gap:10px}
.srch{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:10px;color:#33445A}.srch:hover{background:#EAF2FB;color:#0D5EC7}.srch svg{width:21px;height:21px}@media (max-width:400px){.srch{display:none}}

.m-cta{display:none}
main>section:not(:first-of-type){content-visibility:auto;contain-intrinsic-size:auto 720px}
.js .reveal{opacity:0;transform:translateY(12px);transition:opacity .45s ease,transform .45s ease}.js .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.js .reveal{opacity:1;transform:none;transition:none}}
@media (max-width:1000px){.nav-cta .btn.red{display:none}}
@media (max-width:900px){.tgrid{grid-template-columns:1fr}.steps{grid-template-columns:1fr 1fr}}
@media (max-width:720px){.stats{grid-template-columns:1fr 1fr;padding:24px 22px;gap:22px 18px}.stats>:last-child{grid-column:1/-1}.steps{grid-template-columns:1fr}.cta-band{padding:30px 22px}.clients-row{gap:10px}.clients-row li{width:calc(50% - 5px);height:84px}.clients-row img{max-height:62px;max-width:130px}
body{padding-bottom:78px}
.m-cta{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:70;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);border-top:1px solid #DCE5EF;box-shadow:0 -6px 20px -10px rgba(17,24,39,.25)}
.m-cta .btn{flex:1 1 0;padding:13px 10px;font-size:15px;min-height:48px}}
`;

const NAV = [
  ['/tools', 'Products'], ['/custom-software', 'Custom software'], ['/services', 'Services'], ['/blog', 'Blog'], ['/about', 'About'],
];

function header(path) {
  const cur = (h) => (path === h || (h !== '/' && path.startsWith(h + '/')) ? ' aria-current="page"' : '');
  const links = NAV.map(([h, t]) => `<a href="${h}"${cur(h)}>${esc(t)}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap topin">
<a class="brand" href="/"><img src="/icon-72.webp" alt="" width="36" height="36"><span>WorldDigital.ai<small>Software company · Serving the US &amp; Canada</small></span></a>
<nav class="nav" aria-label="Main">${links}</nav>
<div class="nav-cta"><a class="srch" href="/search" aria-label="Search the site" title="Search"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg></a><a class="btn ghost" href="${CONTACT}">Contact</a><a class="btn red" href="${START}">Start free</a></div>
<details class="menu"><summary aria-label="Menu">Menu</summary><nav aria-label="Mobile">${links}<a href="/search">Search</a><a href="${START}">Start free</a><a href="${CONTACT}">Contact</a></nav></details>
</div></header>`;
}

function footer() {
  return `<footer class="foot"><div class="wrap">
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px">
<div><div class="brand" style="color:#fff">WorldDigital.ai</div><p style="margin:10px 0 0;line-height:1.6">WorldDigital.ai Corporation LLC<br>Serving businesses across the US and Canada<br>Hubs: Houston, TX · Murfreesboro, TN</p><p style="margin:10px 0 0"><a href="mailto:support@worlddigital.ai">support@worlddigital.ai</a><br><a href="tel:+18328340680">(832) 834-0680</a></p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px"><a href="${BBB}" style="border:1px solid #33506F;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;color:#fff">BBB A+ rated</a><a href="${GBP}" style="border:1px solid #33506F;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;color:#fff">5.0 on Google Business Profile</a></div></div>
<div><h2 class="fh">Software</h2><p style="margin:0;line-height:2"><a href="${REPORT}">SEO &amp; AI visibility report · Free</a><br><a href="/services/keyword-research">Keyword research · $9.99</a><br><a href="/services/content-marketing">Content generator · $24.99</a><br><a href="/google-ads-agency#autopilot">Social &amp; Email Autopilot · Soon</a><br><a href="/tools">All products &amp; prices</a></p></div>
<div><h2 class="fh">Custom software</h2><p style="margin:0;line-height:2"><a href="/custom-software">Web apps &amp; portals</a><br><a href="/custom-software#ai">AI automation &amp; agents</a><br><a href="/custom-software#integrations">APIs &amp; integrations</a><br><a href="/ehr-emr-integration">EHR &amp; EMR integration</a><br><a href="/ai-marketing-automation">AI marketing automation</a></p></div>
<div><h2 class="fh">Services</h2><p style="margin:0;line-height:2"><a href="/ai-seo-agency">SEO &amp; AI Search plan</a><br><a href="/ai-seo-pricing">AI SEO pricing</a><br><a href="/local-seo-services">Local SEO</a><br><a href="/generative-engine-optimization">GEO</a><br><a href="/google-ads-agency">Google Ads &amp; PPC</a><br><a href="/build">Websites</a><br><a href="/enterprise">Multi-location</a><br><a href="/houston">Houston, TX</a> · <a href="/murfreesboro">Murfreesboro, TN</a></p></div>
<div><h2 class="fh">Company</h2><p style="margin:0;line-height:2"><a href="/about">About us</a><br><a href="/contact">Contact</a><br><a href="/testimonials">Reviews</a><br><a href="/blog">Blog &amp; guides</a><br><a href="/social">Social Hub</a><br><a href="/help">Help center</a><br><a href="/career">Careers</a></p></div>
</div>
<nav class="socials" aria-label="WorldDigital.ai on social media"><a class="soc" href="https://linkedin.com/company/worlddigitalai" target="_blank" rel="noopener me" aria-label="WorldDigital.ai on LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a><a class="soc" href="https://x.com/worlddigitalai" target="_blank" rel="noopener me" aria-label="WorldDigital.ai on X" title="X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg></a><a class="soc" href="https://instagram.com/worlddigitalai" target="_blank" rel="noopener me" aria-label="WorldDigital.ai on Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg></a><a class="soc" href="https://facebook.com/worlddigitalai" target="_blank" rel="noopener me" aria-label="WorldDigital.ai on Facebook" title="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg></a><a class="soc" href="https://youtube.com/@worlddigitalai" target="_blank" rel="noopener me" aria-label="WorldDigital.ai on YouTube" title="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a><a class="soc" href="https://tiktok.com/@worlddigitalai" target="_blank" rel="noopener me" aria-label="WorldDigital.ai on TikTok" title="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a><a class="soc" href="https://snapchat.com/add/worlddigitalai" target="_blank" rel="noopener me" aria-label="WorldDigital.ai on Snapchat" title="Snapchat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg></a><a class="soc" href="https://maps.google.com/?cid=13604454099683898961" target="_blank" rel="noopener me" aria-label="WorldDigital.ai on Google Business Profile" title="Google Business Profile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg></a></nav>
<p style="margin:36px 0 0;font-size:13px;border-top:1px solid #1E3A5F;padding-top:20px;line-height:1.9">© ${new Date().getUTCFullYear()} WorldDigital.ai Corporation LLC · <a href="/privacy-policy">Privacy</a> · <a href="/terms-and-conditions">Terms</a> · <a href="/cookies-policy">Cookies</a></p>
</div></footer>`;
}

// The three self-serve tools, with their prices. Shown on every public page (except the tool's own page).
export const TOOLS = [
  { path: '/free-seo-report', name: 'Free SEO & AI visibility report', price: 'Free', note: 'No sign-up',
    text: 'On-page SEO, mobile speed, Google rankings, backlinks and ChatGPT mentions, with your top fixes in about 60 seconds.', btn: 'Get my free report' },
  { path: '/services/keyword-research', name: 'Keyword research', price: '$9.99', note: '3 keywords free · all 10 for $9.99',
    text: 'The 10 keywords your site can win, with real Google search volume, cost per click and competition. PDF, Excel or Word.', btn: 'Try it free' },
  { path: '/services/content-marketing', name: 'Content pack', price: '$24.99', note: '1 piece free · 5 for $24.99',
    text: 'Five ready-to-post ads or posts for Google, Facebook, Instagram, LinkedIn, X, TikTok, YouTube Shorts or Snapchat.', btn: 'Try it free' },
];
export function toolCards(skip) {
  return TOOLS.filter((t) => t.path !== skip).map((t) => `<a class="card svc" href="${t.path}"><span class="chip" style="align-self:flex-start">${t.note}</span><h3 class="h" style="font-size:21px">${esc(t.name)}</h3><p class="muted" style="margin:0;line-height:1.55">${t.text}</p><span style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-top:auto"><b class="h" style="font-size:26px">${t.price}</b><span style="font-weight:700;color:#0D5EC7">${t.btn} →</span></span></a>`).join('');
}
function toolsBand(path) {
  return `<section class="sec tools-band"><div class="wrap">
<div class="eyebrow">Free tools</div><h2 class="h" style="font-size:30px;margin-top:8px">Try our SEO tools, no sign-up</h2>
<p class="muted" style="margin:8px 0 0;max-width:720px;line-height:1.6">Instant results from real Google data. Pay only if you want the full set, one time, no subscription. <a href="/tools" style="font-weight:700;color:#0B4FA8">See all tools and prices</a></p>
<div class="grid3" style="margin-top:22px">${toolCards(path)}</div>
</div></section>`;
}

// The tools band goes before a page's own closing call-to-action, or at the end of the page.
function withTools(o) {
  const body = String(o.body);
  if (o.noindex || o.tools === false) return body;
  const i = body.lastIndexOf('<section class="cta-sec"');
  return i < 0 ? body + toolsBand(o.path) : body.slice(0, i) + toolsBand(o.path) + body.slice(i);
}

export const CTA = `<section class="cta-sec"><div class="wrap"><div class="cta-band">
<div><h2 class="h" style="font-size:36px;color:#fff">Start free, or tell us what to build.</h2><p style="margin:10px 0 0;color:#DBEAFE;font-size:17px">Try any tool with no sign-up, or send us your project. We reply within one business day.</p></div>
<div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn red" href="${START}">Start free</a><a class="btn ghost" href="${CONTACT}" style="background:transparent;color:#fff;border-color:#93C5FD">Contact us</a></div>
</div></div></section>`;

const FORM_JS = `
(function(){var r=document.documentElement;if(!('IntersectionObserver' in window)){return}
var els=[].slice.call(document.querySelectorAll('main section:not(:first-of-type) .card,main .svc,main .tcard,main .step,main .stat,main .clients,main section:not(:first-of-type) h2.h,main details:not(.rp-fix-ai)'));
var seen=new WeakSet();
// No getBoundingClientRect here: measuring during load forces a full layout. The observer's first report
// tells us what is already on screen (left alone) and what is below the fold (hidden, then faded in).
var io=new IntersectionObserver(function(es){es.forEach(function(e){var t=e.target;
if(!seen.has(t)){seen.add(t);if(e.isIntersecting){io.unobserve(t);return}t.classList.add('reveal');return}
if(e.isIntersecting){t.classList.add('in');io.unobserve(t)}})},{threshold:0,rootMargin:'0px 0px -6% 0px'});
els.forEach(function(e){io.observe(e)})})();
document.addEventListener('submit',function(e){var f=e.target;
if(f.hasAttribute('data-subscribe')){e.preventDefault();var i=f.querySelector('input'),v=(i.value||'').trim();
if(!/^(https?:\\/\\/)?([a-z0-9-]+\\.)+[a-z]{2,}(\\/\\S*)?$/i.test(v)){i.setCustomValidity('Please enter your business website, for example yourbusiness.com');i.reportValidity();i.addEventListener('input',function(){i.setCustomValidity('')},{once:true});return}
var ref=v.replace(/^https?:\\/\\//i,'').replace(/^www\\./i,'').replace(/\\/+$/,'').replace(/\\./g,'_').replace(/[^a-z0-9_-]/gi,'-').slice(0,200);
try{gtag('event','begin_checkout',{currency:'USD',value:199.99})}catch(x){}
location.assign(f.action+'?client_reference_id='+encodeURIComponent(ref));return}
if(!f.hasAttribute('data-ajax'))return;e.preventDefault();var m=f.querySelector('.form-msg'),b=f.querySelector('button[type=submit]');b.disabled=true;
fetch(f.action,{method:'POST',body:new FormData(f),headers:{'Accept':'application/json'}}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})}).then(function(x){
m.textContent=x.j.message||(x.ok?'Thanks!':'Something went wrong. Please email support@worlddigital.ai.');try{var w=f.querySelector('.cf-turnstile');if(w&&window.turnstile)turnstile.reset(w)}catch(q){}m.className='form-msg '+(x.ok?'ok':'err');if(x.ok){f.reset();try{gtag('event','generate_lead',{form:f.getAttribute('action')})}catch(z){}}else b.disabled=false})
.catch(function(){m.textContent='Could not send. Please check your connection and try again.';m.className='form-msg err';b.disabled=false})});
`;

function analytics(prod) {
  if (!prod) return '';
  // GA4, Google Ads and Tag Manager (ad and retargeting pixels, which set third-party cookies) load on the first
  // real interaction: tap, click, mouse move or key press. Nothing third-party slows the first view.
  // Cloudflare's Google tag gateway must stay OFF for this zone: while on, it inserts the Ads tag at the top of every
  // page ahead of this code, whatever its "set up tag" option says (mobile speed 99 -> 69, 2026-11-04 audit).
  // Tracking guard: only the live worlddigital.ai host is measured. Admin, login and unsubscribe pages,
  // previews (business.google.com, localhost) and team browsers are left out of GA4 and Tag Manager.
  // A team browser is marked once by visiting any page with ?wd_internal=1 (undo with ?wd_internal=0)
  // or by opening /admin; the mark is kept in this browser only.
  return `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
(function(){var h=location.hostname,p=location.pathname,q=location.search,me=false;
try{if(/[?&]wd_internal=1/.test(q)||p.indexOf('/admin')===0)localStorage.setItem('wdInternal','1');if(/[?&]wd_internal=0/.test(q))localStorage.removeItem('wdInternal');me=localStorage.getItem('wdInternal')==='1'}catch(e){}
window.wdNoTrack=me||(h!=='worlddigital.ai'&&h!=='www.worlddigital.ai')||['admin','login','unsubscribe'].indexOf(p.split('/')[1])>-1;
window['ga-disable-${GA4}']=window.wdNoTrack;window['ga-disable-G-PWBFJSFNR8']=true})();
if(!window.wdNoTrack){gtag('js',new Date());gtag('config','${GA4}')}
(function(){if(window.wdNoTrack)return;function add(src){var s=document.createElement('script');s.async=true;s.src=src;document.head.appendChild(s)}
var ga=false,tm=false,ev=['pointerdown','mousemove','keydown','touchstart'];
function loadGA(){if(ga)return;ga=true;add('https://www.googletagmanager.com/gtag/js?id=${GA4}')}
function loadAds(){if(document.querySelector('script[src^="/5cex/"]'))return;gtag('config','${ADS}');add('https://www.googletagmanager.com/gtag/js?id=${ADS}')}
function loadTM(){loadGA();if(tm)return;tm=true;loadAds();dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});add('https://www.googletagmanager.com/gtm.js?id=${GTM}');ev.forEach(function(e){removeEventListener(e,loadTM)})}
ev.forEach(function(e){addEventListener(e,loadTM,{passive:true})})})();</script>`;
}

// Sections alternate white / light grey so two neighbours never share a background.
// Dark (navy) and blue sections keep their own colour and restart the pattern.
export function zebra(body) {
  let i = 0, first = true;
  return String(body).replace(/<section\b([^>]*)>/g, (m, attrs) => {
    if (/class="cta"|#0E1A2B|#0D5EC7|class="(holo|rf)"/i.test(attrs)) { i = 1; first = false; return m; }
    if (first) { first = false; i = 1; const st = (/style="([^"]*)"/.exec(attrs) || [, ''])[1].replace(/background(-color)?:[^;]*;?/gi, ''); const cls = /class="([^"]*)"/.exec(attrs); const rest0 = attrs.replace(/\sstyle="[^"]*"/, '').replace(/\sclass="[^"]*"/, ''); return `<section${rest0} class="${cls ? cls[1] + ' ' : ''}hero-sky" style="${st}">`; }
    const white = i++ % 2 === 0;
    let style = (/style="([^"]*)"/.exec(attrs) || [, ''])[1]
      .replace(/background(-color)?:[^;]*;?/gi, '').replace(/border-(top|bottom):[^;]*;?/gi, '').trim();
    style = `${white ? 'background:#fff;' : 'background:#F4F8FC;'}border-top:1px solid #DCE5EF;${style}`;
    const rest = attrs.replace(/\sstyle="[^"]*"/, '');
    return `<section${rest} style="${style}">`;
  });
}

// page({path,title,description,body,schema,ogImage,ogType,noindex,cta,prod,extraHead})
export function page(o) {
  const url = SITE + (o.path === '/' ? '/' : o.path);
  const og = o.ogImage || `${SITE}/og.png`;
  const list = [].concat(o.schema || []).filter(Boolean);
  // Every page carries the Organization, so search engines and AI tools never have to resolve it from another page.
  if (!o.noindex && !list.some((s) => s['@id'] === ORG['@id'])) list.unshift(ORG);
  const schema = list
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add("js")</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">

${o.noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${esc(o.canonical || url)}">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="WorldDigital.ai">
<meta property="og:title" content="${esc(o.ogTitle || o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(o.canonical || url)}">
<meta property="og:image" content="${esc(og)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@worlddigitalai">
<meta name="google-site-verification" content="mrTTFEoWn4LZBDr9LZbK3PUZcdHy8hetzIk7Ich1SCw">
<meta name="theme-color" content="#0E1A2B">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="WorldDigital.ai Blog" href="${SITE}/blog/feed.xml">
<link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/sora-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
${o.extraHead || ''}
${String(o.body).includes('cf-turnstile') ? `<script>(function(){var on=false;function go(){if(on)return;on=true;var s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js';s.async=true;document.head.appendChild(s)}
['focusin','pointerdown','touchstart'].forEach(function(e){document.addEventListener(e,function(ev){if(ev.target.closest&&ev.target.closest('form'))go()},{passive:true})});
if(location.hash==='#apply'||location.hash==='#autopilot')addEventListener('load',go)})();</script>` : ''}
${schema}
${analytics(o.prod)}
</head>
<body>
${header(o.path)}
<main id="main">
${zebra(withTools(o))}
${o.cta === false ? '' : CTA}
</main>
${footer()}
${o.cta === false && o.noFloat ? '' : `<div class="m-cta"><a class="btn red" href="${START}">Start free</a><a class="btn ghost" href="${CONTACT}">Contact us</a></div>`}
${o.noChat ? '' : CHAT_HTML}
<script>${FORM_JS}</script>
</body>
</html>`;
}

// FAQPage schema from <details><summary>Q</summary><p>A</p></details> blocks in a page body.
export function faqSchema(body) {
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  // Ignore <details> inside <script> (e.g. the free report's JS template): only visible FAQs count.
  const visible = String(body).replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const items = [...visible.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map((m) => ({ q: strip(m[1]), a: strip(m[2]) })).filter((x) => x.q && x.a);
  if (!items.length) return null;
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) };
}

export const ORG = {
  '@context': 'https://schema.org', '@type': ['Organization', 'ProfessionalService'], '@id': `${SITE}/#org`,
  name: 'WorldDigital.ai', legalName: 'WorldDigital.ai Corporation LLC', url: `${SITE}/`, logo: `${SITE}/icon-512.png`, image: `${SITE}/og.png`,
  email: 'support@worlddigital.ai', telephone: '+1-832-834-0680', priceRange: '$0–$199.99/month',
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Plans and tools', itemListElement: [
    { '@type': 'Offer', name: 'SEO & AI Search Visibility plan', price: '199.99', priceCurrency: 'USD', url: `${SITE}/ai-seo-agency`,
      priceSpecification: { '@type': 'UnitPriceSpecification', price: '199.99', priceCurrency: 'USD', unitText: 'MONTH' } },
    { '@type': 'Offer', name: 'Free SEO & AI visibility report', price: '0', priceCurrency: 'USD', url: `${SITE}/free-seo-report` },
    { '@type': 'Offer', name: 'Keyword research (10 keywords)', price: '9.99', priceCurrency: 'USD', url: `${SITE}/services/keyword-research` },
    { '@type': 'Offer', name: 'Content pack (5 ads or posts)', price: '24.99', priceCurrency: 'USD', url: `${SITE}/services/content-marketing` },
  ] },
  description: 'Software company making AI marketing tools (SEO and AI visibility report, keyword research, content generator) and building custom software, AI automation and EHR/EMR integrations for SMBs, SMEs and enterprises across the US and Canada, with managed SEO, Google Ads and website services as add-ons.',
  address: [{ '@type': 'PostalAddress', addressLocality: 'Houston', addressRegion: 'TX', addressCountry: 'US' },
    { '@type': 'PostalAddress', addressLocality: 'Murfreesboro', addressRegion: 'TN', addressCountry: 'US' }],
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@worlddigital.ai', telephone: '+1-832-834-0680',
    areaServed: ['US', 'CA'], availableLanguage: ['English', 'Arabic'] },
  knowsAbout: ['Software development', 'SaaS', 'Custom software development', 'AI automation', 'API integration', 'EHR and EMR integration', 'Search engine optimization', 'Local SEO', 'Generative engine optimization (GEO)', 'Answer engine optimization (AEO)',
    'AI search visibility', 'Google Ads management', 'PPC management', 'Keyword research', 'Content marketing', 'Website design', 'Multi-location SEO'],
  areaServed: [{ '@type': 'Country', name: 'United States' }, { '@type': 'Country', name: 'Canada' }],
  founder: { '@type': 'Person', name: 'Ahmad Awwad', url: `${SITE}/about`, sameAs: ['https://www.linkedin.com/in/ahmadawwad89'] },
  sameAs: ['https://linkedin.com/company/worlddigitalai', 'https://facebook.com/worlddigitalai', 'https://instagram.com/worlddigitalai', 'https://x.com/worlddigitalai', 'https://youtube.com/@worlddigitalai', 'https://tiktok.com/@worlddigitalai', 'https://snapchat.com/add/worlddigitalai', BBB],
};

export function crumbs(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })) };
}
