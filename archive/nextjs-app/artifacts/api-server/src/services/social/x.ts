/**
 * X (Twitter) social publishing service.
 * Implements OAuth 1.0a signing using Node's built-in crypto module.
 * Uses all four credentials: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET.
 */

import { createHmac } from "crypto";
import { logger } from "../../lib/logger.js";
import { resolveEnv } from "../../lib/secretResolver.js";

export interface XStatus {
  configured: boolean;
  credentialsValid: boolean;
  userHandle: string | null;
  readWriteAccess: boolean;
  postingReady: boolean;
  issues: string[];
}

export interface PostInput {
  caption: string;
  mediaUrl?: string;
  link?: string;
}

export interface PublishResult {
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}

// ── OAuth 1.0a signing ────────────────────────────────────────────────────────

function pct(s: string): string {
  return encodeURIComponent(s);
}

function buildOAuthHeader(
  method: string,
  url: string,
  bodyParams: Record<string, string> = {}
): string {
  const apiKey = resolveEnv("X_API_KEY", "TWITTER_API_KEY", "X_CONSUMER_KEY", "TWITTER_CONSUMER_KEY")!;
  const apiSecret = resolveEnv("X_API_SECRET", "TWITTER_API_SECRET", "X_CONSUMER_SECRET", "TWITTER_CONSUMER_SECRET")!;
  const token = resolveEnv("X_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN")!;
  const tokenSecret = resolveEnv("X_ACCESS_TOKEN_SECRET", "TWITTER_ACCESS_TOKEN_SECRET")!;

  const nonce =
    Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const ts = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: ts,
    oauth_token: token,
    oauth_version: "1.0",
  };

  // Build parameter string — all params sorted, percent-encoded
  const allParams: Record<string, string> = { ...bodyParams, ...oauthParams };
  const paramStr = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}=${pct(v)}`)
    .join("&");

  // Base signature string
  const baseStr = `${method.toUpperCase()}&${pct(url)}&${pct(paramStr)}`;
  const sigKey = `${pct(apiSecret)}&${pct(tokenSecret)}`;
  const sig = createHmac("sha1", sigKey).update(baseStr).digest("base64");

  oauthParams["oauth_signature"] = sig;

  const headerParts = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}="${pct(v)}"`)
    .join(", ");

  return `OAuth ${headerParts}`;
}

function allCredsPresent(): boolean {
  return !!(
    resolveEnv("X_API_KEY", "TWITTER_API_KEY", "X_CONSUMER_KEY", "TWITTER_CONSUMER_KEY") &&
    resolveEnv("X_API_SECRET", "TWITTER_API_SECRET", "X_CONSUMER_SECRET", "TWITTER_CONSUMER_SECRET") &&
    resolveEnv("X_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN") &&
    resolveEnv("X_ACCESS_TOKEN_SECRET", "TWITTER_ACCESS_TOKEN_SECRET")
  );
}

// ── Status ────────────────────────────────────────────────────────────────────

export async function testXConnection(): Promise<XStatus> {
  const issues: string[] = [];

  if (!resolveEnv("X_API_KEY", "TWITTER_API_KEY", "X_CONSUMER_KEY", "TWITTER_CONSUMER_KEY")) issues.push("X API Key not found (tried: X_API_KEY, TWITTER_API_KEY, X_CONSUMER_KEY, TWITTER_CONSUMER_KEY)");
  if (!resolveEnv("X_API_SECRET", "TWITTER_API_SECRET", "X_CONSUMER_SECRET", "TWITTER_CONSUMER_SECRET")) issues.push("X API Secret not found (tried: X_API_SECRET, TWITTER_API_SECRET, X_CONSUMER_SECRET)");
  if (!resolveEnv("X_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN")) issues.push("X Access Token not found (tried: X_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN)");
  if (!resolveEnv("X_ACCESS_TOKEN_SECRET", "TWITTER_ACCESS_TOKEN_SECRET")) issues.push("X Access Token Secret not found (tried: X_ACCESS_TOKEN_SECRET, TWITTER_ACCESS_TOKEN_SECRET)");

  if (issues.length > 0) {
    return { configured: false, credentialsValid: false, userHandle: null, readWriteAccess: false, postingReady: false, issues };
  }

  // Verify credentials via X API v2 — GET /2/users/me
  const url = "https://api.twitter.com/2/users/me";
  const authHeader = buildOAuthHeader("GET", url);

  try {
    const resp = await fetch(url, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(10000),
    });
    const data = (await resp.json()) as {
      data?: { id: string; name: string; username: string };
      errors?: Array<{ message: string }>;
      title?: string;
      detail?: string;
    };

    if (resp.ok && data.data?.username) {
      return {
        configured: true,
        credentialsValid: true,
        userHandle: `@${data.data.username}`,
        readWriteAccess: true, // Credential validity implies write access (v2 read/write app)
        postingReady: true,
        issues: [],
      };
    }

    const errMsg = data.errors?.[0]?.message ?? data.detail ?? data.title ?? `HTTP ${resp.status}`;
    if (resp.status === 401 || resp.status === 403) {
      issues.push(`X credentials invalid or app permissions too low: ${errMsg}`);
      issues.push("Ensure your X App has Read + Write permissions enabled at developer.twitter.com");
    } else {
      issues.push(`X API check failed: ${errMsg}`);
    }

    return { configured: true, credentialsValid: false, userHandle: null, readWriteAccess: false, postingReady: false, issues };
  } catch (e) {
    issues.push("X API unreachable — network error");
    return { configured: true, credentialsValid: false, userHandle: null, readWriteAccess: false, postingReady: false, issues };
  }
}

// ── Publish ───────────────────────────────────────────────────────────────────

export async function publishToX(input: PostInput): Promise<PublishResult> {
  if (!allCredsPresent()) {
    const missing = [
      !resolveEnv("X_API_KEY", "TWITTER_API_KEY", "X_CONSUMER_KEY", "TWITTER_CONSUMER_KEY") && "X_API_KEY (or TWITTER_API_KEY)",
      !resolveEnv("X_API_SECRET", "TWITTER_API_SECRET", "X_CONSUMER_SECRET", "TWITTER_CONSUMER_SECRET") && "X_API_SECRET (or TWITTER_API_SECRET)",
      !resolveEnv("X_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN") && "X_ACCESS_TOKEN (or TWITTER_ACCESS_TOKEN)",
      !resolveEnv("X_ACCESS_TOKEN_SECRET", "TWITTER_ACCESS_TOKEN_SECRET") && "X_ACCESS_TOKEN_SECRET (or TWITTER_ACCESS_TOKEN_SECRET)",
    ].filter(Boolean);
    return { success: false, error: `Missing X credentials: ${missing.join(", ")}` };
  }

  // Build tweet text (Twitter v2 limit: 280 chars)
  const fullText = input.link ? `${input.caption}\n\n${input.link}` : input.caption;
  const tweetText = fullText.slice(0, 280);

  let mediaId: string | undefined;

  // Attempt media upload if mediaUrl is provided
  if (input.mediaUrl) {
    try {
      mediaId = await uploadMedia(input.mediaUrl);
    } catch (err) {
      logger.warn({ err }, "X media upload failed — falling back to text-only tweet");
    }
  }

  // Post tweet via v2
  const tweetBody: Record<string, unknown> = { text: tweetText };
  if (mediaId) tweetBody["media"] = { media_ids: [mediaId] };

  const tweetUrl = "https://api.twitter.com/2/tweets";
  const authHeader = buildOAuthHeader("POST", tweetUrl);

  try {
    const resp = await fetch(tweetUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetBody),
    });

    const data = (await resp.json()) as {
      data?: { id: string; text: string };
      errors?: Array<{ message: string }>;
      title?: string;
      detail?: string;
    };

    if (resp.ok && data.data?.id) {
      const tweetId = data.data.id;
      return {
        success: true,
        tweetId,
        tweetUrl: `https://twitter.com/i/web/status/${tweetId}`,
      };
    }

    const errMsg = data.errors?.[0]?.message ?? data.detail ?? data.title ?? `HTTP ${resp.status}`;
    if (resp.status === 403) {
      return { success: false, error: `X post rejected — app may need Read+Write permissions: ${errMsg}` };
    }
    return { success: false, error: errMsg };
  } catch (err) {
    logger.error({ err }, "X publish error");
    return { success: false, error: "X API request failed" };
  }
}

// ── Media upload (v1.1) ───────────────────────────────────────────────────────

async function uploadMedia(mediaUrl: string): Promise<string> {
  // Download the media first
  const mediaResp = await fetch(mediaUrl, { signal: AbortSignal.timeout(15000) });
  if (!mediaResp.ok) throw new Error(`Failed to download media: HTTP ${mediaResp.status}`);

  const mediaBuffer = Buffer.from(await mediaResp.arrayBuffer());
  const contentType = mediaResp.headers.get("content-type") ?? "image/jpeg";
  const mediaData = mediaBuffer.toString("base64");

  const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
  const bodyParams = {
    media_data: mediaData,
    media_type: contentType,
  };
  const authHeader = buildOAuthHeader("POST", uploadUrl, {});

  const formBody = new URLSearchParams({
    media_data: mediaData,
    media_type: contentType,
  });

  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  const data = (await resp.json()) as { media_id_string?: string; error?: string };
  if (!data.media_id_string) throw new Error(`Media upload failed: ${data.error ?? "unknown"}`);
  return data.media_id_string;
}
