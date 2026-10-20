import Link from "next/link";
import { PlatformIcon } from "@/components/PlatformIcon";

const features = [
  {
    title: "AI-Generated Creatives",
    desc: "5 unique ad descriptions + 5 professional images per campaign — generated in seconds by GPT-4 and DALL-E.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-4.5 4.5M5 14.5L9.5 19" />
      </svg>
    ),
    color: "#60A5FA",
  },
  {
    title: "Multi-Platform Campaigns",
    desc: "One workflow launches across Meta, Google, and Snapchat simultaneously — no separate accounts needed.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" />
      </svg>
    ),
    color: "#A78BFA",
  },
  {
    title: "Live Performance Dashboard",
    desc: "Track impressions, clicks, CTR, conversions, and ROAS across every platform — all in one view.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    color: "#34D399",
  },
  {
    title: "Zero Expertise Required",
    desc: "Built for business owners. If you can fill out a form, you can run pro-grade ad campaigns in minutes.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: "#F59E0B",
  },
];

const platformLogos: Array<{ platform: "facebook" | "instagram" | "snapchat" | "meta" | "google"; label: string }> = [
  { platform: "facebook", label: "Facebook Ads" },
  { platform: "instagram", label: "Instagram Ads" },
  { platform: "snapchat", label: "Snapchat Ads" },
  { platform: "meta", label: "Meta Ads" },
  { platform: "google", label: "Google Ads" },
];

export function ValueSection() {
  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{ background: "#080F1E" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4285C7 0%, transparent 65%)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-08" style={{ background: "radial-gradient(circle, #C13A2A 0%, transparent 65%)", transform: "translate(-30%,30%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7" style={{ background: "rgba(193,58,42,0.1)", border: "1px solid rgba(193,58,42,0.25)" }}>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#F87171" }}>Why WorldDigital.ai</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
              Agency Results.{" "}
              <span style={{ background: "linear-gradient(135deg, #60A5FA, #A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Fraction of the Cost.
              </span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
              Large brands spend millions on agencies and marketing teams. We&apos;ve put all that intelligence into an AI engine anyone can use in 10 minutes.
            </p>
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 py-4 px-8 rounded-full font-bold text-base text-white transition-all hover:scale-[1.02] shadow-2xl"
              style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)", boxShadow: "0 8px 32px rgba(66,133,199,0.3)" }}
            >
              View Plans
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ icon, title, desc, color }) => (
              <div key={title} className="group rounded-2xl p-6 relative overflow-hidden hover:-translate-y-0.5 transition-transform duration-200" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}15` }}>
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${color}50, transparent)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}12`, color }}>
                  {icon}
                </div>
                <h3 className="font-bold text-white mb-2 text-sm leading-tight">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Platform logos bar */}
        <div className="mt-20 pt-10 border-t border-white/5">
          <p className="text-center text-xs text-gray-600 font-medium tracking-widest uppercase mb-8">Runs natively on every major platform</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {platformLogos.map(({ platform, label }) => (
              <div key={label} className="flex items-center gap-2.5 opacity-50 hover:opacity-100 transition-opacity">
                <PlatformIcon platform={platform} size={32} rounded="rounded-xl" />
                <span className="text-sm text-gray-400 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
