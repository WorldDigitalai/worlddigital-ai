"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeoProfile {
  domain: string;
  gscSiteUrl: string | null;
  domainVerified: boolean;
  serviceAccountEmail: string | null;
  lastKeywordSync: string | null;
  lastAuditAt: string | null;
}

interface GscKeyword {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Opportunity extends GscKeyword {
  estimatedTrafficGain: number;
  difficulty: "low" | "medium" | "high";
}

interface BlogPost {
  _id: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  targetKeyword: string;
  tags: string[];
  status: "draft" | "reviewed" | "published";
  publishedAt: string | null;
  createdAt: string;
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
  estimatedImpact: string;
}

interface SeoAnalyticsRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SeoPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface AuditPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2Count: number;
  imageCount: number;
  imagesWithAlt: number;
  wordCount: number;
  score: number;
  issues: string[];
  pageSpeedDesktop?: number | null;
  pageSpeedMobile?: number | null;
}

// ── Mini components ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const color = score >= 75 ? "#16A34A" : score >= 50 ? "#D97706" : "#C13A2A";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={size * 0.08} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.08}
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

function MiniBarChart({ data, max }: { data: number[]; max: number }) {
  if (!data.length || max === 0) return null;
  return (
    <div className="flex items-end gap-px h-8">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: `rgba(66,133,199,${0.3 + (v / max) * 0.7})` }} />
      ))}
    </div>
  );
}

function LineChart({ data }: { data: SeoAnalyticsRow[] }) {
  if (data.length < 2) return <div className="py-6 text-center text-xs" style={{ color: "#9CA3AF" }}>Not enough data to display chart</div>;
  const W = 560; const H = 130;
  const PAD = { t: 8, r: 12, b: 24, l: 44 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;
  const maxC = Math.max(...data.map(d => d.clicks), 1);
  const maxI = Math.max(...data.map(d => d.impressions), 1);
  const cx = (i: number) => PAD.l + (i / (data.length - 1)) * cW;
  const cyC = (v: number) => PAD.t + cH - (v / maxC) * cH;
  const cyI = (v: number) => PAD.t + cH - (v / maxI) * cH;
  const poly = (pts: [number, number][]) => pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const clicksPts: [number, number][] = data.map((d, i) => [cx(i), cyC(d.clicks)]);
  const impsPts: [number, number][] = data.map((d, i) => [cx(i), cyI(d.impressions)]);
  const n = data.length;
  const lblIdx = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor(n * 3 / 4), n - 1];
  const yMax = Math.max(maxC, 1);
  const yTicks = [Math.round(yMax * 0.25), Math.round(yMax * 0.5), Math.round(yMax * 0.75), yMax];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map(v => {
        const y = PAD.t + cH - (v / yMax) * cH;
        return <g key={v}>
          <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#F1F5F9" strokeWidth={1} />
          <text x={PAD.l - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">{v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}</text>
        </g>;
      })}
      <polyline points={poly(impsPts)} fill="none" stroke="#E2E8F0" strokeWidth={1.5} />
      <polyline points={poly(clicksPts)} fill="none" stroke="#4285C7" strokeWidth={2} strokeLinejoin="round" />
      {lblIdx.map(i => (
        <text key={i} x={cx(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF">{data[i]?.date.slice(5)}</text>
      ))}
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin mx-auto" style={{ color: "#4285C7" }} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}1a`, color }}>{text}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      {children}
    </div>
  );
}

function EmptyBox({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-bold" style={{ color: "#374151" }}>{title}</p>
      <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>
    </div>
  );
}

const TABS = ["Overview", "Analytics", "Keywords", "Opportunities", "Pages", "Site Audit", "Blog Content", "Reports", "Recommendations"] as const;
type Tab = typeof TABS[number];

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AutoSeoDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>("Overview");

  // Status
  const [profile, setProfile] = useState<SeoProfile | null>(null);
  const [gscConfigured, setGscConfigured] = useState(false);
  const [gscOauthConnected, setGscOauthConnected] = useState(false);
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Domain connect
  const [domainInput, setDomainInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Keywords
  const [keywords, setKeywords] = useState<GscKeyword[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [kwError, setKwError] = useState<string | null>(null);

  // Opportunities
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [oppLoading, setOppLoading] = useState(false);

  // Audit
  const [auditPages, setAuditPages] = useState<AuditPage[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [lastAuditAt, setLastAuditAt] = useState<string | null>(null);

  // Blog
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genKeyword, setGenKeyword] = useState("");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editContent, setEditContent] = useState("");

  // Recommendations
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsDate, setRecsDate] = useState<string | null>(null);

  // Report
  const [reportEmail, setReportEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Analytics
  const [analytics, setAnalytics] = useState<SeoAnalyticsRow[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Pages
  const [seoPages, setSeoPages] = useState<SeoPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  // ── Load status on mount ──

  useEffect(() => {
    loadStatus();
    // Handle redirect back from GSC OAuth
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const gscParam = params.get("gsc");
      if (gscParam === "connected") {
        setGscOauthConnected(true);
        setConnectMsg({ ok: true, text: "✓ Google account connected! Enter your domain below and click Connect Domain." });
        const clean = new URL(window.location.href);
        clean.searchParams.delete("gsc");
        window.history.replaceState({}, "", clean.toString());
      } else if (gscParam === "error") {
        setConnectMsg({ ok: false, text: "Google authorization failed — please try again." });
        const clean = new URL(window.location.href);
        clean.searchParams.delete("gsc");
        window.history.replaceState({}, "", clean.toString());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStatus() {
    setStatusLoading(true);
    try {
      const { data } = await apiFetch<{ profile: SeoProfile | null; gscConfigured: boolean; serviceAccountEmail: string | null; gscOauthConnected: boolean }>("/v1/seo/status");
      setProfile(data.profile);
      setGscConfigured(data.gscConfigured);
      setGscOauthConnected(data.gscOauthConnected ?? false);
      setServiceAccountEmail(data.serviceAccountEmail);
      if (data.profile?.domain) setDomainInput(data.profile.domain);
    } catch {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  }

  // ── Load tab data ──

  useEffect(() => {
    if (tab === "Analytics") loadAnalytics();
    if (tab === "Keywords") loadKeywords();
    if (tab === "Opportunities") loadOpportunities();
    if (tab === "Pages") loadPages();
    if (tab === "Site Audit") loadAudit();
    if (tab === "Blog Content") loadBlogPosts();
    if (tab === "Recommendations") loadRecommendations();
  }, [tab]);

  async function loadKeywords() {
    setKwLoading(true);
    setKwError(null);
    try {
      const { data } = await apiFetch<{ keywords: GscKeyword[]; error?: string }>("/v1/seo/keywords");
      setKeywords(data.keywords ?? []);
      if (data.error === "no_domain") setKwError("no_domain");
      else if (data.error === "not_verified") setKwError("not_verified");
      else if (data.error === "no_auth") setKwError("no_auth");
    } catch {
      setKwError("error");
    } finally {
      setKwLoading(false);
    }
  }

  async function loadOpportunities() {
    setOppLoading(true);
    try {
      const { data } = await apiFetch<{ opportunities: Opportunity[] }>("/v1/seo/opportunities");
      setOpportunities(data.opportunities ?? []);
    } catch {
      /* ignore */
    } finally {
      setOppLoading(false);
    }
  }

  async function loadAudit() {
    setAuditLoading(true);
    try {
      const { data } = await apiFetch<{ results: AuditPage[]; lastAuditAt: string | null }>("/v1/seo/audit");
      setAuditPages(data.results ?? []);
      setLastAuditAt(data.lastAuditAt);
    } catch {
      /* ignore */
    } finally {
      setAuditLoading(false);
    }
  }

  async function loadBlogPosts() {
    setBlogLoading(true);
    try {
      const { data } = await apiFetch<{ posts: BlogPost[] }>("/v1/seo/blog-posts");
      setBlogPosts(data.posts ?? []);
    } catch {
      /* ignore */
    } finally {
      setBlogLoading(false);
    }
  }

  const loadRecommendations = useCallback(async (refresh = false) => {
    setRecsLoading(true);
    try {
      const { data } = await apiFetch<{ recommendations: Recommendation[]; generatedAt: string }>(`/v1/seo/recommendations${refresh ? "?refresh=true" : ""}`);
      setRecs(data.recommendations ?? []);
      setRecsDate(data.generatedAt);
    } catch {
      /* ignore */
    } finally {
      setRecsLoading(false);
    }
  }, []);

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const { data } = await apiFetch<{ rows: SeoAnalyticsRow[]; error?: string }>("/v1/seo/analytics");
      setAnalytics(data.rows ?? []);
    } catch {
      /* ignore */
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadPages() {
    setPagesLoading(true);
    try {
      const { data } = await apiFetch<{ pages: SeoPage[]; error?: string }>("/v1/seo/pages");
      setSeoPages(data.pages ?? []);
    } catch {
      /* ignore */
    } finally {
      setPagesLoading(false);
    }
  }

  // ── Domain connect ──

  async function connectDomain() {
    if (!domainInput.trim()) return;
    setConnecting(true);
    setConnectMsg(null);
    try {
      const { data } = await apiFetch<{ domain: string; domainVerified: boolean; gscSiteUrl: string | null; gscError?: string; matchedFormat?: string | null }>("/v1/seo/connect-domain", {
        method: "POST",
        body: { domain: domainInput.trim() },
      });
      setProfile((p) => ({ ...(p ?? { serviceAccountEmail: null, lastKeywordSync: null, lastAuditAt: null }), domain: data.domain, gscSiteUrl: data.gscSiteUrl, domainVerified: data.domainVerified } as SeoProfile));
      if (data.domainVerified) {
        const fmtLabel = data.matchedFormat === "domain-property" ? "Domain property (sc-domain:)" : "URL-prefix property";
        setConnectMsg({ ok: true, text: `✓ Verified as ${fmtLabel} in Google Search Console! Keyword data will sync shortly.` });
      } else {
        setConnectMsg({ ok: false, text: data.gscError ?? "Domain saved but not yet verified in Search Console." });
      }
    } catch {
      setConnectMsg({ ok: false, text: "Connection failed — please try again." });
    } finally {
      setConnecting(false);
    }
  }

  // ── Run site audit ──

  async function runAudit() {
    setAuditRunning(true);
    try {
      const { data } = await apiFetch<{ results: AuditPage[]; auditedAt: string }>("/v1/seo/audit", { method: "POST" });
      setAuditPages(data.results ?? []);
      setLastAuditAt(data.auditedAt);
    } catch {
      /* ignore */
    } finally {
      setAuditRunning(false);
    }
  }

  // ── Generate blog post ──

  async function generateBlog() {
    if (!genKeyword.trim()) return;
    setGenerating(true);
    try {
      const { data } = await apiFetch<{ post: BlogPost }>("/v1/seo/blog-posts/generate", {
        method: "POST",
        body: {
          keyword: genKeyword.trim(),
          businessName: user?.businessName,
          businessDescription: user?.businessDescription,
          businessUrl: user?.businessURL,
        },
      });
      setBlogPosts((prev) => [data.post, ...prev]);
      setGenKeyword("");
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  }

  // ── Update blog post ──

  async function savePost(id: string, patch: Partial<BlogPost>) {
    try {
      const { data } = await apiFetch<{ post: BlogPost }>(`/v1/seo/blog-posts/${id}`, { method: "PUT", body: patch });
      setBlogPosts((prev) => prev.map((p) => (p._id === id ? data.post : p)));
      if (editingPost?._id === id) setEditingPost(data.post);
    } catch {
      /* ignore */
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this blog post?")) return;
    try {
      await apiFetch(`/v1/seo/blog-posts/${id}`, { method: "DELETE" });
      setBlogPosts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      /* ignore */
    }
  }

  // ── Send report ──

  async function sendReport() {
    if (!reportEmail.trim()) return;
    setSending(true);
    setReportMsg(null);
    try {
      await apiFetch("/v1/seo/report/send", {
        method: "POST",
        body: { email: reportEmail.trim(), businessName: user?.businessName },
      });
      setReportMsg({ ok: true, text: "Monthly SEO report sent successfully!" });
    } catch {
      setReportMsg({ ok: false, text: "Failed to send report. Please try again." });
    } finally {
      setSending(false);
    }
  }

  // ── Computed stats ──

  const totalClicks = keywords.reduce((s, k) => s + k.clicks, 0);
  const totalImpressions = keywords.reduce((s, k) => s + k.impressions, 0);
  const avgPosition = keywords.length > 0 ? (keywords.reduce((s, k) => s + k.position, 0) / keywords.length).toFixed(1) : "—";
  const avgAuditScore = auditPages.length > 0 ? Math.round(auditPages.reduce((s, a) => s + a.score, 0) / auditPages.length) : 0;
  const kwChartData = keywords.slice(0, 12).map((k) => k.impressions);
  const kwChartMax = Math.max(...kwChartData, 1);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (statusLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center"><Spinner /></div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>
            Auto SEO Dashboard
          </h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            Google Search Console · AI Content · Real Rankings
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {profile?.domainVerified && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
              ✓ GSC Verified
            </span>
          )}
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>
            Auto SEO Plan
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: tab === t ? "#111827" : "white",
              color: tab === t ? "white" : "#6B7280",
              border: tab === t ? "none" : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "Overview" && (
        <div className="space-y-5">
          {/* Domain connection card */}
          <Card>
            <p className="text-sm font-black mb-4" style={{ color: "#111827" }}>Domain Connection</p>

            {/* Step 1 — Connect Google Account */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: gscOauthConnected ? "rgba(22,163,74,0.06)" : "rgba(66,133,199,0.06)", border: `1px solid ${gscOauthConnected ? "rgba(22,163,74,0.2)" : "rgba(66,133,199,0.2)"}` }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-bold" style={{ color: gscOauthConnected ? "#16A34A" : "#111827" }}>
                    {gscOauthConnected ? "✓ Step 1: Google Account Connected" : "Step 1: Connect Your Google Account"}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>
                    {gscOauthConnected
                      ? "Your Google Search Console data is accessible."
                      : "Authorize WorldDigital to read your Search Console data."}
                  </p>
                </div>
                {!gscOauthConnected && (
                  <a
                    href={`/api/v1/seo/connect-google?t=${typeof window !== "undefined" ? (localStorage.getItem("wdai_token") ?? "") : ""}`}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white transition-all"
                    style={{ background: "linear-gradient(to right,#4285C7,#1e6db7)", textDecoration: "none" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity=".9"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".9"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" opacity=".9"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".9"/>
                    </svg>
                    Connect with Google
                  </a>
                )}
              </div>
            </div>

            {/* Step 2 — Enter domain */}
            <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>Step 2: Enter Your Domain</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="https://yourbusiness.com"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm border"
                style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827", outline: "none" }}
              />
              <button
                onClick={connectDomain}
                disabled={connecting}
                className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(to right,#4285C7,#1e6db7)" }}
              >
                {connecting ? "Connecting…" : profile?.domain ? "Reconnect" : "Connect Domain"}
              </button>
            </div>
            {connectMsg && (
              <p className="text-xs mt-2 font-medium" style={{ color: connectMsg.ok ? "#16A34A" : "#D97706" }}>
                {connectMsg.text}
              </p>
            )}
            {serviceAccountEmail && !profile?.domainVerified && (
              <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#92400E" }}>
                <p className="font-bold mb-1">📋 How to verify your domain:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline">Google Search Console</a></li>
                  <li>Select your property</li>
                  <li>Go to Settings → Users and permissions</li>
                  <li>Add <span className="font-mono font-bold">{serviceAccountEmail}</span> as a Viewer</li>
                  <li>Click "Reconnect" above</li>
                </ol>
              </div>
            )}
            {!gscConfigured && !gscOauthConnected && (
              <p className="mt-2 text-xs" style={{ color: "#9CA3AF" }}>
                Connect your Google account above to enable live keyword data.
              </p>
            )}
          </Card>

          {/* KPI stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Organic Clicks", value: totalClicks > 0 ? totalClicks.toLocaleString() : "—", sub: "Last 90 days", color: "#4285C7" },
              { label: "Impressions", value: totalImpressions > 0 ? totalImpressions.toLocaleString() : "—", sub: "Last 90 days", color: "#16A34A" },
              { label: "Avg Position", value: avgPosition, sub: "Overall ranking", color: "#D97706" },
              { label: "Site SEO Score", value: avgAuditScore > 0 ? `${avgAuditScore}/100` : "—", sub: "Run audit to score", color: "#C13A2A" },
            ].map(({ label, value, sub, color }) => (
              <Card key={label}>
                <p className="text-2xl font-black" style={{ color }}>{value}</p>
                <p className="text-xs font-bold mt-1" style={{ color: "#374151" }}>{label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>
              </Card>
            ))}
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>Keywords Tracked</p>
              <p className="text-3xl font-black" style={{ color: "#111827" }}>{keywords.length || "—"}</p>
              {kwChartData.length > 0 && <div className="mt-3"><MiniBarChart data={kwChartData} max={kwChartMax} /></div>}
            </Card>
            <Card>
              <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>Ranking Opportunities</p>
              <p className="text-3xl font-black" style={{ color: "#111827" }}>{opportunities.length || keywords.filter(k => k.position >= 4 && k.position <= 20).length || "—"}</p>
              <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Keywords in positions 4–20</p>
            </Card>
            <Card>
              <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>Blog Posts Created</p>
              <p className="text-3xl font-black" style={{ color: "#111827" }}>{blogPosts.length || "—"}</p>
              <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{blogPosts.filter(p => p.status === "published").length} published</p>
            </Card>
          </div>

          {/* Status checklist */}
          <Card>
            <p className="text-sm font-black mb-4" style={{ color: "#111827" }}>Setup Checklist</p>
            <div className="space-y-3">
              {[
                { label: "Google account connected", done: gscOauthConnected },
                { label: "Domain connected", done: !!profile?.domain },
                { label: "Google Search Console verified", done: !!profile?.domainVerified },
                { label: "Keyword data synced", done: !!profile?.lastKeywordSync },
                { label: "Site audit completed", done: !!profile?.lastAuditAt || auditPages.length > 0 },
                { label: "First blog post generated", done: blogPosts.length > 0 },
                { label: "AI recommendations loaded", done: recs.length > 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)" }}>
                    {done ? (
                      <svg className="w-3 h-3" style={{ color: "#16A34A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <div className="w-2 h-2 rounded-full" style={{ background: "#D1D5DB" }} />
                    )}
                  </div>
                  <span className="text-xs" style={{ color: done ? "#16A34A" : "#6B7280", fontWeight: done ? 600 : 400 }}>{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "Analytics" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>Traffic Analytics</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Daily clicks &amp; impressions from Google Search Console · last 90 days</p>
            </div>
            <button onClick={loadAnalytics} disabled={analyticsLoading} className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: "#4285C7" }}>
              {analyticsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {analyticsLoading ? (
            <Card><div className="py-8"><Spinner /></div></Card>
          ) : !profile?.domainVerified ? (
            <Card><EmptyBox icon="🌐" title="Domain not verified" sub="Connect and verify your domain in the Overview tab first." /></Card>
          ) : analytics.length === 0 ? (
            <Card><EmptyBox icon="📈" title="No analytics data yet" sub="Data appears once your domain is verified in Search Console. It may take up to 48 hours." /></Card>
          ) : (
            <div className="space-y-4">
              {(() => {
                const totalC = analytics.reduce((s, d) => s + d.clicks, 0);
                const totalI = analytics.reduce((s, d) => s + d.impressions, 0);
                const avgPos = analytics.length > 0 ? (analytics.reduce((s, d) => s + d.position, 0) / analytics.length).toFixed(1) : "—";
                const avgCtr = analytics.length > 0 ? ((analytics.reduce((s, d) => s + d.ctr, 0) / analytics.length) * 100).toFixed(2) : "—";
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Clicks", value: totalC.toLocaleString(), color: "#4285C7" },
                      { label: "Total Impressions", value: totalI.toLocaleString(), color: "#16A34A" },
                      { label: "Avg Position", value: avgPos, color: "#D97706" },
                      { label: "Avg CTR", value: `${avgCtr}%`, color: "#C13A2A" },
                    ].map(({ label, value, color }) => (
                      <Card key={label} className="text-center">
                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                        <p className="text-[10px] font-semibold mt-1" style={{ color: "#9CA3AF" }}>{label}</p>
                      </Card>
                    ))}
                  </div>
                );
              })()}
              <Card>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-xs font-bold" style={{ color: "#374151" }}>Daily Traffic — last 90 days</p>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "#4285C7" }}>
                      <span className="inline-block w-6 h-0.5 rounded" style={{ background: "#4285C7" }} /> Clicks
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "#9CA3AF" }}>
                      <span className="inline-block w-6 h-0.5 rounded" style={{ background: "#E2E8F0" }} /> Impressions (scaled)
                    </span>
                  </div>
                </div>
                <LineChart data={analytics} />
              </Card>
              <Card>
                <p className="text-xs font-bold mb-3" style={{ color: "#374151" }}>Last 14 Days</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                        {["Date", "Clicks", "Impressions", "CTR", "Avg Position"].map(h => (
                          <th key={h} className="pb-2 text-left font-bold" style={{ color: "#9CA3AF", fontSize: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...analytics].reverse().slice(0, 14).map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #F8FAFC" }}>
                          <td className="py-2 pr-4 font-medium" style={{ color: "#111827" }}>{row.date}</td>
                          <td className="py-2 pr-4 font-bold" style={{ color: "#4285C7" }}>{row.clicks.toLocaleString()}</td>
                          <td className="py-2 pr-4" style={{ color: "#374151" }}>{row.impressions.toLocaleString()}</td>
                          <td className="py-2 pr-4" style={{ color: "#374151" }}>{(row.ctr * 100).toFixed(2)}%</td>
                          <td className="py-2">
                            <span className="font-black" style={{ color: row.position <= 3 ? "#16A34A" : row.position <= 10 ? "#D97706" : "#C13A2A" }}>
                              {row.position.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── KEYWORDS ── */}
      {tab === "Keywords" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>Keyword Rankings</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Real data from Google Search Console · last 90 days</p>
            </div>
            <button onClick={loadKeywords} disabled={kwLoading} className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: "#4285C7" }}>
              {kwLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {kwLoading ? (
            <Card><div className="py-8"><Spinner /></div></Card>
          ) : kwError === "no_domain" ? (
            <Card><EmptyBox icon="🌐" title="No domain connected" sub="Go to Overview and connect your domain first." /></Card>
          ) : kwError === "not_verified" ? (
            <Card><EmptyBox icon="🔐" title="Domain not verified in Search Console" sub="Add the service account as a viewer in Google Search Console and click Reconnect." /></Card>
          ) : kwError === "no_auth" ? (
            <Card><EmptyBox icon="🔑" title="Google Search Console not configured" sub="Contact support to enable the GSC API connection." /></Card>
          ) : keywords.length === 0 ? (
            <Card><EmptyBox icon="📊" title="No keyword data yet" sub="Keyword data appears after your domain is verified in Google Search Console." /></Card>
          ) : (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Keywords", value: keywords.length },
                  { label: "Total Clicks", value: totalClicks.toLocaleString() },
                  { label: "Total Impressions", value: totalImpressions.toLocaleString() },
                  { label: "Avg CTR", value: keywords.length > 0 ? `${(keywords.reduce((s, k) => s + k.ctr, 0) / keywords.length * 100).toFixed(1)}%` : "—" },
                ].map(({ label, value }) => (
                  <Card key={label} className="text-center">
                    <p className="text-xl font-black" style={{ color: "#111827" }}>{value}</p>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#9CA3AF" }}>{label}</p>
                  </Card>
                ))}
              </div>

              {/* Chart */}
              <Card>
                <p className="text-xs font-bold mb-3" style={{ color: "#374151" }}>Top Keywords by Impressions</p>
                <div className="space-y-2">
                  {keywords.slice(0, 10).map((k, i) => {
                    const pct = totalImpressions > 0 ? (k.impressions / keywords[0].impressions) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs w-48 truncate" style={{ color: "#374151" }}>{k.keyword}</span>
                        <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(to right,#4285C7,#1e6db7)" }} />
                        </div>
                        <span className="text-xs w-16 text-right" style={{ color: "#6B7280" }}>{k.impressions.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Full table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                        {["Keyword", "Position", "Clicks", "Impressions", "CTR", "Trend"].map((h) => (
                          <th key={h} className="pb-2 text-left font-bold" style={{ color: "#9CA3AF", fontSize: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map((k, i) => {
                        const posColor = k.position <= 3 ? "#16A34A" : k.position <= 10 ? "#D97706" : "#C13A2A";
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #F8FAFC" }}>
                            <td className="py-2.5 pr-4 font-medium max-w-xs truncate" style={{ color: "#111827" }}>{k.keyword}</td>
                            <td className="py-2.5 pr-4">
                              <span className="font-black" style={{ color: posColor }}>{k.position.toFixed(1)}</span>
                            </td>
                            <td className="py-2.5 pr-4" style={{ color: "#374151" }}>{k.clicks.toLocaleString()}</td>
                            <td className="py-2.5 pr-4" style={{ color: "#374151" }}>{k.impressions.toLocaleString()}</td>
                            <td className="py-2.5 pr-4" style={{ color: "#374151" }}>{(k.ctr * 100).toFixed(1)}%</td>
                            <td className="py-2.5">
                              <div className="w-16 h-5">
                                <MiniBarChart data={[k.clicks * 0.8, k.clicks * 0.9, k.clicks, k.clicks * 1.05, k.clicks]} max={k.clicks * 1.1} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── OPPORTUNITIES ── */}
      {tab === "Opportunities" && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-black" style={{ color: "#111827" }}>Ranking Opportunities</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Keywords in positions 4–20 that can be pushed to top 3 with optimization</p>
          </div>

          {oppLoading ? (
            <Card><div className="py-8"><Spinner /></div></Card>
          ) : opportunities.length === 0 ? (
            <Card><EmptyBox icon="⚡" title="No opportunities detected yet" sub="Opportunities appear after your keyword data syncs from Google Search Console." /></Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Total Opportunities", value: opportunities.length, color: "#4285C7" },
                  { label: "Est. Traffic Gain", value: opportunities.reduce((s, o) => s + o.estimatedTrafficGain, 0).toLocaleString(), color: "#16A34A" },
                  { label: "Quick Wins (Low Diff)", value: opportunities.filter(o => o.difficulty === "low").length, color: "#D97706" },
                ].map(({ label, value, color }) => (
                  <Card key={label} className="text-center">
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                    <p className="text-[10px] font-semibold mt-1" style={{ color: "#9CA3AF" }}>{label}</p>
                  </Card>
                ))}
              </div>

              {opportunities.map((opp, i) => {
                const diffColor = opp.difficulty === "low" ? "#16A34A" : opp.difficulty === "medium" ? "#D97706" : "#C13A2A";
                return (
                  <Card key={i}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate" style={{ color: "#111827" }}>{opp.keyword}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>Current: #{opp.position.toFixed(0)}</span>
                          <span className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>{opp.impressions.toLocaleString()} impressions</span>
                          <span className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>{opp.clicks} clicks</span>
                          <Badge text={`${opp.difficulty.toUpperCase()} DIFF`} color={diffColor} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black" style={{ color: "#16A34A" }}>+{opp.estimatedTrafficGain.toLocaleString()}</p>
                        <p className="text-[10px] font-semibold" style={{ color: "#9CA3AF" }}>est. clicks/mo</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold" style={{ color: "#6B7280" }}>From #{opp.position.toFixed(0)} → Top 3 potential</span>
                        <span className="text-[10px] font-semibold" style={{ color: "#9CA3AF" }}>{Math.round(((opp.position - 1) / opp.position) * 100)}% improvement needed</span>
                      </div>
                      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "#F1F5F9" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.max(10, 100 - ((opp.position - 1) / 20) * 100)}%`, background: `linear-gradient(to right, ${diffColor}, ${diffColor}88)` }} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PAGES ── */}
      {tab === "Pages" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>Top Pages</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Best-performing pages by organic traffic · last 90 days</p>
            </div>
            <button onClick={loadPages} disabled={pagesLoading} className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: "#4285C7" }}>
              {pagesLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {pagesLoading ? (
            <Card><div className="py-8"><Spinner /></div></Card>
          ) : !profile?.domainVerified ? (
            <Card><EmptyBox icon="🌐" title="Domain not verified" sub="Connect your domain in the Overview tab first." /></Card>
          ) : seoPages.length === 0 ? (
            <Card><EmptyBox icon="📄" title="No page data yet" sub="Page performance appears once your domain is verified in Search Console." /></Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Pages Tracked", value: seoPages.length, color: "#4285C7" },
                  { label: "Total Clicks", value: seoPages.reduce((s, p) => s + p.clicks, 0).toLocaleString(), color: "#16A34A" },
                  { label: "Top Page Clicks", value: seoPages[0]?.clicks.toLocaleString() ?? "—", color: "#D97706" },
                ].map(({ label, value, color }) => (
                  <Card key={label} className="text-center">
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                    <p className="text-[10px] font-semibold mt-1" style={{ color: "#9CA3AF" }}>{label}</p>
                  </Card>
                ))}
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                        {["Page", "Clicks", "Impressions", "CTR", "Avg Pos"].map(h => (
                          <th key={h} className="pb-2 text-left font-bold" style={{ color: "#9CA3AF", fontSize: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {seoPages.map((pg, i) => {
                        const posColor = pg.position <= 3 ? "#16A34A" : pg.position <= 10 ? "#D97706" : "#C13A2A";
                        const pathOnly = (() => { try { return new URL(pg.page).pathname || "/"; } catch { return pg.page; } })();
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #F8FAFC" }}>
                            <td className="py-2.5 pr-4 max-w-xs">
                              <a href={pg.page} target="_blank" rel="noopener noreferrer"
                                className="font-medium hover:underline truncate block max-w-xs"
                                style={{ color: "#4285C7" }} title={pg.page}>{pathOnly}</a>
                            </td>
                            <td className="py-2.5 pr-4 font-bold" style={{ color: "#111827" }}>{pg.clicks.toLocaleString()}</td>
                            <td className="py-2.5 pr-4" style={{ color: "#374151" }}>{pg.impressions.toLocaleString()}</td>
                            <td className="py-2.5 pr-4" style={{ color: "#374151" }}>{(pg.ctr * 100).toFixed(1)}%</td>
                            <td className="py-2.5">
                              <span className="font-black" style={{ color: posColor }}>{pg.position.toFixed(1)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── SITE AUDIT ── */}
      {tab === "Site Audit" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>On-Page SEO Audit</p>
              {lastAuditAt && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Last run: {new Date(lastAuditAt).toLocaleDateString()}</p>}
            </div>
            <button
              onClick={runAudit}
              disabled={auditRunning || !profile?.domain}
              className="px-5 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50 transition-all"
              style={{ background: auditRunning ? "#9CA3AF" : "linear-gradient(to right,#4285C7,#1e6db7)" }}
            >
              {auditRunning ? (
                <span className="flex items-center gap-2"><Spinner />Crawling pages…</span>
              ) : auditPages.length > 0 ? "Re-run Audit" : "Run Audit Now"}
            </button>
          </div>

          {!profile?.domain && (
            <Card><EmptyBox icon="🌐" title="No domain connected" sub="Connect your domain in the Overview tab first." /></Card>
          )}

          {auditLoading && <Card><div className="py-8"><Spinner /></div></Card>}

          {!auditLoading && auditPages.length > 0 && (
            <div className="space-y-4">
              {/* Score summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Avg Score", value: `${avgAuditScore}/100` },
                  { label: "Pages Audited", value: auditPages.length },
                  { label: "Pages ≥ 80", value: auditPages.filter(p => p.score >= 80).length },
                  { label: "Issues Found", value: auditPages.reduce((s, p) => s + p.issues.length, 0) },
                ].map(({ label, value }) => (
                  <Card key={label} className="text-center">
                    <p className="text-xl font-black" style={{ color: "#111827" }}>{value}</p>
                    <p className="text-[10px] font-semibold mt-1" style={{ color: "#9CA3AF" }}>{label}</p>
                  </Card>
                ))}
              </div>

              {auditPages.map((page, i) => (
                <Card key={i}>
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <ScoreRing score={page.score} size={64} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-black" style={{ color: page.score >= 75 ? "#16A34A" : page.score >= 50 ? "#D97706" : "#C13A2A" }}>{page.score}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {(page.pageSpeedMobile != null || page.pageSpeedDesktop != null) && (
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {page.pageSpeedMobile != null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                              background: page.pageSpeedMobile >= 75 ? "rgba(22,163,74,0.1)" : page.pageSpeedMobile >= 50 ? "rgba(245,158,11,0.1)" : "rgba(193,58,42,0.1)",
                              color: page.pageSpeedMobile >= 75 ? "#16A34A" : page.pageSpeedMobile >= 50 ? "#D97706" : "#C13A2A",
                            }}>📱 Mobile {page.pageSpeedMobile}</span>
                          )}
                          {page.pageSpeedDesktop != null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                              background: page.pageSpeedDesktop >= 75 ? "rgba(22,163,74,0.1)" : page.pageSpeedDesktop >= 50 ? "rgba(245,158,11,0.1)" : "rgba(193,58,42,0.1)",
                              color: page.pageSpeedDesktop >= 75 ? "#16A34A" : page.pageSpeedDesktop >= 50 ? "#D97706" : "#C13A2A",
                            }}>🖥 Desktop {page.pageSpeedDesktop}</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs font-black truncate" style={{ color: "#111827" }}>{page.url}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        <div className="text-[10px]">
                          <span className="font-bold" style={{ color: "#6B7280" }}>Title: </span>
                          <span style={{ color: page.title ? "#16A34A" : "#C13A2A" }}>{page.title ? `${page.title.slice(0, 30)}…` : "Missing"}</span>
                        </div>
                        <div className="text-[10px]">
                          <span className="font-bold" style={{ color: "#6B7280" }}>Meta: </span>
                          <span style={{ color: page.metaDescription ? "#16A34A" : "#C13A2A" }}>{page.metaDescription ? "Set" : "Missing"}</span>
                        </div>
                        <div className="text-[10px]">
                          <span className="font-bold" style={{ color: "#6B7280" }}>H1: </span>
                          <span style={{ color: page.h1 ? "#16A34A" : "#C13A2A" }}>{page.h1 ? "Present" : "Missing"}</span>
                        </div>
                        <div className="text-[10px]">
                          <span className="font-bold" style={{ color: "#6B7280" }}>Words: </span>
                          <span style={{ color: page.wordCount >= 300 ? "#16A34A" : "#C13A2A" }}>{page.wordCount}</span>
                        </div>
                      </div>
                      {page.issues.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {page.issues.map((issue, j) => (
                            <div key={j} className="flex items-start gap-1.5">
                              <span style={{ color: "#C13A2A", fontSize: 10 }}>⚠</span>
                              <span className="text-[10px]" style={{ color: "#6B7280" }}>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {page.issues.length === 0 && (
                        <p className="text-[10px] mt-1" style={{ color: "#16A34A" }}>✓ No issues found — this page is well-optimized!</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!auditLoading && auditPages.length === 0 && profile?.domain && !auditRunning && (
            <Card><EmptyBox icon="🔍" title="No audit run yet" sub="Click 'Run Audit Now' to crawl your website and get a detailed SEO score for each page." /></Card>
          )}
        </div>
      )}

      {/* ── BLOG CONTENT ── */}
      {tab === "Blog Content" && (
        <div className="space-y-5">
          {/* Generate */}
          <Card>
            <p className="text-sm font-black mb-1" style={{ color: "#111827" }}>Generate AI Blog Post</p>
            <p className="text-xs mb-4" style={{ color: "#6B7280" }}>AI writes a full SEO-optimized post targeting your keyword (800–1,200 words)</p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                value={genKeyword}
                onChange={(e) => setGenKeyword(e.target.value)}
                placeholder='Target keyword, e.g. "best HVAC repair in Dallas"'
                className="flex-1 rounded-xl px-4 py-2.5 text-sm border"
                style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827", outline: "none" }}
                onKeyDown={(e) => e.key === "Enter" && generateBlog()}
              />
              <button
                onClick={generateBlog}
                disabled={generating || !genKeyword.trim()}
                className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50"
                style={{ background: generating ? "#9CA3AF" : "linear-gradient(to right,#4285C7,#C13A2A)" }}
              >
                {generating ? (
                  <span className="flex items-center gap-2"><Spinner />Generating…</span>
                ) : "Generate Post"}
              </button>
            </div>
          </Card>

          {blogLoading ? (
            <Card><div className="py-8"><Spinner /></div></Card>
          ) : editingPost ? (
            /* Editor view */
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black" style={{ color: "#111827" }}>Editing Post</p>
                <button onClick={() => setEditingPost(null)} className="text-xs font-semibold" style={{ color: "#6B7280" }}>← Back to list</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold block mb-1" style={{ color: "#6B7280" }}>TITLE</label>
                  <input
                    defaultValue={editingPost.title}
                    className="w-full rounded-xl px-3 py-2 text-sm border"
                    style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}
                    onBlur={(e) => { editingPost.title = e.target.value; }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1" style={{ color: "#6B7280" }}>META TITLE (50–60 chars)</label>
                  <input
                    defaultValue={editingPost.metaTitle}
                    className="w-full rounded-xl px-3 py-2 text-sm border"
                    style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}
                    onBlur={(e) => { editingPost.metaTitle = e.target.value; }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1" style={{ color: "#6B7280" }}>META DESCRIPTION (120–160 chars)</label>
                  <textarea
                    defaultValue={editingPost.metaDescription}
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-sm border resize-none"
                    style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}
                    onBlur={(e) => { editingPost.metaDescription = e.target.value; }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1" style={{ color: "#6B7280" }}>CONTENT (Markdown)</label>
                  <textarea
                    value={editContent || editingPost.content}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    className="w-full rounded-xl px-3 py-2 text-xs border resize-none font-mono"
                    style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => savePost(editingPost._id, { title: editingPost.title, metaTitle: editingPost.metaTitle, metaDescription: editingPost.metaDescription, content: editContent || editingPost.content })}
                    className="px-5 py-2 rounded-xl text-xs font-black text-white"
                    style={{ background: "#4285C7" }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => savePost(editingPost._id, { status: "reviewed" })}
                    className="px-5 py-2 rounded-xl text-xs font-black text-white"
                    style={{ background: "#D97706" }}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => { savePost(editingPost._id, { status: "published" }); setEditingPost(null); }}
                    className="px-5 py-2 rounded-xl text-xs font-black text-white"
                    style={{ background: "#16A34A" }}
                  >
                    Publish Post
                  </button>
                </div>
              </div>
            </Card>
          ) : blogPosts.length === 0 ? (
            <Card><EmptyBox icon="✍️" title="No blog posts yet" sub="Generate your first SEO-optimized blog post above. We'll target your top keyword opportunities." /></Card>
          ) : (
            <div className="space-y-3">
              {blogPosts.map((post) => {
                const statusColor = post.status === "published" ? "#16A34A" : post.status === "reviewed" ? "#D97706" : "#6B7280";
                return (
                  <Card key={post._id}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-black truncate" style={{ color: "#111827" }}>{post.title}</p>
                          <Badge text={post.status.toUpperCase()} color={statusColor} />
                        </div>
                        <p className="text-xs truncate" style={{ color: "#6B7280" }}>{post.metaDescription}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>🎯 {post.targetKeyword}</span>
                          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                          {post.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#F1F5F9", color: "#6B7280" }}>{t}</span>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setEditingPost(post); setEditContent(post.content); }}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}
                        >
                          Edit
                        </button>
                        {post.status !== "published" && (
                          <button
                            onClick={() => savePost(post._id, { status: "published" })}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white"
                            style={{ background: "#16A34A" }}
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => deletePost(post._id)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{ background: "rgba(193,58,42,0.08)", color: "#C13A2A" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab === "Reports" && (
        <div className="space-y-5">
          <Card>
            <p className="text-sm font-black mb-1" style={{ color: "#111827" }}>Monthly SEO Report</p>
            <p className="text-xs mb-5" style={{ color: "#6B7280" }}>
              Sends a full HTML email report with rankings, traffic data, opportunities, and next-month strategy.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Keywords in Report", value: Math.min(keywords.length, 8) },
                { label: "Opportunities", value: opportunities.length || keywords.filter(k => k.position >= 4 && k.position <= 20).length },
                { label: "Recommendations", value: recs.length },
                { label: "Blog Posts", value: blogPosts.length },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <p className="text-xl font-black" style={{ color: "#111827" }}>{value}</p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#9CA3AF" }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                placeholder="customer@email.com"
                type="email"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm border"
                style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827", outline: "none" }}
              />
              <button
                onClick={sendReport}
                disabled={sending || !reportEmail.trim()}
                className="shrink-0 px-6 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50"
                style={{ background: sending ? "#9CA3AF" : "linear-gradient(to right,#4285C7,#C13A2A)" }}
              >
                {sending ? "Sending…" : "Send Report"}
              </button>
            </div>
            {reportMsg && (
              <p className="text-xs mt-2 font-medium" style={{ color: reportMsg.ok ? "#16A34A" : "#C13A2A" }}>
                {reportMsg.text}
              </p>
            )}
          </Card>

          <Card>
            <p className="text-sm font-black mb-3" style={{ color: "#111827" }}>What's included in the report</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: "📊", title: "Traffic Summary", desc: "Organic clicks, impressions, avg position, CTR" },
                { icon: "🏆", title: "Top Keywords", desc: "Your 8 highest-impression keywords with rankings" },
                { icon: "⚡", title: "Opportunities", desc: "Keywords ranked 4–20 with estimated traffic gain" },
                { icon: "🎯", title: "Action Items", desc: "Top 5 AI recommendations for next month" },
                { icon: "✍️", title: "Content Published", desc: "Blog posts created this period" },
                { icon: "📈", title: "Next Month Strategy", desc: "AI-generated growth plan based on your data" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#F8FBFE" }}>
                  <span className="text-xl shrink-0">{icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#111827" }}>{title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
      {tab === "Recommendations" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>AI SEO Recommendations</p>
              {recsDate && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Generated {new Date(recsDate).toLocaleDateString()} · refreshes weekly</p>}
            </div>
            <button onClick={() => loadRecommendations(true)} disabled={recsLoading} className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: "#4285C7" }}>
              {recsLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {recsLoading ? (
            <Card><div className="py-8"><Spinner /></div></Card>
          ) : recs.length === 0 ? (
            <Card><EmptyBox icon="🤖" title="No recommendations yet" sub="Click Refresh to generate AI-powered SEO action items based on your current data." /></Card>
          ) : (
            <div className="space-y-3">
              {recs.map((rec, i) => {
                const priorityColor = rec.priority === "high" ? "#C13A2A" : rec.priority === "medium" ? "#D97706" : "#16A34A";
                const priorityBg = rec.priority === "high" ? "rgba(193,58,42,0.06)" : rec.priority === "medium" ? "rgba(245,158,11,0.06)" : "rgba(22,163,74,0.06)";
                return (
                  <Card key={i}>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white" style={{ background: priorityColor }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-black" style={{ color: "#111827" }}>{rec.action}</p>
                          <Badge text={`${rec.priority.toUpperCase()} PRIORITY`} color={priorityColor} />
                        </div>
                        <p className="text-xs mb-2" style={{ color: "#6B7280" }}>{rec.reason}</p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold" style={{ background: priorityBg, color: priorityColor }}>
                          📈 {rec.estimatedImpact}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
