import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Us — AI Marketing for Businesses of Every Size",
  description: "We combine innovation and intelligence to help brands grow effortlessly. Our mission is to simplify digital marketing with AI-driven solutions.",
  alternates: { canonical: "https://worlddigital.ai/about", languages: { "en-US": "https://worlddigital.ai/about", "en-CA": "https://worlddigital.ai/about", "x-default": "https://worlddigital.ai/about" } },
  openGraph: {
    title: "About WorldDigital.ai — AI-Powered Marketing for SMBs",
    description: "We combine innovation and intelligence to help brands grow effortlessly. Our mission is to simplify digital marketing with AI-driven solutions.",
    url: "https://worlddigital.ai/about",
    type: "website",
    siteName: "WorldDigital.ai",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "About WorldDigital.ai — AI-Powered Marketing for SMBs",
    description: "We combine innovation and intelligence to help brands grow effortlessly. Our mission is to simplify digital marketing with AI-driven solutions.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const differentiators = [
  {
    title: "AI-Driven Marketing",
    desc: "Our AI generates content, designs visuals, and optimizes campaigns continuously — without manual intervention.",
  },
  {
    title: "End-to-End Automation",
    desc: "From logo upload to live campaign, every step is automated. No complex setup, no technical expertise required.",
  },
  {
    title: "Cost-Effective Plans",
    desc: "Agency-quality results at a fraction of the cost. Simple monthly plans with no hidden fees.",
  },
  {
    title: "No Expertise Needed",
    desc: "Built for business owners, not marketing professionals. If you can describe your business, you can launch a campaign.",
  },
  {
    title: "Real-Time Optimization",
    desc: "Our system monitors performance 24/7 and automatically reallocates budget to what's working best.",
  },
  {
    title: "Performance Insights",
    desc: "Clear, transparent reporting across all platforms. Know your impressions, clicks, CTR, and conversions at a glance.",
  },
];


export default function AboutPage() {
  return (
    <main
      style={{
        background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 30%, #EEF9FF 70%, #DAEEFF 100%)",
        minHeight: "100vh",
      }}
    >
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
        {/* Decorative blobs */}
        <div
          className="absolute top-8 right-12 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(193,58,42,0.18) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-10 w-16 h-16 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(66,133,199,0.45) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-sm font-semibold mb-4" style={{ color: "#C13A2A" }}>
            Smarter Growth with AI
          </p>
          <h1
            className="font-black leading-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#111827" }}
          >
            About Us
          </h1>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: "#4B5563", maxWidth: 660, margin: "0 auto" }}>
            we combine innovation and intelligence to help brands grow effortlessly. Our mission is to simplify digital
            marketing with AI-driven solutions that understand your business, adapt to your goals, and deliver real results.
            From strategy to execution, we make it easier for you to reach the right audience and scale with confidence.
          </p>
        </div>
      </section>

      {/* ── OUR STORY ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div>
              <p className="eyebrow-line mb-4">Our Story</p>
              <h2
                className="font-black leading-tight mb-6"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: "#111827" }}
              >
                Welcome to worlddigital.ai—Where Innovation Meets Opportunity
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#4B5563" }}>
                Founded in 2023, WorldDigital.ai was created to simplify and revolutionize digital marketing
                for small and medium-sized businesses (SMEs). We recognized the growing need for companies
                to compete effectively online—without the complexity or high costs of traditional marketing.
              </p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#4B5563" }}>
                Our AI-powered marketing platform automates everything from content creation to targeted ad
                campaigns across Google Ads, Meta Ads, and Snapchat Ads, giving businesses the tools to grow
                smarter and faster.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>
                Headquartered at 3343 Memorial Blvd, Murfreesboro, TN, our mission is to empower local
                and global enterprises with smart, affordable, and results-driven digital marketing
                solutions. At WorldDigital.ai, marketing isn't a challenge—it's an opportunity powered
                by innovation, automation, and measurable success.
              </p>

              {/* Stat strip */}
              <div
                className="inline-flex items-center gap-3 mt-8 px-5 py-3 rounded-2xl"
                style={{ background: "white", border: "1px solid #E5EAF2", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <span className="text-2xl font-black" style={{ color: "#C13A2A" }}>20%</span>
                <p className="text-sm" style={{ color: "#6B7280" }}>Average increase in campaign performance</p>
              </div>
            </div>

            {/* Right — illustration */}
            <div className="flex items-center justify-center">
              <div
                className="relative rounded-3xl overflow-hidden flex items-center justify-center"
                style={{
                  width: 340,
                  height: 340,
                  background: "linear-gradient(135deg, #EEF6FF, #FFF0EE)",
                  border: "1px solid #E5EAF2",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.08)",
                }}
              >
                {/* Robot/AI illustration placeholder — gear + person silhouette */}
                <svg viewBox="0 0 200 200" className="w-56 h-56" fill="none">
                  {/* Body */}
                  <rect x="70" y="90" width="60" height="70" rx="8" fill="#4285C7" opacity="0.9" />
                  {/* Head */}
                  <rect x="75" y="55" width="50" height="45" rx="10" fill="#4285C7" opacity="0.9" />
                  {/* Eyes */}
                  <circle cx="90" cy="75" r="6" fill="white" />
                  <circle cx="110" cy="75" r="6" fill="white" />
                  <circle cx="91" cy="76" r="3" fill="#C13A2A" />
                  <circle cx="111" cy="76" r="3" fill="#C13A2A" />
                  {/* Arms */}
                  <rect x="40" y="95" width="30" height="14" rx="7" fill="#C13A2A" opacity="0.85" />
                  <rect x="130" y="95" width="30" height="14" rx="7" fill="#C13A2A" opacity="0.85" />
                  {/* Legs */}
                  <rect x="78" y="158" width="18" height="28" rx="6" fill="#3270B0" />
                  <rect x="104" y="158" width="18" height="28" rx="6" fill="#3270B0" />
                  {/* Gears */}
                  <circle cx="40" cy="60" r="14" fill="none" stroke="#C13A2A" strokeWidth="3" opacity="0.6" />
                  <circle cx="40" cy="60" r="5" fill="#C13A2A" opacity="0.6" />
                  <circle cx="160" cy="50" r="12" fill="none" stroke="#4285C7" strokeWidth="3" opacity="0.6" />
                  <circle cx="160" cy="50" r="4" fill="#4285C7" opacity="0.6" />
                  <circle cx="155" cy="140" r="10" fill="none" stroke="#C13A2A" strokeWidth="2.5" opacity="0.5" />
                  <circle cx="155" cy="140" r="4" fill="#C13A2A" opacity="0.5" />
                  {/* Antenna */}
                  <line x1="100" y1="55" x2="100" y2="35" stroke="#4285C7" strokeWidth="2.5" />
                  <circle cx="100" cy="32" r="4" fill="#C13A2A" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES US DIFFERENT ─────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C13A2A" }}>Why We&apos;re Different</p>
            <h2
              className="font-black leading-tight"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: "#111827" }}
            >
              What makes WorldDigital.ai different
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {differentiators.map(({ title, desc }) => (
              <div
                key={title}
                className="feature-card"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(66,133,199,0.15), rgba(193,58,42,0.1))" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="#C13A2A" />
                  </svg>
                </div>
                <h3 className="font-bold mb-2 text-sm" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2
            className="font-black mb-5"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: "#111827" }}
          >
            Ready to grow your business with AI?
          </h2>
          <p className="text-base mb-8" style={{ color: "#4B5563" }}>
            Join businesses already growing with WorldDigital.ai. No agency, no complexity — just results.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:opacity-90"
            style={{ background: "#C13A2A", boxShadow: "0 8px 24px rgba(193,58,42,0.3)" }}
          >
            Subscribe Now
          </Link>
        </div>
      </section>
    </main>
  );
}
