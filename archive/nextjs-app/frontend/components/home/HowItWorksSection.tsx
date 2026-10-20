import Link from "next/link";

type HowItWorksSectionProps = {
  id?: string;
};

const steps = [
  {
    num: "01",
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" aria-hidden="true">
        <rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="2" />
        <path d="M16 20h16M16 28h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="36" cy="36" r="6" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        <path d="M34 36l1.5 1.5L38 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Enter Business Info",
    description: "Name, category, website URL, location, logo. Done in under 2 minutes.",
    color: "#4285C7",
    glow: "rgba(66,133,199,0.4)",
  },
  {
    num: "02",
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2" />
        <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="10" r="2.5" fill="currentColor" />
        <circle cx="38" cy="24" r="2.5" fill="currentColor" />
        <circle cx="24" cy="38" r="2.5" fill="currentColor" />
        <circle cx="10" cy="24" r="2.5" fill="currentColor" />
      </svg>
    ),
    title: "AI Generates Ads",
    description: "GPT-4 writes 5 unique ad descriptions. DALL-E creates 5 professional images — instantly.",
    color: "#8B5CF6",
    glow: "rgba(139,92,246,0.4)",
  },
  {
    num: "03",
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" aria-hidden="true">
        <path d="M8 32l10-12 8 8 6-8 8 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="34" cy="16" r="6" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" />
        <path d="M32 16l1.5 1.5L37 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Pick Your Favorites",
    description: "Review the AI output. Select the ad description and visual that best represents your brand.",
    color: "#10B981",
    glow: "rgba(16,185,129,0.4)",
  },
  {
    num: "04",
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" aria-hidden="true">
        <rect x="6" y="14" width="16" height="12" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="26" y="14" width="16" height="12" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="16" y="32" width="16" height="10" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M14 20h-4M38 20h4M24 32v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Choose Platforms",
    description: "Pick Meta, Google, Snapchat — or all three. Photo, video reel, or both. You decide.",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.4)",
  },
  {
    num: "05",
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" aria-hidden="true">
        <path d="M8 32l8-10 6 6 8-12 10 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36 16l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="40" cy="12" r="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Launch & Track",
    description: "Campaigns go live within 24hrs. Monitor impressions, clicks, CTR, and spend in real time.",
    color: "#C13A2A",
    glow: "rgba(193,58,42,0.4)",
  },
];

export function HowItWorksSection({ id = "how-it-works" }: HowItWorksSectionProps) {
  return (
    <section id={id} className="py-28 px-6 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #060E1C 0%, #0A1628 60%, #0D1F3C 100%)" }}>
      {/* Decorative grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(66,133,199,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <span className="text-xs font-semibold text-purple-300 tracking-widest uppercase">The Process</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4">
            From Zero to{" "}
            <span style={{ background: "linear-gradient(135deg, #60A5FA, #A855F7, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Live Campaigns
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Five steps. No marketing degree required. Your AI engine handles the rest — permanently.
          </p>
        </div>

        {/* Steps bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-16 items-stretch">
          {steps.map(({ num, icon, title, description, color, glow }, i) => (
            <div
              key={num}
              className="group relative rounded-3xl p-6 flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-300 cursor-default"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${color}20`,
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${glow} 0%, transparent 65%)` }}
              />

              {/* Top line accent */}
              <div className="absolute top-0 inset-x-0 h-px rounded-full" style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)`, opacity: 0.6 }} />

              {/* Giant number — watermark */}
              <div
                className="absolute -bottom-4 -right-4 text-8xl font-black select-none leading-none pointer-events-none"
                style={{ color: `${color}08`, fontSize: "110px" }}
                aria-hidden="true"
              >
                {num}
              </div>

              {/* Step number badge */}
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                  {num.replace("0", "")}
                </div>
                {i < steps.length - 1 && (
                  <svg className="w-4 h-4 hidden lg:block" style={{ color: `${color}40` }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>

              {/* Icon */}
              <div className="mb-5 relative z-10" style={{ color }}>
                {icon}
              </div>

              {/* Content */}
              <h3 className="font-black text-white text-base mb-2 relative z-10 leading-tight">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed flex-1 relative z-10">{description}</p>

              {/* Bottom bar */}
              <div className="mt-5 h-0.5 rounded-full relative z-10" style={{ background: `linear-gradient(to right, ${color}40, transparent)` }} />
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 py-4 px-10 rounded-full font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
            style={{ background: "linear-gradient(135deg, #4285C7, #8B5CF6, #C13A2A)", boxShadow: "0 8px 40px rgba(139,92,246,0.3)" }}
          >
            Launch Your First Campaign
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            No contract. Cancel anytime.
          </div>
        </div>
      </div>
    </section>
  );
}
