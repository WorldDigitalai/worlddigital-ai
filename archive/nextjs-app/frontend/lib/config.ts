/**
 * Frontend-safe configuration.
 * Only reads NEXT_PUBLIC_* environment variables.
 * Never expose backend secrets here.
 */

export const frontendConfig = {
  apiUrl: process.env["NEXT_PUBLIC_API_URL"] || "/api",
  recaptchaSiteKey: process.env["NEXT_PUBLIC_RECAPTCHA_SITE_KEY"] || "",
  stripePublishableKey: process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] || "",
  gmapsKey: process.env["NEXT_PUBLIC_GMAPS_KEY"] || "",
  prices: {
    metaMonthly: process.env["NEXT_PUBLIC_PRICE_META_MONTHLY"] || "350",
    metaYearly: process.env["NEXT_PUBLIC_PRICE_META_YEARLY"] || "3500",
    googleMonthly: process.env["NEXT_PUBLIC_PRICE_GOOGLE_MONTHLY"] || "350",
    googleYearly: process.env["NEXT_PUBLIC_PRICE_GOOGLE_YEARLY"] || "3500",
    snapchatMonthly: process.env["NEXT_PUBLIC_PRICE_SNAPCHAT_MONTHLY"] || "350",
    snapchatYearly: process.env["NEXT_PUBLIC_PRICE_SNAPCHAT_YEARLY"] || "3500",
    allMonthly: process.env["NEXT_PUBLIC_PRICE_META_GOOGLE_SNAPCHAT_MONTHLY"] || "700",
    allYearly: process.env["NEXT_PUBLIC_PRICE_META_GOOGLE_SNAPCHAT_YEARLY"] || "7000",
  },
} as const;
