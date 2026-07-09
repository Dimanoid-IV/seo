import { cn } from "@/lib/utils";

export type SaasCardVariant =
  | "default"
  | "hero"
  | "primary"
  | "metric"
  | "muted"
  | "success";

const VARIANT_CLASS: Record<SaasCardVariant, string> = {
  default: "saas-card",
  hero: "saas-card-hero",
  primary: "saas-card-primary",
  metric: "saas-card-metric",
  muted: "saas-card-muted",
  success: "saas-card-success",
};

type SaasCardProps = React.ComponentPropsWithoutRef<"section"> & {
  variant?: SaasCardVariant;
};

export function SaasCard({
  variant = "default",
  className,
  children,
  ...props
}: SaasCardProps) {
  return (
    <section className={cn(VARIANT_CLASS[variant], className)} {...props}>
      {children}
    </section>
  );
}

type SaasSectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
};

export function SaasSectionHeader({
  title,
  subtitle,
  action,
  className,
}: SaasSectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap items-start justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
