"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface ContentItem {
  id: string;
  title: string;
  contentType: string;
  platforms: string[];
  generatedCaption: string;
  shortCaption: string;
  hashtags: string[];
  cta: string;
  destinationUrl: string;
  status: "draft" | "approved" | "queued" | "published" | "failed";
  createdAt: string;
  imageUrl?: string;
  videoUrl?: string;
  campaignGoal?: string;
  promptInput?: { offer?: string; campaignGoal?: string; tone?: string };
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",     color: "#6B7280", bg: "rgba(0,0,0,0.06)" },
  approved:  { label: "Saved",     color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  queued:    { label: "Queued",    color: "#D97706", bg: "rgba(217,119,6,0.1)" },
  published: { label: "Published", color: "#4285C7", bg: "rgba(66,133,199,0.1)" },
  failed:    { label: "Failed",    color: "#C13A2A", bg: "rgba(193,58,42,0.08)" },
};

const STATUSES = ["all", "approved", "queued", "published", "draft", "failed"];

export default function ContentLibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("approved");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await apiFetch<{ items: ContentItem[]; total: number }>(`/v1/dashboard/content?${params}`);
    if (res.ok) { setItems(res.data.items); setTotal(res.data.total); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const queue = async (id: string) => {
    setActionLoading(id + "queue");
    const item = items.find(i => i.id === id);
    if (!item) return;
    const res = await apiFetch("/v1/dashboard/publishing", {
      method: "POST",
      body: { generatedContentId: id, platforms: item.platforms },
    });
    if (res.ok) { flash("✓ Added to publishing queue", true); load(); }
    else flash(res.error || "Failed to queue. Make sure business profile is complete and content is approved.", false);
    setActionLoading(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    setActionLoading(id + "delete");
    const res = await apiFetch(`/v1/dashboard/content/${id}`, { method: "DELETE" });
    if (res.ok) { flash("Content deleted", true); load(); }
    else flash(res.error || "Failed", false);
    setActionLoading(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Content Library</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>{total} item{total !== 1 ? "s" : ""}</p>
        </div>
        <a href="/dashboard/content-studio" className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
          + Generate Content
        </a>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? "text-green-800 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"} border`}>
          {msg.text}
        </div>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <p className="text-xs font-bold self-center mr-1" style={{ color: "#9CA3AF" }}>Show:</p>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all"
            style={{
              background: statusFilter === s ? "rgba(193,58,42,0.1)" : "rgba(0,0,0,0.04)",
              border: `1.5px solid ${statusFilter === s ? "#C13A2A" : "rgba(0,0,0,0.08)"}`,
              color: statusFilter === s ? "#C13A2A" : "#6B7280",
            }}
          >
            {s === "approved" ? "Saved" : s}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "white", border: "2px dashed rgba(0,0,0,0.1)" }}>
          <p className="text-3xl mb-3">📭</p>
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>
            {statusFilter === "approved" ? "Nothing saved yet" : "No content here"}
          </p>
          <p className="text-xs mt-1 mb-4" style={{ color: "#9CA3AF" }}>
            {statusFilter === "approved"
              ? "Generate content in the AI Studio and hit Save to Library"
              : "Try a different filter"}
          </p>
          <a href="/dashboard/content-studio" className="inline-flex px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
            Open Content Studio →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const s = STATUS_STYLES[item.status] || STATUS_STYLES["draft"];
            const isExpanded = expanded === item.id;
            const goal = item.campaignGoal || item.promptInput?.campaignGoal;
            const offer = item.promptInput?.offer;

            return (
              <div key={item.id} className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                {/* Media preview strip */}
                {item.imageUrl && (
                  <div className="relative w-full overflow-hidden" style={{ maxHeight: 220, background: "#F8FBFE" }}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full object-cover"
                      style={{ maxHeight: 220 }}
                    />
                  </div>
                )}
                {!item.imageUrl && item.videoUrl && (
                  <div className="relative w-full overflow-hidden" style={{ background: "#000" }}>
                    <video
                      src={item.videoUrl}
                      controls
                      playsInline
                      className="w-full"
                      style={{ maxHeight: 220 }}
                    />
                  </div>
                )}

                {/* Card body */}
                <div className="p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{item.title}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {item.platforms.map(p => (
                          <span key={p} className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(66,133,199,0.08)", color: "#1D4ED8" }}>{p.replace("_", " ")}</span>
                        ))}
                        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(0,0,0,0.05)", color: "#6B7280" }}>{item.contentType.replace("_", " ")}</span>
                      </div>
                    </div>
                    <p className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "#9CA3AF" }}>
                      {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  {/* Goal + Offer chips */}
                  {(goal || offer) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {goal && (
                        <div className="flex items-baseline gap-1.5 text-[10px] px-2.5 py-1 rounded-lg" style={{ background: "rgba(66,133,199,0.06)", color: "#374151" }}>
                          <span className="font-black uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Goal</span>
                          <span className="font-medium">{goal}</span>
                        </div>
                      )}
                      {offer && (
                        <div className="flex items-baseline gap-1.5 text-[10px] px-2.5 py-1 rounded-lg" style={{ background: "rgba(193,58,42,0.05)", color: "#374151" }}>
                          <span className="font-black uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Offer</span>
                          <span className="font-medium">{offer}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Caption */}
                  <p className={`text-xs leading-relaxed mb-3 ${isExpanded ? "" : "line-clamp-2"}`} style={{ color: "#6B7280" }}>
                    {item.generatedCaption}
                  </p>
                  {item.generatedCaption?.length > 120 && (
                    <button onClick={() => setExpanded(isExpanded ? null : item.id)} className="text-[10px] font-semibold mb-3" style={{ color: "#4285C7" }}>
                      {isExpanded ? "Show less ▲" : "Show more ▼"}
                    </button>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[10px] mb-4" style={{ color: "#9CA3AF" }}>
                    {item.cta && <span>CTA: <strong style={{ color: "#374151" }}>{item.cta}</strong></span>}
                    {item.destinationUrl && <span className="truncate max-w-40">→ {item.destinationUrl}</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {item.status === "approved" && (
                      <button
                        onClick={() => queue(item.id)}
                        disabled={actionLoading === item.id + "queue"}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        style={{ background: "#4285C7" }}
                      >
                        {actionLoading === item.id + "queue" ? "…" : "Add to Queue"}
                      </button>
                    )}
                    {item.status === "queued" && (
                      <a href="/dashboard/publishing" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#7C3AED" }}>
                        View Queue
                      </a>
                    )}
                    {item.status === "published" && item.destinationUrl && (
                      <a href={item.destinationUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)" }}>
                        View Post ↗
                      </a>
                    )}
                    <button
                      onClick={() => remove(item.id)}
                      disabled={actionLoading === item.id + "delete"}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-gray-50 disabled:opacity-60 transition-all"
                      style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#6B7280" }}
                    >
                      {actionLoading === item.id + "delete" ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
