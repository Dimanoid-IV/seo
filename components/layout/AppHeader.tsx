"use client";

import { useState } from "react";

import { PlanBadge, type PlanBadgeVariant } from "@/components/dashboard/PlanBadge";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, LogOut, Sparkles, User } from "lucide-react";

type AppHeaderProps = {
  siteName?: string;
};

function subscriptionToBadge(plan: string | undefined): PlanBadgeVariant {
  const normalized = plan?.toLowerCase();
  if (normalized === "start") return "start";
  if (normalized === "growth") return "growth";
  if (normalized === "pro") return "pro";
  if (normalized === "partner") return "partner";
  return "demo";
}

export function AppHeader({ siteName = "beautystudio.ee" }: AppHeaderProps) {
  const { user, organization, subscription, loading, logout } = useAuthSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const displaySiteName = organization?.name ?? siteName;
  const planVariant = subscription
    ? subscriptionToBadge(subscription.plan)
    : "demo";
  const planLabel =
    subscription?.plan?.toUpperCase() ?? (loading ? undefined : "Demo");

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 lg:hidden">
            <Sparkles className="size-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Globe className="hidden size-4 shrink-0 text-slate-500 sm:block" />
              <h1 className="truncate text-base font-semibold text-white sm:text-lg">
                {displaySiteName}
              </h1>
              <PlanBadge
                variant={planVariant}
                label={planLabel}
              />
            </div>
            <p className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              {loading ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Загрузка профиля…
                </>
              ) : user ? (
                <>
                  <User className="size-3" />
                  {user.name ? `${user.name} · ` : ""}
                  {user.email}
                </>
              ) : (
                "Демо-превью кабинета · статические данные"
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Выйти
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:from-blue-600 hover:to-violet-700"
            aria-label="Upgrade — скоро"
            disabled
          >
            Upgrade
          </Button>
        </div>
      </div>
    </header>
  );
}
