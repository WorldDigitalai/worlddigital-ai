"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

interface StrategyReport {
  _id: string;
  summary: string;
  recommendedPlatforms: { name: string; priority: "High" | "Medium" | "Low"; reason: string }[];
  contentPlan: { type: string; count: number; desc: string }[];
  postingSchedule: { day: string; content: string; format: string }[];
  campaignIdeas: { title: string; desc: string; platform: string }[];
  nextActions: { action: string; done: boolean }[];
  createdAt: string;
  businessName?: string;
  aiGenerated: boolean;
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  High:   { bg: "rgba(22,163,74,0.1)",  color: "#16A34A" },
  Medium: { bg: "rgba(217,119,6,0.1)", color: "#D97706" },
  Low:    { bg: "rgba(107,114,128,0.1)", color: "#6B7280" },
};

const PLATFORM_ICONS: Record<string, string> = {
  Instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  Facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  Google:   "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
  TikTok:   "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  LinkedIn: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

function PlatformSvg({ name }: { name: string }) {
  const path = PLATFORM_ICONS[name];
  if (!path) {
    return (
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
        {name[0]}
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#374151"><path d={path} /></svg>
    </div>
  );
}

export default function StrategyPage() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<StrategyReport>("/v1/dashboard/strategy").then(r => {
      if (r.ok && r.data) setStrategy(r.data);
      setLoading(false);
    });
  }, []);

  const generate = async () => {
    setGenerating(true);
    setError("");
    const res = await apiFetch<StrategyReport>("/v1/dashboard/strategy/generate", { method: "POST", timeoutMs: 90_000 });
    if (res.ok) {
      setStrategy(res.data);
    } else {
      setError(res.error || "Failed to generate strategy. Please complete your business profile first.");
    }
    setGenerating(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#111827" }}>AI Strategy Report</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            {strategy ? `Last generated ${new Date(strategy.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "Generate a personalized growth plan for your business"}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all hover:opacity-90"
          style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)", boxShadow: "0 4px 16px rgba(193,58,42,0.2)" }}
        >
          {generating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {strategy ? "Regenerate Strategy" : "Generate Strategy"}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-3" style={{ background: "rgba(193,58,42,0.06)", border: "1px solid rgba(193,58,42,0.2)", color: "#C13A2A" }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
          {error.includes("business profile") && (
            <Link href="/dashboard/business" className="ml-auto shrink-0 text-xs font-bold underline">Complete Profile →</Link>
          )}
        </div>
      )}

      {!strategy && !generating && !error && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "2px dashed rgba(0,0,0,0.1)" }}>
          <div className="p-12 text-center" style={{ background: "white" }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-black mb-2" style={{ color: "#111827" }}>No strategy report yet</p>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#6B7280" }}>
              Generate a personalized AI growth plan based on your business profile. Includes platform recommendations, content calendar, and action plan.
            </p>
            <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Requires a completed business profile</p>
            <div className="flex items-center justify-center gap-3 flex-wrap mt-4">
              <button onClick={generate} disabled={generating} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
                Generate My Strategy →
              </button>
              <Link href="/dashboard/business" className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-gray-50" style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#374151" }}>
                Complete Business Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {strategy && (
        <>
          {/* Summary card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
                <span className="text-xs font-bold" style={{ color: "#22C55E" }}>
                  {strategy.aiGenerated ? "AI-Generated Strategy" : "Template-Based Strategy"}
                </span>
              </div>
              <p className="text-base font-bold text-white leading-relaxed">{strategy.summary}</p>
              {strategy.businessName && (
                <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>For: {strategy.businessName}</p>
              )}
            </div>
          </div>

          {/* Recommended Platforms */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(66,133,199,0.1)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>Recommended Platforms</p>
            </div>
            <div className="space-y-3">
              {strategy.recommendedPlatforms.map(({ name, priority, reason }) => (
                <div key={name} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <PlatformSvg name={name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold" style={{ color: "#111827" }}>{name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: PRIORITY_STYLE[priority]?.bg, color: PRIORITY_STYLE[priority]?.color }}>
                        {priority}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{reason}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/subscribe" className="text-xs font-semibold" style={{ color: "#4285C7" }}>Activate these platforms →</Link>
            </div>
          </div>

          {/* Content Plan */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>Monthly Content Plan</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {strategy.contentPlan.map(({ type, count, desc }) => (
                <div key={type} className="p-4 rounded-xl" style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-2xl font-black" style={{ color: "#7C3AED" }}>{count}</p>
                    <p className="text-sm font-bold" style={{ color: "#111827" }}>{type}</p>
                  </div>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/dashboard/content-studio" className="text-xs font-semibold" style={{ color: "#7C3AED" }}>Start generating content →</Link>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(5,150,105,0.1)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>Recommended Weekly Schedule</p>
            </div>
            <div className="space-y-2">
              {strategy.postingSchedule.map(({ day, content, format }) => (
                <div key={day} className="flex items-start gap-3 py-2 border-b last:border-b-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                  <div className="w-20 shrink-0">
                    <p className="text-xs font-black" style={{ color: "#059669" }}>{day}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>{content}</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{format}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Ideas */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(193,58,42,0.1)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#C13A2A" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>Campaign Ideas</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {strategy.campaignIdeas.map(({ title, desc, platform }) => (
                <div key={title} className="p-4 rounded-xl" style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <p className="text-sm font-bold mb-1" style={{ color: "#111827" }}>{title}</p>
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(193,58,42,0.08)", color: "#C13A2A" }}>{platform}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(217,119,6,0.1)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>Your Action Plan</p>
            </div>
            <div className="space-y-2">
              {strategy.nextActions.map(({ action }, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>{idx + 1}</div>
                  <p className="text-sm" style={{ color: "#374151" }}>{action}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3 flex-wrap">
              <Link href="/dashboard/content-studio" className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
                Start Generating Content →
              </Link>
              <Link href="/dashboard/business" className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-gray-50" style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#374151" }}>
                Update Business Profile
              </Link>
            </div>
          </div>

          {/* Subscription note */}
          {user?.subscriptionStatus !== "active" && (
            <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg,rgba(66,133,199,0.08),rgba(193,58,42,0.06))", border: "1px solid rgba(66,133,199,0.2)" }}>
              <p className="text-sm font-bold mb-1" style={{ color: "#111827" }}>Ready to execute this strategy?</p>
              <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Subscribe to start publishing AI-generated content across your recommended platforms.</p>
              <Link href="/subscribe" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
                View Plans & Subscribe →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
