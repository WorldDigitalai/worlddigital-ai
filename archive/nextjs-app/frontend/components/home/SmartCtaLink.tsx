"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SmartCtaLinkProps {
  /** href used when visitor is not logged in */
  guestHref: string;
  /** href used when visitor IS logged in (defaults to /dashboard) */
  authedHref?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Smart CTA link for public pages.
 * - Logged-out visitors → guestHref (usually /subscribe)
 * - Logged-in visitors  → authedHref (usually /dashboard)
 *
 * Uses localStorage to detect auth state client-side with no flash after hydration.
 */
export function SmartCtaLink({
  guestHref,
  authedHref = "/dashboard",
  className,
  style,
  children,
}: SmartCtaLinkProps) {
  const [href, setHref] = useState(guestHref);

  useEffect(() => {
    try {
      const token = localStorage.getItem("wdai_token");
      if (token) setHref(authedHref);
    } catch {
      // localStorage unavailable — keep guestHref
    }
  }, [authedHref]);

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
