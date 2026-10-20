"use client";

import Link from "next/link";

const categories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    faqs: [
      {
        q: "How do I get started with worlddigital.ai?",
        a: "Sign up, choose a plan, connect your ad accounts (Google, Meta, or Snapchat), upload your logo, select your business category, and we'll launch your first automated campaigns in minutes.",
      },
      {
        q: "What ad platforms does worlddigital.ai support?",
        a: "We currently support Google Ads, Meta Ads (Facebook & Instagram), and Snapchat Ads. More platforms are on the roadmap.",
      },
      {
        q: "Do I need an existing ad account?",
        a: "No. If you don't have existing accounts, we guide you through creating them during onboarding. You'll need to connect them so we can manage campaigns on your behalf.",
      },
      {
        q: "How long does setup take?",
        a: "Most businesses go from signup to live campaigns in under 10 minutes. Our onboarding requires zero prior marketing knowledge.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & Plans",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    faqs: [
      {
        q: "What's included in each plan?",
        a: "All plans include full access to our AI campaign management platform across Google, Meta, and Snapchat. See our Pricing page for a full comparison.",
      },
      {
        q: "Is the ad spend included?",
        a: "No. Your ad budget goes directly to Google, Meta, or Snapchat. Our fee covers the AI platform that manages your campaigns — not the media spend itself.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes. Cancel with one click from your account settings. No contracts, no cancellation fees.",
      },
      {
        q: "Do you offer refunds?",
        a: "Subscriptions are non-refundable for the current billing period. If you have concerns before subscribing, contact us — we're happy to walk you through what to expect.",
      },
    ],
  },
  {
    id: "campaigns",
    title: "Campaigns & Performance",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    faqs: [
      {
        q: "How does the AI optimize my campaigns?",
        a: "Our AI continuously analyzes performance data — impressions, clicks, conversions, and costs — and makes real-time adjustments to bids, audiences, and creatives to improve your results.",
      },
      {
        q: "How long before I see results?",
        a: "Most campaigns see initial data within 24-48 hours. AI optimization becomes more effective after 7-14 days as the model learns from your specific campaign data.",
      },
      {
        q: "Can I make manual changes to my campaigns?",
        a: "Yes. You can always access your ad accounts directly and make changes. However, our AI will continue optimizing — we recommend discussing significant manual changes with our support team.",
      },
      {
        q: "What happens if my campaign underperforms?",
        a: "Our AI will automatically adjust strategy. If performance issues persist, you'll receive a notification and can open a support ticket for human review.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="pt-24 pb-12 px-6"
        style={{ background: "linear-gradient(160deg, #FDE8E2 0%, #E8F4FD 100%)" }}
      >
        <div className="max-w-lg mx-auto">
          <div className="eyebrow-line mb-5">Help Center</div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-6">
            How Can We Help You?
          </h1>
          {/* Search */}
          <div className="relative">
            <input
              type="search"
              placeholder="Search help articles..."
              className="input-light pr-12"
              aria-label="Search help articles"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section id="faq" className="py-12 px-6" style={{ background: "#E8F4FD" }}>
        <div className="max-w-lg mx-auto space-y-10">
          {categories.map(({ id, title, icon, faqs }) => (
            <div key={id} id={id}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(193,58,42,0.1)" }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#C13A2A" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-gray-900">{title}</h2>
              </div>
              <div className="space-y-3">
                {faqs.map(({ q, a }) => (
                  <details
                    key={q}
                    className="group rounded-xl"
                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-800 text-sm list-none p-4">
                      {q}
                      <svg
                        className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* Support CTA */}
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "white", border: "1.5px solid rgba(193,58,42,0.2)" }}
          >
            <h3 className="text-xl font-black text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-500 text-sm mb-2">
              Our support team typically responds within 2 business hours.
            </p>
            <p className="font-medium mb-6" style={{ color: "#C13A2A" }}>support@worlddigital.ai</p>
            <div className="flex flex-col gap-3">
              <a href="mailto:support@worlddigital.ai" className="btn-gradient justify-center py-3.5">
                Email Support
              </a>
              <Link href="/login" className="btn-outline justify-center py-3.5">
                Login to open a ticket
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
