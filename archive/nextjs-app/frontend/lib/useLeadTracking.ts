"use client";

/**
 * Behavioral lead tracking hook.
 * Call once in a page/layout to auto-track pricing views, CTA clicks,
 * time-on-page, and send events to /v1/leads/behavior.
 *
 * Usage:
 *   useLeadTracking()                          // anonymous
 *   useLeadTracking({ email: user.email })     // identified user
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface TrackOptions {
  email?: string | null;
}

const PRICING_PATTERNS = ["/subscribe", "/packages", "/pricing"];
const SERVICE_PATTERNS  = ["/google-ads", "/meta-ads", "/snapchat", "/tiktok", "/linkedin", "/ai-seo", "/ai-marketing", "/youtube"];

async function sendEvent(event: string, email: string | null | undefined, page: string, meta?: Record<string, unknown>) {
  try {
    await fetch("/api/v1/leads/behavior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, email: email || undefined, page, meta }),
    });
  } catch { /* non-critical */ }
}

export function useLeadTracking({ email }: TrackOptions = {}) {
  const pathname = usePathname();
  const trackedPages = useRef<Set<string>>(new Set());
  const sentCheckout  = useRef(false);
  const sentPricing   = useRef(false);

  // Track page view and pricing
  useEffect(() => {
    if (!pathname) return;
    if (trackedPages.current.has(pathname)) return;
    trackedPages.current.add(pathname);

    // Always track page view
    sendEvent("page_view", email, pathname);

    // Pricing page
    const isPricing = PRICING_PATTERNS.some((p) => pathname.startsWith(p));
    if (isPricing && !sentPricing.current) {
      sentPricing.current = true;
      sendEvent("pricing_view", email, pathname);
    }
  }, [pathname, email]);

  // Track checkout events via URL
  useEffect(() => {
    if (!pathname) return;
    if (pathname.includes("/checkout") && !sentCheckout.current) {
      sentCheckout.current = true;
      sendEvent("checkout_start", email, pathname);
    }
  }, [pathname, email]);

  // Track checkout abandonment via beforeunload when on checkout page
  useEffect(() => {
    if (!pathname?.includes("/checkout")) return;
    const handler = () => { sendEvent("checkout_abandoned", email, pathname); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pathname, email]);

  // Track CTA button clicks via event delegation
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      if (!target) return;
      const trackVal = target.dataset.track;
      if (trackVal) sendEvent(trackVal, email, pathname, { label: target.innerText?.slice(0, 80) });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [email, pathname]);
}

/**
 * Convenience function to capture a lead programmatically (e.g. from AI chat).
 */
export async function captureLead(opts: {
  email: string;
  name?: string;
  source?: string;
  sourcePage?: string;
  interestedService?: string;
  demoRequested?: boolean;
  behavior?: {
    pricingViewed?: boolean;
    checkoutStarted?: boolean;
    aiAssistantUsed?: boolean;
    sessionCount?: number;
    formsSubmitted?: number;
  };
}) {
  try {
    const res = await fetch("/api/v1/leads/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...opts,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }),
    });
    return await res.json() as { ok: boolean; id?: string; score?: number };
  } catch { return { ok: false }; }
}
