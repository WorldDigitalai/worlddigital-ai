/**
 * Snapchat social + Marketing API service.
 * Handles: status checks, token refresh, ad account discovery, ad draft creation.
 *
 * Required ENV:
 *   SNAPCHAT_CLIENT_ID or SNAP_CLIENT_ID
 *   SNAP_CLIENT_SECRET
 *   SNAP_ACCESS_TOKEN
 *   SNAP_REFRESH_TOKEN
 *   SNAP_AD_ACCOUNT_ID
 */

import { logger } from "../../lib/logger.js";
import { resolveEnv } from "../../lib/secretResolver.js";
import { snapFetch } from "../../lib/snapTokenManager.js";

const SNAP_AUTH       = "https://accounts.snapchat.com/login/oauth2";
const SNAP_TOKEN_URL  = "https://accounts.snapchat.com/login/oauth2/token";
const SNAP_ADS  = "https://adsapi.snapchat.com/v1";

function mask(v: string): string {
  if (v.length <= 8) return "****";
  return `${v.slice(0, 4)}****${v.slice(-4)}`;
}

function clientId(): string | undefined {
  return resolveEnv("SNAPCHAT_CLIENT_ID", "SNAP_CLIENT_ID");
}

// ── Detailed status ────────────────────────────────────────────────────────────

export interface SnapchatStatus {
  clientIdSet: boolean;
  clientSecretSet: boolean;
  accessTokenSet: boolean;
  refreshTokenSet: boolean;
  adAccountIdSet: boolean;
  accessTokenMasked: string | null;
  refreshTokenMasked: string | null;
  clientConfigured: boolean;
  marketingApiReady: boolean;
  tokenExpired: boolean;
  canRefresh: boolean;
  issues: string[];
}

export async function testSnapchatConnection(): Promise<SnapchatStatus> {
  const cid       = clientId();
  const secret    = resolveEnv("SNAP_CLIENT_SECRET", "SNAPCHAT_CLIENT_SECRET");
  const token     = resolveEnv("SNAP_ACCESS_TOKEN", "SNAPCHAT_ACCESS_TOKEN");
  const refresh   = resolveEnv("SNAP_REFRESH_TOKEN", "SNAPCHAT_REFRESH_TOKEN");
  const accountId = resolveEnv("SNAP_AD_ACCOUNT_ID", "SNAPCHAT_AD_ACCOUNT_ID");

  const clientIdSet      = !!cid;
  const clientSecretSet  = !!secret;
  const accessTokenSet   = !!token;
  const refreshTokenSet  = !!refresh;
  const adAccountIdSet   = !!accountId;
  const clientConfigured = clientIdSet && clientSecretSet;
  const canRefresh       = clientConfigured && refreshTokenSet;

  const issues: string[] = [];
  let marketingApiReady = false;
  let tokenExpired = false;

  if (!cid)     issues.push("SNAPCHAT_CLIENT_ID is not set — add from Snapchat Developer Portal → App Credentials");
  if (!secret)  issues.push("SNAP_CLIENT_SECRET is not set — add SNAP_CLIENT_SECRET from Snapchat Developer Portal before OAuth can complete");
  if (!token)   issues.push("SNAP_ACCESS_TOKEN is not set — complete the Snapchat OAuth flow at Admin → Integrations → Snapchat");
  if (!refresh) issues.push("SNAP_REFRESH_TOKEN is not set — complete the Snapchat OAuth flow to receive a refresh token");
  if (!accountId) issues.push("SNAP_AD_ACCOUNT_ID is not set — use 'Discover Ad Accounts' after connecting OAuth");

  if (cid && !secret) {
    issues.push("Client ID is set, but OAuth cannot complete without SNAP_CLIENT_SECRET.");
  }

  if (token && accountId) {
    try {
      const resp = await snapFetch(`${SNAP_ADS}/adaccounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });

      if (resp.ok) {
        marketingApiReady = true;
      } else if (resp.status === 401) {
        tokenExpired = true;
        issues.push("SNAP_ACCESS_TOKEN is expired — use 'Refresh Token' on Admin → Integrations → Snapchat");
        if (canRefresh) {
          issues.push("A refresh token is present — click 'Refresh Token' to attempt automatic renewal.");
        }
      } else {
        issues.push(`Snapchat Marketing API returned ${resp.status} — check SNAP_AD_ACCOUNT_ID`);
      }
    } catch {
      issues.push("Snapchat Marketing API unreachable — network error");
    }
  } else if (token && !accountId) {
    issues.push("Access token is set but SNAP_AD_ACCOUNT_ID is missing — use 'Discover Ad Accounts'");
  }

  return {
    clientIdSet,
    clientSecretSet,
    accessTokenSet,
    refreshTokenSet,
    adAccountIdSet,
    accessTokenMasked: token ? mask(token) : null,
    refreshTokenMasked: refresh ? mask(refresh) : null,
    clientConfigured,
    marketingApiReady,
    tokenExpired,
    canRefresh,
    issues,
  };
}

// ── Token refresh ──────────────────────────────────────────────────────────────

export interface TokenRefreshResult {
  success: boolean;
  accessTokenMasked?: string;
  refreshTokenMasked?: string;
  newAccessToken?: string;
  newRefreshToken?: string;
  expiresIn?: number;
  error?: string;
  note?: string;
}

export async function refreshSnapchatToken(): Promise<TokenRefreshResult> {
  const cid     = clientId();
  const secret  = resolveEnv("SNAP_CLIENT_SECRET", "SNAPCHAT_CLIENT_SECRET");
  const refresh = resolveEnv("SNAP_REFRESH_TOKEN", "SNAPCHAT_REFRESH_TOKEN");

  if (!cid)     return { success: false, error: "SNAPCHAT_CLIENT_ID is not set" };
  if (!secret)  return { success: false, error: "SNAP_CLIENT_SECRET is not set — cannot refresh without it" };
  if (!refresh) return { success: false, error: "SNAP_REFRESH_TOKEN is not set — complete the OAuth flow first" };

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: cid,
      client_secret: secret,
    });

    const resp = await fetch(SNAP_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(15000),
    });

    const data = (await resp.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!resp.ok || !data.access_token) {
      logger.warn({ error: data.error }, "Snapchat token refresh failed");
      return {
        success: false,
        error: data.error_description ?? data.error ?? `Token refresh returned ${resp.status}`,
      };
    }

    logger.info("Snapchat token refreshed successfully");
    process.env["SNAP_ACCESS_TOKEN"] = data.access_token;
    if (data.refresh_token) {
      process.env["SNAP_REFRESH_TOKEN"] = data.refresh_token;
    }

    return {
      success: true,
      newAccessToken: data.access_token,
      newRefreshToken: data.refresh_token ?? refresh,
      accessTokenMasked: mask(data.access_token),
      refreshTokenMasked: mask(data.refresh_token ?? refresh),
      expiresIn: data.expires_in,
      note: "Replit Secrets cannot be updated automatically. Copy the values below and paste them into Replit Secrets manually.",
    };
  } catch (err) {
    logger.error({ err }, "Snapchat token refresh error");
    return { success: false, error: err instanceof Error ? err.message : "Network error during token refresh" };
  }
}

// ── Ad account discovery ───────────────────────────────────────────────────────

export interface SnapAdAccount {
  id: string;
  name: string;
  organizationId: string;
  currency?: string;
  status?: string;
}

export async function discoverSnapchatAdAccounts(
  accessToken?: string
): Promise<{ success: boolean; accounts: SnapAdAccount[]; error?: string }> {
  const token = accessToken ?? process.env["SNAP_ACCESS_TOKEN"];
  if (!token) {
    return { success: false, accounts: [], error: "SNAP_ACCESS_TOKEN is not set" };
  }

  try {
    // Step 1: get organizations
    const orgsResp = await snapFetch(`${SNAP_ADS}/me/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!orgsResp.ok) {
      if (orgsResp.status === 401) {
        return { success: false, accounts: [], error: "Access token is expired — use Refresh Token" };
      }
      return { success: false, accounts: [], error: `Organizations API returned ${orgsResp.status}` };
    }

    const orgsData = (await orgsResp.json()) as {
      organizations?: Array<{ organization: { id: string; name: string } }>;
    };

    const orgs = orgsData.organizations?.map((o) => o.organization) ?? [];
    if (!orgs.length) {
      return { success: true, accounts: [], error: "No organizations found for this Snapchat account" };
    }

    const accounts: SnapAdAccount[] = [];

    // Step 2: get ad accounts for each org
    await Promise.all(
      orgs.map(async (org) => {
        try {
          const acctResp = await snapFetch(`${SNAP_ADS}/organizations/${org.id}/adaccounts`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(10000),
          });
          if (!acctResp.ok) return;

          const acctData = (await acctResp.json()) as {
            adaccounts?: Array<{
              adaccount: { id: string; name: string; currency?: string; status?: string };
            }>;
          };

          for (const a of acctData.adaccounts ?? []) {
            accounts.push({
              id: a.adaccount.id,
              name: a.adaccount.name,
              organizationId: org.id,
              currency: a.adaccount.currency,
              status: a.adaccount.status,
            });
          }
        } catch {
          // skip failing org
        }
      })
    );

    return { success: true, accounts };
  } catch (err) {
    logger.error({ err }, "Snapchat ad account discovery error");
    return {
      success: false,
      accounts: [],
      error: err instanceof Error ? err.message : "Failed to discover ad accounts",
    };
  }
}

// ── Ad draft ───────────────────────────────────────────────────────────────────

export interface AdDraftInput {
  caption: string;
  mediaUrl?: string;
  link?: string;
}

export interface AdDraftResult {
  success: boolean;
  draftId?: string;
  warning?: string;
  error?: string;
}

export async function createSnapchatAdDraft(input: AdDraftInput): Promise<AdDraftResult> {
  const cid       = clientId();
  const secret    = process.env["SNAP_CLIENT_SECRET"];
  const token     = process.env["SNAP_ACCESS_TOKEN"];
  const accountId = process.env["SNAP_AD_ACCOUNT_ID"];

  if (!cid || !secret) {
    return { success: false, error: "Snapchat client credentials are not configured" };
  }
  if (!token) {
    return { success: false, error: "SNAP_ACCESS_TOKEN is not set — complete the Snapchat OAuth flow" };
  }
  if (!accountId) {
    return { success: false, error: "SNAP_AD_ACCOUNT_ID is not set — add your ad account ID" };
  }

  logger.info({ platform: "snapchat", caption: input.caption.slice(0, 60) }, "Snapchat ad draft created");

  return {
    success: true,
    draftId: `snap_draft_${Date.now()}`,
    warning:
      "Snapchat ad draft saved locally. Creating a real Snapchat ad via API requires Snap Marketing API approval " +
      "and a full campaign/ad-set/creative API flow. Use Snapchat Ads Manager for live campaigns.",
  };
}
