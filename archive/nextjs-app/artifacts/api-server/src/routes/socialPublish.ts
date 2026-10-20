/**
 * POST /api/social/publish
 * Unified social publishing endpoint.
 * Supports dry-run mode via SOCIAL_DRY_RUN=true env var or dryRun: true in request body.
 */

import { Router } from "express";
import type { Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import { publishToFacebook, publishToInstagram } from "../services/social/meta.js";
import { publishToYouTubeShorts } from "../services/social/youtube.js";
import { publishToLinkedIn } from "../services/social/linkedin.js";
import { publishToX } from "../services/social/x.js";
import { createSnapchatAdDraft } from "../services/social/snapchat.js";
import { resolveEnv } from "../lib/secretResolver.js";

const router = Router();

interface BusinessProfileDoc {
  userId: string;
  businessName: string;
  websiteUrl?: string;
  destinationUrl?: string;
}

interface PlatformResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  dryRun?: boolean;
  preview?: string;
}

type PublishRequest = {
  platforms: string[];
  caption: string;
  mediaUrl?: string;
  videoUrl?: string;
  link?: string;
  dryRun?: boolean;
};

function notConfigured(platform: string): PlatformResult {
  return { success: false, error: `${platform} integration is not fully configured. Check /api/social/debug for details.` };
}

function dryRunResult(platform: string, caption: string, link: string): PlatformResult {
  return {
    success: true,
    dryRun: true,
    preview: `[DRY RUN] Would post to ${platform}: "${caption.slice(0, 80)}..." → ${link}`,
  };
}

router.post("/social/publish", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      platforms = [],
      caption = "",
      mediaUrl,
      videoUrl,
      link,
      dryRun: bodyDryRun,
    } = req.body as PublishRequest;

    if (!platforms.length) {
      return res.status(400).json({ success: false, error: "At least one platform is required" });
    }
    if (!caption.trim()) {
      return res.status(400).json({ success: false, error: "Caption is required" });
    }

    // Dry-run mode: env var or request body flag
    const isDryRun = process.env["SOCIAL_DRY_RUN"] === "true" || bodyDryRun === true;

    // Resolve CTA link — prefer explicit link, then customer business URL, then provided mediaUrl
    let ctaLink = link ?? "";
    if (!ctaLink) {
      try {
        const profiles = getCollection<BusinessProfileDoc>("businessProfiles");
        const profile = await profiles.findOne({ userId });
        ctaLink = profile?.destinationUrl ?? profile?.websiteUrl ?? "";
      } catch {
        // Non-fatal — proceed without business URL
      }
    }

    // Fetch per-user platform tokens
    let userTokens: Record<string, { accessToken?: string; refreshToken?: string; metadata?: Record<string, unknown> }> = {};
    try {
      const tokenCol = getCollection<{
        platform: string;
        accessToken?: string;
        refreshToken?: string;
        metadata?: Record<string, unknown>;
      }>("userPlatformTokens");
      const tokens = await tokenCol.find({ userId, connected: true }).toArray();
      for (const t of tokens) {
        userTokens[t.platform] = { accessToken: t.accessToken, refreshToken: t.refreshToken, metadata: t.metadata };
      }
    } catch {
      // Non-fatal — fall back to env vars for all platforms
    }

    logger.info(
      { userId, platforms, isDryRun, userTokens: Object.keys(userTokens) },
      isDryRun ? "Social publish — DRY RUN" : "Social publish — LIVE"
    );

    const postInput = { caption, mediaUrl, link: ctaLink };
    const results: Record<string, PlatformResult> = {};

    // Publish to each platform in parallel
    await Promise.all(
      platforms.map(async (platform) => {
        const p = platform.toLowerCase();

        if (isDryRun) {
          results[p] = dryRunResult(p, caption, ctaLink);
          return;
        }

        try {
          switch (p) {
            case "facebook": {
              const t = userTokens.meta?.accessToken;
              const r = await publishToFacebook(postInput, t ? { accessToken: t } : undefined);
              results[p] = { success: r.success, postId: r.postId, postUrl: r.postUrl, error: r.error };
              break;
            }
            case "instagram": {
              const t = userTokens.meta?.accessToken;
              const igId = userTokens.meta?.metadata?.igId as string | undefined;
              const r = await publishToInstagram(postInput, t ? { accessToken: t, igId } : undefined);
              results[p] = { success: r.success, postId: r.postId, postUrl: r.postUrl, error: r.error };
              break;
            }
            case "x":
            case "twitter": {
              const r = await publishToX(postInput);
              results[p] = { success: r.success, postId: r.tweetId, postUrl: r.tweetUrl, error: r.error };
              break;
            }
            case "linkedin": {
              const t = userTokens.linkedin?.accessToken;
              const orgId = userTokens.linkedin?.metadata?.orgId as string | undefined;
              const r = await publishToLinkedIn(postInput, t ? { accessToken: t, orgId } : undefined);
              results[p] = { success: r.success, postId: r.postId, postUrl: r.postUrl, error: r.error };
              break;
            }
            case "youtube":
            case "youtube_shorts": {
              if (!videoUrl) {
                results[p] = { success: false, error: "YouTube Shorts requires a videoUrl" };
              } else {
                const t = userTokens.youtube?.accessToken;
                const rt = userTokens.youtube?.refreshToken;
                const r = await publishToYouTubeShorts(
                  { title: caption.slice(0, 100), description: caption, videoUrl },
                  t ? { refreshToken: rt || t } : undefined
                );
                results[p] = { success: r.success, postId: r.videoId, postUrl: r.videoUrl, error: r.error };
              }
              break;
            }
            case "tiktok": {
              results[p] = {
                success: false,
                error: "TikTok organic posting requires Content Posting API approval from TikTok. Site verification is active.",
              };
              break;
            }
            case "snapchat": {
              const r = await createSnapchatAdDraft({ caption, mediaUrl, link: ctaLink });
              results[p] = { success: r.success, postId: r.draftId, error: r.error };
              if (r.warning) results[p]!.error = r.warning;
              break;
            }
            default:
              results[p] = notConfigured(p);
          }
        } catch (err) {
          logger.error({ err, platform: p }, "Platform publish error");
          results[p] = { success: false, error: err instanceof Error ? err.message : "Unexpected publish error" };
        }
      })
    );

    const succeeded = Object.values(results).filter((r) => r.success).length;
    const failed = Object.values(results).filter((r) => !r.success).length;

    logger.info({ userId, succeeded, failed, isDryRun }, "Social publish complete");

    return res.json({
      success: succeeded > 0,
      dry_run: isDryRun,
      publishing_as: Object.keys(userTokens).length > 0 ? "Your connected accounts" : "WorldDigital.ai (default)",
      cta_link: ctaLink,
      summary: { total: platforms.length, succeeded, failed },
      results,
    });
  } catch (err) {
    logger.error({ err }, "POST /social/publish error");
    return res.status(500).json({ success: false, error: "Publish request failed" });
  }
});

export default router;
