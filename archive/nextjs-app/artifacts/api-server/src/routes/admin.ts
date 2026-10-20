import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import { addTokens, getBalance, getMonthlyUsage } from "../services/tokenService.js";

const router = Router();

// ── Admin auth ────────────────────────────────────────────────────────────────

function getAdminSecret(): string {
  return process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
}

function signAdminToken(): string {
  return jwt.sign({ isAdmin: true }, getAdminSecret(), { expiresIn: "12h" });
}

function requireAdmin(req: Request, res: Response, next: () => void): void {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
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

// POST /v1/admin/auth — password check
router.post("/v1/admin/auth", (req: Request, res: Response) => {
  const { password } = req.body ?? {};
  const expected = process.env["ADMIN_PASSWORD"] || "AAWDAI";
  if (!password || password !== expected) {
    res.status(401).json({ message: "Invalid admin password" });
    return;
  }
  res.json({ token: signAdminToken(), expiresIn: "12h" });
});

// GET /v1/admin/me — verify token
router.get("/v1/admin/me", (req: Request, res: Response) => {
  requireAdmin(req, res, () => res.json({ isAdmin: true }));
});

// ── Overview ──────────────────────────────────────────────────────────────────
router.get("/v1/admin/overview", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const [users, usageCredits, content, publishing, analytics, businessProfiles] =
        await Promise.all([
          getCollection("users").countDocuments(),
          getCollection("usageCredits").countDocuments(),
          getCollection("generatedContent").countDocuments(),
          getCollection("publishingJobs").find({}).toArray(),
          getCollection("postAnalytics").find({}).toArray(),
          getCollection("businessProfiles").countDocuments(),
        ]);

      const activeSubscriptions = await getCollection("users").countDocuments({
        subscriptionStatus: "active",
      });

      const pendingJobs = (publishing as Array<{ status?: string }>).filter(
        (j) => j.status === "pending" || j.status === "scheduled"
      ).length;
      const publishedCount = (publishing as Array<{ status?: string }>).filter(
        (j) => j.status === "published"
      ).length;

      const totalImpressions = (analytics as Array<{ impressions?: number }>).reduce(
        (s, a) => s + (a.impressions || 0), 0
      );
      const totalClicks = (analytics as Array<{ clicks?: number }>).reduce(
        (s, a) => s + (a.clicks || 0), 0
      );

      // Recent users
      const recentUsers = await getCollection("users")
        .find({}, { projection: { passwordHash: 0 } })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      res.json({
        totalUsers: users,
        activeSubscriptions,
        businessProfiles,
        totalContent: content,
        totalPublished: publishedCount,
        pendingJobs,
        totalImpressions,
        totalClicks,
        recentUsers,
      });
    } catch (err) {
      logger.error({ err }, "admin overview error");
      res.status(500).json({ message: "Failed to load overview" });
    }
  });
});

// ── Blog CRUD ─────────────────────────────────────────────────────────────────
router.get("/v1/admin/blogs", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const posts = await getCollection("blogPosts")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.json(posts);
    } catch (err) {
      logger.error({ err }, "admin blogs list error");
      res.status(500).json({ message: "Failed to load blogs" });
    }
  });
});

router.post("/v1/admin/blogs", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { title, slug, excerpt, content, coverImageUrl, author, status, tags, brandLogo, brandUrl } =
        req.body ?? {};
      if (!title || !slug) {
        res.status(400).json({ message: "title and slug are required" });
        return;
      }
      const now = new Date();
      const doc = {
        title,
        slug,
        excerpt: excerpt || "",
        content: content || "",
        coverImageUrl: coverImageUrl || "",
        author: author || "WorldDigital.ai Team",
        status: status || "draft",
        tags: tags || [],
        brandLogo: brandLogo || "",
        brandUrl: brandUrl || "",
        createdAt: now,
        updatedAt: now,
        publishedAt: status === "published" ? now : null,
      };
      const result = await getCollection("blogPosts").insertOne(doc);
      logger.info({ id: result.insertedId, slug }, "Blog post created");
      res.json({ ...doc, _id: result.insertedId });
    } catch (err) {
      logger.error({ err }, "admin create blog error");
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });
});

router.put("/v1/admin/blogs/:id", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { title, slug, excerpt, content, coverImageUrl, author, status, tags, brandLogo, brandUrl } =
        req.body ?? {};
      const now = new Date();
      const update: Record<string, unknown> = {
        updatedAt: now,
        ...(title && { title }),
        ...(slug && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(author && { author }),
        ...(status && { status }),
        ...(tags && { tags }),
        ...(brandLogo !== undefined && { brandLogo }),
        ...(brandUrl !== undefined && { brandUrl }),
      };
      if (status === "published") update.publishedAt = now;
      if (status === "draft") update.publishedAt = null;

      await getCollection("blogPosts").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: update }
      );
      const updated = await getCollection("blogPosts").findOne({
        _id: new ObjectId(req.params.id),
      });
      res.json(updated);
    } catch (err) {
      logger.error({ err }, "admin update blog error");
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });
});

router.delete("/v1/admin/blogs/:id", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      await getCollection("blogPosts").deleteOne({ _id: new ObjectId(req.params.id) });
      res.json({ message: "Blog post deleted" });
    } catch (err) {
      logger.error({ err }, "admin delete blog error");
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });
});

// ── Customers ─────────────────────────────────────────────────────────────────
router.get("/v1/admin/customers", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const users = await getCollection("users")
        .find({}, { projection: { passwordHash: 0 } })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();

      const userIds = users.map((u: Record<string, unknown>) => String(u._id));
      const [profiles, usage] = await Promise.all([
        getCollection("businessProfiles").find({}).toArray(),
        getCollection("usageCredits").find({}).toArray(),
      ]);

      const profileMap = new Map(
        (profiles as Array<Record<string, unknown>>).map((p) => [String(p.userId), p])
      );
      const usageMap = new Map(
        (usage as Array<Record<string, unknown>>).map((u) => [String(u.userId), u])
      );

      const enriched = users.map((u: Record<string, unknown>) => ({
        ...u,
        businessProfile: profileMap.get(String(u._id)) || null,
        usage: usageMap.get(String(u._id)) || null,
      }));

      res.json(enriched);
    } catch (err) {
      logger.error({ err }, "admin customers error");
      res.status(500).json({ message: "Failed to load customers" });
    }
  });
});

router.get("/v1/admin/customers/:id", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const [user, profile, content, jobs, analytics, tokenBalance, monthlyUsed] = await Promise.all([
        getCollection("users").findOne({ _id: oid }, { projection: { passwordHash: 0 } }),
        getCollection("businessProfiles").findOne({ userId: String(oid) }),
        getCollection("generatedContent").find({ userId: String(oid) }).sort({ createdAt: -1 }).limit(20).toArray(),
        getCollection("publishingJobs").find({ userId: String(oid) }).sort({ createdAt: -1 }).limit(20).toArray(),
        getCollection("postAnalytics").find({ userId: String(oid) }).sort({ publishedAt: -1 }).limit(10).toArray(),
        getBalance(String(oid)),
        getMonthlyUsage(String(oid)),
      ]);

      if (!user) { res.status(404).json({ message: "Customer not found" }); return; }
      res.json({
        user,
        profile,
        usage: { tokenBalance, monthlyUsed },
        content,
        jobs,
        analytics,
      });
    } catch (err) {
      logger.error({ err }, "admin customer detail error");
      res.status(500).json({ message: "Failed to load customer" });
    }
  });
});

// ── Content ───────────────────────────────────────────────────────────────────
router.get("/v1/admin/content", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const content = await getCollection("generatedContent")
        .find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
      res.json(content);
    } catch (err) {
      logger.error({ err }, "admin content error");
      res.status(500).json({ message: "Failed to load content" });
    }
  });
});

// ── Publishing ────────────────────────────────────────────────────────────────
router.get("/v1/admin/publishing", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const jobs = await getCollection("publishingJobs")
        .find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
      res.json(jobs);
    } catch (err) {
      logger.error({ err }, "admin publishing error");
      res.status(500).json({ message: "Failed to load publishing jobs" });
    }
  });
});

router.post("/v1/admin/publishing/:id/approve", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      await getCollection("publishingJobs").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", updatedAt: new Date() } }
      );
      res.json({ message: "Job approved" });
    } catch (err) {
      logger.error({ err }, "admin approve job error");
      res.status(500).json({ message: "Failed to approve job" });
    }
  });
});

router.post("/v1/admin/publishing/:id/retry", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      await getCollection("publishingJobs").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "pending", retryCount: 0, updatedAt: new Date() } }
      );
      res.json({ message: "Job queued for retry" });
    } catch (err) {
      logger.error({ err }, "admin retry job error");
      res.status(500).json({ message: "Failed to retry job" });
    }
  });
});

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/v1/admin/analytics", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const all = await getCollection("postAnalytics").find({}).toArray() as Array<Record<string, unknown>>;

      const totals = all.reduce(
        (acc, a) => ({
          impressions: acc.impressions + (Number(a.impressions) || 0),
          reach: acc.reach + (Number(a.reach) || 0),
          likes: acc.likes + (Number(a.likes) || 0),
          comments: acc.comments + (Number(a.comments) || 0),
          shares: acc.shares + (Number(a.shares) || 0),
          clicks: acc.clicks + (Number(a.clicks) || 0),
        }),
        { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
      );

      const byPlatform: Record<string, Record<string, number>> = {};
      for (const a of all) {
        const p = String(a.platform || "unknown");
        if (!byPlatform[p]) byPlatform[p] = { impressions: 0, clicks: 0, posts: 0 };
        byPlatform[p].impressions += Number(a.impressions) || 0;
        byPlatform[p].clicks += Number(a.clicks) || 0;
        byPlatform[p].posts += 1;
      }

      const topPosts = all
        .sort((a, b) => (Number(b.impressions) || 0) - (Number(a.impressions) || 0))
        .slice(0, 10);

      res.json({ totals, byPlatform, topPosts, totalPosts: all.length });
    } catch (err) {
      logger.error({ err }, "admin analytics error");
      res.status(500).json({ message: "Failed to load analytics" });
    }
  });
});

// ── Integrations health ───────────────────────────────────────────────────────
router.get("/v1/admin/integrations", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    const mask = (v?: string) =>
      v ? `${v.slice(0, 6)}****${v.slice(-4)}` : "NOT SET";

    const checks = [
      { name: "MongoDB", key: "MONGODB_URI", value: mask(process.env["MONGODB_URI"]), status: !!process.env["MONGODB_URI"] ? "connected" : "missing" },
      { name: "Stripe Secret Key", key: "STRIPE_SECRET_KEY", value: mask(process.env["STRIPE_SECRET_KEY"]), status: !!process.env["STRIPE_SECRET_KEY"] ? "connected" : "missing", note: process.env["STRIPE_SECRET_KEY"]?.startsWith("sk_live") ? "live mode" : process.env["STRIPE_SECRET_KEY"]?.startsWith("sk_test") ? "test mode" : "unknown" },
      { name: "Stripe Webhook", key: "STRIPE_WEBHOOK_SECRET", value: mask(process.env["STRIPE_WEBHOOK_SECRET"]), status: !!process.env["STRIPE_WEBHOOK_SECRET"] ? "connected" : "missing" },
      { name: "SendGrid API Key", key: "SENDGRID_API_KEY", value: mask(process.env["SENDGRID_API_KEY"]), status: !!process.env["SENDGRID_API_KEY"] ? "connected" : "missing", warning: "Sender support@worlddigital.ai not yet verified — check SendGrid inbox" },
      { name: "AI (CHAT_BOT)", key: "CHAT_BOT", value: mask(process.env["CHAT_BOT"]), status: !!process.env["CHAT_BOT"] ? "connected" : "missing" },
      { name: "Meta/Facebook Page", key: "FB_ACCESS_TOKEN", value: mask(process.env["FB_ACCESS_TOKEN"]), status: !!process.env["FB_ACCESS_TOKEN"] ? "connected" : "missing" },
      { name: "Snapchat Ads", key: "SNAP_ACCESS_TOKEN", value: mask(process.env["SNAP_ACCESS_TOKEN"]), status: !!process.env["SNAP_ACCESS_TOKEN"] ? "connected" : "missing" },
      { name: "Google OAuth", key: "GOOGLE_CLIENT_ID", value: mask(process.env["GOOGLE_CLIENT_ID"]), status: !!process.env["GOOGLE_CLIENT_ID"] ? "connected" : "missing", warning: "Add Replit domain to Google Console authorized redirect URIs" },
      { name: "AWS S3", key: "S3_BUCKET_NAME", value: process.env["S3_BUCKET_NAME"] || "NOT SET", status: !!process.env["S3_BUCKET_NAME"] ? "connected" : "missing" },
      { name: "Recaptcha", key: "RECAPTCHA_SECRET_KEY", value: mask(process.env["RECAPTCHA_SECRET_KEY"]), status: !!process.env["RECAPTCHA_SECRET_KEY"] ? "connected" : "missing" },
      { name: "Price: Meta Monthly",         key: "PRICE_META_MONTHLY",               value: mask(process.env["PRICE_META_MONTHLY"]),               status: process.env["PRICE_META_MONTHLY"] ? "connected" : "missing" },
      { name: "Price: Meta Yearly",          key: "PRICE_META_YEARLY",                value: mask(process.env["PRICE_META_YEARLY"]),                status: process.env["PRICE_META_YEARLY"] ? "connected" : "missing" },
      { name: "Price: Google Monthly",       key: "PRICE_GOOGLE_MONTHLY",             value: mask(process.env["PRICE_GOOGLE_MONTHLY"]),             status: process.env["PRICE_GOOGLE_MONTHLY"] ? "connected" : "missing" },
      { name: "Price: Google Yearly",        key: "PRICE_GOOGLE_YEARLY",              value: mask(process.env["PRICE_GOOGLE_YEARLY"]),              status: process.env["PRICE_GOOGLE_YEARLY"] ? "connected" : "missing" },
      { name: "Price: Snapchat Monthly",     key: "PRICE_SNAPCHAT_MONTHLY",           value: mask(process.env["PRICE_SNAPCHAT_MONTHLY"]),           status: process.env["PRICE_SNAPCHAT_MONTHLY"] ? "connected" : "missing" },
      { name: "Price: Snapchat Yearly",      key: "PRICE_SNAPCHAT_YEARLY",            value: mask(process.env["PRICE_SNAPCHAT_YEARLY"]),            status: process.env["PRICE_SNAPCHAT_YEARLY"] ? "connected" : "missing" },
      { name: "Price: Meta+Google Monthly",  key: "PRICE_META_GOOGLE_MONTHLY",        value: mask(process.env["PRICE_META_GOOGLE_MONTHLY"]),        status: process.env["PRICE_META_GOOGLE_MONTHLY"] ? "connected" : "missing" },
      { name: "Price: Meta+Google Yearly",   key: "PRICE_META_GOOGLE_YEARLY",         value: mask(process.env["PRICE_META_GOOGLE_YEARLY"]),         status: process.env["PRICE_META_GOOGLE_YEARLY"] ? "connected" : "missing" },
      { name: "Price: Auto SEO Monthly",     key: "PRICE_AUTO_SEO_MONTHLY",           value: mask(process.env["PRICE_AUTO_SEO_MONTHLY"]),           status: process.env["PRICE_AUTO_SEO_MONTHLY"] ? "connected" : "missing" },
      { name: "Price: Auto SEO Yearly",      key: "PRICE_AUTO_SEO_YEARLY",            value: mask(process.env["PRICE_AUTO_SEO_YEARLY"]),            status: process.env["PRICE_AUTO_SEO_YEARLY"] ? "connected" : "missing" },
      { name: "Price: AI Image Pack",        key: "PRICE_IMAGE_PACK",                 value: mask(process.env["PRICE_IMAGE_PACK"]),                 status: process.env["PRICE_IMAGE_PACK"] ? "connected" : "missing" },
      { name: "Price: AI Reels Pack",        key: "PRICE_REELS_PACK",                 value: mask(process.env["PRICE_REELS_PACK"]),                 status: process.env["PRICE_REELS_PACK"] ? "connected" : "missing" },
      { name: "Price: AI Captions Pack",     key: "PRICE_CAPTIONS_PACK",              value: mask(process.env["PRICE_CAPTIONS_PACK"]),              status: process.env["PRICE_CAPTIONS_PACK"] ? "connected" : "missing" },
      { name: "Price: Keyword Research Pack",key: "PRICE_KEYWORD_PACK",               value: mask(process.env["PRICE_KEYWORD_PACK"]),               status: process.env["PRICE_KEYWORD_PACK"] ? "connected" : "missing" },
    ];

    res.json(checks);
  });
});

// ── Customer account lifecycle ────────────────────────────────────────────────

// POST /v1/admin/customers/:id/cancel
// Body: { immediately?: boolean, notify?: boolean }
router.post("/v1/admin/customers/:id/cancel", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const immediately = req.body?.immediately === true;
      const notify = req.body?.notify !== false;

      const user = await getCollection("users").findOne(
        { _id: oid },
        { projection: { passwordHash: 0 } }
      ) as Record<string, unknown> | null;

      if (!user) { res.status(404).json({ message: "Customer not found" }); return; }

      let stripeResult: Record<string, unknown> | null = null;
      let periodEnd: string | undefined;

      if (user.stripeSubscriptionId) {
        try {
          const { getStripe } = await import("../lib/stripe.js");
          const stripe = getStripe();
          if (immediately) {
            await stripe.subscriptions.cancel(String(user.stripeSubscriptionId));
          } else {
            const updated = await stripe.subscriptions.update(
              String(user.stripeSubscriptionId),
              { cancel_at_period_end: true }
            );
            if (updated.current_period_end) {
              periodEnd = new Date(updated.current_period_end * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
            }
          }
          stripeResult = { cancelled: true, immediately };
        } catch (stripeErr) {
          logger.warn({ err: stripeErr, userId: String(oid) }, "Stripe cancel failed — continuing DB update");
          stripeResult = { cancelled: false, error: stripeErr instanceof Error ? stripeErr.message : "Stripe error" };
        }
      }

      const newStatus = immediately ? "cancelled" : "cancelling";
      await getCollection("users").updateOne(
        { _id: oid },
        { $set: { subscriptionStatus: newStatus, cancelledAt: new Date(), cancelledByAdmin: true, updatedAt: new Date() } }
      );

      if (notify && user.email) {
        const { sendSubscriptionCancelledByAdminEmail } = await import("../lib/email.js");
        await sendSubscriptionCancelledByAdminEmail(
          String(user.email),
          String(user.name || ""),
          { immediately, periodEnd }
        ).catch(() => {});
      }

      logger.info({ userId: String(oid), immediately, notify }, "Admin cancelled customer subscription");
      res.json({ success: true, status: newStatus, stripe: stripeResult, periodEnd: periodEnd || null });
    } catch (err) {
      logger.error({ err }, "admin cancel subscription error");
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });
});

// POST /v1/admin/customers/:id/pause
// Body: { notify?: boolean }
router.post("/v1/admin/customers/:id/pause", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const notify = req.body?.notify !== false;
      const user = await getCollection("users").findOne({ _id: oid }, { projection: { passwordHash: 0 } }) as Record<string, unknown> | null;
      if (!user) { res.status(404).json({ message: "Customer not found" }); return; }

      let stripeResult: Record<string, unknown> | null = null;
      if (user.stripeSubscriptionId) {
        try {
          const { getStripe } = await import("../lib/stripe.js");
          const stripe = getStripe();
          await stripe.subscriptions.update(String(user.stripeSubscriptionId), {
            pause_collection: { behavior: "void" },
          });
          stripeResult = { paused: true };
        } catch (stripeErr) {
          logger.warn({ err: stripeErr, userId: String(oid) }, "Stripe pause failed — continuing DB update");
          stripeResult = { paused: false, error: stripeErr instanceof Error ? stripeErr.message : "Stripe error" };
        }
      }

      await getCollection("users").updateOne(
        { _id: oid },
        { $set: { subscriptionStatus: "paused", pausedAt: new Date(), pausedByAdmin: true, updatedAt: new Date() } }
      );

      if (notify && user.email) {
        const { sendSubscriptionPausedByAdminEmail } = await import("../lib/email.js");
        await sendSubscriptionPausedByAdminEmail(String(user.email), String(user.name || "")).catch(() => {});
      }

      logger.info({ userId: String(oid) }, "Admin paused customer subscription");
      res.json({ success: true, status: "paused", stripe: stripeResult });
    } catch (err) {
      logger.error({ err }, "admin pause subscription error");
      res.status(500).json({ message: "Failed to pause subscription" });
    }
  });
});

// POST /v1/admin/customers/:id/resume
// Body: { notify?: boolean }
router.post("/v1/admin/customers/:id/resume", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const user = await getCollection("users").findOne({ _id: oid }, { projection: { passwordHash: 0 } }) as Record<string, unknown> | null;
      if (!user) { res.status(404).json({ message: "Customer not found" }); return; }

      let stripeResult: Record<string, unknown> | null = null;
      if (user.stripeSubscriptionId) {
        try {
          const { getStripe } = await import("../lib/stripe.js");
          const stripe = getStripe();
          await stripe.subscriptions.update(String(user.stripeSubscriptionId), {
            pause_collection: "",
          } as Parameters<typeof stripe.subscriptions.update>[1]);
          stripeResult = { resumed: true };
        } catch (stripeErr) {
          logger.warn({ err: stripeErr, userId: String(oid) }, "Stripe resume failed — continuing DB update");
          stripeResult = { resumed: false, error: stripeErr instanceof Error ? stripeErr.message : "Stripe error" };
        }
      }

      await getCollection("users").updateOne(
        { _id: oid },
        {
          $set: { subscriptionStatus: "active", resumedAt: new Date(), resumedByAdmin: true, updatedAt: new Date() },
          $unset: { pausedAt: "", pausedByAdmin: "" },
        }
      );

      logger.info({ userId: String(oid) }, "Admin resumed customer subscription");
      res.json({ success: true, status: "active", stripe: stripeResult });
    } catch (err) {
      logger.error({ err }, "admin resume subscription error");
      res.status(500).json({ message: "Failed to resume subscription" });
    }
  });
});

// POST /v1/admin/customers/:id/refund
// Body: { amount?: number (in cents, 0 = full), reason?: string }
router.post("/v1/admin/customers/:id/refund", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const user = await getCollection("users").findOne({ _id: oid }, { projection: { passwordHash: 0 } }) as Record<string, unknown> | null;
      if (!user) { res.status(404).json({ message: "Customer not found" }); return; }

      if (!user.stripeCustomerId) {
        res.status(400).json({ message: "This customer has no Stripe account — no charges to refund." });
        return;
      }

      const { getStripe } = await import("../lib/stripe.js");
      const stripe = getStripe();

      const paymentIntents = await stripe.paymentIntents.list({ customer: String(user.stripeCustomerId), limit: 5 });
      const succeeded = paymentIntents.data.find((pi) => pi.status === "succeeded");

      if (!succeeded) {
        res.status(400).json({ message: "No successful charges found for this customer." });
        return;
      }

      const requestedAmount = req.body?.amount ? Number(req.body.amount) : undefined;
      const reason = (req.body?.reason || "requested_by_customer") as "duplicate" | "fraudulent" | "requested_by_customer";

      const refund = await stripe.refunds.create({
        payment_intent: succeeded.id,
        ...(requestedAmount && requestedAmount > 0 ? { amount: requestedAmount } : {}),
        reason,
      });

      logger.info({ userId: String(oid), refundId: refund.id, amount: refund.amount }, "Admin issued Stripe refund");
      res.json({
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      });
    } catch (err) {
      logger.error({ err }, "admin refund error");
      const msg = err instanceof Error ? err.message : "Failed to issue refund";
      res.status(500).json({ message: msg });
    }
  });
});

// PATCH /v1/admin/customers/:id/credits
// Body: { delta: number, reason?: string }
// Updates the real token balance in the tokens collection via tokenService.
router.patch("/v1/admin/customers/:id/credits", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const delta = Number(req.body?.delta);
      if (isNaN(delta) || delta === 0) {
        res.status(400).json({ message: "Provide a non-zero delta (positive to add, negative to subtract)" });
        return;
      }

      const user = await getCollection("users").findOne({ _id: oid }) as Record<string, unknown> | null;
      if (!user) { res.status(404).json({ message: "Customer not found" }); return; }

      const userId = String(oid);
      const reason = String(req.body?.reason || (delta > 0 ? "Admin credit" : "Admin deduction"));
      const action = delta > 0 ? "admin_add" : "admin_remove";

      const { balance } = await addTokens(userId, delta, action, reason);

      // Console log for easy diagnostics — visible in server logs
      console.log(`[TOKEN UPDATE] User ${userId} (${user.email}) | delta: ${delta > 0 ? "+" : ""}${delta} | new balance: ${balance} | reason: ${reason}`);
      logger.info({ userId, delta, balance, reason }, "Admin adjusted token balance via customer profile");

      res.json({ success: true, balance, delta, reason });
    } catch (err) {
      logger.error({ err }, "admin adjust credits error");
      res.status(500).json({ message: "Failed to adjust tokens" });
    }
  });
});

// POST /v1/admin/customers/:id/delete
// Body: { confirm: "DELETE", notify?: boolean }
// Full hard delete: cancels Stripe sub, removes all MongoDB data
router.post("/v1/admin/customers/:id/delete", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      if (req.body?.confirm !== "DELETE") {
        res.status(400).json({ message: 'Send confirm: "DELETE" in the request body to proceed.' });
        return;
      }

      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const notify = req.body?.notify !== false;
      const user = await getCollection("users").findOne({ _id: oid }, { projection: { passwordHash: 0 } }) as Record<string, unknown> | null;
      if (!user) { res.status(404).json({ message: "Customer not found" }); return; }

      const userId = String(oid);
      const userEmail = String(user.email || "");
      const userName = String(user.name || "");

      // 1. Send deletion email BEFORE removing data (so we have their details)
      if (notify && userEmail) {
        const { sendAccountDeletedByAdminEmail } = await import("../lib/email.js");
        await sendAccountDeletedByAdminEmail(userEmail, userName).catch(() => {});
      }

      // 2. Cancel Stripe subscription + subscription schedule if present
      if (user.stripeSubscriptionId || user.stripeCustomerId) {
        try {
          const { getStripe } = await import("../lib/stripe.js");
          const stripe = getStripe();
          if (user.stripeSubscriptionId) {
            await stripe.subscriptions.cancel(String(user.stripeSubscriptionId)).catch(() => {});
          }
          // Note: we deliberately do NOT delete the Stripe customer so charge history is preserved for finance
        } catch { /* best-effort */ }
      }

      // 3. Wipe all MongoDB collections for this user
      const collections = [
        "businessProfiles",
        "usageCredits",
        "generatedContent",
        "adGenerations",
        "publishingJobs",
        "postAnalytics",
        "socialConnections",
        "oauthTokens",
        "passwordResetTokens",
        "adminNotifications",
      ];

      const deleteResults: Record<string, number> = {};
      await Promise.all(
        collections.map(async (col) => {
          try {
            const result = await getCollection(col).deleteMany({ userId });
            deleteResults[col] = result.deletedCount;
          } catch { deleteResults[col] = -1; }
        })
      );

      // Also remove any leads matching this email
      if (userEmail) {
        const leadsResult = await getCollection("leads").deleteMany({ email: userEmail }).catch(() => ({ deletedCount: 0 }));
        deleteResults["leads"] = leadsResult.deletedCount;
      }

      // 4. Finally delete the user record itself
      await getCollection("users").deleteOne({ _id: oid });

      logger.info({ userId, email: userEmail, collections: deleteResults }, "Admin hard-deleted customer account");
      res.json({
        success: true,
        message: `Account for ${userEmail} has been permanently deleted.`,
        collections: deleteResults,
      });
    } catch (err) {
      logger.error({ err }, "admin delete customer error");
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });
});

// ── Sales (Stripe) ────────────────────────────────────────────────────────────
router.get("/v1/admin/sales", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      // Pull from DB users with stripeCustomerId + subscriptions
      const subscribers = await getCollection("users")
        .find({ stripeCustomerId: { $exists: true, $ne: null } }, { projection: { passwordHash: 0 } })
        .sort({ createdAt: -1 })
        .toArray() as Array<Record<string, unknown>>;

      const summary = {
        totalSubscribers: subscribers.length,
        active: subscribers.filter((u) => u.subscriptionStatus === "active").length,
        paused: subscribers.filter((u) => u.subscriptionStatus === "paused").length,
        cancelled: subscribers.filter((u) => u.subscriptionStatus === "cancelled").length,
        none: subscribers.filter((u) => !u.subscriptionStatus || u.subscriptionStatus === "none").length,
      };

      res.json({ summary, subscribers });
    } catch (err) {
      logger.error({ err }, "admin sales error");
      res.status(500).json({ message: "Failed to load sales data" });
    }
  });
});

export default router;
