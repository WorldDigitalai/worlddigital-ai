import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: ["*.riker.replit.dev", "*.repl.co", "*.replit.dev", "*.sisko.replit.dev", "*.replit.app"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
      { protocol: "https", hostname: "*.blob.core.windows.net" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "Cross-Origin-Resource-Policy", value: "same-site" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // unsafe-eval is required by Next.js runtime; unsafe-inline required by inline styles/scripts
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://tagmanager.google.com https://cdn.dev.runwayml.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com https://runway-static-assets.s3.amazonaws.com",
            // Removed http: — only https images allowed; upgrade-insecure-requests handles any stale http refs
            "img-src 'self' data: blob: https:",
            // Added CloudFront (video/image CDN), region1.analytics, tagmanager, Runway widget
            "connect-src 'self' https://api.stripe.com https://*.replit.dev https://*.replit.app https://*.repl.co https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://*.cloudfront.net https://api.dev.runwayml.com",
            "media-src 'self' https://*.cloudfront.net blob:",
            "frame-src 'self' https://js.stripe.com https://www.google.com https://www.googletagmanager.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
      ],
    },
  ],
  async rewrites() {
    const apiUrl = process.env["NEXT_PUBLIC_API_URL"];
    if (apiUrl && !apiUrl.startsWith("/")) {
      return [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
