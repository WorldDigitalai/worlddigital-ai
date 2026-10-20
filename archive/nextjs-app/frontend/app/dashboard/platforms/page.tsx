"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";

interface Platform {
  id: string;
  name: string;
  connected: boolean;
  accountName?: string;
  connectedAt?: string;
}

interface PlatformsData {
  platforms: Platform[];
}

const PLATFORM_CONNECT_INFO: Record<string, { desc: string; cta: string }> = {
  meta: { desc: "Connect your Facebook & Instagram accounts to publish content directly.", cta: "Connect Meta" },
  google: { desc: "Link your Google Ads account to manage ad campaigns.", cta: "Connect Google Ads" },
  tiktok: { desc: "Connect TikTok to publish videos and run ad campaigns.", cta: "Connect TikTok" },
  snapchat: { desc: "Link your Snapchat Business account for ads and publishing.", cta: "Connect Snapchat" },
  linkedin: { desc: "Connect LinkedIn to publish posts and run sponsored content.", cta: "Connect LinkedIn" },
  x: { desc: "Connect your X (Twitter) account to post and manage ads.", cta: "Connect X" },
  youtube: { desc: "Connect YouTube to manage shorts and video publishing.", cta: "Connect YouTube" },
};

export default function PlatformsPage() {
  const [data, setData] = useState<PlatformsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setLoading(true);
    apiFetch<PlatformsData>("/v1/dashboard/platforms")
      .then(r => { if (r.ok) setData(r.data); })
      .finally(() => setLoading(false));
  };

  const toggleConnect = async (platform: Platform) => {
    if (platform.connected) {
      if (!confirm(`Disconnect ${platform.name}? Content will no longer be published to this platform.`)) return;
      setConnecting(platform.id);
      const res = await apiFetch<{ success: boolean }>(`/v1/dashboard/platforms/${platform.id}/disconnect`, { method: "POST" });
      if (res.ok) load();
      setConnecting(null);
    } else {
      // Check if OAuth is configured, otherwise show manual token dialog
      setConnecting(platform.id);
      const statusRes = await apiFetch<{ platforms: Array<{ platform: string; configured: boolean }> }>("/v1/oauth/status");
      const platformStatus = statusRes.ok ? statusRes.data.platforms.find(p => p.platform === platform.id) : null;
      setConnecting(null);

      if (platformStatus?.configured) {
        // OAuth configured — redirect to platform OAuth
        window.location.href = `/api/v1/oauth/${platform.id}/connect`;
      } else {
        // OAuth not configured — show manual token input
        const token = prompt(`Enter your ${platform.name} access token:\n\n${PLATFORM_CONNECT_INFO[platform.id]?.desc || ""}\n\nYou can also provide this in environment variables (${platform.id.toUpperCase()}_ACCESS_TOKEN) for admin setup.`);
        if (token?.trim()) {
          setConnecting(platform.id);
          const res = await apiFetch<{ success: boolean }>(`/v1/oauth/${platform.id}/manual`, {
            method: "POST",
            body: JSON.stringify({ accessToken: token.trim() }),
          });
          if (res.ok) {
            load();
          } else {
            alert(res.error || "Failed to save token");
          }
          setConnecting(null);
        }
      }
    }
  };

  const connectedCount = data?.platforms.filter(p => p.connected).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#111827" }}>My Platforms</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          {connectedCount > 0
            ? `${connectedCount} platform${connectedCount !== 1 ? "s" : ""} connected. Content will be published to your connected accounts.`
            : "Connect your social media and ad platform accounts to start publishing."}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {data?.platforms.map(p => {
            const info = PLATFORM_CONNECT_INFO[p.id];
            return (
              <div key={p.id} className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: p.connected ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.04)" }}>
                    <PlatformIcon platform={p.id} size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: "#111827" }}>{p.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.connected ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.connected ? "Connected" : "Not Connected"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                      {p.connected && p.accountName
                        ? `Account: ${p.accountName}`
                        : (info?.desc || `Connect ${p.name} to publish content.`)
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleConnect(p)}
                  disabled={connecting === p.id}
                  className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: p.connected ? "rgba(0,0,0,0.04)" : "linear-gradient(to right,#4285C7,#C13A2A)",
                    color: p.connected ? "#374151" : "white",
                    border: p.connected ? "1px solid rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {connecting === p.id ? "Working..." : p.connected ? "Disconnect" : (info?.cta || "Connect")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ background: "rgba(66,133,199,0.04)", border: "1px solid rgba(66,133,199,0.15)" }}>
        <p className="text-sm font-bold mb-1" style={{ color: "#4285C7" }}>Why connect your accounts?</p>
        <p className="text-xs" style={{ color: "#475569" }}>
          When you connect your platforms, WorldDigital.ai can publish content directly to your accounts,
          run ad campaigns under your business profiles, and track analytics from your actual channels.
          We never post without your approval.
        </p>
      </div>
    </div>
  );
}
