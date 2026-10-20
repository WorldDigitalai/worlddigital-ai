import { Router } from "express";
import type { Request, Response } from "express";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/v1/enterprise/contact", async (req: Request, res: Response) => {
  try {
    const { company, name, email, phone, budget, platforms, message } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    const leadData = {
      company: company || "",
      name,
      email,
      phone: phone || "",
      budget: budget || "",
      platforms: platforms || "",
      message: message || "",
      submittedAt: new Date().toISOString(),
    };

    logger.info({ email, company, budget }, "Enterprise lead received");

    const { Resend } = await import("resend");
    const key = process.env["RESEND_API_KEY"];
    if (key) {
      try {
        const resend = new Resend(key);
        await resend.emails.send({
          from: "WorldDigital.ai <support@worlddigital.ai>",
          to: ["ahmad.awwad@worlddigital.ai"],
          replyTo: `${name} <${email}>`,
          subject: `[Enterprise Lead] ${company || name} — ${budget || "Budget TBD"}`,
          text: [
            `Company: ${company}`,
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            `Monthly Budget: ${budget}`,
            `Platforms: ${platforms}`,
            `Message: ${message}`,
            `Submitted: ${leadData.submittedAt}`,
          ].join("\n"),
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#111827">New Enterprise Lead</h2>
              <table style="border-collapse:collapse;width:100%;font-size:14px">
                <tr><td style="padding:8px 0;color:#6B7280;width:160px">Company</td><td style="padding:8px 0;color:#111827;font-weight:600">${company || "—"}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Name</td><td style="padding:8px 0;color:#111827">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#4285C7">${email}</a></td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Phone</td><td style="padding:8px 0;color:#111827">${phone || "—"}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Monthly Budget</td><td style="padding:8px 0;color:#111827;font-weight:600">${budget || "—"}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Platforms</td><td style="padding:8px 0;color:#111827">${platforms || "—"}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;vertical-align:top">Message</td><td style="padding:8px 0;color:#111827">${message || "—"}</td></tr>
              </table>
              <p style="margin-top:16px;font-size:12px;color:#9CA3AF">Submitted: ${leadData.submittedAt}</p>
            </div>
          `,
        });
        logger.info({ to: "ahmad.awwad@worlddigital.ai", email, company }, "Enterprise lead email sent via Resend");
      } catch (emailErr) {
        logger.error({ err: emailErr }, "Enterprise lead email send failed");
      }
    } else {
      logger.warn("RESEND_API_KEY not set — enterprise lead email skipped");
    }

    return res.status(200).json({ ok: true, message: "Lead received. We will be in touch within 24 hours." });
  } catch (err) {
    logger.error({ err }, "Enterprise contact error");
    return res.status(500).json({ error: "Internal server error. Please try again." });
  }
});

export default router;
