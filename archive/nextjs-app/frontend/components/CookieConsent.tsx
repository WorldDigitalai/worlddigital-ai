"use client";

import { useState, useEffect } from "react";

type ConsentPrefs = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
};

const STORAGE_KEY = "wdai_cookie_consent";

function loadPrefs(): ConsentPrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentPrefs) : null;
  } catch { return null; }
}

function savePrefs(prefs: ConsentPrefs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* */ }
}

export function getConsent(): ConsentPrefs {
  return loadPrefs() ?? { necessary: true, analytics: false, marketing: false, personalization: false };
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPrefs>({ necessary: true, analytics: true, marketing: true, personalization: true });

  useEffect(() => {
    const stored = loadPrefs();
    if (!stored) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = (all: boolean) => {
    const p: ConsentPrefs = all
      ? { necessary: true, analytics: true, marketing: true, personalization: true }
      : { necessary: true, analytics: false, marketing: false, personalization: false };
    savePrefs(p);
    setVisible(false);
  };

  const saveCustom = () => {
    savePrefs(prefs);
    setVisible(false);
  };

  const toggle = (key: keyof Omit<ConsentPrefs, "necessary">) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 100%)" }}
    >
      <div
        className="max-w-2xl mx-auto rounded-2xl p-5 sm:p-6 shadow-2xl"
        style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        {!customizing ? (
          <>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-xl shrink-0">🍪</span>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: "#0F172A" }}>We use cookies</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
                  We use cookies to improve your experience, analyze traffic, and deliver personalized content and ads.
                  By clicking "Accept All" you agree to our use of cookies. You can customize your preferences or reject non-essential cookies.{" "}
                  <a href="/privacy-policy" className="underline hover:opacity-70" style={{ color: "#2B6CB0" }}>Privacy Policy</a>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => accept(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: "#C13A2A" }}
              >
                Accept All
              </button>
              <button
                onClick={() => accept(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: "#F1F5F9", color: "#374151" }}
              >
                Reject Non-Essential
              </button>
              <button
                onClick={() => setCustomizing(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{ color: "#2B6CB0" }}
              >
                Customize
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-bold text-sm mb-4" style={{ color: "#0F172A" }}>Cookie Preferences</h3>
            <div className="space-y-3 mb-5">
              {([
                { key: "necessary", label: "Necessary", desc: "Required for the website to function. Cannot be disabled.", locked: true },
                { key: "analytics", label: "Analytics", desc: "Help us understand how visitors interact with the website.", locked: false },
                { key: "marketing", label: "Marketing", desc: "Used to deliver personalized ads and track campaign performance.", locked: false },
                { key: "personalization", label: "Personalization", desc: "Remember your preferences and personalize your experience.", locked: false },
              ] as const).map(({ key, label, desc, locked }) => (
                <div key={key} className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
                  <div className="flex-1">
                    <p className="text-xs font-bold mb-0.5" style={{ color: "#0F172A" }}>{label}</p>
                    <p className="text-[11px]" style={{ color: "#64748B" }}>{desc}</p>
                  </div>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && toggle(key as keyof Omit<ConsentPrefs, "necessary">)}
                    className="relative w-10 h-5 rounded-full transition-all shrink-0 mt-0.5 disabled:cursor-default"
                    style={{
                      background: (locked || prefs[key as keyof ConsentPrefs]) ? "#C13A2A" : "#E2E8F0",
                    }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                      style={{ transform: (locked || prefs[key as keyof ConsentPrefs]) ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveCustom}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: "#C13A2A" }}
              >
                Save Preferences
              </button>
              <button
                onClick={() => setCustomizing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{ color: "#64748B" }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
