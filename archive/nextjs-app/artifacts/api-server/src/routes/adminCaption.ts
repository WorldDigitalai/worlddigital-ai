/**
 * Admin AI Caption Generator
 *
 * POST /api/v1/admin/content/generate-caption
 *   Generates platform-specific social media captions for WorldDigital.ai's
 *   own marketing — promoting our services with the correct landing page URL.
 *   Requires admin JWT.
 */

import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { callAIJson, isAIReady } from "../lib/ai.js";
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

// ── Platform → landing page URL map ──────────────────────────────────────────

const PLATFORM_URLS: Record<string, string> = {
  linkedin:             "https://worlddigital.ai/linkedin-ads-agency",
  "snapchat-marketing": "https://worlddigital.ai/snapchat-marketing",
  "snapchat-ads":       "https://worlddigital.ai/snapchat-ads-agency",
  snapchat:             "https://worlddigital.ai/snapchat-ads-agency",
  google:               "https://worlddigital.ai/google-ads-agency",
  "google-ads":         "https://worlddigital.ai/google-ads-agency",
  meta:                 "https://worlddigital.ai/meta-ads-agency",
  facebook:             "https://worlddigital.ai/meta-ads-agency",
  instagram:            "https://worlddigital.ai/instagram-marketing",
  tiktok:               "https://worlddigital.ai/tiktok-marketing",
  youtube:              "https://worlddigital.ai/youtube-shorts-marketing",
  "youtube-shorts":     "https://worlddigital.ai/youtube-shorts-marketing",
  seo:                  "https://worlddigital.ai/ai-seo-agency",
  "ai-seo":             "https://worlddigital.ai/ai-seo-agency",
  "ai-marketing":       "https://worlddigital.ai/ai-marketing-automation",
  x:                    "https://worlddigital.ai/ai-marketing-automation",
  twitter:              "https://worlddigital.ai/ai-marketing-automation",
  "google-ads-copy":    "https://worlddigital.ai/google-ads-agency",
  "meta-ads":           "https://worlddigital.ai/meta-ads-agency",
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin:             "LinkedIn",
  "snapchat-marketing": "Snapchat",
  "snapchat-ads":       "Snapchat Ads",
  snapchat:             "Snapchat",
  google:               "Google Ads",
  "google-ads":         "Google Ads",
  meta:                 "Meta (Facebook/Instagram)",
  facebook:             "Facebook",
  instagram:            "Instagram",
  tiktok:               "TikTok",
  youtube:              "YouTube Shorts",
  "youtube-shorts":     "YouTube Shorts",
  seo:                  "AI SEO",
  "ai-seo":             "AI SEO",
  "ai-marketing":       "AI Marketing",
  x:                    "X (Twitter)",
  twitter:              "X (Twitter)",
  "google-ads-copy":    "Google Ads",
  "meta-ads":           "Meta Ads",
};

// ── POST /v1/admin/content/generate-caption ───────────────────────────────────

router.post("/v1/admin/content/generate-caption", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    const { platform, topic, goal, tone } = req.body as {
      platform?: string;
      topic?: string;
      goal?: string;
      tone?: string;
    };

    if (!platform) {
      res.status(400).json({ error: "platform is required" });
      return;
    }

    if (!isAIReady()) {
      res.status(503).json({ error: "AI (CHAT_BOT) is not configured" });
      return;
    }

    const platformKey = platform.toLowerCase();
    const landingUrl  = PLATFORM_URLS[platformKey] ?? "https://worlddigital.ai";
    const platformLabel = PLATFORM_LABELS[platformKey] ?? platform;

    const prompt = `Write a ${platformLabel} marketing caption for WorldDigital.ai (AI marketing agency for SMBs).
Topic: ${topic || `${platformLabel} advertising for small businesses`}
Goal: ${goal || "Drive sign-ups"}
Tone: ${tone || "Professional"}
CTA URL: ${landingUrl}
Rules: promote WorldDigital.ai only, max 5 hashtags, end with CTA URL on its own line, no fake stats.

Reply with ONLY this JSON (no markdown):
{"caption":"<full caption with CTA URL on last line>","hashtags":["tag1","tag2"],"cta":"<short CTA text>","landingUrl":"${landingUrl}","platform":"${platformLabel}","charCount":0}`;

    try {
      const result = await callAIJson<{
        caption: string;
        hashtags: string[];
        cta: string;
        landingUrl: string;
        platform: string;
        charCount: number;
      }>([{ role: "user", content: prompt }], { temperature: 0.75 });

      if (!result) {
        res.status(500).json({ error: "AI returned no result" });
        return;
      }

      // Enforce max 5 hashtags
      const hashtags = (result.hashtags ?? []).slice(0, 5);

      logger.info({ platform, landingUrl }, "Admin caption generated");

      res.json({
        caption: result.caption ?? "",
        hashtags,
        cta: result.cta ?? "Get Started",
        landingUrl,
        platform: platformLabel,
        charCount: (result.caption ?? "").length,
      });
    } catch (err) {
      logger.error({ err }, "Admin caption generation failed");
      res.status(500).json({ error: "Caption generation failed" });
    }
  });
});

export default router;
