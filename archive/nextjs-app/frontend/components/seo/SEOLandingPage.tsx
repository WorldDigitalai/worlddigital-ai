import Link from "next/link";
import { FAQAccordion } from "./FAQAccordion";
import { SEOCtaButton } from "./SEOCtaButton";

export interface SEOPageService {
  title: string;
  desc: string;
}

export interface SEOPageFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface SEOPageConfig {
  h1: string;
  eyebrow: string;
  intro: string;
  platform: string;
  /** Leave empty to hide the price; the box then shows "see plans" copy. */
  price: string;
  priceNote: string;
  schemaDescription: string;
  schemaType: string;
  canonicalPath: string;
  services: SEOPageService[];
  features: SEOPageFeature[];
  benefits: string[];
  faqs: Array<{ q: string; a: string }>;
  relatedPages: Array<{ href: string; label: string }>;
  blogLinks: Array<{ href: string; label: string }>;
  /** Stripe plan id — appended to /subscribe?plan= for the primary CTA */
  planId?: string;
  /** Where logged-in users are sent (defaults to /dashboard) */
  dashboardPath?: string;
}

function FeatureIcon({ d }: { d: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0"
      style={{ background: "linear-gradient(135deg, rgba(66,133,199,0.15), rgba(193,58,42,0.08))" }}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4285C7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </div>
  );
}

export function SEOLandingPage({ config }: { config: SEOPageConfig }) {
  const siteUrl = "https://worlddigital.ai";
  const canonical = `${siteUrl}${config.canonicalPath}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "WorldDigital.ai",
        url: siteUrl,
        areaServed: ["US", "CA"],
        logo: `${siteUrl}/icons/wdlogo.jpeg`,
        contactPoint: {
          "@type": "ContactPoint",
          email: "support@worlddigital.ai",
          contactType: "customer support",
        },
      },
      {
        "@type": "Service",
        name: config.h1,
        description: config.schemaDescription,
        provider: { "@id": `${siteUrl}/#organization` },
        serviceType: config.schemaType,
        areaServed: [
          { "@type": "Country", name: "United States" },
          { "@type": "Country", name: "Canada" },
        ],
        audience: { "@type": "BusinessAudience", name: "SMBs, SMEs and enterprises" },
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: config.eyebrow, item: canonical },
        ],
      },
      ...(config.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: config.faqs.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <main style={{ background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 20%, #EEF9FF 65%, #DAEEFF 100%)", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute top-10 right-16 w-28 h-28 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(193,58,42,0.15) 0%, transparent 65%)" }} />
        <div className="absolute bottom-4 left-12 w-20 h-20 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(66,133,199,0.40) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: "#C13A2A" }}>{config.eyebrow}</p>
          <h1 className="font-black leading-tight mb-6" style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.75rem)", color: "#111827" }}>
            {config.h1}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-10" style={{ color: "#4B5563", maxWidth: 640, margin: "0 auto 2.5rem" }}>
            {config.intro}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SEOCtaButton
              label="Get Started"
              price={config.price}
              planId={config.planId ?? "subscribe"}
              dashboardPath={config.dashboardPath ?? "/dashboard"}
            />
            <Link
              href="/build"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all hover:opacity-80"
              style={{ background: "white", color: "#111827", border: "1.5px solid #E5EAF2", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              Build Your Stack
            </Link>
          </div>
        </div>
      </section>

      {/* ── PLATFORM SERVICES ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold mb-3" style={{ color: "#2B6CB0" }}>What&apos;s Included</p>
            <h2 className="font-black leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: "#111827" }}>
              Complete {config.platform} management, handled end-to-end
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {config.services.map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-6"
                style={{ background: "white", border: "1px solid #E5EAF2", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="white">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW WE DO IT ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "rgba(255,255,255,0.6)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C13A2A" }}>How It Works</p>
            <h2 className="font-black leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: "#111827" }}>
              AI-powered execution at every step
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.features.map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col">
                <FeatureIcon d={icon} />
                <h3 className="font-bold text-sm mb-2" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-sm font-semibold mb-4" style={{ color: "#2B6CB0" }}>Why WorldDigital.ai</p>
              <h2 className="font-black leading-tight mb-8" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: "#111827" }}>
                Everything a growth-focused business needs
              </h2>
              <ul className="space-y-4">
                {config.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(193,58,42,0.1)" }}>
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#C13A2A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-sm leading-relaxed" style={{ color: "#374151" }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing card */}
            <div
              className="rounded-3xl p-8"
              style={{
                background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
                boxShadow: "0 24px 60px rgba(15,23,42,0.25)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                {config.platform} Management
              </p>
              {config.price ? (
                <>
                  <p className="text-5xl font-black text-white mb-1">{config.price}</p>
                  <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>{config.priceNote}</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-black text-white mb-1">One simple monthly plan</p>
                  <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>No setup fees · cancel anytime</p>
                </>
              )}

              <ul className="space-y-3 mb-8">
                {["AI-generated ad copy & visuals", "Real-time campaign optimization", "Monthly performance reports", "Dedicated account dashboard", "No setup fees, cancel anytime"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="rgba(66,133,199,0.3)" />
                      <path d="M4.5 8l2.5 2.5 4-5" stroke="#60A5FA" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <SEOCtaButton
                label="Subscribe Now"
                price={config.price}
                planId={config.planId ?? "subscribe"}
                dashboardPath={config.dashboardPath ?? "/dashboard"}
              />
              <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                No contracts · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#F7FAFC" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold mb-3" style={{ color: "#2B6CB0" }}>FAQ</p>
            <h2 className="font-black leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: "#111827" }}>
              Questions about {config.platform}?
            </h2>
          </div>
          <FAQAccordion faqs={config.faqs} />
          <div className="text-center mt-8">
            <Link href="/help" className="text-sm font-semibold hover:underline" style={{ color: "#2B6CB0" }}>
              Visit the full Help Center →
            </Link>
          </div>
        </div>
      </section>

      {/* ── INTERNAL LINKS ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C13A2A" }}>Explore More</p>
            <h2 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: "#111827" }}>
              Other platforms we manage
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {config.relatedPages.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "white", color: "#374151", border: "1.5px solid #E5EAF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                {label}
              </Link>
            ))}
          </div>

          {config.blogLinks.length > 0 && (
            <>
              <div className="text-center mb-6">
                <p className="text-sm font-semibold" style={{ color: "#2B6CB0" }}>From the Blog</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {config.blogLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:underline"
                    style={{ color: "#2B6CB0" }}
                  >
                    {label} →
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CONTACT CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: "#C13A2A" }}>Ready to grow?</p>
          <h2 className="font-black mb-5" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: "#111827" }}>
            Launch your {config.platform} campaigns today
          </h2>
          <p className="text-base mb-8" style={{ color: "#4B5563" }}>
            Questions? Reach our team at{" "}
            <a href="mailto:support@worlddigital.ai" className="font-semibold hover:underline" style={{ color: "#2B6CB0" }}>
              support@worlddigital.ai
            </a>
            {" "}— we typically respond within one business day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SEOCtaButton
              label="Subscribe Now"
              price={config.price}
              planId={config.planId ?? "subscribe"}
              dashboardPath={config.dashboardPath ?? "/dashboard"}
            />
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all hover:opacity-80"
              style={{ background: "white", color: "#111827", border: "1.5px solid #E5EAF2", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              View All Plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
