"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";

export type PACKAGE_ID =
  | "google_ads" | "meta_ads" | "snapchat_ads" | "tiktok_ads"
  | "linkedin_ads" | "youtube_shorts" | "x_ads"
  | "ai_seo" | "keyword_research" | "content_marketing"
  | "image_generator" | "reels_generator" | "enterprise";

export interface UserPlatform {
  connected: boolean;
  dailyBudget: number;
  status: "pending" | "connecting" | "live" | "error";
  postEnabled: boolean;
}

export interface DashboardUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  subscriptionStatus: "none" | "active" | "paused" | "cancelled";
  subscriptionPlan: string;
  package: PACKAGE_ID;
  businessName: string;
  businessURL: string;
  businessCategory: string;
  businessDescription: string;
  businessLocation: string;
  logoURL: string;
  primaryColor: string;
  secondaryColor: string;
  brandVoice: string;
  onboardingComplete: boolean;
  platforms: Record<string, UserPlatform>;
  notifications: Array<{ id: string; type: "success" | "info" | "warning" | "error"; title: string; subtitle: string; time: string; read: boolean }>;
  posts: any[];
  campaigns: any[];
}

interface UserContextValue {
  user: DashboardUser | null;
  loading: boolean;
  updateUser: (patch: Partial<DashboardUser>) => void;
  logout: () => void;
}

function planToPackage(plan: string): PACKAGE_ID {
  if (!plan || plan === "none") return "enterprise";
  if (plan.startsWith("meta-")) return "meta_ads";
  if (plan.startsWith("google-")) return "google_ads";
  if (plan.startsWith("snapchat-")) return "snapchat_ads";
  if (plan.startsWith("tiktok-")) return "tiktok_ads";
  if (plan.startsWith("linkedin-")) return "linkedin_ads";
  if (plan.startsWith("youtube-")) return "youtube_shorts";
  if (plan.startsWith("x-")) return "x_ads";
  if (plan.startsWith("auto-seo-")) return "ai_seo";
  if (plan.startsWith("keyword-")) return "keyword_research";
  if (plan.startsWith("content-marketing-")) return "content_marketing";
  if (plan.startsWith("image-generator-")) return "image_generator";
  if (plan.startsWith("reels-generator-")) return "reels_generator";
  if (plan.startsWith("all-")) return "enterprise";
  if (plan === "custom") return "enterprise";
  return "enterprise";
}

function getDefaultPlatforms(pkg: PACKAGE_ID): Record<string, UserPlatform> {
  const all: Record<string, UserPlatform> = {
    meta:        { connected: false, dailyBudget: 50, status: "pending", postEnabled: true },
    google:      { connected: false, dailyBudget: 50, status: "pending", postEnabled: true },
    snapchat:    { connected: false, dailyBudget: 50, status: "pending", postEnabled: true },
    tiktok:      { connected: false, dailyBudget: 50, status: "pending", postEnabled: true },
    linkedin:    { connected: false, dailyBudget: 50, status: "pending", postEnabled: true },
    youtube:     { connected: false, dailyBudget: 50, status: "pending", postEnabled: true },
    x:           { connected: false, dailyBudget: 50, status: "pending", postEnabled: true },
  };
  const limited: Record<string, UserPlatform> = {};
  const map: Record<PACKAGE_ID, string[]> = {
    google_ads:      ["google"],
    meta_ads:        ["meta"],
    snapchat_ads:    ["snapchat"],
    tiktok_ads:      ["tiktok"],
    linkedin_ads:    ["linkedin"],
    youtube_shorts:  ["youtube"],
    x_ads:           ["x"],
    ai_seo:          [],
    keyword_research:[],
    content_marketing:["meta","x","linkedin"],
    image_generator: ["meta","x","linkedin"],
    reels_generator: ["meta","tiktok","youtube"],
    enterprise:      Object.keys(all),
  };
  for (const k of map[pkg] ?? []) limited[k] = all[k];
  return limited;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wdai_token");
    if (!token) { setLoading(false); return; }
    api.auth.me().then((res) => {
      if (!res.ok) { setLoading(false); return; }
      const data = res.data as any;
      const pkg = planToPackage(data.subscriptionPlan || "all-monthly");
      const saved = localStorage.getItem("wd_onboarding");
      const savedBiz = saved ? JSON.parse(saved) : {};
      // Existing users (no onboarding data yet) should not be forced through onboarding
      const hasOnboardingData = !!saved;
      const onboardingComplete = hasOnboardingData
        ? (savedBiz.onboardingComplete || !!(savedBiz.businessName && savedBiz.businessName.trim()))
        : true;
      setUser({
        id: data.id,
        email: data.email,
        name: data.name || "",
        role: data.role || "user",
        subscriptionStatus: data.subscriptionStatus || "none",
        subscriptionPlan: data.subscriptionPlan || "all-monthly",
        package: pkg,
        businessName: savedBiz.businessName || data.name || "Demo Business",
        businessURL: savedBiz.businessURL || "https://",
        businessCategory: savedBiz.businessCategory || "",
        businessDescription: savedBiz.businessDescription || "",
        businessLocation: savedBiz.businessLocation || "",
        logoURL: savedBiz.logoURL || "",
        primaryColor: savedBiz.primaryColor || "#4285C7",
        secondaryColor: savedBiz.secondaryColor || "#C13A2A",
        brandVoice: savedBiz.brandVoice || "Professional & Trustworthy",
        onboardingComplete,
        platforms: savedBiz.platforms || getDefaultPlatforms(pkg),
        notifications: [],
        posts: [],
        campaigns: [],
      });
      setLoading(false);
    });
  }, []);

  const updateUser = (patch: Partial<DashboardUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...patch };
      localStorage.setItem("wd_onboarding", JSON.stringify({
        businessName: next.businessName,
        businessURL: next.businessURL,
        businessCategory: next.businessCategory,
        businessDescription: next.businessDescription,
        businessLocation: next.businessLocation,
        logoURL: next.logoURL,
        primaryColor: next.primaryColor,
        secondaryColor: next.secondaryColor,
        brandVoice: next.brandVoice,
        onboardingComplete: next.onboardingComplete,
        platforms: next.platforms,
      }));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("wdai_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}
