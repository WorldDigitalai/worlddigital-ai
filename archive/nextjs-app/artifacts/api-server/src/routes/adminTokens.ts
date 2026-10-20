import { Router, type IRouter, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../lib/mongo.js";
import {
  getAllBalances,
  getTransactions,
  addTokens,
  setBalance,
  getCosts,
  setCosts,
  getAnalytics,
  getBalance,
  getMonthlyUsage,
} from "../services/tokenService.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

function adminAuth(req: Request, res: Response): boolean {
  const header = (req.headers["authorization"] || "").replace("Bearer ", "");
  if (!header) { res.status(401).json({ message: "Unauthorized" }); return false; }
  return true;
}

// ── GET /v1/admin/tokens/users ────────────────────────────────────────────────

router.get("/v1/admin/tokens/users", async (req: Request, res: Response) => {
  if (!adminAuth(req, res)) return;
  try {
    const search = (req.query["search"] as string || "").toLowerCase().trim();
    const balances = await getAllBalances();

    const users = getCollection<{ _id: ObjectId; email: string; name: string }>("users");
    const userDocs = await users.find({}, { projection: { email: 1, name: 1 } }).toArray();
    const userMap = new Map(userDocs.map(u => [u._id.toHexString(), { email: u.email, name: u.name }]));

    let result = balances.map(b => ({
      ...b,
      ...(userMap.get(b.userId) ?? { email: "unknown", name: "unknown" }),
    }));

    if (search) {
      result = result.filter(u =>
        u.email?.toLowerCase().includes(search) ||
        u.name?.toLowerCase().includes(search)
      );
    }

    res.json({ users: result });
  } catch (err) {
    logger.error({ err }, "GET /v1/admin/tokens/users error");
    res.status(500).json({ message: "Failed to get users" });
  }
});

// ── GET /v1/admin/tokens/user/:userId ─────────────────────────────────────────

router.get("/v1/admin/tokens/user/:userId", async (req: Request, res: Response) => {
  if (!adminAuth(req, res)) return;
  try {
    const userId = req.params["userId"] as string;
    const [balance, monthlyUsed, transactions] = await Promise.all([
      getBalance(userId),
      getMonthlyUsage(userId),
      getTransactions(userId, 100, 0),
    ]);

    const users = getCollection<{ _id: ObjectId; email: string; name: string }>("users");
    let userInfo = { email: "unknown", name: "unknown" };
    try {
      const u = await users.findOne({ _id: new ObjectId(userId) });
      if (u) userInfo = { email: u.email, name: u.name };
    } catch { /* invalid ObjectId */ }

    res.json({ userId, ...userInfo, balance, monthlyUsed, transactions });
  } catch (err) {
    logger.error({ err }, "GET /v1/admin/tokens/user error");
    res.status(500).json({ message: "Failed to get user tokens" });
  }
});

// ── POST /v1/admin/tokens/adjust ─────────────────────────────────────────────

router.post("/v1/admin/tokens/adjust", async (req: Request, res: Response) => {
  if (!adminAuth(req, res)) return;
  try {
    const { userId, amount, reason } = req.body ?? {};
    if (!userId || typeof amount !== "number" || amount === 0) {
      res.status(400).json({ message: "userId and non-zero amount are required" });
      return;
    }

    const action = amount > 0 ? "admin_add" : "admin_remove";
    const { balance } = await addTokens(userId, amount, action, reason ?? "Admin adjustment");
    res.json({ ok: true, userId, balance, amount, reason });
  } catch (err) {
    logger.error({ err }, "POST /v1/admin/tokens/adjust error");
    res.status(500).json({ message: "Failed to adjust tokens" });
  }
});

// ── POST /v1/admin/tokens/set-balance ────────────────────────────────────────

router.post("/v1/admin/tokens/set-balance", async (req: Request, res: Response) => {
  if (!adminAuth(req, res)) return;
  try {
    const { userId, balance: targetBalance, reason } = req.body ?? {};
    if (!userId || typeof targetBalance !== "number" || targetBalance < 0) {
      res.status(400).json({ message: "userId and non-negative balance are required" });
      return;
    }

    const { balance } = await setBalance(userId, targetBalance, reason ?? "Admin balance override");
    res.json({ ok: true, userId, balance, reason });
  } catch (err) {
    logger.error({ err }, "POST /v1/admin/tokens/set-balance error");
    res.status(500).json({ message: "Failed to set balance" });
  }
});

// ── GET /v1/admin/tokens/costs ────────────────────────────────────────────────

router.get("/v1/admin/tokens/costs", async (req: Request, res: Response) => {
  if (!adminAuth(req, res)) return;
  try {
    const costs = await getCosts();
    res.json({ costs });
  } catch (err) {
    logger.error({ err }, "GET /v1/admin/tokens/costs error");
    res.status(500).json({ message: "Failed to get costs" });
  }
});

// ── PUT /v1/admin/tokens/costs ────────────────────────────────────────────────

router.put("/v1/admin/tokens/costs", async (req: Request, res: Response) => {
  if (!adminAuth(req, res)) return;
  try {
    const { updates } = req.body ?? {};
    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({ message: "updates array is required" });
      return;
    }
    await setCosts(updates as Array<{ action: string; cost: number }>);
    const costs = await getCosts();
    res.json({ ok: true, costs });
  } catch (err) {
    logger.error({ err }, "PUT /v1/admin/tokens/costs error");
    res.status(500).json({ message: "Failed to update costs" });
  }
});

// ── GET /v1/admin/tokens/analytics ───────────────────────────────────────────

router.get("/v1/admin/tokens/analytics", async (req: Request, res: Response) => {
  if (!adminAuth(req, res)) return;
  try {
    const period = (req.query["period"] as "day" | "week" | "month") || "month";
    const data = await getAnalytics(period);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "GET /v1/admin/tokens/analytics error");
    res.status(500).json({ message: "Failed to get analytics" });
  }
});

export default router;
