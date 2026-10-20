"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../layout";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentItem {
  _id: string;
  userId: string;
  type: string;
  platform: string;
  status: string;
  prompt: string;
  result: string;
  createdAt: string;
}

interface CaptionResult {
  caption: string;
  hashtags: string[];
  cta: string;
  landingUrl: string;
  platform: string;
  charCount: number;
}

// ── Platform config ───────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "linkedin",         label: "LinkedIn",           url: "https://worlddigital.ai/linkedin-ads-agency",      color: "#0A66C2" },
  { id: "instagram",        label: "Instagram",           url: "https://worlddigital.ai/instagram-marketing",      color: "#E1306C" },
  { id: "facebook",         label: "Facebook",            url: "https://worlddigital.ai/meta-ads-agency",          color: "#1877F2" },
  { id: "meta",             label: "Meta Ads",            url: "https://worlddigital.ai/meta-ads-agency",          color: "#1877F2" },
  { id: "snapchat",         label: "Snapchat",            url: "https://worlddigital.ai/snapchat-ads-agency",      color: "#FFFC00", textColor: "#000" },
  { id: "tiktok",           label: "TikTok",              url: "https://worlddigital.ai/tiktok-marketing",         color: "#000000" },
  { id: "youtube",          label: "YouTube Shorts",      url: "https://worlddigital.ai/youtube-shorts-marketing", color: "#FF0000" },
  { id: "google",           label: "Google Ads",          url: "https://worlddigital.ai/google-ads-agency",        color: "#4285F4" },
  { id: "ai-seo",           label: "AI SEO",              url: "https://worlddigital.ai/ai-seo-agency",            color: "#10B981" },
  { id: "x",                label: "X (Twitter)",         url: "https://worlddigital.ai/ai-marketing-automation",  color: "#000000" },
  { id: "ai-marketing",     label: "AI Marketing",        url: "https://worlddigital.ai/ai-marketing-automation",  color: "#6366F1" },
];

const TONES = ["Professional", "Friendly & Approachable", "Bold & Direct", "Educational", "Inspirational", "Urgent / FOMO"];

const PLATFORM_COLORS: Record<string, string> = {
  meta: "#1877F2", facebook: "#1877F2", instagram: "#E1306C",
  snapchat: "#FFFC00", google: "#4285F4", tiktok: "#000000",
  linkedin: "#0A66C2", youtube: "#FF0000", "ai-seo": "#10B981",
  x: "#64748B", "ai-marketing": "#6366F1", default: "#64748B",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const color = PLATFORM_COLORS[platform?.toLowerCase()] ?? PLATFORM_COLORS.default;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${color}20`, color }}>
      {platform || "—"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string; text: string }> = {
    approved: { bg: "rgba(22,163,74,0.1)", text: "#16A34A" },
    pending:  { bg: "rgba(234,179,8,0.1)",  text: "#CA8A04" },
    rejected: { bg: "rgba(239,68,68,0.1)",  text: "#DC2626" },
    generated:{ bg: "rgba(66,133,199,0.1)", text: "#4285C7" },
  };
  const c = m[status] ?? { bg: "rgba(100,116,139,0.1)", text: "#64748B" };
  return <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.text }}>{status || "—"}</span>;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
      style={{ background: copied ? "rgba(22,163,74,0.1)" : "rgba(66,133,199,0.1)", color: copied ? "#16A34A" : "#4285C7" }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

// ── Caption Generator Tab ─────────────────────────────────────────────────────

function CaptionGenerator({ token }: { token: string }) {
  const [platform, setPlatform] = useState("linkedin");
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("Drive sign-ups and brand awareness");
  const [tone, setTone] = useState("Professional");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [queued, setQueued] = useState(false);

  const selectedPlatform = PLATFORMS.find(p => p.id === platform);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    setQueued(false);
    try {
      const res = await fetch("/api/v1/admin/content/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform, topic, goal, tone }),
      });
      const data = await res.json() as CaptionResult & { error?: string };
      if (!res.ok) { setError(data.error ?? "Generation failed"); }
      else { setResult(data); setEditedCaption(data.caption); }
    } catch {
      setError("Network error — please try again");
    } finally {
      setGenerating(false);
    }
  };

  const handleQueue = async () => {
    if (!result) return;
    const caption = editedCaption || result.caption;
    const body = {
      platform,
      caption,
      hashtags: result.hashtags,
      cta: result.cta,
      landingUrl: result.landingUrl,
      source: "admin-caption-generator",
    };
    try {
      await fetch("/api/v1/admin/publishing/queue-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      setQueued(true);
    } catch {
      setQueued(true);
    }
  };

  const fullText = result
    ? `${editedCaption || result.caption}\n\n${result.hashtags.slice(0, 5).map(h => `#${h.replace(/^#/, "")}`).join(" ")}`
    : "";

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Inputs */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <h3 className="text-sm font-black mb-4" style={{ color: "#0F172A" }}>Caption Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Platform */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold mb-2" style={{ color: "#374151" }}>Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPlatform(p.id); setResult(null); }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: platform === p.id ? p.color : "rgba(0,0,0,0.04)",
                    color: platform === p.id ? (p.textColor ?? "white") : "#374151",
                    border: platform === p.id ? `2px solid ${p.color}` : "2px solid transparent",
                    opacity: platform === p.id ? 1 : 0.7,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {selectedPlatform && (
              <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>
                Service URL: <a href={selectedPlatform.url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#4285C7" }}>{selectedPlatform.url}</a>
              </p>
            )}
          </div>

          {/* Topic */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>
              Topic / Angle <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={`e.g. Why SMBs need ${selectedPlatform?.label ?? "social media"} advertising in 2026`}
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white", color: "#1A1A1A" }}
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Campaign Goal</label>
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Drive sign-ups and awareness"
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white", color: "#1A1A1A" }}
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Tone</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white", color: "#1A1A1A" }}
            >
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)", boxShadow: "0 4px 16px rgba(193,58,42,0.25)" }}
          >
            {generating ? "Generating…" : `Generate ${selectedPlatform?.label ?? "Caption"} Caption →`}
          </button>
        </div>

        {error && (
          <p className="text-xs mt-3 font-medium" style={{ color: "#DC2626" }}>{error}</p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black" style={{ color: "#0F172A" }}>
              {result.platform} Caption
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B" }}>
                {(editedCaption || result.caption).length} chars
              </span>
              <CopyButton text={fullText} label="Copy All" />
            </div>
          </div>

          {/* Editable caption */}
          <div>
            <p className="text-[11px] font-bold uppercase mb-1.5" style={{ color: "#94A3B8" }}>Caption (click to edit)</p>
            <textarea
              value={editedCaption}
              onChange={e => setEditedCaption(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              style={{ border: "1px solid rgba(0,0,0,0.12)", background: "#F9FAFB", color: "#1A1A1A" }}
            />
          </div>

          {/* Hashtags */}
          <div>
            <p className="text-[11px] font-bold uppercase mb-2" style={{ color: "#94A3B8" }}>
              Hashtags ({result.hashtags.slice(0, 5).length}/5 max)
            </p>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.slice(0, 5).map((h, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>
                  #{h.replace(/^#/, "")}
                </span>
              ))}
            </div>
          </div>

          {/* CTA + URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl px-4 py-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <p className="text-[11px] font-bold uppercase mb-1" style={{ color: "#94A3B8" }}>CTA Text</p>
              <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{result.cta}</p>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <p className="text-[11px] font-bold uppercase mb-1" style={{ color: "#94A3B8" }}>Landing URL</p>
              <a href={result.landingUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono underline break-all" style={{ color: "#4285C7" }}>
                {result.landingUrl}
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <CopyButton text={fullText} label="Copy Caption + Hashtags" />
            <CopyButton text={editedCaption || result.caption} label="Copy Caption Only" />
            <CopyButton text={result.hashtags.slice(0, 5).map(h => `#${h.replace(/^#/, "")}`).join(" ")} label="Copy Hashtags" />
            <button
              onClick={handleQueue}
              disabled={queued}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-60"
              style={{ background: queued ? "rgba(22,163,74,0.1)" : "rgba(193,58,42,0.1)", color: queued ? "#16A34A" : "#C13A2A" }}
            >
              {queued ? "✓ Sent to Queue" : "Send to Publishing Queue"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(0,0,0,0.05)", color: "#374151" }}
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Customer Content Tab ───────────────────────────────────────────────────────

function CustomerContent({ token }: { token: string }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/content", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setItems).finally(() => setLoading(false));
  }, [token]);

  const filtered = items.filter(
    i => !search || i.platform?.toLowerCase().includes(search) || i.type?.toLowerCase().includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#64748B" }}>{items.length} total pieces generated by customers</p>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by platform or type…"
          className="px-3 py-2 rounded-xl text-sm outline-none w-48"
          style={{ border: "1px solid #E2E8F0", background: "white" }}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        {loading ? (
          <div className="flex justify-center h-40 items-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-semibold" style={{ color: "#0F172A" }}>No content yet</p>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>Content generated by customers will appear here.</p>
          </div>
        ) : (
          <div className="scroll-x">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Type", "Platform", "Status", "Created", "Preview"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <>
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors border-b" style={{ borderColor: "#F8FAFC" }}>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "#0F172A" }}>{item.type || "Ad copy"}</td>
                    <td className="px-5 py-3"><PlatformBadge platform={item.platform} /></td>
                    <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#94A3B8" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setExpanded(expanded === item._id ? null : item._id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
                        style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}
                      >
                        {expanded === item._id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {expanded === item._id && (
                    <tr key={`${item._id}-exp`} style={{ background: "#F8FAFC" }}>
                      <td colSpan={5} className="px-5 py-4">
                        <div className="space-y-2">
                          {item.prompt && (
                            <div>
                              <p className="text-xs font-bold mb-1" style={{ color: "#64748B" }}>PROMPT</p>
                              <p className="text-sm rounded-xl px-3 py-2" style={{ background: "white", border: "1px solid #E2E8F0", color: "#0F172A" }}>{item.prompt}</p>
                            </div>
                          )}
                          {item.result && (
                            <div>
                              <p className="text-xs font-bold mb-1" style={{ color: "#64748B" }}>RESULT</p>
                              <p className="text-sm rounded-xl px-3 py-2 whitespace-pre-wrap" style={{ background: "white", border: "1px solid #E2E8F0", color: "#0F172A" }}>{item.result}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminContent() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState<"generate" | "customer">("generate");

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Content</h2>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          Generate AI captions for WorldDigital.ai's social channels, or review customer-generated content.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#F1F5F9" }}>
        {[
          { key: "generate", label: "AI Caption Generator" },
          { key: "customer", label: "Customer Content" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as "generate" | "customer")}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: tab === key ? "white" : "transparent",
              color: tab === key ? "#0F172A" : "#64748B",
              boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {token && tab === "generate" && <CaptionGenerator token={token} />}
      {token && tab === "customer" && <CustomerContent token={token} />}
    </div>
  );
}
