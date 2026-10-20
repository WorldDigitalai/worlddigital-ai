import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { generalLimiter } from "./middlewares/rateLimit.js";
import { requestTimeout } from "./middlewares/timeout.js";

const app: Express = express();

// Trust Replit's reverse proxy so rate-limit sees real IPs.
app.set("trust proxy", 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
// Always allow Replit preview/dev/prod domains + whatever is in CORS_ORIGIN.
const configuredOrigins = (process.env["CORS_ORIGIN"] || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  // Replit preview/dev/production domains are always permitted.
  if (
    origin.endsWith(".replit.dev") ||
    origin.endsWith(".replit.app") ||
    origin.endsWith(".repl.co")
  ) return true;

  // Production custom domains.
  if (
    origin === "https://worlddigital.ai" ||
    origin === "https://www.worlddigital.ai"
  ) return true;

  // Wildcard in the env var means any origin.
  if (configuredOrigins.includes("*")) return true;

  // Explicit list from env var.
  if (configuredOrigins.includes(origin)) return true;

  // In development, allow all origins.
  if (process.env["NODE_ENV"] !== "production" && configuredOrigins.length === 0) return true;

  return false;
}

app.use(
  cors({
    origin: (origin, cb) => {
      // No origin header = same-origin or server-to-server — always allow.
      if (!origin) return cb(null, true);
      if (isAllowedOrigin(origin)) return cb(null, true);
      logger.warn({ origin }, "CORS: origin rejected");
      cb(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-key", "stripe-signature"],
  })
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(generalLimiter);
// Global timeout: 65 s — must cover image generation (~55 s API call + overhead)
app.use(requestTimeout(65_000));

app.use("/api/v1/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: unknown) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ message });
});

export default app;
