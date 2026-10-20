import type { Request, Response, NextFunction } from "express";
import { verifyToken, extractTokenFromHeader } from "../lib/jwt.js";
import { getCollection } from "../lib/mongo.js";

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: "user" | "admin" };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers["authorization"]);
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }
    next();
  });
}

export function requireActiveSubscription(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, async () => {
    try {
      const users = getCollection<{ _id: unknown; subscriptionStatus?: string }>("users");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await users.findOne({ _id: req.user!.userId } as any);

      if (!user || user.subscriptionStatus !== "active") {
        res.status(403).json({
          message: "An active subscription is required to use this feature",
          redirect: "/subscribe",
        });
        return;
      }
      next();
    } catch {
      res.status(500).json({ message: "Could not verify subscription status" });
    }
  });
}

export function requireAdminApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"];
  const expected = process.env["ACCESS_TOKEN_SECRET"];
  if (!key || !expected || key !== expected) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}
