"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PlatformIcon } from "@/components/PlatformIcon";

const plans = [
  {
    id: "single",
    name: "Single Channel",
    tagline: "Meta OR Google OR Snapchat",
    monthlyPrice: "",
    yearlyPrice: "",
    platforms: ["google", "meta", "snapchat"] as const,
    bullets: [
      "AI-powered content creation",
      "Smart ad design automation",
      "Campaign analytics",
      "Real-time optimization",
      "Dedicated support",
    ],
    cta: "Choose Channel",
    href: "/subscribe",
  },
  {
    id: "seo",
    name: "Auto SEO",
    tagline: "AI-driven search visibility add-on",
    monthlyPrice: "$199.99",
    yearlyPrice: "$2,160",
    yearlySuffix: "/year add-on",
    suffix: "/mo add-on",
    bullets: [
      "SEO content automation",
      "Keyword visibility tracking",
      "AI-search optimization",
      "Google / ChatGPT / Perplexity visibility",
    ],
    cta: "Add Auto SEO",
    href: "/subscribe",
    accent: "#059669",
    accentBg: "rgba(5,150,105,0.06)",
    accentBorder: "rgba(5,150,105,0.18)",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom platform mix and volume",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    bullets: [
      "Custom platform mix",
      "Higher volume campaigns",
      "Dedicated onboarding",
      "Business support",
    ],
    cta: "Contact Sales",
    href: "/help",
    isEnterprise: true,
  },
];

type AuthState = "loading" | "logged-out" | "logged-in" | "subscribed";

export function PremiumHomePlansSection() {
  const [yearly, setYearly] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      try {
        const token = localStorage.getItem("wdai_token");
        if (!token) { if (!cancelled) setAuthState("logged-out"); return; }
        const res = await fetch("/api/v1/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { if (!cancelled) setAuthState("logged-out"); return; }
        const data = await res.json() as { subscriptionStatus?: string };
        if (!cancelled) setAuthState(data.subscriptionStatus === "active" ? "subscribed" : "logged-in");
      } catch { if (!cancelled) setAuthState("logged-out"); }
    }
    void resolve();
    return () => { cancelled = true; };
  }, []);

  function seoHref(): string {
    if (authState === "subscribed") return "/dashboard";
    if (authState === "logged-in") return "/dashboard/tools/ai-seo";
    return "/subscribe?plan=auto-seo-monthly";
  }

  function seoCta(): string {
    if (authState === "subscribed") return "Open Dashboard →";
    if (authState === "logged-in") return "Try AI SEO →";
    return "Add Auto SEO";
  }

  return (
    <section className="py-24 lg:py-32 px-6" style={{ background: "white" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-sm font-semibold mb-3" style={{ color: "#1D7FE8" }}>Simple Pricing</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4" style={{ color: "#111827" }}>
            Simple plans for every growth stage.
          </h2>
          <p className="text-lg" style={{ color: "#4B5563" }}>
            Start with one channel or scale across every major ad platform with one AI-powered marketing system.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <button
            onClick={() => setYearly(false)}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: !yearly ? "#C93434" : "transparent",
              color: !yearly ? "white" : "#6B7280",
              border: !yearly ? "none" : "1.5px solid #E5EAF2",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: yearly ? "#C93434" : "transparent",
              color: yearly ? "white" : "#6B7280",
              border: yearly ? "none" : "1.5px solid #E5EAF2",
            }}
          >
            Yearly
            <span
              className="ml-2 text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "#DCFCE7", color: "#059669" }}
            >
              Save 10%
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {plans.map(({ id, name, tagline, monthlyPrice, yearlyPrice, suffix, yearlySuffix, platforms, bullets, cta, href, accent, accentBg, accentBorder, isEnterprise }) => {
            const displayPrice = yearly ? yearlyPrice : monthlyPrice;
            const displaySuffix = yearly ? (yearlySuffix || "/year") : (suffix || "/month");
            return (
              <div
                key={id}
                className="rounded-3xl p-6 flex flex-col relative transition-all hover:-translate-y-0.5"
                style={{
                  background: "white",
                  border: accentBorder
                    ? `1.5px solid ${accentBorder}`
                    : "1.5px solid #E5EAF2",
                  boxShadow: "0 2px 16px rgba(15,23,42,0.05)",
                }}
              >

                {platforms ? (
                  <div className="flex gap-1.5 mb-5">
                    {platforms.map((p) => (
                      <div key={p} className="rounded-xl overflow-hidden" style={{ border: "1.5px solid #E5EAF2" }}>
                        <PlatformIcon platform={p} size={28} rounded="rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : isEnterprise ? (
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "#F7FAFC", color: "#6B7280", border: "1.5px solid #E5EAF2" }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                ) : (
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: accentBg, color: accent }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}

                <h3 className="text-lg font-black mb-1" style={{ color: "#111827" }}>{name}</h3>
                <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>{tagline}</p>

                <div className="mb-5">
                  {(isEnterprise && displayPrice === "Custom") || !displayPrice ? (
                    <span className="text-3xl font-black" style={{ color: "#111827" }}>{displayPrice || "See plans"}</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black" style={{ color: "#111827" }}>{displayPrice}</span>
                      <span className="text-sm ml-1" style={{ color: "#9CA3AF" }}>{displaySuffix}</span>
                    </>
                  )}
                </div>

                <ul className="space-y-2 mb-7 flex-1">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm" style={{ color: "#374151" }}>
                      <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill={accentBg || "rgba(29,127,232,0.08)"} />
                        <path d="M5 8l2 2 4-4" stroke={accent || "#1D7FE8"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>

                <Link
                  href={id === "seo" ? seoHref() : href}
                  className="block text-center w-full py-3 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={
                    isEnterprise
                      ? { background: "#F7FAFC", color: "#374151", border: "1.5px solid #E5EAF2" }
                      : accent
                      ? { background: accentBg, color: accent, border: `1.5px solid ${accentBorder}` }
                      : { background: "linear-gradient(90deg,#1D7FE8,#C93434)", color: "white", boxShadow: "0 6px 20px rgba(29,127,232,0.25)" }
                  }
                >
                  {id === "seo" ? seoCta() : cta}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            All plans include no setup fees and no long-term contracts.{" "}
            <Link href="/subscribe" className="font-semibold hover:underline" style={{ color: "#1D7FE8" }}>
              View full plan details →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
