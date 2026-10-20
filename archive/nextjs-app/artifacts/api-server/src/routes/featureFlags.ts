/**
 * Feature Flags admin routes.
 * GET  /v1/admin/feature-flags       — list all flags
 * PUT  /v1/admin/feature-flags/:key  — toggle a flag
 */

import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { getAllFlags, setFlag, type FlagKey } from "../lib/featureFlags.js";
import { logAdminAudit } from "../lib/activityLogger.js";
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

router.get("/v1/admin/feature-flags", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const flags = await getAllFlags();
      res.json(flags);
    } catch (err) {
      logger.error({ err }, "get feature flags error");
      res.status(500).json({ message: "Failed to load feature flags" });
    }
  });
});

router.put("/v1/admin/feature-flags/:key", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const key = req.params["key"] as FlagKey;
      const { enabled } = req.body ?? {};

      if (typeof enabled !== "boolean") {
        res.status(400).json({ message: "enabled (boolean) is required" });
        return;
      }

      // Env-controlled flags cannot be toggled via UI
      if (key === "social_dry_run" || key === "ads_dry_run") {
        res.status(400).json({
          message: `${key} is controlled by environment variable, not DB. Update SOCIAL_DRY_RUN or ADS_DRY_RUN in Replit Secrets.`,
        });
        return;
      }

      await setFlag(key, enabled, "admin");

      await logAdminAudit("admin", `feature_flag_${enabled ? "enabled" : "disabled"}`, "feature_flag", {
        metadata: { key, enabled },
      });

      logger.info({ key, enabled }, "Feature flag updated by admin");
      res.json({ message: `${key} ${enabled ? "enabled" : "disabled"}`, key, enabled });
    } catch (err) {
      logger.error({ err }, "set feature flag error");
      res.status(500).json({ message: "Failed to update feature flag" });
    }
  });
});

export default router;
