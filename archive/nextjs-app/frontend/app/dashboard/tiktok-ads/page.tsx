"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import StatCard from "../components/StatCard";
import SetupChecklist from "../components/SetupChecklist";
import CampaignTable from "../components/CampaignTable";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import TabBar from "../components/TabBar";
import Modal from "../components/Modal";
import PostCard from "../components/PostCard";

const TABS = ["Overview", "Campaigns", "Video Creatives", "Spark Ads", "My Posts", "Analytics"];

const CREATIVE_TYPES = [
  { icon: "🎬", label: "Product Demo", desc: "Show your product or service in action" },
  { icon: "🎙️", label: "UGC Style", desc: "Authentic creator-style content for your brand" },
  { icon: "📢", label: "Offer Ad", desc: "Promote a deal, discount, or limited-time offer" },
  { icon: "📖", label: "Storytelling", desc: "Share your brand story in 30–60 seconds" },
];

export default function TikTokAdsDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Overview");
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ goal: "Traffic", format: "In-Feed Ad", budget: 50 });

  const checklist = [
    { label: "Business profile complete",    done: !!user?.businessName },
    { label: "Logo uploaded",                done: !!user?.logoURL },
    { label: "TikTok Ads account connected", done: false, note: "Our team handles this" },
    { label: "TikTok Pixel installed",       done: false, note: "Our team handles this" },
    { label: "Video creative ready",         done: false },
    { label: "Campaign objective set",       done: false },
    { label: "Daily budget configured",      done: true },
  ];

  const campaigns = user?.campaigns ?? [];
  const posts = user?.posts ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#111827" }}>TikTok Ads</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>TikTok video advertising — 1B+ monthly active users</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "#111827" }}>TikTok Ads Plan</span>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Video Views"   value="—" subtext="Connecting to TikTok API..." icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="Clicks"        value="—" subtext="Connecting to TikTok API..." icon="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            <StatCard label="CTR"           value="—" subtext="Connecting to TikTok API..." icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            <StatCard label="Cost Per View" value="—" subtext="Connecting to TikTok API..." icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SetupChecklist items={checklist} title="Setup Checklist" />
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <SectionHeader title="Campaign Status" />
              <EmptyState
                icon="⚡"
                title="Your first TikTok campaign is being set up"
                subtitle="Expected live: within 24 hours of platform connection"
                action={<button onClick={() => setShowPrefs(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#4285C7" }}>Set Campaign Preferences →</button>}
              />
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <SectionHeader title="TikTok Ad Formats" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              {[
                { icon: "📱", title: "In-Feed Ads", desc: "Native ads in the For You feed — up to 60 seconds" },
                { icon: "🎯", title: "TopView Ads", desc: "First thing users see when they open TikTok" },
                { icon: "✨", title: "Spark Ads", desc: "Boost existing organic TikTok posts as paid ads" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: "#FAFBFC", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-xs font-bold mt-2" style={{ color: "#111827" }}>{item.title}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#6B7280" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Campaigns" && (
        <div className="space-y-4">
          <SectionHeader title="Your Campaigns" action={<button onClick={() => setShowPrefs(true)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>+ New Campaign</button>} />
          <CampaignTable campaigns={campaigns} emptyText="No campaigns yet. Configure your first campaign in Overview." />
        </div>
      )}

      {tab === "Video Creatives" && (
        <div className="space-y-4">
          <SectionHeader title="AI-Generated TikTok Video Ads" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>+ Generate TikTok Ad</button>} />
          <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "#4285C7" }}>TikTok ads perform best with a strong 3-second hook. Our AI writes scripts, storyboards, and generates on-brand creatives in 9:16 vertical format.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREATIVE_TYPES.map((ct, i) => (
              <div key={i} className="rounded-2xl p-5 flex items-start gap-3" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-2xl shrink-0">{ct.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: "#111827" }}>{ct.label}</p>
                  <p className="text-[10px] mt-0.5 mb-2" style={{ color: "#6B7280" }}>{ct.desc}</p>
                  <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>Generate →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Spark Ads" && (
        <div className="space-y-4">
          <SectionHeader title="Spark Ads" />
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>What are Spark Ads?</p>
            <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Spark Ads let you amplify your best organic TikTok posts as paid ads. They retain all likes, comments, and shares — making them look like native content rather than traditional ads. Higher trust = higher conversion rates.</p>
            <EmptyState icon="✨" title="No Spark Ads yet" subtitle="Once your TikTok account is connected, you can boost organic posts as Spark Ads directly from this panel." />
          </div>
        </div>
      )}

      {tab === "My Posts" && (
        <div className="space-y-4">
          <SectionHeader title="Content Posted on Your Behalf" />
          <p className="text-xs" style={{ color: "#6B7280" }}>All TikToks below are published on WorldDigital.ai&apos;s platforms, branded to your business.</p>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p, i) => <PostCard key={i} post={p} />)}
            </div>
          ) : (
            <EmptyState icon="🎬" title="Your branded TikToks will appear here" subtitle="Once your TikTok account is connected, we'll post short-form video content on your behalf." />
          )}
        </div>
      )}

      {tab === "Analytics" && (
        <div className="space-y-4">
          <SectionHeader title="Performance Analytics" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Avg. CTR Benchmark", benchmark: "0.5–1.5%", desc: "Industry average for TikTok In-Feed Ads" },
              { label: "CPM Benchmark", benchmark: "$2–$6", desc: "Typical TikTok cost per 1,000 impressions" },
              { label: "Completion Rate", benchmark: "15–25%", desc: "Average video view-through rate" },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-xs font-bold" style={{ color: "#374151" }}>{b.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: "#4285C7" }}>{b.benchmark}</p>
                <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{b.desc}</p>
              </div>
            ))}
          </div>
          <EmptyState icon="📈" title="Live analytics will populate once your campaign is live" subtitle="Real-time TikTok campaign performance data will appear here." />
        </div>
      )}

      <Modal open={showPrefs} onClose={() => setShowPrefs(false)} title="TikTok Campaign Preferences">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Campaign Goal</label>
            <select value={prefs.goal} onChange={(e) => setPrefs((p) => ({ ...p, goal: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-xs border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {["Traffic", "Conversions", "App Installs", "Lead Generation", "Brand Awareness", "Video Views"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Ad Format</label>
            <select value={prefs.format} onChange={(e) => setPrefs((p) => ({ ...p, format: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-xs border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {["In-Feed Ad", "TopView", "Spark Ad", "Branded Hashtag", "All Formats"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Daily Budget ($)</label>
            <input type="number" min={20} value={prefs.budget} onChange={(e) => setPrefs((p) => ({ ...p, budget: Number(e.target.value) }))} className="w-full rounded-xl px-3 py-2 text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
            <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>TikTok minimum daily budget is $20/day</p>
          </div>
          <button onClick={() => setShowPrefs(false)} className="w-full py-2.5 rounded-xl text-xs font-black text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>Save Preferences</button>
        </div>
      </Modal>
    </div>
  );
}
