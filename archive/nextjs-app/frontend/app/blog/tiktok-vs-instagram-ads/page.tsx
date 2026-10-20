import type { Metadata } from "next";
import Link from "next/link";
import { renderBody } from "@/components/blog/BlogPostBody";

export const metadata: Metadata = {
  title: "TikTok Ads vs Instagram Ads: Which is Right for Your Business?",
  description: "Comparing TikTok Ads and Instagram Ads for SMBs in 2026. We break down audience differences, ad formats, costs, and which platform delivers better ROI for your business type.",
  alternates: { canonical: "https://worlddigital.ai/blog/tiktok-vs-instagram-ads", languages: { "en-US": "https://worlddigital.ai/blog/tiktok-vs-instagram-ads", "en-CA": "https://worlddigital.ai/blog/tiktok-vs-instagram-ads", "x-default": "https://worlddigital.ai/blog/tiktok-vs-instagram-ads" } },
  openGraph: {
    title: "TikTok Ads vs Instagram Ads: Which is Right for Your Business?",
    description: "An honest comparison of TikTok Ads vs Instagram Ads — audience, formats, costs, and which wins for your specific business goals.",
    url: "https://worlddigital.ai/blog/tiktok-vs-instagram-ads",
    type: "article",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: "TikTok Ads vs Instagram Ads: Which is Right for Your Business?",
  description: "Comparing TikTok Ads and Instagram Ads for SMBs in 2026 — audience, formats, costs, and which platform delivers better ROI.",
  author: { "@type": "Organization", name: "WorldDigital.ai", url: "https://worlddigital.ai" },
  publisher: {
    "@type": "Organization",
    name: "WorldDigital.ai",
    logo: { "@type": "ImageObject", url: "https://worlddigital.ai/icons/wdlogo.jpeg" },
  },
  datePublished: "2026-05-07",
  dateModified: "2026-05-09",
  url: "https://worlddigital.ai/blog/tiktok-vs-instagram-ads",
  image: "https://worlddigital.ai/opengraph-image",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://worlddigital.ai/blog/tiktok-vs-instagram-ads" },
};

const comparisonData = [
  { metric: "Monthly Active Users", tiktok: "1B+", instagram: "2B+" },
  { metric: "Primary Demographic", tiktok: "Gen Z (18–24)", instagram: "Millennials (25–34)" },
  { metric: "Average CPM", tiktok: "$3–$10", instagram: "$5–$14" },
  { metric: "Average CTR", tiktok: "0.84%", instagram: "0.52%" },
  { metric: "Video Ad Length", tiktok: "5–60 seconds", instagram: "3–60 seconds" },
  { metric: "E-Commerce Tools", tiktok: "TikTok Shop", instagram: "Shopping / Catalog" },
  { metric: "B2B Suitability", tiktok: "Low–Medium", instagram: "Medium" },
  { metric: "Creative Barrier", tiktok: "Higher (video-first)", instagram: "Lower (images work)" },
];

const sections = [
  {
    heading: "Audience: Who Are You Reaching?",
    body: `TikTok's primary audience is Gen Z — users aged 18–24 make up the largest segment, followed by younger millennials (25–34). The platform skews younger, more entertainment-focused, and historically stronger in urban markets.

Instagram's audience skews slightly older — the 25–34 demographic is the platform's largest segment, followed by 18–24. Instagram also has stronger penetration among women, higher-income households, and urban professionals. For lifestyle brands, e-commerce, and premium consumer products, Instagram's demographic often converts at higher order values.

**The takeaway**: If your customer is 18–28 and trend-driven, TikTok first. If your customer is 25–45 and quality-conscious, Instagram first.`,
  },
  {
    heading: "Ad Formats: What Creative Works Best?",
    body: `TikTok is video-first and algorithm-driven. In-Feed ads that look and feel like organic TikTok content perform significantly better than ads that feel produced or commercial. This means you need authentic, fast-paced vertical video with a compelling hook in the first 2 seconds.

Instagram offers more format flexibility. Reels ads (video) perform well, but static carousel ads, single images, and Stories ads also drive strong results — particularly for e-commerce, where product-focused creative outperforms lifestyle content.

**The takeaway**: TikTok demands genuine short-form video. Instagram is more forgiving — quality images and carousels work alongside Reels.`,
  },
  {
    heading: "Cost: Where Does Your Budget Go Further?",
    body: `TikTok generally has lower CPMs ($3–$10) than Instagram ($5–$14), but this varies significantly by industry, audience, and campaign objective. TikTok's lower CPMs mean broader reach per dollar for awareness campaigns.

However, Instagram typically delivers higher conversion rates for direct-response objectives — particularly for shopping and lead generation. The higher CPM is often offset by better purchase intent from Instagram's more purchase-ready audience.

**The takeaway**: TikTok for cheap reach and awareness. Instagram for conversion campaigns where purchase intent matters more than raw volume.`,
  },
  {
    heading: "E-Commerce: Shopping Features Compared",
    body: `Both platforms have invested heavily in native shopping experiences. TikTok Shop allows users to purchase directly within the TikTok app from shoppable video content — a major shift for e-commerce brands targeting Gen Z shoppers.

Instagram Shopping integrates with your product catalog for shoppable posts, collection ads, and product tags in Reels and Stories. Instagram's shopping infrastructure is more mature and trusted by users across a wider age range.

**The takeaway**: For younger consumer brands with strong video content, TikTok Shop is worth testing. For established e-commerce brands, Instagram Shopping remains the stronger bet for now.`,
  },
  {
    heading: "Our Recommendation: Why Not Both?",
    body: `The most effective approach for most growing businesses is to run both platforms with distinct strategies:

- **TikTok**: Awareness and reach campaigns targeting 18–30 year olds with video content at lower CPMs
- **Instagram**: Retargeting, conversion, and shopping campaigns targeting 25–45 year olds with multiple ad formats

WorldDigital.ai manages both platforms from a single dashboard — with separate campaign strategies, audiences, and creative tailored to each platform's unique requirements. You don't have to choose; you can scale into both as your budget allows.`,
  },
];

export default function TikTokVsInstagramAdsPage() {
  return (
    <main style={{ background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 15%, white 40%)", minHeight: "100vh" }}>
      <article className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium mb-8 hover:underline" style={{ color: "#2B6CB0" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        <header className="mb-12">
          <p className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: "#C13A2A" }}>Platform Comparison</p>
          <h1 className="font-black leading-tight mb-6" style={{ fontSize: "clamp(1.875rem, 4.5vw, 2.875rem)", color: "#111827" }}>
            TikTok Ads vs Instagram Ads: Which is Right for Your Business?
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "#4B5563" }}>
            Both platforms reach enormous audiences, but they serve very different business goals. Here&apos;s the honest comparison — including when to use one, the other, or both.
          </p>
          <div className="flex items-center gap-4 mt-6 pt-6" style={{ borderTop: "1px solid #E5EAF2" }}>
            <img src="/logo.jpeg" alt="WorldDigital.ai" width={40} height={40} style={{ borderRadius: "50%", objectFit: "contain", background: "white", padding: "2px" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>WorldDigital.ai Team</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>May 7, 2026 · 9 min read</p>
            </div>
          </div>
        </header>

        <div className="mb-12 rounded-2xl overflow-hidden" style={{ border: "1px solid #E5EAF2", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 text-sm font-bold py-3 px-5" style={{ background: "linear-gradient(to right,#0F172A,#1E3A5F)", color: "white" }}>
            <span>Metric</span><span className="text-center">TikTok</span><span className="text-center">Instagram</span>
          </div>
          {comparisonData.map((row, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 text-sm px-5 py-3.5" style={{ background: i % 2 === 0 ? "white" : "#F8FAFC", borderTop: "1px solid #E5EAF2" }}>
              <span className="font-medium" style={{ color: "#374151" }}>{row.metric}</span>
              <span className="text-center font-semibold" style={{ color: "#2B6CB0" }}>{row.tiktok}</span>
              <span className="text-center font-semibold" style={{ color: "#C13A2A" }}>{row.instagram}</span>
            </div>
          ))}
        </div>

        {sections.map((s) => (
          <div key={s.heading} className="mb-10">
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)", color: "#111827" }}>{s.heading}</h2>
            <div className="space-y-4">
              {renderBody(s.body)}
            </div>
          </div>
        ))}

        <div className="mt-16 rounded-3xl p-8 text-center" style={{ background: "linear-gradient(135deg,#0F172A,#1E3A5F)" }}>
          <p className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Manage both platforms</p>
          <h3 className="text-2xl font-black text-white mb-4">Run TikTok and Instagram ads with WorldDigital.ai</h3>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>No agency overhead, no contracts.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/tiktok-marketing" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:opacity-90" style={{ background: "#C13A2A" }}>TikTok Marketing →</Link>
            <Link href="/instagram-marketing" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all hover:opacity-80" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>Instagram Marketing →</Link>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-sm font-semibold mb-4" style={{ color: "#2B6CB0" }}>Related Reading</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: "/blog/snapchat-marketing-strategies", label: "Best Snapchat Marketing Strategies for Small Businesses" },
              { href: "/blog/why-businesses-need-omnichannel-ads", label: "Why Businesses Need Multi-Platform Advertising" },
              { href: "/tiktok-ads-agency", label: "TikTok Ads Agency — WorldDigital.ai" },
              { href: "/instagram-marketing", label: "Instagram Marketing — WorldDigital.ai" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="block p-4 rounded-2xl text-sm font-medium hover:opacity-80 transition-all" style={{ background: "white", border: "1px solid #E5EAF2", color: "#374151", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                {label} →
              </Link>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
