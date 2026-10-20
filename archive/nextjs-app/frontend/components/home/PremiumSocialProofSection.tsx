const stats = [
  { value: "500+", label: "Active businesses", sub: "across 12 industries" },
  { value: "3×", label: "Average ROI", sub: "vs. traditional agencies" },
  { value: "$12M+", label: "Ad spend managed", sub: "and growing every month" },
  { value: "94%", label: "Retention rate", sub: "after 6 months" },
];

const testimonials = [
  {
    quote: "We went from spending $4,000/month with an agency to WorldDigital.ai — and our leads actually increased.",
    name: "Sarah M.",
    role: "Owner, Local Dental Practice",
    stars: 5,
  },
  {
    quote: "I didn't understand Google Ads at all. With WorldDigital.ai I just answered a few questions and campaigns were running the same day.",
    name: "James T.",
    role: "Founder, Boutique Fitness Studio",
    stars: 5,
  },
  {
    quote: "The AI-generated creatives are shockingly good. Our Meta campaign CTR jumped from 1.2% to 3.8% within the first two weeks.",
    name: "Priya K.",
    role: "Marketing Lead, E-commerce Brand",
    stars: 5,
  },
];

export function PremiumSocialProofSection() {
  return (
    <section className="py-24 lg:py-32 px-6" style={{ background: "white" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold mb-3" style={{ color: "#1D7FE8" }}>Real Results</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4" style={{ color: "#111827" }}>
            Built for real businesses that need real results.
          </h2>
          <p className="text-lg" style={{ color: "#4B5563" }}>
            From local service businesses to growing e-commerce brands — WorldDigital.ai delivers measurable performance.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {stats.map(({ value, label, sub }) => (
            <div
              key={label}
              className="rounded-3xl p-6 text-center"
              style={{ background: "#F7FAFC", border: "1px solid #E5EAF2" }}
            >
              <p className="text-4xl font-black mb-1" style={{ color: "#111827" }}>{value}</p>
              <p className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>{label}</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map(({ quote, name, role, stars }) => (
            <div
              key={name}
              className="rounded-3xl p-7 flex flex-col"
              style={{ background: "#F7FAFC", border: "1px solid #E5EAF2" }}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <svg key={i} className="w-4 h-4" fill="#FBBF24" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: "#374151" }}>
                &ldquo;{quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#1D7FE8,#C93434)" }}
                >
                  {name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{name}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
