"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Platform" },
  { href: "/subscribe", label: "Packages" },
  { href: "/blog", label: "Blog" },
  { href: "/enterprise", label: "Enterprise" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: isScrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.82)",
        backdropFilter: "blur(20px)",
        borderBottom: isScrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
        boxShadow: isScrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="worlddigital.ai home">
          <Image
            src="/icons/wdlogo.jpeg"
            alt=""
            width={36}
            height={36}
            className="rounded-xl object-cover"
          />
          <span className="font-black text-gray-900 text-[15px] tracking-tight">worlddigital.ai</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5" aria-label="Primary navigation">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-full text-sm transition-all duration-200"
              style={{
                color: isActive(href) ? "#C13A2A" : "#374151",
                fontWeight: isActive(href) ? 700 : 500,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition-all duration-200"
                style={{ color: "#374151" }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                  style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={logout}
                className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition-all duration-200"
                style={{ color: "#6B7280" }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition-all duration-200"
                style={{ color: "#374151" }}
              >
                Login
              </Link>
              <Link
                href="/subscribe"
                className="text-sm font-bold text-white px-5 py-2.5 rounded-full transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#C13A2A", boxShadow: "0 4px 14px rgba(193,58,42,0.3)" }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile: avatar or CTA + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
              style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}
              aria-label="Dashboard"
            >
              {user.name.charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link
              href="/subscribe"
              className="text-sm font-bold px-4 py-2 rounded-full text-white"
              style={{ background: "#C13A2A" }}
            >
              Get Started
            </Link>
          )}
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileOpen}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {isMobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div
          className="md:hidden"
          style={{ background: "white", borderTop: "1px solid #E5EAF2", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <div className="px-5 py-5">
            <div className="space-y-1 mb-6">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center px-4 py-3.5 rounded-2xl text-sm transition-colors"
                  style={{
                    color: isActive(href) ? "#C13A2A" : "#374151",
                    fontWeight: isActive(href) ? 700 : 500,
                    background: isActive(href) ? "rgba(193,58,42,0.05)" : "transparent",
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="space-y-2.5 pt-5 border-t" style={{ borderColor: "#E5EAF2" }}>
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                      style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block w-full text-center py-3.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold border"
                    style={{ color: "#6B7280", borderColor: "#E5EAF2" }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block w-full text-center py-3.5 rounded-2xl text-sm font-semibold border"
                    style={{ color: "#374151", borderColor: "#E5EAF2" }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/subscribe"
                    className="block w-full text-center py-3.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: "#C13A2A" }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
