"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";

interface Campaign {
  _id: string;
  campaignName: string;
  caption: string;
  imageUrl?: string;
  destinationUrl: string;
  adSettings: {
    platforms: string[];
    budget: number;
    durationDays: number;
    location: string;
  };
  results: Array<{
    platform: string;
    status: string;
    campaignId?: string;
    dryRun?: boolean;
    message?: string;
    error?: string;
  }>;
  summary: { total: number; launched: number; failed: number };
  dryRun: boolean;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [form, setForm] = useState({
    campaignName: "",
    caption: "",
    imageUrl: "",
    destinationUrl: "",
    budget: 10,
    durationDays: 7,
    platforms: ["meta"],
  });

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<{ campaigns: Campaign[] }>("/v1/dashboard/campaigns")
      .then(r => { if (r.ok) setCampaigns(r.data.campaigns || []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaunching(true);
    setLaunchResult(null);
    const res = await apiFetch<{ success: boolean; dry_run: boolean; summary: { total: number; launched: number; failed: number }; results?: Array<{ platform: string; status: string; error?: string }> }>("/ads/launch", {
      method: "POST",
      body: {
        campaignName: form.campaignName || undefined,
        caption: form.caption,
        imageUrl: form.imageUrl || undefined,
        destinationUrl: form.destinationUrl,
        adSettings: {
          budget: form.budget,
          durationDays: form.durationDays,
          platforms: form.platforms,
        },
      },
      timeoutMs: 45_000,
    });
    if (res.ok) {
      const launched = res.data.summary.launched;
      const total = res.data.summary.total;
      const dryRun = res.data.dry_run;
      const failedPlatforms = res.data.results?.filter(r => r.status === "failed").map(r => r.platform) ?? [];
      let msg = `${launched}/${total} campaigns launched${dryRun ? " (dry run mode)" : ""}`;
      if (failedPlatforms.length > 0) msg += ` · Failed: ${failedPlatforms.join(", ")}`;
      setLaunchResult({ success: true, message: msg });
      setForm({ campaignName: "", caption: "", imageUrl: "", destinationUrl: "", budget: 10, durationDays: 7, platforms: ["meta"] });
      load();
    } else {
      const errData = res.data as { error?: string; message?: string } | null;
      const errMsg = errData?.error || errData?.message || res.error || "Failed to launch campaign";
      setLaunchResult({ success: false, message: errMsg });
    }
    setLaunching(false);
  };

  const togglePlatform = (p: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Ad Campaigns</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Launch and track paid ad campaigns across all connected platforms</p>
      </div>

      {/* Launch form */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-sm font-black mb-4" style={{ color: "#111827" }}>Launch New Campaign</p>
        <form onSubmit={handleLaunch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Campaign Name</label>
              <input value={form.campaignName} onChange={e => setForm(p => ({ ...p, campaignName: e.target.value }))} placeholder="Summer Promo 2026" className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Destination URL</label>
              <input value={form.destinationUrl} onChange={e => setForm(p => ({ ...p, destinationUrl: e.target.value }))} placeholder="https://yourbusiness.com" required className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Ad Caption</label>
            <textarea value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} placeholder="Your ad copy..." required rows={3} className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200 resize-none" style={{ borderColor: "#E2E8F0" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Image URL (optional)</label>
            <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Daily Budget ($)</label>
              <input type="number" min={1} value={form.budget} onChange={e => setForm(p => ({ ...p, budget: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Duration (days)</label>
              <input type="number" min={1} max={30} value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={launching || form.platforms.length === 0}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
              >
                {launching ? "Launching..." : "Launch Campaign"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Platforms</label>
            <div className="flex flex-wrap gap-2">
              {["meta", "snapchat", "tiktok", "google", "linkedin", "x"].map(p => (
                <button key={p} type="button" onClick={() => togglePlatform(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all" style={{
                  borderColor: form.platforms.includes(p) ? "transparent" : "#E2E8F0",
                  background: form.platforms.includes(p) ? "rgba(66,133,199,0.1)" : "white",
                  color: form.platforms.includes(p) ? "#4285C7" : "#6B7280",
                }}>
                  <PlatformIcon platform={p} size={14} />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </form>

        {launchResult && (
          <div className={`mt-4 text-xs font-semibold px-3 py-2 rounded-lg ${launchResult.success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            {launchResult.message}
          </div>
        )}
      </div>

      {/* Campaign history */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-sm font-black mb-4" style={{ color: "#111827" }}>Campaign History</p>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "#94A3B8" }}>No campaigns yet</p>
            <p className="text-xs mt-1" style={{ color: "#CBD5E1" }}>Launch your first campaign above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c._id} className="p-4 rounded-xl" style={{ background: "#F9FAFB" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold" style={{ color: "#111827" }}>{c.campaignName || "Untitled Campaign"}</p>
                    <p className="text-[11px] truncate" style={{ color: "#6B7280" }}>{c.destinationUrl}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {c.dryRun && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">DRY RUN</span>}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">{c.summary.launched} launched</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {c.adSettings.platforms.map(p => (
                    <span key={p} className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.04)", color: "#475569" }}>
                      <PlatformIcon platform={p} size={10} />
                      {p}
                    </span>
                  ))}
                  <span className="text-[10px]" style={{ color: "#94A3B8" }}>· ${c.adSettings.budget}/day · {c.adSettings.durationDays} days</span>
                </div>
                <p className="text-[11px] mt-2" style={{ color: "#94A3B8" }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
