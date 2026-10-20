const steps = [
  {
    num: 1,
    title: "Upload Logo",
    description: "Upload your business logo so our AI can generate branded, professional-quality creatives for your campaigns.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <rect x="4" y="4" width="24" height="24" rx="6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 20V12M12 16l4-4 4 4" />
      </svg>
    ),
  },
  {
    num: 2,
    title: "Select Categories",
    description: "Choose your business category so the AI understands your industry and tailors campaigns to your target market.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <rect x="4" y="4" width="11" height="11" rx="3" />
        <rect x="17" y="4" width="11" height="11" rx="3" />
        <rect x="4" y="17" width="11" height="11" rx="3" />
        <rect x="17" y="17" width="11" height="11" rx="3" />
      </svg>
    ),
  },
  {
    num: 3,
    title: "Choose Subcategories",
    description: "Drill down into your specific niche to help the AI create hyper-targeted campaigns that resonate with your ideal customers.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h16M8 16h12M8 22h8" />
      </svg>
    ),
  },
  {
    num: 4,
    title: "Share Website URL",
    description: "Provide your website URL so our AI can analyze your content, products, and brand voice to craft perfect ad copy.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <circle cx="16" cy="16" r="12" />
        <path strokeLinecap="round" d="M16 4c0 0-6 4-6 12s6 12 6 12M16 4c0 0 6 4 6 12s-6 12-6 12M4 16h24" />
      </svg>
    ),
  },
  {
    num: 5,
    title: "Business Physical Location",
    description: "Add your location so the AI can target local customers and run geo-specific campaigns that drive foot traffic and sales.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3C11.582 3 8 6.582 8 11c0 5.25 8 18 8 18s8-12.75 8-18c0-4.418-3.582-8-8-8z" />
        <circle cx="16" cy="11" r="3" />
      </svg>
    ),
  },
];

export function SimpleStepsSection() {
  return (
    <section className="py-20 px-6 overflow-hidden relative" style={{ background: "white" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px" style={{ background: "#C13A2A" }} />
          <span className="text-sm font-semibold" style={{ color: "#C13A2A" }}>Simple Step</span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-12">
          Streamline Your Marketing in 5 Simple Steps
        </h2>

        <div className="space-y-4">
          {steps.map(({ num, title, description, icon }) => (
            <div
              key={num}
              className="flex items-start gap-5 p-6 rounded-2xl transition-all"
              style={{ background: "#F8FAFF", border: "1px solid rgba(66,133,199,0.1)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "white", color: "#4285C7", boxShadow: "0 2px 12px rgba(66,133,199,0.12)" }}
              >
                {icon}
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-base mb-1">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none" style={{ display: "block" }}>
          <path d="M0,40 Q360,80 720,40 Q1080,0 1440,40 L1440,80 L0,80 Z" fill="#4285C7" fillOpacity="0.08" />
          <path d="M0,55 Q360,20 720,55 Q1080,90 1440,55 L1440,80 L0,80 Z" fill="#4285C7" fillOpacity="0.05" />
        </svg>
      </div>
    </section>
  );
}
