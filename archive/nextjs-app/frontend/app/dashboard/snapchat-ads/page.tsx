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

const TABS = ["Overview", "Campaigns", "Snap Creatives", "Story Ads", "My Posts", "Analytics"];

export default function SnapchatAdsDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Overview");
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ goal: "Awareness", format: "Single Image", ageMin: 18, ageMax: 34, budget: 50 });

  const checklist = [
    { label: "Business profile complete", done: !!user?.businessName },
    { label: "Logo uploaded",             done: !!user?.logoURL },
    { label: "Snapchat Business connected", done: false, note: "Our team handles this" },
    { label: "Snap Pixel installed",      done: false, note: "Our team handles this" },
    { label: "Creative assets ready",     done: !!user?.logoURL },
    { label: "Campaign objective set",    done: false },
    { label: "Daily budget configured",   done: true },
  ];

  const campaigns = user?.campaigns ?? [];
  const posts = user?.posts ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#111827" }}>Snapchat Ads</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Snapchat advertising — reach 375M+ daily active users</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,252,0,0.15)", color: "#B8860B" }}>Snapchat Ads Plan</span>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Impressions"  value="—" subtext="Connecting to Snap API..." icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="Swipe-Ups"    value="—" subtext="Connecting to Snap API..." icon="M5 10l7-7m0 0l7 7m-7-7v18" />
            <StatCard label="Story Views"  value="—" subtext="Connecting to Snap API..." icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="CPM"          value="—" subtext="Connecting to Snap API..." icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SetupChecklist items={checklist} title="Setup Checklist" />
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <SectionHeader title="Campaign Status" />
              <EmptyState
                icon="⚡"
                title="Your first Snap campaign is being set up"
                subtitle="Expected live: within 24 hours of platform connection"
                action={<button onClick={() => setShowPrefs(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#4285C7" }}>Set Campaign Preferences →</button>}
              />
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <SectionHeader title="Why Snapchat?" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              {[
                { icon: "👻", title: "375M+ Daily Users", desc: "Massive reach with 18–34 year-old demographic" },
                { icon: "📱", title: "Full-Screen Vertical Ads", desc: "Immersive Snap Ads, Story Ads, and Collection Ads" },
                { icon: "🎯", title: "Precise Targeting", desc: "Target by interests, behaviors, and lookalikes" },
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

      {tab === "Snap Creatives" && (
        <div className="space-y-4">
          <SectionHeader title="Snap Creatives" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>+ Generate Snap Creative</button>} />
          <div className="rounded-xl p-3" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "#4285C7" }}>Snap Ads are 9:16 vertical format — optimal for full-screen mobile experience. Our AI generates branded creatives sized perfectly for Snapchat.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["Single Image", "Video Ad", "Collection Ad"].map((type) => (
              <div key={type} className="rounded-2xl p-5 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl" style={{ background: "#FAFBFC" }}>🎨</div>
                <p className="text-xs font-bold" style={{ color: "#111827" }}>{type}</p>
                <p className="text-[10px] mt-1 mb-3" style={{ color: "#9CA3AF" }}>AI-generated, branded to your business</p>
                <button className="w-full py-2 rounded-xl text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>Generate →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Story Ads" && (
        <div className="space-y-4">
          <SectionHeader title="Story Ads" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>+ Create Story Ad</button>} />
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>About Story Ads</p>
            <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Story Ads appear as a branded tile in Snapchat Discover, letting users tap through a sequence of Snaps. Great for storytelling, product launches, and multi-step promotions.</p>
            <EmptyState icon="📱" title="No story ads yet" subtitle="Story ads will appear once your Snapchat API is connected and your first campaign is configured." />
          </div>
        </div>
      )}

      {tab === "My Posts" && (
        <div className="space-y-4">
          <SectionHeader title="Content Posted on Your Behalf" />
          <p className="text-xs" style={{ color: "#6B7280" }}>All posts below are published on WorldDigital.ai&apos;s Snapchat platforms, branded to your business.</p>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p, i) => <PostCard key={i} post={p} />)}
            </div>
          ) : (
            <EmptyState icon="📷" title="Your branded Snaps will appear here" subtitle="Once your Snapchat account is connected, we'll start posting branded content on your behalf." />
          )}
        </div>
      )}

      {tab === "Analytics" && (
        <div className="space-y-4">
          <SectionHeader title="Performance Analytics" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Swipe-Up Rate", benchmark: "~1–3%", desc: "Industry average for Snap Ads" },
              { label: "CPM Benchmark", benchmark: "$5–$10", desc: "Typical Snapchat cost per 1,000 impressions" },
              { label: "Audience Overlap", benchmark: "18–34", desc: "Primary age demographic on Snapchat" },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-xs font-bold" style={{ color: "#374151" }}>{b.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: "#4285C7" }}>{b.benchmark}</p>
                <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{b.desc}</p>
              </div>
            ))}
          </div>
          <EmptyState icon="📈" title="Live analytics will populate once your campaign is live" subtitle="Real-time Snapchat campaign performance data will appear here after your first campaign goes live." />
        </div>
      )}

      <Modal open={showPrefs} onClose={() => setShowPrefs(false)} title="Snapchat Campaign Preferences">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Campaign Objective</label>
            <select value={prefs.goal} onChange={(e) => setPrefs((p) => ({ ...p, goal: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-xs border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {["Awareness", "Traffic", "App Installs", "Engagement", "Lead Generation", "Conversions"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Ad Format</label>
            <select value={prefs.format} onChange={(e) => setPrefs((p) => ({ ...p, format: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-xs border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {["Single Image", "Video Ad", "Story Ad", "Collection Ad", "Dynamic Ads"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Age Min</label>
              <input type="number" min={13} max={50} value={prefs.ageMin} onChange={(e) => setPrefs((p) => ({ ...p, ageMin: Number(e.target.value) }))} className="w-full rounded-xl px-3 py-2 text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Age Max</label>
              <input type="number" min={13} max={50} value={prefs.ageMax} onChange={(e) => setPrefs((p) => ({ ...p, ageMax: Number(e.target.value) }))} className="w-full rounded-xl px-3 py-2 text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Daily Budget ($)</label>
            <input type="number" min={20} value={prefs.budget} onChange={(e) => setPrefs((p) => ({ ...p, budget: Number(e.target.value) }))} className="w-full rounded-xl px-3 py-2 text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
          </div>
          <button onClick={() => setShowPrefs(false)} className="w-full py-2.5 rounded-xl text-xs font-black text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>Save Preferences</button>
        </div>
      </Modal>
    </div>
  );
}
