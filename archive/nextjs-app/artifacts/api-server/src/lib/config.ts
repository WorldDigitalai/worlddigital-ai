/**
 * Centralized environment configuration loader.
 * Validates all required variables on startup.
 * Never logs actual secret values — only names.
 */

interface ServiceConfig {
  [key: string]: string | undefined;
}

function loadEnv(key: string): string | undefined {
  return process.env[key];
}

function require(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

// ── Core Server ─────────────────────────────────────────────────────────────
export const serverConfig = {
  port: process.env["PORT"] || "8000",
  nodeEnv: process.env["NODE_ENV"] || "development",
  corsOrigin: process.env["CORS_ORIGIN"] || "*",
  clientUrl: process.env["CLIENT_URL"] || "http://localhost:3000",
  frontendUrl: process.env["FRONTEND_URL"] || "http://localhost:3000",
} as const;

// ── Auth / JWT ───────────────────────────────────────────────────────────────
export const authConfig = {
  sessionSecret: loadEnv("SESSION_SECRET"),
  accessTokenSecret: loadEnv("ACCESS_TOKEN_SECRET"),
  accessTokenExpiry: loadEnv("ACCESS_TOKEN_EXPIRY") || "7d",
} as const;

// ── MongoDB ──────────────────────────────────────────────────────────────────
export const mongoConfig = {
  uri: loadEnv("MONGODB_URI"),
} as const;

// ── Stripe ───────────────────────────────────────────────────────────────────
export const stripeConfig = {
  secretKey: loadEnv("STRIPE_SECRET_KEY"),
  webhookSecret: loadEnv("STRIPE_WEBHOOK_SECRET"),
  prices: {
    metaMonthly: loadEnv("PRICE_META_MONTHLY"),
    metaYearly: loadEnv("PRICE_META_YEARLY"),
    googleMonthly: loadEnv("PRICE_GOOGLE_MONTHLY"),
    googleYearly: loadEnv("PRICE_GOOGLE_YEARLY"),
    metaGoogleMonthly: loadEnv("PRICE_META_GOOGLE_MONTHLY"),
    metaGoogleYearly: loadEnv("PRICE_META_GOOGLE_YEARLY"),
    snapchatMonthly: loadEnv("PRICE_SNAPCHAT_MONTHLY"),
    snapchatYearly: loadEnv("PRICE_SNAPCHAT_YEARLY"),
    allMonthly: loadEnv("PRICE_META_GOOGLE_SNAPCHAT_MONTHLY"),
    allYearly: loadEnv("PRICE_META_GOOGLE_SNAPCHAT_YEARLY"),
  },
} as const;

// ── AI (shared key — used by all AI features) ────────────────────────────────
export const openaiConfig = {
  apiKey: loadEnv("CHAT_BOT"),
} as const;

// ── AWS S3 ───────────────────────────────────────────────────────────────────
export const awsConfig = {
  accessKeyId: loadEnv("AWS_ACCESS_KEY_ID"),
  secretAccessKey: loadEnv("AWS_SECRET_ACCESS_KEY"),
  region: loadEnv("AWS_REGION") || "us-east-1",
  bucketName: loadEnv("S3_BUCKET_NAME"),
} as const;

// ── SendGrid ─────────────────────────────────────────────────────────────────
export const sendgridConfig = {
  apiKey: loadEnv("SENDGRID_API_KEY"),
  from: loadEnv("EMAIL_FROM"),
  senderName: loadEnv("EMAIL_SENDER_NAME"),
  templates: {
    signup: loadEnv("SENDGRID_TEMPLATE_SIGNUP_ID"),
    forgotPassword: loadEnv("SENDGRID_TEMPLATE_FORGOT_PASS_ID"),
    subscriptionCreated: loadEnv("SENDGRID_TEMPLATE_CREATE_ID"),
    subscriptionPaused: loadEnv("SENDGRID_TEMPLATE_PAUSE_ID"),
    subscriptionResumed: loadEnv("SENDGRID_TEMPLATE_RESUME_ID"),
    subscriptionWillEnd: loadEnv("SENDGRID_TEMPLATE_WILLEND_ID"),
    stripeInvoice: loadEnv("SENDGRID_TEMPLATE_STRIPE_INVOICE_ID"),
    careerReceived: loadEnv("SENDGRID_TEMPLATE_CAREER_APPLICATION_ID"),
    careerConfirmation: loadEnv("SENDGRID_TEMPLATE_CAREER_CONFIRMATION_ID"),
  },
} as const;

// ── reCAPTCHA ────────────────────────────────────────────────────────────────
export const recaptchaConfig = {
  secretKey: loadEnv("RECAPTCHA_SECRET_KEY"),
} as const;

// ── Google Maps ──────────────────────────────────────────────────────────────
export const gmapsConfig = {
  apiKey: loadEnv("NEXT_PUBLIC_GMAPS_KEY"),
} as const;

// ── Meta / Facebook Ads ──────────────────────────────────────────────────────
export const metaConfig = {
  accessToken: loadEnv("FB_ACCESS_TOKEN"),
  adAccountId: loadEnv("FB_AD_ACCOUNT_ID"),
  pageId: loadEnv("FB_PAGE_ID"),
  apiVersion: loadEnv("META_API_VERSION") || "v19.0",
  instagramActorId: loadEnv("INSTAGRAM_ACTOR_ID"),
} as const;

// ── Google Ads ───────────────────────────────────────────────────────────────
export const googleAdsConfig = {
  clientId: loadEnv("GOOGLE_CLIENT_ID"),
  clientSecret: loadEnv("GOOGLE_CLIENT_SECRET"),
  developerToken: loadEnv("GOOGLE_DEVELOPER_TOKEN"),
  redirectUri: loadEnv("GOOGLE_REDIRECT_URI"),
  mccCustomerId: loadEnv("MCC_CUSTOMER_ID"),
  clientCustomerId: loadEnv("CLIENT_CUSTOMER_ID"),
  mccRefreshToken: loadEnv("MCC_REFRESH_TOKEN"),
} as const;

// ── Snapchat Ads ─────────────────────────────────────────────────────────────
export const snapConfig = {
  adAccountId: loadEnv("SNAP_AD_ACCOUNT_ID"),
  clientId: loadEnv("SNAP_CLIENT_ID"),
  clientSecret: loadEnv("SNAP_CLIENT_SECRET"),
  redirectUri: loadEnv("SNAP_REDIRECT_URI"),
  accessToken: loadEnv("SNAP_ACCESS_TOKEN"),
  refreshToken: loadEnv("SNAP_REFRESH_TOKEN"),
} as const;

// ── Startup Validation ───────────────────────────────────────────────────────

const REQUIRED_VARS = [
  "ACCESS_TOKEN_SECRET",
  "MONGODB_URI",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CHAT_BOT",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "S3_BUCKET_NAME",
  "RESEND_API_KEY",
  "RECAPTCHA_SECRET_KEY",
];

export function validateConfig(): { missing: string[]; configured: string[] } {
  const missing: string[] = [];
  const configured: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    } else {
      configured.push(key);
    }
  }

  return { missing, configured };
}

export function getConfigSummary(): Record<string, "configured" | "missing"> {
  const summary: Record<string, "configured" | "missing"> = {};

  const allTrackedVars = [
    // Auth
    "SESSION_SECRET", "ACCESS_TOKEN_SECRET", "ACCESS_TOKEN_EXPIRY",
    // MongoDB
    "MONGODB_URI",
    // Stripe
    "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
    "PRICE_META_MONTHLY", "PRICE_META_YEARLY",
    "PRICE_GOOGLE_MONTHLY", "PRICE_GOOGLE_YEARLY",
    "PRICE_META_GOOGLE_MONTHLY", "PRICE_META_GOOGLE_YEARLY",
    "PRICE_SNAPCHAT_MONTHLY", "PRICE_SNAPCHAT_YEARLY",
    "PRICE_META_GOOGLE_SNAPCHAT_MONTHLY", "PRICE_META_GOOGLE_SNAPCHAT_YEARLY",
    // AI (CHAT_BOT key — all features)
    "CHAT_BOT",
    // AWS S3
    "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_BUCKET_NAME",
    // SendGrid
    "SENDGRID_API_KEY", "EMAIL_FROM", "EMAIL_SENDER_NAME",
    "SENDGRID_TEMPLATE_SIGNUP_ID", "SENDGRID_TEMPLATE_FORGOT_PASS_ID",
    "SENDGRID_TEMPLATE_CREATE_ID", "SENDGRID_TEMPLATE_PAUSE_ID",
    "SENDGRID_TEMPLATE_RESUME_ID", "SENDGRID_TEMPLATE_WILLEND_ID",
    "SENDGRID_TEMPLATE_STRIPE_INVOICE_ID",
    "SENDGRID_TEMPLATE_CAREER_APPLICATION_ID", "SENDGRID_TEMPLATE_CAREER_CONFIRMATION_ID",
    // reCAPTCHA
    "RECAPTCHA_SECRET_KEY",
    // Meta Ads
    "FB_ACCESS_TOKEN", "FB_AD_ACCOUNT_ID", "FB_PAGE_ID", "META_API_VERSION", "INSTAGRAM_ACTOR_ID",
    // Google Ads
    "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_DEVELOPER_TOKEN",
    "GOOGLE_REDIRECT_URI", "MCC_CUSTOMER_ID", "CLIENT_CUSTOMER_ID", "MCC_REFRESH_TOKEN",
    // Snapchat Ads
    "SNAP_AD_ACCOUNT_ID", "SNAP_CLIENT_ID", "SNAP_CLIENT_SECRET",
    "SNAP_REDIRECT_URI", "SNAP_ACCESS_TOKEN", "SNAP_REFRESH_TOKEN",
    // CORS / Server
    "CORS_ORIGIN", "CLIENT_URL", "FRONTEND_URL",
  ];

  for (const key of allTrackedVars) {
    summary[key] = process.env[key] ? "configured" : "missing";
  }

  return summary;
}
