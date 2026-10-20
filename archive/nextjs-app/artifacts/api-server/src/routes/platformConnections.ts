import { Router, type IRouter, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const SUPPORTED_PLATFORMS = [
  "meta", "google", "tiktok", "snapchat", "linkedin", "x", "youtube"
];

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta (Facebook/Instagram)",
  google: "Google Ads",
  tiktok: "TikTok",
  snapchat: "Snapchat",
  linkedin: "LinkedIn",
  x: "X / Twitter",
  youtube: "YouTube",
};

// ── GET /v1/dashboard/platforms ────────────────────────────────────────────────────────────
router.get("/v1/dashboard/platforms", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const col = getCollection<{
      userId: string;
      platform: string;
      connected: boolean;
      accountName?: string;
      connectedAt?: Date;
    }>("userPlatformTokens");
    const connections = await col.find({ userId }).toArray();

    const map: Record<string, { connected: boolean; accountName?: string; connectedAt?: Date }> = {};
    for (const p of SUPPORTED_PLATFORMS) {
      const c = connections.find(c => c.platform === p);
      map[p] = {
        connected: c?.connected ?? false,
        accountName: c?.accountName,
        connectedAt: c?.connectedAt,
      };
    }

    res.json({
      platforms: SUPPORTED_PLATFORMS.map(p => ({
        id: p,
        name: PLATFORM_LABELS[p] || p,
        ...map[p],
      })),
    });
  } catch (err) {
    logger.error({ err }, "Platform connections fetch failed");
    res.status(500).json({ message: "Failed to load platform connections" });
  }
});

// ── POST /v1/dashboard/platforms/:platform/connect ─────────────────────
router.post("/v1/dashboard/platforms/:platform/connect", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const platform = req.params["platform"] as string;
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      res.status(400).json({ message: `Unsupported platform: ${platform}` });
      return;
    }

    const { accountName, accessToken, refreshToken, expiresAt, metadata } = req.body ?? {};

    const col = getCollection<Record<string, unknown>>("userPlatformTokens");
    await col.updateOne(
      { userId, platform },
      {
        $set: {
          userId,
          platform,
          connected: true,
          ...(accountName ? { accountName } : {}),
          ...(accessToken ? { accessToken } : {}),
          ...(refreshToken ? { refreshToken } : {}),
          ...(expiresAt ? { expiresAt } : {}),
          ...(metadata ? { metadata } : {}),
          connectedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    logger.info({ userId, platform, accountName }, "Platform connected");
    res.json({ success: true, platform, connected: true });
  } catch (err) {
    logger.error({ err }, "Platform connect failed");
    res.status(500).json({ message: "Failed to connect platform" });
  }
});

// ── POST /v1/dashboard/platforms/:platform/disconnect ─────────────────
router.post("/v1/dashboard/platforms/:platform/disconnect", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const platform = req.params["platform"] as string;
    const col = getCollection<Record<string, unknown>>("userPlatformTokens");
    await col.updateOne(
      { userId, platform },
      { $set: { connected: false, disconnectedAt: new Date() } }
    );
    logger.info({ userId, platform }, "Platform disconnected");
    res.json({ success: true, platform, connected: false });
  } catch (err) {
    logger.error({ err }, "Platform disconnect failed");
    res.status(500).json({ message: "Failed to disconnect platform" });
  }
});

// ── GET /v1/admin/platforms/:userId ───────────────────────────────────────────────────────────────────
router.get("/v1/admin/platforms/:userId", async (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
  }
  try {
    const jwt = await import("jsonwebtoken");
    const secret = process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
    const payload = jwt.verify(auth.slice(7), secret) as { isAdmin?: boolean };
    if (!payload.isAdmin) throw new Error("not admin");

    const userId = req.params["userId"] as string;
    const col = getCollection<{
      userId: string;
      platform: string;
      connected: boolean;
      accountName?: string;
      connectedAt?: Date;
    }>("userPlatformTokens");
    const connections = await col.find({ userId }).toArray();

    res.json({
      userId,
      platforms: connections.map(c => ({
        id: c.platform,
        name: PLATFORM_LABELS[c.platform] || c.platform,
        connected: c.connected,
        accountName: c.accountName,
        connectedAt: c.connectedAt,
      })),
    });
  } catch {
    res.status(401).json({ message: "Invalid admin token" });
  }
});

export default router;
