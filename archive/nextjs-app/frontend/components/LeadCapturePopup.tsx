"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "wdai_lead_popup";
const SEEN_KEY    = "wdai_lead_seen";

const SERVICES = [
  "Google Ads", "Meta Ads", "Snapchat Ads", "TikTok Ads", "LinkedIn Ads",
  "AI SEO", "AI Content Generation", "YouTube Shorts", "AI Marketing Automation",
];

const TRIGGERS: Array<{ id: string; condition: (ctx: PopupCtx) => boolean }> = [
  { id: "exit_intent",  condition: (c) => c.exitIntent },
  { id: "pricing_time", condition: (c) => c.onPricing && c.seconds >= 30 },
  { id: "service_time", condition: (c) => c.onService && c.seconds >= 45 },
  { id: "returning",    condition: (c) => c.returning && c.seconds >= 10 },
];

interface PopupCtx {
  exitIntent: boolean;
  onPricing: boolean;
  onService: boolean;
  returning: boolean;
  seconds: number;
}

// Admin pages and dashboard — never show popup
const EXCLUDED_PREFIXES = ["/admin", "/dashboard", "/signin", "/signup", "/login", "/api"];

function isExcluded(path: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => path.startsWith(p));
}

export function LeadCapturePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", service: "", consent: false });
  const [triggerId, setTriggerId] = useState("");
  const ctxRef = useRef<PopupCtx>({ exitIntent: false, onPricing: false, onService: false, returning: false, seconds: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (isExcluded(pathname)) return;
    // Already seen in this session or ever submitted
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem(SEEN_KEY)) return;
      if (localStorage.getItem(STORAGE_KEY + "_submitted")) return;
    }

    const ctx = ctxRef.current;
    ctx.onPricing  = pathname.startsWith("/subscribe") || pathname.startsWith("/packages");
    ctx.onService  = /\/(google|meta|snapchat|tiktok|linkedin|instagram|youtube|ai-seo|ai-marketing)/.test(pathname);
    ctx.returning  = !!localStorage.getItem("wdai_visited");
    localStorage.setItem("wdai_visited", "1");

    // Time counter
    timerRef.current = setInterval(() => {
      ctx.seconds++;
      checkTriggers();
    }, 1000);

    // Exit intent
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) { ctx.exitIntent = true; checkTriggers(); }
    };
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function checkTriggers() {
    if (openedRef.current) return;
    if (isExcluded(pathname)) return;
    const ctx = ctxRef.current;
    const fired = TRIGGERS.find((t) => t.condition(ctx));
    if (fired) {
      openedRef.current = true;
      setTriggerId(fired.id);
      setOpen(true);
      if (timerRef.current) clearInterval(timerRef.current);
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* */ }
    }
  }

  const close = () => setOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.consent) return;
    setLoading(true);
    setError(null);
    try {
      const behavior = {
        pricingViewed: ctxRef.current.onPricing,
        formsSubmitted: 1,
        sessionCount: 1,
        pagesViewed: [pathname],
      };
      const res = await fetch("/api/v1/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          interestedService: form.service,
          source: "popup",
          sourcePage: pathname,
          referrer: typeof document !== "undefined" ? document.referrer : "",
          behavior,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }
      setSubmitted(true);
      try { localStorage.setItem(STORAGE_KEY + "_submitted", "1"); } catch { /* */ }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const headline = triggerId === "exit_intent"
    ? "Before you go — get a free AI marketing strategy"
    : triggerId === "pricing_time"
    ? "Need help choosing the right plan?"
    : triggerId === "returning"
    ? "Welcome back! Ready to grow your business?"
    : "Get a personalized AI marketing growth plan";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
          <button onClick={close} className="float-right text-slate-400 hover:text-white transition-colors text-lg leading-none">✕</button>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60A5FA" }}>Free for you</div>
          <h3 className="text-lg font-black text-white leading-tight">{headline}</h3>
          <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
            Tell us about your business and we'll send you a tailored strategy.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎉</div>
              <h4 className="font-black text-lg mb-2" style={{ color: "#0F172A" }}>You're in!</h4>
              <p className="text-sm" style={{ color: "#64748B" }}>
                We'll send your personalized AI marketing strategy within 24 hours. Check your inbox!
              </p>
              <button
                onClick={close}
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "#C13A2A" }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}
                />
              </div>
              <div>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Work email *"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}
                />
              </div>
              <div>
                <select
                  value={form.service}
                  onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white", color: form.service ? "#111" : "#9CA3AF" }}
                >
                  <option value="">Interested in... (optional)</option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                  className="mt-0.5 rounded accent-red-600 shrink-0"
                />
                <span className="text-[11px] leading-relaxed" style={{ color: "#64748B" }}>
                  I agree to receive marketing emails and communications from WorldDigital.ai.
                  You can unsubscribe at any time.
                </span>
              </label>

              {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

              <button
                type="submit"
                disabled={loading || !form.email || !form.consent}
                className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
              >
                {loading ? "Sending…" : "Get My Free Strategy →"}
              </button>

              <p className="text-center text-[10px]" style={{ color: "#9CA3AF" }}>
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
