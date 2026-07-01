import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "text-2xl font-bold text-white sm:text-3xl",
            eyebrow && "mt-1"
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
