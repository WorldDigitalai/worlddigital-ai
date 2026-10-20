"use client";

import { SmartCtaLink } from "@/components/home/SmartCtaLink";

const inputFields = [
  { label: "Business Name", value: "Sunrise Dental Studio" },
  { label: "Category", value: "Healthcare & Wellness" },
  { label: "Subcategory", value: "Cosmetic Dentistry" },
  { label: "Location", value: "Los Angeles, CA" },
];

const generationItems = [
  { label: "5 ad descriptions", progress: 100, color: "#1D7FE8" },
  { label: "5 image ad concepts", progress: 82, color: "#C93434" },
  { label: "5 video/reel concepts", progress: 55, color: "#059669" },
];

const selectedItems = [
  {
    type: "Description",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    content: "Transform your smile with expert cosmetic dentistry. Trusted by thousands in LA.",
    accent: "#1D7FE8",
    accentBg: "#EEF6FF",
  },
  {
    type: "Visual",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    content: "Image Ad — Concept #1",
    preview: { background: "linear-gradient(135deg,#1D7FE8,#0F4C8A)" },
    accent: "#C93434",
    accentBg: "#FEF2F2",
  },
  {
    type: "Reel Concept",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    content: "Before/after smile reveal, 15s, vertical format",
    accent: "#059669",
    accentBg: "#ECFDF5",
  },
];

export function ProductShowcaseSection() {
  return (
    <section className="py-24 lg:py-32 px-6" style={{ background: "#EEF6FF" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold mb-3" style={{ color: "#1D7FE8" }}>What Gets Generated</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4" style={{ color: "#111827" }}>
            Generate the campaign assets your business needs.
          </h2>
          <p className="text-lg" style={{ color: "#4B5563" }}>
            Create descriptions, visuals, and video/reel concepts from one guided workflow, then choose what goes into your campaign.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Panel 1 — Business Input */}
          <div
            className="rounded-3xl p-6 flex flex-col"
            style={{ background: "white", border: "1.5px solid #E5EAF2", boxShadow: "0 2px 20px rgba(15,23,42,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EEF6FF", color: "#1D7FE8" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Business Input</p>
                <p className="text-xs text-gray-400">Step 1 of 5</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {inputFields.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{label}</p>
                  <div
                    className="px-3 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "#F7FAFC", border: "1.5px solid #E5EAF2", color: "#374151" }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Logo uploaded */}
            <div
              className="mt-auto flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: "#F0FFF4", border: "1.5px solid #BBF7D0" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DCFCE7" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "#065F46" }}>Logo Uploaded</p>
                <p className="text-[10px]" style={{ color: "#059669" }}>worlddigital-logo.png</p>
              </div>
              <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 16 16" stroke="#059669" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3 3 7-7" />
              </svg>
            </div>
          </div>

          {/* Panel 2 — AI Generation */}
          <div
            className="rounded-3xl p-6 flex flex-col"
            style={{ background: "white", border: "1.5px solid #E5EAF2", boxShadow: "0 2px 20px rgba(15,23,42,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FEF2F2", color: "#C93434" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">AI Generation</p>
                <p className="text-xs text-gray-400">Generating assets…</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>

            <div className="space-y-5 mb-6">
              {generationItems.map(({ label, progress, color }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-semibold" style={{ color: "#374151" }}>{label}</p>
                    <p className="text-[10px] font-bold" style={{ color }}>{progress}%</p>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#F0F4F8" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${progress}%`, background: `linear-gradient(to right, ${color}99, ${color})` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-2">
              {[
                { label: "Descriptions", count: "5 / 5", done: true },
                { label: "Image concepts", count: "4 / 5", done: false },
                { label: "Video/reel concepts", count: "2 / 5", done: false },
              ].map(({ label, count, done }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
                  style={{
                    background: done ? "#F0FFF4" : "#F7FAFC",
                    border: `1px solid ${done ? "#BBF7D0" : "#E5EAF2"}`,
                  }}
                >
                  <span className="font-medium" style={{ color: done ? "#065F46" : "#6B7280" }}>{label}</span>
                  <span className="font-bold" style={{ color: done ? "#059669" : "#9CA3AF" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3 — Campaign Selection (light) */}
          <div
            className="rounded-3xl p-6 flex flex-col"
            style={{ background: "white", border: "1.5px solid #BFDBFE", boxShadow: "0 4px 32px rgba(29,127,232,0.10)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EEF6FF", color: "#1D7FE8" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Campaign Selection</p>
                <p className="text-xs" style={{ color: "#1D7FE8" }}>Ready to Launch</p>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {selectedItems.map(({ type, icon, content, preview, accent, accentBg }) => (
                <div
                  key={type}
                  className="rounded-2xl p-3"
                  style={{ background: accentBg, border: `1.5px solid ${accent}30` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "white", color: accent }}>
                      {icon}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>{type} — Selected</p>
                  </div>
                  {preview ? (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl shrink-0" style={preview} />
                      <p className="text-xs font-medium" style={{ color: "#374151" }}>{content}</p>
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{content}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2.5">
              <SmartCtaLink
                guestHref="/subscribe"
                authedHref="/dashboard"
                className="flex items-center justify-center w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#1D7FE8,#C93434)", boxShadow: "0 4px 20px rgba(29,127,232,0.25)" }}
              >
                Add to Cart
              </SmartCtaLink>
              <p className="text-center text-[11px]" style={{ color: "#9CA3AF" }}>No contracts. Cancel anytime.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
