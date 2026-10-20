export type PricingModel = "monthly" | "one-time-pack";

export type ServicePricing = {
  slug: string;
  name: string;
  pricingModel: PricingModel;
  monthlyPrice?: number;
  packPrice?: number;
  packCredits?: number;
  packUnit?: string;
  stripeEnvKey?: string;
  category: "Ad Management" | "AI Generator" | "SEO & Content";
  color: string;
  highlight?: boolean;
};

export const SERVICE_PRICING: ServicePricing[] = [
  { slug: "google-ads",       name: "Google Ads",              pricingModel: "monthly",       monthlyPrice: 350,   stripeEnvKey: "PRICE_GOOGLE_MONTHLY",  category: "Ad Management", color: "#4285F4" },
  { slug: "meta-ads",         name: "Meta Ads",                pricingModel: "monthly",       monthlyPrice: 350,   stripeEnvKey: "PRICE_META_MONTHLY",    category: "Ad Management", color: "#1877F2" },
  { slug: "snapchat-ads",     name: "Snapchat Ads",            pricingModel: "monthly",       monthlyPrice: 350,   stripeEnvKey: "PRICE_SNAP_MONTHLY",    category: "Ad Management", color: "#FFFC00" },
  { slug: "tiktok-ads",       name: "TikTok Ads",              pricingModel: "monthly",       monthlyPrice: 350,   category: "Ad Management",             color: "#010101" },
  { slug: "linkedin-ads",     name: "LinkedIn Ads",            pricingModel: "monthly",       monthlyPrice: 350,   category: "Ad Management",             color: "#0A66C2" },
  { slug: "x-ads",            name: "X Ads",                   pricingModel: "monthly",       monthlyPrice: 350,   category: "Ad Management",             color: "#000000" },
  { slug: "youtube-shorts",   name: "YouTube Shorts Ads",      pricingModel: "monthly",       monthlyPrice: 350,   category: "Ad Management",             color: "#FF0000" },
  { slug: "image-generator",  name: "AI Image Generator",      pricingModel: "one-time-pack", packPrice: 19.99,  packCredits: 5,  packUnit: "images",          stripeEnvKey: "PRICE_IMAGE_PACK",    category: "AI Generator",   color: "#F59E0B" },
  { slug: "reels-generator",  name: "AI Reels Generator",      pricingModel: "one-time-pack", packPrice: 49.99,  packCredits: 5,  packUnit: "reels",           stripeEnvKey: "PRICE_REELS_PACK",    category: "AI Generator",   color: "#EF4444", highlight: true },
  { slug: "ai-seo",           name: "Auto AI SEO",             pricingModel: "monthly",       monthlyPrice: 199.99, stripeEnvKey: "PRICE_AUTO_SEO_MONTHLY", category: "SEO & Content", color: "#10B981", highlight: true },
  { slug: "keyword-research", name: "AI Keyword Research",     pricingModel: "one-time-pack", packPrice: 19.99,  packCredits: 10, packUnit: "keyword reports", stripeEnvKey: "PRICE_KEYWORD_PACK",      category: "SEO & Content",  color: "#6366F1" },
  { slug: "ai-captions",     name: "AI Captions",             pricingModel: "one-time-pack", packPrice: 4.99,   packCredits: 5,  packUnit: "descriptions",   stripeEnvKey: "PRICE_CAPTIONS_PACK",     category: "AI Generator",   color: "#EC4899" },
  { slug: "content-marketing",name: "AI Content Marketing",   pricingModel: "monthly",       monthlyPrice: 149.99, category: "SEO & Content",            color: "#8B5CF6" },
];

export function getServicePricing(slug: string): ServicePricing | undefined {
  return SERVICE_PRICING.find((s) => s.slug === slug);
}

export function formatPrice(svc: ServicePricing): string {
  if (svc.pricingModel === "monthly") return `$${svc.monthlyPrice}/mo`;
  return `$${svc.packPrice} / ${svc.packCredits} ${svc.packUnit}`;
}
