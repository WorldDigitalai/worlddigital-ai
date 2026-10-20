import type { Metadata } from "next";
import { SITE_NAME, pageMetadata } from "@/lib/seo";

// Applies to the /blog index. Individual posts override this with their own
// metadata. The title template is restated here so post titles keep the
// " | WorldDigital.ai" suffix.
const base = pageMetadata({
  title: "Blog — Ads, Social Media & AI SEO Guides",
  description:
    "Practical guides on Google Ads, Meta, TikTok, Snapchat and YouTube Shorts advertising, plus AI marketing automation and SEO, for SMBs, SMEs and enterprise marketers.",
  path: "/blog",
});

export const metadata: Metadata = {
  ...base,
  title: { absolute: `${base.title as string} | ${SITE_NAME}`, template: `%s | ${SITE_NAME}` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
