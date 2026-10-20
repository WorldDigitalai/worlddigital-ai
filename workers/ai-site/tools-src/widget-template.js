// Widget markup for the paid tools. The backend (backend/ in this repo) owns prices and
// limits; these numbers only label the UI and must match backend/app/products.py.
const PRODUCTS = {
  keywords: { total: 10, free: 3, price: 9.99 },
  content: { total: 5, free: 1, price: 24.99 },
};
const PLATFORMS = [
  ["google_ads", "Google Search Ads", "ad"], ["facebook", "Facebook", "ad,post"], ["instagram", "Instagram", "ad,post"],
  ["linkedin", "LinkedIn", "ad,post"], ["x", "X (Twitter)", "ad,post"], ["tiktok", "TikTok", "ad,post"],
  ["youtube_shorts", "YouTube Shorts", "ad,post"], ["snapchat", "Snapchat", "ad,post"],
];

const keywordsForm = () => `
<div class="wdt-row">
  <div><label class="wdt-l" for="wdt-url">Your website</label><input id="wdt-url" name="url" type="text" inputmode="url" autocomplete="url" placeholder="yourbusiness.com" required></div>
  <div><label class="wdt-l" for="wdt-country">Market</label><select id="wdt-country" name="country"><option value="us">United States</option><option value="ca">Canada</option></select></div>
  <button class="btn red wdt-go" type="submit">Get 3 free keywords</button>
</div>`;

const contentForm = () => `
<fieldset><legend>Which platform is it for?</legend><div class="wdt-chips">${PLATFORMS.map(([id, label, kinds], i) =>
  `<label class="wdt-chip"><input type="radio" name="platform" value="${id}" data-kinds="${kinds}"${i === 0 ? " checked" : ""}><span>${label}</span></label>`).join("")}</div></fieldset>
<fieldset><legend>Ad or organic post?</legend><div class="wdt-chips">
  <label class="wdt-chip"><input type="radio" name="kind" value="ad" checked><span>Paid ad</span></label>
  <label class="wdt-chip"><input type="radio" name="kind" value="post"><span>Organic post</span></label>
</div></fieldset>
<div><label class="wdt-l" for="wdt-offer">What do you want to promote? <span style="font-weight:400;color:#4A5B70">(optional)</span></label><input id="wdt-offer" name="offer" type="text" maxlength="300" placeholder="e.g. spring AC tune-up, new menu, free consultation"></div>
<div class="wdt-row c2">
  <div><label class="wdt-l" for="wdt-url">Your website</label><input id="wdt-url" name="url" type="text" inputmode="url" autocomplete="url" placeholder="yourbusiness.com" required></div>
  <button class="btn red wdt-go" type="submit">Get a free sample</button>
</div>`;

/** Section + styles + script for one tool page. */
export function toolWidget(type) {
  const p = PRODUCTS[type];
  const price = `$${p.price.toFixed(2)}`;
  const head = type === "keywords"
    ? { eyebrow: "Free keyword preview", h2: "See the keywords your customers search", lead: `Enter your website and we'll pull real Google search data for your market. Your top ${p.free} keywords are free; unlock all ${p.total} with search volume, cost per click, competition and intent for ${price}, one time.` }
    : { eyebrow: "Free content preview", h2: "Get ready-to-post ads and social content", lead: `Pick a platform and enter your website. We'll write ${p.total} variations that fit the platform's limits. See the first one free; unlock all ${p.total} for ${price}, one time.` };
  return `
<style>${CLIENT_CSS}</style>
<section class="sec wdt" id="tool" aria-labelledby="wdt-h">
<div class="wrap"><div class="card">
  <div class="wdt-head"><span class="eyebrow">${head.eyebrow}</span><h2 class="h" id="wdt-h">${head.h2}</h2><p>${head.lead}</p></div>
  <form class="wdt-form" novalidate>
    ${type === "keywords" ? keywordsForm() : contentForm()}
    <p class="wdt-note"><b>Free preview:</b> ${p.free} of ${p.total}. <b>Full ${type === "keywords" ? "report" : "pack"}:</b> ${price} one-time, delivered as PDF, Excel or Word.</p>
  </form>
  <div class="wdt-status" role="status" aria-live="polite"></div>
  <div class="wdt-res"></div>
</div></div>
</section>
<script>window.WDT_CONFIG=${JSON.stringify({ type, ...p })};</script><script>${CLIENT_JS}</script>`;
}

/** Insert the widget right after the page's first section (the hero). */
export function withTool(body, type) {
  const i = String(body).indexOf("</section>");
  return i < 0 ? body + toolWidget(type) : body.slice(0, i + 10) + toolWidget(type) + body.slice(i + 10);
}
