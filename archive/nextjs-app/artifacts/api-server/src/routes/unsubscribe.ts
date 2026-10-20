/**
 * GET /api/v1/unsubscribe?email=...
 *
 * CAN-SPAM / RFC 2369 one-click unsubscribe handler.
 * Stores the email address in the `emailUnsubscribes` MongoDB collection
 * and redirects the user to a confirmation page on the frontend.
 *
 * Also accepts POST (RFC 8058 one-click):
 *   POST /api/v1/unsubscribe  body: List-Unsubscribe=One-Click
 */

import { Router, type Request, type Response } from "express";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

const router = Router();

const FRONTEND_UNSUBSCRIBE_SUCCESS = "https://worlddigital.ai/unsubscribe-success";

async function recordUnsubscribe(email: string, source: string): Promise<void> {
  const col = getCollection<{ email: string; unsubscribedAt: Date; source: string }>("emailUnsubscribes");
  await col.updateOne(
    { email } as Parameters<typeof col.updateOne>[0],
    { $set: { email, source, unsubscribedAt: new Date() } },
    { upsert: true }
  );
  logger.info({ email, source }, "Email unsubscribe recorded");
}

router.get("/v1/unsubscribe", async (req: Request, res: Response) => {
  const email = req.query["email"] as string | undefined;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    await recordUnsubscribe(email, "link-click");
  } catch (err) {
    logger.error({ err, email }, "Failed to record unsubscribe (DB error)");
  }

  return res.redirect(`${FRONTEND_UNSUBSCRIBE_SUCCESS}?email=${encodeURIComponent(email)}`);
});

router.post("/v1/unsubscribe", async (req: Request, res: Response) => {
  const email = (req.query["email"] as string | undefined) ?? (req.body?.email as string | undefined);

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    await recordUnsubscribe(email, "one-click-post");
  } catch (err) {
    logger.error({ err, email }, "Failed to record one-click unsubscribe (DB error)");
  }

  return res.status(200).json({ message: "Unsubscribed" });
});

export default router;
