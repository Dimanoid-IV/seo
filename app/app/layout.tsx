import type { Metadata } from "next";

import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "RankBoost SaaS dashboard — demo preview",
  robots: { index: false, follow: false },
};

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthSessionProvider>
      <div className="app-shell hero-grid min-h-screen bg-[#050816]">
        <AppSidebar />
        <div className="app-main flex min-h-screen flex-col lg:pl-64">
          <AppHeader siteName="beautystudio.ee" />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
