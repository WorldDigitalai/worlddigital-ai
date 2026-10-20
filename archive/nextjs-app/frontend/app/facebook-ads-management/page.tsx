import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "Facebook Ads Management for SMBs & Enterprises",
  description: "Facebook campaign setup, creative, targeting and optimization run by AI and reviewed by experts. For SMBs, SMEs and enterprise brands in the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/facebook-ads-management", languages: { "en-US": "https://worlddigital.ai/facebook-ads-management", "en-CA": "https://worlddigital.ai/facebook-ads-management", "x-default": "https://worlddigital.ai/facebook-ads-management" } },
  openGraph: {
    title: "Facebook Ads Management for SMBs & Enterprises | WorldDigital.ai",
    description: "Facebook campaign setup, creative, targeting and optimization run by AI and reviewed by experts. For SMBs, SMEs and enterprise brands in the US and Canada.",
    url: "https://worlddigital.ai/facebook-ads-management",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "Facebook Ads Management for SMBs & Enterprises | WorldDigital.ai",
    description: "Facebook campaign setup, creative, targeting and optimization run by AI and reviewed by experts. For SMBs, SMEs and enterprise brands in the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "Facebook Ads Management That Stops Wasted Spend",
  eyebrow: "Professional Facebook Ads Management",
  intro: "Most small businesses waste 40–60% of their Facebook ad budget on poor targeting and untested creative. WorldDigital.ai's AI-powered management fixes both — building precise audiences, generating proven ad copy variants, and optimizing continuously so every dollar works harder.",
  platform: "Facebook",
  price: "",
  priceNote: "per month · includes Facebook & Instagram · cancel anytime",
  canonicalPath: "/facebook-ads-management",
  schemaType: "Facebook Ads Management Service",
  schemaDescription: "Facebook campaign setup, creative, targeting and optimization run by AI and reviewed by experts. For SMBs, SMEs and enterprise brands in the US and Canada.",
  services: [
    { title: "Facebook Ads for Local Businesses", desc: "Radius and city-targeted Facebook campaigns that generate awareness, foot traffic, and direct inquiries from people in your service area." },
    { title: "Facebook Lead Generation Ads", desc: "Lead gen campaigns with native Facebook forms that capture name, email, and phone number without sending users to a landing page — lower friction, more leads." },
    { title: "Facebook Retargeting Campaigns", desc: "Custom audiences built from your website visitors, video viewers, and Facebook Page engagers — re-engaged with highly relevant follow-up ads." },
    { title: "Facebook E-Commerce & Catalog Ads", desc: "Dynamic product ads that automatically show each user the products they viewed on your website — one of the highest-ROAS formats available on Facebook." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Campaign Architecture", desc: "We build a proper campaign structure — Awareness, Traffic, and Conversion campaigns — each with the right objective, bid type, and audience." },
    { icon: ICON_AI, title: "AI Ad Copy Testing", desc: "3–5 headline and body copy variants are tested per ad set so the highest click-through message always gets the majority of spend." },
    { icon: ICON_OPTIMIZE, title: "Audience Refinement", desc: "We continuously narrow or expand targeting based on which demographics, interests, and behaviors are generating the lowest cost-per-result." },
    { icon: ICON_REPORT, title: "Transparent Reporting", desc: "Monthly reports show reach, CPM, CTR, cost per lead, ROAS, and a plain-language summary of what improved and what changed." },
  ],
  benefits: [
    "Facebook reaches 2B+ daily active users — still the largest ad platform by audience size",
    "Interest and behavioral targeting reaching customers researching exactly what you sell",
    "Custom audiences from your email list or CRM for high-intent remarketing",
    "Lookalike audiences that find new customers matching your best existing ones",
    "Facebook Pixel + Conversion API for accurate attribution across devices and browsers",
    "Lead gen forms with no landing page required — lower cost-per-lead for most businesses",
    "Your Ads Manager account stays under your ownership — no lock-in with us",
  ],
  faqs: [
    { q: "Is Facebook advertising still effective in 2025 and 2026?", a: "Yes. Despite new platforms emerging, Facebook remains the largest social advertising platform with 2B+ daily users. It's particularly effective for reaching adults 25–65, local service businesses, e-commerce, and lead generation campaigns. The key is proper setup and optimization, which is what we provide." },
    { q: "How much should I spend on Facebook ads each month?", a: "We recommend $500–$2,000/month in Facebook ad spend depending on your goals, market, and competition. Your management fee covers all campaign management regardless of spend level." },
    { q: "What's the difference between Facebook ads management and just 'boosting' a post?", a: "Boosting a post is a simplified, limited tool. Proper Facebook Ads management involves campaign objectives, custom audiences, conversion tracking, split testing, funnel structure, and bid optimization — generating significantly better results at lower cost." },
    { q: "Can you help with Facebook ads for a service business with no e-commerce?", a: "Absolutely. Lead generation, phone call campaigns, and appointment booking are our bread-and-butter for service businesses — plumbers, dentists, real estate agents, law firms, gyms, and similar businesses." },
    { q: "Do I need a website for Facebook ads to work?", a: "Not always. For lead generation campaigns, Facebook's native lead forms capture contact information directly without a website. However, for conversion tracking and retargeting, a website with our Pixel installed generates better long-term results." },
  ],
  relatedPages: [
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/instagram-marketing", label: "Instagram Marketing" },
    { href: "/google-ads-agency", label: "Google Ads Agency" },
    { href: "/tiktok-ads-agency", label: "TikTok Ads Agency" },
    { href: "/linkedin-ads-agency", label: "LinkedIn Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
  ],
  blogLinks: [
    { href: "/blog/why-businesses-need-omnichannel-ads", label: "Why Businesses Need Multi-Platform Advertising" },
    { href: "/blog/how-ai-marketing-automation-works", label: "How AI Marketing Automation Works" },
  ],
};

export default function FacebookAdsManagementPage() {
  return <SEOLandingPage config={config} />;
}
