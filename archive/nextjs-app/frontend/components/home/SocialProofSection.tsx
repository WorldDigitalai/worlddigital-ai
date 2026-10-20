import { PlatformIcon } from "@/components/PlatformIcon";

const testimonials = [
  {
    name: "Marcus R.",
    title: "Owner, Ramos Fitness",
    quote: "We went from zero online presence to 340% ROI on our first Meta campaign. Set it up in 20 minutes. Absolute game-changer.",
    rating: 5,
    avatar: "M",
    color: "#4285C7",
  },
  {
    name: "Sarah K.",
    title: "Founder, Bloom Skincare",
    quote: "Our Instagram ads now look like they were made by a creative agency. The AI generates better copy than anything I could write myself.",
    rating: 5,
    avatar: "S",
    color: "#E4405F",
  },
  {
    name: "Jason T.",
    title: "GM, Peak Auto Detailing",
    quote: "Google Ads was always intimidating. WorldDigital.ai handles everything — keywords, bidding, creatives. Revenue up 60% in 3 months.",
    rating: 5,
    avatar: "J",
    color: "#34D399",
  },
  {
    name: "Priya M.",
    title: "Director, Luxe Events",
    quote: "We're on Snapchat, Facebook, and Google simultaneously for less than what one platform used to cost us with an agency. Incredible value.",
    rating: 5,
    avatar: "P",
    color: "#A78BFA",
  },
];

const metrics = [
  { value: "500+", label: "Active Businesses" },
  { value: "3×", label: "Average ROI" },
  { value: "$12M+", label: "Ad Spend Managed" },
  { value: "94%", label: "Retention Rate" },
];

export function SocialProofSection() {
  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{ background: "#080F1E" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{ background: "radial-gradient(circle, rgba(66,133,199,0.05) 0%, transparent 60%)" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <span className="text-xs font-semibold text-green-400 tracking-widest uppercase">500+ Businesses Trust Us</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4">
            Real Businesses.{" "}
            <span style={{ background: "linear-gradient(135deg, #34D399, #4285C7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Real Results.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Business owners across every industry are growing faster with AI-powered campaigns.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {metrics.map(({ value, label }) => (
            <div key={label} className="text-center rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-4xl font-black text-white mb-1">{value}</p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {testimonials.map(({ name, title, quote, rating, avatar, color }) => (
            <div key={name} className="rounded-2xl p-6 relative overflow-hidden flex flex-col" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}15` }}>
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${color}50, transparent)` }} />
              <div className="flex mb-3 gap-0.5">
                {Array.from({ length: rating }).map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-5">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white" style={{ background: color }}>
                  {avatar}
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{name}</p>
                  <p className="text-gray-600 text-[10px]">{title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Platform strip */}
        <div className="text-center pt-10 border-t border-white/5">
          <p className="text-xs text-gray-600 font-medium tracking-widest uppercase mb-6">Powering campaigns across</p>
          <div className="flex items-center justify-center gap-5 flex-wrap">
            {(["facebook", "instagram", "snapchat", "meta", "google"] as const).map((p) => (
              <PlatformIcon
                key={p}
                platform={p}
                size={40}
                rounded="rounded-xl"
                className="opacity-60 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
