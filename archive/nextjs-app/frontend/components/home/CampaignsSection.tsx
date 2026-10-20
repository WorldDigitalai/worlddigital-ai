import Link from "next/link";
import { PlatformIcon } from "@/components/PlatformIcon";

function DashboardPreview() {
  return (
    <div
      className="rounded-2xl overflow-hidden mx-auto w-full max-w-2xl"
      style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 40px rgba(66,133,199,0.12)" }}
    >
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#F9FAFB" }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-gray-400 font-medium">Campaign Dashboard — Live</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-500 font-bold">LIVE</span>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: "Impressions", value: "847K", change: "+24%", color: "#4285C7" },
            { label: "Clicks", value: "31.2K", change: "+18%", color: "#10B981" },
            { label: "Conversions", value: "2,840", change: "+31%", color: "#C13A2A" },
          ].map(({ label, value, change, color }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#F8F9FB" }}>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-black text-gray-900">{value}</p>
              <span className="text-[9px] font-bold" style={{ color }}>{change}</span>
            </div>
          ))}
        </div>
        <div className="h-28 mb-4">
          <svg viewBox="0 0 400 112" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="dashG1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4285C7" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4285C7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="dashG2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C13A2A" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#C13A2A" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map(i => (
              <line key={i} x1="0" y1={28 * i + 5} x2="400" y2={28 * i + 5} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
            ))}
            <path d="M0,90 Q60,75 100,80 Q160,85 200,55 Q250,25 300,38 Q350,48 400,22 L400,112 L0,112 Z" fill="url(#dashG1)" />
            <path d="M0,90 Q60,75 100,80 Q160,85 200,55 Q250,25 300,38 Q350,48 400,22" fill="none" stroke="#4285C7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M0,95 Q50,82 100,88 Q150,94 200,68 Q260,40 310,55 Q360,64 400,42 L400,112 L0,112 Z" fill="url(#dashG2)" />
            <path d="M0,95 Q50,82 100,88 Q150,94 200,68 Q260,40 310,55 Q360,64 400,42" fill="none" stroke="#C13A2A" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3" />
          </svg>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { name: "Meta", platform: "meta" as const, pct: 42, color: "#1877F2" },
            { name: "Google", platform: "google" as const, pct: 35, color: "#EA4335" },
            { name: "Snapchat", platform: "snapchat" as const, pct: 23, color: "#F59E0B" },
          ]).map(({ name, platform, pct, color }) => (
            <div key={name} className="rounded-xl p-3" style={{ background: "#F8F9FB", border: "1px solid rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <PlatformIcon platform={platform} size={18} rounded="rounded-md" />
                <p className="text-[9px] text-gray-500 font-medium">{name}</p>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 mb-1">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
              <p className="text-xs font-black text-gray-700">{pct}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CampaignsSection() {
  return (
    <section className="py-20 px-6 overflow-hidden" style={{ background: "white" }}>
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm font-semibold mb-4" style={{ color: "#C13A2A" }}>
          Transform Your Business with AI-Driven Marketing
        </p>
        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-8 max-w-3xl mx-auto">
          Effortless Campaigns, Stunning Content, and Real Results All In One Platform
        </h2>

        <div className="relative inline-flex items-center justify-center gap-4 flex-wrap mb-6">
          {(["snapchat", "facebook", "instagram", "google", "meta"] as const).map((p, i) => (
            <div
              key={p}
              className="relative"
              style={{
                transform: [
                  "translateY(-18px)",
                  "translateX(-10px)",
                  "translateY(12px)",
                  "translateX(10px) translateY(-8px)",
                  "translateY(16px)",
                ][i],
              }}
            >
              <PlatformIcon
                platform={p}
                size={52}
                rounded="rounded-2xl"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <span
            className="text-sm font-black px-4 py-1.5 rounded-full"
            style={{ background: "white", border: "1.5px solid rgba(66,133,199,0.2)", color: "#4285C7", boxShadow: "0 2px 8px rgba(66,133,199,0.1)" }}
          >
            Simple
          </span>
          <span className="text-xs text-gray-400">monthly pricing per platform</span>
        </div>

        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 py-4 px-10 rounded-full font-bold text-base text-white transition-all hover:opacity-90 shadow-lg mb-16"
          style={{ background: "#C13A2A", boxShadow: "0 6px 24px rgba(193,58,42,0.3)" }}
        >
          Subscribe Now
        </Link>

        <DashboardPreview />
      </div>
    </section>
  );
}
