"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import PostCard from "../components/PostCard";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import TabBar from "../components/TabBar";

interface AnalyticsPost {
  id: string;
  platform: string;
  businessName: string;
  destinationUrl?: string;
  postUrl?: string;
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
}

const PLATFORMS = ["All", "Facebook", "Instagram", "Google", "TikTok", "Snapchat", "LinkedIn", "YouTube", "X"];
const STATUS_FILTERS = ["All", "Live", "Pending"];

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-sm font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#9CA3AF" }}>{label}</p>
    </div>
  );
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}

export default function MyPostsPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<AnalyticsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    setLoading(true);
    apiFetch<{ posts: AnalyticsPost[]; total: number }>("/v1/dashboard/analytics/posts")
      .then((res) => {
        if (res.ok && res.data) {
          setPosts(res.data.posts);
        } else {
          setError(res.data ? String((res.data as any).message) : "Failed to load posts");
        }
      })
      .catch(() => setError("Failed to load posts"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter((p) => {
    const matchPlatform = platform === "All" || p.platform.toLowerCase() === platform.toLowerCase();
    const matchStatus =
      statusFilter === "All" ||
      (statusFilter === "Live" && p.analyticsStatus === "live") ||
      (statusFilter === "Pending" && p.analyticsStatus !== "live");
    return matchPlatform && matchStatus;
  });

  const activePlatforms = PLATFORMS.filter(
    (pl) => pl === "All" || posts.some((p) => p.platform.toLowerCase() === pl.toLowerCase())
  );

  const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0);
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const livePosts = posts.filter((p) => p.analyticsStatus === "live").length;

  // Map AnalyticsPost → PostCard expected shape
  const toPostCard = (p: AnalyticsPost) => ({
    platform: p.platform,
    businessName: p.businessName || user?.businessName || "Your Business",
    logo: user?.logoURL || "",
    caption: "",
    date: formatDate(p.publishedAt),
    likes: p.likes,
    comments: p.comments,
    views: p.impressions,
    clicks: p.clicks,
    postUrl: p.postUrl,
    analyticsStatus: p.analyticsStatus,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>My Posts</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>All content published on your behalf by WorldDigital.ai</p>
        </div>
        {!loading && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
            {posts.length} total post{posts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Info banner */}
      <div className="rounded-xl p-4" style={{ background: "rgba(66,133,199,0.05)", border: "1px solid rgba(66,133,199,0.15)" }}>
        <p className="text-xs font-semibold" style={{ color: "#1e40af" }}>
          &#128247; All posts below are published on WorldDigital.ai&apos;s managed platforms, branded to your business, and link back to your website. You own all content.
        </p>
      </div>

      {/* Stats */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill label="Total Posts" value={posts.length} color="#111827" />
          <StatPill label="Live" value={livePosts} color="#16A34A" />
          <StatPill label="Total Impressions" value={totalImpressions > 999 ? `${(totalImpressions / 1000).toFixed(1)}k` : totalImpressions} color="#4285C7" />
          <StatPill label="Total Likes" value={totalLikes} color="#7C3AED" />
        </div>
      )}

      {/* Platform filter */}
      {!loading && posts.length > 0 && (
        <div>
          <p className="text-[10px] font-bold mb-2" style={{ color: "#9CA3AF" }}>FILTER BY PLATFORM</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {activePlatforms.map((pl) => (
              <button
                key={pl}
                onClick={() => setPlatform(pl)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                style={{
                  background: platform === pl ? "#111827" : "white",
                  color: platform === pl ? "white" : "#6B7280",
                  border: platform === pl ? "none" : "1px solid rgba(0,0,0,0.08)",
                }}
              >
                {pl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status filter */}
      {!loading && posts.length > 0 && (
        <TabBar tabs={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />
      )}

      {/* Content */}
      <SectionHeader title={`${platform === "All" ? "All" : platform} Posts`} />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="w-6 h-6 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : error ? (
        <div className="rounded-2xl p-6 text-center" style={{ background: "white", border: "1px solid rgba(220,38,38,0.15)" }}>
          <p className="text-sm font-bold" style={{ color: "#DC2626" }}>Failed to load posts</p>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{error}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => <PostCard key={p.id} post={toPostCard(p)} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="text-4xl mb-3">&#128247;</div>
          <p className="text-sm font-black mb-2" style={{ color: "#111827" }}>Your first branded posts will appear here</p>
          <p className="text-xs mb-6" style={{ color: "#6B7280" }}>
            Once your platforms are connected, our team will start posting content on your behalf — typically within 24–48 hours after account activation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { icon: "&#9889;", title: "Created by AI", desc: "Captions written by our AI, tailored to your brand voice" },
              { icon: "&#127912;", title: "Branded visuals", desc: "Images using your logo and brand colors" },
              { icon: "&#128200;", title: "Performance tracked", desc: "Engagement stats reported in your Analytics tab" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl p-4" style={{ background: "#FAFBFC", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="text-2xl mb-2" dangerouslySetInnerHTML={{ __html: icon }} />
                <p className="text-xs font-black mb-1" style={{ color: "#111827" }}>{title}</p>
                <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon="&#128269;"
          title={`No ${platform} posts yet`}
          subtitle="Try selecting a different platform or status filter."
        />
      )}
    </div>
  );
}
