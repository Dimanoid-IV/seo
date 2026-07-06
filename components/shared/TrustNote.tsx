import { cn } from "@/lib/utils";
import {
  AI_DRAFT_SAFETY_COPY,
  BILLING_CANCEL_ANYTIME_COPY,
  BILLING_DATA_AVAILABILITY_COPY,
  EMAIL_APPROVAL_SAFETY_COPY,
  WORDPRESS_DRAFT_SAFETY_COPY,
} from "@/lib/copy/trust";

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

function defaultContent(variant: TrustNoteVariant): React.ReactNode {
  switch (variant) {
    case "billing":
      return (
        <>
          <p className="font-medium">{BILLING_CANCEL_ANYTIME_COPY}</p>
          <p className="mt-1.5 opacity-90">{BILLING_DATA_AVAILABILITY_COPY}</p>
        </>
      );
    case "ai":
      return <p>{AI_DRAFT_SAFETY_COPY}</p>;
    case "email":
      return <p>{EMAIL_APPROVAL_SAFETY_COPY}</p>;
    case "wordpress":
      return <p>{WORDPRESS_DRAFT_SAFETY_COPY}</p>;
    default:
      return null;
  }
}

export function TrustNote({
  variant = "info",
  className,
  children,
}: TrustNoteProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 text-sm leading-relaxed",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {children ?? defaultContent(variant)}
    </div>
  );
}
