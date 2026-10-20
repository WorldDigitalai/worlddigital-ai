import { SmartCtaLink } from "@/components/home/SmartCtaLink";

export function FinalCtaSection() {
  return (
    <section
      className="py-24 lg:py-32 px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #EEF6FF 0%, #F7FAFC 50%, #EEF6FF 100%)" }}
    >
      {/* Soft accent orbs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #1D7FE8 0%, transparent 70%)", transform: "translate(40%, -40%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C93434 0%, transparent 70%)", transform: "translate(-40%, 40%)" }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7"
          style={{ background: "white", color: "#1D7FE8", border: "1.5px solid #BFDBFE", boxShadow: "0 2px 12px rgba(29,127,232,0.1)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Get started in minutes
        </div>

        <h2
          className="font-black leading-tight mb-5"
          style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.25rem)", color: "#111827" }}
        >
          Ready to launch smarter campaigns?
        </h2>

        <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "#4B5563" }}>
          Start with one channel, generate your first campaign assets, and grow from one simple AI-powered dashboard.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <SmartCtaLink
            guestHref="/subscribe"
            authedHref="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: "#C93434", boxShadow: "0 8px 28px rgba(201,52,52,0.3)" }}
          >
            Start Your First Campaign
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </SmartCtaLink>
          <SmartCtaLink
            guestHref="/subscribe"
            authedHref="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold transition-all hover:bg-white"
            style={{ color: "#374151", border: "1.5px solid #D1D5DB", background: "white" }}
          >
            View Plans
          </SmartCtaLink>
        </div>

        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          No long-term contracts. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
