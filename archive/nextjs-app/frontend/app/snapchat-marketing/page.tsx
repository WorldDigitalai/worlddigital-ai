import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "Snapchat Marketing for SMBs & Enterprises",
  description: "Reach Gen Z and millennials with AI-built Snapchat Story ads, precise targeting and full campaign management. For businesses across the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/snapchat-marketing", languages: { "en-US": "https://worlddigital.ai/snapchat-marketing", "en-CA": "https://worlddigital.ai/snapchat-marketing", "x-default": "https://worlddigital.ai/snapchat-marketing" } },
  openGraph: {
    title: "Snapchat Marketing for SMBs & Enterprises | WorldDigital.ai",
    description: "Reach Gen Z and millennials with AI-built Snapchat Story ads, precise targeting and full campaign management. For businesses across the US and Canada.",
    url: "https://worlddigital.ai/snapchat-marketing",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "Snapchat Marketing for SMBs & Enterprises | WorldDigital.ai",
    description: "Reach Gen Z and millennials with AI-built Snapchat Story ads, precise targeting and full campaign management. For businesses across the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "Snapchat Marketing for Small & Medium Businesses",
  eyebrow: "AI-Powered Snapchat Marketing",
  intro: "WorldDigital.ai automates Snapchat marketing for growing businesses — from AI-generated Story ads to Gen Z audience targeting and real-time campaign optimization. Agency-quality results without the agency price tag.",
  platform: "Snapchat",
  price: "",
  priceNote: "per month · no setup fees · cancel anytime",
  canonicalPath: "/snapchat-marketing",
  schemaType: "Snapchat Marketing Service",
  schemaDescription: "Reach Gen Z and millennials with AI-built Snapchat Story ads, precise targeting and full campaign management. For businesses across the US and Canada.",
  services: [
    { title: "Snapchat Marketing for Local Businesses", desc: "Geo-targeted Snap campaigns that put your brand in front of nearby customers who are actively using the platform every day." },
    { title: "Snapchat Ads Management", desc: "Complete management of your Snap Ad account — creatives, budgets, bidding strategies, and continuous optimizations included." },
    { title: "AI Snapchat Campaign Creation", desc: "Our AI writes ad copy, selects the right formats (Story, Collection, Dynamic), and generates visuals tailored to Snapchat's audience." },
    { title: "Snapchat Analytics & Reporting", desc: "Clear monthly reports covering impressions, swipe-ups, CPM, and conversion data — no spreadsheet deciphering required." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Audience Strategy", desc: "We define your ideal Snapchat audience by age, interest, behavior, and location before spending a single dollar." },
    { icon: ICON_AI, title: "AI Creative Production", desc: "Vertical video concepts, static Story ads, and AR-friendly ideas generated automatically by our AI — Snapchat-native by design." },
    { icon: ICON_OPTIMIZE, title: "Daily Optimization", desc: "Bids, placements, and creative rotation are adjusted continuously based on real-time performance signals from your campaigns." },
    { icon: ICON_REPORT, title: "Monthly Reporting", desc: "Every month you receive a plain-language performance report with key metrics and recommendations for what to do next." },
  ],
  benefits: [
    "Reach Snapchat's 800M+ monthly active users, including the 18–34 demographic",
    "Story and Snap Ads with AI-written copy that feels native — not forced",
    "Geo-targeting for local businesses and national targeting for e-commerce brands",
    "Dynamic retargeting ads that re-engage users who visited your website",
    "No creative agency, no freelancers — our AI handles visuals and copy end-to-end",
    "Month-to-month pricing with zero setup fees and no long-term contracts",
    "All campaign activity visible from your WorldDigital.ai dashboard 24/7",
  ],
  faqs: [
    { q: "Is Snapchat advertising worth it for small businesses?", a: "Absolutely. Snapchat delivers strong results for local businesses and e-commerce brands targeting 18–34 year olds. With Story ads and geo-targeting, even modest budgets generate meaningful awareness and conversions when campaigns are set up correctly — which is exactly what we do." },
    { q: "What kinds of Snapchat ads does WorldDigital.ai create?", a: "We manage all standard Snap ad formats: Single Image or Video ads, Story ads, Collection ads for e-commerce, and Dynamic ads for retargeting. Our AI selects the best format for your goal — brand awareness, website traffic, or direct conversions." },
    { q: "How long does it take to launch a Snapchat campaign?", a: "After you subscribe and complete your business profile, your first Snapchat campaign is typically live within 3–5 business days. Our AI handles creative production and targeting setup automatically." },
    { q: "Can I run Snapchat ads alongside other platforms?", a: "Yes. WorldDigital.ai is built for multi-platform advertising. You can run Snapchat alongside Google, Meta, TikTok, or any other supported platform — all managed from one dashboard." },
    { q: "Do I need a Snapchat Business account first?", a: "We'll walk you through connecting your Snapchat Business account during onboarding. If you don't have one yet, we'll help you set it up. The process takes about 10 minutes." },
  ],
  relatedPages: [
    { href: "/snapchat-ads-agency", label: "Snapchat Ads Agency" },
    { href: "/tiktok-marketing", label: "TikTok Marketing" },
    { href: "/instagram-marketing", label: "Instagram Marketing" },
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/google-ads-agency", label: "Google Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
  ],
  blogLinks: [
    { href: "/blog/snapchat-marketing-strategies", label: "Best Snapchat Marketing Strategies for Small Businesses" },
    { href: "/blog/tiktok-vs-instagram-ads", label: "TikTok Ads vs Instagram Ads" },
  ],
};

export default function SnapchatMarketingPage() {
  return <SEOLandingPage config={config} />;
}
