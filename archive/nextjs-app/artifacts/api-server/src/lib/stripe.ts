import Stripe from "stripe";
import { logger } from "./logger.js";

function createClient(): Stripe | null {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-05-28.basil" });
}

export function getStripe(): Stripe {
  const stripe = createClient();
  if (!stripe) throw new Error("STRIPE_SECRET_KEY is not configured");
  return stripe;
}

/** Returns "test", "live", or "unknown" based on the key prefix. */
export function getStripeMode(): "test" | "live" | "unknown" | "not_set" {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return "not_set";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unknown";
}

export const PLAN_KEYS = [
  "meta-monthly", "meta-yearly",
  "google-monthly", "google-yearly",
  "meta-google-monthly", "meta-google-yearly",
  "snapchat-monthly", "snapchat-yearly",
  "all-monthly", "all-yearly",
  "auto-seo-monthly", "auto-seo-yearly",
] as const;

export type PlanKey = typeof PLAN_KEYS[number];

export const priceEnvMap: Record<PlanKey, string> = {
  "meta-monthly":        "PRICE_META_MONTHLY",
  "meta-yearly":         "PRICE_META_YEARLY",
  "google-monthly":      "PRICE_GOOGLE_MONTHLY",
  "google-yearly":       "PRICE_GOOGLE_YEARLY",
  "meta-google-monthly": "PRICE_META_GOOGLE_MONTHLY",
  "meta-google-yearly":  "PRICE_META_GOOGLE_YEARLY",
  "snapchat-monthly":    "PRICE_SNAPCHAT_MONTHLY",
  "snapchat-yearly":     "PRICE_SNAPCHAT_YEARLY",
  "all-monthly":         "PRICE_META_GOOGLE_SNAPCHAT_MONTHLY",
  "all-yearly":          "PRICE_META_GOOGLE_SNAPCHAT_YEARLY",
  "auto-seo-monthly":    "PRICE_AUTO_SEO_MONTHLY",
  "auto-seo-yearly":     "PRICE_AUTO_SEO_YEARLY",
};

export function getPriceId(plan: PlanKey): string {
  const envKey = priceEnvMap[plan];
  const priceId = process.env[envKey];
  if (!priceId) throw new Error(`Price ID for plan "${plan}" (${envKey}) is not configured`);
  return priceId;
}

export async function createCheckoutSession(opts: {
  userId: string;
  email: string;
  plan: PlanKey;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const priceId = getPriceId(opts.plan);
  const mode = getStripeMode();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: opts.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      metadata: { userId: opts.userId, plan: opts.plan },
    });

    logger.info({ userId: opts.userId, plan: opts.plan, priceId, stripeMode: mode }, "Stripe checkout session created");
    return session;
  } catch (err: unknown) {
    // Log safe diagnostic info — never log the secret key itself
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({
      plan: opts.plan,
      priceId,
      stripeMode: mode,
      envKey: priceEnvMap[opts.plan],
      stripeError: errorMessage,
    }, "Stripe checkout session creation failed");
    throw err;
  }
}

export async function createCustomCheckoutSession(opts: {
  userId: string;
  email: string;
  services: Array<{ id: string; name: string; price: number; quantity?: number }>;
  successUrl: string;
  cancelUrl: string;
  plan?: string;
  billingInterval?: "month" | "year";
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const mode = getStripeMode();
  const interval: "month" | "year" = opts.billingInterval ?? "month";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = opts.services.map((s) => ({
    price_data: {
      currency: "usd",
      unit_amount: Math.round(s.price * 100),
      recurring: { interval },
      product_data: {
        name: s.name,
        description: `WorldDigital.ai — ${s.name}`,
      },
    },
    quantity: Math.max(1, Math.min(10, s.quantity ?? 1)),
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: opts.email,
      line_items: lineItems,
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      metadata: {
        userId: opts.userId,
        ...(opts.plan ? { plan: opts.plan } : {}),
        services: opts.services.map((s) => s.id).join(","),
      },
    });

    logger.info(
      { userId: opts.userId, services: opts.services.map((s) => s.id), stripeMode: mode },
      "Custom Stripe checkout session created"
    );
    return session;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ stripeMode: mode, stripeError: errorMessage }, "Custom checkout session creation failed");
    throw err;
  }
}

export async function createBillingPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
}

export function constructWebhookEvent(payload: Buffer, sig: string): Stripe.Event {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return getStripe().webhooks.constructEvent(payload, sig, secret);
}

export async function pingStripe(): Promise<boolean> {
  try {
    const stripe = createClient();
    if (!stripe) return false;
    await stripe.balance.retrieve();
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks every configured price ID against Stripe and returns a safe
 * diagnostic object for the /v1/stripe/debug endpoint.
 */
export async function auditPrices(): Promise<{
  stripe_mode: string;
  prices_checked: Array<{
    secret_name: string;
    price_id: string | null;
    exists_in_current_mode: boolean;
    active: boolean | null;
    amount: number | null;
    currency: string | null;
    error: string | null;
  }>;
}> {
  const stripe = createClient();
  const mode = getStripeMode();
  const results = [];

  for (const [plan, envKey] of Object.entries(priceEnvMap) as [PlanKey, string][]) {
    const priceId = process.env[envKey] || null;
    if (!priceId || !stripe) {
      results.push({
        secret_name: envKey,
        price_id: null,
        exists_in_current_mode: false,
        active: null,
        amount: null,
        currency: null,
        error: priceId ? "Stripe not configured" : "Secret not set",
      });
      continue;
    }

    // Mask the middle of the price ID so it's safe but identifiable
    const masked = priceId.length > 12
      ? priceId.slice(0, 8) + "****" + priceId.slice(-4)
      : priceId;

    try {
      const p = await stripe.prices.retrieve(priceId);
      results.push({
        secret_name: envKey,
        price_id: masked,
        exists_in_current_mode: true,
        active: p.active,
        amount: p.unit_amount,
        currency: p.currency,
        error: null,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Detect mode mismatch explicitly
      const isModeError = msg.includes("a similar object exists in");
      results.push({
        secret_name: envKey,
        price_id: masked,
        exists_in_current_mode: false,
        active: null,
        amount: null,
        currency: null,
        error: isModeError
          ? `Price exists in ${mode === "test" ? "live" : "test"} mode but key is ${mode} mode — mode mismatch`
          : msg,
      });
    }
  }

  return { stripe_mode: mode, prices_checked: results };
}
