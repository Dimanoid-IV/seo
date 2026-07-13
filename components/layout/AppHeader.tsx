"use client";

import Link from "next/link";
import { useState } from "react";

import { useBillingSubscription } from "@/components/billing/BillingSubscriptionProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { DashboardModeToggle } from "@/components/dashboard/DashboardModeToggle";
import { PlanBadge } from "@/components/dashboard/PlanBadge";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { useDashboardOverview } from "@/components/dashboard/DashboardOverviewProvider";
import { Button } from "@/components/ui/button";
import { billingPlanToBadgeVariant } from "@/lib/billing/plan-badge";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { Globe, Loader2, LogOut, Sparkles, User } from "lucide-react";

function formatWebsiteLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function AppHeaderContent() {
  const { dict } = useSaasTranslations();
  const { user, loading, logout } = useAuthSession();
  const { overview, loading: overviewLoading } = useDashboardOverview();
  const { subscription: billingSubscription, loading: billingPlanLoading } =
    useBillingSubscription();
  const [loggingOut, setLoggingOut] = useState(false);

  const headerTitle = overview?.website
    ? overview.website.displayName ?? formatWebsiteLabel(overview.website.url)
    : overviewLoading
      ? dict.common.loading
      : "RankBoost";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 lg:hidden">
            <Sparkles className="size-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Globe className="hidden size-4 shrink-0 text-slate-400 sm:block" />
              <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                {headerTitle}
              </h1>
              {billingPlanLoading ? (
                <span className="inline-flex h-6 min-w-14 animate-pulse rounded-full bg-slate-200" />
              ) : billingSubscription ? (
                <PlanBadge
                  variant={billingPlanToBadgeVariant(billingSubscription.plan)}
                  label={billingSubscription.planLabel}
                />
              ) : null}
            </div>
            <p className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              {loading ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  {dict.header.loadingProfile}
                </>
              ) : user ? (
                <>
                  <User className="size-3" />
                  {user.name ? `${user.name} · ` : ""}
                  {user.email}
                  {overview?.website ? (
                    <>
                      {" · "}
                      <span className="truncate">{overview.website.url}</span>
                    </>
                  ) : null}
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="hidden md:block">
            <DashboardModeToggle compact showHelper={false} className="min-w-[220px]" />
          </div>
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            {dict.header.logout}
          </Button>
          <Button
            render={<Link href="/app/billing" />}
            nativeButton={false}
            type="button"
            size="sm"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 text-white shadow-[0_4px_16px_-6px_rgba(59,130,246,0.4)] hover:from-blue-600 hover:to-violet-700"
          >
            {dict.header.upgradePlan}
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AppHeader() {
  return <AppHeaderContent />;
}
