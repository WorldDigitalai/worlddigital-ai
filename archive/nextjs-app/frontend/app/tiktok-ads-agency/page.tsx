import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "TikTok Ads Agency — AI-Managed TikTok Ads",
  description: "TikTok video ad creation, targeting, optimization and reporting run by AI. Built for SMBs, SMEs and enterprises reaching audiences across the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/tiktok-ads-agency", languages: { "en-US": "https://worlddigital.ai/tiktok-ads-agency", "en-CA": "https://worlddigital.ai/tiktok-ads-agency", "x-default": "https://worlddigital.ai/tiktok-ads-agency" } },
  openGraph: {
    title: "TikTok Ads Agency — AI-Managed TikTok Ads | WorldDigital.ai",
    description: "TikTok video ad creation, targeting, optimization and reporting run by AI. Built for SMBs, SMEs and enterprises reaching audiences across the US and Canada.",
    url: "https://worlddigital.ai/tiktok-ads-agency",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "TikTok Ads Agency — AI-Managed TikTok Ads | WorldDigital.ai",
    description: "TikTok video ad creation, targeting, optimization and reporting run by AI. Built for SMBs, SMEs and enterprises reaching audiences across the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "TikTok Ads Agency That Delivers Real Business Results",
  eyebrow: "Full-Service TikTok Ads Management",
  intro: "Managing TikTok ads effectively requires constant creative testing, algorithmic understanding, and daily bid adjustments. WorldDigital.ai handles all of it using AI — giving you the output of a full TikTok ads team at a fraction of the traditional agency cost.",
  platform: "TikTok",
  price: "",
  priceNote: "full-service management · no contracts",
  canonicalPath: "/tiktok-ads-agency",
  schemaType: "TikTok Advertising Agency",
  schemaDescription: "TikTok video ad creation, targeting, optimization and reporting run by AI. Built for SMBs, SMEs and enterprises reaching audiences across the US and Canada.",
  services: [
    { title: "TikTok Ads Manager Setup", desc: "Full Business Center and Ads Manager configuration, Pixel installation, and event tracking so your campaigns are built on a solid technical foundation." },
    { title: "Video Ad Creative Strategy", desc: "Trend research, hook analysis, and creative briefs designed specifically for TikTok's algorithm and audience behavior patterns." },
    { title: "Audience Targeting & Lookalikes", desc: "Interest-based, behavioral, and custom audiences built from your customer data — plus TikTok lookalike modeling to reach new prospects efficiently." },
    { title: "Campaign Scaling & Budget Management", desc: "As campaigns perform, we systematically scale winning ad sets while pausing underperformers to maximize your return on ad spend." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Competitive Research", desc: "We analyze your top competitors' TikTok creative strategies to identify gaps and opportunities before launching your campaigns." },
    { icon: ICON_AI, title: "AI Creative Iteration", desc: "Multiple creative variants are produced and tested simultaneously — the algorithm rewards fresh content, and we keep it flowing." },
    { icon: ICON_OPTIMIZE, title: "Smart Bidding", desc: "Cost Cap, Lowest Cost, and Target CPA bidding strategies are tested and adjusted to reduce your cost-per-acquisition over time." },
    { icon: ICON_REPORT, title: "ROAS Reporting", desc: "We measure return on ad spend, cost per click, video completion rate, and conversion events — reported monthly in plain English." },
  ],
  benefits: [
    "TikTok is the #1 most-downloaded app globally — reach your audience where they spend the most time",
    "AI generates fresh creative hooks weekly to prevent ad fatigue",
    "Retargeting campaigns that bring back users who engaged with your videos",
    "TikTok Shop and catalog ads supported for e-commerce businesses",
    "No minimum ad spend requirement from WorldDigital.ai (TikTok's own minimum applies)",
    "All ad accounts, pixels, and data remain under your ownership",
    "Onboarding completed in under 48 hours — campaigns live within a week",
  ],
  faqs: [
    { q: "How is a TikTok ads agency different from just boosting posts?", a: "Boosting posts is the most basic form of TikTok advertising. A managed approach involves proper campaign structure (Awareness → Consideration → Conversion), custom audience building, split testing, pixel tracking, and continuous creative optimization — the difference between guessing and growing." },
    { q: "Will TikTok ads work for my B2B business?", a: "TikTok skews toward B2C, but it's increasingly being used by B2B companies targeting decision-makers in their 20s and 30s. For most B2B companies, we'd recommend pairing TikTok with LinkedIn Ads to cover both channels." },
    { q: "How quickly can I expect to see results from TikTok ads?", a: "TikTok's algorithm typically needs 7–14 days to exit the 'learning phase' and stabilize performance. Most clients see meaningful engagement metrics within the first month, with conversion performance improving through month two and three as we optimize." },
    { q: "Do you handle the creative production entirely, or do I need to provide content?", a: "We provide complete creative briefs and AI-generated scripts. For best results, we recommend you or your team record simple, authentic 15–30 second clips using our brief as a guide. We can also use stock footage or existing product imagery when original footage isn't available." },
    { q: "What reporting do I receive as a TikTok ads client?", a: "You receive a monthly performance report covering impressions, video views, click-through rate, cost per click, conversions, and ROAS. You also have 24/7 access to your WorldDigital.ai dashboard for live campaign metrics." },
  ],
  relatedPages: [
    { href: "/tiktok-marketing", label: "TikTok Marketing" },
    { href: "/snapchat-ads-agency", label: "Snapchat Ads Agency" },
    { href: "/instagram-marketing", label: "Instagram Marketing" },
    { href: "/youtube-shorts-marketing", label: "YouTube Shorts Marketing" },
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Automation" },
  ],
  blogLinks: [
    { href: "/blog/tiktok-vs-instagram-ads", label: "TikTok Ads vs Instagram Ads" },
    { href: "/blog/how-ai-marketing-automation-works", label: "How AI Marketing Automation Works" },
  ],
};

export default function TikTokAdsAgencyPage() {
  return <SEOLandingPage config={config} />;
}
