"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../layout";
import Link from "next/link";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  author: string;
  status: "draft" | "published";
  tags: string[];
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

export default function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAdminAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "",
    coverImageUrl: "", author: "", status: "draft" as "draft" | "published", tags: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/v1/admin/blogs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((posts: BlogPost[]) => {
        const p = posts.find((p) => p._id === id);
        if (p) {
          setForm({ ...p, tags: (p.tags || []).join(", ") });
        }
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setUploadingImage(true);
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
        set("coverImageUrl", d.imageUrl as string);
      } else {
        setError((d.message as string) || "Failed to upload image");
      }
    } catch {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const save = async (status: "draft" | "published") => {
    setSaving(true); setError(""); setSuccess("");
    const r = await fetch(`/api/v1/admin/blogs/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, status,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (r.ok) {
      setSuccess("Saved successfully!");
      setForm((f) => ({ ...f, status }));
      setTimeout(() => setSuccess(""), 3000);
    } else {
      const d = await r.json();
      setError((d.message as string) || "Failed to save");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/blogs" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Edit Post</h2>
          <p className="text-sm" style={{ color: "#64748B" }}>/{form.slug}</p>
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
      {success && <div className="px-4 py-3 rounded-xl text-sm text-green-600" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <Field label="Title *"><input value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Slug *"><input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="font-mono text-sm" /></Field>
            <Field label="Excerpt"><textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} /></Field>
            <Field label="Content (Markdown or plain text)">
              <textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={14} className="font-mono text-sm" />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>Post Details</h3>
            <Field label="Author"><input value={form.author} onChange={(e) => set("author", e.target.value)} /></Field>

            {/* Cover Image */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#475569" }}>Cover Image</label>
              <div
                className="rounded-xl overflow-hidden mb-2"
                style={{ border: "2px dashed #CBD5E1", background: "#F8FAFC", minHeight: 80 }}
              >
                {form.coverImageUrl ? (
                  <div className="relative">
                    <img src={form.coverImageUrl} alt="Cover" className="w-full h-36 object-cover" />
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
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f); }}
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

            <Field label="Tags (comma separated)"><input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="AI, Marketing" /></Field>
          </div>

          <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold" style={{ color: "#475569" }}>Status:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={form.status === "published" ? { background: "rgba(22,163,74,0.1)", color: "#16A34A" } : { background: "rgba(234,179,8,0.1)", color: "#CA8A04" }}>
                {form.status}
              </span>
            </div>
            <button onClick={() => void save("published")} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
              {saving ? "Saving…" : "Save & Publish"}
            </button>
            <button onClick={() => void save("draft")} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50" style={{ border: "1px solid #E2E8F0", color: "#64748B" }}>
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
