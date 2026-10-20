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

const TABS = ["Overview", "Campaigns", "B2B Targeting", "Creatives", "My Posts", "Analytics"];

const AUDIENCE_FILTERS = [
  { label: "Job Title", options: ["CEO / Founder", "Marketing Director", "Sales Manager", "IT Manager", "Business Owner"] },
  { label: "Industry", options: ["Technology", "Financial Services", "Healthcare", "Real Estate", "Retail"] },
  { label: "Company Size", options: ["1–10", "11–50", "51–200", "201–1000", "1000+"] },
  { label: "Seniority", options: ["Entry", "Senior", "Manager", "Director", "VP+", "C-Suite"] },
];

export default function LinkedInAdsDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Overview");
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ goal: "Lead Generation", format: "Single Image", budget: 50 });
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const checklist = [
    { label: "Business profile complete",        done: !!user?.businessName },
    { label: "Logo uploaded",                    done: !!user?.logoURL },
    { label: "LinkedIn Page connected",          done: false, note: "Our team handles this" },
    { label: "LinkedIn Insight Tag installed",   done: false, note: "Our team handles this" },
    { label: "Daily budget set ($30 min)",       done: true },
    { label: "B2B audience configured",          done: false },
    { label: "First campaign created",           done: false },
  ];

  const campaigns = user?.campaigns ?? [];
  const posts = user?.posts ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#111827" }}>LinkedIn Ads</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>B2B advertising — reach 900M+ professionals</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(10,102,194,0.1)", color: "#0A66C2" }}>LinkedIn Ads Plan</span>
      </div>

      <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <p className="text-xs font-semibold" style={{ color: "#D97706" }}>⚠ LinkedIn minimum ad budget is $30/day — platform requirement for all campaign types.</p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Impressions"      value="—" subtext="Connecting to LinkedIn API..." icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="Clicks"           value="—" subtext="Connecting to LinkedIn API..." icon="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            <StatCard label="Lead Form Opens"  value="—" subtext="Connecting to LinkedIn API..." icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <StatCard label="Cost Per Lead"    value="—" subtext="Connecting to LinkedIn API..." icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SetupChecklist items={checklist} title="Setup Checklist" />
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <SectionHeader title="Campaign Status" />
              <EmptyState
                icon="⚡"
                title="Your first LinkedIn campaign is being set up"
                subtitle="Expected live: within 24 hours of platform connection"
                action={<button onClick={() => setShowPrefs(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#0A66C2" }}>Set Campaign Preferences →</button>}
              />
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <SectionHeader title="LinkedIn Ad Formats" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {[
                { icon: "📄", title: "Single Image Ad", desc: "Sponsored content in the LinkedIn feed" },
                { icon: "🎠", title: "Carousel Ad", desc: "Multiple images with swipeable cards" },
                { icon: "📋", title: "Lead Gen Form", desc: "Pre-filled forms for frictionless lead capture" },
                { icon: "💬", title: "Message Ad", desc: "Direct InMail to targeted professionals" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: "#FAFBFC", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-[10px] font-bold mt-2" style={{ color: "#111827" }}>{item.title}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#6B7280" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Campaigns" && (
        <div className="space-y-4">
          <SectionHeader title="Your Campaigns" action={<button onClick={() => setShowPrefs(true)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#0A66C2" }}>+ New Campaign</button>} />
          <CampaignTable campaigns={campaigns} emptyText="No campaigns yet. Configure your first campaign in Overview." />
        </div>
      )}

      {tab === "B2B Targeting" && (
        <div className="space-y-4">
          <SectionHeader title="B2B Audience Builder" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#0A66C2" }}>+ Save Audience</button>} />
          <p className="text-xs" style={{ color: "#6B7280" }}>LinkedIn&apos;s professional targeting is the most precise in the industry. Build your ideal customer profile below.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AUDIENCE_FILTERS.map((filter) => (
              <div key={filter.label} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>{filter.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {filter.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedFilters((prev) => ({ ...prev, [filter.label]: opt }))}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition"
                      style={{
                        borderColor: selectedFilters[filter.label] === opt ? "#0A66C2" : "rgba(0,0,0,0.08)",
                        background: selectedFilters[filter.label] === opt ? "rgba(10,102,194,0.06)" : "white",
                        color: selectedFilters[filter.label] === opt ? "#0A66C2" : "#374151",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {Object.keys(selectedFilters).length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "rgba(10,102,194,0.06)", border: "1px solid rgba(10,102,194,0.15)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#0A66C2" }}>Selected Targeting</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedFilters).map(([k, v]) => (
                  <span key={k} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(10,102,194,0.12)", color: "#0A66C2" }}>{k}: {v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Creatives" && (
        <div className="space-y-4">
          <SectionHeader title="Ad Creatives" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#0A66C2" }}>+ Generate Creative</button>} />
          <div className="rounded-xl p-3" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "#4285C7" }}>LinkedIn creatives that perform best have a professional tone, a clear value proposition, and a specific CTA. Our AI writes copy tailored for B2B buyers.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Single Image Ad", "Carousel Ad", "Lead Gen Form", "Message Ad (InMail)"].map((type) => (
              <div key={type} className="rounded-2xl p-5 flex items-center justify-between" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: "#111827" }}>{type}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>AI-generated, B2B optimized</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shrink-0" style={{ background: "#0A66C2" }}>Generate →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "My Posts" && (
        <div className="space-y-4">
          <SectionHeader title="Content Posted on Your Behalf" />
          <p className="text-xs" style={{ color: "#6B7280" }}>All posts below are published on WorldDigital.ai&apos;s LinkedIn platforms, branded to your business.</p>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p, i) => <PostCard key={i} post={p} />)}
            </div>
          ) : (
            <EmptyState icon="💼" title="Your branded LinkedIn posts will appear here" subtitle="Once your LinkedIn Page is connected, we'll post professional B2B content on your behalf." />
          )}
        </div>
      )}

      {tab === "Analytics" && (
        <div className="space-y-4">
          <SectionHeader title="Performance Analytics" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Avg. CTR Benchmark", benchmark: "0.3–0.5%", desc: "Industry average for LinkedIn Sponsored Content" },
              { label: "CPM Benchmark", benchmark: "$25–$50", desc: "LinkedIn CPM is higher — but audience quality is much better" },
              { label: "Lead Form CVR", benchmark: "10–15%", desc: "Average Lead Gen Form conversion rate" },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-xs font-bold" style={{ color: "#374151" }}>{b.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: "#0A66C2" }}>{b.benchmark}</p>
                <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{b.desc}</p>
              </div>
            ))}
          </div>
          <EmptyState icon="📈" title="Live analytics will populate once your campaign is live" subtitle="Real-time LinkedIn campaign performance data will appear here." />
        </div>
      )}

      <Modal open={showPrefs} onClose={() => setShowPrefs(false)} title="LinkedIn Campaign Preferences">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Campaign Objective</label>
            <select value={prefs.goal} onChange={(e) => setPrefs((p) => ({ ...p, goal: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-xs border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {["Brand Awareness", "Website Visits", "Lead Generation", "Video Views", "Message Ads"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Ad Format</label>
            <select value={prefs.format} onChange={(e) => setPrefs((p) => ({ ...p, format: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-xs border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {["Single Image", "Carousel", "Video", "Lead Gen Form", "Message Ad"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Daily Budget ($)</label>
            <input type="number" min={30} value={prefs.budget} onChange={(e) => setPrefs((p) => ({ ...p, budget: Number(e.target.value) }))} className="w-full rounded-xl px-3 py-2 text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
            <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>LinkedIn minimum is $30/day</p>
          </div>
          <button onClick={() => setShowPrefs(false)} className="w-full py-2.5 rounded-xl text-xs font-black text-white" style={{ background: "linear-gradient(to right,#0A66C2,#4285C7)" }}>Save Preferences</button>
        </div>
      </Modal>
    </div>
  );
}
