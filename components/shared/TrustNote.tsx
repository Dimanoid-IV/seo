"use client";

import { cn } from "@/lib/utils";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type TrustNoteVariant = "billing" | "ai" | "email" | "wordpress" | "info";

type TrustNoteProps = {
  variant?: TrustNoteVariant;
  className?: string;
  children?: React.ReactNode;
};

const VARIANT_STYLES: Record<TrustNoteVariant, string> = {
  billing: "border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-100/90",
  ai: "border-violet-500/15 bg-violet-500/[0.04] text-violet-100/90",
  email: "border-blue-500/15 bg-blue-500/[0.04] text-blue-100/90",
  wordpress: "border-cyan-500/15 bg-cyan-500/[0.04] text-cyan-100/90",
  info: "border-white/[0.08] bg-white/[0.025] text-slate-300",
};

export function TrustNote({
  variant = "info",
  className,
  children,
}: TrustNoteProps) {
  const { dict } = useSaasTranslations();
  const { trust } = dict;

  function defaultContent(): React.ReactNode {
    switch (variant) {
      case "billing":
        return (
          <>
            <p className="font-medium">{trust.billingCancelAnytime}</p>
            <p className="mt-1.5 opacity-90">{trust.billingDataAvailability}</p>
          </>
        );
      case "ai":
        return <p>{trust.aiDraftSafety}</p>;
      case "email":
        return <p>{trust.emailApprovalSafety}</p>;
      case "wordpress":
        return <p>{trust.wordpressDraftSafety}</p>;
      default:
        return null;
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 text-sm leading-relaxed",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {children ?? defaultContent()}
    </div>
  );
}
