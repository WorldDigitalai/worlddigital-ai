import { Router, type IRouter, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import { ObjectId } from "mongodb";

const router: IRouter = Router();

// ── GET /v1/dashboard/subscriptions ────────────────────────────────────────────────────
router.get("/v1/dashboard/subscriptions", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userCol = getCollection<{
      _id: ObjectId;
      subscriptionStatus?: string;
      subscriptionPlan?: string;
      subscriptionActivatedAt?: Date;
      subscriptionCancelledAt?: Date;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      subscriptionCurrentPeriodEnd?: Date;
    }>("users");
    const user = await userCol.findOne({ _id: new ObjectId(userId) });

    const subsCol = getCollection<{
      userId: string;
      stripeSubscriptionId: string;
      stripeCustomerId: string;
      plan: string;
      status: string;
      startedAt?: Date;
      currentPeriodEnd?: Date;
      cancelledAt?: Date;
      pausedAt?: Date;
      resumedAt?: Date;
    }>("userSubscriptions");
    const subs = await subsCol.find({ userId }).sort({ startedAt: -1 }).toArray();

    res.json({
      active: user?.subscriptionStatus || "none",
      plan: user?.subscriptionPlan || null,
      stripeCustomerId: user?.stripeCustomerId || null,
      currentPeriodEnd: user?.subscriptionCurrentPeriodEnd || null,
      activatedAt: user?.subscriptionActivatedAt || null,
      cancelledAt: user?.subscriptionCancelledAt || null,
      subscriptions: subs.map(s => ({
        id: s.stripeSubscriptionId,
        plan: s.plan,
        status: s.status,
        startedAt: s.startedAt,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelledAt: s.cancelledAt,
        pausedAt: s.pausedAt,
        resumedAt: s.resumedAt,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Subscriptions fetch failed");
    res.status(500).json({ message: "Failed to load subscriptions" });
  }
});

// ── GET /v1/dashboard/invoices ────────────────────────────────────────────────────────────
router.get("/v1/dashboard/invoices", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const col = getCollection<{
      userId: string;
      invoiceId: string;
      amountPaid?: number;
      status: string;
      hostedInvoiceUrl?: string;
      invoicePdf?: string;
      periodStart?: Date;
      periodEnd?: Date;
      billingReason?: string;
      createdAt: Date;
    }>("subscriptionInvoices");
    const invoices = await col.find({ userId }).sort({ createdAt: -1 }).toArray();
    res.json({
      invoices: invoices.map(i => ({
        id: i.invoiceId,
        amount: i.amountPaid,
        status: i.status,
        url: i.hostedInvoiceUrl,
        pdf: i.invoicePdf,
        periodStart: i.periodStart,
        periodEnd: i.periodEnd,
        reason: i.billingReason,
        date: i.createdAt,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Invoices fetch failed");
    res.status(500).json({ message: "Failed to load invoices" });
  }
});

export default router;
