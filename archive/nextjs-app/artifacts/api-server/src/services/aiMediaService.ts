/**
 * AI Media Service — real image generation and capability checks.
 * Image generation: CHATGPT_IMAGE_LATEST or OPENAI_API_KEY (direct fetch, gpt-image-1).
 * Text/caption generation: CHAT_BOT key via callAI().
 */

import { callAI } from "../lib/ai.js";
import { logger } from "../lib/logger.js";

// ── Key resolution ─────────────────────────────────────────────────────────────

const AI_KEY_CANDIDATES = ["CHAT_BOT", "OPENAI_API_KEY", "AI_API_KEY"] as const;

export function getActiveAIKeyName(): string | null {
  for (const k of AI_KEY_CANDIDATES) {
    if (process.env[k]) return k;
  }
  return null;
}

/** Returns the image generation API key.
 *  Preference: CHATGPT_IMAGE_LATEST → OPENAI_API_KEY
 */
function getImageKey(): string | null {
  return process.env["CHATGPT_IMAGE_LATEST"] ?? process.env["OPENAI_API_KEY"] ?? null;
}

/** Returns the name of whichever image key is active (for diagnostics). */
function getImageKeyName(): string {
  if (process.env["CHATGPT_IMAGE_LATEST"]) return "CHATGPT_IMAGE_LATEST";
  if (process.env["OPENAI_API_KEY"]) return "OPENAI_API_KEY";
  return "none";
}

// ── Platform sizing ────────────────────────────────────────────────────────────

// gpt-image-1 sizes
type GptImageSize = "1024x1024" | "1536x1024" | "1024x1536";

const PLATFORM_SIZE: Record<string, GptImageSize> = {
  instagram:       "1024x1024",
  instagram_reel:  "1024x1536",
  instagram_story: "1024x1536",
  facebook:        "1024x1024",
  tiktok:          "1024x1536",
  youtube_shorts:  "1024x1536",
  snapchat:        "1024x1536",
  linkedin:        "1536x1024",
  google:          "1536x1024",
};

function platformSize(platform?: string): GptImageSize {
  if (!platform) return "1024x1024";
  return PLATFORM_SIZE[platform] ?? "1024x1024";
}

// ── Image generation ──────────────────────────────────────────────────────────

export interface ImageGenerationInput {
  prompt: string;
  platform?: string;
}

export type ImageGenerationOutput =
  | { success: true; imageUrl: string; revisedPrompt?: string; model: string; size: string }
  | { success: false; error: string; code: string };

/**
 * Call OpenAI images API with a specific model. Returns raw response.
 * Timeout: 55 s — keeps requests well under Replit's proxy timeout (~60 s).
 * chatgpt-image-latest occasionally takes longer; we fall back to dall-e-3 on timeout.
 */
async function callImagesApi(
  key: string,
  body: Record<string, unknown>,
  timeoutMs = 55_000
): Promise<{ status: number; rawBody: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const apiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const rawBody = await apiRes.text();
    return { status: apiRes.status, rawBody };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { status: 504, rawBody: JSON.stringify({ error: { message: "Image generation timed out — falling back to next model." } }) };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function imageSleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Extract error message from OpenAI JSON error body. */
function extractOpenAIError(rawBody: string): string {
  try {
    const parsed = JSON.parse(rawBody) as { error?: { message?: string } };
    return parsed.error?.message ?? rawBody;
  } catch {
    return rawBody;
  }
}

/** Returns true if the error indicates the model is not accessible on this key/project. */
function isModelAccessError(msg: string, status: number): boolean {
  if (status === 403) return true;
  const m = msg.toLowerCase();
  return (
    m.includes("does not have access") ||
    m.includes("does not exist") ||
    m.includes("model_not_found") ||
    m.includes("unsupported_value") ||
    m.includes("permission")
  );
}

export async function generateMarketingImage(
  input: ImageGenerationInput
): Promise<ImageGenerationOutput> {
  const key = getImageKey();
  const keyName = getImageKeyName();
  if (!key) {
    return {
      success: false,
      error: "Image generation not configured. Set the CHATGPT_IMAGE_LATEST or OPENAI_API_KEY environment variable.",
      code: "AI_NOT_CONFIGURED",
    };
  }

  const gptSize = platformSize(input.platform);

  console.log(`[image-gen] key=${keyName} | platform=${input.platform ?? "default"} | size=${gptSize}`);

  // ── Attempt 1: chatgpt-image-latest (55 s timeout — under Replit's proxy limit) ─
  try {
    const { status, rawBody } = await callImagesApi(key, {
      model: "chatgpt-image-latest",
      prompt: input.prompt,
      n: 1,
      size: gptSize,
    }, 55_000);

    console.log(`[image-gen] chatgpt-image-latest → HTTP ${status}`);

    if (status === 200) {
      const data = JSON.parse(rawBody) as { data?: Array<{ b64_json?: string; revised_prompt?: string }> };
      const b64 = data.data?.[0]?.b64_json;
      if (b64) {
        return {
          success: true,
          imageUrl: `data:image/png;base64,${b64}`,
          revisedPrompt: data.data?.[0]?.revised_prompt,
          model: "chatgpt-image-latest",
          size: gptSize,
        };
      }
    }

    if (status !== 200) {
      const msg = extractOpenAIError(rawBody);
      console.warn(`[image-gen] chatgpt-image-latest failed (${status}): ${msg.slice(0, 200)}`);
      // Hard stop on auth / quota
      if (status === 401) return { success: false, error: `Image API key is invalid or expired: ${msg}`, code: "INVALID_KEY" };
      if (status === 429) return { success: false, error: `OpenAI quota exceeded. Check billing at platform.openai.com.`, code: "QUOTA_EXCEEDED" };
      console.log(`[image-gen] chatgpt-image-latest returned ${status} — will retry same model`);
    }
  } catch (err) {
    console.warn("[image-gen] chatgpt-image-latest threw — will retry:", err);
  }

  // First attempt timed out or returned non-200 without a hard error.
  // Do NOT retry here — the server has a 65s request timeout, and each chatgpt-image-latest
  // attempt takes up to 55s, leaving no room for server-side retries.
  // The frontend retry loop (up to 4 attempts, each fresh request) handles transient failures.
  return { success: false, error: "Image generation timed out. Please try again.", code: "GENERATION_FAILED" };
}

// ── Capability check ──────────────────────────────────────────────────────────

export interface AICapabilities {
  keyPresent: boolean;
  activeKeyName: string | null;
  textGenerationReady: boolean;
  imageGenerationReady: boolean;
  videoGenerationReady: boolean;
  textGenerationError?: string;
  imageGenerationError?: string;
  videoNote: string;
  checkedAt: string;
}

export async function checkAICapabilities(): Promise<AICapabilities> {
  const keyName = getActiveAIKeyName();
  const keyPresent = !!keyName;
  const checkedAt = new Date().toISOString();

  if (!keyPresent) {
    return {
      keyPresent: false,
      activeKeyName: null,
      textGenerationReady: false,
      imageGenerationReady: false,
      videoGenerationReady: false,
      textGenerationError: "No AI key configured. Set CHAT_BOT, OPENAI_API_KEY, or AI_API_KEY.",
      videoNote: "Video generation requires Sora API access (not yet publicly available).",
      checkedAt,
    };
  }

  const [textResult, imageResult] = await Promise.all([
    // Probe text generation
    callAI([{ role: "user", content: "Reply OK" }], { maxTokens: 5 })
      .then<[boolean, string | undefined]>((r) => [!!r, r ? undefined : "Empty response"])
      .catch<[boolean, string]>((e) => [false, e instanceof Error ? e.message : String(e)]),

    // Probe image key — check CHATGPT_IMAGE_LATEST / OPENAI_API_KEY and models endpoint
    (async (): Promise<[boolean, string | undefined]> => {
      const imgKey = getImageKey();
      const imgKeyName = getImageKeyName();
      if (!imgKey) return [false, "CHATGPT_IMAGE_LATEST (or OPENAI_API_KEY) not set — required for image generation"];
      try {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${imgKey}` },
        });
        if (!res.ok) return [false, `${imgKeyName} check failed (HTTP ${res.status})`];
        const data = await res.json() as { data?: Array<{ id: string }> };
        const ids = (data.data ?? []).map((m: { id: string }) => m.id);
        const has = ids.some((id: string) => id.includes("gpt-image") || id.includes("dall-e"));
        return [has, has ? undefined : "gpt-image-1 model not available on this OPENAI_API_KEY"];
      } catch (e) {
        return [false, e instanceof Error ? e.message : String(e)];
      }
    })(),
  ]);

  return {
    keyPresent,
    activeKeyName: keyName,
    textGenerationReady: textResult[0],
    imageGenerationReady: imageResult[0],
    videoGenerationReady: false,
    textGenerationError: textResult[1],
    imageGenerationError: imageResult[1],
    videoNote:
      "Video generation requires Sora API access (not yet publicly available — reel script & storyboard are still generated).",
    checkedAt,
  };
}
