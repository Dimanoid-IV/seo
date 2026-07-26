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
          ? "border-[#c9bfff]/55 bg-[#c9bfff]/20 text-[#6d4ff0]"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#c9bfff]/55 hover:text-slate-900"
      )}
    >
      <Sparkles className="size-4 shrink-0" />
      {dict.nav.setup}
    </Link>
  );
}
