"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SERVICE_PRICING, type ServicePricing } from "@/lib/servicePricing";

interface ToolCreditSummary {
  totalCredits: number;
  totalUsed: number;
  users: number;
}

const ICON_MAP: Record<string, string> = {
  "google-ads": "/icons/google.webp",
  "meta-ads": "/icons/meta.png",
  "snapchat-ads": "/icons/snapchat.png",
  "tiktok-ads": "/icons/tiktok.jpeg",
  "linkedin-ads": "/icons/linkedin.png",
  "x-ads": "/icons/x.png",
  "youtube-shorts": "/icons/youtube-shorts.png",
};

const SVG_ICONS: Record<string, { d: string; color: string; bg: string }> = {
  "image-generator":  { d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  "reels-generator":  { d: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  "ai-seo":           { d: "M13 10V3L4 14h7v7l9-11h-7z", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  "keyword-research": { d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
  "content-marketing":{ d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
};

function ServiceIcon({ svc }: { svc: ServicePricing }) {
  if (ICON_MAP[svc.slug]) {
    const contain = svc.slug === "meta-ads" || svc.slug === "google-ads" || svc.slug === "snapchat-ads";
    return (
      <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0" style={{ background: contain ? "white" : undefined, border: contain ? "1px solid rgba(0,0,0,0.06)" : undefined }}>
        <Image src={ICON_MAP[svc.slug]} alt={svc.name} width={36} height={36} className={contain ? "w-[72%] h-[72%] object-contain" : "w-full h-full object-cover"} />
      </div>
    );
  }
  const svg = SVG_ICONS[svc.slug];
  if (svg) {
    return (
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: svg.bg }}>
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke={svg.color} strokeWidth={1.8} style={{ width: 18, height: 18 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d={svg.d} />
        </svg>
      </div>
    );
  }
  return <div className="w-9 h-9 rounded-lg" style={{ background: "#E5E7EB" }} />;
}

export default function AdminServicesPage() {
  const [creditSummary, setCreditSummary] = useState<Record<string, ToolCreditSummary>>({});
  const [activeTab, setActiveTab] = useState<"Ad Management" | "AI Generator" | "SEO & Content">("Ad Management");
  const [loading, setLoading] = useState(true);

  const adminToken = typeof window !== "undefined" ? localStorage.getItem("wdai_admin_token") : null;

  useEffect(() => {
    if (!adminToken) return;
    fetch("/api/v1/admin/tool-credits", { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((r) => r.json())
      .then((d) => { if (d.summary) setCreditSummary(d.summary); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  const tabs = ["Ad Management", "AI Generator", "SEO & Content"] as const;
  const filtered = SERVICE_PRICING.filter((s) => s.category === activeTab);

  const stats = [
    { label: "Total Services", value: SERVICE_PRICING.length.toString() },
    { label: "Ad Management", value: SERVICE_PRICING.filter(s => s.category === "Ad Management").length.toString() },
    { label: "AI Generators", value: SERVICE_PRICING.filter(s => s.category === "AI Generator").length.toString() },
    { label: "SEO & Content", value: SERVICE_PRICING.filter(s => s.category === "SEO & Content").length.toString() },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800">Service Catalog</h1>
        <p className="text-sm text-slate-500 mt-0.5">All platform services, pricing, and usage data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl p-4 bg-white border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={{
              borderBottomColor: activeTab === tab ? "#C13A2A" : "transparent",
              color: activeTab === tab ? "#C13A2A" : "#64748B",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Service table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="scroll-x">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Service</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Pricing</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Model</th>
              {activeTab !== "Ad Management" && (
                <>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Credits Sold</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Credits Used</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Users</th>
                </>
              )}
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((svc) => {
              const usage = creditSummary[svc.slug];
              return (
                <tr key={svc.slug} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <ServiceIcon svc={svc} />
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{svc.name}</p>
                        <p className="text-xs text-slate-400">{svc.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-sm text-slate-800">
                      {svc.pricingModel === "monthly"
                        ? `$${svc.monthlyPrice}/mo`
                        : `$${svc.packPrice} / ${svc.packCredits} ${svc.packUnit}`}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: svc.pricingModel === "monthly" ? "rgba(66,133,199,0.1)" : "rgba(16,185,129,0.1)",
                        color: svc.pricingModel === "monthly" ? "#4285C7" : "#10B981",
                      }}
                    >
                      {svc.pricingModel === "monthly" ? "Subscription" : "Credit Pack"}
                    </span>
                  </td>
                  {activeTab !== "Ad Management" && (
                    <>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {loading ? "—" : (usage?.totalCredits ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {loading ? "—" : (usage?.totalUsed ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {loading ? "—" : (usage?.users ?? 0).toLocaleString()}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/services/${svc.slug}`}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors hover:bg-slate-100"
                        style={{ color: "#4285C7" }}
                        target="_blank"
                      >
                        View Page
                      </Link>
                      {svc.stripeEnvKey && (
                        <span className="text-xs px-2 py-1 rounded-lg font-mono" style={{ background: "#F1F5F9", color: "#64748B" }}>
                          {svc.stripeEnvKey}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Stripe env var checklist */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-sm text-slate-800 mb-4">Stripe Price ID Configuration</h2>
        <div className="space-y-2">
          {SERVICE_PRICING.filter(s => s.stripeEnvKey).map(svc => (
            <div key={svc.slug} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <ServiceIcon svc={svc} />
              <span className="text-sm text-slate-700 flex-1">{svc.name}</span>
              <code className="text-xs font-mono px-2 py-1 rounded" style={{ background: "#F1F5F9", color: "#374151" }}>{svc.stripeEnvKey}</code>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>
                Set in Secrets
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
