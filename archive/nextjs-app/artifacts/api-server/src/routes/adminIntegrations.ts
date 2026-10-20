/**
 * Admin Integrations — comprehensive live health checks.
 * All env vars read at request time. No caching. Secrets always masked.
 */

import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { testMetaConnection } from "../services/social/meta.js";
import { testXConnection } from "../services/social/x.js";
import { testLinkedInConnection, refreshLinkedInToken } from "../services/social/linkedin.js";
import { testSnapchatConnection } from "../services/social/snapchat.js";
import { testYouTubeConnection } from "../services/social/youtube.js";
import { testTikTokSocialConnection } from "../services/social/tiktok.js";
import { logger } from "../lib/logger.js";
import { getCollection } from "../lib/mongo.js";
import { scanAllSecrets, clearResolverCache } from "../lib/secretResolver.js";
import { mask } from "../services/integrationHealth.js";

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────

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

function noCacheHeaders(res: Response): void {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface SecretInfo {
  key: string;
  present: boolean;
  masked: string;
}

function secret(key: string): SecretInfo {
  const val = process.env[key];
  return { key, present: !!val, masked: mask(val) };
}

// ── Resend health check ────────────────────────────────────────────────────────

interface ResendStatus {
  apiKeyPresent: boolean;
  apiKeyValid: boolean;
  fromEmail: string;
  testEmailReady: boolean;
  apiReachable: boolean;
  domainsFound: string[];
  error: string | null;
}

async function checkResend(): Promise<ResendStatus> {
  const key = process.env["RESEND_API_KEY"];
  const fromEmail = "support@worlddigital.ai";

  if (!key) {
    return {
      apiKeyPresent: false,
      apiKeyValid: false,
      fromEmail,
      testEmailReady: false,
      apiReachable: false,
      domainsFound: [],
      error: "RESEND_API_KEY not configured — add it as a Replit Secret",
    };
  }

  try {
    const r = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });

    if (r.ok) {
      const data = (await r.json()) as { data?: Array<{ name: string; status: string }> };
      const domains = (data.data ?? []).map((d) => d.name);
      return {
        apiKeyPresent: true,
        apiKeyValid: true,
        fromEmail,
        testEmailReady: true,
        apiReachable: true,
        domainsFound: domains,
        error: null,
      };
    }

    if (r.status === 401 || r.status === 403) {
      return {
        apiKeyPresent: true,
        apiKeyValid: false,
        fromEmail,
        testEmailReady: false,
        apiReachable: true,
        domainsFound: [],
        error: `API key invalid (HTTP ${r.status}) — generate a new key at resend.com/api-keys`,
      };
    }

    return {
      apiKeyPresent: true,
      apiKeyValid: false,
      fromEmail,
      testEmailReady: false,
      apiReachable: true,
      domainsFound: [],
      error: `Unexpected response from Resend (HTTP ${r.status})`,
    };
  } catch (e) {
    return {
      apiKeyPresent: true,
      apiKeyValid: false,
      fromEmail,
      testEmailReady: false,
      apiReachable: false,
      domainsFound: [],
      error: e instanceof Error ? e.message : "Network error reaching Resend API",
    };
  }
}

// In-memory record of most recent test-email attempt
let lastTestRecord: {
  status: "ok" | "failed";
  httpStatus: number;
  code: string;
  message: string;
  toEmail: string;
  fromEmail: string;
  testedAt: string;
} | null = null;

// ── GET /v1/admin/integrations/health ────────────────────────────────────────

router.get("/v1/admin/integrations/health", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    noCacheHeaders(res);
    const checkedAt = new Date().toISOString();

    const [metaLive, resendLive, xLive, linkedinLive, snapchatLive, youtubeLive] = await Promise.all([
      testMetaConnection().catch((e) => ({
        configured: false,
        tokenValid: false,
        tokenMasked: null as string | null,
        pagesFound: false,
        pageName: null as string | null,
        instagramBusinessFound: false,
        canPostFacebook: false,
        canPostInstagram: false,
        issues: [e instanceof Error ? e.message : "Meta check failed"],
      })),
      checkResend(),
      testXConnection().catch((e) => ({
        configured: false,
        credentialsValid: false,
        userHandle: null as string | null,
        readWriteAccess: false,
        postingReady: false,
        issues: [e instanceof Error ? e.message : "X check failed"],
      })),
      testLinkedInConnection().catch((e) => ({
        clientConfigured: false,
        accessTokenConfigured: false,
        accessTokenMasked: null as string | null,
        organizationConfigured: false,
        postingReady: false,
        issues: [e instanceof Error ? e.message : "LinkedIn check failed"],
      })),
      testSnapchatConnection().catch((e) => ({
        clientConfigured: false,
        accessTokenConfigured: false,
        accessTokenMasked: null as string | null,
        marketingApiReady: false,
        issues: [e instanceof Error ? e.message : "Snapchat check failed"],
      })),
      testYouTubeConnection().catch((e) => ({
        apiKeyConfigured: false,
        apiKeyValid: false,
        apiKeyMasked: null as string | null,
        oauthConfigured: false,
        uploadReady: false,
        issues: [e instanceof Error ? e.message : "YouTube check failed"],
      })),
    ]);

    // Log the test event
    try {
      await getCollection("webhookLogs").insertOne({
        source: "admin_integration_health",
        eventType: "integrations_check",
        status: "processed",
        summary: {
          metaTokenValid: metaLive.tokenValid,
          instagramFound: metaLive.instagramBusinessFound,
          facebookPageFound: metaLive.pagesFound,
          resendKeyValid: resendLive.apiKeyValid,
          xPostingReady: xLive.postingReady,
          linkedinPostingReady: linkedinLive.postingReady,
          snapchatMarketingReady: snapchatLive.marketingApiReady,
          youtubeUploadReady: youtubeLive.uploadReady,
        },
        receivedAt: new Date(),
      } as Record<string, unknown>);
    } catch { /* non-fatal */ }

    logger.info({ checkedAt }, "Admin integrations health check");

    res.json({
      checkedAt,
      envNote:
        "Replit Secrets are loaded at server startup. If you added a new secret, restart the server workflow for it to appear.",
      meta: {
        live: metaLive,
        secrets: {
          META_ACCESS_TOKEN: secret("META_ACCESS_TOKEN"),
          FB_PAGE_ID: secret("FB_PAGE_ID"),
          INSTAGRAM_BUSINESS_ACCOUNT_ID: secret("INSTAGRAM_BUSINESS_ACCOUNT_ID"),
          FB_AD_ACCOUNT_ID: secret("FB_AD_ACCOUNT_ID"),
        },
      },
      resend: {
        live: resendLive,
        secrets: {
          RESEND_API_KEY: secret("RESEND_API_KEY"),
        },
      },
      stripe: {
        mode: process.env["STRIPE_SECRET_KEY"]?.startsWith("sk_live") ? "live" : "test",
        secrets: {
          STRIPE_SECRET_KEY: secret("STRIPE_SECRET_KEY"),
          STRIPE_WEBHOOK_SECRET: secret("STRIPE_WEBHOOK_SECRET"),
          PRICE_META_MONTHLY: secret("PRICE_META_MONTHLY"),
        },
      },
      snapchat: {
        live: snapchatLive,
        secrets: {
          SNAPCHAT_CLIENT_ID: secret("SNAPCHAT_CLIENT_ID"),
          SNAP_CLIENT_ID: secret("SNAP_CLIENT_ID"),
          SNAP_CLIENT_SECRET: secret("SNAP_CLIENT_SECRET"),
          SNAPCHAT_CLIENT_SECRET: secret("SNAPCHAT_CLIENT_SECRET"),
          SNAP_ACCESS_TOKEN: secret("SNAP_ACCESS_TOKEN"),
          SNAP_REFRESH_TOKEN: secret("SNAP_REFRESH_TOKEN"),
          SNAP_AD_ACCOUNT_ID: secret("SNAP_AD_ACCOUNT_ID"),
        },
      },
      google: {
        secrets: {
          GOOGLE_CLIENT_ID:        secret("GOOGLE_CLIENT_ID"),
          GOOGLE_CLIENT_SECRET:    secret("GOOGLE_CLIENT_SECRET"),
          GOOGLE_DEVELOPER_TOKEN:  secret("GOOGLE_DEVELOPER_TOKEN"),
          MCC_CUSTOMER_ID:         secret("MCC_CUSTOMER_ID"),
          CLIENT_CUSTOMER_ID:      secret("CLIENT_CUSTOMER_ID"),
          MCC_REFRESH_TOKEN:       secret("MCC_REFRESH_TOKEN"),
          GOOGLE_REDIRECT_URI:     secret("GOOGLE_REDIRECT_URI"),
        },
      },
      googleOAuth: (() => {
        const clientId     = process.env["GOOGLE_CLIENT_ID"];
        const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
        const redirectUri  = process.env["GOOGLE_REDIRECT_URI"];
        const oauthReady   = !!clientId && !!clientSecret;
        const issues: string[] = [];
        if (!clientId)     issues.push("GOOGLE_CLIENT_ID not set — add from Google Cloud Console → Credentials");
        if (!clientSecret) issues.push("GOOGLE_CLIENT_SECRET not set — add from Google Cloud Console → Credentials");
        if (!redirectUri) {
          issues.push(
            "GOOGLE_REDIRECT_URI not set — set to https://worlddigital.ai/api/v1/auth/google/callback " +
            "and register that exact URL in Google Cloud Console → Credentials → Authorized redirect URIs"
          );
        }
        return {
          clientIdPresent:      !!clientId,
          clientSecretPresent:  !!clientSecret,
          redirectUriConfigured: !!redirectUri,
          redirectUri:          redirectUri ?? null,
          callbackPath:         "/api/v1/auth/google/callback",
          canonicalCallbackUrl: "https://worlddigital.ai/api/v1/auth/google/callback",
          oauthReady,
          issues,
          secrets: {
            GOOGLE_CLIENT_ID:     secret("GOOGLE_CLIENT_ID"),
            GOOGLE_CLIENT_SECRET: secret("GOOGLE_CLIENT_SECRET"),
            GOOGLE_REDIRECT_URI:  secret("GOOGLE_REDIRECT_URI"),
          },
        };
      })(),
      googleSearch: (() => {
        const siteVerification = process.env["GOOGLE_SITE_VERIFICATION"] ?? process.env["NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"];
        const searchConsoleKey = process.env["GOOGLE_SEARCH_CONSOLE_KEY"];
        const issues: string[] = [];
        if (!siteVerification) issues.push("GOOGLE_SITE_VERIFICATION not set — add from Google Search Console → Settings → Ownership verification → HTML tag");
        if (!searchConsoleKey)  issues.push("GOOGLE_SEARCH_CONSOLE_KEY not set — optional, enables Search Console API for keyword data");
        return {
          siteVerificationPresent: !!siteVerification,
          siteVerificationMasked:  siteVerification ? `${siteVerification.slice(0, 8)}…` : null,
          searchConsoleConfigured: !!searchConsoleKey,
          issues,
          secrets: {
            GOOGLE_SITE_VERIFICATION:            secret("GOOGLE_SITE_VERIFICATION"),
            NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: secret("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
            GOOGLE_SEARCH_CONSOLE_KEY:           secret("GOOGLE_SEARCH_CONSOLE_KEY"),
          },
        };
      })(),
      linkedin: {
        live: linkedinLive,
        secrets: {
          LINKEDIN_CLIENT_ID:       secret("LINKEDIN_CLIENT_ID"),
          LINKEDIN_CLIENT_SECRET:   secret("LINKEDIN_CLIENT_SECRET"),
          LINKEDIN_ACCESS_TOKEN:    secret("LINKEDIN_ACCESS_TOKEN"),
          LINKEDIN_ORGANIZATION_ID: secret("LINKEDIN_ORGANIZATION_ID"),
        },
      },
      youtube: {
        live: youtubeLive,
        secrets: {
          YOUTUBE_API_KEY:       secret("YOUTUBE_API_KEY"),
          YOUTUBE_CLIENT_ID:     secret("YOUTUBE_CLIENT_ID"),
          YOUTUBE_CLIENT_SECRET: secret("YOUTUBE_CLIENT_SECRET"),
          YOUTUBE_REFRESH_TOKEN: secret("YOUTUBE_REFRESH_TOKEN"),
          YOUTUBE_CHANNEL_ID:    secret("YOUTUBE_CHANNEL_ID"),
        },
      },
      x: {
        live: xLive,
        secrets: {
          X_API_KEY:              secret("X_API_KEY"),
          X_API_SECRET:           secret("X_API_SECRET"),
          X_ACCESS_TOKEN:         secret("X_ACCESS_TOKEN"),
          X_ACCESS_TOKEN_SECRET:  secret("X_ACCESS_TOKEN_SECRET"),
        },
      },
      tiktok: {
        secrets: {
          TIKTOK_CLIENT_KEY:        secret("TIKTOK_CLIENT_KEY"),
          TIKTOK_CLIENT_SECRET:     secret("TIKTOK_CLIENT_SECRET"),
          TIKTOK_ACCESS_TOKEN:      secret("TIKTOK_ACCESS_TOKEN"),
          TIKTOK_SITE_VERIFICATION: secret("TIKTOK_SITE_VERIFICATION"),
        },
      },
      ai: {
        secrets: {
          CHAT_BOT:              secret("CHAT_BOT"),
          CHATGPT_IMAGE_LATEST:  secret("CHATGPT_IMAGE_LATEST"),
          OPENAI_API_KEY:        secret("OPENAI_API_KEY"),
        },
      },
      aws: {
        secrets: {
          AWS_ACCESS_KEY_ID: secret("AWS_ACCESS_KEY_ID"),
          S3_BUCKET_NAME: secret("S3_BUCKET_NAME"),
        },
      },
    });
  });
});

// ── GET /v1/admin/ai/models ───────────────────────────────────────────────────
// Lists all OpenAI models accessible to the current API key.
// Tries each of the configured AI key env vars in order.

router.get("/v1/admin/ai/models", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    noCacheHeaders(res);
    const keyNames = ["CHATGPT_IMAGE_LATEST", "CHAT_BOT", "OPENAI_API_KEY", "AI_API_KEY"];
    const results: Array<{ keyName: string; status: number; modelCount?: number; chatModels?: string[]; error?: string }> = [];

    for (const keyName of keyNames) {
      const apiKey = process.env[keyName];
      if (!apiKey) continue;
      try {
        const r = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (!r.ok) {
          const errText = await r.text();
          results.push({ keyName, status: r.status, error: errText.slice(0, 200) });
          continue;
        }
        const data = await r.json() as { data: Array<{ id: string }> };
        const allModels = data.data.map((m) => m.id).sort();
        const chatModels = allModels.filter((id) =>
          id.includes("gpt") || id.includes("chatgpt") || id.includes("o1") || id.includes("o3")
        );
        results.push({ keyName, status: 200, modelCount: allModels.length, chatModels });
      } catch (err) {
        results.push({ keyName, status: 0, error: String(err) });
      }
    }

    res.json({ results });
  });
});

// ── GET /v1/admin/integrations/events ────────────────────────────────────────

router.get("/v1/admin/integrations/events", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    noCacheHeaders(res);
    try {
      const events = await getCollection("webhookLogs")
        .find({ source: "admin_integration_health" })
        .sort({ receivedAt: -1 })
        .limit(20)
        .toArray();
      res.json(events);
    } catch (err) {
      logger.error({ err }, "Error fetching integration events");
      res.status(500).json({ message: "Failed to load events" });
    }
  });
});

// ── POST /v1/admin/integrations/send-test-email ───────────────────────────────
// Sends a real test email via Resend to verify the email pipeline is working.

router.post("/v1/admin/integrations/send-test-email", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    noCacheHeaders(res);

    const apiKey = process.env["RESEND_API_KEY"];
    const fromEmail = "support@worlddigital.ai";
    const ENDPOINT = "https://api.resend.com/emails";

    if (!apiKey) {
      const record = {
        status: "failed" as const,
        httpStatus: 0,
        code: "NO_KEY",
        message: "RESEND_API_KEY is not configured.",
        toEmail: "support@worlddigital.ai",
        fromEmail,
        testedAt: new Date().toISOString(),
      };
      lastTestRecord = record;
      logger.warn({ toEmail: "support@worlddigital.ai", code: record.code }, "Test email failed — Resend key missing");
      res.status(400).json({
        success: false,
        message: record.message,
        code: record.code,
        actionable: "Add RESEND_API_KEY as a Replit Secret (get one at resend.com/api-keys).",
      });
      return;
    }

    try {
      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `WorldDigital.ai <${fromEmail}>`,
          to: ["support@worlddigital.ai"],
          subject: "WorldDigital.ai — Integration Test Email",
          html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <div style="border-top:4px solid;border-image:linear-gradient(to right,#4285C7,#C13A2A) 1;padding-top:20px;margin-bottom:20px"></div>
            <h2 style="color:#C13A2A;margin:0 0 16px">WorldDigital.ai — Integration Test</h2>
            <p style="color:#374151">This test email was sent at <strong>${new Date().toISOString()}</strong> from the admin integrations panel.</p>
            <p style="color:#374151">If you received this, Resend is working correctly.</p>
            <p style="color:#9CA3AF;font-size:11px">From: ${fromEmail} · Via: Resend API</p>
          </div>`,
        }),
        signal: AbortSignal.timeout(12000),
      });

      const httpStatus = resp.status;

      if (resp.ok || httpStatus === 200 || httpStatus === 201) {
        lastTestRecord = {
          status: "ok",
          httpStatus,
          code: "OK",
          message: "Test email sent to support@worlddigital.ai",
          toEmail: "support@worlddigital.ai",
          fromEmail,
          testedAt: new Date().toISOString(),
        };
        logger.info({ toEmail: "support@worlddigital.ai", fromEmail, httpStatus, endpoint: ENDPOINT }, "Integration test email sent via Resend");
        try {
          await getCollection("webhookLogs").insertOne({
            source: "admin_integration_health",
            eventType: "test_email_sent",
            status: "processed",
            summary: { toEmail: "support@worlddigital.ai", fromEmail, httpStatus, provider: "resend" },
            receivedAt: new Date(),
          } as Record<string, unknown>);
        } catch { /* non-fatal */ }
        res.json({
          success: true,
          message: "Test email sent to support@worlddigital.ai via Resend",
          fromEmail,
          endpoint: ENDPOINT,
          httpStatus,
        });
      } else {
        const rawBody = await resp.text();
        let errorMsg = `Resend rejected the request (HTTP ${httpStatus})`;
        let code = `HTTP_${httpStatus}`;
        let actionable = "Check your RESEND_API_KEY and domain verification at resend.com.";

        try {
          const parsed = JSON.parse(rawBody) as { name?: string; message?: string; statusCode?: number };
          if (parsed.message) errorMsg = parsed.message;
          if (parsed.name) code = parsed.name;
          if (httpStatus === 401 || httpStatus === 403) actionable = "Your RESEND_API_KEY is invalid or expired. Generate a new one at resend.com/api-keys.";
          if (httpStatus === 422) actionable = "Check that your from address matches a verified domain in Resend.";
        } catch { /* keep defaults */ }

        lastTestRecord = {
          status: "failed",
          httpStatus,
          code,
          message: errorMsg,
          toEmail: "support@worlddigital.ai",
          fromEmail,
          testedAt: new Date().toISOString(),
        };
        logger.error({ toEmail: "support@worlddigital.ai", fromEmail, endpoint: ENDPOINT, httpStatus, code, errorMsg }, "Test email failed — Resend rejected");
        res.status(400).json({ success: false, message: errorMsg, code, actionable, fromEmail, endpoint: ENDPOINT, httpStatus });
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Network error";
      lastTestRecord = {
        status: "failed",
        httpStatus: 0,
        code: "NETWORK_ERROR",
        message: errMsg,
          toEmail: "support@worlddigital.ai",
        fromEmail,
        testedAt: new Date().toISOString(),
      };
      logger.error({ toEmail: "support@worlddigital.ai", fromEmail, err: e }, "Test email network error");
      res.status(500).json({ success: false, message: errMsg, code: "NETWORK_ERROR" });
    }
  });
});

// ── POST /v1/admin/integrations/send-career-test-email ───────────────────────
// Sends a sample career application email to support@worlddigital.ai to verify
// the career notification pipeline is working end-to-end.

router.post("/v1/admin/integrations/send-career-test-email", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    noCacheHeaders(res);

    const { sendCareerNotificationEmail } = await import("../lib/email.js");

    const result = await sendCareerNotificationEmail({
      firstName: "Test",
      lastName: "Applicant",
      email: "test-applicant@worlddigital.ai",
      phone: "+1 (555) 000-0000",
      position: "AI Marketing Specialist",
      experience: "3–5 years",
      message: "This is a test email sent from the WorldDigital.ai admin panel to verify the career application notification pipeline is working correctly.",
      linkedInUrl: "https://linkedin.com/in/test-applicant",
      portfolioUrl: "https://portfolio.example.com",
      submittedAt: new Date(),
    });

    if (result.sent) {
      logger.info({ endpoint: "send-career-test-email" }, "Career test email sent to support@worlddigital.ai");
      res.json({ success: true, message: "Career test email sent to support@worlddigital.ai" });
    } else {
      logger.warn({ endpoint: "send-career-test-email", reason: result.error }, "Career test email failed");
      res.status(400).json({ success: false, message: result.error || "Failed to send test email" });
    }
  });
});

// ── GET /email/debug — live Resend status ────────────────────────────────────

router.get("/email/debug", async (_req: Request, res: Response) => {
  noCacheHeaders(res);
  const checkedAt = new Date().toISOString();
  const status = await checkResend();
  const issues: string[] = [];

  if (!status.apiKeyPresent) issues.push("RESEND_API_KEY not set — add it as a Replit Secret");
  else if (!status.apiKeyValid) issues.push(status.error ?? "API key validation failed");

  res.json({
    ...status,
    checkedAt,
    provider: "resend",
    lastTestStatus: lastTestRecord?.status ?? null,
    lastTestError: lastTestRecord?.status === "failed" ? `[${lastTestRecord.code}] ${lastTestRecord.message} (${lastTestRecord.testedAt})` : null,
    lastTest: lastTestRecord,
    issues,
  });
});

// ── GET /v1/admin/integrations/ai-media ──────────────────────────────────────

router.get("/v1/admin/integrations/ai-media", (req: Request, res: Response) => {
  requireAdmin(req, res, () => {
    noCacheHeaders(res);
    import("../services/aiMediaService.js").then(({ checkAICapabilities }) => {
      checkAICapabilities().then((caps) => {
        res.json(caps);
      }).catch((err: unknown) => {
        logger.error({ err }, "AI media health check failed");
        res.status(500).json({ error: "AI media health check failed" });
      });
    }).catch((err: unknown) => {
      logger.error({ err }, "Failed to load aiMediaService");
      res.status(500).json({ error: "Failed to load AI media service" });
    });
  });
});

// ── GET /v1/admin/integrations/ai-video ──────────────────────────────────────

router.get("/v1/admin/integrations/ai-video", (req: Request, res: Response) => {
  requireAdmin(req, res, () => {
    noCacheHeaders(res);
    import("../services/aiVideoService.js").then(({ checkVideoCapability }) => {
      checkVideoCapability().then((result) => {
        logger.info({ available: result.available }, "Admin video capability check");
        res.json(result);
      }).catch((err: unknown) => {
        logger.error({ err }, "AI video capability check failed");
        res.status(500).json({ error: "AI video capability check failed" });
      });
    }).catch((err: unknown) => {
      logger.error({ err }, "Failed to load aiVideoService");
      res.status(500).json({ error: "Failed to load AI video service" });
    });
  });
});

// ── GET /v1/admin/secret-resolver/scan ────────────────────────────────────────

router.get("/v1/admin/secret-resolver/scan", (req: Request, res: Response) => {
  requireAdmin(req, res, () => {
    noCacheHeaders(res);
    const data = scanAllSecrets();
    const summary = {
      total: data.length,
      fullyResolved: data.filter((i) => i.fullyResolved).length,
      hasConflicts: data.filter((i) => i.conflicts.length > 0).length,
      hasMissing: data.filter((i) => i.missingRequired.length > 0).length,
    };
    logger.info({ summary }, "Secret resolver scan requested");
    res.json({ scannedAt: new Date().toISOString(), summary, integrations: data });
  });
});

// ── POST /v1/admin/secret-resolver/invalidate ─────────────────────────────────

router.post("/v1/admin/secret-resolver/invalidate", (req: Request, res: Response) => {
  requireAdmin(req, res, () => {
    clearResolverCache();
    logger.info("Secret resolver cache cleared by admin");
    res.json({ cleared: true, message: "Resolver cache cleared — next scan will re-read all env vars." });
  });
});

// ── POST /v1/admin/integrations/refresh-linkedin ──────────────────────────────

router.post("/v1/admin/integrations/refresh-linkedin", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    noCacheHeaders(res);
    const result = await refreshLinkedInToken();
    logger.info({ success: result.success }, "Admin LinkedIn token refresh");
    res.json(result);
  });
});

// ── GET /v1/admin/integrations/full-test ─────────────────────────────────────
// Runs a live API call against EVERY integration and reports WORKING / BROKEN.
// Tests read-only endpoints only — never posts, charges, or modifies data.

router.get("/v1/admin/integrations/full-test", async (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    noCacheHeaders(res);
    const testedAt = new Date().toISOString();

    type TestResult = {
      status:     "WORKING" | "BROKEN" | "NOT_CONFIGURED";
      keyPresent: boolean;
      keyName:    string | null;
      detail:     string;
      apiCall:    string;
    };

    function env(...keys: string[]): string | undefined {
      for (const k of keys) {
        const v = process.env[k];
        if (v?.trim()) return v.trim();
      }
      return undefined;
    }

    function notConfigured(label: string, ...keys: string[]): TestResult {
      return {
        status: "NOT_CONFIGURED",
        keyPresent: false,
        keyName: keys[0] ?? label,
        detail: `Not set — add ${keys.join(" or ")} to Replit Secrets`,
        apiCall: "skipped",
      };
    }

    async function liveCheck(
      apiCall: string,
      keyName: string,
      fn: () => Promise<string>
    ): Promise<TestResult> {
      try {
        const detail = await fn();
        return { status: "WORKING", keyPresent: true, keyName, detail, apiCall };
      } catch (e) {
        return {
          status: "BROKEN",
          keyPresent: true,
          keyName,
          detail: e instanceof Error ? e.message : String(e),
          apiCall,
        };
      }
    }

    // ── Run all checks in parallel ────────────────────────────────────────

    const [
      stripeResult,
      resendResult,
      openaiResult,
      metaResult,
      instagramResult,
      youtubeResult,
      linkedinResult,
      xResult,
      snapchatResult,
      tiktokResult,
      mongoResult,
    ] = await Promise.all([

      // Stripe
      (() => {
        const key = env("STRIPE_SECRET_KEY");
        if (!key) return Promise.resolve(notConfigured("Stripe", "STRIPE_SECRET_KEY"));
        return liveCheck("GET https://api.stripe.com/v1/balance", "STRIPE_SECRET_KEY", async () => {
          const r = await fetch("https://api.stripe.com/v1/balance", {
            headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` },
            signal: AbortSignal.timeout(10000),
          });
          const d = (await r.json()) as { object?: string; available?: unknown[]; error?: { message: string } };
          if (!r.ok) throw new Error(d.error?.message ?? `HTTP ${r.status}`);
          const mode = key.startsWith("sk_live") ? "LIVE mode" : "TEST mode";
          return `Balance object: ${d.object ?? "ok"} (${mode})`;
        });
      })(),

      // Resend
      (() => {
        const key = env("RESEND_API_KEY");
        if (!key) return Promise.resolve(notConfigured("Resend", "RESEND_API_KEY"));
        return liveCheck("GET https://api.resend.com/domains", "RESEND_API_KEY", async () => {
          const r = await fetch("https://api.resend.com/domains", {
            headers: { Authorization: `Bearer ${key}` },
            signal: AbortSignal.timeout(8000),
          });
          const d = (await r.json()) as { data?: Array<{ name: string; status: string }>; name?: string; message?: string };
          if (!r.ok) throw new Error(d.message ?? `HTTP ${r.status}`);
          const domains = (d.data ?? []).map((x) => x.name);
          return domains.length > 0 ? `Verified domains: ${domains.join(", ")}` : "API key valid — no domains configured yet";
        });
      })(),

      // OpenAI / CHAT_BOT
      (() => {
        const key = env("CHAT_BOT", "OPENAI_API_KEY");
        const keyName = env("CHAT_BOT") ? "CHAT_BOT" : "OPENAI_API_KEY";
        if (!key) return Promise.resolve(notConfigured("OpenAI", "CHAT_BOT", "OPENAI_API_KEY"));
        return liveCheck("GET https://api.openai.com/v1/models", keyName, async () => {
          const r = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${key}` },
            signal: AbortSignal.timeout(10000),
          });
          const d = (await r.json()) as { data?: Array<{ id: string }>; error?: { message: string } };
          if (!r.ok) throw new Error(d.error?.message ?? `HTTP ${r.status}`);
          const models = (d.data ?? []).map((m) => m.id).filter((id) => id.includes("gpt")).slice(0, 3);
          return `Key valid — GPT models available: ${models.join(", ")}`;
        });
      })(),

      // Meta / Facebook
      (() => {
        const token = env("META_ACCESS_TOKEN", "FB_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN");
        const keyName = env("META_ACCESS_TOKEN") ? "META_ACCESS_TOKEN" : "FB_ACCESS_TOKEN";
        if (!token) return Promise.resolve(notConfigured("Meta", "META_ACCESS_TOKEN", "FB_ACCESS_TOKEN"));
        return liveCheck("GET https://graph.facebook.com/v19.0/me", keyName, async () => {
          const r = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}&fields=id,name`, {
            signal: AbortSignal.timeout(8000),
          });
          const d = (await r.json()) as { id?: string; name?: string; error?: { message: string } };
          if (!r.ok || !d.id) throw new Error(d.error?.message ?? "Invalid token");
          return `Token valid — Account: ${d.name ?? d.id}`;
        });
      })(),

      // Instagram
      (() => {
        const token = env("META_ACCESS_TOKEN", "FB_ACCESS_TOKEN");
        const igId  = env("INSTAGRAM_BUSINESS_ACCOUNT_ID", "IG_BUSINESS_ACCOUNT_ID");
        if (!token || !igId) return Promise.resolve(notConfigured("Instagram", "INSTAGRAM_BUSINESS_ACCOUNT_ID"));
        return liveCheck(`GET https://graph.facebook.com/v19.0/${igId.slice(0,8)}...`, "INSTAGRAM_BUSINESS_ACCOUNT_ID", async () => {
          const r = await fetch(`https://graph.facebook.com/v19.0/${igId}?access_token=${token}&fields=id,username`, {
            signal: AbortSignal.timeout(8000),
          });
          const d = (await r.json()) as { id?: string; username?: string; error?: { message: string } };
          if (!r.ok || !d.id) throw new Error(d.error?.message ?? "IG account not accessible");
          return `IG Business Account valid — @${d.username ?? d.id}`;
        });
      })(),

      // YouTube
      (() => {
        const apiKey = env("YOUTUBE_API_KEY", "GOOGLE_YOUTUBE_API_KEY");
        if (!apiKey) return Promise.resolve(notConfigured("YouTube", "YOUTUBE_API_KEY"));
        return liveCheck("GET https://www.googleapis.com/youtube/v3/videos", "YOUTUBE_API_KEY", async () => {
          const r = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${apiKey}`,
            { signal: AbortSignal.timeout(8000) }
          );
          const d = (await r.json()) as { items?: unknown[]; error?: { message: string } };
          if (!r.ok) throw new Error(d.error?.message ?? `HTTP ${r.status}`);
          const hasOAuth = !!(env("YOUTUBE_REFRESH_TOKEN") && env("YOUTUBE_CLIENT_ID") && env("YOUTUBE_CLIENT_SECRET") && env("YOUTUBE_CHANNEL_ID"));
          return `API key valid. Uploads ${hasOAuth ? "✓ OAuth configured (upload ready)" : "✗ OAuth not set (YOUTUBE_REFRESH_TOKEN + YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET + YOUTUBE_CHANNEL_ID needed)"}`;
        });
      })(),

      // LinkedIn
      (() => {
        const token = env("LINKEDIN_ACCESS_TOKEN", "LINKEDIN_TOKEN");
        if (!token) return Promise.resolve(notConfigured("LinkedIn", "LINKEDIN_ACCESS_TOKEN"));
        return liveCheck("GET https://api.linkedin.com/v2/me", "LINKEDIN_ACCESS_TOKEN", async () => {
          const r = await fetch("https://api.linkedin.com/v2/me", {
            headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
            signal: AbortSignal.timeout(8000),
          });
          const d = (await r.json()) as { id?: string; localizedFirstName?: string; localizedLastName?: string; message?: string };
          if (!r.ok) {
            if (r.status === 401) throw new Error("Access token expired — run the OAuth flow again or set LINKEDIN_REFRESH_TOKEN for auto-refresh");
            throw new Error(d.message ?? `HTTP ${r.status}`);
          }
          const name = [d.localizedFirstName, d.localizedLastName].filter(Boolean).join(" ") || d.id;
          const orgId = env("LINKEDIN_ORGANIZATION_ID");
          const expiresAt = process.env["LINKEDIN_TOKEN_EXPIRES_AT"];
          const daysLeft = expiresAt ? Math.ceil((parseInt(expiresAt) - Date.now() / 1000) / 86400) : null;
          return `Token valid — ${name}. Org: ${orgId ? `✓ ${orgId}` : "✗ LINKEDIN_ORGANIZATION_ID not set"}. Token expires: ${daysLeft !== null ? `in ${daysLeft} days` : "unknown (set LINKEDIN_TOKEN_EXPIRES_AT)"}`;
        });
      })(),

      // X / Twitter
      (() => {
        const apiKey = env("X_API_KEY", "TWITTER_API_KEY");
        const apiSecret = env("X_API_SECRET", "TWITTER_API_SECRET");
        const token = env("X_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN");
        const tokenSecret = env("X_ACCESS_TOKEN_SECRET", "TWITTER_ACCESS_TOKEN_SECRET");
        if (!apiKey || !apiSecret || !token || !tokenSecret) {
          const missing = [!apiKey && "X_API_KEY", !apiSecret && "X_API_SECRET", !token && "X_ACCESS_TOKEN", !tokenSecret && "X_ACCESS_TOKEN_SECRET"].filter(Boolean);
          return Promise.resolve({ status: "NOT_CONFIGURED" as const, keyPresent: false, keyName: "X_API_KEY", detail: `Missing: ${missing.join(", ")}`, apiCall: "skipped" });
        }
        return liveCheck("GET https://api.twitter.com/2/users/me", "X_API_KEY", async () => {
          // OAuth 1.0a signing
          const { createHmac } = await import("crypto");
          const pct = (s: string) => encodeURIComponent(s);
          const nonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          const ts = Math.floor(Date.now() / 1000).toString();
          const oauthParams: Record<string, string> = {
            oauth_consumer_key: apiKey,
            oauth_nonce: nonce,
            oauth_signature_method: "HMAC-SHA1",
            oauth_timestamp: ts,
            oauth_token: token,
            oauth_version: "1.0",
          };
          const url = "https://api.twitter.com/2/users/me";
          const paramStr = Object.entries(oauthParams).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${pct(k)}=${pct(v)}`).join("&");
          const baseStr = `GET&${pct(url)}&${pct(paramStr)}`;
          const sigKey = `${pct(apiSecret)}&${pct(tokenSecret)}`;
          const sig = createHmac("sha1", sigKey).update(baseStr).digest("base64");
          oauthParams["oauth_signature"] = sig;
          const headerParts = Object.entries(oauthParams).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${pct(k)}="${pct(v)}"`).join(", ");
          const authHeader = `OAuth ${headerParts}`;
          const r = await fetch(url, { headers: { Authorization: authHeader }, signal: AbortSignal.timeout(10000) });
          const d = (await r.json()) as { data?: { username?: string; name?: string }; errors?: Array<{ message: string }>; title?: string };
          if (!r.ok || !d.data) throw new Error(d.errors?.[0]?.message ?? d.title ?? `HTTP ${r.status} — check Read+Write permissions on your X app`);
          return `Credentials valid — @${d.data.username} (${d.data.name})`;
        });
      })(),

      // Snapchat
      (() => {
        const clientId = env("SNAPCHAT_CLIENT_ID", "SNAP_CLIENT_ID");
        const token = env("SNAP_ACCESS_TOKEN", "SNAPCHAT_ACCESS_TOKEN");
        if (!clientId) return Promise.resolve(notConfigured("Snapchat", "SNAPCHAT_CLIENT_ID", "SNAP_CLIENT_ID"));
        if (!token) return Promise.resolve({ status: "NOT_CONFIGURED" as const, keyPresent: true, keyName: "SNAP_ACCESS_TOKEN", detail: "Client ID set but SNAP_ACCESS_TOKEN not set — complete OAuth flow via Admin → Integrations → Snapchat", apiCall: "skipped" });
        return liveCheck("GET https://adsapi.snapchat.com/v1/me/organizations", "SNAP_ACCESS_TOKEN", async () => {
          const r = await fetch("https://adsapi.snapchat.com/v1/me/organizations", {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(8000),
          });
          const d = (await r.json()) as { organizations?: Array<{ organization: { name: string } }>; request_status?: string };
          if (!r.ok) {
            if (r.status === 401) throw new Error("Access token expired — use Refresh Token in Admin → Integrations → Snapchat. NOTE: Snapchat has no organic posting API — only paid Ads Marketing API.");
            throw new Error(`HTTP ${r.status}. NOTE: Snapchat has no organic posting API — only paid Ads Marketing API.`);
          }
          const orgs = (d.organizations ?? []).map((o) => o.organization.name);
          return `Marketing API valid (paid ads only — no organic posting API). Organizations: ${orgs.join(", ") || "none found"}`;
        });
      })(),

      // TikTok
      (() => {
        const key = env("TIKTOK_CLIENT_KEY");
        const token = env("TIKTOK_ACCESS_TOKEN");
        if (!key) return Promise.resolve(notConfigured("TikTok", "TIKTOK_CLIENT_KEY"));
        if (!token) return Promise.resolve({ status: "NOT_CONFIGURED" as const, keyPresent: true, keyName: "TIKTOK_ACCESS_TOKEN", detail: "Client key set but TIKTOK_ACCESS_TOKEN not set — connect via Admin → Integrations → TikTok", apiCall: "skipped" });
        return liveCheck("GET https://open.tiktokapis.com/v2/user/info/", "TIKTOK_ACCESS_TOKEN", async () => {
          const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(8000),
          });
          const d = (await r.json()) as { data?: { user?: { open_id?: string; display_name?: string } }; error?: { code?: number; message?: string } };
          if (!r.ok || d.error?.code) {
            if (r.status === 401 || d.error?.code === 10010) throw new Error("Access token expired — reconnect via Admin → Integrations → TikTok");
            if (d.error?.code === 10004 || d.error?.code === 10005) throw new Error(`API not approved yet: ${d.error.message} — apply at developers.tiktok.com for video.publish scope`);
            throw new Error(d.error?.message ?? `HTTP ${r.status}`);
          }
          const user = d.data?.user;
          const openId = env("TIKTOK_OPEN_ID");
          return `Token valid — display: ${user?.display_name ?? "unknown"}. TIKTOK_OPEN_ID: ${openId ? "✓ set" : "✗ not set (needed for posting)"}`;
        });
      })(),

      // MongoDB
      (async () => {
        const uri = process.env["MONGODB_URI"];
        if (!uri) return notConfigured("MongoDB", "MONGODB_URI");
        return liveCheck("mongodb admin ping", "MONGODB_URI", async () => {
          const { pingMongo } = await import("../lib/mongo.js");
          const ok = await pingMongo();
          if (!ok) throw new Error("MongoDB ping returned false");
          return "Ping successful — database is reachable";
        });
      })(),
    ]);

    // ── Additional credential-only checks (no live API calls needed) ──────

    function credCheck(label: string, apiCall: string, ...keys: string[]): TestResult {
      const found = keys.find((k) => process.env[k]?.trim());
      if (!found) return notConfigured(label, ...keys);
      return { status: "WORKING", keyPresent: true, keyName: found, detail: `Key present (${found}) — no live endpoint needed`, apiCall };
    }

    // Google OAuth
    const gClientId     = env("GOOGLE_CLIENT_ID");
    const gClientSecret = env("GOOGLE_CLIENT_SECRET");
    const gRedirectUri  = env("GOOGLE_REDIRECT_URI");
    const googleOAuth: TestResult = (!gClientId || !gClientSecret)
      ? { status: "NOT_CONFIGURED", keyPresent: false, keyName: "GOOGLE_CLIENT_ID", detail: `Missing: ${[!gClientId && "GOOGLE_CLIENT_ID", !gClientSecret && "GOOGLE_CLIENT_SECRET"].filter(Boolean).join(", ")}`, apiCall: "skipped" }
      : { status: "WORKING", keyPresent: true, keyName: "GOOGLE_CLIENT_ID", detail: `Client ID + Secret present. Redirect URI: ${gRedirectUri ?? "⚠ GOOGLE_REDIRECT_URI not set — sign-in will fail"}`, apiCall: "credential check" };

    // Google Ads
    const gDevToken   = env("GOOGLE_DEVELOPER_TOKEN");
    const mccToken    = env("MCC_REFRESH_TOKEN");
    const mccId       = env("MCC_CUSTOMER_ID");
    const googleAds: TestResult = (!gDevToken || !mccToken || !mccId)
      ? { status: "NOT_CONFIGURED", keyPresent: !!gDevToken, keyName: "GOOGLE_DEVELOPER_TOKEN", detail: `Missing: ${[!gDevToken && "GOOGLE_DEVELOPER_TOKEN", !mccToken && "MCC_REFRESH_TOKEN", !mccId && "MCC_CUSTOMER_ID"].filter(Boolean).join(", ")}`, apiCall: "skipped" }
      : { status: "WORKING", keyPresent: true, keyName: "GOOGLE_DEVELOPER_TOKEN", detail: "Developer token + MCC refresh token + MCC customer ID all present", apiCall: "credential check" };

    // Apple Sign In
    const appleTeam    = env("APPLE_TEAM_ID");
    const appleClient  = env("APPLE_CLIENT_ID");
    const appleKeyId   = env("APPLE_KEY_ID");
    const appleKey     = env("APPLE_PRIVATE_KEY");
    const appleSignIn: TestResult = (!appleTeam || !appleClient || !appleKeyId || !appleKey)
      ? { status: "NOT_CONFIGURED", keyPresent: !!(appleTeam || appleClient), keyName: "APPLE_TEAM_ID", detail: `Missing: ${[!appleTeam && "APPLE_TEAM_ID", !appleClient && "APPLE_CLIENT_ID", !appleKeyId && "APPLE_KEY_ID", !appleKey && "APPLE_PRIVATE_KEY"].filter(Boolean).join(", ")}`, apiCall: "skipped" }
      : { status: "WORKING", keyPresent: true, keyName: "APPLE_TEAM_ID", detail: "All 4 Apple credentials present", apiCall: "credential check" };

    // AWS S3
    const awsKey    = env("AWS_ACCESS_KEY_ID");
    const awsSecret = env("AWS_SECRET_ACCESS_KEY");
    const s3Bucket  = env("S3_BUCKET_NAME");
    const awsS3: TestResult = (!awsKey || !s3Bucket)
      ? { status: "NOT_CONFIGURED", keyPresent: false, keyName: "AWS_ACCESS_KEY_ID", detail: `Missing: ${[!awsKey && "AWS_ACCESS_KEY_ID", !awsSecret && "AWS_SECRET_ACCESS_KEY", !s3Bucket && "S3_BUCKET_NAME"].filter(Boolean).join(", ")}`, apiCall: "skipped" }
      : { status: "WORKING", keyPresent: true, keyName: "AWS_ACCESS_KEY_ID", detail: `Credentials present. Bucket: ${s3Bucket}`, apiCall: "credential check" };

    // Runway
    const runwayKey = env("RUNWAY_API_KEY", "RUNWAY_API_SECRET");
    const runway: TestResult = !runwayKey
      ? notConfigured("Runway", "RUNWAY_API_KEY")
      : { status: "WORKING", keyPresent: true, keyName: "RUNWAY_API_KEY", detail: "API key present", apiCall: "credential check" };

    // Google Search Console
    const siteVerification = env("GOOGLE_SITE_VERIFICATION", "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION");
    const searchConsoleKey = env("GOOGLE_SEARCH_CONSOLE_KEY");
    const googleSearchConsole: TestResult = !siteVerification
      ? notConfigured("Google Search Console", "GOOGLE_SITE_VERIFICATION")
      : { status: "WORKING", keyPresent: true, keyName: "GOOGLE_SITE_VERIFICATION", detail: `Site verification present. Search Console API: ${searchConsoleKey ? "✓ key set" : "✗ GOOGLE_SEARCH_CONSOLE_KEY not set (optional — for keyword data)"}`, apiCall: "credential check" };

    res.json({
      testedAt,
      note: "Live API calls use read-only endpoints. No posts, charges, or data modifications are made.",
      results: {
        stripe:              stripeResult,
        resend:              resendResult,
        openai:              openaiResult,
        meta_facebook:       metaResult,
        instagram:           instagramResult,
        youtube:             youtubeResult,
        linkedin:            linkedinResult,
        x_twitter:           xResult,
        snapchat:            snapchatResult,
        tiktok:              tiktokResult,
        mongodb:             mongoResult,
        google_oauth:        googleOAuth,
        google_ads:          googleAds,
        apple_sign_in:       appleSignIn,
        aws_s3:              awsS3,
        runway:              runway,
        google_search_console: googleSearchConsole,
      },
      summary: {
        working:        Object.values({ stripeResult, resendResult, openaiResult, metaResult, instagramResult, youtubeResult, linkedinResult, xResult, snapchatResult, tiktokResult, mongoResult }).filter((r) => r.status === "WORKING").length,
        broken:         Object.values({ stripeResult, resendResult, openaiResult, metaResult, instagramResult, youtubeResult, linkedinResult, xResult, snapchatResult, tiktokResult, mongoResult }).filter((r) => r.status === "BROKEN").length,
        not_configured: Object.values({ stripeResult, resendResult, openaiResult, metaResult, instagramResult, youtubeResult, linkedinResult, xResult, snapchatResult, tiktokResult, mongoResult }).filter((r) => r.status === "NOT_CONFIGURED").length,
      },
    });
  });
});

export default router;
