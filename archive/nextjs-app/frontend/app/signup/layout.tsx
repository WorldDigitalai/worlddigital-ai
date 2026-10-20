import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Create Your Account");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
