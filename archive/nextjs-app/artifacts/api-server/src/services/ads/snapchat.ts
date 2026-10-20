/**
 * Snapchat Ads service wrapper.
 * Provides OAuth config checks and draft campaign creation.
 * Does NOT automatically launch real paid ads — user confirmation required.
 */

import { resolveEnv } from "../../lib/secretResolver.js";
import { snapFetch } from "../../lib/snapTokenManager.js";

export interface SnapchatConfig {
  adAccountId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken: string;
  refreshToken: string;
}

function getConfig(): SnapchatConfig | null {
  const adAccountId = resolveEnv("SNAP_AD_ACCOUNT_ID", "SNAPCHAT_AD_ACCOUNT_ID");
  const clientId = resolveEnv("SNAP_CLIENT_ID", "SNAPCHAT_CLIENT_ID");
  const clientSecret = resolveEnv("SNAP_CLIENT_SECRET", "SNAPCHAT_CLIENT_SECRET");
  const redirectUri = resolveEnv("SNAP_REDIRECT_URI", "SNAPCHAT_REDIRECT_URI");
  const accessToken = resolveEnv("SNAP_ACCESS_TOKEN", "SNAPCHAT_ACCESS_TOKEN");
  const refreshToken = resolveEnv("SNAP_REFRESH_TOKEN", "SNAPCHAT_REFRESH_TOKEN");

  if (!adAccountId || !clientId || !clientSecret || !accessToken) return null;
  return { adAccountId, clientId, clientSecret, redirectUri: redirectUri || "", accessToken, refreshToken: refreshToken || "" };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

export async function refreshSnapAccessToken(): Promise<string | null> {
  const cfg = getConfig();
  if (!cfg || !cfg.refreshToken) return null;

  try {
    const resp = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        refresh_token: cfg.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function checkSnapchatConnection(): Promise<{
  status: "reachable" | "failed" | "missing";
  message?: string;
}> {
  if (!isConfigured()) {
    return { status: "missing", message: "Snapchat Ads credentials not configured" };
  }

  const cfg = getConfig()!;
  try {
    const resp = await snapFetch("https://adsapi.snapchat.com/v1/me", {
      headers: { Authorization: `Bearer ${cfg.accessToken}` },
    });
    if (resp.ok) return { status: "reachable" };
    if (resp.status === 401) return { status: "failed", message: "Snapchat access token is invalid or expired" };
    return { status: "failed", message: `Snapchat API returned ${resp.status}` };
  } catch {
    return { status: "failed", message: "Network error reaching Snapchat API" };
  }
}

export interface DraftSnapchatCampaign {
  campaignName: string;
  dailyBudgetMicro: number;
  adDescription: string;
  adImageUrl?: string;
}

export async function createDraftCampaign(draft: DraftSnapchatCampaign): Promise<{
  draftId: string;
  status: "draft";
  warning: string;
}> {
  if (!isConfigured()) throw new Error("Snapchat Ads is not configured");

  const draftId = `draft_snap_${Date.now()}`;
  return {
    draftId,
    status: "draft",
    warning: "This is a local draft only. Real ad launch requires explicit user confirmation.",
  };
}
