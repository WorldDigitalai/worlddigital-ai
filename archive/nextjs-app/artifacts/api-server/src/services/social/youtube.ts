/**
 * YouTube social service.
 * API key (YOUTUBE_API_KEY) is sufficient for reading public data.
 * Uploading Shorts requires OAuth: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET,
 * YOUTUBE_REFRESH_TOKEN, and YOUTUBE_CHANNEL_ID.
 *
 * Full resumable upload flow implemented:
 *   1. Exchange refresh token for access token
 *   2. Download video from URL into memory
 *   3. Initialize resumable upload session (returns upload URL)
 *   4. Stream video bytes to upload URL
 *   5. Return video ID and YouTube Shorts URL
 */

import { logger } from "../../lib/logger.js";
import { resolveEnv } from "../../lib/secretResolver.js";

export interface YouTubeStatus {
  apiKeyConfigured: boolean;
  apiKeyValid: boolean;
  apiKeyMasked: string | null;
  oauthConfigured: boolean;
  uploadReady: boolean;
  issues: string[];
}

export interface YouTubeUploadInput {
  title: string;
  description: string;
  videoUrl: string;
  tags?: string[];
  privacyStatus?: "public" | "private" | "unlisted";
}

export interface PublishResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
}

function mask(v: string): string {
  return v.length > 8 ? `${v.slice(0, 4)}****${v.slice(-4)}` : "****";
}

// ── Access token exchange ─────────────────────────────────────────────────────

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ accessToken: string } | { error: string }> {
  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = (await resp.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!data.access_token) {
      const msg = data.error_description ?? data.error ?? `HTTP ${resp.status}`;
      return { error: `YouTube OAuth token refresh failed: ${msg}` };
    }
    return { accessToken: data.access_token };
  } catch (e) {
    return { error: `YouTube token exchange network error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// ── Status ────────────────────────────────────────────────────────────────────

export async function testYouTubeConnection(): Promise<YouTubeStatus> {
  const apiKey       = resolveEnv("YOUTUBE_API_KEY", "GOOGLE_YOUTUBE_API_KEY", "GOOGLE_API_KEY");
  const clientId     = resolveEnv("YOUTUBE_CLIENT_ID", "GOOGLE_CLIENT_ID");
  const clientSecret = resolveEnv("YOUTUBE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET");
  const refreshToken = resolveEnv("YOUTUBE_REFRESH_TOKEN", "GOOGLE_YOUTUBE_REFRESH_TOKEN", "GOOGLE_REFRESH_TOKEN");
  const channelId    = resolveEnv("YOUTUBE_CHANNEL_ID", "GOOGLE_YOUTUBE_CHANNEL_ID");
  const issues: string[] = [];

  if (!apiKey) {
    issues.push("YOUTUBE_API_KEY is not set — add it from Google Cloud Console");
    return { apiKeyConfigured: false, apiKeyValid: false, apiKeyMasked: null, oauthConfigured: false, uploadReady: false, issues };
  }

  let apiKeyValid = false;
  try {
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = (await resp.json()) as { items?: unknown[]; error?: { message: string } };
    if (resp.ok && data.items !== undefined) {
      apiKeyValid = true;
    } else {
      issues.push(`YOUTUBE_API_KEY invalid: ${data.error?.message ?? "unexpected response"}`);
    }
  } catch {
    issues.push("YouTube API unreachable — network error");
  }

  const oauthConfigured = !!(clientId && clientSecret && refreshToken && channelId);
  if (!oauthConfigured) {
    const missing = [
      !clientId     && "YOUTUBE_CLIENT_ID",
      !clientSecret && "YOUTUBE_CLIENT_SECRET",
      !refreshToken && "YOUTUBE_REFRESH_TOKEN",
      !channelId    && "YOUTUBE_CHANNEL_ID",
    ].filter(Boolean);
    if (missing.length > 0) {
      issues.push(`YouTube API key works, but uploads require OAuth. Missing: ${missing.join(", ")}`);
    }
  } else if (apiKeyValid) {
    const tokenResult = await getAccessToken(clientId!, clientSecret!, refreshToken!);
    if ("error" in tokenResult) {
      issues.push(`YouTube OAuth check failed: ${tokenResult.error}`);
    }
  }

  return {
    apiKeyConfigured: true,
    apiKeyValid,
    apiKeyMasked: mask(apiKey),
    oauthConfigured,
    uploadReady: apiKeyValid && oauthConfigured,
    issues,
  };
}

// ── Publish ───────────────────────────────────────────────────────────────────

export async function publishToYouTubeShorts(input: YouTubeUploadInput, creds?: { clientId?: string; clientSecret?: string; refreshToken?: string; channelId?: string }): Promise<PublishResult> {
  const clientId     = creds?.clientId ?? resolveEnv("YOUTUBE_CLIENT_ID", "GOOGLE_CLIENT_ID");
  const clientSecret = creds?.clientSecret ?? resolveEnv("YOUTUBE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET");
  const refreshToken = creds?.refreshToken ?? resolveEnv("YOUTUBE_REFRESH_TOKEN", "GOOGLE_YOUTUBE_REFRESH_TOKEN", "GOOGLE_REFRESH_TOKEN");
  const channelId    = creds?.channelId ?? resolveEnv("YOUTUBE_CHANNEL_ID", "GOOGLE_YOUTUBE_CHANNEL_ID");

  if (!clientId || !clientSecret || !refreshToken || !channelId) {
    const missing = [
      !clientId     && "YOUTUBE_CLIENT_ID",
      !clientSecret && "YOUTUBE_CLIENT_SECRET",
      !refreshToken && "YOUTUBE_REFRESH_TOKEN",
      !channelId    && "YOUTUBE_CHANNEL_ID",
    ].filter(Boolean);
    return { success: false, error: `YouTube uploads require OAuth. Missing: ${missing.join(", ")}` };
  }

  // ── Step 1: Exchange refresh token for access token ──────────────────────

  const tokenResult = await getAccessToken(clientId, clientSecret, refreshToken);
  if ("error" in tokenResult) {
    return { success: false, error: tokenResult.error };
  }
  const accessToken = tokenResult.accessToken;

  // ── Step 2: Download video from URL ──────────────────────────────────────

  let videoBuffer: Buffer;
  let contentType: string;

  try {
    const videoResp = await fetch(input.videoUrl, { signal: AbortSignal.timeout(90000) });
    if (!videoResp.ok) {
      return { success: false, error: `Failed to download video: HTTP ${videoResp.status} from ${input.videoUrl}` };
    }
    videoBuffer   = Buffer.from(await videoResp.arrayBuffer());
    contentType   = videoResp.headers.get("content-type") ?? "video/mp4";
    const sizeMb  = (videoBuffer.length / 1024 / 1024).toFixed(1);
    logger.info({ sizeBytes: videoBuffer.length, sizeMb, contentType }, "YouTube video downloaded");
  } catch (e) {
    return { success: false, error: `Video download failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  // ── Step 3: Initialize resumable upload session ───────────────────────────

  const tags = [...(input.tags ?? []), "#Shorts"];

  let uploadUrl: string;
  try {
    const initResp = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method:  "POST",
        headers: {
          Authorization:            `Bearer ${accessToken}`,
          "Content-Type":           "application/json",
          "X-Upload-Content-Type":  contentType,
          "X-Upload-Content-Length": videoBuffer.length.toString(),
        },
        body: JSON.stringify({
          snippet: {
            title:       input.title.slice(0, 100),
            description: input.description.slice(0, 5000),
            tags,
            categoryId:  "22",
            defaultLanguage: "en",
          },
          status: {
            privacyStatus:               input.privacyStatus ?? "public",
            selfDeclaredMadeForKids:     false,
            embeddable:                  true,
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!initResp.ok) {
      const errBody = (await initResp.json()) as { error?: { message?: string; code?: number } };
      const msg = errBody.error?.message ?? `Init failed: HTTP ${initResp.status}`;
      if (initResp.status === 401) {
        return { success: false, error: `YouTube OAuth token rejected — check YOUTUBE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN` };
      }
      if (initResp.status === 403) {
        return { success: false, error: `YouTube API permission denied: ${msg}. Ensure the YouTube Data API v3 is enabled in Google Cloud Console.` };
      }
      return { success: false, error: `YouTube upload init failed: ${msg}` };
    }

    const location = initResp.headers.get("location");
    if (!location) {
      return { success: false, error: "YouTube did not return an upload URL (no Location header)" };
    }
    uploadUrl = location;
  } catch (e) {
    return { success: false, error: `YouTube upload init error: ${e instanceof Error ? e.message : String(e)}` };
  }

  // ── Step 4: Upload video bytes to the resumable upload URL ───────────────

  try {
    logger.info({ title: input.title, uploadUrlPrefix: uploadUrl.slice(0, 60) }, "Starting YouTube resumable upload");

    const uploadResp = await fetch(uploadUrl, {
      method:  "PUT",
      headers: {
        "Content-Type":   contentType,
        "Content-Length": videoBuffer.length.toString(),
      },
      body:   videoBuffer,
      signal: AbortSignal.timeout(300000), // 5-min timeout for large videos
    });

    if (uploadResp.ok || uploadResp.status === 201) {
      const data = (await uploadResp.json()) as {
        id?: string;
        error?: { message?: string };
      };

      if (data.id) {
        logger.info({ videoId: data.id, title: input.title }, "YouTube Shorts uploaded successfully");
        return {
          success:  true,
          videoId:  data.id,
          videoUrl: `https://www.youtube.com/shorts/${data.id}`,
        };
      }

      return { success: false, error: data.error?.message ?? "Upload succeeded but no video ID returned" };
    }

    if (uploadResp.status === 308) {
      return { success: false, error: "YouTube upload incomplete (resumable upload interrupted). Retry required." };
    }

    let errMsg = `YouTube upload failed: HTTP ${uploadResp.status}`;
    try {
      const errData = (await uploadResp.json()) as { error?: { message?: string } };
      if (errData.error?.message) errMsg = `YouTube upload failed: ${errData.error.message}`;
    } catch { /* ignore parse errors */ }

    return { success: false, error: errMsg };
  } catch (e) {
    logger.error({ err: e, title: input.title }, "YouTube upload error");
    return { success: false, error: `YouTube upload error: ${e instanceof Error ? e.message : String(e)}` };
  }
}
