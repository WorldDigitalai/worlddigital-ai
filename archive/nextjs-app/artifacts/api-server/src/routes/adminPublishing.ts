/**
 * Admin Publishing Queue — extended workflow.
 * Routes:
 *   GET  /v1/admin/publishing/queue   — all jobs with full status
 *   POST /v1/admin/publishing/:id/approve         — approve → scheduled/publishing
 *   POST /v1/admin/publishing/:id/reject          — reject with reason
 *   POST /v1/admin/publishing/:id/retry           — reset to pending_review
 *   POST /v1/admin/publishing/:id/manual-complete — force published
 *
 * Publishing job statuses:
 *   draft → pending_review → approved → scheduled → publishing → published | failed
 */

import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import { logAdminAudit } from "../lib/activityLogger.js";

const router = Router();

// ── Admin auth (same as admin.ts) ──────────────────────────────────────────────

function getAdminSecret(): string {
  return process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
}

function requireAdmin(req: Request, res: Response, next: () => void): void {
  const auth = req.headers["authorization"];
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

// ── GET /v1/admin/publishing/queue ────────────────────────────────────────────

router.get("/v1/admin/publishing/queue", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { status, limit = "100", skip = "0" } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = {};
      if (status && status !== "all") filter["status"] = status;

      const jobs = await getCollection("publishingJobs")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();

      const total = await getCollection("publishingJobs").countDocuments(filter);

      // Enrich with business profiles
      const userIds = [...new Set(jobs.map((j) => (j as Record<string, unknown>)["userId"] as string))];
      const profiles = await getCollection("businessProfiles")
        .find({ userId: { $in: userIds } })
        .toArray();
      const profileMap = new Map(
        (profiles as Array<Record<string, unknown>>).map((p) => [String(p["userId"]), p])
      );

      const enriched = jobs.map((j) => ({
        ...j,
        id: (j._id as ObjectId).toString(),
        businessProfile: profileMap.get(String((j as Record<string, unknown>)["userId"])) ?? null,
      }));

      res.json({ jobs: enriched, total });
    } catch (err) {
      logger.error({ err }, "admin publishing queue error");
      res.status(500).json({ message: "Failed to load publishing queue" });
    }
  });
});

// ── POST /v1/admin/publishing/:id/approve ────────────────────────────────────

router.post("/v1/admin/publishing/:id/approve", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      let oid: ObjectId;
      const rawId = String(req.params["id"]);
      try { oid = new ObjectId(rawId); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const jobCol = getCollection("publishingJobs");
      const job = await jobCol.findOne({ _id: oid });
      if (!job) { res.status(404).json({ message: "Job not found" }); return; }

      await jobCol.updateOne(
        { _id: oid },
        { $set: { status: "approved", approvedAt: new Date(), updatedAt: new Date() } }
      );

      // Also mark associated content as approved
      const jobDoc = job as Record<string, unknown>;
      if (jobDoc["generatedContentId"]) {
        await getCollection("generatedContent").updateOne(
          { _id: new ObjectId(String(jobDoc["generatedContentId"])) },
          { $set: { status: "approved", updatedAt: new Date() } }
        );
      }

      await logAdminAudit("admin", "approve_publishing_job", "publishing_job", {
        targetId: rawId,
        metadata: { customerBusinessName: jobDoc["customerBusinessName"] },
      });

      logger.info({ jobId: rawId }, "Admin approved publishing job");
      res.json({ message: "Job approved" });
    } catch (err) {
      logger.error({ err }, "admin approve publishing job error");
      res.status(500).json({ message: "Failed to approve job" });
    }
  });
});

// ── POST /v1/admin/publishing/:id/reject ─────────────────────────────────────

router.post("/v1/admin/publishing/:id/reject", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { reason } = req.body ?? {};
      const rawId = String(req.params["id"]);
      let oid: ObjectId;
      try { oid = new ObjectId(rawId); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const jobCol = getCollection("publishingJobs");
      const job = await jobCol.findOne({ _id: oid });
      if (!job) { res.status(404).json({ message: "Job not found" }); return; }

      await jobCol.updateOne(
        { _id: oid },
        {
          $set: {
            status: "rejected",
            rejectionReason: reason || "Rejected by admin",
            rejectedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      // Revert content to draft
      const jobDoc = job as Record<string, unknown>;
      if (jobDoc["generatedContentId"]) {
        await getCollection("generatedContent").updateOne(
          { _id: new ObjectId(String(jobDoc["generatedContentId"])) },
          { $set: { status: "draft", updatedAt: new Date() } }
        );
      }

      await logAdminAudit("admin", "reject_publishing_job", "publishing_job", {
        targetId: rawId,
        metadata: { reason, customerBusinessName: jobDoc["customerBusinessName"] },
      });

      logger.info({ jobId: rawId, reason }, "Admin rejected publishing job");
      res.json({ message: "Job rejected" });
    } catch (err) {
      logger.error({ err }, "admin reject publishing job error");
      res.status(500).json({ message: "Failed to reject job" });
    }
  });
});

// ── POST /v1/admin/publishing/:id/retry ──────────────────────────────────────

router.post("/v1/admin/publishing/:id/retry", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const rawId = String(req.params["id"]);
      let oid: ObjectId;
      try { oid = new ObjectId(rawId); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      await getCollection("publishingJobs").updateOne(
        { _id: oid },
        {
          $set: {
            status: "pending_review",
            error: null,
            rejectionReason: null,
            updatedAt: new Date(),
          },
          $inc: { retryCount: 1 },
        }
      );

      await logAdminAudit("admin", "retry_publishing_job", "publishing_job", { targetId: rawId });

      res.json({ message: "Job queued for retry" });
    } catch (err) {
      logger.error({ err }, "admin retry publishing job error");
      res.status(500).json({ message: "Failed to retry job" });
    }
  });
});

// ── POST /v1/admin/publishing/:id/manual-complete ────────────────────────────

router.post("/v1/admin/publishing/:id/manual-complete", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { note } = req.body ?? {};
      const rawId = String(req.params["id"]);
      let oid: ObjectId;
      try { oid = new ObjectId(rawId); } catch { res.status(400).json({ message: "Invalid ID" }); return; }

      const job = await getCollection("publishingJobs").findOne({ _id: oid });
      if (!job) { res.status(404).json({ message: "Job not found" }); return; }

      await getCollection("publishingJobs").updateOne(
        { _id: oid },
        {
          $set: {
            status: "published",
            manuallyCompleted: true,
            manualNote: note || "Marked complete by admin",
            publishedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      const jobDoc = job as Record<string, unknown>;
      if (jobDoc["generatedContentId"]) {
        await getCollection("generatedContent").updateOne(
          { _id: new ObjectId(String(jobDoc["generatedContentId"])) },
          { $set: { status: "published", updatedAt: new Date() } }
        );
      }

      await logAdminAudit("admin", "manual_complete_publishing_job", "publishing_job", {
        targetId: rawId,
        metadata: { note },
      });

      res.json({ message: "Job marked as complete" });
    } catch (err) {
      logger.error({ err }, "admin manual complete error");
      res.status(500).json({ message: "Failed to mark job complete" });
    }
  });
});

// ── POST /v1/admin/publishing/queue-caption ──────────────────────────────────
// Accepts a generated caption and saves it as a pending publishing job.

router.post("/v1/admin/publishing/queue-caption", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { platform, caption, hashtags, cta, landingUrl, source } = req.body as {
        platform?: string;
        caption?: string;
        hashtags?: string[];
        cta?: string;
        landingUrl?: string;
        source?: string;
      };

      if (!platform || !caption) {
        res.status(400).json({ message: "platform and caption are required" });
        return;
      }

      const now = new Date();
      const doc = {
        platform,
        caption,
        hashtags: (hashtags ?? []).slice(0, 5),
        cta: cta ?? "",
        landingUrl: landingUrl ?? "https://worlddigital.ai",
        source: source ?? "admin-caption-generator",
        status: "pending_review",
        type: "admin-caption",
        userId: "admin",
        createdAt: now,
        updatedAt: now,
      };

      const result = await getCollection("publishingJobs").insertOne(doc);
      logger.info({ id: result.insertedId, platform }, "Admin caption queued for publishing");
      res.json({ message: "Caption added to publishing queue", id: result.insertedId });
    } catch (err) {
      logger.error({ err }, "admin queue caption error");
      res.status(500).json({ message: "Failed to queue caption" });
    }
  });
});

// ── GET /v1/admin/publishing/stats ────────────────────────────────────────────

router.get("/v1/admin/publishing/stats", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const all = await getCollection("publishingJobs").find({}).toArray() as Array<Record<string, unknown>>;
      const byStatus: Record<string, number> = {};
      for (const j of all) {
        const s = String(j["status"] ?? "unknown");
        byStatus[s] = (byStatus[s] ?? 0) + 1;
      }
      res.json({ total: all.length, byStatus });
    } catch (err) {
      logger.error({ err }, "admin publishing stats error");
      res.status(500).json({ message: "Failed to load publishing stats" });
    }
  });
});

export default router;
