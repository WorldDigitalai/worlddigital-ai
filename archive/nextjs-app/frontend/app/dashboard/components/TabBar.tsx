"use client";

export default function TabBar({ tabs, active, onChange }: {
  tabs: string[]; active: string; onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: active === t ? "white" : "transparent",
            color: active === t ? "#111827" : "#6B7280",
            boxShadow: active === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
