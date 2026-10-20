"use client";

import Link from "next/link";
import Image from "next/image";
import { SmartCtaLink } from "@/components/home/SmartCtaLink";
import { CSSProperties } from "react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { DashboardShowcase } from "@/components/home/DashboardShowcase";

type Platform =
  | "snapchat" | "meta" | "instagram" | "facebook"
  | "google" | "tiktok" | "x" | "linkedin" | "youtube" | "youtube_shorts";

type FIcon = {
  src: string;
  size: number;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  opacity: number;
  blur: number;
  animClass: string;
  hide?: "md" | "lg";
  contain?: boolean;
  bg?: string;
  imgScale?: number;
};

// ── 8 floating platform icons — layered depth with no blur ────────────────────
const ICONS: FIcon[] = [

  // ── FOREGROUND — sharp, always visible ───────────────────────────────────
  {
    src: "/icons/snapchat.png", size: 60,
    top: "7%",  left: "3%",
    rotate: -10, opacity: 0.92, blur: 0, animClass: "float-1",
  },
  {
    src: "/icons/google.webp", size: 58,
    top: "9%",  right: "4%",
    rotate: 8,  opacity: 0.90, blur: 0, animClass: "float-2",
    contain: true,
  },
  {
    src: "/icons/tiktok.jpeg", size: 54,
    top: "70%", left: "3%",
    rotate: 7,  opacity: 0.88, blur: 0, animClass: "float-3",
    imgScale: 1.15,
  },
  {
    src: "/icons/x.png", size: 52,
    top: "68%", right: "4%",
    rotate: -6, opacity: 0.85, blur: 0, animClass: "float-4",
  },

  // ── MID-DEPTH — reduced opacity for depth, no blur ────────────────────────
  {
    src: "/icons/linkedin.png", size: 50,
    top: "42%", right: "3%",
    rotate: 9,  opacity: 0.60, blur: 0, animClass: "float-5",
  },
  {
    src: "/icons/instagram.jpeg", size: 50,
    top: "40%", left: "3%",
    rotate: -12, opacity: 0.58, blur: 0, animClass: "float-6",
    imgScale: 1.1,
  },
  {
    src: "/icons/facebook.jpeg", size: 46,
    top: "24%", left: "4%",
    rotate: 6,  opacity: 0.55, blur: 0, animClass: "float-2",
    imgScale: 1.1,
  },
  {
    src: "/icons/youtube.png", size: 50,
    top: "58%", right: "3%",
    rotate: 5,  opacity: 0.58, blur: 0, animClass: "float-1",
  },
];

const hideClass = (h?: "md" | "lg") => {
  if (!h) return "";
  if (h === "md") return "hidden md:block";
  return "hidden lg:block";
};

// ── All 10 platforms — scrolled as a continuous marquee ───────────────────────
const PLATFORM_CHIPS: Array<{ platform: Platform; label: string }> = [
  { platform: "snapchat",       label: "Snapchat" },
  { platform: "meta",           label: "Meta" },
  { platform: "google",         label: "Google" },
  { platform: "tiktok",         label: "TikTok" },
  { platform: "instagram",      label: "Instagram" },
  { platform: "facebook",       label: "Facebook" },
  { platform: "youtube",        label: "YouTube" },
  { platform: "linkedin",       label: "LinkedIn" },
  { platform: "x",              label: "X" },
  { platform: "youtube_shorts", label: "YT Shorts" },
];

const chipStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.07)",
  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
};

function PlatformChip({ platform, label }: { platform: Platform; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full shrink-0"
      style={chipStyle}
    >
      <PlatformIcon platform={platform} size={22} rounded="rounded-full" />
      <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: "#374151" }}>
        {label}
      </span>
    </div>
  );
}

export function PremiumHeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #A8DAFF 0%, #C8EEFF 20%, #EEF9FF 45%, #FFF0EA 75%, #FFD9CC 100%)",
        minHeight: "100svh",
        paddingTop: 80,
      }}
    >
      {/* ── Decorative blur blobs ────────────────────────────────────────── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%", right: "-10%", width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(193,58,42,0.12) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-15%", left: "-10%", width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(66,133,199,0.13) 0%, transparent 60%)",
        }}
      />

      {/* ── Floating platform icons ─────────────────────────────────────── */}
      {ICONS.map((icon, i) => {
        const outerStyle: CSSProperties = {
          position: "absolute",
          top: icon.top,
          left: icon.left,
          right: icon.right,
          opacity: icon.opacity,
          pointerEvents: "none",
          zIndex: 1,
        };

        const bgColor = icon.bg ?? (icon.contain ? "#ffffff" : "transparent");

        const innerStyle: CSSProperties = {
          width: icon.size,
          height: icon.size,
          borderRadius: 18,
          overflow: "hidden",
          transform: `rotate(${icon.rotate}deg)`,
          boxShadow: "0 10px 30px rgba(15,23,42,0.20), 0 0 0 1px rgba(255,255,255,0.25)",
          background: bgColor !== "transparent" ? bgColor : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        };

        return (
          <div
            key={`fi-${i}`}
            className={`float-icon ${icon.animClass} ${hideClass(icon.hide)}`}
            style={outerStyle}
            aria-hidden="true"
          >
            <div style={innerStyle}>
              <Image
                src={icon.src}
                alt=""
                width={icon.size}
                height={icon.size}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: icon.contain ? "contain" : "cover",
                  transform: icon.imgScale ? `scale(${icon.imgScale})` : undefined,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* ── Hero text ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <p
          className="text-sm font-semibold mb-5 tracking-widest uppercase"
          style={{ color: "#C13A2A" }}
        >
          AI-Powered Marketing
        </p>

        <h1
          className="font-black leading-[1.05] mb-6"
          style={{
            fontSize: "clamp(2.8rem, 6.5vw, 4.5rem)",
            color: "#111827",
            letterSpacing: "-0.03em",
          }}
        >
          Your Business,<br />On Autopilot.
        </h1>

        <p
          className="text-lg leading-relaxed mb-10 mx-auto"
          style={{ color: "#4B5563", maxWidth: 520 }}
        >
          AI that writes your ads, creates your content, and publishes to every platform — automatically.
        </p>

        {/* ── Platform chip marquee ──────────────────────────────────────── */}
        <div
          className="relative mb-10 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          }}
        >
          {/* Duplicate chips for seamless infinite loop */}
          <div
            className="chip-marquee"
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: "0.625rem",
              width: "max-content",
            }}
          >
            {[...PLATFORM_CHIPS, ...PLATFORM_CHIPS].map(({ platform, label }, i) => (
              <PlatformChip key={`chip-${i}`} platform={platform} label={label} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <SmartCtaLink
          guestHref="/subscribe"
          authedHref="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full text-base font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            background: "#C13A2A",
            boxShadow: "0 8px 28px rgba(193,58,42,0.35)",
          }}
        >
          Get Started
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </SmartCtaLink>
      </div>

      {/* ── Dashboard carousel ─────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pb-16">
        <DashboardShowcase />
      </div>
    </section>
  );
}
