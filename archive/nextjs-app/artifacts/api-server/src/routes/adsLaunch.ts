/**
 * POST /api/ads/launch
 * Launches a paid ad campaign across selected platforms.
 * Requires auth. Respects ADS_DRY_RUN=true env var.
 *
 * Body: {
 *   campaignName: string
 *   caption: string
 *   imageUrl?: string
 *   destinationUrl: string
 *   adSettings: {
 *     ageMin: number          // default 18
 *     ageMax: number          // default 65
 *     gender: "all"|"male"|"female"
 *     location: string        // from business profile
 *     radiusMiles: number     // default 5
 *     targetingMode: "broad"
 *     budget: number          // daily budget in USD
 *     durationDays: number
 *     platforms: string[]     // ["meta","tiktok","snapchat"]
 *   }
 * }
 */

import { Router } from "express";
import type { Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";
import { getCollection } from "../lib/mongo.js";
import { launchAdCampaign, isAdsDryRun, type AdSettings, type PlatformAdResult } from "../services/ads/adManager.js";

const router = Router();

interface BusinessProfileDoc {
  userId: string;
  businessName?: string;
  location?: string;
  destinationUrl?: string;
  websiteUrl?: string;
}

interface AdsLaunchBody {
  campaignName?: string;
  caption: string;
  imageUrl?: string;
  destinationUrl?: string;
  adSettings: Partial<AdSettings>;
}

router.post("/ads/launch", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body = req.body as AdsLaunchBody;

    if (!body.caption?.trim()) {
      return res.status(400).json({ success: false, error: "caption is required" });
    }

    const adSettings = body.adSettings ?? {};
    const platforms = adSettings.platforms ?? [];
    if (!platforms.length) {
      return res.status(400).json({ success: false, error: "adSettings.platforms must contain at least one platform" });
    }

    const budget = adSettings.budget ?? 0;
    if (!isAdsDryRun()) {
      const hasLinkedIn = platforms.some((p: string) => p.toLowerCase() === "linkedin");
      const minBudget = hasLinkedIn ? 30 : 10;
      if (budget < minBudget) {
        return res.status(400).json({
          success: false,
          error: hasLinkedIn
            ? "LinkedIn requires a minimum daily budget of $30/day"
            : "Minimum daily budget is $10/day",
        });
      }
    }

    // Auto-fill location and destination from business profile if not provided
    let location = adSettings.location ?? "";
    let destinationUrl = body.destinationUrl ?? "";
    let campaignName = body.campaignName ?? "";

    try {
      const profiles = getCollection<BusinessProfileDoc>("businessProfiles");
      const profile = await profiles.findOne({ userId });
      if (profile) {
        if (!location && profile.location) location = profile.location;
        if (!destinationUrl) destinationUrl = profile.destinationUrl ?? profile.websiteUrl ?? "";
        if (!campaignName && profile.businessName) {
          campaignName = `${profile.businessName} — Ad Campaign`;
        }
      }
    } catch (e) {
      logger.warn({ e }, "Could not fetch business profile for ads launch");
    }

    if (!destinationUrl) {
      return res.status(400).json({ success: false, error: "destinationUrl is required (or set it in your Business Profile)" });
    }

    const normalizedSettings: AdSettings = {
      ageMin: adSettings.ageMin ?? 18,
      ageMax: adSettings.ageMax ?? 65,
      gender: adSettings.gender ?? "all",
      location: location || "United States",
      radiusMiles: adSettings.radiusMiles ?? 5,
      targetingMode: adSettings.targetingMode ?? "broad",
      budget,
      durationDays: adSettings.durationDays ?? 7,
      platforms,
    };

    logger.info({ userId, platforms, dryRun: isAdsDryRun(), budget }, "Ads launch requested");

    const results = await launchAdCampaign({
      campaignName: campaignName || "WorldDigital.ai Corporation LLC Ad Campaign",
      caption: body.caption,
      imageUrl: body.imageUrl,
      destinationUrl,
      adSettings: normalizedSettings,
    });

    const launched = results.filter((r) => r.status === "running").length;
    const failed = results.filter((r) => r.status === "failed").length;

    // Persist campaign record for user history
    const campaignsCol = getCollection<{
      userId: string;
      campaignName: string;
      caption: string;
      imageUrl?: string;
      destinationUrl: string;
      adSettings: AdSettings;
      results: PlatformAdResult[];
      summary: { total: number; launched: number; failed: number };
      dryRun: boolean;
      createdAt: Date;
    }>("adCampaigns");
    await campaignsCol.insertOne({
      userId,
      campaignName: campaignName || "WorldDigital.ai Corporation LLC Ad Campaign",
      caption: body.caption,
      imageUrl: body.imageUrl,
      destinationUrl,
      adSettings: normalizedSettings,
      results,
      summary: { total: results.length, launched, failed },
      dryRun: isAdsDryRun(),
      createdAt: new Date(),
    });

    return res.json({
      success: launched > 0 || isAdsDryRun(),
      dry_run: isAdsDryRun(),
      summary: { total: results.length, launched, failed },
      adSettings: normalizedSettings,
      results,
    });
  } catch (err) {
    logger.error({ err }, "POST /ads/launch error");
    return res.status(500).json({ success: false, error: "Ad launch failed" });
  }
});

router.get("/v1/dashboard/campaigns", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const campaignsCol = getCollection<{
      userId: string;
      campaignName: string;
      caption: string;
      imageUrl?: string;
      destinationUrl: string;
      adSettings: AdSettings;
      results: PlatformAdResult[];
      summary: { total: number; launched: number; failed: number };
      dryRun: boolean;
      createdAt: Date;
    }>("adCampaigns");
    const campaigns = await campaignsCol.find({ userId }).sort({ createdAt: -1 }).limit(50).toArray();
    res.json({ campaigns });
  } catch (err) {
    logger.error({ err }, "Campaigns fetch failed");
    res.status(500).json({ message: "Failed to load campaigns" });
  }
});

router.get("/ads/debug", async (_req, res: Response) => {
  const { isConfigured: metaIsConfigured, checkMetaConnection } = await import("../services/ads/meta.js");
  const { isConfigured: snapIsConfigured } = await import("../services/ads/snapchat.js");

  const metaConnection = metaIsConfigured() ? await checkMetaConnection() : { status: "missing" };

  return res.json({
    dry_run_mode: isAdsDryRun(),
    platforms: {
      meta: {
        configured: metaIsConfigured(),
        connection: metaConnection,
        required_vars: ["FB_ACCESS_TOKEN", "FB_AD_ACCOUNT_ID", "FB_PAGE_ID"],
        missing_vars: ["FB_ACCESS_TOKEN", "FB_AD_ACCOUNT_ID", "FB_PAGE_ID"].filter(
          (v) => !process.env[v]
        ),
      },
      tiktok: {
        configured: false,
        status: "pending_approval",
        required_vars: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID"],
        missing_vars: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID"].filter(
          (v) => !process.env[v]
        ),
      },
      snapchat: {
        configured: snapIsConfigured(),
        required_vars: ["SNAP_AD_ACCOUNT_ID", "SNAP_ACCESS_TOKEN"],
        missing_vars: ["SNAP_AD_ACCOUNT_ID", "SNAP_ACCESS_TOKEN"].filter(
          (v) => !process.env[v]
        ),
      },
    },
  });
});

export default router;
