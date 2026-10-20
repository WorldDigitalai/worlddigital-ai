"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";

interface AccountData {
  subscriptionStatus: string;
  subscriptionPlan?: string;
  stripeCustomerId: string | null;
}

interface UsageCredits {
  captionsLimit: number;
  imagePostsLimit: number;
  reelsLimit: number;
  videoAdsLimit: number;
  socialPostsLimit: number;
  captionsUsed: number;
  imagePostsUsed: number;
  reelsUsed: number;
  videoAdsUsed: number;
  socialPostsUsed: number;
}

interface PlanDefinition {
  name: string;
  tagline: string;
  platforms: string[];
  aiTools: string[];
  monthlyPrice: string;
  color: string;
  gradient: string;
}

const PLAN_MAP: Record<string, PlanDefinition> = {
  "snapchat-monthly": { name: "Snapchat Ads", tagline: "Snapchat advertising for your business", platforms: ["Snapchat"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue"], monthlyPrice: "$49.99/mo", color: "#FFFC00", gradient: "linear-gradient(135deg,#FFFC00,#FF6B00)" },
  "snapchat-yearly":  { name: "Snapchat Ads", tagline: "Snapchat advertising — annual plan",      platforms: ["Snapchat"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue"], monthlyPrice: "~$45/mo", color: "#FFFC00", gradient: "linear-gradient(135deg,#FFFC00,#FF6B00)" },
  "meta-monthly":     { name: "Meta Ads", tagline: "Facebook & Instagram advertising",             platforms: ["Facebook", "Instagram"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue", "Platform Previews"], monthlyPrice: "$49.99/mo", color: "#1877F2", gradient: "linear-gradient(135deg,#1877F2,#E1306C)" },
  "meta-yearly":      { name: "Meta Ads", tagline: "Facebook & Instagram — annual plan",            platforms: ["Facebook", "Instagram"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue", "Platform Previews"], monthlyPrice: "~$45/mo", color: "#1877F2", gradient: "linear-gradient(135deg,#1877F2,#E1306C)" },
  "google-monthly":   { name: "Google Ads", tagline: "Google Search & Display advertising",        platforms: ["Google Search", "Google Display"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue", "Ad Creative Pack"], monthlyPrice: "$49.99/mo", color: "#4285F4", gradient: "linear-gradient(135deg,#4285F4,#34A853)" },
  "google-yearly":    { name: "Google Ads", tagline: "Google Search & Display — annual plan",       platforms: ["Google Search", "Google Display"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue", "Ad Creative Pack"], monthlyPrice: "~$45/mo", color: "#4285F4", gradient: "linear-gradient(135deg,#4285F4,#34A853)" },
  "meta-google-monthly": { name: "Meta + Google", tagline: "Facebook, Instagram & Google advertising", platforms: ["Facebook", "Instagram", "Google Search", "Google Display"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue", "Ad Creative Pack", "Platform Previews"], monthlyPrice: "$500/mo", color: "#4285F4", gradient: "linear-gradient(135deg,#1877F2,#4285F4)" },
  "meta-google-yearly":  { name: "Meta + Google", tagline: "Facebook, Instagram & Google — annual plan", platforms: ["Facebook", "Instagram", "Google Search", "Google Display"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue", "Ad Creative Pack", "Platform Previews"], monthlyPrice: "~$417/mo", color: "#4285F4", gradient: "linear-gradient(135deg,#1877F2,#4285F4)" },
  "all-monthly": { name: "Multi-Platform", tagline: "All platforms — maximum reach", platforms: ["Facebook", "Instagram", "Google Search", "Google Display", "Snapchat", "TikTok", "LinkedIn", "X/Twitter", "YouTube Shorts"], aiTools: ["AI Caption Generation", "Reel Scripts", "Full Campaign Pack", "Content Studio", "Publishing Queue", "Ad Creative Pack", "Platform Previews", "Analytics"], monthlyPrice: "$49.99+/mo", color: "#C13A2A", gradient: "linear-gradient(135deg,#4285C7,#C13A2A)" },
  "all-yearly":  { name: "Multi-Platform", tagline: "All platforms — annual plan",   platforms: ["Facebook", "Instagram", "Google Search", "Google Display", "Snapchat", "TikTok", "LinkedIn", "X/Twitter", "YouTube Shorts"], aiTools: ["AI Caption Generation", "Reel Scripts", "Full Campaign Pack", "Content Studio", "Publishing Queue", "Ad Creative Pack", "Platform Previews", "Analytics"], monthlyPrice: "$49.99+/mo", color: "#C13A2A", gradient: "linear-gradient(135deg,#4285C7,#C13A2A)" },
  "custom": { name: "Custom Package", tagline: "Your selected services", platforms: ["Selected platforms"], aiTools: ["AI Caption Generation", "Content Studio", "Publishing Queue"], monthlyPrice: "Custom", color: "#7C3AED", gradient: "linear-gradient(135deg,#7C3AED,#4285C7)" },
};

const DEFAULT_PLAN: PlanDefinition = {
  name: "No Active Plan", tagline: "Subscribe to unlock all features",
  platforms: [], aiTools: [],
  monthlyPrice: "—", color: "#9CA3AF", gradient: "linear-gradient(135deg,#9CA3AF,#6B7280)",
};

const PLATFORM_KEY_MAP: Record<string, string> = {
  "Facebook": "facebook", "Instagram": "instagram", "Google Search": "google",
  "Google Display": "google", "Snapchat": "snapchat", "TikTok": "tiktok",
  "LinkedIn": "linkedin", "X/Twitter": "x", "YouTube Shorts": "youtube_shorts",
  "Selected platforms": "",
};

const CREDIT_SVG: Record<string, string> = {
  captions: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z",
  image:    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  reel:     "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
  video:    "M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  publish:  "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
};

export default function ServicesPage() {
  const { user } = useAuth();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [credits, setCredits] = useState<UsageCredits | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    apiFetch<AccountData>("/v1/dashboard/account").then(r => { if (r.ok) setAccount(r.data); });
    apiFetch<UsageCredits>("/v1/dashboard/usage").then(r => { if (r.ok) setCredits(r.data); });
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    const res = await apiFetch<{ url: string }>("/v1/stripe/portal", { method: "POST" });
    if (res.ok && res.data.url) window.location.href = res.data.url;
    else setPortalLoading(false);
  };

  const isActive = user?.subscriptionStatus === "active";
  const planKey = account?.subscriptionPlan || (isActive ? "all-monthly" : "");
  const plan = PLAN_MAP[planKey] || (isActive ? { ...DEFAULT_PLAN, name: "Active Subscription", tagline: "Your subscription is active" } : DEFAULT_PLAN);

  const CREDIT_ROWS = credits ? [
    { label: "AI Captions / month",    value: credits.captionsLimit,    used: credits.captionsUsed,    svgKey: "captions" },
    { label: "Image Posts / month",    value: credits.imagePostsLimit,  used: credits.imagePostsUsed,  svgKey: "image" },
    { label: "Reels & Scripts / month",value: credits.reelsLimit,       used: credits.reelsUsed,       svgKey: "reel" },
    { label: "Video Ads / month",      value: credits.videoAdsLimit,    used: credits.videoAdsUsed,    svgKey: "video" },
    { label: "Published Posts / month",value: credits.socialPostsLimit, used: credits.socialPostsUsed, svgKey: "publish" },
  ] : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#111827" }}>My Services</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Your purchased plan and active services</p>
        </div>
        <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full mt-1" style={{
          background: isActive ? "rgba(22,163,74,0.1)" : "rgba(193,58,42,0.08)",
          color: isActive ? "#16a34a" : "#C13A2A",
        }}>
          {isActive ? "● Active" : "● No Subscription"}
        </span>
      </div>

      {isActive ? (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-5 text-white" style={{ background: plan.gradient }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-1">Active Plan</p>
                <p className="text-2xl font-black">{plan.name}</p>
                <p className="text-sm opacity-80 mt-0.5">{plan.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">{plan.monthlyPrice}</p>
                <p className="text-xs opacity-75">billed monthly</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6">
            {plan.platforms.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Advertising Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {plan.platforms.map((p) => {
                    const platformKey = PLATFORM_KEY_MAP[p] || "";
                    return (
                      <div key={p} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "rgba(66,133,199,0.07)", border: "1px solid rgba(66,133,199,0.15)", color: "#1D4ED8" }}>
                        {platformKey && <PlatformIcon platform={platformKey} size={18} rounded="rounded-md" />}
                        {p}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {plan.aiTools.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>AI Tools & Features</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.aiTools.map((tool) => (
                    <div key={tool} className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                      <span className="text-green-500 font-bold">✓</span>
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {CREDIT_ROWS.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Monthly Limits</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CREDIT_ROWS.map(({ label, value, used, svgKey }) => {
                    const pct = Math.min(Math.round((used / Math.max(value, 1)) * 100), 100);
                    return (
                      <div key={label} className="p-3 rounded-xl" style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={CREDIT_SVG[svgKey]} />
                          </svg>
                          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{label}</span>
                        </div>
                        <p className="text-lg font-black" style={{ color: "#111827" }}>{value}<span className="text-xs font-normal text-gray-400"> / mo</span></p>
                        <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? "#C13A2A" : "#4285C7" }} />
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{used} used</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 flex-wrap pt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <button onClick={openPortal} disabled={portalLoading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
                {portalLoading ? "Opening…" : "Manage Subscription"}
              </button>
              <Link href="/subscribe" className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-gray-50 transition-all" style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#374151" }}>
                Upgrade / Change Plan
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "2px dashed rgba(0,0,0,0.12)" }}>
          <div className="p-8 text-center" style={{ background: "white" }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(193,58,42,0.08)" }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#C13A2A" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <p className="text-lg font-black mb-1" style={{ color: "#111827" }}>No Active Plan</p>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Subscribe to start publishing AI-generated content for your business across all social platforms.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
              {[
                { name: "Snapchat Ads", price: "$49.99/mo", platforms: "Snapchat", color: "#FFFC00" },
                { name: "Meta Ads", price: "$49.99/mo", platforms: "Facebook + Instagram", color: "#1877F2" },
                { name: "Google Ads", price: "$49.99/mo", platforms: "Google Search + Display", color: "#4285F4" },
                { name: "LinkedIn Ads", price: "$49.99/mo", platforms: "LinkedIn", color: "#0A66C2" },
              ].map(({ name, price, platforms, color }) => (
                <div key={name} className="p-3.5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <p className="text-sm font-bold" style={{ color: "#111827" }}>{name}</p>
                  </div>
                  <p className="text-xs ml-4.5" style={{ color: "#6B7280" }}>{platforms}</p>
                  <p className="text-base font-black mt-1" style={{ color: "#111827" }}>{price}</p>
                </div>
              ))}
            </div>

            <Link href="/subscribe" className="inline-flex px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)", boxShadow: "0 6px 20px rgba(193,58,42,0.28)" }}>
              View All Plans & Subscribe →
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)", color: "#1E40AF" }}>
        <strong>How your service works:</strong> WorldDigital.ai publishes content from our social accounts to promote your business. Every post sends traffic to your destination URL. You approve all content before it goes live.
      </div>

      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-sm font-black mb-1" style={{ color: "#111827" }}>Add-ons</p>
        <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Extend your plan with additional services</p>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#111827" }}>Auto SEO</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>AI-powered SEO optimization for your content</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: "#111827" }}>$199.99/mo</p>
            <Link href="/subscribe" className="text-xs font-semibold" style={{ color: "#4285C7" }}>Add →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
