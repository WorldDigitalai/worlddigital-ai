"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAdminAuth } from "../layout";
import { getPlatformIcon } from "../../../lib/platformIcons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SecretInfo { key: string; present: boolean; masked: string }

interface MetaLive {
  configured: boolean; tokenValid: boolean; tokenMasked: string | null;
  pagesFound: boolean; pageName: string | null;
  instagramBusinessFound: boolean;
  canPostFacebook: boolean; canPostInstagram: boolean;
  issues: string[];
}

interface ResendLive {
  apiKeyPresent: boolean;
  apiKeyValid: boolean;
  fromEmail: string;
  testEmailReady: boolean;
  apiReachable: boolean;
  domainsFound: string[];
  error: string | null;
}

interface GoogleOAuthHealth {
  clientIdPresent: boolean;
  clientSecretPresent: boolean;
  redirectUriConfigured: boolean;
  redirectUri: string | null;
  callbackPath: string;
  canonicalCallbackUrl: string;
  oauthReady: boolean;
  issues: string[];
  secrets: Record<string, SecretInfo>;
}

interface GoogleSearchHealth {
  siteVerificationPresent: boolean;
  siteVerificationMasked: string | null;
  searchConsoleConfigured: boolean;
  issues: string[];
  secrets: Record<string, SecretInfo>;
}

interface XLive {
  configured: boolean; credentialsValid: boolean; userHandle: string | null;
  readWriteAccess: boolean; postingReady: boolean; issues: string[];
}
interface LinkedInLive {
  clientConfigured: boolean; accessTokenConfigured: boolean; accessTokenMasked: string | null;
  organizationConfigured: boolean; postingReady: boolean; issues: string[];
}
interface SnapchatLive {
  clientConfigured: boolean; marketingApiReady: boolean;
  accessTokenMasked?: string | null; tokenExpired?: boolean; canRefresh?: boolean;
  issues: string[];
}
interface YouTubeLive {
  apiKeyConfigured: boolean; apiKeyValid: boolean; apiKeyMasked: string | null;
  oauthConfigured: boolean; uploadReady: boolean; issues: string[];
}

interface HealthData {
  checkedAt: string;
  envNote: string;
  meta: { live: MetaLive; secrets: Record<string, SecretInfo> };
  resend: { live: ResendLive; secrets: Record<string, SecretInfo> };
  stripe: { mode: string; secrets: Record<string, SecretInfo> };
  snapchat: { live?: SnapchatLive; secrets: Record<string, SecretInfo> };
  google: { secrets: Record<string, SecretInfo> };
  googleOAuth: GoogleOAuthHealth;
  googleSearch: GoogleSearchHealth;
  linkedin: { live?: LinkedInLive; secrets: Record<string, SecretInfo> };
  youtube: { live?: YouTubeLive; secrets: Record<string, SecretInfo> };
  x: { live?: XLive; secrets: Record<string, SecretInfo> };
  tiktok: { secrets: Record<string, SecretInfo> };
  ai: { secrets: Record<string, SecretInfo> };
  aws: { secrets: Record<string, SecretInfo> };
}

interface AICapabilities {
  keyPresent: boolean;
  activeKeyName: string | null;
  textGenerationReady: boolean;
  imageGenerationReady: boolean;
  videoGenerationReady: boolean;
  textGenerationError?: string;
  imageGenerationError?: string;
  videoNote: string;
  checkedAt: string;
}

interface VideoCapabilityResult {
  available: boolean;
  keyPresent: boolean;
  activeKeyName: string | null;
  reason: string;
  videoModels: string[];
  checkedAt: string;
}

interface TikTokStatus {
  clientKeySet: boolean;
  clientSecretSet: boolean;
  accessTokenSet: boolean;
  accessTokenMasked: string | null;
  oauthReady: boolean;
  postingReady: boolean;
  callbackUrl: string;
  issues: string[];
}

interface TikTokOAuthResult {
  success: boolean;
  accessTokenMasked: string;
  refreshTokenMasked: string | null;
  openId: string;
  expiresIn: number;
  scope: string;
  TIKTOK_ACCESS_TOKEN: string;
  TIKTOK_REFRESH_TOKEN: string | null;
  note: string;
}

interface SocialDebugResult {
  checked_at: string;
  dry_run_mode: boolean;
  summary: { readyToPost: string[]; needsOAuth: string[]; needsAppApproval: string[]; notConfigured: string[]; tokenExpiringSoon?: string[] };
  meta: { configured: boolean; tokenValid: boolean; tokenMasked: string | null; pagesFound: boolean; pageName: string | null; instagramBusinessFound: boolean; canPostFacebook: boolean; canPostInstagram: boolean; issues: string[] };
  tiktok: { clientKeySet: boolean; accessTokenSet: boolean; openIdSet: boolean; accessTokenMasked: string | null; postingReady: boolean; awaitingApproval: boolean; issues: string[]; note?: string };
  youtube: { apiKeyConfigured: boolean; apiKeyValid: boolean; apiKeyMasked: string | null; oauthConfigured: boolean; uploadReady: boolean; issues: string[] };
  linkedin: { clientConfigured: boolean; accessTokenConfigured: boolean; accessTokenMasked: string | null; organizationConfigured: boolean; postingReady: boolean; tokenExpiresAt: string | null; daysUntilExpiry: number | null; tokenExpiringSoon: boolean; tokenRefreshAvailable: boolean; tokenRefreshFailed: boolean; autoRefreshed: boolean; issues: string[] };
  x: { configured: boolean; credentialsValid: boolean; userHandle: string | null; readWriteAccess: boolean; postingReady: boolean; issues: string[] };
  snapchat: { note?: string; adsSupported?: boolean; organicPosting?: boolean; clientIdSet: boolean; clientSecretSet: boolean; accessTokenSet: boolean; refreshTokenSet: boolean; adAccountIdSet: boolean; accessTokenMasked: string | null; refreshTokenMasked: string | null; clientConfigured: boolean; marketingApiReady: boolean; tokenExpired: boolean; canRefresh: boolean; issues: string[]; oauthSetupUrl: string };
}

interface IntegrationEvent {
  _id: string; eventType: string; status: string;
  summary: Record<string, unknown>; receivedAt: string;
}

type SocialLevel = "ready" | "oauth" | "approval" | "partial" | "missing";

// ── Secret Resolver types ─────────────────────────────────────────────────────

interface CandidateResult {
  key: string;
  present: boolean;
  masked: string | null;
  isActive: boolean;
}

interface ResolvedGroup {
  label: string;
  required: boolean;
  hint?: string;
  activeKey: string | null;
  activeMasked: string | null;
  candidates: CandidateResult[];
  conflict: boolean;
  conflictingKeys: string[];
}

interface ResolvedIntegration {
  id: string;
  name: string;
  groups: ResolvedGroup[];
  fullyResolved: boolean;
  missingRequired: string[];
  conflicts: string[];
  presentCount: number;
  requiredCount: number;
}

interface ResolverScanResult {
  scannedAt: string;
  summary: { total: number; fullyResolved: number; hasConflicts: number; hasMissing: number };
  integrations: ResolvedIntegration[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<SocialLevel, { label: string; bg: string; color: string }> = {
  ready:    { label: "Ready to publish", bg: "rgba(22,163,74,0.1)",    color: "#16A34A" },
  oauth:    { label: "Needs OAuth",      bg: "rgba(217,119,6,0.1)",    color: "#D97706" },
  approval: { label: "Needs approval",   bg: "rgba(124,58,237,0.1)",   color: "#7C3AED" },
  partial:  { label: "Partially set up", bg: "rgba(37,99,235,0.1)",    color: "#2563EB" },
  missing:  { label: "Not configured",   bg: "rgba(0,0,0,0.05)",       color: "#6B7280" },
};

function socialLevel(platform: string, d: SocialDebugResult): SocialLevel {
  if (d.summary.readyToPost.includes(platform)) return "ready";
  if (d.summary.needsOAuth.includes(platform)) return "oauth";
  if (d.summary.needsAppApproval.includes(platform)) return "approval";
  if (d.summary.notConfigured.includes(platform)) return "missing";
  return "partial";
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlatformIcon({ platform, size = 20 }: { platform: string; size?: number }) {
  return (
    <img
      src={getPlatformIcon(platform)}
      alt={platform}
      width={size}
      height={size}
      style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}

function LevelBadge({ level }: { level: SocialLevel }) {
  const s = LEVEL_STYLE[level];
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function SecretRow({ s }: { s: SecretInfo }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0 text-xs" style={{ borderColor: "#F1F5F9" }}>
      <span className="font-mono" style={{ color: "#64748B" }}>{s.key}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono" style={{ color: "#94A3B8" }}>{s.masked}</span>
        <span className={`w-2 h-2 rounded-full`} style={{ background: s.present ? "#16A34A" : "#EF4444" }} />
      </div>
    </div>
  );
}

interface ManageLink { label: string; url: string }

interface PlatformCardProps {
  platform: string;
  name: string;
  level: SocialLevel;
  details: Array<{ label: string; value: string | boolean | null }>;
  issues: string[];
  extra?: React.ReactNode;
  manageLinks?: ManageLink[];
}

const PLATFORM_MANAGE_LINKS: Record<string, ManageLink[]> = {
  meta: [
    { label: "Meta Business Suite",        url: "https://business.facebook.com" },
    { label: "Meta Developers",            url: "https://developers.facebook.com/apps" },
    { label: "Page Settings",              url: "https://www.facebook.com/settings?tab=pages" },
    { label: "Instagram Linked Accounts",  url: "https://www.instagram.com/accounts/linked_accounts/" },
  ],
  tiktok: [
    { label: "TikTok Developers",          url: "https://developers.tiktok.com" },
    { label: "TikTok Business Center",     url: "https://business.tiktok.com" },
    { label: "TikTok Ads",                 url: "https://ads.tiktok.com" },
    { label: "App Review",                 url: "https://developers.tiktok.com/apps/" },
    { label: "Site Verification",          url: "https://developers.tiktok.com/doc/tiktok-pixel-website-integration/" },
  ],
  youtube: [
    { label: "YouTube Studio",             url: "https://studio.youtube.com" },
    { label: "Google Cloud Credentials",   url: "https://console.cloud.google.com/apis/credentials" },
    { label: "OAuth Playground",           url: "https://developers.google.com/oauthplayground/" },
    { label: "YouTube Data API",           url: "https://console.cloud.google.com/apis/library/youtube.googleapis.com" },
  ],
  linkedin: [
    { label: "LinkedIn Developers",        url: "https://www.linkedin.com/developers/apps" },
    { label: "Company Page Admin",         url: "https://www.linkedin.com/company/admin/overview" },
  ],
  x: [
    { label: "X Developer Portal",         url: "https://developer.x.com/en/portal/dashboard" },
    { label: "App Permissions",            url: "https://developer.x.com/en/portal/projects-and-apps" },
  ],
  snapchat: [
    { label: "Snapchat Business Manager",  url: "https://business.snapchat.com" },
    { label: "Snapchat Ads Manager",       url: "https://ads.snapchat.com" },
    { label: "Snap Developers",            url: "https://developers.snap.com" },
    { label: "Marketing API Docs",         url: "https://marketingapi.snapchat.com/docs/" },
    { label: "OAuth / Access Token",       url: "https://developers.snap.com/api/marketing-api/guides/oauth/" },
    { label: "Ad Account Settings",        url: "https://ads.snapchat.com/settings" },
  ],
  google: [
    { label: "Google Cloud Credentials",   url: "https://console.cloud.google.com/apis/credentials" },
    { label: "OAuth Consent Screen",       url: "https://console.cloud.google.com/apis/credentials/consent" },
    { label: "Google Ads Manager",         url: "https://ads.google.com" },
    { label: "Google Ads API Center",      url: "https://console.cloud.google.com/apis/library/googleads.googleapis.com" },
    { label: "Search Console",             url: "https://search.google.com/search-console" },
    { label: "GA4 Property",               url: "https://analytics.google.com" },
    { label: "Google Tag Manager",         url: "https://tagmanager.google.com" },
    { label: "Sitemap",                    url: "https://search.google.com/search-console/sitemaps" },
    { label: "URL Inspection",             url: "https://search.google.com/search-console/inspect" },
  ],
  stripe: [
    { label: "Stripe Dashboard",           url: "https://dashboard.stripe.com" },
    { label: "Products / Prices",          url: "https://dashboard.stripe.com/products" },
    { label: "Webhooks",                   url: "https://dashboard.stripe.com/webhooks" },
    { label: "API Keys",                   url: "https://dashboard.stripe.com/apikeys" },
  ],
  resend: [
    { label: "Resend Dashboard",           url: "https://resend.com/overview" },
    { label: "API Keys",                   url: "https://resend.com/api-keys" },
    { label: "Domains",                    url: "https://resend.com/domains" },
  ],
};

function PlatformCard({ platform, name, level, details, issues, extra, manageLinks }: PlatformCardProps) {
  const links = manageLinks ?? PLATFORM_MANAGE_LINKS[platform] ?? [];
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={platform} size={22} />
          <span className="font-bold text-sm" style={{ color: "#0F172A" }}>{name}</span>
        </div>
        <LevelBadge level={level} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-2">
        {details.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span style={{ color: "#94A3B8" }}>{label}</span>
            <span className="font-medium" style={{ color: value === true ? "#16A34A" : value === false ? "#DC2626" : "#374151" }}>
              {value === true ? "✓ Yes" : value === false ? "✗ No" : (value ?? "—")}
            </span>
          </div>
        ))}
      </div>
      {extra}
      {issues.map((iss, i) => (
        <div key={i} className="mt-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
          ⚠ {iss}
        </div>
      ))}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-in fade-in slide-in-from-bottom-4"
      style={{ background: ok ? "#16A34A" : "#DC2626", color: "white", maxWidth: 360 }}
    >
      {msg}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminIntegrations() {
  const { token } = useAdminAuth();

  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const [social, setSocial] = useState<SocialDebugResult | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  const [events, setEvents] = useState<IntegrationEvent[]>([]);

  const [resolver, setResolver] = useState<ResolverScanResult | null>(null);
  const [resolverLoading, setResolverLoading] = useState(false);

  const [aiCaps, setAiCaps] = useState<AICapabilities | null>(null);
  const [aiCapsLoading, setAiCapsLoading] = useState(false);
  const [videoCaps, setVideoCaps] = useState<VideoCapabilityResult | null>(null);
  const [videoCapsLoading, setVideoCapsLoading] = useState(false);

  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatus | null>(null);
  const [tiktokOAuthResult, setTiktokOAuthResult] = useState<TikTokOAuthResult | null>(null);
  const [tiktokConnecting, setTiktokConnecting] = useState(false);
  const [tiktokCopied, setTiktokCopied] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Tick every second so "X ago" text updates
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchHealth = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setHealthLoading(true);
    try {
      const r = await fetch("/api/v1/admin/integrations/health", {
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
      });
      if (r.ok) {
        const d = (await r.json()) as HealthData;
        setHealth(d);
        setLastChecked(d.checkedAt);
      }
    } finally {
      if (!silent) setHealthLoading(false);
    }
  }, [token]);

  const fetchAiCaps = useCallback(async () => {
    if (!token) return;
    setAiCapsLoading(true);
    try {
      const r = await fetch("/api/v1/admin/integrations/ai-media", {
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
      });
      if (r.ok) setAiCaps((await r.json()) as AICapabilities);
    } finally {
      setAiCapsLoading(false);
    }
  }, [token]);

  const fetchVideoCaps = useCallback(async () => {
    if (!token) return;
    setVideoCapsLoading(true);
    try {
      const r = await fetch("/api/v1/admin/integrations/ai-video", {
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
      });
      if (r.ok) setVideoCaps((await r.json()) as VideoCapabilityResult);
    } finally {
      setVideoCapsLoading(false);
    }
  }, [token]);

  const fetchSocial = useCallback(async () => {
    setSocialLoading(true);
    try {
      const r = await fetch(`/api/social/debug?t=${Date.now()}`);
      if (r.ok) setSocial((await r.json()) as SocialDebugResult);
    } finally {
      setSocialLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch("/api/v1/admin/integrations/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setEvents((await r.json()) as IntegrationEvent[]);
    } catch { /* non-fatal */ }
  }, [token]);

  const fetchTiktokStatus = useCallback(async () => {
    try {
      const r = await fetch(`/api/social/tiktok/status?t=${Date.now()}`);
      if (r.ok) setTiktokStatus((await r.json()) as TikTokStatus);
    } catch { /* non-fatal */ }
  }, []);

  const fetchTiktokResult = useCallback(async (nonce: string) => {
    if (!token) return;
    try {
      const r = await fetch(
        `/api/social/tiktok/result?adminToken=${encodeURIComponent(token)}&nonce=${encodeURIComponent(nonce)}`
      );
      if (r.ok) {
        const data = (await r.json()) as TikTokOAuthResult;
        setTiktokOAuthResult(data);
        setTiktokStatus((prev) =>
          prev ? { ...prev, accessTokenSet: true, accessTokenMasked: data.accessTokenMasked, postingReady: true, issues: [] } : prev
        );
        showToast("TikTok connected! Copy the token below into Replit Secrets.", true);
      }
    } catch { /* non-fatal */ }
  }, [token, showToast]);

  const fetchResolver = useCallback(async (invalidateFirst = false) => {
    if (!token) return;
    setResolverLoading(true);
    try {
      if (invalidateFirst) {
        await fetch("/api/v1/admin/secret-resolver/invalidate", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      const r = await fetch("/api/v1/admin/secret-resolver/scan", {
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
      });
      if (r.ok) setResolver((await r.json()) as ResolverScanResult);
    } finally {
      setResolverLoading(false);
    }
  }, [token]);

  // Detect TikTok OAuth return params and clean up URL
  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(window.location.search);
    const nonce  = params.get("tiktok_nonce");
    const error  = params.get("tiktok_error");
    if (nonce) {
      fetchTiktokResult(nonce);
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    } else if (error) {
      showToast(`TikTok connect failed: ${decodeURIComponent(error)}`, false);
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, [token, fetchTiktokResult, showToast]);

  // Initial load
  useEffect(() => {
    if (!token) return;
    fetchHealth();
    fetchSocial();
    fetchEvents();
    fetchResolver();
    fetchAiCaps();
    fetchVideoCaps();
    fetchTiktokStatus();
  }, [token, fetchHealth, fetchSocial, fetchEvents, fetchResolver, fetchAiCaps, fetchVideoCaps, fetchTiktokStatus]);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!token) return;
    intervalRef.current = setInterval(() => {
      fetchHealth(true);
      fetchSocial();
    }, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, fetchHealth, fetchSocial]);

  function handleTestAll() {
    fetchHealth();
    fetchSocial();
    fetchEvents();
    showToast("Running fresh checks on all integrations…", true);
  }

  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string; code?: string; actionable?: string; activeKeyName?: string; httpStatus?: number } | null>(null);

  async function handleSendTestEmail() {
    if (!testEmailAddr) { showToast("Enter an email address first", false); return; }
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const r = await fetch("/api/v1/admin/integrations/send-test-email", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: testEmailAddr }),
      });
      const d = (await r.json()) as { success: boolean; message: string; code?: string; actionable?: string; activeKeyName?: string; httpStatus?: number };
      setTestEmailResult(d);
      showToast(d.success ? d.message : `Failed: ${d.message}`, d.success);
      if (d.success) { fetchEvents(); fetchHealth(); }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send test email";
      setTestEmailResult({ success: false, message: msg });
      showToast(msg, false);
    } finally {
      setTestEmailLoading(false);
    }
  }

  // Derive counts from health data
  const allSecrets = health
    ? Object.values(health).flatMap((section) =>
        typeof section === "object" && section !== null && "secrets" in section
          ? Object.values((section as { secrets: Record<string, SecretInfo> }).secrets)
          : []
      )
    : [];
  const presentCount = allSecrets.filter((s) => s.present).length;
  const missingCount = allSecrets.filter((s) => !s.present).length;

  const resendReady    = health?.resend?.live?.testEmailReady ?? false;
  const metaTokenValid   = health?.meta?.live?.tokenValid ?? false;
  const igFound          = health?.meta?.live?.instagramBusinessFound ?? false;
  const igSecretPresent  = health?.meta?.secrets?.["INSTAGRAM_BUSINESS_ACCOUNT_ID"]?.present ?? false;

  return (
    <div className="space-y-6 max-w-5xl">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Integration Health</h2>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            Live status of all API keys and external services. Values are masked for security.
            {lastChecked && (
              <span className="ml-2 font-medium" style={{ color: "#4285C7" }}>
                Last checked: {timeAgo(lastChecked)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleTestAll}
          disabled={healthLoading}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}
        >
          {healthLoading ? "Checking…" : "↺ Test All"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Secrets Configured", value: healthLoading ? "…" : presentCount, color: "#16A34A" },
          { label: "Secrets Missing",    value: healthLoading ? "…" : missingCount,  color: missingCount > 0 ? "#DC2626" : "#16A34A" },
          { label: "Auto-refreshes",     value: "every 15s",                          color: "#4285C7" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Resend Email ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EBF4FF" }}>
            <svg className="w-4 h-4" style={{ color: "#4285C7" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold" style={{ color: "#0F172A" }}>Resend Email</p>
            <p className="text-xs" style={{ color: "#64748B" }}>Transactional email delivery via Resend</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {healthLoading ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#F1F5F9", color: "#94A3B8" }}>Checking…</span>
            ) : resendReady ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
                ✓ Ready to send
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>
                ✗ Not ready
              </span>
            )}
          </div>
        </div>

        {/* Live details */}
        {health && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4 text-xs">
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>API key present</span>
              <span style={{ color: health.resend.live.apiKeyPresent ? "#16A34A" : "#DC2626" }}>
                {health.resend.live.apiKeyPresent ? "✓ Yes" : "✗ No — add RESEND_API_KEY"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>API key valid</span>
              <span style={{ color: health.resend.live.apiKeyValid ? "#16A34A" : "#DC2626" }}>
                {health.resend.live.apiKeyValid ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>API reachable</span>
              <span style={{ color: health.resend.live.apiReachable ? "#16A34A" : "#DC2626" }}>
                {health.resend.live.apiReachable ? "✓ Yes" : "✗ No — network error"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>From email</span>
              <span className="font-mono" style={{ color: "#374151" }}>{health.resend.live.fromEmail}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>Test email ready</span>
              <span style={{ color: health.resend.live.testEmailReady ? "#16A34A" : "#DC2626" }}>
                {health.resend.live.testEmailReady ? "✓ Ready" : "✗ Not ready"}
              </span>
            </div>
            {health.resend.live.domainsFound.length > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Verified domains</span>
                <span className="font-mono text-[10px]" style={{ color: "#374151" }}>
                  {health.resend.live.domainsFound.join(", ")}
                </span>
              </div>
            )}
            {health.resend.live.error && (
              <div className="col-span-2">
                <div className="px-3 py-2 rounded-xl text-xs space-y-1" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
                  <p className="font-bold">✗ {health.resend.live.error}</p>
                  {!health.resend.live.apiKeyPresent && (
                    <p>Add <code className="bg-red-100 px-1 rounded">RESEND_API_KEY</code> as a Replit Secret. Get a free key at <strong>resend.com/api-keys</strong>.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Secrets */}
        {health && (
          <details className="mb-4">
            <summary className="text-xs font-semibold cursor-pointer" style={{ color: "#64748B" }}>Resend secrets</summary>
            <div className="mt-2">
              {Object.values(health.resend.secrets).map((s) => <SecretRow key={s.key} s={s} />)}
            </div>
          </details>
        )}

        {/* Test email */}
        <div className="flex gap-2 items-center">
          <input
            type="email"
            value={testEmailAddr}
            onChange={(e) => setTestEmailAddr(e.target.value)}
            placeholder="Send test email to…"
            className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#0F172A" }}
          />
          <button
            onClick={handleSendTestEmail}
            disabled={testEmailLoading || !token}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            style={{ background: "#4285C7" }}
          >
            {testEmailLoading ? "Sending…" : "Send Test Email"}
          </button>
        </div>
        {testEmailResult && (
          <div className="mt-2 px-3 py-2.5 rounded-xl text-xs space-y-1.5"
            style={{
              background: testEmailResult.success ? "rgba(22,163,74,0.06)" : "rgba(239,68,68,0.06)",
              border: `1px solid ${testEmailResult.success ? "rgba(22,163,74,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
            <p className="font-bold" style={{ color: testEmailResult.success ? "#15803D" : "#DC2626" }}>
              {testEmailResult.success ? "✓ Email sent successfully" : `✗ Send failed${testEmailResult.code ? ` [${testEmailResult.code}]` : ""}`}
            </p>
            <p style={{ color: testEmailResult.success ? "#166534" : "#7F1D1D" }}>{testEmailResult.message}</p>
            {!testEmailResult.success && testEmailResult.actionable && (
              <div className="mt-1 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.04)" }}>
                <p className="font-semibold mb-0.5" style={{ color: "#374151" }}>How to fix:</p>
                <p style={{ color: "#374151" }}>{testEmailResult.actionable}</p>
              </div>
            )}
            {testEmailResult.httpStatus && (
              <p style={{ color: "#9CA3AF" }}>HTTP {testEmailResult.httpStatus} · Via Resend</p>
            )}
          </div>
        )}

        {/* External action links */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
          {(PLATFORM_MANAGE_LINKS["resend"] ?? []).map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
              style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>

      {/* ── AI Media (DALL-E 3 / OpenAI) ─────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold" style={{ color: "#0F172A" }}>AI Media Generation</p>
            <p className="text-xs" style={{ color: "#64748B" }}>
              DALL-E 3 image generation — powered by CHAT_BOT key
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {aiCapsLoading ? (
              <span className="text-xs" style={{ color: "#94A3B8" }}>Checking…</span>
            ) : aiCaps ? (
              aiCaps.imageGenerationReady ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>DALL-E 3 Ready ✓</span>
              ) : aiCaps.keyPresent ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(217,119,6,0.1)", color: "#D97706" }}>Key present, image access issue</span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>No AI key</span>
              )
            ) : null}
            <button
              onClick={() => { void fetchAiCaps(); showToast("Checking AI capabilities…", true); }}
              disabled={aiCapsLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "#F1F5F9", color: "#4285C7" }}
            >
              {aiCapsLoading ? "…" : "Re-check"}
            </button>
          </div>
        </div>

        {aiCaps && (
          <div className="space-y-4">
            {/* Capability matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Text Generation",
                  ready: aiCaps.textGenerationReady,
                  error: aiCaps.textGenerationError,
                  note: "GPT-4o captions, scripts",
                },
                {
                  label: "Image Generation",
                  ready: aiCaps.imageGenerationReady,
                  error: aiCaps.imageGenerationError,
                  note: "DALL-E 3 marketing images",
                },
                {
                  label: "Video Generation",
                  ready: videoCaps?.available ?? false,
                  error: undefined,
                  note: videoCaps
                    ? videoCaps.available
                      ? `${videoCaps.videoModels[0] ?? "Sora"} — ${videoCaps.videoModels.length} model(s)`
                      : videoCaps.reason
                    : aiCaps.videoNote,
                  pending: !videoCaps,
                },
              ].map(({ label, ready, error, note, pending }) => (
                <div
                  key={label}
                  className="rounded-xl p-3"
                  style={{
                    background: ready ? "rgba(22,163,74,0.04)" : pending ? "rgba(148,163,184,0.06)" : "rgba(220,38,38,0.04)",
                    border: `1px solid ${ready ? "rgba(22,163,74,0.15)" : pending ? "rgba(148,163,184,0.2)" : "rgba(220,38,38,0.15)"}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{ready ? "✓" : pending ? "—" : "✗"}</span>
                    <span className="text-xs font-bold" style={{ color: ready ? "#16A34A" : pending ? "#64748B" : "#DC2626" }}>
                      {label}
                    </span>
                  </div>
                  <p className="text-[10px] leading-tight" style={{ color: "#94A3B8" }}>
                    {error ?? note}
                  </p>
                </div>
              ))}
            </div>

            {/* Key info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Active key name</span>
                <span className="font-mono font-bold" style={{ color: "#374151" }}>
                  {aiCaps.activeKeyName ?? "— none —"}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Key present</span>
                <span style={{ color: aiCaps.keyPresent ? "#16A34A" : "#DC2626" }}>
                  {aiCaps.keyPresent ? "✓ Yes" : "✗ No — set CHAT_BOT"}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Last checked</span>
                <span style={{ color: "#374151" }}>{new Date(aiCaps.checkedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Image model</span>
                <span style={{ color: "#374151" }}>DALL-E 3 (standard quality)</span>
              </div>
            </div>

            {/* Video capability panel */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold" style={{ color: "#374151" }}>Video Generation (Sora API)</span>
                </div>
                <div className="flex items-center gap-2">
                  {videoCaps && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                      background: videoCaps.available ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
                      color: videoCaps.available ? "#16A34A" : "#D97706",
                    }}>
                      {videoCaps.available ? `✓ Available — ${videoCaps.videoModels.length} model(s)` : "Not enabled"}
                    </span>
                  )}
                  <button
                    onClick={() => { void fetchVideoCaps(); showToast("Checking video generation availability…", true); }}
                    disabled={videoCapsLoading}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "#F1F5F9", color: "#4285C7" }}
                  >
                    {videoCapsLoading ? "…" : "Test Video Generation"}
                  </button>
                </div>
              </div>
              <div className="px-3 py-2.5 space-y-1.5">
                {videoCaps ? (
                  <>
                    <p className="text-[10px]" style={{ color: videoCaps.available ? "#16A34A" : "#D97706" }}>{videoCaps.reason}</p>
                    {videoCaps.videoModels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {videoCaps.videoModels.map(m => (
                          <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: "rgba(66,133,199,0.08)", color: "#4285C7" }}>{m}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Checked: {new Date(videoCaps.checkedAt).toLocaleTimeString()}</p>
                    {!videoCaps.available && (
                      <a href="https://openai.com/sora" target="_blank" rel="noopener noreferrer"
                        className="inline-block text-[10px] font-semibold mt-1" style={{ color: "#4285C7" }}>
                        Apply for Sora API access at openai.com/sora ↗
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                    {videoCapsLoading ? "Checking availability…" : "Click 'Test Video Generation' to probe Sora API access."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!aiCaps && !aiCapsLoading && (
          <p className="text-xs" style={{ color: "#94A3B8" }}>Click Re-check to test AI capabilities.</p>
        )}

        {/* External links */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
          {[
            { label: "OpenAI Platform", url: "https://platform.openai.com" },
            { label: "DALL-E 3 Docs", url: "https://platform.openai.com/docs/guides/images" },
            { label: "Usage & Billing", url: "https://platform.openai.com/usage" },
            { label: "Model Pricing", url: "https://openai.com/pricing" },
          ].map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
              style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>

      {/* ── Meta / Instagram ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3 mb-4">
          <PlatformIcon platform="meta" size={28} />
          <div>
            <p className="font-bold" style={{ color: "#0F172A" }}>Meta — Facebook &amp; Instagram</p>
            <p className="text-xs" style={{ color: "#64748B" }}>Organic social posting via META_ACCESS_TOKEN</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {igFound ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Instagram ✓</span>
            ) : igSecretPresent ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(217,119,6,0.1)", color: "#D97706" }}>IG secret present, API check needed</span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(0,0,0,0.05)", color: "#6B7280" }}>IG not configured</span>
            )}
          </div>
        </div>

        {health && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4 text-xs">
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>Token (META_ACCESS_TOKEN)</span>
              <span className="font-mono" style={{ color: "#374151" }}>{health.meta.live.tokenMasked ?? "NOT SET"}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>Token valid</span>
              <span style={{ color: metaTokenValid ? "#16A34A" : "#DC2626" }}>
                {metaTokenValid ? "✓ Valid" : "✗ Invalid / missing"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>Facebook page</span>
              <span style={{ color: health.meta.live.pagesFound ? "#16A34A" : "#DC2626" }}>
                {health.meta.live.pagesFound ? `✓ ${health.meta.live.pageName ?? "Found"}` : "✗ Not found"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>INSTAGRAM_BUSINESS_ACCOUNT_ID</span>
              <span style={{ color: igSecretPresent ? "#16A34A" : "#DC2626" }}>
                {igSecretPresent ? `✓ Present (${health.meta.secrets["INSTAGRAM_BUSINESS_ACCOUNT_ID"]?.masked})` : "✗ Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>Instagram account reachable via API</span>
              <span style={{ color: igFound ? "#16A34A" : igSecretPresent ? "#D97706" : "#DC2626" }}>
                {igFound ? "✓ Yes" : igSecretPresent ? "⚠ API check failed" : "✗ Not configured"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#94A3B8" }}>Can post to Instagram</span>
              <span style={{ color: health.meta.live.canPostInstagram ? "#16A34A" : "#DC2626" }}>
                {health.meta.live.canPostInstagram ? "✓ Yes" : "✗ No"}
              </span>
            </div>
          </div>
        )}

        {health?.meta?.live?.issues && health.meta.live.issues.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {health.meta.live.issues.map((iss, i) => (
              <div key={i} className="px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>⚠ {iss}</div>
            ))}
          </div>
        )}

        {health && (
          <details>
            <summary className="text-xs font-semibold cursor-pointer" style={{ color: "#64748B" }}>Meta secrets</summary>
            <div className="mt-2">
              {Object.values(health.meta.secrets).map((s) => <SecretRow key={s.key} s={s} />)}
            </div>
          </details>
        )}

        {/* External action links */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
          {(PLATFORM_MANAGE_LINKS["meta"] ?? []).map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
              style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>

      {/* ── Social Platforms ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black" style={{ color: "#0F172A" }}>Social Platform Publishing</h3>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Live organic posting credential status — no secret values exposed.
              {social && (
                <span className="ml-2" style={{ color: "#4285C7" }}>Checked {timeAgo(social.checked_at)}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { fetchSocial(); showToast("Social platform check running…", true); }}
              disabled={socialLoading}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}
            >
              {socialLoading ? "Checking…" : "Test Social"}
            </button>
            <a
              href="/api/v1/admin/integrations/full-test"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7", border: "1px solid rgba(66,133,199,0.2)", textDecoration: "none" }}
            >
              Full Test ↗
            </a>
          </div>
        </div>

        {social && (
          <>
            {social.dry_run_mode && (
              <div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
                🧪 DRY RUN MODE — posts are simulated (SOCIAL_DRY_RUN=true)
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Ready to post",   count: social.summary.readyToPost.length,      items: social.summary.readyToPost,       color: "#16A34A" },
                { label: "Needs OAuth",     count: social.summary.needsOAuth.length,        items: social.summary.needsOAuth,         color: "#D97706" },
                { label: "Needs approval",  count: social.summary.needsAppApproval.length,  items: social.summary.needsAppApproval,   color: "#7C3AED" },
                { label: "Not configured",  count: social.summary.notConfigured.length,     items: social.summary.notConfigured,      color: "#6B7280" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "#64748B" }}>{s.label}</p>
                  {s.items.length > 0 && <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{s.items.join(", ")}</p>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PlatformCard
                platform="meta" name="Meta — Facebook & Instagram"
                level={socialLevel("facebook", social)}
                details={[
                  { label: "Token valid",          value: social.meta.tokenValid },
                  { label: "Token (masked)",        value: social.meta.tokenMasked },
                  { label: "Facebook page",         value: social.meta.pagesFound },
                  { label: "Instagram account",     value: social.meta.instagramBusinessFound },
                  { label: "Can post Facebook",     value: social.meta.canPostFacebook },
                  { label: "Can post Instagram",    value: social.meta.canPostInstagram },
                ]}
                issues={social.meta.issues}
              />
              {/* TikTok — custom card with OAuth connect */}
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform="tiktok" size={22} />
                    <span className="font-bold text-sm" style={{ color: "#0F172A" }}>TikTok</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LevelBadge level={social.tiktok.awaitingApproval ? "approval" : tiktokStatus?.postingReady || social.tiktok.postingReady ? "ready" : tiktokStatus?.oauthReady ? "oauth" : socialLevel("tiktok", social)} />
                    {tiktokStatus?.oauthReady && !tiktokStatus.accessTokenSet && (
                      <button
                        onClick={() => {
                          setTiktokConnecting(true);
                          window.location.href = `/api/social/tiktok/connect?adminToken=${encodeURIComponent(token ?? "")}`;
                        }}
                        disabled={tiktokConnecting || !token}
                        className="px-2.5 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: "rgba(0,0,0,0.85)", color: "white" }}
                      >
                        {tiktokConnecting ? "Redirecting…" : "Connect TikTok"}
                      </button>
                    )}
                    {tiktokStatus?.accessTokenSet && !tiktokOAuthResult && (
                      <button
                        onClick={() => {
                          setTiktokConnecting(true);
                          window.location.href = `/api/social/tiktok/connect?adminToken=${encodeURIComponent(token ?? "")}`;
                        }}
                        disabled={tiktokConnecting || !token}
                        className="px-2.5 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}
                      >
                        {tiktokConnecting ? "Redirecting…" : "Reconnect"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-2">
                  {[
                    { label: "Client Key",         value: tiktokStatus?.clientKeySet    ?? social.tiktok.clientKeySet },
                    { label: "Client Secret",      value: tiktokStatus?.clientSecretSet ?? false },
                    { label: "Access Token",       value: tiktokStatus?.accessTokenMasked ?? social.tiktok.accessTokenMasked ?? (social.tiktok.accessTokenSet ? true : false) },
                    { label: "Open ID",            value: social.tiktok.openIdSet },
                    { label: "API Approved",       value: !social.tiktok.awaitingApproval && social.tiktok.accessTokenSet ? true : social.tiktok.awaitingApproval ? false : null },
                    { label: "Posting ready",      value: tiktokStatus?.postingReady ?? social.tiktok.postingReady },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span style={{ color: "#94A3B8" }}>{label}</span>
                      <span className="font-medium" style={{ color: value === true ? "#16A34A" : value === false ? "#DC2626" : "#374151" }}>
                        {value === true ? "✓ Yes" : value === false ? "✗ No" : (value ?? "—")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Awaiting API approval banner */}
                {social.tiktok.awaitingApproval && (
                  <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(124,58,237,0.08)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.15)" }}>
                    ⏳ <strong>Awaiting TikTok API approval.</strong> Token is connected but <code>video.publish</code> scope requires manual approval from TikTok.{" "}
                    <a href="https://developers.tiktok.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Apply at developers.tiktok.com →</a>
                  </div>
                )}

                {/* One-time token display after successful OAuth */}
                {tiktokOAuthResult && (
                  <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
                    <p className="font-bold mb-2" style={{ color: "#15803D" }}>✓ TikTok connected! Save this token now — shown only once.</p>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono break-all" style={{ color: "#0F172A", fontSize: 10 }}>
                        TIKTOK_ACCESS_TOKEN={tiktokOAuthResult.TIKTOK_ACCESS_TOKEN}
                      </span>
                      <button
                        onClick={() => {
                          void navigator.clipboard.writeText(tiktokOAuthResult.TIKTOK_ACCESS_TOKEN);
                          setTiktokCopied(true);
                          setTimeout(() => setTiktokCopied(false), 2000);
                        }}
                        className="shrink-0 px-2 py-1 rounded-lg font-bold transition-colors"
                        style={{ background: tiktokCopied ? "#16A34A" : "#E2E8F0", color: tiktokCopied ? "white" : "#374151", fontSize: 10 }}
                      >
                        {tiktokCopied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    {tiktokOAuthResult.openId && (
                      <p style={{ color: "#64748B" }}>Open ID: {tiktokOAuthResult.openId}</p>
                    )}
                    <p className="mt-1 font-semibold" style={{ color: "#92400E" }}>
                      → Paste TIKTOK_ACCESS_TOKEN into Replit Secrets to persist across restarts.
                    </p>
                  </div>
                )}

                {/* Issues */}
                {(tiktokStatus?.issues ?? social.tiktok.issues).map((iss, i) => (
                  <div key={i} className="mt-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
                    ⚠ {iss}
                  </div>
                ))}

                {/* Manage links */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                  {(PLATFORM_MANAGE_LINKS["tiktok"] ?? []).map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              </div>
              <PlatformCard
                platform="youtube" name="YouTube"
                level={socialLevel("youtube", social)}
                details={[
                  { label: "API key",            value: social.youtube.apiKeyMasked },
                  { label: "API key valid",      value: social.youtube.apiKeyValid },
                  { label: "OAuth configured",   value: social.youtube.oauthConfigured },
                  { label: "Upload ready",       value: social.youtube.uploadReady },
                ]}
                issues={social.youtube.issues}
              />
              {/* LinkedIn — custom card with token expiry info */}
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform="linkedin" size={22} />
                    <span className="font-bold text-sm" style={{ color: "#0F172A" }}>LinkedIn</span>
                  </div>
                  <LevelBadge level={social.linkedin.tokenRefreshFailed ? "partial" : socialLevel("linkedin", social)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-2">
                  {[
                    { label: "App credentials",    value: social.linkedin.clientConfigured },
                    { label: "Access token",       value: social.linkedin.accessTokenMasked ?? social.linkedin.accessTokenConfigured },
                    { label: "Organization set",   value: social.linkedin.organizationConfigured },
                    { label: "Auto-refresh",       value: social.linkedin.tokenRefreshAvailable },
                    { label: "Posting ready",      value: social.linkedin.postingReady },
                    { label: "Token expires",      value: social.linkedin.daysUntilExpiry !== null ? `${social.linkedin.daysUntilExpiry}d` : "unknown" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span style={{ color: "#94A3B8" }}>{label}</span>
                      <span className="font-medium" style={{ color: value === true ? "#16A34A" : value === false ? "#DC2626" : typeof value === "string" && value.includes("d") && social.linkedin.tokenExpiringSoon ? "#D97706" : "#374151" }}>
                        {value === true ? "✓ Yes" : value === false ? "✗ No" : (value ?? "—")}
                      </span>
                    </div>
                  ))}
                </div>
                {social.linkedin.autoRefreshed && (
                  <div className="mt-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#F0FDF4", color: "#16A34A" }}>
                    ✓ Token auto-refreshed. Update LINKEDIN_ACCESS_TOKEN in Replit Secrets.
                  </div>
                )}
                {social.linkedin.tokenRefreshFailed && (
                  <div className="mt-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.05)", color: "#DC2626" }}>
                    ✗ Token refresh failed — update LINKEDIN_ACCESS_TOKEN manually.
                  </div>
                )}
                {social.linkedin.tokenExpiringSoon && !social.linkedin.autoRefreshed && !social.linkedin.tokenRefreshFailed && (
                  <div className="mt-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
                    ⚠ Token expires in {social.linkedin.daysUntilExpiry} days. {social.linkedin.tokenRefreshAvailable ? "Auto-refresh will run on next health check." : "Set LINKEDIN_REFRESH_TOKEN to enable auto-refresh."}
                  </div>
                )}
                {social.linkedin.issues.filter((i) => !i.includes("auto-refresh") && !i.includes("refresh")).map((iss, i) => (
                  <div key={i} className="mt-1 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>⚠ {iss}</div>
                ))}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                  {(PLATFORM_MANAGE_LINKS["linkedin"] ?? []).map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
                      style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              </div>
              <PlatformCard
                platform="x" name="X (Twitter)"
                level={socialLevel("x", social)}
                details={[
                  { label: "Credentials set",    value: social.x.configured },
                  { label: "Credentials valid",  value: social.x.credentialsValid },
                  { label: "Handle",             value: social.x.userHandle },
                  { label: "Read+Write access",  value: social.x.readWriteAccess },
                ]}
                issues={social.x.issues}
              />
              {/* Snapchat — custom card with OAuth link */}
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform="snapchat" size={22} />
                    <div>
                      <span className="font-bold text-sm" style={{ color: "#0F172A" }}>Snapchat Marketing</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(234,179,8,0.12)", color: "#92400E" }}>Ads Only</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LevelBadge level={socialLevel("snapchat", social)} />
                    <a href="/admin/integrations/snapchat" className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(255,193,7,0.1)", color: "#D97706" }}>
                      Setup →
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-2">
                  {[
                    { label: "Client ID",           value: social.snapchat.clientIdSet },
                    { label: "Client Secret",       value: social.snapchat.clientSecretSet },
                    { label: "Access Token",        value: social.snapchat.accessTokenSet ? (!social.snapchat.tokenExpired ? social.snapchat.accessTokenMasked : "Expired") : false },
                    { label: "Refresh Token",       value: social.snapchat.refreshTokenSet },
                    { label: "Ad Account ID",       value: social.snapchat.adAccountIdSet },
                    { label: "Marketing API ready", value: social.snapchat.marketingApiReady },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span style={{ color: "#94A3B8" }}>{label}</span>
                      <span className="font-medium" style={{ color: value === true ? "#16A34A" : value === false ? "#DC2626" : typeof value === "string" && value === "Expired" ? "#D97706" : "#374151" }}>
                        {value === true ? "✓ Yes" : value === false ? "✗ No" : (value ?? "—")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(234,179,8,0.07)", color: "#78350F", border: "1px solid rgba(234,179,8,0.2)" }}>
                  ℹ️ Snapchat does not offer an organic content posting API. This integration manages <strong>paid ad campaigns</strong> only via the Snapchat Marketing API.
                </div>
                {social.snapchat.tokenExpired && social.snapchat.canRefresh && (
                  <div className="mt-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
                    ⚠ Token expired — refresh available. <a href="/admin/integrations/snapchat" className="font-bold underline">Click Setup to refresh</a>
                  </div>
                )}
                {social.snapchat.issues.filter((i) => !i.includes("expired")).map((iss, i) => (
                  <div key={i} className="mt-1 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>⚠ {iss}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {socialLoading && !social && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ── Google Services ───────────────────────────────────────────────────── */}
      {health && (
        <div className="space-y-3">
          <h3 className="text-lg font-black" style={{ color: "#0F172A" }}>Google Services</h3>

          {/* Google OAuth Sign-In card */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${health.googleOAuth.oauthReady ? "#E2E8F0" : "#FCA5A5"}` }}>
            <div className="flex items-center gap-3 mb-4">
              <PlatformIcon platform="google" size={22} />
              <div>
                <p className="font-bold text-sm" style={{ color: "#0F172A" }}>Google OAuth — Sign-In</p>
                <p className="text-xs" style={{ color: "#64748B" }}>Enables "Continue with Google" on the login page</p>
              </div>
              <div className="ml-auto">
                {health.googleOAuth.oauthReady ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
                    ✓ OAuth ready
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>
                    ✗ Not configured
                  </span>
                )}
              </div>
            </div>

            {/* Credential status grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Client ID</span>
                <span style={{ color: health.googleOAuth.clientIdPresent ? "#16A34A" : "#DC2626" }}>
                  {health.googleOAuth.clientIdPresent ? "✓ Set" : "✗ Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Client Secret</span>
                <span style={{ color: health.googleOAuth.clientSecretPresent ? "#16A34A" : "#DC2626" }}>
                  {health.googleOAuth.clientSecretPresent ? "✓ Set" : "✗ Missing"}
                </span>
              </div>
              <div className="flex justify-between col-span-2">
                <span style={{ color: "#94A3B8" }}>Redirect URI env var</span>
                <span style={{ color: health.googleOAuth.redirectUriConfigured ? "#16A34A" : "#D97706" }}>
                  {health.googleOAuth.redirectUriConfigured
                    ? `✓ ${health.googleOAuth.redirectUri}`
                    : "⚠ Not set — callback URL will be derived from request host"}
                </span>
              </div>
            </div>

            {/* Canonical callback URL — must be registered in Google Console */}
            <div className="rounded-xl p-3 mb-3" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
              <p className="text-[10px] font-bold mb-1.5" style={{ color: "#0369A1" }}>
                ① Register this exact URL in Google Cloud Console → Credentials → Authorized redirect URIs:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] font-mono px-2 py-1.5 rounded-lg" style={{ background: "rgba(3,105,161,0.08)", color: "#0369A1" }}>
                  {health.googleOAuth.canonicalCallbackUrl}
                </code>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(health.googleOAuth.canonicalCallbackUrl);
                    showToast("Callback URL copied!", true);
                  }}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors hover:opacity-80"
                  style={{ background: "#0369A1", color: "white" }}
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: "#0369A1" }}>
                ② Set <code className="font-mono bg-blue-50 px-1 rounded">GOOGLE_REDIRECT_URI</code> to this same URL in Replit Secrets.
              </p>
            </div>

            {/* Issues */}
            {health.googleOAuth.issues.map((iss, i) => (
              <div key={i} className="mt-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
                ⚠ {iss}
              </div>
            ))}

            {/* Secrets */}
            <details className="mt-3">
              <summary className="text-xs font-semibold cursor-pointer" style={{ color: "#64748B" }}>OAuth secrets</summary>
              <div className="mt-2">
                {Object.values(health.googleOAuth.secrets).map((s) => <SecretRow key={s.key} s={s} />)}
              </div>
            </details>

            {/* Manage links */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
              {[
                { label: "Google Cloud Console — Credentials", url: "https://console.cloud.google.com/apis/credentials" },
                { label: "OAuth consent screen", url: "https://console.cloud.google.com/apis/credentials/consent" },
              ].map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
                  style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>

          {/* Google Ads card */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center gap-3 mb-4">
              <PlatformIcon platform="google" size={22} />
              <div>
                <p className="font-bold text-sm" style={{ color: "#0F172A" }}>Google Ads</p>
                <p className="text-xs" style={{ color: "#64748B" }}>Managed ad campaigns via Google Ads API</p>
              </div>
              <div className="ml-auto">
                {(() => {
                  const secrets = health.google.secrets;
                  const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_DEVELOPER_TOKEN", "MCC_REFRESH_TOKEN"];
                  const allSet = required.every((k) => secrets[k]?.present);
                  const someSet = required.some((k) => secrets[k]?.present);
                  return allSet ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>✓ Configured</span>
                  ) : someSet ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB" }}>Partial</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(0,0,0,0.05)", color: "#6B7280" }}>Not configured</span>
                  );
                })()}
              </div>
            </div>
            <div className="space-y-0.5 mb-3">
              {Object.values(health.google.secrets).map((s) => <SecretRow key={s.key} s={s} />)}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
              {[
                { label: "Google Cloud Console", url: "https://console.cloud.google.com/apis/credentials" },
                { label: "Google Ads Manager", url: "https://ads.google.com" },
                { label: "Google Ads API Center", url: "https://ads.google.com/nav/selectaccount?authuser=0&continue=https://developers.google.com/google-ads/api/docs/get-started/dev-token" },
              ].map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
                  style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>

          {/* Google SEO / Search Console card */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center gap-3 mb-4">
              <PlatformIcon platform="google" size={22} />
              <div>
                <p className="font-bold text-sm" style={{ color: "#0F172A" }}>Google Search Console — SEO</p>
                <p className="text-xs" style={{ color: "#64748B" }}>Site ownership verification + keyword performance API</p>
              </div>
              <div className="ml-auto">
                {health.googleSearch.siteVerificationPresent ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>✓ Verified</span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(0,0,0,0.05)", color: "#6B7280" }}>Not verified</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Site verification token</span>
                <span style={{ color: health.googleSearch.siteVerificationPresent ? "#16A34A" : "#D97706" }}>
                  {health.googleSearch.siteVerificationPresent
                    ? `✓ ${health.googleSearch.siteVerificationMasked}`
                    : "⚠ Not set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#94A3B8" }}>Search Console API key</span>
                <span style={{ color: health.googleSearch.searchConsoleConfigured ? "#16A34A" : "#94A3B8" }}>
                  {health.googleSearch.searchConsoleConfigured ? "✓ Set" : "— Optional"}
                </span>
              </div>
            </div>

            {health.googleSearch.issues.map((iss, i) => (
              <div key={i} className="mt-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
                ⚠ {iss}
              </div>
            ))}

            <details className="mt-3">
              <summary className="text-xs font-semibold cursor-pointer" style={{ color: "#64748B" }}>Search Console secrets</summary>
              <div className="mt-2">
                {Object.values(health.googleSearch.secrets).map((s) => <SecretRow key={s.key} s={s} />)}
              </div>
            </details>

            <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
              {[
                { label: "Google Search Console", url: "https://search.google.com/search-console" },
                { label: "Sitemap", url: "https://worlddigital.ai/sitemap.xml" },
              ].map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
                  style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Google Analytics ──────────────────────────────────────────────────── */}
      {(() => {
        const gaMeasurementId = process.env["NEXT_PUBLIC_GA_MEASUREMENT_ID"] ?? "";
        const gaInstalled = !!gaMeasurementId;
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-black" style={{ color: "#0F172A" }}>Analytics</h3>
            <div className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${gaInstalled ? "#E2E8F0" : "#FCA5A5"}` }}>
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#0F172A" }}>Google Analytics 4</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>Site-wide analytics, pageview tracking, and conversion events</p>
                </div>
                <div className="ml-auto">
                  {gaInstalled ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>✓ Active</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>✗ Not configured</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: "#94A3B8" }}>Measurement ID</span>
                  <span style={{ color: gaInstalled ? "#16A34A" : "#DC2626" }}>
                    {gaInstalled ? `✓ ${gaMeasurementId}` : "✗ Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#94A3B8" }}>Tag installed</span>
                  <span style={{ color: gaInstalled ? "#16A34A" : "#DC2626" }}>
                    {gaInstalled ? "✓ Yes — layout.tsx" : "✗ No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#94A3B8" }}>Pageview tracking</span>
                  <span style={{ color: gaInstalled ? "#16A34A" : "#94A3B8" }}>
                    {gaInstalled ? "✓ Route-change aware" : "— Disabled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#94A3B8" }}>Last checked</span>
                  <span style={{ color: "#64748B" }}>Build time</span>
                </div>
              </div>

              {gaInstalled && (
                <div className="rounded-xl px-3 py-2.5 mb-3 text-xs" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <p className="font-semibold mb-1" style={{ color: "#15803D" }}>Events tracked</p>
                  <p style={{ color: "#166534" }}>
                    signup_start · signup_complete · login · package_view · package_select · checkout_start · checkout_success · contact_form_submit · career_form_submit · content_generate · image_generate · publish_attempt
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                {[
                  { label: "GA4 Dashboard", url: `https://analytics.google.com/analytics/web/#/p${gaMeasurementId.replace("G-", "")}/reports/` },
                  { label: "Real-time", url: "https://analytics.google.com/analytics/web/#/realtime" },
                  { label: "Tag Manager", url: "https://tagmanager.google.com" },
                ].map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
                    style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
                    {link.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Other Service Secrets ─────────────────────────────────────────────── */}
      {health && (
        <div className="space-y-3">
          <h3 className="text-lg font-black" style={{ color: "#0F172A" }}>All Service Secrets</h3>
          <p className="text-xs -mt-2" style={{ color: "#64748B" }}>{health.envNote}</p>

          {[
            { label: "Stripe",    icon: "💳",          platformId: "stripe",    data: health.stripe.secrets,   note: health.stripe.mode === "live" ? "live mode ✓" : "test mode" },
            { label: "Snapchat Ads", platform: "snapchat", platformId: "snapchat", data: health.snapchat.secrets },
            { label: "Google Ads",   platform: "google",   platformId: "google",   data: health.google.secrets },
            { label: "LinkedIn",     platform: "linkedin",  platformId: "linkedin", data: health.linkedin.secrets },
            { label: "YouTube",      platform: "youtube",   platformId: "youtube",  data: health.youtube.secrets },
            { label: "X (Twitter)",  platform: "x",         platformId: "x",        data: health.x.secrets },
            { label: "TikTok",       platform: "tiktok",    platformId: "tiktok",   data: health.tiktok.secrets },
            { label: "AI (OpenAI)",  icon: "🤖",            platformId: "ai",       data: health.ai.secrets },
            { label: "AWS / S3",     icon: "☁️",            platformId: "aws",      data: health.aws.secrets },
          ].map(({ label, icon, platform, platformId, data, note }) => {
            const links = PLATFORM_MANAGE_LINKS[platformId] ?? [];
            return (
              <div key={label} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="flex items-center gap-2 mb-3">
                  {platform ? <PlatformIcon platform={platform} size={20} /> : <span>{icon}</span>}
                  <span className="font-bold text-sm" style={{ color: "#0F172A" }}>{label}</span>
                  {note && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: note.includes("live") ? "rgba(22,163,74,0.1)" : "rgba(234,179,8,0.1)", color: note.includes("live") ? "#16A34A" : "#CA8A04" }}>
                      {note}
                    </span>
                  )}
                </div>
                {Object.values(data).map((s) => <SecretRow key={s.key} s={s} />)}
                {links.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5" style={{ borderTop: "1px solid #F1F5F9" }}>
                    {links.map((link) => (
                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
                        style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Secret Resolver ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black" style={{ color: "#0F172A" }}>Secret Resolver</h3>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Multi-alias scan — shows every env var name tried for each secret, which one is active, and any conflicts.
              {resolver && (
                <span className="ml-2" style={{ color: "#4285C7" }}>Scanned {timeAgo(resolver.scannedAt)}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchResolver(true)}
            disabled={resolverLoading}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}
          >
            {resolverLoading ? "Scanning…" : "↺ Re-scan"}
          </button>
        </div>

        {resolverLoading && !resolver && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {resolver && (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Integrations",   value: resolver.summary.total,         color: "#0F172A" },
                { label: "Fully resolved", value: resolver.summary.fullyResolved,  color: "#16A34A" },
                { label: "With conflicts", value: resolver.summary.hasConflicts,   color: resolver.summary.hasConflicts > 0 ? "#D97706" : "#16A34A" },
                { label: "Missing required", value: resolver.summary.hasMissing,   color: resolver.summary.hasMissing > 0 ? "#DC2626" : "#16A34A" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                  <p className="text-2xl font-black" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Integration cards */}
            <div className="space-y-3">
              {resolver.integrations.map((intg) => {
                // Match to social debug result for live test status
                const socialMap: Record<string, { ready: boolean; issues: string[] } | null> = {
                  meta:      social ? { ready: social.meta.canPostFacebook || social.meta.canPostInstagram, issues: social.meta.issues } : null,
                  linkedin:  social ? { ready: social.linkedin.postingReady, issues: social.linkedin.issues } : null,
                  x:         social ? { ready: social.x.postingReady, issues: social.x.issues } : null,
                  youtube:   social ? { ready: social.youtube.uploadReady, issues: social.youtube.issues } : null,
                  tiktok:    social ? { ready: social.tiktok.postingReady, issues: social.tiktok.issues } : null,
                  snapchat:  social ? { ready: social.snapchat.marketingApiReady, issues: social.snapchat.issues } : null,
                };
                const liveStatus = socialMap[intg.id] ?? null;

                return (
                  <details key={intg.id} className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${!intg.fullyResolved ? "#FCA5A5" : intg.conflicts.length > 0 ? "#FDE68A" : "#E2E8F0"}` }}>
                    <summary className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none list-none" style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <PlatformIcon platform={intg.id} size={20} />
                      <span className="font-bold text-sm flex-1" style={{ color: "#0F172A" }}>{intg.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#94A3B8" }}>{intg.presentCount}/{intg.groups.length} secrets set</span>
                        {liveStatus && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: liveStatus.ready ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)", color: liveStatus.ready ? "#16A34A" : "#DC2626" }}>
                            {liveStatus.ready ? "Live ✓" : "API fail"}
                          </span>
                        )}
                        {intg.conflicts.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(217,119,6,0.1)", color: "#D97706" }}>
                            {intg.conflicts.length} conflict{intg.conflicts.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {intg.missingRequired.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>
                            {intg.missingRequired.length} required missing
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                    </summary>

                    <div className="px-5 py-3 space-y-3">
                      {/* Live API test result */}
                      {liveStatus && liveStatus.issues.length > 0 && (
                        <div className="rounded-xl p-3" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                          <p className="text-[10px] font-bold mb-1" style={{ color: "#991B1B" }}>Live API Issues</p>
                          {liveStatus.issues.map((iss, i) => (
                            <p key={i} className="text-[10px]" style={{ color: "#DC2626" }}>• {iss}</p>
                          ))}
                        </div>
                      )}

                      {/* Conflict warnings */}
                      {intg.conflicts.map((c, i) => (
                        <div key={i} className="px-3 py-2 rounded-xl text-xs" style={{ background: "#FEF3C7", color: "#92400E" }}>
                          ⚠ Conflict — {c}
                        </div>
                      ))}

                      {/* Groups */}
                      {intg.groups.map((group) => (
                        <div key={group.label} className="rounded-xl p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold" style={{ color: "#374151" }}>{group.label}</span>
                              {group.required && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#2563EB" }}>required</span>
                              )}
                            </div>
                            {group.activeKey ? (
                              <span className="text-[10px] font-bold" style={{ color: "#16A34A" }}>
                                Active: <span className="font-mono">{group.activeKey}</span>
                                {group.activeMasked && <span className="ml-1 text-gray-400">({group.activeMasked})</span>}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold" style={{ color: group.required ? "#DC2626" : "#94A3B8" }}>
                                {group.required ? "✗ Not set" : "optional — not set"}
                              </span>
                            )}
                          </div>

                          {/* Candidate list */}
                          <div className="flex flex-wrap gap-1.5">
                            {group.candidates.map((c) => (
                              <span
                                key={c.key}
                                className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-1 rounded-lg"
                                style={{
                                  background: c.isActive ? "rgba(22,163,74,0.1)" : c.present ? "rgba(217,119,6,0.1)" : "rgba(0,0,0,0.04)",
                                  color: c.isActive ? "#15803D" : c.present ? "#D97706" : "#94A3B8",
                                  border: `1px solid ${c.isActive ? "rgba(22,163,74,0.2)" : c.present ? "rgba(217,119,6,0.2)" : "transparent"}`,
                                  fontWeight: c.isActive ? 700 : 400,
                                }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.isActive ? "#16A34A" : c.present ? "#D97706" : "#D1D5DB" }} />
                                {c.key}
                                {c.isActive && " ✓"}
                                {c.present && !c.isActive && " (alt)"}
                              </span>
                            ))}
                          </div>

                          {/* Hint when not set */}
                          {group.hint && !group.activeKey && (
                            <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "#64748B" }}>
                              💡 {group.hint}
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {Object.keys(socialMap).includes(intg.id) && (
                          <button
                            onClick={() => { void fetchSocial(); }}
                            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-slate-50"
                            style={{ color: "#4285C7", borderColor: "#E2E8F0" }}
                          >
                            ↺ Test This Integration
                          </button>
                        )}
                        {(PLATFORM_MANAGE_LINKS[intg.id] ?? []).map((link) => (
                          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80"
                            style={{ background: "#F1F5F9", color: "#4285C7", textDecoration: "none" }}>
                            {link.label} ↗
                          </a>
                        ))}
                        {intg.missingRequired.length > 0 && (
                          <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                            Missing: {intg.missingRequired.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>

            {/* ── Cleanup Recommendations (Part 7) ──────────────────────────────── */}
            {(() => {
              const recs = resolver.integrations.flatMap((intg) =>
                intg.groups
                  .filter((g) => g.conflict && g.conflictingKeys.length > 1 && g.activeKey !== null)
                  .map((g) => {
                    const extras = g.conflictingKeys.filter((k) => k !== g.activeKey);
                    const primaryKey = g.candidates[0]?.key;
                    const usingAlias = g.activeKey !== primaryKey;
                    return { intg, group: g, extras, primaryKey, usingAlias };
                  })
              );
              if (recs.length === 0) return null;
              return (
                <div className="mt-4 rounded-2xl p-5" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>⚠</span>
                    <h4 className="text-sm font-black" style={{ color: "#92400E" }}>
                      Duplicate / Old Secret Suggestions
                    </h4>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(217,119,6,0.15)", color: "#D97706" }}>
                      {recs.length} item{recs.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#92400E" }}>
                    Multiple env vars are set for the same credential. Review and remove unused ones from Replit Secrets to avoid future confusion.
                  </p>
                  <div className="space-y-2">
                    {recs.map((rec, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,251,235,0.7)", border: "1px solid rgba(253,230,138,0.7)" }}>
                        <div className="flex items-start gap-2">
                          <PlatformIcon platform={rec.intg.id} size={14} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold" style={{ color: "#92400E" }}>
                              {rec.intg.name} — {rec.group.label}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: "#78350F" }}>
                              <span className="font-mono font-bold">{rec.group.activeKey}</span> is active.
                              {rec.extras.map((k, j) => (
                                <span key={j}> <span className="font-mono bg-amber-100 px-1 rounded">{k}</span> is also set but unused.</span>
                              ))}
                            </p>
                            <p className="text-[11px] mt-1 font-medium" style={{ color: "#B45309" }}>
                              {rec.usingAlias
                                ? `Recommendation: add ${rec.primaryKey} (canonical name) with the same value and remove ${rec.group.activeKey}, OR remove ${rec.extras.join(", ")} to eliminate the conflict.`
                                : `Recommendation: remove ${rec.extras.join(", ")} from Replit Secrets — ${rec.group.activeKey} is already the canonical name.`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] mt-3 font-medium" style={{ color: "#92400E" }}>
                    Secrets cannot be deleted automatically — remove unused secrets in your Replit project → Secrets panel.
                  </p>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ── Integration Event Log ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black" style={{ color: "#0F172A" }}>Integration Event Log</h3>
          <button
            onClick={fetchEvents}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border hover:bg-slate-50 transition-colors"
            style={{ color: "#4285C7", borderColor: "#E2E8F0" }}
          >
            Refresh
          </button>
        </div>
        {events.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <p className="text-sm" style={{ color: "#94A3B8" }}>No events recorded yet. Run a health check to generate log entries.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <div className="scroll-x">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Event", "Result", "Details", "Time"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev._id} className="hover:bg-slate-50 border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold" style={{ color: "#374151" }}>
                        {ev.eventType === "test_email_sent" ? "📧 Test email sent" : "🔍 Health check"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: ev.status === "processed" ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)", color: ev.status === "processed" ? "#16A34A" : "#DC2626" }}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#64748B" }}>
                      {ev.eventType === "test_email_sent" && ev.summary["toEmail"]
                        ? `→ ${ev.summary["toEmail"] as string}`
                        : ev.eventType === "integrations_check" && ev.summary
                          ? `Meta ${(ev.summary["metaTokenValid"] as boolean) ? "✓" : "✗"} · IG ${(ev.summary["instagramFound"] as boolean) ? "✓" : "✗"} · SG ${(ev.summary["sendGridSenderVerified"] as boolean) ? "verified" : "unverified"}`
                          : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: "#94A3B8" }}>
                      {timeAgo(ev.receivedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
