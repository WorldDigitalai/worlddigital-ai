import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "Snapchat Ads Agency — AI-Managed Snap Ads",
  description: "Full-service Snapchat ad management: creative, audience targeting and optimization by AI. For SMBs, SMEs and enterprises across the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/snapchat-ads-agency", languages: { "en-US": "https://worlddigital.ai/snapchat-ads-agency", "en-CA": "https://worlddigital.ai/snapchat-ads-agency", "x-default": "https://worlddigital.ai/snapchat-ads-agency" } },
  openGraph: {
    title: "Snapchat Ads Agency — AI-Managed Snap Ads | WorldDigital.ai",
    description: "Full-service Snapchat ad management: creative, audience targeting and optimization by AI. For SMBs, SMEs and enterprises across the US and Canada.",
    url: "https://worlddigital.ai/snapchat-ads-agency",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "Snapchat Ads Agency — AI-Managed Snap Ads | WorldDigital.ai",
    description: "Full-service Snapchat ad management: creative, audience targeting and optimization by AI. For SMBs, SMEs and enterprises across the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "Snapchat Ads Agency Built for Growing Businesses",
  eyebrow: "AI-Powered Snapchat Ads Management",
  intro: "Traditional Snapchat ad agencies charge $2,000–$5,000 per month and require lengthy contracts. WorldDigital.ai delivers the same expert-level Snap campaign management using AI — at a fraction of the cost, with no lock-in.",
  platform: "Snapchat",
  price: "",
  priceNote: "full-service management · cancel anytime",
  canonicalPath: "/snapchat-ads-agency",
  schemaType: "Snapchat Advertising Agency",
  schemaDescription: "Full-service Snapchat ad management: creative, audience targeting and optimization by AI. For SMBs, SMEs and enterprises across the US and Canada.",
  services: [
    { title: "Snap Ad Account Setup & Management", desc: "From Business Manager configuration to pixel installation — we handle the entire technical setup so you can focus on your business." },
    { title: "Snap Ad Creative Production", desc: "Our AI generates platform-native vertical video concepts, static Story ads, and Collection ad layouts — all optimized for Snapchat's ad formats." },
    { title: "Audience Targeting & Segmentation", desc: "We build custom audiences using demographics, interests, lookalikes, and retargeting to ensure every impression reaches the right person." },
    { title: "Budget Optimization & Bid Management", desc: "Daily bid adjustments and budget reallocation based on which ad sets are generating the lowest cost-per-result." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Account Audit & Strategy", desc: "We start with a full audit of your goals, competitors, and target audience before building a campaign structure designed to convert." },
    { icon: ICON_AI, title: "AI Creative at Scale", desc: "Multiple ad variants are generated and tested simultaneously — so the best-performing creative always gets the most spend." },
    { icon: ICON_OPTIMIZE, title: "Continuous A/B Testing", desc: "Headlines, visuals, calls-to-action, and audience segments are tested and rotated automatically to improve results month over month." },
    { icon: ICON_REPORT, title: "Performance Accountability", desc: "You receive transparent monthly reports showing spend, reach, conversions, and exactly what was done to improve performance." },
  ],
  benefits: [
    "Agency-quality Snapchat management without the $3,000+/mo agency price tag",
    "AI generates and tests multiple creative variants simultaneously",
    "Lookalike and retargeting audiences built from your existing customer data",
    "Snap Pixel installation and conversion tracking included",
    "No long-term contracts — scale up or cancel month to month",
    "Single dashboard showing all your ad platform performance in one place",
    "Dedicated onboarding and support via support@worlddigital.ai",
  ],
  faqs: [
    { q: "What makes WorldDigital.ai different from a traditional Snapchat ads agency?", a: "Traditional agencies charge $2,000–$5,000/month in management fees alone, before ad spend. WorldDigital.ai uses AI to automate the same strategic and creative work — with no setup fees, no retainer contracts, and no minimum ad spend requirements." },
    { q: "Do you manage the ad spend budget, or just the management?", a: "Your ad spend goes directly to Snapchat — WorldDigital.ai charges only for campaign management. This means you always have full visibility and control over how much you're spending on actual ads." },
    { q: "Can you manage Snapchat ads for an e-commerce business?", a: "Yes. We specialize in Snapchat Collection ads and Dynamic ads for e-commerce businesses, connecting your product catalog to Snapchat's audience for retargeting and prospecting campaigns." },
    { q: "How do you measure Snapchat ad performance?", a: "We track swipe-up rate, CPM, cost-per-swipe, conversion rate (via Snap Pixel), and return on ad spend (ROAS) where conversion tracking is configured. All metrics are included in your monthly report." },
    { q: "What's the minimum ad spend I should allocate for Snapchat?", a: "We recommend a minimum of $500–$1,000/month in Snapchat ad spend to generate statistically meaningful data for optimization. Lower budgets can work for brand awareness but will limit conversion campaign performance." },
  ],
  relatedPages: [
    { href: "/snapchat-marketing", label: "Snapchat Marketing" },
    { href: "/tiktok-ads-agency", label: "TikTok Ads Agency" },
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/facebook-ads-management", label: "Facebook Ads Management" },
    { href: "/google-ads-agency", label: "Google Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
  ],
  blogLinks: [
    { href: "/blog/snapchat-marketing-strategies", label: "Best Snapchat Marketing Strategies for Small Businesses" },
    { href: "/blog/why-businesses-need-omnichannel-ads", label: "Why Businesses Need Multi-Platform Advertising" },
  ],
};

export default function SnapchatAdsAgencyPage() {
  return <SEOLandingPage config={config} />;
}
