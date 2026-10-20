import { Router, type IRouter, type Response } from "express";
import { ObjectId } from "mongodb";
import { generateAdDescriptions, generateAdImages } from "../lib/openai.js";
import { getCollection } from "../lib/mongo.js";
import { requireAuth, requireActiveSubscription, type AuthRequest } from "../middlewares/auth.js";
import { aiGenerationLimiter } from "../middlewares/rateLimit.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

interface AdGenerationDoc {
  _id: ObjectId;
  userId: string;
  businessName: string;
  category: string;
  subcategory: string;
  websiteUrl?: string;
  location?: string;
  logoUrl?: string;
  descriptions: string[];
  imageUrls: string[];
  selectedDescription?: string;
  selectedImageUrl?: string;
  status: "generated" | "confirmed";
  createdAt: Date;
}

router.post(
  "/v1/ads/generate",
  requireAuth,
  requireActiveSubscription,
  aiGenerationLimiter,
  async (req: AuthRequest, res: Response) => {
    const { businessName, category, subcategory, websiteUrl, location, logoUrl } = req.body ?? {};

    if (!businessName || !category || !subcategory) {
      res.status(400).json({ message: "businessName, category, and subcategory are required" });
      return;
    }

    if (typeof businessName !== "string" || businessName.length > 100) {
      res.status(400).json({ message: "businessName must be a string under 100 characters" });
      return;
    }

    try {
      const input = { businessName, category, subcategory, websiteUrl, location };

      const [descriptions, imageUrls] = await Promise.all([
        generateAdDescriptions(input),
        generateAdImages(input),
      ]);

      const doc: AdGenerationDoc = {
        _id: new ObjectId(),
        userId: req.user!.userId,
        businessName,
        category,
        subcategory,
        websiteUrl,
        location,
        logoUrl,
        descriptions,
        imageUrls,
        status: "generated",
        createdAt: new Date(),
      };

      const col = getCollection<AdGenerationDoc>("ad_generations");
      await col.insertOne(doc);

      logger.info({ userId: req.user!.userId, generationId: doc._id.toHexString() }, "Ad generation complete");

      res.json({
        generationId: doc._id.toHexString(),
        descriptions,
        imageUrls,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed";
      logger.error({ userId: req.user!.userId, err }, "Ad generation error");
      res.status(500).json({ message });
    }
  }
);

router.post("/v1/ads/confirm", requireAuth, async (req: AuthRequest, res: Response) => {
  const { generationId, selectedDescription, selectedImageUrl } = req.body ?? {};

  if (!generationId || !selectedDescription || !selectedImageUrl) {
    res.status(400).json({ message: "generationId, selectedDescription, and selectedImageUrl are required" });
    return;
  }

  try {
    const col = getCollection<AdGenerationDoc>("ad_generations");
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(generationId), userId: req.user!.userId },
      {
        $set: {
          selectedDescription,
          selectedImageUrl,
          status: "confirmed",
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      res.status(404).json({ message: "Generation not found or not owned by user" });
      return;
    }

    logger.info({ userId: req.user!.userId, generationId }, "Ad selection confirmed");
    res.json({ message: "Selection confirmed", generationId });
  } catch (err) {
    logger.error({ err }, "Ad confirm error");
    res.status(500).json({ message: "Failed to confirm selection" });
  }
});

router.get("/v1/ads/history", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const col = getCollection<AdGenerationDoc>("ad_generations");
    const items = await col
      .find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    res.json({
      items: items.map((item) => ({
        id: item._id.toHexString(),
        businessName: item.businessName,
        category: item.category,
        subcategory: item.subcategory,
        status: item.status,
        createdAt: item.createdAt,
        selectedDescription: item.selectedDescription,
        selectedImageUrl: item.selectedImageUrl,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Ad history error");
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

export default router;
