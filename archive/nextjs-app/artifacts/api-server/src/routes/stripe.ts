import { Router, type IRouter, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import {
  createCheckoutSession,
  createCustomCheckoutSession,
  createBillingPortalSession,
  constructWebhookEvent,
  auditPrices,
  type PlanKey,
  PLAN_KEYS,
} from "../lib/stripe.js";
import { getCollection } from "../lib/mongo.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import {
  sendSubscriptionCreatedEmail,
  sendSubscriptionPausedEmail,
  sendSubscriptionResumedEmail,
  sendSubscriptionWillEndEmail,
  sendTokenPurchaseEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from "../lib/email.js";
import { logger } from "../lib/logger.js";
import { logWebhookEvent } from "../lib/activityLogger.js";
import { ensureUserCredits } from "../lib/credits.js";

const router: IRouter = Router();

// Always redirect to the live production domain — never to localhost or env vars.
const PROD_URL = "https://worlddigital.ai";

router.post("/v1/stripe/checkout", requireAuth, async (req: AuthRequest, res: Response) => {
  const { plan } = req.body ?? {};

  if (!plan || !PLAN_KEYS.includes(plan as PlanKey)) {
    res.status(400).json({ message: "Valid plan is required", validPlans: PLAN_KEYS });
    return;
  }

  const frontendUrl = PROD_URL;

  try {
    const session = await createCheckoutSession({
      userId: req.user!.userId,
      email: req.user!.email,
      plan: plan as PlanKey,
      successUrl: `${frontendUrl}/dashboard?subscription=success`,
      cancelUrl: `${frontendUrl}/subscribe?cancelled=1`,
    });

    res.json({ url: session.url });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("No such price") || errMsg.includes("does not exist")) {
      logger.error({ plan, errMsg }, "Stripe price mode mismatch — plan temporarily unavailable");
      res.status(503).json({ message: "This plan is temporarily unavailable. Please choose a different plan or contact support@worlddigital.ai to complete your subscription." });
    } else {
      res.status(500).json({ message: "Payment setup issue. Please contact support@worlddigital.ai." });
    }
  }
});

// ─── Stripe Debug Endpoint ────────────────────────────────────────────────────
router.get("/v1/stripe/debug", async (_req: Request, res: Response) => {
  try {
    const report = await auditPrices();
    res.json(report);
  } catch (err) {
    logger.error({ err }, "Stripe debug audit failed");
    res.status(500).json({ error: "Audit failed — check server logs" });
  }
});

const VALID_SERVICE_IDS = new Set([
  "google-ads", "meta-ads", "snapchat-ads", "tiktok-ads",
  "linkedin-ads", "x-ads", "auto-seo", "ai-content",
  "image-generator", "reels-generator",
]);

router.post("/v1/stripe/checkout-custom", requireAuth, async (req: AuthRequest, res: Response) => {
  const { services, plan, billingInterval } = req.body ?? {};

  if (!Array.isArray(services) || services.length === 0) {
    res.status(400).json({ message: "At least one service must be selected" });
    return;
  }

  for (const svc of services) {
    if (!svc.id || !svc.name || typeof svc.price !== "number" || svc.price <= 0) {
      res.status(400).json({ message: "Invalid service format" });
      return;
    }
    if (!VALID_SERVICE_IDS.has(svc.id)) {
      res.status(400).json({ message: `Unknown service: ${svc.id}` });
      return;
    }
  }

  const serviceIds: string[] = services.map((s: { id: string }) => s.id);
  const resolvedPlan: string | undefined =
    (typeof plan === "string" && plan.length > 0) ? plan
    : serviceIds.length === 1 && serviceIds[0] === "auto-seo"
      ? `auto-seo-${billingInterval === "year" ? "yearly" : "monthly"}`
      : undefined;

  const resolvedInterval: "month" | "year" =
    billingInterval === "year" ? "year" : "month";

  const frontendUrl = PROD_URL;

  try {
    const session = await createCustomCheckoutSession({
      userId: req.user!.userId,
      email: req.user!.email,
      services,
      successUrl: `${frontendUrl}/dashboard?subscription=success`,
      cancelUrl: `${frontendUrl}/subscribe?cancelled=1`,
      plan: resolvedPlan,
      billingInterval: resolvedInterval,
    });
    res.json({ url: session.url });
  } catch (err: unknown) {
    logger.error({ err }, "Custom checkout session creation failed");
    res.status(500).json({ message: "Payment setup issue. Please contact support." });
  }
});

router.post("/v1/stripe/portal", requireAuth, async (req: AuthRequest, res: Response) => {
  const frontendUrl = PROD_URL;

  try {
    const users = getCollection<{ _id: ObjectId; stripeCustomerId?: string }>("users");
    const user = await users.findOne({ _id: new ObjectId(req.user!.userId) });

    if (!user?.stripeCustomerId) {
      res.status(400).json({ message: "No billing account found. Please subscribe first." });
      return;
    }

    const session = await createBillingPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${frontendUrl}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Stripe portal error");
    res.status(500).json({ message: "Failed to open billing portal" });
  }
});

router.post(
  "/v1/stripe/webhook",
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const rawBody = req.body as Buffer;

    let event;
    try {
      event = constructWebhookEvent(rawBody, sig);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webhook error";
      logger.warn({ message }, "Stripe webhook signature verification failed");
      res.status(400).json({ message: "Webhook signature invalid" });
      return;
    }

    const users = getCollection<{
      _id: ObjectId;
      name?: string;
      email: string;
      stripeCustomerId?: string;
      subscriptionStatus?: string;
      subscriptionPlan?: string;
    }>("users");

    await logWebhookEvent("stripe", event.type, "received", { eventId: event.id }).catch(() => {});

    const processedEvents = getCollection<{ eventId: string; processedAt: Date }>("processedWebhookEvents");
    const alreadySeen = await processedEvents.findOneAndUpdate(
      { eventId: event.id },
      { $setOnInsert: { eventId: event.id, processedAt: new Date() } },
      { upsert: true, returnDocument: "before" }
    );
    if (alreadySeen) {
      logger.info({ eventId: event.id, eventType: event.type }, "Duplicate Stripe webhook skipped");
      res.json({ received: true });
      return;
    }

    const userSubs = getCollection<Record<string, unknown>>("userSubscriptions");
    const invoicesCol = getCollection<Record<string, unknown>>("subscriptionInvoices");

    try {
      switch (event.type) {

        case "checkout.session.completed": {
          const session = event.data.object as {
            customer?: string;
            subscription?: string;
            metadata?: { userId?: string; plan?: string; type?: string; tool?: string; credits?: string; tokens?: string; dollars?: string; tierLabel?: string };
            amount_total?: number;
          };
          const userId = session.metadata?.userId;
          const plan   = session.metadata?.plan;
          const customerId = session.customer as string | undefined;

          if (session.metadata?.type === "token-purchase" && userId) {
            const tokens  = Number(session.metadata.tokens  || "0");
            const dollars = Number(session.metadata.dollars || "0");
            const tierLabel = session.metadata.tierLabel || "";
            if (tokens > 0) {
              const { addTokens, getBalance } = await import("../services/tokenService.js");
              const balanceBefore = await getBalance(userId);
              const { balance } = await addTokens(userId, tokens, "token_purchase", `Purchased ${tokens} tokens ($${dollars})`, { dollars, tierLabel });
              const user = await users.findOne({ _id: new ObjectId(userId) });
              if (user) sendTokenPurchaseEmail(user.email, tokens, dollars, tierLabel).catch(() => {});
              await logWebhookEvent("stripe", event.type, "processed", {
                eventId: event.id, metadata: { userId, tokens, dollars, tierLabel, balanceBefore, balance },
              }).catch(() => {});
              logger.info({ userId, tokens, dollars, balanceBefore, balance }, "Token purchase credited after payment");
            }
            break;
          }

          if (session.metadata?.type === "tool-pack" && userId) {
            const tool    = session.metadata.tool;
            const credits = Number(session.metadata.credits || "0");
            if (tool && credits > 0) {
              const toolCol = getCollection<Record<string, unknown>>("toolCredits");
              await toolCol.updateOne(
                { userId, tool },
                {
                  $inc: { credits },
                  $setOnInsert: { used: 0, createdAt: new Date() } as Record<string, unknown>,
                },
                { upsert: true }
              );
              logger.info({ userId, tool, credits }, "Tool pack credits added after purchase");
              await logWebhookEvent("stripe", event.type, "tool-pack-credited", {
                eventId: event.id,
                metadata: { userId, tool, credits },
              }).catch(() => {});
            }
            break;
          }

          if (userId && customerId) {
            const planId = plan || "active";
            await users.updateOne(
              { _id: new ObjectId(userId) },
              {
                $set: {
                  stripeCustomerId: customerId,
                  subscriptionStatus: "active",
                  subscriptionPlan: planId,
                  ...(session.subscription ? { stripeSubscriptionId: session.subscription } : {}),
                  subscriptionActivatedAt: new Date(),
                },
              }
            );
            await ensureUserCredits(userId, planId).catch((e) => logger.warn({ e }, "Credit seed failed"));
            const { addTokens, SUBSCRIPTION_TOKENS, calculateSliderTokens } = await import("../services/tokenService.js");
            const subTokens = SUBSCRIPTION_TOKENS[planId] ?? 0;
            if (subTokens > 0) {
              await addTokens(userId, subTokens, "subscription_grant", `${planId} monthly token allocation`, { plan: planId }).catch(() => {});
            }

            const AD_PLANS_350 = new Set([
              "meta-monthly", "meta-yearly",
              "google-monthly", "google-yearly",
              "snapchat-monthly", "snapchat-yearly",
              "tiktok-monthly", "tiktok-yearly",
              "linkedin-monthly", "linkedin-yearly",
              "x-monthly", "x-yearly",
              "all-monthly", "all-yearly",
            ]);
            const isCustom350 = !plan && (session.amount_total ?? 0) >= 35000;
            if (AD_PLANS_350.has(planId) || isCustom350) {
              const bonusTokens = calculateSliderTokens(150);
              await addTokens(userId, bonusTokens, "promo_bonus", "$150 launch bonus — included with your plan", { plan: planId }).catch(() => {});
              logger.info({ userId, plan: planId, bonusTokens }, "$350-plan launch bonus granted");
            }

            if (session.subscription) {
              await userSubs.updateOne(
                { userId, stripeSubscriptionId: session.subscription },
                {
                  $set: {
                    userId,
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: session.subscription,
                    plan: planId,
                    status: "active",
                    startedAt: new Date(),
                    createdVia: "checkout",
                  },
                  $setOnInsert: { createdAt: new Date() },
                },
                { upsert: true }
              );
            }

            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (user) {
              const priceDollars = (session.amount_total ?? 0) / 100;
              const totalTokens  = subTokens + (AD_PLANS_350.has(planId) ? 6000 : 0);
              sendSubscriptionCreatedEmail(
                user.email,
                planId,
                totalTokens,
                priceDollars,
                session.subscription ?? undefined
              ).catch(() => {});
            }

            await logWebhookEvent("stripe", event.type, "processed", {
              eventId: event.id,
              metadata: { userId, plan: planId, amountTotal: session.amount_total },
            }).catch(() => {});
            logger.info({ userId, plan: planId }, "Subscription activated via checkout");
          } else {
            await logWebhookEvent("stripe", event.type, "ignored", {
              eventId: event.id,
              metadata: { reason: "no userId or customerId in metadata" },
            }).catch(() => {});
          }
          break;
        }

        case "customer.subscription.created": {
          const sub = event.data.object as {
            id?: string;
            customer?: string;
            status?: string;
            current_period_start?: number;
            current_period_end?: number;
            items?: { data?: Array<{ price?: { id?: string; nickname?: string } }> };
          };
          const customerId = sub.customer;
          const user = await users.findOne({ stripeCustomerId: customerId });
          if (!user) {
            logger.warn({ customerId, subId: sub.id }, "Subscription created but no matching user");
            break;
          }
          const priceId = sub.items?.data?.[0]?.price?.id;
          const planName = user.subscriptionPlan || priceId || "active";
          await userSubs.updateOne(
            { stripeSubscriptionId: sub.id },
            {
              $set: {
                userId: user._id.toString(),
                stripeCustomerId: customerId,
                stripeSubscriptionId: sub.id,
                plan: planName,
                status: sub.status || "active",
                currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : new Date(),
                currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
                startedAt: new Date(),
              },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
          );
          logger.info({ userId: user._id.toString(), subId: sub.id, plan: planName }, "Subscription tracked in userSubscriptions");
          await logWebhookEvent("stripe", event.type, "processed", {
            eventId: event.id,
            metadata: { userId: user._id.toString(), subId: sub.id, plan: planName },
          }).catch(() => {});
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object as {
            id?: string;
            customer?: string;
            status?: string;
            current_period_end?: number;
            items?: { data?: Array<{ price?: { id?: string; nickname?: string } }> };
          };
          const status = sub.status === "active" ? "active"
            : sub.status === "past_due" ? "paused"
            : sub.status === "canceled" ? "cancelled"
            : "active";

          const priceId   = sub.items?.data?.[0]?.price?.id;
          const priceName = sub.items?.data?.[0]?.price?.nickname;
          const periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : undefined;

          await users.updateOne(
            { stripeCustomerId: sub.customer },
            {
              $set: {
                subscriptionStatus: status,
                ...(priceId ? { stripePriceId: priceId } : {}),
                ...(priceName ? { subscriptionPlan: priceName } : {}),
                ...(periodEnd ? { subscriptionCurrentPeriodEnd: periodEnd } : {}),
              },
            }
          );

          if (sub.id) {
            await userSubs.updateOne(
              { stripeSubscriptionId: sub.id },
              {
                $set: {
                  status,
                  ...(priceId ? { stripePriceId: priceId } : {}),
                  ...(priceName ? { plan: priceName } : {}),
                  ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
                },
              }
            );
          }

          await logWebhookEvent("stripe", event.type, "processed", {
            eventId: event.id,
            metadata: { customer: sub.customer, status, priceId },
          }).catch(() => {});
          break;
        }

        case "invoice.paid": {
          const inv = event.data.object as {
            id?: string;
            customer?: string;
            subscription?: string;
            amount_paid?: number;
            hosted_invoice_url?: string;
            invoice_pdf?: string;
            period_start?: number;
            period_end?: number;
            billing_reason?: string;
          };
          const user = await users.findOne({ stripeCustomerId: inv.customer });
          if (user) {
            await users.updateOne(
              { stripeCustomerId: inv.customer },
              { $set: { subscriptionStatus: "active" } }
            );
            const { addTokens, SUBSCRIPTION_TOKENS } = await import("../services/tokenService.js");
            const plan = user.subscriptionPlan || "active";
            const renewalTokens = SUBSCRIPTION_TOKENS[plan] ?? 0;
            if (renewalTokens > 0 && inv.billing_reason !== "subscription_create") {
              await addTokens(user._id.toString(), renewalTokens, "subscription_renewal", `Monthly renewal — ${plan}`, { plan, invoiceId: inv.id }).catch(() => {});
              logger.info({ userId: user._id.toString(), plan, renewalTokens, invoiceId: inv.id }, "Renewal tokens granted");
            }
          }

          if (user && inv.subscription) {
            await invoicesCol.updateOne(
              { invoiceId: inv.id },
              {
                $set: {
                  userId: user._id.toString(),
                  customerId: inv.customer,
                  subscriptionId: inv.subscription,
                  invoiceId: inv.id,
                  amountPaid: inv.amount_paid,
                  hostedInvoiceUrl: inv.hosted_invoice_url,
                  invoicePdf: inv.invoice_pdf,
                  periodStart: inv.period_start ? new Date(inv.period_start * 1000) : undefined,
                  periodEnd: inv.period_end ? new Date(inv.period_end * 1000) : undefined,
                  billingReason: inv.billing_reason,
                  status: "paid",
                },
                $setOnInsert: { createdAt: new Date() },
              },
              { upsert: true }
            );
          }

          await logWebhookEvent("stripe", event.type, "processed", {
            eventId: event.id,
            metadata: { customer: inv.customer, amountPaid: inv.amount_paid },
          }).catch(() => {});
          logger.info({ customer: inv.customer }, "Invoice paid — subscription active + tokens renewed");
          break;
        }

        case "invoice.payment_failed": {
          const inv = event.data.object as {
            customer?: string;
            subscription?: string;
            attempt_count?: number;
            next_payment_attempt?: number;
            hosted_invoice_url?: string;
          };
          const user = await users.findOne({ stripeCustomerId: inv.customer });
          if (user) {
            await users.updateOne(
              { stripeCustomerId: inv.customer },
              { $set: { subscriptionStatus: "paused", lastPaymentFailedAt: new Date() } }
            );
            sendPaymentFailedEmail(user.email, inv.attempt_count ?? 1, inv.next_payment_attempt).catch(() => {});
          }
          await logWebhookEvent("stripe", event.type, "processed", {
            eventId: event.id,
            metadata: {
              customer: inv.customer,
              attemptCount: inv.attempt_count,
              nextAttempt: inv.next_payment_attempt,
            },
          }).catch(() => {});
          logger.warn({ customer: inv.customer }, "Invoice payment failed — subscription paused + email sent");
          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as {
            customer?: string;
            amount_refunded?: number;
            refunds?: { data?: Array<{ reason?: string }> };
          };
          const reason = charge.refunds?.data?.[0]?.reason;
          await logWebhookEvent("stripe", event.type, "processed", {
            eventId: event.id,
            metadata: { customer: charge.customer, amountRefunded: charge.amount_refunded, reason },
          }).catch(() => {});
          logger.info({ customer: charge.customer, amountRefunded: charge.amount_refunded }, "Charge refunded");
          break;
        }

        case "customer.subscription.paused": {
          const sub = event.data.object as { id?: string; customer?: string };
          await users.updateOne({ stripeCustomerId: sub.customer }, { $set: { subscriptionStatus: "paused" } });
          const user = await users.findOne({ stripeCustomerId: sub.customer });
          if (user) {
            sendSubscriptionPausedEmail(user.email).catch(() => {});
            if (sub.id) {
              await userSubs.updateOne(
                { stripeSubscriptionId: sub.id },
                { $set: { status: "paused", pausedAt: new Date() } }
              );
            }
          }
          await logWebhookEvent("stripe", event.type, "processed", { eventId: event.id }).catch(() => {});
          break;
        }

        case "customer.subscription.resumed": {
          const sub = event.data.object as { id?: string; customer?: string };
          await users.updateOne({ stripeCustomerId: sub.customer }, { $set: { subscriptionStatus: "active" } });
          const user = await users.findOne({ stripeCustomerId: sub.customer });
          if (user) {
            sendSubscriptionResumedEmail(user.email).catch(() => {});
            if (sub.id) {
              await userSubs.updateOne(
                { stripeSubscriptionId: sub.id },
                { $set: { status: "active", resumedAt: new Date() } }
              );
            }
          }
          await logWebhookEvent("stripe", event.type, "processed", { eventId: event.id }).catch(() => {});
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as { id?: string; customer?: string; current_period_end?: number };
          const periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toLocaleDateString()
            : undefined;
          const user = await users.findOne({ stripeCustomerId: sub.customer });
          if (user) {
            await users.updateOne(
              { stripeCustomerId: sub.customer },
              {
                $set: {
                  subscriptionStatus: "cancelled",
                  subscriptionCancelledAt: new Date(),
                },
              }
            );
            sendSubscriptionCancelledEmail(user.email, user.name || "", {
              immediately: !periodEnd,
              periodEnd,
            }).catch(() => {});
            if (sub.id) {
              await userSubs.updateOne(
                { stripeSubscriptionId: sub.id },
                { $set: { status: "cancelled", cancelledAt: new Date(), periodEnd } }
              );
            }
          }
          await logWebhookEvent("stripe", event.type, "processed", { eventId: event.id }).catch(() => {});
          logger.info({ customer: sub.customer }, "Subscription cancelled — user notified + tracked");
          break;
        }

        case "customer.subscription.trial_will_end": {
          const sub = event.data.object as { customer?: string; trial_end?: number };
          const endDate = sub.trial_end
            ? new Date(sub.trial_end * 1000).toLocaleDateString()
            : "soon";
          const user = await users.findOne({ stripeCustomerId: sub.customer });
          if (user) sendSubscriptionWillEndEmail(user.email, endDate).catch(() => {});
          await logWebhookEvent("stripe", event.type, "processed", { eventId: event.id }).catch(() => {});
          break;
        }

        default:
          await logWebhookEvent("stripe", event.type, "ignored", { eventId: event.id }).catch(() => {});
          break;
      }
    } catch (err) {
      logger.error({ err, eventType: event.type }, "Webhook handler error");
      await logWebhookEvent("stripe", event.type, "failed", {
        eventId: event.id,
        error: err instanceof Error ? err.message : "unknown",
      }).catch(() => {});
    }

    res.json({ received: true });
  }
);

// ─── Tool Pack Checkout ────────────────────────────────────────────────────────

const TOOL_PACK_CONFIG: Record<string, { name: string; credits: number; priceUsd: number }> = {
  "image-generator":  { name: "AI Image Generator — 5 Credits",      credits: 5,  priceUsd: 19.99 },
  "reels-generator":  { name: "AI Reels Generator — 5 Credits",       credits: 5,  priceUsd: 49.99 },
  "keyword-research": { name: "AI Keyword Research — 10 Credits",     credits: 10, priceUsd: 19.99 },
};

router.post("/v1/stripe/checkout-tool-pack", requireAuth, async (req: AuthRequest, res: Response) => {
  const { tool } = req.body ?? {};

  const config = TOOL_PACK_CONFIG[tool as string];
  if (!config) {
    res.status(400).json({ message: `No pack available for tool: ${tool}` });
    return;
  }

  const frontendUrl = process.env["FRONTEND_URL"] || process.env["CLIENT_URL"] || "https://worlddigital.ai";

  try {
    const stripe = (await import("../lib/stripe.js")).getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: req.user!.email,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: Math.round(config.priceUsd * 100),
          product_data: { name: config.name, description: `${config.credits} generation credits. Never expire.` },
        },
        quantity: 1,
      }],
      metadata: {
        userId: req.user!.userId,
        type: "tool-pack",
        tool,
        credits: String(config.credits),
      },
      success_url: `${frontendUrl}/dashboard/tools/${tool}?pack=success`,
      cancel_url: `${frontendUrl}/dashboard/tools/${tool}?pack=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Tool pack checkout failed");
    res.status(500).json({ message: "Payment setup failed. Please try again." });
  }
});

export default router;
