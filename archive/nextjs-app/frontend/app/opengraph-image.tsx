import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0b1929 0%, #112240 35%, #2a0f0a 70%, #C13A2A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow — top left */}
        <div
          style={{
            position: "absolute",
            top: -140,
            left: -100,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(66,133,199,0.2) 0%, transparent 70%)",
          }}
        />
        {/* Radial glow — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -80,
            width: 440,
            height: 440,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(193,58,42,0.25) 0%, transparent 70%)",
          }}
        />

        {/* Logo + brand name */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 36 }}>
          {/* Real company logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://worlddigital.ai/logo-email.png"
            width={80}
            height={80}
            alt="WorldDigital.ai"
            style={{
              borderRadius: 18,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              background: "white",
              objectFit: "contain",
            }}
          />

          {/* Brand wordmark */}
          <span
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "white",
              letterSpacing: -1.5,
              lineHeight: 1,
            }}
          >
            worlddigital.ai
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.18,
            maxWidth: 900,
            marginBottom: 30,
            letterSpacing: -1.2,
          }}
        >
          AI-Powered Digital Marketing for Growing Businesses
        </div>

        {/* Platform list */}
        <div
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 42,
          }}
        >
          Google Ads · Meta Ads · Snapchat · TikTok · LinkedIn · AI Content
        </div>

        {/* CTA pill */}
        <div
          style={{
            background: "#C13A2A",
            color: "white",
            fontSize: 21,
            fontWeight: 800,
            padding: "14px 40px",
            borderRadius: 100,
            letterSpacing: 0.2,
            boxShadow: "0 8px 28px rgba(193,58,42,0.55)",
          }}
        >
          Live in minutes
        </div>
      </div>
    ),
    { ...size }
  );
}
