import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getCollection } from "../lib/mongo.js";
import { signToken, verifyToken, extractTokenFromHeader } from "../lib/jwt.js";
import { verifyRecaptcha } from "../lib/recaptcha.js";
import { sendWelcomeEmail, sendForgotPasswordEmail } from "../lib/email.js";
import { logger } from "../lib/logger.js";
import { addTokens, SIGNUP_BONUS } from "../services/tokenService.js";
import type { AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: "user" | "admin";
  subscriptionStatus: "none" | "active" | "paused" | "cancelled";
  stripeCustomerId?: string;
  createdAt: Date;
}

router.get("/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "worlddigitalai-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/auth/debug — safe health check for auth layer (no secrets exposed)
router.get("/v1/auth/debug", async (_req, res) => {
  const mongoUri = process.env["MONGODB_URI"] || "";
  const mongoUriValid = mongoUri.startsWith("mongodb://") || mongoUri.startsWith("mongodb+srv://");
  let mongoConnected = false;
  if (mongoUriValid) {
    try {
      const { pingMongo } = await import("../lib/mongo.js");
      mongoConnected = await pingMongo();
    } catch { mongoConnected = false; }
  }
  res.json({
    server_working: true,
    mongodb_uri_exists: !!mongoUri,
    mongodb_uri_valid_scheme: mongoUriValid,
    mongodb_uri_issue: !mongoUriValid ? "URI does not start with mongodb:// or mongodb+srv:// — check the MONGODB_URI secret" : null,
    mongodb_connected: mongoConnected,
    session_secret_exists: !!process.env["SESSION_SECRET"],
    access_token_secret_exists: !!process.env["ACCESS_TOKEN_SECRET"],
    cors_ok: true,
    next_public_api_url: process.env["NEXT_PUBLIC_API_URL"] || "(not set — using relative /api)",
    frontend_url: process.env["FRONTEND_URL"] || "(not set)",
    auth_routes: ["/api/v1/auth/signup", "/api/v1/auth/login", "/api/v1/auth/logout", "/api/v1/auth/me"],
  });
});

router.post("/v1/auth/signup", async (req: Request, res: Response) => {
  const { email, password, name, recaptchaToken } = req.body ?? {};

  if (!email || !password || !name) {
    res.status(400).json({ message: "email, password, and name are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }

  if (recaptchaToken) {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      res.status(400).json({ message: "reCAPTCHA verification failed" });
      return;
    }
  }

  try {
    const users = getCollection<UserDoc>("users");
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      const rec = existing as Record<string, unknown>;
      const hasGoogle = !!rec["googleId"];
      const hasPassword = !!(rec["passwordHash"] && String(rec["passwordHash"]).length > 0);
      logger.warn(
        { email: email.toLowerCase(), hasGoogle, hasPassword },
        "Signup attempt with existing email"
      );
      res.status(409).json({
        code: "EMAIL_EXISTS",
        message: "An account already exists for this email. Please log in or reset your password.",
        hasGoogle,
        hasPassword,
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const result = await users.insertOne({
      _id: new ObjectId(),
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: "user",
      subscriptionStatus: "none",
      createdAt: now,
    });

    const userId = result.insertedId.toHexString();
    const token = signToken({ userId, email: email.toLowerCase(), role: "user" });

    sendWelcomeEmail(email.toLowerCase(), name).catch(() => {});
    addTokens(userId, SIGNUP_BONUS, "signup_bonus", "Welcome bonus — 25 free tokens on registration").catch(() => {});

    logger.info({ userId, email: email.toLowerCase() }, "New user signed up");
    res.status(201).json({
      token,
      user: { id: userId, email: email.toLowerCase(), name, role: "user", subscriptionStatus: "none" },
    });
  } catch (err) {
    logger.error({ err }, "Signup error");
    res.status(500).json({ message: "Signup failed. Please try again." });
  }
});

router.post("/v1/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ message: "email and password are required" });
    return;
  }

  try {
    const users = getCollection<UserDoc>("users");
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user._id.toHexString(), email: user.email, role: user.role });
    logger.info({ userId: user._id.toHexString() }, "User logged in");
    res.json({
      token,
      user: {
        id: user._id.toHexString(),
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.post("/v1/auth/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

router.post("/v1/auth/refresh", (req: Request, res: Response) => {
  const token = extractTokenFromHeader(req.headers["authorization"]);
  if (!token) {
    res.status(401).json({ message: "Token required" });
    return;
  }
  try {
    const payload = verifyToken(token);
    const newToken = signToken({ userId: payload.userId, email: payload.email, role: payload.role });
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

router.get("/v1/auth/me", async (req: AuthRequest, res: Response) => {
  const token = extractTokenFromHeader(req.headers["authorization"]);
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  try {
    const payload = verifyToken(token);
    const users = getCollection<UserDoc>("users");
    const user = await users.findOne({ _id: new ObjectId(payload.userId) });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      id: user._id.toHexString(),
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

router.post("/v1/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email) {
    res.status(400).json({ message: "email is required" });
    return;
  }

  const SUCCESS_MSG = "If an account with that email exists, a reset link has been sent.";

  try {
    const users = getCollection("users");
    const user = await users.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      // Don't reveal whether the account exists
      res.json({ message: SUCCESS_MSG });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const resetTokens = getCollection("passwordResetTokens");
    // Invalidate any prior tokens for this email
    await resetTokens.updateMany({ email: user.email, used: false }, { $set: { used: true } });
    await resetTokens.insertOne({ email: user.email, token, expiresAt, used: false, createdAt: new Date() });

    const domain = (process.env["REPLIT_DOMAINS"] || "").split(",")[0]?.trim() || "localhost";
    const resetUrl = `https://${domain}/reset-password?token=${token}`;

    await sendForgotPasswordEmail(user.email as string, resetUrl);
    logger.info({ email: user.email }, "Password reset email sent");
  } catch (err) {
    logger.error({ err }, "forgot-password error");
  }

  res.json({ message: SUCCESS_MSG });
});

router.post("/v1/auth/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  if (!token || !password) {
    res.status(400).json({ message: "token and password are required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters." });
    return;
  }

  try {
    const resetTokens = getCollection("passwordResetTokens");
    const record = await resetTokens.findOne({ token, used: false });

    if (!record) {
      res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
      return;
    }
    if (new Date() > record["expiresAt"]) {
      await resetTokens.updateOne({ token }, { $set: { used: true } });
      res.status(400).json({ message: "Reset link has expired. Please request a new one." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const users = getCollection("users");
    await users.updateOne({ email: record["email"] }, { $set: { passwordHash, updatedAt: new Date() } });
    await resetTokens.updateOne({ token }, { $set: { used: true } });

    logger.info({ email: record["email"] }, "Password reset successfully");
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    logger.error({ err }, "reset-password error");
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

export default router;
