"use client";

import { useState, useEffect, useRef } from "react";

// ── Demo data per platform ───────────────────────────────────────────────────

interface PlatformPreview {
  id: string;
  label: string;
  accent: string;
  kpis: Array<{ label: string; value: string; delta?: string; up?: boolean }>;
  bars: Array<{ label: string; pct: number; color: string }>;
}

const PLATFORMS: PlatformPreview[] = [
  {
    id: "snapchat",
    label: "Snapchat Analytics",
    accent: "#FFCA28",
    kpis: [
      { label: "Impressions", value: "284K", delta: "+18%", up: true },
      { label: "Clicks",      value: "6,120", delta: "+11%", up: true },
      { label: "CTR",         value: "2.15%", delta: "+0.3%", up: true },
      { label: "Engagement",  value: "4.8%",  delta: "-0.2%", up: false },
    ],
    bars: [
      { label: "Story Ads",    pct: 72, color: "#FFCA28" },
      { label: "Snap Ads",     pct: 55, color: "#FFA000" },
      { label: "Collection",   pct: 38, color: "#FFD54F" },
      { label: "Filters",      pct: 20, color: "#FFF176" },
    ],
  },
  {
    id: "meta",
    label: "Meta Analytics",
    accent: "#0866FF",
    kpis: [
      { label: "Impressions", value: "512K", delta: "+24%", up: true },
      { label: "Clicks",      value: "14.3K", delta: "+19%", up: true },
      { label: "CTR",         value: "2.79%", delta: "+0.5%", up: true },
      { label: "Conversions", value: "893",   delta: "+8%",  up: true },
    ],
    bars: [
      { label: "Facebook Feed",  pct: 80, color: "#0866FF" },
      { label: "Instagram Feed", pct: 68, color: "#E1306C" },
      { label: "Reels",          pct: 58, color: "#833AB4" },
      { label: "Stories",        pct: 42, color: "#F77737" },
    ],
  },
  {
    id: "google",
    label: "Google Ads Analytics",
    accent: "#4285F4",
    kpis: [
      { label: "Impressions", value: "1.2M", delta: "+31%", up: true },
      { label: "Clicks",      value: "22.8K", delta: "+16%", up: true },
      { label: "CTR",         value: "1.90%", delta: "+0.2%", up: true },
      { label: "ROAS",        value: "3.4×",  delta: "+0.4×", up: true },
    ],
    bars: [
      { label: "Search",   pct: 88, color: "#4285F4" },
      { label: "Display",  pct: 54, color: "#34A853" },
      { label: "Shopping", pct: 46, color: "#FBBC05" },
      { label: "YouTube",  pct: 38, color: "#EA4335" },
    ],
  },
  {
    id: "combined",
    label: "All Platforms Overview",
    accent: "#4285C7",
    kpis: [
      { label: "Total Reach",   value: "2.0M", delta: "+22%", up: true },
      { label: "Total Clicks",  value: "43.2K", delta: "+17%", up: true },
      { label: "Avg CTR",       value: "2.16%", delta: "+0.3%", up: true },
      { label: "Total Spend",   value: "$4,820", delta: "+5%", up: false },
    ],
    bars: [
      { label: "Google", pct: 82, color: "#4285F4" },
      { label: "Meta",   pct: 74, color: "#0866FF" },
      { label: "Snap",   pct: 56, color: "#FFCA28" },
      { label: "TikTok", pct: 38, color: "#374151" },
    ],
  },
];

// ── Mini sparkline bars ───────────────────────────────────────────────────────

const SPARK = [42, 58, 44, 68, 55, 72, 61, 80, 67, 85, 74, 90];

function MiniChart({ accent }: { accent: string }) {
  const max = Math.max(...SPARK);
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 36 }}>
      {SPARK.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(v / max) * 100}%`,
            background: i === SPARK.length - 1 ? accent : `${accent}55`,
            transition: "height 0.5s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardShowcase() {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) {
        setActive((prev) => (prev + 1) % PLATFORMS.length);
        setAnimKey((k) => k + 1);
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => {
    pausedRef.current = true;
    setActive(i);
    setAnimKey((k) => k + 1);
    setTimeout(() => { pausedRef.current = false; }, 8000);
  };

  const p = PLATFORMS[active];

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative w-full max-w-[540px] rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 4px 48px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.07)", background: "#fff" }}
      >
        {/* Accent bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${p.accent}, ${p.accent}99)`, transition: "background 0.4s ease" }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>WorldDigital.ai</p>
            <p className="text-sm font-black mt-0.5" style={{ color: "#111827" }}>{p.label}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#166534" }}>● Live</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(66,133,199,0.08)", color: "#4B5563" }}>Demo preview data</span>
          </div>
        </div>

        {/* KPI cards */}
        <div key={`kpi-${animKey}`} className="grid grid-cols-2 sm:grid-cols-4 gap-0" style={{ borderBottom: "1px solid #F1F5F9" }}>
          {p.kpis.map((kpi, i) => (
            <div
              key={kpi.label}
              className="px-3 py-3"
              style={{
                borderRight: i < 3 ? "1px solid #F1F5F9" : "none",
                animation: `fadeSlideUp 0.35s ease ${i * 0.06}s both`,
              }}
            >
              <p className="text-[10px] font-semibold truncate" style={{ color: "#6B7280" }}>{kpi.label}</p>
              <p className="text-base font-black mt-0.5" style={{ color: "#111827" }}>{kpi.value}</p>
              {kpi.delta && (
                <p className="text-[10px] font-bold" style={{ color: kpi.up ? "#166534" : "#DC2626" }}>
                  {kpi.up ? "↑" : "↓"} {kpi.delta}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>Performance Trend</p>
            <p className="text-[10px]" style={{ color: "#6B7280" }}>Last 12 weeks</p>
          </div>
          <MiniChart accent={p.accent} />
        </div>

        {/* Platform breakdown */}
        <div className="px-5 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "#6B7280" }}>Channel Breakdown</p>
          <div className="space-y-2">
            {p.bars.map((bar) => (
              <div key={bar.label}>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span style={{ color: "#6B7280" }}>{bar.label}</span>
                  <span className="font-bold" style={{ color: "#374151" }}>{bar.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${bar.pct}%`, background: bar.color, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center justify-between px-5 py-3" style={{ background: "#F7FAFC", borderTop: "1px solid #E5EAF2" }}>
          <div className="flex items-center gap-1.5">
            {PLATFORMS.map((pl, i) => (
              <button
                key={pl.id}
                onClick={() => goTo(i)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: i === active ? p.accent : "transparent",
                  color: i === active ? (p.accent === "#FFCA28" ? "#111827" : "#fff") : "#6B7280",
                  border: `1px solid ${i === active ? "transparent" : "#E2E8F0"}`,
                }}
              >
                {pl.id === "combined" ? "All" : pl.id.charAt(0).toUpperCase() + pl.id.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-[10px]" style={{ color: "#6B7280" }}>worlddigital.ai</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
