"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";

interface AnalyticsOverview {
  overview: { totalContent: number; published: number; drafts: number; approved: number; queued: number };
  postMetrics: {
    totalPublishedPosts: number;
    totalImpressions: number;
    totalClicks: number;
    avgEngagementRate: number;
    bestPlatform: string | null;
    topPost: { id: string; platform: string; businessName: string; impressions: number; clicks: number; engagementRate: number; postUrl?: string; publishedAt: string } | null;
  };
  platformCounts: Record<string, number>;
  aiAvailable: boolean;
  socialPlatformsConfigured: Record<string, boolean>;
}

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  facebook:       { label: "Facebook",     color: "#1877F2" },
  meta:           { label: "Facebook",     color: "#1877F2" },
  instagram:      { label: "Instagram",    color: "#E1306C" },
  tiktok:         { label: "TikTok",       color: "#6366F1" },
  linkedin:       { label: "LinkedIn",     color: "#0A66C2" },
  x:              { label: "X / Twitter", color: "#374151" },
  youtube_shorts: { label: "YouTube",      color: "#FF0000" },
  snapchat:       { label: "Snapchat",     color: "#CA8A04" },
};

type AnalyticsTab = "all" | "meta" | "google" | "snapchat";

const TABS: Array<{ id: AnalyticsTab; label: string; platform?: string }> = [
  { id: "all",      label: "All Platforms" },
  { id: "meta",     label: "Meta",     platform: "meta" },
  { id: "google",   label: "Google",   platform: "google" },
  { id: "snapchat", label: "Snapchat", platform: "snapchat" },
];

function Stat({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-3xl font-black mb-0.5" style={{ color }}>{value}</p>
      <p className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

function PendingState({ platform, configured }: { platform: string; configured: boolean }) {
  return (
    <div className="rounded-2xl p-10 text-center bg-white" style={{ border: "2px dashed rgba(0,0,0,0.1)" }}>
      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
        <PlatformIcon platform={platform} size={36} rounded="rounded-xl" />
      </div>
      {configured ? (
        <>
          <p className="text-sm font-bold mb-1" style={{ color: "#111827" }}>Analytics integration pending</p>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Credentials are configured. Platform-specific impression, click, and conversion data will appear here once the analytics sync is active.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(66,133,199,0.08)", color: "#4285C7" }}>
            ● API credentials present
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-bold mb-1" style={{ color: "#111827" }}>Not connected</p>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Your {PLATFORM_META[platform]?.label ?? platform} account isn't connected yet. Once connected, platform-specific analytics will appear here automatically.
          </p>
          <a
            href="mailto:support@worlddigital.ai"
            className="mt-4 inline-block px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
          >
            Contact Support to Connect
          </a>
        </>
      )}
    </div>
  );
}

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<AnalyticsTab>("all");

  const load = () => {
    setLoading(true);
    apiFetch<AnalyticsOverview>("/v1/dashboard/analytics").then(r => {
      if (r.ok) setData(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    await apiFetch("/v1/dashboard/analytics/sync", { method: "POST" });
    setSyncing(false);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  if (!data) return <div className="text-center py-16" style={{ color: "#6B7280" }}>Unable to load analytics.</div>;

  const totalPlatformPosts = Object.values(data.platformCounts).reduce((a, b) => a + b, 0);
  const hasPostMetrics = data.postMetrics.totalPublishedPosts > 0;

  const metaConfigured = !!(data.socialPlatformsConfigured["meta"] || data.socialPlatformsConfigured["facebook"]);
  const googleConfigured = !!(data.socialPlatformsConfigured["google"] || data.socialPlatformsConfigured["google_ads"]);
  const snapchatConfigured = !!data.socialPlatformsConfigured["snapchat"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Analytics Overview</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Performance summary across all published content and platforms</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2"
          style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
        >
          <svg className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? "Syncing…" : "Sync Analytics"}
        </button>
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: "rgba(0,0,0,0.04)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-1 justify-center"
            style={{
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#111827" : "#6B7280",
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t.platform && <PlatformIcon platform={t.platform} size={16} rounded="rounded-sm" />}
            {t.label}
          </button>
        ))}
      </div>

      {!data.aiAvailable && tab === "all" && (
        <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.25)", color: "#92400E" }}>
          <strong>AI content generation not connected.</strong> Add <code>CHAT_BOT</code> to enable live AI generation.
        </div>
      )}

      {/* ── All Platforms tab ─────────────────────────────────────────────── */}
      {tab === "all" && (
        <>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>CONTENT</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Stat label="Total Content"  value={data.overview.totalContent} color="#4285C7" />
              <Stat label="Published"      value={data.overview.published}    color="#16A34A" sub="Posted to socials" />
              <Stat label="Approved"       value={data.overview.approved}     color="#D97706" sub="Ready to queue" />
              <Stat label="In Queue"       value={data.overview.queued}       color="#7C3AED" sub="Awaiting publish" />
              <Stat label="Drafts"         value={data.overview.drafts}       color="#6B7280" sub="In progress" />
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>PERFORMANCE</p>
            {hasPostMetrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Total Posts"    value={data.postMetrics.totalPublishedPosts}              color="#111827" />
                <Stat label="Impressions"    value={data.postMetrics.totalImpressions.toLocaleString()} color="#4285C7" sub="across all posts" />
                <Stat label="Clicks"         value={data.postMetrics.totalClicks.toLocaleString()}      color="#C13A2A" sub="to destination URL" />
                <Stat label="Avg Engagement" value={`${data.postMetrics.avgEngagementRate}%`}           color="#16A34A" sub="rate" />
              </div>
            ) : (
              <div className="rounded-2xl p-8 text-center bg-white" style={{ border: "2px dashed rgba(0,0,0,0.1)" }}>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm font-bold" style={{ color: "#111827" }}>No published posts yet</p>
                <p className="text-xs mt-1 mb-4" style={{ color: "#6B7280" }}>Performance metrics will appear here once you publish and sync analytics.</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/dashboard/content-studio" className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>Generate Content</Link>
                  <Link href="/dashboard/publishing" className="px-4 py-2 rounded-xl text-xs font-semibold border" style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#374151" }}>Publishing Queue</Link>
                </div>
              </div>
            )}
          </div>

          {hasPostMetrics && (data.postMetrics.bestPlatform || data.postMetrics.topPost) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.postMetrics.bestPlatform && (
                <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Best Platform</p>
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={data.postMetrics.bestPlatform} size={36} rounded="rounded-xl" />
                    <div>
                      <p className="text-lg font-black" style={{ color: "#111827" }}>{PLATFORM_META[data.postMetrics.bestPlatform]?.label || data.postMetrics.bestPlatform}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>Highest engagement rate</p>
                    </div>
                  </div>
                </div>
              )}
              {data.postMetrics.topPost && (
                <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Top Performing Post</p>
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={data.postMetrics.topPost.platform} size={36} rounded="rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{data.postMetrics.topPost.businessName}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>{data.postMetrics.topPost.impressions.toLocaleString()} impressions · {data.postMetrics.topPost.engagementRate}% engagement</p>
                    </div>
                    {data.postMetrics.topPost.postUrl && (
                      <a href={data.postMetrics.topPost.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs shrink-0 font-semibold" style={{ color: "#4285C7" }}>View →</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black" style={{ color: "#111827" }}>Published by Platform</p>
                <Link href="/dashboard/analytics/published-posts" className="text-xs font-semibold" style={{ color: "#4285C7" }}>All posts →</Link>
              </div>
              {totalPlatformPosts === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>No posts published yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.platformCounts).sort((a, b) => b[1] - a[1]).map(([platform, count]) => {
                    const pct = Math.round((count / totalPlatformPosts) * 100);
                    const meta = PLATFORM_META[platform];
                    const color = meta?.color || "#6B7280";
                    return (
                      <div key={platform}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 font-medium" style={{ color: "#374151" }}>
                            <PlatformIcon platform={platform} size={16} rounded="rounded-sm" />
                            {meta?.label || platform}
                          </span>
                          <span className="font-bold" style={{ color: "#111827" }}>{count} post{count !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color === "#000000" || color === "#374151" ? "#374151" : color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black" style={{ color: "#111827" }}>Platform Connections</p>
                <Link href="/dashboard/analytics/performance" className="text-xs font-semibold" style={{ color: "#4285C7" }}>Performance →</Link>
              </div>
              <div className="space-y-2.5">
                {Object.entries(data.socialPlatformsConfigured).map(([platform, connected]) => {
                  const meta = PLATFORM_META[platform];
                  return (
                    <div key={platform} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                        <PlatformIcon platform={platform} size={20} rounded="rounded-md" />
                        {meta?.label || platform}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                        background: connected ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)",
                        color: connected ? "#16A34A" : "#9CA3AF",
                      }}>
                        {connected ? "● Live" : "○ API pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)", color: "#9CA3AF" }}>
                Configure social API credentials to enable live publishing and analytics.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Meta tab ──────────────────────────────────────────────────────── */}
      {tab === "meta" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <PlatformIcon platform="meta" size={28} rounded="rounded-xl" />
            <div>
              <p className="font-black" style={{ color: "#111827" }}>Meta — Facebook &amp; Instagram</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>Organic posting performance and ad campaign data</p>
            </div>
            <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
              background: metaConfigured ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)",
              color: metaConfigured ? "#16A34A" : "#9CA3AF",
            }}>
              {metaConfigured ? "● Connected" : "○ Not connected"}
            </span>
          </div>
          {hasPostMetrics && (data.platformCounts["meta"] || data.platformCounts["facebook"] || data.platformCounts["instagram"]) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Posts" value={(data.platformCounts["meta"] ?? 0) + (data.platformCounts["facebook"] ?? 0)} color="#0866FF" />
              <Stat label="Instagram Posts" value={data.platformCounts["instagram"] ?? 0} color="#E1306C" />
              <Stat label="Impressions" value={data.postMetrics.totalImpressions.toLocaleString()} color="#4285C7" sub="estimated" />
              <Stat label="Engagement" value={`${data.postMetrics.avgEngagementRate}%`} color="#16A34A" sub="avg rate" />
            </div>
          ) : (
            <PendingState platform="meta" configured={metaConfigured} />
          )}
          <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(8,102,255,0.04)", border: "1px solid rgba(8,102,255,0.12)", color: "#374151" }}>
            Full impression, click, and conversion breakdowns require Meta Ads API access. Connect your Meta Business Manager in the integrations panel.
          </div>
        </div>
      )}

      {/* ── Google tab ────────────────────────────────────────────────────── */}
      {tab === "google" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <PlatformIcon platform="google" size={28} rounded="rounded-xl" />
            <div>
              <p className="font-black" style={{ color: "#111827" }}>Google Ads</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>Search, display, shopping, and YouTube campaign data</p>
            </div>
            <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
              background: googleConfigured ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)",
              color: googleConfigured ? "#16A34A" : "#9CA3AF",
            }}>
              {googleConfigured ? "● Connected" : "○ Not connected"}
            </span>
          </div>
          <PendingState platform="google" configured={googleConfigured} />
          <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(66,133,199,0.04)", border: "1px solid rgba(66,133,199,0.12)", color: "#374151" }}>
            Google Ads analytics will appear here automatically once your account is connected. Contact support to get set up.
          </div>
        </div>
      )}

      {/* ── Snapchat tab ──────────────────────────────────────────────────── */}
      {tab === "snapchat" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <PlatformIcon platform="snapchat" size={28} rounded="rounded-xl" />
            <div>
              <p className="font-black" style={{ color: "#111827" }}>Snapchat Ads</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>Story ads, snap ads, and collection campaign performance</p>
            </div>
            <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
              background: snapchatConfigured ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)",
              color: snapchatConfigured ? "#16A34A" : "#9CA3AF",
            }}>
              {snapchatConfigured ? "● Connected" : "○ Not connected"}
            </span>
          </div>
          {hasPostMetrics && data.platformCounts["snapchat"] ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Posts"      value={data.platformCounts["snapchat"]} color="#FFCA28" />
              <Stat label="Impressions" value={data.postMetrics.totalImpressions.toLocaleString()} color="#4285C7" sub="estimated" />
              <Stat label="Engagement" value={`${data.postMetrics.avgEngagementRate}%`} color="#16A34A" sub="avg rate" />
              <Stat label="Best Platform" value={data.postMetrics.bestPlatform === "snapchat" ? "✓ This" : "—"} color="#CA8A04" />
            </div>
          ) : (
            <PendingState platform="snapchat" configured={snapchatConfigured} />
          )}
          <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(255,202,40,0.06)", border: "1px solid rgba(255,202,40,0.25)", color: "#374151" }}>
            Full Snapchat Ads analytics will appear here once your account is connected. Contact support to get set up.
          </div>
        </div>
      )}
    </div>
  );
}
