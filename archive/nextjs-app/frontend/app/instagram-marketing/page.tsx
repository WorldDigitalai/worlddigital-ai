import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "Instagram Marketing for SMBs & Enterprises",
  description: "AI-generated Reels, Stories and feed ads with full campaign management. Grow reach and sales on Instagram for businesses of every size in the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/instagram-marketing", languages: { "en-US": "https://worlddigital.ai/instagram-marketing", "en-CA": "https://worlddigital.ai/instagram-marketing", "x-default": "https://worlddigital.ai/instagram-marketing" } },
  openGraph: {
    title: "Instagram Marketing for SMBs & Enterprises | WorldDigital.ai",
    description: "AI-generated Reels, Stories and feed ads with full campaign management. Grow reach and sales on Instagram for businesses of every size in the US and Canada.",
    url: "https://worlddigital.ai/instagram-marketing",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "Instagram Marketing for SMBs & Enterprises | WorldDigital.ai",
    description: "AI-generated Reels, Stories and feed ads with full campaign management. Grow reach and sales on Instagram for businesses of every size in the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "Instagram Marketing That Grows Your Brand and Your Revenue",
  eyebrow: "AI-Powered Instagram Marketing",
  intro: "Instagram's 2 billion users scroll through Reels, Stories, and feed posts every day — and WorldDigital.ai helps your business show up in the right places. We manage your Instagram marketing from content strategy to paid promotion, using AI to handle the heavy lifting.",
  platform: "Instagram",
  price: "",
  priceNote: "per month · no setup fees · cancel anytime",
  canonicalPath: "/instagram-marketing",
  schemaType: "Instagram Marketing Service",
  schemaDescription: "AI-generated Reels, Stories and feed ads with full campaign management. Grow reach and sales on Instagram for businesses of every size in the US and Canada.",
  services: [
    { title: "Instagram Marketing for Local Businesses", desc: "Location-targeted Instagram campaigns that increase local brand awareness and drive traffic to your physical or online storefront." },
    { title: "Instagram Reels & Stories Ads", desc: "AI-generated Reels concepts and Story ad scripts designed for Instagram's vertical video placements — the formats with the highest organic reach on the platform." },
    { title: "Instagram Feed & Carousel Ads", desc: "Visually polished carousel ads and single-image feed placements with AI-written captions that stop the scroll and drive action." },
    { title: "Instagram Shopping & Retargeting", desc: "Instagram Shopping catalog setup and dynamic retargeting ads that bring back users who browsed your products without purchasing." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Visual Content Strategy", desc: "We define your Instagram aesthetic, ad format mix, and posting cadence based on your brand, audience, and business goals." },
    { icon: ICON_AI, title: "AI Caption & Creative Writing", desc: "Every ad gets AI-written captions with hooks, value propositions, and CTAs optimized for Instagram's engagement patterns." },
    { icon: ICON_OPTIMIZE, title: "Placement Optimization", desc: "We optimize spend across Reels, Stories, Feed, and Explore placements — allocating budget to wherever your audience converts best." },
    { icon: ICON_REPORT, title: "Engagement & ROAS Reporting", desc: "Monthly reports show profile reach, ad engagement, link clicks, purchases, and cost-per-result across all Instagram placements." },
  ],
  benefits: [
    "Instagram Reels now reach 2.35x more non-followers than standard feed posts",
    "Carousel ads drive 3x more link clicks than single-image ads on average",
    "AI-written captions use proven engagement triggers for Instagram's algorithm",
    "Story ads with swipe-up CTAs for direct website traffic and lead capture",
    "Instagram Shopping integration for product-based businesses",
    "Retargeting audiences built from your website visitors and Instagram profile engagers",
    "Runs alongside Facebook through Meta Ads Manager — no extra account needed",
  ],
  faqs: [
    { q: "Do I need a business Instagram account to run ads?", a: "Yes, ads require an Instagram Business or Creator account connected to a Facebook Page. If you don't have this set up, we walk you through the process during onboarding — it takes about 15 minutes." },
    { q: "Does WorldDigital.ai manage organic Instagram posting too?", a: "Our core service focuses on paid Instagram advertising. However, our Content Studio tool allows you to generate and schedule organic Instagram posts, which is available as an add-on through your dashboard." },
    { q: "What Instagram ad formats perform best for small businesses?", a: "For most SMBs, Instagram Reels ads (for awareness and reach) and Stories ads (for direct response) deliver the best results. We test multiple formats and shift budget toward what works for your specific audience." },
    { q: "Can I target Instagram users who follow my competitors?", a: "Meta doesn't allow direct competitor follower targeting, but we can target users with overlapping interests, behaviors, and demographics — which effectively reaches your competitor's audience without violating platform policies." },
    { q: "How long does it take for Instagram ads to show results?", a: "Instagram's algorithm needs 7–14 days to learn from your campaign data. Expect the first month to be a testing and learning phase. By month two, campaigns are typically optimized and delivering consistent results." },
  ],
  relatedPages: [
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/facebook-ads-management", label: "Facebook Ads Management" },
    { href: "/tiktok-marketing", label: "TikTok Marketing" },
    { href: "/youtube-shorts-marketing", label: "YouTube Shorts Marketing" },
    { href: "/snapchat-marketing", label: "Snapchat Marketing" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
  ],
  blogLinks: [
    { href: "/blog/tiktok-vs-instagram-ads", label: "TikTok Ads vs Instagram Ads — Which is Right for You?" },
    { href: "/blog/why-businesses-need-omnichannel-ads", label: "Why Businesses Need Multi-Platform Advertising" },
  ],
};

export default function InstagramMarketingPage() {
  return <SEOLandingPage config={config} />;
}
