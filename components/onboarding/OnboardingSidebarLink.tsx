"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";

import { useOnboarding } from "@/components/onboarding/useOnboarding";
import { cn } from "@/lib/utils";

export function OnboardingSidebarLink() {
  const pathname = usePathname();
  const { data, loading } = useOnboarding();

  if (loading || !data?.shouldShowSetup || data.status === "COMPLETED") {
    return null;
  }

  const active = pathname.startsWith("/app/onboarding");

  return (
    <Link
      href="/app/onboarding"
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary-foreground"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      <Compass className="size-5 shrink-0" />
      <span>Setup</span>
    </Link>
  );
}
