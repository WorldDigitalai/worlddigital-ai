"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import StatCard from "../components/StatCard";
import SectionHeader from "../components/SectionHeader";

const TOOLS = [
  {
    href: "/dashboard/tools/keyword-research",
    label: "AI Keyword Research Tool",
    desc: "Enter your business, industry, and location to get an AI-generated keyword report with volume, difficulty, and CPC estimates.",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    color: "#4285C7",
    bg: "rgba(66,133,199,0.08)",
    cta: "Run Keyword Research →",
  },
  {
    href: "/dashboard/tools/content-marketing",
    label: "Content Marketing Generator",
    desc: "Turn your best keywords into SEO-optimised blog posts, social captions, and ad copy in seconds.",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    cta: "Generate Content →",
  },
  {
    href: "/dashboard/strategy",
    label: "Strategy Report",
    desc: "Get a full AI-generated marketing strategy tailored to your business category, location, and goals.",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
    cta: "Generate Strategy →",
  },
  {
    href: "/dashboard/seo",
    label: "Auto SEO Dashboard",
    desc: "Track your live keyword rankings from Google Search Console, run site audits, and auto-publish SEO blog posts.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: "#C13A2A",
    bg: "rgba(193,58,42,0.08)",
    cta: "Open SEO Dashboard →",
  },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Enter your business details", desc: "Business name, industry, and location power the AI research." },
  { step: 2, title: "AI generates keyword clusters", desc: "Get long-tail, local, and competitor keywords with real metrics." },
  { step: 3, title: "Use keywords across tools", desc: "Feed them into Content Marketing, Strategy Reports, and Google Ads." },
];

export default function KeywordResearchDashboard() {
  const { user } = useUser();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>
            Keyword Research
          </h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            Find high-value keywords for {user?.businessName || "your business"} — powered by AI
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>
          Keyword Research Plan
        </span>
      </div>

      {/* CTA banner */}
      <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "linear-gradient(135deg,rgba(66,133,199,0.06),rgba(193,58,42,0.04))", border: "1px solid rgba(66,133,199,0.18)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(66,133,199,0.12)" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black" style={{ color: "#1e40af" }}>Ready to find your best keywords?</p>
          <p className="text-xs mt-1" style={{ color: "#3b82f6" }}>
            Enter your business details and let AI generate a full keyword report — search volume, difficulty, CPC, and intent clusters.
            {user?.businessCategory ? ` We've pre-loaded your category: ${user.businessCategory}.` : ""}
          </p>
          <Link
            href="/dashboard/tools/keyword-research"
            className="inline-block mt-3 px-5 py-2.5 rounded-xl text-xs font-black text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(to right,#4285C7,#1e6db7)", textDecoration: "none" }}
          >
            Run AI Keyword Research →
          </Link>
        </div>
      </div>

      {/* Stats — placeholder until first report runs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Reports Generated"
          value="—"
          subtext="Run your first report"
          icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <StatCard
          label="Keywords Discovered"
          value="—"
          subtext="Run your first report"
          icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
        <StatCard
          label="Avg. Difficulty"
          value="—"
          subtext="Run your first report"
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </div>

      {/* Business seed info */}
      {(user?.businessCategory || user?.businessLocation) && (
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-xs font-black mb-3" style={{ color: "#111827" }}>Your Business Profile</p>
          <div className="space-y-2">
            {user?.businessName && (
              <div className="flex justify-between text-xs">
                <span style={{ color: "#6B7280" }}>Business</span>
                <span className="font-semibold" style={{ color: "#111827" }}>{user.businessName}</span>
              </div>
            )}
            {user?.businessCategory && (
              <div className="flex justify-between text-xs">
                <span style={{ color: "#6B7280" }}>Category</span>
                <span className="font-semibold" style={{ color: "#111827" }}>{user.businessCategory}</span>
              </div>
            )}
            {user?.businessLocation && (
              <div className="flex justify-between text-xs">
                <span style={{ color: "#6B7280" }}>Location</span>
                <span className="font-semibold" style={{ color: "#111827" }}>{user.businessLocation}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] mt-3 pt-2" style={{ color: "#9CA3AF", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            AI uses your business profile as seed data for keyword generation. Update it in{" "}
            <Link href="/dashboard/settings" className="font-bold" style={{ color: "#4285C7", textDecoration: "none" }}>Settings → Profile</Link>.
          </p>
        </div>
      )}

      {/* How it works */}
      <div>
        <SectionHeader title="How It Works" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div key={step} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white mb-3" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
                {step}
              </div>
              <p className="text-xs font-black mb-1" style={{ color: "#111827" }}>{title}</p>
              <p className="text-[11px]" style={{ color: "#6B7280" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tools grid */}
      <div>
        <SectionHeader title="Your Research Tools" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {TOOLS.map(({ href, label, desc, icon, color, bg, cta }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl p-5 flex items-start gap-4 transition hover:shadow-md hover:-translate-y-0.5"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", textDecoration: "none" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black mb-1" style={{ color: "#111827" }}>{label}</p>
                <p className="text-[11px] mb-2" style={{ color: "#6B7280" }}>{desc}</p>
                <span className="text-[10px] font-bold" style={{ color }}>{cta}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
