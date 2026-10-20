import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MODULES } from "@/lib/modules";

export const metadata: Metadata = {
  title: "AI Marketing Platform — Ad Management Modules & AI Tools",
  description: "All 12 AI marketing modules — Ad management for Google, Meta, Snapchat, TikTok, LinkedIn, YouTube & X, plus AI SEO, Keyword Research, Content Marketing, Image Generator, and Reels Generator.",
  alternates: { canonical: "https://worlddigital.ai/services", languages: { "en-US": "https://worlddigital.ai/services", "en-CA": "https://worlddigital.ai/services", "x-default": "https://worlddigital.ai/services" } },
};

const AD_MODULES = MODULES.filter((m) => m.category === "Ad Management");
const AI_MODULES = MODULES.filter((m) => m.category === "AI Tools");

const CONTAIN_ICONS = new Set(["/icons/meta.png", "/icons/google.webp"]);

function ModuleIcon({ m }: { m: (typeof MODULES)[number] }) {
  if (m.iconType === "img" && m.iconSrc) {
    const contain = CONTAIN_ICONS.has(m.iconSrc);
    return (
      <div
        className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ minWidth: 44, background: contain ? "white" : undefined }}
      >
        <Image
          src={m.iconSrc}
          alt={m.title}
          width={44}
          height={44}
          className={contain ? "w-[72%] h-[72%] object-contain" : "w-full h-full object-cover"}
          style={{ display: "block" }}
        />
      </div>
    );
  }
  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0"
      style={{ background: m.badgeBg ?? "#333", color: m.badgeTextColor ?? "#fff", minWidth: 44 }}
    >
      {m.badgeLabel}
    </div>
  );
}

function ModuleCard({ m }: { m: (typeof MODULES)[number] }) {
  return (
    <div className="feature-card flex flex-col gap-0">
      <ModuleIcon m={m} />
      <h3 className="font-bold text-sm mt-4 mb-1.5" style={{ color: "#111827" }}>{m.title}</h3>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B7280" }}>{m.shortDesc}</p>
      <ul className="space-y-1.5 mb-5 flex-1">
        {m.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs" style={{ color: "#6B7280" }}>
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" fill="rgba(66,133,199,0.12)" />
              <path d="M4 7l2 2 4-4" stroke="#4285C7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {b}
          </li>
        ))}
      </ul>
      <Link
        href={`/services/${m.slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors hover:opacity-70 mt-auto"
        style={{ color: "#C13A2A" }}
      >
        Explore {m.title}
        <svg className="w-3.5 h-3.5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <main
      style={{
        background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 30%, #EEF9FF 70%, #DAEEFF 100%)",
        minHeight: "100vh",
      }}
    >
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
        <div
          className="absolute top-8 right-12 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(193,58,42,0.18) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-10 w-16 h-16 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(66,133,199,0.45) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-sm font-semibold mb-4" style={{ color: "#C13A2A" }}>The Full System</p>
          <h1
            className="font-black leading-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#111827" }}
          >
            Platform
          </h1>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: "#4B5563", maxWidth: 660, margin: "0 auto" }}>
            One AI marketing system with 12 modules covering every channel and every content type.
            Choose the modules you need — all powered by the same AI brain that learns your brand.
          </p>
        </div>
      </section>

      {/* ── AD MANAGEMENT MODULES ───────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#6B7280" }}>
              Ad Management
            </p>
            <h2
              className="font-black leading-tight"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#111827" }}
            >
              Automated Campaigns Across Every Platform
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {AD_MODULES.map((m) => (
              <ModuleCard key={m.slug} m={m} />
            ))}
          </div>
        </div>
      </section>

      {/* ── AI TOOLS MODULES ────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#6B7280" }}>
              AI Tools
            </p>
            <h2
              className="font-black leading-tight"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#111827" }}
            >
              The Intelligence Behind the Campaigns
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {AI_MODULES.map((m) => (
              <ModuleCard key={m.slug} m={m} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C13A2A" }}>Why Choose Us</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: "#111827" }}
            >
              The Power of One Unified System
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: "Zero agency markup", desc: "Keep your entire budget for ads — not overhead." },
              { title: "AI learns your brand", desc: "Every campaign gets smarter over time based on your performance data." },
              { title: "Platform expertise built in", desc: "Best practices for all 7 ad platforms are baked into every campaign from day one." },
              { title: "No contracts required", desc: "Start, pause, or cancel any time — no lock-in, no penalties." },
            ].map(({ title, desc }) => (
              <div key={title} className="card flex items-start gap-4">
                <div
                  className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ background: "rgba(193,58,42,0.1)" }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3 3 7-7" stroke="#C13A2A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#111827" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2
            className="font-black mb-5"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: "#111827" }}
          >
            Ready to launch your first campaign?
          </h2>
          <p className="text-base mb-8" style={{ color: "#4B5563" }}>
            Subscribe once and get access to the modules your business needs — all in one system.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)", boxShadow: "0 8px 24px rgba(193,58,42,0.3)" }}
          >
            View Plans &amp; Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
