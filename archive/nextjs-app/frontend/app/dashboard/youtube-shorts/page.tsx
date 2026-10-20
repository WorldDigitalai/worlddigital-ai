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

const TABS = ["Overview", "Campaigns", "Video Ads", "My Posts", "Analytics"];

export default function YouTubeShortsDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Overview");
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ goal: "Traffic", format: "Bumper Ad", budget: 50 });

  const checklist = [
    { label: "Business profile complete",    done: !!user?.businessName },
    { label: "Logo uploaded",                done: !!user?.logoURL },
    { label: "YouTube channel connected",    done: false, note: "Our team handles this" },
    { label: "Google Ads account linked",    done: false, note: "Our team handles this" },
    { label: "First Shorts video ready",     done: false },
    { label: "Campaign objective set",       done: false },
    { label: "Daily budget configured",      done: true },
  ];

  const campaigns = user?.campaigns ?? [];
  const posts = user?.posts ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#111827" }}>YouTube Shorts</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>YouTube Shorts video advertising — 70B+ daily views</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,0,0,0.08)", color: "#CC0000" }}>YouTube Shorts Plan</span>
      </div>

      <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)" }}>
        <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded" style={{ background: "rgba(220,38,38,0.12)", color: "#CC0000" }}>$50/day min</span>
        <p className="text-xs font-semibold" style={{ color: "#4285C7" }}>YouTube Shorts require a minimum daily budget of $50/day — Google platform policy. Ads are 8–60 second vertical videos shown before or during Shorts.</p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Video Views"        value="—" subtext="Connecting to Google Ads..." icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="Watch Time"         value="—" subtext="Connecting to Google Ads..." icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatCard label="Clicks"             value="—" subtext="Connecting to Google Ads..." icon="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            <StatCard label="View-Through Rate"  value="—" subtext="Connecting to Google Ads..." icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SetupChecklist items={checklist} title="Setup Checklist" />
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <SectionHeader title="Campaign Status" />
              <EmptyState
                icon="⚡"
                title="Your first Shorts campaign is being set up"
                subtitle="Expected live: within 24 hours of channel connection"
                action={<button onClick={() => setShowPrefs(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#CC0000" }}>Set Campaign Preferences →</button>}
              />
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <SectionHeader title="YouTube Shorts Ad Formats" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              {[
                { icon: "⏱️", title: "Bumper Ads (6s)", desc: "Non-skippable 6-second ads shown before Shorts. Maximum recall." },
                { icon: "📱", title: "Non-Skippable (15–20s)", desc: "Full message delivery — every viewer watches the entire ad." },
                { icon: "▶️", title: "Skippable In-Stream", desc: "Skip after 5 seconds. Pay only when viewers watch 30+ seconds." },
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
          <SectionHeader title="Your Campaigns" action={<button onClick={() => setShowPrefs(true)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#CC0000" }}>+ New Campaign</button>} />
          <CampaignTable campaigns={campaigns} emptyText="No campaigns yet. Configure your first campaign in Overview." />
        </div>
      )}

      {tab === "Video Ads" && (
        <div className="space-y-4">
          <SectionHeader title="AI-Generated YouTube Short Ads" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#CC0000" }}>+ Generate Short Ad</button>} />
          <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "#4285C7" }}>YouTube Shorts ads must be 9:16 vertical format, 8–60 seconds. Our AI generates scripts, storyboards, and on-screen text overlays branded to your business.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "⏱️", label: "Bumper Ad (6s)", desc: "Non-skippable brand awareness message" },
              { icon: "📢", label: "Offer Ad (15s)", desc: "Promote a deal or seasonal sale" },
              { icon: "🏆", label: "Brand Story (30s)", desc: "Tell your brand story in 30 seconds" },
              { icon: "🎯", label: "Product Demo (60s)", desc: "Showcase your product or service" },
            ].map((ct, i) => (
              <div key={i} className="rounded-2xl p-5 flex items-start gap-3" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-2xl shrink-0">{ct.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: "#111827" }}>{ct.label}</p>
                  <p className="text-[10px] mt-0.5 mb-2" style={{ color: "#6B7280" }}>{ct.desc}</p>
                  <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#CC0000" }}>Generate →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "My Posts" && (
        <div className="space-y-4">
          <SectionHeader title="Content Posted on Your Behalf" />
          <p className="text-xs" style={{ color: "#6B7280" }}>All Shorts below are published on WorldDigital.ai&apos;s YouTube channels, branded to your business.</p>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p, i) => <PostCard key={i} post={p} />)}
            </div>
          ) : (
            <EmptyState icon="▶️" title="Your branded Shorts will appear here" subtitle="Once your YouTube channel is connected, we'll post Shorts content on your behalf." />
          )}
        </div>
      )}

      {tab === "Analytics" && (
        <div className="space-y-4">
          <SectionHeader title="Performance Analytics" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "CPV Benchmark", benchmark: "$0.01–0.03", desc: "Cost per view — pay only when someone watches 30s+" },
              { label: "View-Through Rate", benchmark: "15–30%", desc: "Viewers who watch your full ad" },
              { label: "Brand Recall Lift", benchmark: "10–20%", desc: "Typical Shorts ad brand recall improvement" },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-xs font-bold" style={{ color: "#374151" }}>{b.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: "#CC0000" }}>{b.benchmark}</p>
                <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{b.desc}</p>
              </div>
            ))}
          </div>
          <EmptyState icon="📈" title="Live analytics will populate once your campaign is live" subtitle="Real-time YouTube Shorts performance data will appear here." />
        </div>
      )}

      <Modal open={showPrefs} onClose={() => setShowPrefs(false)} title="YouTube Shorts Campaign Preferences">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Campaign Goal</label>
            <select value={prefs.goal} onChange={(e) => setPrefs((p) => ({ ...p, goal: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-xs border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {["Brand Awareness", "Traffic", "Conversions", "Video Views", "Lead Generation"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Ad Format</label>
            <select value={prefs.format} onChange={(e) => setPrefs((p) => ({ ...p, format: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-xs border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {["Bumper Ad (6s)", "Non-Skippable (15s)", "Skippable In-Stream", "All Formats"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Daily Budget ($)</label>
            <input type="number" min={50} value={prefs.budget} onChange={(e) => setPrefs((p) => ({ ...p, budget: Number(e.target.value) }))} className="w-full rounded-xl px-3 py-2 text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
            <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Minimum $50/day for YouTube Shorts campaigns</p>
          </div>
          <button onClick={() => setShowPrefs(false)} className="w-full py-2.5 rounded-xl text-xs font-black text-white" style={{ background: "linear-gradient(to right,#CC0000,#FF4444)" }}>Save Preferences</button>
        </div>
      </Modal>
    </div>
  );
}
