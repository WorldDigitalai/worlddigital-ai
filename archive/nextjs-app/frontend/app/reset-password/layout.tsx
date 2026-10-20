import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Set a New Password");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
