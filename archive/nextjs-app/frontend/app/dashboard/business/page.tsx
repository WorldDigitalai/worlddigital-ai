"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

interface BusinessProfile {
  businessName: string;
  websiteUrl: string;
  destinationUrl: string;
  category: string;
  description: string;
  targetAudience: string;
  location: string;
  mainOffer: string;
  brandTone: string;
  logoUrl?: string;
  brandColors?: string;
  phone?: string;
  email?: string;
  bookingUrl?: string;
  googleMapsUrl?: string;
  notes?: string;
  socialLinks?: Record<string, string>;
}

const BRAND_TONES = ["Professional", "Friendly", "Energetic", "Luxurious", "Playful", "Authoritative", "Casual", "Bold"];
const CATEGORIES = ["Restaurant & Food", "Retail & Shopping", "Health & Wellness", "Beauty & Spa", "Real Estate", "Legal Services", "Financial Services", "Education", "Technology", "Home Services", "Automotive", "Entertainment", "Fitness & Sports", "Travel & Hospitality", "Non-profit", "E-commerce", "Consulting", "Other"];

const EMPTY: BusinessProfile = {
  businessName: "", websiteUrl: "", destinationUrl: "", category: "", description: "",
  targetAudience: "", location: "", mainOffer: "", brandTone: "Professional",
  logoUrl: "", brandColors: "", phone: "", email: "", bookingUrl: "", googleMapsUrl: "", notes: "",
  socialLinks: { instagram: "", facebook: "", tiktok: "", linkedin: "", youtube: "", x: "" },
};

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{hint}</p>}
    </div>
  );
}

function LogoUpload({ logoUrl, onLogoChange }: { logoUrl: string; onLogoChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const handleFile = async (file: File) => {
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) { setUploadError("File must be under 5 MB"); return; }
    if (!file.type.startsWith("image/")) { setUploadError("Only image files are accepted"); return; }

    setUploading(true);
    setUploadError(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("wdai_token") : null;
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/v1/upload/logo", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json() as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        setUploadError(data.message ?? "Upload failed");
      } else {
        onLogoChange(data.url);
        setToast(true);
        setTimeout(() => setToast(false), 3000);
      }
    } catch {
      setUploadError("Network error — please try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {logoUrl ? (
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#F9FAFB" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Business logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7", border: "1px solid rgba(66,133,199,0.2)" }}
            >
              {uploading ? "Uploading…" : "Replace Logo"}
            </button>
            <button
              type="button"
              onClick={() => onLogoChange("")}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              Remove Logo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl transition-all hover:opacity-80 disabled:opacity-50"
          style={{ border: "2px dashed rgba(66,133,199,0.3)", background: "rgba(66,133,199,0.03)", color: "#4285C7" }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-bold">{uploading ? "Uploading…" : "Click to upload logo"}</span>
          <span className="text-[11px]" style={{ color: "#9CA3AF" }}>PNG, JPG, SVG · max 5 MB</span>
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {uploadError && <p className="text-xs text-red-600 font-medium">{uploadError}</p>}
      {toast && <p className="text-xs font-bold" style={{ color: "#16A34A" }}>✓ Logo uploaded successfully</p>}
    </div>
  );
}

export default function BusinessProfilePage() {
  const [form, setForm] = useState<BusinessProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI preview states
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiOriginal, setAiOriginal] = useState<string>("");
  const [aiExpanding, setAiExpanding] = useState(false);

  useEffect(() => {
    apiFetch<BusinessProfile | null>("/v1/dashboard/business").then((res) => {
      if (res.ok && res.data) {
        setForm({ ...EMPTY, ...res.data, socialLinks: { ...EMPTY.socialLinks, ...(res.data.socialLinks || {}) } });
      }
      setLoading(false);
    });
  }, []);

  const set = (field: keyof BusinessProfile, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
    setError(null);
  };
  const setSocial = (platform: string, value: string) => {
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [platform]: value } }));
    setSaved(false);
  };

  const expandWithAI = async () => {
    if (!form.description.trim()) return;
    setAiExpanding(true);
    setError(null);
    setAiPreview(null);
    setAiOriginal(form.description);

    try {
      const res = await apiFetch<{ description: string }>("/v1/business/expand", {
        method: "POST",
        body: {
          businessName: form.businessName,
          category: form.category,
          websiteUrl: form.websiteUrl,
          description: form.description,
        },
        timeoutMs: 30000,
      });
      if (res.ok && res.data?.description) {
        setAiPreview(res.data.description.trim());
      } else {
        setError(res.error || "AI expansion failed. Please try again.");
      }
    } catch {
      setError("AI expansion failed. Please try again.");
    } finally {
      setAiExpanding(false);
    }
  };

  const applyAI = () => {
    if (!aiPreview) return;
    setForm((f) => ({ ...f, description: aiPreview }));
    setAiPreview(null);
    setAiOriginal("");
    setSaved(false);
  };

  const discardAI = () => {
    setAiPreview(null);
    setAiOriginal("");
    // Original form.description is untouched
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const body = { ...form, destinationUrl: form.websiteUrl };
    const res = await apiFetch("/v1/dashboard/business", { method: "PUT", body });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } else {
      setError(res.error || "Failed to save");
    }
    setSaving(false);
  };

  const input = "w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all";
  const inputStyle = { background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "#1A1A1A" };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Business Profile</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          This information powers all AI-generated content for your business.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Core info */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 className="text-sm font-black mb-4" style={{ color: "#111827" }}>Core Business Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Name" required>
              <input className={input} style={inputStyle} placeholder="e.g. Murfreesboro Kabob" value={form.businessName} onChange={e => set("businessName", e.target.value)} required />
            </Field>
            <Field label="Business Category" required>
              <select className={input} style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Website URL" required hint="Your business website — all post CTA links will direct here">
                <input className={input} style={inputStyle} type="url" placeholder="https://yourbusiness.com" value={form.websiteUrl} onChange={e => set("websiteUrl", e.target.value)} required />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Business Description" required hint="Describe your business for AI content generation">
                <textarea className={input} style={inputStyle} rows={3} placeholder="We serve authentic Middle Eastern kabob dishes made fresh daily..." value={form.description} onChange={e => set("description", e.target.value)} required />
              </Field>
              <button
                type="button"
                onClick={expandWithAI}
                disabled={aiExpanding || !form.description.trim()}
                className="mt-2 flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)", color: "white" }}
              >
                {aiExpanding ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Expanding with AI…
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Expand with AI
                  </>
                )}
              </button>

              {/* AI preview box */}
              {aiPreview && (
                <div className="mt-4 rounded-2xl p-5 border" style={{ background: "white", border: "1px solid rgba(66,133,199,0.25)", boxShadow: "0 4px 16px rgba(66,133,199,0.08)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#111827" }}>AI-Expanded Description</p>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Preview</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{aiPreview}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={applyAI}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
                    >
                      Apply → Use this description
                    </button>
                    <button
                      type="button"
                      onClick={discardAI}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-100"
                      style={{ color: "#6B7280", border: "1px solid rgba(0,0,0,0.12)" }}
                    >
                      Discard
                    </button>
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: "#9CA3AF" }}>
                    Your original description is still in the field above. Click Apply to replace it.
                  </p>
                </div>
              )}
            </div>
            <Field label="Main Offer / Service" required hint="What you primarily sell or offer">
              <input className={input} style={inputStyle} placeholder="e.g. Authentic Kabob Platters, Free Delivery" value={form.mainOffer} onChange={e => set("mainOffer", e.target.value)} required />
            </Field>
            <Field label="Target Audience" required>
              <input className={input} style={inputStyle} placeholder="e.g. Families and professionals aged 25-45" value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)} required />
            </Field>
            <Field label="Location / City" required>
              <input className={input} style={inputStyle} placeholder="e.g. Murfreesboro, TN" value={form.location} onChange={e => set("location", e.target.value)} required />
            </Field>
            <Field label="Brand Tone">
              <select className={input} style={inputStyle} value={form.brandTone} onChange={e => set("brandTone", e.target.value)}>
                {BRAND_TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Branding — with logo upload */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 className="text-sm font-black mb-4" style={{ color: "#111827" }}>Branding (Optional)</h2>
          <div className="space-y-4">
            <Field label="Business Logo" hint="Upload your logo — used in AI-generated content and reports">
              <LogoUpload
                logoUrl={form.logoUrl || ""}
                onLogoChange={(url) => { set("logoUrl", url); setSaved(false); }}
              />
            </Field>
            <Field label="Brand Colors" hint="e.g. #C13A2A, #4285C7">
              <input className={input} style={inputStyle} placeholder="#C13A2A, #FFFFFF" value={form.brandColors || ""} onChange={e => set("brandColors", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 className="text-sm font-black mb-4" style={{ color: "#111827" }}>Contact & Links (Optional)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Phone">
              <input className={input} style={inputStyle} type="tel" placeholder="+1 (555) 000-0000" value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
            </Field>
            <Field label="Business Email">
              <input className={input} style={inputStyle} type="email" placeholder="hello@yourbusiness.com" value={form.email || ""} onChange={e => set("email", e.target.value)} />
            </Field>
            <Field label="Booking / Order Link" hint="Used in CTAs when applicable">
              <input className={input} style={inputStyle} type="url" placeholder="https://yourbusiness.com/book" value={form.bookingUrl || ""} onChange={e => set("bookingUrl", e.target.value)} />
            </Field>
            <Field label="Google Maps Link">
              <input className={input} style={inputStyle} type="url" placeholder="https://maps.google.com/..." value={form.googleMapsUrl || ""} onChange={e => set("googleMapsUrl", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Social links */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 className="text-sm font-black mb-1" style={{ color: "#111827" }}>Your Social Media Profiles (Optional)</h2>
          <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Your own accounts — used to reference your existing presence in content</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["instagram", "facebook", "tiktok", "linkedin", "youtube", "x"].map((p) => (
              <Field key={p} label={p.charAt(0).toUpperCase() + p.slice(1)}>
                <input className={input} style={inputStyle} placeholder={`https://${p}.com/yourbusiness`} value={form.socialLinks?.[p] || ""} onChange={e => setSocial(p, e.target.value)} />
              </Field>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <Field label="Extra Notes for AI" hint="Any additional context, style preferences, or instructions for content generation">
            <textarea className={input} style={inputStyle} rows={3} placeholder="We only post in English. Avoid competitor mentions. Always mention our free delivery offer..." value={form.notes || ""} onChange={e => set("notes", e.target.value)} />
          </Field>
        </div>

        {/* Publishing disclosure */}
        <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(66,133,199,0.08)", border: "1px solid rgba(66,133,199,0.2)", color: "#1E40AF" }}>
          <strong>Publishing disclosure:</strong> All posts are published from WorldDigital.ai's social accounts and promote your business. Every CTA link directs traffic to your website URL above.
        </div>

        {/* Save button + inline feedback */}
        <div className="space-y-3">
          {saved && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium text-green-800 bg-green-50 border border-green-200">
              ✓ Business profile saved successfully
            </div>
          )}
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)", boxShadow: "0 6px 20px rgba(193,58,42,0.28)" }}
          >
            {saving ? "Saving…" : "Save Business Profile"}
          </button>
        </div>

      </form>
    </div>
  );
}
