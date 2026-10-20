"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

// ── Shared colors ──────────────────────────────────────────────────

const C = {
  bg:         "#E8F4FD",
  bgLight:    "#FFFFFF",
  bgCard:     "#FFFFFF",
  accent:     "#C13A2A",
  blue:       "#4285C7",
  text:       "#1A1A1A",
  textMuted:  "#6B7280",
  textLight:  "#6B7280",
  border:     "rgba(0,0,0,0.08)",
  borderLight:"rgba(0,0,0,0.05)",
  red:        "#C13A2A",
  green:      "#15803D",
};

// ── Reusable hooks ──────────────────────────────────────────────────

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(target: number, duration = 1800, trigger = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) { setVal(0); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, trigger]);
  return val;
}

// ── Platform icons ──────────────────────────────────────────────────

function PIcon({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  return (
    <div className="rounded-xl overflow-hidden flex items-center justify-center bg-white shrink-0" style={{ width: size, height: size, border: "1px solid rgba(0,0,0,0.08)" }}>
      <Image src={src} alt={alt} width={size} height={size} className="w-[80%] h-[80%] object-contain" />
    </div>
  );
}

const PARTNER_LOGOS = [
  { src: "/icons/google.webp",      alt: "Google" },
  { src: "/icons/meta.png",         alt: "Meta" },
  { src: "/icons/facebook.png",     alt: "Facebook" },
  { src: "/icons/instagram.jpeg",   alt: "Instagram" },
  { src: "/icons/tiktok.jpeg",      alt: "TikTok" },
  { src: "/icons/snapchat.png",    alt: "Snapchat" },
  { src: "/icons/linkedin.png",     alt: "LinkedIn" },
  { src: "/icons/x.png",            alt: "X" },
  { src: "/icons/youtube.png",      alt: "YouTube" },
  { src: "/icons/youtube-shorts.png", alt: "YouTube Shorts" },
];

// ── Section 1: Hero Ticker ────────────────────────────────────────────────

const TICKER_ITEMS = [
  "Campaign launched for a fitness studio in Austin",
  "4.2x ROAS achieved for an e-commerce brand",
  "TikTok campaign live in 4 minutes for a restaurant chain",
  "200+ creatives generated this morning",
  "SEO ranking jumped 12 positions for a SaaS startup",
  "Google Ads CTR improved 3.1x in 2 weeks",
];

function HeroSection({ onOpenQuote }: { onOpenQuote: () => void }) {
  return (
    <section className="relative overflow-hidden" style={{ background: C.bg, minHeight: "100svh", display: "flex", flexDirection: "column" }}>
      {/* Particle background */}
      <div className="hero-particles absolute inset-0 opacity-40" />

      <div className="relative z-10 flex-1 flex flex-col justify-center" style={{ padding: "clamp(72px,18vw,120px) 20px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          {/* Eyebrow */}
          <div className="reveal visible">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6" style={{ background: C.borderLight, color: C.textMuted, border: `1px solid ${C.border}` }}>
              <span style={{ color: C.blue, fontSize: "10px" }}>●</span>
              Enterprise AI Marketing Platform
            </div>
          </div>

          {/* Headline */}
          <h1 className="reveal visible font-black leading-tight tracking-tight mb-5"
              style={{ fontSize: "clamp(26px, 7vw, 72px)", background: `linear-gradient(90deg,${C.accent},${C.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Your Competitors Are Already Running AI Campaigns.
            <br />
            <span style={{ WebkitTextFillColor: C.text }}>Are You?</span>
          </h1>

          {/* Subheadline */}
          <p className="reveal visible text-lg leading-relaxed mb-8" style={{ color: C.textMuted, maxWidth: 640 }}>
            WorldDigital.ai automates your entire marketing stack across 9 platforms — while you sleep, close deals, and scale.
          </p>

          {/* CTAs */}
          <div className="reveal visible flex flex-col sm:flex-row gap-4 mb-10">
            <button onClick={onOpenQuote} className="pulse-glow inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]" style={{ background: C.accent }}>
              See Your Business Live in 15 Minutes
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
            <Link href="/dashboard/platforms" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold transition-all hover:bg-white/10 active:scale-[0.97]" style={{ color: C.text, border: `1px solid ${C.border}` }}>
              Explore the Platform
            </Link>
          </div>

          {/* Trust strip */}
          <div className="reveal visible mb-10">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {PARTNER_LOGOS.map((p) => (
                <PIcon key={p.alt} src={p.src} alt={p.alt} size={26} />
              ))}
            </div>
            <p className="text-xs font-semibold" style={{ color: C.textLight }}>Certified Partner Across All Major Ad Platforms</p>
          </div>

          {/* Stats row */}
          <div className="reveal visible grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0">
            {[
              { num: "9+",  label: "Platforms" },
              { num: "200+", label: "Monthly Creatives" },
              { num: "4.2x", label: "Avg ROAS" },
              { num: "4 min", label: "Campaign Launch" },
            ].map((s, i) => (
              <div key={s.label} className="text-center sm:border-l first:sm:border-l-0" style={{ borderColor: C.borderLight }}>
                <p className="text-2xl sm:text-3xl font-black" style={{ color: C.blue }}>{s.num}</p>
                <p className="text-xs font-medium mt-1" style={{ color: C.textLight }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticker bar */}
      <div className="relative z-10" style={{ background: "rgba(17,24,39,0.8)", borderTop: `1px solid ${C.borderLight}`, padding: "12px 0", overflow: "hidden" }}>
        <div className="hero-ticker">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-6 text-xs font-semibold shrink-0" style={{ color: C.textMuted }}>
              <span style={{ color: C.blue }}>{i % 2 === 0 ? "\uD83D\uDE80" : "\u26A1"}</span> {t}
              <span style={{ color: C.border }}>|</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 2: ROI Calculator ────────────────────────────────────────────────

function RoiCalculator({ onOpenQuote }: { onOpenQuote: () => void }) {
  const { ref, visible } = useReveal();
  const [spend, setSpend] = useState(5000);
  const [platforms, setPlatforms] = useState(2);
  const [agencyCost, setAgencyCost] = useState(2500);

  // Enterprise logic: AI management fee scales with ad spend (not flat $1,500)
  const aiFeeMonthly = Math.max(1500, Math.round(spend * 0.12));
  const savings = Math.max(0, agencyCost * 12 - aiFeeMonthly * 12);
  const roasUplift = Math.round(spend * 0.42);
  const creatives = Math.round(platforms * spend * 0.04);
  const hoursSaved = platforms * 40;

  return (
    <section ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ background: C.bg, padding: "80px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="text-center mb-12">
          <h2 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: C.text }}>What AI Could Save You This Year</h2>
          <p className="text-sm" style={{ color: C.textMuted, maxWidth: 520, margin: "0 auto" }}>Adjust your current spend to see projected savings, ROAS improvement, and time recovered.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { label: "Current Monthly Ad Spend",  val: spend,   min: 500,  max: 100000, step: 500,  unit: "$", setter: setSpend },
              { label: "Current Agency / Tool Cost", val: agencyCost, min: 0, max: 20000, step: 250, unit: "$", setter: setAgencyCost },
            ].map((f) => (
              <div key={f.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px 20px" }}>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold" style={{ color: C.textMuted }}>{f.label}</label>
                  <span className="text-sm font-black" style={{ color: C.blue }}>{f.unit}{f.val.toLocaleString()}</span>
                </div>
                <input type="range" aria-label={f.label} min={f.min} max={f.max} step={f.step} value={f.val}
                  onChange={(e) => f.setter(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                  style={{ accentColor: C.blue, height: "6px" }}
                />
              </div>
            ))}
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px 20px" }}>
              <label className="text-xs font-bold block mb-2" style={{ color: C.textMuted }}>Platforms Currently Running</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => setPlatforms(n)} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: platforms === n ? C.accent : C.borderLight, color: platforms === n ? "#fff" : C.textMuted, border: `1px solid ${platforms === n ? C.accent : C.border}` }}>
                    {n === 4 ? "4+" : n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Outputs */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Annual Savings vs Agency",   value: savings > 0 ? `$${savings.toLocaleString()}` : "Break-even",   color: savings > 0 ? C.green : C.blue,  sub: savings > 0 ? `vs $${agencyCost.toLocaleString()}/mo agency cost` : "Raise your agency cost above $" + aiFeeMonthly.toLocaleString() + "/mo to see savings" },
              { label: "Extra Revenue from ROAS Lift", value: `+$${roasUplift.toLocaleString()}`, color: C.blue,   sub: `42% AI-driven ROAS uplift on $${spend.toLocaleString()}/mo spend` },
              { label: "AI Creatives / Year",        value: creatives.toLocaleString(),         color: C.accent, sub: `${platforms} platform${platforms > 1 ? "s" : ""} × $${spend.toLocaleString()}/mo spend` },
              { label: "Hours Saved / Month",          value: `${hoursSaved}h`,                    color: "#FBBF24", sub: `${platforms} platform${platforms > 1 ? "s" : ""} × 40h manual work eliminated` },
            ].map((card) => (
              <div key={card.label} className="glass-card rounded-2xl p-6 text-center" style={{ border: `1px solid ${C.border}` }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.textLight }}>{card.label}</p>
                <p className="text-3xl sm:text-4xl font-black mb-2" style={{ color: card.color }}>{card.value}</p>
                <p className="text-xs" style={{ color: C.textLight }}>{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <button onClick={onOpenQuote} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]" style={{ background: `linear-gradient(135deg,${C.accent},${C.blue})` }}>
            Lock In These Numbers — Get a Custom Quote
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Section 3: Pain ──────────────────────────────────────────────────────

const PAINS = [
  {
    icon: "\u23F1",
    title: "You're Spending 40+ Hours/Month on Tasks AI Does in Minutes",
    body: "Brief writing, creative revisions, campaign setup, reporting. Every hour costs you revenue in opportunity. WorldDigital.ai automates all of it.",
    accent: "#F97316",
  },
  {
    icon: "\uD83D\uDCB8",
    title: "Your Agency Is Taking 40–60% of Your Budget as Overhead",
    body: "The average SMB pays $4,000–$15,000/month to agencies who outsource the same AI tools you could own directly for a fraction of the cost.",
    accent: "#C13A2A",
  },
  {
    icon: "\uD83D\uDCC9",
    title: "Single-Platform Focus Means You're Invisible on 8 Other Channels",
    body: "Your customers are on TikTok, Snapchat, LinkedIn, and YouTube. Your ads are on one. You're leaving revenue on the table every single day.",
    accent: "#DC2626",
  },
];

function PainSection() {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ background: `linear-gradient(180deg,${C.bg} 0%,#070B16 100%)`, padding: "80px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="text-center mb-12">
          <h2 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: C.text }}>
            Every Day Without AI Marketing Is Money Left Behind
          </h2>
          <p className="text-sm" style={{ color: C.textMuted }}>Here's what your current setup is actually costing you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PAINS.map((p) => (
            <div key={p.title} className="glass-card rounded-2xl p-6 relative overflow-hidden" style={{ borderLeft: `4px solid ${p.accent}` }}>
              <p className="text-2xl mb-3">{p.icon}</p>
              <h3 className="text-sm font-black mb-2 leading-snug" style={{ color: C.text }}>{p.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 4: Comparison Table ────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { task: "Campaign launch time",          without: "3–5 days of briefs & revisions", with: "4 minutes, fully automated" },
  { task: "Monthly creative output",       without: "10–15 assets",                    with: "200+ AI-generated assets" },
  { task: "Platforms managed",             without: "1–2 (manually)",                  with: "9 (all automated)" },
  { task: "SEO + Ads + Content",           without: "3 separate tools/agencies",       with: "1 unified AI system" },
  { task: "Monthly cost",                  without: "$5,000–$15,000 agency fees",      with: "A fraction of agency fees" },
  { task: "Reporting",                     without: "Manual pull from each platform", with: "Unified real-time dashboard" },
  { task: "Optimization",                  without: "Weekly manual review",            with: "24/7 AI auto-optimization" },
  { task: "Expertise required",            without: "Senior marketing team",           with: "None — AI handles it" },
];

function ComparisonSection() {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ background: C.bg, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="text-center mb-10">
          <h2 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: C.text }}>What You're Leaving on the Table</h2>
          <p className="text-sm" style={{ color: C.textMuted }}>The gap between doing it manually and doing it with AI.</p>
        </div>
        <div className="scroll-x-dark overflow-x-auto rounded-2xl" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th className="sticky-col text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ background: C.bgLight, color: C.textLight, borderBottom: `1px solid ${C.border}` }}>Task</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(239,68,68,0.08)", color: "#FCA5A5", borderBottom: `1px solid ${C.border}` }}>⚠️ Without WorldDigital.ai</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(16,185,129,0.08)", color: "#6EE7B7", borderBottom: `1px solid ${C.border}` }}>✅ With WorldDigital.ai</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((r, i) => (
                <tr key={r.task} style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)" }}>
                  <td className="sticky-col px-5 py-3.5 text-xs font-bold" style={{ color: C.text, background: i % 2 === 0 ? C.bg : "rgba(0,0,0,0.02)" }}>{r.task}</td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: C.textMuted }}>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      {r.without}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: C.textMuted }}>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {r.with}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Section 5: Day in the Life Timeline ─────────────────────────────────────────

const TIMELINE = [
  { time: "6:00 AM", action: "AI analyzes last week's performance across all 9 platforms", done: true },
  { time: "6:01 AM", action: "12 new ad creatives generated based on top performers", done: true },
  { time: "6:03 AM", action: "Google Search campaign refreshed with updated keywords", done: true },
  { time: "6:04 AM", action: "TikTok campaign launched for this week's promotion", done: true },
  { time: "6:05 AM", action: "Instagram Reels posted across 3 client accounts", done: true },
  { time: "6:06 AM", action: "Snapchat Story Ad live for weekend event", done: true },
  { time: "6:07 AM", action: "SEO blog post published and indexed", done: true },
  { time: "6:08 AM", action: "Weekly performance report emailed to client", done: true },
];

function DayInLifeSection({ onOpenQuote }: { onOpenQuote: () => void }) {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ background: `linear-gradient(180deg,#070B16 0%,${C.bg} 100%)`, padding: "80px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div className="text-center mb-12">
          <h2 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: C.text }}>
            Monday Morning. 6 Campaigns Launched. 47 Posts Scheduled.
          </h2>
          <p className="text-sm" style={{ color: C.textMuted }}>You haven't opened your laptop yet.</p>
        </div>

        <div className="relative" style={{ paddingLeft: 32 }}>
          {/* Timeline line */}
          <div className="absolute left-[11px] top-0 bottom-0" style={{ width: "2px", background: `linear-gradient(180deg,${C.blue},${C.accent})` }} />

          <div className="space-y-3">
            {TIMELINE.map((step, i) => (
              <div key={step.time} className="flex items-center gap-4 relative">
                <div className="absolute left-[-32px] w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: C.bgLight, border: `2px solid ${C.blue}` }}>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="flex-1 glass-card rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="text-xs font-bold" style={{ color: C.blue, minWidth: 56 }}>{step.time}</span>
                  <span className="text-xs" style={{ color: C.textMuted }}>{step.action}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 px-2 py-1 rounded" style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}>✓ Done</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm italic mt-8" style={{ color: C.textLight }}>All of this happened before your first coffee. Every single morning.</p>

        <div className="text-center mt-6">
          <button onClick={onOpenQuote} className="inline-flex items-center gap-2 text-sm font-bold transition-all hover:opacity-80" style={{ color: C.blue }}>
            Start Your First Morning Automatically
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Section 6: Social Proof ──────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "We replaced a $8,000/month agency with WorldDigital.ai and our ROAS went from 1.8x to 4.3x in 60 days.",
    name: "Marcus T.",
    role: "E-Commerce Brand Owner",
    platforms: ["Google Ads", "Meta Ads"],
  },
  {
    quote: "The AI generated 3 months of content in one afternoon. Our Snapchat engagement went up 340% in the first month.",
    name: "Priya S.",
    role: "Fitness Studio Owner",
    platforms: ["Snapchat", "Instagram"],
  },
  {
    quote: "As an agency ourselves, the white-label API saves us 60 hours per client per month. It's absurd how good this is.",
    name: "James K.",
    role: "Digital Agency Director",
    platforms: ["Enterprise API", "Multi-Brand"],
  },
];

function SocialProofSection() {
  const { ref, visible } = useReveal();
  const posts    = useCountUp(1247, 2000, visible);
  const campaigns = useCountUp(38,  2000, visible);
  const spend    = useCountUp(2,   2000, visible);

  return (
    <section ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ background: C.bg, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="text-center mb-10">
          <h2 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: C.text }}>Real Businesses. Real Results.</h2>
          <p className="text-sm" style={{ color: C.textMuted }}>Verified customer outcomes across every major platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass-card rounded-2xl p-6 flex flex-col">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className="w-4 h-4" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: C.textMuted }}>"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `linear-gradient(135deg,${C.accent},${C.blue})`, color: "#fff" }}>
                  {t.name.split(" ")[0][0]}{t.name.split(" ")[1]?.[0] ?? ""}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: C.text }}>{t.name}</p>
                  <p className="text-[10px]" style={{ color: C.textLight }}>{t.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {t.platforms.map((p) => (
                  <span key={p} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: C.borderLight, color: C.blue }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Metric strip */}
        <div className="glass-card rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: posts,      label: "Posts Generated This Month",   suffix: "" },
            { num: campaigns,  label: "Active Campaigns",              suffix: "" },
            { num: spend,      label: "Ad Spend Managed",             suffix: "$", prefix: "$", unit: "M" },
            { num: 9,          label: "Platforms Connected",           suffix: "" },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-2xl font-black" style={{ color: C.blue }}>
                {m.prefix ?? ""}{m.num.toLocaleString()}{m.unit ?? ""}
              </p>
              <p className="text-xs font-medium mt-1" style={{ color: C.textLight }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 7: Platform Modules (tabs) ──────────────────────────────────────────────

const AD_MODULES = [
  { name: "Meta Ads",       logo: "/icons/meta.png",     min: "$10/day",    features: ["Facebook & Instagram campaigns", "AI ad copy & creative", "Lookalike & retargeting audiences"] },
  { name: "Google Ads",     logo: "/icons/google.webp",  min: "$10/day",    features: ["Search & Display campaigns", "AI keyword research", "Smart bidding optimization"] },
  { name: "TikTok Ads",     logo: "/icons/tiktok.jpeg",  min: "$10/day",    features: ["Short-form video ad creation", "AI hook & CTA writing", "Trend-based targeting"] },
  { name: "Snapchat Ads",   logo: "/icons/snapchat.png", min: "$10/day",    features: ["Story & Snap Ad formats", "18–34 demographic targeting", "AI creative generation"] },
  { name: "LinkedIn Ads",   logo: "/icons/linkedin.png", min: "$30/day",    features: ["B2B professional targeting", "Sponsored Content & InMail", "Job title & company size filters"] },
  { name: "X Ads",          logo: "/icons/x.png",        min: "$10/day",    features: ["Promoted tweet campaigns", "AI 280-char copy", "Hashtag & trend targeting"] },
  { name: "YouTube Ads",    logo: "/icons/youtube.png",  min: "$50/day",    features: ["Pre-roll & display campaigns", "AI video script hooks", "Channel placement targeting"] },
];

const AI_MODULES = [
  { name: "AI Content Creation",   icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", color: "#4285C7", features: ["Platform-specific captions (9 channels)", "AI reel & video scripts", "Blog post generation with SEO"] },
  { name: "DALL-E 3 Images",     icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", color: "#C13A2A", features: ["Platform-aware sizing (1:1, 4:5, 9:16)", "Ad creative generation", "Brand-aligned AI prompting"] },
  { name: "AI Reel & Video Ads", icon: "M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", color: "#E91E8C", features: ["AI reel script writer", "Vertical video rendering", "Direct to publishing queue"] },
  { name: "AI SEO",              icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", color: "#16A34A", features: ["Automated keyword research", "On-page optimization audit", "Search Console integration"] },
  { name: "Multi-Platform Publishing", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8", color: "#6366F1", features: ["9 platform simultaneous publishing", "Content approval workflow", "Optimal time-slot suggestions"] },
];

function PlatformModules() {
  const { ref, visible } = useReveal();
  const [tab, setTab] = useState<"ads" | "ai">("ads");
  const modules = tab === "ads" ? AD_MODULES : AI_MODULES;

  return (
    <section ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ background: `linear-gradient(180deg,${C.bg} 0%,#070B16 100%)`, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="text-center mb-8">
          <h2 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: C.text }}>Every Platform. Every Tool.</h2>
          <p className="text-sm" style={{ color: C.textMuted }}>12 modules working together in one unified system.</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(["ads", "ai"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
              style={{ background: tab === t ? C.accent : C.borderLight, color: tab === t ? "#fff" : C.textMuted, border: `1px solid ${tab === t ? C.accent : C.border}` }}>
              {t === "ads" ? "Ad Management" : "AI Tools"}
            </button>
          ))}
        </div>

        {/* Budget badges (ads tab only) */}
        {tab === "ads" && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {AD_MODULES.map((m) => (
              <div key={m.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: C.borderLight, border: `1px solid ${C.border}` }}>
                <PIcon src={m.logo} alt={m.name} size={16} />
                <span style={{ color: C.textMuted }}>{m.name}</span>
                <span style={{ color: C.blue }}>{m.min}</span>
              </div>
            ))}
          </div>
        )}

        {/* Module cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <div key={m.name} className="glass-card rounded-2xl p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                {"logo" in m ? (
                  <PIcon src={m.logo} alt={m.name} size={32} />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${(m as {color:string}).color}18` }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={(m as {color:string}).color} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={(m as {icon:string}).icon} /></svg>
                  </div>
                )}
                <h3 className="text-sm font-black" style={{ color: C.text }}>{m.name}</h3>
              </div>
              <ul className="space-y-1.5 flex-1">
                {m.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: C.textMuted }}>
                    <svg className="w-3 h-3 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 8: API / Developer ──────────────────────────────────────────────────

const API_ENDPOINTS = [
  { name: "Campaigns",   type: "REST",       desc: "Create, pause, and manage ad campaigns across all platforms" },
  { name: "Content",     type: "REST",       desc: "Generate platform-optimized captions, copy, and blog posts" },
  { name: "Analytics",   type: "REST",       desc: "Pull cross-platform spend, ROAS, and conversion data" },
  { name: "Webhooks",    type: "Webhook",    desc: "Real-time campaign status and content publishing events" },
];

const CODE_BLOCK = `POST /v1/campaigns/create
Authorization: Bearer wd_live_xxxxxxxxxxxx
Content-Type: application/json

{
  "platform": "meta",
  "objective": "conversions",
  "budget_daily": 150,
  "ai_creative": true,
  "target_audience": {
    "age_min": 25,
    "age_max": 45,
    "interests": ["fitness", "nutrition"]
  },
  "brand_voice": "energetic",
  "auto_optimize": true
}

// Response
{
  "campaign_id": "cmp_a7f3k2",
  "status": "live",
  "platforms_active": ["meta", "instagram"],
  "creatives_generated": 8,
  "estimated_reach": 142000
}`;

function ApiSection({ onOpenQuote }: { onOpenQuote: () => void }) {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ background: C.bg, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="text-center mb-10">
          <h2 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: C.text }}>Built for Developers. Loved by Agencies.</h2>
          <p className="text-sm" style={{ color: C.textMuted, maxWidth: 560, margin: "0 auto" }}>
            The WorldDigital.ai Enterprise API gives your team programmatic control over every module. Plug into your CRM, automate client reporting, or build your own white-label dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Code block */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0D1117", border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: "#161B22", borderBottom: `1px solid ${C.border}` }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F56" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27CA40" }} />
              <span className="ml-auto text-[10px] font-mono" style={{ color: C.textLight }}>api.js</span>
            </div>
            <pre className="p-4 text-[11px] leading-relaxed font-mono overflow-x-auto" style={{ color: C.textMuted }}>
              {CODE_BLOCK.split("\n").map((line, i) => {
                let color = C.textMuted;
                if (line.startsWith("POST") || line.startsWith("Authorization") || line.startsWith("Content-Type")) color = "#79C0FF";
                else if (line.trim().startsWith("//")) color = "#8B949E";
                else if (line.includes("\"")) color = "#A5D6FF";
                else if (line.match(/^\s*\{/)) color = "#D2A8FF";
                return <div key={i} style={{ color }}>{line || " "}</div>;
              })}
            </pre>
          </div>

          {/* Endpoint cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            {API_ENDPOINTS.map((ep) => (
              <div key={ep.name} className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.accent + "18" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </div>
                  <span className="text-xs font-black" style={{ color: C.text }}>{ep.name}</span>
                  <span className="ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: C.borderLight, color: ep.type === "REST" ? C.blue : "#FBBF24" }}>{ep.type}</span>
                </div>
                <p className="text-xs" style={{ color: C.textMuted }}>{ep.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button onClick={onOpenQuote} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]" style={{ background: C.accent }}>
            Request Enterprise API Access
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Section 9: Final CTA + Demo Form ────────────────────────────────────────────────

function FinalCtaSection({ onOpenQuote }: { onOpenQuote: () => void }) {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ background: `linear-gradient(135deg,#070B16 0%,${C.bg} 50%,#0C1020 100%)`, padding: "80px 24px 100px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="text-center mb-12">
          <h2 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", background: `linear-gradient(90deg,${C.accent},${C.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Stop Watching Competitors Grow. Start Automating.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: checklist */}
          <div>
            <p className="text-sm font-bold mb-4" style={{ color: C.textMuted }}>What you get on day 1:</p>
            <ul className="space-y-3 mb-8">
              {["All 12 modules activated", "Brand AI trained on your business", "First campaigns live within 24 hours", "Dedicated onboarding call", "No contracts. Cancel anytime."].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: C.text }}>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <p className="text-xs font-bold" style={{ color: "#FBBF24" }}>Only 4 enterprise onboarding slots remaining this month</p>
            </div>
          </div>

          {/* Right: booking form */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-black mb-1" style={{ color: C.text }}>Book Your 15-Minute Demo</h3>
            <p className="text-xs mb-4" style={{ color: C.textMuted }}>Fill out your details and we'll schedule your personalized walkthrough.</p>
            <form onSubmit={(e) => { e.preventDefault(); onOpenQuote(); }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="Full Name" aria-label="Full Name" className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none" style={{ background: C.borderLight, border: `1px solid ${C.border}`, color: C.text }} />
                <input required type="email" placeholder="Email" aria-label="Email" className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none" style={{ background: C.borderLight, border: `1px solid ${C.border}`, color: C.text }} />
              </div>
              <input required placeholder="Business Name" aria-label="Business Name" className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none" style={{ background: C.borderLight, border: `1px solid ${C.border}`, color: C.text }} />
              <select required aria-label="Monthly ad budget" className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none" style={{ background: C.borderLight, border: `1px solid ${C.border}`, color: C.textMuted }}>
                <option value="">Monthly Ad Budget</option>
                <option value="under-5k">Under $5,000</option>
                <option value="5k-20k">$5,000 – $20,000</option>
                <option value="20k-50k">$20,000 – $50,000</option>
                <option value="50k+">$50,000+</option>
              </select>
              <select required aria-label="Primary platform" className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none" style={{ background: C.borderLight, border: `1px solid ${C.border}`, color: C.textMuted }}>
                <option value="">Primary Platform</option>
                <option value="meta">Meta (Facebook/Instagram)</option>
                <option value="google">Google Ads</option>
                <option value="tiktok">TikTok</option>
                <option value="snapchat">Snapchat</option>
                <option value="linkedin">LinkedIn</option>
                <option value="x">X (Twitter)</option>
                <option value="youtube">YouTube</option>
                <option value="multi">Multiple / All</option>
              </select>
              <button type="submit" className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] pulse-glow" style={{ background: `linear-gradient(135deg,${C.accent},${C.blue})` }}>
                Book My 15-Minute Demo
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Modal: Get a Tailored Quote ──────────────────────────────────────────────────

function QuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/v1/enterprise/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message, company: "", phone: "", budget: "", platforms: "" }),
      });
      if (res.ok) setSent(true);
      else setError("Failed to send. Please email us at support@worlddigital.ai");
    } catch { setError("Network error. Please email us at support@worlddigital.ai"); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-8 relative" style={{ background: C.bgLight, border: `1px solid ${C.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" style={{ color: C.textMuted }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {sent ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.12)" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#34D399" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-black mb-2" style={{ color: C.text }}>Inquiry Sent!</h3>
            <p className="text-sm" style={{ color: C.textMuted }}>Our team will be in touch within 24 hours.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-black mb-1" style={{ color: C.text }}>Get a Tailored Quote</h2>
            <p className="text-sm mb-5" style={{ color: C.textLight }}>Tell us about your business and marketing goals.</p>
            {error && <div className="mb-4 px-4 py-3 rounded-xl text-xs text-red-300 border border-red-500/20 bg-red-500/10">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Your Name" className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none" style={{ background: C.borderLight, border: `1px solid ${C.border}`, color: C.text }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required type="email" placeholder="Email Address" className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none" style={{ background: C.borderLight, border: `1px solid ${C.border}`, color: C.text }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <textarea required aria-label="Message" placeholder="Platforms you need, monthly budget, business goals..." rows={4} className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none resize-none" style={{ background: C.borderLight, border: `1px solid ${C.border}`, color: C.text }} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: `linear-gradient(to right,${C.accent},${C.blue})` }}>
                {loading ? "Sending…" : "Send Inquiry"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function EnterprisePage() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const openQuote = useCallback(() => setQuoteOpen(true), []);
  const closeQuote = useCallback(() => setQuoteOpen(false), []);

  return (
    <main className="min-h-screen" style={{ background: C.bg, color: C.text, overflowX: "hidden" }}>
      <HeroSection      onOpenQuote={openQuote} />
      <RoiCalculator    onOpenQuote={openQuote} />
      <PainSection />
      <ComparisonSection />
      <DayInLifeSection onOpenQuote={openQuote} />
      <SocialProofSection />
      <PlatformModules />
      <ApiSection       onOpenQuote={openQuote} />
      <FinalCtaSection  onOpenQuote={openQuote} />
      <QuoteModal       open={quoteOpen} onClose={closeQuote} />
    </main>
  );
}
