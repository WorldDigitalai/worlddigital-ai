/**
 * AI Video Service — Runway Gen-4 video generation (no audio/voiceover).
 * Video: RUNWAY_API_KEY → POST /v1/text_to_video → poll /v1/tasks/{id}
 */

import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import { ObjectId } from "mongodb";

// ── Constants ─────────────────────────────────────────────────────────────────

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

// ── Types ─────────────────────────────────────────────────────────────────────

export type VideoJobStatus =
  | "queued"
  | "generating"
  | "rendering"
  | "completed"
  | "failed"
  | "unsupported";

export interface ReelVideoJob {
  _id?: ObjectId;
  jobId: string;
  contentId: string;
  userId: string;
  status: VideoJobStatus;
  progress: number;
  runwayTaskId: string | null;
  /** @deprecated kept for backward compat with old Sora jobs */
  openaiJobId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  script: string;
  shotList: string[];
  platform: string;
  durationSeconds: number;
  aspectRatio: string;
  style: string;
  ctaUrl: string;
  businessName: string;
  error: string | null;
  errorCode: string | null;
  unsupportedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoStartInput {
  contentId: string;
  userId: string;
  script: string;
  shotList: string[];
  businessName?: string;
  platform?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  style?: string;
  ctaUrl?: string;
}

export interface VideoStartOutput {
  jobId: string;
  status: VideoJobStatus;
  unsupportedReason?: string;
}

// ── Key helper ────────────────────────────────────────────────────────────────

function runwayKey(): string | null {
  // Trim to guard against accidental whitespace copied into the secret
  return process.env["RUNWAY_API_KEY"]?.trim() ?? null;
}

// ── Runway capability probe ───────────────────────────────────────────────────

export async function probeVideoCapability(): Promise<{
  available: boolean;
  reason: string;
  model?: string;
}> {
  const key = runwayKey();
  if (!key) {
    return {
      available: false,
      reason: "No Runway API key configured. Set the RUNWAY_API_KEY environment variable.",
    };
  }
  return { available: true, reason: "Runway Gen-4.5 is ready.", model: "gen4.5" };
}

// ── Job helpers ───────────────────────────────────────────────────────────────

function makeJobId(): string {
  return `rvj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function col() {
  return getCollection<ReelVideoJob>("reelVideoJobs");
}

export async function getVideoJob(
  jobId: string,
  userId: string
): Promise<ReelVideoJob | null> {
  return col().findOne({ jobId, userId });
}

export async function getVideoJobsByContent(
  contentId: string,
  userId: string
): Promise<ReelVideoJob[]> {
  return col()
    .find({ contentId, userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
}

// ── Build video prompt ────────────────────────────────────────────────────────

function buildVideoPrompt(input: VideoStartInput): string {
  const { script, shotList, businessName, platform, ctaUrl, style } = input;
  const shots = shotList.slice(0, 4).join(". ");
  const tone = style || "professional and engaging";
  const cta = ctaUrl ? ` End with a clear call to action: visit ${ctaUrl}.` : "";
  const biz = businessName ? `for ${businessName}` : "for a business";

  return [
    `Short-form vertical marketing video ${biz}.`,
    `Style: ${tone}.`,
    `Platform: ${platform || "Instagram Reels, TikTok, YouTube Shorts"}.`,
    `Scene: ${script.slice(0, 280)}.`,
    shots ? `Key visuals: ${shots}.` : "",
    `High-energy, vibrant colours, dynamic motion, brand-safe, no on-screen text.${cta}`,
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Runway ratio helper ───────────────────────────────────────────────────────

function runwayRatio(aspectRatio: string): string {
  // Runway gen4.5 only accepts "1280:720" (landscape) or "720:1280" (portrait)
  if (aspectRatio === "16:9") return "1280:720";
  // 9:16, 1:1, or anything else → portrait (default for Reels/Shorts/TikTok)
  return "720:1280";
}

// ── Update job helper ─────────────────────────────────────────────────────────

async function updateJob(jobId: string, update: Partial<ReelVideoJob>) {
  await col().updateOne(
    { jobId },
    { $set: { ...update, updatedAt: new Date() } }
  );
}

// ── Start video generation job ─────────────────────────────────────────────────

export async function startVideoGeneration(
  input: VideoStartInput
): Promise<VideoStartOutput> {
  const jobId = makeJobId();
  const now = new Date();

  const probe = await probeVideoCapability();
  if (!probe.available) {
    const job: ReelVideoJob = {
      jobId,
      contentId: input.contentId,
      userId: input.userId,
      status: "unsupported",
      progress: 0,
      runwayTaskId: null,
      openaiJobId: null,
      videoUrl: null,
      thumbnailUrl: null,
      script: input.script,
      shotList: input.shotList,
      platform: input.platform || "instagram",
      durationSeconds: input.durationSeconds || 5,
      aspectRatio: input.aspectRatio || "9:16",
      style: input.style || "professional",
      ctaUrl: input.ctaUrl || "",
      businessName: input.businessName || "",
      error: null,
      errorCode: "VIDEO_UNSUPPORTED",
      unsupportedReason: probe.reason,
      createdAt: now,
      updatedAt: now,
    };
    await col().insertOne(job);
    return { jobId, status: "unsupported", unsupportedReason: probe.reason };
  }

  const job: ReelVideoJob = {
    jobId,
    contentId: input.contentId,
    userId: input.userId,
    status: "queued",
    progress: 5,
    runwayTaskId: null,
    openaiJobId: null,
    videoUrl: null,
    thumbnailUrl: null,
    script: input.script,
    shotList: input.shotList,
    platform: input.platform || "instagram",
    durationSeconds: input.durationSeconds || 5,
    aspectRatio: input.aspectRatio || "9:16",
    style: input.style || "professional",
    ctaUrl: input.ctaUrl || "",
    businessName: input.businessName || "",
    error: null,
    errorCode: null,
    unsupportedReason: null,
    createdAt: now,
    updatedAt: now,
  };
  await col().insertOne(job);
  logger.info({ jobId, contentId: input.contentId }, "Reel video job queued — Runway Gen-4.5");

  void runVideoGeneration(jobId, input).catch((e) => {
    logger.error({ jobId, err: e }, "Video generation background job crashed");
  });

  return { jobId, status: "queued" };
}

// ── Background generation runner (Runway Gen-4) ────────────────────────────────

async function runVideoGeneration(
  jobId: string,
  input: VideoStartInput
): Promise<void> {
  const key = runwayKey();
  if (!key) {
    await updateJob(jobId, {
      status: "failed",
      error: "Runway API key not configured.",
      errorCode: "CLIENT_UNAVAILABLE",
      progress: 0,
    });
    return;
  }

  await updateJob(jobId, { status: "generating", progress: 15 });

  const prompt = buildVideoPrompt(input);
  // Runway Gen-4.5 only accepts 5 or 10 seconds. Map anything ≥ 8 to 10, anything else to 5.
  const requestedDur = input.durationSeconds ?? 5;
  const duration = requestedDur >= 8 ? 10 : 5;
  const ratio = runwayRatio(input.aspectRatio || "9:16");

  try {
    // ── 1. Create Runway task ────────────────────────────────────────────────
    const createRes = await fetch(`${RUNWAY_BASE}/text_to_video`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "X-Runway-Version": RUNWAY_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gen4.5",
        promptText: prompt,
        ratio,
        duration,
      }),
    });

    if (!createRes.ok) {
      const body = await createRes.text().catch(() => "");
      logger.error({ jobId, status: createRes.status, body }, "Runway task creation failed");
      // Surface the actual Runway error for diagnostics
      console.error(`[RUNWAY ERROR] status=${createRes.status} body=${body}`);

      if (createRes.status === 401 || createRes.status === 403) {
        await updateJob(jobId, {
          status: "unsupported",
          errorCode: "VIDEO_UNSUPPORTED",
          unsupportedReason: `Runway authentication failed (HTTP ${createRes.status}). Check RUNWAY_API_KEY is set correctly. API response: ${body.slice(0, 200)}`,
          progress: 0,
        });
        return;
      }
      if (createRes.status === 402) {
        await updateJob(jobId, {
          status: "failed",
          error: "Runway account has insufficient credits.",
          errorCode: "QUOTA_EXCEEDED",
          progress: 0,
        });
        return;
      }

      throw new Error(`Runway API error ${createRes.status}: ${body}`);
    }

    const taskData = await createRes.json() as { id?: string; status?: string };
    const runwayTaskId = taskData.id;
    if (!runwayTaskId) {
      throw new Error("Runway returned no task ID");
    }

    await updateJob(jobId, { runwayTaskId, progress: 30 });
    logger.info({ jobId, runwayTaskId }, "Runway task created — polling");

    // ── 2. Poll until complete (max 8 min, 8 s intervals) ───────────────────
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 8_000));

      const pollRes = await fetch(`${RUNWAY_BASE}/tasks/${runwayTaskId}`, {
        headers: {
          "Authorization": `Bearer ${key}`,
          "X-Runway-Version": RUNWAY_VERSION,
        },
      });

      if (!pollRes.ok) {
        logger.warn({ jobId, runwayTaskId, attempt, status: pollRes.status }, "Runway poll failed — retrying");
        continue;
      }

      const poll = await pollRes.json() as {
        id?: string;
        status?: string;
        output?: string[];
        progress?: number;
        failure?: string;
        failureCode?: string;
      };

      const pollStatus = poll.status;

      if (pollStatus === "SUCCEEDED") {
        const videoUrl = poll.output?.[0] ?? null;
        await updateJob(jobId, {
          status: "completed",
          progress: 100,
          videoUrl,
          thumbnailUrl: null,
        });
        logger.info({ jobId, runwayTaskId, hasVideo: !!videoUrl }, "Runway video generation completed");
        return;
      }

      if (pollStatus === "FAILED") {
        const errMsg = poll.failure || poll.failureCode || "Runway video generation failed.";
        await updateJob(jobId, {
          status: "failed",
          error: errMsg,
          errorCode: "RUNWAY_FAILED",
          progress: 0,
        });
        return;
      }

      // PENDING or RUNNING — update progress
      const runwayProgress = typeof poll.progress === "number" ? poll.progress : 0;
      const mappedProgress = Math.min(30 + Math.round(runwayProgress * 65), 95);
      const mappedStatus: VideoJobStatus =
        pollStatus === "RUNNING" ? "generating" : "generating";

      await updateJob(jobId, { status: mappedStatus, progress: mappedProgress });
    }

    // Timed out
    await updateJob(jobId, {
      status: "failed",
      error: "Video generation timed out after 8 minutes.",
      errorCode: "TIMEOUT",
      progress: 0,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ jobId, err }, "Runway video generation failed");

    await updateJob(jobId, {
      status: "failed",
      error: msg,
      errorCode: "GENERATION_FAILED",
      progress: 0,
    });
  }
}

// ── Admin capability check ────────────────────────────────────────────────────

export interface VideoCapabilityResult {
  available: boolean;
  keyPresent: boolean;
  activeKeyName: string | null;
  reason: string;
  videoModels: string[];
  checkedAt: string;
}

export async function checkVideoCapability(): Promise<VideoCapabilityResult> {
  const runwayPresent = !!runwayKey();
  const checkedAt = new Date().toISOString();

  return {
    available: runwayPresent,
    keyPresent: runwayPresent,
    activeKeyName: runwayPresent ? "RUNWAY_API_KEY" : null,
    reason: runwayPresent
      ? "Runway Gen-4.5 video generation is configured and ready."
      : "Set RUNWAY_API_KEY to enable Runway Gen-4.5 video generation.",
    videoModels: runwayPresent ? ["gen4.5"] : [],
    checkedAt,
  };
}
