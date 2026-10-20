"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    q: "Do I need marketing experience to use WorldDigital.ai?",
    a: "Not at all. The platform is built for business owners, not marketers. You answer a few questions about your business, upload your logo, and the AI handles the rest — copy, visuals, targeting, and launch.",
  },
  {
    q: "Can I choose which platforms to advertise on?",
    a: "Yes. You can start with just Google, Meta, or Snapchat, and add more platforms whenever you're ready. Each platform is billed separately with no bundle required.",
  },
  {
    q: "Does the AI generate images and ad copy?",
    a: "Yes. Every campaign produces five AI-written ad descriptions and five visual ad concepts. If you select a video/reel format, you'll also receive reel concepts tailored to your business.",
  },
  {
    q: "Can I use one channel first and expand later?",
    a: "Absolutely. Start with one platform and add more channels whenever your business is ready to expand its reach.",
  },
  {
    q: "Do I need a long-term contract?",
    a: "No. All plans are month-to-month. There are no setup fees, no lock-in periods, and you can cancel anytime from your dashboard.",
  },
];

export function HomeFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 lg:py-32 px-6" style={{ background: "#F7FAFC" }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold mb-3" style={{ color: "#1D7FE8" }}>FAQ</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4" style={{ color: "#111827" }}>
            Questions before you launch?
          </h2>
          <p className="text-lg" style={{ color: "#4B5563" }}>
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "white",
                  border: isOpen ? "1.5px solid #BFDBFE" : "1.5px solid #E5EAF2",
                  boxShadow: isOpen ? "0 4px 20px rgba(29,127,232,0.08)" : "0 2px 8px rgba(15,23,42,0.04)",
                }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left transition-all"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold pr-4" style={{ color: "#111827" }}>{q}</span>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: isOpen ? "#EEF6FF" : "#F7FAFC",
                      color: isOpen ? "#1D7FE8" : "#9CA3AF",
                      border: "1.5px solid",
                      borderColor: isOpen ? "#BFDBFE" : "#E5EAF2",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5">
                    <div className="border-t mb-4" style={{ borderColor: "#EEF6FF" }} />
                    <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm mb-3" style={{ color: "#9CA3AF" }}>Still have questions?</p>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:underline"
            style={{ color: "#1D7FE8" }}
          >
            Visit the full Help Center
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
