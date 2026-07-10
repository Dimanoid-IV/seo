"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { DashboardModeToggle } from "@/components/dashboard/DashboardModeToggle";
import { useDashboardMode } from "@/components/dashboard/DashboardModeProvider";
import { OnboardingSidebarLink } from "@/components/onboarding/OnboardingSidebarLink";
import {
  APP_NAV_ITEMS,
  filterNavItemsForMode,
  groupNavItems,
  NAV_GROUP_ORDER,
  type AppNavItemConfig,
} from "@/lib/app/nav-config";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

function NavLink({
  item,
  label,
  pathname,
  compact,
  onNavigate,
  comingSoonLabel,
}: {
  item: AppNavItemConfig;
  label: string;
  pathname: string;
  compact?: boolean;
  onNavigate?: () => void;
  comingSoonLabel: string;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  const className = cn(
    "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
    compact && "flex-col gap-1 px-2 py-2.5 text-[10px]",
    active
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100 shadow-sm"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    !item.enabled && "pointer-events-none opacity-40"
  );

  if (!item.enabled) {
    return (
      <span className={className} title={comingSoonLabel}>
        <Icon className={cn("size-5 shrink-0", compact && "size-5")} />
        <span className={cn(compact && "leading-tight")}>{label}</span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      <Icon className={cn("size-5 shrink-0", compact && "size-5")} />
      <span className={cn(compact && "leading-tight")}>{label}</span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { dict } = useSaasTranslations();
  const { nav } = dict;
  const { mode } = useDashboardMode();

  const visibleItems = filterNavItemsForMode(APP_NAV_ITEMS, mode);
  const grouped = groupNavItems(visibleItems);

  const mobilePrimaryHrefs = [
    "/app",
    "/app/content-plan",
    "/app/integrations",
    "/app/billing",
  ];
  const mobilePrimary = mobilePrimaryHrefs
    .map((href) => visibleItems.find((item) => item.href === href))
    .filter((item): item is AppNavItemConfig => Boolean(item));
  const mobileMore = visibleItems.filter(
    (item) => !mobilePrimary.some((primary) => primary.href === item.href)
  );

  function labelFor(item: AppNavItemConfig): string {
    return nav[item.id];
  }

  return (
    <>
      <aside className="app-sidebar hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        <div className="flex h-full flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.35)]">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">RankBoost</p>
              <p className="text-[11px] text-slate-500">{nav.brandSubtitle}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-5">
            <OnboardingSidebarLink />
            {NAV_GROUP_ORDER.map((groupKey) => {
              const items = grouped.get(groupKey);
              if (!items?.length) {
                return null;
              }

              return (
                <div key={groupKey}>
                  <p className="mb-3 px-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {nav.groups[groupKey]}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        label={labelFor(item)}
                        pathname={pathname}
                        comingSoonLabel={nav.comingSoon}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-slate-200 px-5 py-5">
            <DashboardModeToggle />
            <LanguageSwitcher className="w-full justify-between" />
            <p className="text-xs leading-relaxed text-slate-500">{nav.trustFooter}</p>
          </div>
        </div>
      </aside>

      <nav
        className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label={nav.menu}
      >
        {mobilePrimary.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const shortLabel = labelFor(item).split(" ")[0];
          const content = (
            <>
              <Icon className="size-5" />
              <span className="text-[10px] leading-tight">{shortLabel}</span>
            </>
          );

          const itemClass = cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
            active ? "text-blue-600" : "text-slate-500",
            !item.enabled && "opacity-40"
          );

          if (!item.enabled) {
            return (
              <span key={item.href} className={itemClass} title={nav.comingSoon}>
                {content}
              </span>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={itemClass}>
              {content}
            </Link>
          );
        })}

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                className="flex h-auto flex-1 flex-col items-center justify-center gap-0.5 rounded-none py-2 text-[10px] font-medium text-slate-500 hover:bg-transparent hover:text-slate-700"
              />
            }
          >
            <Menu className="size-5" />
            <span className="leading-tight">{nav.more}</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl border-slate-200 bg-white"
          >
            <SheetHeader>
              <SheetTitle className="text-slate-900">{nav.menu}</SheetTitle>
            </SheetHeader>
            <div className="mb-4 space-y-4 px-2">
              <DashboardModeToggle />
              <LanguageSwitcher className="w-full justify-between" />
            </div>
            <div className="grid gap-1 px-2 pb-6">
              {mobileMore.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  label={labelFor(item)}
                  pathname={pathname}
                  comingSoonLabel={nav.comingSoon}
                />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
