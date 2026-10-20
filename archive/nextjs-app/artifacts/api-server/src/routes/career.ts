import { Router, type IRouter, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getCollection } from "../lib/mongo.js";
import { verifyRecaptcha } from "../lib/recaptcha.js";
import { sendCareerNotificationEmail } from "../lib/email.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

interface CareerApplicationDoc {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  experience: string;
  message: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  status: "received";
  emailSent: boolean;
  emailError?: string;
  createdAt: Date;
}

// ── Admin auth helper (same pattern as adminIntegrations.ts) ──────────────────

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

// ── POST /v1/career/apply ─────────────────────────────────────────────────────

router.post("/v1/career/apply", async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    position,
    linkedInUrl,
    portfolioUrl,
    experience,
    message,
    resumeUrl,
    coverLetterUrl,
    recaptchaToken,
  } = req.body ?? {};

  logger.info({ email, position }, "Career application form submitted");

  if (!firstName || !lastName || !email || !position || !experience || !message) {
    res.status(400).json({ message: "All required fields must be filled" });
    return;
  }

  if (recaptchaToken) {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      res.status(400).json({ message: "reCAPTCHA verification failed" });
      return;
    }
  }

  const submittedAt = new Date();

  // ── 1. Save to database (fail fast if DB is down) ─────────────────────────

  let doc: CareerApplicationDoc;
  try {
    const col = getCollection<CareerApplicationDoc>("career_applications");
    doc = {
      _id: new ObjectId(),
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone: phone || undefined,
      position,
      linkedInUrl: linkedInUrl || undefined,
      portfolioUrl: portfolioUrl || undefined,
      experience,
      message,
      resumeUrl: resumeUrl || undefined,
      coverLetterUrl: coverLetterUrl || undefined,
      status: "received",
      emailSent: false,
      createdAt: submittedAt,
    };
    await col.insertOne(doc);
    logger.info({ applicationId: doc._id.toHexString(), email, position }, "Career application saved to database");
  } catch (err) {
    logger.error({ err, email, position }, "Career application DB save failed");
    res.status(500).json({ message: "Failed to save your application. Please try again." });
    return;
  }

  // ── 2. Send notification email to support@worlddigital.ai ────────────────

  const emailResult = await sendCareerNotificationEmail({
    firstName,
    lastName,
    email: email.toLowerCase().trim(),
    phone: phone || undefined,
    position,
    experience,
    message,
    linkedInUrl: linkedInUrl || undefined,
    portfolioUrl: portfolioUrl || undefined,
    resumeUrl: resumeUrl || undefined,
    coverLetterUrl: coverLetterUrl || undefined,
    submittedAt,
  });

  if (emailResult.sent) {
    logger.info({ applicationId: doc._id.toHexString(), email, position }, "Career notification email sent to support@worlddigital.ai");
  } else {
    logger.error({ applicationId: doc._id.toHexString(), email, position, reason: emailResult.error }, "Career notification email failed");
  }

  // ── 3. Update the DB record with email status ─────────────────────────────

  try {
    const col = getCollection<CareerApplicationDoc>("career_applications");
    await col.updateOne(
      { _id: doc._id },
      { $set: { emailSent: emailResult.sent, emailError: emailResult.error } }
    );
  } catch {
    // Non-fatal — application is already saved
  }

  // ── 4. Always return success if DB save worked ────────────────────────────

  res.status(201).json({
    message: "Application submitted successfully",
    id: doc._id.toHexString(),
    saved: true,
    emailSent: emailResult.sent,
    emailNote: emailResult.sent
      ? "Notification sent to support@worlddigital.ai"
      : "Application saved — email notification will be retried by admin",
  });
});

// ── GET /v1/admin/career/applications ─────────────────────────────────────────

router.get("/v1/admin/career/applications", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const col = getCollection<CareerApplicationDoc>("career_applications");
      const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query["limit"] ?? "20"), 10)));
      const skip = (page - 1) * limit;

      const [applications, total] = await Promise.all([
        col.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
        col.countDocuments({}),
      ]);

      logger.info({ count: applications.length, total }, "Admin fetched career applications");
      res.json({ applications, total, page, limit, pages: Math.ceil(total / limit) });
    } catch (err) {
      logger.error({ err }, "Failed to fetch career applications");
      res.status(500).json({ message: "Failed to load applications" });
    }
  });
});

// ── DELETE /v1/admin/career/applications/:id ──────────────────────────────────

router.delete("/v1/admin/career/applications/:id", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid application ID" });
        return;
      }
      const col = getCollection<CareerApplicationDoc>("career_applications");
      const result = await col.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        res.status(404).json({ message: "Application not found" });
        return;
      }
      logger.info({ id }, "Admin deleted career application");
      res.json({ message: "Application deleted" });
    } catch (err) {
      logger.error({ err }, "Failed to delete career application");
      res.status(500).json({ message: "Failed to delete application" });
    }
  });
});

export default router;
