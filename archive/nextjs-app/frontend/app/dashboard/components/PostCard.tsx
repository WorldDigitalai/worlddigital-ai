"use client";

import { PlatformIcon } from "@/components/PlatformIcon";

export default function PostCard({ post }: { post: any }) {
  const p = post;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="relative aspect-square bg-gray-100">
        {p.thumbnail ? (
          <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F1F5F9,#E2E8F0)" }}>
            <span className="text-3xl">&#127744;</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <PlatformIcon platform={p.platform} size={24} rounded="rounded-lg" />
        </div>
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white border-2 border-white shadow flex items-center justify-center overflow-hidden">
          {p.logo ? <img src={p.logo} alt="" className="w-full h-full object-contain" /> : <span className="text-xs font-black" style={{ color: "#4285C7" }}>{(p.businessName || "W")[0]}</span>}
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-medium line-clamp-2" style={{ color: "#374151" }}>{p.caption || "Branded content posted on your behalf"}</p>
        <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{p.date || "Pending"}</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold" style={{ color: "#6B7280" }}>
          <span>&#10084; {p.likes ?? 0}</span>
          <span>&#128172; {p.comments ?? 0}</span>
          <span>&#128065; {p.views ?? 0}</span>
          <span>&#128279; {p.clicks ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
