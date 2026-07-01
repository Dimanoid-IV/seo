"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  ListTodo,
  Menu,
  Plug,
  Rocket,
  Mail,
  Gauge,
  Settings,
  Share2,
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
import { OnboardingSidebarLink } from "@/components/onboarding/OnboardingSidebarLink";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
};

const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/app/autopilot-control", label: "Control Center", icon: Gauge, enabled: true },
  { href: "/app/timeline", label: "Timeline", icon: History, enabled: true },
  { href: "/app/tasks", label: "Growth Tasks", icon: ListTodo, enabled: false },
  { href: "/app/content-plan", label: "Content Plan", icon: FileText, enabled: true },
  { href: "/app/social-posts", label: "Social Posts", icon: Share2, enabled: true },
  { href: "/app/autopilot", label: "Autopilot", icon: Rocket, enabled: true },
  { href: "/app/email-approvals", label: "Email Approvals", icon: Mail, enabled: true },
  { href: "/app/reports", label: "Reports", icon: BarChart3, enabled: true },
  { href: "/app/integrations", label: "Integrations", icon: Plug, enabled: true },
  { href: "/app/billing", label: "Billing", icon: CreditCard, enabled: true },
  { href: "/app/settings", label: "Settings", icon: Settings, enabled: false },
];

const mobilePrimary = navItems.slice(0, 4);
const mobileMore = navItems.slice(4);

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

function NavLink({
  item,
  pathname,
  compact,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  const className = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    compact && "flex-col gap-1 px-2 py-2 text-[10px]",
    active
      ? "bg-primary/15 text-primary-foreground"
      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
    !item.enabled && "pointer-events-none opacity-40"
  );

  if (!item.enabled) {
    return (
      <span className={className} title="Скоро">
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

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="app-sidebar hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        <div className="flex h-full flex-col border-r border-white/10 bg-[#0a0f1e]/95 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">RankBoost</p>
              <p className="text-[10px] text-slate-500">SaaS Dashboard</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            <OnboardingSidebarLink />
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <p className="text-xs text-slate-500">RankBoost SaaS</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-white/10 bg-[#0a0f1e]/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Основная навигация"
      >
        {mobilePrimary.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="size-5" />
              <span className="text-[10px] leading-tight">{item.label.split(" ")[0]}</span>
            </>
          );

          const itemClass = cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            active ? "text-blue-400" : "text-slate-500",
            !item.enabled && "opacity-40"
          );

          if (!item.enabled) {
            return (
              <span key={item.href} className={itemClass} title="Скоро">
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
            <span className="leading-tight">Ещё</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl border-white/10 bg-[#0a0f1e]">
            <SheetHeader>
              <SheetTitle className="text-white">Меню</SheetTitle>
            </SheetHeader>
            <div className="grid gap-1 px-2 pb-6">
              {mobileMore.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
