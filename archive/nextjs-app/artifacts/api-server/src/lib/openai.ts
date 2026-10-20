/**
 * Ad generation helpers — description copy and DALL-E images.
 * All calls route through the central AI service (CHAT_BOT key).
 */

import { logger } from "./logger.js";
import { callAIJson, isAIReady, pingAI } from "./ai.js";
import { generateMarketingImage } from "../services/aiMediaService.js";

export interface AdGenerationInput {
  businessName: string;
  category: string;
  subcategory: string;
  websiteUrl?: string;
  location?: string;
}

export interface GeneratedAd {
  descriptions: string[];
  imageUrls: string[];
}

export async function generateAdDescriptions(input: AdGenerationInput): Promise<string[]> {
  if (!isAIReady()) throw new Error("AI system is not configured yet.");

  const result = await callAIJson<unknown>(
    [
      {
        role: "user",
        content: `Generate exactly 5 unique, professional ad descriptions for a business.

Business Name: ${input.businessName}
Category: ${input.category}
Subcategory: ${input.subcategory}
${input.location ? `Location: ${input.location}` : ""}

Requirements:
- Exactly 5 descriptions
- Each must be 90 characters or fewer
- Each must be unique
- Ad-focused, compelling, action-oriented
- Generic enough to work across the category/subcategory
- Return ONLY a valid JSON array of 5 strings, no other text

Example format: ["Description 1", "Description 2", "Description 3", "Description 4", "Description 5"]`,
      },
    ],
    { temperature: 0.8, maxTokens: 500 }
  );

  let descriptions: string[] = [];

  if (Array.isArray(result)) {
    descriptions = result as string[];
  } else if (result && typeof result === "object") {
    const obj = result as Record<string, unknown>;
    const firstArray = Object.values(obj).find((v) => Array.isArray(v));
    if (firstArray && Array.isArray(firstArray)) descriptions = firstArray as string[];
  }

  const validated = descriptions
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.slice(0, 90))
    .slice(0, 5);

  if (validated.length < 5) {
    throw new Error(`Expected 5 descriptions, got ${validated.length}`);
  }

  return validated;
}

export async function generateAdImages(input: AdGenerationInput): Promise<string[]> {
  const imagePrompt = `Professional digital advertising image for a ${input.subcategory} business in the ${input.category} industry.
Style: clean, modern, premium quality.
Requirements: no humans, no text overlays, no watermarks, leave bottom-right corner clear for logo placement, visually relevant to ${input.subcategory}, high contrast, vibrant colors suitable for digital ads.`;

  // Generate 5 images concurrently using chatgpt-image-latest (returns base64, persistent)
  const generationPromises = Array.from({ length: 5 }, () =>
    generateMarketingImage({ prompt: imagePrompt, platform: "instagram" })
  );

  const results = await Promise.allSettled(generationPromises);
  const imageUrls: string[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      imageUrls.push(result.value.imageUrl);
    } else {
      const reason =
        result.status === "rejected"
          ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
          : (!result.value.success ? result.value.error : "unknown");
      logger.warn({ reason }, "Ad image generation: one slot failed — skipping (no placeholder)");
    }
  }

  if (imageUrls.length === 0) {
    throw new Error("Ad image generation failed — all attempts returned errors. Check CHATGPT_IMAGE_LATEST / OPENAI_API_KEY and OpenAI quota.");
  }

  return imageUrls;
}

/** Kept for backward-compatibility with health-check routes */
export async function pingOpenAI(): Promise<boolean> {
  return pingAI();
}
