import Link from "next/link";
import { PlatformIcon } from "@/components/PlatformIcon";

const channels: Array<{
  name: string;
  desc: string;
  platform: "facebook" | "instagram" | "snapchat" | "meta" | "google";
  glow: string;
  stat: string;
}> = [
  { name: "Facebook Ads", desc: "2.9B+ monthly users. Laser-precise interest and behavioral targeting.", platform: "facebook", glow: "#1877F2", stat: "2.9B+ users" },
  { name: "Instagram Ads", desc: "Visual-first storytelling. Reach 1.3B engaged users with stunning AI creatives.", platform: "instagram", glow: "#E4405F", stat: "1.3B+ users" },
  { name: "Snapchat Ads", desc: "375M daily users. Dominate Gen Z & millennial attention with immersive Story ads.", platform: "snapchat", glow: "#B8860B", stat: "375M daily" },
  { name: "Meta Ads", desc: "The full Meta ecosystem — Facebook, Instagram, Messenger, and Audience Network.", platform: "meta", glow: "#0668E1", stat: "Full ecosystem" },
];

export function PromotionsSection() {
  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{ background: "#050D1A" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "70px 70px" }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7" style={{ background: "rgba(66,133,199,0.1)", border: "1px solid rgba(66,133,199,0.2)" }}>
              <span className="text-xs font-semibold text-blue-300 tracking-widest uppercase">Platform Reach</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6">
              Your Brand,{" "}
              <span style={{ background: "linear-gradient(135deg, #60A5FA, #E4405F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Everywhere.
              </span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
              From Google Search to Snapchat Stories, we place your ads exactly where your customers live — and our AI optimizes every placement around the clock.
            </p>
            <div className="flex items-center gap-4 mb-10">
              <Link href="/subscribe" className="inline-flex items-center gap-2 py-4 px-8 rounded-full font-bold text-base text-white transition-all hover:scale-[1.02] shadow-2xl" style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)", boxShadow: "0 8px 32px rgba(66,133,199,0.25)" }}>
                Start Advertising
              </Link>
            </div>

            {/* Google special mention */}
            <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <PlatformIcon platform="google" size={40} rounded="rounded-xl" />
              <div>
                <p className="font-semibold text-white text-sm">Google Ads</p>
                <p className="text-gray-500 text-xs">8.5B+ searches/day — capture high-intent buyers at the moment of search</p>
              </div>
              <div className="ml-auto text-xs font-bold text-green-400">Live</div>
            </div>
          </div>

          {/* Platform grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {channels.map(({ name, desc, platform, glow, stat }) => (
              <div key={name} className="group relative rounded-2xl p-5 overflow-hidden hover:-translate-y-1 transition-transform duration-300" style={{ background: `${glow}06`, border: `1px solid ${glow}20` }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl" style={{ background: `radial-gradient(circle at 50% 0%, ${glow}20 0%, transparent 60%)` }} />
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${glow}, transparent)`, opacity: 0.4 }} />
                <div className="mb-4" style={{ filter: `drop-shadow(0 0 12px ${glow}60)` }}>
                  <PlatformIcon platform={platform} size={48} rounded="rounded-2xl" />
                </div>
                <p className="font-black text-white text-sm mb-1.5">{name}</p>
                <p className="text-gray-500 text-xs leading-relaxed mb-3">{desc}</p>
                <div className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${glow}15`, color: glow }}>
                  {stat}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
