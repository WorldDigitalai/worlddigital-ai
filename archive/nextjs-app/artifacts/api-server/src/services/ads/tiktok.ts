/**
 * TikTok Marketing API — Sandbox integration.
 *
 * Uses env vars:
 *   TIKTOK_ACCESS_TOKEN   — sandbox access token (long-lived)
 *   TIKTOK_ADVERTISER_ID  — sandbox advertiser account ID
 *   TIKTOK_BASE_URL       — e.g. "https://sandbox-ads.tiktok.com/open_api"
 *
 * When credentials are present, this makes real Sandbox API calls.
 * When missing, returns a graceful pending response (no crash).
 */

import { logger } from "../../lib/logger.js";

// ── Credential helpers ────────────────────────────────────────────────────────

function getAccessToken(): string {
  return process.env["TIKTOK_ACCESS_TOKEN"] ?? "";
}

function getAdvertiserId(): string {
  return process.env["TIKTOK_ADVERTISER_ID"] ?? "";
}

function getBaseUrl(): string {
  const raw = process.env["TIKTOK_BASE_URL"] ?? "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function isConfigured(): boolean {
  return !!(getAccessToken() && getAdvertiserId() && getBaseUrl());
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TikTokAdInput {
  name: string;
  caption: string;
  imageUrl?: string;
  destinationUrl?: string;
  budget?: number;
  durationDays?: number;
}

export interface TikTokAdResult {
  status: "running" | "draft" | "failed";
  campaignId?: string;
  adGroupId?: string;
  adId?: string;
  message: string;
  error?: string;
  sandboxMode?: boolean;
}

// ── API helper ────────────────────────────────────────────────────────────────

interface TikTokApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  request_id?: string;
}

async function tiktokPost<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<TikTokApiResponse<T>> {
  const baseUrl = getBaseUrl();
  const accessToken = getAccessToken();

  const url = `${baseUrl}/v1.3/${endpoint}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": accessToken,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

  const json = (await resp.json()) as TikTokApiResponse<T>;

  if (!resp.ok || json.code !== 0) {
    throw new Error(
      `TikTok API error [${json.code}]: ${json.message} (url=${url})`
    );
  }

  return json;
}

// ── Campaign creation ─────────────────────────────────────────────────────────

interface CampaignCreateData {
  campaign_id: string;
}

interface AdGroupCreateData {
  adgroup_id: string;
}

interface AdCreateData {
  ad_id: string;
}

export async function createTikTokAd(input: TikTokAdInput): Promise<TikTokAdResult> {
  if (!isConfigured()) {
    logger.warn("TikTok not configured — TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID, or TIKTOK_BASE_URL missing");
    return {
      status: "draft",
      message:
        "TikTok Ads credentials not fully configured. Add TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID, and TIKTOK_BASE_URL to Replit Secrets.",
    };
  }

  const advertiserId = getAdvertiserId();
  const dailyBudget = Math.max(20, input.budget ?? 50);

  try {
    // ── Step 1: Create campaign ─────────────────────────────────────────────
    logger.info({ advertiserId, name: input.name }, "TikTok: creating campaign");

    const campaignResp = await tiktokPost<CampaignCreateData>("campaign/create/", {
      advertiser_id: advertiserId,
      campaign_name: input.name || "WorldDigital.ai Campaign",
      objective_type: "TRAFFIC",
      budget_mode: "BUDGET_MODE_DAY",
      budget: dailyBudget,
      special_industries: [],
    });

    const campaignId = campaignResp.data!.campaign_id;
    logger.info({ campaignId }, "TikTok: campaign created");

    // ── Step 2: Create ad group ─────────────────────────────────────────────
    const now = new Date();
    const scheduleStart = Math.floor(now.getTime() / 1000);
    const scheduleEnd = scheduleStart + (input.durationDays ?? 7) * 86400;

    const adGroupResp = await tiktokPost<AdGroupCreateData>("adgroup/create/", {
      advertiser_id: advertiserId,
      campaign_id: campaignId,
      adgroup_name: `${input.name} — Ad Group`,
      placement_type: "PLACEMENT_TYPE_AUTOMATIC",
      budget_mode: "BUDGET_MODE_DAY",
      budget: dailyBudget,
      schedule_type: "SCHEDULE_START_END",
      schedule_start_time: new Date(scheduleStart * 1000).toISOString().replace("T", " ").slice(0, 19),
      schedule_end_time: new Date(scheduleEnd * 1000).toISOString().replace("T", " ").slice(0, 19),
      optimization_goal: "CLICK",
      billing_event: "CPC",
      bid_type: "BID_TYPE_NO_BID",
      audience_type: "CUSTOM_AUDIENCE",
      location_ids: ["6252001"],
      age_groups: ["AGE_25_34", "AGE_35_44"],
      gender: "GENDER_UNLIMITED",
      languages: ["en"],
      operation_status: "ENABLE",
    });

    const adGroupId = adGroupResp.data!.adgroup_id;
    logger.info({ adGroupId }, "TikTok: ad group created");

    // ── Step 3: Create ad ───────────────────────────────────────────────────
    const adBody: Record<string, unknown> = {
      advertiser_id: advertiserId,
      adgroup_id: adGroupId,
      creatives: [
        {
          ad_name: `${input.name} — Ad`,
          ad_text: input.caption || "Discover what we have to offer",
          call_to_action: "LEARN_MORE",
          landing_page_url: input.destinationUrl || "https://worlddigital.ai",
          ...(input.imageUrl ? { image_ids: [] } : {}),
        },
      ],
    };

    const adResp = await tiktokPost<AdCreateData>("ad/create/", adBody);
    const adId = adResp.data!.ad_id;

    logger.info({ campaignId, adGroupId, adId }, "TikTok sandbox ad created successfully");

    return {
      status: "running",
      campaignId,
      adGroupId,
      adId,
      message: `TikTok sandbox campaign created — Campaign ID: ${campaignId}`,
      sandboxMode: true,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error({ err, advertiserId }, "TikTok ad creation failed");
    return {
      status: "failed",
      error: errMsg,
      message: `TikTok ad creation failed: ${errMsg}`,
    };
  }
}
