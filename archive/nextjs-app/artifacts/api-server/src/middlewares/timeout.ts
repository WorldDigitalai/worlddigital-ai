import type { Request, Response, NextFunction } from "express";

const DEFAULT_TIMEOUT_MS = 30_000;

export function requestTimeout(ms: number = DEFAULT_TIMEOUT_MS) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ message: "Request timed out" });
      }
    }, ms);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
}
