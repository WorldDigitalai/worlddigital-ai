"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, type AdGenerationResult } from "@/lib/api";

const CATEGORIES: Record<string, string[]> = {
  "Restaurant & Food": ["Fast Food", "Fine Dining", "Cafe & Coffee", "Bakery", "Pizza", "Sushi", "Burgers", "Catering"],
  "Retail & Shopping": ["Clothing", "Electronics", "Furniture", "Jewelry", "Books", "Sports Equipment", "Beauty Products"],
  "Health & Wellness": ["Gym & Fitness", "Yoga Studio", "Spa & Massage", "Dental Clinic", "Pharmacy", "Nutrition"],
  "Professional Services": ["Law Firm", "Accounting", "Real Estate", "Insurance", "Consulting", "Marketing Agency"],
  "Home Services": ["Cleaning", "Plumbing", "Electrical", "HVAC", "Landscaping", "Painting", "Moving"],
  "Beauty & Personal Care": ["Hair Salon", "Nail Salon", "Barbershop", "Makeup Studio", "Skincare Clinic"],
  "Automotive": ["Car Dealership", "Auto Repair", "Car Wash", "Tire Shop", "Auto Parts"],
  "Education": ["Tutoring", "Language School", "Music Lessons", "Online Courses", "Daycare"],
  "Technology": ["Software Development", "IT Support", "Web Design", "App Development", "Cybersecurity"],
};

type Step = "business-info" | "generating" | "select-description" | "select-image" | "confirm";

export default function GeneratePage() {
  const { user, loading } = useAuth();
  const [step, setStep] = useState<Step>("business-info");
  const [form, setForm] = useState({
    businessName: "",
    category: "",
    subcategory: "",
    websiteUrl: "",
    location: "",
  });
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AdGenerationResult | null>(null);
  const [selectedDesc, setSelectedDesc] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) window.location.href = "/login";
    if (!loading && user && user.subscriptionStatus !== "active") window.location.href = "/subscribe";
  }, [user, loading]);

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    const apiUrl = process.env["NEXT_PUBLIC_API_URL"] || "/api";
    const token = localStorage.getItem("wdai_token");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const resp = await fetch(`${apiUrl}/v1/upload/logo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await resp.json();
      if (resp.ok) setLogoUrl(data.url);
      else setError(data.message || "Logo upload failed");
    } catch {
      setError("Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.businessName || !form.category || !form.subcategory) {
      setError("Please fill in all required fields");
      return;
    }
    setError(null);
    setStep("generating");
    setGenerating(true);

    const res = await api.ads.generate({
      businessName: form.businessName,
      category: form.category,
      subcategory: form.subcategory,
      websiteUrl: form.websiteUrl || undefined,
      location: form.location || undefined,
      logoUrl: logoUrl || undefined,
    });

    setGenerating(false);
    if (res.ok) {
      setResult(res.data);
      setStep("select-description");
    } else {
      setError(res.error || "Generation failed. Please try again.");
      setStep("business-info");
    }
  };

  const handleConfirm = async () => {
    if (!result || !selectedDesc || !selectedImage) return;
    setConfirming(true);
    const res = await api.ads.confirm(result.generationId, selectedDesc, selectedImage);
    setConfirming(false);
    if (res.ok) setDone(true);
    else setError(res.error || "Failed to confirm");
  };

  if (loading) return null;
  if (!user) return null;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#E8F4FD" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Campaign Saved!</h2>
          <p className="text-gray-500 text-sm mb-8">Your ad selection has been saved. Our team will review and activate your campaign shortly.</p>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="py-3.5 rounded-full font-bold text-white text-sm text-center" style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}>
              Back to Dashboard
            </Link>
            <button onClick={() => { setDone(false); setStep("business-info"); setResult(null); setSelectedDesc(null); setSelectedImage(null); }} className="py-3.5 rounded-full font-bold text-sm border text-gray-700" style={{ border: "1px solid rgba(0,0,0,0.12)" }}>
              Generate Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-6" style={{ background: "#E8F4FD" }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="eyebrow-line mb-3">AI Ad Generator</div>
          <h1 className="text-3xl font-black text-gray-900">Generate Your Ads</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(["business-info", "select-description", "select-image", "confirm"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step === s || (["generating", "select-description", "select-image", "confirm"].indexOf(step) > i)
                    ? "linear-gradient(135deg, #4285C7, #C13A2A)"
                    : "rgba(0,0,0,0.08)",
                  color: step === s || (["generating", "select-description", "select-image", "confirm"].indexOf(step) > i) ? "white" : "#9ca3af",
                }}
              >
                {i + 1}
              </div>
              {i < 3 && <div className="h-0.5 flex-1" style={{ background: "rgba(0,0,0,0.08)", minWidth: "20px" }} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(193,58,42,0.08)", border: "1px solid rgba(193,58,42,0.25)", color: "#C13A2A" }}>
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* Step 1: Business Info */}
        {(step === "business-info") && (
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="font-bold text-gray-900">Business Information</h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Business Name *</label>
              <input type="text" className="input-light" placeholder="e.g. Joe's Bakery" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Category *</label>
              <select className="input-light" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: "" })}>
                <option value="">Select a category</option>
                {Object.keys(CATEGORIES).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {form.category && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Subcategory *</label>
                <select className="input-light" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}>
                  <option value="">Select a subcategory</option>
                  {CATEGORIES[form.category]?.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Website URL</label>
              <input type="url" className="input-light" placeholder="https://yourbusiness.com" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Location (City, State)</label>
              <input type="text" className="input-light" placeholder="e.g. Miami, FL" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Business Logo (optional)</label>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
              {logoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
                  <button onClick={() => { setLogoUrl(""); }} className="text-sm text-gray-400 hover:text-red-500">Remove</button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} disabled={logoUploading} className="w-full py-3 rounded-xl border-2 border-dashed text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  {logoUploading ? "Uploading..." : "Click to upload logo"}
                </button>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!form.businessName || !form.category || !form.subcategory || generating}
              className="w-full py-4 rounded-full font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
            >
              Generate AI Ads
            </button>
          </div>
        )}

        {/* Generating */}
        {step === "generating" && (
          <div className="rounded-2xl p-10 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}>
              <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Generating Your Ads</h2>
            <p className="text-gray-500 text-sm">Our AI is crafting 5 unique descriptions and 5 ad images for your business. This takes about 30–60 seconds.</p>
          </div>
        )}

        {/* Step 2: Select Description */}
        {step === "select-description" && result && (
          <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="font-bold text-gray-900 mb-1">Choose an Ad Description</h2>
            <p className="text-xs text-gray-500 mb-5">Select the description that best represents your business.</p>
            <div className="space-y-3 mb-6">
              {result.descriptions.map((desc, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDesc(desc)}
                  className="w-full text-left p-4 rounded-xl transition-all text-sm"
                  style={{
                    background: selectedDesc === desc ? "rgba(66,133,199,0.08)" : "rgba(0,0,0,0.02)",
                    border: selectedDesc === desc ? "2px solid #4285C7" : "2px solid transparent",
                    color: "#1a1a1a",
                  }}
                >
                  <span className="font-bold mr-2" style={{ color: "#C13A2A" }}>0{i + 1}.</span>
                  {desc}
                  <span className="block text-xs text-gray-400 mt-1">{desc.length}/90 characters</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("select-image")}
              disabled={!selectedDesc}
              className="w-full py-4 rounded-full font-bold text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
            >
              Continue → Select Image
            </button>
          </div>
        )}

        {/* Step 3: Select Image */}
        {step === "select-image" && result && (
          <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="font-bold text-gray-900 mb-1">Choose an Ad Image</h2>
            <p className="text-xs text-gray-500 mb-5">Select the image that best fits your campaign.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {result.imageUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(url)}
                  className="relative rounded-xl overflow-hidden aspect-square transition-all"
                  style={{ border: selectedImage === url ? "3px solid #4285C7" : "3px solid transparent" }}
                >
                  <img src={url} alt={`Ad image ${i + 1}`} className="w-full h-full object-cover" />
                  {selectedImage === url && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#4285C7" }}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-xs font-bold text-white" style={{ background: "rgba(0,0,0,0.4)" }}>0{i + 1}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("select-description")} className="flex-1 py-3.5 rounded-full font-bold text-sm border text-gray-700" style={{ border: "1px solid rgba(0,0,0,0.12)" }}>
                ← Back
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!selectedImage}
                className="flex-1 py-3.5 rounded-full font-bold text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
              >
                Continue → Preview
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && selectedDesc && selectedImage && (
          <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="font-bold text-gray-900 mb-5">Your Ad Preview</h2>

            <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <img src={selectedImage} alt="Selected ad" className="w-full object-cover" style={{ maxHeight: "220px" }} />
              <div className="p-4" style={{ background: "#F8FBFE" }}>
                <p className="text-sm font-semibold text-gray-900">{selectedDesc}</p>
                {form.businessName && <p className="text-xs text-gray-500 mt-1">{form.businessName}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep("select-image")} className="flex-1 py-3.5 rounded-full font-bold text-sm border text-gray-700" style={{ border: "1px solid rgba(0,0,0,0.12)" }}>
                ← Edit
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 py-3.5 rounded-full font-bold text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
              >
                {confirming ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
