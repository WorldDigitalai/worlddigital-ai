"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Always use a relative path so it routes correctly through the Replit proxy.
// Never read from NEXT_PUBLIC_API_URL here — that secret may point to localhost
// which is unreachable from the user's browser.
const CHAT_ENDPOINT = "/api/chat";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the WorldDigital.ai assistant. Ask me anything about digital marketing, our plans, or how to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send simple { message } format as required by the C++ backend
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${msg}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Chat window ─────────────────────────────────────────────────── */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "90px",
          right: "20px",
          width: "360px",
          maxWidth: "calc(100vw - 32px)",
          height: "520px",
          maxHeight: "calc(100dvh - 120px)",
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.16), 0 2px 12px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 9998,
          transformOrigin: "bottom right",
          transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1), opacity 180ms ease",
          transform: open ? "scale(1) translateY(0)" : "scale(0.82) translateY(16px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1D7FE8 0%, #0d5ec7 100%)",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                fill="white"
              />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>
              WorldDigital.ai
            </div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", marginTop: "1px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#4ade80",
                  marginRight: 5,
                  verticalAlign: "middle",
                }}
              />
              AI Assistant · Online
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "8px",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: "#F7FAFC",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 13px",
                  borderRadius:
                    m.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                  background: m.role === "user"
                    ? "linear-gradient(135deg, #1D7FE8, #0d5ec7)"
                    : "#fff",
                  color: m.role === "user" ? "#fff" : "#1a1a1a",
                  fontSize: "13.5px",
                  lineHeight: "1.5",
                  boxShadow: m.role === "user"
                    ? "0 2px 8px rgba(29,127,232,0.25)"
                    : "0 1px 4px rgba(0,0,0,0.08)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                }}
              >
                {[0, 160, 320].map((delay) => (
                  <span
                    key={delay}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#1D7FE8",
                      display: "inline-block",
                      animation: "chatBounce 1s infinite ease-in-out",
                      animationDelay: `${delay}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "12px 12px 6px",
            borderTop: "1px solid #E5EAF2",
            background: "#fff",
            display: "flex",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            disabled={loading}
            style={{
              flex: 1,
              border: "1.5px solid #E5EAF2",
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "16px",
              outline: "none",
              background: "#F7FAFC",
              color: "#1a1a1a",
              transition: "border-color 150ms",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1D7FE8")}
            onBlur={(e) => (e.target.style.borderColor = "#E5EAF2")}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              border: "none",
              background:
                loading || !input.trim()
                  ? "#E5EAF2"
                  : "linear-gradient(135deg, #1D7FE8, #0d5ec7)",
              color: loading || !input.trim() ? "#aaa" : "#fff",
              cursor: loading || !input.trim() ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 150ms, transform 100ms",
            }}
            onMouseDown={(e) => {
              if (!loading && input.trim())
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Floating toggle button + label ──────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          zIndex: 9999,
        }}
      >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1D7FE8 0%, #0d5ec7 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(29,127,232,0.45), 0 2px 8px rgba(0,0,0,0.12)",
          transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 200ms",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 28px rgba(29,127,232,0.55), 0 2px 10px rgba(0,0,0,0.14)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 20px rgba(29,127,232,0.45), 0 2px 8px rgba(0,0,0,0.12)";
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            position: "absolute",
            transition: "opacity 180ms, transform 180ms",
            opacity: open ? 0 : 1,
            transform: open ? "rotate(90deg) scale(0.6)" : "rotate(0deg) scale(1)",
          }}
        >
          <path
            d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
            fill="white"
          />
        </svg>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          style={{
            position: "absolute",
            transition: "opacity 180ms, transform 180ms",
            opacity: open ? 1 : 0,
            transform: open ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.6)",
          }}
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* label below bubble */}
      <a
        href="https://worlddigital.ai"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#94A3B8",
          textDecoration: "none",
          textTransform: "uppercase",
          opacity: 0.85,
          transition: "opacity 180ms",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")}
      >
        Powered by WorldDigital.ai
      </a>
      </div>

      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
