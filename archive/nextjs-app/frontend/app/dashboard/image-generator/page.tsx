"use client";

import { useState, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { apiFetch } from "@/lib/api";
import SectionHeader from "../components/SectionHeader";
import TabBar from "../components/TabBar";
import EmptyState from "../components/EmptyState";

const TABS = ["Generate Images", "Brand Kit", "Image Library"];
const FORMATS = [
  { ratio: "1:1", label: "Feed", desc: "Square" },
  { ratio: "4:5", label: "Feed Post", desc: "Portrait" },
  { ratio: "9:16", label: "Story/Reels", desc: "Vertical" },
  { ratio: "16:9", label: "YouTube Banner", desc: "Wide" },
  { ratio: "1.91:1", label: "Facebook Link", desc: "Link Ad" },
];
const STYLES = ["Photorealistic", "Illustrated", "Minimalist", "Bold/Graphic", "Luxury", "Playful", "Corporate", "Retro"];

const LOADING_PHASES = [
  { after: 0,   msg: "Generating your image…" },
  { after: 20,  msg: "Still creating… hang tight" },
  { after: 45,  msg: "Almost there…" },
  { after: 70,  msg: "Finalizing your image…" },
  { after: 100, msg: "Just a few more seconds…" },
];

export default function ImageGeneratorDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Generate Images");
  const [selectedFormat, setSelectedFormat] = useState("1:1");
  const [selectedStyle, setSelectedStyle] = useState("Photorealistic");
  const [prompt, setPrompt] = useState("");
  const [includeLogo, setIncludeLogo] = useState(true);
  const [useBrandColors, setUseBrandColors] = useState(true);
  const [useBrandStyle, setUseBrandStyle] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Generating your image…");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [library, setLibrary] = useState<string[]>([]);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTokenError(null);
    setGeneratedUrl(null);
    setLoadingMsg("Generating your image…");

    const startTime = Date.now();
    const phaseTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const phase = [...LOADING_PHASES].reverse().find(p => elapsed >= p.after);
      if (phase) setLoadingMsg(phase.msg);
    }, 2000);

    const fullPrompt = [
      prompt.trim(),
      useBrandStyle && user?.brandVoice ? `Style: ${user.brandVoice}` : "",
      useBrandColors && user?.primaryColor ? `Brand colors: ${user.primaryColor}` : "",
      `Style aesthetic: ${selectedStyle}`,
      `Format: ${selectedFormat}`,
    ].filter(Boolean).join(". ");

    const platform = selectedFormat === "9:16" ? "instagram_story" : "instagram";

    let attempt = 0;
    const MAX_RETRIES = 4;
    while (attempt < MAX_RETRIES) {
      const res = await apiFetch<{ imageUrl: string }>("/v1/dashboard/tools/generate-image", {
        method: "POST",
        body: { prompt: fullPrompt, platform },
        timeoutMs: 120000,
      });

      if (res.ok && res.data?.imageUrl) {
        clearInterval(phaseTimer);
        setGeneratedUrl(res.data.imageUrl);
        setLibrary(prev => [res.data!.imageUrl, ...prev].slice(0, 20));
        setGenerating(false);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        return;
      }

      if (res.status === 403) {
        clearInterval(phaseTimer);
        setTokenError("Not enough tokens. Buy more to continue.");
        setGenerating(false);
        return;
      }

      const delay = Math.min(3000 + attempt * 1000, 8000);
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }

    // Max retries exhausted
    clearInterval(phaseTimer);
    setTokenError("Image generation timed out after multiple attempts. Please try again.");
    setGenerating(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#111827" }}>Image Generator</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>AI-generated images branded to your business</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>Image Generator Plan</span>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Generate Images" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Platform Format</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.ratio}
                    onClick={() => setSelectedFormat(f.ratio)}
                    className="rounded-xl p-2 text-center border transition"
                    style={{
                      borderColor: selectedFormat === f.ratio ? "#4285C7" : "rgba(0,0,0,0.08)",
                      background: selectedFormat === f.ratio ? "rgba(66,133,199,0.06)" : "white",
                    }}
                  >
                    <div className="w-8 h-8 mx-auto mb-1 rounded border-2 flex items-center justify-center" style={{ borderColor: selectedFormat === f.ratio ? "#4285C7" : "#CBD5E1", aspectRatio: f.ratio.replace(":","/") }}>
                      <span className="text-[8px] font-bold" style={{ color: selectedFormat === f.ratio ? "#4285C7" : "#9CA3AF" }}>{f.ratio}</span>
                    </div>
                    <p className="text-[10px] font-semibold" style={{ color: selectedFormat === f.ratio ? "#4285C7" : "#374151" }}>{f.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStyle(s)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition"
                    style={{
                      borderColor: selectedStyle === s ? "#4285C7" : "rgba(0,0,0,0.08)",
                      background: selectedStyle === s ? "rgba(66,133,199,0.06)" : "white",
                      color: selectedStyle === s ? "#4285C7" : "#374151",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Prompt</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full rounded-xl px-3 py-2.5 text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="Describe what you want in the image..." />
              <button onClick={() => setPrompt(user?.businessDescription || "")} className="text-[10px] font-bold mt-1" style={{ color: "#4285C7" }}>Use My Business Description</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold block" style={{ color: "#374151" }}>Brand Lock</label>
              {[
                { label: "Include my logo (top right overlay)", checked: includeLogo, onChange: setIncludeLogo },
                { label: "Use my brand colors", checked: useBrandColors, onChange: setUseBrandColors },
                { label: "Use my brand style", checked: useBrandStyle, onChange: setUseBrandStyle },
              ].map((t) => (
                <label key={t.label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={t.checked} onChange={(e) => t.onChange(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-xs" style={{ color: "#374151" }}>{t.label}</span>
                </label>
              ))}
            </div>

            {tokenError && (
              <div className="p-3 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-sm font-semibold mb-2" style={{ color: "#DC2626" }}>{tokenError}</p>
                <a href="/dashboard/tokens" className="inline-block px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "#4285C7" }}>Buy More Tokens</a>
              </div>
            )}

            <button
              onClick={() => void generate()}
              disabled={generating || !prompt.trim()}
              className="w-full py-3 rounded-xl text-sm font-black text-white transition disabled:opacity-40"
              style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
            >
              Generate Image →
            </button>
          </div>

          <div ref={resultRef} className="rounded-2xl p-5 flex flex-col items-center justify-center min-h-[300px]" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            {generating ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="absolute inset-0 w-16 h-16 animate-spin" style={{ color: "#E2E8F0" }} viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
                  </svg>
                  <svg className="absolute inset-0 w-16 h-16 animate-spin" style={{ color: "#4285C7", animationDuration: "1.2s" }} viewBox="0 0 64 64" fill="none">
                    <path d="M32 4a28 28 0 0128 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span className="text-2xl">🎨</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: "#111827" }}>{loadingMsg}</p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>AI image generation · typically 20–60 seconds</p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#4285C7", animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            ) : generatedUrl ? (
              <div className="w-full space-y-3">
                <div className="relative rounded-xl overflow-hidden" style={{ background: "#F8FBFE" }}>
                  <img src={generatedUrl} alt="AI generated" className="w-full object-contain rounded-xl" style={{ maxHeight: 400 }} />
                  {includeLogo && user?.logoURL && (
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white border-2 border-white shadow flex items-center justify-center overflow-hidden">
                      <img src={user.logoURL} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void generate()}
                    className="flex-1 px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: "#F1F5F9", color: "#374151" }}>
                    Regenerate
                  </button>
                  <button
                    onClick={() => { const a = document.createElement("a"); a.href = generatedUrl; a.download = "worlddigitalai-image.png"; a.click(); }}
                    className="flex-1 px-3 py-2 rounded-lg text-[10px] font-bold text-white" style={{ background: "#16A34A" }}>
                    Download PNG
                  </button>
                  <button
                    onClick={() => setLibrary(prev => prev.includes(generatedUrl) ? prev : [generatedUrl, ...prev])}
                    className="flex-1 px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: "rgba(66,133,199,0.08)", color: "#4285C7" }}>
                    Save to Library
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-full max-w-xs aspect-square rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F1F5F9,#E2E8F0)" }}>
                  <span className="text-4xl">🎨</span>
                </div>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Your generated image will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "Brand Kit" && (
        <div className="space-y-6 max-w-xl">
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>Your Logo</p>
            {user?.logoURL ? (
              <img src={user.logoURL} alt="Logo" className="w-20 h-20 object-contain rounded-lg" />
            ) : (
              <p className="text-xs" style={{ color: "#9CA3AF" }}>No logo uploaded yet. Go to onboarding to add one.</p>
            )}
            <p className="text-[10px] mt-2" style={{ color: "#6B7280" }}>This logo is automatically applied to all generated content.</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#374151" }}>Brand Colors</p>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full inline-block" style={{ background: user?.primaryColor || "#4285C7" }} />
                <span className="text-xs font-mono" style={{ color: "#374151" }}>{user?.primaryColor || "#4285C7"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full inline-block" style={{ background: user?.secondaryColor || "#C13A2A" }} />
                <span className="text-xs font-mono" style={{ color: "#374151" }}>{user?.secondaryColor || "#C13A2A"}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "#374151" }}>Brand Voice</p>
            <p className="text-sm font-semibold" style={{ color: "#111827" }}>{user?.brandVoice || "Professional & Trustworthy"}</p>
          </div>
        </div>
      )}

      {tab === "Image Library" && (
        <div className="space-y-4">
          <SectionHeader title="Your Generated Images" />
          {library.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {library.map((url, i) => (
                <div key={i} className="group relative rounded-xl overflow-hidden aspect-square" style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <img src={url} alt={`Generated image ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => { const a = document.createElement("a"); a.href = url; a.download = `worlddigitalai-image-${i + 1}.png`; a.click(); }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#16A34A" }}>
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="&#127912;" title="Your image library is empty" subtitle="Generate your first image to see it here. All images are saved automatically." />
          )}
        </div>
      )}
    </div>
  );
}
