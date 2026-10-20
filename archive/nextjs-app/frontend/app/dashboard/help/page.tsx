"use client";

import { useState } from "react";
import { useUser, type PACKAGE_ID } from "@/context/UserContext";

type FaqItem = { q: string; a: string };

const GENERAL_FAQS: FaqItem[] = [
  { q: "How long until my first campaign goes live?", a: "Typically within 24 hours after our team connects your platforms. You'll see real-time status updates in your dashboard overview." },
  { q: "What does the daily budget cover?", a: "Your daily budget goes directly to ad spend on the platform (Meta, Google, Snapchat, etc.). WorldDigital.ai charges a separate monthly management fee for running and optimizing your campaigns." },
  { q: "Can I pause my campaigns?", a: "Yes — contact support at support@worlddigital.ai or use the Campaigns tab in your dashboard to request a pause. We'll action it within 2 hours." },
  { q: "Who owns the content and ads created?", a: "You own 100% of all content, ads, and creative assets we create on your behalf. You can download, reuse, or modify anything from your Content Library at any time." },
  { q: "What if I don't have a logo?", a: "No problem! We'll use your business name as text branding until you upload a logo in Settings → Brand Kit. You can update it anytime." },
  { q: "How do I update my business information?", a: "Go to Settings → Profile to update your business name, website, category, location, and description. All AI-generated content will use the updated information immediately." },
];

const PACKAGE_FAQS: Partial<Record<PACKAGE_ID, FaqItem[]>> = {
  meta_ads: [
    { q: "What Meta ad formats do you use?", a: "We create Feed images, Carousels, Reels, and Stories depending on your campaign goals. Format preference can be set in your Campaign Preferences." },
    { q: "Do I need a Facebook Business Manager?", a: "We create and manage a Business Manager on your behalf using your business information. You'll receive access once it's set up." },
    { q: "How do I track conversions from Meta ads?", a: "We install the Meta Pixel on your website (within 48h of connection). Conversions are reported in your Analytics tab." },
  ],
  google_ads: [
    { q: "What Google Ads networks are included?", a: "Your plan includes Search (Google.com results page) by default. Display and YouTube can be added on request." },
    { q: "How do you choose keywords for my campaigns?", a: "Our AI analyzes your business category, location, and website to build an initial keyword list. You can review and request changes via the Keywords tab." },
    { q: "What's a Quality Score and how do you optimize it?", a: "Quality Score measures ad relevance and landing page experience. We optimize it by matching ad copy to keywords and ensuring your landing page loads quickly." },
  ],
  ai_seo: [
    { q: "How does Auto SEO work?", a: "We connect your domain to Google Search Console, monitor your keyword rankings, run site audits, and generate SEO-optimized blog posts automatically." },
    { q: "How long until I see SEO results?", a: "SEO is a long-term strategy. Most businesses see measurable ranking improvements within 60–90 days of consistent content publishing and technical optimization." },
    { q: "Do I need a Google Search Console account?", a: "We create and manage it for you. You'll be granted view access so you can monitor your organic traffic anytime." },
  ],
  image_generator: [
    { q: "What AI model generates the images?", a: "We use DALL-E 3 by OpenAI, which produces high-quality, photorealistic and stylized images. Each generation deducts 1 credit from your account." },
    { q: "What aspect ratios are supported?", a: "We support 1:1 (Square), 4:5 (Portrait), 9:16 (Stories/Reels), 16:9 (YouTube banner), and 1.91:1 (Facebook Link ad) formats." },
    { q: "Can I use generated images for paid ads?", a: "Yes — all images generated on our platform are yours to use commercially on any platform, including paid ad campaigns." },
  ],
  enterprise: [
    { q: "How many platforms are included in Enterprise?", a: "Enterprise includes all 12 modules: Meta Ads, Google Ads, Snapchat Ads, TikTok Ads, LinkedIn Ads, YouTube Shorts, X Ads, AI SEO, Content Studio, Image Generator, Reels Generator, and keyword research." },
    { q: "Do I have a dedicated account manager?", a: "Enterprise clients receive priority support with a 4-hour response time. Account management reviews are available on request." },
    { q: "Can I white-label or resell the service?", a: "Contact us at support@worlddigital.ai to discuss white-label and agency reseller arrangements." },
  ],
};

const RESOURCES = [
  { icon: "&#128218;", title: "Getting Started Guide", desc: "Step-by-step walkthrough of your dashboard and first campaign", href: "#" },
  { icon: "&#127910;", title: "Ad Creative Best Practices", desc: "Tips for writing headlines, choosing images, and targeting audiences", href: "#" },
  { icon: "&#128200;", title: "Understanding Your Analytics", desc: "How to read your campaign metrics and optimize for better results", href: "#" },
  { icon: "&#128269;", title: "SEO Basics for Small Business", desc: "What Google Search Console tells you and how to use the data", href: "#" },
];

function Accordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((f, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left gap-3">
            <span className="text-xs font-bold" style={{ color: "#374151" }}>{f.q}</span>
            <svg className="w-4 h-4 shrink-0 transition-transform" style={{ color: "#9CA3AF", transform: open === i ? "rotate(180deg)" : "none" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {open === i && <p className="px-4 pb-4 text-xs leading-relaxed" style={{ color: "#6B7280" }}>{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function HelpPage() {
  const { user } = useUser();
  const pkg = user?.package ?? "enterprise";
  const pkgFaqs = PACKAGE_FAQS[pkg] ?? PACKAGE_FAQS.enterprise ?? [];

  const PACKAGE_LABELS: Record<PACKAGE_ID, string> = {
    google_ads: "Google Ads", meta_ads: "Meta Ads", snapchat_ads: "Snapchat Ads",
    tiktok_ads: "TikTok Ads", linkedin_ads: "LinkedIn Ads", youtube_shorts: "YouTube Shorts",
    x_ads: "X Ads", ai_seo: "AI SEO", keyword_research: "Keyword Research",
    content_marketing: "Content Marketing", image_generator: "Image Generator",
    reels_generator: "Reels Generator", enterprise: "Enterprise",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>Help Center</h1>
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Answers, guides, and support for your WorldDigital.ai dashboard</p>
      </div>

      {/* Current plan */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(66,133,199,0.08)" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
        </div>
        <div>
          <p className="text-xs font-black" style={{ color: "#111827" }}>Your Active Plan: {PACKAGE_LABELS[pkg]}</p>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Subscription status: <span className="font-semibold" style={{ color: user?.subscriptionStatus === "active" ? "#16A34A" : "#D97706" }}>{user?.subscriptionStatus || "Active"}</span></p>
        </div>
        <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Active</span>
      </div>

      {/* Package-specific FAQs */}
      {pkgFaqs.length > 0 && (
        <div>
          <p className="text-xs font-black mb-3" style={{ color: "#374151" }}>&#9733; {PACKAGE_LABELS[pkg]} Questions</p>
          <Accordion items={pkgFaqs} />
        </div>
      )}

      {/* General FAQs */}
      <div>
        <p className="text-xs font-black mb-3" style={{ color: "#374151" }}>General Questions</p>
        <Accordion items={GENERAL_FAQS} />
      </div>

      {/* Resources */}
      <div>
        <p className="text-xs font-black mb-3" style={{ color: "#374151" }}>Resources & Guides</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RESOURCES.map((r) => (
            <a key={r.title} href={r.href} className="rounded-2xl p-4 flex items-start gap-3 transition hover:shadow-sm" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", textDecoration: "none" }}>
              <span className="text-xl shrink-0">{r.icon}</span>
              <div>
                <p className="text-xs font-black" style={{ color: "#111827" }}>{r.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{r.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(193,58,42,0.08)" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#C13A2A" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black mb-1" style={{ color: "#111827" }}>Still need help?</p>
            <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Our team is here for you. Average response time: under 4 hours during business hours.</p>
            <div className="flex gap-2 flex-wrap">
              <a href="mailto:support@worlddigital.ai" className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#4285C7" }}>
                Email Support
              </a>
              <a href="mailto:support@worlddigital.ai?subject=Live%20Chat%20Request" className="inline-block px-4 py-2 rounded-xl text-xs font-bold" style={{ color: "#374151", border: "1px solid rgba(0,0,0,0.1)" }}>
                Request Callback
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
