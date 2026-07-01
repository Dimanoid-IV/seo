import { cn } from "@/lib/utils";

type ContentPlanSectionProps = {
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
};

export function ContentPlanSection({
  title,
  description,
  count,
  children,
  className,
}: ContentPlanSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          ) : null}
        </div>
        {count != null ? (
          <span className="text-xs text-slate-500">{count} элементов</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
