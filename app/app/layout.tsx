import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "RankBoost SaaS dashboard",
  robots: { index: false, follow: false },
};

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
