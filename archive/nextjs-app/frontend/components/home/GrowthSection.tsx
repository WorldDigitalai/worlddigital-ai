import { SmartCtaLink } from "@/components/home/SmartCtaLink";

function GrowthRobot() {
  return (
    <svg viewBox="0 0 280 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[240px] mx-auto" aria-hidden="true">
      <ellipse cx="140" cy="288" rx="70" ry="10" fill="#4285C7" fillOpacity="0.07" />
      <rect x="82" y="52" width="116" height="88" rx="22" fill="#FEF2F2" stroke="#C13A2A" strokeWidth="2" />
      <circle cx="118" cy="90" r="13" fill="#C13A2A" fillOpacity="0.2" />
      <circle cx="162" cy="90" r="13" fill="#C13A2A" fillOpacity="0.2" />
      <circle cx="118" cy="90" r="7" fill="#C13A2A" />
      <circle cx="162" cy="90" r="7" fill="#C13A2A" />
      <circle cx="120" cy="88" r="2.5" fill="white" />
      <circle cx="164" cy="88" r="2.5" fill="white" />
      <path d="M122 118 Q140 130 158 118" stroke="#C13A2A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <line x1="140" y1="52" x2="140" y2="30" stroke="#C13A2A" strokeWidth="2" />
      <circle cx="140" cy="22" r="9" fill="#4285C7" />
      <circle cx="140" cy="22" r="5" fill="white" />
      <rect x="66" y="152" width="148" height="116" rx="20" fill="#FEF2F2" stroke="#C13A2A" strokeWidth="2" />
      <rect x="50" y="164" width="46" height="28" rx="13" fill="#FEF2F2" stroke="#C13A2A" strokeWidth="1.8" />
      <rect x="184" y="164" width="46" height="28" rx="13" fill="#FEF2F2" stroke="#C13A2A" strokeWidth="1.8" />
      <rect x="88" y="268" width="36" height="44" rx="12" fill="#FEF2F2" stroke="#C13A2A" strokeWidth="1.8" />
      <rect x="156" y="268" width="36" height="44" rx="12" fill="#FEF2F2" stroke="#C13A2A" strokeWidth="1.8" />
      <rect x="84" y="173" width="112" height="78" rx="10" fill="white" stroke="#C13A2A" strokeOpacity="0.12" strokeWidth="1" />
      <path d="M96 234 L116 214 L136 222 L156 202 L176 214 L196 198" stroke="#C13A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="96" cy="234" r="3" fill="#C13A2A" />
      <circle cx="196" cy="198" r="3" fill="#C13A2A" />
      <rect x="94" y="183" width="44" height="7" rx="3.5" fill="#C13A2A" fillOpacity="0.15" />
      <rect x="94" y="194" width="28" height="7" rx="3.5" fill="#C13A2A" fillOpacity="0.1" />
      <rect x="200" y="192" width="24" height="7" rx="3.5" fill="#4285C7" fillOpacity="0.15" />
      <rect x="200" y="181" width="18" height="7" rx="3.5" fill="#10B981" fillOpacity="0.2" />
    </svg>
  );
}

export function GrowthSection() {
  return (
    <section className="py-20 px-6 overflow-hidden" style={{ background: "#FEF9F8" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px" style={{ background: "#C13A2A" }} />
              <span className="text-sm font-semibold" style={{ color: "#C13A2A" }}>Your Growth</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-6">
              Boost Your Brand with Our AI-Powered Marketing Plans
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
              Let our AI handle the complexity of digital advertising while you focus on what you do best — running your business. From creative generation to campaign optimization, we&apos;ve got every step covered.
            </p>
            <SmartCtaLink
              guestHref="/subscribe"
              authedHref="/dashboard"
              className="inline-flex items-center gap-2 py-4 px-8 rounded-full font-bold text-base text-white transition-all hover:opacity-90 shadow-lg"
              style={{ background: "#C13A2A", boxShadow: "0 6px 24px rgba(193,58,42,0.3)" }}
            >
              Subscribe Now
            </SmartCtaLink>
          </div>
          <div className="flex items-center justify-center">
            <GrowthRobot />
          </div>
        </div>
      </div>
    </section>
  );
}
