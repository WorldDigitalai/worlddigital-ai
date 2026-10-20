import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "YouTube Shorts Marketing for SMBs & Enterprises",
  description: "Reach YouTube's 2B+ users with AI-produced Shorts ads and full campaign management. For SMBs, SMEs and enterprises advertising across the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/youtube-shorts-marketing", languages: { "en-US": "https://worlddigital.ai/youtube-shorts-marketing", "en-CA": "https://worlddigital.ai/youtube-shorts-marketing", "x-default": "https://worlddigital.ai/youtube-shorts-marketing" } },
  openGraph: {
    title: "YouTube Shorts Marketing for SMBs & Enterprises | WorldDigital.ai",
    description: "Reach YouTube's 2B+ users with AI-produced Shorts ads and full campaign management. For SMBs, SMEs and enterprises advertising across the US and Canada.",
    url: "https://worlddigital.ai/youtube-shorts-marketing",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "YouTube Shorts Marketing for SMBs & Enterprises | WorldDigital.ai",
    description: "Reach YouTube's 2B+ users with AI-produced Shorts ads and full campaign management. For SMBs, SMEs and enterprises advertising across the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "YouTube Shorts Marketing That Grows Your Brand on the World's Biggest Video Platform",
  eyebrow: "AI-Powered YouTube Shorts Advertising",
  intro: "YouTube Shorts now generates 70 billion daily views — and businesses that advertise here reach audiences during high-attention video consumption moments. WorldDigital.ai manages your YouTube Shorts ads and video campaigns, using AI to create compelling short-form content without a production team.",
  platform: "YouTube",
  price: "",
  priceNote: "per month · includes YouTube + Google Display · cancel anytime",
  canonicalPath: "/youtube-shorts-marketing",
  schemaType: "YouTube Shorts Marketing Service",
  schemaDescription: "Reach YouTube's 2B+ users with AI-produced Shorts ads and full campaign management. For SMBs, SMEs and enterprises advertising across the US and Canada.",
  services: [
    { title: "YouTube Shorts Ads Management", desc: "Full management of YouTube Shorts ad campaigns through Google Ads — targeting, bidding, creative rotation, and continuous performance optimization." },
    { title: "Short-Form Video Ad Creative", desc: "AI-written 15–60 second video scripts with hook, value proposition, and CTA designed specifically for YouTube Shorts' vertical viewing format." },
    { title: "YouTube In-Stream & Discovery Ads", desc: "Skippable and non-skippable pre-roll ads placed before relevant YouTube videos — reaching viewers already engaged with content in your industry." },
    { title: "YouTube Analytics & Reporting", desc: "Monthly performance reports covering views, watch time, view-through rate, click-through rate, and conversions attributed to your YouTube campaigns." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Video Content Strategy", desc: "We identify the right video lengths, formats, and topics for your audience — Shorts for awareness, longer pre-roll for consideration and conversion." },
    { icon: ICON_AI, title: "AI Script Production", desc: "Shorts scripts written by AI with attention-grabbing hooks, concise value messaging, and clear calls-to-action designed for mobile viewers." },
    { icon: ICON_OPTIMIZE, title: "Audience & Placement Targeting", desc: "We target by audience interest, search intent, competitor channels, and remarketing lists — reaching the right viewers at the right time." },
    { icon: ICON_REPORT, title: "Brand Lift Measurement", desc: "Beyond clicks, we track brand awareness lift, search volume increases, and view-through conversions to measure YouTube's full business impact." },
  ],
  benefits: [
    "YouTube Shorts reaches 70 billion daily views — one of the fastest-growing ad placements available",
    "Connected to Google Ads — use your existing Google account and conversion tracking",
    "YouTube reaches 2B+ logged-in users monthly across all content types",
    "Shorts ads cannot be skipped — guaranteed impressions for brand messaging",
    "Interest and topic targeting puts ads next to relevant content your audience watches",
    "Remarketing to past website visitors and YouTube channel subscribers",
    "Lower CPMs than Facebook and TikTok for many audience segments",
  ],
  faqs: [
    { q: "What's the difference between YouTube Shorts ads and regular YouTube ads?", a: "YouTube Shorts ads appear within the Shorts feed (vertical, <60 seconds, non-skippable). Regular YouTube ads include skippable and non-skippable pre-roll and mid-roll ads on standard horizontal videos. We manage both formats depending on your campaign objectives." },
    { q: "Do I need to film video content for YouTube Shorts ads?", a: "We provide complete AI-generated scripts and briefs. Simple clips filmed on a smartphone using our brief as a guide work well for Shorts. Alternatively, we can create text-based motion graphic concepts using your product images and brand colors." },
    { q: "How does YouTube advertising compare to TikTok for reach?", a: "YouTube has a larger total user base (2B+) and higher average session time. TikTok has stronger engagement among 18–25 year olds and a more viral content algorithm. The best approach depends on your target demographic — we often recommend both." },
    { q: "What's the minimum budget for YouTube advertising?", a: "Google Ads (which serves YouTube) has a minimum of $1/day per campaign. For meaningful reach and data collection, we recommend $300–$800/month in YouTube ad spend alongside our management fee." },
    { q: "Can YouTube ads drive sales directly, or is it just for brand awareness?", a: "Both. YouTube's In-Feed discovery ads and Shorts ads drive direct website traffic and conversions. Pre-roll ads work well for awareness and consideration. We structure campaigns across the full funnel to move viewers from awareness to purchase." },
  ],
  relatedPages: [
    { href: "/google-ads-agency", label: "Google Ads Agency" },
    { href: "/tiktok-marketing", label: "TikTok Marketing" },
    { href: "/instagram-marketing", label: "Instagram Marketing" },
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
    { href: "/ai-seo-agency", label: "AI SEO Agency" },
  ],
  blogLinks: [
    { href: "/blog/youtube-shorts-marketing-guide", label: "YouTube Shorts Marketing Guide for Businesses" },
    { href: "/blog/tiktok-vs-instagram-ads", label: "TikTok Ads vs Instagram Ads" },
  ],
};

export default function YouTubeShortsMarketingPage() {
  return <SEOLandingPage config={config} />;
}
