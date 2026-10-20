import { Router } from "express";
import type { Request, Response as ExpressResponse } from "express";
import { logger } from "../lib/logger.js";
import { resolveEnv } from "../lib/secretResolver.js";

const router = Router();

const SYSTEM_PROMPT =
  "You are the AI Growth Operator for WorldDigital.ai, an AI-powered social media marketing platform for small and medium-sized businesses. " +
  "Help users understand how WorldDigital.ai can grow their business through AI content generation and automated ad campaigns across Meta, " +
  "TikTok, Snapchat, Google, Instagram, LinkedIn, YouTube, and X. " +
  "Be concise, friendly, and actionable. Keep responses under 150 words. " +
  "Always guide users toward signing up or booking a demo when relevant.";

// ── POST /api/chat ─────────────────────────────────────────────────────────────
// Calls OpenAI directly using the CHAT_BOT key.
// Accepts { message: "..." } or { messages: [{role, content}] } formats.
router.post("/chat", async (req: Request, res: ExpressResponse) => {
  const apiKey = resolveEnv("CHATGPT_IMAGE_LATEST", "CHAT_BOT", "OPENAI_API_KEY", "AI_API_KEY");

  if (!apiKey) {
    logger.warn("Chat endpoint: CHAT_BOT key not configured");
    return res.status(503).json({
      error: "AI Operator is reconnecting. Please try again in a moment.",
    });
  }

  const body = req.body as {
    message?: string;
    messages?: Array<{ role: string; content: string }>;
  };

  const userMessages: Array<{ role: string; content: string }> =
    body.messages ??
    (body.message ? [{ role: "user", content: body.message }] : []);

  if (userMessages.length === 0) {
    return res.status(400).json({ error: "No message provided" });
  }

  const MODEL_CHAIN = ["gpt-5.5", "chatgpt-4o-latest", "gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "gpt-4"];

  async function tryChat(models: string[]): Promise<Response | null> {
    for (const model of models) {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...userMessages],
          ...(model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3")
            ? { max_completion_tokens: 300 }
            : { max_tokens: 300, temperature: 0.7 }),
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (resp.ok) return resp;
      const errBody = await resp.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
      const code    = errBody.error?.code ?? "";
      if (code === "model_not_found" || resp.status === 404 || resp.status === 403) {
        logger.warn({ model, status: resp.status, code }, "Chat model unavailable — trying next");
        continue;
      }
      logger.error({ model, status: resp.status, errBody }, "OpenAI API error in chat");
      return resp;
    }
    return null;
  }

  try {
    const response = await tryChat(MODEL_CHAIN);

    if (!response || !response.ok) {
      return res.status(502).json({
        error: "AI Operator is reconnecting. Please try again in a moment.",
      });
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply =
      data.choices?.[0]?.message?.content ??
      "I'm here to help! What would you like to know about WorldDigital.ai?";

    logger.info({ replyLength: reply.length }, "Chat response sent");
    return res.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "Chat endpoint error");

    if (msg.includes("timeout") || msg.includes("abort") || msg.includes("Timeout")) {
      return res.status(504).json({
        error: "AI Operator is taking too long. Please try again in a moment.",
      });
    }

    return res.status(502).json({
      error: "AI Operator is reconnecting. Please try again in a moment.",
    });
  }
});

export default router;
