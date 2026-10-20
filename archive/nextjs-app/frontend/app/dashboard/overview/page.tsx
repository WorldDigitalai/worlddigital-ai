"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import StatCard from "../components/StatCard";
import SetupChecklist from "../components/SetupChecklist";
import SectionHeader from "../components/SectionHeader";
import { PlatformIcon } from "@/components/PlatformIcon";

const MODULE_CARDS = [
  { href: "/dashboard/meta-ads",       label: "Meta Ads",           icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",         color: "#1877F2", bg: "rgba(24,119,242,0.08)" },
  { href: "/dashboard/google-ads",     label: "Google Ads",         icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",                                                                                                                                                                           color: "#4285C7", bg: "rgba(66,133,199,0.08)" },
  { href: "/dashboard/snapchat-ads",   label: "Snapchat Ads",       icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",                                                                                                                                color: "#FFFC00", bg: "rgba(255,252,0,0.1)" },
  { href: "/dashboard/tiktok-ads",     label: "TikTok Ads",         icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",                                                                                              color: "#010101", bg: "rgba(0,0,0,0.06)" },
  { href: "/dashboard/seo",            label: "Auto SEO",           icon: "M13 10V3L4 14h7v7l9-11h-7z",                                                                                                                                                                                           color: "#C13A2A", bg: "rgba(193,58,42,0.08)" },
  { href: "/dashboard/content-studio", label: "AI Content Studio",  icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  { href: "/dashboard/image-generator",label: "Image Generator",    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",                                                       color: "#0EA5E9", bg: "rgba(14,165,233,0.08)" },
  { href: "/dashboard/analytics",      label: "Analytics",          icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",         color: "#059669", bg: "rgba(5,150,105,0.08)" },
];

const ACTIVITY_FEED = [
  { icon: "⚡", text: "Dashboard activated — enterprise plan configured", time: "Just now", color: "#4285C7" },
  { icon: "🔧", text: "Platform connections being set up by our team", time: "In progress", color: "#D97706" },
  { icon: "📋", text: "Business profile imported successfully", time: "Completed", color: "#16A34A" },
];

export default function EnterpriseOverviewDashboard() {
  const { user } = useUser();

  const checklist = [
    { label: "Business profile complete",        done: !!user?.businessName },
    { label: "Logo & brand colors set",          done: !!user?.logoURL },
    { label: "Platforms configured",             done: Object.keys(user?.platforms ?? {}).length > 0 },
    { label: "Campaign preferences submitted",   done: false },
    { label: "First campaign live",              done: false },
    { label: "Content posted",                   done: (user?.posts?.length ?? 0) > 0 },
    { label: "SEO domain connected",             done: false },
  ];

  const platforms = Object.entries(user?.platforms ?? {});
  const campaigns = user?.campaigns ?? [];

  const totalBudget = platforms.reduce((s, [, p]) => s + (p.dailyBudget ?? 0), 0);
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>Enterprise Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>All modules active — master control center for {user?.businessName || "your business"}</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.08))", color: "#D97706" }}>
          &#9733; Enterprise — All Modules
        </span>
      </div>

      {/* Master stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Modules Active" value="8" icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        <StatCard label="Campaigns Live" value={campaigns.length} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        <StatCard label="Daily Ad Budget" value={totalBudget > 0 ? `$${totalBudget}` : "—"} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Setup Progress" value={`${doneCount}/${checklist.length}`} icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </div>

      {/* Module cards */}
      <div>
        <SectionHeader title="Your Modules" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {MODULE_CARDS.map(({ href, label, icon, color, bg }) => (
            <Link key={href} href={href} className="rounded-2xl p-4 flex flex-col items-start gap-3 transition hover:shadow-md hover:-translate-y-0.5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", textDecoration: "none" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
              </div>
              <div>
                <p className="text-xs font-black" style={{ color: "#111827" }}>{label}</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>Connecting</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Setup checklist */}
        <SetupChecklist items={checklist} title="Enterprise Setup" />

        {/* Platform health */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <SectionHeader title="Platform Health" />
          {platforms.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "#6B7280" }}>Platform connections will appear here once our team sets them up (within 24 hours of account activation).</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
              {platforms.map(([key, p]) => (
                <div key={key} className="rounded-xl p-3" style={{ background: "#FAFBFC", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformIcon platform={key} size={24} rounded="rounded-md" />
                    <span className="text-xs font-bold capitalize" style={{ color: "#111827" }}>{key}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.status === "live" ? "#16A34A" : p.status === "error" ? "#DC2626" : "#D97706" }} />
                    <span className="text-[10px] font-semibold capitalize" style={{ color: p.status === "live" ? "#16A34A" : p.status === "error" ? "#DC2626" : "#D97706" }}>{p.status}</span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>${p.dailyBudget}/day</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity feed + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <SectionHeader title="Recent Activity" />
          <div className="space-y-3 mt-3">
            {ACTIVITY_FEED.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: "#374151" }}>{a.text}</p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: a.color }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <SectionHeader title="Quick Actions" />
          <div className="space-y-2 mt-3">
            {[
              { href: "/dashboard/content-studio",  label: "Generate AI Content",   icon: "&#9889;" },
              { href: "/dashboard/image-generator",  label: "Create an Image",       icon: "&#127912;" },
              { href: "/dashboard/seo",              label: "Run SEO Audit",         icon: "&#128269;" },
              { href: "/dashboard/campaigns",        label: "View All Campaigns",    icon: "&#128202;" },
              { href: "/dashboard/business",         label: "Update Business Profile", icon: "&#128196;" },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition hover:bg-gray-50" style={{ color: "#374151", textDecoration: "none" }}>
                <span className="text-base">{icon}</span>
                <span>{label}</span>
                <svg className="w-3.5 h-3.5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
