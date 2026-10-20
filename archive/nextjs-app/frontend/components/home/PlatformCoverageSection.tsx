import Link from "next/link";
import { PlatformIcon } from "@/components/PlatformIcon";

const platforms = [
  {
    platform: "google" as const,
    name: "Google Ads",
    tagline: "Reach high-intent buyers",
    desc: "Search, Display, and Performance Max campaigns that reach customers the moment they're ready to buy.",
    bullets: ["Search, Display & Performance Max", "AI keyword targeting & bidding", "Real-time conversion tracking"],
    price: "",
    color: "#1D7FE8",
    bg: "#EEF6FF",
    border: "#BFDBFE",
  },
  {
    platform: "meta" as const,
    name: "Meta Ads",
    tagline: "Social reach and retargeting",
    desc: "Facebook + Instagram campaigns that build brand awareness, drive traffic, and retarget your best prospects.",
    bullets: ["Facebook + Instagram placement", "Retargeting & lookalike audiences", "AI-generated creative variations"],
    price: "",
    color: "#0866FF",
    bg: "#EEF6FF",
    border: "#BFDBFE",
  },
  {
    platform: "snapchat" as const,
    name: "Snapchat Ads",
    tagline: "Gen Z and visual-first campaigns",
    desc: "Stories and Snap Ads designed for younger audiences who respond to bold, fast-moving creative content.",
    bullets: ["Stories + Snap Ad formats", "Gen Z & millennial targeting", "Vertical video-optimized content"],
    price: "",
    color: "#FFAA00",
    bg: "#FFFBEB",
    border: "#FEF08A",
  },
];

export function PlatformCoverageSection() {
  return (
    <section className="py-24 lg:py-32 px-6" style={{ background: "#F7FAFC" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold mb-3" style={{ color: "#1D7FE8" }}>Platform Coverage</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4" style={{ color: "#111827" }}>
            One platform. Every major ad channel.
          </h2>
          <p className="text-lg" style={{ color: "#4B5563" }}>
            Build campaigns for high-intent search, social discovery, and visual-first audiences from one simple workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {platforms.map(({ platform, name, tagline, desc, bullets, price, color, bg, border }) => (
            <div
              key={name}
              className="rounded-3xl p-7 flex flex-col transition-all hover:-translate-y-0.5"
              style={{
                background: "white",
                border: "1.5px solid #E5EAF2",
                boxShadow: "0 2px 16px rgba(15,23,42,0.05)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <PlatformIcon platform={platform} size={32} rounded="rounded-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{name}</h3>
                    <p className="text-sm" style={{ color: "#6B7280" }}>{tagline}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm mb-5 leading-relaxed" style={{ color: "#4B5563" }}>{desc}</p>

              <ul className="space-y-2.5 mb-6 flex-1">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm" style={{ color: "#374151" }}>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill={bg} />
                      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-5 border-t" style={{ borderColor: "#E5EAF2" }}>
                <div>
                  {price ? (
                    <>
                      <span className="text-3xl font-black" style={{ color: "#111827" }}>{price}</span>
                      <span className="text-sm ml-1" style={{ color: "#9CA3AF" }}>/month</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>Monthly plan</span>
                  )}
                </div>
                <Link
                  href="/subscribe"
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg,#EEF6FF,#F0F9FF)",
                    color,
                    border: `1px solid ${border}`,
                  }}
                >
                  Choose Plan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
