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
}: {
  item: AppNavItemConfig;
  label: string;
  pathname: string;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  const className = cn(
    "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
    compact && "flex-col gap-1 px-2 py-2.5 text-[10px]",
    active
      ? "bg-[#c9bfff]/25 text-[#6d4ff0] ring-1 ring-[#c9bfff]/45"
      : "text-[#555555] hover:bg-black/[0.04] hover:text-[#181818]",
  );

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
    "/app/publication-calendar",
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
        <div className="flex h-full flex-col border-r border-[#999999]/25 bg-white/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#8169ff]">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <p className="font-[var(--font-gilroy)] text-sm font-bold tracking-normal text-black">RankBoost</p>
              <p className="text-[11px] text-[#555555]">{nav.brandSubtitle}</p>
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
                  <p className="mb-3 px-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">
                    {nav.groups[groupKey]}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        label={labelFor(item)}
                        pathname={pathname}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-[#999999]/25 px-5 py-5">
            <DashboardModeToggle />
            <LanguageSwitcher className="w-full justify-between" />
            <p className="text-xs leading-relaxed text-[#555555]">{nav.trustFooter}</p>
          </div>
        </div>
      </aside>

      <nav
        className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-[#999999]/25 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
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
            active ? "text-[#8169ff]" : "text-[#555555]",
          );

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
                />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
