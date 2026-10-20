"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";

// ── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = {
  id: string;
  name: string;
  price: number;
  billing?: "monthly" | "pack";
  category: "Ad Management" | "AI Tools";
  desc: string;
} & (
  | { iconType: "img"; iconSrc: string; contain?: boolean }
  | { iconType: "svg"; iconSvgD: string; iconBg: string; iconStroke: string }
);

// ── Fixed plan data ───────────────────────────────────────────────────────────

const yearlyPlanMap: Record<string, string> = {
  "snapchat-monthly": "snapchat-yearly",
  "meta-monthly":     "meta-yearly",
  "google-monthly":   "google-yearly",
};

const plans = [
  {
    id: "snapchat-monthly",
    platform: "snapchat" as const,
    name: "Snapchat",
    displayMonthly: 49.99,
    displayYearly: 539.88,
    features: [
      "AI-Generated Ad Creatives",
      "Story & Snap Ad Formats",
      "Gen Z Audience Targeting",
      "Swipe-Up CTA Optimization",
      "Performance Analytics",
      "24/7 Campaign Monitoring",
      "2,000 AI tokens / month included",
    ],
  },
  {
    id: "meta-monthly",
    platform: "meta" as const,
    name: "Meta",
    displayMonthly: 49.99,
    displayYearly: 539.88,
    features: [
      "Facebook & Instagram Campaigns",
      "AI Ad Copy & Creative",
      "Lookalike Audience Targeting",
      "Retargeting & Remarketing",
      "A/B Testing Automation",
      "Performance Analytics",
      "24/7 Campaign Monitoring",
      "2,000 AI tokens / month included",
    ],
  },
  {
    id: "google-monthly",
    platform: "google" as const,
    name: "Google",
    displayMonthly: 49.99,
    displayYearly: 539.88,
    features: [
      "Search & Display Campaigns",
      "AI Keyword Strategy",
      "Smart Bid Optimization",
      "Performance Max Campaigns",
      "Ad Copy Generation",
      "Performance Analytics",
      "24/7 Campaign Monitoring",
      "2,000 AI tokens / month included",
    ],
  },
];

// ── Custom builder services ───────────────────────────────────────────────────

const SERVICES: ServiceItem[] = [
  { id: "google-ads",      name: "Google Ads",            price: 49.99, category: "Ad Management", iconType: "img", iconSrc: "/icons/google.webp",  contain: true,  desc: "Search & Display campaigns with smart AI bidding — 2,000 tokens/mo" },
  { id: "meta-ads",        name: "Meta Ads",              price: 49.99, category: "Ad Management", iconType: "img", iconSrc: "/icons/meta.png",      contain: true,  desc: "Facebook & Instagram with AI creative & targeting — 2,000 tokens/mo" },
  { id: "snapchat-ads",    name: "Snapchat Ads",          price: 49.99, category: "Ad Management", iconType: "img", iconSrc: "/icons/snapchat.png", desc: "Gen Z-focused Stories and Snap Ad campaigns — 2,000 tokens/mo" },
  { id: "tiktok-ads",      name: "TikTok Ads",            price: 49.99, category: "Ad Management", iconType: "img", iconSrc: "/icons/tiktok.jpeg",                   desc: "Short-form video ads optimized by AI — 2,000 tokens/mo" },
  { id: "linkedin-ads",    name: "LinkedIn Ads",          price: 49.99, category: "Ad Management", iconType: "img", iconSrc: "/icons/linkedin.png",                  desc: "B2B lead generation and professional targeting — 2,000 tokens/mo" },
  { id: "x-ads",           name: "X Ads",                 price: 49.99, category: "Ad Management", iconType: "img", iconSrc: "/icons/x.png",                         desc: "Real-time trend targeting on X (Twitter) — 2,000 tokens/mo" },
  { id: "auto-seo", name: "Auto SEO", price: 199.99, category: "AI Tools", iconType: "svg", iconSvgD: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", iconBg: "rgba(16,185,129,0.12)", iconStroke: "#10B981", desc: "AI-powered SEO for Google, ChatGPT & AI Search — 200 tokens/mo included" },
];

const AD_SERVICES = SERVICES.filter((s) => s.category === "Ad Management");
const AI_SERVICES = SERVICES.filter((s) => s.category === "AI Tools");

// ── Ad budget minimums ────────────────────────────────────────────────────────

const AD_BUDGET_MINIMUMS = [
  { platform: "Google Ads",   min: "$10/day",  note: "Search & Display campaigns" },
  { platform: "Meta Ads",     min: "$10/day",  note: "Facebook & Instagram" },
  { platform: "Snapchat Ads", min: "$10/day",  note: "Story & Snap ad formats" },
  { platform: "TikTok Ads",   min: "$10/day",  note: "In-Feed & TopView" },
  { platform: "LinkedIn Ads", min: "$30/day",  note: "Sponsored Content & InMail" },
  { platform: "X Ads",        min: "$10/day",  note: "Promoted posts & trends" },
  { platform: "YouTube Ads",  min: "$50/day",  note: "Pre-roll & display campaigns" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ServiceIcon({ svc, size = 40 }: { svc: ServiceItem; size?: number }) {
  if (svc.iconType === "img") {
    return (
      <div
        className="rounded-xl overflow-hidden flex items-center justify-center shrink-0"
        style={{
          width: size, height: size,
          background: svc.contain ? "white" : undefined,
          border: svc.contain ? "1px solid rgba(0,0,0,0.06)" : undefined,
        }}
      >
        <Image
          src={svc.iconSrc}
          alt={svc.name}
          width={size}
          height={size}
          className={svc.contain ? "w-[72%] h-[72%] object-contain" : "w-full h-full object-cover"}
          style={{ display: "block" }}
        />
      </div>
    );
  }
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: svc.iconBg }}
    >
      <svg width={size * 0.5} height={size * 0.5} fill="none" viewBox="0 0 24 24" stroke={svc.iconStroke} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={svc.iconSvgD} />
      </svg>
    </div>
  );
}

function ServiceCard({ svc, selected, onToggle, quantity, onAdjustQty }: {
  svc: ServiceItem; selected: boolean; onToggle: () => void;
  quantity?: number; onAdjustQty?: (delta: number) => void;
}) {
  const qty = quantity ?? 1;
  return (
    <button
      onClick={onToggle}
      className="relative w-full text-left rounded-2xl p-4 transition-all duration-200 focus:outline-none"
      style={{
        background: "white",
        border: selected ? "2px solid #C13A2A" : "2px solid rgba(0,0,0,0.07)",
        boxShadow: selected
          ? "0 0 0 4px rgba(193,58,42,0.09), 0 6px 24px rgba(193,58,42,0.12)"
          : "0 2px 10px rgba(0,0,0,0.05)",
        transform: selected ? "scale(1.015)" : "scale(1)",
      }}
    >
      <div
        className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: selected ? "#C13A2A" : "rgba(0,0,0,0.06)",
          transform: selected ? "scale(1)" : "scale(0.7)",
          opacity: selected ? 1 : 0.5,
        }}
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mb-3"><ServiceIcon svc={svc} size={40} /></div>
      <h3 className="font-black text-xs mb-1 pr-5" style={{ color: "#111827" }}>{svc.name}</h3>
      <p className="text-[11px] leading-relaxed mb-3" style={{ color: "#6B7280" }}>{svc.desc}</p>
      <p className="flex items-baseline gap-0.5 mb-2">
        <span className="text-sm font-black" style={{ color: selected ? "#C13A2A" : "#111827" }}>${svc.price}</span>
        <span className="text-[11px] font-normal" style={{ color: "#9CA3AF" }}>{svc.billing === "pack" ? "/pack" : "/mo"}</span>
      </p>
      {selected && onAdjustQty && (
        <div
          className="flex items-center gap-2 pt-2 border-t"
          style={{ borderColor: "rgba(193,58,42,0.15)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdjustQty(-1); }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold leading-none hover:bg-red-50 transition-colors"
            style={{ border: "1px solid rgba(193,58,42,0.3)", color: "#C13A2A" }}
          >−</button>
          <span className="text-xs font-black min-w-[18px] text-center" style={{ color: "#111827" }}>{qty}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdjustQty(1); }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold leading-none hover:bg-red-50 transition-colors"
            style={{ border: "1px solid rgba(193,58,42,0.3)", color: "#C13A2A" }}
          >+</button>
          {qty > 1 && (
            <span className="text-[10px] font-bold ml-auto" style={{ color: "#C13A2A" }}>
              ${(svc.price * qty).toLocaleString()}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function CartItem({ svc, onRemove, quantity, onAdjustQty }: {
  svc: ServiceItem; onRemove: () => void;
  quantity?: number; onAdjustQty?: (delta: number) => void;
}) {
  const qty = quantity ?? 1;
  return (
    <div className="py-2.5 border-b last:border-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-3">
        <ServiceIcon svc={svc} size={30} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: "#111827" }}>{svc.name}</p>
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
            ${svc.price}{svc.billing === "pack" ? "/pack" : "/mo"}
            {qty > 1 && <span className="ml-1 font-bold" style={{ color: "#C13A2A" }}>×{qty}</span>}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
          aria-label={`Remove ${svc.name}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>
      {onAdjustQty && (
        <div className="flex items-center gap-2 mt-1.5 pl-[42px]">
          <button
            type="button"
            onClick={() => onAdjustQty(-1)}
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-50 transition-colors"
            style={{ border: "1px solid rgba(193,58,42,0.25)", color: "#C13A2A" }}
          >−</button>
          <span className="text-xs font-bold min-w-[16px] text-center" style={{ color: "#111827" }}>{qty}</span>
          <button
            type="button"
            onClick={() => onAdjustQty(1)}
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-50 transition-colors"
            style={{ border: "1px solid rgba(193,58,42,0.25)", color: "#C13A2A" }}
          >+</button>
          {qty > 1 && (
            <span className="text-[10px] font-semibold ml-auto" style={{ color: "#6B7280" }}>
              ${(svc.price * qty).toLocaleString()}/mo
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SubscribePage() {
  const { user } = useAuth();

  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({ company: "", name: "", email: "", phone: "", budget: "", platforms: "", message: "" });
  const [enterpriseSent, setEnterpriseSent] = useState(false);
  const [enterpriseLoading, setEnterpriseLoading] = useState(false);
  const [enterpriseError, setEnterpriseError] = useState<string | null>(null);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [autoSeoQty, setAutoSeoQty] = useState(1);
  const builderRef = useRef<HTMLDivElement>(null);

  const selectedServices = SERVICES.filter((s) => selected.has(s.id));
  const customTotal = selectedServices.reduce((sum, s) => sum + s.price * (quantities[s.id] ?? 1), 0);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setQuantities((q) => (q[id] ? q : { ...q, [id]: 1 }));
      }
      return next;
    });
  };

  const adjustQty = (id: string, delta: number) => {
    setQuantities((q) => ({
      ...q,
      [id]: Math.max(1, Math.min(10, (q[id] ?? 1) + delta)),
    }));
  };

  const handleChoosePlan = async (monthlyPlanId: string) => {
    if (!user) { window.location.href = `/signup?next=/subscribe`; return; }
    const actualPlan = isYearly && yearlyPlanMap[monthlyPlanId] ? yearlyPlanMap[monthlyPlanId] : monthlyPlanId;
    setLoadingPlan(monthlyPlanId);
    setCheckoutError(null);
    const res = await api.stripe.checkout(actualPlan);
    if (res.ok && res.data.url) {
      window.location.href = res.data.url;
    } else {
      setCheckoutError(res.error || "Could not start checkout. Please try again.");
      setLoadingPlan(null);
    }
  };

  const handleCustomCheckout = async () => {
    if (!user) { window.location.href = `/signup?next=/subscribe`; return; }
    if (selected.size === 0) return;
    setCustomLoading(true);
    setCustomError(null);
    const res = await api.stripe.customCheckout(
      selectedServices.map((s) => ({ id: s.id, name: s.name, price: s.price, quantity: quantities[s.id] ?? 1 }))
    );
    if (res.ok && res.data.url) {
      window.location.href = res.data.url;
    } else {
      setCustomError(res.error || "Checkout failed. Please try again.");
      setCustomLoading(false);
    }
  };

  const handleOpenBuilder = () => {
    setBuilderOpen(true);
    setTimeout(() => {
      builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleAutoSeoCheckout = async () => {
    if (!user) { window.location.href = `/signup?next=/subscribe?plan=auto-seo-monthly`; return; }
    setCustomLoading(true);
    setCustomError(null);
    const qty = Math.max(1, Math.min(10, autoSeoQty));
    const res = await api.stripe.customCheckout(
      [{ id: "auto-seo", name: "Auto SEO", price: 199.99, quantity: qty }],
      { plan: "auto-seo-monthly", billingInterval: "month" }
    );
    if (res.ok && res.data.url) {
      window.location.href = res.data.url;
    } else {
      setCustomError(res.error || "Checkout failed. Please try again.");
      setCustomLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("plan") === "auto-seo-monthly") {
      setBuilderOpen(true);
      setSelected((prev) => { const next = new Set(prev); next.add("auto-seo"); return next; });
      setQuantities((q) => ({ ...q, "auto-seo": 1 }));
      setTimeout(() => builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    }
  }, []);

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnterpriseLoading(true);
    setEnterpriseError(null);
    try {
      const res = await fetch("/api/v1/enterprise/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enterpriseForm),
      });
      if (res.ok) { setEnterpriseSent(true); }
      else { setEnterpriseError("Failed to send. Please email us at support@worlddigital.ai"); }
    } catch {
      setEnterpriseError("Network error. Please email us at support@worlddigital.ai");
    } finally {
      setEnterpriseLoading(false);
    }
  };

  return (
    <main style={{ background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 30%, #EEF9FF 70%, #DAEEFF 100%)", minHeight: "100vh" }}>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-12 px-6 text-center overflow-hidden">
        <div className="absolute top-8 right-12 w-24 h-24 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(193,58,42,0.18) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-10 w-16 h-16 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(66,133,199,0.45) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-sm font-semibold mb-4" style={{ color: "#C13A2A" }}>Special Offer</p>
          <h1 className="font-black leading-tight mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 3.75rem)", color: "#111827" }}>
            Our Plans &amp; Packages
          </h1>
          <p className="text-base sm:text-lg mb-8" style={{ color: "#4B5563" }}>
            Unlock exclusive deals on AI-driven marketing solutions for every channel.
          </p>
          <div className="inline-flex items-center gap-1 p-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => setIsYearly(false)}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
              style={!isYearly ? { background: "#C13A2A", color: "white" } : { color: "#6B7280" }}
            >Monthly</button>
            <button
              onClick={() => setIsYearly(true)}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
              style={isYearly ? { background: "#C13A2A", color: "white" } : { color: "#6B7280" }}
            >
              Yearly{" "}
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: isYearly ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)", color: isYearly ? "white" : "#6B7280" }}>
                Save 10%
              </span>
            </button>
          </div>
          {checkoutError && (
            <div className="mt-5 max-w-md mx-auto px-4 py-3 rounded-xl text-sm text-red-700 border border-red-200 bg-red-50">{checkoutError}</div>
          )}
        </div>
      </section>

      {/* ── FIXED PLAN CARDS (Snapchat, Meta, Google) ─────────────────────────── */}
      <section className="pb-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map(({ id, platform, name, displayMonthly, displayYearly, features }) => {
              const isLoading = loadingPlan === id;
              return (
                <div
                  key={id}
                  className="rounded-2xl p-6 flex flex-col relative"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
                >
                  <div className="mb-4">
                    <PlatformIcon platform={platform} size={44} rounded="rounded-xl" />
                  </div>
                  <h2 className="font-black text-sm mb-1" style={{ color: "#111827" }}>{name}</h2>
                  <p className="font-black mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", color: "#111827" }}>
                    ${isYearly ? displayYearly.toLocaleString() : displayMonthly}
                    <span className="text-xs font-normal ml-1" style={{ color: "#9CA3AF" }}>/{isYearly ? "year" : "month"}</span>
                  </p>
                  {isYearly && <p className="text-[10px] font-semibold mb-3" style={{ color: "#059669" }}>Save 10% vs monthly</p>}
                  <div className="h-px mb-4" style={{ background: "#F0F0F0" }} />
                  <ul className="space-y-2 mb-6 flex-1">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "#6B7280" }}>
                        <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="6" fill="rgba(66,133,199,0.1)" />
                          <path d="M4 7l2 2 4-4" stroke="#4285C7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => void handleChoosePlan(id)}
                    disabled={!!loadingPlan}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
                  >
                    {isLoading ? "Loading…" : "Choose Plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CUSTOM PACKAGE CARD ───────────────────────────────────────────────── */}
      <section className="py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl p-[2px]" style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}>
            <div className="rounded-[14px] p-6 sm:p-8" style={{ background: "white" }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2">
                      {[
                        { src: "/icons/google.webp",   contain: true  },
                        { src: "/icons/meta.png",       contain: true  },
                        { src: "/icons/tiktok.jpeg",    contain: false },
                        { src: "/icons/linkedin.png",   contain: false },
                        { src: "/icons/snapchat.png",  contain: false },
                        { src: "/icons/x.png",          contain: false },
                      ].map(({ src, contain }, i) => (
                        <div
                          key={src}
                          className="rounded-lg overflow-hidden border-2 border-white"
                          style={{ width: 32, height: 32, background: contain ? "white" : undefined, zIndex: 6 - i, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Image src={src} alt="" width={32} height={32}
                            className={contain ? "w-[70%] h-[70%] object-contain" : "w-full h-full object-cover"}
                            style={{ display: "block" }}
                          />
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "linear-gradient(135deg, rgba(66,133,199,0.12), rgba(193,58,42,0.12))", color: "#C13A2A", border: "1px solid rgba(193,58,42,0.2)" }}>
                      Flexible
                    </span>
                  </div>
                  <h2 className="text-xl font-black mb-1" style={{ color: "#111827" }}>Build Your Own Package</h2>
                  <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Mix and match any platform or AI tool. Only pay for what you need.</p>
                  <div className="flex flex-wrap gap-3">
                    {["Google", "Meta", "TikTok", "LinkedIn", "Snapchat", "X"].map(p => (
                      <span key={p} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.05)", color: "#374151" }}>{p}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                  <p className="text-xs font-bold" style={{ color: "#9CA3AF" }}>Mix &amp; match pricing</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Build your stack</p>
                  <button
                    onClick={handleOpenBuilder}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)", boxShadow: "0 4px 16px rgba(193,58,42,0.28)" }}
                  >
                    {builderOpen ? "Builder Open ↓" : "Build My Package →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOM BUILDER (expands when opened) ──────────────────────────────── */}
      {builderOpen && (
        <section ref={builderRef} className="py-10 px-4 sm:px-6" style={{ scrollMarginTop: 88 }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-black text-xl" style={{ color: "#111827" }}>Build Your Stack</h2>
                <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Select the services you want — total updates live</p>
              </div>
              <button
                onClick={() => setBuilderOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: "#6B7280" }}
                aria-label="Close builder"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 min-w-0">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>Ad Management</p>
                    <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
                    <p className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>$49.99/mo each</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AD_SERVICES.map((svc) => (
                      <ServiceCard key={svc.id} svc={svc} selected={selected.has(svc.id)} onToggle={() => toggle(svc.id)} quantity={quantities[svc.id]} onAdjustQty={(d) => adjustQty(svc.id, d)} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>AI Tools</p>
                    <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {AI_SERVICES.map((svc) => (
                      <ServiceCard key={svc.id} svc={svc} selected={selected.has(svc.id)} onToggle={() => toggle(svc.id)} quantity={quantities[svc.id]} onAdjustQty={(d) => adjustQty(svc.id, d)} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart panel (desktop sticky) */}
              <div className="hidden lg:block w-72 shrink-0 sticky top-24">
                <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                  <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <h3 className="font-black text-sm" style={{ color: "#111827" }}>Your Stack</h3>
                    {selectedServices.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#C13A2A" }}>
                        {selectedServices.length}
                      </span>
                    )}
                  </div>
                  <div className="px-5 py-4 min-h-[100px]">
                    {selectedServices.length === 0 ? (
                      <div className="py-4 text-center">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl" style={{ background: "rgba(0,0,0,0.04)" }}>🛒</div>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Select services to build your stack</p>
                      </div>
                    ) : (
                      <div>
                        {selectedServices.map((svc) => (
                          <CartItem key={svc.id} svc={svc} onRemove={() => toggle(svc.id)} quantity={quantities[svc.id]} onAdjustQty={(d) => adjustQty(svc.id, d)} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-5 pb-5">
                    {selectedServices.length > 0 && (
                      <div className="flex items-center justify-between py-2.5 mb-4 rounded-xl px-3" style={{ background: "rgba(0,0,0,0.03)" }}>
                        <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Total</span>
                        <span className="font-black text-sm" style={{ color: "#111827" }}>
                          ${customTotal.toLocaleString()}<span className="text-xs font-normal ml-0.5" style={{ color: "#9CA3AF" }}>/mo</span>
                        </span>
                      </div>
                    )}
                    {customError && (
                      <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">{customError}</p>
                    )}
                    <button
                      onClick={() => void handleCustomCheckout()}
                      disabled={selectedServices.length === 0 || customLoading}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(to right, #4285C7, #C13A2A)",
                        boxShadow: selectedServices.length === 0 ? "none" : "0 6px 20px rgba(193,58,42,0.28)",
                      }}
                    >
                      {customLoading ? "Loading…" : selectedServices.length === 0 ? "Select services to begin" : `Checkout — $${customTotal.toLocaleString()}/mo`}
                    </button>
                    {selectedServices.length > 0 && (
                      <p className="text-[10px] text-center mt-2.5" style={{ color: "#9CA3AF" }}>Billed monthly · Cancel anytime</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── AUTO SEO ADD-ON ───────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-8" style={{ color: "#9CA3AF" }}>Add-On Service</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "rgba(16,185,129,0.1)" }}>🔍</div>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: "#10B981" }}>New</span>
                </div>
                <h2 className="text-2xl font-black mb-1" style={{ color: "#111827" }}>Auto SEO</h2>
                <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>Rank on Google, ChatGPT &amp; AI Search</p>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "#4B5563" }}>
                  Dominate organic search across Google, ChatGPT, Perplexity, and AI-powered search engines. AI-generated SEO content, keyword optimization, and visibility tracking — all automated.
                </p>
                <div className="mb-4">
                  <span className="text-3xl font-black" style={{ color: "#111827" }}>
                    ${(199.99 * autoSeoQty).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm ml-1" style={{ color: "#9CA3AF" }}>/month</span>
                  {autoSeoQty > 1 && (
                    <span className="text-xs ml-2" style={{ color: "#6B7280" }}>
                      ($199.99 × {autoSeoQty})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-semibold" style={{ color: "#4B5563" }}>Quantity</span>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <button
                      type="button"
                      onClick={() => setAutoSeoQty((q) => Math.max(1, q - 1))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors hover:bg-emerald-100"
                      style={{ color: "#10B981" }}
                    >−</button>
                    <span className="text-sm font-black min-w-[20px] text-center" style={{ color: "#111827" }}>{autoSeoQty}</span>
                    <button
                      type="button"
                      onClick={() => setAutoSeoQty((q) => Math.min(10, q + 1))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors hover:bg-emerald-100"
                      style={{ color: "#10B981" }}
                    >+</button>
                  </div>
                  {autoSeoQty > 1 && (
                    <span className="text-xs" style={{ color: "#6B7280" }}>locations / brands</span>
                  )}
                </div>
                <button
                  onClick={() => void handleAutoSeoCheckout()}
                  disabled={customLoading}
                  className="py-3.5 px-8 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(to right, #10B981, #059669)" }}
                >
                  {customLoading ? "Loading…" : autoSeoQty > 1 ? `Add ${autoSeoQty}× Auto SEO →` : "Add Auto SEO →"}
                </button>
              </div>
              <div className="p-6 flex flex-col justify-center" style={{ background: "#0F172A" }}>
                <p className="text-xs font-semibold mb-4" style={{ color: "#6B7280" }}>SEO Performance Preview</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Organic Traffic",     value: "+142%",      color: "#10B981" },
                    { label: "Keyword Rankings",     value: "Top 10",     color: "#60A5FA" },
                    { label: "AI Search Visibility", value: "ChatGPT ✓", color: "#A78BFA" },
                    { label: "Backlinks",            value: "+38 this mo", color: "#FBBF24" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "#6B7280" }}>{label}</p>
                      <p className="text-sm font-black" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
                <ul className="space-y-2">
                  {["AI SEO Content Generation", "Google Search Rankings", "ChatGPT & Perplexity Visibility", "Keyword Research & Tracking", "Monthly SEO Report"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}>
                      <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" fill="rgba(16,185,129,0.15)" />
                        <path d="M3.5 6l2 2 3-3" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AD BUDGET MINIMUMS ────────────────────────────────────────────────── */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <h2 className="font-black text-base" style={{ color: "#0F172A" }}>Ad Platform Minimum Daily Budgets</h2>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                Platform-enforced minimums — separate from the WorldDigital.ai management fee
              </p>
            </div>
            <div className="scroll-x">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>Platform</th>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>Minimum Daily Budget</th>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wide hidden sm:table-cell" style={{ color: "#64748B" }}>Ad Formats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {AD_BUDGET_MINIMUMS.map(({ platform, min, note }) => (
                  <tr key={platform} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "#0F172A" }}>{platform}</td>
                    <td className="px-6 py-3.5 text-sm font-bold" style={{ color: "#4285C7" }}>{min}</td>
                    <td className="px-6 py-3.5 text-xs hidden sm:table-cell" style={{ color: "#94A3B8" }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="px-6 py-4" style={{ background: "rgba(66,133,199,0.03)", borderTop: "1px solid #F1F5F9" }}>
              <p className="text-xs" style={{ color: "#94A3B8" }}>
                * Ad spend goes directly to the platform. The management fee covers strategy, AI creative, and optimization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE ────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0F172A, #1a2a4a)", border: "1px solid rgba(66,133,199,0.2)" }}>
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4285C7, transparent 70%)" }} />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#93C5FD" }}>Enterprise</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3">Custom Package for Enterprise</h2>
              <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: "#9CA3AF" }}>
                Large ad budgets, multiple locations, custom integrations, dedicated account management.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                {["Custom Ad Budget", "Dedicated Account Manager", "Custom Integrations", "SLA & Priority Support"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm" style={{ color: "#D1D5DB" }}>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill="rgba(96,165,250,0.15)" />
                      <path d="M5 8l2 2 4-4" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEnterpriseOpen(true)}
                className="inline-flex items-center gap-2 py-4 px-10 rounded-full font-bold text-white text-base transition-all hover:opacity-90"
                style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
              >
                Contact Sales
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE STICKY CHECKOUT BAR ────────────────────────────────────────── */}
      {builderOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40" style={{ background: "white", borderTop: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 -4px 24px rgba(0,0,0,0.10)" }}>
          {mobileCartOpen && selectedServices.length > 0 && (
            <div className="px-4 pt-4 pb-2 max-h-56 overflow-y-auto">
              {selectedServices.map((svc) => (
                <CartItem key={svc.id} svc={svc} onRemove={() => toggle(svc.id)} quantity={quantities[svc.id]} onAdjustQty={(d) => adjustQty(svc.id, d)} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <button
              className="flex-1 flex items-center gap-2 min-w-0"
              onClick={() => setMobileCartOpen((v) => !v)}
              disabled={selectedServices.length === 0}
            >
              <div className="flex flex-col items-start">
                <p className="text-[10px] font-semibold" style={{ color: "#9CA3AF" }}>
                  {selectedServices.length === 0 ? "No services selected" : `${selectedServices.length} service${selectedServices.length !== 1 ? "s" : ""} selected`}
                </p>
                <p className="font-black text-base" style={{ color: "#111827" }}>
                  ${customTotal.toLocaleString()}<span className="text-xs font-normal text-gray-400">/mo</span>
                </p>
              </div>
              {selectedServices.length > 0 && (
                <svg className="w-4 h-4 ml-1 transition-transform" style={{ color: "#9CA3AF", transform: mobileCartOpen ? "rotate(180deg)" : "none" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
            <button
              onClick={() => void handleCustomCheckout()}
              disabled={selectedServices.length === 0 || customLoading}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)", boxShadow: selectedServices.length > 0 ? "0 4px 16px rgba(193,58,42,0.30)" : "none" }}
            >
              {customLoading ? "…" : "Checkout"}
            </button>
          </div>
          {customError && <p className="px-4 pb-3 text-[11px] text-red-600">{customError}</p>}
        </div>
      )}

      {/* ── ENTERPRISE MODAL ──────────────────────────────────────────────────── */}
      {enterpriseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-8 relative max-h-[90vh] overflow-y-auto" style={{ background: "white" }}>
            <button
              onClick={() => setEnterpriseOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: "#6B7280" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {enterpriseSent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#ECFDF5" }}>
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-xl font-black mb-2" style={{ color: "#111827" }}>Message Sent!</h3>
                <p style={{ color: "#6B7280" }}>Our enterprise team will be in touch within 24 hours.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black mb-1" style={{ color: "#111827" }}>Enterprise Inquiry</h2>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Tell us about your business and we&apos;ll get back to you within 24 hours.</p>
                {enterpriseError && <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 border border-red-200 bg-red-50">{enterpriseError}</div>}
                <form onSubmit={(e) => void handleEnterpriseSubmit(e)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Company</label>
                      <input required className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" style={{ border: "1px solid #E5EAF2" }} placeholder="Acme Corp" value={enterpriseForm.company} onChange={e => setEnterpriseForm({ ...enterpriseForm, company: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Your Name</label>
                      <input required className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" style={{ border: "1px solid #E5EAF2" }} placeholder="Jane Smith" value={enterpriseForm.name} onChange={e => setEnterpriseForm({ ...enterpriseForm, name: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Email</label>
                    <input required type="email" className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" style={{ border: "1px solid #E5EAF2" }} placeholder="jane@company.com" value={enterpriseForm.email} onChange={e => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Phone</label>
                    <input type="tel" className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" style={{ border: "1px solid #E5EAF2" }} placeholder="+1 (555) 000-0000" value={enterpriseForm.phone} onChange={e => setEnterpriseForm({ ...enterpriseForm, phone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Monthly Budget</label>
                      <input className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" style={{ border: "1px solid #E5EAF2" }} placeholder="e.g. $5,000–$10,000" value={enterpriseForm.budget} onChange={e => setEnterpriseForm({ ...enterpriseForm, budget: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Platforms</label>
                      <input className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" style={{ border: "1px solid #E5EAF2" }} placeholder="Google, Meta, Snapchat" value={enterpriseForm.platforms} onChange={e => setEnterpriseForm({ ...enterpriseForm, platforms: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Message</label>
                    <textarea required className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none" style={{ border: "1px solid #E5EAF2" }} rows={4} placeholder="Tell us about your marketing goals..." value={enterpriseForm.message} onChange={e => setEnterpriseForm({ ...enterpriseForm, message: e.target.value })} />
                  </div>
                  <button
                    type="submit"
                    disabled={enterpriseLoading}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
                  >
                    {enterpriseLoading ? "Sending…" : "Send Inquiry"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
