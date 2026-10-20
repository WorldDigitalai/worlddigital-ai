import { Router, type Request, type Response } from "express";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import jwt from "jsonwebtoken";
import { callAIJson, isAIReady } from "../lib/ai.js";

function requireAdmin(req: Request, res: Response, next: () => void): void {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ message: "Admin auth required" }); return; }
  try {
    const payload = jwt.verify(auth.slice(7), process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret") as { isAdmin?: boolean };
    if (!payload.isAdmin) throw new Error("not admin");
    next();
  } catch { res.status(401).json({ message: "Invalid or expired admin token" }); }
}

const router = Router();

// GET /v1/blog — published posts only
router.get("/v1/blog", async (_req: Request, res: Response) => {
  try {
    const posts = await getCollection("blogPosts")
      .find({ status: "published" })
      .sort({ publishedAt: -1 })
      .project({ content: 0 }) // exclude heavy content field from list
      .toArray();
    res.json(posts);
  } catch (err) {
    logger.error({ err }, "blog list error");
    res.status(500).json({ message: "Failed to load posts" });
  }
});

// GET /v1/blog/:slug — single published post
router.get("/v1/blog/:slug", async (req: Request, res: Response) => {
  try {
    const post = await getCollection("blogPosts").findOne({
      slug: req.params.slug,
      status: "published",
    });
    if (!post) { res.status(404).json({ message: "Post not found" }); return; }
    res.json(post);
  } catch (err) {
    logger.error({ err }, "blog single post error");
    res.status(500).json({ message: "Failed to load post" });
  }
});

// POST /v1/admin/blogs/ai-generate — AI-draft a blog post (admin only)
router.post("/v1/admin/blogs/ai-generate", (req, res, next) => requireAdmin(req, res, next), async (req: Request, res: Response) => {
  if (!isAIReady()) {
    res.status(503).json({ message: "AI is not configured (CHAT_BOT key missing)" });
    return;
  }

  const { topic, keywords, tone = "Informative & authoritative" } = req.body as {
    topic?: string;
    keywords?: string;
    tone?: string;
  };

  if (!topic?.trim()) {
    res.status(400).json({ message: "topic is required" });
    return;
  }

  const prompt = [
    `Write a complete, SEO-optimized blog post for WorldDigital.ai, an AI marketing SaaS for small businesses.`,
    `Topic: ${topic}`,
    keywords ? `Target keywords: ${keywords}` : "",
    `Tone: ${tone}`,
    `Requirements:`,
    `- Title: compelling, keyword-rich, under 70 characters`,
    `- Slug: URL-friendly version of the title (lowercase, hyphens, no special chars)`,
    `- Excerpt: 1–2 sentence summary, under 155 characters`,
    `- Content: 600–900 words in plain text/Markdown (use ## headings, bullet points)`,
    `- Tags: 3–5 relevant comma-separated tags`,
    `Return ONLY valid JSON with keys: title, slug, excerpt, content, tags (array of strings). No markdown fences.`,
  ].filter(Boolean).join("\n");

  try {
    const result = await callAIJson<{
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      tags: string[];
    }>([{ role: "user", content: prompt }]);

    if (!result?.title || !result?.content) {
      res.status(502).json({ message: "AI returned an unexpected response. Try again." });
      return;
    }

    logger.info({ topic }, "Admin AI blog post generated");
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error({ err }, "AI blog generation failed");
    res.status(500).json({ message: "AI generation failed. Try again." });
  }
});

export default router;
