"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import StatCard from "../components/StatCard";
import SetupChecklist from "../components/SetupChecklist";
import CampaignTable from "../components/CampaignTable";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import TabBar from "../components/TabBar";
import Modal from "../components/Modal";
import PostCard from "../components/PostCard";

const TABS = ["Overview", "Campaigns", "Keywords", "Ad Creative", "My Posts", "Analytics"];

const GOALS = ["Website Visitors", "Lead Generation", "Phone Calls", "Sales", "Brand Awareness", "App Downloads"];
const MATCH_TYPES = ["Broad Match", "Phrase Match", "Exact Match"];
const NETWORKS = ["Search", "Display", "Shopping", "YouTube", "Performance Max"];

const KEYWORD_IDEAS = [
  { keyword: "near me", intent: "Local", volume: "High", competition: "Low" },
  { keyword: "best [service] [city]", intent: "Commercial", volume: "Medium", competition: "Medium" },
  { keyword: "[service] company", intent: "Informational", volume: "High", competition: "High" },
  { keyword: "affordable [service]", intent: "Commercial", volume: "Medium", competition: "Low" },
  { keyword: "[service] prices", intent: "Transactional", volume: "Medium", competition: "Medium" },
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    live:       { bg: "rgba(22,163,74,0.1)",   color: "#16A34A" },
    pending:    { bg: "rgba(245,158,11,0.1)",  color: "#D97706" },
    paused:     { bg: "rgba(107,114,128,0.1)", color: "#6B7280" },
    connecting: { bg: "rgba(66,133,199,0.1)",  color: "#4285C7" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-xs font-black mb-3" style={{ color: "#111827" }}>{title}</p>
      {children}
    </div>
  );
}

export default function GoogleAdsDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState("Overview");
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    goal: "Website Visitors",
    network: "Search",
    location: user?.businessLocation || "",
    keywords: user?.businessCategory || "",
    budget: "50",
    matchType: "Broad Match",
  });
  const [saved, setSaved] = useState(false);

  const checklist = [
    { label: "Business profile complete",      done: !!user?.businessName },
    { label: "Website URL configured",         done: !!(user?.businessURL && user.businessURL !== "https://") },
    { label: "Google Ads account connected",   done: false, note: "Our team handles this" },
    { label: "Conversion tracking installed",  done: false, note: "Our team handles this" },
    { label: "Keyword list approved",          done: !!prefs.keywords },
    { label: "First campaign created",         done: false },
    { label: "First ad live",                  done: false },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const campaigns = user?.campaigns ?? [];
  const posts = user?.posts ?? [];

  const savePrefs = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowPrefs(false); }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>Google Ads</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Google Search &amp; Display advertising — powered by WorldDigital.ai</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status="connecting" />
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>Google Ads Plan</span>
        </div>
      </div>

      {/* Setup banner */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(66,133,199,0.05)", border: "1px solid rgba(66,133,199,0.18)" }}>
        <span className="text-xl shrink-0">&#128269;</span>
        <div>
          <p className="text-xs font-black" style={{ color: "#1e40af" }}>Account setup in progress — {doneCount}/{checklist.length} steps complete</p>
          <p className="text-xs mt-0.5" style={{ color: "#3b82f6" }}>
            Our team is connecting your Google Ads account and installing conversion tracking.{" "}
            <button onClick={() => setShowPrefs(true)} className="underline font-bold">Set your campaign preferences now &rarr;</button>
          </p>
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Impressions" value="—" subtext="Awaiting campaign launch" icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="Clicks" value="—" subtext="Awaiting campaign launch" icon="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            <StatCard label="Avg. CTR" value="—" subtext="Awaiting campaign launch" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            <StatCard label="Cost/Click" value="—" subtext="Awaiting campaign launch" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SetupChecklist items={checklist} title="Account Setup Checklist" />

            <div className="space-y-4">
              <Card title="Campaign Configuration">
                <div className="space-y-2">
                  {[
                    { label: "Goal", value: prefs.goal },
                    { label: "Network", value: prefs.network },
                    { label: "Location", value: prefs.location || "Not set" },
                    { label: "Daily Budget", value: `$${prefs.budget}/day` },
                    { label: "Keyword Strategy", value: prefs.matchType },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span style={{ color: "#6B7280" }}>{label}</span>
                      <span className="font-semibold" style={{ color: value === "Not set" ? "#D97706" : "#111827" }}>{value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowPrefs(true)} className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90" style={{ background: "linear-gradient(to right,#4285C7,#1e6db7)" }}>
                  Edit Campaign Preferences &rarr;
                </button>
              </Card>

              <Card title="Google Ads Advantage">
                <div className="space-y-2">
                  {[
                    { icon: "&#128269;", text: "Appears in Google Search results for your keywords" },
                    { icon: "&#127759;", text: "Target by city, region, or radius from your location" },
                    { icon: "&#128200;", text: "Only pay when someone clicks your ad (PPC)" },
                    { icon: "&#128175;", text: "AI-optimized bidding maximizes your ROI" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-start gap-2 text-xs" style={{ color: "#374151" }}>
                      <span className="shrink-0 mt-0.5">{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {tab === "Campaigns" && (
        <div className="space-y-4">
          <SectionHeader
            title="Ad Campaigns"
            action={<button onClick={() => setShowPrefs(true)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>Request Campaign</button>}
          />
          {campaigns.length > 0 ? (
            <CampaignTable campaigns={campaigns} emptyText="" />
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(66,133,199,0.08)" }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="text-sm font-black mb-1" style={{ color: "#111827" }}>Your first Google campaign is being prepared</p>
              <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Our team will create your first Search campaign within 24 hours of account connection.</p>
              <button onClick={() => setShowPrefs(true)} className="px-5 py-2.5 rounded-xl text-xs font-black text-white" style={{ background: "linear-gradient(to right,#4285C7,#1e6db7)" }}>
                Set Campaign Preferences &rarr;
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {NETWORKS.map((n) => (
              <div key={n} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: n === prefs.network ? "rgba(66,133,199,0.1)" : "rgba(0,0,0,0.04)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={n === prefs.network ? "#4285C7" : "#9CA3AF"} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: "#111827" }}>{n}</p>
                  <p className="text-[10px]" style={{ color: n === prefs.network ? "#4285C7" : "#9CA3AF" }}>{n === prefs.network ? "Active network" : "Available"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KEYWORDS ── */}
      {tab === "Keywords" && (
        <div className="space-y-4">
          <SectionHeader title="AI Keyword Suggestions" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>Generate Keywords</button>} />

          <div className="rounded-xl p-4" style={{ background: "rgba(66,133,199,0.05)", border: "1px solid rgba(66,133,199,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "#1e40af" }}>
              Based on your business category <strong>({user?.businessCategory || "your industry"})</strong> and location <strong>({user?.businessLocation || "your area"})</strong>, here are suggested keyword patterns:
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  {["Keyword Pattern", "Search Intent", "Volume", "Competition", "Match Type"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-bold" style={{ color: "#6B7280", fontSize: "10px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KEYWORD_IDEAS.map((k, i) => (
                  <tr key={i} style={{ borderBottom: i < KEYWORD_IDEAS.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: "#111827" }}>{k.keyword.replace(/\[service\]/g, user?.businessCategory?.split("/")[0]?.toLowerCase() ?? "service").replace(/\[city\]/g, user?.businessLocation?.split(",")[0] ?? "city")}</td>
                    <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>{k.intent}</span></td>
                    <td className="px-4 py-2.5" style={{ color: "#374151" }}>{k.volume}</td>
                    <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: k.competition === "High" ? "rgba(220,38,38,0.08)" : k.competition === "Medium" ? "rgba(245,158,11,0.08)" : "rgba(22,163,74,0.08)", color: k.competition === "High" ? "#DC2626" : k.competition === "Medium" ? "#D97706" : "#16A34A" }}>{k.competition}</span></td>
                    <td className="px-4 py-2.5" style={{ color: "#374151" }}>Broad</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl p-4" style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "#166534" }}>&#10003; Our team will refine this keyword list and configure match types before launch. No action needed on your end.</p>
          </div>
        </div>
      )}

      {/* ── AD CREATIVE ── */}
      {tab === "Ad Creative" && (
        <div className="space-y-4">
          <SectionHeader title="Ad Creatives &amp; Copy" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>Request Creative</button>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Responsive Search Ad", "Responsive Display Ad", "Performance Max Asset", "Call Ad"].map((type) => (
              <div key={type} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black" style={{ color: "#111827" }}>{type}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>Pending</span>
                </div>
                <p className="text-xs" style={{ color: "#6B7280" }}>Will be created by our team using your business info and brand guidelines.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MY POSTS ── */}
      {tab === "My Posts" && (
        <div className="space-y-4">
          <SectionHeader title="Google Display Posts" />
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p, i) => <PostCard key={i} post={p} />)}
            </div>
          ) : (
            <EmptyState icon="&#128247;" title="No posts yet" subtitle="Display ad creatives will appear here once your Google Ads account is connected." />
          )}
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "Analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["Total Spend", "Conv. Actions", "Quality Score", "Impression Share"].map((label) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
                <p className="text-xl font-black" style={{ color: "#111827" }}>—</p>
                <p className="text-[10px] mt-1" style={{ color: "#D97706" }}>Awaiting data</p>
              </div>
            ))}
          </div>
          <EmptyState icon="&#128202;" title="Analytics not yet available" subtitle="Google Ads performance data will populate here after your first campaign runs for 24+ hours." />
        </div>
      )}

      {/* ── PREFERENCES MODAL ── */}
      <Modal open={showPrefs} onClose={() => setShowPrefs(false)} title="Campaign Preferences">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Campaign Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button key={g} onClick={() => setPrefs((p) => ({ ...p, goal: g }))} className="px-3 py-2 rounded-xl text-xs font-semibold border transition text-left" style={{ borderColor: prefs.goal === g ? "#4285C7" : "rgba(0,0,0,0.08)", background: prefs.goal === g ? "rgba(66,133,199,0.08)" : "white", color: prefs.goal === g ? "#4285C7" : "#374151" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Ad Network</label>
            <div className="grid grid-cols-3 gap-2">
              {NETWORKS.slice(0, 3).map((n) => (
                <button key={n} onClick={() => setPrefs((p) => ({ ...p, network: n }))} className="px-3 py-2 rounded-xl text-xs font-semibold border transition" style={{ borderColor: prefs.network === n ? "#4285C7" : "rgba(0,0,0,0.08)", background: prefs.network === n ? "rgba(66,133,199,0.08)" : "white", color: prefs.network === n ? "#4285C7" : "#374151" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Target Location</label>
            <input value={prefs.location} onChange={(e) => setPrefs((p) => ({ ...p, location: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} placeholder="e.g. Austin, TX or entire USA" />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Daily Budget (USD)</label>
            <input type="number" min={5} value={prefs.budget} onChange={(e) => setPrefs((p) => ({ ...p, budget: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Keyword Match Type</label>
            <div className="grid grid-cols-3 gap-2">
              {MATCH_TYPES.map((m) => (
                <button key={m} onClick={() => setPrefs((p) => ({ ...p, matchType: m }))} className="px-3 py-2 rounded-xl text-xs font-semibold border transition" style={{ borderColor: prefs.matchType === m ? "#4285C7" : "rgba(0,0,0,0.08)", background: prefs.matchType === m ? "rgba(66,133,199,0.08)" : "white", color: prefs.matchType === m ? "#4285C7" : "#374151" }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button onClick={savePrefs} className="w-full py-2.5 rounded-xl text-sm font-black text-white transition hover:opacity-90" style={{ background: saved ? "#16A34A" : "linear-gradient(to right,#4285C7,#1e6db7)" }}>
            {saved ? "✓ Preferences Saved!" : "Save Campaign Preferences"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
