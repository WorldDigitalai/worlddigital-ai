"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../layout";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GiftableService {
  id:       string;
  name:     string;
  category: string;
  price:    number;
  tokens:   number;
}

interface CustomerResult {
  id:                 string;
  email:              string;
  name:               string;
  subscriptionStatus: string;
  subscriptionPlan:   string | null;
  tokenBalance:       number;
  createdAt:          string;
}

interface GiftLog {
  _id:           string;
  userId:        string;
  userEmail:     string;
  userName:      string;
  serviceId:     string;
  serviceName:   string;
  permanent:     boolean;
  months:        number;
  grantedTokens: number;
  giftedAt:      string;
  expiresAt?:    string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    active:     { bg: "rgba(22,163,74,0.1)",    text: "#16A34A" },
    cancelled:  { bg: "rgba(239,68,68,0.1)",    text: "#DC2626" },
    cancelling: { bg: "rgba(234,179,8,0.1)",     text: "#CA8A04" },
    paused:     { bg: "rgba(100,116,139,0.1)",   text: "#64748B" },
    none:       { bg: "rgba(100,116,139,0.08)",  text: "#94A3B8" },
  };
  const c = map[status] ?? map.none;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.text }}>
      {status || "none"}
    </span>
  );
}

// ── Category colours ───────────────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  "Ad Management": "#4285C7",
  "AI Tools":      "#10B981",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GiftServicesPage() {
  const { token } = useAdminAuth();

  // catalogue
  const [catalogue, setCatalogue] = useState<GiftableService[]>([]);

  // search
  const [query, setQuery]         = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults]     = useState<CustomerResult[] | null>(null);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [selected, setSelected]   = useState<CustomerResult | null>(null);

  // gift form
  const [serviceId, setServiceId]   = useState<string>("");
  const [permanent, setPermanent]   = useState(false);
  const [months, setMonths]         = useState(1);
  const [notify, setNotify]         = useState(true);
  const [gifting, setGifting]       = useState(false);
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null);
  const [giftErr, setGiftErr]       = useState<string | null>(null);

  // log
  const [log, setLog]       = useState<GiftLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // ── Load catalogue + log on mount ──────────────────────────────────────────

  const loadLog = useCallback(async () => {
    if (!token) return;
    setLogLoading(true);
    try {
      const r = await fetch("/api/v1/admin/gift/log?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setLog(await r.json() as GiftLog[]);
    } finally {
      setLogLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/v1/admin/gift/catalogue", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() as Promise<GiftableService[]> : [])
      .then(setCatalogue)
      .catch(() => {});
    loadLog();
  }, [token, loadLog]);

  // ── Search ─────────────────────────────────────────────────────────────────

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setSearchErr(null);
    setResults(null);
    setSelected(null);
    try {
      const r = await fetch(`/api/v1/admin/gift/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const data = await r.json() as CustomerResult[];
      if (!r.ok) { setSearchErr("Search failed"); return; }
      setResults(data);
      if (data.length === 0) setSearchErr("No customers found");
    } catch {
      setSearchErr("Network error");
    } finally {
      setSearching(false);
    }
  };

  // ── Apply gift ─────────────────────────────────────────────────────────────

  const applyGift = async () => {
    if (!selected || !serviceId) return;
    setGifting(true);
    setGiftSuccess(null);
    setGiftErr(null);
    try {
      const r = await fetch("/api/v1/admin/gift/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ userId: selected.id, serviceId, permanent, months, notify }),
      });
      const data = await r.json() as { success?: boolean; serviceName?: string; tokensGranted?: number; message?: string };
      if (!r.ok) { setGiftErr(data.message ?? "Gift failed"); return; }
      setGiftSuccess(`✓ ${data.serviceName} gifted — ${data.tokensGranted?.toLocaleString()} tokens added${notify ? ", email sent" : ""}`);
      setServiceId("");
      await loadLog();
    } catch {
      setGiftErr("Network error");
    } finally {
      setGifting(false);
    }
  };

  // ── Categories ─────────────────────────────────────────────────────────────

  const categories = [...new Set(catalogue.map(s => s.category))];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h2 className="text-xl font-black" style={{ color: "#0F172A" }}>Gift Services</h2>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          Grant any subscription or add tokens to a customer account. A confirmation email is sent automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Customer search + form */}
        <div className="space-y-4">

          {/* Step 1 — Find customer */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <p className="text-xs font-black uppercase mb-3" style={{ color: "#94A3B8", letterSpacing: "0.08em" }}>Step 1 — Find Customer</p>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="Search by email or name…"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white", color: "#1A1A1A" }}
              />
              <button
                onClick={search}
                disabled={searching || query.trim().length < 2}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: "#4285C7", minWidth: 80 }}
              >
                {searching ? "…" : "Search"}
              </button>
            </div>

            {searchErr && (
              <p className="text-xs mt-2 font-medium" style={{ color: results !== null && results.length === 0 ? "#64748B" : "#DC2626" }}>
                {searchErr}
              </p>
            )}

            {results && results.length > 0 && (
              <div className="mt-3 space-y-2">
                {results.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setSelected(u); setGiftSuccess(null); setGiftErr(null); }}
                    className="w-full text-left p-3 rounded-xl transition-all hover:opacity-80"
                    style={{
                      background: selected?.id === u.id ? "rgba(66,133,199,0.08)" : "#F8FAFC",
                      border: selected?.id === u.id ? "1.5px solid #4285C7" : "1.5px solid transparent",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#0F172A" }}>{u.name || "—"}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{u.email}</p>
                      </div>
                      <StatusBadge status={u.subscriptionStatus} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px]" style={{ color: "#94A3B8" }}>
                        Plan: <strong>{u.subscriptionPlan ?? "none"}</strong>
                      </span>
                      <span className="text-[11px]" style={{ color: "#94A3B8" }}>
                        Tokens: <strong style={{ color: "#C13A2A" }}>{u.tokenBalance.toLocaleString()}</strong>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Select service */}
          {selected && (
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <p className="text-xs font-black uppercase mb-3" style={{ color: "#94A3B8", letterSpacing: "0.08em" }}>
                Step 2 — Select Service for {selected.name || selected.email}
              </p>

              {categories.map(cat => (
                <div key={cat} className="mb-4">
                  <p className="text-[10px] font-black uppercase mb-2" style={{ color: CAT_COLOR[cat] ?? "#64748B", letterSpacing: "0.1em" }}>{cat}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {catalogue.filter(s => s.category === cat).map(svc => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => setServiceId(svc.id)}
                        className="p-3 rounded-xl text-left transition-all hover:opacity-80"
                        style={{
                          background: serviceId === svc.id ? `rgba(66,133,199,0.1)` : "#F8FAFC",
                          border: serviceId === svc.id ? "1.5px solid #4285C7" : "1.5px solid transparent",
                        }}
                      >
                        <p className="text-xs font-bold" style={{ color: "#0F172A" }}>{svc.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>
                          ${svc.price}/mo · {svc.tokens.toLocaleString()} tokens
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Duration */}
              {serviceId && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-bold" style={{ color: "#374151" }}>
                      <input
                        type="checkbox"
                        checked={permanent}
                        onChange={e => setPermanent(e.target.checked)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: "#4285C7" }}
                      />
                      Permanent (no expiry)
                    </label>
                  </div>

                  {!permanent && (
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Months</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 6, 12].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMonths(m)}
                            className="w-10 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                              background: months === m ? "#4285C7" : "rgba(0,0,0,0.05)",
                              color: months === m ? "white" : "#374151",
                            }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs" style={{ color: "#64748B" }}>
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={e => setNotify(e.target.checked)}
                      className="w-3.5 h-3.5 rounded"
                      style={{ accentColor: "#4285C7" }}
                    />
                    Send confirmation email to customer
                  </label>
                </div>
              )}

              {/* Gift button */}
              <div className="mt-4">
                <button
                  onClick={applyGift}
                  disabled={!serviceId || gifting}
                  className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(to right, #16A34A, #15803D)", boxShadow: "0 4px 14px rgba(22,163,74,0.25)" }}
                >
                  {gifting ? "Gifting…" : `🎁 Gift ${catalogue.find(s => s.id === serviceId)?.name ?? "Service"} to ${selected.name || selected.email}`}
                </button>
                {giftSuccess && (
                  <p className="text-xs mt-2.5 font-bold text-center" style={{ color: "#16A34A" }}>{giftSuccess}</p>
                )}
                {giftErr && (
                  <p className="text-xs mt-2.5 font-medium text-center" style={{ color: "#DC2626" }}>{giftErr}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary card when customer selected */}
        <div className="space-y-4">
          {selected ? (
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-black uppercase mb-4" style={{ color: "#64748B", letterSpacing: "0.08em" }}>Customer Profile</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white" style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}>
                  {(selected.name || selected.email)[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white">{selected.name || "No name"}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{selected.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: "#64748B" }}>Status</p>
                  <p className="text-sm font-black mt-1 text-white">{selected.subscriptionStatus || "none"}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: "#64748B" }}>Token Balance</p>
                  <p className="text-sm font-black mt-1" style={{ color: "#C13A2A" }}>{selected.tokenBalance.toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-3 col-span-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: "#64748B" }}>Current Plan</p>
                  <p className="text-sm font-black mt-1 text-white">{selected.subscriptionPlan ?? "—"}</p>
                </div>
              </div>

              {serviceId && (
                <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: "#16A34A" }}>Gift Preview</p>
                  <p className="text-sm font-bold mt-1 text-white">{catalogue.find(s => s.id === serviceId)?.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#86EFAC" }}>
                    {permanent ? "Permanent" : `${months} month${months !== 1 ? "s" : ""}`}
                    {" · "}
                    {(catalogue.find(s => s.id === serviceId)?.tokens ?? 0).toLocaleString()} tokens
                    {notify ? " · email will be sent" : ""}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center" style={{ background: "white", border: "2px dashed #E2E8F0", minHeight: 200 }}>
              <div className="text-4xl mb-3">🎁</div>
              <p className="text-sm font-bold" style={{ color: "#94A3B8" }}>Search for a customer to get started</p>
              <p className="text-xs mt-1" style={{ color: "#CBD5E1" }}>You can gift any subscription plan or AI tool</p>
            </div>
          )}
        </div>

      </div>

      {/* Gift Log */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black" style={{ color: "#0F172A" }}>Gift Activity Log</h3>
            <button
              onClick={loadLog}
              disabled={logLoading}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}
            >
              {logLoading ? "…" : "Refresh"}
            </button>
          </div>
        </div>

        {log.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
            {logLoading ? "Loading…" : "No gifts recorded yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Customer", "Service", "Duration", "Tokens", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((entry, i) => (
                  <tr key={entry._id} style={{ borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold" style={{ color: "#0F172A" }}>{entry.userName || "—"}</p>
                      <p className="text-[11px]" style={{ color: "#94A3B8" }}>{entry.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold" style={{ color: "#374151" }}>{entry.serviceName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "#64748B" }}>
                        {entry.permanent ? "Permanent" : `${entry.months}mo`}
                        {entry.expiresAt ? ` (exp ${new Date(entry.expiresAt).toLocaleDateString()})` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold" style={{ color: "#C13A2A" }}>+{entry.grantedTokens.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "#94A3B8" }}>
                        {new Date(entry.giftedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
