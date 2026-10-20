"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../layout";

interface AnalyticsData {
  totals: { impressions: number; reach: number; likes: number; comments: number; shares: number; clicks: number };
  byPlatform: Record<string, { impressions: number; clicks: number; posts: number }>;
  topPosts: Array<Record<string, unknown>>;
  totalPosts: number;
}

function Stat({ label, value, iconD }: { label: string; value: string | number; iconD: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d={iconD} />
        </svg>
        <p className="text-sm font-semibold" style={{ color: "#64748B" }}>{label}</p>
      </div>
      <p className="text-2xl font-black" style={{ color: "#0F172A" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full" style={{ background: "#F1F5F9" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-16 text-right" style={{ color: "#64748B" }}>{value.toLocaleString()}</span>
    </div>
  );
}

export default function AdminAnalytics() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/v1/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [token]);

  const platformColors: Record<string, string> = {
    meta: "#1877F2", facebook: "#1877F2", instagram: "#E1306C",
    snapchat: "#FFFC00", google: "#4285F4", tiktok: "#000000",
  };

  if (loading) return (
    <div className="flex justify-center h-64 items-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const t = data?.totals;
  const ctr = t && t.impressions > 0 ? ((t.clicks / t.impressions) * 100).toFixed(2) : "0.00";
  const platforms = Object.entries(data?.byPlatform || {});
  const maxImpressions = Math.max(...platforms.map(([, v]) => v.impressions), 1);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Platform Analytics</h2>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>Aggregated performance across all customer campaigns.</p>
      </div>

      {(!data || data.totalPosts === 0) ? (
        <div className="rounded-2xl text-center py-20" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="font-bold text-lg" style={{ color: "#0F172A" }}>No analytics data yet</p>
          <p className="text-sm mt-2" style={{ color: "#64748B" }}>Analytics appear once customers publish content and data syncs from social APIs.</p>
          <div className="mt-6 px-5 py-4 rounded-xl inline-block text-sm text-left" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
            <p className="font-bold text-yellow-700 mb-1">Integration required</p>
            <p className="text-yellow-600">Connect Meta, Snapchat, or Google APIs to auto-pull post performance data.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Stat label="Total Posts"  value={data?.totalPosts || 0}  iconD="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <Stat label="Impressions"  value={t?.impressions || 0}    iconD="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <Stat label="Reach"        value={t?.reach || 0}          iconD="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            <Stat label="Clicks"       value={t?.clicks || 0}         iconD="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            <Stat label="Engagement"   value={`${((((t?.likes || 0) + (t?.comments || 0) + (t?.shares || 0)) / Math.max(t?.impressions || 1, 1)) * 100).toFixed(1)}%`} iconD="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            <Stat label="CTR"          value={`${ctr}%`}              iconD="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </div>

          {platforms.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <h3 className="font-bold text-sm mb-5" style={{ color: "#0F172A" }}>Impressions by Platform</h3>
              <div className="space-y-4">
                {platforms.sort((a, b) => b[1].impressions - a[1].impressions).map(([p, v]) => (
                  <div key={p} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold capitalize" style={{ color: "#0F172A" }}>{p}</span>
                      <span style={{ color: "#94A3B8" }}>{v.posts} posts · {v.clicks.toLocaleString()} clicks</span>
                    </div>
                    <MiniBar value={v.impressions} max={maxImpressions} color={platformColors[p.toLowerCase()] || "#4285C7"} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data?.topPosts?.length || 0) > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
                <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>Top Performing Posts</h3>
              </div>
              <div className="scroll-x">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    {["Platform", "Impressions", "Clicks", "Likes", "Date"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.topPosts.map((p, i) => (
                    <tr key={i} className="border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
                      <td className="px-5 py-3 text-sm capitalize" style={{ color: "#0F172A" }}>{String(p.platform || "—")}</td>
                      <td className="px-5 py-3 text-sm font-bold" style={{ color: "#0F172A" }}>{Number(p.impressions || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{Number(p.clicks || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{Number(p.likes || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#94A3B8" }}>
                        {p.publishedAt ? new Date(String(p.publishedAt)).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
