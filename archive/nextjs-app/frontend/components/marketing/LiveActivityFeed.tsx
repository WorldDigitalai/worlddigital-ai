"use client";

import { useState, useEffect, useRef } from "react";

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  icon: string;
}

const ACTIVITIES: ActivityItem[] = [
  { id: 1,  text: "A restaurant generated 5 AI campaign posts",           time: "just now",  icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { id: 2,  text: "A clothing brand launched a Meta campaign",             time: "1 min ago", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" },
  { id: 3,  text: "A local service business created 3 reels",              time: "2 min ago", icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" },
  { id: 4,  text: "A campaign reached 12,400 impressions",                 time: "3 min ago", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
  { id: 5,  text: "A cafe generated a full content pack",                  time: "4 min ago", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: 6,  text: "A brand scheduled posts for Instagram & Facebook",      time: "5 min ago", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: 7,  text: "A dentist office created a Google Ads campaign",        time: "6 min ago", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { id: 8,  text: "A fitness studio generated weekly content",             time: "7 min ago", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { id: 9,  text: "A real estate agency launched TikTok ads",              time: "8 min ago", icon: "M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { id: 10, text: "A hair salon published 8 posts this week",              time: "9 min ago", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { id: 11, text: "An e-commerce brand generated 20 captions",            time: "10 min ago", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { id: 12, text: "A contractor business went live on Snapchat",           time: "11 min ago", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
];

export default function LiveActivityFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = () => {
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex(i => (i + 1) % ACTIVITIES.length);
      setVisible(true);
    }, 400);
  };

  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(advance, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const item = ACTIVITIES[currentIndex];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "50px",
        background: "rgba(255,255,255,0.97)",
        border: "1px solid rgba(255,255,255,0.9)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.1), 0 1px 6px rgba(0,0,0,0.06)",
        maxWidth: "min(340px, calc(100vw - 48px))",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: "#22C55E", flexShrink: 0,
          boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
          animation: "livePulse 2s ease infinite",
        }} />
      </div>

      {/* Icon */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, rgba(29,127,232,0.1), rgba(193,58,42,0.08))",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "opacity 400ms",
        opacity: visible ? 1 : 0,
      }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#1D7FE8" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, transition: "opacity 400ms, transform 400ms", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(4px)" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#111827", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.text}</p>
        <p style={{ fontSize: "10.5px", color: "#6B7280", marginTop: 1 }}>{item.time}</p>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}
