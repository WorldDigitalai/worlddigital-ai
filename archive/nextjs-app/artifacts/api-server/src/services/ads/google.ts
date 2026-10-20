/**
 * Google Ads service wrapper.
 * Provides OAuth config checks and draft campaign creation.
 * Does NOT automatically launch real paid ads — user confirmation required.
 */

import { resolveEnv } from "../../lib/secretResolver.js";

export interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  redirectUri: string;
  mccCustomerId: string;
  clientCustomerId: string;
  mccRefreshToken: string;
}

function getConfig(): GoogleAdsConfig | null {
  const clientId = resolveEnv("GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = resolveEnv("GOOGLE_CLIENT_SECRET", "GOOGLE_OAUTH_CLIENT_SECRET");
  const developerToken = resolveEnv("GOOGLE_DEVELOPER_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLEADS_DEVELOPER_TOKEN");
  const redirectUri = resolveEnv("GOOGLE_REDIRECT_URI");
  const mccCustomerId = resolveEnv("MCC_CUSTOMER_ID", "GOOGLE_MCC_CUSTOMER_ID", "GOOGLE_ADS_CUSTOMER_ID", "GOOGLEADS_CUSTOMER_ID");
  const clientCustomerId = resolveEnv("CLIENT_CUSTOMER_ID", "GOOGLE_ADS_CLIENT_CUSTOMER_ID");
  const mccRefreshToken = resolveEnv("MCC_REFRESH_TOKEN", "GOOGLE_MCC_REFRESH_TOKEN", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !developerToken || !mccRefreshToken) return null;
  return {
    clientId,
    clientSecret,
    developerToken,
    redirectUri: redirectUri || "",
    mccCustomerId: mccCustomerId || "",
    clientCustomerId: clientCustomerId || "",
    mccRefreshToken,
  };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        refresh_token: cfg.mccRefreshToken,
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

export async function checkGoogleAdsConnection(): Promise<{
  status: "reachable" | "failed" | "missing";
  message?: string;
}> {
  if (!isConfigured()) {
    return { status: "missing", message: "Google Ads credentials not configured" };
  }

  const token = await refreshAccessToken();
  if (!token) {
    return { status: "failed", message: "Could not refresh Google OAuth token" };
  }
  return { status: "reachable" };
}

export interface DraftGoogleCampaign {
  campaignName: string;
  budget: number;
  keywords: string[];
  adHeadlines: string[];
  adDescriptions: string[];
  finalUrl: string;
}

export async function createDraftCampaign(draft: DraftGoogleCampaign): Promise<{
  draftId: string;
  status: "draft";
  warning: string;
}> {
  if (!isConfigured()) throw new Error("Google Ads is not configured");

  const draftId = `draft_google_${Date.now()}`;
  return {
    draftId,
    status: "draft",
    warning: "This is a local draft only. Real ad launch requires explicit user confirmation.",
  };
}
