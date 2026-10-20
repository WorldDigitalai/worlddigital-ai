/**
 * Admin Logs viewer.
 * Routes:
 *   GET /v1/admin/logs/activity  — user activity logs
 *   GET /v1/admin/logs/audit     — admin action audit trail
 *   GET /v1/admin/logs/webhook   — Stripe / platform webhook events
 */

import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

const router = Router();

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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "****";
  return `${local.slice(0, 2)}****@${domain}`;
}

// ── GET /v1/admin/logs/activity ───────────────────────────────────────────────

router.get("/v1/admin/logs/activity", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { limit = "50", skip = "0", category, search, userId } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = {};
      if (category) filter["category"] = category;
      if (userId)   filter["userId"] = userId;
      if (search) {
        filter["action"] = { $regex: search, $options: "i" };
      }

      const logs = await getCollection("activityLogs")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Math.min(Number(limit), 200))
        .toArray();

      const total = await getCollection("activityLogs").countDocuments(filter);

      res.json({ logs, total });
    } catch (err) {
      logger.error({ err }, "admin activity logs error");
      res.status(500).json({ message: "Failed to load activity logs" });
    }
  });
});

// ── GET /v1/admin/logs/audit ──────────────────────────────────────────────────

router.get("/v1/admin/logs/audit", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { limit = "50", skip = "0", targetType, search } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = {};
      if (targetType) filter["targetType"] = targetType;
      if (search) {
        filter["$or"] = [
          { action: { $regex: search, $options: "i" } },
          { targetId: { $regex: search, $options: "i" } },
        ];
      }

      const logs = await getCollection("adminAuditLogs")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Math.min(Number(limit), 200))
        .toArray();

      const total = await getCollection("adminAuditLogs").countDocuments(filter);

      // Mask any email fields in metadata for safety
      const maskedLogs = (logs as Array<Record<string, unknown>>).map((log) => {
        if (log["targetEmail"]) {
          return { ...log, targetEmail: maskEmail(String(log["targetEmail"])) };
        }
        return log;
      });

      res.json({ logs: maskedLogs, total });
    } catch (err) {
      logger.error({ err }, "admin audit logs error");
      res.status(500).json({ message: "Failed to load audit logs" });
    }
  });
});

// ── GET /v1/admin/logs/webhook ────────────────────────────────────────────────

router.get("/v1/admin/logs/webhook", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { limit = "50", skip = "0", source, status, search } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = {};
      if (source) filter["source"] = source;
      if (status) filter["status"] = status;
      if (search) {
        filter["eventType"] = { $regex: search, $options: "i" };
      }

      const logs = await getCollection("webhookLogs")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Math.min(Number(limit), 200))
        .toArray();

      const total = await getCollection("webhookLogs").countDocuments(filter);

      res.json({ logs, total });
    } catch (err) {
      logger.error({ err }, "admin webhook logs error");
      res.status(500).json({ message: "Failed to load webhook logs" });
    }
  });
});

export default router;
