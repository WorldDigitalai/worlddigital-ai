const problems = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Agencies cost too much",
    desc: "Traditional agencies charge $3,000–$10,000/month before you even run a single ad. Most SMBs can't compete.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Ad platforms are complicated",
    desc: "Google Ads, Meta Business Suite, Snapchat Manager — each has its own steep learning curve and setup complexity.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Content takes too long",
    desc: "Copywriting, design, video editing — producing quality ad content for multiple platforms takes weeks and a full creative team.",
  },
];

export function ProblemSolutionSection() {
  return (
    <section className="py-24 lg:py-32 px-6" style={{ background: "#F7FAFC" }}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold mb-3" style={{ color: "#C93434" }}>The Problem</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4" style={{ color: "#111827" }}>
            Marketing is expensive, fragmented, and slow.{" "}
            <span style={{ color: "#1D7FE8" }}>We made it automatic.</span>
          </h2>
          <p className="text-lg" style={{ color: "#4B5563" }}>
            Small and medium businesses deserve the same marketing firepower as enterprise brands — without the cost, complexity, or delays.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {problems.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-3xl p-7"
              style={{ background: "white", border: "1px solid #E5EAF2", boxShadow: "0 2px 16px rgba(15,23,42,0.05)" }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#FEF2F2", color: "#C93434" }}
              >
                {icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#111827" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Before / After */}
        <div className="mb-8">
          <h3 className="text-2xl lg:text-3xl font-black mb-2" style={{ color: "#111827" }}>
            One platform.{" "}
            <span style={{ background: "linear-gradient(90deg,#1D7FE8,#C93434)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Everything automated.
            </span>
          </h3>
          <p className="text-base" style={{ color: "#6B7280" }}>See what changes when you switch to WorldDigital.ai.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            className="rounded-3xl p-8"
            style={{ background: "white", border: "1px solid #E5EAF2", boxShadow: "0 2px 16px rgba(15,23,42,0.05)" }}
          >
            <p className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "#9CA3AF" }}>
              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">✕</span>
              Before WorldDigital.ai
            </p>
            <ul className="space-y-3">
              {[
                "Multiple disconnected tools",
                "Agency dependencies",
                "Manual ad copy and design",
                "Weeks to launch a campaign",
                "Unclear ROI reporting",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#6B7280" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: "#FEF2F2", color: "#C93434" }}>✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-3xl p-8"
            style={{ background: "linear-gradient(135deg, #EEF6FF, #F0FFF4)", border: "1.5px solid #BFDBFE", boxShadow: "0 2px 24px rgba(29,127,232,0.08)" }}
          >
            <p className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "#1D7FE8" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "#DBEAFE" }}>✓</span>
              After WorldDigital.ai
            </p>
            <ul className="space-y-3">
              {[
                "One unified AI-powered dashboard",
                "No agency required",
                "AI-generated content and visuals",
                "Go live in under an hour",
                "Real-time cross-platform analytics",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#374151" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: "#DCFCE7", color: "#059669" }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
