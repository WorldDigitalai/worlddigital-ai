"use client";

export default function EmptyState({ icon, title, subtitle, action }: {
  icon?: string; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "#F1F5F9" }}>
        {icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        )}
      </div>
      <p className="text-sm font-bold" style={{ color: "#374151" }}>{title}</p>
      {subtitle && <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
