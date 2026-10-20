"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const GOALS = [
  "Get more customers",
  "Promote an offer",
  "Launch a new product",
  "Increase bookings",
  "Grow social media",
];

const CATEGORIES = [
  "Restaurant / Cafe", "Retail / E-Commerce", "Health & Beauty", "Fitness / Gym",
  "Real Estate", "Legal / Professional Services", "Home Services", "Education",
  "Automotive", "Tech / SaaS", "Healthcare / Dental", "Other",
];

interface DemoResult {
  caption: string;
  shortCaption: string;
  hashtags: string[];
  cta: string;
  imagePrompt: string;
  imageStyle: string;
  platform: string;
  platformReason: string;
  campaignGoal: string;
  adFormat: string;
  estimatedReach: string;
}

function buildTemplateResult(businessName: string, category: string, goal: string): DemoResult {
  const templates: Record<string, DemoResult> = {
    "Restaurant / Cafe": {
      caption: `Craving something incredible? ${businessName || "We"} bring bold flavors to every bite. Whether you're dining in or ordering out, every dish is crafted with care. Visit us today and taste the difference. 🍽️`,
      shortCaption: `Fresh flavors, every day. Come dine with ${businessName || "us"} — your next favorite meal is waiting!`,
      hashtags: ["#foodie", "#localrestaurant", "#eats", "#fresh", "#dinein", "#supportlocal"],
      cta: goal === "Increase bookings" ? "Reserve a table now →" : "Order online today →",
      imagePrompt: `Mouth-watering flat lay of signature dishes from ${businessName || "a restaurant"}, warm lighting, restaurant interior background, professional food photography, vibrant colors`,
      imageStyle: "Warm food photography with professional plating and natural lighting",
      platform: "Instagram",
      platformReason: "Instagram drives 3.5x more food-related engagement than other platforms. High visual content performs exceptionally well.",
      campaignGoal: goal,
      adFormat: "Image carousel + Story ads with swipe-up CTA",
      estimatedReach: "8,000 – 22,000 local people per month",
    },
    "Fitness / Gym": {
      caption: `Your transformation starts today. ${businessName || "We"} offer world-class coaching, state-of-the-art equipment, and a community that keeps you accountable. Stop waiting. Start winning.`,
      shortCaption: `Train smarter. Get stronger. ${businessName || "Join us"} and transform your body — one session at a time.`,
      hashtags: ["#fitness", "#gym", "#workout", "#transformation", "#getfit", "#health"],
      cta: "Claim your free first session →",
      imagePrompt: `Energetic gym interior with motivated people working out, modern equipment, dynamic lighting, ${businessName || "fitness studio"} branding, professional sports photography`,
      imageStyle: "High-energy sports photography with dynamic angles and motivating atmosphere",
      platform: "Instagram",
      platformReason: "Fitness content thrives on Instagram & TikTok. Video-first reels of workouts achieve 5x organic reach.",
      campaignGoal: goal,
      adFormat: "Video reel + Lead gen form for free trial",
      estimatedReach: "10,000 – 28,000 people in your area per month",
    },
    "Retail / E-Commerce": {
      caption: `Style that speaks for itself. ${businessName || "Our"} collection features premium pieces designed to elevate your every look. Limited stock. Shop now before it's gone.`,
      shortCaption: `New arrivals are here. ${businessName || "Shop"} the latest styles — limited pieces, endless possibilities.`,
      hashtags: ["#shopnow", "#newcollection", "#fashion", "#style", "#retail", "#ootd"],
      cta: "Shop the new collection →",
      imagePrompt: `Clean product flat lay of fashion items on white marble surface, ${businessName || "retail brand"} aesthetic, soft natural lighting, editorial photography style, minimal background`,
      imageStyle: "Clean editorial flat lay with minimal, high-contrast composition",
      platform: "Meta (Facebook + Instagram)",
      platformReason: "Meta's product catalog ads and dynamic retargeting deliver the highest ROAS for retail businesses.",
      campaignGoal: goal,
      adFormat: "Product carousel + Dynamic retargeting ads",
      estimatedReach: "12,000 – 35,000 targeted shoppers per month",
    },
  };

  const defaultResult: DemoResult = {
    caption: `${businessName || "Our business"} is redefining what great service looks like. With a focus on quality, reliability, and results, we've built a reputation that speaks for itself. Ready to experience the difference? Let's talk.`,
    shortCaption: `Quality you can count on. ${businessName || "Contact us"} today and discover why our customers keep coming back.`,
    hashtags: ["#qualityservice", "#trusted", "#localbusiness", "#professional", "#excellence"],
    cta: goal === "Get more customers" ? "Get your free quote →" : goal === "Increase bookings" ? "Book your appointment →" : "Learn more →",
    imagePrompt: `Professional business environment for ${businessName || "a local business"} in ${category.toLowerCase()}, modern interior, confident team, clean branding, high-end commercial photography`,
    imageStyle: "Professional commercial photography with clean, trustworthy aesthetic",
    platform: "Google Search + Meta",
    platformReason: "Combining Google Search intent targeting with Meta's audience-based ads maximizes both discovery and retargeting.",
    campaignGoal: goal,
    adFormat: "Search ads for intent + Display retargeting",
    estimatedReach: "6,000 – 18,000 targeted prospects per month",
  };

  return templates[category] || defaultResult;
}

export default function InstantDemoMode() {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [goal, setGoal] = useState(GOALS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState("");

  if (user) return null;

  const handleGenerate = async () => {
    if (!category) { setError("Please select a business category."); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, category, websiteUrl, goal }),
      });

      if (res.ok) {
        const data = await res.json() as DemoResult;
        setResult(data);
      } else {
        throw new Error("API unavailable");
      }
    } catch {
      // Always fall back to templates — demo must never fail
      const templateResult = buildTemplateResult(businessName, category, goal);
      setResult(templateResult);
    }

    setLoading(false);

    // Persist demo data so signup can prefill
    try {
      sessionStorage.setItem("wdai_demo", JSON.stringify({ businessName, category, websiteUrl, goal }));
    } catch {
      // ignore
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.1)",
    fontSize: "14px", outline: "none", background: "white", color: "#1A1A1A",
    boxSizing: "border-box", transition: "border-color 150ms",
  };

  return (
    <section
      id="demo"
      style={{
        background: "linear-gradient(180deg, #DAEEFF 0%, #EEF6FF 40%, #FFF0EA 100%)",
        padding: "80px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Blobs */}
      <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(29,127,232,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(193,58,42,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: "50px", background: "rgba(29,127,232,0.1)", marginBottom: 16 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#1D7FE8" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1D4ED8" }}>No signup required</span>
          </div>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, color: "#111827", lineHeight: 1.15, marginBottom: 12 }}>
            Try the AI in 30 Seconds
          </h2>
          <p style={{ fontSize: "17px", color: "#4B5563", maxWidth: 520, margin: "0 auto" }}>
            Enter your business type and see a sample post, caption, and campaign preview instantly.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, alignItems: "start" }}>
          {/* Form */}
          <div style={{ background: "white", borderRadius: "24px", padding: "32px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)", maxWidth: 520, margin: "0 auto", width: "100%" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>Your Business</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Business Name</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Bella's Kitchen"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "#1D7FE8")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Business Category <span style={{ color: "#C13A2A" }}>*</span>
                </label>
                <select
                  aria-label="Business category"
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "#1D7FE8")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Website URL <span style={{ fontSize: "11px", fontWeight: 400, color: "#6B7280" }}>optional</span>
                </label>
                <input
                  style={inputStyle}
                  placeholder="https://yourbusiness.com"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "#1D7FE8")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: 8 }}>Campaign Goal</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {GOALS.map(g => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      style={{
                        padding: "6px 12px", borderRadius: "50px", border: "1.5px solid",
                        fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 150ms",
                        borderColor: goal === g ? "#1D7FE8" : "rgba(0,0,0,0.1)",
                        background: goal === g ? "rgba(29,127,232,0.08)" : "white",
                        color: goal === g ? "#1D4ED8" : "#6B7280",
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p style={{ fontSize: "12px", color: "#C13A2A", padding: "10px 12px", background: "rgba(193,58,42,0.06)", borderRadius: "10px", border: "1px solid rgba(193,58,42,0.2)" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  width: "100%", padding: "14px", borderRadius: "14px", border: "none", cursor: loading ? "default" : "pointer",
                  background: loading ? "#E5EAF2" : "linear-gradient(135deg, #4285C7, #C13A2A)",
                  color: loading ? "#9CA3AF" : "white", fontSize: "15px", fontWeight: 800,
                  boxShadow: loading ? "none" : "0 8px 24px rgba(193,58,42,0.28)",
                  transition: "all 200ms", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ animation: "demospin 0.8s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="4" strokeOpacity="0.25" />
                      <path d="M4 12a8 8 0 018-8" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  "Generate Demo Campaign →"
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{ maxWidth: 520, margin: "0 auto", width: "100%", animation: "demoFadeUp 0.5s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {/* Card 1: Caption */}
                <div style={{ background: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #4285C7, #1D7FE8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 800, color: "#111827" }}>Caption Preview</p>
                      <p style={{ fontSize: "11px", color: "#6B7280" }}>AI-generated social post</p>
                    </div>
                  </div>
                  <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "#374151", marginBottom: 12, padding: "12px", background: "#F8FBFE", borderRadius: "10px" }}>{result.caption}</p>
                  <p style={{ fontSize: "12px", lineHeight: 1.5, color: "#6B7280", marginBottom: 10, fontStyle: "italic" }}>{result.shortCaption}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                    {result.hashtags.map(h => (
                      <span key={h} style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", background: "rgba(29,127,232,0.08)", color: "#1D4ED8", borderRadius: "50px" }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ padding: "9px 12px", background: "rgba(193,58,42,0.06)", borderRadius: "10px", border: "1px solid rgba(193,58,42,0.15)" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#C13A2A" }}>CTA: {result.cta}</p>
                  </div>
                </div>

                {/* Card 2: Visual Concept */}
                <div style={{ background: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #7C3AED, #4285C7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 800, color: "#111827" }}>Visual Concept</p>
                      <p style={{ fontSize: "11px", color: "#6B7280" }}>AI image prompt + style guide</p>
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "#F8FBFE", borderRadius: "10px", marginBottom: 10 }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>AI Image Prompt</p>
                    <p style={{ fontSize: "12.5px", color: "#374151", lineHeight: 1.5 }}>{result.imagePrompt}</p>
                  </div>
                  <div style={{ padding: "9px 12px", background: "rgba(124,58,237,0.06)", borderRadius: "10px", border: "1px solid rgba(124,58,237,0.15)" }}>
                    <p style={{ fontSize: "12px", color: "#6D28D9", fontWeight: 600 }}>Style: {result.imageStyle}</p>
                  </div>
                </div>

                {/* Card 3: Campaign Plan */}
                <div style={{ background: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #C13A2A, #D97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 800, color: "#111827" }}>Campaign Plan</p>
                      <p style={{ fontSize: "11px", color: "#6B7280" }}>AI-recommended strategy</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Best Platform", value: result.platform, color: "#1D7FE8" },
                      { label: "Why", value: result.platformReason, color: "#374151" },
                      { label: "Ad Format", value: result.adFormat, color: "#059669" },
                      { label: "Est. Monthly Reach", value: result.estimatedReach, color: "#D97706" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ padding: "10px 12px", background: "#F8FBFE", borderRadius: "10px" }}>
                        <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</p>
                        <p style={{ fontSize: "13px", fontWeight: label === "Why" ? 400 : 700, color, lineHeight: 1.4 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Signup CTA */}
              <div style={{ marginTop: 24, padding: "24px", background: "linear-gradient(135deg, #0d5ec7, #C13A2A)", borderRadius: "20px", textAlign: "center" }}>
                <p style={{ fontSize: "16px", fontWeight: 800, color: "white", marginBottom: 6 }}>Ready to launch this campaign?</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>Create a free account and go live in minutes.</p>
                <Link
                  href="/signup?from=demo"
                  style={{ display: "inline-block", padding: "12px 28px", borderRadius: "12px", background: "white", color: "#0d5ec7", fontSize: "14px", fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
                >
                  Create Account & Launch →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes demospin { to { transform: rotate(360deg); } }
        @keyframes demoFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
