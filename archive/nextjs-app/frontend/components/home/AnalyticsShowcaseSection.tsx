import { DashboardShowcase } from "@/components/home/DashboardShowcase";

export function AnalyticsShowcaseSection() {
  return (
    <section
      className="py-20 lg:py-28 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #F7FAFC 0%, #EEF6FF 60%, #F7FAFC 100%)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left copy ──────────────────────────────────────────────────── */}
          <div className="max-w-lg">
            <p className="text-sm font-semibold mb-3" style={{ color: "#1D7FE8" }}>
              Real-Time Analytics
            </p>
            <h2
              className="font-black leading-tight mb-5"
              style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", color: "#111827" }}
            >
              Know exactly what your campaigns are doing.
            </h2>
            <p className="text-base lg:text-lg mb-8 leading-relaxed" style={{ color: "#4B5563" }}>
              Track performance, spend, clicks, conversions, and optimization status across every
              platform — all from one dashboard.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Live impression and click data across all platforms",
                "AI-powered budget reallocation based on performance",
                "Conversion tracking and ROAS reporting",
                "Weekly performance summaries delivered to your inbox",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#374151" }}>
                  <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" fill="#DBEAFE" />
                    <path
                      d="M6.5 10l2.5 2.5 4.5-5"
                      stroke="#1D7FE8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {/* Platform pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Snapchat", color: "#FFCA28", text: "#111827" },
                { label: "Meta",     color: "#0866FF", text: "#ffffff" },
                { label: "Google",   color: "#4285F4", text: "#ffffff" },
                { label: "Combined", color: "#1D7FE8", text: "#ffffff" },
              ].map(({ label, color, text }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: color, color: text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right — Dashboard Carousel ──────────────────────────────────── */}
          <div className="flex items-center justify-center lg:justify-end w-full">
            {/* Background glow */}
            <div className="relative w-full max-w-[560px]">
              <div
                className="absolute inset-0 -z-10 scale-110 opacity-15 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(191,219,254,0.6) 0%, rgba(254,202,202,0.4) 60%, transparent 80%)" }}
              />
              <DashboardShowcase />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
