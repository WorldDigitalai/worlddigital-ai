"use client";

import { useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { PlatformIcon } from "@/components/PlatformIcon";

const CATEGORIES = [
  "Restaurant/Cafe", "Retail/E-Commerce", "Health & Beauty", "Fitness/Gym",
  "Real Estate", "Legal/Professional", "Home Services", "Education",
  "Automotive", "Tech/SaaS", "Healthcare/Dental", "Other",
];

const BRAND_VOICES = [
  "Professional & Trustworthy", "Friendly & Approachable", "Bold & Energetic",
  "Witty & Playful", "Luxury & Premium",
];

export default function OnboardingPage() {
  const { user, updateUser } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: user?.businessName || "",
    businessURL: user?.businessURL || "https://",
    businessCategory: user?.businessCategory || "",
    businessDescription: user?.businessDescription || "",
    businessLocation: user?.businessLocation || "",
    logoURL: user?.logoURL || "",
    primaryColor: user?.primaryColor || "#4285C7",
    secondaryColor: user?.secondaryColor || "#C13A2A",
    brandVoice: user?.brandVoice || "Professional & Trustworthy",
  });
  const [logoPreview, setLogoPreview] = useState(user?.logoURL || "");
  const [dragOver, setDragOver] = useState(false);

  const patch = useCallback((k: string, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.size < 5 * 1024 * 1024) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      patch("logoURL", url);
    }
  };

  const handleLogoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size < 5 * 1024 * 1024) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      patch("logoURL", url);
    }
  };

  const platforms = Object.entries(user?.platforms ?? {});

  const canNext = () => {
    if (step === 1) return form.businessName.trim() && form.businessURL.startsWith("https://");
    if (step === 2) return !!logoPreview;
    return true;
  };

  const launch = () => {
    updateUser({
      ...form,
      onboardingComplete: true,
    });
    router.push("/dashboard");
  };

  const progress = ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "#F1F5F9" }}>
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 h-2 rounded-full transition-all" style={{ background: s <= step ? "linear-gradient(to right,#4285C7,#C13A2A)" : "#E2E8F0" }} />
          ))}
        </div>
        <p className="text-xs font-bold mb-6" style={{ color: "#6B7280" }}>Step {step} of 4</p>

        {/* Card */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          {step === 1 && (
            <>
              <h2 className="text-xl font-black mb-1" style={{ color: "#111827" }}>Business Profile</h2>
              <p className="text-xs mb-6" style={{ color: "#6B7280" }}>Tell us about your business so we can create content tailored to you.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Business Name *</label>
                  <input value={form.businessName} onChange={(e) => patch("businessName", e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="Your business name" />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Website URL *</label>
                  <input value={form.businessURL} onChange={(e) => patch("businessURL", e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="https://yourbusiness.com" />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Business Category</label>
                  <select value={form.businessCategory} onChange={(e) => patch("businessCategory", e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Business Description</label>
                  <textarea value={form.businessDescription} onChange={(e) => patch("businessDescription", e.target.value)} maxLength={300} rows={3} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="Describe what you do and who your customers are" />
                  <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{form.businessDescription.length}/300</p>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Primary Location / City</label>
                  <input value={form.businessLocation} onChange={(e) => patch("businessLocation", e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="e.g. Austin, TX" />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-black mb-1" style={{ color: "#111827" }}>Brand Identity</h2>
              <p className="text-xs mb-6" style={{ color: "#6B7280" }}>This logo and brand style will appear on every post we create for you.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Logo Upload</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleLogoDrop}
                    onClick={() => document.getElementById("logo-input")?.click()}
                    className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition"
                    style={{ borderColor: dragOver ? "#4285C7" : "rgba(0,0,0,0.12)", background: dragOver ? "rgba(66,133,199,0.04)" : "#FAFBFC" }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain mx-auto rounded-lg" />
                    ) : (
                      <>
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>Drop logo here or click to upload</p>
                        <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>PNG, JPG, SVG — max 5MB</p>
                      </>
                    )}
                  </div>
                  <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoInput} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.primaryColor} onChange={(e) => patch("primaryColor", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                      <input value={form.primaryColor} onChange={(e) => patch("primaryColor", e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.secondaryColor} onChange={(e) => patch("secondaryColor", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                      <input value={form.secondaryColor} onChange={(e) => patch("secondaryColor", e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Brand Voice</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BRAND_VOICES.map((v) => (
                      <button
                        key={v}
                        onClick={() => patch("brandVoice", v)}
                        className="text-left px-3 py-2.5 rounded-xl text-xs font-semibold border transition"
                        style={{
                          borderColor: form.brandVoice === v ? "#4285C7" : "rgba(0,0,0,0.08)",
                          background: form.brandVoice === v ? "rgba(66,133,199,0.06)" : "white",
                          color: form.brandVoice === v ? "#4285C7" : "#374151",
                        }}
                      >
                        {form.brandVoice === v && <span className="mr-1">&#10003;</span>}{v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-black mb-1" style={{ color: "#111827" }}>Platform Setup</h2>
              <p className="text-xs mb-6" style={{ color: "#6B7280" }}>Review your included platforms. API connections are activated by our team within 24 hours.</p>
              <div className="space-y-3">
                {platforms.length === 0 ? (
                  <p className="text-xs" style={{ color: "#6B7280" }}>Your package does not include social posting. You can upgrade anytime.</p>
                ) : (
                  platforms.map(([key, p]) => (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#FAFBFC", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <PlatformIcon platform={key} size={32} rounded="rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold capitalize" style={{ color: "#111827" }}>{key}</p>
                        <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Daily budget: ${p.dailyBudget}/day</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0" style={{ background: "rgba(245,158,11,0.12)", color: "#D97706" }}>&#9889; Ready to Connect</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-black mb-1" style={{ color: "#111827" }}>Review & Launch</h2>
              <p className="text-xs mb-6" style={{ color: "#6B7280" }}>Everything looks good. Launch your dashboard to start managing your campaigns.</p>
              <div className="rounded-xl p-4 space-y-2" style={{ background: "#FAFBFC", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="flex justify-between text-xs"><span style={{ color: "#6B7280" }}>Business</span><span className="font-semibold" style={{ color: "#111827" }}>{form.businessName}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: "#6B7280" }}>Website</span><span className="font-semibold" style={{ color: "#111827" }}>{form.businessURL}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: "#6B7280" }}>Category</span><span className="font-semibold" style={{ color: "#111827" }}>{form.businessCategory || "—"}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: "#6B7280" }}>Brand Voice</span><span className="font-semibold" style={{ color: "#111827" }}>{form.brandVoice}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: "#6B7280" }}>Colors</span><span className="font-semibold flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: form.primaryColor }} /><span className="w-3 h-3 rounded-full inline-block" style={{ background: form.secondaryColor }} /></span></div>
                <div className="flex justify-between text-xs"><span style={{ color: "#6B7280" }}>Platforms</span><span className="font-semibold" style={{ color: "#111827" }}>{platforms.length > 0 ? platforms.map(([k]) => k).join(", ") : "None (SEO/tools only)"}</span></div>
              </div>
              <button
                onClick={launch}
                className="w-full mt-6 py-3 rounded-xl text-sm font-black text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
              >
                Launch My Dashboard &rarr;
              </button>
              <p className="text-[10px] text-center mt-2" style={{ color: "#9CA3AF" }}>&#9889; Your first campaign will be live within 24 hours after our team connects your platforms.</p>
            </>
          )}

          {/* Nav buttons */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-30"
                style={{ color: "#6B7280", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                Back
              </button>
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white transition disabled:opacity-40"
                style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
