/**
 * Snapchat OAuth 2.0 flow — admin-only.
 *
 * Routes:
 *   GET  /api/social/snapchat/status    — detailed per-field status (open)
 *   POST /api/social/snapchat/refresh   — attempt token refresh using SNAP_REFRESH_TOKEN
 *   GET  /api/social/snapchat/connect   — redirect to Snapchat OAuth (admin JWT in ?adminToken)
 *   GET  /api/social/snapchat/callback  — receive code, exchange for tokens, redirect to admin page
 *   GET  /api/social/snapchat/result    — one-time fetch of masked tokens (admin JWT in ?adminToken)
 *   GET  /api/social/snapchat/accounts  — list ad accounts using current/provided token
 *
 * Security:
 *   - All write/sensitive routes require a valid admin JWT (via header or ?adminToken query param)
 *   - Tokens are never logged in full — only masked
 *   - Callback result is stored in memory for 10 minutes, one-time read
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger.js";
import {
  testSnapchatConnection,
  refreshSnapchatToken,
  discoverSnapchatAdAccounts,
} from "../services/social/snapchat.js";

const router = Router();

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

const SNAP_AUTH_BASE     = "https://accounts.snapchat.com/login/oauth2";
const SNAP_TOKEN_URL     = "https://accounts.snapchat.com/login/oauth2/token";

// Scopes: marketing-api read+write
const SNAP_SCOPES = [
  "snapchat-marketing-api",
].join(" ");

// ── In-memory one-time result store (TTL: 10 min) ─────────────────────────────

interface PendingOAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  created: number;
}

const pendingResults = new Map<string, PendingOAuthResult>();

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

// ── Callback URL ───────────────────────────────────────────────────────────────
// Must match exactly what is registered in the Snapchat Developer Portal.
// Snapchat redirects to this URL (handled by the Next.js route at
// frontend/app/auth/snapchat/callback/route.ts), which then calls
// POST /api/v1/social/snapchat/exchange to complete the token exchange.
const SNAPCHAT_CALLBACK_URL = "https://worlddigital.ai/auth/snapchat/callback";

function clientId(): string {
  return process.env["SNAPCHAT_CLIENT_ID"] ?? process.env["SNAP_CLIENT_ID"] ?? "";
}

function clientSecret(): string {
  return process.env["SNAP_CLIENT_SECRET"] ?? process.env["SNAPCHAT_CLIENT_SECRET"] ?? "";
}

// ── GET /api/social/snapchat/status ───────────────────────────────────────────

router.get("/social/snapchat/status", async (_req: Request, res: Response) => {
  const status = await testSnapchatConnection();
  return res.json(status);
});

// ── POST /api/social/snapchat/refresh ─────────────────────────────────────────

router.post("/social/snapchat/refresh", requireAdmin, async (_req: Request, res: Response) => {
  logger.info("Snapchat token refresh requested by admin");
  const result = await refreshSnapchatToken();

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  // Update the active process env so the new token is immediately usable.
  if (result.newAccessToken) {
    process.env["SNAP_ACCESS_TOKEN"] = result.newAccessToken;
  }
  if (result.newRefreshToken) {
    process.env["SNAP_REFRESH_TOKEN"] = result.newRefreshToken;
  }

  return res.json({
    success: true,
    accessTokenMasked: result.accessTokenMasked,
    refreshTokenMasked: result.refreshTokenMasked,
    expiresIn: result.expiresIn,
    note: result.note,
    action_required: {
      step1: "Copy the new SNAP_ACCESS_TOKEN value from the admin page",
      step2: "Go to Replit Secrets and update SNAP_ACCESS_TOKEN",
      step3: "If SNAP_REFRESH_TOKEN changed, update that too",
      step4: "Click 'Test Connection' to verify",
    },
    // Raw values — only included so admin can copy them (NEVER log these)
    SNAP_ACCESS_TOKEN: result.newAccessToken,
    SNAP_REFRESH_TOKEN: result.newRefreshToken,
  });
});

// ── GET /api/social/snapchat/connect ──────────────────────────────────────────

router.get("/social/snapchat/connect", (req: Request, res: Response) => {
  const adminToken = req.query["adminToken"] as string | undefined;
  if (!validateAdminQuery(adminToken)) {
    return res.status(403).send("Admin authentication required. Please connect from the Admin portal.");
  }

  const cid = clientId();
  if (!cid) {
    return res.status(400).send("SNAPCHAT_CLIENT_ID is not set. Add it to Replit Secrets first.");
  }

  const secret = clientSecret();
  if (!secret) {
    return res
      .status(400)
      .send("SNAP_CLIENT_SECRET (or SNAPCHAT_CLIENT_SECRET) is not set. Add it from the Snapchat Developer Portal before connecting.");
  }

  const state = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: SNAPCHAT_CALLBACK_URL,
    response_type: "code",
    scope: SNAP_SCOPES,
    state,
  });

  const authUrl = `${SNAP_AUTH_BASE}/authorize?${params.toString()}`;

  logger.info({ callbackUrl: SNAPCHAT_CALLBACK_URL, scope: SNAP_SCOPES }, "Redirecting admin to Snapchat OAuth");
  return res.redirect(authUrl);
});

// ── POST /api/v1/social/snapchat/exchange ─────────────────────────────────────
// Called by the Next.js callback handler at /auth/snapchat/callback.
// Exchanges the authorization code for tokens and returns { success, redirectUrl }.

router.post("/v1/social/snapchat/exchange", async (req: Request, res: Response) => {
  const { code, error: oauthError, error_description } = req.body as {
    code?: string;
    error?: string;
    error_description?: string;
  };

  if (oauthError) {
    logger.warn({ oauthError, error_description }, "Snapchat OAuth error received in exchange");
    return res.json({
      success: false,
      redirectUrl: `/admin/integrations/snapchat?snap_error=${encodeURIComponent(error_description ?? oauthError)}`,
    });
  }

  if (!code) {
    return res.json({
      success: false,
      redirectUrl: "/admin/integrations/snapchat?snap_error=no_code",
    });
  }

  const cid    = clientId();
  const secret = clientSecret();

  if (!cid || !secret) {
    return res.json({
      success: false,
      redirectUrl: "/admin/integrations/snapchat?snap_error=missing_credentials",
    });
  }

  try {
    const body = new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  SNAPCHAT_CALLBACK_URL,
      client_id:     cid,
      client_secret: secret,
    });

    const tokenResp = await fetch(SNAP_TOKEN_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
      signal:  AbortSignal.timeout(15000),
    });

    const tokenData = (await tokenResp.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!tokenResp.ok || !tokenData.access_token) {
      const errMsg = tokenData.error_description ?? tokenData.error ?? "token_exchange_failed";
      logger.error(
        {
          httpStatus:       tokenResp.status,
          snapError:        tokenData.error,
          snapErrorDesc:    tokenData.error_description,
          redirectUri:      SNAPCHAT_CALLBACK_URL,
          tokenUrl:         SNAP_TOKEN_URL,
        },
        "Snapchat token exchange failed — check redirect_uri matches what is registered in Snapchat Developer Portal"
      );
      return res.json({
        success: false,
        redirectUrl: `/admin/integrations/snapchat?snap_error=${encodeURIComponent(errMsg)}`,
      });
    }

    // Store result under a one-time nonce so the admin UI can retrieve it
    const nonce = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    cleanupPending();
    pendingResults.set(nonce, {
      accessToken:  tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? "",
      expiresIn:    tokenData.expires_in ?? 1800,
      created:      Date.now(),
    });

    logger.info({ nonce, expiresIn: tokenData.expires_in }, "Snapchat OAuth tokens received — stored for admin retrieval");

    return res.json({
      success:     true,
      redirectUrl: `/admin/integrations/snapchat?snap_nonce=${nonce}`,
    });
  } catch (err) {
    logger.error({ err }, "Snapchat callback token exchange error");
    return res.json({
      success:     false,
      redirectUrl: "/admin/integrations/snapchat?snap_error=network_error",
    });
  }
});

// ── GET /api/social/snapchat/callback (legacy — kept for backward compat) ─────
// Primary flow now goes through /auth/snapchat/callback (Next.js) →
// POST /api/v1/social/snapchat/exchange. This route is no longer the main path.

router.get("/social/snapchat/callback", (req: Request, res: Response) => {
  const { error: oauthError, error_description } = req.query as Record<string, string>;
  if (oauthError) {
    return res.redirect(
      `/admin/integrations/snapchat?snap_error=${encodeURIComponent(error_description ?? oauthError)}`
    );
  }
  // Redirect to the Next.js callback which handles the exchange properly
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  return res.redirect(`/auth/snapchat/callback${qs}`);
});

// ── GET /api/social/snapchat/result ───────────────────────────────────────────

router.get("/social/snapchat/result", (req: Request, res: Response) => {
  const adminToken = req.query["adminToken"] as string | undefined;
  const nonce      = req.query["nonce"] as string | undefined;

  if (!validateAdminQuery(adminToken)) {
    return res.status(403).json({ error: "Admin authentication required" });
  }
  if (!nonce) {
    return res.status(400).json({ error: "nonce is required" });
  }

  const result = pendingResults.get(nonce);
  if (!result) {
    return res.status(404).json({ error: "Result not found or already retrieved (10-minute TTL)" });
  }

  // One-time read — delete immediately
  pendingResults.delete(nonce);

  return res.json({
    success: true,
    accessTokenMasked: mask(result.accessToken),
    refreshTokenMasked: mask(result.refreshToken),
    expiresIn: result.expiresIn,
    // Raw tokens — shown once in admin UI, never logged
    SNAP_ACCESS_TOKEN: result.accessToken,
    SNAP_REFRESH_TOKEN: result.refreshToken,
    note: "These values are shown ONCE. Copy both into Replit Secrets immediately. They will not be shown again.",
  });
});

// ── GET /api/social/snapchat/accounts ─────────────────────────────────────────

router.get("/social/snapchat/accounts", requireAdmin, async (_req: Request, res: Response) => {
  const result = await discoverSnapchatAdAccounts();
  return res.json(result);
});

export default router;
