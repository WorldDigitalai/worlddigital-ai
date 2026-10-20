"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../layout";

interface SocialDebug {
  checked_at: string;
  dry_run_mode: boolean;
  summary: {
    readyToPost: (string | false)[];
    needsOAuth: (string | false)[];
    needsAppApproval: (string | false)[];
    notConfigured: (string | false)[];
  };
  meta: { configured: boolean; canPostFacebook: boolean; canPostInstagram: boolean; tokenValid: boolean; pageName: string | null; issues: string[] };
  x: { configured: boolean; postingReady: boolean; userHandle: string | null; issues: string[] };
  linkedin: { clientConfigured: boolean; postingReady: boolean; accessTokenConfigured: boolean; issues: string[] };
  youtube: { apiKeyConfigured: boolean; oauthConfigured: boolean; uploadReady: boolean; issues: string[] };
  tiktok: { siteVerificationConfigured: boolean; postingReady: boolean; issues: string[] };
  snapchat: { clientConfigured: boolean; marketingApiReady: boolean; accessTokenSet: boolean; issues: string[] };
}

interface IntegrationHealth {
  mongo?: { connected: boolean };
  stripe?: { configured: boolean };
  sendgrid?: { configured: boolean };
  openai?: { configured: boolean };
  social?: Record<string, boolean>;
}

interface CheckCard {
  label: string;
  status: "ok" | "warn" | "error" | "pending";
  detail: string;
  issues?: string[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  ok:      { bg: "rgba(22,163,74,0.08)",    text: "#16A34A", dot: "#16A34A" },
  warn:    { bg: "rgba(217,119,6,0.08)",    text: "#D97706", dot: "#D97706" },
  error:   { bg: "rgba(193,58,42,0.08)",    text: "#C13A2A", dot: "#C13A2A" },
  pending: { bg: "rgba(107,114,128,0.08)",  text: "#6B7280", dot: "#9CA3AF" },
};

function StatusBadge({ status }: { status: CheckCard["status"] }) {
  const c = STATUS_COLORS[status];
  const labels = { ok: "● Healthy", warn: "⚠ Warning", error: "✕ Issue", pending: "○ Checking…" };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>
      {labels[status]}
    </span>
  );
}

function CheckRow({ card }: { card: CheckCard }) {
  const [open, setOpen] = useState(false);
  const hasIssues = card.issues && card.issues.length > 0;
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => hasIssues && setOpen(o => !o)}
        style={{ cursor: hasIssues ? "pointer" : "default" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>{card.label}</p>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{card.detail}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <StatusBadge status={card.status} />
          {hasIssues && (
            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "#9CA3AF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>
      {open && hasIssues && (
        <div className="px-5 pb-3">
          <ul className="space-y-1.5">
            {card.issues!.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#374151" }}>
                <span className="shrink-0 mt-0.5" style={{ color: "#C13A2A" }}>→</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SystemAuditPage() {
  const { token } = useAdminAuth();
  const [social, setSocial] = useState<SocialDebug | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    try {
      const [socialRes, intRes] = await Promise.all([
        fetch("/api/social/debug").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/v1/admin/integrations", { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setSocial(socialRes);
      setIntegrations(intRes);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { runAudit(); }, [runAudit]);

  const checks: CheckCard[] = social ? [
    {
      label: "AI Engine (CHAT_BOT)",
      status: integrations?.openai?.configured ? "ok" : "error",
      detail: integrations?.openai?.configured
        ? "AI generation is active and ready"
        : "CHAT_BOT environment variable is not set — content generation will fall back to samples",
      issues: integrations?.openai?.configured ? [] : ["Set the CHAT_BOT environment variable to your OpenAI-compatible API key"],
    },
    {
      label: "Database (MongoDB)",
      status: integrations?.mongo?.connected ? "ok" : "error",
      detail: integrations?.mongo?.connected ? "MongoDB is connected" : "MongoDB connection failed — all features requiring data storage will be broken",
      issues: integrations?.mongo?.connected ? [] : ["Check MONGODB_URI environment variable"],
    },
    {
      label: "Payments (Stripe)",
      status: integrations?.stripe?.configured ? "ok" : "warn",
      detail: integrations?.stripe?.configured ? "Stripe is configured and active" : "Stripe keys are not configured — subscription checkout will fail",
      issues: integrations?.stripe?.configured ? [] : ["Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET"],
    },
    {
      label: "Email (SendGrid)",
      status: integrations?.sendgrid?.configured ? "ok" : "warn",
      detail: integrations?.sendgrid?.configured ? "SendGrid is configured" : "SendGrid is not configured — transactional emails will not be sent",
      issues: integrations?.sendgrid?.configured ? [] : ["Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL"],
    },
    {
      label: "Meta (Facebook + Instagram)",
      status: social.meta.canPostFacebook || social.meta.canPostInstagram ? "ok" : social.meta.configured ? "warn" : "error",
      detail: social.meta.canPostFacebook && social.meta.canPostInstagram
        ? `Connected — posting as ${social.meta.pageName || "page"}`
        : social.meta.configured
        ? `Partially configured — ${social.meta.canPostFacebook ? "Facebook ✓" : "Facebook ✗"}  ${social.meta.canPostInstagram ? "Instagram ✓" : "Instagram ✗"}`
        : "Meta integration not configured",
      issues: social.meta.issues,
    },
    {
      label: "X / Twitter",
      status: social.x.postingReady ? "ok" : social.x.configured ? "warn" : "error",
      detail: social.x.postingReady
        ? `Connected as @${social.x.userHandle}`
        : social.x.configured ? "Credentials present but posting not confirmed" : "X integration not configured",
      issues: social.x.issues,
    },
    {
      label: "LinkedIn",
      status: social.linkedin.postingReady ? "ok" : social.linkedin.clientConfigured ? "warn" : "error",
      detail: social.linkedin.postingReady
        ? "Connected and ready to post"
        : social.linkedin.clientConfigured
        ? "OAuth token missing — LinkedIn posting unavailable"
        : "LinkedIn not configured",
      issues: social.linkedin.issues,
    },
    {
      label: "YouTube Shorts",
      status: social.youtube.uploadReady ? "ok" : social.youtube.apiKeyConfigured ? "warn" : "error",
      detail: social.youtube.uploadReady
        ? "OAuth configured — video upload ready"
        : social.youtube.apiKeyConfigured
        ? "API key set but OAuth not configured — upload unavailable"
        : "YouTube not configured",
      issues: social.youtube.issues,
    },
    {
      label: "TikTok",
      status: social.tiktok.postingReady ? "ok" : "warn",
      detail: social.tiktok.postingReady
        ? "TikTok posting ready"
        : "TikTok requires Content Posting API approval from TikTok",
      issues: social.tiktok.issues,
    },
    {
      label: "Snapchat Ads",
      status: social.snapchat.marketingApiReady ? "ok" : social.snapchat.clientConfigured ? "warn" : "error",
      detail: social.snapchat.marketingApiReady
        ? "Snapchat Marketing API ready"
        : social.snapchat.clientConfigured
        ? "OAuth credentials present — check token expiry at /admin/integrations"
        : "Snapchat not configured",
      issues: social.snapchat.issues,
    },
    {
      label: "Dry-Run Mode (Social)",
      status: social.dry_run_mode ? "warn" : "ok",
      detail: social.dry_run_mode
        ? "SOCIAL_DRY_RUN=true — posts are simulated, not actually sent to platforms"
        : "Live mode — posts will be sent to real platform accounts",
      issues: social.dry_run_mode ? ["Disable SOCIAL_DRY_RUN to enable real publishing"] : [],
    },
  ] : [];

  const totalChecks = checks.length;
  const healthy = checks.filter(c => c.status === "ok").length;
  const warnings = checks.filter(c => c.status === "warn").length;
  const errors = checks.filter(c => c.status === "error").length;

  const overallStatus = errors > 0 ? "error" : warnings > 0 ? "warn" : "ok";
  const overallColors = STATUS_COLORS[overallStatus];

  const platformsReady = social ? social.summary.readyToPost.filter(Boolean) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#111827" }}>System Audit</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Live health check of all integrations, AI, database, and platform connections.
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-check
            </>
          )}
        </button>
      </div>

      {/* Summary cards */}
      {!loading && checks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 col-span-2" style={{ background: overallColors.bg, border: `1px solid ${overallColors.dot}30` }}>
            <p className="text-3xl font-black" style={{ color: overallColors.dot }}>
              {errors > 0 ? "Issues Found" : warnings > 0 ? "Warnings" : "All Clear"}
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: overallColors.text }}>
              {healthy}/{totalChecks} checks healthy
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-3xl font-black" style={{ color: "#C13A2A" }}>{errors}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Critical issues</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-3xl font-black" style={{ color: "#D97706" }}>{warnings}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Warnings</p>
          </div>
        </div>
      )}

      {/* Platform publishing readiness */}
      {!loading && social && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <p className="text-sm font-black" style={{ color: "#111827" }}>Social Publishing Readiness</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "facebook",  label: "Facebook",  ready: social.meta.canPostFacebook },
                { key: "instagram", label: "Instagram", ready: social.meta.canPostInstagram },
                { key: "x",        label: "X / Twitter", ready: social.x.postingReady },
                { key: "linkedin", label: "LinkedIn",  ready: social.linkedin.postingReady },
                { key: "youtube",  label: "YouTube",   ready: social.youtube.uploadReady },
                { key: "tiktok",   label: "TikTok",    ready: social.tiktok.postingReady },
                { key: "snapchat", label: "Snapchat",  ready: social.snapchat.marketingApiReady },
              ].map(({ key, label, ready }) => (
                <div key={key} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: ready ? "rgba(22,163,74,0.06)" : "rgba(0,0,0,0.03)", border: `1px solid ${ready ? "rgba(22,163,74,0.2)" : "rgba(0,0,0,0.07)"}` }}>
                  <span className="text-sm font-bold" style={{ color: ready ? "#16A34A" : "#9CA3AF" }}>{ready ? "●" : "○"}</span>
                  <span className="text-xs font-semibold" style={{ color: ready ? "#111827" : "#9CA3AF" }}>{label}</span>
                </div>
              ))}
            </div>
            {platformsReady.length > 0 && (
              <p className="text-xs mt-3 font-medium" style={{ color: "#16A34A" }}>
                Ready to post on: {platformsReady.join(", ")}
              </p>
            )}
            {social.dry_run_mode && (
              <p className="text-xs mt-2 font-bold" style={{ color: "#D97706" }}>
                ⚠ Dry-run mode is ON — posts are simulated
              </p>
            )}
          </div>
        </div>
      )}

      {/* Individual checks */}
      {loading ? (
        <div className="rounded-2xl p-10 flex flex-col items-center gap-3" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <svg className="w-8 h-8 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: "#374151" }}>Running system audit…</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <p className="text-sm font-black" style={{ color: "#111827" }}>Integration Health Checks</p>
            {lastChecked && (
              <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
          {checks.length > 0 ? (
            checks.map((c, i) => <CheckRow key={i} card={c} />)
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: "#6B7280" }}>Unable to load audit data. Check API server logs.</p>
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Manage Integrations", href: "/admin/integrations", color: "#4285C7" },
            { label: "Feature Flags", href: "/admin/feature-flags", color: "#7C3AED" },
            { label: "Environment Secrets", href: "/admin/secret-health", color: "#C13A2A" },
          ].map(({ label, href, color }) => (
            <a key={href} href={href} className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", color }}>
              {label}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
