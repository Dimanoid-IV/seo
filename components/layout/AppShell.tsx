"use client";

import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { BillingSubscriptionProvider } from "@/components/billing/BillingSubscriptionProvider";
import { AdvancedSectionBanner } from "@/components/dashboard/AdvancedSectionBanner";
import { DashboardModeProvider } from "@/components/dashboard/DashboardModeProvider";
import { DashboardOverviewProvider } from "@/components/dashboard/DashboardOverviewProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <BillingSubscriptionProvider>
        <DashboardOverviewProvider>
          <DashboardModeProvider>
            <div className="app-shell hero-grid min-h-dvh">
              <AppSidebar />
              <div className="app-main flex min-h-dvh flex-col items-stretch justify-start overflow-x-hidden lg:pl-64">
                <AppHeader />
                <AdvancedSectionBanner />
                <div className="flex min-h-0 flex-1 flex-col justify-start">
                  {children}
                </div>
              </div>
            </div>
          </DashboardModeProvider>
        </DashboardOverviewProvider>
      </BillingSubscriptionProvider>
    </AuthSessionProvider>
  );
}
