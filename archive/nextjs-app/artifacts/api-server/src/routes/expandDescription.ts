import { Router } from "express";
import type { Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { resolveEnv } from "../lib/secretResolver.js";

const router = Router();

const SYSTEM_PROMPT =
  "You are a professional business copywriter. Expand the user's business description into a detailed, compelling paragraph suitable for marketing, social media, and search engine optimization. Keep the same tone and style. Return only the expanded description with no preamble, no markdown, no quotes.";

const MODEL_CHAIN = ["gpt-5.5", "chatgpt-4o-latest", "gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "gpt-4"];

async function tryOpenAI(
  models: string[],
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  for (const model of models) {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        ...(model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3")
          ? { max_completion_tokens: 500 }
          : { max_tokens: 500, temperature: 0.7 }),
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (resp.ok) {
      const data = await resp.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content ?? null;
      if (content) return content.trim();
    }
    const errBody = await resp.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
    const code = errBody.error?.code ?? "";
    if (code === "model_not_found" || resp.status === 404 || resp.status === 403) {
      logger.warn({ model, status: resp.status, code }, "Expand model unavailable — trying next");
      continue;
    }
    logger.error({ model, status: resp.status, errBody }, "OpenAI API error in expand");
    break;
  }
  return null;
}

// ── POST /api/v1/business/expand ───────────────────────────────────────────────
router.post("/v1/business/expand", async (req: Request, res: Response) => {
  const apiKey = resolveEnv("CHAT_BOT", "OPENAI_API_KEY", "AI_API_KEY");
  if (!apiKey) {
    logger.warn("Business expand: OPENAI_API_KEY not configured");
    return res.status(503).json({ error: "AI service is unavailable. Please try again later." });
  }

  const { businessName, category, websiteUrl, description } = req.body as {
    businessName?: string;
    category?: string;
    websiteUrl?: string;
    description?: string;
  };

  if (!description || !description.trim()) {
    return res.status(400).json({ error: "Business description is required" });
  }

  const userPrompt =
    `Expand this business description into a professional, detailed, and compelling paragraph.\n\n` +
    `Business Name: ${businessName || "N/A"}\n` +
    `Business Category: ${category || "N/A"}\n` +
    `Website URL: ${websiteUrl || "N/A"}\n` +
    `Current Description: ${description}\n\n` +
    `Write a single detailed paragraph (3–6 sentences) that captures the business's mission, offerings, and unique value proposition. Keep the same tone and style.`;

  try {
    const result = await tryOpenAI(MODEL_CHAIN, apiKey, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);

    if (result === null) {
      return res.status(502).json({ error: "AI expansion failed. Please try again." });
    }

    logger.info({ replyLength: result.length }, "Business expand response sent");
    return res.json({ description: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "Business expand endpoint error");
    if (msg.includes("timeout") || msg.includes("abort")) {
      return res.status(504).json({ error: "AI expansion timed out. Please try again." });
    }
    return res.status(502).json({ error: "AI expansion failed. Please try again." });
  }
});

export default router;
