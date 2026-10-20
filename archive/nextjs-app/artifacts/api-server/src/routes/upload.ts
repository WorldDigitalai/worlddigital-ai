import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { uploadToS3, validateFile, type S3Folder } from "../lib/s3.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { uploadLimiter } from "../middlewares/rateLimit.js";
import { logger } from "../lib/logger.js";
import { isObjectStorageConfigured, uploadLogoBuffer, streamLogo } from "../lib/appStorage.js";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function buildUploadHandler(folder: S3Folder) {
  return [
    requireAuth,
    uploadLimiter,
    upload.single("file"),
    async (req: AuthRequest, res: Response) => {
      if (!req.file) {
        res.status(400).json({ message: "No file provided" });
        return;
      }

      const { valid, error } = validateFile(folder, req.file.mimetype, req.file.size);
      if (!valid) {
        res.status(400).json({ message: error });
        return;
      }

      try {
        const result = await uploadToS3(folder, req.file.buffer, req.file.mimetype, req.file.originalname);
        logger.info({ userId: req.user!.userId, folder, key: result.key }, "File uploaded");
        res.json({ url: result.url, key: result.key });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        logger.error({ err, folder }, "S3 upload error");
        res.status(500).json({ message });
      }
    },
  ] as const;
}

// ─── Logo upload ──────────────────────────────────────────────────────────────
// Priority: S3 → Replit Object Storage → base64 fallback (last resort)
router.post(
  "/v1/upload/logo",
  requireAuth,
  uploadLimiter,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ message: "No file provided" });
      return;
    }

    const { valid, error } = validateFile("logos", req.file.mimetype, req.file.size);
    if (!valid) {
      res.status(400).json({ message: error });
      return;
    }

    const s3Ready = !!(
      process.env["AWS_ACCESS_KEY_ID"] &&
      process.env["AWS_SECRET_ACCESS_KEY"] &&
      process.env["S3_BUCKET_NAME"]
    );

    try {
      // 1. Try S3 first
      if (s3Ready) {
        try {
          const result = await uploadToS3("logos", req.file.buffer, req.file.mimetype, req.file.originalname);
          logger.info({ userId: req.user!.userId, key: result.key }, "Logo uploaded to S3");
          res.json({ url: result.url, key: result.key });
          return;
        } catch (s3Err: unknown) {
          logger.warn({ s3Err }, "S3 upload failed — trying Object Storage");
        }
      }

      // 2. Try Replit Object Storage
      if (isObjectStorageConfigured()) {
        const objectId = await uploadLogoBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
        const url = `/api/v1/upload/logos/${objectId}`;
        logger.info({ userId: req.user!.userId, objectId }, "Logo uploaded to Object Storage");
        res.json({ url, key: objectId });
        return;
      }

      // 3. Last resort — base64 (should not reach here with Object Storage configured)
      const b64 = req.file.buffer.toString("base64");
      const url = `data:${req.file.mimetype};base64,${b64}`;
      logger.warn({ userId: req.user!.userId }, "Logo stored as base64 — configure Object Storage to avoid MongoDB bloat");
      res.json({ url, key: "base64" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      logger.error({ err }, "Logo upload error");
      res.status(500).json({ message });
    }
  }
);

// ─── Logo serve ───────────────────────────────────────────────────────────────
// Serves logos stored in Replit Object Storage.
// URLs look like: GET /api/v1/upload/logos/some-uuid.png
router.get(
  "/v1/upload/logos/:objectId",
  async (req: Request, res: Response) => {
    const objectId = req.params["objectId"] as string;
    if (!objectId || objectId.includes("..") || objectId.includes("/")) {
      res.status(400).json({ message: "Invalid object ID" });
      return;
    }

    try {
      const result = await streamLogo(objectId);
      if (!result) {
        res.status(404).json({ message: "Logo not found" });
        return;
      }
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      result.stream.pipe(res);
    } catch (err: unknown) {
      logger.error({ err, objectId }, "Logo serve error");
      res.status(500).json({ message: "Failed to serve logo" });
    }
  }
);

router.post("/v1/upload/resume", ...buildUploadHandler("resumes"));
router.post("/v1/upload/cover-letter", ...buildUploadHandler("cover-letters"));

export default router;
