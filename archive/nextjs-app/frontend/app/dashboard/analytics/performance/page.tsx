"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";

interface PlatformPerf {
  platform: string;
  postCount: number;
  totalImpressions: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalClicks: number;
  avgCtr: number;
  avgEngagementRate: number;
}

interface TopPost {
  id: string;
  platform: string;
  businessName: string;
  publishedAt: string;
  impressions: number;
  clicks: number;
  engagementRate: number;
  postUrl?: string;
}

interface PerformanceData {
  byPlatform: PlatformPerf[];
  bestPlatform: string | null;
  topPost: TopPost | null;
  totals: {
    impressions: number;
    reach: number;
    clicks: number;
    likes: number;
    avgEngagementRate: number;
    totalPosts: number;
  };
}

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  facebook:      { label: "Facebook",      color: "#1877F2" },
  meta:          { label: "Facebook",      color: "#1877F2" },
  instagram:     { label: "Instagram",     color: "#E1306C" },
  tiktok:        { label: "TikTok",        color: "#6366F1" },
  linkedin:      { label: "LinkedIn",      color: "#0A66C2" },
  x:             { label: "X / Twitter",  color: "#374151" },
  youtube_shorts:{ label: "YouTube",       color: "#FF0000" },
  snapchat:      { label: "Snapchat",      color: "#CA8A04" },
};

function BigStat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: "#111827" }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PerformanceData>("/v1/dashboard/analytics/performance").then(r => {
      if (r.ok) setData(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  const noData = !data || data.totals.totalPosts === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Performance</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Aggregated results across all published posts and platforms</p>
      </div>

      {noData ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "white", border: "2px dashed rgba(0,0,0,0.1)" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-sm font-bold" style={{ color: "#111827" }}>No performance data yet</p>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            Publish your first post and sync analytics to see performance metrics here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <BigStat label="Total Posts" value={data!.totals.totalPosts} color="#111827" />
            <BigStat label="Impressions" value={data!.totals.impressions.toLocaleString()} color="#4285C7" />
            <BigStat label="Reach" value={data!.totals.reach.toLocaleString()} color="#7C3AED" />
            <BigStat label="Clicks" value={data!.totals.clicks.toLocaleString()} color="#C13A2A" />
            <BigStat label="Likes" value={data!.totals.likes.toLocaleString()} color="#E1306C" />
            <BigStat label="Avg Engagement" value={`${data!.totals.avgEngagementRate}%`} color="#16A34A" sub="rate" />
          </div>

          {data!.bestPlatform && (
            <div className="rounded-xl px-5 py-4 flex items-center gap-4" style={{ background: "linear-gradient(135deg,rgba(66,133,199,0.08),rgba(193,58,42,0.06))", border: "1px solid rgba(66,133,199,0.2)" }}>
              <PlatformIcon platform={data!.bestPlatform} size={40} rounded="rounded-xl" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Best Performing Platform</p>
                <p className="text-lg font-black" style={{ color: "#111827" }}>{PLATFORM_META[data!.bestPlatform]?.label || data!.bestPlatform}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs" style={{ color: "#6B7280" }}>Highest engagement rate</p>
                <p className="text-lg font-black" style={{ color: "#4285C7" }}>
                  {data!.byPlatform.find(p => p.platform === data!.bestPlatform)?.avgEngagementRate ?? 0}%
                </p>
              </div>
            </div>
          )}

          {data!.topPost && (
            <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Top Performing Post</p>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={data!.topPost.platform} size={40} rounded="rounded-xl" />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#111827" }}>{data!.topPost.businessName}</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Published {new Date(data!.topPost.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                {data!.topPost.postUrl && (
                  <a href={data!.topPost.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold shrink-0" style={{ color: "#4285C7" }}>View Post →</a>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="text-center">
                  <p className="text-xl font-black" style={{ color: "#4285C7" }}>{data!.topPost.impressions.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Impressions</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black" style={{ color: "#C13A2A" }}>{data!.topPost.clicks.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black" style={{ color: "#16A34A" }}>{data!.topPost.engagementRate}%</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Engagement</p>
                </div>
              </div>
            </div>
          )}

          {data!.byPlatform.length > 0 && (
            <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-sm font-black mb-4" style={{ color: "#111827" }}>Performance by Platform</p>
              <div className="space-y-4">
                {data!.byPlatform.map(p => {
                  const meta = PLATFORM_META[p.platform] || { label: p.platform, color: "#6B7280" };
                  const maxImpressions = Math.max(...data!.byPlatform.map(x => x.totalImpressions), 1);
                  const barPct = Math.round((p.totalImpressions / maxImpressions) * 100);
                  return (
                    <div key={p.platform}>
                      <div className="flex items-center gap-3 mb-2">
                        <PlatformIcon platform={p.platform} size={24} rounded="rounded-lg" />
                        <span className="text-sm font-semibold flex-1" style={{ color: "#111827" }}>{meta.label}</span>
                        <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>{p.postCount} post{p.postCount !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: meta.color === "#000" ? "#374151" : meta.color }} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        {[
                          { label: "Impressions", v: p.totalImpressions.toLocaleString() },
                          { label: "Clicks", v: p.totalClicks.toLocaleString() },
                          { label: "Avg CTR", v: `${p.avgCtr}%` },
                          { label: "Avg Engagement", v: `${p.avgEngagementRate}%` },
                        ].map(({ label, v }) => (
                          <div key={label} className="p-2 rounded-lg" style={{ background: "#F8FBFE" }}>
                            <p className="text-xs font-bold" style={{ color: "#111827" }}>{v}</p>
                            <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)", color: "#1E40AF" }}>
        <strong>Analytics data</strong> is pulled from each platform's API. Meta and Instagram analytics are live when credentials are configured. Other platforms show data once their API integrations are activated.
      </div>
    </div>
  );
}
