import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UserProvider } from "@/context/UserContext";
import { ClientShell } from "@/components/ClientShell";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GTMScript, GTMNoScript } from "@/components/GoogleTagManager";
import { CookieConsent } from "@/components/CookieConsent";
import { LeadCapturePopup } from "@/components/LeadCapturePopup";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_DESCRIPTION =
  "AI marketing automation for Google, Meta, TikTok, Snapchat, LinkedIn and X. Smarter campaigns and real results for SMBs, SMEs and enterprises in the US and Canada.";

// Search engine ownership tokens. Set these in the hosting environment;
// each tag is only rendered when its variable is present.
const googleVerification = process.env["GOOGLE_SITE_VERIFICATION"] ?? process.env["NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"];
const bingVerification = process.env["BING_SITE_VERIFICATION"] ?? process.env["NEXT_PUBLIC_BING_SITE_VERIFICATION"];

export const metadata: Metadata = {
  title: {
    default: "WorldDigital.ai — AI Marketing Automation for SMBs & Enterprises",
    template: "%s | WorldDigital.ai",
  },
  description: SITE_DESCRIPTION,
  applicationName: "WorldDigital.ai",
  keywords: [
    "AI marketing automation",
    "digital marketing agency",
    "Google Ads management",
    "Meta Ads management",
    "TikTok ads agency",
    "AI SEO",
    "SMB marketing",
    "enterprise marketing automation",
    "marketing agency USA",
    "marketing agency Canada",
  ],
  authors: [{ name: "WorldDigital.ai" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_CA"],
    url: "https://worlddigital.ai",
    siteName: "WorldDigital.ai",
    title: "WorldDigital.ai — AI Marketing Automation for SMBs & Enterprises",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "https://worlddigital.ai/opengraph-image",
        width: 1200,
        height: 630,
        alt: "WorldDigital.ai — AI marketing automation for SMBs, SMEs and enterprises",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worlddigitalai",
    creator: "@worlddigitalai",
    title: "WorldDigital.ai — AI Marketing Automation for SMBs & Enterprises",
    description: SITE_DESCRIPTION,
    images: ["https://worlddigital.ai/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  metadataBase: new URL(process.env["NEXT_PUBLIC_SITE_URL"] || "https://worlddigital.ai"),
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
  },
  category: "Marketing",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  other: {
    "tiktok-developers-site-verification": "xtPJKA7HOdBBtyZfKTEkiY0I9Q7nM4RF",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E8F4FD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable} data-scroll-behavior="smooth">
      <body className={inter.className}>
        {/* GTM noscript — must be immediately after opening <body> tag */}
        <GTMNoScript />
        {/* GTM script — strategy="beforeInteractive" injects this into <head> */}
        <GTMScript />
        <GoogleAnalytics />
        <AuthProvider>
          <UserProvider>
            <ClientShell>{children}</ClientShell>
          </UserProvider>
        </AuthProvider>
        <CookieConsent />
        <LeadCapturePopup />
      </body>
    </html>
  );
}
