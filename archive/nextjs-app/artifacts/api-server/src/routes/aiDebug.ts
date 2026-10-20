import { Router } from "express";
import type { Request, Response } from "express";
import { isAIReady } from "../lib/ai.js";

const router = Router();

/**
 * GET /api/v1/ai/debug
 * Returns AI system status without exposing the key.
 */
router.get("/v1/ai/debug", async (_req: Request, res: Response) => {
  const ready = isAIReady();
  res.json({
    chat_bot_exists: ready,
    ai_ready: ready,
    key_source: "CHAT_BOT",
    features_using_ai: [
      "chatbot",
      "content generation",
      "strategy report",
      "demo mode",
      "ad descriptions",
      "ad images",
    ],
    message: ready
      ? "AI system is configured and ready."
      : "AI system is not configured yet. Set the CHAT_BOT environment variable.",
  });
});

export default router;
