/**
 * Auto SEO — complete end-to-end routes
 * Covers: domain connection, GSC keyword data, on-page audit,
 * AI blog generation, monthly email report, AI recommendations.
 */

import { Router, type Request, type Response } from "express";
import { createSign } from "node:crypto";
import { ObjectId } from "mongodb";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getCollection } from "../lib/mongo.js";
import { verifyToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { callAI } from "../lib/ai.js";
import { Resend } from "resend";

const router = Router();

// ── Types ────────────────────────────────────────────────────────────────────

interface SeoProfile {
  userId: string;
  domain: string;
  gscSiteUrl: string | null;
  domainVerified: boolean;
  serviceAccountEmail: string | null;
  googleRefreshToken?: string | null;
  lastKeywordSync: Date | null;
  keywordCache: GscRow[];
  lastAuditAt: Date | null;
  auditResults: AuditPageResult[];
  createdAt: Date;
  updatedAt: Date;
}

interface GscRow {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface AuditPageResult {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2Count: number;
  imageCount: number;
  imagesWithAlt: number;
  wordCount: number;
  score: number;
  issues: string[];
  pageSpeedDesktop?: number | null;
  pageSpeedMobile?: number | null;
}

interface SeoAnalyticsRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SeoPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SeoBlogPost {
  _id?: ObjectId;
  userId: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  targetKeyword: string;
  tags: string[];
  status: "draft" | "reviewed" | "published";
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SeoRecommendation {
  userId: string;
  items: Array<{ priority: "high" | "medium" | "low"; action: string; reason: string; estimatedImpact: string }>;
  generatedAt: Date;
}

// ── GSC Authentication ────────────────────────────────────────────────────────

async function getGSCAccessToken(userId?: string): Promise<{ token: string; serviceAccountEmail: string | null } | null> {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];

  // 0. Try per-user refresh token (most reliable — user explicitly granted webmasters scope)
  if (userId && clientId && clientSecret) {
    try {
      const col = getCollection<SeoProfile>("seo_profiles");
      const profile = await col.findOne({ userId });
      if (profile?.googleRefreshToken) {
        const token = await refreshToAccess(profile.googleRefreshToken, clientId, clientSecret);
        if (token) return { token, serviceAccountEmail: null };
      }
    } catch { /* fall through */ }
  }

  const keyEnv = process.env["GOOGLE_SEARCH_CONSOLE_KEY"];

  // 1. Try service account JSON
  if (keyEnv) {
    try {
      const sa = JSON.parse(keyEnv) as { client_email?: string; private_key?: string; type?: string };
      if (sa.type === "service_account" && sa.client_email && sa.private_key) {
        const token = await serviceAccountJWT(sa.client_email, sa.private_key);
        if (token) return { token, serviceAccountEmail: sa.client_email };
      }
    } catch { /* not JSON */ }

    // 2. Try as OAuth refresh token with GOOGLE_CLIENT_ID/SECRET
    if (clientId && clientSecret && keyEnv.length > 20 && !keyEnv.includes("{")) {
      const token = await refreshToAccess(keyEnv, clientId, clientSecret);
      if (token) return { token, serviceAccountEmail: null };
    }
  }

  // 3. Try MCC_REFRESH_TOKEN fallback
  const mccToken = process.env["MCC_REFRESH_TOKEN"];
  if (clientId && clientSecret && mccToken) {
    const token = await refreshToAccess(mccToken, clientId, clientSecret);
    if (token) return { token, serviceAccountEmail: null };
  }

  return null;
}

async function serviceAccountJWT(email: string, privateKey: string): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signingInput = `${header}.${body}`;
    const sign = createSign("RSA-SHA256");
    sign.update(signingInput);
    const signature = sign.sign(privateKey.replace(/\\n/g, "\n"), "base64url");
    const jwt = `${signingInput}.${signature}`;

    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await resp.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    logger.warn({ err }, "GSC service account JWT failed");
    return null;
  }
}

async function refreshToAccess(refreshToken: string, clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await resp.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    logger.warn({ err }, "GSC refresh token exchange failed");
    return null;
  }
}

// ── GSC API helpers ───────────────────────────────────────────────────────────

async function listGSCSites(token: string): Promise<string[]> {
  const resp = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) return [];
  const data = (await resp.json()) as { siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> };
  return (data.siteEntry ?? []).map((s) => s.siteUrl);
}

async function queryKeywords(token: string, siteUrl: string, days = 90): Promise<GscRow[]> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const resp = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ["query"], rowLimit: 200 }),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    logger.warn({ status: resp.status, txt }, "GSC searchAnalytics query failed");
    return [];
  }
  const data = (await resp.json()) as { rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> };
  return (data.rows ?? []).map((r) => ({
    keyword: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

// ── Additional GSC query helpers ──────────────────────────────────────────────

async function queryAnalytics(token: string, siteUrl: string, days = 90): Promise<SeoAnalyticsRow[]> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const resp = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ["date"], rowLimit: 90 }),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    logger.warn({ status: resp.status, txt }, "GSC analytics (date) query failed");
    return [];
  }
  const data = (await resp.json()) as { rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> };
  return (data.rows ?? []).map((r) => ({
    date: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

async function queryPages(token: string, siteUrl: string, days = 90): Promise<SeoPageRow[]> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const resp = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ["page"], rowLimit: 25 }),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!resp.ok) return [];
  const data = (await resp.json()) as { rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> };
  return (data.rows ?? []).map((r) => ({
    page: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

async function fetchPageSpeed(url: string): Promise<{ desktop: number | null; mobile: number | null }> {
  const apiKey = (() => {
    const k = process.env["GOOGLE_SEARCH_CONSOLE_KEY"];
    if (k && !k.trim().startsWith("{")) return k.trim();
    return process.env["NEXT_PUBLIC_GMAPS_KEY"] ?? null;
  })();
  if (!apiKey) return { desktop: null, mobile: null };
  try {
    const [mobileRes, desktopRes] = await Promise.all([
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}`, { signal: AbortSignal.timeout(30_000) }),
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&key=${apiKey}`, { signal: AbortSignal.timeout(30_000) }),
    ]);
    type PsiResp = { lighthouseResult?: { categories?: { performance?: { score?: number } } } };
    const [mobileData, desktopData]: [PsiResp, PsiResp] = await Promise.all([
      mobileRes.ok ? (mobileRes.json() as Promise<PsiResp>) : Promise.resolve({}),
      desktopRes.ok ? (desktopRes.json() as Promise<PsiResp>) : Promise.resolve({}),
    ]);
    const mobile = typeof mobileData.lighthouseResult?.categories?.performance?.score === "number"
      ? Math.round(mobileData.lighthouseResult.categories.performance.score * 100) : null;
    const desktop = typeof desktopData.lighthouseResult?.categories?.performance?.score === "number"
      ? Math.round(desktopData.lighthouseResult.categories.performance.score * 100) : null;
    return { mobile, desktop };
  } catch (err) {
    logger.warn({ err }, "PageSpeed API call failed");
    return { desktop: null, mobile: null };
  }
}

// ── Page Crawler / SEO Audit ──────────────────────────────────────────────────

function extractHtmlMeta(html: string, url: string): AuditPageResult {
  const issues: string[] = [];

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : null;
  if (!title) issues.push("Missing <title> tag");
  else if (title.length < 30) issues.push(`Title too short (${title.length} chars, aim for 50–60)`);
  else if (title.length > 70) issues.push(`Title too long (${title.length} chars, trim to under 60)`);

  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const metaDescription = metaMatch ? metaMatch[1].trim() : null;
  if (!metaDescription) issues.push("Missing meta description");
  else if (metaDescription.length < 100) issues.push(`Meta description too short (${metaDescription.length} chars, aim for 120–160)`);
  else if (metaDescription.length > 170) issues.push(`Meta description too long (${metaDescription.length} chars)`);

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : null;
  if (!h1) issues.push("Missing H1 heading");

  const h2Count = (html.match(/<h2[^>]*>/gi) ?? []).length;
  if (h2Count === 0) issues.push("No H2 headings found — add subheadings for structure");

  const imgTags = html.match(/<img[^>]+>/gi) ?? [];
  const imageCount = imgTags.length;
  const imagesWithAlt = imgTags.filter((t) => /alt=["'][^"']+["']/i.test(t)).length;
  if (imageCount > 0 && imagesWithAlt < imageCount) {
    issues.push(`${imageCount - imagesWithAlt} image(s) missing alt text`);
  }

  const stripped = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const wordCount = stripped.split(" ").filter((w) => w.length > 2).length;
  if (wordCount < 300) issues.push(`Thin content — only ~${wordCount} words (aim for 500+)`);

  // Score
  let score = 100;
  for (const issue of issues) {
    if (issue.includes("Missing") && issue.includes("title")) score -= 20;
    else if (issue.includes("Missing meta")) score -= 20;
    else if (issue.includes("Missing H1")) score -= 15;
    else if (issue.includes("No H2")) score -= 5;
    else if (issue.includes("alt text")) score -= 10;
    else if (issue.includes("Thin")) score -= 10;
    else score -= 5;
  }

  return {
    url,
    title,
    metaDescription,
    h1,
    h2Count,
    imageCount,
    imagesWithAlt,
    wordCount,
    score: Math.max(0, score),
    issues,
  };
}

async function auditPage(url: string): Promise<AuditPageResult> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "WorldDigitalAI-SEO-Bot/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!resp.ok) {
      return { url, title: null, metaDescription: null, h1: null, h2Count: 0, imageCount: 0, imagesWithAlt: 0, wordCount: 0, score: 0, issues: [`Page returned HTTP ${resp.status}`] };
    }
    const html = await resp.text();
    return extractHtmlMeta(html, url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    return { url, title: null, metaDescription: null, h1: null, h2Count: 0, imageCount: 0, imagesWithAlt: 0, wordCount: 0, score: 0, issues: [`Could not fetch page: ${msg}`] };
  }
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  try {
    const base = new URL(baseUrl);
    const hrefs = html.match(/href=["']([^"'#?]+)["']/gi) ?? [];
    const seen = new Set<string>();
    const links: string[] = [];
    for (const h of hrefs) {
      const m = h.match(/href=["']([^"'#?]+)["']/i);
      if (!m) continue;
      try {
        const u = new URL(m[1], base.origin);
        if (u.hostname !== base.hostname) continue;
        const clean = u.pathname;
        if (!seen.has(clean) && clean !== "/") { seen.add(clean); links.push(u.href); }
      } catch { /* skip */ }
    }
    return links.slice(0, 8);
  } catch {
    return [];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseUrl(raw: string): string {
  const s = raw.trim();
  if (!s.startsWith("http")) return `https://${s}`;
  return s;
}

async function getOrCreateProfile(userId: string): Promise<SeoProfile | null> {
  const col = getCollection<SeoProfile>("seo_profiles");
  return col.findOne({ userId }) as Promise<SeoProfile | null>;
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /v1/seo/status — profile + GSC connection info
router.get("/v1/seo/status", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profile = await getOrCreateProfile(userId);
    const gscConfigured = !!(
      process.env["GOOGLE_SEARCH_CONSOLE_KEY"] ||
      (process.env["MCC_REFRESH_TOKEN"] && process.env["GOOGLE_CLIENT_ID"])
    );
    const keyEnv = process.env["GOOGLE_SEARCH_CONSOLE_KEY"] ?? "";
    let serviceAccountEmail: string | null = null;
    try {
      const sa = JSON.parse(keyEnv) as { client_email?: string };
      serviceAccountEmail = sa.client_email ?? null;
    } catch { /* not JSON */ }

    res.json({
      profile: profile ?? null,
      gscConfigured,
      serviceAccountEmail,
      gscOauthConnected: !!(profile?.googleRefreshToken),
    });
  } catch (err) {
    logger.error({ err }, "SEO status error");
    res.status(500).json({ message: "Failed to load SEO status" });
  }
});

// POST /v1/seo/connect-domain — save domain, test GSC, find matching site
router.post("/v1/seo/connect-domain", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { domain } = req.body as { domain?: string };
  if (!domain) { res.status(400).json({ message: "domain is required" }); return; }

  const normalised = normaliseUrl(domain);
  let gscSiteUrl: string | null = null;
  let domainVerified = false;
  let serviceAccountEmail: string | null = null;
  let gscError: string | null = null;

  try {
    const auth = await getGSCAccessToken(userId);
    if (auth) {
      serviceAccountEmail = auth.serviceAccountEmail;
      const sites = await listGSCSites(auth.token);
      const host = new URL(normalised).hostname;
      // Try sc-domain first, then URL prefix
      const domainProp = `sc-domain:${host}`;
      const urlProp = `${normalised}/`;
      const urlPropNoSlash = normalised;
      gscSiteUrl = sites.find((s) => s === domainProp)
        ?? sites.find((s) => s === urlProp)
        ?? sites.find((s) => s === urlPropNoSlash)
        ?? sites.find((s) => s.includes(host))
        ?? null;
      domainVerified = !!gscSiteUrl;
      if (!domainVerified) {
        gscError = serviceAccountEmail
          ? `Site not found in Search Console. Please add ${serviceAccountEmail} as a Viewer to your GSC property, then try again.`
          : `Site not found in Search Console under this account. Verify the domain at search.google.com/search-console.`;
      }
    } else {
      gscError = "Google Search Console API is not configured. Contact support to enable keyword tracking.";
    }
  } catch (err) {
    logger.warn({ err }, "GSC domain connect error");
    gscError = "Could not connect to Google Search Console — will retry later.";
  }

  const col = getCollection<SeoProfile>("seo_profiles");
  const now = new Date();
  await col.updateOne(
    { userId },
    {
      $set: {
        domain: normalised,
        gscSiteUrl,
        domainVerified,
        serviceAccountEmail,
        updatedAt: now,
      },
      $setOnInsert: {
        lastKeywordSync: null,
        keywordCache: [],
        lastAuditAt: null,
        auditResults: [],
        createdAt: now,
      },
    },
    { upsert: true }
  );

  const matchedFormat = gscSiteUrl
    ? (gscSiteUrl.startsWith("sc-domain:") ? "domain-property" : "url-prefix")
    : null;
  res.json({ domain: normalised, gscSiteUrl, domainVerified, serviceAccountEmail, gscError, matchedFormat });
});

// GET /v1/seo/keywords — fetch from GSC (cached up to 24h)
router.get("/v1/seo/keywords", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const profile = await getOrCreateProfile(userId);
    if (!profile?.domain) {
      res.json({ keywords: [], cached: false, error: "no_domain" });
      return;
    }

    const cacheAgeMs = profile.lastKeywordSync
      ? Date.now() - new Date(profile.lastKeywordSync).getTime()
      : Infinity;
    const CACHE_TTL = 24 * 60 * 60 * 1000;

    if (cacheAgeMs < CACHE_TTL && profile.keywordCache.length > 0) {
      res.json({ keywords: profile.keywordCache, cached: true, lastSync: profile.lastKeywordSync });
      return;
    }

    if (!profile.gscSiteUrl || !profile.domainVerified) {
      res.json({ keywords: profile.keywordCache ?? [], cached: true, lastSync: profile.lastKeywordSync, error: "not_verified" });
      return;
    }

    const auth = await getGSCAccessToken(userId);
    if (!auth) {
      res.json({ keywords: profile.keywordCache ?? [], cached: true, lastSync: profile.lastKeywordSync, error: "no_auth" });
      return;
    }

    const rows = await queryKeywords(auth.token, profile.gscSiteUrl, 90);
    const sorted = rows.sort((a, b) => b.impressions - a.impressions);

    const col = getCollection<SeoProfile>("seo_profiles");
    await col.updateOne({ userId }, { $set: { keywordCache: sorted, lastKeywordSync: new Date(), updatedAt: new Date() } });

    res.json({ keywords: sorted, cached: false, lastSync: new Date() });
  } catch (err) {
    logger.error({ err }, "SEO keywords fetch error");
    res.status(500).json({ message: "Failed to fetch keywords" });
  }
});

// GET /v1/seo/opportunities — positions 4-20, sorted by potential
router.get("/v1/seo/opportunities", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const profile = await getOrCreateProfile(userId);
    const keywords = profile?.keywordCache ?? [];
    const opportunities = keywords
      .filter((k) => k.position >= 4 && k.position <= 20 && k.impressions >= 10)
      .map((k) => ({
        ...k,
        estimatedTrafficGain: Math.round((k.impressions * 0.32) - k.clicks),
        difficulty: k.position <= 10 ? "low" : k.position <= 15 ? "medium" : "high",
      }))
      .sort((a, b) => b.estimatedTrafficGain - a.estimatedTrafficGain)
      .slice(0, 50);
    res.json({ opportunities });
  } catch (err) {
    logger.error({ err }, "SEO opportunities error");
    res.status(500).json({ message: "Failed to get opportunities" });
  }
});

// POST /v1/seo/audit — crawl domain pages
router.post("/v1/seo/audit", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const profile = await getOrCreateProfile(userId);
    if (!profile?.domain) {
      res.status(400).json({ message: "No domain set — connect your domain first" });
      return;
    }

    const domain = profile.domain;
    const results: AuditPageResult[] = [];

    // Audit homepage + PageSpeed in parallel
    const [homepageResult, pageSpeed] = await Promise.all([
      auditPage(domain),
      fetchPageSpeed(domain),
    ]);
    homepageResult.pageSpeedDesktop = pageSpeed.desktop;
    homepageResult.pageSpeedMobile = pageSpeed.mobile;
    results.push(homepageResult);

    // Find and audit internal pages (up to 8)
    try {
      const homeResp = await fetch(domain, {
        headers: { "User-Agent": "WorldDigitalAI-SEO-Bot/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (homeResp.ok) {
        const homeHtml = await homeResp.text();
        const links = extractInternalLinks(homeHtml, domain);
        await Promise.all(
          links.slice(0, 7).map(async (url) => {
            const result = await auditPage(url);
            results.push(result);
          })
        );
      }
    } catch { /* ignore link discovery failures */ }

    const col = getCollection<SeoProfile>("seo_profiles");
    await col.updateOne({ userId }, { $set: { auditResults: results, lastAuditAt: new Date(), updatedAt: new Date() } });

    res.json({ results, auditedAt: new Date() });
  } catch (err) {
    logger.error({ err }, "SEO audit error");
    res.status(500).json({ message: "Audit failed" });
  }
});

// GET /v1/seo/audit — return latest audit results
router.get("/v1/seo/audit", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const profile = await getOrCreateProfile(userId);
    res.json({ results: profile?.auditResults ?? [], lastAuditAt: profile?.lastAuditAt ?? null });
  } catch (err) {
    logger.error({ err }, "SEO audit get error");
    res.status(500).json({ message: "Failed to load audit" });
  }
});

// GET /v1/seo/blog-posts — list
router.get("/v1/seo/blog-posts", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const col = getCollection<SeoBlogPost>("seo_blog_posts");
    const posts = await col.find({ userId }).sort({ createdAt: -1 }).toArray();
    res.json({ posts });
  } catch (err) {
    logger.error({ err }, "SEO blog posts list error");
    res.status(500).json({ message: "Failed to list blog posts" });
  }
});

// POST /v1/seo/blog-posts/generate — AI-generate a blog post
router.post("/v1/seo/blog-posts/generate", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { keyword, businessName, businessDescription, businessUrl } = req.body as {
    keyword?: string;
    businessName?: string;
    businessDescription?: string;
    businessUrl?: string;
  };
  if (!keyword) { res.status(400).json({ message: "keyword is required" }); return; }

  try {
    const prompt = `You are an expert SEO content writer. Write a comprehensive, engaging, SEO-optimized blog post for a business called "${businessName || "a local business"}" targeting the keyword: "${keyword}".

Business context: ${businessDescription || "A growing local business"}
Website: ${businessUrl || ""}

Write a complete blog post with:
1. An SEO-optimized H1 title containing the keyword
2. A compelling meta title (50–60 characters) 
3. A meta description (120–160 characters)
4. At least 800 words of high-quality content
5. Natural keyword usage (2–3% density)
6. H2/H3 subheadings throughout
7. A conclusion with a call to action

Respond in JSON format:
{
  "title": "The H1 blog post title",
  "metaTitle": "50-60 char SEO title",
  "metaDescription": "120-160 char meta description",
  "content": "Full blog post in markdown with ## headings",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const rawResult = await callAI([{ role: "user", content: prompt }], { jsonMode: true, maxTokens: 2000 });
    const raw = rawResult ?? "{}";
    let parsed: { title?: string; metaTitle?: string; metaDescription?: string; content?: string; tags?: string[] };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      parsed = { title: `${keyword} — Complete Guide`, metaTitle: keyword, metaDescription: `Learn everything about ${keyword} from ${businessName ?? "us"}.`, content: raw, tags: [keyword] };
    }

    const slug = (parsed.title ?? keyword).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const now = new Date();
    const col = getCollection<SeoBlogPost>("seo_blog_posts");
    const result = await col.insertOne({
      userId,
      title: parsed.title ?? `${keyword} — Complete Guide`,
      slug,
      metaTitle: parsed.metaTitle ?? keyword,
      metaDescription: parsed.metaDescription ?? "",
      content: parsed.content ?? raw,
      targetKeyword: keyword,
      tags: parsed.tags ?? [keyword],
      status: "draft",
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const post = await col.findOne({ _id: result.insertedId });
    res.json({ post });
  } catch (err) {
    logger.error({ err }, "SEO blog generate error");
    res.status(500).json({ message: "Blog generation failed" });
  }
});

// PUT /v1/seo/blog-posts/:id — update
router.put("/v1/seo/blog-posts/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const col = getCollection<SeoBlogPost>("seo_blog_posts");
    const { title, metaTitle, metaDescription, content, status, tags } = req.body as Partial<SeoBlogPost>;
    const update: Partial<SeoBlogPost> = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (metaTitle !== undefined) update.metaTitle = metaTitle;
    if (metaDescription !== undefined) update.metaDescription = metaDescription;
    if (content !== undefined) update.content = content;
    if (tags !== undefined) update.tags = tags;
    if (status !== undefined) {
      update.status = status;
      if (status === "published") update.publishedAt = new Date();
    }
    const oid = new ObjectId(req.params.id as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (col as any).updateOne({ _id: oid, userId }, { $set: update });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const post = await (col as any).findOne({ _id: oid, userId }) as SeoBlogPost | null;
    res.json({ post });
  } catch (err) {
    logger.error({ err }, "SEO blog update error");
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE /v1/seo/blog-posts/:id
router.delete("/v1/seo/blog-posts/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const col = getCollection<SeoBlogPost>("seo_blog_posts");
    const oid2 = new ObjectId(req.params.id as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (col as any).deleteOne({ _id: oid2, userId });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "SEO blog delete error");
    res.status(500).json({ message: "Delete failed" });
  }
});

// GET /v1/seo/recommendations — get or generate AI recommendations
router.get("/v1/seo/recommendations", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const refresh = req.query["refresh"] === "true";
  try {
    const col = getCollection<SeoRecommendation>("seo_recommendations");
    const existing = await col.findOne({ userId });
    const ageMs = existing ? Date.now() - new Date(existing.generatedAt).getTime() : Infinity;
    const RECS_TTL = 7 * 24 * 60 * 60 * 1000;

    if (!refresh && existing && ageMs < RECS_TTL) {
      res.json({ recommendations: existing.items, generatedAt: existing.generatedAt, cached: true });
      return;
    }

    const profile = await getOrCreateProfile(userId);
    const topKeywords = (profile?.keywordCache ?? []).slice(0, 10).map((k) => `"${k.keyword}" (pos ${k.position.toFixed(1)})`).join(", ");
    const opportunities = (profile?.keywordCache ?? []).filter((k) => k.position >= 4 && k.position <= 20).slice(0, 5).map((k) => k.keyword).join(", ");
    const auditIssues = (profile?.auditResults ?? []).flatMap((r) => r.issues).slice(0, 10).join("; ");
    const domain = profile?.domain ?? "the website";

    const prompt = `You are an expert SEO strategist. Based on the following data for ${domain}, generate 10 specific, actionable SEO recommendations.

Top keywords: ${topKeywords || "No keyword data yet"}
Keyword opportunities (positions 4–20): ${opportunities || "None detected yet"}
On-page audit issues: ${auditIssues || "No audit run yet"}

Generate 10 prioritized recommendations. Respond in JSON:
{
  "items": [
    {
      "priority": "high" | "medium" | "low",
      "action": "Short specific action (max 80 chars)",
      "reason": "Why this will help rankings",
      "estimatedImpact": "e.g. +15% organic traffic in 60 days"
    }
  ]
}`;

    const rawResult2 = await callAI([{ role: "user", content: prompt }], { jsonMode: true, maxTokens: 1200 });
    const raw2 = rawResult2 ?? "{}";
    let items: SeoRecommendation["items"] = [];
    try {
      const parsed = JSON.parse(raw2) as { items?: SeoRecommendation["items"] };
      items = parsed.items ?? [];
    } catch {
      items = [{ priority: "high", action: "Run a full site audit to identify quick wins", reason: "Audit reveals hidden issues impacting rankings", estimatedImpact: "Baseline data for all optimizations" }];
    }

    const now = new Date();
    await col.updateOne({ userId }, { $set: { items, generatedAt: now } }, { upsert: true });

    res.json({ recommendations: items, generatedAt: now, cached: false });
  } catch (err) {
    logger.error({ err }, "SEO recommendations error");
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});

// POST /v1/seo/report/send — generate + email monthly report
router.post("/v1/seo/report/send", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { email, businessName } = req.body as { email?: string; businessName?: string };
  if (!email) { res.status(400).json({ message: "email is required" }); return; }

  try {
    const profile = await getOrCreateProfile(userId);
    const keywords = profile?.keywordCache ?? [];
    const audits = profile?.auditResults ?? [];
    const recCol = getCollection<SeoRecommendation>("seo_recommendations");
    const recs = await recCol.findOne({ userId });
    const blogCol = getCollection<SeoBlogPost>("seo_blog_posts");
    const blogPosts = await blogCol.find({ userId }).sort({ createdAt: -1 }).limit(4).toArray();

    const totalClicks = keywords.reduce((s, k) => s + k.clicks, 0);
    const totalImpressions = keywords.reduce((s, k) => s + k.impressions, 0);
    const avgPosition = keywords.length > 0 ? (keywords.reduce((s, k) => s + k.position, 0) / keywords.length).toFixed(1) : "—";
    const avgScore = audits.length > 0 ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length) : 0;
    const opportunities = keywords.filter((k) => k.position >= 4 && k.position <= 20).length;
    const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });

    const topKeywordsRows = keywords.slice(0, 8).map((k) => `
      <tr style="border-bottom:1px solid #F1F5F9">
        <td style="padding:8px 12px;font-size:13px;color:#111827">${k.keyword}</td>
        <td style="padding:8px 12px;text-align:center;font-size:13px;color:#374151">${k.position.toFixed(1)}</td>
        <td style="padding:8px 12px;text-align:center;font-size:13px;color:#374151">${k.impressions.toLocaleString()}</td>
        <td style="padding:8px 12px;text-align:center;font-size:13px;color:#374151">${k.clicks.toLocaleString()}</td>
        <td style="padding:8px 12px;text-align:center;font-size:13px;color:#374151">${(k.ctr * 100).toFixed(1)}%</td>
      </tr>`).join("");

    const recsHtml = (recs?.items ?? []).slice(0, 5).map((r) => `
      <tr style="border-bottom:1px solid #F1F5F9">
        <td style="padding:8px 12px">
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:${r.priority === "high" ? "rgba(193,58,42,0.1)" : r.priority === "medium" ? "rgba(245,158,11,0.1)" : "rgba(22,163,74,0.1)"};color:${r.priority === "high" ? "#C13A2A" : r.priority === "medium" ? "#D97706" : "#16A34A"}">${r.priority.toUpperCase()}</span>
        </td>
        <td style="padding:8px 12px;font-size:13px;color:#111827">${r.action}</td>
        <td style="padding:8px 12px;font-size:12px;color:#6B7280">${r.estimatedImpact}</td>
      </tr>`).join("");

    const blogHtml = blogPosts.map((p) => `
      <div style="padding:12px;margin-bottom:8px;background:#F8FBFE;border-radius:8px;border-left:3px solid #4285C7">
        <p style="margin:0;font-size:13px;font-weight:700;color:#111827">${p.title}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#6B7280">Target: ${p.targetKeyword} &nbsp;·&nbsp; Status: ${p.status}</p>
      </div>`).join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F1F5F9;margin:0;padding:24px">
<div style="max-width:680px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#4285C7,#C13A2A);padding:32px 40px;color:white">
    <p style="margin:0;font-size:12px;font-weight:700;opacity:0.8;letter-spacing:0.1em">WORLDDIGITAL.AI</p>
    <h1 style="margin:8px 0 4px;font-size:24px;font-weight:900">Monthly SEO Report</h1>
    <p style="margin:0;font-size:14px;opacity:0.85">${month} &nbsp;·&nbsp; ${businessName ?? "Your Business"}</p>
  </div>
  <div style="padding:32px 40px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px">
      ${[
        ["Organic Clicks", totalClicks.toLocaleString(), "#4285C7"],
        ["Impressions", totalImpressions.toLocaleString(), "#16A34A"],
        ["Avg Position", avgPosition, "#D97706"],
        ["SEO Score", `${avgScore}/100`, "#C13A2A"],
      ].map(([label, value, color]) => `
      <div style="background:#F8FBFE;border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(0,0,0,0.06)">
        <p style="margin:0;font-size:20px;font-weight:900;color:${color}">${value}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#6B7280;font-weight:600">${label}</p>
      </div>`).join("")}
    </div>
    ${topKeywordsRows ? `
    <h2 style="font-size:15px;font-weight:800;color:#111827;margin:0 0 12px">Top Keywords</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#FAFBFC;border-radius:8px;overflow:hidden">
      <thead><tr style="background:#F1F5F9">
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6B7280;font-weight:700">KEYWORD</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;color:#6B7280;font-weight:700">POSITION</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;color:#6B7280;font-weight:700">IMPRESSIONS</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;color:#6B7280;font-weight:700">CLICKS</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;color:#6B7280;font-weight:700">CTR</th>
      </tr></thead>
      <tbody>${topKeywordsRows}</tbody>
    </table>` : ""}
    ${opportunities > 0 ? `<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:16px;margin-bottom:28px"><p style="margin:0;font-size:14px;font-weight:700;color:#92400E">⚡ ${opportunities} Keyword Opportunities Detected</p><p style="margin:4px 0 0;font-size:12px;color:#B45309">Keywords ranking positions 4–20 that can be pushed to top 3 with optimization.</p></div>` : ""}
    ${recsHtml ? `
    <h2 style="font-size:15px;font-weight:800;color:#111827;margin:0 0 12px">Top Recommendations for Next Month</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#FAFBFC;border-radius:8px;overflow:hidden">
      <tbody>${recsHtml}</tbody>
    </table>` : ""}
    ${blogHtml ? `<h2 style="font-size:15px;font-weight:800;color:#111827;margin:0 0 12px">Blog Content Published This Month</h2>${blogHtml}` : ""}
    <div style="margin-top:28px;padding:20px;background:linear-gradient(135deg,rgba(66,133,199,0.06),rgba(193,58,42,0.04));border-radius:12px;text-align:center">
      <p style="margin:0;font-size:13px;color:#6B7280">This report was automatically generated by <strong style="color:#4285C7">WorldDigital.ai Auto SEO</strong></p>
      <p style="margin:4px 0 0;font-size:11px;color:#9CA3AF">© ${new Date().getFullYear()} WorldDigital.ai Corporation LLC · 3343 Memorial Blvd · Murfreesboro, TN</p>
    </div>
  </div>
</div>
</body></html>`;

    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      res.status(503).json({ message: "Email service not configured" });
      return;
    }
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: "WorldDigital.ai Corporation LLC <support@worlddigital.ai>",
      to: [email],
      subject: `${month} SEO Report — ${businessName ?? "Your Business"}`,
      html,
    });

    if (result.error) {
      logger.error({ err: result.error }, "SEO report email send failed");
      res.status(500).json({ message: result.error.message ?? "Email send failed" });
      return;
    }

    res.json({ ok: true, emailId: result.data?.id });
  } catch (err) {
    logger.error({ err }, "SEO report send error");
    res.status(500).json({ message: "Failed to send report" });
  }
});

// GET /v1/seo/sites — list all verified Search Console properties
router.get("/v1/seo/sites", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const auth = await getGSCAccessToken(userId);
    if (!auth) {
      res.status(503).json({
        sites: [],
        error: "Google Search Console API is not configured. Set GOOGLE_SEARCH_CONSOLE_KEY (service account JSON) or MCC_REFRESH_TOKEN.",
      });
      return;
    }
    const sites = await listGSCSites(auth.token);
    res.json({ sites, serviceAccountEmail: auth.serviceAccountEmail });
  } catch (err) {
    logger.error({ err }, "SEO sites list error");
    res.status(500).json({ message: "Failed to list Search Console sites" });
  }
});

// GET /v1/seo/analytics — daily time-series (clicks, impressions, position) from GSC
router.get("/v1/seo/analytics", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const days = Math.min(Number(req.query["days"] ?? 90), 90);
  try {
    const profile = await getOrCreateProfile(userId);
    if (!profile?.gscSiteUrl || !profile.domainVerified) {
      res.json({ rows: [], error: profile?.domain ? "not_verified" : "no_domain" });
      return;
    }
    const auth = await getGSCAccessToken(userId);
    if (!auth) { res.json({ rows: [], error: "no_auth" }); return; }
    const rows = await queryAnalytics(auth.token, profile.gscSiteUrl, days);
    res.json({ rows, siteUrl: profile.gscSiteUrl });
  } catch (err) {
    logger.error({ err }, "SEO analytics error");
    res.status(500).json({ message: "Failed to fetch analytics data" });
  }
});

// GET /v1/seo/pages — page-level performance from GSC
router.get("/v1/seo/pages", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const days = Math.min(Number(req.query["days"] ?? 90), 90);
  try {
    const profile = await getOrCreateProfile(userId);
    if (!profile?.gscSiteUrl || !profile.domainVerified) {
      res.json({ pages: [], error: profile?.domain ? "not_verified" : "no_domain" });
      return;
    }
    const auth = await getGSCAccessToken(userId);
    if (!auth) { res.json({ pages: [], error: "no_auth" }); return; }
    const pages = await queryPages(auth.token, profile.gscSiteUrl, days);
    res.json({ pages, siteUrl: profile.gscSiteUrl });
  } catch (err) {
    logger.error({ err }, "SEO pages error");
    res.status(500).json({ message: "Failed to fetch page performance" });
  }
});

// ── GSC per-user OAuth flow ───────────────────────────────────────────────────

const GSC_CALLBACK_URI = "https://worlddigital.ai/api/v1/seo/connect-google/callback";
const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

// GET /v1/seo/connect-google — start per-user GSC OAuth
// Requires ?t=<jwt> query param (user's auth token passed from frontend)
router.get("/v1/seo/connect-google", async (req: Request, res: Response) => {
  const token = req.query["t"] as string | undefined;
  if (!token) { res.status(400).send("Missing auth token"); return; }

  let userId: string;
  try {
    const payload = verifyToken(token);
    userId = payload.userId;
  } catch {
    res.status(401).send("Invalid or expired token");
    return;
  }

  const clientId = process.env["GOOGLE_CLIENT_ID"];
  if (!clientId) { res.status(503).send("Google OAuth not configured"); return; }

  const state = Buffer.from(JSON.stringify({ userId })).toString("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: GSC_CALLBACK_URI,
    response_type: "code",
    scope: GSC_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /v1/seo/connect-google/callback — handle GSC OAuth callback
router.get("/v1/seo/connect-google/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string | undefined>;

  if (error || !code || !state) {
    res.redirect("https://worlddigital.ai/dashboard/seo?gsc=error");
    return;
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { userId?: string };
    if (!decoded.userId) throw new Error("no userId");
    userId = decoded.userId;
  } catch {
    res.redirect("https://worlddigital.ai/dashboard/seo?gsc=error");
    return;
  }

  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    res.redirect("https://worlddigital.ai/dashboard/seo?gsc=error");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: GSC_CALLBACK_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json() as { refresh_token?: string; error?: string };

    if (tokenData.error || !tokenData.refresh_token) {
      logger.warn({ tokenError: tokenData.error }, "GSC OAuth callback — no refresh_token returned");
      res.redirect("https://worlddigital.ai/dashboard/seo?gsc=error");
      return;
    }

    const col = getCollection<SeoProfile>("seo_profiles");
    const now = new Date();
    await col.updateOne(
      { userId },
      {
        $set: { googleRefreshToken: tokenData.refresh_token, updatedAt: now },
        $setOnInsert: {
          domain: "",
          gscSiteUrl: null,
          domainVerified: false,
          serviceAccountEmail: null,
          lastKeywordSync: null,
          keywordCache: [],
          lastAuditAt: null,
          auditResults: [],
          createdAt: now,
        },
      },
      { upsert: true }
    );

    logger.info({ userId }, "GSC per-user refresh token saved");
    res.redirect("https://worlddigital.ai/dashboard/seo?gsc=connected");
  } catch (err) {
    logger.error({ err }, "GSC OAuth callback error");
    res.redirect("https://worlddigital.ai/dashboard/seo?gsc=error");
  }
});

export default router;
