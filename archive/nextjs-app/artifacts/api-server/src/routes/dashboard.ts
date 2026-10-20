import { Router, type IRouter, type Response } from "express";
import { ObjectId } from "mongodb";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import {
  ensureUserCredits, getUserCredits,
} from "../lib/credits.js";
import { deductTokens, getBalance, getCost } from "../services/tokenService.js";
import { generateContent } from "../lib/contentGeneration.js";
import { publishToPlatform } from "../lib/socialPublishers.js";
import { syncAllAnalyticsForUser, type PostAnalyticsDoc } from "../lib/analyticsSync.js";
import { aiGenerationLimiter } from "../middlewares/rateLimit.js";

const router: IRouter = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

interface BusinessProfileDoc {
  userId: string;
  businessName: string;
  websiteUrl: string;
  destinationUrl: string;
  category: string;
  description: string;
  targetAudience: string;
  location: string;
  mainOffer: string;
  brandTone: string;
  logoUrl?: string;
  brandColors?: string;
  socialLinks?: Record<string, string>;
  phone?: string;
  email?: string;
  bookingUrl?: string;
  googleMapsUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GeneratedContentDoc {
  _id?: ObjectId;
  userId: string;
  businessProfileId?: string;
  contentType: string;
  platforms: string[];
  campaignGoal: string;
  promptInput: Record<string, unknown>;
  generatedCaption: string;
  shortCaption: string;
  longCaption: string;
  hashtags: string[];
  cta: string;
  destinationUrl: string;
  imagePrompt: string;
  imageUrl?: string;
  reelScript: string;
  shotList: string[];
  platformVersions: Record<string, string>;
  suggestedPostingTime: string;
  title: string;
  status: "draft" | "approved" | "queued" | "published" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

interface PublishingJobDoc {
  _id?: ObjectId;
  userId: string;
  generatedContentId: string;
  platforms: string[];
  caption: string;
  mediaUrls?: string[];
  destinationUrl: string;
  customerBusinessName: string;
  scheduledFor?: Date;
  status: "queued" | "publishing" | "published" | "failed" | "cancelled";
  platformResults?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDoc {
  _id: ObjectId;
  email: string;
  name: string;
  phone?: string;
  role: "user" | "admin";
  subscriptionStatus: "none" | "active" | "paused" | "cancelled";
  stripeCustomerId?: string;
  stripePriceId?: string;
  subscriptionPlan?: string;
  subscriptionCurrentPeriodEnd?: Date;
  createdAt: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getUser(userId: string): Promise<UserDoc | null> {
  const col = getCollection<UserDoc>("users");
  return col.findOne({ _id: new ObjectId(userId) } as Parameters<typeof col.findOne>[0]);
}

function packageIdFromUser(user: UserDoc): string {
  if (user.subscriptionStatus !== "active") return "free";
  if (user.stripePriceId?.includes("all")) return "all-monthly";
  if (user.stripePriceId) return user.stripePriceId;
  return "snapchat-monthly";
}

// ── ACCOUNT ───────────────────────────────────────────────────────────────────

router.get("/v1/dashboard/account", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUser(req.user!.userId);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone || null,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan || null,
      stripeCustomerId: user.stripeCustomerId ? "connected" : null,
      createdAt: user.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "GET /dashboard/account error");
    res.status(500).json({ message: "Failed to fetch account" });
  }
});

router.put("/v1/dashboard/account", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body ?? {};
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name?.trim()) updates["name"] = name.trim();
    if (phone !== undefined) updates["phone"] = phone?.trim() || null;

    await getCollection<UserDoc>("users").updateOne(
      { _id: new ObjectId(req.user!.userId) } as Parameters<ReturnType<typeof getCollection<UserDoc>>["updateOne"]>[0],
      { $set: updates }
    );
    res.json({ message: "Account updated" });
  } catch (err) {
    logger.error({ err }, "PUT /dashboard/account error");
    res.status(500).json({ message: "Failed to update account" });
  }
});

// ── BUSINESS PROFILE ──────────────────────────────────────────────────────────

router.get("/v1/dashboard/business", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const col = getCollection<BusinessProfileDoc>("businessProfiles");
    const profile = await col.findOne({ userId: req.user!.userId });
    res.json(profile || null);
  } catch (err) {
    logger.error({ err }, "GET /dashboard/business error");
    res.status(500).json({ message: "Failed to fetch business profile" });
  }
});

router.put("/v1/dashboard/business", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body = req.body ?? {};

    if (!body.businessName?.trim()) {
      res.status(400).json({ message: "Business name is required" });
      return;
    }
    if (!body.destinationUrl?.trim() && !body.websiteUrl?.trim()) {
      res.status(400).json({ message: "Website URL or destination URL is required" });
      return;
    }

    const now = new Date();
    const col = getCollection<BusinessProfileDoc>("businessProfiles");
    const existing = await col.findOne({ userId });

    const profileData: Omit<BusinessProfileDoc, "createdAt"> = {
      userId,
      businessName: body.businessName.trim(),
      websiteUrl: body.websiteUrl?.trim() || "",
      destinationUrl: body.destinationUrl?.trim() || body.websiteUrl?.trim() || "",
      category: body.category?.trim() || "",
      description: body.description?.trim() || "",
      targetAudience: body.targetAudience?.trim() || "",
      location: body.location?.trim() || "",
      mainOffer: body.mainOffer?.trim() || "",
      brandTone: body.brandTone?.trim() || "",
      logoUrl: body.logoUrl || undefined,
      brandColors: body.brandColors?.trim() || undefined,
      socialLinks: body.socialLinks || undefined,
      phone: body.phone?.trim() || undefined,
      email: body.email?.trim() || undefined,
      bookingUrl: body.bookingUrl?.trim() || undefined,
      googleMapsUrl: body.googleMapsUrl?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      updatedAt: now,
    };

    if (existing) {
      await col.updateOne({ userId }, { $set: profileData });
    } else {
      await col.insertOne({ ...profileData, createdAt: now });
    }

    res.json({ message: "Business profile saved", profile: profileData });
  } catch (err) {
    logger.error({ err }, "PUT /dashboard/business error");
    res.status(500).json({ message: "Failed to save business profile" });
  }
});

// ── USAGE / CREDITS ───────────────────────────────────────────────────────────

router.get("/v1/dashboard/usage", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUser(req.user!.userId);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    const packageId = packageIdFromUser(user);
    const credits = await ensureUserCredits(req.user!.userId, packageId);
    res.json(credits);
  } catch (err) {
    logger.error({ err }, "GET /dashboard/usage error");
    res.status(500).json({ message: "Failed to fetch usage" });
  }
});

// ── CONTENT GENERATION ────────────────────────────────────────────────────────

router.post("/v1/dashboard/content/generate", requireAuth, aiGenerationLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contentType, platforms, campaignGoal, offer, tone, audience, extraInstructions, businessProfileId } = req.body ?? {};

    if (!contentType || !campaignGoal || !offer) {
      res.status(400).json({ message: "contentType, campaignGoal, and offer are required" });
      return;
    }

    const col = getCollection<BusinessProfileDoc>("businessProfiles");
    const profile = await col.findOne({ userId });
    if (!profile) {
      res.status(400).json({ message: "Please complete your business profile first" });
      return;
    }

    // Map content type to correct token action
    const tokenActionMap: Record<string, string> = {
      caption:       "caption",   // 3 tokens
      image_post:    "image",     // 10 tokens
      campaign_pack: "campaign",  // 20 tokens
    };
    const tokenAction = tokenActionMap[contentType as string] ?? "content"; // default 5 tokens

    // Token balance check — the only gate for content generation
    const [balance, cost] = await Promise.all([getBalance(userId), getCost(tokenAction)]);
    if (balance < cost) {
      res.status(403).json({ message: "Not enough tokens. Buy more to continue.", code: "INSUFFICIENT_TOKENS", balance, required: cost });
      return;
    }

    const generated = await generateContent({
      contentType,
      platforms: platforms || ["instagram"],
      campaignGoal,
      offer,
      tone: tone || profile.brandTone || "professional",
      audience: audience || profile.targetAudience || "general audience",
      extraInstructions,
      businessProfile: {
        businessName: profile.businessName,
        websiteUrl: profile.websiteUrl,
        destinationUrl: profile.destinationUrl,
        category: profile.category,
        description: profile.description,
        targetAudience: profile.targetAudience,
        location: profile.location,
        mainOffer: profile.mainOffer,
        brandTone: profile.brandTone,
      },
    });

    // Deduct tokens after successful generation — use the content-type-specific action
    await deductTokens(userId, tokenAction, `AI Content Generation (${contentType})`).catch(() => {});

    const now = new Date();
    const contentDoc: GeneratedContentDoc = {
      userId,
      businessProfileId: businessProfileId || undefined,
      contentType,
      platforms: platforms || ["instagram"],
      campaignGoal,
      promptInput: { contentType, platforms, campaignGoal, offer, tone, audience, extraInstructions },
      generatedCaption: generated.caption,
      shortCaption: generated.shortCaption,
      longCaption: generated.longCaption,
      hashtags: generated.hashtags,
      cta: generated.cta,
      destinationUrl: generated.destinationUrl,
      imagePrompt: generated.imagePrompt,
      reelScript: generated.reelScript,
      shotList: generated.shotList,
      platformVersions: generated.platformVersions,
      suggestedPostingTime: generated.suggestedPostingTime,
      title: generated.title,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    const result = await getCollection<GeneratedContentDoc>("generatedContent").insertOne(contentDoc);

    res.json({
      id: result.insertedId.toString(),
      ...contentDoc,
      aiAvailable: !!process.env["CHAT_BOT"],
    });
  } catch (err) {
    logger.error({ err }, "POST /dashboard/content/generate error");
    res.status(500).json({ message: "Content generation failed. Please try again." });
  }
});

// ── CONTENT LIBRARY ───────────────────────────────────────────────────────────

router.get("/v1/dashboard/content", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status, platform, limit = "50", skip = "0" } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { userId };
    if (status) filter["status"] = status;
    if (platform) filter["platforms"] = platform;

    const col = getCollection<GeneratedContentDoc>("generatedContent");
    const items = await col
      .find(filter as Parameters<typeof col.find>[0])
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 100))
      .toArray();

    const total = await col.countDocuments(filter as Parameters<typeof col.countDocuments>[0]);

    res.json({
      items: items.map((i) => ({ ...i, id: i._id!.toString() })),
      total,
    });
  } catch (err) {
    logger.error({ err }, "GET /dashboard/content error");
    res.status(500).json({ message: "Failed to fetch content" });
  }
});

router.get("/v1/dashboard/content/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const col = getCollection<GeneratedContentDoc>("generatedContent");
    const item = await col.findOne({
      _id: new ObjectId(req.params["id"]),
      userId: req.user!.userId,
    } as Parameters<typeof col.findOne>[0]);
    if (!item) { res.status(404).json({ message: "Content not found" }); return; }
    res.json({ ...item, id: item._id!.toString() });
  } catch (err) {
    logger.error({ err }, "GET /dashboard/content/:id error");
    res.status(500).json({ message: "Failed to fetch content item" });
  }
});

router.put("/v1/dashboard/content/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, generatedCaption, shortCaption, longCaption, hashtags, cta, imageUrl, videoUrl } = req.body ?? {};
    const col = getCollection<GeneratedContentDoc>("generatedContent");

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates["status"] = status;
    if (generatedCaption !== undefined) updates["generatedCaption"] = generatedCaption;
    if (shortCaption !== undefined) updates["shortCaption"] = shortCaption;
    if (longCaption !== undefined) updates["longCaption"] = longCaption;
    if (hashtags !== undefined) updates["hashtags"] = hashtags;
    if (cta !== undefined) updates["cta"] = cta;
    if (imageUrl !== undefined) updates["imageUrl"] = imageUrl;
    if (videoUrl !== undefined) updates["videoUrl"] = videoUrl;

    const result = await col.updateOne(
      { _id: new ObjectId(req.params["id"]), userId: req.user!.userId } as Parameters<typeof col.updateOne>[0],
      { $set: updates }
    );

    if (result.matchedCount === 0) { res.status(404).json({ message: "Content not found" }); return; }
    res.json({ message: "Content updated" });
  } catch (err) {
    logger.error({ err }, "PUT /dashboard/content/:id error");
    res.status(500).json({ message: "Failed to update content" });
  }
});

router.delete("/v1/dashboard/content/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const col = getCollection<GeneratedContentDoc>("generatedContent");
    const result = await col.deleteOne({
      _id: new ObjectId(req.params["id"]),
      userId: req.user!.userId,
    } as Parameters<typeof col.deleteOne>[0]);
    if (result.deletedCount === 0) { res.status(404).json({ message: "Content not found" }); return; }
    res.json({ message: "Content deleted" });
  } catch (err) {
    logger.error({ err }, "DELETE /dashboard/content/:id error");
    res.status(500).json({ message: "Failed to delete content" });
  }
});

// ── PUBLISHING QUEUE ──────────────────────────────────────────────────────────

router.get("/v1/dashboard/publishing", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { userId: req.user!.userId };
    if (status) filter["status"] = status;

    const col = getCollection<PublishingJobDoc>("publishingJobs");
    const jobs = await col
      .find(filter as Parameters<typeof col.find>[0])
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({ jobs: jobs.map((j) => ({ ...j, id: j._id!.toString() })) });
  } catch (err) {
    logger.error({ err }, "GET /dashboard/publishing error");
    res.status(500).json({ message: "Failed to fetch publishing queue" });
  }
});

router.post("/v1/dashboard/publishing", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { generatedContentId, platforms, scheduledFor } = req.body ?? {};

    if (!generatedContentId || !platforms?.length) {
      res.status(400).json({ message: "generatedContentId and platforms are required" });
      return;
    }

    const contentCol = getCollection<GeneratedContentDoc>("generatedContent");
    const content = await contentCol.findOne({
      _id: new ObjectId(generatedContentId),
      userId,
    } as Parameters<typeof contentCol.findOne>[0]);

    if (!content) { res.status(404).json({ message: "Content not found" }); return; }
    if (content.status !== "approved") {
      res.status(400).json({ message: "Content must be approved before queuing for publishing" });
      return;
    }

    const profile = await getCollection<BusinessProfileDoc>("businessProfiles").findOne({ userId });
    if (!profile?.destinationUrl) {
      res.status(400).json({ message: "Business profile with destination URL required before publishing" });
      return;
    }

    const now = new Date();
    const job: PublishingJobDoc = {
      userId,
      generatedContentId,
      platforms,
      caption: content.generatedCaption,
      mediaUrls: content.imageUrl ? [content.imageUrl] : [],
      destinationUrl: content.destinationUrl || profile.destinationUrl,
      customerBusinessName: profile.businessName,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };

    const result = await getCollection<PublishingJobDoc>("publishingJobs").insertOne(job);

    await contentCol.updateOne(
      { _id: new ObjectId(generatedContentId) } as Parameters<typeof contentCol.updateOne>[0],
      { $set: { status: "queued", updatedAt: now } }
    );

    res.json({ id: result.insertedId.toString(), message: "Added to publishing queue" });
  } catch (err) {
    logger.error({ err }, "POST /dashboard/publishing error");
    res.status(500).json({ message: "Failed to create publishing job" });
  }
});

router.post("/v1/dashboard/publishing/:id/publish", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const jobCol = getCollection<PublishingJobDoc>("publishingJobs");

    const job = await jobCol.findOne({
      _id: new ObjectId(req.params["id"]),
      userId,
    } as Parameters<typeof jobCol.findOne>[0]);

    if (!job) { res.status(404).json({ message: "Publishing job not found" }); return; }
    if (job.status === "published") { res.status(400).json({ message: "Already published" }); return; }

    await jobCol.updateOne(
      { _id: new ObjectId(req.params["id"]) } as Parameters<typeof jobCol.updateOne>[0],
      { $set: { status: "publishing", updatedAt: new Date() } }
    );

    const results: Record<string, unknown> = {};
    let anySuccess = false;

    for (const platform of job.platforms) {
      const result = await publishToPlatform(platform, {
        caption: job.caption,
        mediaUrls: job.mediaUrls,
        destinationUrl: job.destinationUrl,
        platform,
        scheduledFor: job.scheduledFor,
        customerBusinessName: job.customerBusinessName,
      });
      results[platform] = result;
      if (result.success) anySuccess = true;
    }

    const finalStatus = anySuccess ? "published" : "failed";

    if (anySuccess) {
      const analyticsCol = getCollection<PostAnalyticsDoc>("postAnalytics");
      const now2 = new Date();
      for (const [platform, result] of Object.entries(results)) {
        const r = result as { success: boolean; postId?: string; postUrl?: string };
        if (r.success) {
          await analyticsCol.insertOne({
            userId,
            generatedContentId: job.generatedContentId,
            publishingJobId: req.params["id"],
            platform,
            postId: r.postId,
            postUrl: r.postUrl,
            businessName: job.customerBusinessName,
            destinationUrl: job.destinationUrl,
            impressions: 0,
            reach: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0,
            clicks: 0,
            ctr: 0,
            engagementRate: 0,
            analyticsStatus: "pending",
            publishedAt: now2,
            createdAt: now2,
            updatedAt: now2,
          });
        }
      }
    }

    await jobCol.updateOne(
      { _id: new ObjectId(req.params["id"]) } as Parameters<typeof jobCol.updateOne>[0],
      { $set: { status: finalStatus, platformResults: results, updatedAt: new Date() } }
    );

    if (anySuccess) {
      await getCollection<GeneratedContentDoc>("generatedContent").updateOne(
        { _id: new ObjectId(job.generatedContentId) } as Parameters<ReturnType<typeof getCollection<GeneratedContentDoc>>["updateOne"]>[0],
        { $set: { status: "published", updatedAt: new Date() } }
      );
    }

    res.json({ status: finalStatus, platformResults: results });
  } catch (err) {
    logger.error({ err }, "POST /dashboard/publishing/:id/publish error");
    res.status(500).json({ message: "Publishing failed" });
  }
});

router.post("/v1/dashboard/publishing/:id/cancel", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const jobCol = getCollection<PublishingJobDoc>("publishingJobs");
    const result = await jobCol.updateOne(
      { _id: new ObjectId(req.params["id"]), userId: req.user!.userId, status: "queued" } as Parameters<typeof jobCol.updateOne>[0],
      { $set: { status: "cancelled", updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) { res.status(404).json({ message: "Job not found or cannot be cancelled" }); return; }
    res.json({ message: "Publishing job cancelled" });
  } catch (err) {
    logger.error({ err }, "POST /dashboard/publishing/:id/cancel error");
    res.status(500).json({ message: "Failed to cancel job" });
  }
});

// Submit for admin review
router.post("/v1/dashboard/publishing/:id/submit-review", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const jobCol = getCollection<PublishingJobDoc>("publishingJobs");
    const result = await jobCol.updateOne(
      { _id: new ObjectId(req.params["id"]), userId, status: { $in: ["queued", "failed", "rejected"] } } as Parameters<typeof jobCol.updateOne>[0],
      { $set: { status: "pending_review", submittedAt: new Date(), updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      res.status(404).json({ message: "Job not found or already under review" });
      return;
    }
    res.json({ message: "Submitted for admin review" });
  } catch (err) {
    logger.error({ err }, "POST /dashboard/publishing/:id/submit-review error");
    res.status(500).json({ message: "Failed to submit for review" });
  }
});

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

router.get("/v1/dashboard/analytics", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const contentCol = getCollection<GeneratedContentDoc>("generatedContent");
    const jobCol = getCollection<PublishingJobDoc>("publishingJobs");
    const analyticsCol = getCollection<PostAnalyticsDoc>("postAnalytics");

    const [totalContent, published, drafts, approved, queued] = await Promise.all([
      contentCol.countDocuments({ userId } as Parameters<typeof contentCol.countDocuments>[0]),
      contentCol.countDocuments({ userId, status: "published" } as Parameters<typeof contentCol.countDocuments>[0]),
      contentCol.countDocuments({ userId, status: "draft" } as Parameters<typeof contentCol.countDocuments>[0]),
      contentCol.countDocuments({ userId, status: "approved" } as Parameters<typeof contentCol.countDocuments>[0]),
      contentCol.countDocuments({ userId, status: "queued" } as Parameters<typeof contentCol.countDocuments>[0]),
    ]);

    const publishedJobs = await jobCol
      .find({ userId, status: "published" } as Parameters<typeof jobCol.find>[0])
      .toArray();

    const platformCounts: Record<string, number> = {};
    for (const job of publishedJobs) {
      for (const p of job.platforms) {
        platformCounts[p] = (platformCounts[p] || 0) + 1;
      }
    }

    const postAnalyticsDocs = await analyticsCol
      .find({ userId } as Parameters<typeof analyticsCol.find>[0])
      .toArray();

    const totalPublishedPosts = postAnalyticsDocs.length;
    const totalImpressions = postAnalyticsDocs.reduce((s, d) => s + d.impressions, 0);
    const totalClicks = postAnalyticsDocs.reduce((s, d) => s + d.clicks, 0);
    const avgEngagementRate = totalPublishedPosts > 0
      ? parseFloat((postAnalyticsDocs.reduce((s, d) => s + d.engagementRate, 0) / totalPublishedPosts).toFixed(2))
      : 0;

    const platformEngagement: Record<string, { total: number; count: number }> = {};
    for (const d of postAnalyticsDocs) {
      if (!platformEngagement[d.platform]) platformEngagement[d.platform] = { total: 0, count: 0 };
      platformEngagement[d.platform].total += d.engagementRate;
      platformEngagement[d.platform].count += 1;
    }
    let bestPlatform: string | null = null;
    let bestAvg = 0;
    for (const [plat, { total, count }] of Object.entries(platformEngagement)) {
      const avg = total / count;
      if (avg > bestAvg) { bestAvg = avg; bestPlatform = plat; }
    }

    const topDoc = [...postAnalyticsDocs].sort((a, b) => b.impressions - a.impressions)[0] ?? null;
    const topPost = topDoc ? {
      id: topDoc._id!.toString(),
      platform: topDoc.platform,
      businessName: topDoc.businessName,
      publishedAt: topDoc.publishedAt,
      impressions: topDoc.impressions,
      clicks: topDoc.clicks,
      engagementRate: topDoc.engagementRate,
      postUrl: topDoc.postUrl,
    } : null;

    res.json({
      overview: { totalContent, published, drafts, approved, queued },
      postMetrics: { totalPublishedPosts, totalImpressions, totalClicks, avgEngagementRate, bestPlatform, topPost },
      platformCounts,
      aiAvailable: !!process.env["CHAT_BOT"],
      socialPlatformsConfigured: {
        meta: !!(process.env["META_PAGE_ACCESS_TOKEN"] && process.env["META_PAGE_ID"]),
        instagram: !!(process.env["META_PAGE_ACCESS_TOKEN"] && process.env["INSTAGRAM_BUSINESS_ACCOUNT_ID"]),
        tiktok: !!process.env["TIKTOK_ACCESS_TOKEN"],
        linkedin: !!(process.env["LINKEDIN_ACCESS_TOKEN"] && process.env["LINKEDIN_ORGANIZATION_ID"]),
        x: !!(process.env["X_API_KEY"] && process.env["X_ACCESS_TOKEN"]),
        youtube: !!(process.env["YOUTUBE_REFRESH_TOKEN"] && process.env["YOUTUBE_CHANNEL_ID"]),
        snapchat: !!process.env["SNAP_ACCESS_TOKEN"],
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /dashboard/analytics error");
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

router.get("/v1/dashboard/analytics/posts", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const analyticsCol = getCollection<PostAnalyticsDoc>("postAnalytics");
    const posts = await analyticsCol
      .find({ userId } as Parameters<typeof analyticsCol.find>[0])
      .sort({ publishedAt: -1 })
      .toArray();
    res.json({ posts: posts.map(p => ({ ...p, id: p._id!.toString() })), total: posts.length });
  } catch (err) {
    logger.error({ err }, "GET /dashboard/analytics/posts error");
    res.status(500).json({ message: "Failed to fetch post analytics" });
  }
});

router.get("/v1/dashboard/analytics/performance", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const analyticsCol = getCollection<PostAnalyticsDoc>("postAnalytics");
    const docs = await analyticsCol
      .find({ userId } as Parameters<typeof analyticsCol.find>[0])
      .toArray();

    const byPlatformMap: Record<string, { postCount: number; totalImpressions: number; totalReach: number; totalLikes: number; totalComments: number; totalShares: number; totalClicks: number; totalCtr: number; totalEngagementRate: number }> = {};

    for (const d of docs) {
      if (!byPlatformMap[d.platform]) {
        byPlatformMap[d.platform] = { postCount: 0, totalImpressions: 0, totalReach: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalClicks: 0, totalCtr: 0, totalEngagementRate: 0 };
      }
      const p = byPlatformMap[d.platform];
      p.postCount++;
      p.totalImpressions += d.impressions;
      p.totalReach += d.reach;
      p.totalLikes += d.likes;
      p.totalComments += d.comments;
      p.totalShares += d.shares;
      p.totalClicks += d.clicks;
      p.totalCtr += d.ctr;
      p.totalEngagementRate += d.engagementRate;
    }

    const byPlatform = Object.entries(byPlatformMap).map(([platform, p]) => ({
      platform,
      postCount: p.postCount,
      totalImpressions: p.totalImpressions,
      totalReach: p.totalReach,
      totalLikes: p.totalLikes,
      totalComments: p.totalComments,
      totalShares: p.totalShares,
      totalClicks: p.totalClicks,
      avgCtr: parseFloat((p.totalCtr / p.postCount).toFixed(2)),
      avgEngagementRate: parseFloat((p.totalEngagementRate / p.postCount).toFixed(2)),
    })).sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

    const bestPlatform = byPlatform[0]?.platform ?? null;
    const topDoc = [...docs].sort((a, b) => b.impressions - a.impressions)[0] ?? null;
    const topPost = topDoc ? {
      id: topDoc._id!.toString(),
      platform: topDoc.platform,
      businessName: topDoc.businessName,
      publishedAt: topDoc.publishedAt,
      impressions: topDoc.impressions,
      clicks: topDoc.clicks,
      engagementRate: topDoc.engagementRate,
      postUrl: topDoc.postUrl,
    } : null;

    const totals = {
      impressions: docs.reduce((s, d) => s + d.impressions, 0),
      reach: docs.reduce((s, d) => s + d.reach, 0),
      clicks: docs.reduce((s, d) => s + d.clicks, 0),
      likes: docs.reduce((s, d) => s + d.likes, 0),
      avgEngagementRate: docs.length > 0
        ? parseFloat((docs.reduce((s, d) => s + d.engagementRate, 0) / docs.length).toFixed(2))
        : 0,
      totalPosts: docs.length,
    };

    res.json({ byPlatform, bestPlatform, topPost, totals });
  } catch (err) {
    logger.error({ err }, "GET /dashboard/analytics/performance error");
    res.status(500).json({ message: "Failed to fetch performance data" });
  }
});

router.post("/v1/dashboard/analytics/sync", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await syncAllAnalyticsForUser(userId);
    res.json({ message: "Sync complete", ...result });
  } catch (err) {
    logger.error({ err }, "POST /dashboard/analytics/sync error");
    res.status(500).json({ message: "Sync failed" });
  }
});

// ── Strategy Report ────────────────────────────────────────────────────────────

interface StrategyReport {
  _id?: ObjectId;
  userId: string;
  businessName?: string;
  summary: string;
  recommendedPlatforms: { name: string; priority: "High" | "Medium" | "Low"; reason: string }[];
  contentPlan: { type: string; count: number; desc: string }[];
  postingSchedule: { day: string; content: string; format: string }[];
  campaignIdeas: { title: string; desc: string; platform: string }[];
  nextActions: { action: string; done: boolean }[];
  aiGenerated: boolean;
  createdAt: Date;
}

function buildStrategyTemplate(
  businessName: string,
  category: string,
  goal: string,
): Omit<StrategyReport, "_id" | "userId" | "createdAt"> {
  const name = businessName || "Your Business";
  return {
    businessName: name,
    aiGenerated: false,
    summary: `Based on your business profile, the best growth strategy for ${name} is to focus on short-form video and image content across 2–3 high-impact platforms. Consistent posting combined with targeted ad spend will drive customer acquisition and brand awareness over the next 90 days.`,
    recommendedPlatforms: [
      { name: "Instagram", priority: "High", reason: "Visual-first platform with the highest engagement rates for local businesses. Reels and Stories drive organic reach." },
      { name: "Facebook", priority: "High", reason: "Largest audience reach for targeted local advertising with excellent ROI for lead generation campaigns." },
      { name: "Google", priority: "Medium", reason: "Search intent advertising captures high-purchase-intent customers actively looking for your services." },
      { name: "TikTok", priority: "Low", reason: "Growing platform with strong organic reach for video-first content. Best for brand awareness campaigns." },
    ],
    contentPlan: [
      { type: "Short-form Videos", count: 8, desc: "Reels and TikToks showcasing your product, service, or behind-the-scenes content" },
      { type: "Image Posts", count: 12, desc: "High-quality product/service photos with engaging captions and CTAs" },
      { type: "Stories", count: 20, desc: "Daily engagement with polls, Q&As, and limited-time offers" },
      { type: "Carousel Posts", count: 4, desc: "Multi-image posts for showcasing product ranges or customer testimonials" },
    ],
    postingSchedule: [
      { day: "Monday", content: "Motivational/value post", format: "Image or Carousel" },
      { day: "Tuesday", content: "Product/service showcase", format: "Short-form Video" },
      { day: "Wednesday", content: "Customer story or testimonial", format: "Image + Caption" },
      { day: "Thursday", content: "Behind-the-scenes or process", format: "Video or Story" },
      { day: "Friday", content: "Offer or promotion", format: "Carousel or Reel" },
      { day: "Saturday", content: "Community or lifestyle content", format: "Image or Video" },
      { day: "Sunday", content: "Preview of the week ahead", format: "Story series" },
    ],
    campaignIdeas: [
      { title: `"Why Choose ${name}?" Campaign`, desc: "A testimonial-driven video series featuring real customer stories and results.", platform: "Facebook + Instagram" },
      { title: "Seasonal Promotion Push", desc: "Time-limited offers with countdown urgency driving conversions through Story ads.", platform: "Instagram Stories" },
      { title: "Local Awareness Campaign", desc: "Geo-targeted ads showing to people within 10 miles of your location.", platform: "Google + Meta" },
      { title: "Brand Authority Content", desc: "Educational posts positioning you as the trusted expert in your category.", platform: "LinkedIn + Facebook" },
    ],
    nextActions: [
      { action: "Complete your business profile with logo, brand colors, and destination URL", done: false },
      { action: "Generate your first AI content pack in the Content Studio", done: false },
      { action: "Connect your social media accounts for direct publishing", done: false },
      { action: "Set up your first paid campaign budget ($10–$30/day to start)", done: false },
      { action: "Review and approve content before scheduling it to publish", done: false },
    ],
  };
}

router.get("/v1/dashboard/strategy", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const coll = getCollection<StrategyReport>("strategyReports");
    const doc = await coll.findOne({ userId }, { sort: { createdAt: -1 } });
    if (!doc) return res.json(null);
    res.json({ ...doc, _id: doc._id?.toString() });
  } catch (err) {
    logger.error({ err }, "GET /dashboard/strategy error");
    res.status(500).json({ message: "Failed to fetch strategy" });
  }
});

router.post("/v1/dashboard/strategy/generate", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Load business profile
    const profileColl = getCollection<BusinessProfileDoc>("businessProfiles");
    const profile = await profileColl.findOne({ userId });

    if (!profile) {
      return res.status(422).json({ message: "Please complete your business profile before generating a strategy." });
    }

    const { callAIJson, isAIReady } = await import("../lib/ai.js");

    let strategyData: Omit<StrategyReport, "_id" | "userId" | "createdAt">;

    if (isAIReady()) {
      try {
        const prompt = `You are a senior digital marketing strategist. Create a comprehensive AI growth strategy report for:

Business Name: ${profile.businessName}
Category: ${profile.category}
Description: ${profile.description || "Not provided"}
Target Audience: ${profile.targetAudience || "Not provided"}
Location: ${profile.location || "Not provided"}
Main Offer: ${profile.mainOffer || "Not provided"}
Brand Tone: ${profile.brandTone || "Professional"}

Return a JSON object with exactly these fields:
- summary (string, 2-3 sentences, strategic overview)
- recommendedPlatforms (array of objects: {name, priority ("High"|"Medium"|"Low"), reason})
- contentPlan (array of objects: {type, count (number, monthly), desc})
- postingSchedule (array of 7 objects for each day: {day, content, format})
- campaignIdeas (array of 4 objects: {title, desc, platform})
- nextActions (array of 5 objects: {action (string), done (always false)})
- aiGenerated (always true)
- businessName (same as Business Name above)

Return only valid JSON.`;

        const aiResult = await callAIJson<Omit<StrategyReport, "_id" | "userId" | "createdAt">>(
          [{ role: "user", content: prompt }],
          { maxTokens: 1200, temperature: 0.7 }
        );

        strategyData = aiResult ?? buildStrategyTemplate(profile.businessName, profile.category, "Grow the business");
      } catch (aiErr) {
        logger.warn({ aiErr }, "Strategy AI generation failed — using template");
        strategyData = buildStrategyTemplate(profile.businessName, profile.category, "Grow the business");
      }
    } else {
      strategyData = buildStrategyTemplate(profile.businessName, profile.category, "Grow the business");
    }

    const coll = getCollection<StrategyReport>("strategyReports");
    const doc: StrategyReport = {
      ...strategyData,
      userId,
      createdAt: new Date(),
    };
    const result = await coll.insertOne(doc);
    res.json({ ...doc, _id: result.insertedId.toString() });
  } catch (err) {
    logger.error({ err }, "POST /dashboard/strategy/generate error");
    res.status(500).json({ message: "Failed to generate strategy" });
  }
});

export default router;
