import Link from "next/link";

function RobotIllustration() {
  return (
    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto" aria-hidden="true">
      <ellipse cx="160" cy="360" rx="80" ry="12" fill="#4285C7" fillOpacity="0.08" />
      <rect x="95" y="60" width="130" height="100" rx="24" fill="#EEF5FF" stroke="#4285C7" strokeWidth="2" />
      <circle cx="135" cy="105" r="15" fill="#4285C7" fillOpacity="0.2" />
      <circle cx="185" cy="105" r="15" fill="#4285C7" fillOpacity="0.2" />
      <circle cx="135" cy="105" r="8" fill="#4285C7" />
      <circle cx="185" cy="105" r="8" fill="#4285C7" />
      <circle cx="137" cy="103" r="3" fill="white" />
      <circle cx="187" cy="103" r="3" fill="white" />
      <path d="M138 135 Q160 148 182 135" stroke="#4285C7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <line x1="160" y1="60" x2="160" y2="36" stroke="#4285C7" strokeWidth="2.5" />
      <circle cx="160" cy="28" r="9" fill="#C13A2A" />
      <circle cx="160" cy="28" r="5" fill="white" />
      <rect x="78" y="175" width="164" height="140" rx="22" fill="#EEF5FF" stroke="#4285C7" strokeWidth="2" />
      <rect x="60" y="188" width="50" height="30" rx="14" fill="#EEF5FF" stroke="#4285C7" strokeWidth="1.8" />
      <rect x="210" y="188" width="50" height="30" rx="14" fill="#EEF5FF" stroke="#4285C7" strokeWidth="1.8" />
      <circle cx="72" cy="203" r="5" fill="#4285C7" fillOpacity="0.3" />
      <circle cx="248" cy="203" r="5" fill="#4285C7" fillOpacity="0.3" />
      <rect x="100" y="315" width="40" height="50" rx="14" fill="#EEF5FF" stroke="#4285C7" strokeWidth="1.8" />
      <rect x="180" y="315" width="40" height="50" rx="14" fill="#EEF5FF" stroke="#4285C7" strokeWidth="1.8" />
      <rect x="96" y="198" width="128" height="90" rx="12" fill="white" stroke="#4285C7" strokeOpacity="0.15" strokeWidth="1" />
      <path d="M108 268 L128 248 L148 258 L168 238 L188 250 L208 236" stroke="#C13A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="108" cy="268" r="3" fill="#C13A2A" />
      <circle cx="208" cy="236" r="3" fill="#C13A2A" />
      <rect x="108" y="208" width="48" height="8" rx="4" fill="#4285C7" fillOpacity="0.15" />
      <rect x="108" y="220" width="32" height="8" rx="4" fill="#4285C7" fillOpacity="0.1" />
      <rect x="230" y="220" width="28" height="8" rx="4" fill="#C13A2A" fillOpacity="0.12" />
      <rect x="230" y="208" width="20" height="8" rx="4" fill="#10B981" fillOpacity="0.2" />
      <circle cx="40" cy="130" r="18" fill="#EEF5FF" stroke="#4285C7" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="40" cy="130" r="8" fill="#4285C7" fillOpacity="0.2" />
      <circle cx="280" cy="260" r="14" fill="#FEF2F2" stroke="#C13A2A" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="280" cy="260" r="6" fill="#C13A2A" fillOpacity="0.2" />
      <circle cx="55" cy="310" r="10" fill="#F0FDF4" stroke="#10B981" strokeWidth="1.5" />
      <circle cx="270" cy="110" r="10" fill="#FFF7ED" stroke="#F59E0B" strokeWidth="1.5" />
    </svg>
  );
}

export function AboutHeroSection() {
  return (
    <section className="pt-28 pb-20 px-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #F8FAFF 0%, #EFF6FF 100%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px" style={{ background: "#C13A2A" }} />
              <span className="text-sm font-semibold" style={{ color: "#C13A2A" }}>About Us</span>
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
              Revolutionizing Digital Marketing with Smart, Automated AI Solutions
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
              WorldDigital.ai empowers small and medium businesses with enterprise-grade AI marketing tools. Launch campaigns across Google, Meta, and Snapchat — automatically, without any technical expertise.
            </p>
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 py-4 px-8 rounded-full font-bold text-base text-white transition-all hover:opacity-90 shadow-lg"
              style={{ background: "#4285C7" }}
            >
              Our AI Marketing Plan
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <RobotIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}
