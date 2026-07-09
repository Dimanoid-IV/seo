"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  Menu,
  Plug,
  Sparkles,
} from "lucide-react";
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
import { OnboardingSidebarLink } from "@/components/onboarding/OnboardingSidebarLink";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

function NavLink({
  item,
  pathname,
  compact,
  onNavigate,
  comingSoonLabel,
}: {
  item: NavItem;
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
      ? "bg-white/[0.08] text-white ring-1 ring-white/10 shadow-[0_4px_16px_-8px_rgba(59,130,246,0.35)]"
      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
    !item.enabled && "pointer-events-none opacity-40"
  );

  if (!item.enabled) {
    return (
      <span className={className} title={comingSoonLabel}>
        <Icon className={cn("size-5 shrink-0", compact && "size-5")} />
        <span className={cn(compact && "leading-tight")}>{item.label}</span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      <Icon className={cn("size-5 shrink-0", compact && "size-5")} />
      <span className={cn(compact && "leading-tight")}>{item.label}</span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { dict } = useSaasTranslations();
  const { nav } = dict;

  const navGroups: NavGroup[] = [
    {
      title: nav.groups.main,
      items: [
        { href: "/app", label: nav.dashboard, icon: LayoutDashboard, enabled: true },
      ],
    },
    {
      title: nav.groups.settings,
      items: [
        {
          href: "/app/integrations",
          label: nav.integrations,
          icon: Plug,
          enabled: true,
        },
        { href: "/app/billing", label: nav.billing, icon: CreditCard, enabled: true },
      ],
    },
  ];

  const flatNavItems = navGroups.flatMap((group) => group.items);
  const mobilePrimary = [
    flatNavItems.find((i) => i.href === "/app")!,
    flatNavItems.find((i) => i.href === "/app/billing")!,
  ];
  const mobileMore = flatNavItems.filter(
    (item) => !mobilePrimary.some((primary) => primary.href === item.href)
  );

  return (
    <>
      <aside className="app-sidebar hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#0a0f1e]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-6">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.45)]">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">RankBoost</p>
              <p className="text-[11px] text-slate-500">{nav.brandSubtitle}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-5">
            <OnboardingSidebarLink />
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-3 px-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {group.title}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      comingSoonLabel={nav.comingSoon}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="space-y-3 border-t border-white/[0.06] px-5 py-5">
            <LanguageSwitcher className="w-full justify-between" />
            <p className="text-xs leading-relaxed text-slate-500">{nav.trustFooter}</p>
          </div>
        </div>
      </aside>

      <nav
        className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-white/[0.06] bg-[#0a0f1e]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label={nav.menu}
      >
        {mobilePrimary.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const shortLabel = item.label.split(" ")[0];
          const content = (
            <>
              <Icon className="size-5" />
              <span className="text-[10px] leading-tight">{shortLabel}</span>
            </>
          );

          const itemClass = cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
            active ? "text-blue-300" : "text-slate-500",
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
                className="flex h-auto flex-1 flex-col items-center justify-center gap-0.5 rounded-none py-2 text-[10px] font-medium text-slate-500 hover:bg-transparent hover:text-slate-300"
              />
            }
          >
            <Menu className="size-5" />
            <span className="leading-tight">{nav.more}</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl border-white/10 bg-[#0a0f1e]">
            <SheetHeader>
              <SheetTitle className="text-white">{nav.menu}</SheetTitle>
            </SheetHeader>
            <div className="mb-4 px-2">
              <LanguageSwitcher className="w-full justify-between" />
            </div>
            <div className="grid gap-1 px-2 pb-6">
              {mobileMore.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
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
