import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Enterprise AI Marketing for Agencies & Multi-Location Brands",
  description:
    "Run Google, Meta, TikTok, Snapchat, LinkedIn and X campaigns for every brand or location from one AI platform. See what you could save versus your current agency or tools.",
  path: "/enterprise",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
