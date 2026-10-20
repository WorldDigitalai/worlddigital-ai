"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../layout";
import Link from "next/link";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  status: "draft" | "published";
  createdAt: string;
  publishedAt: string | null;
  tags: string[];
  coverImageUrl?: string;
}

const SOCIAL_PLATFORMS = [
  { id: "facebook",  label: "Facebook",  color: "#1877F2" },
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "linkedin",  label: "LinkedIn",  color: "#0A66C2" },
  { id: "twitter",   label: "X (Twitter)", color: "#000000" },
  { id: "tiktok",    label: "TikTok",    color: "#000000" },
  { id: "snapchat",  label: "Snapchat",  color: "#FFFC00", textColor: "#000" },
];

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-bold"
      style={
        status === "published"
          ? { background: "rgba(22,163,74,0.1)", color: "#16A34A" }
          : { background: "rgba(234,179,8,0.1)", color: "#CA8A04" }
      }
    >
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

function PostToSocialModal({
  post,
  token,
  onClose,
}: {
  post: BlogPost;
  token: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(["facebook", "instagram"]);
  const [caption, setCaption] = useState(
    `${post.title}\n\n${post.excerpt || ""}\n\nRead more: https://worlddigital.ai/blog/${post.slug}`
  );
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handlePost = async () => {
    if (!selected.length) { setError("Select at least one platform"); return; }
    setPosting(true); setError(null);
    try {
      const r = await fetch("/api/v1/social/publish", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: selected,
          caption,
          link: `https://worlddigital.ai/blog/${post.slug}`,
          mediaUrl: post.coverImageUrl || "",
        }),
      });
      const d = await r.json() as { message?: string; error?: string };
      if (r.ok) setResult("Posted successfully to selected platforms.");
      else setError(d.message ?? d.error ?? "Failed to post");
    } catch {
      setError("Network error — please try again");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: "white", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-base" style={{ color: "#0F172A" }}>Post to Social</h3>
            <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "#94A3B8" }}>{post.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100" style={{ color: "#64748B" }}>✕</button>
        </div>

        {result ? (
          <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)" }}>
            ✓ {result}
          </div>
        ) : (
          <>
            {/* Platform selector */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "#475569" }}>Select Platforms</p>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: selected.includes(p.id) ? p.color : "rgba(0,0,0,0.04)",
                      color: selected.includes(p.id) ? (p.textColor ?? "white") : "#374151",
                      border: `2px solid ${selected.includes(p.id) ? p.color : "transparent"}`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <p className="text-xs font-bold mb-1.5" style={{ color: "#475569" }}>Caption</p>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#1A1A1A" }}
              />
            </div>

            {error && (
              <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50"
                style={{ border: "1px solid #E2E8F0", color: "#64748B" }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handlePost()}
                disabled={posting || !selected.length}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
              >
                {posting ? "Posting…" : `Post to ${selected.length} Platform${selected.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminBlogs() {
  const { token } = useAdminAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [socialPost, setSocialPost] = useState<BlogPost | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const r = await fetch("/api/v1/admin/blogs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) setPosts(await r.json());
    setLoading(false);
  };

  useEffect(() => { void load(); }, [token]);

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(id);
    await fetch(`/api/v1/admin/blogs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
    setDeleting(null);
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    await fetch(`/api/v1/admin/blogs/${post._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await load();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Blog Posts</h2>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {posts.length} total · {posts.filter((p) => p.status === "published").length} published
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
        >
          + New Post
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: "#0F172A" }}>No blog posts yet</p>
            <p className="text-sm mt-1 mb-6" style={{ color: "#64748B" }}>Create your first post to get started.</p>
            <Link href="/admin/blogs/new" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
              Create Post
            </Link>
          </div>
        ) : (
          <div className="scroll-x">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Title", "Author", "Status", "Date", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 max-w-xs">
                    <p className="font-semibold text-sm truncate" style={{ color: "#0F172A" }}>{p.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#94A3B8" }}>/{p.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: "#64748B" }}>{p.author}</td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4 text-sm whitespace-nowrap" style={{ color: "#64748B" }}>
                    {p.publishedAt
                      ? new Date(p.publishedAt).toLocaleDateString()
                      : new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <button
                        onClick={() => setSocialPost(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}
                        title="Post to social media"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => void toggleStatus(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={
                          p.status === "published"
                            ? { background: "rgba(234,179,8,0.1)", color: "#CA8A04" }
                            : { background: "rgba(22,163,74,0.1)", color: "#16A34A" }
                        }
                      >
                        {p.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <Link
                        href={`/admin/blogs/${p._id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => void deletePost(p._id)}
                        disabled={deleting === p._id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}
                      >
                        {deleting === p._id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {socialPost && (
        <PostToSocialModal
          post={socialPost}
          token={token ?? ""}
          onClose={() => setSocialPost(null)}
        />
      )}
    </div>
  );
}
