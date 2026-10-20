import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenBalance {
  userId: string;
  balance: number;
  updatedAt: Date;
}

export interface TokenTransaction {
  _id?: import("mongodb").ObjectId;
  userId: string;
  action: string;
  tokensChange: number;
  balanceBefore: number;
  balanceAfter: number;
  note?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TokenCost {
  action: string;
  cost: number;
  label: string;
  updatedAt: Date;
}

// ── Default costs (seeded on first read) ──────────────────────────────────────

export const DEFAULT_COSTS: Omit<TokenCost, "updatedAt">[] = [
  { action: "caption",     cost: 10,  label: "AI Caption Generation (1 caption)" },
  { action: "content",     cost: 15,  label: "AI Content Generation (full post)" },
  { action: "image",       cost: 85,  label: "AI Image Generation (1 image)" },
  { action: "video_8s",    cost: 200, label: "AI Video Generation (8 seconds)" },
  { action: "video_15s",   cost: 350, label: "AI Video Generation (15 seconds)" },
  { action: "video_30s",   cost: 500, label: "AI Video Generation (30 seconds)" },
  { action: "blog",        cost: 50,  label: "AI Blog Post Generation" },
  { action: "campaign",    cost: 125, label: "Full Campaign Plan" },
  { action: "publish",     cost: 0,   label: "Publishing to Platform (per platform)" },
];

// Subscription plan → monthly token grant
export const SUBSCRIPTION_TOKENS: Record<string, number> = {
  "auto-seo":        200,
  "auto-seo-monthly": 200,
  "auto-seo-yearly":  200,
  "ai-content":      500,
  "ai-content-monthly": 500,
  "ai-content-yearly":  500,
  "image-generator": 50,
  "reels-generator": 100,
  "ai-captions":     15,
  "meta-monthly":    6000,
  "meta-yearly":     6000,
  "google-monthly":  6000,
  "google-yearly":   6000,
  "tiktok-monthly":  6000,
  "tiktok-yearly":   6000,
  "snapchat-monthly": 6000,
  "snapchat-yearly":  6000,
  "linkedin-monthly": 6000,
  "linkedin-yearly":  6000,
  "x-monthly":       6000,
  "x-yearly":        6000,
  "youtube-monthly": 6000,
  "youtube-yearly":  6000,
  "google-ads":      6000,
  "meta-ads":        6000,
  "snapchat-ads":    6000,
  "tiktok-ads":      6000,
  "linkedin-ads":    6000,
  "x-ads":           6000,
  "auto-seo-pack":   200,
  "ai-content-pack": 500,
};

export const SIGNUP_BONUS = 30;

// ── Slider token calculation ───────────────────────────────────────────────────
// $1 = 20 tokens base rate, increasing tiers reward larger purchases

export function calculateSliderTokens(dollars: number): number {
  if (dollars <= 0) return 0;

  const tiers: Array<{ max: number; rate: number }> = [
    { max: 9,   rate: 20 },
    { max: 24,  rate: 25 },
    { max: 49,  rate: 30 },
    { max: 99,  rate: 35 },
    { max: 199, rate: 40 },
    { max: 349, rate: 45 },
    { max: 499, rate: 50 },
  ];

  const tier = tiers.find(t => dollars <= t.max) ?? tiers[tiers.length - 1]!;
  return Math.floor(dollars * tier.rate);
}

export function getSliderTierLabel(dollars: number): { label: string; rate: number } {
  if (dollars < 10)  return { label: "Starter",       rate: 20 };
  if (dollars < 25)  return { label: "Good Value",    rate: 25 };
  if (dollars < 50)  return { label: "Great Value",   rate: 30 };
  if (dollars < 100) return { label: "Best Value",    rate: 35 };
  if (dollars < 200) return { label: "Pro Value",     rate: 40 };
  if (dollars < 350) return { label: "Elite Value",   rate: 45 };
  return                     { label: "Maximum Value", rate: 50 };
}

// ── Core service functions ────────────────────────────────────────────────────

async function ensureDefaultCosts(): Promise<void> {
  const col = getCollection<TokenCost>("tokenCosts");
  for (const d of DEFAULT_COSTS) {
    await col.updateOne(
      { action: d.action },
      { $set: { cost: d.cost, label: d.label, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

export async function getCosts(): Promise<TokenCost[]> {
  await ensureDefaultCosts();
  return getCollection<TokenCost>("tokenCosts").find({}).sort({ action: 1 }).toArray();
}

export async function getCost(action: string): Promise<number> {
  await ensureDefaultCosts();
  const doc = await getCollection<TokenCost>("tokenCosts").findOne({ action });
  if (doc) return doc.cost;
  const def = DEFAULT_COSTS.find(d => d.action === action);
  return def?.cost ?? 0;
}

export async function setCosts(updates: Array<{ action: string; cost: number }>): Promise<void> {
  const col = getCollection<TokenCost>("tokenCosts");
  for (const u of updates) {
    await col.updateOne(
      { action: u.action },
      { $set: { cost: u.cost, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

export async function getBalance(userId: string): Promise<number> {
  const doc = await getCollection<TokenBalance>("tokens").findOne({ userId });
  return doc?.balance ?? 0;
}

export async function addTokens(
  userId: string,
  amount: number,
  action: string,
  note?: string,
  metadata?: Record<string, unknown>
): Promise<{ balance: number }> {
  const col = getCollection<TokenBalance>("tokens");
  const txCol = getCollection<TokenTransaction>("tokenTransactions");

  const now = new Date();
  const before = (await col.findOne({ userId }))?.balance ?? 0;
  const after = Math.max(0, before + amount);

  await col.updateOne(
    { userId },
    { $set: { balance: after, updatedAt: now } },
    { upsert: true }
  );

  await txCol.insertOne({
    userId,
    action,
    tokensChange: amount,
    balanceBefore: before,
    balanceAfter: after,
    note,
    timestamp: now,
    metadata,
  });

  logger.info({ userId, action, amount, after }, "Tokens updated");
  return { balance: after };
}

export async function setBalance(
  userId: string,
  targetBalance: number,
  reason: string
): Promise<{ balance: number }> {
  const col = getCollection<TokenBalance>("tokens");
  const txCol = getCollection<TokenTransaction>("tokenTransactions");

  const now = new Date();
  const before = (await col.findOne({ userId }))?.balance ?? 0;
  const after = Math.max(0, targetBalance);
  const change = after - before;

  await col.updateOne(
    { userId },
    { $set: { balance: after, updatedAt: now } },
    { upsert: true }
  );

  await txCol.insertOne({
    userId,
    action: "admin_override",
    tokensChange: change,
    balanceBefore: before,
    balanceAfter: after,
    note: reason || "Admin balance override",
    timestamp: now,
  });

  logger.info({ userId, before, after, change }, "Token balance overridden by admin");
  return { balance: after };
}

export async function deductTokens(
  userId: string,
  action: string,
  note?: string,
  metadata?: Record<string, unknown>
): Promise<{ ok: boolean; balance: number; cost: number; error?: string }> {
  const cost = await getCost(action);
  if (cost === 0) {
    return { ok: true, balance: await getBalance(userId), cost: 0 };
  }

  const col = getCollection<TokenBalance>("tokens");
  const txCol = getCollection<TokenTransaction>("tokenTransactions");
  const now = new Date();

  const doc = await col.findOne({ userId });
  const before = doc?.balance ?? 0;

  if (before < cost) {
    return { ok: false, balance: before, cost, error: "Insufficient tokens" };
  }

  const after = before - cost;

  await col.updateOne(
    { userId },
    { $set: { balance: after, updatedAt: now } },
    { upsert: true }
  );

  await txCol.insertOne({
    userId,
    action,
    tokensChange: -cost,
    balanceBefore: before,
    balanceAfter: after,
    note: note ?? action,
    timestamp: now,
    metadata,
  });

  logger.info({ userId, action, cost, after }, "Tokens deducted");
  return { ok: true, balance: after, cost };
}

export async function getTransactions(
  userId: string,
  limit = 50,
  skip = 0
): Promise<TokenTransaction[]> {
  return getCollection<TokenTransaction>("tokenTransactions")
    .find({ userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const txs = await getCollection<TokenTransaction>("tokenTransactions")
    .find({ userId, timestamp: { $gte: start }, tokensChange: { $lt: 0 } })
    .toArray();

  return txs.reduce((sum, t) => sum + Math.abs(t.tokensChange), 0);
}

// ── Admin functions ───────────────────────────────────────────────────────────

export async function getAllBalances(): Promise<Array<{ userId: string; balance: number; updatedAt: Date }>> {
  return getCollection<TokenBalance>("tokens").find({}).sort({ balance: -1 }).toArray();
}

export async function getAnalytics(period: "day" | "week" | "month" = "month"): Promise<{
  totalConsumed: number;
  totalAdded: number;
  totalRevenue: number;
  byAction: Array<{ action: string; total: number; count: number }>;
  dailyBreakdown: Array<{ date: string; consumed: number; added: number }>;
}> {
  const now = new Date();
  const start = new Date(now);
  if (period === "day")   start.setHours(0, 0, 0, 0);
  if (period === "week")  start.setDate(now.getDate() - 7);
  if (period === "month") start.setDate(1), start.setHours(0, 0, 0, 0);

  const txs = await getCollection<TokenTransaction>("tokenTransactions")
    .find({ timestamp: { $gte: start } })
    .toArray();

  const byAction: Record<string, { total: number; count: number }> = {};
  let totalConsumed = 0;
  let totalAdded = 0;
  let totalRevenue = 0;

  for (const t of txs) {
    if (t.tokensChange < 0) {
      totalConsumed += Math.abs(t.tokensChange);
      if (!byAction[t.action]) byAction[t.action] = { total: 0, count: 0 };
      byAction[t.action]!.total += Math.abs(t.tokensChange);
      byAction[t.action]!.count += 1;
    } else {
      totalAdded += t.tokensChange;
      // Revenue: token_purchase transactions have dollars in metadata
      if (t.action === "token_purchase" && t.metadata?.["dollars"]) {
        totalRevenue += Number(t.metadata["dollars"]);
      }
    }
  }

  const dailyMap: Record<string, { consumed: number; added: number }> = {};
  for (const t of txs) {
    const d = t.timestamp.toISOString().slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { consumed: 0, added: 0 };
    if (t.tokensChange < 0) dailyMap[d]!.consumed += Math.abs(t.tokensChange);
    else dailyMap[d]!.added += t.tokensChange;
  }

  return {
    totalConsumed,
    totalAdded,
    totalRevenue,
    byAction: Object.entries(byAction)
      .map(([action, v]) => ({ action, ...v }))
      .sort((a, b) => b.total - a.total),
    dailyBreakdown: Object.entries(dailyMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
