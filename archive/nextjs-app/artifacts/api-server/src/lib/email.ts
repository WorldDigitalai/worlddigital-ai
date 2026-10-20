import { Resend } from "resend";
import { logger } from "./logger.js";

// ── Sender identity ────────────────────────────────────────────────────────────
const FROM_EMAIL = "support@worlddigital.ai";
const FROM_NAME  = "WorldDigital.ai Corporation LLC";
const FROM       = `${FROM_NAME} <${FROM_EMAIL}>`;

// ── CAN-SPAM / RFC 2369 compliance constants ───────────────────────────────────
const PHYSICAL_ADDRESS  = "WorldDigital.ai Corporation LLC · 3343 Memorial Blvd · Murfreesboro, TN";
const UNSUBSCRIBE_BASE  = "https://worlddigital.ai/api/v1/unsubscribe";
const UNSUBSCRIBE_MAILTO = "mailto:unsubscribe@worlddigital.ai?subject=unsubscribe";

// ── Brand ──────────────────────────────────────────────────────────────────────
const LOGO_URL    = "https://worlddigital.ai/logo-email.png";
const BRAND_RED   = "#C13A2A";
const BRAND_BLUE  = "#4285C7";
const SITE_URL    = "https://worlddigital.ai";

// ── Social media — inline SVG icons (no external image deps, works in all email clients) ──
const SOCIAL: { name: string; url: string; bg: string; svg: string }[] = [
  {
    name: "LinkedIn",
    url:  "https://www.linkedin.com/company/worlddigital-ai",
    bg:   "#0A66C2",
    svg:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452H16.893V14.883C16.893 13.555 16.866 11.846 15.041 11.846C13.188 11.846 12.905 13.291 12.905 14.785V20.452H9.351V9H12.765V10.561H12.811C13.288 9.661 14.448 8.711 16.181 8.711C19.782 8.711 20.448 11.081 20.448 14.166V20.452H20.447ZM5.337 7.433C4.193 7.433 3.274 6.507 3.274 5.368C3.274 4.23 4.194 3.305 5.337 3.305C6.477 3.305 7.401 4.23 7.401 5.368C7.401 6.507 6.476 7.433 5.337 7.433ZM7.119 20.452H3.555V9H7.119V20.452Z"/></svg>`,
  },
  {
    name: "X",
    url:  "https://twitter.com/Worlddigitalai",
    bg:   "#000000",
    svg:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z"/></svg>`,
  },
  {
    name: "Instagram",
    url:  "https://www.instagram.com/worlddigitalai",
    bg:   "#E1306C",
    svg:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  },
  {
    name: "Facebook",
    url:  "https://www.facebook.com/worlddigitalai",
    bg:   "#1877F2",
    svg:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  },
  {
    name: "YouTube",
    url:  "https://www.youtube.com/@worlddigitalai",
    bg:   "#FF0000",
    svg:  `<svg width="17" height="13" viewBox="0 0 24 17" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M23.495 2.205a3.02 3.02 0 0 0-2.128-2.137C19.505 0 12 0 12 0S4.505 0 2.633.068a3.02 3.02 0 0 0-2.128 2.137C0 4.066 0 7.927 0 7.927s0 3.861.505 5.722a3.02 3.02 0 0 0 2.128 2.137C4.505 15.854 12 15.854 12 15.854s7.495 0 9.367-.068a3.02 3.02 0 0 0 2.128-2.137C24 11.788 24 7.927 24 7.927s0-3.861-.505-5.722zM9.546 11.127V4.727l6.273 3.2-6.273 3.2z"/></svg>`,
  },
  {
    name: "TikTok",
    url:  "https://www.tiktok.com/@worlddigitalai",
    bg:   "#010101",
    svg:  `<svg width="14" height="16" viewBox="0 0 24 28" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/></svg>`,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function unsubscribeUrl(email: string): string {
  return `${UNSUBSCRIBE_BASE}?email=${encodeURIComponent(email)}`;
}

function listUnsubscribeHeaders(email: string): Record<string, string> {
  return {
    "List-Unsubscribe":      `<${UNSUBSCRIBE_MAILTO}>, <${unsubscribeUrl(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

// ── Resend client ──────────────────────────────────────────────────────────────

function getResend(): Resend | null {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  return new Resend(key);
}

export function isConfigured(): boolean {
  return !!process.env["RESEND_API_KEY"];
}

// ── Central send helper ────────────────────────────────────────────────────────

interface SendOptions {
  resend: Resend;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  recipientEmail?: string;
  replyTo?: string;
}

async function sendEmail(opts: SendOptions): Promise<void> {
  const toArr       = Array.isArray(opts.to) ? opts.to : [opts.to];
  const extraHeaders = opts.recipientEmail ? listUnsubscribeHeaders(opts.recipientEmail) : {};

  await opts.resend.emails.send({
    from:    FROM,
    to:      toArr,
    subject: opts.subject,
    html:    opts.html,
    text:    opts.text,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    headers: extraHeaders,
  });
}

// ── Shared HTML template ───────────────────────────────────────────────────────

/**
 * Full branded email wrapper.
 *
 * Layout:
 *   ┌──────────────────────────────────┐
 *   │  ████ gradient accent bar ████   │  4 px
 *   │  [Logo 120 px centered]          │
 *   │                                  │
 *   │  ── body rows (injected) ──      │
 *   │                                  │
 *   │  ── footer ──                    │
 *   │  logo · social icons             │
 *   │  address · unsubscribe · © year  │
 *   └──────────────────────────────────┘
 */
function emailWrapper(body: string, recipientEmail?: string): string {
  // Social icons — inline SVG in branded circles, no external image deps
  const socialIcons = SOCIAL.map(
    (s) =>
      `<a href="${s.url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:0 4px;vertical-align:middle;text-decoration:none"><span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:${s.bg}">${s.svg}</span></a>`
  ).join("");

  const unsubRow = recipientEmail
    ? `<p style="margin:10px 0 0;font-size:11px;color:#9CA3AF">
         <a href="${unsubscribeUrl(recipientEmail)}" style="color:#9CA3AF;text-decoration:underline">Unsubscribe</a>
         &nbsp;·&nbsp;
         <a href="mailto:${FROM_EMAIL}" style="color:#9CA3AF;text-decoration:underline">Contact support</a>
       </p>`
    : `<p style="margin:10px 0 0;font-size:11px;color:#9CA3AF">
         <a href="mailto:${FROM_EMAIL}" style="color:#9CA3AF;text-decoration:underline">Contact support</a>
       </p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>WorldDigital.ai Corporation LLC</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px">
    <tr><td align="center">

      <!-- Card -->
      <table role="presentation" width="580" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:20px;overflow:hidden;max-width:580px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Gradient accent bar -->
        <tr>
          <td style="background:linear-gradient(90deg,${BRAND_RED} 0%,${BRAND_BLUE} 100%);height:5px;font-size:0;line-height:0">&nbsp;</td>
        </tr>

        <!-- Logo header -->
        <tr>
          <td align="center" style="padding:36px 40px 8px">
            <a href="${SITE_URL}" style="text-decoration:none;display:inline-block">
              <img src="${LOGO_URL}"
                   alt="WorldDigital.ai Corporation LLC"
                   width="100"
                   height="100"
                   style="display:block;width:100px;height:100px;object-fit:contain;border:0;outline:none;text-decoration:none"
              />
            </a>
            <p style="margin:10px 0 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#94A3B8">WorldDigital.ai Corporation LLC</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#E2E8F0,transparent)"></div>
          </td>
        </tr>

        <!-- Body (injected) -->
        ${body}

        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:28px 40px 32px;border-top:1px solid #E2E8F0;text-align:center">

            <!-- Footer logo -->
            <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;margin-bottom:16px">
              <img src="${LOGO_URL}"
                   alt="WorldDigital.ai Corporation LLC"
                   width="40"
                   height="40"
                   style="display:block;width:40px;height:40px;object-fit:contain;border:0;opacity:0.7"
              />
            </a>

            <!-- Social icons -->
            <div style="margin-bottom:18px">${socialIcons}</div>

            <!-- Copyright + address -->
            <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6">
              © ${new Date().getFullYear()} WorldDigital.ai Corporation LLC. All rights reserved.
            </p>
            <p style="margin:5px 0 0;font-size:11px;color:#9CA3AF">${PHYSICAL_ADDRESS}</p>

            ${unsubRow}
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>
</body>
</html>`;
}

// ── Gradient CTA button ────────────────────────────────────────────────────────

function ctaButton(label: string, url: string): string {
  return `<a href="${url}"
     style="display:inline-block;background:linear-gradient(90deg,${BRAND_BLUE} 0%,${BRAND_RED} 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;letter-spacing:0.01em"
  >${label}</a>`;
}

// ── Plain-text footer helper ───────────────────────────────────────────────────

function textFooter(email?: string): string {
  const lines = [
    "",
    "---",
    "WorldDigital.ai Corporation LLC — worlddigital.ai",
    PHYSICAL_ADDRESS,
    "LinkedIn: https://www.linkedin.com/company/worlddigital-ai",
    "X/Twitter: https://twitter.com/Worlddigitalai",
    "Instagram: https://www.instagram.com/worlddigitalai",
  ];
  if (email) lines.push(`Unsubscribe: ${unsubscribeUrl(email)}`);
  lines.push(`© ${new Date().getFullYear()} WorldDigital.ai Corporation LLC`);
  return lines.join("\n");
}

// ── Kept for backward compat — no-op with Resend ──────────────────────────────

export interface EmailOptions {
  to: string;
  templateId: string;
  dynamicTemplateData?: Record<string, unknown>;
  subject?: string;
}

export async function sendTemplateEmail(_opts: EmailOptions): Promise<boolean> {
  return false;
}

export const templates = {
  signup:              () => "",
  forgotPassword:      () => "",
  subscriptionCreated: () => "",
  subscriptionPaused:  () => "",
  subscriptionResumed: () => "",
  subscriptionWillEnd: () => "",
  stripeInvoice:       () => "",
  careerReceived:      () => "",
  careerConfirmation:  () => "",
};

// ── sendWelcomeEmail ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) { logger.warn("Resend not configured — skipping welcome email"); return; }

  const firstName = (name || "").split(" ")[0] || "there";

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">
        Welcome, ${firstName}!
      </h1>
      <p style="margin:0;font-size:16px;color:#475569;line-height:1.6">
        Your WorldDigital.ai Corporation LLC account is ready. Start automating your social media and growing your brand today.
      </p>
    </td></tr>
    <tr><td style="padding:24px 40px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${featureRow("AI Content Generation", "Write captions, scripts, and ad copy for every platform in seconds.")}
        ${featureRow("Automated Publishing", "Schedule and publish to Meta, Instagram, LinkedIn, TikTok, and more.")}
        ${featureRow("Analytics Dashboard", "Track performance and engagement across all your channels.")}
      </table>
    </td></tr>
    <tr><td style="padding:28px 40px 36px;text-align:center">
      ${ctaButton("Go to Dashboard", "https://worlddigital.ai/dashboard")}
      <p style="margin:18px 0 0;font-size:13px;color:#94A3B8">
        Need help? Reply to this email or visit our <a href="https://worlddigital.ai/help" style="color:${BRAND_BLUE};text-decoration:none;font-weight:600">help center</a>.
      </p>
    </td></tr>`, email);

  const text = `Welcome to WorldDigital.ai Corporation LLC, ${firstName}!\n\nYour account is ready. Start automating your social media today.\n\nDashboard: https://worlddigital.ai/dashboard\n\nWhat you can do:\n• AI content generation for every platform\n• Automated scheduling & publishing\n• Analytics across all channels${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: `Welcome to WorldDigital.ai Corporation LLC, ${firstName}!`, html, text, recipientEmail: email });
    logger.info({ to: email }, "Welcome email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Resend welcome email failed");
  }
}

function featureRow(title: string, desc: string): string {
  return `<tr>
    <td style="padding:10px 16px 10px 0;vertical-align:top;width:28px">
      <div style="width:20px;height:20px;border-radius:50%;background:#ECFDF5;display:flex;align-items:center;justify-content:center;margin-top:2px">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="#059669" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </td>
    <td style="padding:10px 0;vertical-align:top;border-bottom:1px solid #F1F5F9">
      <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0F172A">${title}</p>
      <p style="margin:0;font-size:13px;color:#64748B;line-height:1.5">${desc}</p>
    </td>
  </tr>`;
}

// ── sendForgotPasswordEmail ───────────────────────────────────────────────────

export async function sendForgotPasswordEmail(email: string, resetUrl: string): Promise<void> {
  const resend = getResend();
  if (!resend) { logger.warn("Resend not configured — skipping forgot-password email"); return; }

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#FEF2F2;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 17v-2m0 0a5 5 0 100-10 5 5 0 000 10zm0 0v2m0 0h-3m3 0h3" stroke="#C13A2A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="11" width="14" height="10" rx="2" stroke="#C13A2A" stroke-width="1.8"/><path d="M8 11V7a4 4 0 018 0v4" stroke="#C13A2A" stroke-width="1.8" stroke-linecap="round"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Reset your password</h1>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">
        We received a request to reset the password for your WorldDigital.ai Corporation LLC account. Click the button below — this link expires in <strong>1 hour</strong>.
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 12px;text-align:center">
      ${ctaButton("Reset My Password", resetUrl)}
    </td></tr>
    <tr><td style="padding:0 40px 32px;text-align:center">
      <p style="margin:16px 0 4px;font-size:12px;color:#94A3B8">Or paste this link into your browser:</p>
      <p style="margin:0;font-size:11px;color:#64748B;word-break:break-all;font-family:monospace">${resetUrl}</p>
      <p style="margin:20px 0 0;font-size:12px;color:#94A3B8">
        Didn't request this? You can safely ignore this email — your password won't change.
      </p>
    </td></tr>`, email);

  const text = `Reset your WorldDigital.ai Corporation LLC password\n\nClick the link below (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: "Reset your WorldDigital.ai Corporation LLC password", html, text, recipientEmail: email });
    logger.info({ to: email }, "Forgot-password email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Resend forgot-password email failed");
  }
}

// ── Subscription emails ───────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(
  email: string,
  attemptCount: number,
  nextAttempt?: number
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const nextAttemptStr = nextAttempt
    ? new Date(nextAttempt * 1000).toLocaleDateString()
    : "soon";

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#FEF2F2;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#C13A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Payment Failed</h1>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">
        We couldn't process your payment for WorldDigital.ai Corporation LLC. This was attempt <strong>#${attemptCount}</strong>.
      </p>
    </td></tr>
    <tr><td style="padding:12px 40px 8px">
      <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:12px;padding:16px 20px;text-align:center">
        <p style="margin:0;font-size:14px;font-weight:600;color:#92400E">Next attempt: ${nextAttemptStr}</p>
      </div>
    </td></tr>
    <tr><td style="padding:12px 40px 8px">
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">
        To keep your subscription active, please update your payment method. Your access will continue until the next attempt fails.
      </p>
    </td></tr>
    <tr><td style="padding:24px 40px 36px;text-align:center">
      ${ctaButton("Update Payment Method →", "https://worlddigital.ai/dashboard/billing")}
    </td></tr>`, email);

  const text = `Payment Failed — WorldDigital.ai Corporation LLC\n\nWe couldn't process your payment. This was attempt #${attemptCount}.\n\nNext attempt: ${nextAttemptStr}\n\nUpdate your payment method: https://worlddigital.ai/dashboard/billing${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: "Payment failed — WorldDigital.ai Corporation LLC", html, text, recipientEmail: email });
    logger.info({ to: email, attemptCount }, "Payment failed email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Payment failed email error");
  }
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  name: string,
  opts: { immediately: boolean; periodEnd?: string }
): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  const firstName = (name || "").split(" ")[0] || "there";

  const timingHtml = opts.immediately
    ? "Your subscription has been <strong>cancelled immediately</strong>."
    : `Your subscription has been cancelled and will remain active until <strong>${opts.periodEnd || "the end of your billing period"}</strong>.`;
  const timingText = opts.immediately
    ? "Your subscription has been cancelled immediately."
    : `Your subscription has been cancelled and will remain active until ${opts.periodEnd || "the end of your billing period"}.`;

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#FEF2F2;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18L18 6M6 6l12 12" stroke="#C13A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Subscription Cancelled</h1>
      <p style="margin:0;font-size:15px;color:#475569">Hi ${firstName},</p>
    </td></tr>
    <tr><td style="padding:12px 40px 8px">
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">${timingHtml}</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">We're sorry to see you go. You can re-subscribe at any time from your dashboard.</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0">If you have any feedback, please reply to this email.</p>
    </td></tr>
    <tr><td style="padding:24px 40px 36px;text-align:center">
      ${ctaButton("Re-subscribe", "https://worlddigital.ai/subscribe")}
    </td></tr>`, email);

  const text = `Subscription Cancelled — WorldDigital.ai Corporation LLC\n\nHi ${firstName},\n\n${timingText}\n\nWe're sorry to see you go. You can re-subscribe at any time.\n\nhttps://worlddigital.ai/subscribe${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: "Your WorldDigital.ai Corporation LLC subscription has been cancelled", html, text, recipientEmail: email });
    logger.info({ to: email, immediately: opts.immediately }, "Subscription cancelled email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Subscription cancelled email failed");
  }
}

// ── Plan mapping helpers (icons + display names) ─────────────────────────────

function getPlanIconUrl(planId: string): string {
  const id = planId.toLowerCase();
  const base = "https://worlddigital.ai/icons";
  if (id.includes("meta")) return `${base}/meta.png`;
  if (id.includes("google")) return `${base}/google.webp`;
  if (id.includes("snapchat")) return `${base}/snapchat.png`;
  if (id.includes("tiktok")) return `${base}/tiktok.jpeg`;
  if (id.includes("linkedin")) return `${base}/linkedin.png`;
  if (id.includes("x-") || id.includes("twitter")) return `${base}/x.png`;
  if (id.includes("youtube")) return `${base}/youtube.png`;
  if (id.includes("facebook")) return `${base}/facebook.png`;
  if (id.includes("auto-seo")) return `${base}/icon-search-gear.png`;
  if (id.includes("ai-content")) return `${base}/icon-content.png`;
  if (id.includes("image-generator")) return `${base}/icon-lightbulb.png`;
  if (id.includes("reels-generator")) return `${base}/icon-sparkle.png`;
  if (id.includes("ai-captions")) return `${base}/icon-megaphone.png`;
  return `${base}/wdlogo.jpeg`;
}

function getPlanDisplayName(planId: string): string {
  const id = planId.toLowerCase();
  if (id.includes("meta-monthly")) return "Meta Ads Management — Monthly";
  if (id.includes("meta-yearly")) return "Meta Ads Management — Yearly";
  if (id.includes("google-monthly")) return "Google Ads Management — Monthly";
  if (id.includes("google-yearly")) return "Google Ads Management — Yearly";
  if (id.includes("snapchat-monthly")) return "Snapchat Ads Management — Monthly";
  if (id.includes("snapchat-yearly")) return "Snapchat Ads Management — Yearly";
  if (id.includes("tiktok-monthly")) return "TikTok Ads Management — Monthly";
  if (id.includes("tiktok-yearly")) return "TikTok Ads Management — Yearly";
  if (id.includes("linkedin-monthly")) return "LinkedIn Ads Management — Monthly";
  if (id.includes("linkedin-yearly")) return "LinkedIn Ads Management — Yearly";
  if (id.includes("x-monthly")) return "X Ads Management — Monthly";
  if (id.includes("x-yearly")) return "X Ads Management — Yearly";
  if (id.includes("youtube-monthly")) return "YouTube Ads Management — Monthly";
  if (id.includes("youtube-yearly")) return "YouTube Ads Management — Yearly";
  if (id.includes("all-monthly")) return "All Platforms Package — Monthly";
  if (id.includes("all-yearly")) return "All Platforms Package — Yearly";
  if (id.includes("auto-seo")) return "Auto SEO Package";
  if (id.includes("ai-content")) return "AI Content Package";
  if (id.includes("meta-ads")) return "Meta Ads Management";
  if (id.includes("google-ads")) return "Google Ads Management";
  if (id.includes("snapchat-ads")) return "Snapchat Ads Management";
  if (id.includes("tiktok-ads")) return "TikTok Ads Management";
  if (id.includes("linkedin-ads")) return "LinkedIn Ads Management";
  if (id.includes("x-ads")) return "X Ads Management";
  if (id.includes("image-generator")) return "AI Image Generator";
  if (id.includes("reels-generator")) return "AI Reels Generator";
  if (id.includes("ai-captions")) return "AI Captions Tool";
  return planId;
}

function getPlanInterval(planId: string): string {
  const id = planId.toLowerCase();
  if (id.includes("yearly")) return "Yearly";
  if (id.includes("monthly")) return "Monthly";
  return "";
}

function tokenUsageRows(tokenCount: number): string {
  const imagesCount   = Math.floor(tokenCount / 10);
  const postsCount    = Math.floor(tokenCount / 5);
  const captionsCount = Math.floor(tokenCount / 2);
  const videosCount   = Math.floor(tokenCount / 50);
  const rows = [
    imagesCount  > 0 ? `<tr><td style="padding:3px 0;color:${BRAND_RED};font-weight:700">•</td><td style="padding:3px 8px;font-size:13px;color:#374151"><strong>${imagesCount}</strong> AI-generated images (10 tokens each)</td></tr>` : "",
    postsCount   > 0 ? `<tr><td style="padding:3px 0;color:${BRAND_RED};font-weight:700">•</td><td style="padding:3px 8px;font-size:13px;color:#374151"><strong>${postsCount}</strong> AI content posts (5 tokens each)</td></tr>` : "",
    captionsCount > 0 ? `<tr><td style="padding:3px 0;color:${BRAND_RED};font-weight:700">•</td><td style="padding:3px 8px;font-size:13px;color:#374151"><strong>${captionsCount}</strong> AI captions (2 tokens each)</td></tr>` : "",
    videosCount  > 0 ? `<tr><td style="padding:3px 0;color:${BRAND_RED};font-weight:700">•</td><td style="padding:3px 8px;font-size:13px;color:#374151"><strong>${videosCount}</strong> short video ads (50 tokens each)</td></tr>` : "",
  ].filter(Boolean).join("");
  return rows;
}

// ── sendSubscriptionCreatedEmail (rich receipt with icon) ──────────────────────

export async function sendSubscriptionCreatedEmail(
  email: string,
  plan: string,
  tokens?: number,
  priceDollars?: number,
  stripeSubscriptionId?: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const displayName = getPlanDisplayName(plan);
  const iconUrl     = getPlanIconUrl(plan);
  const interval    = getPlanInterval(plan);
  const tokenCount  = tokens ?? 0;
  const priceStr    = priceDollars !== undefined ? `$${priceDollars.toFixed(2)}` : "";
  const usageRows   = tokenUsageRows(tokenCount);

  const priceRow = priceStr
    ? `<div style="margin-left:auto;text-align:right"><p style="margin:0;font-size:20px;font-weight:900;color:#0F172A">${priceStr}</p></div>`
    : "";

  const body = `
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:18px;background:#ffffff;border:2px solid #E2E8F0;box-shadow:0 4px 12px rgba(0,0,0,0.08);margin-bottom:16px;padding:10px">
        <img src="${iconUrl}" width="48" height="48" alt="${displayName}" style="display:block;object-fit:contain;border-radius:6px" />
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#0F172A;letter-spacing:-0.02em">Payment Confirmed!</h1>
      <p style="margin:0;font-size:16px;color:#475569;line-height:1.6">
        Your <strong>${displayName}</strong> is now active.
      </p>
    </td></tr>
    <tr><td style="padding:16px 40px">
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:24px">
        <p style="margin:0 0 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B">Your Purchase</p>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <img src="${iconUrl}" width="40" height="40" style="border-radius:8px;display:block;object-fit:contain" />
          <div>
            <p style="margin:0;font-size:18px;font-weight:800;color:#0F172A">${displayName}</p>
            ${interval ? `<p style="margin:4px 0 0;font-size:14px;color:#64748B">${interval}</p>` : ""}
          </div>
          ${priceRow}
        </div>
        <div style="height:1px;background:#E2E8F0;margin-bottom:16px"></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:140px;background:#ffffff;border-radius:10px;padding:14px;border:1px solid #E2E8F0;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B">Tokens Granted</p>
            <p style="margin:0;font-size:22px;font-weight:900;color:${BRAND_RED}">${tokenCount.toLocaleString()}</p>
          </div>
          <div style="flex:1;min-width:140px;background:#ffffff;border-radius:10px;padding:14px;border:1px solid #E2E8F0;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B">Duration</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:#0F172A">${interval || "One-time"}</p>
          </div>
          <div style="flex:1;min-width:140px;background:#ffffff;border-radius:10px;padding:14px;border:1px solid #E2E8F0;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B">Status</p>
            <p style="margin:0;font-size:16px;font-weight:800;color:#16A34A">Active</p>
          </div>
        </div>
      </div>
    </td></tr>
    ${usageRows ? `<tr><td style="padding:8px 40px">
      <div style="background:rgba(22,163,74,0.04);border-radius:14px;padding:20px;border:1px solid rgba(22,163,74,0.12)">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#15803D">What you can do with ${tokenCount.toLocaleString()} tokens:</p>
        <table cellpadding="0" cellspacing="0">${usageRows}</table>
      </div>
    </td></tr>` : ""}
    <tr><td style="padding:24px 40px 36px;text-align:center">
      ${ctaButton("Go to Dashboard", `${SITE_URL}/dashboard`)}
    </td></tr>`;

  const text = `Payment Confirmed — WorldDigital.ai Corporation LLC\n\nYour ${displayName} is now active.\n\n${interval ? `Duration: ${interval}\n` : ""}Tokens granted: ${tokenCount.toLocaleString()}\nStatus: Active\n\nDashboard: ${SITE_URL}/dashboard${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: `Payment Confirmed — ${displayName}`, html: emailWrapper(body, email), text, recipientEmail: email });
    logger.info({ to: email, plan, tokens: tokenCount, price: priceDollars, subId: stripeSubscriptionId }, "Subscription confirmation email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Resend subscription confirmation email failed");
  }
}

export async function sendSubscriptionPausedEmail(email: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#FFF7ED;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="4" height="14" rx="1" fill="#EA580C"/><rect x="14" y="5" width="4" height="14" rx="1" fill="#EA580C"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Subscription paused</h1>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">
        Your WorldDigital.ai Corporation LLC subscription has been paused. You won't be charged while it's paused — resume anytime from your billing settings.
      </p>
    </td></tr>
    <tr><td style="padding:24px 40px 36px;text-align:center">
      ${ctaButton("Manage Billing", "https://worlddigital.ai/dashboard/billing")}
    </td></tr>`, email);

  const text = `Your WorldDigital.ai Corporation LLC subscription is paused\n\nYour subscription has been paused. Resume anytime:\nhttps://worlddigital.ai/dashboard/billing${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: "Your WorldDigital.ai Corporation LLC subscription is paused", html, text, recipientEmail: email });
    logger.info({ to: email }, "Subscription paused email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Resend subscription paused email failed");
  }
}

export async function sendSubscriptionResumedEmail(email: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#ECFDF5;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Welcome back!</h1>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">
        Your WorldDigital.ai Corporation LLC subscription is active again. Everything is ready to go.
      </p>
    </td></tr>
    <tr><td style="padding:24px 40px 36px;text-align:center">
      ${ctaButton("Go to Dashboard →", "https://worlddigital.ai/dashboard")}
    </td></tr>`, email);

  const text = `Your WorldDigital.ai Corporation LLC subscription is back on\n\nYour subscription is active again. Welcome back!\nhttps://worlddigital.ai/dashboard${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: "Your WorldDigital.ai Corporation LLC subscription is back on", html, text, recipientEmail: email });
    logger.info({ to: email }, "Subscription resumed email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Resend subscription resumed email failed");
  }
}

export async function sendSubscriptionWillEndEmail(email: string, endDate: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#FFFBEB;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4l3 3" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="#D97706" stroke-width="2"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Subscription ending soon</h1>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">
        Your WorldDigital.ai Corporation LLC subscription will end on <strong>${endDate}</strong>. Renew now to keep uninterrupted access to all features.
      </p>
    </td></tr>
    <tr><td style="padding:12px 40px 8px">
      <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:12px;padding:16px 20px;text-align:center">
        <p style="margin:0;font-size:14px;font-weight:600;color:#92400E">Access ends on ${endDate}</p>
      </div>
    </td></tr>
    <tr><td style="padding:24px 40px 36px;text-align:center">
      ${ctaButton("Renew Subscription", "https://worlddigital.ai/dashboard/billing")}
    </td></tr>`, email);

  const text = `Your WorldDigital.ai Corporation LLC subscription is ending soon\n\nYour subscription will end on ${endDate}. Renew:\nhttps://worlddigital.ai/dashboard/billing${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: "Your WorldDigital.ai Corporation LLC subscription is ending soon", html, text, recipientEmail: email });
    logger.info({ to: email, endDate }, "Subscription will-end email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Resend subscription will-end email failed");
  }
}

// ── sendSubscriptionCancelledByAdminEmail ─────────────────────────────────────

export async function sendSubscriptionCancelledByAdminEmail(
  email: string,
  name: string,
  opts: { immediately: boolean; periodEnd?: string }
): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  const firstName  = (name || "").split(" ")[0] || "there";
  const timingHtml = opts.immediately
    ? "Your subscription has been cancelled <strong>immediately</strong> and access has ended."
    : `Your subscription has been cancelled and will remain active until <strong>${opts.periodEnd || "the end of your billing period"}</strong>.`;
  const timingText = opts.immediately
    ? "Your subscription has been cancelled immediately and access has ended."
    : `Your subscription has been cancelled and will remain active until ${opts.periodEnd || "the end of your billing period"}.`;

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#FEF2F2;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18L18 6M6 6l12 12" stroke="#C13A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Subscription Cancelled</h1>
      <p style="margin:0;font-size:15px;color:#475569">Hi ${firstName},</p>
    </td></tr>
    <tr><td style="padding:12px 40px 8px">
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">${timingHtml}</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">If you believe this was done in error or have any questions, please reply to this email and our team will assist you right away.</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0">You can re-subscribe at any time from our website.</p>
    </td></tr>
    <tr><td style="padding:24px 40px 36px;text-align:center">
      ${ctaButton("Re-subscribe", "https://worlddigital.ai/subscribe")}
    </td></tr>`, email);

  const text = `Subscription Cancelled — WorldDigital.ai Corporation LLC\n\nHi ${firstName},\n\n${timingText}\n\nIf you believe this was done in error, please reply to this email.\n\nRe-subscribe: https://worlddigital.ai/subscribe${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: "Your WorldDigital.ai Corporation LLC subscription has been cancelled", html, text, recipientEmail: email });
    logger.info({ to: email, immediately: opts.immediately }, "Admin cancellation email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Admin cancellation email failed");
  }
}

// ── sendAccountDeletedByAdminEmail ────────────────────────────────────────────

export async function sendAccountDeletedByAdminEmail(email: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  const firstName = (name || "").split(" ")[0] || "there";

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#FEF2F2;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#C13A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Account Removed</h1>
      <p style="margin:0;font-size:15px;color:#475569">Hi ${firstName},</p>
    </td></tr>
    <tr><td style="padding:12px 40px 36px">
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">Your WorldDigital.ai Corporation LLC account and all associated data have been permanently removed from our system.</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">Any active subscription has been cancelled and you will not be charged again. If a refund is applicable, it will appear on your statement within 5–10 business days.</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0">If you believe this was done in error, please contact us at <a href="mailto:${FROM_EMAIL}" style="color:${BRAND_BLUE};font-weight:600;text-decoration:none">${FROM_EMAIL}</a>.</p>
    </td></tr>`);

  const text = `Account Removed — WorldDigital.ai Corporation LLC\n\nHi ${firstName},\n\nYour WorldDigital.ai Corporation LLC account and all associated data have been permanently removed from our system.\n\nAny active subscription has been cancelled and you will not be charged again.\n\nIf you believe this was done in error, contact us at ${FROM_EMAIL}.${textFooter()}`;

  try {
    await sendEmail({ resend, to: email, subject: "Your WorldDigital.ai Corporation LLC account has been removed", html, text });
    logger.info({ to: email }, "Account deletion email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Account deletion email failed");
  }
}

// ── sendSubscriptionPausedByAdminEmail ────────────────────────────────────────

export async function sendSubscriptionPausedByAdminEmail(email: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  const firstName = (name || "").split(" ")[0] || "there";

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#FFF7ED;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="4" height="14" rx="1" fill="#EA580C"/><rect x="14" y="5" width="4" height="14" rx="1" fill="#EA580C"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Subscription Paused</h1>
      <p style="margin:0;font-size:15px;color:#475569">Hi ${firstName},</p>
    </td></tr>
    <tr><td style="padding:12px 40px 36px">
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">Your WorldDigital.ai Corporation LLC subscription has been temporarily paused. You won't be charged during this time.</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0">If you have questions or would like to resume your account, please contact us at <a href="mailto:${FROM_EMAIL}" style="color:${BRAND_BLUE};font-weight:600;text-decoration:none">${FROM_EMAIL}</a>.</p>
    </td></tr>`, email);

  const text = `Subscription Paused — WorldDigital.ai Corporation LLC\n\nHi ${firstName},\n\nYour WorldDigital.ai Corporation LLC subscription has been temporarily paused. You won't be charged during this time.\n\nTo resume, contact us at ${FROM_EMAIL}${textFooter(email)}`;

  try {
    await sendEmail({ resend, to: email, subject: "Your WorldDigital.ai Corporation LLC subscription has been paused", html, text, recipientEmail: email });
    logger.info({ to: email }, "Admin subscription pause email sent");
  } catch (err) {
    logger.error({ err, to: email }, "Admin subscription pause email failed");
  }
}

// ── sendCareerNotificationEmail ───────────────────────────────────────────────

export interface CareerEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  experience: string;
  message: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  submittedAt: Date;
}

export interface CareerEmailResult {
  sent: boolean;
  error?: string;
}

const ADMIN_CAREER_EMAIL = "support@worlddigital.ai";

export async function sendCareerNotificationEmail(data: CareerEmailData): Promise<CareerEmailResult> {
  const resend = getResend();
  if (!resend) {
    const error = "Resend not configured — RESEND_API_KEY is missing";
    logger.warn("Career email skipped — Resend not configured");
    return { sent: false, error };
  }

  const fullName     = `${data.firstName} ${data.lastName}`;
  const submittedStr = data.submittedAt.toUTCString();

  function infoRow(label: string, value?: string | null): string {
    if (!value) return "";
    return `<tr>
      <td style="padding:8px 16px 8px 0;color:#64748B;font-size:13px;width:150px;vertical-align:top;white-space:nowrap;font-weight:600">${label}</td>
      <td style="padding:8px 0;color:#0F172A;font-size:13px;vertical-align:top">${value}</td>
    </tr>`;
  }

  const optionalLinks: string[] = [];
  if (data.linkedInUrl)   optionalLinks.push(`<a href="${data.linkedInUrl}" style="color:${BRAND_BLUE}">LinkedIn</a>`);
  if (data.portfolioUrl)  optionalLinks.push(`<a href="${data.portfolioUrl}" style="color:${BRAND_BLUE}">Portfolio</a>`);
  if (data.resumeUrl)     optionalLinks.push(`<a href="${data.resumeUrl}" style="color:${BRAND_BLUE}">Resume</a>`);
  if (data.coverLetterUrl) optionalLinks.push(`<a href="${data.coverLetterUrl}" style="color:${BRAND_BLUE}">Cover Letter</a>`);

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px">
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#0F172A">New Career Application</h1>
      <p style="margin:0;font-size:13px;color:#94A3B8">Received ${submittedStr}</p>
    </td></tr>
    <tr><td style="padding:12px 40px 8px">
      <div style="background:#F8FAFC;border-radius:12px;padding:20px;border:1px solid #E2E8F0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow("Position", data.position)}
          ${infoRow("Name", fullName)}
          ${infoRow("Email", `<a href="mailto:${data.email}" style="color:${BRAND_BLUE}">${data.email}</a>`)}
          ${infoRow("Phone", data.phone)}
          ${infoRow("Experience", data.experience)}
          ${optionalLinks.length > 0 ? infoRow("Links", optionalLinks.join(" · ")) : ""}
        </table>
      </div>
    </td></tr>
    <tr><td style="padding:12px 40px 8px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em">Cover Message</p>
      <div style="background:#FFFBEB;border-left:3px solid #FCD34D;border-radius:0 8px 8px 0;padding:16px 20px">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap">${data.message}</p>
      </div>
    </td></tr>
    <tr><td style="padding:20px 40px 36px;text-align:center">
      ${ctaButton(`Reply to ${data.firstName}`, `mailto:${data.email}`)}
    </td></tr>`);

  const textLines = [
    `New Career Application — WorldDigital.ai Corporation LLC`,
    `Received: ${submittedStr}`,
    "",
    `Position:   ${data.position}`,
    `Name:       ${fullName}`,
    `Email:      ${data.email}`,
    data.phone ? `Phone:      ${data.phone}` : "",
    `Experience: ${data.experience}`,
    data.linkedInUrl   ? `LinkedIn:   ${data.linkedInUrl}`   : "",
    data.portfolioUrl  ? `Portfolio:  ${data.portfolioUrl}`  : "",
    data.resumeUrl     ? `Resume:     ${data.resumeUrl}`     : "",
    data.coverLetterUrl ? `Cover Ltr: ${data.coverLetterUrl}` : "",
    "",
    "Message:",
    data.message,
  ].filter(Boolean).join("\n");

  try {
    await resend.emails.send({
      from:    FROM,
      to:      [ADMIN_CAREER_EMAIL],
      replyTo: data.email,
      subject: `New Application: ${data.position} — ${fullName}`,
      html,
      text:    textLines + textFooter(),
    });

    logger.info({ position: data.position, applicant: fullName }, "Career notification email sent");
    return { sent: true };
  } catch (err) {
    logger.error({ err }, "Career notification email failed");
    return { sent: false, error: err instanceof Error ? err.message : "send failed" };
  }
}

// ── sendCareerConfirmationEmail ───────────────────────────────────────────────

export async function sendCareerConfirmationEmail(data: CareerEmailData): Promise<CareerEmailResult> {
  const resend = getResend();
  if (!resend) return { sent: false, error: "Resend not configured" };

  const firstName = data.firstName || "there";

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#EFF6FF;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Application Received!</h1>
      <p style="margin:0;font-size:15px;color:#475569">Hi ${firstName},</p>
    </td></tr>
    <tr><td style="padding:12px 40px 36px">
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">
        Thank you for applying for the <strong>${data.position}</strong> position at WorldDigital.ai Corporation LLC. We've received your application and will review it carefully.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 12px">
        Our team will be in touch within a few business days. If you have any questions in the meantime, feel free to reply to this email.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0">
        Thank you for your interest in joining WorldDigital.ai Corporation LLC!
      </p>
    </td></tr>`, data.email);

  const text = `Application Received — WorldDigital.ai Corporation LLC\n\nHi ${firstName},\n\nThank you for applying for the ${data.position} position. We've received your application and will be in touch within a few business days.${textFooter(data.email)}`;

  try {
    await sendEmail({ resend, to: data.email, subject: `We received your application — ${data.position}`, html, text, recipientEmail: data.email });
    logger.info({ to: data.email, position: data.position }, "Career confirmation email sent");
    return { sent: true };
  } catch (err) {
    logger.error({ err, to: data.email }, "Career confirmation email failed");
    return { sent: false, error: err instanceof Error ? err.message : "send failed" };
  }
}

// ── sendTestEmail (admin) ─────────────────────────────────────────────────────

export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { success: false, error: "RESEND_API_KEY not configured" };

  const html = emailWrapper(`
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:#EFF6FF;margin-bottom:16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.02em">Test Email</h1>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">
        This is a test email from your WorldDigital.ai Corporation LLC admin panel. If you're seeing this, your email pipeline is working correctly!
      </p>
    </td></tr>
    <tr><td style="padding:20px 40px 36px">
      <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;padding:16px 20px;text-align:center">
        <p style="margin:0;font-size:14px;font-weight:600;color:#15803D">✓ Resend API connected · Sender verified · Template rendering correctly</p>
      </div>
    </td></tr>`);

  const text = `Test Email — WorldDigital.ai Corporation LLC\n\nThis is a test email from your WorldDigital.ai Corporation LLC admin panel. If you're seeing this, your email pipeline is working correctly!\n\nResend API: connected\nSender: ${FROM_EMAIL}\nTemplate: rendering correctly${textFooter()}`;

  try {
    await sendEmail({ resend, to, subject: "Test Email — WorldDigital.ai Corporation LLC", html, text });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "send failed" };
  }
}

// ── sendTokenPurchaseEmail ─────────────────────────────────────────────────────

export async function sendTokenPurchaseEmail(
  to: string,
  tokens: number,
  dollars: number,
  tierLabel?: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const subject = `Your ${tokens.toLocaleString()} tokens are ready — WorldDigital.ai Corporation LLC`;

  const imagesCount  = Math.floor(tokens / 10);
  const postsCount   = Math.floor(tokens / 5);
  const captionsCount = Math.floor(tokens / 2);
  const videosCount  = Math.floor(tokens / 50);

  const usageRows = [
    imagesCount  > 0 ? `<tr><td style="padding:3px 0;color:${BRAND_RED};font-weight:700">•</td><td style="padding:3px 8px;font-size:13px;color:#374151"><strong>${imagesCount}</strong> AI-generated images (10 tokens each)</td></tr>` : "",
    postsCount   > 0 ? `<tr><td style="padding:3px 0;color:${BRAND_RED};font-weight:700">•</td><td style="padding:3px 8px;font-size:13px;color:#374151"><strong>${postsCount}</strong> AI content posts (5 tokens each)</td></tr>` : "",
    captionsCount > 0 ? `<tr><td style="padding:3px 0;color:${BRAND_RED};font-weight:700">•</td><td style="padding:3px 8px;font-size:13px;color:#374151"><strong>${captionsCount}</strong> AI captions (2 tokens each)</td></tr>` : "",
    videosCount  > 0 ? `<tr><td style="padding:3px 0;color:${BRAND_RED};font-weight:700">•</td><td style="padding:3px 8px;font-size:13px;color:#374151"><strong>${videosCount}</strong> short video ads (50 tokens each)</td></tr>` : "",
  ].filter(Boolean).join("");

  const body = `
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-block;background:rgba(22,163,74,0.1);border-radius:50%;padding:16px;margin-bottom:16px">
        <img src="https://worlddigital.ai/icons/wdlogo.jpeg" width="40" height="40" alt="" style="border-radius:8px;display:block" />
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#111827">Payment Confirmed!</h1>
      <p style="margin:0;font-size:16px;color:#6B7280">${tokens.toLocaleString()} tokens have been added to your account</p>
    </td></tr>
    <tr><td style="padding:16px 40px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:16px;border:1px solid rgba(0,0,0,0.06)">
        <tr>
          <td style="text-align:center;padding:16px;border-right:1px solid rgba(0,0,0,0.08)">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF">Amount Paid</p>
            <p style="margin:0;font-size:22px;font-weight:900;color:#111827">$${dollars.toFixed(2)}</p>
          </td>
          <td style="text-align:center;padding:16px;border-right:1px solid rgba(0,0,0,0.08)">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF">Tokens Added</p>
            <p style="margin:0;font-size:22px;font-weight:900;color:${BRAND_RED}">${tokens.toLocaleString()}</p>
          </td>
          <td style="text-align:center;padding:16px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF">Value Tier</p>
            <p style="margin:0;font-size:16px;font-weight:800;color:#16A34A">${tierLabel ?? "Token Pack"}</p>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:8px 40px">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151">
        Your tokens never expire and can be used for any AI tool — image generation, caption writing, content creation, and more.
      </p>
      <div style="background:rgba(193,58,42,0.04);border-radius:14px;padding:20px;border:1px solid rgba(193,58,42,0.1)">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND_RED}">What you can do with ${tokens.toLocaleString()} tokens:</p>
        <table cellpadding="0" cellspacing="0">${usageRows}</table>
      </div>
    </td></tr>
    <tr><td style="padding:24px 40px 36px;text-align:center">
      ${ctaButton("View Your Token Balance →", `${SITE_URL}/dashboard/usage`)}
    </td></tr>`;

  const html = emailWrapper(body, to);
  const text = `Payment Confirmed — WorldDigital.ai Corporation LLC\n\n${tokens.toLocaleString()} tokens have been added to your account.\n\nAmount paid: $${dollars.toFixed(2)}\nTokens added: ${tokens.toLocaleString()}\nValue tier: ${tierLabel ?? "Token Pack"}\n\nYour tokens never expire. View your balance: ${SITE_URL}/dashboard/usage${textFooter()}`;

  await sendEmail({ resend, to, subject, html, text, recipientEmail: to });
}

// ── sendGiftedServiceEmail ─────────────────────────────────────────────────────

export async function sendGiftedServiceEmail(
  to: string,
  recipientName: string,
  serviceName: string,
  tokens: number,
  permanent: boolean,
  months?: number
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const firstName   = recipientName.split(" ")[0] || "there";
  const iconUrl     = getPlanIconUrl(serviceName);
  const displayName = getPlanDisplayName(serviceName);
  const interval    = getPlanInterval(serviceName);
  const durationStr = permanent ? "Permanent" : `${months ?? 1} Month${(months ?? 1) !== 1 ? "s" : ""}`;
  const usageRows   = tokenUsageRows(tokens);
  const subject     = `You've been gifted ${displayName} — WorldDigital.ai Corporation LLC`;

  const body = `
    <tr><td style="padding:32px 40px 8px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,#C13A2A,#4285C7);box-shadow:0 6px 20px rgba(193,58,42,0.25);margin-bottom:16px;padding:16px">
        <img src="${iconUrl}" width="48" height="48" alt="${displayName}" style="display:block;object-fit:contain;border-radius:6px;filter:brightness(0) invert(1)" />
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#0F172A;letter-spacing:-0.02em">You've received a gift!</h1>
      <p style="margin:0;font-size:16px;color:#475569;line-height:1.6">
        Hi ${firstName} — the WorldDigital.ai team has gifted you <strong>${displayName}</strong>.
      </p>
    </td></tr>
    <tr><td style="padding:16px 40px">
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:24px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <img src="${iconUrl}" width="40" height="40" style="border-radius:8px;display:block;object-fit:contain" />
          <div>
            <p style="margin:0;font-size:18px;font-weight:800;color:#0F172A">${displayName}</p>
            ${interval ? `<p style="margin:4px 0 0;font-size:14px;color:#64748B">${interval}</p>` : ""}
          </div>
          <div style="margin-left:auto;background:linear-gradient(135deg,#C13A2A,#4285C7);color:#fff;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Gifted</div>
        </div>
        <div style="height:1px;background:#E2E8F0;margin-bottom:16px"></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:140px;background:#ffffff;border-radius:10px;padding:14px;border:1px solid #E2E8F0;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B">Duration</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:#0F172A">${durationStr}</p>
          </div>
          <div style="flex:1;min-width:140px;background:#ffffff;border-radius:10px;padding:14px;border:1px solid #E2E8F0;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B">Tokens Added</p>
            <p style="margin:0;font-size:22px;font-weight:900;color:${BRAND_RED}">${tokens.toLocaleString()}</p>
          </div>
          <div style="flex:1;min-width:140px;background:#ffffff;border-radius:10px;padding:14px;border:1px solid #E2E8F0;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B">Status</p>
            <p style="margin:0;font-size:16px;font-weight:800;color:#16A34A">Active Now</p>
          </div>
        </div>
      </div>
    </td></tr>
    ${usageRows ? `<tr><td style="padding:8px 40px">
      <div style="background:rgba(22,163,74,0.04);border-radius:14px;padding:20px;border:1px solid rgba(22,163,74,0.12)">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#15803D">What you can do with ${tokens.toLocaleString()} tokens:</p>
        <table cellpadding="0" cellspacing="0">${usageRows}</table>
      </div>
    </td></tr>` : ""}
    <tr><td style="padding:24px 40px 36px;text-align:center">
      <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.7">
        Your access is active immediately. Head to your dashboard to start using all features right away.
      </p>
      ${ctaButton("Go to Your Dashboard", `${SITE_URL}/dashboard`)}
    </td></tr>`;

  const text = `You've been gifted ${displayName} — WorldDigital.ai Corporation LLC\n\nHi ${firstName}! The WorldDigital.ai team has gifted you ${displayName}.\n\nDuration: ${durationStr}\nTokens added: ${tokens.toLocaleString()}\nStatus: Active immediately\n\nDashboard: ${SITE_URL}/dashboard${textFooter(to)}`;

  try {
    await sendEmail({ resend, to, subject, html: emailWrapper(body, to), text, recipientEmail: to });
    logger.info({ to, serviceName, tokens, permanent, months }, "Gifted service confirmation email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send gifted service confirmation email");
  }
}
