"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import AIGrowthOperator from "./ai/AIGrowthOperator";

const AUTH_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "?")
  );
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (isAuth || isAdmin || isDashboard) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <AIGrowthOperator />
    </>
  );
}
