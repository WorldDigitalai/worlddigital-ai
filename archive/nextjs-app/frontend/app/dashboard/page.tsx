"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, type PACKAGE_ID } from "@/context/UserContext";

const PACKAGE_ROUTES: Record<PACKAGE_ID, string> = {
  google_ads: "/dashboard/google-ads",
  meta_ads: "/dashboard/meta-ads",
  snapchat_ads: "/dashboard/snapchat-ads",
  tiktok_ads: "/dashboard/tiktok-ads",
  linkedin_ads: "/dashboard/linkedin-ads",
  youtube_shorts: "/dashboard/youtube-shorts",
  x_ads: "/dashboard/x-ads",
  ai_seo: "/dashboard/seo",
  keyword_research: "/dashboard/keyword-research",
  content_marketing: "/dashboard/content-marketing",
  image_generator: "/dashboard/image-generator",
  reels_generator: "/dashboard/reels-generator",
  enterprise: "/dashboard/overview",
};

export default function DashboardRouterPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (!user.onboardingComplete) {
      router.replace("/dashboard/onboarding");
      return;
    }
    const dest = PACKAGE_ROUTES[user.package] || "/dashboard/overview";
    router.replace(dest);
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F1F5F9" }}>
      <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
