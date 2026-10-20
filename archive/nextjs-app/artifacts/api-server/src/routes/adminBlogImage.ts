/**
 * Blog image upload and serve.
 *
 * POST /v1/admin/uploads/blog-image  — admin auth, multipart/form-data, field "image"
 *   → compresses and stores in MongoDB mediaFiles collection
 *   → returns { imageUrl: "/api/v1/blog/images/:id" }
 *
 * GET  /v1/blog/images/:id  — public, serves image bytes with correct Content-Type
 */

import { Router, type Request, type Response } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

const router = Router();

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ── Admin auth ────────────────────────────────────────────────────────────────

function requireAdmin(req: Request, res: Response, next: () => void): void {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
  }
  try {
    const secret = process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
    const payload = jwt.verify(auth.slice(7), secret) as { isAdmin?: boolean };
    if (!payload.isAdmin) throw new Error("not admin");
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired admin token" });
  }
}

// ── POST /v1/admin/uploads/blog-image ─────────────────────────────────────────

router.post(
  "/v1/admin/uploads/blog-image",
  (req: Request, res: Response) => {
    requireAdmin(req, res, () => {
      upload.single("image")(req, res, async (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ message: "Image too large. Please upload under 10 MB." });
          return;
        }
        if (err) {
          res.status(400).json({ message: err instanceof Error ? err.message : "Upload error" });
          return;
        }

        const file = req.file;
        if (!file) {
          res.status(400).json({ message: "No image file provided" });
          return;
        }

        if (file.size > MAX_FILE_BYTES) {
          res.status(413).json({ message: "Image too large. Please upload under 10 MB." });
          return;
        }

        try {
          const col = getCollection<{
            _id: ObjectId;
            contentType: string;
            data: string;
            sizeBytes: number;
            originalName: string;
            createdAt: Date;
          }>("mediaFiles");

          const doc = {
            _id: new ObjectId(),
            contentType: file.mimetype,
            data: file.buffer.toString("base64"),
            sizeBytes: file.size,
            originalName: file.originalname,
            createdAt: new Date(),
          };

          await col.insertOne(doc);

          const imageId = doc._id.toHexString();
          const imageUrl = `/api/v1/blog/images/${imageId}`;

          logger.info(
            { imageId, sizeBytes: file.size, contentType: file.mimetype, originalName: file.originalname },
            "Blog image uploaded"
          );

          res.json({ imageUrl, imageId });
        } catch (storeErr) {
          logger.error({ err: storeErr }, "Blog image store failed");
          res.status(500).json({ message: "Failed to store image. Please try again." });
        }
      });
    });
  }
);

// ── GET /v1/blog/images/:id ───────────────────────────────────────────────────

router.get("/v1/blog/images/:id", async (req: Request, res: Response) => {
  const raw = req.params["id"];
  const id = Array.isArray(raw) ? (raw[0] ?? "") : raw;

  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid image ID" });
    return;
  }

  try {
    const col = getCollection<{
      _id: ObjectId;
      contentType: string;
      data: string;
      sizeBytes: number;
    }>("mediaFiles");

    const oid = new ObjectId(id);
    const doc = await col.findOne({ _id: oid });
    if (!doc) {
      res.status(404).json({ message: "Image not found" });
      return;
    }

    const buffer = Buffer.from(doc.data, "base64");
    res.setHeader("Content-Type", doc.contentType);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(buffer);
  } catch (err) {
    logger.error({ err, id }, "Blog image serve failed");
    res.status(500).json({ message: "Failed to load image" });
  }
});

export default router;
