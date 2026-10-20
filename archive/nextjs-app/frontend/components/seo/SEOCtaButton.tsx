"use client";

import { useEffect, useState } from "react";

interface SEOCtaButtonProps {
  label: string;
  price: string;
  planId: string;
  dashboardPath?: string;
}

type CtaState = "loading" | "logged-out" | "subscribed" | "logged-in";

/**
 * Smart CTA button for SEO landing pages.
 *
 * Routing logic:
 *   - Not logged in               → /subscribe?plan=<planId>   (drive sign-up)
 *   - Logged in, no active sub    → <dashboardPath>            (try the tool, upsell in-context)
 *   - Logged in + active sub      → <dashboardPath>            (go straight to tool)
 */
export function SEOCtaButton({ label, price, planId, dashboardPath = "/dashboard" }: SEOCtaButtonProps) {
  const [ctaState, setCtaState] = useState<CtaState>("loading");

  useEffect(() => {
    let cancelled = false;
    async function resolveState() {
      try {
        const token = localStorage.getItem("wdai_token");
        if (!token) {
          if (!cancelled) setCtaState("logged-out");
          return;
        }

        const res = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // 401 = expired/invalid token → treat as logged out
          if (!cancelled) setCtaState(res.status === 401 ? "logged-out" : "logged-in");
          return;
        }

        const data = await res.json() as { subscriptionStatus?: string };
        if (cancelled) return;
        setCtaState(data.subscriptionStatus === "active" ? "subscribed" : "logged-in");
      } catch {
        if (!cancelled) setCtaState("logged-out");
      }
    }
    void resolveState();
    return () => { cancelled = true; };
  }, []);

  // Route based on auth + subscription state:
  //   logged-out  → /subscribe (drive sign-up)
  //   logged-in   → dashboardPath (e.g. /dashboard/tools/ai-seo — let them try the tool)
  //   subscribed  → /dashboard (they already own it, take them to their hub)
  const href =
    ctaState === "logged-out"
      ? `/subscribe?plan=${planId}`
      : ctaState === "subscribed"
      ? "/dashboard"
      : dashboardPath;

  const buttonLabel =
    ctaState === "subscribed"
      ? "Open Dashboard →"
      : ctaState === "logged-in"
      ? "Try in Dashboard →"
      : price ? `${label} — ${price}` : label;

  if (ctaState === "loading") {
    return (
      <span
        className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white opacity-70 cursor-default"
        style={{ background: "#C13A2A", boxShadow: "0 8px 24px rgba(193,58,42,0.28)" }}
      >
        {price ? `${label} — ${price}` : label}
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </span>
    );
  }

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:opacity-90"
      style={{ background: "#C13A2A", boxShadow: "0 8px 24px rgba(193,58,42,0.28)" }}
    >
      {buttonLabel}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </a>
  );
}
