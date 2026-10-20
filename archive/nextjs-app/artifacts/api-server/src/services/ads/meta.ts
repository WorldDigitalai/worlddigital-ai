/**
 * Meta / Facebook Ads service — Phase 1 (full implementation).
 * Uses Meta Marketing API v19.0.
 * Provides: createMetaAdCampaign, createMetaAdSet, createMetaAdCreative, launchMetaAd.
 * Does NOT automatically spend money — caller must set status: "ACTIVE" to launch.
 *
 * Required ENV:
 *   FB_ACCESS_TOKEN    — page/user access token with ads_management permission
 *   FB_AD_ACCOUNT_ID   — format: act_XXXXXXXXXX
 *   FB_PAGE_ID         — Facebook page ID for creatives
 */

import { logger } from "../../lib/logger.js";
import { resolveEnv } from "../../lib/secretResolver.js";

const API_VERSION = resolveEnv("META_API_VERSION") || "v19.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

// ── Config ─────────────────────────────────────────────────────────────────────

export interface MetaConfig {
  accessToken: string;
  adAccountId: string;
  pageId: string;
  apiVersion: string;
  instagramActorId: string;
}

function getConfig(): MetaConfig | null {
  const accessToken = resolveEnv("FB_ACCESS_TOKEN", "META_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN", "FB_PAGE_ACCESS_TOKEN");
  const adAccountId = resolveEnv("FB_AD_ACCOUNT_ID", "META_AD_ACCOUNT_ID", "FACEBOOK_AD_ACCOUNT_ID");
  const pageId = resolveEnv("FB_PAGE_ID", "FACEBOOK_PAGE_ID", "META_PAGE_ID");
  const apiVersion = resolveEnv("META_API_VERSION") || "v19.0";
  const instagramActorId = resolveEnv("INSTAGRAM_ACTOR_ID", "INSTAGRAM_BUSINESS_ACCOUNT_ID") || "";
  if (!accessToken || !adAccountId || !pageId) return null;
  return { accessToken, adAccountId, pageId, apiVersion, instagramActorId };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────

async function metaPost<T = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Meta Ads not configured — FB_ACCESS_TOKEN, FB_AD_ACCOUNT_ID, FB_PAGE_ID required");

  const url = `${BASE}/${path}`;
  const payload = { ...body, access_token: cfg.accessToken };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await resp.json()) as T & { error?: { message: string; code: number } };
  const asErr = data as { error?: { message: string; code: number } };
  if (asErr.error) {
    throw new Error(`Meta API error ${asErr.error.code}: ${asErr.error.message}`);
  }
  return data;
}

// ── Connection check ───────────────────────────────────────────────────────────

export async function checkMetaConnection(): Promise<{
  status: "reachable" | "failed" | "missing";
  message?: string;
}> {
  if (!isConfigured()) return { status: "missing", message: "Meta Ads credentials not configured" };
  try {
    const cfg = getConfig()!;
    const url = `${BASE}/me?access_token=${cfg.accessToken}&fields=id,name`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (resp.ok) return { status: "reachable" };
    return { status: "failed", message: `Token check returned ${resp.status}` };
  } catch {
    return { status: "failed", message: "Network error reaching Meta API" };
  }
}

// ── Draft fallback ─────────────────────────────────────────────────────────────

export interface DraftAdSet {
  campaignName: string;
  objective: string;
  dailyBudgetCents: number;
  targeting: {
    ageMin?: number;
    ageMax?: number;
    geoLocations?: { countries: string[] };
  };
  adDescription: string;
  adImageUrl?: string;
}

export async function createDraftCampaign(draft: DraftAdSet): Promise<{
  draftId: string;
  status: "draft";
  warning: string;
}> {
  if (!isConfigured()) throw new Error("Meta Ads is not configured");
  const draftId = `draft_meta_${Date.now()}`;
  return {
    draftId,
    status: "draft",
    warning: "This is a local draft only. Real ad launch requires explicit user confirmation.",
  };
}

// ── Campaign ───────────────────────────────────────────────────────────────────

export interface CreateCampaignInput {
  name: string;
  objective: string;
  status: "ACTIVE" | "PAUSED";
  specialAdCategories?: string[];
}

export async function createMetaAdCampaign(input: CreateCampaignInput): Promise<{ id: string }> {
  const cfg = getConfig()!;
  const accountId = cfg.adAccountId.startsWith("act_") ? cfg.adAccountId : `act_${cfg.adAccountId}`;

  logger.info({ name: input.name, objective: input.objective }, "Creating Meta ad campaign");

  const result = await metaPost<{ id: string }>(`${accountId}/campaigns`, {
    name: input.name,
    objective: input.objective,
    status: input.status,
    special_ad_categories: input.specialAdCategories ?? [],
  });

  logger.info({ campaignId: result.id }, "Meta ad campaign created");
  return { id: result.id };
}

// ── Ad Set ─────────────────────────────────────────────────────────────────────

export interface CreateAdSetInput {
  campaignId: string;
  name: string;
  dailyBudgetCents: number;
  durationDays: number;
  targeting: {
    ageMin: number;
    ageMax: number;
    gender: "all" | "male" | "female";
    location: string;
    radiusMiles: number;
  };
}

function genderToMeta(g: "all" | "male" | "female"): number[] {
  if (g === "male") return [1];
  if (g === "female") return [2];
  return []; // empty = all genders in Meta API
}

export async function createMetaAdSet(input: CreateAdSetInput): Promise<{ id: string }> {
  const cfg = getConfig()!;
  const accountId = cfg.adAccountId.startsWith("act_") ? cfg.adAccountId : `act_${cfg.adAccountId}`;

  const now = Math.floor(Date.now() / 1000);
  const endTime = now + input.durationDays * 86400;

  // Geo targeting: default to US since we don't have geocoding for radius
  // Radius targeting requires lat/lng — stored in adSettings for display only
  const targeting: Record<string, unknown> = {
    age_min: input.targeting.ageMin,
    age_max: input.targeting.ageMax,
    geo_locations: { countries: ["US"] },
  };

  const genders = genderToMeta(input.targeting.gender);
  if (genders.length > 0) targeting["genders"] = genders;

  logger.info({ name: input.name, dailyBudgetCents: input.dailyBudgetCents }, "Creating Meta ad set");

  const result = await metaPost<{ id: string }>(`${accountId}/adsets`, {
    name: input.name,
    campaign_id: input.campaignId,
    daily_budget: String(input.dailyBudgetCents),
    billing_event: "IMPRESSIONS",
    optimization_goal: "REACH",
    targeting,
    start_time: String(now),
    end_time: String(endTime),
    status: "PAUSED",
  });

  logger.info({ adSetId: result.id }, "Meta ad set created");
  return { id: result.id };
}

// ── Ad Creative ────────────────────────────────────────────────────────────────

export interface CreateAdCreativeInput {
  name: string;
  caption: string;
  imageUrl?: string;
  destinationUrl: string;
}

export async function createMetaAdCreative(input: CreateAdCreativeInput): Promise<{ id: string }> {
  const cfg = getConfig()!;
  const accountId = cfg.adAccountId.startsWith("act_") ? cfg.adAccountId : `act_${cfg.adAccountId}`;

  const linkData: Record<string, unknown> = {
    message: input.caption,
    link: input.destinationUrl,
    name: input.name,
  };
  if (input.imageUrl) linkData["picture"] = input.imageUrl;

  logger.info({ name: input.name }, "Creating Meta ad creative");

  const result = await metaPost<{ id: string }>(`${accountId}/adcreatives`, {
    name: input.name,
    object_story_spec: {
      page_id: cfg.pageId,
      link_data: linkData,
    },
  });

  logger.info({ creativeId: result.id }, "Meta ad creative created");
  return { id: result.id };
}

// ── Ad (launch) ────────────────────────────────────────────────────────────────

export interface LaunchAdInput {
  name: string;
  campaignId: string;
  adSetId: string;
  creativeId: string;
  status: "ACTIVE" | "PAUSED";
}

export async function launchMetaAd(input: LaunchAdInput): Promise<{ id: string }> {
  const cfg = getConfig()!;
  const accountId = cfg.adAccountId.startsWith("act_") ? cfg.adAccountId : `act_${cfg.adAccountId}`;

  logger.info({ name: input.name, status: input.status }, "Creating Meta ad");

  const result = await metaPost<{ id: string }>(`${accountId}/ads`, {
    name: input.name,
    campaign_id: input.campaignId,
    adset_id: input.adSetId,
    creative: { creative_id: input.creativeId },
    status: input.status,
  });

  logger.info({ adId: result.id, status: input.status }, "Meta ad created");
  return { id: result.id };
}
