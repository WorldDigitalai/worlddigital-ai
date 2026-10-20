/**
 * Admin CRM / Sales Pipeline API
 *
 * Leads collection schema:
 *   { _id, name, email, phone?, company?, website?,
 *     stage, score, temperature,
 *     source, sourcePage?, referrer?, utm?,
 *     interestedService?, interestedPlatforms?,
 *     behavior: { pricingViewed, checkoutStarted, checkoutAbandoned,
 *                 aiAssistantUsed, formsSubmitted, sessionCount,
 *                 lastVisitAt, pagesViewed[] },
 *     owner?, contacted, demoRequested?,
 *     tasks[], notes[], emails[],
 *     createdAt, updatedAt }
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function col(name: string) { return getCollection(name) as any; }

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────

function requireAdmin(req: Request, res: Response, next: () => void): void {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const secret = process.env["ACCESS_TOKEN_SECRET"] || "fallback-dev-secret";
    const payload = jwt.verify(auth.slice(7), secret) as { isAdmin?: boolean };
    if (!payload.isAdmin) throw new Error();
    next();
  } catch { res.status(401).json({ error: "Invalid admin token" }); }
}

// ── Scoring ───────────────────────────────────────────────────────────────────

interface LeadBehavior {
  pricingViewed?: boolean;
  checkoutStarted?: boolean;
  checkoutAbandoned?: boolean;
  aiAssistantUsed?: boolean;
  formsSubmitted?: number;
  sessionCount?: number;
  pagesViewed?: string[];
  lastVisitAt?: string;
}

interface LeadDoc {
  _id?: ObjectId;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  stage: string;
  score?: number;
  temperature?: string;
  source?: string;
  sourcePage?: string;
  referrer?: string;
  utm?: Record<string, string>;
  interestedService?: string;
  interestedPlatforms?: string[];
  behavior?: LeadBehavior;
  owner?: string;
  contacted?: boolean;
  demoRequested?: boolean;
  tasks?: Array<{ id: string; title: string; dueDate?: string; completed: boolean; createdAt: string }>;
  notes?: Array<{ id: string; text: string; author?: string; createdAt: string }>;
  emails?: Array<{ subject: string; sentAt: string; opened?: boolean; clicked?: boolean; failed?: boolean }>;
  createdAt?: Date;
  updatedAt?: Date;
}

function computeScore(lead: LeadDoc): number {
  let score = 10;
  const b = lead.behavior || {};
  if (b.pricingViewed)             score += 20;
  if (b.checkoutStarted)           score += 25;
  if (b.checkoutAbandoned)         score += 20;
  if (b.aiAssistantUsed)           score += 10;
  if ((b.formsSubmitted ?? 0) >= 1) score += 15;
  if ((b.formsSubmitted ?? 0) >= 2) score += 15;
  if ((b.sessionCount ?? 0) >= 3)   score += 10;
  if ((b.sessionCount ?? 0) >= 6)   score += 15;
  if (lead.company)                score += 5;
  if (lead.interestedService)      score += 10;
  if (lead.demoRequested)          score += 30;
  return Math.min(100, score);
}

function getTemperature(score: number): "hot" | "warm" | "cold" {
  if (score >= 60) return "hot";
  if (score >= 30) return "warm";
  return "cold";
}

function enrichLead(lead: LeadDoc): LeadDoc & { score: number; temperature: string } {
  const score = computeScore(lead);
  return { ...lead, score, temperature: getTemperature(score) };
}

// ── STAGES ────────────────────────────────────────────────────────────────────

const STAGES = ["New Lead", "Interested", "Contacted", "Demo Scheduled", "Proposal Sent", "Negotiating", "Won", "Lost"];

// ── GET /v1/admin/leads ───────────────────────────────────────────────────────

router.get("/v1/admin/leads", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { stage, temperature, source, search, limit = "200" } = req.query as Record<string, string>;
      const filter: Record<string, unknown> = {};
      if (stage && STAGES.includes(stage)) filter.stage = stage;
      if (source) filter.source = source;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
        ];
      }

      const leads = await col("leads")
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(parseInt(limit, 10) || 200, 500))
        .toArray() as LeadDoc[];

      let enriched = leads.map(enrichLead);
      if (temperature) enriched = enriched.filter((l) => l.temperature === temperature);

      res.json(enriched);
    } catch (err) {
      logger.error({ err }, "GET /v1/admin/leads error");
      res.status(500).json({ error: "Failed to load leads" });
    }
  });
});

// ── POST /v1/admin/leads — manual create ─────────────────────────────────────

router.post("/v1/admin/leads", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { name, email, phone, company, website, interestedService, source, stage, owner } = req.body as Partial<LeadDoc>;
      if (!email) { res.status(400).json({ error: "email is required" }); return; }

      const existing = await col("leads").findOne({ email });
      if (existing) { res.status(409).json({ error: "Lead with this email already exists", existing }); return; }

      const now = new Date();
      const doc: LeadDoc = {
        name: name || "",
        email: email.toLowerCase().trim(),
        phone: phone || "",
        company: company || "",
        website: website || "",
        stage: STAGES.includes(stage || "") ? (stage as string) : "New Lead",
        source: source || "manual",
        interestedService: interestedService || "",
        owner: owner || "",
        contacted: false,
        demoRequested: false,
        behavior: { sessionCount: 1, formsSubmitted: 1, pricingViewed: false, checkoutStarted: false, checkoutAbandoned: false, aiAssistantUsed: false, pagesViewed: [] },
        tasks: [],
        notes: [],
        emails: [],
        createdAt: now,
        updatedAt: now,
      };

      const result = await col("leads").insertOne(doc);
      logger.info({ email, source: "manual" }, "Lead created manually");

      // Create notification
      await createNotification("lead_captured", `New manual lead: ${name || email}`, { email, source: "manual" });

      res.status(201).json(enrichLead({ ...doc, _id: result.insertedId }));
    } catch (err) {
      logger.error({ err }, "POST /v1/admin/leads error");
      res.status(500).json({ error: "Failed to create lead" });
    }
  });
});

// ── PATCH /v1/admin/leads/:id — update stage / owner / contacted / etc ───────

router.patch("/v1/admin/leads/:id", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { stage, owner, contacted, interestedService, phone, company, name, demoRequested } = req.body as Partial<LeadDoc>;
      const update: Record<string, unknown> = { updatedAt: new Date() };

      if (stage !== undefined && STAGES.includes(stage)) update.stage = stage;
      if (owner !== undefined) update.owner = owner;
      if (contacted !== undefined) update.contacted = contacted;
      if (interestedService !== undefined) update.interestedService = interestedService;
      if (phone !== undefined) update.phone = phone;
      if (company !== undefined) update.company = company;
      if (name !== undefined) update.name = name;
      if (demoRequested !== undefined) update.demoRequested = demoRequested;

      await col("leads").updateOne(
        { _id: new ObjectId(String(req.params.id)) } as any,
        { $set: update } as any
      );

      const updated = await col("leads").findOne({ _id: new ObjectId(String(req.params.id)) } as any) as LeadDoc;
      if (!updated) { res.status(404).json({ error: "Lead not found" }); return; }

      res.json(enrichLead(updated));
    } catch (err) {
      logger.error({ err }, "PATCH /v1/admin/leads/:id error");
      res.status(500).json({ error: "Failed to update lead" });
    }
  });
});

// ── DELETE /v1/admin/leads/:id ────────────────────────────────────────────────

router.delete("/v1/admin/leads/:id", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      await col("leads").deleteOne({ _id: new ObjectId(String(req.params.id)) } as any);
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "DELETE /v1/admin/leads/:id error");
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });
});

// ── POST /v1/admin/leads/:id/notes ───────────────────────────────────────────

router.post("/v1/admin/leads/:id/notes", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { text, author } = req.body as { text?: string; author?: string };
      if (!text?.trim()) { res.status(400).json({ error: "text is required" }); return; }

      const note = { id: new ObjectId().toHexString(), text: text.trim(), author: author || "Admin", createdAt: new Date().toISOString() };

      await col("leads").updateOne(
        { _id: new ObjectId(String(req.params.id)) } as any,
        { $push: { notes: note }, $set: { updatedAt: new Date() } } as any
      );
      res.json(note);
    } catch (err) {
      logger.error({ err }, "POST notes error");
      res.status(500).json({ error: "Failed to add note" });
    }
  });
});

// ── DELETE /v1/admin/leads/:id/notes/:noteId ─────────────────────────────────

router.delete("/v1/admin/leads/:id/notes/:noteId", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      await col("leads").updateOne(
        { _id: new ObjectId(String(req.params.id)) } as any,
        { $pull: { notes: { id: req.params.noteId } }, $set: { updatedAt: new Date() } } as any
      );
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "DELETE note error");
      res.status(500).json({ error: "Failed to delete note" });
    }
  });
});

// ── POST /v1/admin/leads/:id/tasks ───────────────────────────────────────────

router.post("/v1/admin/leads/:id/tasks", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { title, dueDate } = req.body as { title?: string; dueDate?: string };
      if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }

      const task = { id: new ObjectId().toHexString(), title: title.trim(), dueDate: dueDate || "", completed: false, createdAt: new Date().toISOString() };

      await col("leads").updateOne(
        { _id: new ObjectId(String(req.params.id)) } as any,
        { $push: { tasks: task }, $set: { updatedAt: new Date() } } as any
      );
      res.json(task);
    } catch (err) {
      logger.error({ err }, "POST task error");
      res.status(500).json({ error: "Failed to add task" });
    }
  });
});

// ── PATCH /v1/admin/leads/:id/tasks/:taskId ──────────────────────────────────

router.patch("/v1/admin/leads/:id/tasks/:taskId", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const { completed } = req.body as { completed?: boolean };
      await col("leads").updateOne(
        { _id: new ObjectId(String(req.params.id)), "tasks.id": req.params.taskId } as any,
        { $set: { "tasks.$.completed": completed, updatedAt: new Date() } } as any
      );
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "PATCH task error");
      res.status(500).json({ error: "Failed to update task" });
    }
  });
});

// ── DELETE /v1/admin/leads/:id/tasks/:taskId ─────────────────────────────────

router.delete("/v1/admin/leads/:id/tasks/:taskId", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      await col("leads").updateOne(
        { _id: new ObjectId(String(req.params.id)) } as any,
        { $pull: { tasks: { id: req.params.taskId } }, $set: { updatedAt: new Date() } } as any
      );
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "DELETE task error");
      res.status(500).json({ error: "Failed to delete task" });
    }
  });
});

// ── GET /v1/admin/leads/metrics ──────────────────────────────────────────────

router.get("/v1/admin/leads/metrics", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const leads = await col("leads").find({}).toArray() as LeadDoc[];
      const enriched = leads.map(enrichLead);

      const total = enriched.length;
      const won = enriched.filter((l) => l.stage === "Won").length;
      const lost = enriched.filter((l) => l.stage === "Lost").length;
      const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

      // Hot/warm/cold counts
      const hot  = enriched.filter((l) => l.temperature === "hot").length;
      const warm = enriched.filter((l) => l.temperature === "warm").length;
      const cold = enriched.filter((l) => l.temperature === "cold").length;

      // Top source
      const sourceCounts: Record<string, number> = {};
      for (const l of enriched) { const s = l.source || "unknown"; sourceCounts[s] = (sourceCounts[s] || 0) + 1; }
      const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      // Top service
      const serviceCounts: Record<string, number> = {};
      for (const l of enriched) { if (l.interestedService) { const s = l.interestedService; serviceCounts[s] = (serviceCounts[s] || 0) + 1; } }
      const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      // Stage breakdown
      const byStage: Record<string, number> = {};
      for (const stage of STAGES) byStage[stage] = 0;
      for (const l of enriched) { if (l.stage && byStage[l.stage] !== undefined) byStage[l.stage]++; }

      // Abandoned checkouts
      const abandonedCheckouts = enriched.filter((l) => l.behavior?.checkoutAbandoned).length;

      // Contacted
      const contacted = enriched.filter((l) => l.contacted).length;

      // Recent (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentLeads = enriched.filter((l) => l.createdAt && new Date(l.createdAt) >= thirtyDaysAgo).length;

      res.json({
        total, won, lost, conversionRate, hot, warm, cold,
        topSource, topService, byStage, abandonedCheckouts,
        contacted, recentLeads, stages: STAGES,
      });
    } catch (err) {
      logger.error({ err }, "GET /v1/admin/leads/metrics error");
      res.status(500).json({ error: "Failed to load metrics" });
    }
  });
});

// ── GET /v1/admin/leads/notifications ────────────────────────────────────────

router.get("/v1/admin/leads/notifications", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const notes = await col("adminNotifications")
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      res.json(notes);
    } catch (err) {
      logger.error({ err }, "GET notifications error");
      res.status(500).json({ error: "Failed to load notifications" });
    }
  });
});

// ── PATCH /v1/admin/leads/notifications/:id/read ─────────────────────────────

router.patch("/v1/admin/leads/notifications/:id/read", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      await col("adminNotifications").updateOne(
        { _id: new ObjectId(String(req.params.id)) } as any,
        { $set: { read: true } } as any
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark read" });
    }
  });
});

// ── GET /v1/admin/leads/export ───────────────────────────────────────────────

router.get("/v1/admin/leads/export", (req: Request, res: Response) => {
  requireAdmin(req, res, async () => {
    try {
      const leads = await col("leads").find({}).sort({ createdAt: -1 }).toArray() as LeadDoc[];
      const enriched = leads.map(enrichLead);

      const headers = ["Name", "Email", "Phone", "Company", "Website", "Stage", "Temperature", "Score",
        "Source", "Interested Service", "Owner", "Contacted", "Demo Requested",
        "Pricing Viewed", "Checkout Started", "Checkout Abandoned", "AI Assistant Used",
        "Session Count", "Forms Submitted", "Created At"];

      const rows = enriched.map((l) => [
        l.name || "",
        l.email,
        l.phone || "",
        l.company || "",
        l.website || "",
        l.stage,
        l.temperature,
        l.score,
        l.source || "",
        l.interestedService || "",
        l.owner || "",
        l.contacted ? "Yes" : "No",
        l.demoRequested ? "Yes" : "No",
        l.behavior?.pricingViewed ? "Yes" : "No",
        l.behavior?.checkoutStarted ? "Yes" : "No",
        l.behavior?.checkoutAbandoned ? "Yes" : "No",
        l.behavior?.aiAssistantUsed ? "Yes" : "No",
        l.behavior?.sessionCount || 0,
        l.behavior?.formsSubmitted || 0,
        l.createdAt ? new Date(l.createdAt).toISOString() : "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));

      const csv = [headers.join(","), ...rows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(csv);
    } catch (err) {
      logger.error({ err }, "GET leads export error");
      res.status(500).json({ error: "Export failed" });
    }
  });
});

// ── Notification helper ───────────────────────────────────────────────────────

async function createNotification(type: string, message: string, meta: Record<string, unknown> = {}) {
  try {
    await col("adminNotifications").insertOne({
      type, message, meta, read: false, createdAt: new Date(),
   });
  } catch { /* non-critical */ }
}

export { createNotification };
export default router;
