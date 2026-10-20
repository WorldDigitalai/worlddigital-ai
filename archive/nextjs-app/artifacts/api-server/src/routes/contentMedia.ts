/**
 * Content Media routes — real image generation for content items.
 * Token balance is checked before generation. Tokens are deducted only on success.
 */

import { Router, type Response } from "express";
import { ObjectId } from "mongodb";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getCollection } from "../lib/mongo.js";
import { deductTokens, getBalance, getCost } from "../services/tokenService.js";
import { generateMarketingImage } from "../services/aiMediaService.js";
import { logger } from "../lib/logger.js";

const router = Router();

interface ContentDoc {
  _id?: ObjectId;
  userId: string;
  imagePrompt: string;
  imageUrl?: string;
  imageModel?: string;
  imageSize?: string;
  imageGeneratedAt?: Date;
  updatedAt?: Date;
}

/**
 * POST /v1/dashboard/content/:id/generate-image
 *
 * Generates a real DALL-E 3 image for a content item.
 * - Returns cached image immediately if already generated (pass forceRegenerate=true to redo)
 * - Only gate: token balance. If user has enough tokens, generation proceeds.
 * - Tokens are deducted only on success — never on failure.
 * - Stores base64 data-URL in MongoDB so it persists across sessions.
 */
router.post(
  "/v1/dashboard/content/:id/generate-image",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const contentId = String(req.params["id"] ?? "");
    const { platform, forceRegenerate = false } = (req.body ?? {}) as {
      platform?: string;
      forceRegenerate?: boolean;
    };

    try {
      if (!ObjectId.isValid(contentId)) {
        res.status(400).json({ message: "Invalid content ID." });
        return;
      }

      const col = getCollection<ContentDoc>("generatedContent");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = await col.findOne({ _id: new ObjectId(contentId), userId } as any);

      if (!doc) {
        res.status(404).json({ message: "Content not found." });
        return;
      }

      // Return cached image unless caller explicitly wants a fresh one
      if (doc.imageUrl && !forceRegenerate) {
        res.json({ imageUrl: doc.imageUrl, cached: true, model: doc.imageModel ?? "dall-e-3" });
        return;
      }

      if (!doc.imagePrompt?.trim()) {
        res.status(400).json({ message: "No image prompt found for this content item." });
        return;
      }

      // Token balance check — the ONLY gate
      const [balance, cost] = await Promise.all([getBalance(userId), getCost("image")]);
      console.log(`[IMAGE GEN] userId=${userId} balance=${balance} cost=${cost}`);
      if (balance < cost) {
        res.status(403).json({
          message: "Not enough tokens. Buy more to continue.",
          code: "INSUFFICIENT_TOKENS",
          balance,
          required: cost,
        });
        return;
      }

      // Generate — tokens NOT yet deducted
      const result = await generateMarketingImage({ prompt: doc.imagePrompt, platform });

      if (!result.success) {
        // Do NOT deduct tokens on failure
        console.error(`[IMAGE GEN] Failed for userId=${userId}: ${result.error}`);
        res.status(422).json({ message: result.error, code: result.code });
        return;
      }

      // Deduct tokens only after confirmed success
      const deductResult = await deductTokens(userId, "image", "AI Image Generation via Content Studio").catch((e) => {
        console.error("[IMAGE GEN] Token deduction error:", e);
        return null;
      });
      console.log(`[IMAGE GEN] Success for userId=${userId}. Tokens deducted:`, deductResult);

      // Persist image data URL to DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawCol = col as any;
      await rawCol.updateOne(
        { _id: new ObjectId(contentId) },
        { $set: { imageUrl: result.imageUrl, imageModel: result.model, imageSize: result.size, imageGeneratedAt: new Date(), updatedAt: new Date() } }
      );

      res.json({
        imageUrl: result.imageUrl,
        cached: false,
        model: result.model,
        size: result.size,
        revisedPrompt: result.revisedPrompt,
      });
    } catch (err) {
      logger.error({ err }, "POST /v1/dashboard/content/:id/generate-image error");
      res.status(500).json({ message: "Image generation failed unexpectedly." });
    }
  }
);

/**
 * POST /v1/dashboard/tools/generate-image
 *
 * Directly generates a marketing image from a prompt (for the AI Tools image-generator page).
 * Does not require a content document — just a prompt and optional platform.
 * Tokens are deducted only on success.
 */
router.post(
  "/v1/dashboard/tools/generate-image",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { prompt, platform } = (req.body ?? {}) as { prompt?: string; platform?: string };

    if (!prompt?.trim()) {
      res.status(400).json({ message: "A prompt is required." });
      return;
    }

    try {
      const [balance, cost] = await Promise.all([getBalance(userId), getCost("image")]);
      if (balance < cost) {
        res.status(403).json({ message: "Not enough tokens. Buy more to continue.", code: "INSUFFICIENT_TOKENS", balance, required: cost });
        return;
      }

      const result = await generateMarketingImage({ prompt: prompt.trim(), platform });

      if (!result.success) {
        res.status(422).json({ message: result.error, code: result.code });
        return;
      }

      await deductTokens(userId, "image", "AI Image Generator Tool").catch((e) => {
        logger.error({ e }, "Token deduction error in tools/generate-image");
      });

      res.json({ imageUrl: result.imageUrl, model: result.model, size: result.size });
    } catch (err) {
      logger.error({ err }, "POST /v1/dashboard/tools/generate-image error");
      res.status(500).json({ message: "Image generation failed unexpectedly." });
    }
  }
);

export default router;
