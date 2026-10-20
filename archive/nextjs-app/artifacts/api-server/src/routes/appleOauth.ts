/**
 * Apple Sign In — Authorization Code flow with form_post.
 *
 * Routes:
 *   GET  /api/v1/auth/apple           → redirect to Apple consent screen
 *   POST /api/v1/auth/apple/callback  → Apple POSTs here with code + optional user
 *
 * No extra npm packages needed:
 *   - Client secret generation: jsonwebtoken (already a dep) with ES256
 *   - Token exchange: native fetch
 *   - id_token decode: jwt.decode (no sig verify needed — response is server-to-server)
 */

import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getCollection } from "../lib/mongo.js";
import { signToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { addTokens, SIGNUP_BONUS } from "../services/tokenService.js";
import { sendWelcomeEmail } from "../lib/email.js";

const router = Router();

const PRODUCTION_ORIGIN       = "https://worlddigital.ai";
// This URI must match EXACTLY what is registered in Apple Developer Console
// → Services → Sign In with Apple → Redirect URIs
const APPLE_CALLBACK_URI      = "https://worlddigital.ai/auth/apple/callback";
const APPLE_TOKEN_ENDPOINT    = "https://appleid.apple.com/auth/token";
const APPLE_AUTHORIZE_ENDPOINT = "https://appleid.apple.com/auth/authorize";

// ── Config helpers ────────────────────────────────────────────────────────────

function getAppleSecrets() {
  return {
    clientId:   process.env["APPLE_CLIENT_ID"]   ?? "",
    keyId:      process.env["APPLE_KEY_ID"]       ?? "",
    teamId:     process.env["APPLE_TEAM_ID"]      ?? "",
    privateKey: process.env["APPLE_PRIVATE_KEY"]  ?? "",
  };
}

function isAppleConfigured(): boolean {
  const s = getAppleSecrets();
  return !!(s.clientId && s.keyId && s.teamId && s.privateKey);
}

/**
 * Normalise the APPLE_PRIVATE_KEY env var into a valid PEM string.
 *
 * The secret may arrive in several forms:
 *   1. Full PEM  — already has -----BEGIN PRIVATE KEY----- headers
 *   2. Literal \n — env var stored with \n escape sequences (common in Replit)
 *   3. Raw base64 — just the base64 body, possibly with spaces/line-breaks stripped
 *
 * All three are handled and produce a properly-formatted PEM for jsonwebtoken.
 */
function normalisePem(raw: string): string {
  // Form 1 — already valid PEM (real or literal \n headers)
  const withReal = raw.replace(/\\n/g, "\n").trim();
  if (withReal.includes("-----BEGIN")) return withReal;

  // Form 3 — raw base64 body (strip any whitespace then wrap in PEM headers)
  const b64 = raw.replace(/\s+/g, "");
  const lines = (b64.match(/.{1,64}/g) ?? []).join("\n");
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

/**
 * Apple requires a short-lived JWT signed with your ES256 private key as the
 * client_secret for every token exchange.  Generate one per request.
 */
function generateClientSecret(): string {
  const { clientId, keyId, teamId, privateKey } = getAppleSecrets();

  const pemKey = normalisePem(privateKey);

  logger.info(
    {
      keyId,
      teamId,
      clientId,
      pemFirstLine: pemKey.split("\n")[0],
      pemLines: pemKey.split("\n").length,
    },
    "Apple OAuth — generating client secret JWT"
  );

  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: teamId,
      iat: now,
      exp: now + 86_400 * 180,       // 180 days (Apple's max)
      aud: "https://appleid.apple.com",
      sub: clientId,
    },
    pemKey,
    {
      algorithm: "ES256",
      header:    { alg: "ES256", kid: keyId } as object,
    } as jwt.SignOptions
  );
}

// ── Shared types ──────────────────────────────────────────────────────────────

interface AppleIdTokenPayload {
  sub:             string;        // Unique stable Apple user ID
  email?:          string;
  email_verified?: boolean;
}

interface AppleTokenResponse {
  id_token?:     string;
  access_token?: string;
  error?:        string;
}

interface UserDoc {
  _id:                ObjectId;
  email:              string;
  name:               string;
  passwordHash:       string;
  role:               "user" | "admin";
  subscriptionStatus: "none" | "active" | "paused" | "cancelled";
  appleId?:           string;
  googleId?:          string;
  avatarUrl?:         string;
  createdAt:          Date;
}

// ── GET /v1/auth/apple ────────────────────────────────────────────────────────

router.get("/v1/auth/apple", (req: Request, res: Response) => {
  if (!isAppleConfigured()) {
    res.redirect(`${PRODUCTION_ORIGIN}/login?error=${encodeURIComponent("Apple Sign In is not available. Please use email or Google to sign in.")}`);
    return;
  }

  const { clientId } = getAppleSecrets();

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  APPLE_CALLBACK_URI,
    response_type: "code",
    scope:         "name email",
    response_mode: "form_post",
  });

  logger.info({ redirectUri: APPLE_CALLBACK_URI }, "Apple OAuth — redirecting to Apple");
  res.redirect(`${APPLE_AUTHORIZE_ENDPOINT}?${params.toString()}`);
});

// ── POST /v1/auth/apple/callback ──────────────────────────────────────────────
// This endpoint is called internally by the Next.js route handler at
// /auth/apple/callback (the URL registered with Apple).  It returns JSON
// { redirectUrl } instead of res.redirect() so that Node.js fetch() in the
// Next.js proxy can reliably read the target URL without hitting the opaque-
// redirect / ECONNREFUSED issues that affect redirect: "manual" on port 80.

router.post("/v1/auth/apple/callback", async (req: Request, res: Response) => {
  const frontend = PRODUCTION_ORIGIN;

  /** Send a JSON response telling the Next.js proxy where to redirect. */
  function jsonRedirect(url: string, status = 200): void {
    res.status(status).json({ redirectUrl: url });
  }

  const {
    code,
    error:  appleError,
    user:   userJson,  // JSON string — only present on very first authorization
  } = req.body as Record<string, string | undefined>;

  // User denied or something went wrong on Apple's side.
  if (appleError) {
    logger.warn({ appleError }, "Apple OAuth denied or cancelled");
    jsonRedirect(`${frontend}/login?error=${encodeURIComponent("Apple sign-in was cancelled")}`);
    return;
  }

  if (!code) {
    jsonRedirect(`${frontend}/login?error=${encodeURIComponent("No authorization code received from Apple")}`);
    return;
  }

  if (!isAppleConfigured()) {
    jsonRedirect(`${frontend}/login?error=${encodeURIComponent("Apple Sign In is not configured on this server")}`);
    return;
  }

  try {
    // 1. Generate client secret JWT ──────────────────────────────────────────
    let clientSecret: string;
    try {
      clientSecret = generateClientSecret();
    } catch (err) {
      logger.error({ err }, "Apple OAuth — failed to generate client secret");
      jsonRedirect(`${frontend}/login?error=${encodeURIComponent("Apple Sign In configuration error")}`);
      return;
    }

    const { clientId } = getAppleSecrets();

    // 2. Exchange authorization code for id_token ────────────────────────────
    const tokenRes = await fetch(APPLE_TOKEN_ENDPOINT, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        code,
        grant_type:    "authorization_code",
        redirect_uri:  APPLE_CALLBACK_URI,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    const tokenData = await tokenRes.json() as AppleTokenResponse;

    if (!tokenRes.ok || !tokenData.id_token) {
      logger.error(
        { status: tokenRes.status, appleError: tokenData.error },
        "Apple token exchange failed"
      );
      jsonRedirect(`${frontend}/login?error=${encodeURIComponent("Apple sign-in failed. Please try again.")}`);
      return;
    }

    // 3. Decode id_token — safe to trust since we got it server-to-server ────
    const payload = jwt.decode(tokenData.id_token) as AppleIdTokenPayload | null;

    if (!payload?.sub) {
      logger.error({}, "Apple id_token missing sub claim");
      jsonRedirect(`${frontend}/login?error=${encodeURIComponent("Apple did not return a user identifier")}`);
      return;
    }

    const appleId = payload.sub;
    let   email   = payload.email?.toLowerCase() ?? null;
    // Empty string intentionally — Apple only sends name on the very first
    // sign-in.  Subsequent logins will have no name data from Apple, and we
    // must never fabricate a name ("Apple", "Apple User", etc.).
    // If the user previously saved a name we preserve it; if not, the
    // dashboard prompts them to complete their profile.
    let   name    = "";

    // Apple only sends name in the POST body on the VERY FIRST sign-in.
    if (userJson) {
      try {
        const parsed = typeof userJson === "string" ? JSON.parse(userJson) : userJson;
        const first  = (parsed as Record<string, Record<string, string>>).name?.firstName ?? "";
        const last   = (parsed as Record<string, Record<string, string>>).name?.lastName  ?? "";
        const full   = [first, last].filter(Boolean).join(" ").trim();
        if (full) name = full;
        // Some clients pass email here too — prefer id_token but fall back
        if (!email && (parsed as Record<string, string>).email) {
          email = ((parsed as Record<string, string>).email as string).toLowerCase();
        }
      } catch { /* ignore */ }
    }

    if (!email) {
      jsonRedirect(
        `${frontend}/login?error=${encodeURIComponent(
          "Apple did not return an email. Please try again or sign in with email."
        )}`
      );
      return;
    }

    // 4. Find or create user in MongoDB ──────────────────────────────────────
    const users = getCollection<UserDoc>("users");

    // Match by appleId first, then fall back to email (links existing account)
    let user = await users.findOne({
      $or: [{ appleId }, { email }],
    });

    if (user) {
      // Build the $set patch for the existing user
      const patch: Partial<UserDoc> = {};

      // Link appleId if this account was found by email only
      if (!user.appleId) {
        patch.appleId = appleId;
        logger.info({ userId: user._id.toHexString() }, "Apple OAuth — linked appleId to existing account");
      }

      // Apple only sends the real name on the very first authorisation.
      // Accept it if we received one AND the stored name is blank or was a
      // legacy placeholder we want to replace.
      const isPlaceholderName = !user.name || user.name === "Apple User" || user.name === "Apple";
      if (name && isPlaceholderName) {
        patch.name = name;
        logger.info({ userId: user._id.toHexString(), name }, "Apple OAuth — saved name from first-login payload");
      }

      if (Object.keys(patch).length > 0) {
        await users.updateOne({ _id: user._id }, { $set: patch });
        // Reflect patch in the in-memory user so the JWT is accurate
        user = { ...user, ...patch };
      }

      logger.info({ userId: user._id.toHexString(), email }, "Apple OAuth — existing user logged in");
    } else {
      const result = await users.insertOne({
        _id:                new ObjectId(),
        email,
        name,
        passwordHash:       "",     // OAuth-only — no password
        role:               "user",
        subscriptionStatus: "none",
        appleId,
        createdAt:          new Date(),
      });
      user = await users.findOne({ _id: result.insertedId });
      addTokens(result.insertedId.toHexString(), SIGNUP_BONUS, "signup_bonus", "Welcome bonus — 25 free tokens on registration").catch(() => {});
      sendWelcomeEmail(email, name || email.split("@")[0] || "there").catch(() => {});
      logger.info({ userId: result.insertedId.toHexString(), email }, "Apple OAuth — new user created");
    }

    if (!user) {
      jsonRedirect(`${frontend}/login?error=${encodeURIComponent("Account creation failed")}`);
      return;
    }

    // 5. Issue our JWT and return redirect URL to the Next.js proxy ───────────
    const token  = signToken({ userId: user._id.toHexString(), email: user.email, role: user.role });
    // Always send to /dashboard — new users are nudged to subscribe from within
    // the dashboard rather than being blocked at a paywall on first login.
    logger.info({ userId: user._id.toHexString() }, "Apple OAuth — success, issuing token");
    jsonRedirect(
      `${frontend}/auth/callback?token=${encodeURIComponent(token)}&redirect=/dashboard`
    );
  } catch (err) {
    logger.error({ err }, "Apple OAuth callback error");
    jsonRedirect(`${frontend}/login?error=${encodeURIComponent("Apple sign-in failed. Please try again.")}`);
  }
});

export default router;
