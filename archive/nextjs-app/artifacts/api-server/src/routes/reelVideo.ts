/**
 * Reel Video Generation Routes
 *
 * POST /v1/ai/reel-video/start        — start a video generation job
 * GET  /v1/ai/reel-video/status/:jobId — poll job status
 * POST /v1/ai/reel-video/regenerate   — restart a failed/completed job
 * GET  /v1/ai/reel-video/capability   — check if video generation is available
 */

import { Router } from "express";
import type { Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import {
  startVideoGeneration,
  getVideoJob,
  getVideoJobsByContent,
  checkVideoCapability,
} from "../services/aiVideoService.js";
import { deductTokens, getBalance, getCost } from "../services/tokenService.js";
import { logger } from "../lib/logger.js";

const router = Router();

/** Map requested duration to the matching token action key */
function videoTokenAction(durationSeconds: number): string {
  if (durationSeconds >= 30) return "video_30s";
  if (durationSeconds >= 15) return "video_15s";
  return "video_8s"; // default — 100 tokens
}

// ── POST /v1/ai/reel-video/start ──────────────────────────────────────────────

router.post(
  "/v1/ai/reel-video/start",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const {
        contentId,
        script,
        shotList = [],
        businessProfile,
        platform,
        durationSeconds,
        aspectRatio,
        style,
        ctaUrl,
      } = req.body as {
        contentId?: string;
        script?: string;
        shotList?: string[];
        businessProfile?: { businessName?: string };
        platform?: string;
        durationSeconds?: number;
        aspectRatio?: string;
        style?: string;
        ctaUrl?: string;
      };

      if (!contentId) {
        return res.status(400).json({ success: false, error: "contentId is required" });
      }
      if (!script || !script.trim()) {
        return res.status(400).json({ success: false, error: "script is required" });
      }

      const dur = durationSeconds ?? 8;
      const tokenAction = videoTokenAction(dur);

      // ── Token balance check (before touching Runway) ─────────────────────────
      const [balance, cost] = await Promise.all([getBalance(userId), getCost(tokenAction)]);
      if (balance < cost) {
        return res.status(403).json({
          success: false,
          error: `Not enough tokens. Video generation costs ${cost} tokens. You have ${balance}.`,
          code: "INSUFFICIENT_TOKENS",
          balance,
          required: cost,
        });
      }

      const result = await startVideoGeneration({
        contentId,
        userId,
        script,
        shotList: Array.isArray(shotList) ? shotList : [],
        businessName: businessProfile?.businessName,
        platform,
        durationSeconds: dur,
        aspectRatio: aspectRatio ?? "9:16",
        style: style ?? "professional",
        ctaUrl: ctaUrl ?? "",
      });

      logger.info({ userId, contentId, jobId: result.jobId, status: result.status }, "Reel video job started");

      // Deduct tokens only if the job was actually queued — not if unsupported (Runway key missing)
      if (result.status !== "unsupported") {
        await deductTokens(
          userId,
          tokenAction,
          `AI Video Generation (${dur}s) — job ${result.jobId}`
        ).catch((e) => logger.error({ e }, "Video token deduction failed"));
        logger.info({ userId, jobId: result.jobId, tokenAction, cost }, "Video tokens deducted");
      }

      return res.status(202).json({
        success: true,
        jobId: result.jobId,
        status: result.status,
        unsupportedReason: result.unsupportedReason ?? null,
        tokenCost: result.status !== "unsupported" ? cost : 0,
      });
    } catch (err) {
      logger.error({ err }, "POST /v1/ai/reel-video/start error");
      return res.status(500).json({ success: false, error: "Failed to start video generation" });
    }
  }
);

// ── GET /v1/ai/reel-video/status/:jobId ───────────────────────────────────────

router.get(
  "/v1/ai/reel-video/status/:jobId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const jobId = req.params["jobId"] as string;

      const job = await getVideoJob(jobId, userId);
      if (!job) {
        return res.status(404).json({ success: false, error: "Video job not found" });
      }

      return res.json({
        success: true,
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        error: job.error,
        errorCode: job.errorCode,
        unsupportedReason: job.unsupportedReason,
        platform: job.platform,
        durationSeconds: job.durationSeconds,
        aspectRatio: job.aspectRatio,
        updatedAt: job.updatedAt,
      });
    } catch (err) {
      logger.error({ err }, "GET /v1/ai/reel-video/status error");
      return res.status(500).json({ success: false, error: "Failed to get video job status" });
    }
  }
);

// ── GET /v1/ai/reel-video/by-content/:contentId ───────────────────────────────

router.get(
  "/v1/ai/reel-video/by-content/:contentId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const contentId = req.params["contentId"] as string;
      const jobs = await getVideoJobsByContent(contentId, userId);
      return res.json({ success: true, jobs });
    } catch (err) {
      logger.error({ err }, "GET /v1/ai/reel-video/by-content error");
      return res.status(500).json({ success: false, error: "Failed to get video jobs" });
    }
  }
);

// ── POST /v1/ai/reel-video/regenerate ─────────────────────────────────────────
// Restarts from the same script — creates a new job and deducts tokens again

router.post(
  "/v1/ai/reel-video/regenerate",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { jobId } = req.body as { jobId?: string };

      if (!jobId) {
        return res.status(400).json({ success: false, error: "jobId is required" });
      }

      const existingJob = await getVideoJob(jobId, userId);
      if (!existingJob) {
        return res.status(404).json({ success: false, error: "Original video job not found" });
      }

      // Only allow regeneration for finished jobs
      if (existingJob.status === "queued" || existingJob.status === "generating" || existingJob.status === "rendering") {
        return res.status(409).json({
          success: false,
          error: "Cannot regenerate — video is still processing. Wait for it to finish first.",
        });
      }

      const dur = existingJob.durationSeconds ?? 8;
      const tokenAction = videoTokenAction(dur);

      // ── Token balance check ──────────────────────────────────────────────────
      const [balance, cost] = await Promise.all([getBalance(userId), getCost(tokenAction)]);
      if (balance < cost) {
        return res.status(403).json({
          success: false,
          error: `Not enough tokens. Video regeneration costs ${cost} tokens. You have ${balance}.`,
          code: "INSUFFICIENT_TOKENS",
          balance,
          required: cost,
        });
      }

      const result = await startVideoGeneration({
        contentId: existingJob.contentId,
        userId,
        script: existingJob.script,
        shotList: existingJob.shotList,
        businessName: existingJob.businessName,
        platform: existingJob.platform,
        durationSeconds: dur,
        aspectRatio: existingJob.aspectRatio,
        style: existingJob.style,
        ctaUrl: existingJob.ctaUrl,
      });

      logger.info(
        { userId, oldJobId: jobId, newJobId: result.jobId, status: result.status },
        "Reel video regeneration started"
      );

      // Deduct tokens for the new job (regeneration costs the same as a fresh generation)
      if (result.status !== "unsupported") {
        await deductTokens(
          userId,
          tokenAction,
          `AI Video Regeneration (${dur}s) — job ${result.jobId}`
        ).catch((e) => logger.error({ e }, "Video regeneration token deduction failed"));
        logger.info({ userId, jobId: result.jobId, tokenAction, cost }, "Video regeneration tokens deducted");
      }

      return res.status(202).json({
        success: true,
        jobId: result.jobId,
        status: result.status,
        unsupportedReason: result.unsupportedReason ?? null,
        tokenCost: result.status !== "unsupported" ? cost : 0,
      });
    } catch (err) {
      logger.error({ err }, "POST /v1/ai/reel-video/regenerate error");
      return res.status(500).json({ success: false, error: "Failed to start regeneration" });
    }
  }
);

// ── GET /v1/ai/reel-video/capability ──────────────────────────────────────────

router.get(
  "/v1/ai/reel-video/capability",
  requireAuth,
  async (_req: AuthRequest, res: Response) => {
    try {
      const result = await checkVideoCapability();
      return res.json({ success: true, ...result });
    } catch (err) {
      logger.error({ err }, "GET /v1/ai/reel-video/capability error");
      return res.status(500).json({ success: false, error: "Failed to check video capability" });
    }
  }
);

export default router;
