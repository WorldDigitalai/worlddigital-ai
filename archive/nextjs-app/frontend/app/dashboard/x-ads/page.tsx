"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import StatCard from "../components/StatCard";
import SetupChecklist from "../components/SetupChecklist";
import CampaignTable from "../components/CampaignTable";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import TabBar from "../components/TabBar";

const TABS = ["Overview", "Campaigns", "Tweet Creatives", "Trends Monitor", "Analytics"];

const TRENDS = [
  { topic: "#SmallBusinessTips", volume: 85, relevance: 92 },
  { topic: "#LocalMarketing", volume: 64, relevance: 88 },
  { topic: "#AItools", volume: 95, relevance: 75 },
  { topic: "#CustomerGrowth", volume: 72, relevance: 90 },
  { topic: "#DigitalAds", volume: 58, relevance: 85 },
  { topic: "#BrandBuilding", volume: 48, relevance: 80 },
];

export default function XAdsDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Overview");

  const checklist = [
    { label: "Business profile complete", done: !!user?.businessName },
    { label: "Logo uploaded", done: !!user?.logoURL },
    { label: "X account connected", done: false, note: "Our team handles this" },
    { label: "First campaign created", done: false },
    { label: "Daily budget configured", done: true },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#111827" }}>X Ads</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>X (Twitter) advertising dashboard</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "#111827" }}>X Ads Plan</span>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Impressions" value="—" subtext="Connecting..." icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="Engagements" value="—" subtext="Connecting..." icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            <StatCard label="Link Clicks" value="—" subtext="Connecting..." icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            <StatCard label="Followers Gained" value="—" subtext="Connecting..." icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SetupChecklist items={checklist} title="Setup Checklist" />
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <SectionHeader title="Campaign Status" />
              <EmptyState icon="⚡" title="Your first X campaign is being set up" subtitle="Expected live: within 24 hours" />
            </div>
          </div>
        </div>
      )}

      {tab === "Campaigns" && (
        <div className="space-y-4">
          <SectionHeader title="Your Campaigns" />
          <CampaignTable campaigns={[]} emptyText="No campaigns yet." />
        </div>
      )}

      {tab === "Tweet Creatives" && (
        <div className="space-y-4">
          <SectionHeader title="Tweet Creatives" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>+ New Tweet</button>} />
          <EmptyState icon="📝" title="No tweet creatives yet" subtitle="Create promoted tweets with character counter and live preview." />
        </div>
      )}

      {tab === "Trends Monitor" && (
        <div className="space-y-4">
          <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "#4285C7" }}>Live trend data activates when your X Ads API is connected</p>
          </div>
          <SectionHeader title="Real-Time Trend Monitor" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRENDS.map((t, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-xs font-bold" style={{ color: "#111827" }}>{t.topic}</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: "#6B7280" }}><span>Volume</span><span>{t.volume}%</span></div>
                  <div className="h-1.5 rounded-full" style={{ background: "#F1F5F9" }}><div className="h-1.5 rounded-full" style={{ width: t.volume + "%", background: "#4285C7" }} /></div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: "#6B7280" }}><span>Relevance</span><span>{t.relevance}%</span></div>
                  <div className="h-1.5 rounded-full" style={{ background: "#F1F5F9" }}><div className="h-1.5 rounded-full" style={{ width: t.relevance + "%", background: "#16A34A" }} /></div>
                </div>
                <button className="mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold" style={{ background: "#F1F5F9", color: "#4285C7" }}>Create Ad for This Trend &rarr;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Analytics" && (
        <div className="space-y-4">
          <SectionHeader title="Analytics" />
          <EmptyState icon="📈" title="Analytics will populate once live" subtitle="Check back after your first campaign goes live." />
        </div>
      )}
    </div>
  );
}
