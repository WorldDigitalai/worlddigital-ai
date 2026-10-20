"use client";

import Link from "next/link";

interface BusinessProfile {
  businessName: string;
  destinationUrl: string;
  category: string;
}

interface User {
  name: string;
  subscriptionStatus: string;
}

export default function OnboardingChecklist({ user, profile }: { user: User | null; profile: BusinessProfile | null }) {
  if (!user) return null;
  const steps = [
    { label: "Create account", done: true, href: "" },
    { label: "Complete business profile", done: !!profile, href: "/dashboard/business" },
    { label: "Choose subscription plan", done: user.subscriptionStatus === "active", href: "/subscribe" },
    { label: "Connect social platforms", done: false, href: "/dashboard/platforms" },
    { label: "Generate your first AI content", done: false, href: "/dashboard/content-studio" },
  ];
  const completed = steps.filter(s => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);
  if (progress === 100) return null;
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-black" style={{ color: "#111827" }}>Getting Started</p>
          <p className="text-xs" style={{ color: "#6B7280" }}>{completed} of {steps.length} steps completed</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>{progress}%</span>
      </div>
      <div className="h-1.5 rounded-full mb-4" style={{ background: "#F1F5F9" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: progress + "%", background: "linear-gradient(to right,#4285C7,#C13A2A)" }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map(s => (
          <Link key={s.label} href={s.href} className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium transition-all hover:bg-gray-50" style={{ color: s.done ? "#16A34A" : "#374151" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: s.done ? "rgba(22,163,74,0.15)" : "#F1F5F9" }}>
              {s.done ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <div className="w-2 h-2 rounded-full" style={{ background: "#CBD5E1" }} />
              )}
            </div>
            <span className={s.done ? "line-through" : ""}>{s.label}</span>
            {!s.done && <span className="ml-auto text-[10px] font-semibold" style={{ color: "#4285C7" }}>Do this -&gt;</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
