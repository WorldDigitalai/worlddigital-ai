"use client";

const STATUS_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "rgba(245,158,11,0.12)", color: "#D97706", label: "Pending Setup" },
  live:        { bg: "rgba(22,163,74,0.12)", color: "#16A34A", label: "Live" },
  paused:      { bg: "rgba(107,114,128,0.12)", color: "#6B7280", label: "Paused" },
  attention:   { bg: "rgba(220,38,38,0.12)", color: "#DC2626", label: "Needs Attention" },
};

export default function CampaignTable({ campaigns, emptyText = "No campaigns yet." }: {
  campaigns: Array<{ name: string; platform: string; status: string; budget: number; impressions: number; clicks: number; ctr: string }>;
  emptyText?: string;
}) {
  if (!campaigns.length) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "#F1F5F9" }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
        <p className="text-sm font-bold" style={{ color: "#374151" }}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Campaign", "Platform", "Status", "Budget/Day", "Impressions", "Clicks", "CTR", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider" style={{ color: "#64748B", fontSize: "10px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const s = STATUS_BADGES[c.status] || STATUS_BADGES.pending;
              return (
                <tr key={i} className="border-t transition hover:bg-gray-50" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: "#111827" }}>{c.name}</td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{c.platform}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: s.bg, color: s.color }}>{s.label}</span></td>
                  <td className="px-4 py-3 font-mono" style={{ color: "#374151" }}>${c.budget}</td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{c.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{c.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "#4285C7" }}>{c.ctr}</td>
                  <td className="px-4 py-3"><button className="text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-gray-100 transition" style={{ color: "#4285C7" }}>Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
