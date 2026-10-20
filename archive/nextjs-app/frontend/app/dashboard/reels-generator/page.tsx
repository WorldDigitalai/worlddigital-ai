"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import TabBar from "../components/TabBar";

const TABS = ["Generate Reels", "My Library", "Brand Kit"];
const HOOKS = [
  "Stop scrolling — this is for you",
  "3 things nobody told you about...",
  "POV: you just discovered...",
  "Watch this before your competitor does",
  "The secret to [result] in 60 seconds",
  "I was today years old when I learned...",
];
const TEMPLATES = ["Product Showcase", "Behind the Scenes", "Customer Testimonial", "How-To", "Trending Audio", "Day in the Life"];

export default function ReelsGeneratorDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Generate Reels");
  const [hook, setHook] = useState(HOOKS[0]);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setScript(`[HOOK] ${hook}\n\n[SCENE 1] Open with your logo overlay (top right). Show your product/service in action for 3 seconds.\n\n[SCENE 2] Quick cut to a satisfied customer or result for 4 seconds. Add text overlay: "Results in 30 days".\n\n[SCENE 3] Call to action screen for 3 seconds with your brand colors and website URL.\n\n[TEXT OVERLAYS]\n- "${user?.businessName || 'Your Business'}"\n- "${user?.businessURL || 'https://'}"\n- "Learn more →"\n\n[MUSIC] Trending upbeat track (auto-selected)`);
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "#111827" }}>Reels Generator</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>AI-powered Reels scripts and storyboards</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>Reels Generator Plan</span>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Generate Reels" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Hook</label>
              <div className="space-y-1.5">
                {HOOKS.map((h) => (
                  <button key={h} onClick={() => setHook(h)} className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition"
                    style={{ borderColor: hook === h ? "#4285C7" : "rgba(0,0,0,0.08)", background: hook === h ? "rgba(66,133,199,0.06)" : "white", color: hook === h ? "#4285C7" : "#374151" }}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-2" style={{ color: "#374151" }}>Template</label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t} onClick={() => setTemplate(t)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition"
                    style={{ borderColor: template === t ? "#4285C7" : "rgba(0,0,0,0.08)", background: template === t ? "rgba(66,133,199,0.06)" : "white", color: template === t ? "#4285C7" : "#374151" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={generate} disabled={generating} className="w-full py-3 rounded-xl text-sm font-black text-white transition disabled:opacity-40" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
              {generating ? "Generating Script..." : "Generate Reel Script →"}
            </button>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <SectionHeader title="Script Preview" />
            {script ? (
              <pre className="text-xs whitespace-pre-wrap leading-relaxed p-3 rounded-xl" style={{ background: "#FAFBFC", color: "#374151", border: "1px solid rgba(0,0,0,0.05)" }}>{script}</pre>
            ) : (
              <EmptyState icon="&#127916;" title="Your reel script will appear here" subtitle="Select a hook and template, then generate a branded script." />
            )}
            {script && (
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: "#F1F5F9", color: "#374151" }}>Download Script</button>
                <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: "#F1F5F9", color: "#374151" }}>Add to Library</button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "My Library" && (
        <div className="space-y-4">
          <SectionHeader title="Your Saved Reels" />
          <EmptyState icon="&#127916;" title="Your reel library is empty" subtitle="Generate and save reel scripts to see them here." />
        </div>
      )}

      {tab === "Brand Kit" && (
        <div className="space-y-4 max-w-xl">
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "#374151" }}>Brand Voice</p>
            <p className="text-sm font-semibold" style={{ color: "#111827" }}>{user?.brandVoice || "Professional & Trustworthy"}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "#374151" }}>Logo</p>
            {user?.logoURL ? <img src={user.logoURL} alt="" className="w-16 h-16 object-contain rounded-lg" /> : <p className="text-xs" style={{ color: "#9CA3AF" }}>No logo uploaded yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
