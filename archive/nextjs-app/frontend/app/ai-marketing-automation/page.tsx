import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "AI Marketing Automation for SMBs & Enterprises",
  description: "AI runs your ads end to end across Google, Meta, TikTok, Snapchat, LinkedIn and X. For SMBs, SMEs and enterprises in the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/ai-marketing-automation", languages: { "en-US": "https://worlddigital.ai/ai-marketing-automation", "en-CA": "https://worlddigital.ai/ai-marketing-automation", "x-default": "https://worlddigital.ai/ai-marketing-automation" } },
  openGraph: {
    title: "AI Marketing Automation for SMBs & Enterprises | WorldDigital.ai",
    description: "AI runs your ads end to end across Google, Meta, TikTok, Snapchat, LinkedIn and X. For SMBs, SMEs and enterprises in the US and Canada.",
    url: "https://worlddigital.ai/ai-marketing-automation",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "AI Marketing Automation for SMBs & Enterprises | WorldDigital.ai",
    description: "AI runs your ads end to end across Google, Meta, TikTok, Snapchat, LinkedIn and X. For SMBs, SMEs and enterprises in the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "AI Marketing Automation That Runs Your Campaigns While You Run Your Business",
  eyebrow: "Full-Stack AI Marketing Automation",
  intro: "Most small businesses can't afford a marketing team, an agency, and a content creator simultaneously. WorldDigital.ai replaces all three with AI — automating ad copy, visual creation, campaign optimization, and performance reporting across Google, Meta, Snapchat, TikTok, and more from one platform.",
  platform: "AI Marketing",
  price: "",
  priceNote: "per platform · add channels as you grow · cancel anytime",
  canonicalPath: "/ai-marketing-automation",
  schemaType: "AI Marketing Automation Service",
  schemaDescription: "AI runs your ads end to end across Google, Meta, TikTok, Snapchat, LinkedIn and X. For SMBs, SMEs and enterprises in the US and Canada.",
  services: [
    { title: "AI Ad Copy & Creative Generation", desc: "Every campaign gets AI-written headlines, ad descriptions, and visual concepts produced automatically — no copywriter, no designer, no delays." },
    { title: "Automated Campaign Management", desc: "Our AI monitors your campaigns 24/7, adjusting bids, rotating creatives, and reallocating budget toward what's generating results — without manual intervention." },
    { title: "AI Content Studio", desc: "Generate social media captions, blog posts, ad scripts, and image prompts from your business profile — publishable with one click across all connected platforms." },
    { title: "Automated Performance Reporting", desc: "Monthly reports generated automatically from your campaign data — plain-language summaries with key metrics and AI-recommended next actions." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "One-Time Business Setup", desc: "You describe your business, upload your logo, and set your goals. Our AI handles everything from campaign architecture to audience selection automatically." },
    { icon: ICON_AI, title: "AI Content Engine", desc: "Powered by advanced language models, our AI generates platform-native content — different tone and format for Google, Meta, TikTok, LinkedIn, and Snapchat." },
    { icon: ICON_OPTIMIZE, title: "Real-Time Optimization", desc: "Algorithms adjust bids and creative rotation every day based on performance signals — the same logic used by enterprise marketing teams, automated." },
    { icon: ICON_REPORT, title: "Unified Dashboard", desc: "All platforms, all campaigns, all metrics in one place — impressions, clicks, conversions, spend, and ROAS across every channel you run." },
  ],
  benefits: [
    "Replace a $5,000/month agency with an AI system that works 24/7 for a fraction of the cost",
    "Launch campaigns on Google, Meta, Snapchat, TikTok, LinkedIn, and more from one platform",
    "AI generates ad copy variants in seconds — what takes a team days happens automatically",
    "No marketing knowledge required — describe your business, the AI does the rest",
    "Real-time budget optimization prevents wasted ad spend on underperforming campaigns",
    "Content Studio generates social posts, captions, and blog drafts alongside your paid campaigns",
    "Scale from one platform to many without adding staff or complexity",
  ],
  faqs: [
    { q: "What exactly does 'AI marketing automation' mean at WorldDigital.ai?", a: "It means the entire marketing workflow — strategy, creative production, campaign setup, bid management, and reporting — is handled by AI systems without you needing to do it manually. You provide your business information once; our AI runs your marketing continuously from there." },
    { q: "Is AI marketing automation better than hiring a human agency?", a: "For most SMBs, yes. Traditional agencies charge $2,000–$10,000/month, require 6-month contracts, and have account managers handling 20+ clients. WorldDigital.ai's AI works exclusively on your campaigns 24/7 — with no retainer minimums and complete transparency." },
    { q: "Which ad platforms does the AI automation cover?", a: "We support Google Ads, Meta (Facebook + Instagram), Snapchat, TikTok, LinkedIn, X (Twitter), and YouTube — all manageable from your WorldDigital.ai dashboard. You choose which platforms to activate." },
    { q: "Does AI automation work for any type of business?", a: "Our AI performs best for businesses with clear customer profiles — local services, e-commerce, professional services, restaurants, health and wellness, real estate, and SaaS. We assess fit during onboarding and recommend the best platform mix for your specific business." },
    { q: "How is WorldDigital.ai different from tools like HubSpot or Mailchimp?", a: "HubSpot and Mailchimp focus on email marketing and CRM automation. WorldDigital.ai specializes in paid advertising automation across social and search platforms — ad creation, campaign management, and spend optimization. They complement each other rather than compete." },
  ],
  relatedPages: [
    { href: "/ai-seo-agency", label: "AI SEO Agency" },
    { href: "/google-ads-agency", label: "Google Ads Agency" },
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/tiktok-ads-agency", label: "TikTok Ads Agency" },
    { href: "/snapchat-ads-agency", label: "Snapchat Ads Agency" },
    { href: "/linkedin-ads-agency", label: "LinkedIn Ads Agency" },
  ],
  blogLinks: [
    { href: "/blog/how-ai-marketing-automation-works", label: "How AI Marketing Automation Works" },
    { href: "/blog/why-businesses-need-omnichannel-ads", label: "Why Businesses Need Multi-Platform Advertising" },
  ],
};

export default function AIMarketingAutomationPage() {
  return <SEOLandingPage config={config} />;
}
