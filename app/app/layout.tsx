import type { Metadata } from "next";

import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { DashboardOverviewProvider } from "@/components/dashboard/DashboardOverviewProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

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
  return (
    <AuthSessionProvider>
      <DashboardOverviewProvider>
        <div className="app-shell hero-grid min-h-dvh">
          <AppSidebar />
          <div className="app-main flex min-h-dvh flex-col items-stretch justify-start overflow-x-hidden lg:pl-64">
            <AppHeader />
            <div className="flex min-h-0 flex-1 flex-col justify-start">{children}</div>
          </div>
        </div>
      </DashboardOverviewProvider>
    </AuthSessionProvider>
  );
}
