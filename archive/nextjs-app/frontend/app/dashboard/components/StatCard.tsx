"use client";

export default function StatCard({ label, value, color = "#4285C7", icon, subtext }: {
  label: string; value: string | number; color?: string; icon?: string; subtext?: string;
}) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      {icon && (
        <svg className="absolute top-3 right-3 w-10 h-10 opacity-10" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      )}
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold mt-1" style={{ color: "#6B7280" }}>{label}</p>
      {subtext && <p className="text-[10px] mt-1.5" style={{ color: "#9CA3AF" }}>{subtext}</p>}
    </div>
  );
}
