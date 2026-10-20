/**
 * Central AI service — ALL AI features route through here.
 * Reads the API key from process.env.CHAT_BOT only.
 * Never exposes the key to the frontend.
 */

import OpenAI from "openai";
import { logger } from "./logger.js";

// ── Single key source ─────────────────────────────────────────────────────────

import { resolveEnv } from "./secretResolver.js";

function getApiKey(): string | undefined {
  return resolveEnv("CHATGPT_IMAGE_LATEST", "CHAT_BOT", "OPENAI_API_KEY", "AI_API_KEY");
}

function createClient(): OpenAI | null {
  const key = getApiKey();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

// ── Public helpers ────────────────────────────────────────────────────────────

/** True when CHAT_BOT is set and the AI system is ready */
export function isAIReady(): boolean {
  return !!getApiKey();
}

/** Ping the OpenAI API — returns true if the key works */
export async function pingAI(): Promise<boolean> {
  try {
    const client = createClient();
    if (!client) return false;
    const models = await client.models.list();
    return models.data.length > 0;
  } catch {
    return false;
  }
}

// ── Core call ─────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

const AI_RETRY_ATTEMPTS = 2;
const AI_RETRY_DELAY_MS = 1200;

// Try chatgpt-4o-latest first — it's in the same family as chatgpt-image-latest
// and is accessible on projects that restrict standard gpt-* models.
const AI_MODEL_CHAIN = [
  "gpt-5.5",
  "chatgpt-4o-latest",
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-3.5-turbo",
  "gpt-4",
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isModelUnavailable(status: number, body: string): boolean {
  return (
    status === 403 ||
    status === 404 ||
    body.includes("model_not_found") ||
    body.includes("does not have access to model") ||
    body.includes("does not exist")
  );
}

/**
 * Core AI call — every feature uses this.
 * Walks AI_MODEL_CHAIN until a model responds successfully.
 * Retries transient (5xx / network) errors per model.
 * Does NOT retry on 400/401/429 (bad request, bad key, quota exhausted).
 * Returns the raw text response, or null if AI is not configured or all attempts failed.
 */
export async function callAI(
  messages: AIMessage[],
  options: AICallOptions = {}
): Promise<string | null> {
  const key = getApiKey();
  if (!key) {
    logger.warn("CHAT_BOT not configured — AI call skipped");
    return null;
  }

  const models = options.model ? [options.model, ...AI_MODEL_CHAIN.filter(m => m !== options.model)] : AI_MODEL_CHAIN;

  for (const model of models) {
    for (let attempt = 1; attempt <= AI_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            messages,
            ...(model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3")
              ? { max_completion_tokens: 16000 }
              : {
                  max_tokens: options.maxTokens ?? 1000,
                  temperature: options.temperature ?? 0.7,
                  // response_format only for models that support it (not gpt-5+/o-series)
                  ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
                }),
          }),
          signal: AbortSignal.timeout(55_000),
        });

        if (!response.ok) {
          const errText = await response.text();
          // Model not available on this project — skip to next model immediately
          if (isModelUnavailable(response.status, errText)) {
            logger.warn({ model, status: response.status }, "AI model unavailable — trying next");
            break;
          }
          logger.error({ status: response.status, err: errText, attempt, model }, "AI API error");
          // Hard stop on auth errors or quota exhausted
          if (response.status === 401 || response.status === 429) {
            return null;
          }
          // 400 with unsupported_parameter / unsupported_value means this model
          // doesn't accept the params — skip to the next model
          if (response.status === 400) {
            const isParamError =
              errText.includes("unsupported_parameter") ||
              errText.includes("unsupported_value") ||
              errText.includes("Unsupported parameter") ||
              errText.includes("Unsupported value");
            if (isParamError) {
              logger.warn({ model, status: 400 }, "AI model param error — trying next");
              break;
            }
            return null;
          }
          if (attempt < AI_RETRY_ATTEMPTS) {
            logger.warn({ status: response.status, attempt, model }, "AI call failed — retrying");
            await sleep(AI_RETRY_DELAY_MS * attempt);
            continue;
          }
          break;
        }

        const data = (await response.json()) as {
          choices: Array<{
            message: { content: string | null; reasoning_content?: string | null };
            finish_reason?: string;
          }>;
        };
        const choice = data.choices?.[0];
        const raw = choice?.message?.content ?? null;
        // Some reasoning models (e.g. gpt-5.5) stream thinking into
        // reasoning_content and leave content empty; fall back to that.
        const reasoning = (choice?.message as { reasoning_content?: string | null })?.reasoning_content ?? null;
        const result = (raw && raw.length > 0) ? raw : (reasoning && reasoning.length > 0 ? reasoning : null);
        logger.info(
          { model, hasContent: result !== null, len: result?.length ?? 0, finish: choice?.finish_reason, hasReasoning: !!reasoning },
          "AI call response"
        );
        if (!result) {
          // Model responded with 200 but empty content and no reasoning —
          // treat as soft failure and try the next model in the chain.
          logger.warn({ model, finish: choice?.finish_reason }, "AI model returned empty response — trying next model");
          break;
        }
        return result;
      } catch (err) {
        logger.error({ err, attempt, model }, "AI call threw — network error or timeout");
        if (attempt < AI_RETRY_ATTEMPTS) {
          await sleep(AI_RETRY_DELAY_MS * attempt);
          continue;
        }
        break;
      }
    }
  }
  return null;
}

/**
 * Convenience wrapper — calls AI in JSON mode and parses the result.
 * Returns null if AI is unavailable or parsing fails.
 */
/** Strip markdown code fences and extract the first JSON object/array from a string */
function extractJson(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Fallback: find first { or [ and last } or ]
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  if (firstBrace === -1 && firstBracket === -1) return text.trim();
  const start = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
    ? firstBrace
    : firstBracket;
  const isObj = text[start] === "{";
  const end = isObj ? text.lastIndexOf("}") : text.lastIndexOf("]");
  if (end === -1) return text.trim();
  return text.slice(start, end + 1);
}

export async function callAIJson<T>(
  messages: AIMessage[],
  options: AICallOptions = {}
): Promise<T | null> {
  const raw = await callAI(messages, { ...options, jsonMode: true });
  if (!raw) {
    logger.warn({ model: options.model ?? "auto" }, "callAIJson: callAI returned null");
    return null;
  }
  try {
    const cleaned = extractJson(raw);
    return JSON.parse(cleaned) as T;
  } catch {
    logger.error({ raw: raw.slice(0, 500) }, "Failed to parse AI JSON response");
    return null;
  }
}

/**
 * Get the raw OpenAI SDK client (needed for DALL-E image generation).
 * Returns null when CHAT_BOT is not set.
 */
export function getAIClient(): OpenAI | null {
  return createClient();
}
