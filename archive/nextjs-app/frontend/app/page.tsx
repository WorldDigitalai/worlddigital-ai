import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PremiumHeroSection } from "@/components/home/PremiumHeroSection";
import InstantDemoMode from "@/components/marketing/InstantDemoMode";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

const HOME_DESCRIPTION =
  "AI marketing automation for Google, Meta, TikTok, Snapchat, LinkedIn and X. Launch campaigns in minutes — for SMBs, SMEs and enterprises across the US and Canada.";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — AI Marketing Automation for SMBs & Enterprises` },
  description: HOME_DESCRIPTION,
  alternates: { canonical: SITE_URL, languages: { "en-US": SITE_URL, "en-CA": SITE_URL, "x-default": SITE_URL } },
};

const HOME_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.jpeg"),
    email: "support@worlddigital.ai",
    areaServed: ["US", "CA"],
    sameAs: [
      "https://facebook.com/worlddigitalai",
      "https://instagram.com/worlddigitalai",
      "https://linkedin.com/company/worlddigitalai",
      "https://x.com/worlddigitalai",
      "https://tiktok.com/@worlddigitalai",
      "https://youtube.com/@worlddigitalai",
      "https://snapchat.com/add/worlddigitalai",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: HOME_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
];

const valueProps = [
  {
    title: "AI-Driven, Always-On",
    desc: "Our platform learns your brand, generates creative, and optimizes campaigns 24/7 — no manual setup required.",
    iconSrc: "/icons/feature-ai.png",
  },
  {
    title: "End-to-End Automation",
    desc: "From logo upload to live campaign in minutes. Skip the agencies, the briefs, and the back-and-forth.",
    iconSrc: "/icons/feature-automation.png",
  },
  {
    title: "Built for SMBs",
    desc: "Enterprise-grade marketing tools at a fraction of the cost. Designed for business owners, not marketers.",
    iconSrc: "/icons/feature-smb.png",
  },
];

const offerings = [
  {
    iconSrc: "/icons/icon-search-gear2.png",
    title: "Smart Customer Engagement",
    desc: "Tailored AI responses that turn visitors into customers across every channel.",
  },
  {
    iconSrc: "/icons/icon-lightbulb.png",
    title: "Automated Visual Designs",
    desc: "On-brand creative for ads, social, and stories — generated automatically.",
  },
  {
    iconSrc: "/icons/icon-megaphone.png",
    title: "Automated Ad Campaigns",
    desc: "Launch and optimize ads on Google, Meta, and Snapchat without lifting a finger.",
  },
  {
    iconSrc: "/icons/icon-content.png",
    title: "Content Generation",
    desc: "Captions, copy, and content concepts crafted by AI that knows your voice.",
  },
];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }} />
      {/* 1 ── HERO */}
      <PremiumHeroSection />

      {/* 2 ── INSTANT DEMO MODE */}
      <InstantDemoMode />

      {/* 3 ── ABOUT / VALUE PROPOSITION */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #FFD9CC 0%, #FFF0EA 35%, #EEF6FF 100%)" }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: "10%", right: "-8%", width: 300, height: 300, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(66,133,199,0.12) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "5%", left: "-6%", width: 260, height: 260, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(193,58,42,0.10) 0%, transparent 65%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <h2
            className="font-black leading-tight mb-4"
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)", color: "#111827" }}
          >
            Smarter Marketing,<br />Effortless Growth
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-14" style={{ color: "#4B5563" }}>
            AI-driven solutions that adapt to your goals and deliver real results — without the agency fees.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {valueProps.map(({ title, desc, iconSrc }) => (
              <div key={title} className="feature-card text-left">
                <Image src={iconSrc} alt={title} width={44} height={44} className="object-contain mb-4" />
                <h3 className="font-bold mb-2" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 ── WHAT WE OFFER */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #EEF6FF 0%, #DAEEFF 100%)" }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: "20%", left: "-8%", width: 300, height: 300, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 65%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold mb-4" style={{ color: "#C13A2A" }}>What We Offer</p>
            <h2
              className="font-black leading-tight mb-4"
              style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)", color: "#111827" }}
            >
              Everything You Need<br />to Win Online
            </h2>
            <p className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto" style={{ color: "#4B5563" }}>
              Replace your agency, design team, and ads manager — with one AI platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {offerings.map(({ iconSrc, title, desc }) => (
              <div key={title} className="feature-card flex flex-col">
                <Image src={iconSrc} alt={title} width={44} height={44} className="object-contain mb-4" />
                <h3 className="font-bold text-sm mb-2" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Sub-CTA to services page */}
          <div className="text-center mt-12">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-70"
              style={{ color: "#C13A2A" }}
            >
              See all services
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 5 ── EXPLORE PACKAGES CTA */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #DAEEFF 0%, #EEF6FF 50%, #FFE4DC 100%)" }}
      >
        {/* Soft blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-10%", left: "20%", width: 360, height: 360, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(66,133,199,0.13) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-15%", right: "10%", width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(193,58,42,0.13) 0%, transparent 60%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2
            className="font-black leading-tight mb-4"
            style={{ fontSize: "clamp(2.5rem, 5.5vw, 3.75rem)", color: "#111827" }}
          >
            Ready to grow?
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-md mx-auto mb-10" style={{ color: "#4B5563" }}>
            Pick a plan and launch your AI marketing system today.
          </p>

          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: "#C13A2A",
              boxShadow: "0 10px 32px rgba(193,58,42,0.3)",
            }}
          >
            View Packages
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
