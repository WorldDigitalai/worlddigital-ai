// Which addresses this site owns vs. the existing app.
export const INDEXNOW_KEY = '5d1c3f0b8e9a4c7d92b6e1f04a3c8d27';
export const PROD_HOSTS = new Set(['worlddigital.ai', 'www.worlddigital.ai']);
// Paths handled by the existing app when this worker is in front of worlddigital.ai.
export const APP_PREFIXES = ['/login', '/signup', '/dashboard', '/api/', '/auth', '/admin', '/subscribe', '/forgot-password', '/reset-password',
  '/generate', '/hp91', '/_next/', '/opengraph-image', '/twitter-image', '/logo', '/sw.js', '/manifest', '/workbox-', '/onboarding', '/checkout',
  '/billing', '/account', '/settings', '/webhook', '/stripe'];

export const isAppPath = (lower) => APP_PREFIXES.some((p) => lower.startsWith(p)) && !lower.startsWith('/api/site/');
