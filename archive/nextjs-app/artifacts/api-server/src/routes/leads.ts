/**
 * Public Lead Capture API
 * POST /v1/leads/capture  — form/popup/AI-assistant lead capture
 * POST /v1/leads/behavior — behavioral event tracking (pricing view, checkout start, etc.)
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { getCollection } from "../lib/mongo.js";
import { logger } from "../lib/logger.js";
import { createNotification } from "./adminLeads.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function col(name: string) { return getCollection(name) as any; }

const router = Router();

// ── Scoring ───────────────────────────────────────────────────────────────────

function computeScore(behavior: Record<string, unknown>, extra: Record<string, unknown> = {}): number {
  let score = 10;
  if (behavior.pricingViewed)      score += 20;
  if (behavior.checkoutStarted)    score += 25;
  if (behavior.checkoutAbandoned)  score += 20;
  if (behavior.aiAssistantUsed)    score += 10;
  if ((behavior.formsSubmitted as number) >= 1) score += 15;
  if ((behavior.formsSubmitted as number) >= 2) score += 15;
  if ((behavior.sessionCount as number) >= 3)   score += 10;
  if ((behavior.sessionCount as number) >= 6)   score += 15;
  if (extra.company)               score += 5;
  if (extra.interestedService)     score += 10;
  if (extra.demoRequested)         score += 30;
  return Math.min(100, score);
}

// ── POST /v1/leads/capture ────────────────────────────────────────────────────

router.post("/v1/leads/capture", async (req: Request, res: Response) => {
  try {
    const {
      name, email, phone, company, website, interestedService,
      source, sourcePage, referrer, utm,
      behavior = {},
      demoRequested = false,
    } = req.body as {
      name?: string; email?: string; phone?: string; company?: string;
      website?: string; interestedService?: string;
      source?: string; sourcePage?: string; referrer?: string;
      utm?: Record<string, string>;
      behavior?: Record<string, unknown>;
      demoRequested?: boolean;
    };

    if (!email) { res.status(400).json({ error: "email is required" }); return; }

    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) { res.status(400).json({ error: "Invalid email" }); return; }

    const now = new Date();

    // Dedup — update existing lead or insert
    const existing = await col("leads").findOne({ email: emailLower }) as Record<string, unknown> | null;

    if (existing) {
      const exBehavior = (existing.behavior || {}) as Record<string, unknown>;
      // Merge behavior data, escalate stage if currently "New Lead"
      const mergedBehavior = {
        pricingViewed:      !!(exBehavior.pricingViewed || behavior.pricingViewed),
        checkoutStarted:    !!(exBehavior.checkoutStarted || behavior.checkoutStarted),
        checkoutAbandoned:  !!(exBehavior.checkoutAbandoned || behavior.checkoutAbandoned),
        aiAssistantUsed:    !!(exBehavior.aiAssistantUsed || behavior.aiAssistantUsed),
        formsSubmitted:     Math.max((exBehavior.formsSubmitted as number || 0) + 1, 1),
        sessionCount:       Math.max((exBehavior.sessionCount as number || 0) + 1, 1),
        pagesViewed:        [...new Set([...(exBehavior.pagesViewed as string[] || []), ...(behavior.pagesViewed as string[] || [])])].slice(0, 50),
        lastVisitAt:        now.toISOString(),
      };

      const update: Record<string, unknown> = {
        behavior: mergedBehavior,
        updatedAt: now,
      };
      if (name && !existing.name)                     update.name = name;
      if (company && !existing.company)               update.company = company;
      if (phone && !existing.phone)                   update.phone = phone;
      if (interestedService && !existing.interestedService) update.interestedService = interestedService;
      if (demoRequested)                              update.demoRequested = true;

      await col("leads").updateOne({ email: emailLower }, { $set: update });

      // Notifications for high-intent actions
      if (behavior.checkoutAbandoned) {
        await createNotification("checkout_abandoned", `Checkout abandoned: ${emailLower}`, { email: emailLower, name });
      }
      if (demoRequested) {
        await createNotification("demo_requested", `Demo requested: ${name || emailLower}`, { email: emailLower, name });
      }

      logger.info({ email: emailLower, action: "merged" }, "Lead behavior merged");
      res.json({ ok: true, action: "merged", id: existing._id });
      return;
    }

    // New lead
    const behaviorData = {
      pricingViewed:     !!(behavior.pricingViewed),
      checkoutStarted:   !!(behavior.checkoutStarted),
      checkoutAbandoned: !!(behavior.checkoutAbandoned),
      aiAssistantUsed:   !!(behavior.aiAssistantUsed),
      formsSubmitted:    1,
      sessionCount:      1,
      pagesViewed:       (behavior.pagesViewed as string[] || []).slice(0, 50),
      lastVisitAt:       now.toISOString(),
    };

    const score = computeScore(behaviorData, { company, interestedService, demoRequested });

    const doc = {
      name: name || "",
      email: emailLower,
      phone: phone || "",
      company: company || "",
      website: website || "",
      stage: "New Lead",
      score,
      temperature: score >= 60 ? "hot" : score >= 30 ? "warm" : "cold",
      source: source || "popup",
      sourcePage: sourcePage || "",
      referrer: referrer || "",
      utm: utm || {},
      interestedService: interestedService || "",
      interestedPlatforms: [],
      behavior: behaviorData,
      owner: "",
      contacted: false,
      demoRequested: !!demoRequested,
      tasks: [],
      notes: [],
      emails: [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await col("leads").insertOne(doc);

    // Notifications
    const notifType = score >= 60 ? "high_intent_lead" : "lead_captured";
    const notifMsg = score >= 60
      ? `🔥 High-intent lead: ${name || emailLower} (score ${score})`
      : `New lead captured: ${name || emailLower}`;

    await createNotification(notifType, notifMsg, { email: emailLower, name, score, source, interestedService });

    if (demoRequested) {
      await createNotification("demo_requested", `Demo requested: ${name || emailLower}`, { email: emailLower });
    }
    if (behavior.checkoutAbandoned) {
      await createNotification("checkout_abandoned", `Checkout abandoned: ${emailLower}`, { email: emailLower });
    }

    // Send admin notification email (non-blocking)
    sendAdminNotificationEmail(name || emailLower, emailLower, source || "popup", interestedService || "", score).catch(() => {});

    // Send lead welcome email (non-blocking)
    sendLeadWelcomeEmail(name || "", emailLower, interestedService || "").catch(() => {});

    logger.info({ email: emailLower, score, source }, "New lead captured");
    res.status(201).json({ ok: true, action: "created", id: result.insertedId, score });
  } catch (err) {
    logger.error({ err }, "POST /v1/leads/capture error");
    res.status(500).json({ error: "Failed to capture lead" });
  }
});

// ── POST /v1/leads/behavior ───────────────────────────────────────────────────
// Lightweight endpoint for anonymous behavior tracking (no email required).
// If email is provided, merges into existing lead.

router.post("/v1/leads/behavior", async (req: Request, res: Response) => {
  try {
    const { email, event, page, meta } = req.body as {
      email?: string;
      event: string;
      page?: string;
      meta?: Record<string, unknown>;
    };

    if (!event) { res.status(400).json({ error: "event is required" }); return; }

    if (email) {
      const emailLower = email.toLowerCase().trim();
      const update: Record<string, unknown> = { "behavior.lastVisitAt": new Date().toISOString(), updatedAt: new Date() };

      if (event === "pricing_view")        update["behavior.pricingViewed"] = true;
      if (event === "checkout_start")      update["behavior.checkoutStarted"] = true;
      if (event === "checkout_abandoned")  { update["behavior.checkoutAbandoned"] = true; await createNotification("checkout_abandoned", `Checkout abandoned: ${emailLower}`, { email: emailLower }); }
      if (event === "ai_assistant_open")   update["behavior.aiAssistantUsed"] = true;

      if (page) {
        await col("leads").updateOne(
          { email: emailLower },
          { $addToSet: { "behavior.pagesViewed": page }, $set: update, $inc: { "behavior.sessionCount": 0 } }
        );
      } else {
        await col("leads").updateOne({ email: emailLower }, { $set: update });
      }
    }

    // Always log the event for analytics
    await col("behaviorEvents").insertOne({
      email: email?.toLowerCase().trim() ?? null,
      event,
      page: page || "",
      meta: meta || {},
      createdAt: new Date(),
   });

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /v1/leads/behavior error");
    res.status(500).json({ error: "Failed to track behavior" });
  }
});

// ── Email helpers ─────────────────────────────────────────────────────────────

async function sendAdminNotificationEmail(
  name: string, email: string, source: string, service: string, score: number
) {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const tempLabel = score >= 60 ? "🔥 HOT" : score >= 30 ? "🟡 Warm" : "❄️ Cold";
    await resend.emails.send({
      from: "WorldDigital.ai <support@worlddigital.ai>",
      to: ["support@worlddigital.ai"],
      subject: `[${tempLabel}] New Lead: ${name || email} — Score ${score}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#111827">New Lead Captured</h2>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr><td style="padding:6px 0;color:#6B7280;width:140px">Name</td><td style="color:#111827;font-weight:600">${name || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280">Email</td><td><a href="mailto:${email}" style="color:#4285C7">${email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6B7280">Source</td><td style="color:#111827">${source}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280">Interested In</td><td style="color:#111827">${service || "Not specified"}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280">Lead Score</td><td style="color:${score>=60?"#C13A2A":score>=30?"#CA8A04":"#64748B"};font-weight:700">${tempLabel} — ${score}/100</td></tr>
          </table>
          <p style="margin-top:16px"><a href="https://worlddigital.ai/admin/leads" style="background:#C13A2A;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700">View in CRM →</a></p>
        </div>
      `,
    });
  } catch { /* non-critical */ }
}

async function sendLeadWelcomeEmail(name: string, email: string, service: string) {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const firstName = name.split(" ")[0] || "there";
    await resend.emails.send({
      from: "WorldDigital.ai <support@worlddigital.ai>",
      to: [email],
      subject: "Thanks for your interest — here's what happens next",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <img src="https://worlddigital.ai/icons/wdlogo.jpeg" alt="WorldDigital.ai" width="40" style="border-radius:8px;margin-bottom:16px" />
          <h2 style="color:#111827">Hi ${firstName},</h2>
          <p style="color:#4B5563;line-height:1.6">
            Thanks for reaching out to <strong>WorldDigital.ai</strong>. We help small businesses automate their
            ${service ? service + " " : ""}digital marketing with AI — saving time and growing revenue.
          </p>
          <p style="color:#4B5563;line-height:1.6">
            Our team will be in touch within <strong>1 business day</strong> to discuss your goals and show you exactly
            how we can help your business grow.
          </p>
          <p style="margin:24px 0">
            <a href="https://worlddigital.ai/subscribe" style="background:#C13A2A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
              Explore Our Plans →
            </a>
          </p>
          <p style="color:#9CA3AF;font-size:12px;margin-top:32px">
            WorldDigital.ai — AI-powered digital marketing for small businesses<br/>
            <a href="https://worlddigital.ai/unsubscribe?email=${encodeURIComponent(email)}" style="color:#9CA3AF">Unsubscribe</a>
          </p>
        </div>
      `,
    });
  } catch { /* non-critical */ }
}

export default router;
