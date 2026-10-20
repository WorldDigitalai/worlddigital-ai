import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "Meta Ads Agency — Facebook & Instagram Ads",
  description: "AI-managed Facebook and Instagram advertising: creative, audiences and optimization in one place. For SMBs, SMEs and enterprises across the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/meta-ads-agency", languages: { "en-US": "https://worlddigital.ai/meta-ads-agency", "en-CA": "https://worlddigital.ai/meta-ads-agency", "x-default": "https://worlddigital.ai/meta-ads-agency" } },
  openGraph: {
    title: "Meta Ads Agency — Facebook & Instagram Ads | WorldDigital.ai",
    description: "AI-managed Facebook and Instagram advertising: creative, audiences and optimization in one place. For SMBs, SMEs and enterprises across the US and Canada.",
    url: "https://worlddigital.ai/meta-ads-agency",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "Meta Ads Agency — Facebook & Instagram Ads | WorldDigital.ai",
    description: "AI-managed Facebook and Instagram advertising: creative, audiences and optimization in one place. For SMBs, SMEs and enterprises across the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "Meta Ads Agency for Facebook & Instagram Advertising",
  eyebrow: "Full-Service Meta Ads Management",
  intro: "Facebook and Instagram together reach 3.3 billion people monthly. WorldDigital.ai manages your Meta advertising across both platforms — creating campaigns, testing audiences, generating creatives, and optimizing for conversions — all powered by AI.",
  platform: "Meta",
  price: "",
  priceNote: "covers both Facebook & Instagram · cancel anytime",
  canonicalPath: "/meta-ads-agency",
  schemaType: "Meta Advertising Agency",
  schemaDescription: "AI-managed Facebook and Instagram advertising: creative, audiences and optimization in one place. For SMBs, SMEs and enterprises across the US and Canada.",
  services: [
    { title: "Meta Ads for Local Businesses", desc: "Hyper-local Facebook and Instagram campaigns targeting customers within specific zip codes, cities, or radius ranges around your location." },
    { title: "Facebook & Instagram Ads Management", desc: "End-to-end Meta Ads Manager management covering campaign setup, ad sets, creative testing, and daily optimization across both platforms." },
    { title: "AI Meta Ad Creative Production", desc: "Carousel ads, single image ads, Reels ads, and Stories ads — our AI generates copy and visual concepts in Meta's most-effective formats." },
    { title: "Meta Analytics & Reporting", desc: "Monthly breakdowns of reach, CPM, ROAS, link clicks, and lead generation performance across Facebook and Instagram together." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Meta Pixel & CAPI Setup", desc: "We configure Meta Pixel and Conversion API (CAPI) to capture conversion signals accurately, even in a privacy-first browsing environment." },
    { icon: ICON_AI, title: "AI Creative Variants", desc: "Multiple ad copy variants and visual concepts are tested simultaneously so the top-performing combination always gets the most budget." },
    { icon: ICON_OPTIMIZE, title: "Funnel-Based Campaigns", desc: "We build separate campaigns for Awareness, Consideration, and Conversion — moving prospects through your funnel systematically." },
    { icon: ICON_REPORT, title: "Attribution Reporting", desc: "Understand which campaigns, audiences, and placements are driving real business outcomes — clicks, leads, purchases, and phone calls." },
  ],
  benefits: [
    "Reach Facebook's 2B+ daily active users and Instagram's 2B+ monthly active users from one campaign",
    "Lookalike audiences built from your customer list for high-quality prospecting",
    "Dynamic product ads for e-commerce that automatically promote relevant items to each user",
    "Retargeting campaigns that re-engage website visitors, video viewers, and page followers",
    "Advantage+ AI campaigns configured and monitored by our team",
    "No setup fees, no creative costs, no hidden charges — one flat monthly rate",
    "Your ad accounts stay 100% under your ownership at all times",
  ],
  faqs: [
    { q: "Does one Meta plan cover both Facebook and Instagram ads?", a: "Yes. Meta's advertising platform manages both Facebook and Instagram from a single Ads Manager. Your Meta plan covers management of campaigns running across both platforms simultaneously." },
    { q: "How does WorldDigital.ai handle the iOS privacy changes affecting Meta ads?", a: "We configure both Meta Pixel and Meta's Conversion API (CAPI) together, which significantly improves attribution accuracy in a post-iOS 14 world. We also use Advantage+ audiences and privacy-compliant targeting methods." },
    { q: "What types of Meta ads do you manage?", a: "We manage all standard Meta ad formats: single image, single video, carousel, collection, Instant Experience, Reels ads, Stories ads, and lead generation forms. Format selection is driven by your campaign objective and audience." },
    { q: "Can you help with Meta ads for a new business with no existing audience?", a: "Absolutely. We start with interest-based and demographic targeting to build initial awareness, then layer retargeting and lookalike audiences as your pixel collects data — typically within 30–60 days." },
    { q: "What results can I realistically expect from Meta ads?", a: "Results vary by industry, audience, and ad spend. Most clients see improved CPM and click-through rates within 60 days as our AI tests and optimizes creative. We're transparent about expectations during onboarding and never promise specific ROAS guarantees." },
  ],
  relatedPages: [
    { href: "/facebook-ads-management", label: "Facebook Ads Management" },
    { href: "/instagram-marketing", label: "Instagram Marketing" },
    { href: "/google-ads-agency", label: "Google Ads Agency" },
    { href: "/tiktok-ads-agency", label: "TikTok Ads Agency" },
    { href: "/snapchat-ads-agency", label: "Snapchat Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
  ],
  blogLinks: [
    { href: "/blog/tiktok-vs-instagram-ads", label: "TikTok Ads vs Instagram Ads" },
    { href: "/blog/why-businesses-need-omnichannel-ads", label: "Why Businesses Need Multi-Platform Advertising" },
  ],
};

export default function MetaAdsAgencyPage() {
  return <SEOLandingPage config={config} />;
}
