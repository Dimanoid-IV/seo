import type { UsageSummaryViewModel } from "@/lib/billing/types";

type UsageLimitsCardProps = {
  usage: UsageSummaryViewModel;
};

export function UsageLimitsCard({ usage }: UsageLimitsCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-lg font-semibold text-white">Usage this month</h2>
      <p className="mt-1 text-sm text-slate-400">Period: {usage.month}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {usage.items.map((item) => {
          const ratio =
            item.limit > 0 ? Math.min(item.current / item.limit, 1) : 0;

          return (
            <div
              key={item.key}
              className="rounded-xl border border-white/10 bg-[#0a0f1e]/60 p-3"
            >
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-300">{item.label}</span>
                <span className="font-medium text-white">
                  {item.current} / {item.limit}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
