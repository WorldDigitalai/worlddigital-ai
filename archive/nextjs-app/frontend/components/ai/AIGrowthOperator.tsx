"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const CHAT_ENDPOINT = "/api/chat";
const FRIENDLY_ERROR = "AI Operator is reconnecting. Please try again in a moment.";
const REQUEST_TIMEOUT_MS = 30_000;

function useMobileChatBottom() {
  const [bottom, setBottom] = useState("20px");
  useEffect(() => {
    const update = () => setBottom(window.innerWidth < 1024 ? "88px" : "20px");
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);
  return bottom;
}

type Tab = "chat" | "actions" | "opportunities" | "tools";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RecommendedAction {
  label: string;
  desc: string;
  icon: string;
  href: string;
}

interface GrowthOpportunity {
  title: string;
  desc: string;
  icon: string;
  cta: string;
  href: string;
}

const QUICK_TOOLS = [
  { label: "Content Studio", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", href: "/dashboard/content-studio", authRequired: true },
  { label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", href: "/dashboard/analytics", authRequired: true },
  { label: "Business Profile", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", href: "/dashboard/business", authRequired: true },
  { label: "View Packages", icon: "M13 10V3L4 14h7v7l9-11h-7z", href: "/subscribe", authRequired: false },
  { label: "Strategy Report", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", href: "/dashboard/strategy", authRequired: true },
  { label: "Publishing Queue", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8", href: "/dashboard/publishing", authRequired: true },
];

// Memoized individual message bubble — prevents full list re-render on each keystroke.
const MessageBubble = memo(function MessageBubble({ role, content }: Message) {
  return (
    <div style={{ display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start" }}>
      <div style={{
        maxWidth: "84%", padding: "10px 13px", lineHeight: 1.5,
        borderRadius: role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: role === "user" ? "linear-gradient(135deg, #1D7FE8, #0d5ec7)" : "#fff",
        color: role === "user" ? "#fff" : "#1a1a1a",
        fontSize: "13.5px", whiteSpace: "pre-wrap", wordBreak: "break-word",
        boxShadow: role === "user" ? "0 2px 8px rgba(29,127,232,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
      }}>
        {content}
      </div>
    </div>
  );
});

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 160, 320].map(d => (
          <span key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D7FE8", display: "inline-block", animation: "aiOpBounce 1s infinite ease-in-out", animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
});

export default function AIGrowthOperator() {
  const chatBottom = useMobileChatBottom();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Set context-aware greeting when auth state resolves
  useEffect(() => {
    if (messages.length === 0) {
      let greeting = "Hi! I'm your AI Growth Operator. Tell me your business type and I'll show you what WorldDigital.ai can build for you.";
      if (user) {
        const firstName = user.name.split(" ")[0];
        greeting = `Hi ${firstName}! I can help you generate content, improve campaigns, and track your growth. What would you like to work on?`;
      }
      setMessages([{ role: "assistant", content: greeting }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Smooth scroll to bottom on new messages — only when chat tab active.
  useEffect(() => {
    if (tab === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, tab]);

  useEffect(() => {
    if (open && tab === "chat") {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open, tab]);

  // Cancel in-flight request when component unmounts.
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Cancel any previous in-flight request.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    // Timeout guard independent of fetch signal.
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        const serverMsg = err.error ?? "";
        // Use server's friendly message if it looks user-safe, otherwise generic.
        const display = serverMsg && !serverMsg.includes("HTTP") ? serverMsg : FRIENDLY_ERROR;
        setMessages(prev => [...prev, { role: "assistant", content: display }]);
        return;
      }

      const data = await res.json() as { reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? "Sorry, I couldn't get a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error)?.name === "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: "AI Operator is taking too long. Please try again in a moment." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: FRIENDLY_ERROR }]);
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const navigate = useCallback((href: string, authRequired: boolean) => {
    setOpen(false);
    if (authRequired && !user) {
      router.push(`/login?next=${encodeURIComponent(href)}`);
    } else {
      router.push(href);
    }
  }, [user, router]);

  const RECOMMENDED_ACTIONS: RecommendedAction[] = user ? [
    { label: "Generate this week's posts", desc: "Create AI-powered content for all your platforms", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", href: "/dashboard/content-studio" },
    { label: "View your growth strategy", desc: "Get an AI-generated growth plan for your business", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", href: "/dashboard/strategy" },
    { label: "Review analytics", desc: "See how your published content is performing", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", href: "/dashboard/analytics" },
    { label: "Complete business profile", desc: "Required for AI to generate personalized content", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", href: "/dashboard/business" },
  ] : [
    { label: "Start with a free demo", desc: "See what AI can generate for your business", icon: "M13 10V3L4 14h7v7l9-11h-7z", href: "#demo" },
    { label: "View all plans", desc: "Snapchat, Meta, Google — Ad Management plans", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", href: "/subscribe" },
    { label: "Create an account", desc: "Get started with AI-powered marketing today", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", href: "/signup" },
  ];

  const OPPORTUNITIES: GrowthOpportunity[] = user ? [
    { title: "Generate your first reel", desc: "Reels get 3x more reach than static posts on average. You haven't created any reel content yet.", icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z", cta: "Create Reel", href: "/dashboard/content-studio" },
    { title: "Use your content credits", desc: "You have unused content credits this month. Generate a full content pack before they reset.", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", cta: "Generate Content", href: "/dashboard/content-studio" },
    { title: "Get your strategy report", desc: "An AI growth plan tailored to your business is ready to generate. See your best platforms and content mix.", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", cta: "View Strategy", href: "/dashboard/strategy" },
    { title: "Add a destination URL", desc: "Every post needs a link. Make sure your destination URL is set so all content drives traffic to you.", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", cta: "Update Profile", href: "/dashboard/business" },
  ] : [
    { title: "Start with a demo", desc: "Try the AI with your own business type and see what posts it generates in 30 seconds.", icon: "M13 10V3L4 14h7v7l9-11h-7z", cta: "Try Demo", href: "#demo" },
    { title: "See platform options", desc: "Snapchat, Meta, Google, TikTok, LinkedIn — we manage them all with AI.", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z", cta: "View Services", href: "/services" },
  ];

  const BLUE = "linear-gradient(135deg, #1D7FE8 0%, #0d5ec7 100%)";

  return (
    <>
      {/* Chat panel */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: `calc(${chatBottom} + 68px)`,
          right: "20px",
          width: "380px",
          maxWidth: "calc(100vw - 24px)",
          height: "580px",
          maxHeight: "calc(100dvh - 110px)",
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 9998,
          transformOrigin: "bottom right",
          transition: "transform 240ms cubic-bezier(0.34,1.56,0.64,1), opacity 180ms ease",
          transform: open ? "scale(1) translateY(0)" : "scale(0.82) translateY(20px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          willChange: "transform, opacity",
        }}
      >
        {/* Header */}
        <div style={{ background: BLUE, padding: "14px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "14px" }}>AI Growth Operator</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>Online · WorldDigital.ai</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", width: 28, height: 28, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Close chat"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "3px" }}>
            {(["chat", "actions", "opportunities", "tools"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "5px 4px", border: "none", borderRadius: "7px", cursor: "pointer",
                  fontSize: "10px", fontWeight: 700,
                  background: tab === t ? "rgba(255,255,255,0.95)" : "transparent",
                  color: tab === t ? "#0d5ec7" : "rgba(255,255,255,0.75)",
                  transition: "all 150ms",
                }}
              >
                {t === "chat" ? "Chat" : t === "actions" ? "Actions" : t === "opportunities" ? "Growth" : "Tools"}
              </button>
            ))}
          </div>
        </div>

        {/* Chat tab */}
        {tab === "chat" && (
          <>
            <div
              style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: "10px", background: "#F7FAFC", overscrollBehavior: "contain" }}
            >
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} style={{ height: 1 }} />
            </div>
            <div style={{ padding: "10px", borderTop: "1px solid #E5EAF2", background: "#fff", display: "flex", gap: 8, flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about content, campaigns, growth…"
                disabled={loading}
                autoComplete="off"
                style={{ flex: 1, border: "1.5px solid #E5EAF2", borderRadius: "12px", padding: "9px 13px", fontSize: "13px", outline: "none", background: "#F7FAFC", color: "#1a1a1a", transition: "border-color 150ms", WebkitAppearance: "none" }}
                onFocus={e => (e.target.style.borderColor = "#1D7FE8")}
                onBlur={e => (e.target.style.borderColor = "#E5EAF2")}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                style={{ width: 38, height: 38, borderRadius: "12px", border: "none", background: loading || !input.trim() ? "#E5EAF2" : "linear-gradient(135deg, #1D7FE8, #0d5ec7)", color: loading || !input.trim() ? "#aaa" : "#fff", cursor: loading || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 150ms" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Recommended Actions tab */}
        {tab === "actions" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", background: "#F7FAFC", overscrollBehavior: "contain" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Recommended for you
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RECOMMENDED_ACTIONS.map(({ label, desc, icon, href }) => (
                <button
                  key={label}
                  onClick={() => navigate(href, !!user)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px", background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "14px", cursor: "pointer", textAlign: "left", transition: "all 150ms", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1D7FE8"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(29,127,232,0.15)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg,rgba(29,127,232,0.12),rgba(13,94,199,0.08))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#1D7FE8" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: "11.5px", color: "#6B7280", lineHeight: 1.4 }}>{desc}</p>
                  </div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Growth Opportunities tab */}
        {tab === "opportunities" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", background: "#F7FAFC", overscrollBehavior: "contain" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Growth Opportunities
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {OPPORTUNITIES.map(({ title, desc, icon, cta, href }) => (
                <div key={title} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "14px", padding: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "8px", background: "rgba(193,58,42,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#C13A2A" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{title}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "#6B7280", lineHeight: 1.5, marginBottom: 10 }}>{desc}</p>
                  <button
                    onClick={() => navigate(href, !!user)}
                    style={{ width: "100%", padding: "8px", borderRadius: "10px", border: "none", background: "linear-gradient(to right, #1D7FE8, #0d5ec7)", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {cta} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tools tab */}
        {tab === "tools" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", background: "#F7FAFC", overscrollBehavior: "contain" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Quick Navigation
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {QUICK_TOOLS.map(({ label, icon, href, authRequired }) => (
                <button
                  key={label}
                  onClick={() => navigate(href, authRequired)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 8px", background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "14px", cursor: "pointer", textAlign: "center", transition: "all 150ms", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1D7FE8"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "10px", background: "linear-gradient(135deg,#1D7FE8,#0d5ec7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#374151", lineHeight: 1.3 }}>{label}</span>
                </button>
              ))}
            </div>
            {!user && (
              <div style={{ marginTop: 14, padding: "12px", background: "rgba(29,127,232,0.06)", borderRadius: "12px", border: "1px solid rgba(29,127,232,0.15)" }}>
                <p style={{ fontSize: "12px", color: "#1D4ED8", fontWeight: 600, marginBottom: 6 }}>Dashboard tools require a free account</p>
                <button
                  onClick={() => navigate("/signup", false)}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "none", background: "linear-gradient(to right,#1D7FE8,#0d5ec7)", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Create Free Account →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close AI Growth Operator" : "Open AI Growth Operator"}
        style={{
          position: "fixed", bottom: chatBottom, right: "20px", width: 56, height: 56,
          borderRadius: "50%", background: "linear-gradient(135deg, #1D7FE8 0%, #0d5ec7 100%)",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(29,127,232,0.45), 0 2px 8px rgba(0,0,0,0.12)",
          zIndex: 9999, transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 200ms",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(29,127,232,0.55), 0 2px 10px rgba(0,0,0,0.14)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(29,127,232,0.45), 0 2px 8px rgba(0,0,0,0.12)"; }}
      >
        {/* Chat icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", transition: "opacity 180ms, transform 180ms", opacity: open ? 0 : 1, transform: open ? "rotate(90deg) scale(0.6)" : "rotate(0deg) scale(1)" }}>
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* Close icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ position: "absolute", transition: "opacity 180ms, transform 180ms", opacity: open ? 1 : 0, transform: open ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.6)" }}>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
