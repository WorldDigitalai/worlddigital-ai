// worlddigital.ai edge helpers, routed only on specific paths (see wrangler.jsonc):
// 1) robots.txt, llms.txt, llms-full.txt and sitemap.xml
// 2) 301 redirects for the retired social-platform service pages -> /services
// Anything else that reaches this worker is passed through to the site untouched.
import { ROBOTS, LLMS, LLMS_FULL, SITEMAP } from './files.js';

const FILES = {
  '/robots.txt': [ROBOTS, 'text/plain; charset=utf-8'],
  '/llms.txt': [LLMS, 'text/plain; charset=utf-8'],
  '/llms-full.txt': [LLMS_FULL, 'text/plain; charset=utf-8'],
  '/sitemap.xml': [SITEMAP, 'application/xml; charset=utf-8'],
};

// Retired social-platform pages. They come back later as the Social & Email Autopilot service.
export const RETIRED = [
  '/meta-ads-agency', '/facebook-ads-management', '/instagram-marketing',
  '/tiktok-ads-agency', '/tiktok-marketing', '/snapchat-ads-agency', '/snapchat-marketing',
  '/linkedin-ads-agency', '/x-ads-agency', '/youtube-shorts-marketing',
  // the old social-platform product pages under /services
  '/services/meta-ads', '/services/tiktok-ads', '/services/linkedin-ads', '/services/x-ads', '/services/snapchat-ads', '/services/youtube-shorts', '/services/reels-generator', '/services/image-generator',
];
export const RETIRED_TARGET = '/services';

export default {
  async fetch(request, env) {
    // Since the new company site went live, it serves these paths itself (dynamic sitemap with blog posts).
    if (env?.SITE) return env.SITE.fetch(request);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (RETIRED.includes(path.toLowerCase())) {
      return new Response(null, { status: 301, headers: { Location: `https://worlddigital.ai${RETIRED_TARGET}${url.search}`, 'Cache-Control': 'public, max-age=86400' } });
    }

    const hit = FILES[url.pathname];
    if (!hit) return fetch(request); // e.g. /meta-ads-agency-something-else: not ours, pass through
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    return new Response(request.method === 'HEAD' ? null : hit[0], {
      headers: { 'Content-Type': hit[1], 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' },
    });
  },
};
