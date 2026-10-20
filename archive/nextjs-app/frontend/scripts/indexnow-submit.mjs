#!/usr/bin/env node
/**
 * Tell Bing (and every other IndexNow engine) about all public URLs.
 * Run after each deploy:   INDEXNOW_KEY=... node scripts/indexnow-submit.mjs
 * Reads the live sitemap, so new CMS blog posts are included automatically.
 */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://worlddigital.ai").replace(/\/$/, "");
const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error("INDEXNOW_KEY is not set.");
  process.exit(1);
}

const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) {
  console.error("No URLs found in sitemap.");
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/indexnow.txt`, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs → HTTP ${res.status}`);
if (res.status >= 300) process.exit(1);
