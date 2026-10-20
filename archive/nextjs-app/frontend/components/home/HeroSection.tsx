import Link from "next/link";
import Image from "next/image";
import { PlatformIcon } from "@/components/PlatformIcon";
import { SmartCtaLink } from "@/components/home/SmartCtaLink";

const stats = [
  { value: "3×", label: "Average ROI" },
  { value: "500+", label: "Businesses" },
  { value: "24/7", label: "AI Optimization" },
];

export function HeroSection() {
  return (
    <section
      className="relative pt-16 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #050D1A 0%, #0A1628 50%, #0D1F3C 100%)",
        minHeight: "100svh",
      }}
    >
      {/* Animated mesh gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full opacity-25" style={{ background: "radial-gradient(circle, #4285C7 0%, transparent 65%)", transform: "translateY(-40%)" }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #C13A2A 0%, transparent 65%)", transform: "translateY(40%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-20">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Left column */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: "rgba(66,133,199,0.12)", border: "1px solid rgba(66,133,199,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-blue-300 tracking-widest uppercase">AI-Powered Digital Marketing</span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.0] mb-6 tracking-tight">
              Effortless{" "}
              <span className="block">Campaigns.</span>
              <span className="block" style={{ background: "linear-gradient(135deg, #4285C7 0%, #A855F7 50%, #C13A2A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Real Results.
              </span>
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
              Provide your business details once. Our AI crafts and launches tailored ad campaigns across Google, Meta, and Snapchat — automatically, 24/7.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <SmartCtaLink
                guestHref="/subscribe"
                authedHref="/dashboard"
                className="inline-flex items-center gap-2 py-4 px-8 rounded-full font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
                style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)", boxShadow: "0 8px 32px rgba(66,133,199,0.4)" }}
              >
                Start Your First Campaign
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </SmartCtaLink>
              <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors py-4 px-6 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}>
                See how it works
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-8 border-t border-white/10">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-black text-white mb-1">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Platform logos strip */}
            <div className="flex items-center gap-3 mt-8">
              <span className="text-xs text-gray-600 font-medium">Runs on</span>
              <div className="flex items-center gap-2">
                <PlatformIcon platform="facebook" size={32} rounded="rounded-xl" style={{ boxShadow: "0 0 16px rgba(24,119,242,0.4)" }} />
                <PlatformIcon platform="instagram" size={32} rounded="rounded-xl" style={{ boxShadow: "0 0 16px rgba(225,48,108,0.4)" }} />
                <PlatformIcon platform="snapchat" size={32} rounded="rounded-xl" style={{ boxShadow: "0 0 16px rgba(255,252,0,0.35)" }} />
                <PlatformIcon platform="meta" size={32} rounded="rounded-xl" style={{ boxShadow: "0 0 16px rgba(66,133,199,0.4)" }} />
                <PlatformIcon platform="google" size={32} rounded="rounded-xl" style={{ boxShadow: "0 0 16px rgba(234,67,53,0.3)" }} />
              </div>
            </div>
          </div>

          {/* Right — dark analytics dashboard */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 rounded-3xl opacity-20 -z-10" style={{ background: "linear-gradient(135deg, #4285C7, #8B5CF6, #C13A2A)" }} />
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,22,40,0.97)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-400 font-medium">WorldDigital.ai — Live Dashboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400 font-semibold">LIVE</span>
                </div>
              </div>

              {/* Platform tabs with real icons */}
              <div className="flex gap-1 px-5 pt-4 pb-2">
                {(["facebook", "instagram", "snapchat", "meta"] as const).map((p, i) => (
                  <div
                    key={p}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold cursor-pointer transition-all capitalize"
                    style={i === 0
                      ? { background: "rgba(66,133,199,0.2)", color: "#60A5FA", border: "1px solid rgba(66,133,199,0.3)" }
                      : { color: "#4B5563" }
                    }
                  >
                    <PlatformIcon platform={p} size={16} rounded="rounded-md" />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </div>
                ))}
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px mx-5 mb-4" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", overflow: "hidden" }}>
                {[
                  { label: "Impressions", value: "847K", change: "+24%", color: "#60A5FA" },
                  { label: "Clicks", value: "31.2K", change: "+18%", color: "#34D399" },
                  { label: "Conversions", value: "2,840", change: "+31%", color: "#A78BFA" },
                ].map(({ label, value, change, color }) => (
                  <div key={label} className="px-4 py-3" style={{ background: "rgba(15,23,42,0.8)" }}>
                    <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-xl font-black text-white">{value}</p>
                    <span className="text-[9px] font-bold" style={{ color }}>{change} vs last mo</span>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="px-5 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-300">Campaign Performance</p>
                  <div className="flex gap-3 text-[9px] text-gray-600">
                    <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-blue-500 inline-block" />Clicks</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-purple-500 inline-block" />Spend</span>
                  </div>
                </div>
                <div className="h-24">
                  <svg viewBox="0 0 400 96" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4285C7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4285C7" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0,1,2,3].map(i => <line key={i} x1="0" y1={24*i+2} x2="400" y2={24*i+2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />)}
                    <path d="M0,80 Q60,60 100,65 Q160,72 200,40 Q250,10 300,25 Q350,38 400,15 L400,96 L0,96 Z" fill="url(#g2)" />
                    <path d="M0,80 Q60,60 100,65 Q160,72 200,40 Q250,10 300,25 Q350,38 400,15" fill="none" stroke="#8B5CF6" strokeWidth="2" />
                    <path d="M0,86 Q50,70 100,75 Q150,80 200,55 Q260,28 310,42 Q360,52 400,28 L400,96 L0,96 Z" fill="url(#g1)" />
                    <path d="M0,86 Q50,70 100,75 Q150,80 200,55 Q260,28 310,42 Q360,52 400,28" fill="none" stroke="#4285C7" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Platform breakdown */}
              <div className="px-5 pb-5 pt-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { name: "Meta", platform: "meta" as const, pct: 42, color: "#1877F2" },
                  { name: "Google", platform: "google" as const, pct: 35, color: "#EA4335" },
                  { name: "Snapchat", platform: "snapchat" as const, pct: 23, color: "#FFFC00" },
                ]).map(({ name, platform, pct, color }) => (
                  <div key={name} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <PlatformIcon platform={platform} size={20} rounded="rounded-lg" />
                      <p className="text-[9px] text-gray-500">{name}</p>
                    </div>
                    <div className="h-1 rounded-full bg-gray-800 mb-1">
                      <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <p className="text-xs font-black text-white">{pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
