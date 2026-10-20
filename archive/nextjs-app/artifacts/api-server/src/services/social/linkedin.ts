/**
 * LinkedIn social publishing service.
 * Client ID + Secret are for OAuth app identification only.
 * Posting requires LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORGANIZATION_ID.
 *
 * Auto-refresh:
 *   - Reads LINKEDIN_TOKEN_EXPIRES_AT (Unix epoch seconds) to detect expiry
 *   - If token expires in < 7 days and LINKEDIN_REFRESH_TOKEN is set, auto-refreshes
 *   - On refresh failure, sets tokenRefreshFailed = true so health check can alert
 */

import { logger } from "../../lib/logger.js";
import { resolveEnv } from "../../lib/secretResolver.js";

const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API       = "https://api.linkedin.com/v2";

const DAYS_7_SECS = 7 * 24 * 60 * 60;

export interface LinkedInStatus {
  clientConfigured: boolean;
  accessTokenConfigured: boolean;
  accessTokenMasked: string | null;
  organizationConfigured: boolean;
  postingReady: boolean;
  tokenExpiresAt: string | null;
  daysUntilExpiry: number | null;
  tokenExpiringSoon: boolean;
  tokenRefreshAvailable: boolean;
  tokenRefreshFailed: boolean;
  autoRefreshed: boolean;
  issues: string[];
}

export interface PostInput {
  caption: string;
  mediaUrl?: string;
  link?: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface TokenRefreshResult {
  success: boolean;
  newAccessTokenMasked?: string;
  expiresIn?: number;
  newExpiresAt?: string;
  error?: string;
  note?: string;
}

function mask(v: string): string {
  return v.length > 8 ? `${v.slice(0, 4)}****${v.slice(-4)}` : "****";
}

// ── Token expiry helpers ─────────────────────────────────────────────────────

function getTokenExpiresAt(): { expiresAtStr: string | null; daysLeft: number | null; expiringSoon: boolean } {
  const raw = process.env["LINKEDIN_TOKEN_EXPIRES_AT"];
  if (!raw) return { expiresAtStr: null, daysLeft: null, expiringSoon: false };

  const expiresAtSec = parseInt(raw, 10);
  if (isNaN(expiresAtSec)) return { expiresAtStr: null, daysLeft: null, expiringSoon: false };

  const nowSec     = Math.floor(Date.now() / 1000);
  const secsLeft   = expiresAtSec - nowSec;
  const daysLeft   = Math.ceil(secsLeft / 86400);
  const expiringSoon = secsLeft < DAYS_7_SECS;
  const expiresAtStr = new Date(expiresAtSec * 1000).toISOString();

  return { expiresAtStr, daysLeft, expiringSoon };
}

// ── Token refresh ────────────────────────────────────────────────────────────

export async function refreshLinkedInToken(): Promise<TokenRefreshResult> {
  const clientId     = resolveEnv("LINKEDIN_CLIENT_ID", "LINKEDIN_APP_ID");
  const clientSecret = resolveEnv("LINKEDIN_CLIENT_SECRET", "LINKEDIN_APP_SECRET");
  const refreshToken = resolveEnv("LINKEDIN_REFRESH_TOKEN");

  if (!clientId)     return { success: false, error: "LINKEDIN_CLIENT_ID is not set — cannot refresh token" };
  if (!clientSecret) return { success: false, error: "LINKEDIN_CLIENT_SECRET is not set — cannot refresh token" };
  if (!refreshToken) return { success: false, error: "LINKEDIN_REFRESH_TOKEN is not set — complete the LinkedIn OAuth flow to get a refresh token" };

  try {
    const resp = await fetch(LINKEDIN_TOKEN_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "refresh_token",
        refresh_token: refreshToken,
        client_id:     clientId,
        client_secret: clientSecret,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = (await resp.json()) as {
      access_token?:           string;
      expires_in?:             number;
      refresh_token?:          string;
      refresh_token_expires_in?: number;
      error?:                  string;
      error_description?:      string;
    };

    if (!resp.ok || !data.access_token) {
      const msg = data.error_description ?? data.error ?? `HTTP ${resp.status}`;
      logger.warn({ msg }, "LinkedIn token refresh failed");
      return { success: false, error: `LinkedIn token refresh failed: ${msg}` };
    }

    // Update in-memory credentials immediately (active for this server session)
    process.env["LINKEDIN_ACCESS_TOKEN"] = data.access_token;
    if (data.refresh_token) {
      process.env["LINKEDIN_REFRESH_TOKEN"] = data.refresh_token;
    }

    // Store new expiry timestamp so next check knows when to refresh again
    if (data.expires_in) {
      const newExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
      process.env["LINKEDIN_TOKEN_EXPIRES_AT"] = newExpiresAt.toString();
    }

    const newExpiresAt = data.expires_in
      ? new Date((Math.floor(Date.now() / 1000) + data.expires_in) * 1000).toISOString()
      : null;

    logger.info({ expiresIn: data.expires_in, newExpiresAt }, "LinkedIn access token refreshed");

    return {
      success:             true,
      newAccessTokenMasked: mask(data.access_token),
      expiresIn:           data.expires_in,
      newExpiresAt:        newExpiresAt ?? undefined,
      note: "Token refreshed in memory. Update LINKEDIN_ACCESS_TOKEN in Replit Secrets for persistence across restarts. Also update LINKEDIN_TOKEN_EXPIRES_AT if shown.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    logger.error({ err: e }, "LinkedIn token refresh network error");
    return { success: false, error: `LinkedIn token refresh network error: ${msg}` };
  }
}

// ── Status (with auto-refresh) ────────────────────────────────────────────────

export async function testLinkedInConnection(): Promise<LinkedInStatus> {
  const clientId    = resolveEnv("LINKEDIN_CLIENT_ID", "LINKEDIN_APP_ID");
  const clientSecret = resolveEnv("LINKEDIN_CLIENT_SECRET", "LINKEDIN_APP_SECRET");
  let   accessToken = resolveEnv("LINKEDIN_ACCESS_TOKEN", "LINKEDIN_TOKEN", "LINKEDIN_OAUTH_TOKEN", "LINKEDIN_PAGE_ACCESS_TOKEN");
  const orgId       = resolveEnv("LINKEDIN_ORGANIZATION_ID", "LINKEDIN_COMPANY_ID", "LINKEDIN_PAGE_ID", "LINKEDIN_ORG_ID");
  const issues: string[] = [];

  const clientConfigured      = !!(clientId && clientSecret);
  const organizationConfigured = !!orgId;
  const refreshTokenAvailable  = !!resolveEnv("LINKEDIN_REFRESH_TOKEN");

  if (!clientConfigured) {
    if (!clientId)     issues.push("LINKEDIN_CLIENT_ID is not set — add from LinkedIn Developer Portal");
    if (!clientSecret) issues.push("LINKEDIN_CLIENT_SECRET is not set — add from LinkedIn Developer Portal");
  }
  if (!orgId) {
    issues.push("LINKEDIN_ORGANIZATION_ID is not set — add your LinkedIn company page ID");
  }

  // ── Token expiry check ───────────────────────────────────────────────────

  const { expiresAtStr, daysLeft, expiringSoon } = getTokenExpiresAt();
  let autoRefreshed      = false;
  let tokenRefreshFailed = false;

  if (!accessToken) {
    issues.push("LINKEDIN_ACCESS_TOKEN is not set — complete the OAuth flow in LinkedIn Developer Portal to get a token");
  } else if (expiringSoon && refreshTokenAvailable) {
    const isExpired = daysLeft !== null && daysLeft <= 0;
    logger.info({ daysLeft, isExpired }, "LinkedIn token expiring soon — attempting auto-refresh");

    const refreshResult = await refreshLinkedInToken();
    if (refreshResult.success) {
      accessToken   = resolveEnv("LINKEDIN_ACCESS_TOKEN");
      autoRefreshed = true;
      if (isExpired) {
        issues.push(`LinkedIn access token was expired and has been refreshed automatically. Update LINKEDIN_ACCESS_TOKEN in Replit Secrets.`);
      } else {
        issues.push(`LinkedIn access token expires in ${daysLeft} days — refreshed automatically. Update LINKEDIN_ACCESS_TOKEN in Replit Secrets.`);
      }
    } else {
      tokenRefreshFailed = true;
      issues.push(`LinkedIn token refresh failed: ${refreshResult.error}. Update LINKEDIN_ACCESS_TOKEN manually.`);
    }
  } else if (expiringSoon && !refreshTokenAvailable) {
    issues.push(`LinkedIn access token expires in ${daysLeft} days — set LINKEDIN_REFRESH_TOKEN to enable auto-refresh.`);
  } else if (daysLeft !== null && daysLeft <= 0) {
    issues.push("LinkedIn access token has expired. Set LINKEDIN_REFRESH_TOKEN to auto-refresh, or run the OAuth flow again.");
  }

  // Suppress "not set" issue if we just refreshed
  if (autoRefreshed) {
    issues.splice(issues.indexOf("LINKEDIN_ACCESS_TOKEN is not set — complete the OAuth flow in LinkedIn Developer Portal to get a token"), 1);
  }

  return {
    clientConfigured,
    accessTokenConfigured: !!accessToken,
    accessTokenMasked:     accessToken ? mask(accessToken) : null,
    organizationConfigured,
    postingReady:          !!accessToken && organizationConfigured,
    tokenExpiresAt:        expiresAtStr,
    daysUntilExpiry:       daysLeft,
    tokenExpiringSoon:     expiringSoon,
    tokenRefreshAvailable: refreshTokenAvailable,
    tokenRefreshFailed,
    autoRefreshed,
    issues,
  };
}

// ── Image upload helper ────────────────────────────────────────────────────────

const WD_LOGO_URL = "https://worlddigital.ai/logo-email.png";

async function uploadImageToLinkedIn(
  imageUrl: string,
  accessToken: string,
  orgId: string
): Promise<string | null> {
  try {
    const registerResp = await fetch(`${LINKEDIN_API}/assets?action=registerUpload`, {
      method:  "POST",
      headers: {
        "Content-Type":              "application/json",
        Authorization:               `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes:              ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner:                `urn:li:organization:${orgId}`,
          serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
        },
      }),
    });

    if (!registerResp.ok) {
      logger.warn({ status: registerResp.status }, "LinkedIn registerUpload failed");
      return null;
    }

    const regData = await registerResp.json() as {
      value?: {
        uploadMechanism?: {
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: { uploadUrl?: string };
        };
        asset?: string;
      };
    };

    const uploadUrl = regData.value?.uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl;
    const assetUrn  = regData.value?.asset;

    if (!uploadUrl || !assetUrn) {
      logger.warn("LinkedIn registerUpload: missing uploadUrl or asset URN");
      return null;
    }

    const imgResp = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
    if (!imgResp.ok) {
      logger.warn({ imageUrl, status: imgResp.status }, "LinkedIn image fetch failed");
      return null;
    }

    const imgBytes  = await imgResp.arrayBuffer();
    const mimeType  = imgResp.headers.get("content-type") ?? "image/jpeg";

    const putResp = await fetch(uploadUrl, {
      method:  "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": mimeType },
      body:    imgBytes,
    });

    if (!putResp.ok) {
      logger.warn({ status: putResp.status }, "LinkedIn image PUT failed");
      return null;
    }

    return assetUrn;
  } catch (err) {
    logger.warn({ err }, "LinkedIn image upload error — will post text-only");
    return null;
  }
}

// ── Publish ───────────────────────────────────────────────────────────────────

export async function publishToLinkedIn(input: PostInput, creds?: { accessToken?: string; orgId?: string }): Promise<PublishResult> {
  const accessToken = creds?.accessToken ?? resolveEnv("LINKEDIN_ACCESS_TOKEN", "LINKEDIN_TOKEN", "LINKEDIN_OAUTH_TOKEN", "LINKEDIN_PAGE_ACCESS_TOKEN");
  const orgId       = creds?.orgId ?? resolveEnv("LINKEDIN_ORGANIZATION_ID", "LINKEDIN_COMPANY_ID", "LINKEDIN_PAGE_ID", "LINKEDIN_ORG_ID");

  if (!accessToken) {
    return { success: false, error: "No LinkedIn access token found (tried: LINKEDIN_ACCESS_TOKEN, LINKEDIN_TOKEN, LINKEDIN_OAUTH_TOKEN, LINKEDIN_PAGE_ACCESS_TOKEN). Complete OAuth flow at LinkedIn Developer Portal." };
  }
  if (!orgId) {
    return { success: false, error: "No LinkedIn organization ID found (tried: LINKEDIN_ORGANIZATION_ID, LINKEDIN_COMPANY_ID, LINKEDIN_PAGE_ID) — add your LinkedIn company page ID" };
  }

  const text = input.link ? `${input.caption}\n\n${input.link}` : input.caption;

  const imageSource = input.mediaUrl ?? WD_LOGO_URL;
  const assetUrn    = await uploadImageToLinkedIn(imageSource, accessToken, orgId);

  const shareContent: Record<string, unknown> = assetUrn
    ? {
        shareCommentary:   { text },
        shareMediaCategory: "IMAGE",
        media: [{
          status:      "READY",
          media:       assetUrn,
          description: { text: "WorldDigital.ai" },
          title:       { text: "WorldDigital.ai" },
        }],
      }
    : {
        shareCommentary:   { text },
        shareMediaCategory: "NONE",
      };

  const body: Record<string, unknown> = {
    author:          `urn:li:organization:${orgId}`,
    lifecycleState:  "PUBLISHED",
    specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
    visibility:      { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  try {
    const resp = await fetch(`${LINKEDIN_API}/ugcPosts`, {
      method:  "POST",
      headers: {
        "Content-Type":               "application/json",
        Authorization:                `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version":  "2.0.0",
      },
      body: JSON.stringify(body),
    });

    if (resp.ok) {
      const postId = resp.headers.get("x-restli-id") ?? "";
      return { success: true, postId };
    }

    const err = (await resp.json()) as { message?: string; status?: number };
    if (resp.status === 401) {
      return { success: false, error: "LINKEDIN_ACCESS_TOKEN is expired — the auto-refresh will run on next health check if LINKEDIN_REFRESH_TOKEN is set, or update manually." };
    }
    return { success: false, error: err.message ?? `LinkedIn API returned ${resp.status}` };
  } catch (err) {
    logger.error({ err }, "LinkedIn publish error");
    return { success: false, error: "LinkedIn API request failed" };
  }
}
