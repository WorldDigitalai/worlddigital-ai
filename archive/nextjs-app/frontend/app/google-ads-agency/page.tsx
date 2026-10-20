import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "Google Ads Agency for SMBs & Enterprises",
  description: "AI-managed Google Search, Display and Performance Max campaigns that win high-intent buyers. Built for SMBs, SMEs and enterprises across the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/google-ads-agency", languages: { "en-US": "https://worlddigital.ai/google-ads-agency", "en-CA": "https://worlddigital.ai/google-ads-agency", "x-default": "https://worlddigital.ai/google-ads-agency" } },
  openGraph: {
    title: "Google Ads Agency for SMBs & Enterprises | WorldDigital.ai",
    description: "AI-managed Google Search, Display and Performance Max campaigns that win high-intent buyers. Built for SMBs, SMEs and enterprises across the US and Canada.",
    url: "https://worlddigital.ai/google-ads-agency",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "Google Ads Agency for SMBs & Enterprises | WorldDigital.ai",
    description: "AI-managed Google Search, Display and Performance Max campaigns that win high-intent buyers. Built for SMBs, SMEs and enterprises across the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "Google Ads Agency That Delivers Customers, Not Just Clicks",
  eyebrow: "AI-Powered Google Ads Management",
  intro: "Google processes 8.5 billion searches per day. WorldDigital.ai positions your business at the top of Google Search results when potential customers are actively looking for your products or services — and we handle every aspect of campaign management.",
  platform: "Google",
  price: "",
  priceNote: "per month · no setup fees · cancel anytime",
  canonicalPath: "/google-ads-agency",
  schemaType: "Google Ads Agency",
  schemaDescription: "AI-managed Google Search, Display and Performance Max campaigns that win high-intent buyers. Built for SMBs, SMEs and enterprises across the US and Canada.",
  services: [
    { title: "Google Ads for Local Businesses", desc: "Local search campaigns and Google Business Profile ads that put your business at the top of search results for customers in your area looking for exactly what you offer." },
    { title: "Google Search Campaign Management", desc: "Keyword research, ad group structure, match type strategy, and ad copy testing across Google's Search network — capturing high-intent buyers at the moment of decision." },
    { title: "Performance Max Campaigns", desc: "AI-driven Performance Max campaigns that serve ads across Google Search, Display, YouTube, Gmail, and Maps from a single campaign — maximizing reach and conversions." },
    { title: "Google Ads Analytics & Reporting", desc: "Conversion tracking setup, monthly performance reports, and clear ROI visibility across every campaign and keyword in your Google Ads account." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Keyword Strategy", desc: "We identify high-intent, commercially relevant keywords your competitors are missing — then build a match-type structure that maximizes Quality Score." },
    { icon: ICON_AI, title: "AI Ad Copy Testing", desc: "Responsive search ads with up to 15 headline and 4 description variants tested automatically — Google's own AI selects the best combination for each search." },
    { icon: ICON_OPTIMIZE, title: "Negative Keyword Management", desc: "Weekly negative keyword additions prevent wasted spend on irrelevant searches — often the biggest single improvement for Google Ads ROI." },
    { icon: ICON_REPORT, title: "Conversion-Focused Reporting", desc: "We track phone calls, form fills, purchases, and in-store visits — not just clicks — so you see the real business impact of your Google spend." },
  ],
  benefits: [
    "Google Search captures buyers with intent — they're actively looking for what you sell",
    "Google Ads generates an average of $2 in revenue for every $1 spent when managed correctly",
    "Local Service Ads (pay-per-lead) available for qualifying service businesses",
    "Google Shopping campaigns for e-commerce with product catalog integration",
    "Display retargeting to stay top-of-mind with past website visitors across 2M+ sites",
    "Conversion tracking for calls, forms, purchases, and direction requests",
    "No minimum ad spend from our side — Google's minimum is $1/day",
  ],
  faqs: [
    { q: "How is Google Ads different from SEO?", a: "Google Ads (paid search) shows your business at the top of search results immediately, but you pay per click. SEO (organic search) takes 3–12 months to generate rankings but is free per click once established. For most businesses, a combination of both delivers the best results — Google Ads while SEO builds up." },
    { q: "What types of businesses see the best Google Ads results?", a: "Google Ads works exceptionally well for local service businesses (plumbers, electricians, lawyers, dentists), e-commerce, B2B software, professional services, and any business where customers search with clear purchase intent. It's less effective for impulse-purchase products without a search need." },
    { q: "How does WorldDigital.ai approach keyword research?", a: "We use a combination of Google Keyword Planner, search term reports from your existing campaigns, and competitor analysis to identify the highest-value, lowest-competition keywords for your specific business and market." },
    { q: "What's the difference between Search, Display, and Performance Max campaigns?", a: "Search ads appear when someone types a related query in Google. Display ads appear on websites across Google's network as banners. Performance Max combines all Google ad inventory using AI. We recommend starting with Search for intent capture, then adding Performance Max as budgets grow." },
    { q: "Will I need a landing page for Google Ads?", a: "Yes — Google Ads require a destination URL, and landing page quality directly affects your Quality Score and cost-per-click. We review your existing pages during onboarding and provide recommendations for improving conversion rate." },
  ],
  relatedPages: [
    { href: "/ai-seo-agency", label: "AI SEO Agency" },
    { href: "/youtube-shorts-marketing", label: "YouTube Shorts Marketing" },
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/facebook-ads-management", label: "Facebook Ads Management" },
    { href: "/linkedin-ads-agency", label: "LinkedIn Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
  ],
  blogLinks: [
    { href: "/blog/google-ads-management-local-businesses", label: "Google Ads Management for Local Businesses" },
    { href: "/blog/how-ai-marketing-automation-works", label: "How AI Marketing Automation Works" },
  ],
};

export default function GoogleAdsAgencyPage() {
  return <SEOLandingPage config={config} />;
}
