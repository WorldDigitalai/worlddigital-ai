"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";

interface PostAnalytic {
  id: string;
  platform: string;
  postUrl?: string;
  businessName: string;
  destinationUrl: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  ctr: number;
  engagementRate: number;
  analyticsStatus: "live" | "pending" | "stub";
  publishedAt: string;
  lastSyncedAt?: string;
}

interface PostsResponse {
  posts: PostAnalytic[];
  total: number;
}

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  facebook:      { label: "Facebook",      color: "#1877F2" },
  meta:          { label: "Facebook",      color: "#1877F2" },
  instagram:     { label: "Instagram",     color: "#E1306C" },
  tiktok:        { label: "TikTok",        color: "#000" },
  linkedin:      { label: "LinkedIn",      color: "#0A66C2" },
  x:             { label: "X / Twitter",  color: "#000" },
  youtube_shorts:{ label: "YouTube",       color: "#FF0000" },
  snapchat:      { label: "Snapchat",      color: "#FFFC00" },
};

function Pill({ value, color, label }: { value: string | number; color: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-black" style={{ color }}>{value}</p>
      <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{label}</p>
    </div>
  );
}

export default function PublishedPostsPage() {
  const [data, setData] = useState<PostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("all");

  const load = () => {
    setLoading(true);
    apiFetch<PostsResponse>("/v1/dashboard/analytics/posts").then(r => {
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

  const platforms = data ? [...new Set(data.posts.map(p => p.platform))] : [];
  const filtered = data ? (filterPlatform === "all" ? data.posts : data.posts.filter(p => p.platform === filterPlatform)) : [];

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Published Posts</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            All content published from WorldDigital.ai's accounts on behalf of your business
          </p>
        </div>
        <button onClick={handleSync} disabled={syncing} className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
          <svg className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? "Syncing…" : "Sync Analytics"}
        </button>
      </div>

      {platforms.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterPlatform("all")} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: filterPlatform === "all" ? "#111827" : "white", color: filterPlatform === "all" ? "white" : "#374151", border: "1px solid rgba(0,0,0,0.1)" }}>
            All platforms
          </button>
          {platforms.map(p => {
            const meta = PLATFORM_META[p] || { label: p, color: "#6B7280" };
            return (
              <button key={p} onClick={() => setFilterPlatform(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: filterPlatform === p ? meta.color : "white", color: filterPlatform === p ? "white" : "#374151", border: "1px solid rgba(0,0,0,0.1)" }}>
                {filterPlatform !== p && <PlatformIcon platform={p} size={14} rounded="rounded-sm" />}
                {meta.label}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "white", border: "2px dashed rgba(0,0,0,0.1)" }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-bold" style={{ color: "#111827" }}>No published posts yet</p>
          <p className="text-xs mt-1 mb-6" style={{ color: "#6B7280" }}>
            Once content is approved and published from your queue, it will appear here with full analytics.
          </p>
          <Link href="/dashboard/content-studio" className="inline-flex px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
            Generate Content →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => {
            const meta = PLATFORM_META[post.platform] || { label: post.platform, color: "#6B7280" };
            const isLive = post.analyticsStatus === "live";
            return (
              <div key={post.id} className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={post.platform} size={36} rounded="rounded-xl" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: "#111827" }}>{meta.label}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                          background: isLive ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)",
                          color: isLive ? "#16A34A" : "#9CA3AF",
                        }}>
                          {isLive ? "● Live metrics" : "● Awaiting sync"}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "#6B7280" }}>
                        Promoting: <strong style={{ color: "#374151" }}>{post.businessName}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    {post.postUrl && (
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold" style={{ color: "#4285C7" }}>
                        View Post →
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-9 gap-3 p-4 rounded-xl" style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <Pill value={post.impressions.toLocaleString()} color="#4285C7" label="Impressions" />
                  <Pill value={post.reach.toLocaleString()} color="#7C3AED" label="Reach" />
                  <Pill value={post.likes} color="#E1306C" label="Likes" />
                  <Pill value={post.comments} color="#D97706" label="Comments" />
                  <Pill value={post.shares} color="#059669" label="Shares" />
                  <Pill value={post.saves} color="#0A66C2" label="Saves" />
                  <Pill value={post.clicks.toLocaleString()} color="#C13A2A" label="Clicks" />
                  <Pill value={`${post.ctr}%`} color="#111827" label="CTR" />
                  <Pill value={`${post.engagementRate}%`} color="#16A34A" label="Engagement" />
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}>
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                  </svg>
                  <span>Traffic destination: </span>
                  <a href={post.destinationUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: "#4285C7" }}>{post.destinationUrl}</a>
                  {post.lastSyncedAt && <span className="ml-auto">Synced {new Date(post.lastSyncedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)", color: "#1E40AF" }}>
        <strong>Note:</strong> Live metrics are pulled from each platform's API. "Awaiting sync" means the API connection is pending — metrics will show once platform credentials are configured.
      </div>
    </div>
  );
}
