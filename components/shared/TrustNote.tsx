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
  billing: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ai: "border-violet-200 bg-violet-50 text-violet-800",
  email: "border-[#c9bfff]/55 bg-[#c9bfff]/20 text-[#6d4ff0]",
  wordpress: "border-[#c9bfff]/55 bg-[#c9bfff]/20 text-[#6d4ff0]",
  info: "border-slate-200 bg-slate-50 text-slate-700",
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
