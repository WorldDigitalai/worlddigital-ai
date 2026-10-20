"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRoot() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("wdai_admin_token");
    router.replace(token ? "/admin/overview" : "/admin/overview");
  }, [router]);
  return null;
}
