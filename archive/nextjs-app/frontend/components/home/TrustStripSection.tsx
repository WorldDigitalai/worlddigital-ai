import { PlatformIcon } from "@/components/PlatformIcon";

const stats = [
  { value: "5", label: "Ad Variations Generated" },
  { value: "5", label: "Visuals Per Campaign" },
  { value: "24/7", label: "AI Optimization" },
  { value: "3", label: "Platforms Supported" },
];

export function TrustStripSection() {
  return (
    <section className="py-14 px-6" style={{ background: "white", borderBottom: "1px solid #E5EAF2" }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-semibold mb-8" style={{ color: "#9CA3AF" }}>
          Campaigns built for the platforms your customers use every day
        </p>

        {/* Platform icons */}
        <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
          {(["google", "meta", "facebook", "instagram", "snapchat"] as const).map((p) => (
            <div
              key={p}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:shadow-md"
                style={{ background: "#F7FAFC", border: "1.5px solid #E5EAF2" }}
              >
                <PlatformIcon platform={p} size={36} rounded="rounded-xl" />
              </div>
              <span className="text-[11px] font-medium capitalize" style={{ color: "#9CA3AF" }}>
                {p === "meta" ? "Meta" : p === "facebook" ? "Facebook" : p === "instagram" ? "Instagram" : p === "google" ? "Google" : "Snapchat"}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t mb-10" style={{ borderColor: "#E5EAF2" }} />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black mb-1" style={{ color: "#111827" }}>{value}</p>
              <p className="text-sm" style={{ color: "#6B7280" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
