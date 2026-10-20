"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getModule } from "@/lib/modules";

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOL_META: Record<string, {
  label: string; icon: string; color: string; bg: string;
  packLabel: string; packPrice: string; packUnit: string;
  inputFields: { key: string; label: string; placeholder: string; type: "text" | "select"; options?: string[] }[];
  resultRenderer: (r: Record<string, unknown>) => React.ReactNode;
}> = {
  "image-generator": {
    label: "AI Image Generator", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    color: "#F59E0B", bg: "rgba(245,158,11,0.1)", packLabel: "5 image generations", packPrice: "$19.99", packUnit: "images",
    inputFields: [
      { key: "prompt", label: "Describe your image", placeholder: "e.g. Professional coffee shop interior, warm lighting, cozy atmosphere", type: "text" },
      { key: "style", label: "Style", placeholder: "", type: "select", options: ["Photorealistic", "Illustrated", "Product Shot", "Lifestyle", "Minimalist", "Bold & Graphic"] },
      { key: "platform", label: "Platform", placeholder: "", type: "select", options: ["Instagram Feed", "Facebook", "Google Display", "TikTok", "LinkedIn"] },
    ],
    resultRenderer: (r) => {
      const variations = (r.variations as Array<{title:string;prompt:string;style:string;mood:string}>) || [];
      const best = variations[0];
      if (!best) return null;
      return (
        <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(245,158,11,0.25)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: "#F59E0B" }}>✓</div>
            <h4 className="font-bold text-sm" style={{ color: "#111827" }}>{best.title}</h4>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>{best.style}</span>
          </div>
          <p className="text-sm leading-relaxed mb-1" style={{ color: "#4B5563" }}>{best.prompt}</p>
          <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Mood: {best.mood}</p>
          <p className="text-[11px] font-semibold mb-3" style={{ color: "#9CA3AF" }}>Your prompt has been optimised for DALL·E. Click below to generate the actual image.</p>
        </div>
      );
    },
  },
  "reels-generator": {
    label: "AI Reels Generator", icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
    color: "#EF4444", bg: "rgba(239,68,68,0.1)", packLabel: "5 reel packages", packPrice: "$49.99", packUnit: "reels",
    inputFields: [
      { key: "topic", label: "Video topic / goal", placeholder: "e.g. Showcase our summer sale — 40% off all items", type: "text" },
      { key: "platform", label: "Platform", placeholder: "", type: "select", options: ["Instagram Reels", "TikTok", "YouTube Shorts", "Snapchat Stories"] },
      { key: "tone", label: "Tone", placeholder: "", type: "select", options: ["Entertaining", "Educational", "Promotional", "Behind-the-Scenes", "Inspirational", "Urgent"] },
    ],
    resultRenderer: (r) => (
      <div className="space-y-5">
        {!!r.hook && (
          <div className="rounded-xl p-4 border-l-4" style={{ background: "rgba(239,68,68,0.05)", borderLeftColor: "#EF4444" }}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "#EF4444" }}>Hook (First 3 Seconds)</p>
            <p className="text-sm font-semibold" style={{ color: "#111827" }}>{r.hook as string}</p>
          </div>
        )}
        {!!r.script && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: "#6B7280" }}>Full Script</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#374151" }}>{r.script as string}</p>
          </div>
        )}
        {Array.isArray(r.shotList) && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "#6B7280" }}>Shot List</p>
            <ol className="space-y-2">
              {(r.shotList as string[]).map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "#374151" }}>
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}
        {Array.isArray(r.captions) && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "#6B7280" }}>Captions</p>
            <div className="space-y-3">
              {(r.captions as string[]).map((c, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: "#F9FAFB" }}>
                  <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "#9CA3AF" }}>{i === 0 ? "Short" : i === 1 ? "Medium" : "Detailed"}</p>
                  <p className="text-sm" style={{ color: "#374151" }}>{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(r.hashtags) && (
          <div className="rounded-xl p-4 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: "#6B7280" }}>Hashtags</p>
            <div className="flex flex-wrap gap-1.5">
              {(r.hashtags as string[]).map((h, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626" }}>#{h.replace(/^#/,"")}</span>
              ))}
            </div>
          </div>
        )}
        {!!r.cta && (
          <div className="rounded-xl p-4 border-l-4" style={{ background: "rgba(239,68,68,0.05)", borderLeftColor: "#EF4444" }}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "#EF4444" }}>Call to Action</p>
            <p className="text-sm font-semibold" style={{ color: "#111827" }}>{r.cta as string}</p>
          </div>
        )}
      </div>
    ),
  },
  "keyword-research": {
    label: "AI Keyword Research", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    color: "#6366F1", bg: "rgba(99,102,241,0.1)", packLabel: "10 keyword reports", packPrice: "$19.99", packUnit: "reports",
    inputFields: [
      { key: "business", label: "Describe your business", placeholder: "e.g. Local plumbing company serving residential customers", type: "text" },
      { key: "industry", label: "Industry", placeholder: "e.g. Home Services, E-commerce, Healthcare, Legal", type: "text" },
      { key: "location", label: "Location / Market", placeholder: "e.g. Chicago, IL or United States", type: "text" },
    ],
    resultRenderer: (r) => (
      <div className="space-y-5">
        {Array.isArray(r.primaryKeywords) && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.05)", background: "#F9FAFB" }}>
              <p className="text-xs font-bold uppercase" style={{ color: "#6B7280" }}>Primary Keywords</p>
            </div>
            <div className="divide-y divide-black/[0.04]">
              {(r.primaryKeywords as Array<{keyword:string;intent:string;competition:string;cpcRange:string;priority:string}>).map((kw, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <span className="flex-1 text-sm font-semibold" style={{ color: "#111827" }}>{kw.keyword}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: kw.intent === "transactional" ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.1)", color: kw.intent === "transactional" ? "#16A34A" : "#4F46E5" }}>{kw.intent}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: kw.competition === "low" ? "rgba(34,197,94,0.1)" : kw.competition === "high" ? "rgba(239,68,68,0.1)" : "rgba(251,191,36,0.1)", color: kw.competition === "low" ? "#16A34A" : kw.competition === "high" ? "#DC2626" : "#D97706" }}>{kw.competition}</span>
                  <span className="text-xs font-mono" style={{ color: "#6B7280" }}>{kw.cpcRange}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(r.longTailKeywords) && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.05)", background: "#F9FAFB" }}>
              <p className="text-xs font-bold uppercase" style={{ color: "#6B7280" }}>Long-Tail Keywords</p>
            </div>
            <div className="divide-y">
              {(r.longTailKeywords as Array<{keyword:string;intent:string;competition:string;cpcRange:string}>).map((kw, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <span className="flex-1 text-sm" style={{ color: "#374151" }}>{kw.keyword}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.08)", color: "#4F46E5" }}>{kw.intent}</span>
                  <span className="text-xs font-mono" style={{ color: "#9CA3AF" }}>{kw.cpcRange}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(r.contentAngles) && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "#6B7280" }}>Content Angles</p>
            <ul className="space-y-2">
              {(r.contentAngles as string[]).map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(99,102,241,0.12)"/><path d="M5 8l2 2 4-4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(r.negativeKeywords) && (
          <div className="rounded-xl p-4 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: "#6B7280" }}>Negative Keywords (Block These in Google Ads)</p>
            <div className="flex flex-wrap gap-1.5">
              {(r.negativeKeywords as string[]).map((k, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full line-through" style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626" }}>{k}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
  },
  "ai-seo": {
    label: "Auto AI SEO", icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: "#10B981", bg: "rgba(16,185,129,0.1)", packLabel: "Monthly subscription", packPrice: "$199.99/mo", packUnit: "month",
    inputFields: [
      { key: "url", label: "Website URL or business name", placeholder: "e.g. myplumbing.com or Joe's Plumbing Chicago", type: "text" },
      { key: "industry", label: "Industry / niche", placeholder: "e.g. Home Services, Restaurant, Retail", type: "text" },
      { key: "location", label: "Primary location", placeholder: "e.g. Chicago, IL", type: "text" },
    ],
    resultRenderer: (r) => (
      <div className="space-y-5">
        {r.healthScore !== undefined && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl" style={{ background: Number(r.healthScore) >= 70 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: Number(r.healthScore) >= 70 ? "#16A34A" : "#D97706" }}>
                {r.healthScore as number}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#111827" }}>SEO Health Score</p>
                <p className="text-sm" style={{ color: "#6B7280" }}>{r.summary as string}</p>
              </div>
            </div>
          </div>
        )}
        {Array.isArray(r.issues) && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="px-5 py-3 border-b" style={{ background: "#F9FAFB" }}>
              <p className="text-xs font-bold uppercase" style={{ color: "#6B7280" }}>Issues Found</p>
            </div>
            <div className="divide-y">
              {(r.issues as Array<{severity:string;title:string;description:string;fix:string}>).map((iss, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: iss.severity === "critical" ? "rgba(239,68,68,0.1)" : iss.severity === "high" ? "rgba(245,158,11,0.1)" : "rgba(99,102,241,0.08)", color: iss.severity === "critical" ? "#DC2626" : iss.severity === "high" ? "#D97706" : "#4F46E5" }}>{iss.severity}</span>
                    <span className="font-semibold text-sm" style={{ color: "#111827" }}>{iss.title}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "#6B7280" }}>{iss.description}</p>
                  <p className="text-xs font-medium" style={{ color: "#10B981" }}>✓ Fix: {iss.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(r.keywordOpportunities) && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "#6B7280" }}>Keyword Opportunities</p>
            <div className="space-y-3">
              {(r.keywordOpportunities as Array<{keyword:string;estimatedVolume:string;difficulty:string;opportunity:string}>).map((k, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: "#F9FAFB" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: "#111827" }}>{k.keyword}</span>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>{k.estimatedVolume}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: k.difficulty === "easy" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: k.difficulty === "easy" ? "#16A34A" : "#D97706" }}>{k.difficulty}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{k.opportunity}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {!!r.aiSearchOptimization && (
          <div className="rounded-xl p-5 border-l-4" style={{ background: "rgba(16,185,129,0.04)", borderLeftColor: "#10B981" }}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "#10B981" }}>AI Search Optimization (ChatGPT/Perplexity)</p>
            <p className="text-sm" style={{ color: "#374151" }}>{r.aiSearchOptimization as string}</p>
          </div>
        )}
      </div>
    ),
  },
  "content-marketing": {
    label: "AI Content Marketing", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", packLabel: "Monthly subscription", packPrice: "$149.99/mo", packUnit: "month",
    inputFields: [
      { key: "topic", label: "Content topic", placeholder: "e.g. Why local businesses need social media in 2025", type: "text" },
      { key: "format", label: "Format", placeholder: "", type: "select", options: ["Blog Post", "Email Newsletter", "LinkedIn Article", "Social Caption Pack", "How-To Guide"] },
      { key: "tone", label: "Tone", placeholder: "", type: "select", options: ["Professional", "Friendly & Conversational", "Educational", "Bold & Direct", "Inspirational"] },
      { key: "audience", label: "Target audience", placeholder: "e.g. Small business owners, Marketing managers", type: "text" },
    ],
    resultRenderer: (r) => (
      <div className="space-y-5">
        {!!r.title && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: "#8B5CF6" }}>Title</p>
            <h3 className="text-xl font-black" style={{ color: "#111827" }}>{r.title as string}</h3>
            {!!r.metaDescription && <p className="text-sm mt-2" style={{ color: "#6B7280" }}>{r.metaDescription as string}</p>}
          </div>
        )}
        {!!r.content && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "#6B7280" }}>Content</p>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#374151" }}>{r.content as string}</div>
          </div>
        )}
        {!!r.emailSubject && (
          <div className="rounded-xl p-4 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "#6B7280" }}>Email Subject Line</p>
            <p className="font-semibold text-sm" style={{ color: "#111827" }}>{r.emailSubject as string}</p>
          </div>
        )}
        {!!r.socialCaption && (
          <div className="rounded-xl p-4 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "#6B7280" }}>Social Caption</p>
            <p className="text-sm" style={{ color: "#374151" }}>{r.socialCaption as string}</p>
          </div>
        )}
        {Array.isArray(r.keyTakeaways) && (
          <div className="rounded-xl p-5 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "#6B7280" }}>Key Takeaways</p>
            <ul className="space-y-2">
              {(r.keyTakeaways as string[]).map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(139,92,246,0.12)"/><path d="M5 8l2 2 4-4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!!r.cta && (
          <div className="rounded-xl p-4 border-l-4" style={{ background: "rgba(139,92,246,0.05)", borderLeftColor: "#8B5CF6" }}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "#8B5CF6" }}>Call to Action</p>
            <p className="font-semibold text-sm" style={{ color: "#111827" }}>{r.cta as string}</p>
          </div>
        )}
      </div>
    ),
  },
};

// Token cost per tool — mirrors TOOL_TOKEN_ACTION costs on the server
const TOOL_TOKEN_COST: Record<string, number> = {
  "image-generator":   10,
  "reels-generator":   5,
  "keyword-research":  20,
  "ai-seo":            20,
  "content-marketing": 5,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = use(params);
  const meta = TOOL_META[tool];
  const module = getModule(tool);

  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Image-generator specific state
  const [imageGenerating, setImageGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoadingMsg, setImageLoadingMsg] = useState("Generating your image…");
  const imageRef = useRef<HTMLDivElement | null>(null);

  // Reels-generator video state
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoadingMsg, setVideoLoadingMsg] = useState("Initializing video generation…");
  const videoRef = useRef<HTMLDivElement | null>(null);

  const tokenCost = TOOL_TOKEN_COST[tool] ?? 5;

  useEffect(() => {
    apiFetch<{ balance: number }>("/v1/tokens/balance")
      .then((res) => {
        if (res.ok) setTokenBalance(res.data.balance);
      });
  }, [tool]);

  const handleGenerateImage = async () => {
    if (!result) return;
    const variations = result.variations as Array<{ prompt: string }> | undefined;
    const prompt = variations?.[0]?.prompt ?? (form["prompt"] ?? "");
    if (!prompt) return;
    const platform = (form["platform"] ?? "instagram").toLowerCase().split(" ")[0];

    setImageGenerating(true);
    setImageError(null);
    setGeneratedImageUrl(null);
    setImageLoadingMsg("Generating your image…");

    const LOADING_PHASES = [
      { after: 0,   msg: "Generating your image…" },
      { after: 20,  msg: "Still creating… hang tight" },
      { after: 45,  msg: "Almost there…" },
      { after: 70,  msg: "Finalizing your image…" },
      { after: 100, msg: "Just a few more seconds…" },
    ];
    const startTime = Date.now();
    const phaseTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const phase = [...LOADING_PHASES].reverse().find(p => elapsed >= p.after);
      if (phase) setImageLoadingMsg(phase.msg);
    }, 2000);

    // Retry loop — max 4 attempts, only hard-stop on token error
    let attempt = 0;
    const MAX_RETRIES = 4;
    while (attempt < MAX_RETRIES) {
      const res = await apiFetch<{ imageUrl: string }>("/v1/dashboard/tools/generate-image", {
        method: "POST",
        body: { prompt, platform },
        timeoutMs: 120000,
      });

      if (res.ok && res.data?.imageUrl) {
        clearInterval(phaseTimer);
        setGeneratedImageUrl(res.data.imageUrl);
        if (tokenBalance !== null) setTokenBalance((b) => (b ?? 0) - 10);
        setImageGenerating(false);
        setTimeout(() => imageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        return;
      }

      // Only hard-stop on token error
      if (res.status === 403) {
        clearInterval(phaseTimer);
        setImageError("Not enough tokens. Buy more to continue.");
        setImageGenerating(false);
        return;
      }

      // Wait before retrying — longer waits on later attempts
      const delay = Math.min(3000 + attempt * 1000, 8000);
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }

    // Max retries exhausted
    clearInterval(phaseTimer);
    setImageError("Image generation timed out after multiple attempts. Please try again.");
    setImageGenerating(false);
  };

  const handleGenerateVideo = async () => {
    if (!result) return;
    const script = result.script as string;
    const shotList = (result.shotList as string[]) ?? [];
    const platform = (form["platform"] as string) || "Instagram Reels";

    if (!script || !script.trim()) {
      setVideoError("No script generated. Generate a reel script first.");
      return;
    }

    setVideoGenerating(true);
    setVideoError(null);
    setVideoUrl(null);
    setVideoLoadingMsg("Initializing video generation…");

    const LOADING_PHASES = [
      { after: 0,   msg: "Initializing video generation…" },
      { after: 20,  msg: "Sending your script to Runway AI…" },
      { after: 45,  msg: "AI is rendering your video…" },
      { after: 90,  msg: "Still rendering… almost done" },
      { after: 180, msg: "Finalizing your video…" },
      { after: 300, msg: "Just a few more seconds…" },
    ];
    const startTime = Date.now();
    const phaseTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const phase = [...LOADING_PHASES].reverse().find(p => elapsed >= p.after);
      if (phase) setVideoLoadingMsg(phase.msg);
    }, 2000);

    // Start the job
    const contentId = `reel_${Date.now()}`;
    const startRes = await apiFetch<{
      success: boolean;
      jobId: string;
      status: string;
      unsupportedReason?: string;
      tokenCost?: number;
      error?: string;
    }>("/v1/ai/reel-video/start", {
      method: "POST",
      body: {
        contentId,
        script,
        shotList,
        platform,
        durationSeconds: 10,
        aspectRatio: "9:16",
        style: "promotional",
        ctaUrl: "",
        businessProfile: { businessName: "" },
      },
      timeoutMs: 30000,
    });

    if (!startRes.ok || !startRes.data.success) {
      clearInterval(phaseTimer);
      const err = startRes.data?.error || startRes.data?.unsupportedReason || "Failed to start video generation.";
      setVideoError(err);
      setVideoGenerating(false);
      if (startRes.data?.tokenCost === 0) {
        setVideoError("Video generation is not supported right now. Runway API key may be missing or invalid.");
      }
      return;
    }

    const jobId = startRes.data.jobId;
    const tokenCost = startRes.data.tokenCost ?? 100;
    if (tokenBalance !== null) setTokenBalance((b) => Math.max(0, (b ?? 0) - tokenCost));

    // Poll for status
    const maxPollAttempts = 60;
    for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 8000));

      const statusRes = await apiFetch<{
        success: boolean;
        status: string;
        videoUrl: string | null;
        error: string | null;
        errorCode: string | null;
        unsupportedReason: string | null;
      }>(`/v1/ai/reel-video/status/${jobId}`, {
        method: "GET",
        timeoutMs: 15000,
      });

      if (!statusRes.ok || !statusRes.data.success) continue;

      const status = statusRes.data.status;
      if (status === "completed") {
        clearInterval(phaseTimer);
        if (statusRes.data.videoUrl) {
          setVideoUrl(statusRes.data.videoUrl);
        } else {
          setVideoError("Video completed but no URL was returned.");
        }
        setVideoGenerating(false);
        setTimeout(() => videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        return;
      }
      if (status === "failed" || status === "unsupported") {
        clearInterval(phaseTimer);
        const errMsg = statusRes.data.error || statusRes.data.unsupportedReason || "Video generation failed.";
        setVideoError(errMsg);
        setVideoGenerating(false);
        return;
      }
      // still processing: queued, generating, rendering
    }

    // Timed out
    clearInterval(phaseTimer);
    setVideoError("Video generation timed out after 8 minutes. Please try again later.");
    setVideoGenerating(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenBalance !== null && tokenBalance < tokenCost) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setGeneratedImageUrl(null);
    setImageError(null);

    const res = await apiFetch<{ result: Record<string, unknown>; tokensRemaining: number }>(
      `/v1/dashboard/tools/${tool}/use`,
      { method: "POST", body: { input: form }, timeoutMs: 90_000 }
    );

    setLoading(false);
    if (res.ok) {
      setResult(res.data.result);
      setTokenBalance(res.data.tokensRemaining);
    } else if (res.status === 402) {
      const errData = res.data as { message?: string; balance?: number; cost?: number };
      if (errData.balance !== undefined) setTokenBalance(errData.balance);
      setError(errData.message || "Not enough tokens. Buy more to continue generating.");
    } else {
      setError((res.data as { message?: string })?.message || "Generation failed. Please try again.");
    }
  };

  if (!meta) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-sm">Tool not found.</p>
        <Link href="/dashboard/services" className="mt-4 inline-block text-sm font-semibold" style={{ color: "#C13A2A" }}>← Back to Services</Link>
      </div>
    );
  }

  const canGenerate = tokenBalance === null || tokenBalance >= tokenCost;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "#9CA3AF" }}>
          <Link href="/dashboard/services" className="hover:underline" style={{ color: "#C13A2A" }}>My Services</Link>
          <span>/</span>
          <span>{meta.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={meta.color} strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
            </svg>
          </div>
          <div>
            <h1 className="font-black text-xl" style={{ color: "#111827" }}>{meta.label}</h1>
            {module && <p className="text-sm" style={{ color: "#6B7280" }}>{module.shortDesc}</p>}
          </div>
        </div>
      </div>

      {/* Token balance card */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center gap-4"
        style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        <div className="flex-1">
          <p className="text-xs font-bold uppercase mb-1" style={{ color: "#9CA3AF" }}>Token Balance</p>
          {tokenBalance === null ? (
            <div className="h-6 w-24 rounded-lg animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <p className="text-3xl font-black" style={{ color: tokenBalance >= tokenCost ? meta.color : "#EF4444" }}>
              {tokenBalance} <span className="text-sm font-normal" style={{ color: "#9CA3AF" }}>tokens</span>
            </p>
          )}
          <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>Costs {tokenCost} tokens per use</p>
        </div>
        <div className="text-right">
          <Link
            href="/dashboard/tokens"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
          >
            Buy Tokens
          </Link>
          <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Add more tokens anytime</p>
        </div>
      </div>

      {/* Generator form */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        <h2 className="font-black text-base mb-5" style={{ color: "#111827" }}>
          Generate {meta.packUnit.charAt(0).toUpperCase() + meta.packUnit.slice(1)}
        </h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          {meta.inputFields.map(({ key, label, placeholder, type, options }) => (
            <div key={key}>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>{label}</label>
              {type === "select" ? (
                <select
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)", background: "#F9FAFB", color: "#111827" }}
                  value={form[key] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                >
                  <option value="">Select {label}</option>
                  {options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)", background: "#F9FAFB", color: "#111827" }}
                  value={form[key] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  onFocus={(e) => (e.currentTarget.style.borderColor = meta.color)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              )}
            </div>
          ))}

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#DC2626" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canGenerate}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: `linear-gradient(to right, ${meta.color}, ${meta.color}dd)` }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Generating…
              </span>
            ) : !canGenerate ? (
              `Not Enough Tokens — Buy More`
            ) : (
              `Generate ${meta.packUnit.charAt(0).toUpperCase() + meta.packUnit.slice(1, -1)}`
            )}
          </button>
        </form>
      </div>

      {/* Low token CTA */}
      {tokenBalance !== null && !canGenerate && (
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: "white", border: `2px solid ${meta.color}30`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: meta.bg }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={meta.color} strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
            </svg>
          </div>
          <h3 className="font-black text-lg mb-2" style={{ color: "#111827" }}>Not Enough Tokens</h3>
          <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
            You need {tokenCost} tokens to use {meta.label}. You have {tokenBalance}.
          </p>
          <Link
            href="/dashboard/tokens"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
          >
            Buy More Tokens
          </Link>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-2xl p-6" style={{ background: "#F9FAFB", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: meta.bg }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <path d="M3.5 8l3 3 6-6" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="font-bold text-sm" style={{ color: "#111827" }}>Generated Result</h2>
            {tokenBalance !== null && (
              <span className="ml-auto text-xs" style={{ color: "#9CA3AF" }}>{tokenBalance} tokens remaining</span>
            )}
          </div>
          {meta.resultRenderer(result)}

          {/* Reels generator: Proceed with video generation */}
          {tool === "reels-generator" && !videoUrl && (
            <div className="mt-5">
              {videoGenerating ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.04)", border: "1.5px solid rgba(239,68,68,0.18)" }}>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="absolute inset-0 w-16 h-16 animate-spin" style={{ color: "#FECACA" }} viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
                    </svg>
                    <svg className="absolute inset-0 w-16 h-16 animate-spin" style={{ color: "#EF4444", animationDuration: "1.2s" }} viewBox="0 0 64 64" fill="none">
                      <path d="M32 4a28 28 0 0128 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: "#991B1B" }}>{videoLoadingMsg}</p>
                    <p className="text-xs mt-1" style={{ color: "#B91C1C" }}>Runway AI video generation · typically 2–8 minutes</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#EF4444", animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {videoError && (
                    <div className="mb-3 p-3 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: "#DC2626" }}>{videoError}</p>
                      <a href="/dashboard/tokens" className="inline-block px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "#4285C7" }}>Buy More Tokens</a>
                    </div>
                  )}
                  <button
                    onClick={() => void handleGenerateVideo()}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", boxShadow: "0 4px 16px rgba(239,68,68,0.35)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Proceed with Video Generation
                  </button>
                </>
              )}
            </div>
          )}

          {/* Image generator: Proceed button / loading state */}
          {tool === "image-generator" && !generatedImageUrl && (
            <div className="mt-5">
              {imageGenerating ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 rounded-2xl" style={{ background: "rgba(245,158,11,0.04)", border: "1.5px solid rgba(245,158,11,0.18)" }}>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="absolute inset-0 w-16 h-16 animate-spin" style={{ color: "#FDE68A" }} viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
                    </svg>
                    <svg className="absolute inset-0 w-16 h-16 animate-spin" style={{ color: "#F59E0B", animationDuration: "1.2s" }} viewBox="0 0 64 64" fill="none">
                      <path d="M32 4a28 28 0 0128 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: "#92400E" }}>{imageLoadingMsg}</p>
                    <p className="text-xs mt-1" style={{ color: "#B45309" }}>AI image generation · typically 20–60 seconds</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#F59E0B", animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {imageError && (
                    <div className="mb-3 p-3 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: "#DC2626" }}>{imageError}</p>
                      <a href="/dashboard/tokens" className="inline-block px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "#4285C7" }}>Buy More Tokens</a>
                    </div>
                  )}
                  <button
                    onClick={() => void handleGenerateImage()}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.35)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Proceed with Image Generation · 10 tokens
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image generator: Generated image result */}
      {tool === "image-generator" && generatedImageUrl && (
        <div ref={imageRef} className="rounded-2xl overflow-hidden mt-6" style={{ border: "1px solid rgba(245,158,11,0.25)" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.06)" }}>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#D97706" }}>Generated Image</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Generated by WorldDigital.ai</span>
          </div>
          <div className="p-4 space-y-3" style={{ background: "white" }}>
            <img src={generatedImageUrl} alt="AI generated marketing image" className="w-full rounded-xl object-contain" style={{ maxHeight: 400, background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.08)" }} />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = generatedImageUrl;
                  link.download = "worlddigitalai-image.png";
                  link.click();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                style={{ background: "#16A34A" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
              <button
                onClick={() => { setGeneratedImageUrl(null); void handleGenerateImage(); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ background: "rgba(245,158,11,0.1)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reels generator: Generated video result */}
      {tool === "reels-generator" && videoUrl && (
        <div ref={videoRef} className="rounded-2xl overflow-hidden mt-6" style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.06)" }}>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#DC2626" }}>Generated Video</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Generated by Runway AI</span>
          </div>
          <div className="p-4 space-y-3" style={{ background: "white" }}>
            <video
              src={videoUrl}
              controls
              preload="metadata"
              className="w-full rounded-xl"
              style={{ maxHeight: 600, background: "#111827", border: "1px solid rgba(0,0,0,0.08)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = videoUrl;
                  link.download = "worlddigitalai-reel.mp4";
                  link.click();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                style={{ background: "#16A34A" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download MP4
              </button>
              <button
                onClick={() => { setVideoUrl(null); void handleGenerateVideo(); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                Regenerate Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
