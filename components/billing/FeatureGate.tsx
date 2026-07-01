"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type FeatureGateProps = {
  blocked: boolean;
  reason?: string;
  upgradeHref?: string;
  className?: string;
  children: React.ReactNode;
};

export function FeatureGate({
  blocked,
  reason = "Upgrade required",
  upgradeHref = "/app/billing",
  className,
  children,
}: FeatureGateProps) {
  if (!blocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="pointer-events-none opacity-50">{children}</div>
      <p className="text-xs text-amber-300">
        {reason}{" "}
        <Link href={upgradeHref} className="underline hover:text-amber-200">
          View plans
        </Link>
      </p>
    </div>
  );
}
