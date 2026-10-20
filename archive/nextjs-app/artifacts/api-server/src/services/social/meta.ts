/**
 * Meta organic social publishing service.
 * Uses META_ACCESS_TOKEN (organic page token), FB_PAGE_ID, and
 * INSTAGRAM_BUSINESS_ACCOUNT_ID.
 * Distinct from services/ads/meta.ts which handles paid ad campaigns.
 */

import { logger } from "../../lib/logger.js";
import { resolveEnv } from "../../lib/secretResolver.js";

const GRAPH = "https://graph.facebook.com/v19.0";
const META_STATUS_CACHE_TTL_MS = 10 * 60 * 1000;

type MetaCacheEntry = {
  expiresAt: number;
  value: MetaSocialStatus;
};

const metaStatusCache = new Map<string, MetaCacheEntry>();

function mask(v: string): string {
  return v.length > 10 ? `${v.slice(0, 4)}****${v.slice(-4)}` : "****";
}

export interface MetaSocialStatus {
  configured: boolean;
  tokenValid: boolean;
  tokenMasked: string | null;
  pagesFound: boolean;
  pageName: string | null;
  instagramBusinessFound: boolean;
  canPostFacebook: boolean;
  canPostInstagram: boolean;
  issues: string[];
}

export interface PostInput {
  caption: string;
  mediaUrl?: string;
  link?: string;
}

export interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

// ── Status ────────────────────────────────────────────────────────────────────

export async function testMetaConnection(): Promise<MetaSocialStatus> {
  const token = resolveEnv("META_ACCESS_TOKEN", "FB_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN", "FB_PAGE_ACCESS_TOKEN", "META_PAGE_ACCESS_TOKEN");
  const pageId = resolveEnv("FB_PAGE_ID", "FACEBOOK_PAGE_ID", "META_PAGE_ID");
  const igId = resolveEnv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "IG_BUSINESS_ACCOUNT_ID", "INSTAGRAM_ACCOUNT_ID", "IG_ACCOUNT_ID");
  const cacheKey = [token, pageId, igId].map((v) => (v ? v.slice(0, 8) : "")).join(":");
  const cached = metaStatusCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const issues: string[] = [];

  if (!token) {
    issues.push("META_ACCESS_TOKEN is not set — add a page access token from Meta Business Suite");
    const value = { configured: false, tokenValid: false, tokenMasked: null, pagesFound: false, pageName: null, instagramBusinessFound: false, canPostFacebook: false, canPostInstagram: false, issues };
    metaStatusCache.set(cacheKey, { expiresAt: Date.now() + META_STATUS_CACHE_TTL_MS, value });
    return value;
  }

  // Test token
  let tokenValid = false;
  let pageName: string | null = null;
  let pagesFound = false;

  try {
    const meResp = await fetch(`${GRAPH}/me?access_token=${token}&fields=id,name`, {
      signal: AbortSignal.timeout(8000),
    });
    const me = (await meResp.json()) as { id?: string; name?: string; error?: { message: string } };
    if (meResp.ok && me.id) {
      tokenValid = true;
    } else {
      issues.push(`META_ACCESS_TOKEN check failed: ${me.error?.message ?? "invalid token"}`);
    }
  } catch (e) {
    issues.push("Meta API unreachable — network error");
  }

  // Test page access
  if (tokenValid && pageId) {
    try {
      const pageResp = await fetch(`${GRAPH}/${pageId}?access_token=${token}&fields=id,name`, {
        signal: AbortSignal.timeout(8000),
      });
      const page = (await pageResp.json()) as { id?: string; name?: string; error?: { message: string } };
      if (pageResp.ok && page.id) {
        pagesFound = true;
        pageName = page.name ?? null;
      } else {
        issues.push(`FB_PAGE_ID check failed: ${page.error?.message ?? "page not accessible"}`);
      }
    } catch {
      issues.push("Could not reach Facebook page — check FB_PAGE_ID");
    }
  } else if (!pageId) {
    issues.push("FB_PAGE_ID is not set — add your Facebook page ID to post to Facebook");
  }

  // Test Instagram — two strategies to handle deprecated legacy endpoint errors
  let instagramBusinessFound = false;
  if (tokenValid && igId) {
    // Strategy 1: direct IG business account check (current Graph API v19+)
    let directOk = false;
    let directError: string | null = null;
    try {
      const igResp = await fetch(
        `${GRAPH}/${igId}?access_token=${token}&fields=id,username,name`,
        { signal: AbortSignal.timeout(8000) }
      );
      const ig = (await igResp.json()) as { id?: string; error?: { message: string; code?: number } };
      if (igResp.ok && ig.id) {
        directOk = true;
        instagramBusinessFound = true;
      } else {
        directError = ig.error?.message ?? "account not accessible";
      }
    } catch {
      directError = "Network error reaching Instagram API";
    }

    // Strategy 2: cross-check via Facebook page instagram_business_account field
    // Useful when direct check hits a deprecated-endpoint error (code 36106)
    if (!directOk && pagesFound && pageId) {
      try {
        const pageIgResp = await fetch(
          `${GRAPH}/${pageId}?access_token=${token}&fields=instagram_business_account`,
          { signal: AbortSignal.timeout(8000) }
        );
        const pageIg = (await pageIgResp.json()) as {
          instagram_business_account?: { id: string };
          error?: { message: string };
        };
        if (pageIgResp.ok && pageIg.instagram_business_account?.id) {
          const linkedId = pageIg.instagram_business_account.id;
          if (linkedId === igId) {
            // IDs match — account is confirmed linked even if direct check failed
            instagramBusinessFound = true;
            issues.push(
              `Instagram account confirmed via Facebook page link (direct IG API returned: ${directError})`
            );
          } else {
            // IDs differ — show both for the admin to compare
            const maskedLinked = linkedId.length > 8 ? `${linkedId.slice(0, 4)}…${linkedId.slice(-4)}` : linkedId;
            const maskedSet   = igId.length > 8       ? `${igId.slice(0, 4)}…${igId.slice(-4)}`       : igId;
            issues.push(
              `INSTAGRAM_BUSINESS_ACCOUNT_ID mismatch: secret has ${maskedSet}, but page links to ${maskedLinked}. Update the secret to match.`
            );
          }
        } else if (pageIg.error) {
          issues.push(`Instagram check failed: ${directError}. Page cross-check: ${pageIg.error.message}`);
        } else {
          issues.push(`Instagram check failed: ${directError}. No Instagram business account linked to this Facebook page.`);
        }
      } catch {
        // Cross-check network failure — just surface the original direct error
        issues.push(`Instagram check failed: ${directError}`);
      }
    } else if (!directOk) {
      issues.push(`Instagram check failed: ${directError}`);
    }
  } else if (!igId) {
    issues.push("INSTAGRAM_BUSINESS_ACCOUNT_ID is not set — add it to post to Instagram");
  }

  const value = {
    configured: true,
    tokenValid,
    tokenMasked: mask(token),
    pagesFound,
    pageName,
    instagramBusinessFound,
    canPostFacebook: tokenValid && pagesFound,
    canPostInstagram: tokenValid && instagramBusinessFound,
    issues,
  };
  metaStatusCache.set(cacheKey, { expiresAt: Date.now() + META_STATUS_CACHE_TTL_MS, value });
  return value;
}

// ── Publish ───────────────────────────────────────────────────────────────────

export async function publishToFacebook(input: PostInput, creds?: { accessToken?: string; pageId?: string }): Promise<PostResult> {
  const token = creds?.accessToken ?? resolveEnv("META_ACCESS_TOKEN", "FB_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN", "FB_PAGE_ACCESS_TOKEN", "META_PAGE_ACCESS_TOKEN");
  const pageId = creds?.pageId ?? resolveEnv("FB_PAGE_ID", "FACEBOOK_PAGE_ID", "META_PAGE_ID");

  if (!token) return { success: false, error: "No Meta access token found (tried: META_ACCESS_TOKEN, FB_ACCESS_TOKEN, FACEBOOK_ACCESS_TOKEN)" };
  if (!pageId) return { success: false, error: "No Facebook page ID found (tried: FB_PAGE_ID, FACEBOOK_PAGE_ID, META_PAGE_ID)" };

  const text = input.link ? `${input.caption}\n\n${input.link}` : input.caption;

  try {
    const body: Record<string, string> = { message: text, access_token: token };
    if (input.mediaUrl) body["link"] = input.mediaUrl;

    const resp = await fetch(`${GRAPH}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await resp.json()) as { id?: string; error?: { message: string } };

    if (data.id) {
      return { success: true, postId: data.id, postUrl: `https://facebook.com/${data.id}` };
    }
    return { success: false, error: data.error?.message ?? "Facebook post failed" };
  } catch (err) {
    logger.error({ err }, "Facebook publish error");
    return { success: false, error: "Facebook API request failed" };
  }
}

export async function publishToInstagram(input: PostInput, creds?: { accessToken?: string; igId?: string }): Promise<PostResult> {
  const token = creds?.accessToken ?? resolveEnv("META_ACCESS_TOKEN", "FB_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN", "FB_PAGE_ACCESS_TOKEN", "META_PAGE_ACCESS_TOKEN");
  const igId = creds?.igId ?? resolveEnv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "IG_BUSINESS_ACCOUNT_ID", "INSTAGRAM_ACCOUNT_ID", "IG_ACCOUNT_ID");

  if (!token) return { success: false, error: "No Meta access token found (tried: META_ACCESS_TOKEN, FB_ACCESS_TOKEN, FACEBOOK_ACCESS_TOKEN)" };
  if (!igId) return { success: false, error: "No Instagram Business Account ID found (tried: INSTAGRAM_BUSINESS_ACCOUNT_ID, IG_BUSINESS_ACCOUNT_ID, INSTAGRAM_ACCOUNT_ID)" };
  if (!input.mediaUrl) return { success: false, error: "Instagram requires a media URL (image or video)" };

  const caption = input.link ? `${input.caption}\n\n${input.link}` : input.caption;

  try {
    // Step 1 — Create container
    const containerResp = await fetch(`${GRAPH}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: input.mediaUrl, caption, access_token: token }),
    });
    const container = (await containerResp.json()) as { id?: string; error?: { message: string } };
    if (!container.id) {
      return { success: false, error: container.error?.message ?? "Instagram media container creation failed" };
    }

    // Step 2 — Publish container
    const publishResp = await fetch(`${GRAPH}/${igId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token: token }),
    });
    const pub = (await publishResp.json()) as { id?: string; error?: { message: string } };

    if (pub.id) {
      return { success: true, postId: pub.id };
    }
    return { success: false, error: pub.error?.message ?? "Instagram publish failed" };
  } catch (err) {
    logger.error({ err }, "Instagram publish error");
    return { success: false, error: "Instagram API request failed" };
  }
}
