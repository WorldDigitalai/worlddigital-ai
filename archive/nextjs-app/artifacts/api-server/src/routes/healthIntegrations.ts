import { Router, type IRouter, type Request, type Response } from "express";
import { pingMongo } from "../lib/mongo.js";
import { pingOpenAI } from "../lib/openai.js";
import { pingStripe } from "../lib/stripe.js";
import { pingS3 } from "../lib/s3.js";
import { requireAdminApiKey } from "../middlewares/auth.js";
import { checkMetaConnection } from "../services/ads/meta.js";
import { checkGoogleAdsConnection } from "../services/ads/google.js";
import { checkSnapchatConnection } from "../services/ads/snapchat.js";
import { getConfigSummary } from "../lib/config.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

type IntegrationStatus = "configured" | "missing" | "reachable" | "failed";

interface IntegrationCheck {
  name: string;
  status: IntegrationStatus;
  message?: string;
}

interface SecretResult {
  name: string;
  service: string;
  exists: boolean;
  format_valid: boolean;
  live_test: "pass" | "fail" | "skipped" | "untestable";
  error: string | null;
  fix?: string;
}

// ── Helper: token auth for /health/secrets ────────────────────────────────────

function requireHealthToken(req: Request, res: Response): boolean {
  const token = process.env["ADMIN_HEALTH_TOKEN"];
  const provided = (req.query["token"] as string | undefined)?.trim();
  if (!token) {
    res.status(503).json({ error: "ADMIN_HEALTH_TOKEN is not set. Add it as a Replit Secret." });
    return false;
  }
  if (!provided || provided !== token) {
    res.status(403).json({ error: "Invalid or missing ?token= query parameter." });
    return false;
  }
  return true;
}

// ── Individual service testers ────────────────────────────────────────────────

async function testChatBot(): Promise<SecretResult> {
  const name = "CHAT_BOT";
  const key = process.env[name];
  if (!key) return { name, service: "OpenAI (chatbot key)", exists: false, format_valid: false, live_test: "skipped", error: null, fix: "Add CHAT_BOT secret with an OpenAI API key starting with sk-" };
  const valid = key.startsWith("sk-");
  if (!valid) return { name, service: "OpenAI (chatbot key)", exists: true, format_valid: false, live_test: "fail", error: "Key does not start with 'sk-'", fix: "Check the CHAT_BOT secret — it should start with sk-" };
  try {
    const resp = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    const body = await resp.json() as { error?: { message?: string } };
    if (resp.ok) return { name, service: "OpenAI (chatbot key)", exists: true, format_valid: true, live_test: "pass", error: null };
    return { name, service: "OpenAI (chatbot key)", exists: true, format_valid: true, live_test: "fail", error: body?.error?.message ?? `HTTP ${resp.status}`, fix: "The CHAT_BOT key may be invalid or revoked — regenerate it at platform.openai.com" };
  } catch (e) {
    return { name, service: "OpenAI (chatbot key)", exists: true, format_valid: true, live_test: "fail", error: e instanceof Error ? e.message : "Network error" };
  }
}

async function testOpenAI(): Promise<SecretResult> {
  // OPENAI_API_KEY is no longer used — all AI features now use CHAT_BOT.
  // This entry is kept for health-report completeness.
  return {
    name: "OPENAI_API_KEY",
    service: "OpenAI (legacy — not required)",
    exists: !!process.env["OPENAI_API_KEY"],
    format_valid: true,
    live_test: "skipped",
    error: null,
    fix: "This key is no longer required. All AI features now use CHAT_BOT.",
  };
}

async function testMongoDB(): Promise<SecretResult> {
  const name = "MONGODB_URI";
  const uri = process.env[name];
  if (!uri) return { name, service: "MongoDB", exists: false, format_valid: false, live_test: "skipped", error: null, fix: "Add a valid MONGODB_URI starting with mongodb:// or mongodb+srv://" };
  const valid = uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
  if (!valid) return { name, service: "MongoDB", exists: true, format_valid: false, live_test: "fail", error: "URI must start with mongodb:// or mongodb+srv://", fix: "Fix the MONGODB_URI secret — current value has an incorrect scheme" };
  const ok = await pingMongo();
  return { name, service: "MongoDB", exists: true, format_valid: true, live_test: ok ? "pass" : "fail", error: ok ? null : "Connection refused or credentials invalid", fix: ok ? undefined : "Check your MongoDB Atlas cluster IP allowlist and credentials" };
}

async function testStripeSecret(): Promise<SecretResult> {
  const name = "STRIPE_SECRET_KEY";
  const key = process.env[name];
  if (!key) return { name, service: "Stripe", exists: false, format_valid: false, live_test: "skipped", error: null, fix: "Add STRIPE_SECRET_KEY from your Stripe dashboard" };
  const valid = key.startsWith("sk_live_") || key.startsWith("sk_test_");
  if (!valid) return { name, service: "Stripe", exists: true, format_valid: false, live_test: "fail", error: "Key must start with sk_live_ or sk_test_", fix: "Get the correct key from stripe.com/dashboard" };
  const ok = await pingStripe();
  return { name, service: "Stripe", exists: true, format_valid: true, live_test: ok ? "pass" : "fail", error: ok ? null : "Stripe account call failed", fix: ok ? undefined : "Verify the STRIPE_SECRET_KEY is active and not restricted" };
}

function testStripeWebhook(): SecretResult {
  const name = "STRIPE_WEBHOOK_SECRET";
  const key = process.env[name];
  if (!key) return { name, service: "Stripe Webhook", exists: false, format_valid: false, live_test: "untestable", error: null, fix: "Add STRIPE_WEBHOOK_SECRET from your Stripe webhook endpoint settings" };
  const valid = key.startsWith("whsec_");
  return { name, service: "Stripe Webhook", exists: true, format_valid: valid, live_test: "untestable", error: valid ? null : "Expected to start with whsec_", fix: valid ? undefined : "Copy the signing secret from your Stripe webhook endpoint" };
}

async function testSendGrid(): Promise<SecretResult> {
  const name = "SENDGRID_API_KEY";
  const key = process.env[name];
  if (!key) return { name, service: "SendGrid", exists: false, format_valid: false, live_test: "skipped", error: null, fix: "Add SENDGRID_API_KEY from app.sendgrid.com" };
  const valid = key.startsWith("SG.");
  if (!valid) return { name, service: "SendGrid", exists: true, format_valid: false, live_test: "fail", error: "Key must start with SG.", fix: "Get a valid SendGrid API key from app.sendgrid.com/settings/api_keys" };
  try {
    const resp = await fetch("https://api.sendgrid.com/v3/user/account", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    const body = await resp.json() as { errors?: { message: string }[] };
    if (resp.ok) return { name, service: "SendGrid", exists: true, format_valid: true, live_test: "pass", error: null };
    const msg = body?.errors?.[0]?.message ?? `HTTP ${resp.status}`;
    return { name, service: "SendGrid", exists: true, format_valid: true, live_test: "fail", error: msg, fix: "The SendGrid key may be revoked or restricted — regenerate it" };
  } catch (e) {
    return { name, service: "SendGrid", exists: true, format_valid: true, live_test: "fail", error: e instanceof Error ? e.message : "Network error" };
  }
}

function testEmailFrom(): SecretResult {
  const name = "EMAIL_FROM";
  const v = process.env[name];
  if (!v) return { name, service: "SendGrid (sender)", exists: false, format_valid: false, live_test: "untestable", error: null, fix: "Set EMAIL_FROM to your verified SendGrid sender email address" };
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return { name, service: "SendGrid (sender)", exists: true, format_valid: valid, live_test: "untestable", error: valid ? null : "Does not look like a valid email address", fix: valid ? undefined : "Set EMAIL_FROM to a valid verified email, e.g. hello@yourcompany.com" };
}

async function testAWS(): Promise<SecretResult[]> {
  const keyId = process.env["AWS_ACCESS_KEY_ID"];
  const secret = process.env["AWS_SECRET_ACCESS_KEY"];
  const bucket = process.env["S3_BUCKET_NAME"];

  const results: SecretResult[] = [
    {
      name: "AWS_ACCESS_KEY_ID",
      service: "AWS",
      exists: !!keyId,
      format_valid: !!keyId && /^[A-Z0-9]{20}$/.test(keyId),
      live_test: "untestable",
      error: keyId ? (/^[A-Z0-9]{20}$/.test(keyId) ? null : "Should be 20 uppercase alphanumeric chars") : null,
      fix: keyId ? undefined : "Add AWS_ACCESS_KEY_ID from your AWS IAM console",
    },
    {
      name: "AWS_SECRET_ACCESS_KEY",
      service: "AWS",
      exists: !!secret,
      format_valid: !!secret && secret.length >= 32,
      live_test: "untestable",
      error: secret ? (secret.length >= 32 ? null : "Suspiciously short — may be truncated") : null,
      fix: secret ? undefined : "Add AWS_SECRET_ACCESS_KEY from your AWS IAM console",
    },
    {
      name: "S3_BUCKET_NAME",
      service: "AWS S3",
      exists: !!bucket,
      format_valid: !!bucket,
      live_test: "skipped",
      error: null,
      fix: bucket ? undefined : "Add your S3 bucket name",
    },
  ];

  if (keyId && secret && bucket) {
    const ok = await pingS3();
    results[2]!.live_test = ok ? "pass" : "fail";
    if (!ok) {
      results[2]!.error = "Could not reach S3 bucket — check IAM permissions and bucket name";
      results[2]!.fix = "Ensure the IAM user has s3:GetObject/PutObject on the bucket";
    }
  }

  return results;
}

async function testMeta(): Promise<SecretResult[]> {
  const token = process.env["FB_ACCESS_TOKEN"];
  const adAccount = process.env["FB_AD_ACCOUNT_ID"];
  const pageId = process.env["FB_PAGE_ID"];

  const baseResults: SecretResult[] = [
    { name: "FB_ACCESS_TOKEN", service: "Meta/Facebook Ads", exists: !!token, format_valid: !!token, live_test: "skipped", error: null, fix: token ? undefined : "Add FB_ACCESS_TOKEN from Meta Business Manager" },
    { name: "FB_AD_ACCOUNT_ID", service: "Meta/Facebook Ads", exists: !!adAccount, format_valid: !!adAccount && /^act_\d+$/.test(adAccount), live_test: "untestable", error: adAccount ? (/^act_\d+$/.test(adAccount) ? null : "Should start with act_ followed by digits") : null, fix: adAccount ? undefined : "Add FB_AD_ACCOUNT_ID (format: act_123456789)" },
    { name: "FB_PAGE_ID", service: "Meta/Facebook Ads", exists: !!pageId, format_valid: !!pageId, live_test: "untestable", error: null, fix: pageId ? undefined : "Add FB_PAGE_ID from your Facebook page settings" },
    { name: "INSTAGRAM_ACTOR_ID", service: "Instagram Ads", exists: !!process.env["INSTAGRAM_ACTOR_ID"], format_valid: !!process.env["INSTAGRAM_ACTOR_ID"], live_test: "untestable", error: null },
  ];

  if (token) {
    try {
      const conn = await checkMetaConnection();
      baseResults[0]!.live_test = conn.status === "reachable" ? "pass" : "fail";
      baseResults[0]!.error = conn.status === "reachable" ? null : (conn.message ?? "Meta API call failed");
      if (conn.status !== "reachable") {
        baseResults[0]!.fix = "Token may be expired. Regenerate at developers.facebook.com/tools/explorer";
      }
    } catch (e) {
      baseResults[0]!.live_test = "fail";
      baseResults[0]!.error = e instanceof Error ? e.message : "Meta check failed";
    }
  }

  return baseResults;
}

async function testGoogle(): Promise<SecretResult[]> {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  const devToken = process.env["GOOGLE_DEVELOPER_TOKEN"];
  const mccRefreshToken = process.env["MCC_REFRESH_TOKEN"];
  const mccCustomerId = process.env["MCC_CUSTOMER_ID"];

  const results: SecretResult[] = [
    { name: "GOOGLE_CLIENT_ID", service: "Google Ads", exists: !!clientId, format_valid: !!clientId && clientId.endsWith(".apps.googleusercontent.com"), live_test: "untestable", error: clientId ? (clientId.endsWith(".apps.googleusercontent.com") ? null : "Should end with .apps.googleusercontent.com") : null, fix: clientId ? undefined : "Add from Google Cloud Console → Credentials" },
    { name: "GOOGLE_CLIENT_SECRET", service: "Google Ads", exists: !!clientSecret, format_valid: !!clientSecret, live_test: "untestable", error: null, fix: clientSecret ? undefined : "Add from Google Cloud Console → Credentials" },
    { name: "GOOGLE_DEVELOPER_TOKEN", service: "Google Ads", exists: !!devToken, format_valid: !!devToken, live_test: "untestable", error: null, fix: devToken ? undefined : "Apply for a developer token at ads.google.com/home/tools/manager-accounts/" },
    { name: "MCC_CUSTOMER_ID", service: "Google Ads", exists: !!mccCustomerId, format_valid: !!mccCustomerId, live_test: "untestable", error: null, fix: mccCustomerId ? undefined : "Add your Google Ads Manager Account customer ID (digits only)" },
    { name: "MCC_REFRESH_TOKEN", service: "Google Ads", exists: !!mccRefreshToken, format_valid: !!mccRefreshToken, live_test: "skipped", error: null, fix: mccRefreshToken ? undefined : "Run the OAuth2 flow to get a refresh token for the MCC account" },
  ];

  if (clientId && clientSecret && devToken && mccRefreshToken && mccCustomerId) {
    try {
      const conn = await checkGoogleAdsConnection();
      const isOk = conn.status === "reachable";
      results[4]!.live_test = isOk ? "pass" : "fail";
      results[4]!.error = isOk ? null : (conn.message ?? "Google Ads API call failed");
      if (!isOk) results[4]!.fix = "Refresh token may be expired — re-run the OAuth flow";
    } catch (e) {
      results[4]!.live_test = "fail";
      results[4]!.error = e instanceof Error ? e.message : "Google check failed";
    }
  }

  return results;
}

async function testSnapchat(): Promise<SecretResult[]> {
  const clientId = process.env["SNAP_CLIENT_ID"];
  const clientSecret = process.env["SNAP_CLIENT_SECRET"];
  const accessToken = process.env["SNAP_ACCESS_TOKEN"];
  const adAccount = process.env["SNAP_AD_ACCOUNT_ID"];

  const results: SecretResult[] = [
    { name: "SNAP_CLIENT_ID", service: "Snapchat Ads", exists: !!clientId, format_valid: !!clientId, live_test: "untestable", error: null, fix: clientId ? undefined : "Add from Snapchat Business Manager → App settings" },
    { name: "SNAP_CLIENT_SECRET", service: "Snapchat Ads", exists: !!clientSecret, format_valid: !!clientSecret, live_test: "untestable", error: null, fix: clientSecret ? undefined : "Add from Snapchat Business Manager → App settings" },
    { name: "SNAP_ACCESS_TOKEN", service: "Snapchat Ads", exists: !!accessToken, format_valid: !!accessToken, live_test: "skipped", error: null, fix: accessToken ? undefined : "Complete the Snapchat OAuth flow to get an access token" },
    { name: "SNAP_REFRESH_TOKEN", service: "Snapchat Ads", exists: !!process.env["SNAP_REFRESH_TOKEN"], format_valid: !!process.env["SNAP_REFRESH_TOKEN"], live_test: "untestable", error: null, fix: process.env["SNAP_REFRESH_TOKEN"] ? undefined : "Complete the Snapchat OAuth flow to get a refresh token" },
    { name: "SNAP_AD_ACCOUNT_ID", service: "Snapchat Ads", exists: !!adAccount, format_valid: !!adAccount, live_test: "untestable", error: null, fix: adAccount ? undefined : "Add your Snapchat ad account ID from Business Manager" },
    { name: "SNAP_REDIRECT_URI", service: "Snapchat Ads", exists: !!process.env["SNAP_REDIRECT_URI"], format_valid: !!process.env["SNAP_REDIRECT_URI"], live_test: "untestable", error: null },
  ];

  if (accessToken) {
    try {
      const conn = await checkSnapchatConnection();
      const isOk = conn.status === "reachable";
      results[2]!.live_test = isOk ? "pass" : "fail";
      results[2]!.error = isOk ? null : (conn.message ?? "Snapchat API call failed");
      if (!isOk) results[2]!.fix = "Access token may be expired — re-run the OAuth flow";
    } catch (e) {
      results[2]!.live_test = "fail";
      results[2]!.error = e instanceof Error ? e.message : "Snapchat check failed";
    }
  }

  return results;
}

function testSessionAuth(): SecretResult[] {
  const checks: Array<[string, string, string]> = [
    ["SESSION_SECRET", "Session", "Add a long random string as SESSION_SECRET"],
    ["ACCESS_TOKEN_SECRET", "JWT Auth", "Add a long random string as ACCESS_TOKEN_SECRET"],
    ["ACCESS_TOKEN_EXPIRY", "JWT Auth", "Set to e.g. 7d"],
    ["FRONTEND_URL", "CORS / Redirects", "Set to your production domain e.g. https://worlddigital.ai"],
    ["CLIENT_URL", "CORS / Redirects", "Usually same as FRONTEND_URL"],
    ["CORS_ORIGIN", "CORS", "Comma-separated allowed origins, or * for all"],
  ];

  return checks.map(([name, service, fix]) => {
    const v = process.env[name];
    const exists = !!v;
    const formatOk = exists && (name.endsWith("_SECRET") ? v!.length >= 16 : true);
    return {
      name: name!,
      service: service!,
      exists,
      format_valid: formatOk,
      live_test: "untestable" as const,
      error: !exists ? null : (!formatOk ? "Value present but too short (min 16 chars for secrets)" : null),
      fix: !exists ? fix : undefined,
    };
  });
}

function testRecaptcha(): SecretResult {
  const key = process.env["RECAPTCHA_SECRET_KEY"];
  return {
    name: "RECAPTCHA_SECRET_KEY",
    service: "Google reCAPTCHA",
    exists: !!key,
    format_valid: !!key && key.length > 10,
    live_test: "untestable",
    error: null,
    fix: key ? undefined : "Add from console.cloud.google.com/apis/credentials (reCAPTCHA section)",
  };
}

// ── SendGrid template IDs (format-only check) ─────────────────────────────────

function testSendGridTemplates(): SecretResult[] {
  const templates: Array<[string, string]> = [
    ["SENDGRID_TEMPLATE_SIGNUP_ID", "Welcome / signup email"],
    ["SENDGRID_TEMPLATE_FORGOT_PASS_ID", "Forgot password email"],
    ["SENDGRID_TEMPLATE_CREATE_ID", "Subscription created email"],
    ["SENDGRID_TEMPLATE_PAUSE_ID", "Subscription paused email"],
    ["SENDGRID_TEMPLATE_RESUME_ID", "Subscription resumed email"],
    ["SENDGRID_TEMPLATE_WILLEND_ID", "Subscription ending soon email"],
    ["SENDGRID_TEMPLATE_STRIPE_INVOICE_ID", "Stripe invoice email"],
    ["SENDGRID_TEMPLATE_CAREER_APPLICATION_ID", "Career application received"],
    ["SENDGRID_TEMPLATE_CAREER_CONFIRMATION_ID", "Career application confirmation"],
  ];

  return templates.map(([name, service]) => {
    const v = process.env[name];
    return {
      name: name!,
      service: `SendGrid template — ${service}`,
      exists: !!v,
      format_valid: !!v && v!.startsWith("d-"),
      live_test: "untestable" as const,
      error: v ? (v.startsWith("d-") ? null : "SendGrid template IDs should start with d-") : null,
      fix: v ? undefined : `Create this email template in SendGrid Dynamic Templates and paste its ID here`,
    };
  });
}

// ── OLD endpoint (kept for backward compatibility) ────────────────────────────

async function checkSendGridOld(): Promise<IntegrationCheck> {
  const key = process.env["SENDGRID_API_KEY"];
  const from = process.env["EMAIL_FROM"];
  if (!key || !from) return { name: "SendGrid", status: "missing" };
  try {
    const resp = await fetch("https://api.sendgrid.com/v3/user/account", {
      headers: { Authorization: `Bearer ${key}` },
    });
    return { name: "SendGrid", status: resp.ok ? "reachable" : "failed", message: resp.ok ? undefined : `HTTP ${resp.status}` };
  } catch {
    return { name: "SendGrid", status: "failed", message: "Network error" };
  }
}

function checkRecaptchaOld(): IntegrationCheck {
  return { name: "reCAPTCHA", status: process.env["RECAPTCHA_SECRET_KEY"] ? "configured" : "missing" };
}

function checkGoogleMapsOld(): IntegrationCheck {
  return { name: "Google Maps", status: process.env["NEXT_PUBLIC_GMAPS_KEY"] ? "configured" : "missing" };
}

router.get("/health/integrations", requireAdminApiKey, async (_req: Request, res: Response) => {
  logger.info("Health integrations check requested");

  const [mongoResult, openaiResult, stripeResult, s3Result, sendgridResult, metaResult, googleResult, snapResult] =
    await Promise.allSettled([
      pingMongo().then((ok): IntegrationCheck => ({ name: "MongoDB", status: ok ? "reachable" : (process.env["MONGODB_URI"] ? "failed" : "missing") })),
      pingOpenAI().then((ok): IntegrationCheck => ({ name: "AI (CHAT_BOT)", status: ok ? "reachable" : (process.env["CHAT_BOT"] ? "failed" : "missing") })),
      pingStripe().then((ok): IntegrationCheck => ({ name: "Stripe", status: ok ? "reachable" : (process.env["STRIPE_SECRET_KEY"] ? "failed" : "missing") })),
      pingS3().then((ok): IntegrationCheck => ({ name: "AWS S3", status: ok ? "reachable" : (process.env["S3_BUCKET_NAME"] ? "failed" : "missing") })),
      checkSendGridOld(),
      checkMetaConnection().then((r): IntegrationCheck => ({ name: "Meta / Facebook Ads", ...r })),
      checkGoogleAdsConnection().then((r): IntegrationCheck => ({ name: "Google Ads", ...r })),
      checkSnapchatConnection().then((r): IntegrationCheck => ({ name: "Snapchat Ads", ...r })),
    ]);

  const integrations: IntegrationCheck[] = [
    mongoResult.status === "fulfilled" ? mongoResult.value : { name: "MongoDB", status: "failed", message: "Check error" },
    openaiResult.status === "fulfilled" ? openaiResult.value : { name: "OpenAI", status: "failed", message: "Check error" },
    stripeResult.status === "fulfilled" ? stripeResult.value : { name: "Stripe", status: "failed", message: "Check error" },
    s3Result.status === "fulfilled" ? s3Result.value : { name: "AWS S3", status: "failed", message: "Check error" },
    sendgridResult.status === "fulfilled" ? sendgridResult.value : { name: "SendGrid", status: "failed", message: "Check error" },
    checkRecaptchaOld(),
    checkGoogleMapsOld(),
    metaResult.status === "fulfilled" ? metaResult.value : { name: "Meta / Facebook Ads", status: "failed", message: "Check error" },
    googleResult.status === "fulfilled" ? googleResult.value : { name: "Google Ads", status: "failed", message: "Check error" },
    snapResult.status === "fulfilled" ? snapResult.value : { name: "Snapchat Ads", status: "failed", message: "Check error" },
  ];

  res.json({ timestamp: new Date().toISOString(), summary: { total: integrations.length }, integrations, environmentVariables: getConfigSummary() });
});

// ── NEW comprehensive endpoint ─────────────────────────────────────────────────
// GET /api/health/secrets?token=YOUR_ADMIN_HEALTH_TOKEN

router.get("/health/secrets", async (req: Request, res: Response) => {
  if (!requireHealthToken(req, res)) return;

  logger.info("Full secrets health check requested");

  const [chatBotResult, openaiResult, mongoResult, stripeResult, sendgridResult, awsResults, metaResults, googleResults, snapchatResults] =
    await Promise.all([
      testChatBot(),
      testOpenAI(),
      testMongoDB(),
      testStripeSecret(),
      testSendGrid(),
      testAWS(),
      testMeta(),
      testGoogle(),
      testSnapchat(),
    ]);

  const results: SecretResult[] = [
    chatBotResult,
    openaiResult,
    mongoResult,
    stripeResult,
    testStripeWebhook(),
    sendgridResult,
    testEmailFrom(),
    ...awsResults,
    ...metaResults,
    ...googleResults,
    ...snapchatResults,
    testRecaptcha(),
    ...testSessionAuth(),
    ...testSendGridTemplates(),
  ];

  const passed = results.filter((r) => r.live_test === "pass").length;
  const failed = results.filter((r) => r.live_test === "fail" || (!r.exists && r.live_test !== "untestable")).length;
  const overall_status = failed === 0 ? "pass" : "fail";

  logger.info({ passed, failed, total: results.length }, "Secrets health check complete");

  res.json({
    overall_status,
    checked_at: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      skipped: results.filter((r) => r.live_test === "skipped").length,
      untestable: results.filter((r) => r.live_test === "untestable").length,
      missing: results.filter((r) => !r.exists).length,
    },
    results,
  });
});

export default router;
