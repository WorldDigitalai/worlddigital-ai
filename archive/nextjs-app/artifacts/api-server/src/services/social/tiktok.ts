/**
 * TikTok Content Posting API v2 — social publishing service.
 *
 * Implements the full TikTok Content Posting API flow:
 *   Video: POST /v2/post/publish/video/init/ → upload → poll status
 *   Photo: POST /v2/post/publish/content/init/ (images array)
 *
 * Required credentials:
 *   TIKTOK_ACCESS_TOKEN — OAuth token from /api/social/tiktok/connect flow
 *   TIKTOK_OPEN_ID      — User's open_id (returned with access token)
 *
 * Platform note:
 *   The Content Posting API requires TikTok's manual app approval before
 *   it becomes active. Once approved, this service posts with no further changes.
 *   Without approval the API returns a permission error that is surfaced clearly.
 */

import { logger } from "../../lib/logger.js";
import { resolveEnv } from "../../lib/secretResolver.js";

const TIKTOK_API = "https://open.tiktokapis.com";

export interface TikTokSocialStatus {
  clientKeySet: boolean;
  accessTokenSet: boolean;
  openIdSet: boolean;
  accessTokenMasked: string | null;
  postingReady: boolean;
  awaitingApproval: boolean;
  issues: string[];
}

export interface PostInput {
  caption: string;
  mediaUrl?: string;
  link?: string;
  isVideo?: boolean;
}

export interface PublishResult {
  success: boolean;
  publishId?: string;
  videoId?: string;
  postUrl?: string;
  awaitingApproval?: boolean;
  error?: string;
}

function mask(v: string): string {
  if (!v || v.length <= 8) return "****";
  return `${v.slice(0, 6)}...${v.slice(-6)}`;
}

// ── Status ────────────────────────────────────────────────────────────────────

export async function testTikTokSocialConnection(): Promise<TikTokSocialStatus> {
  const clientKey   = resolveEnv("TIKTOK_CLIENT_KEY");
  const accessToken = resolveEnv("TIKTOK_ACCESS_TOKEN");
  const openId      = resolveEnv("TIKTOK_OPEN_ID");
  const issues: string[] = [];

  if (!clientKey)   issues.push("TIKTOK_CLIENT_KEY not set — add from TikTok Developer Portal → app credentials");
  if (!accessToken) issues.push("TIKTOK_ACCESS_TOKEN not set — complete OAuth via Admin → Integrations → TikTok");
  if (!openId)      issues.push("TIKTOK_OPEN_ID not set — returned with access token during OAuth, add to Replit Secrets");

  let awaitingApproval = false;

  if (accessToken) {
    try {
      const resp = await fetch(`${TIKTOK_API}/v2/user/info/?fields=open_id,display_name`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal:  AbortSignal.timeout(8000),
      });
      const data = (await resp.json()) as {
        data?:  { user?: { open_id?: string; display_name?: string } };
        error?: { code?: number; message?: string };
      };

      if (resp.ok && data.data?.user?.open_id) {
        // Token valid — now check if Content Posting API scope is approved
        const permResp = await fetch(`${TIKTOK_API}/v2/oauth/token/info/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal:  AbortSignal.timeout(8000),
        });
        const permData = (await permResp.json()) as {
          data?: { scope?: string };
          error?: { code?: number; message?: string };
        };

        const scopes = permData.data?.scope ?? "";
        const hasVideoPublish = scopes.includes("video.publish");
        if (!hasVideoPublish) {
          awaitingApproval = true;
          issues.push("TikTok access token valid but video.publish scope is not approved — apply at developers.tiktok.com for Content Posting API access");
        }
      } else if (resp.status === 401) {
        issues.push("TIKTOK_ACCESS_TOKEN is expired or invalid — reconnect via Admin → Integrations → TikTok");
      } else {
        const errMsg = data.error?.message ?? `HTTP ${resp.status}`;
        if (errMsg.toLowerCase().includes("permission") || data.error?.code === 10004) {
          awaitingApproval = true;
          issues.push(`TikTok Content Posting API not yet approved: ${errMsg} — apply at developers.tiktok.com`);
        } else {
          issues.push(`TikTok token check failed: ${errMsg}`);
        }
      }
    } catch (e) {
      issues.push(`TikTok API unreachable: ${e instanceof Error ? e.message : "network error"}`);
    }
  }

  return {
    clientKeySet:     !!clientKey,
    accessTokenSet:   !!accessToken,
    openIdSet:        !!openId,
    accessTokenMasked: accessToken ? mask(accessToken) : null,
    postingReady:     !!accessToken && !!openId && !awaitingApproval,
    awaitingApproval,
    issues,
  };
}

// ── Publish ───────────────────────────────────────────────────────────────────

export async function publishToTikTok(input: PostInput): Promise<PublishResult> {
  const accessToken = resolveEnv("TIKTOK_ACCESS_TOKEN");
  const openId      = resolveEnv("TIKTOK_OPEN_ID");

  if (!accessToken) {
    return { success: false, error: "TIKTOK_ACCESS_TOKEN not set — complete the OAuth flow via Admin → Integrations → TikTok" };
  }
  if (!openId) {
    return { success: false, error: "TIKTOK_OPEN_ID not set — add the open_id returned during OAuth to Replit Secrets" };
  }

  if (input.mediaUrl && input.isVideo !== false && isVideoUrl(input.mediaUrl)) {
    return publishTikTokVideo(accessToken, openId, input);
  }
  if (input.mediaUrl) {
    return publishTikTokPhoto(accessToken, openId, input);
  }

  // Text-only post via video with no media is not supported by TikTok
  return {
    success: false,
    error: "TikTok requires a media URL (image or video) — text-only posts are not supported by the Content Posting API",
  };
}

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".mov") ||
    lower.includes(".avi") ||
    lower.includes(".webm") ||
    lower.includes("video")
  );
}

// ── Video upload ──────────────────────────────────────────────────────────────

async function publishTikTokVideo(
  accessToken: string,
  openId: string,
  input: PostInput
): Promise<PublishResult> {
  // Step 1: Download video
  let videoBuffer: Buffer;
  let contentType: string;

  try {
    const videoResp = await fetch(input.mediaUrl!, { signal: AbortSignal.timeout(90000) });
    if (!videoResp.ok) {
      return { success: false, error: `Failed to download video for TikTok: HTTP ${videoResp.status}` };
    }
    videoBuffer = Buffer.from(await videoResp.arrayBuffer());
    contentType = videoResp.headers.get("content-type") ?? "video/mp4";
    logger.info({ sizeBytes: videoBuffer.length, contentType }, "TikTok video downloaded");
  } catch (e) {
    return { success: false, error: `TikTok video download failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Step 2: Initialize upload
  let uploadUrl: string;
  let publishId: string;

  try {
    const initResp = await fetch(`${TIKTOK_API}/v2/post/publish/video/init/`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title:             input.caption.slice(0, 2200),
          privacy_level:     "PUBLIC_TO_EVERYONE",
          disable_duet:      false,
          disable_comment:   false,
          disable_stitch:    false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source:       "PULL_FROM_URL",
          video_url:    input.mediaUrl,
          video_size:   videoBuffer.length,
          chunk_size:   videoBuffer.length,
          total_chunk_count: 1,
        },
      }),
      signal: AbortSignal.timeout(20000),
    });

    const initData = (await initResp.json()) as {
      data?:  { publish_id?: string; upload_url?: string };
      error?: { code?: number; message?: string; log_id?: string };
    };

    if (!initResp.ok || initData.error?.code) {
      const code = initData.error?.code;
      const msg  = initData.error?.message ?? `HTTP ${initResp.status}`;

      if (code === 10004 || code === 10005 || msg.toLowerCase().includes("scope") || msg.toLowerCase().includes("permission")) {
        return {
          success:          false,
          awaitingApproval: true,
          error: `TikTok Content Posting API not approved yet: ${msg}. Apply at https://developers.tiktok.com for video.publish scope access.`,
        };
      }
      if (initResp.status === 401) {
        return { success: false, error: "TIKTOK_ACCESS_TOKEN expired — reconnect via Admin → Integrations → TikTok" };
      }
      return { success: false, error: `TikTok upload init failed: ${msg} (code: ${code})` };
    }

    if (!initData.data?.publish_id || !initData.data?.upload_url) {
      return { success: false, error: "TikTok upload init returned no publish_id or upload_url" };
    }

    publishId = initData.data.publish_id;
    uploadUrl = initData.data.upload_url;
  } catch (e) {
    return { success: false, error: `TikTok upload init error: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Step 3: Upload video bytes as a single chunk
  try {
    const uploadResp = await fetch(uploadUrl, {
      method:  "PUT",
      headers: {
        "Content-Type":   "video/mp4",
        "Content-Length": videoBuffer.length.toString(),
        "Content-Range":  `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
      },
      body:   videoBuffer,
      signal: AbortSignal.timeout(300000),
    });

    if (!uploadResp.ok && uploadResp.status !== 206) {
      return { success: false, error: `TikTok video upload failed: HTTP ${uploadResp.status}` };
    }

    logger.info({ publishId }, "TikTok video uploaded — polling status");
  } catch (e) {
    return { success: false, error: `TikTok video upload error: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Step 4: Poll publish status (up to 10 times, 3s apart)
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));

    try {
      const statusResp = await fetch(`${TIKTOK_API}/v2/post/publish/status/fetch/`, {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body:   JSON.stringify({ publish_id: publishId }),
        signal: AbortSignal.timeout(10000),
      });

      const statusData = (await statusResp.json()) as {
        data?: {
          status?:        string;
          video_id?:      string;
          publicaly_available_post_id?: string[];
          fail_reason?:   string;
        };
        error?: { code?: number; message?: string };
      };

      const status = statusData.data?.status;
      if (status === "PUBLISH_COMPLETE" || status === "SUCCESS") {
        const videoId = statusData.data?.video_id
          ?? statusData.data?.publicaly_available_post_id?.[0]
          ?? publishId;
        logger.info({ publishId, videoId }, "TikTok video published successfully");
        return {
          success:   true,
          publishId,
          videoId,
          postUrl:   `https://www.tiktok.com/@${openId}/video/${videoId}`,
        };
      }

      if (status === "FAILED" || statusData.data?.fail_reason) {
        return {
          success: false,
          error:   `TikTok publish failed: ${statusData.data?.fail_reason ?? "unknown reason"}`,
        };
      }

      if (statusData.error?.code) {
        return {
          success: false,
          error:   `TikTok status check error: ${statusData.error.message} (code: ${statusData.error.code})`,
        };
      }

      // Still processing (PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, SENDING_TO_USER_INBOX)
      logger.info({ publishId, status, attempt }, "TikTok publish still processing");
    } catch (e) {
      logger.warn({ err: e, attempt }, "TikTok status poll error");
    }
  }

  // Return success with publish_id even if polling timed out — post is likely processing
  return {
    success:   true,
    publishId,
    postUrl:   `https://www.tiktok.com`,
    error:     "TikTok video submitted (publish_id saved) but status is still processing. Check TikTok app to confirm.",
  };
}

// ── Photo post ────────────────────────────────────────────────────────────────

async function publishTikTokPhoto(
  accessToken: string,
  _openId: string,
  input: PostInput
): Promise<PublishResult> {
  try {
    const resp = await fetch(`${TIKTOK_API}/v2/post/publish/content/init/`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title:         input.caption.slice(0, 2200),
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_comment: false,
        },
        source_info: {
          source:       "PULL_FROM_URL",
          photo_images: [input.mediaUrl],
          photo_cover_index: 0,
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      }),
      signal: AbortSignal.timeout(20000),
    });

    const data = (await resp.json()) as {
      data?:  { publish_id?: string };
      error?: { code?: number; message?: string };
    };

    if (!resp.ok || data.error?.code) {
      const code = data.error?.code;
      const msg  = data.error?.message ?? `HTTP ${resp.status}`;

      if (code === 10004 || code === 10005 || msg.toLowerCase().includes("scope")) {
        return {
          success:          false,
          awaitingApproval: true,
          error: `TikTok Content Posting API not approved: ${msg}. Apply at https://developers.tiktok.com`,
        };
      }
      return { success: false, error: `TikTok photo post failed: ${msg}` };
    }

    const publishId = data.data?.publish_id ?? "";
    logger.info({ publishId }, "TikTok photo post initiated");
    return { success: true, publishId };
  } catch (e) {
    logger.error({ err: e }, "TikTok photo publish error");
    return { success: false, error: `TikTok photo post error: ${e instanceof Error ? e.message : String(e)}` };
  }
}
