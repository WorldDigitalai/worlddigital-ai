import app from "./app.js";
import { logger } from "./lib/logger.js";
import { connectMongo, createIndexes } from "./lib/mongo.js";
import { validateConfig } from "./lib/config.js";
import { startSnapchatTokenRefreshJob } from "./lib/snapTokenManager.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const { missing, configured } = validateConfig();

if (missing.length > 0) {
  logger.warn({ missing }, `Missing environment variables (${missing.length}): ${missing.join(", ")}`);
} else {
  logger.info("All required environment variables are configured");
}

logger.info({ configuredCount: configured.length }, "Environment validation complete");

const siteVerificationToken =
  process.env["GOOGLE_SITE_VERIFICATION"] ??
  process.env["NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"];

if (siteVerificationToken) {
  logger.info(
    { token: siteVerificationToken },
    "Google Search Console verification token configured — renders as <meta name=\"google-site-verification\" content=\"...\" />"
  );
} else {
  logger.warn(
    "GOOGLE_SITE_VERIFICATION is not set — google-site-verification meta tag will be absent from the site. " +
    "Set this secret to the token from Google Search Console → Settings → Ownership verification → HTML tag."
  );
}

function onServerListening() {
  logger.info({ port }, "Server listening");
  startSnapchatTokenRefreshJob();
}

connectMongo()
  .then(() => {
    createIndexes().catch((err: unknown) => {
      logger.warn({ err }, "Index creation failed (non-fatal)");
    });
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      onServerListening();
    });
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Failed to connect to MongoDB — starting server without DB");
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening (no MongoDB)");
      startSnapchatTokenRefreshJob();
    });
  });
