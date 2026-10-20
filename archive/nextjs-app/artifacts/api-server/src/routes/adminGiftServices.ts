import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import { addTokens, SUBSCRIPTION_TOKENS } from "../services/tokenService.js";
import { ensureUserCredits } from "../lib/credits.js";
import { sendGiftedServiceEmail } from "../lib/email.js";

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────

function getAdminSecret(): string {
  return process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
}

function requireAdmin(req: Request, res: Response, next: () => void): void {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ message: "Admin authentication required" }); return; }
  try {
    const payload = jwt.verify(auth.slice(7), getAdminSecret()) as { isAdmin?: boolean };
    if (!payload.isAdmin) throw new Error("not admin");
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired admin token" });
  }
}

// ── Gift catalogue ─────────────────────────────────────────────────────────────

interface GiftableService {
  id:       string;
  name:     string;
  category: string;
  price:    number;
  tokens:   number;
}

const GIFTABLE_SERVICES: GiftableService[] = [
  { id: "meta-monthly",      name: "Meta Ads",              category: "Ad Management", price: 350,    tokens: 6000 },
  { id: "google-monthly",    name: "Google Ads",            category: "Ad Management", price: 350,    tokens: 6000 },
  { id: "snapchat-monthly",  name: "Snapchat Ads",          category: "Ad Management", price: 350,    tokens: 6000 },
  { id: "tiktok-monthly",    name: "TikTok Ads",            category: "Ad Management", price: 350,    tokens: 6000 },
  { id: "linkedin-monthly",  name: "LinkedIn Ads",          category: "Ad Management", price: 350,    tokens: 6000 },
  { id: "x-monthly",         name: "X (Twitter) Ads",       category: "Ad Management", price: 350,    tokens: 6000 },
  { id: "youtube-monthly",   name: "YouTube Ads",           category: "Ad Management", price: 350,    tokens: 6000 },
  { id: "auto-seo-monthly",  name: "Auto SEO",              category: "AI Tools",      price: 199.99, tokens: 200  },
  { id: "ai-content-monthly",name: "AI Content Suite",      category: "AI Tools",      price: 149.99, tokens: 500  },
  { id: "image-generator",   name: "AI Image Generator",    category: "AI Tools",      price: 49,     tokens: 50   },
  { id: "reels-generator",   name: "AI Reels Generator",    category: "AI Tools",      price: 79,     tokens: 100  },
  { id: "ai-captions",       name: "AI Captions",           category: "AI Tools",      price: 19.99,  tokens: 15   },
];

export { GIFTABLE_SERVICES };

// ── Types ──────────────────────────────────────────────────────────────────────

interface GiftLogDoc {
  _id?:        ObjectId;
  userId:      string;
  userEmail:   string;
  userName:    string;
  serviceId:   string;
  serviceName: string;
  permanent:   boolean;
  months:      number;
  grantedTokens: number;
  giftedAt:    Date;
  expiresAt?:  Date;
  giftedBy:    string;
}

// ── GET /v1/admin/gift/catalogue ───────────────────────────────────────────────

router.get("/v1/admin/gift/catalogue", (req: Request, res: Response) => {
  requireAdmin(req, res, () => {
    res.json(GIFTABLE_SERVICES);
  });
});

// ── GET /v1/admin/gift/search?q= ──────────────────────────────────────────────

router.get("/v1/admin/gift/search", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    const q = String(req.query["q"] ?? "").trim();
    if (!q || q.length < 2) {
      res.status(400).json({ message: "Query must be at least 2 characters" });
      return;
    }

    try {
      const regex = new RegExp(q, "i");
      const users = await getCollection("users")
        .find(
          { $or: [{ email: regex }, { name: regex }] },
          { projection: { passwordHash: 0 } }
        )
        .limit(10)
        .toArray() as Array<Record<string, unknown>>;

      const enriched = await Promise.all(
        users.map(async (u) => {
          const userId = String(u._id);
          const tokensDoc = await getCollection("tokens").findOne({ userId });
          return {
            id:                 userId,
            email:              u.email,
            name:               u.name,
            subscriptionStatus: u.subscriptionStatus ?? "none",
            subscriptionPlan:   u.subscriptionPlan   ?? null,
            tokenBalance:       (tokensDoc as Record<string, unknown> | null)?.balance ?? 0,
            createdAt:          u.createdAt,
          };
        })
      );

      res.json(enriched);
    } catch (err) {
      logger.error({ err }, "admin gift search error");
      res.status(500).json({ message: "Search failed" });
    }
  });
});

// ── GET /v1/admin/gift/log ─────────────────────────────────────────────────────

router.get("/v1/admin/gift/log", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const limit = Math.min(Number(req.query["limit"] ?? 50), 200);
      const log   = await getCollection<GiftLogDoc>("adminGiftLog")
        .find({})
        .sort({ giftedAt: -1 })
        .limit(limit)
        .toArray();
      res.json(log);
    } catch (err) {
      logger.error({ err }, "admin gift log error");
      res.status(500).json({ message: "Failed to load gift log" });
    }
  });
});

// ── POST /v1/admin/gift/apply ──────────────────────────────────────────────────
// Body: { userId, serviceId, permanent, months?, tokenAmount? }

router.post("/v1/admin/gift/apply", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const {
        userId,
        serviceId,
        permanent = false,
        months    = 1,
        tokenAmount,
        notify    = true,
      } = req.body as {
        userId:       string;
        serviceId:    string;
        permanent?:   boolean;
        months?:      number;
        tokenAmount?: number;
        notify?:      boolean;
      };

      if (!userId || !serviceId) {
        res.status(400).json({ message: "userId and serviceId are required" });
        return;
      }

      let oid: ObjectId;
      try { oid = new ObjectId(userId); } catch {
        res.status(400).json({ message: "Invalid userId" });
        return;
      }

      const user = await getCollection("users").findOne(
        { _id: oid },
        { projection: { passwordHash: 0 } }
      ) as Record<string, unknown> | null;

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // ── Resolve service metadata ───────────────────────────────────────────

      const isTokensOnly = serviceId === "tokens";
      let serviceName    = "Token Pack";
      let tokensToGrant  = tokenAmount ?? 0;

      if (!isTokensOnly) {
        const svc = GIFTABLE_SERVICES.find(s => s.id === serviceId);
        if (!svc) {
          res.status(400).json({ message: `Unknown serviceId: ${serviceId}` });
          return;
        }
        serviceName   = svc.name;
        tokensToGrant = svc.tokens;
      }

      const now       = new Date();
      const expiresAt = (!permanent && !isTokensOnly)
        ? new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000)
        : undefined;

      // ── Activate subscription in MongoDB ────────────────────────────────────

      if (!isTokensOnly) {
        const subUpdate: Record<string, unknown> = {
          subscriptionStatus:      "active",
          subscriptionPlan:        serviceId,
          subscriptionActivatedAt: now,
          updatedAt:               now,
          giftedByAdmin:           true,
          giftedAt:                now,
        };
        if (expiresAt) subUpdate["subscriptionExpiresAt"] = expiresAt;

        await getCollection("users").updateOne({ _id: oid }, { $set: subUpdate });

        await ensureUserCredits(userId, serviceId).catch(e =>
          logger.warn({ e }, "Gift: credit seed failed (non-fatal)")
        );
      }

      // ── Grant tokens ─────────────────────────────────────────────────────────

      let finalBalance = 0;
      if (tokensToGrant > 0) {
        const result = await addTokens(
          userId,
          tokensToGrant,
          "admin_gift",
          `Admin gift: ${serviceName}`,
          { serviceId, permanent, months, giftedBy: "admin" }
        );
        finalBalance = result.balance;
      }

      // ── Log gift ─────────────────────────────────────────────────────────────

      await getCollection<GiftLogDoc>("adminGiftLog").insertOne({
        userId,
        userEmail:    String(user.email ?? ""),
        userName:     String(user.name  ?? ""),
        serviceId,
        serviceName,
        permanent,
        months:       isTokensOnly ? 0 : months,
        grantedTokens: tokensToGrant,
        giftedAt:     now,
        expiresAt,
        giftedBy:     "admin",
      });

      // ── Send email notification ───────────────────────────────────────────────

      if (notify && user.email) {
        await sendGiftedServiceEmail(
          String(user.email),
          String(user.name ?? ""),
          serviceName,
          tokensToGrant,
          permanent,
          months
        ).catch(() => {});
      }

      logger.info({ userId, serviceId, serviceName, tokensToGrant, permanent, months }, "Admin gifted service");

      res.json({
        success:      true,
        userId,
        serviceId,
        serviceName,
        permanent,
        months,
        tokensGranted: tokensToGrant,
        newTokenBalance: finalBalance,
        expiresAt:    expiresAt?.toISOString() ?? null,
        emailSent:    notify && !!user.email,
      });
    } catch (err) {
      logger.error({ err }, "admin gift apply error");
      res.status(500).json({ message: "Failed to gift service" });
    }
  });
});

export default router;
