"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../layout";
import Link from "next/link";

export default function NewBlogPost() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    author: "WorldDigital.ai Team",
    status: "draft" as "draft" | "published",
    tags: "",
    brandLogo: "",
    brandUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);

  const [aiTopic, setAiTopic] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAiGenerate = async () => {
    if (!aiTopic.trim() || !token) return;
    setAiGenerating(true);
    setAiError("");
    try {
      const r = await fetch("/api/v1/admin/blogs/ai-generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, keywords: aiKeywords }),
      });
      const d = await r.json() as {
        success?: boolean;
        title?: string;
        slug?: string;
        excerpt?: string;
        content?: string;
        tags?: string[];
        message?: string;
      };
      if (!r.ok || !d.success) {
        setAiError(d.message ?? "AI generation failed. Try again.");
        return;
      }
      setForm((f) => ({
        ...f,
        title: d.title ?? f.title,
        slug: d.slug ?? f.slug,
        excerpt: d.excerpt ?? f.excerpt,
        content: d.content ?? f.content,
        tags: Array.isArray(d.tags) ? d.tags.join(", ") : f.tags,
      }));
    } catch {
      setAiError("Network error. Try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const set = (k: string, v: string) => {
    setForm((f) => {
      const updated = { ...f, [k]: v };
      if (k === "title" && !f.slug) {
        updated.slug = v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      return updated;
    });
  };

  const handleImageFile = async (file: File, field: "coverImageUrl" | "brandLogo") => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (field === "coverImageUrl") setUploadingImage(true);
    else setUploadingBrandLogo(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const r = await fetch("/api/v1/admin/uploads/blog-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const d = await r.json();
      if (r.ok) {
        set(field, d.imageUrl as string);
      } else {
        setError((d.message as string) || "Failed to upload image");
      }
    } catch {
      setError("Failed to upload image. Please try again.");
    } finally {
      if (field === "coverImageUrl") setUploadingImage(false);
      else setUploadingBrandLogo(false);
    }
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title || !form.slug) { setError("Title and slug are required"); return; }
    setSaving(true); setError("");
    const r = await fetch("/api/v1/admin/blogs", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        status,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (r.ok) {
      router.push("/admin/blogs");
    } else {
      const d = await r.json();
      setError((d.message as string) || "Failed to save");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/blogs" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>New Blog Post</h2>
          <p className="text-sm" style={{ color: "#64748B" }}>Fill in the details below.</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-600" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <Field label="Title *">
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Your post title" />
            </Field>
            <Field label="Slug *">
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="url-friendly-slug" className="font-mono text-sm" />
            </Field>
            <Field label="Excerpt">
              <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short summary for blog listing…" rows={2} />
            </Field>
            <Field label="Content (Markdown or plain text)">
              <textarea value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="Write your article here…" rows={14} className="font-mono text-sm" />
            </Field>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>Post Details</h3>
            <Field label="Author">
              <input value={form.author} onChange={(e) => set("author", e.target.value)} />
            </Field>

            {/* Cover Image */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#475569" }}>Cover Image</label>
              <div
                className="rounded-xl overflow-hidden mb-2"
                style={{ border: "2px dashed #CBD5E1", background: "#F8FAFC", minHeight: 80 }}
              >
                {form.coverImageUrl ? (
                  <div className="relative">
                    <img src={form.coverImageUrl} alt="Cover preview" className="w-full h-36 object-cover" />
                    <button
                      onClick={() => set("coverImageUrl", "")}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-full flex flex-col items-center justify-center gap-1.5 py-5 transition-colors hover:bg-slate-100"
                    style={{ color: "#94A3B8" }}
                  >
                    {uploadingImage ? (
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Click to upload image</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f, "coverImageUrl"); }}
              />
              <input
                value={form.coverImageUrl.startsWith("/api/") ? "" : form.coverImageUrl}
                onChange={(e) => set("coverImageUrl", e.target.value)}
                placeholder="Or paste image URL…"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4285C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* Brand Logo */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#475569" }}>Brand Logo <span className="font-normal text-slate-400">(optional)</span></label>
              <div
                className="rounded-xl overflow-hidden mb-2"
                style={{ border: "2px dashed #CBD5E1", background: "#F8FAFC", minHeight: 60 }}
              >
                {form.brandLogo ? (
                  <div className="relative flex items-center justify-center p-3">
                    <img src={form.brandLogo} alt="Brand logo" className="h-10 object-contain" />
                    <button
                      onClick={() => set("brandLogo", "")}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "rgba(0,0,0,0.5)" }}
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => brandLogoInputRef.current?.click()}
                    disabled={uploadingBrandLogo}
                    className="w-full h-full flex flex-col items-center justify-center gap-1.5 py-4 transition-colors hover:bg-slate-100"
                    style={{ color: "#94A3B8" }}
                  >
                    {uploadingBrandLogo ? (
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-xs">Upload brand logo</span>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={brandLogoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f, "brandLogo"); }}
              />
              <input
                value={form.brandLogo.startsWith("/api/") ? "" : form.brandLogo}
                onChange={(e) => set("brandLogo", e.target.value)}
                placeholder="Or paste logo URL…"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all mb-2"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4285C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
              <input
                value={form.brandUrl}
                onChange={(e) => set("brandUrl", e.target.value)}
                placeholder="Brand website URL (e.g. https://example.com)"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4285C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            <Field label="Tags (comma separated)">
              <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="AI, Marketing, Ads" />
            </Field>
          </div>

          {/* AI Generate Panel */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "linear-gradient(135deg,rgba(66,133,199,0.06),rgba(16,185,129,0.06))", border: "1px solid rgba(66,133,199,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h3 className="text-sm font-black" style={{ color: "#0F172A" }}>AI Write Post</h3>
            </div>
            <p className="text-xs" style={{ color: "#64748B" }}>Enter a topic and let AI draft the full blog post for you.</p>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "#475569" }}>Topic *</label>
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. How AI helps SMBs with social media ads"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4285C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "#475569" }}>Target Keywords (optional)</label>
              <input
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                placeholder="e.g. AI marketing, small business ads"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4285C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>
            {aiError && (
              <p className="text-xs" style={{ color: "#C13A2A" }}>{aiError}</p>
            )}
            <button
              onClick={() => void handleAiGenerate()}
              disabled={aiGenerating || !aiTopic.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#4285C7,#10B981)" }}
            >
              {aiGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating…
                </>
              ) : "Generate with AI"}
            </button>
          </div>

          <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <button
              onClick={() => void save("published")}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
            >
              {saving ? "Saving…" : "Publish Now"}
            </button>
            <button
              onClick={() => void save("draft")}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50"
              style={{ border: "1px solid #E2E8F0", color: "#64748B" }}
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type FieldChildProps = React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function Field({ label, children }: { label: string; children: React.ReactElement<FieldChildProps> }) {
  const props = children.props as FieldChildProps;
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: "#475569" }}>{label}</label>
      {children.type === "input"
        ? <input
            {...props}
            className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${props.className ?? ""}`}
            style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#4285C7")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
          />
        : <textarea
            {...props}
            className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all resize-none ${props.className ?? ""}`}
            style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#4285C7")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
          />}
    </div>
  );
}
