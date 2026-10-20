import Link from "next/link";
import Image from "next/image";

const CURRENT_YEAR = new Date().getFullYear();

const company = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Platform" },
  { href: "/enterprise", label: "Enterprise" },
  { href: "/build", label: "Build Your Plan" },
  { href: "/blog", label: "Blog" },
  { href: "/help", label: "Help Center" },
  { href: "/career", label: "Careers" },
];

const support = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/help#faq", label: "FAQ" },
  { href: "/cookies-policy", label: "Cookies" },
];

const seoPages = [
  { href: "/google-ads-agency",        label: "Google Ads Agency" },
  { href: "/meta-ads-agency",          label: "Meta Ads Agency" },
  { href: "/snapchat-ads-agency",      label: "Snapchat Ads Agency" },
  { href: "/snapchat-marketing",       label: "Snapchat Marketing" },
  { href: "/tiktok-ads-agency",        label: "TikTok Ads Agency" },
  { href: "/tiktok-marketing",         label: "TikTok Marketing" },
  { href: "/instagram-marketing",      label: "Instagram Marketing" },
  { href: "/facebook-ads-management",  label: "Facebook Ads" },
  { href: "/linkedin-ads-agency",      label: "LinkedIn Ads Agency" },
  { href: "/x-ads-agency",             label: "X Ads Agency" },
  { href: "/youtube-shorts-marketing", label: "YouTube Shorts" },
  { href: "/ai-marketing-automation",  label: "AI Marketing Automation" },
  { href: "/ai-seo-agency",            label: "AI SEO Agency" },
];

const socialIcons = [
  {
    href: "https://snapchat.com/add/worlddigitalai",
    label: "Snapchat",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.031-.51c-.11-1.629-.239-3.653.285-4.847C7.875 1.07 11.218.793 12.206.793z"/>
      </svg>
    ),
  },
  {
    href: "https://x.com/worlddigitalai",
    label: "X / Twitter",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: "https://linkedin.com/company/worlddigitalai",
    label: "LinkedIn",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com/worlddigitalai",
    label: "Instagram",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    href: "https://facebook.com/worlddigitalai",
    label: "Facebook",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    href: "https://youtube.com/@worlddigitalai",
    label: "YouTube",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    href: "https://tiktok.com/@worlddigitalai",
    label: "TikTok",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.81 1.54V6.78a4.85 4.85 0 01-1.04-.09z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer style={{ background: "white", borderTop: "1px solid #E5EAF2" }}>
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4" aria-label="worlddigital.ai">
              <Image
                src="/icons/wdlogo.jpeg"
                alt=""
                width={40}
                height={40}
                className="rounded-xl object-cover"
              />
              <span className="font-black text-gray-900 text-[15px]">worlddigital.ai</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#6B7280" }}>
              worlddigital.ai redefines digital marketing by offering AI-driven automation tailored for small and medium businesses.
            </p>
            <div className="flex gap-2 flex-wrap">
              {socialIcons.map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:text-gray-700"
                  style={{ border: "1.5px solid #E5EAF2", color: "#6B7280" }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#111827" }}>Company</h3>
            <ul className="space-y-3">
              {company.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm transition-colors hover:text-gray-900" style={{ color: "#6B7280" }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#111827" }}>Support</h3>
            <ul className="space-y-3">
              {support.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm transition-colors hover:text-gray-900" style={{ color: "#6B7280" }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services / SEO pages */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#111827" }}>Services</h3>
            <ul className="space-y-3">
              {seoPages.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm transition-colors hover:text-gray-900" style={{ color: "#6B7280" }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media label col */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#111827" }}>Social Media</h3>
            <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
              No contracts, no setup fees.
            </p>
            <Link
              href="/subscribe"
              className="inline-block px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "#C13A2A" }}
            >
              View Plans
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-3 pt-8"
          style={{ borderTop: "1px solid #E5EAF2" }}
        >
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <p className="text-sm" style={{ color: "#6B7280" }}>
              &copy; {CURRENT_YEAR} WorldDigital.ai Corporation LLC. All rights reserved.
            </p>
            <span className="hidden md:inline text-xs" style={{ color: "#6B7280" }} aria-hidden="true">·</span>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              3343 Memorial Blvd, Murfreesboro, TN
            </p>
          </div>
          <div className="flex items-center gap-4">
            {[
              { href: "/privacy-policy", label: "Privacy" },
              { href: "/terms-and-conditions", label: "Terms" },
              { href: "/cookies-policy", label: "Cookies" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm transition-colors hover:text-gray-700" style={{ color: "#6B7280" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
