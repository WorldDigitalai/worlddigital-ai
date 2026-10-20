/**
 * Legacy social publisher dispatcher.
 * Used by dashboard publish routes.
 * Prefer /api/social/publish for new integrations.
 */

import { logger } from "./logger.js";

export interface PublishPostInput {
  caption: string;
  mediaUrls?: string[];
  destinationUrl: string;
  platform: string;
  scheduledFor?: Date;
  customerBusinessName: string;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  postId?: string;
  postUrl?: string;
  error?: string;
  dryRun?: boolean;
}

const isDryRun = () => process.env["SOCIAL_DRY_RUN"] === "true";

function notConfigured(platform: string): PublishResult {
  return { success: false, platform, error: `${platform} API credentials not configured` };
}

function dryRunResult(platform: string, input: PublishPostInput): PublishResult {
  return {
    success: true,
    platform,
    dryRun: true,
    postId: `dry_run_${platform}_${Date.now()}`,
    postUrl: undefined,
    error: undefined,
  };
}

// ── Meta (Facebook + Instagram) ──────────────────────────────────────────────

export async function publishToMeta(input: PublishPostInput): Promise<PublishResult> {
  if (isDryRun()) return dryRunResult("meta", input);

  // Support both META_ACCESS_TOKEN (new organic) and META_PAGE_ACCESS_TOKEN (legacy)
  const token = process.env["META_ACCESS_TOKEN"] ?? process.env["META_PAGE_ACCESS_TOKEN"];
  const pageId = process.env["FB_PAGE_ID"] ?? process.env["META_PAGE_ID"];
  if (!token || !pageId) return notConfigured("meta");

  try {
    const resp = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `${input.caption}\n\n🔗 ${input.destinationUrl}`,
        access_token: token,
      }),
    });
    const data = (await resp.json()) as { id?: string; error?: { message: string } };
    if (data.id) {
      return { success: true, platform: "meta", postId: data.id, postUrl: `https://facebook.com/${data.id}` };
    }
    return { success: false, platform: "meta", error: data.error?.message || "Unknown Meta error" };
  } catch (err) {
    logger.error({ err }, "Meta publish error");
    return { success: false, platform: "meta", error: "Meta publish request failed" };
  }
}

export async function publishToInstagram(input: PublishPostInput): Promise<PublishResult> {
  if (isDryRun()) return dryRunResult("instagram", input);

  const token = process.env["META_ACCESS_TOKEN"] ?? process.env["META_PAGE_ACCESS_TOKEN"];
  const igId = process.env["INSTAGRAM_BUSINESS_ACCOUNT_ID"];
  if (!token || !igId) return notConfigured("instagram");

  try {
    const mediaResp = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: input.mediaUrls?.[0],
        caption: `${input.caption}\n\n${input.destinationUrl}`,
        access_token: token,
      }),
    });
    const media = (await mediaResp.json()) as { id?: string; error?: { message: string } };
    if (!media.id) {
      return { success: false, platform: "instagram", error: media.error?.message || "Media creation failed" };
    }
    const publishResp = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: media.id, access_token: token }),
    });
    const pub = (await publishResp.json()) as { id?: string; error?: { message: string } };
    if (pub.id) {
      return { success: true, platform: "instagram", postId: pub.id };
    }
    return { success: false, platform: "instagram", error: pub.error?.message || "Publish failed" };
  } catch (err) {
    logger.error({ err }, "Instagram publish error");
    return { success: false, platform: "instagram", error: "Instagram publish request failed" };
  }
}

// ── TikTok ───────────────────────────────────────────────────────────────────

export async function publishToTikTok(input: PublishPostInput): Promise<PublishResult> {
  if (isDryRun()) return dryRunResult("tiktok", input);
  const token = process.env["TIKTOK_ACCESS_TOKEN"];
  if (!token) return { success: false, platform: "tiktok", error: "TikTok posting requires OAuth app approval from TikTok. Site verification is active." };
  logger.info({ platform: "tiktok" }, "TikTok Content Posting API integration pending approval");
  return { success: false, platform: "tiktok", error: "TikTok Content Posting API integration pending — awaiting app approval" };
}

// ── LinkedIn ─────────────────────────────────────────────────────────────────

export async function publishToLinkedIn(input: PublishPostInput): Promise<PublishResult> {
  if (isDryRun()) return dryRunResult("linkedin", input);
  const token = process.env["LINKEDIN_ACCESS_TOKEN"];
  const orgId = process.env["LINKEDIN_ORGANIZATION_ID"];
  if (!token || !orgId) return notConfigured("linkedin");

  try {
    const resp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:organization:${orgId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: `${input.caption}\n\n${input.destinationUrl}` },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    if (resp.ok) {
      const location = resp.headers.get("x-restli-id") || "";
      return { success: true, platform: "linkedin", postId: location };
    }
    const err = (await resp.json()) as { message?: string };
    return { success: false, platform: "linkedin", error: err.message || "LinkedIn post failed" };
  } catch (err) {
    logger.error({ err }, "LinkedIn publish error");
    return { success: false, platform: "linkedin", error: "LinkedIn publish request failed" };
  }
}

// ── X/Twitter ────────────────────────────────────────────────────────────────

export async function publishToX(input: PublishPostInput): Promise<PublishResult> {
  if (isDryRun()) return dryRunResult("x", input);
  const apiKey = process.env["X_API_KEY"];
  const apiSecret = process.env["X_API_SECRET"];
  const accessToken = process.env["X_ACCESS_TOKEN"];
  const accessSecret = process.env["X_ACCESS_TOKEN_SECRET"];
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) return notConfigured("x");

  try {
    const { publishToX: xPublish } = await import("../services/social/x.js");
    const result = await xPublish({ caption: input.caption, link: input.destinationUrl });
    return { success: result.success, platform: "x", postId: result.tweetId, postUrl: result.tweetUrl, error: result.error };
  } catch (err) {
    logger.error({ err }, "X publish error");
    return { success: false, platform: "x", error: "X publish request failed" };
  }
}

// ── YouTube Shorts ───────────────────────────────────────────────────────────

export async function publishToYouTube(input: PublishPostInput): Promise<PublishResult> {
  if (isDryRun()) return dryRunResult("youtube", input);
  const token = process.env["YOUTUBE_REFRESH_TOKEN"];
  const channelId = process.env["YOUTUBE_CHANNEL_ID"];
  if (!token || !channelId) return notConfigured("youtube");
  logger.info({ platform: "youtube" }, "YouTube OAuth credentials present — video streaming integration pending");
  return { success: false, platform: "youtube", error: "YouTube Shorts upload requires video streaming integration — coming soon" };
}

// ── Snapchat ─────────────────────────────────────────────────────────────────

export async function publishToSnapchat(input: PublishPostInput): Promise<PublishResult> {
  if (isDryRun()) return dryRunResult("snapchat", input);
  const token = process.env["SNAP_ACCESS_TOKEN"];
  if (!token) return notConfigured("snapchat");
  logger.info({ platform: "snapchat" }, "Snapchat Marketing API stub — draft mode");
  return { success: false, platform: "snapchat", error: "Snapchat Marketing API — use /api/social/publish for ad draft creation" };
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export async function publishToPlatform(platform: string, input: PublishPostInput): Promise<PublishResult> {
  switch (platform.toLowerCase()) {
    case "meta":
    case "facebook":       return publishToMeta(input);
    case "instagram":      return publishToInstagram(input);
    case "tiktok":         return publishToTikTok(input);
    case "linkedin":       return publishToLinkedIn(input);
    case "x":
    case "twitter":        return publishToX(input);
    case "youtube":
    case "youtube_shorts": return publishToYouTube(input);
    case "snapchat":       return publishToSnapchat(input);
    default:               return { success: false, platform, error: `Unknown platform: ${platform}` };
  }
}
