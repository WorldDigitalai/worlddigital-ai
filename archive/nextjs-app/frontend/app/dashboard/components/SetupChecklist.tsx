"use client";

export default function SetupChecklist({ items, title = "Get Your Campaign Live" }: {
  items: Array<{ label: string; done: boolean; note?: string }>;
  title?: string;
}) {
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-black" style={{ color: "#111827" }}>{title} <span style={{ color: "#16A34A" }}>&#10003;</span></p>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>{done}/{items.length}</span>
      </div>
      <div className="h-1.5 rounded-full mb-4" style={{ background: "#F1F5F9" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: pct + "%", background: "linear-gradient(to right,#4285C7,#16A34A)" }} />
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.label} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: i.done ? "rgba(22,163,74,0.15)" : "#F1F5F9" }}>
              {i.done ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <div className="w-2 h-2 rounded-full" style={{ background: "#CBD5E1" }} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: i.done ? "#16A34A" : "#374151", textDecoration: i.done ? "line-through" : "none" }}>{i.label}</p>
              {i.note && <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{i.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
