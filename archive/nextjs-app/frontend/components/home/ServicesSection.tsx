import { PlatformIcon } from "@/components/PlatformIcon";
import { SmartCtaLink } from "@/components/home/SmartCtaLink";

const platforms = [
  {
    name: "Meta Ads",
    subtitle: "Facebook & Instagram",
    icons: ["meta", "facebook", "instagram"] as const,
    glow: "rgba(24,119,242,0.5)",
    accent: "#1877F2",
    features: ["AI Ad Copy & Creatives", "Lookalike Audiences", "Retargeting", "A/B Testing"],
    stat: "2.9B+",
    statLabel: "monthly active users",
    price: "",
    href: "/subscribe",
    gradient: "linear-gradient(135deg, #0A1628, #0D2545)",
  },
  {
    name: "Snapchat Ads",
    subtitle: "Story & Snap Ads",
    icons: ["snapchat"] as const,
    glow: "rgba(255,252,0,0.45)",
    accent: "#FFFC00",
    features: ["Story & Snap Formats", "Gen Z Targeting", "Swipe-Up CTAs", "Video Concepts"],
    stat: "375M+",
    statLabel: "daily active users",
    price: "",
    href: "/subscribe",
    gradient: "linear-gradient(135deg, #1A1500, #2A2000)",
    featured: true,
  },
  {
    name: "Google Ads",
    subtitle: "Search & Display",
    icons: ["google"] as const,
    glow: "rgba(234,67,53,0.45)",
    accent: "#EA4335",
    features: ["Search & Display", "Smart Bid Optimization", "Keyword Strategy", "Performance Max"],
    stat: "8.5B+",
    statLabel: "searches per day",
    price: "",
    href: "/subscribe",
    gradient: "linear-gradient(135deg, #1A0A08, #2A1210)",
  },
];

export function ServicesSection() {
  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{ background: "#050D1A" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ background: "rgba(66,133,199,0.1)", border: "1px solid rgba(66,133,199,0.2)" }}>
            <span className="text-xs font-semibold text-blue-300 tracking-widest uppercase">Our Platforms</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4">
            One Platform.{" "}
            <span style={{ background: "linear-gradient(135deg, #4285C7, #A855F7, #C13A2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Every Channel.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Launch AI-crafted campaigns across all major platforms from a single dashboard. No agencies. No complexity.
          </p>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {platforms.map(({ name, subtitle, icons, glow, accent, features, stat, statLabel, price, href, gradient, featured }) => (
            <div key={name} className="group relative rounded-3xl overflow-hidden flex flex-col" style={{ background: gradient, border: `1px solid ${accent}22` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" style={{ background: `radial-gradient(circle at 50% 0%, ${glow} 0%, transparent 60%)` }} />
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)`, opacity: 0.6 }} />

              {featured && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="text-[10px] font-black px-3 py-1 rounded-full" style={{ background: accent, color: "#000" }}>TRENDING</span>
                </div>
              )}

              <div className="p-7 flex flex-col flex-1 relative z-10">
                {/* Platform icons */}
                <div className="flex items-center gap-2.5 mb-6">
                  {icons.map((p, i) => (
                    <PlatformIcon
                      key={p}
                      platform={p}
                      size={i === 0 ? 56 : 36}
                      rounded={i === 0 ? "rounded-2xl" : "rounded-xl"}
                      style={{ boxShadow: `0 0 ${i === 0 ? "30px" : "16px"} ${glow}` }}
                    />
                  ))}
                </div>

                <h3 className="text-2xl font-black text-white mb-1">{name}</h3>
                <p className="text-sm mb-6" style={{ color: `${accent}99` }}>{subtitle}</p>

                <div className="mb-6 rounded-2xl p-4" style={{ background: `${accent}08`, border: `1px solid ${accent}15` }}>
                  <p className="text-3xl font-black text-white">{stat}</p>
                  <p className="text-xs" style={{ color: `${accent}80` }}>{statLabel}</p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-5" style={{ borderTop: `1px solid ${accent}15` }}>
                  <span className="text-2xl font-black text-white">{price || "Monthly plan"}</span>
                  <SmartCtaLink
                    guestHref={href}
                    authedHref="/dashboard"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.03]"
                    style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
                  >
                    Start Now
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </SmartCtaLink>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
