"use client";

import { useState } from "react";
import { SmartCtaLink } from "@/components/home/SmartCtaLink";
import { PlatformIcon } from "@/components/PlatformIcon";

const plans = [
  {
    platform: "snapchat" as const,
    name: "Snapchat",
    subtitle: "Snapchat Ads",
    price: 350,
  },
  {
    platform: "meta" as const,
    name: "Meta",
    subtitle: "Facebook + Instagram",
    price: 350,
  },
  {
    platform: "google" as const,
    name: "Google",
    subtitle: "Google Ads",
    price: 350,
  },
];

const included = [
  "AI-Powered Content Creation",
  "Smart Ad Design Automation",
  "Data-Driven Campaign Analytics",
  "Real-Time Optimization",
  "Dedicated 24/7 Support",
];

export function HomePlansSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="py-20 px-6" style={{ background: "#F8FAFF" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold mb-3" style={{ color: "#C13A2A" }}>Special Offer</p>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Our Plans & Packages
          </h2>
          <p className="text-gray-500 text-base mb-8">
            Unlock exclusive deals on AI-driven marketing solutions...
          </p>
          <div className="inline-flex items-center gap-1 p-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => setIsYearly(false)}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
              style={!isYearly
                ? { background: "#C13A2A", color: "white" }
                : { color: "#6b7280" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
              style={isYearly
                ? { background: "#C13A2A", color: "white" }
                : { color: "#6b7280" }}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {plans.map(({ platform, name, subtitle, price }) => {
            const displayPrice = isYearly ? Math.round(price * 0.9) : price;
            return (
              <div
                key={name}
                className="rounded-2xl p-7"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <PlatformIcon platform={platform} size={40} rounded="rounded-xl" />
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">{name}</h3>
                    <p className="text-gray-400 text-sm">{subtitle}</p>
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 mb-4">
                  ${displayPrice} <span className="text-base font-normal text-gray-400">/month</span>
                </p>
                <p className="text-sm font-bold text-gray-700 mb-3">What&apos;s Included:</p>
                <ul className="space-y-2 mb-6">
                  {included.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#4285C7" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <SmartCtaLink
                  guestHref="/subscribe"
                  authedHref="/dashboard"
                  className="block w-full py-3.5 rounded-xl text-sm font-bold text-white text-center transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
                >
                  Choose Plan
                </SmartCtaLink>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}
