/**
 * Per-user platform OAuth system.
 *
 * Unified connect/callback for all social/ad platforms.
 * Stores tokens in userPlatformTokens collection (per-user, not global).
 *
 * Flow:
 *   1. GET  /v1/oauth/:platform/connect    — redirect to platform OAuth (or manual form)
 *   2. GET  /v1/oauth/:platform/callback   — receive code, exchange, store token
 *   3. POST /v1/oauth/:platform/manual     — store manually-provided token
 *
 * Platforms:
 *   meta — Facebook Login (requires META_APP_ID + META_APP_SECRET)
 *   google — Google OAuth (extends existing /v1/auth/google, adds scope storage)
 *   tiktok — TikTok OAuth (requires TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET)
 *   snapchat — Snapchat OAuth (requires SNAP_CLIENT_ID + SNAP_CLIENT_SECRET)
 *   x — X OAuth (requires X_CLIENT_ID + X_CLIENT_SECRET)
 *   linkedin — LinkedIn OAuth (requires LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET)
 *   youtube — Google OAuth with YouTube scope
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

const router = Router();

const FRONTEND_URL = process.env["FRONTEND_URL"] || "https://worlddigital.ai";

// ── OAuth config per platform ───────────────────────────────────────────────

interface PlatformOAuthConfig {
  name: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  buildAuthUrl: (clientId: string, redirectUri: string, state: string, scope: string) => string;
  exchangeCode: (code: string, clientId: string, clientSecret: string, redirectUri: string) => Promise<Record<string, unknown>>;
}

function getClientId(key: string): string | undefined {
  return process.env[key];
}

function getClientSecret(key: string): string | undefined {
  return process.env[key];
}

function base64State(userId: string, platform: string): string {
  return Buffer.from(JSON.stringify({ userId, platform, nonce: Math.random().toString(36).slice(2) })).toString("base64url");
}

function parseState(state: string): { userId: string; platform: string } | null {
  try {
    const s = Buffer.from(state, "base64url").toString("utf8");
    const obj = JSON.parse(s) as { userId: string; platform: string };
    return obj;
  } catch {
    return null;
  }
}

const CALLBACK_URI = `${FRONTEND_URL}/api/v1/oauth/callback`;

const PLATFORM_CONFIGS: Record<string, PlatformOAuthConfig> = {
  meta: {
    name: "Meta",
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scope: "pages_manage_posts,pages_read_engagement,instagram_content_publish",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    buildAuthUrl: (clientId, redirectUri, state, scope) =>
      `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`,
    exchangeCode: async (code, clientId, clientSecret, redirectUri) => {
      const url = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
      const res = await fetch(url);
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error(String((data.error as { message?: string })?.message ?? data.error ?? "Meta token exchange failed"));
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };
    },
  },
  tiktok: {
    name: "TikTok",
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scope: "video.publish,user.info.basic",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    buildAuthUrl: (clientId, redirectUri, state, scope) => {
      const params = new URLSearchParams({
        client_key: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        state,
      });
      return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    },
    exchangeCode: async (code, clientId, clientSecret, redirectUri) => {
      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }).toString(),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error(JSON.stringify(data));
      return {
        accessToken: (data.data as Record<string, unknown>)?.access_token,
        refreshToken: (data.data as Record<string, unknown>)?.refresh_token,
        expiresIn: (data.data as Record<string, unknown>)?.expires_in,
        openId: (data.data as Record<string, unknown>)?.open_id,
      };
    },
  },
  snapchat: {
    name: "Snapchat",
    authUrl: "https://accounts.snapchat.com/accounts/oauth2/auth",
    tokenUrl: "https://accounts.snapchat.com/accounts/oauth2/token",
    scope: "snapchat-marketing-api",
    clientIdEnv: "SNAPCHAT_CLIENT_ID",
    clientSecretEnv: "SNAPCHAT_CLIENT_SECRET",
    buildAuthUrl: (clientId, redirectUri, state, scope) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        state,
      });
      return `https://accounts.snapchat.com/accounts/oauth2/auth?${params.toString()}`;
    },
    exchangeCode: async (code, clientId, clientSecret, redirectUri) => {
      const res = await fetch("https://accounts.snapchat.com/accounts/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }).toString(),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error(JSON.stringify(data));
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    },
  },
  google: {
    name: "Google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/bigquery",
    ].join(" "),
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    buildAuthUrl: (clientId, redirectUri, state, scope) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        state,
        access_type: "offline",
        prompt: "consent",
        hl: "en",
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    exchangeCode: async (code, clientId, clientSecret, redirectUri) => {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }).toString(),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error(JSON.stringify(data));
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };
    },
  },
  youtube: {
    name: "YouTube",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/bigquery",
    ].join(" "),
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    buildAuthUrl: (clientId, redirectUri, state, scope) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        state,
        access_type: "offline",
        prompt: "consent",
        hl: "en",
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    exchangeCode: async (code, clientId, clientSecret, redirectUri) => {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }).toString(),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error(JSON.stringify(data));
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };
    },
  },
  x: {
    name: "X",
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scope: "tweet.read tweet.write users.read",
    clientIdEnv: "X_CLIENT_ID",
    clientSecretEnv: "X_CLIENT_SECRET",
    buildAuthUrl: (clientId, redirectUri, state, scope) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        state,
        code_challenge: "challenge",
        code_challenge_method: "plain",
      });
      return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    },
    exchangeCode: async (code, clientId, clientSecret, redirectUri) => {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const res = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code_verifier: "challenge",
        }).toString(),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error(JSON.stringify(data));
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    },
  },
  linkedin: {
    name: "LinkedIn",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scope: "w_member_social r_basicprofile",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    buildAuthUrl: (clientId, redirectUri, state, scope) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        state,
      });
      return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    },
    exchangeCode: async (code, clientId, clientSecret, redirectUri) => {
      const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }).toString(),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error(JSON.stringify(data));
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    },
  },
};

// ── GET /v1/oauth/:platform/connect — redirect to platform OAuth ───────────────

router.get("/v1/oauth/:platform/connect", requireAuth, (req: AuthRequest, res: Response) => {
  const platform = req.params["platform"] as string;
  const config = PLATFORM_CONFIGS[platform];

  if (!config) {
    res.status(400).json({ message: `Unsupported platform: ${platform}` });
    return;
  }

  const clientId = getClientId(config.clientIdEnv);
  if (!clientId) {
    res.status(503).json({
      message: `${config.name} OAuth is not configured. Set ${config.clientIdEnv} and ${config.clientSecretEnv} environment variables.`,
      platform,
      manualConnect: true,
    });
    return;
  }

  const state = base64State(req.user!.userId, platform);
  const redirectUri = CALLBACK_URI;
  const url = config.buildAuthUrl(clientId, redirectUri, state, config.scope);

  logger.info({ userId: req.user!.userId, platform }, `Redirecting to ${config.name} OAuth`);
  res.redirect(url);
});

// ── GET /v1/oauth/callback — unified callback for all platforms ──────────────

router.get("/v1/oauth/callback", async (req: Request, res: Response) => {
  const code = req.query["code"] as string | undefined;
  const state = req.query["state"] as string | undefined;
  const error = req.query["error"] as string | undefined;
  const errorDesc = req.query["error_description"] as string | undefined;

  if (error || !code || !state) {
    logger.warn({ error, errorDesc }, "OAuth callback error or missing params");
    return res.redirect(`${FRONTEND_URL}/dashboard/platforms?oauth_error=${encodeURIComponent(errorDesc || error || "OAuth failed")}`);
  }

  const parsed = parseState(state);
  if (!parsed) {
    logger.warn({ state }, "OAuth callback — invalid state");
    return res.redirect(`${FRONTEND_URL}/dashboard/platforms?oauth_error=invalid_state`);
  }

  const { userId, platform } = parsed;
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    return res.redirect(`${FRONTEND_URL}/dashboard/platforms?oauth_error=unknown_platform`);
  }

  const clientId = getClientId(config.clientIdEnv);
  const clientSecret = getClientSecret(config.clientSecretEnv);
  if (!clientId || !clientSecret) {
    return res.redirect(`${FRONTEND_URL}/dashboard/platforms?oauth_error=${encodeURIComponent(`${config.name} not configured`)}`);
  }

  try {
    const tokens = await config.exchangeCode(code, clientId, clientSecret, CALLBACK_URI);

    const col = getCollection<Record<string, unknown>>("userPlatformTokens");
    await col.updateOne(
      { userId, platform },
      {
        $set: {
          userId,
          platform,
          connected: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || undefined,
          expiresAt: tokens.expiresIn ? new Date(Date.now() + (tokens.expiresIn as number) * 1000) : undefined,
          metadata: { tokenType: tokens.tokenType, openId: tokens.openId },
          connectedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    logger.info({ userId, platform }, `${config.name} OAuth connected — token stored per-user`);
    return res.redirect(`${FRONTEND_URL}/dashboard/platforms?oauth_success=${platform}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token exchange failed";
    logger.error({ err, userId, platform }, "OAuth token exchange failed");
    return res.redirect(`${FRONTEND_URL}/dashboard/platforms?oauth_error=${encodeURIComponent(msg)}&platform=${platform}`);
  }
});

// ── POST /v1/oauth/:platform/manual — store manually-provided token ────────

router.post("/v1/oauth/:platform/manual", requireAuth, async (req: AuthRequest, res: Response) => {
  const platform = req.params["platform"] as string;
  const userId = req.user!.userId;
  const { accessToken, refreshToken, accountName, expiresAt } = req.body ?? {};

  if (!accessToken) {
    res.status(400).json({ message: "accessToken is required" });
    return;
  }

  const col = getCollection<Record<string, unknown>>("userPlatformTokens");
  await col.updateOne(
    { userId, platform },
    {
      $set: {
        userId,
        platform,
        connected: true,
        accessToken,
        ...(refreshToken ? { refreshToken } : {}),
        ...(accountName ? { accountName } : {}),
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
        connectedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  logger.info({ userId, platform, accountName }, "Platform connected manually");
  res.json({ success: true, platform, connected: true });
});

// ── GET /v1/oauth/status — which platforms are configured ────────────────────

router.get("/v1/oauth/status", (_req: Request, res: Response) => {
  const status = Object.entries(PLATFORM_CONFIGS).map(([id, cfg]) => ({
    platform: id,
    name: cfg.name,
    configured: !!(getClientId(cfg.clientIdEnv) && getClientSecret(cfg.clientSecretEnv)),
    clientIdEnv: cfg.clientIdEnv,
  }));
  res.json({ platforms: status });
});

export default router;
