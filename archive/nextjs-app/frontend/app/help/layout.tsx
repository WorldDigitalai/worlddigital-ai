import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Help Center — Getting Started, Billing & Ad Platform FAQs",
  description:
    "Answers on getting started, supported ad platforms, connecting ad accounts, setup time, billing and your account. Can't find it? Contact support@worlddigital.ai.",
  path: "/help",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
