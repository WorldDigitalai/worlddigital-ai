// Shared page shell for worlddigital.ai: head (SEO + analytics), header, footer, CSS.
export const SITE = 'https://worlddigital.ai';
export const CAL = 'https://calendar.app.google/X5ghVrBxfR8jTBdA7';
export const WA = 'https://wa.me/18328340680?text=Hi%2C%20I%20found%20WorldDigital.ai%20online';
export const REPORT = '/free-seo-report';
export const GBP = 'https://share.google/FB4831wKavklYkwE8';
export const BBB = 'https://www.bbb.org/us/tn/murfreesboro/profile/marketing-software/worlddigitalai-corporation-llc-0573-37385441';
const GA4 = 'G-C6V00GEZP6';
const GTM = 'GTM-P7FV5QN6';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const CSS = `
@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter-var-latin.woff2) format("woff2")}
@font-face{font-family:"Inter Fallback";src:local("Arial");ascent-override:90.44%;descent-override:22.52%;line-gap-override:0%;size-adjust:107.12%}
@font-face{font-family:Sora;font-style:normal;font-weight:100 800;font-display:swap;src:url(/fonts/sora-var-latin.woff2) format("woff2")}
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
.h{font-family:Sora,Inter,sans-serif;letter-spacing:-0.02em;margin:0}
.eyebrow{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#0B4FA8}
.top{background:#fff;border-bottom:1px solid #DCE5EF;position:sticky;top:0;z-index:20}
.topin{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:72px}
.brand{font-family:Sora,Inter,sans-serif;font-weight:800;font-size:21px;color:#0E1A2B;text-decoration:none;display:flex;align-items:center;gap:10px}
.brand img{width:36px;height:36px;border-radius:9px;box-shadow:0 0 0 1px #DCE5EF}
.brand small{display:block;font-family:Inter,sans-serif;font-weight:500;font-size:11.5px;color:#4A5B70;letter-spacing:.02em}
.nav{display:flex;gap:20px;font-size:15px;white-space:nowrap}
.nav a{color:#33445A;text-decoration:none;font-weight:500}.nav a:hover,.nav a[aria-current=page]{color:#0D5EC7}
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
.form-msg{margin:12px 0 0;font-weight:600}.form-msg.ok{color:#15803D}.form-msg.err{color:#B42318}
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
@media (max-width:1260px){.brand small{display:none}.nav{gap:16px;font-size:14.5px}}
@media (max-width:1060px){.nav{display:none}.menu{display:block}.top .btn.red{display:none}}
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
.top .wa-icon{width:44px;height:44px;border-radius:50%;background:#108043;color:#fff;display:grid;place-items:center;flex:0 0 44px;transition:background .15s}.top .wa-icon:hover{background:#0B6635;color:#fff}.top .wa-icon svg{width:20px;height:20px}
.nav-cta{display:flex;align-items:center;gap:10px}
.wa-float{position:fixed;right:20px;bottom:20px;z-index:60;width:56px;height:56px;border-radius:50%;background:#25D366;display:grid;place-items:center;box-shadow:0 10px 24px -6px rgba(37,211,102,.6);transition:transform .15s}.wa-float:hover{transform:scale(1.07)}.wa-float svg{width:30px;height:30px;fill:#fff}
.m-cta{display:none}
main>section:not(:first-of-type){content-visibility:auto;contain-intrinsic-size:auto 720px}
.js .reveal{opacity:0;transform:translateY(12px);transition:opacity .45s ease,transform .45s ease}.js .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.js .reveal{opacity:1;transform:none;transition:none}}
@media (max-width:1060px){.nav-cta .btn.red{display:none}}
@media (max-width:900px){.tgrid{grid-template-columns:1fr}.steps{grid-template-columns:1fr 1fr}}
@media (max-width:720px){.stats{grid-template-columns:1fr 1fr;padding:24px 22px;gap:22px 18px}.stats>:last-child{grid-column:1/-1}.steps{grid-template-columns:1fr}.cta-band{padding:30px 22px}.clients-row{gap:10px}.clients-row li{width:calc(50% - 5px);height:84px}.clients-row img{max-height:62px;max-width:130px}
.wa-float{display:none}.nav-cta .wa-icon{display:none}body{padding-bottom:78px}
.m-cta{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:70;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);border-top:1px solid #DCE5EF;box-shadow:0 -6px 20px -10px rgba(17,24,39,.25)}
.m-cta .btn{flex:1 1 0;padding:13px 10px;font-size:15px;min-height:48px}}
`;

const NAV = [
  ['/services', 'Services'], ['/ai-seo-agency', 'SEO & AI Search'], ['/google-ads-agency', 'Google Ads'], ['/build', 'Websites'],
  ['/houston', 'Locations'], ['/about', 'About us'], ['/blog', 'Blog'],
];

function header(path) {
  const cur = (h) => (path === h || (h !== '/' && path.startsWith(h + '/')) ? ' aria-current="page"' : '');
  const links = NAV.map(([h, t]) => `<a href="${h}"${cur(h)}>${esc(t)}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap topin">
<a class="brand" href="/"><img src="/icon-72.webp" alt="" width="36" height="36"><span>WorldDigital.ai<small>Digital marketing company · Serving the US &amp; Canada</small></span></a>
<nav class="nav" aria-label="Main">${links}</nav>
<div class="nav-cta"><a class="wa-icon" href="${WA}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" title="Chat on WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a><a class="btn red" href="${CAL}">Book a strategy call</a></div>
<details class="menu"><summary aria-label="Menu">Menu</summary><nav aria-label="Mobile">${links}<a href="${CAL}">Book a strategy call</a><a href="/login">Sign in</a></nav></details>
</div></header>`;
}

function footer() {
  return `<footer class="foot"><div class="wrap">
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px">
<div><div class="brand" style="color:#fff">WorldDigital.ai</div><p style="margin:10px 0 0;line-height:1.6">WorldDigital.ai Corporation LLC<br>Serving businesses across the US and Canada<br>Hubs: Houston, TX · Murfreesboro, TN</p><p style="margin:10px 0 0"><a href="mailto:support@worlddigital.ai">support@worlddigital.ai</a><br><a href="tel:+18328340680">(832) 834-0680</a></p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px"><a href="${BBB}" style="border:1px solid #33506F;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;color:#fff">BBB A+ rated</a><a href="${GBP}" style="border:1px solid #33506F;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;color:#fff">5.0 on Google Business Profile</a></div></div>
<div><h2 class="fh">Services</h2><p style="margin:0;line-height:2"><a href="/ai-seo-agency">SEO &amp; AI Search</a><br><a href="/local-seo-services">Local SEO</a><br><a href="/generative-engine-optimization">GEO</a><br><a href="/google-ads-agency">Google Ads &amp; PPC</a><br><a href="/build">Web design</a><br><a href="/ai-marketing-automation">AI marketing automation</a><br><a href="/enterprise">Multi-location</a><br><a href="/services">All services</a></p></div>
<div><h2 class="fh">Our hubs</h2><p style="margin:0;line-height:2"><a href="/houston">Houston, TX</a><br><a href="/murfreesboro">Murfreesboro, TN</a></p></div>
<div><h2 class="fh">Company</h2><p style="margin:0;line-height:2"><a href="/about">About us</a><br><a href="/testimonials">Reviews</a><br><a href="/blog">Blog &amp; guides</a><br><a href="/help">Help center</a><br><a href="/career">Careers</a><br><a href="${REPORT}">Free SEO report</a><br><a href="/login">Customer sign in</a></p></div>
</div>
<p style="margin:36px 0 0;font-size:13px;border-top:1px solid #1E3A5F;padding-top:20px;line-height:1.9">© ${new Date().getUTCFullYear()} WorldDigital.ai Corporation LLC · <a href="/privacy-policy">Privacy</a> · <a href="/terms-and-conditions">Terms</a> · <a href="/cookies-policy">Cookies</a></p>
</div></footer>`;
}

export const CTA = `<section class="cta-sec"><div class="wrap"><div class="cta-band">
<div><h2 class="h" style="font-size:36px;color:#fff">Let’s grow your business.</h2><p style="margin:10px 0 0;color:#DBEAFE;font-size:17px">Tell us about your goals. We reply within one business day.</p></div>
<div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn red" href="${CAL}">Book a strategy call</a><a class="btn green" href="${WA}">WhatsApp us</a></div>
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
  // GA4 and Tag Manager (ad and retargeting pixels, which set third-party cookies) load on the first real
  // interaction: tap, click, mouse move or key press. Nothing third-party slows the first view.
  return `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA4}');
(function(){function add(src){var s=document.createElement('script');s.async=true;s.src=src;document.head.appendChild(s)}
var ga=false,tm=false,ev=['pointerdown','mousemove','keydown','touchstart'];
function loadGA(){if(ga)return;ga=true;add('https://www.googletagmanager.com/gtag/js?id=${GA4}')}
function loadTM(){loadGA();if(tm)return;tm=true;dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});add('https://www.googletagmanager.com/gtm.js?id=${GTM}');ev.forEach(function(e){removeEventListener(e,loadTM)})}
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
  const schema = [].concat(o.schema || []).filter(Boolean)
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
<meta property="og:url" content="${esc(url)}">
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
${zebra(o.body)}
${o.cta === false ? '' : CTA}
</main>
${footer()}
${o.cta === false && o.noFloat ? '' : `<a class="wa-float" href="${WA}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" title="Chat on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>
<div class="m-cta"><a class="btn red" href="${REPORT}">Free SEO report</a><a class="btn green" href="${WA}" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>WhatsApp</a></div>`}
<script>${FORM_JS}</script>
</body>
</html>`;
}

// FAQPage schema from <details><summary>Q</summary><p>A</p></details> blocks in a page body.
export function faqSchema(body) {
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  const items = [...body.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map((m) => ({ q: strip(m[1]), a: strip(m[2]) })).filter((x) => x.q && x.a);
  if (!items.length) return null;
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) };
}

export const ORG = {
  '@context': 'https://schema.org', '@type': ['Organization', 'ProfessionalService'], '@id': `${SITE}/#org`,
  name: 'WorldDigital.ai', legalName: 'WorldDigital.ai Corporation LLC', url: `${SITE}/`, logo: `${SITE}/icon-512.png`, image: `${SITE}/og.png`,
  email: 'support@worlddigital.ai', telephone: '+1-832-834-0680', priceRange: '$199.99/month+',
  description: 'Digital marketing company helping local businesses get more customers from Google, Maps and AI search: SEO, AEO, GEO, Google Ads management and web design.',
  areaServed: [{ '@type': 'Country', name: 'United States' }, { '@type': 'Country', name: 'Canada' }],
  founder: { '@type': 'Person', name: 'Ahmad Awwad', url: `${SITE}/about`, sameAs: ['https://www.linkedin.com/in/ahmadawwad89'] },
  sameAs: ['https://linkedin.com/company/worlddigitalai', 'https://facebook.com/worlddigitalai', 'https://instagram.com/worlddigitalai', 'https://x.com/worlddigitalai', 'https://youtube.com/@worlddigitalai', 'https://tiktok.com/@worlddigitalai', BBB],
};

export function crumbs(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })) };
}
