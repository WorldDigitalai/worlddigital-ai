import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "LinkedIn Ads Agency for B2B & Enterprise",
  description: "AI-managed Sponsored Content, InMail and Lead Gen campaigns that reach decision-makers. For B2B SMBs, SMEs and enterprises across the US and Canada.",
  alternates: { canonical: "https://worlddigital.ai/linkedin-ads-agency", languages: { "en-US": "https://worlddigital.ai/linkedin-ads-agency", "en-CA": "https://worlddigital.ai/linkedin-ads-agency", "x-default": "https://worlddigital.ai/linkedin-ads-agency" } },
  openGraph: {
    title: "LinkedIn Ads Agency for B2B & Enterprise | WorldDigital.ai",
    description: "AI-managed Sponsored Content, InMail and Lead Gen campaigns that reach decision-makers. For B2B SMBs, SMEs and enterprises across the US and Canada.",
    url: "https://worlddigital.ai/linkedin-ads-agency",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "LinkedIn Ads Agency for B2B & Enterprise | WorldDigital.ai",
    description: "AI-managed Sponsored Content, InMail and Lead Gen campaigns that reach decision-makers. For B2B SMBs, SMEs and enterprises across the US and Canada.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "LinkedIn Ads Agency for B2B Lead Generation and Brand Building",
  eyebrow: "AI-Powered LinkedIn Advertising",
  intro: "LinkedIn is where business decisions happen. With 1 billion professionals, including C-suite executives, department heads, and procurement managers, LinkedIn advertising lets you reach exactly the right person at the right company. WorldDigital.ai manages your LinkedIn campaigns with AI precision.",
  platform: "LinkedIn",
  price: "",
  priceNote: "per month · B2B focused · cancel anytime",
  canonicalPath: "/linkedin-ads-agency",
  schemaType: "LinkedIn Advertising Agency",
  schemaDescription: "AI-managed Sponsored Content, InMail and Lead Gen campaigns that reach decision-makers. For B2B SMBs, SMEs and enterprises across the US and Canada.",
  services: [
    { title: "LinkedIn Sponsored Content", desc: "Single image, document, carousel, and video ads that appear directly in your target audience's LinkedIn feed — native, professional, and highly trusted." },
    { title: "LinkedIn Lead Gen Forms", desc: "Pre-filled LinkedIn Lead Gen Forms that capture name, title, company, email, and phone with a single click — without users leaving LinkedIn." },
    { title: "LinkedIn Message Ads (InMail)", desc: "Personalized sponsored messages sent directly to the inbox of your ideal prospects — decision-makers, hiring managers, or industry peers." },
    { title: "LinkedIn Audience Targeting & Retargeting", desc: "Job title, seniority, company size, industry, and skills targeting to reach exactly the professionals who influence purchasing decisions at your target accounts." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "B2B Audience Mapping", desc: "We identify the exact job titles, company sizes, and industries that match your ideal customer profile and build LinkedIn audiences around them." },
    { icon: ICON_AI, title: "Professional Ad Copy", desc: "AI-written Sponsored Content and InMail copy crafted for a B2B audience — authoritative, insight-driven, and aligned with LinkedIn's professional tone." },
    { icon: ICON_OPTIMIZE, title: "Account-Based Targeting", desc: "We upload your target account list and serve ads specifically to employees at the companies you want to win as clients." },
    { icon: ICON_REPORT, title: "Lead Quality Reporting", desc: "We track not just lead volume but lead quality — company size, title, and engagement metrics — so you know which campaigns bring the best-fit prospects." },
  ],
  benefits: [
    "LinkedIn reaches 65M+ decision-makers not reachable as precisely on any other platform",
    "Target by company, industry, job title, seniority, and professional skills simultaneously",
    "Lead Gen Forms pre-populate with LinkedIn profile data for 2–4x higher conversion rates",
    "Document ads and Thought Leadership formats build authority in your industry",
    "Account-Based Marketing (ABM) with your own target company lists",
    "Retargeting audiences from website visitors and LinkedIn company page engagers",
    "Average LinkedIn ad leads are worth 3x more in lifetime value than leads from social platforms",
  ],
  faqs: [
    { q: "Is LinkedIn advertising worth the higher CPM?", a: "LinkedIn's CPM is 3–5x higher than Facebook, but the quality of leads is significantly better for B2B businesses. A LinkedIn lead from a CFO at a $50M company is worth far more than a cheap Facebook lead with unclear intent. For B2B, the ROI calculation typically favors LinkedIn." },
    { q: "What B2B industries see the best results on LinkedIn?", a: "SaaS, professional services (consulting, legal, accounting), staffing, financial services, enterprise software, marketing agencies, and manufacturing companies targeting procurement officers consistently see strong LinkedIn ad performance." },
    { q: "How does LinkedIn Lead Gen Form targeting work?", a: "LinkedIn Lead Gen Forms are attached to Sponsored Content ads. When a targeted user clicks your ad, a pre-filled form appears (populated from their LinkedIn profile) with your custom questions. They submit with one tap — higher conversion rates than external landing pages." },
    { q: "What's the minimum budget for LinkedIn advertising?", a: "LinkedIn requires a minimum of $10/day per campaign. For meaningful B2B lead generation, we recommend $1,000–$3,000/month in ad spend. The quality of LinkedIn leads typically justifies this investment for businesses selling products or services with deal values above $1,000." },
    { q: "Can WorldDigital.ai manage LinkedIn ads alongside other platforms?", a: "Yes. Many of our clients run LinkedIn for B2B alongside Google Search and Meta for broader reach. All platforms are managed from your WorldDigital.ai dashboard, with unified performance reporting." },
  ],
  relatedPages: [
    { href: "/google-ads-agency", label: "Google Ads Agency" },
    { href: "/facebook-ads-management", label: "Facebook Ads Management" },
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/x-ads-agency", label: "X Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
    { href: "/ai-seo-agency", label: "AI SEO Agency" },
  ],
  blogLinks: [
    { href: "/blog/why-businesses-need-omnichannel-ads", label: "Why Businesses Need Multi-Platform Advertising" },
    { href: "/blog/how-ai-marketing-automation-works", label: "How AI Marketing Automation Works" },
  ],
};

export default function LinkedInAdsAgencyPage() {
  return <SEOLandingPage config={config} />;
}
