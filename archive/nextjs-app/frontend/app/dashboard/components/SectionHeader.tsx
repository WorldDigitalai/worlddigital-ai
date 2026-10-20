"use client";

export default function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{title}</p>
      {action}
    </div>
  );
}
