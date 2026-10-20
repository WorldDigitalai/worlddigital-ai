import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MODULES, getModule } from "@/lib/modules";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

// Each platform module has a matching "done-for-you" landing page. Linking
// the two tells Google they serve different intents (software vs. managed
// service) instead of competing for the same searches.
const RELATED_SOLUTION: Record<string, { href: string; label: string }> = {
  "google-ads":        { href: "/google-ads-agency",        label: "Google Ads Agency" },
  "meta-ads":          { href: "/meta-ads-agency",          label: "Meta Ads Agency" },
  "snapchat-ads":      { href: "/snapchat-ads-agency",      label: "Snapchat Ads Agency" },
  "tiktok-ads":        { href: "/tiktok-ads-agency",        label: "TikTok Ads Agency" },
  "linkedin-ads":      { href: "/linkedin-ads-agency",      label: "LinkedIn Ads Agency" },
  "x-ads":             { href: "/x-ads-agency",             label: "X Ads Agency" },
  "youtube-shorts":    { href: "/youtube-shorts-marketing", label: "YouTube Shorts Marketing" },
  "ai-seo":            { href: "/ai-seo-agency",            label: "AI SEO Agency" },
  "content-marketing": { href: "/ai-marketing-automation",  label: "AI Marketing Automation" },
  "image-generator":   { href: "/instagram-marketing",      label: "Instagram Marketing" },
  "reels-generator":   { href: "/tiktok-marketing",         label: "TikTok Marketing" },
  "keyword-research":  { href: "/ai-seo-agency",            label: "AI SEO Agency" },
};

export async function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = getModule(slug);
  if (!m) return { title: "Not Found", robots: { index: false, follow: true } };
  const title =
    m.category === "AI Tools"
      ? `${m.title.startsWith("AI ") ? m.title : `AI ${m.title}`} for SMBs & Enterprises`
      : `${m.title} Management Software for SMBs & Enterprises`;
  return pageMetadata({
    title,
    description: m.shortDesc.length >= 110 ? m.shortDesc : `${m.shortDesc} ${m.subheading}`.slice(0, 158),
    path: `/services/${m.slug}`,
  });
}

const CONTAIN_ICONS = new Set(["/icons/meta.png", "/icons/google.webp"]);

function ModuleIcon({ m }: { m: ReturnType<typeof getModule> }) {
  if (!m) return null;
  if (m.iconType === "img" && m.iconSrc) {
    const contain = CONTAIN_ICONS.has(m.iconSrc);
    return (
      <div
        className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ minWidth: 56, background: contain ? "white" : undefined }}
      >
        <Image
          src={m.iconSrc}
          alt={m.title}
          width={56}
          height={56}
          className={contain ? "w-[72%] h-[72%] object-contain" : "w-full h-full object-cover"}
          style={{ display: "block" }}
        />
      </div>
    );
  }
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
      style={{ background: m.badgeBg ?? "#333", color: m.badgeTextColor ?? "#fff", minWidth: 56 }}
    >
      {m.badgeLabel}
    </div>
  );
}

export default async function ModuleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getModule(slug);
  if (!m) notFound();

  const related = RELATED_SOLUTION[m.slug];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": m.category === "AI Tools" ? "SoftwareApplication" : "Service",
      name: `${m.title} — ${SITE_NAME}`,
      description: m.subheading,
      url: absoluteUrl(`/services/${m.slug}`),
      provider: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
      ...(m.category === "AI Tools"
        ? { applicationCategory: "BusinessApplication", operatingSystem: "Web" }
        : { serviceType: m.title, areaServed: [{ "@type": "Country", name: "United States" }, { "@type": "Country", name: "Canada" }] }),
    },
    breadcrumbJsonLd([
      { name: "Platform", path: "/services" },
      { name: m.title, path: `/services/${m.slug}` },
    ]),
  ];

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
          style={{ background: "radial-gradient(circle, rgba(193,58,42,0.16) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-10 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(66,133,199,0.35) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 mb-8 text-xs" style={{ color: "#6B7280" }}>
            <Link href="/services" className="hover:underline" style={{ color: "#C13A2A" }}>Platform</Link>
            <span>/</span>
            <span>{m.title}</span>
          </div>

          <div className="flex justify-center mb-6">
            <ModuleIcon m={m} />
          </div>

          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#C13A2A" }}>
            {m.category}
          </p>
          <h1
            className="font-black leading-tight mb-6"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", color: "#111827" }}
          >
            {m.headline}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: "#4B5563" }}>
            {m.subheading}
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(to right, #4285C7, #C13A2A)",
              boxShadow: "0 10px 32px rgba(193,58,42,0.25)",
            }}
          >
            Get Access to the System
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── PROBLEM / WHY ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-8 md:p-12"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 24px rgba(0,0,0,0.05)" }}
          >
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#C13A2A" }}>The Problem</p>
            <h2
              className="font-black leading-tight mb-5"
              style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "#111827" }}
            >
              {m.problem.heading}
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "#4B5563" }}>
              {m.problem.text}
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#C13A2A" }}>How It Works</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#111827" }}
            >
              {m.howItWorks.length <= 3 ? "Three Formats. One AI System." : "From Zero to Published in Four Steps."}
            </h2>
          </div>
          <div className={`grid grid-cols-1 gap-6 ${m.howItWorks.length === 4 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {m.howItWorks.map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-2xl p-6"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
              >
                <span
                  className="text-3xl font-black block mb-3"
                  style={{ color: "rgba(193,58,42,0.75)", lineHeight: 1 }}
                >
                  {step}
                </span>
                <h3 className="font-bold mb-2" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#C13A2A" }}>What You Get</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#111827" }}
            >
              Everything Included
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {m.features.map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-5"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(193,58,42,0.1)" />
                    <path d="M5 8l2 2 4-4" stroke="#C13A2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3 className="font-bold text-sm" style={{ color: "#111827" }}>{title}</h3>
                </div>
                <p className="text-xs leading-relaxed pl-6" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-8 md:p-12"
            style={{
              background: "linear-gradient(135deg, #0F172A, #1a2a4a)",
              border: "1px solid rgba(66,133,199,0.2)",
            }}
          >
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#93C5FD" }}>ROI Impact</p>
            <h2
              className="font-black leading-tight mb-5 text-white"
              style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
            >
              {m.roi.heading}
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "#6B7280" }}>
              {m.roi.text}
            </p>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────────────────────────── */}
      {m.integrations.length > 0 && (
        <section className="py-20 px-6" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#C13A2A" }}>
              Part of the Full System
            </p>
            <h2
              className="font-black mb-8"
              style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "#111827" }}
            >
              Works Hand-in-Hand With
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {m.integrations.map((name) => (
                <span
                  key={name}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#374151", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── STANDARD FEATURES ────────────────────────────────────────────────── */}
      <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.15)" }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>Every plan includes</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "AI-Powered Content Creation",
                "Smart Ad Design Automation",
                "Data-Driven Campaign Analytics",
                "Real-Time Optimization",
                "Dedicated 24/7 Support",
              ].map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "white", color: "#374151", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" fill="rgba(193,58,42,0.1)" />
                    <path d="M3.5 6l2 2 3-3" stroke="#C13A2A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2
            className="font-black mb-4"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#111827" }}
          >
            Ready to Get Started?
          </h2>
          <p className="text-base mb-3" style={{ color: "#4B5563" }}>
            Subscribe to WorldDigital.ai and unlock {m.title} — along with every other module in the system.
          </p>
          <p className="text-sm mb-8 font-semibold" style={{ color: "#C13A2A" }}>
            Simple monthly plans · No setup fees
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-white text-base transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(to right, #4285C7, #C13A2A)",
              boxShadow: "0 10px 32px rgba(193,58,42,0.3)",
            }}
          >
            Get Access to the System
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-6 text-xs" style={{ color: "#6B7280" }}>No contracts. Cancel anytime.</p>
          {related && (
            <p className="mt-8 text-sm" style={{ color: "#4B5563" }}>
              Prefer us to run it for you?{" "}
              <Link href={related.href} className="font-semibold hover:underline" style={{ color: "#2B6CB0" }}>
                See our {related.label} service →
              </Link>
            </p>
          )}
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
