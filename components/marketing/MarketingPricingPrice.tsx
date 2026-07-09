import { cn } from "@/lib/utils";

type MarketingPricingPriceProps = {
  amount: string;
  period?: string;
  className?: string;
};

export function MarketingPricingPrice({
  amount,
  period,
  className,
}: MarketingPricingPriceProps) {
  return (
    <div className={cn("mt-4 flex items-end gap-1", className)}>
      <span className="text-4xl font-semibold tracking-tight text-slate-950">
        {amount}
      </span>
      {period ? (
        <span className="pb-1 text-sm font-medium text-slate-500">{period}</span>
      ) : null}
    </div>
  );
}
