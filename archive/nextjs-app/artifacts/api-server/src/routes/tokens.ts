import { Router, type IRouter, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import {
  getBalance,
  getTransactions,
  getCosts,
  getMonthlyUsage,
  calculateSliderTokens,
  getSliderTierLabel,
} from "../services/tokenService.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// ── GET /v1/tokens/balance ────────────────────────────────────────────────────

router.get("/v1/tokens/balance", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const [balance, monthlyUsed] = await Promise.all([
      getBalance(userId),
      getMonthlyUsage(userId),
    ]);
    res.json({ balance, monthlyUsed });
  } catch (err) {
    logger.error({ err }, "GET /v1/tokens/balance error");
    res.status(500).json({ message: "Failed to get token balance" });
  }
});

// ── GET /v1/tokens/transactions ───────────────────────────────────────────────

router.get("/v1/tokens/transactions", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit  = Math.min(Number(req.query["limit"] ?? 50), 200);
    const skip   = Number(req.query["skip"] ?? 0);
    const txs    = await getTransactions(userId, limit, skip);
    res.json({ transactions: txs });
  } catch (err) {
    logger.error({ err }, "GET /v1/tokens/transactions error");
    res.status(500).json({ message: "Failed to get transactions" });
  }
});

// ── GET /v1/tokens/costs ──────────────────────────────────────────────────────

router.get("/v1/tokens/costs", requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const costs = await getCosts();
    res.json({ costs });
  } catch (err) {
    logger.error({ err }, "GET /v1/tokens/costs error");
    res.status(500).json({ message: "Failed to get costs" });
  }
});

// ── POST /v1/stripe/checkout-tokens ──────────────────────────────────────────
// Dynamic slider-based token purchase

router.post("/v1/stripe/checkout-tokens", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { dollars } = req.body ?? {};
    const amount = Number(dollars);

    if (!amount || amount < 5 || amount > 499) {
      res.status(400).json({ message: "Amount must be between $5 and $499" });
      return;
    }

    const tokens = calculateSliderTokens(amount);
    const { label } = getSliderTierLabel(amount);
    const frontendUrl = process.env["FRONTEND_URL"] || process.env["CLIENT_URL"] || "https://worlddigital.ai";

    const stripe = (await import("../lib/stripe.js")).getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: req.user!.email,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: `${tokens.toLocaleString()} WorldDigital.ai Tokens`,
            description: `${label} — ${tokens.toLocaleString()} tokens at ${Math.floor(tokens / amount)} per dollar. Never expire.`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        userId:   req.user!.userId,
        type:     "token-purchase",
        tokens:   String(tokens),
        dollars:  String(amount),
        tierLabel: label,
      },
      success_url: `${frontendUrl}/dashboard/usage?tokens=success&amount=${tokens}`,
      cancel_url:  `${frontendUrl}/dashboard/usage?tokens=cancelled`,
    });

    res.json({ url: session.url, tokens, dollars: amount });
  } catch (err) {
    logger.error({ err }, "POST /v1/stripe/checkout-tokens error");
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

// ── GET /v1/tokens/slider-preview ─────────────────────────────────────────────
// Public preview endpoint — no auth needed for slider UX

router.get("/v1/tokens/slider-preview", (req, res) => {
  const dollars = Number(req.query["dollars"] ?? 0);
  const tokens  = calculateSliderTokens(dollars);
  const tier    = getSliderTierLabel(dollars);
  res.json({ dollars, tokens, ...tier });
});

export default router;
