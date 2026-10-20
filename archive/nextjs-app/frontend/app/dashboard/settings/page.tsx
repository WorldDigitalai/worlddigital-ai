"use client";

import { useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import SectionHeader from "../components/SectionHeader";
import TabBar from "../components/TabBar";
import { PlatformIcon } from "@/components/PlatformIcon";

const TABS = ["Profile", "Brand Kit", "Platforms", "Billing", "Notifications"];

const CATEGORIES = [
  "Restaurant/Cafe", "Retail/E-Commerce", "Health & Beauty", "Fitness/Gym",
  "Real Estate", "Legal/Professional", "Home Services", "Education",
  "Automotive", "Tech/SaaS", "Healthcare/Dental", "Other",
];

const BRAND_VOICES = [
  "Professional & Trustworthy", "Friendly & Approachable", "Bold & Energetic",
  "Witty & Playful", "Luxury & Premium",
];

const PLATFORM_INFO: Record<string, { name: string; help: string }> = {
  meta:     { name: "Meta (Facebook + Instagram)", help: "Requires Facebook Business Manager access. Our team handles the connection." },
  google:   { name: "Google Ads",                  help: "Requires Google Ads account. Our team connects using your MCC credentials." },
  snapchat: { name: "Snapchat Ads",                help: "Requires Snapchat Business account. Our team handles OAuth." },
  tiktok:   { name: "TikTok Ads",                  help: "Requires TikTok for Business account. Contact support to connect." },
  linkedin: { name: "LinkedIn Ads",                help: "Requires LinkedIn Campaign Manager. Our team handles the setup." },
  youtube:  { name: "YouTube Ads",                 help: "Managed through your Google Ads account. No separate setup needed." },
  x:        { name: "X (Twitter) Ads",             help: "Requires X Ads account. Contact support to enable." },
};

export default function SettingsPage() {
  const { user, updateUser } = useUser();
  const [tab, setTab] = useState("Profile");

  const [form, setForm] = useState({
    businessName:        user?.businessName || "",
    businessURL:         user?.businessURL || "https://",
    businessCategory:    user?.businessCategory || "",
    businessDescription: user?.businessDescription || "",
    businessLocation:    user?.businessLocation || "",
    primaryColor:        user?.primaryColor || "#4285C7",
    secondaryColor:      user?.secondaryColor || "#C13A2A",
    brandVoice:          user?.brandVoice || "Professional & Trustworthy",
    logoURL:             user?.logoURL || "",
  });
  const [logoPreview, setLogoPreview] = useState(user?.logoURL || "");
  const [dragOver, setDragOver] = useState(false);
  const [savedTab, setSavedTab] = useState<string | null>(null);

  const patch = useCallback((k: string, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  const save = (section: string) => {
    updateUser({ ...form, logoURL: logoPreview || form.logoURL });
    setSavedTab(section);
    setTimeout(() => setSavedTab(null), 2000);
  };

  const handleLogoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size < 5 * 1024 * 1024) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      patch("logoURL", url);
    }
  };

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

  const SaveBtn = ({ section }: { section: string }) => (
    <button
      onClick={() => save(section)}
      className="px-5 py-2.5 rounded-xl text-xs font-black text-white transition hover:opacity-90"
      style={{ background: savedTab === section ? "#16A34A" : "linear-gradient(to right,#4285C7,#C13A2A)" }}
    >
      {savedTab === section ? "✓ Saved!" : "Save Changes"}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>Settings</h1>
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Manage your profile, brand, platform connections, and billing</p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── PROFILE ── */}
      {tab === "Profile" && (
        <div className="max-w-xl space-y-4">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Business Name</label>
            <input value={form.businessName} onChange={(e) => patch("businessName", e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="Your business name" />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Website URL</label>
            <input value={form.businessURL} onChange={(e) => patch("businessURL", e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="https://yourbusiness.com" />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Business Category</label>
            <select value={form.businessCategory} onChange={(e) => patch("businessCategory", e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border bg-white focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Primary Location / City</label>
            <input value={form.businessLocation} onChange={(e) => patch("businessLocation", e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="e.g. Austin, TX" />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Business Description</label>
            <textarea value={form.businessDescription} onChange={(e) => patch("businessDescription", e.target.value)} rows={4} maxLength={400} className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="Describe your business, services, and target customers..." />
            <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{form.businessDescription.length}/400 — Used by AI for content generation</p>
          </div>
          <SaveBtn section="Profile" />
        </div>
      )}

      {/* ── BRAND KIT ── */}
      {tab === "Brand Kit" && (
        <div className="max-w-xl space-y-5">
          <div>
            <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Business Logo</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleLogoDrop}
              onClick={() => document.getElementById("logo-settings-input")?.click()}
              className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition"
              style={{ borderColor: dragOver ? "#4285C7" : "rgba(0,0,0,0.12)", background: dragOver ? "rgba(66,133,199,0.04)" : "#FAFBFC" }}
            >
              {logoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-xl border" style={{ borderColor: "rgba(0,0,0,0.08)" }} />
                  <p className="text-xs font-semibold" style={{ color: "#4285C7" }}>Click to change logo</p>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>Drop your logo or click to upload</p>
                  <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>PNG, JPG, SVG — max 5MB</p>
                </>
              )}
            </div>
            <input id="logo-settings-input" type="file" accept="image/*" className="hidden" onChange={handleLogoInput} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={(e) => patch("primaryColor", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5" />
                <input value={form.primaryColor} onChange={(e) => patch("primaryColor", e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.secondaryColor} onChange={(e) => patch("secondaryColor", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5" />
                <input value={form.secondaryColor} onChange={(e) => patch("secondaryColor", e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl p-4" style={{ background: "#FAFBFC", border: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[10px] font-bold mb-2" style={{ color: "#9CA3AF" }}>BRAND PREVIEW</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: `linear-gradient(135deg,${form.primaryColor},${form.secondaryColor})` }}>
                {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-contain rounded-xl" /> : (form.businessName?.[0]?.toUpperCase() || "B")}
              </div>
              <div>
                <p className="text-xs font-black" style={{ color: "#111827" }}>{form.businessName || "Your Business"}</p>
                <div className="flex gap-1 mt-1">
                  <span className="w-4 h-1.5 rounded-full" style={{ background: form.primaryColor }} />
                  <span className="w-4 h-1.5 rounded-full" style={{ background: form.secondaryColor }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Brand Voice</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BRAND_VOICES.map((v) => (
                <button key={v} onClick={() => patch("brandVoice", v)} className="text-left px-3 py-2.5 rounded-xl text-xs font-semibold border transition" style={{ borderColor: form.brandVoice === v ? "#4285C7" : "rgba(0,0,0,0.08)", background: form.brandVoice === v ? "rgba(66,133,199,0.06)" : "white", color: form.brandVoice === v ? "#4285C7" : "#374151" }}>
                  {form.brandVoice === v && "✓ "}{v}
                </button>
              ))}
            </div>
          </div>
          <SaveBtn section="Brand Kit" />
        </div>
      )}

      {/* ── PLATFORMS ── */}
      {tab === "Platforms" && (
        <div className="space-y-4 max-w-2xl">
          <div className="rounded-xl p-4" style={{ background: "rgba(66,133,199,0.05)", border: "1px solid rgba(66,133,199,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "#1e40af" }}>
              &#128273; Platform connections are managed by the WorldDigital.ai team. Your credentials are stored securely and never shared. To add a new platform or update credentials, contact <a href="mailto:support@worlddigital.ai" className="underline">support@worlddigital.ai</a>.
            </p>
          </div>

          {Object.entries(user?.platforms ?? {}).length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-sm font-black mb-1" style={{ color: "#111827" }}>No platforms configured</p>
              <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Your package may be SEO/tools-only, or platforms will be connected during onboarding.</p>
              <a href="mailto:support@worlddigital.ai" className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#4285C7" }}>Contact Support to Connect Platforms</a>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(user?.platforms ?? {}).map(([key, p]) => {
                const info = PLATFORM_INFO[key] ?? { name: key.charAt(0).toUpperCase() + key.slice(1), help: "Managed by our team." };
                return (
                  <div key={key} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={key} size={36} rounded="rounded-xl" />
                        <div>
                          <p className="text-xs font-black" style={{ color: "#111827" }}>{info.name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>Daily budget: ${p.dailyBudget}/day</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.status === "live" ? "#16A34A" : p.status === "error" ? "#DC2626" : "#D97706" }} />
                        <span className="text-xs font-bold capitalize" style={{ color: p.status === "live" ? "#16A34A" : p.status === "error" ? "#DC2626" : "#D97706" }}>{p.status}</span>
                      </div>
                    </div>
                    <p className="text-[10px] mt-3 pt-3" style={{ color: "#9CA3AF", borderTop: "1px solid rgba(0,0,0,0.05)" }}>{info.help}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-black mb-3" style={{ color: "#111827" }}>Available Platform Connections</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(PLATFORM_INFO).filter(([k]) => !(user?.platforms ?? {})[k]).map(([key, info]) => (
                <div key={key} className="rounded-xl p-3 flex items-center gap-2.5 opacity-50" style={{ background: "#FAFBFC", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <PlatformIcon platform={key} size={24} rounded="rounded-md" />
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: "#374151" }}>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                    <p className="text-[9px]" style={{ color: "#9CA3AF" }}>Not in plan</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-3" style={{ color: "#9CA3AF" }}>Upgrade your plan to unlock additional platforms.</p>
          </div>
        </div>
      )}

      {/* ── BILLING ── */}
      {tab === "Billing" && (
        <div className="space-y-4 max-w-xl">
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <SectionHeader title="Current Plan" />
            <div className="flex items-center justify-between mt-3 p-3 rounded-xl" style={{ background: "#FAFBFC" }}>
              <div>
                <p className="text-sm font-black" style={{ color: "#111827" }}>{user?.subscriptionPlan || "Enterprise Plan"}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  {user?.subscriptionStatus === "active" ? "Active — renews monthly" : "Check billing status"}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
                {user?.subscriptionStatus === "active" ? "Active" : "Check Status"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <SectionHeader title="Payment Method" />
            <p className="text-xs mt-2" style={{ color: "#6B7280" }}>Manage your payment methods, download invoices, and update billing details through the Stripe billing portal.</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <a href="/dashboard/billing" className="px-4 py-2 rounded-xl text-xs font-bold text-white inline-block" style={{ background: "#4285C7", textDecoration: "none" }}>Open Billing Portal</a>
              <a href="mailto:support@worlddigital.ai" className="px-4 py-2 rounded-xl text-xs font-bold" style={{ color: "#6B7280", border: "1px solid rgba(0,0,0,0.1)" }}>Contact Billing Support</a>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <SectionHeader title="Plan Features" />
            <div className="space-y-2 mt-2">
              {[
                "AI-powered content generation",
                "Managed ad campaigns",
                "SEO dashboard & auditing",
                "Priority support (24h response)",
                "Monthly strategy reports",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-xs" style={{ color: "#374151" }}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === "Notifications" && (
        <div className="max-w-xl space-y-3">
          <p className="text-xs" style={{ color: "#6B7280" }}>Choose what notifications you receive by email.</p>
          {[
            { label: "Campaign performance alerts",      desc: "Get notified when campaigns need attention or hit goals",         defaultOn: true  },
            { label: "Weekly summary email",             desc: "Every Monday: stats, posts published, and recommended actions",   defaultOn: true  },
            { label: "New post published",               desc: "Alert when we publish content on your behalf",                    defaultOn: false },
            { label: "AI content ready",                 desc: "When generated content is ready to review or approve",           defaultOn: true  },
            { label: "Billing reminders",                desc: "Upcoming charges, payment issues, and invoice receipts",         defaultOn: true  },
            { label: "SEO ranking changes",              desc: "Alerts when your keyword rankings change significantly",         defaultOn: false },
            { label: "Platform connection updates",      desc: "When a platform connects, disconnects, or has an error",        defaultOn: true  },
          ].map((n) => (
            <label key={n.label} className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition hover:bg-gray-50" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <input type="checkbox" defaultChecked={n.defaultOn} className="w-4 h-4 mt-0.5 rounded accent-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold" style={{ color: "#374151" }}>{n.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{n.desc}</p>
              </div>
            </label>
          ))}
          <button className="px-5 py-2.5 rounded-xl text-xs font-black text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
            Save Notification Preferences
          </button>
        </div>
      )}
    </div>
  );
}
