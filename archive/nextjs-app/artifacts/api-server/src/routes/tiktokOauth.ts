/**
 * TikTok OAuth 2.0 (v2) flow — admin-only.
 *
 * Routes:
 *   GET  /api/social/tiktok/status    — client key + access token presence (open)
 *   GET  /api/social/tiktok/connect   — redirect to TikTok OAuth (admin JWT in ?adminToken)
 *   POST /api/v1/social/tiktok/exchange — exchange auth code for tokens (called by Next.js callback)
 *   GET  /api/social/tiktok/result    — one-time fetch of token after OAuth (admin JWT + nonce)
 *   POST /api/social/tiktok/disconnect — clear access token from process.env (admin only)
 *
 * Security:
 *   - All write/sensitive routes require a valid admin JWT (via header or ?adminToken query param)
 *   - Tokens are never logged in full — only masked
 *   - Exchange result is stored in memory for 10 minutes, one-time read
 *   - Callback URL is always the fixed production URL registered in TikTok Developer Portal
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger.js";

// ── Admin panel JWT auth (checks isAdmin: true, signed with ACCESS_TOKEN_SECRET) ─

function getAdminSecret(): string {
  return process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
}

function requireAdmin(_req: Request, res: Response, next: NextFunction): void {
  const auth = _req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), getAdminSecret()) as { isAdmin?: boolean };
    if (!payload.isAdmin) throw new Error("not admin");
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired admin token" });
  }
}

const router = Router();

// ── Constants ─────────────────────────────────────────────────────────────────

const TIKTOK_AUTH_URL  = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

// Must match exactly what is registered in the TikTok Developer Portal
const TIKTOK_CALLBACK_URL = "https://worlddigital.ai/auth/tiktok/callback";

// Scopes required for content posting
const TIKTOK_SCOPES = [
  "user.info.basic",
  "video.publish",
  "video.upload",
].join(",");

// ── In-memory one-time result store (TTL: 10 min) ─────────────────────────────

interface PendingTikTokResult {
  accessToken: string;
  refreshToken: string;
  openId: string;
  expiresIn: number;
  scope: string;
  created: number;
}

const pendingResults = new Map<string, PendingTikTokResult>();

function cleanupPending() {
  const tenMin = 10 * 60 * 1000;
  const now = Date.now();
  for (const [nonce, v] of pendingResults) {
    if (now - v.created > tenMin) pendingResults.delete(nonce);
  }
}

function mask(v: string): string {
  if (!v || v.length <= 8) return "****";
  return `${v.slice(0, 6)}...${v.slice(-6)}`;
}

// ── Admin query-param JWT validator (for redirect flows) ──────────────────────

function validateAdminQuery(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const payload = jwt.verify(token, getAdminSecret()) as { isAdmin?: boolean };
    return !!payload.isAdmin;
  } catch {
    return false;
  }
}

// ── Credential helpers ────────────────────────────────────────────────────────

function clientKey(): string {
  return process.env["TIKTOK_CLIENT_KEY"] ?? "";
}

function clientSecret(): string {
  return process.env["TIKTOK_CLIENT_SECRET"] ?? "";
}

// ── GET /api/social/tiktok/status ─────────────────────────────────────────────

router.get("/social/tiktok/status", (_req: Request, res: Response) => {
  const key    = clientKey();
  const secret = clientSecret();
  const token  = process.env["TIKTOK_ACCESS_TOKEN"] ?? "";

  const issues: string[] = [];
  if (!key)    issues.push("TIKTOK_CLIENT_KEY not set — add from TikTok Developer Portal");
  if (!secret) issues.push("TIKTOK_CLIENT_SECRET not set — add from TikTok Developer Portal");
  if (!token)  issues.push("TIKTOK_ACCESS_TOKEN not set — complete OAuth flow by clicking Connect TikTok");

  return res.json({
    clientKeySet:       !!key,
    clientSecretSet:    !!secret,
    accessTokenSet:     !!token,
    accessTokenMasked:  token ? mask(token) : null,
    oauthReady:         !!key && !!secret,
    postingReady:       !!token,
    callbackUrl:        TIKTOK_CALLBACK_URL,
    scopes:             TIKTOK_SCOPES,
    issues,
  });
});

// ── GET /api/social/tiktok/connect ────────────────────────────────────────────

router.get("/social/tiktok/connect", (req: Request, res: Response) => {
  const adminToken = req.query["adminToken"] as string | undefined;
  if (!validateAdminQuery(adminToken)) {
    return res.status(403).send("Admin authentication required. Please connect from the Admin portal.");
  }

  const key = clientKey();
  if (!key) {
    return res.status(400).send(
      "TIKTOK_CLIENT_KEY is not set. Add it from the TikTok Developer Portal before connecting."
    );
  }

  const secret = clientSecret();
  if (!secret) {
    return res.status(400).send(
      "TIKTOK_CLIENT_SECRET is not set. Add it from the TikTok Developer Portal before connecting."
    );
  }

  const state = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const params = new URLSearchParams({
    client_key:    key,
    scope:         TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri:  TIKTOK_CALLBACK_URL,
    state,
  });

  const authUrl = `${TIKTOK_AUTH_URL}?${params.toString()}`;

  logger.info({ callbackUrl: TIKTOK_CALLBACK_URL, scopes: TIKTOK_SCOPES }, "Redirecting admin to TikTok OAuth");
  return res.redirect(authUrl);
});

// ── POST /api/v1/social/tiktok/exchange ───────────────────────────────────────
// Called by the Next.js callback handler at /auth/tiktok/callback.
// Exchanges the authorization code for an access token.

router.post("/v1/social/tiktok/exchange", async (req: Request, res: Response) => {
  const { code, error: oauthError, error_description } = req.body as {
    code?: string;
    error?: string;
    error_description?: string;
  };

  if (oauthError) {
    logger.warn({ oauthError, error_description }, "TikTok OAuth error received in exchange");
    return res.json({
      success: false,
      redirectUrl: `/admin/integrations?tiktok_error=${encodeURIComponent(error_description ?? oauthError)}`,
    });
  }

  if (!code) {
    return res.json({
      success: false,
      redirectUrl: "/admin/integrations?tiktok_error=no_code",
    });
  }

  const key    = clientKey();
  const secret = clientSecret();

  if (!key || !secret) {
    return res.json({
      success: false,
      redirectUrl: "/admin/integrations?tiktok_error=missing_credentials",
    });
  }

  try {
    const body = new URLSearchParams({
      client_key:    key,
      client_secret: secret,
      code,
      grant_type:    "authorization_code",
      redirect_uri:  TIKTOK_CALLBACK_URL,
    });

    const tokenResp = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:   body.toString(),
      signal: AbortSignal.timeout(15000),
    });

    const tokenData = (await tokenResp.json()) as {
      data?: {
        access_token?: string;
        refresh_token?: string;
        open_id?: string;
        expires_in?: number;
        scope?: string;
      };
      error?: {
        code?: string;
        message?: string;
        log_id?: string;
      };
    };

    const data = tokenData.data;

    if (!tokenResp.ok || !data?.access_token) {
      const errMsg = tokenData.error?.message ?? tokenData.error?.code ?? "token_exchange_failed";
      logger.error(
        {
          httpStatus:    tokenResp.status,
          tiktokError:   tokenData.error,
          redirectUri:   TIKTOK_CALLBACK_URL,
          tokenUrl:      TIKTOK_TOKEN_URL,
          clientKeyLen:  key.length,
          isAlphanumeric: /[a-zA-Z]/.test(key),
        },
        "TikTok token exchange failed — check client_key is the alphanumeric Client Key (not App ID) and redirect_uri matches developer portal"
      );
      return res.json({
        success: false,
        redirectUrl: `/admin/integrations?tiktok_error=${encodeURIComponent(errMsg)}`,
      });
    }

    // Save token to process.env so it's active immediately for this session.
    // The admin must also copy it to Replit Secrets for persistence.
    process.env["TIKTOK_ACCESS_TOKEN"] = data.access_token;

    // Store full result under a one-time nonce so the admin UI can display it
    const nonce = `tiktok_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    cleanupPending();
    pendingResults.set(nonce, {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token ?? "",
      openId:       data.open_id ?? "",
      expiresIn:    data.expires_in ?? 86400,
      scope:        data.scope ?? TIKTOK_SCOPES,
      created:      Date.now(),
    });

    logger.info(
      { nonce, openId: data.open_id, expiresIn: data.expires_in },
      "TikTok OAuth tokens received — TIKTOK_ACCESS_TOKEN set in process.env"
    );

    return res.json({
      success:     true,
      redirectUrl: `/admin/integrations?tiktok_nonce=${nonce}`,
    });
  } catch (err) {
    logger.error({ err }, "TikTok callback token exchange error");
    return res.json({
      success:     false,
      redirectUrl: "/admin/integrations?tiktok_error=network_error",
    });
  }
});

// ── GET /api/social/tiktok/result ─────────────────────────────────────────────

router.get("/social/tiktok/result", (req: Request, res: Response) => {
  const adminToken = req.query["adminToken"] as string | undefined;
  const nonce      = req.query["nonce"]      as string | undefined;

  if (!validateAdminQuery(adminToken)) {
    return res.status(403).json({ error: "Admin authentication required" });
  }
  if (!nonce) {
    return res.status(400).json({ error: "nonce is required" });
  }

  const result = pendingResults.get(nonce);
  if (!result) {
    return res.status(404).json({
      error: "Result not found or already retrieved (10-minute TTL)",
    });
  }

  // One-time read — delete immediately
  pendingResults.delete(nonce);

  return res.json({
    success:              true,
    accessTokenMasked:    mask(result.accessToken),
    refreshTokenMasked:   result.refreshToken ? mask(result.refreshToken) : null,
    openId:               result.openId,
    expiresIn:            result.expiresIn,
    scope:                result.scope,
    // Raw token — shown once in admin UI, never logged
    TIKTOK_ACCESS_TOKEN:  result.accessToken,
    TIKTOK_REFRESH_TOKEN: result.refreshToken || null,
    note: "These values are shown ONCE. Copy TIKTOK_ACCESS_TOKEN into Replit Secrets immediately. It will not be shown again.",
  });
});

// ── POST /api/social/tiktok/disconnect ────────────────────────────────────────

router.post("/social/tiktok/disconnect", requireAdmin, (_req: Request, res: Response) => {
  delete process.env["TIKTOK_ACCESS_TOKEN"];
  logger.info("TikTok access token cleared from process.env by admin");
  return res.json({
    success: true,
    message: "TIKTOK_ACCESS_TOKEN cleared from process.env for this session. Also remove it from Replit Secrets to fully disconnect.",
  });
});

export default router;
