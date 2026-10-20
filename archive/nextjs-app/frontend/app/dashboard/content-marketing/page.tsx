"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import TabBar from "../components/TabBar";
import PostCard from "../components/PostCard";

const TABS = ["Overview", "Content Generator", "Content Calendar", "Published Content", "My Posts", "Performance"];

const CONTENT_TYPES = [
  { icon: "\ud83d\udcdd", label: "Blog Post" },
  { icon: "\ud83d\udcf1", label: "Social Caption" },
  { icon: "\ud83d\udce7", label: "Email Newsletter" },
  { icon: "\ud83c\udfaf", label: "Ad Copy" },
  { icon: "\ud83d\udcc4", label: "Landing Page" },
  { icon: "\ud83c\udfac", label: "Reel Script" },
  { icon: "\ud83e\uddf5", label: "X Thread" },
  { icon: "\ud83d\udcbc", label: "LinkedIn Post" },
  { icon: "\ud83d\udce6", label: "Product Description" },
];

export default function ContentMarketingDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Overview");
  const [contentType, setContentType] = useState("Blog Post");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#111827" }}>Content Marketing</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>AI-powered content creation & scheduling</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>Content Marketing Plan</span>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Content Pieces" value={user?.posts?.length ?? 0} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            <StatCard label="Words Generated" value="0" icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            <StatCard label="Avg Engagement" value="0%" icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            <StatCard label="Top Post" value="\u2014" icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </div>
          <EmptyState icon="\u270d\ufe0f" title="Generate your first content piece" subtitle="Use the Content Generator tab to create blog posts, social captions, emails, and more." />
        </div>
      )}

      {tab === "Content Generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>Brand Voice</p>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>{user?.brandVoice || "Professional & Trustworthy"}</p>
            </div>
            <div>
              <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Content Type</label>
              <div className="grid grid-cols-3 gap-2">
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setContentType(t.label)}
                    className="rounded-xl p-2 text-center border transition text-[10px] font-bold"
                    style={{
                      borderColor: contentType === t.label ? "#4285C7" : "rgba(0,0,0,0.08)",
                      background: contentType === t.label ? "rgba(66,133,199,0.06)" : "white",
                      color: contentType === t.label ? "#4285C7" : "#374151",
                    }}
                  >
                    <span className="text-lg block mb-0.5">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Topic / Keyword</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="What should we write about?" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#6B7280" }}>Tone:</span>
              <input type="range" min={0} max={100} className="flex-1" />
              <span className="text-xs" style={{ color: "#6B7280" }}>Casual &larr;&rarr; Professional</span>
            </div>
            <div className="flex gap-2">
              {["Short","Medium","Long"].map((l) => (
                <button key={l} className="flex-1 py-2 rounded-xl text-[10px] font-bold border" style={{ background: "white", borderColor: "rgba(0,0,0,0.08)", color: "#374151" }}>{l}</button>
              ))}
            </div>
            <button
              onClick={generate}
              disabled={generating || !topic.trim()}
              className="w-full py-3 rounded-xl text-sm font-black text-white transition disabled:opacity-40"
              style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
            >
              {generating ? "Generating..." : "Generate Content \u2192"}
            </button>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-black mb-3" style={{ color: "#9CA3AF" }}>LIVE PREVIEW</p>
            <div className="rounded-xl p-4 min-h-[200px]" style={{ background: "#FAFBFC", border: "1px dashed rgba(0,0,0,0.08)" }}>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Generated content will appear here...</p>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "#F1F5F9", color: "#6B7280" }}>Word count: 0</span>
              <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "#F1F5F9", color: "#6B7280" }}>SEO score: \u2014</span>
              <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "#F1F5F9", color: "#6B7280" }}>Readability: \u2014</span>
            </div>
          </div>
        </div>
      )}

      {tab === "Content Calendar" && (
        <div className="space-y-4">
          <SectionHeader title="Content Calendar" />
          <EmptyState icon="\ud83d\udcc5" title="Your content calendar is empty" subtitle="Schedule content from the generator to see it on your calendar." />
        </div>
      )}

      {tab === "Published Content" && (
        <div className="space-y-4">
          <SectionHeader title="Published Content" />
          <EmptyState icon="\ud83d\udccb" title="No published content yet" subtitle="Once content is posted, it will appear here with performance stats." />
        </div>
      )}

      {tab === "My Posts" && (
        <div className="space-y-4">
          <SectionHeader title="My Posts" />
          {(user?.posts?.length ?? 0) > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.posts?.map((p, i) => <PostCard key={i} post={p} />)}
            </div>
          ) : (
            <EmptyState icon="\ud83d\udcf7" title="Your branded posts will appear here" subtitle="Once your platforms are connected, we'll post content on your behalf." />
          )}
        </div>
      )}

      {tab === "Performance" && (
        <div className="space-y-4">
          <SectionHeader title="Performance" />
          <EmptyState icon="\ud83d\udcc8" title="Performance data pending" subtitle="Analytics will populate once content is published and platforms are connected." />
        </div>
      )}
    </div>
  );
}
