import React, { useEffect, useState } from "react";

const API = "/api";

interface PlatformStatus {
  meta: {
    configured: boolean;
    tokenValid: boolean;
    tokenMasked: string | null;
    pagesFound: boolean;
    pageName: string | null;
    instagramBusinessFound: boolean;
    canPostFacebook: boolean;
    canPostInstagram: boolean;
    issues: string[];
  };
  tiktok: {
    siteVerificationConfigured: boolean;
    verificationCode: string | null;
    verificationMetaTag: boolean;
    verificationRouteLive: boolean;
    postingReady: boolean;
    issues: string[];
  };
  youtube: {
    apiKeyConfigured: boolean;
    apiKeyValid: boolean;
    apiKeyMasked: string | null;
    oauthConfigured: boolean;
    uploadReady: boolean;
    issues: string[];
  };
  linkedin: {
    clientConfigured: boolean;
    accessTokenConfigured: boolean;
    accessTokenMasked: string | null;
    organizationConfigured: boolean;
    postingReady: boolean;
    issues: string[];
  };
  x: {
    configured: boolean;
    credentialsValid: boolean;
    userHandle: string | null;
    readWriteAccess: boolean;
    postingReady: boolean;
    issues: string[];
  };
  snapchat: {
    clientConfigured: boolean;
    accessTokenConfigured: boolean;
    accessTokenMasked: string | null;
    marketingApiReady: boolean;
    issues: string[];
  };
  summary: {
    readyToPost: string[];
    needsOAuth: string[];
    needsAppApproval: string[];
    notConfigured: string[];
  };
  dry_run_mode: boolean;
  checked_at: string;
}

type StatusLevel = "ready" | "needsOAuth" | "needsApproval" | "partial" | "missing";

function getStatusBadge(level: StatusLevel) {
  const map: Record<StatusLevel, { label: string; color: string }> = {
    ready: { label: "Ready to publish", color: "#16a34a" },
    needsOAuth: { label: "Needs OAuth", color: "#d97706" },
    needsApproval: { label: "Needs app approval", color: "#7c3aed" },
    partial: { label: "Partially configured", color: "#2563eb" },
    missing: { label: "Not configured", color: "#6b7280" },
  };
  const s = map[level];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: s.color + "18",
        color: s.color,
        border: `1px solid ${s.color}40`,
      }}
    >
      {s.label}
    </span>
  );
}

interface PlatformCardProps {
  name: string;
  icon: string;
  level: StatusLevel;
  details: Record<string, React.ReactNode>;
  issues: string[];
}

function PlatformCard({ name, icon, level, details, issues }: PlatformCardProps) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{name}</span>
        <div style={{ marginLeft: "auto" }}>{getStatusBadge(level)}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 13, color: "#374151", marginBottom: 10 }}>
        {Object.entries(details).map(([k, v]) => (
          <React.Fragment key={k}>
            <span style={{ color: "#6b7280" }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </React.Fragment>
        ))}
      </div>

      {issues.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {issues.map((issue, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                color: "#92400e",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: 6,
                padding: "4px 10px",
                marginTop: 4,
              }}
            >
              ⚠ {issue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function bool(v: boolean) {
  return v ? <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ Yes</span> : <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ No</span>;
}

export default function AdminIntegrationsPage() {
  const [data, setData] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API}/social/debug`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = (await resp.json()) as PlatformStatus;
      setData(json);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#111827", color: "#fff", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Admin</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Social Integrations</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastChecked && <span style={{ fontSize: 12, color: "#9ca3af" }}>Last checked: {lastChecked}</span>}
          <button
            onClick={runCheck}
            disabled={loading}
            style={{
              background: "#C13A2A",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Checking..." : "Re-run Tests"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#dc2626", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {loading && !data && (
          <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>Running integration checks...</div>
        )}

        {data && (
          <>
            {/* Summary row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 28,
              }}
            >
              {[
                { label: "Ready to post", items: data.summary.readyToPost, color: "#16a34a" },
                { label: "Needs OAuth", items: data.summary.needsOAuth, color: "#d97706" },
                { label: "Needs app approval", items: data.summary.needsAppApproval, color: "#7c3aed" },
                { label: "Not configured", items: data.summary.notConfigured, color: "#6b7280" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}
                >
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>{s.items.length}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {s.items.length > 0 ? s.items.join(", ") : "—"}
                  </div>
                </div>
              ))}
            </div>

            {data.dry_run_mode && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 16px", color: "#1d4ed8", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                🧪 DRY RUN MODE is active — posts will be simulated, not published publicly.
              </div>
            )}

            {/* Platform cards */}
            <PlatformCard
              name="Meta — Facebook & Instagram"
              icon="📘"
              level={
                data.meta.canPostFacebook && data.meta.canPostInstagram
                  ? "ready"
                  : data.meta.tokenValid && (data.meta.canPostFacebook || data.meta.canPostInstagram)
                  ? "partial"
                  : data.meta.configured
                  ? "needsOAuth"
                  : "missing"
              }
              details={{
                "Access token": data.meta.tokenMasked ?? "Not set",
                "Token valid": bool(data.meta.tokenValid),
                "Facebook page found": bool(data.meta.pagesFound),
                "Page name": data.meta.pageName ?? "—",
                "Instagram business account": bool(data.meta.instagramBusinessFound),
                "Can post Facebook": bool(data.meta.canPostFacebook),
                "Can post Instagram": bool(data.meta.canPostInstagram),
              }}
              issues={data.meta.issues}
            />

            <PlatformCard
              name="TikTok"
              icon="🎵"
              level={data.tiktok.postingReady ? "ready" : data.tiktok.siteVerificationConfigured ? "needsApproval" : "missing"}
              details={{
                "Site verification set": bool(data.tiktok.siteVerificationConfigured),
                "Meta tag in HTML": bool(data.tiktok.verificationMetaTag),
                "Verification route live": bool(data.tiktok.verificationRouteLive),
                "Verification code": data.tiktok.verificationCode ?? "Not set",
                "Posting ready": bool(data.tiktok.postingReady),
              }}
              issues={data.tiktok.issues}
            />

            <PlatformCard
              name="YouTube"
              icon="▶️"
              level={data.youtube.uploadReady ? "ready" : data.youtube.apiKeyValid ? "needsOAuth" : data.youtube.apiKeyConfigured ? "partial" : "missing"}
              details={{
                "API key": data.youtube.apiKeyMasked ?? "Not set",
                "API key valid": bool(data.youtube.apiKeyValid),
                "OAuth configured": bool(data.youtube.oauthConfigured),
                "Upload ready": bool(data.youtube.uploadReady),
              }}
              issues={data.youtube.issues}
            />

            <PlatformCard
              name="LinkedIn"
              icon="💼"
              level={
                data.linkedin.postingReady
                  ? "ready"
                  : data.linkedin.clientConfigured
                  ? "needsOAuth"
                  : "missing"
              }
              details={{
                "App credentials": bool(data.linkedin.clientConfigured),
                "Access token": data.linkedin.accessTokenMasked ?? "Not set",
                "Organization ID set": bool(data.linkedin.organizationConfigured),
                "Posting ready": bool(data.linkedin.postingReady),
              }}
              issues={data.linkedin.issues}
            />

            <PlatformCard
              name="X (Twitter)"
              icon="𝕏"
              level={
                data.x.postingReady
                  ? "ready"
                  : data.x.configured
                  ? "partial"
                  : "missing"
              }
              details={{
                "All 4 credentials set": bool(data.x.configured),
                "Credentials valid": bool(data.x.credentialsValid),
                "Account handle": data.x.userHandle ?? "—",
                "Read + Write access": bool(data.x.readWriteAccess),
                "Posting ready": bool(data.x.postingReady),
              }}
              issues={data.x.issues}
            />

            <PlatformCard
              name="Snapchat"
              icon="👻"
              level={
                data.snapchat.marketingApiReady
                  ? "ready"
                  : data.snapchat.clientConfigured
                  ? "needsOAuth"
                  : "missing"
              }
              details={{
                "Client configured": bool(data.snapchat.clientConfigured),
                "Access token": data.snapchat.accessTokenMasked ?? "Not set",
                "Marketing API ready": bool(data.snapchat.marketingApiReady),
              }}
              issues={data.snapchat.issues}
            />

            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 16 }}>
              Checked at {new Date(data.checked_at).toLocaleString()} · No secret values are exposed in this report
            </div>
          </>
        )}
      </div>
    </div>
  );
}
