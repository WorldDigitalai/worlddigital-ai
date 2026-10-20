import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

const router = Router();

function getAdminSecret(): string {
  return process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
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

interface SEOKeyword {
  _id?: ObjectId;
  keyword: string;
  pageUrl: string;
  rankingStatus: string;
  trafficEstimate: string;
  conversionNote: string;
  createdAt: Date;
  updatedAt: Date;
}

router.get("/v1/admin/seo-keywords", requireAdmin, async (req: Request, res: Response) => {
  try {
    const col = await getCollection<SEOKeyword>("seo_keywords");
    const keywords = await col.find({}).sort({ createdAt: -1 }).toArray();
    res.json(keywords);
  } catch (err) {
    logger.error({ err }, "Failed to fetch SEO keywords");
    res.status(500).json({ message: "Failed to fetch keywords" });
  }
});

router.post("/v1/admin/seo-keywords", requireAdmin, async (req: Request, res: Response) => {
  const { keyword, pageUrl, rankingStatus, trafficEstimate, conversionNote } = req.body as Partial<SEOKeyword>;
  if (!keyword || !pageUrl) {
    res.status(400).json({ message: "keyword and pageUrl are required" });
    return;
  }
  try {
    const col = await getCollection<SEOKeyword>("seo_keywords");
    const now = new Date();
    const result = await col.insertOne({
      keyword: String(keyword).trim(),
      pageUrl: String(pageUrl).trim(),
      rankingStatus: rankingStatus ? String(rankingStatus).trim() : "not tracked",
      trafficEstimate: trafficEstimate ? String(trafficEstimate).trim() : "",
      conversionNote: conversionNote ? String(conversionNote).trim() : "",
      createdAt: now,
      updatedAt: now,
    });
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    logger.error({ err }, "Failed to create SEO keyword");
    res.status(500).json({ message: "Failed to create keyword" });
  }
});

router.put("/v1/admin/seo-keywords/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { keyword, pageUrl, rankingStatus, trafficEstimate, conversionNote } = req.body as Partial<SEOKeyword>;
    const col = await getCollection<SEOKeyword>("seo_keywords");
    await col.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          ...(keyword !== undefined && { keyword: String(keyword).trim() }),
          ...(pageUrl !== undefined && { pageUrl: String(pageUrl).trim() }),
          ...(rankingStatus !== undefined && { rankingStatus: String(rankingStatus).trim() }),
          ...(trafficEstimate !== undefined && { trafficEstimate: String(trafficEstimate).trim() }),
          ...(conversionNote !== undefined && { conversionNote: String(conversionNote).trim() }),
          updatedAt: new Date(),
        },
      }
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to update SEO keyword");
    res.status(500).json({ message: "Failed to update keyword" });
  }
});

router.delete("/v1/admin/seo-keywords/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const col = await getCollection<SEOKeyword>("seo_keywords");
    await col.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete SEO keyword");
    res.status(500).json({ message: "Failed to delete keyword" });
  }
});

export default router;
