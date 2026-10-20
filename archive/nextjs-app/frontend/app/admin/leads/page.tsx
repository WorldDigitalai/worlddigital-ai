"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminAuth } from "../layout";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeadBehavior {
  pricingViewed?: boolean;
  checkoutStarted?: boolean;
  checkoutAbandoned?: boolean;
  aiAssistantUsed?: boolean;
  formsSubmitted?: number;
  sessionCount?: number;
  pagesViewed?: string[];
  lastVisitAt?: string;
}

interface LeadTask {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

interface LeadNote {
  id: string;
  text: string;
  author?: string;
  createdAt: string;
}

interface LeadEmail {
  subject: string;
  sentAt: string;
  opened?: boolean;
  clicked?: boolean;
  failed?: boolean;
}

interface Lead {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  stage: string;
  score: number;
  temperature: "hot" | "warm" | "cold";
  source?: string;
  sourcePage?: string;
  interestedService?: string;
  owner?: string;
  contacted?: boolean;
  demoRequested?: boolean;
  behavior?: LeadBehavior;
  tasks?: LeadTask[];
  notes?: LeadNote[];
  emails?: LeadEmail[];
  createdAt?: string;
  updatedAt?: string;
}

interface Metrics {
  total: number;
  won: number;
  lost: number;
  conversionRate: number;
  hot: number;
  warm: number;
  cold: number;
  topSource: string;
  topService: string;
  byStage: Record<string, number>;
  abandonedCheckouts: number;
  contacted: number;
  recentLeads: number;
}

interface AdminNotification {
  _id: string;
  type: string;
  message: string;
  meta?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES = ["New Lead", "Interested", "Contacted", "Demo Scheduled", "Proposal Sent", "Negotiating", "Won", "Lost"];

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "New Lead":       { bg: "#F8FAFC", border: "#CBD5E1", text: "#475569" },
  "Interested":     { bg: "#EFF6FF", border: "#93C5FD", text: "#1D4ED8" },
  "Contacted":      { bg: "#F0FDF4", border: "#86EFAC", text: "#16A34A" },
  "Demo Scheduled": { bg: "#FFF7ED", border: "#FCD34D", text: "#D97706" },
  "Proposal Sent":  { bg: "#FDF4FF", border: "#D8B4FE", text: "#7C3AED" },
  "Negotiating":    { bg: "#FFF1F2", border: "#FDA4AF", text: "#E11D48" },
  "Won":            { bg: "#ECFDF5", border: "#34D399", text: "#059669" },
  "Lost":           { bg: "#F1F5F9", border: "#94A3B8", text: "#64748B" },
};

const TEMP_CONFIG = {
  hot:  { label: "Hot",  emoji: "🔥", bg: "rgba(193,58,42,0.1)",  text: "#C13A2A" },
  warm: { label: "Warm", emoji: "🟡", bg: "rgba(202,138,4,0.1)",  text: "#CA8A04" },
  cold: { label: "Cold", emoji: "❄️", bg: "rgba(100,116,139,0.1)", text: "#64748B" },
};

const NOTIF_ICONS: Record<string, string> = {
  high_intent_lead: "🔥",
  lead_captured:    "👤",
  checkout_abandoned: "⚠️",
  demo_requested:   "📅",
  contact_submitted: "📬",
};

const OWNERS = ["Alice", "Bob", "Carlos", "Diana", "Unassigned"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiPatch(token: string, path: string, body: unknown) {
  return fetch(path, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(body) });
}

function fmt(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(d?: string) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Reusable components ───────────────────────────────────────────────────────

function TempBadge({ t }: { t: "hot" | "warm" | "cold" }) {
  const c = TEMP_CONFIG[t] || TEMP_CONFIG.cold;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: c.bg, color: c.text }}>
      {c.emoji} {c.label}
    </span>
  );
}

function StagePill({ stage }: { stage: string }) {
  const c = STAGE_COLORS[stage] || STAGE_COLORS["New Lead"];
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {stage}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 60 ? "#C13A2A" : score >= 30 ? "#CA8A04" : "#94A3B8";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold w-6 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Lead Card (Kanban) ────────────────────────────────────────────────────────

function LeadCard({ lead, onDragStart, onClick }: {
  lead: Lead;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: (lead: Lead) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead._id)}
      onClick={() => onClick(lead)}
      className="rounded-xl p-3 cursor-pointer hover:shadow-md active:opacity-70 transition-all select-none"
      style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-black truncate" style={{ color: "#0F172A" }}>{lead.name || lead.email}</p>
          {lead.name && <p className="text-[10px] truncate" style={{ color: "#94A3B8" }}>{lead.email}</p>}
        </div>
        <TempBadge t={lead.temperature} />
      </div>

      {lead.interestedService && (
        <p className="text-[10px] mb-2 truncate" style={{ color: "#4285C7" }}>📦 {lead.interestedService}</p>
      )}

      <ScoreBar score={lead.score} />

      <div className="flex items-center gap-2 mt-2">
        {lead.contacted && <span className="text-[10px] text-green-600 font-semibold">✓ Contacted</span>}
        {lead.owner && lead.owner !== "" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B" }}>
            {lead.owner}
          </span>
        )}
        <span className="text-[10px] ml-auto" style={{ color: "#CBD5E1" }}>{timeAgo(lead.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Lead Detail Panel ─────────────────────────────────────────────────────────

function LeadDetail({ lead, token, onUpdate, onClose }: {
  lead: Lead;
  token: string;
  onUpdate: (updated: Lead) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"details" | "notes" | "tasks" | "email">("details");
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [owner, setOwner] = useState(lead.owner || "");
  const [stage, setStage] = useState(lead.stage);
  const [contacted, setContacted] = useState(!!lead.contacted);

  const patch = useCallback(async (body: Record<string, unknown>) => {
    setSaving(true);
    const r = await apiPatch(token, `/api/v1/admin/leads/${lead._id}`, body);
    const data = await r.json() as Lead;
    onUpdate(data);
    setSaving(false);
    return data;
  }, [token, lead._id, onUpdate]);

  const addNote = async () => {
    if (!noteText.trim()) return;
    await fetch(`/api/v1/admin/leads/${lead._id}/notes`, {
      method: "POST", headers: authHeaders(token),
      body: JSON.stringify({ text: noteText, author: "Admin" }),
    });
    setNoteText("");
    const r = await fetch(`/api/v1/admin/leads?search=${encodeURIComponent(lead.email)}`, { headers: authHeaders(token) });
    const all = await r.json() as Lead[];
    const refreshed = all.find((l) => l._id === lead._id);
    if (refreshed) onUpdate(refreshed);
  };

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    await fetch(`/api/v1/admin/leads/${lead._id}/tasks`, {
      method: "POST", headers: authHeaders(token),
      body: JSON.stringify({ title: taskTitle, dueDate: taskDue }),
    });
    setTaskTitle(""); setTaskDue("");
    const r = await fetch(`/api/v1/admin/leads?search=${encodeURIComponent(lead.email)}`, { headers: authHeaders(token) });
    const all = await r.json() as Lead[];
    const refreshed = all.find((l) => l._id === lead._id);
    if (refreshed) onUpdate(refreshed);
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await fetch(`/api/v1/admin/leads/${lead._id}/tasks/${taskId}`, {
      method: "PATCH", headers: authHeaders(token),
      body: JSON.stringify({ completed }),
    });
    onUpdate({ ...lead, tasks: (lead.tasks || []).map((t) => t.id === taskId ? { ...t, completed } : t) });
  };

  const deleteNote = async (noteId: string) => {
    await fetch(`/api/v1/admin/leads/${lead._id}/notes/${noteId}`, {
      method: "DELETE", headers: authHeaders(token),
    });
    onUpdate({ ...lead, notes: (lead.notes || []).filter((n) => n.id !== noteId) });
  };

  const b = lead.behavior || {};

  const inp = "w-full px-3 py-2 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-blue-200";
  const inpStyle = { border: "1px solid rgba(0,0,0,0.1)", background: "white" };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="w-full max-w-lg h-full flex flex-col shadow-2xl overflow-y-auto"
        style={{ background: "#F8FAFC" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 sticky top-0 z-10" style={{ background: "white", borderBottom: "1px solid #E2E8F0" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-black text-base truncate" style={{ color: "#0F172A" }}>{lead.name || lead.email}</h3>
              {lead.name && <p className="text-xs truncate" style={{ color: "#64748B" }}>{lead.email}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <TempBadge t={lead.temperature} />
                <span className="text-xs font-bold" style={{ color: "#94A3B8" }}>Score {lead.score}/100</span>
                {lead.interestedService && <span className="text-xs" style={{ color: "#4285C7" }}>📦 {lead.interestedService}</span>}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 transition-colors text-lg leading-none">✕</button>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <select
              value={stage}
              onChange={async (e) => { const s = e.target.value; setStage(s); await patch({ stage: s }); }}
              className="px-2 py-1.5 rounded-lg text-xs font-bold border outline-none"
              style={{ border: "1px solid #E2E8F0", background: "white", color: "#0F172A" }}
            >
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={owner}
              onChange={async (e) => { const o = e.target.value; setOwner(o); await patch({ owner: o === "Unassigned" ? "" : o }); }}
              className="px-2 py-1.5 rounded-lg text-xs border outline-none"
              style={{ border: "1px solid #E2E8F0", background: "white", color: "#0F172A" }}
            >
              {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>

            <button
              onClick={async () => { const c = !contacted; setContacted(c); await patch({ contacted: c }); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: contacted ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)",
                color: contacted ? "#16A34A" : "#64748B",
              }}
            >
              {contacted ? "✓ Contacted" : "Mark Contacted"}
            </button>

            {saving && <span className="text-[11px] text-blue-500 animate-pulse">Saving…</span>}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 border-b" style={{ borderColor: "#F1F5F9" }}>
            {(["details", "notes", "tasks", "email"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="pb-2 px-2 text-xs font-bold capitalize transition-colors border-b-2 -mb-px"
                style={{
                  borderColor: tab === t ? "#4285C7" : "transparent",
                  color: tab === t ? "#4285C7" : "#94A3B8",
                }}
              >
                {t === "email" ? "Email Timeline" : t}
                {t === "notes" && (lead.notes?.length || 0) > 0 && (
                  <span className="ml-1 px-1 rounded-full text-[10px]" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>
                    {lead.notes?.length}
                  </span>
                )}
                {t === "tasks" && (lead.tasks?.length || 0) > 0 && (
                  <span className="ml-1 px-1 rounded-full text-[10px]" style={{ background: "rgba(234,179,8,0.1)", color: "#CA8A04" }}>
                    {lead.tasks?.filter((x) => !x.completed).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 p-5 space-y-4">

          {/* ── Details tab ── */}
          {tab === "details" && (
            <>
              <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <p className="text-[11px] font-black uppercase tracking-wide mb-3" style={{ color: "#94A3B8" }}>Contact Info</p>
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Email", value: lead.email, href: `mailto:${lead.email}` },
                    { label: "Phone", value: lead.phone },
                    { label: "Company", value: lead.company },
                    { label: "Website", value: lead.website, href: lead.website },
                    { label: "Source", value: lead.source },
                    { label: "Source Page", value: lead.sourcePage },
                    { label: "Demo Requested", value: lead.demoRequested ? "Yes" : "No" },
                    { label: "Created", value: fmt(lead.createdAt) },
                  ].map(({ label, value, href }) => value ? (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 font-medium" style={{ color: "#64748B" }}>{label}</span>
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="truncate underline" style={{ color: "#4285C7" }}>{value}</a>
                      ) : (
                        <span className="truncate" style={{ color: "#0F172A" }}>{value}</span>
                      )}
                    </div>
                  ) : null)}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <p className="text-[11px] font-black uppercase tracking-wide mb-3" style={{ color: "#94A3B8" }}>Behavior Signals</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: "Pricing Viewed", val: b.pricingViewed },
                    { label: "Checkout Started", val: b.checkoutStarted },
                    { label: "Checkout Abandoned", val: b.checkoutAbandoned },
                    { label: "AI Assistant Used", val: b.aiAssistantUsed },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span style={{ color: val ? "#16A34A" : "#CBD5E1" }}>{val ? "✓" : "○"}</span>
                      <span style={{ color: val ? "#0F172A" : "#94A3B8" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg px-3 py-2" style={{ background: "#F8FAFC" }}>
                    <p style={{ color: "#94A3B8" }}>Sessions</p>
                    <p className="font-black text-sm" style={{ color: "#0F172A" }}>{b.sessionCount || 0}</p>
                  </div>
                  <div className="rounded-lg px-3 py-2" style={{ background: "#F8FAFC" }}>
                    <p style={{ color: "#94A3B8" }}>Forms Submitted</p>
                    <p className="font-black text-sm" style={{ color: "#0F172A" }}>{b.formsSubmitted || 0}</p>
                  </div>
                </div>
                {(b.pagesViewed?.length || 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold mb-1.5" style={{ color: "#64748B" }}>Pages Viewed</p>
                    <div className="flex flex-wrap gap-1">
                      {b.pagesViewed?.slice(0, 8).map((p, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar booking placeholder */}
              <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <p className="text-[11px] font-black uppercase tracking-wide mb-3" style={{ color: "#94A3B8" }}>Schedule</p>
                <div className="rounded-xl px-4 py-3 text-center" style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#475569" }}>📅 Book a Demo / Call</p>
                  <p className="text-[11px] mb-3" style={{ color: "#94A3B8" }}>Calendar integration — connects to Calendly, Cal.com, or Google Calendar</p>
                  <a
                    href={`mailto:${lead.email}?subject=Let's schedule a call&body=Hi ${lead.name || "there"}, I'd love to schedule a quick call to discuss how WorldDigital.ai can help your business. When works for you?`}
                    className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "#4285C7" }}
                  >
                    Send Scheduling Email
                  </a>
                </div>
              </div>
            </>
          )}

          {/* ── Notes tab ── */}
          {tab === "notes" && (
            <>
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this lead…"
                  rows={2}
                  className={`${inp} flex-1 resize-none`}
                  style={inpStyle}
                />
                <button
                  onClick={addNote}
                  disabled={!noteText.trim()}
                  className="px-3 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all hover:opacity-90 shrink-0"
                  style={{ background: "#4285C7" }}
                >
                  Add
                </button>
              </div>

              {(lead.notes || []).length === 0 ? (
                <p className="text-center py-8 text-xs" style={{ color: "#94A3B8" }}>No notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...(lead.notes || [])].reverse().map((note) => (
                    <div key={note.id} className="rounded-xl px-4 py-3" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold" style={{ color: "#4285C7" }}>{note.author || "Admin"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color: "#94A3B8" }}>{fmt(note.createdAt)}</span>
                          <button onClick={() => deleteNote(note.id)} className="text-[10px] text-red-400 hover:text-red-600 transition-colors">Delete</button>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "#374151" }}>{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Tasks tab ── */}
          {tab === "tasks" && (
            <>
              <div className="rounded-xl p-3" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#0F172A" }}>New Task</p>
                <div className="flex flex-col gap-2">
                  <input className={inp} style={inpStyle} placeholder="Task title…" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                  <div className="flex gap-2">
                    <input type="date" className={`${inp} flex-1`} style={inpStyle} value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                    <button
                      onClick={addTask}
                      disabled={!taskTitle.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                      style={{ background: "#4285C7" }}
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </div>

              {(lead.tasks || []).length === 0 ? (
                <p className="text-center py-8 text-xs" style={{ color: "#94A3B8" }}>No tasks yet.</p>
              ) : (
                <div className="space-y-2">
                  {(lead.tasks || []).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "white", border: "1px solid #E2E8F0", opacity: task.completed ? 0.6 : 1 }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => toggleTask(task.id, e.target.checked)}
                        className="rounded accent-blue-600 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "#0F172A", textDecoration: task.completed ? "line-through" : "none" }}>{task.title}</p>
                        {task.dueDate && <p className="text-[10px]" style={{ color: "#94A3B8" }}>Due {task.dueDate}</p>}
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: "#CBD5E1" }}>{timeAgo(task.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Email Timeline tab ── */}
          {tab === "email" && (
            <>
              {(lead.emails || []).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs mb-1" style={{ color: "#94A3B8" }}>No emails in timeline yet.</p>
                  <p className="text-[11px]" style={{ color: "#CBD5E1" }}>Emails sent via Resend will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...(lead.emails || [])].reverse().map((email, i) => (
                    <div key={i} className="rounded-xl px-4 py-3" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold" style={{ color: "#0F172A" }}>{email.subject}</p>
                        <span className="text-[10px]" style={{ color: "#94A3B8" }}>{fmt(email.sentAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        {email.opened  && <span className="text-[10px] font-bold text-green-600">✓ Opened</span>}
                        {email.clicked && <span className="text-[10px] font-bold text-blue-600">✓ Clicked</span>}
                        {email.failed  && <span className="text-[10px] font-bold text-red-500">✗ Failed</span>}
                        {!email.opened && !email.failed && <span className="text-[10px]" style={{ color: "#94A3B8" }}>Sent</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Kanban Board ──────────────────────────────────────────────────────────────

function KanbanBoard({ leads, token, onLeadClick, onStageUpdate }: {
  leads: Lead[];
  token: string;
  onLeadClick: (l: Lead) => void;
  onStageUpdate: (id: string, stage: string) => void;
}) {
  const dragId = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = async (stage: string) => {
    if (!dragId.current) return;
    const id = dragId.current;
    dragId.current = null;
    setDragOver(null);
    onStageUpdate(id, stage);
    await apiPatch(token, `/api/v1/admin/leads/${id}`, { stage });
  };

  const byStage = STAGES.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s] = leads.filter((l) => l.stage === s);
    return acc;
  }, {});

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
      {STAGES.map((stage) => {
        const c = STAGE_COLORS[stage];
        const cards = byStage[stage] || [];
        return (
          <div
            key={stage}
            className="flex-shrink-0 flex flex-col rounded-2xl w-56 transition-all"
            style={{
              background: dragOver === stage ? c.bg : "#F8FAFC",
              border: `2px solid ${dragOver === stage ? c.border : "#E2E8F0"}`,
              minWidth: "220px",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(stage); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => onDrop(stage)}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "#E2E8F0" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black" style={{ color: c.text }}>{stage}</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>{cards.length}</span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {cards.length === 0 ? (
                <div className="flex items-center justify-center h-16 rounded-lg border-dashed border" style={{ borderColor: "#E2E8F0" }}>
                  <p className="text-[10px]" style={{ color: "#CBD5E1" }}>Drop here</p>
                </div>
              ) : (
                cards.map((lead) => (
                  <LeadCard key={lead._id} lead={lead} onDragStart={onDragStart} onClick={onLeadClick} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Metrics Cards ─────────────────────────────────────────────────────────────

function MetricsView({ metrics }: { metrics: Metrics }) {
  if (!metrics) return null;
  const cards = [
    { label: "Total Leads",        value: metrics.total,           color: "#0F172A" },
    { label: "Conversion Rate",    value: `${metrics.conversionRate}%`, color: "#059669" },
    { label: "Deals Won",          value: metrics.won,             color: "#059669" },
    { label: "Hot Leads 🔥",       value: metrics.hot,             color: "#C13A2A" },
    { label: "Warm Leads",         value: metrics.warm,            color: "#CA8A04" },
    { label: "Abandoned Checkouts",value: metrics.abandonedCheckouts, color: "#E11D48" },
    { label: "Contacted",          value: metrics.contacted,       color: "#4285C7" },
    { label: "Last 30 Days",       value: metrics.recentLeads,     color: "#7C3AED" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <p className="text-xs font-black uppercase tracking-wide mb-4" style={{ color: "#94A3B8" }}>Pipeline Breakdown</p>
          <div className="space-y-2">
            {STAGES.map((stage) => {
              const count = metrics.byStage?.[stage] || 0;
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              const c = STAGE_COLORS[stage];
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs w-32 shrink-0 truncate" style={{ color: "#374151" }}>{stage}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.text }} />
                  </div>
                  <span className="text-xs w-8 text-right shrink-0 font-bold" style={{ color: "#64748B" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <p className="text-xs font-black uppercase tracking-wide mb-4" style={{ color: "#94A3B8" }}>Highlights</p>
          <div className="space-y-3">
            {[
              { label: "Top Lead Source",  value: metrics.topSource  || "—" },
              { label: "Hottest Service",  value: metrics.topService || "—" },
              { label: "Hot / Warm / Cold",value: `${metrics.hot} / ${metrics.warm} / ${metrics.cold}` },
              { label: "Win Rate",         value: `${metrics.conversionRate}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
                <span className="text-xs" style={{ color: "#64748B" }}>{label}</span>
                <span className="text-xs font-black" style={{ color: "#0F172A" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Notifications Panel ───────────────────────────────────────────────────────

function NotificationsPanel({ notifs, token, onRead }: {
  notifs: AdminNotification[];
  token: string;
  onRead: (id: string) => void;
}) {
  const markRead = async (id: string) => {
    await fetch(`/api/v1/admin/leads/notifications/${id}/read`, { method: "PATCH", headers: authHeaders(token) });
    onRead(id);
  };

  const unread = notifs.filter((n) => !n.read);

  return (
    <div className="space-y-3">
      {unread.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "#94A3B8" }}>No new notifications</p>
        </div>
      )}
      {notifs.slice(0, 30).map((n) => (
        <div
          key={n._id}
          className="flex items-start gap-3 rounded-xl px-4 py-3 transition-all"
          style={{
            background: n.read ? "#F8FAFC" : "white",
            border: `1px solid ${n.read ? "#F1F5F9" : "#E2E8F0"}`,
            opacity: n.read ? 0.7 : 1,
          }}
        >
          <span className="text-lg shrink-0">{NOTIF_ICONS[n.type] || "🔔"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-snug" style={{ color: "#0F172A" }}>{n.message}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>{timeAgo(n.createdAt)}</p>
          </div>
          {!n.read && (
            <button onClick={() => markRead(n._id)} className="text-[10px] shrink-0 hover:opacity-70 transition-opacity" style={{ color: "#4285C7" }}>
              Mark read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminLeads() {
  const { token } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [notifs, setNotifs] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pipeline" | "list" | "metrics" | "notifications">("pipeline");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [filterTemp, setFilterTemp] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", company: "", interestedService: "", source: "manual" });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const [leadsRes, metricsRes, notifsRes] = await Promise.all([
      fetch("/api/v1/admin/leads", { headers: authHeaders(token) }),
      fetch("/api/v1/admin/leads/metrics", { headers: authHeaders(token) }),
      fetch("/api/v1/admin/leads/notifications", { headers: authHeaders(token) }),
    ]);
    const [leadsData, metricsData, notifsData] = await Promise.all([
      leadsRes.json(), metricsRes.json(), notifsRes.json(),
    ]);
    setLeads(Array.isArray(leadsData) ? leadsData as Lead[] : []);
    setMetrics(metricsData as Metrics);
    setNotifs(Array.isArray(notifsData) ? notifsData as AdminNotification[] : []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateLead = useCallback((updated: Lead) => {
    setLeads((prev) => prev.map((l) => l._id === updated._id ? updated : l));
    setSelectedLead((prev) => prev?._id === updated._id ? updated : prev);
  }, []);

  const handleStageUpdate = useCallback((id: string, stage: string) => {
    setLeads((prev) => prev.map((l) => l._id === id ? { ...l, stage } : l));
  }, []);

  const createLead = async () => {
    if (!newLead.email || !token) return;
    setCreating(true);
    const r = await fetch("/api/v1/admin/leads", {
      method: "POST", headers: authHeaders(token),
      body: JSON.stringify(newLead),
    });
    if (r.ok) {
      const created = await r.json() as Lead;
      setLeads((prev) => [created, ...prev]);
      setShowNewLead(false);
      setNewLead({ name: "", email: "", company: "", interestedService: "", source: "manual" });
    }
    setCreating(false);
  };

  const filteredLeads = leads.filter((l) => {
    if (search && !l.email.includes(search.toLowerCase()) && !(l.name || "").toLowerCase().includes(search.toLowerCase()) && !(l.company || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTemp && l.temperature !== filterTemp) return false;
    if (filterStage && l.stage !== filterStage) return false;
    return true;
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  const inp = "px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200";
  const inpStyle = { border: "1px solid #E2E8F0", background: "white" };

  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Sales Pipeline & CRM</h2>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {leads.length} leads · {leads.filter((l) => l.temperature === "hot").length} hot · {leads.filter((l) => l.stage === "Won").length} won
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/api/v1/admin/leads/export"
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "#F1F5F9", color: "#374151" }}
          >
            Export CSV
          </a>
          <button
            onClick={() => setShowNewLead(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: "#C13A2A" }}
          >
            + Add Lead
          </button>
          <button onClick={fetchData} className="px-3 py-2 rounded-xl text-xs hover:opacity-70" style={{ color: "#94A3B8" }}>↺ Refresh</button>
        </div>
      </div>

      {/* New lead modal */}
      {showNewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowNewLead(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-base mb-4" style={{ color: "#0F172A" }}>Add Lead Manually</h3>
            <div className="space-y-3">
              {[
                { label: "Name", key: "name", placeholder: "John Smith" },
                { label: "Email *", key: "email", placeholder: "john@company.com" },
                { label: "Company", key: "company", placeholder: "Acme Corp" },
                { label: "Interested In", key: "interestedService", placeholder: "Google Ads, Meta Ads…" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold mb-1" style={{ color: "#374151" }}>{label}</label>
                  <input
                    className={`w-full ${inp}`}
                    style={inpStyle}
                    placeholder={placeholder}
                    value={newLead[key as keyof typeof newLead]}
                    onChange={(e) => setNewLead((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createLead}
                disabled={!newLead.email || creating}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: "#C13A2A" }}
              >
                {creating ? "Creating…" : "Create Lead"}
              </button>
              <button onClick={() => setShowNewLead(false)} className="px-4 py-2.5 rounded-xl text-sm" style={{ background: "#F1F5F9", color: "#374151" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#F1F5F9" }}>
        {([
          { key: "pipeline",      label: "Kanban Pipeline" },
          { key: "list",          label: "Lead List" },
          { key: "metrics",       label: "Metrics" },
          { key: "notifications", label: unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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

      {/* Filters (pipeline + list) */}
      {(tab === "pipeline" || tab === "list") && (
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className={inp}
            style={{ ...inpStyle, width: 240 }}
          />
          <select value={filterTemp} onChange={(e) => setFilterTemp(e.target.value)} className={inp} style={inpStyle}>
            <option value="">All temperatures</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">🟡 Warm</option>
            <option value="cold">❄️ Cold</option>
          </select>
          <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className={inp} style={inpStyle}>
            <option value="">All stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || filterTemp || filterStage) && (
            <button onClick={() => { setSearch(""); setFilterTemp(""); setFilterStage(""); }} className="px-3 py-2 rounded-xl text-xs" style={{ color: "#94A3B8" }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center h-48 items-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === "pipeline" && (
            <KanbanBoard
              leads={filteredLeads}
              token={token || ""}
              onLeadClick={setSelectedLead}
              onStageUpdate={handleStageUpdate}
            />
          )}

          {tab === "list" && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
                <p className="text-xs font-bold" style={{ color: "#64748B" }}>{filteredLeads.length} leads</p>
              </div>
              {filteredLeads.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-bold text-sm" style={{ color: "#94A3B8" }}>No leads found</p>
                </div>
              ) : (
                <div className="scroll-x">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      {["Name / Email", "Company", "Stage", "Score", "Source", "Owner", "Contacted", "Created"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead._id}
                        onClick={() => setSelectedLead(lead)}
                        className="hover:bg-slate-50 cursor-pointer border-b last:border-0 transition-colors"
                        style={{ borderColor: "#F8FAFC" }}
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold" style={{ color: "#0F172A" }}>{lead.name || lead.email}</p>
                          {lead.name && <p className="text-[10px]" style={{ color: "#94A3B8" }}>{lead.email}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{lead.company || "—"}</td>
                        <td className="px-4 py-3"><StagePill stage={lead.stage} /></td>
                        <td className="px-4 py-3 w-32"><TempBadge t={lead.temperature} /></td>
                        <td className="px-4 py-3 text-xs capitalize" style={{ color: "#64748B" }}>{lead.source || "—"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{lead.owner || "—"}</td>
                        <td className="px-4 py-3">
                          {lead.contacted
                            ? <span className="text-[11px] font-bold text-green-600">✓ Yes</span>
                            : <span className="text-[11px]" style={{ color: "#CBD5E1" }}>No</span>}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: "#94A3B8" }}>{fmt(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          {tab === "metrics" && metrics && <MetricsView metrics={metrics} />}

          {tab === "notifications" && (
            <NotificationsPanel
              notifs={notifs}
              token={token || ""}
              onRead={(id) => setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n))}
            />
          )}
        </>
      )}

      {/* Lead detail panel */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          token={token || ""}
          onUpdate={updateLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}
