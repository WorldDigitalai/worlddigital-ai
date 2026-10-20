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

const TABS = ["Overview", "Campaigns", "Audiences", "Creative Library", "My Posts", "Analytics"];

const GOALS = ["Brand Awareness", "Traffic", "Lead Generation", "Sales & Conversions", "App Installs", "Video Views"];
const FORMATS = ["Feed Image", "Feed Video", "Carousel", "Stories", "Reels", "Collection"];
const AUDIENCES = [
  { label: "Local Radius", desc: "People within 15 miles of your location" },
  { label: "Interest-Based", desc: "Users interested in your business category" },
  { label: "Lookalike", desc: "People similar to your existing customers" },
  { label: "Retargeting", desc: "People who visited your website" },
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    live:       { bg: "rgba(22,163,74,0.1)",   color: "#16A34A", dot: "#16A34A" },
    pending:    { bg: "rgba(245,158,11,0.1)",  color: "#D97706", dot: "#D97706" },
    paused:     { bg: "rgba(107,114,128,0.1)", color: "#6B7280", dot: "#6B7280" },
    error:      { bg: "rgba(220,38,38,0.1)",   color: "#DC2626", dot: "#DC2626" },
    connecting: { bg: "rgba(66,133,199,0.1)",  color: "#4285C7", dot: "#4285C7" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-xs font-black mb-3" style={{ color: "#111827" }}>{title}</p>
      {children}
    </div>
  );
}

export default function MetaAdsDashboard() {
  const { user, updateUser } = useUser();
  const [tab, setTab] = useState("Overview");
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    goal: "Traffic",
    format: "Feed Image",
    ageMin: "18",
    ageMax: "65",
    budget: "50",
    audience: "Interest-Based",
  });
  const [saved, setSaved] = useState(false);

  const checklist = [
    { label: "Business profile complete",  done: !!user?.businessName },
    { label: "Logo uploaded",             done: !!user?.logoURL },
    { label: "Facebook Page connected",   done: false, note: "Our team handles this" },
    { label: "Instagram Account linked",  done: false, note: "Our team handles this" },
    { label: "Meta Pixel installed",      done: false, note: "Our team handles this" },
    { label: "Daily budget configured",   done: !!prefs.budget },
    { label: "First ad set created",      done: false },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const campaigns = user?.campaigns ?? [];
  const posts = user?.posts ?? [];

  const savePrefs = () => {
    localStorage.setItem("wd_meta_goal", prefs.goal);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowPrefs(false); }, 1200);
  };

  const pending = (label: string) => (
    <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>{label}</span>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>Meta Ads</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Facebook &amp; Instagram advertising — powered by WorldDigital.ai</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status="connecting" />
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>Meta Ads Plan</span>
        </div>
      </div>

      {/* Onboarding banner */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(66,133,199,0.05)", border: "1px solid rgba(66,133,199,0.18)" }}>
        <span className="text-xl shrink-0">&#9889;</span>
        <div>
          <p className="text-xs font-black" style={{ color: "#1e40af" }}>Setup in progress — {doneCount}/{checklist.length} steps complete</p>
          <p className="text-xs mt-0.5" style={{ color: "#3b82f6" }}>
            Our team is connecting your Meta Business Suite. Expected live time: within 24 hours of account connection.
            {" "}<button onClick={() => setShowPrefs(true)} className="underline font-bold">Set your preferences now &rarr;</button>
          </p>
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Reach" value="—" subtext="Awaiting campaign launch" icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="Impressions" value="—" subtext="Awaiting campaign launch" icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <StatCard label="Link Clicks" value="—" subtext="Awaiting campaign launch" icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            <StatCard label="ROAS" value="—" subtext="Awaiting campaign launch" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SetupChecklist items={checklist} title="Account Setup Checklist" />

            <div className="space-y-4">
              <InfoCard title="Your Campaign Preferences">
                <div className="space-y-2">
                  {[
                    { label: "Campaign Goal", value: prefs.goal },
                    { label: "Ad Format", value: prefs.format },
                    { label: "Age Range", value: `${prefs.ageMin}–${prefs.ageMax}` },
                    { label: "Daily Budget", value: `$${prefs.budget}/day` },
                    { label: "Audience Type", value: prefs.audience },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span style={{ color: "#6B7280" }}>{label}</span>
                      <span className="font-semibold" style={{ color: "#111827" }}>{value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowPrefs(true)} className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90" style={{ background: "linear-gradient(to right,#4285C7,#1e6db7)" }}>
                  Edit Campaign Preferences &rarr;
                </button>
              </InfoCard>

              <InfoCard title="What Happens Next">
                <ol className="space-y-2">
                  {[
                    "Our team connects your Facebook Page & Instagram",
                    "Meta Pixel is installed on your website",
                    "Your first campaign is created and reviewed",
                    "Ads go live — you&apos;ll see stats here within 24h",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#374151" }}>
                      <span className="shrink-0 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center text-white mt-0.5" style={{ background: "#4285C7" }}>{i + 1}</span>
                      <span dangerouslySetInnerHTML={{ __html: step }} />
                    </li>
                  ))}
                </ol>
              </InfoCard>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {tab === "Campaigns" && (
        <div className="space-y-4">
          <SectionHeader
            title="Your Ad Campaigns"
            action={<button onClick={() => setShowPrefs(true)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>Request Campaign</button>}
          />
          {campaigns.length > 0 ? (
            <CampaignTable campaigns={campaigns} emptyText="" />
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(66,133,199,0.08)" }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <p className="text-sm font-black mb-1" style={{ color: "#111827" }}>No campaigns yet</p>
              <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Your first campaign will appear here within 24 hours of account connection. You can set your preferences to speed up the process.</p>
              <button onClick={() => setShowPrefs(true)} className="px-5 py-2.5 rounded-xl text-xs font-black text-white" style={{ background: "linear-gradient(to right,#4285C7,#1e6db7)" }}>
                Set Campaign Preferences &rarr;
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "&#127919;", label: "Campaign Goal", value: prefs.goal },
              { icon: "&#128197;", label: "Daily Budget", value: `$${prefs.budget}/day` },
              { icon: "&#128101;", label: "Audience", value: prefs.audience },
            ].map(({ icon, label, value }) => (
              <div key={label} className="rounded-xl p-4 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>{label}</p>
                <p className="text-sm font-black mt-0.5" style={{ color: "#111827" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AUDIENCES ── */}
      {tab === "Audiences" && (
        <div className="space-y-4">
          <SectionHeader title="Target Audiences" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>Request Custom Audience</button>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AUDIENCES.map((a) => (
              <div key={a.label} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-black" style={{ color: "#111827" }}>{a.label}</p>
                  <StatusPill status="pending" />
                </div>
                <p className="text-xs" style={{ color: "#6B7280" }}>{a.desc}</p>
                {a.label === "Local Radius" && user?.businessLocation && (
                  <p className="text-xs mt-2 font-semibold" style={{ color: "#4285C7" }}>Targeting: {user.businessLocation}</p>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-xs font-semibold" style={{ color: "#92400e" }}>&#9888; Audiences are configured by our team using your business profile data and category. Custom targeting requests are processed within 24 hours.</p>
          </div>
        </div>
      )}

      {/* ── CREATIVE LIBRARY ── */}
      {tab === "Creative Library" && (
        <div className="space-y-4">
          <SectionHeader title="Ad Creatives" action={<button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#4285C7" }}>Request Creative</button>} />
          <EmptyState
            icon="&#127912;"
            title="Your branded creatives will appear here"
            subtitle="Our design team creates ad visuals using your logo and brand colors. First creatives are delivered within 48 hours of account setup."
            action={
              <a href="/dashboard/image-generator" className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#4285C7" }}>
                Generate Images with AI &rarr;
              </a>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FORMATS.map((f) => (
              <div key={f} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(66,133,199,0.08)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: "#111827" }}>{f}</p>
                  <p className="text-[10px]" style={{ color: "#9CA3AF" }}>0 creatives</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MY POSTS ── */}
      {tab === "My Posts" && (
        <div className="space-y-4">
          <SectionHeader title="Posts Published on Your Behalf" />
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p, i) => <PostCard key={i} post={p} />)}
            </div>
          ) : (
            <EmptyState
              icon="&#128247;"
              title="No posts yet"
              subtitle="Once your Meta account is connected, posts will appear here in real time."
            />
          )}
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "Analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Reach", value: "—" },
              { label: "Total Spend", value: "—" },
              { label: "Avg. CPM", value: "—" },
              { label: "Conv. Rate", value: "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
                <p className="text-xl font-black" style={{ color: "#111827" }}>{value}</p>
                <p className="text-[10px] mt-1" style={{ color: "#D97706" }}>Awaiting data</p>
              </div>
            ))}
          </div>
          <EmptyState
            icon="&#128202;"
            title="Analytics data not yet available"
            subtitle="Charts and performance data will appear here once your first campaign has been running for 24+ hours."
          />
        </div>
      )}

      {/* ── PREFERENCES MODAL ── */}
      <Modal open={showPrefs} onClose={() => setShowPrefs(false)} title="Campaign Preferences">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Campaign Goal</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GOALS.map((g) => (
                <button key={g} onClick={() => setPrefs((p) => ({ ...p, goal: g }))} className="px-3 py-2 rounded-xl text-xs font-semibold border transition" style={{ borderColor: prefs.goal === g ? "#4285C7" : "rgba(0,0,0,0.08)", background: prefs.goal === g ? "rgba(66,133,199,0.08)" : "white", color: prefs.goal === g ? "#4285C7" : "#374151" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Preferred Ad Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button key={f} onClick={() => setPrefs((p) => ({ ...p, format: f }))} className="px-3 py-2 rounded-xl text-xs font-semibold border transition" style={{ borderColor: prefs.format === f ? "#4285C7" : "rgba(0,0,0,0.08)", background: prefs.format === f ? "rgba(66,133,199,0.08)" : "white", color: prefs.format === f ? "#4285C7" : "#374151" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Min Age</label>
              <input type="number" min={13} max={65} value={prefs.ageMin} onChange={(e) => setPrefs((p) => ({ ...p, ageMin: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Max Age</label>
              <input type="number" min={13} max={65} value={prefs.ageMax} onChange={(e) => setPrefs((p) => ({ ...p, ageMax: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Daily Budget (USD)</label>
            <input type="number" min={5} value={prefs.budget} onChange={(e) => setPrefs((p) => ({ ...p, budget: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm border" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }} />
            <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Minimum $5/day. Budget goes directly to Meta ad spend.</p>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "#374151" }}>Audience Type</label>
            <select value={prefs.audience} onChange={(e) => setPrefs((p) => ({ ...p, audience: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm border bg-white" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#111827" }}>
              {AUDIENCES.map((a) => <option key={a.label} value={a.label}>{a.label} — {a.desc}</option>)}
            </select>
          </div>
          <button onClick={savePrefs} className="w-full py-2.5 rounded-xl text-sm font-black text-white transition hover:opacity-90" style={{ background: saved ? "#16A34A" : "linear-gradient(to right,#4285C7,#1e6db7)" }}>
            {saved ? "&#10003; Preferences Saved!" : "Save Campaign Preferences"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
