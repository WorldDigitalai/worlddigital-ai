/**
 * Unified Ad Manager — Phase 1
 * Orchestrates ad creation across Meta, TikTok, and Snapchat.
 * Respects ADS_DRY_RUN=true env var — no real spend is initiated in dry-run mode.
 */

import { logger } from "../../lib/logger.js";
import {
  createMetaAdCampaign,
  createMetaAdSet,
  createMetaAdCreative,
  launchMetaAd,
  isConfigured as metaConfigured,
} from "./meta.js";
import { createTikTokAd, isConfigured as tiktokConfigured } from "./tiktok.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdGender = "all" | "male" | "female";
export type AdTargetingMode = "broad";
export type AdStatus = "draft" | "ready" | "running" | "failed";

export interface AdSettings {
  ageMin: number;
  ageMax: number;
  gender: AdGender;
  location: string;
  radiusMiles: number;
  targetingMode: AdTargetingMode;
  budget: number;
  durationDays: number;
  platforms: string[];
}

export interface AdCampaignInput {
  campaignName: string;
  caption: string;
  imageUrl?: string;
  destinationUrl: string;
  adSettings: AdSettings;
}

export interface PlatformAdResult {
  platform: string;
  status: AdStatus;
  campaignId?: string;
  adSetId?: string;
  adCreativeId?: string;
  adId?: string;
  dryRun?: boolean;
  message?: string;
  error?: string;
}

export interface AdLaunchResult {
  overallStatus: AdStatus;
  dryRun: boolean;
  results: PlatformAdResult[];
  summary: { total: number; launched: number; failed: number };
}

// ── Dry-run helper ────────────────────────────────────────────────────────────

export function isAdsDryRun(): boolean {
  return process.env["ADS_DRY_RUN"] === "true";
}

function dryRunResult(platform: string): PlatformAdResult {
  return {
    platform,
    status: "running",
    dryRun: true,
    campaignId: `dry_${platform}_campaign_${Date.now()}`,
    adSetId: `dry_${platform}_adset_${Date.now()}`,
    adCreativeId: `dry_${platform}_creative_${Date.now()}`,
    adId: `dry_${platform}_ad_${Date.now()}`,
    message: `[DRY RUN] Simulated ${platform} ad — no real spend initiated (ADS_DRY_RUN=true)`,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function createAdCampaign(input: AdCampaignInput): Promise<PlatformAdResult[]> {
  return launchAdCampaign(input);
}

export async function createAdSet(input: AdCampaignInput): Promise<PlatformAdResult[]> {
  return launchAdCampaign(input);
}

export async function createAdCreative(input: AdCampaignInput): Promise<PlatformAdResult[]> {
  return launchAdCampaign(input);
}

export async function launchAdCampaign(input: AdCampaignInput): Promise<PlatformAdResult[]> {
  const dryRun = isAdsDryRun();
  const { adSettings } = input;
  const results: PlatformAdResult[] = [];

  logger.info(
    { platforms: adSettings.platforms, dryRun, campaign: input.campaignName },
    dryRun ? "Ad launch — DRY RUN" : "Ad launch — LIVE"
  );

  await Promise.all(
    adSettings.platforms.map(async (platform) => {
      const p = platform.toLowerCase();

      if (dryRun) {
        results.push(dryRunResult(p));
        return;
      }

      try {
        switch (p) {
          case "meta":
          case "facebook":
          case "instagram": {
            if (!metaConfigured()) {
              results.push({ platform: p, status: "failed", error: "Meta Ads not configured — FB_ACCESS_TOKEN or FB_AD_ACCOUNT_ID missing" });
              return;
            }

            const campaign = await createMetaAdCampaign({
              name: input.campaignName,
              objective: "OUTCOME_TRAFFIC",
              status: "PAUSED",
            });

            const adSet = await createMetaAdSet({
              campaignId: campaign.id,
              name: `${input.campaignName} — Ad Set`,
              dailyBudgetCents: Math.round(input.adSettings.budget * 100),
              durationDays: input.adSettings.durationDays,
              targeting: {
                ageMin: input.adSettings.ageMin,
                ageMax: input.adSettings.ageMax,
                gender: input.adSettings.gender,
                location: input.adSettings.location,
                radiusMiles: input.adSettings.radiusMiles,
              },
            });

            const creative = await createMetaAdCreative({
              name: `${input.campaignName} — Creative`,
              caption: input.caption,
              imageUrl: input.imageUrl,
              destinationUrl: input.destinationUrl,
            });

            const ad = await launchMetaAd({
              name: `${input.campaignName} — Ad`,
              campaignId: campaign.id,
              adSetId: adSet.id,
              creativeId: creative.id,
              status: "ACTIVE",
            });

            results.push({
              platform: "meta",
              status: "running",
              campaignId: campaign.id,
              adSetId: adSet.id,
              adCreativeId: creative.id,
              adId: ad.id,
              message: "Meta ad launched successfully",
            });
            break;
          }

          case "tiktok": {
            if (!tiktokConfigured()) {
              results.push({
                platform: "tiktok",
                status: "failed",
                error: "TikTok Ads not configured — TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID, and TIKTOK_BASE_URL must be set in Replit Secrets",
              });
              return;
            }
            const r = await createTikTokAd({
              name: input.campaignName,
              caption: input.caption,
              imageUrl: input.imageUrl,
              destinationUrl: input.destinationUrl,
              budget: input.adSettings.budget,
              durationDays: input.adSettings.durationDays,
            });
            results.push({
              platform: "tiktok",
              status: r.status,
              campaignId: r.campaignId,
              adId: r.adId,
              message: r.message,
              error: r.error,
            });
            break;
          }

          case "snapchat": {
            results.push({
              platform: "snapchat",
              status: "draft",
              message: "Snapchat Ads: pending API approval. SNAP_AD_ACCOUNT_ID must be set and Snapchat Ads account must be active.",
            });
            break;
          }

          default:
            results.push({ platform: p, status: "failed", error: `Platform "${p}" is not supported for paid ads` });
        }
      } catch (err) {
        logger.error({ err, platform: p }, "Ad platform launch error");
        results.push({
          platform: p,
          status: "failed",
          error: err instanceof Error ? err.message : "Unexpected error launching ad",
        });
      }
    })
  );

  return results;
}
