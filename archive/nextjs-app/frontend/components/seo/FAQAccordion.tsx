"use client";

import { useState } from "react";

interface FAQ {
  q: string;
  a: string;
}

export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
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
              className="w-full flex items-center justify-between px-6 py-5 text-left"
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
  );
}
