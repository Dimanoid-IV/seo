"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

export function OnboardingSidebarLink() {
  const pathname = usePathname();
  const { dict } = useSaasTranslations();
  const active = pathname.startsWith("/app/onboarding");

  return (
    <Link
      href="/app/onboarding"
      className={cn(
        "mb-2 flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition-all",
        active
          ? "border-blue-500/30 bg-blue-500/10 text-blue-200"
          : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-slate-200"
      )}
    >
      <Sparkles className="size-4 shrink-0" />
      {dict.nav.setup}
    </Link>
  );
}
