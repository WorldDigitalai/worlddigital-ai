/**
 * Google OAuth 2.0 — authorization code flow.
 * No extra packages needed; uses native fetch + the existing JWT/Mongo helpers.
 *
 * Routes (mounted at /api by Express):
 *   GET /api/v1/auth/google           → redirect to Google consent screen
 *   GET /api/v1/auth/google/callback  → exchange code, create/find user, issue JWT
 */

import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../lib/mongo.js";
import { signToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { addTokens, SIGNUP_BONUS } from "../services/tokenService.js";
import { sendWelcomeEmail } from "../lib/email.js";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Hardcoded production URIs ─────────────────────────────────────────────────
// These are the canonical values registered in Google Cloud Console.
// Using a single source of truth eliminates any risk of a wrong env var or
// header-derived URI causing a token-exchange mismatch with Google.
const PRODUCTION_CALLBACK_URI = "https://worlddigital.ai/api/v1/auth/google/callback";
const PRODUCTION_ORIGIN       = "https://worlddigital.ai";

/** Always returns the hardcoded production callback URI.
 *  Google Cloud Console → Credentials → Authorized redirect URIs must list:
 *    https://worlddigital.ai/api/v1/auth/google/callback
 */
function buildCallbackUrl(_req: Request): string {
  logger.info({ redirectUri: PRODUCTION_CALLBACK_URI }, "Google OAuth — redirect URI");
  return PRODUCTION_CALLBACK_URI;
}

/** Always returns the hardcoded production frontend origin. */
function frontendOrigin(_req: Request): string {
  return PRODUCTION_ORIGIN;
}

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

interface OAuthUserDoc {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: "user" | "admin";
  subscriptionStatus: "none" | "active" | "paused" | "cancelled";
  googleId?: string;
  avatarUrl?: string;
  googleRefreshToken?: string;
  createdAt: Date;
}

// ── GET /api/v1/auth/google ───────────────────────────────────────────────────

router.get("/v1/auth/google", (req: Request, res: Response) => {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  if (!clientId) {
    res.status(503).json({ error: "Google OAuth is not configured (GOOGLE_CLIENT_ID missing)" });
    return;
  }

  const redirectUri = buildCallbackUrl(req);
  logger.info({ redirectUri }, "Google OAuth — redirect URI (add this to Google Console if not already)");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/bigquery",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    hl: "en",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// ── GET /api/v1/auth/google/callback ─────────────────────────────────────────

router.get("/v1/auth/google/callback", async (req: Request, res: Response) => {
  const { code, error: oauthError } = req.query as Record<string, string>;
  const frontend = frontendOrigin(req);

  if (oauthError) {
    logger.warn({ oauthError }, "Google OAuth error or denied by user");
    const msg = oauthError === "access_denied"
      ? "Google sign-in is currently restricted to approved users. Please sign in with your email and password, or contact support@worlddigital.ai for access."
      : "Google sign-in was cancelled or failed. Please try again.";
    res.redirect(`${frontend}/login?error=${encodeURIComponent(msg)}`);
    return;
  }

  if (!code) {
    res.redirect(`${frontend}/login?error=${encodeURIComponent("No authorization code received from Google")}`);
    return;
  }

  const clientId = process.env["GOOGLE_CLIENT_ID"]!;
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  const redirectUri = buildCallbackUrl(req);

  if (!clientSecret) {
    res.redirect(`${frontend}/login?error=${encodeURIComponent("Google OAuth is not fully configured")}`);
    return;
  }

  try {
    // 1. Exchange authorization code for access token ──────────────────────
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const tokenData = await tokenRes.json() as GoogleTokenResponse;

    if (!tokenRes.ok || !tokenData.access_token) {
      const msg = tokenData.error_description ?? tokenData.error ?? "Token exchange failed";
      logger.error({ msg, status: tokenRes.status }, "Google token exchange failed");
      res.redirect(`${frontend}/login?error=${encodeURIComponent("Google sign-in failed: " + msg)}`);
      return;
    }

    // 2. Fetch Google user profile ─────────────────────────────────────────
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(8_000),
    });

    if (!userRes.ok) {
      res.redirect(`${frontend}/login?error=${encodeURIComponent("Could not fetch Google profile")}`);
      return;
    }

    const googleUser = await userRes.json() as GoogleUserInfo;
    const { sub: googleId, email, name, picture } = googleUser;

    if (!email) {
      res.redirect(`${frontend}/login?error=${encodeURIComponent("Google did not return an email address")}`);
      return;
    }

    // 3. Find or create user in MongoDB ───────────────────────────────────
    const users = getCollection<OAuthUserDoc>("users");
    let user = await users.findOne({ email: email.toLowerCase() });

    if (user) {
      // Link Google ID and persist refresh_token if not already present
      const refreshFields: Record<string, string | undefined> = {};
      if (!user.googleId) { refreshFields.googleId = googleId; refreshFields.avatarUrl = picture; }
      if (tokenData.refresh_token) refreshFields.googleRefreshToken = tokenData.refresh_token;
      if (Object.keys(refreshFields).length) {
        await users.updateOne({ _id: user._id }, { $set: refreshFields });
      }
      logger.info({ userId: user._id.toHexString(), email }, "Google OAuth — existing user logged in");
    } else {
      // Create new user (no password — OAuth only)
      const result = await users.insertOne({
        _id: new ObjectId(),
        email: email.toLowerCase(),
        name: name ?? email.split("@")[0] ?? "User",
        passwordHash: "",   // OAuth users have no password
        role: "user",
        subscriptionStatus: "none",
        googleId,
        avatarUrl: picture,
        createdAt: new Date(),
      });
      user = await users.findOne({ _id: result.insertedId });
      addTokens(result.insertedId.toHexString(), SIGNUP_BONUS, "signup_bonus", "Welcome bonus — 25 free tokens on registration").catch(() => {});
      sendWelcomeEmail(email.toLowerCase(), name ?? email.split("@")[0] ?? "there").catch(() => {});
      logger.info({ userId: result.insertedId.toHexString(), email }, "Google OAuth — new user created");
    }

    if (!user) {
      res.redirect(`${frontend}/login?error=${encodeURIComponent("Account creation failed")}`);
      return;
    }

    // 4. Issue JWT and redirect to frontend ───────────────────────────────
    const token = signToken({ userId: user._id.toHexString(), email: user.email, role: user.role });

    // Always send to /dashboard — new users are nudged to subscribe from within
    // the dashboard rather than being blocked at a paywall on first login.
    res.redirect(
      `${frontend}/auth/callback?token=${encodeURIComponent(token)}&redirect=/dashboard`
    );
  } catch (err) {
    logger.error({ err }, "Google OAuth callback error");
    res.redirect(`${frontend}/login?error=${encodeURIComponent("Google sign-in failed. Please try again.")}`);
  }
});

export default router;
