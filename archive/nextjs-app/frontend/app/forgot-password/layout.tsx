import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Reset Your Password");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
