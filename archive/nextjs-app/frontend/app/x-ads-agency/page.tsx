import type { Metadata } from "next";
import { SEOLandingPage, type SEOPageConfig } from "@/components/seo/SEOLandingPage";

export const metadata: Metadata = {
  title: "X (Twitter) Ads Agency — AI-Managed X Ads",
  description: "Promoted posts, trend targeting and full X (Twitter) campaign management run by AI. For SMBs, SMEs and enterprises reaching the US and Canada in real time.",
  alternates: { canonical: "https://worlddigital.ai/x-ads-agency", languages: { "en-US": "https://worlddigital.ai/x-ads-agency", "en-CA": "https://worlddigital.ai/x-ads-agency", "x-default": "https://worlddigital.ai/x-ads-agency" } },
  openGraph: {
    title: "X (Twitter) Ads Agency — AI-Managed X Ads | WorldDigital.ai",
    description: "Promoted posts, trend targeting and full X (Twitter) campaign management run by AI. For SMBs, SMEs and enterprises reaching the US and Canada in real time.",
    url: "https://worlddigital.ai/x-ads-agency",
    type: "website",
    images: [{ url: "https://worlddigital.ai/opengraph-image", width: 1200, height: 630, alt: "WorldDigital.ai — AI-Powered Digital Marketing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    title: "X (Twitter) Ads Agency — AI-Managed X Ads | WorldDigital.ai",
    description: "Promoted posts, trend targeting and full X (Twitter) campaign management run by AI. For SMBs, SMEs and enterprises reaching the US and Canada in real time.",
    images: ["https://worlddigital.ai/opengraph-image"],
  },
};

const ICON_STRATEGY = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const ICON_AI = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const ICON_OPTIMIZE = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
const ICON_REPORT = "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const config: SEOPageConfig = {
  h1: "X Ads Agency for Brands That Want to Join the Conversation",
  eyebrow: "AI-Powered X (Twitter) Advertising",
  intro: "X (formerly Twitter) is where breaking news, trending conversations, and cultural moments happen in real time. WorldDigital.ai helps businesses capitalize on X's highly engaged, text-first audience with AI-managed Promoted Posts, keyword targeting, and follower acquisition campaigns.",
  platform: "X (Twitter)",
  price: "",
  priceNote: "per month · cancel anytime",
  canonicalPath: "/x-ads-agency",
  schemaType: "X Twitter Advertising Agency",
  schemaDescription: "Promoted posts, trend targeting and full X (Twitter) campaign management run by AI. For SMBs, SMEs and enterprises reaching the US and Canada in real time.",
  services: [
    { title: "X Promoted Posts & Ads", desc: "Amplify your best content to targeted X audiences beyond your existing followers — reaching users by interest, keyword, and follower similarity." },
    { title: "X Keyword & Trend Targeting", desc: "Target users actively tweeting about or searching specific keywords, trending topics, and conversations relevant to your brand or industry." },
    { title: "X Follower Growth Campaigns", desc: "Follower acquisition campaigns that grow your X audience with engaged, relevant users who are genuinely interested in what your business does." },
    { title: "X Analytics & Reporting", desc: "Monthly performance reports covering impressions, engagements, link clicks, follower growth, and campaign ROAS from your X ad account." },
  ],
  features: [
    { icon: ICON_STRATEGY, title: "Conversation Mapping", desc: "We identify the trending topics, hashtags, and keyword conversations where your target audience is most active and engaged." },
    { icon: ICON_AI, title: "AI Post Copy", desc: "Concise, punchy X ad copy written by AI — optimized for the platform's text-first format and the short attention spans of a real-time feed." },
    { icon: ICON_OPTIMIZE, title: "Audience Targeting", desc: "Interest categories, follower lookalikes, keyword targeting, and retargeting audiences to reach the right users for your campaign objective." },
    { icon: ICON_REPORT, title: "Engagement Reporting", desc: "We track engagements, link clicks, video views, follower gain, and cost-per-result across all your X campaigns monthly." },
  ],
  benefits: [
    "X reaches 250M+ daily active monetizable users highly engaged with current events and culture",
    "Keyword targeting lets you reach users at the exact moment they're discussing relevant topics",
    "Trend targeting for real-time marketing during events, launches, and cultural moments",
    "Lower CPMs than Meta and Google in many categories — cost-effective brand awareness",
    "Video ads and conversation ads available for high-engagement formats",
    "X Blue verification for business pages increases ad credibility and trust",
    "No minimum spend requirements from WorldDigital.ai",
  ],
  faqs: [
    { q: "Is X advertising still worth investing in for businesses?", a: "X works best for brands targeting tech-savvy users, news followers, finance audiences, political content, and pop culture. It's less effective for hyper-local businesses or pure e-commerce. We assess fit during onboarding and are honest if another platform would serve your goals better." },
    { q: "What types of X ad formats does WorldDigital.ai manage?", a: "We manage Promoted Ads (single image, video, and carousel), Follower Ads, Trend Takeovers for brand moments, and Conversation Ads that prompt users to use a custom hashtag. Format selection is based on your campaign objective." },
    { q: "How does keyword targeting on X work?", a: "X keyword targeting allows you to show ads to users who have recently tweeted, searched for, or engaged with content containing your target keywords. This is one of X's most unique targeting capabilities — showing ads at the exact moment of intent." },
    { q: "Can X ads work for local businesses?", a: "X's geographic targeting allows city and state-level targeting, but it's generally more effective for national brands and B2B companies than purely local businesses. For most local businesses, we recommend focusing budget on Google and Meta first." },
    { q: "What budget do you recommend for X advertising?", a: "X ad campaigns can start with as little as $200/month in ad spend. For meaningful brand awareness and engagement data, $500–$1,000/month provides enough reach to optimize toward. Follower campaigns can be effective at lower budgets." },
  ],
  relatedPages: [
    { href: "/linkedin-ads-agency", label: "LinkedIn Ads Agency" },
    { href: "/meta-ads-agency", label: "Meta Ads Agency" },
    { href: "/tiktok-ads-agency", label: "TikTok Ads Agency" },
    { href: "/snapchat-ads-agency", label: "Snapchat Ads Agency" },
    { href: "/google-ads-agency", label: "Google Ads Agency" },
    { href: "/ai-marketing-automation", label: "AI Marketing Automation" },
  ],
  blogLinks: [
    { href: "/blog/why-businesses-need-omnichannel-ads", label: "Why Businesses Need Multi-Platform Advertising" },
    { href: "/blog/how-ai-marketing-automation-works", label: "How AI Marketing Automation Works" },
  ],
};

export default function XAdsAgencyPage() {
  return <SEOLandingPage config={config} />;
}
