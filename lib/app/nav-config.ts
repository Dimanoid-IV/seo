import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardCheck,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  ListTodo,
  Mail,
  Plug,
  Rocket,
  Gauge,
  Settings,
  Share2,
} from "lucide-react";

import type { SaasDictionary } from "@/lib/i18n/saas/types";

export type NavItemId = keyof Pick<
  SaasDictionary["nav"],
  | "dashboard"
  | "controlCenter"
  | "tasks"
  | "review"
  | "contentPlan"
  | "socialPosts"
  | "reports"
  | "timeline"
  | "growthPlan"
  | "reviewEmails"
  | "integrations"
  | "billing"
  | "settings"
>;

export type NavGroupKey = keyof SaasDictionary["nav"]["groups"];

export type AppNavItemConfig = {
  id: NavItemId;
  href: string;
  group: NavGroupKey;
  icon: LucideIcon;
  enabled: boolean;
  advanced: boolean;
};

export const APP_NAV_ITEMS: AppNavItemConfig[] = [
  {
    id: "dashboard",
    href: "/app",
    group: "main",
    icon: LayoutDashboard,
    enabled: true,
    advanced: false,
  },
  {
    id: "controlCenter",
    href: "/app/autopilot-control",
    group: "main",
    icon: Gauge,
    enabled: true,
    advanced: true,
  },
  {
    id: "tasks",
    href: "/app/tasks",
    group: "main",
    icon: ListTodo,
    enabled: true,
    advanced: false,
  },
  {
    id: "review",
    href: "/app/review",
    group: "main",
    icon: ClipboardCheck,
    enabled: true,
    advanced: false,
  },
  {
    id: "contentPlan",
    href: "/app/content-plan",
    group: "growth",
    icon: FileText,
    enabled: true,
    advanced: false,
  },
  {
    id: "socialPosts",
    href: "/app/social-posts",
    group: "growth",
    icon: Share2,
    enabled: true,
    advanced: true,
  },
  {
    id: "reports",
    href: "/app/reports",
    group: "growth",
    icon: BarChart3,
    enabled: true,
    advanced: true,
  },
  {
    id: "timeline",
    href: "/app/timeline",
    group: "automation",
    icon: History,
    enabled: true,
    advanced: true,
  },
  {
    id: "growthPlan",
    href: "/app/autopilot",
    group: "automation",
    icon: Rocket,
    enabled: true,
    advanced: true,
  },
  {
    id: "reviewEmails",
    href: "/app/email-approvals",
    group: "automation",
    icon: Mail,
    enabled: true,
    advanced: true,
  },
  {
    id: "integrations",
    href: "/app/integrations",
    group: "settings",
    icon: Plug,
    enabled: true,
    advanced: false,
  },
  {
    id: "billing",
    href: "/app/billing",
    group: "settings",
    icon: CreditCard,
    enabled: true,
    advanced: false,
  },
  {
    id: "settings",
    href: "/app/settings",
    group: "settings",
    icon: Settings,
    enabled: false,
    advanced: false,
  },
];

export function filterNavItemsForMode(
  items: AppNavItemConfig[],
  mode: "simple" | "advanced"
): AppNavItemConfig[] {
  if (mode === "advanced") {
    return items;
  }

  return items.filter((item) => !item.advanced);
}

export function groupNavItems(items: AppNavItemConfig[]): Map<NavGroupKey, AppNavItemConfig[]> {
  const groups = new Map<NavGroupKey, AppNavItemConfig[]>();

  for (const item of items) {
    const existing = groups.get(item.group) ?? [];
    existing.push(item);
    groups.set(item.group, existing);
  }

  return groups;
}

export const NAV_GROUP_ORDER: NavGroupKey[] = [
  "main",
  "growth",
  "automation",
  "settings",
];
