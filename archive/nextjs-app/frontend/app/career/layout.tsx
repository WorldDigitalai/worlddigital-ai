import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Careers — Join the Team Building AI Marketing for SMBs",
  description:
    "Work remotely with flexible hours, competitive pay and real growth. Explore open roles at WorldDigital.ai and help small businesses grow with AI.",
  path: "/career",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
