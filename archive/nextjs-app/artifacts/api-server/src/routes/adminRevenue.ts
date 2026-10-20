import { Router, type Request, type Response } from "express";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/v1/admin/revenue", async (req: Request, res: Response) => {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
  }
  try {
    const jwt = await import("jsonwebtoken");
    const secret = process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
    const payload = jwt.verify(auth.slice(7), secret) as { isAdmin?: boolean };
    if (!payload.isAdmin) throw new Error("not admin");
  } catch {
    res.status(401).json({ message: "Invalid or expired admin token" });
    return;
  }

  try {
    const usersCol = getCollection<{
      subscriptionStatus?: string;
      subscriptionPlan?: string;
      subscriptionActivatedAt?: Date;
      subscriptionCancelledAt?: Date;
    }>("users");
    const subsCol = getCollection<{
      plan: string;
      status: string;
      startedAt?: Date;
      cancelledAt?: Date;
      amountPaid?: number;
    }>("userSubscriptions");
    const invoicesCol = getCollection<{
      amountPaid?: number;
      status: string;
      createdAt: Date;
      billingReason?: string;
    }>("subscriptionInvoices");

    const allUsers = await usersCol.find({}).toArray();
    const totalCustomers = allUsers.length;
    const activeSubscribers = allUsers.filter(u => u.subscriptionStatus === "active").length;
    const pausedSubscribers = allUsers.filter(u => u.subscriptionStatus === "paused").length;
    const cancelledSubscribers = allUsers.filter(u => u.subscriptionStatus === "cancelled").length;
    const freeUsers = totalCustomers - activeSubscribers - pausedSubscribers - cancelledSubscribers;

    const allSubs = await subsCol.find({}).toArray();
    const allInvoices = await invoicesCol.find({ status: "paid" }).toArray();

    const planCounts: Record<string, number> = {};
    for (const s of allSubs) {
      planCounts[s.plan] = (planCounts[s.plan] || 0) + 1;
    }
    const topPlans = Object.entries(planCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([plan, count]) => ({ plan, count }));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthInvoices = allInvoices.filter(i => i.createdAt >= monthStart);
    const lastMonthInvoices = allInvoices.filter(i => i.createdAt >= lastMonthStart && i.createdAt <= lastMonthEnd);

    const thisMonthRevenue = thisMonthInvoices.reduce((s, i) => s + (i.amountPaid || 0), 0) / 100;
    const lastMonthRevenue = lastMonthInvoices.reduce((s, i) => s + (i.amountPaid || 0), 0) / 100;
    const totalRevenue = allInvoices.reduce((s, i) => s + (i.amountPaid || 0), 0) / 100;

    // MRR estimate: active subscribers * average plan price (rough)
    const mrr = activeSubscribers * 350;

    const revenueByMonth: Record<string, number> = {};
    for (const i of allInvoices) {
      const d = new Date(i.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + (i.amountPaid || 0) / 100;
    }
    const revenueTrend = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));

    // Churn calculation
    const churnRate = activeSubscribers > 0
      ? Math.round((cancelledSubscribers / activeSubscribers) * 1000) / 10
      : 0;

    res.json({
      totalCustomers,
      activeSubscribers,
      pausedSubscribers,
      cancelledSubscribers,
      freeUsers,
      mrr,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
      churnRate,
      topPlans,
      revenueTrend,
      totalInvoices: allInvoices.length,
    });
  } catch (err) {
    logger.error({ err }, "Revenue analytics failed");
    res.status(500).json({ message: "Failed to load revenue data" });
  }
});

export default router;
