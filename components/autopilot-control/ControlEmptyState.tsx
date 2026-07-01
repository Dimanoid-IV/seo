import { Gauge } from "lucide-react";

type ControlEmptyStateProps = {
  variant: "no-website" | "no-data" | "no-approvals" | "no-activity";
};

const COPY: Record<
  ControlEmptyStateProps["variant"],
  { title: string; description: string }
> = {
  "no-website": {
    title: "Add a website to start tracking growth opportunities",
    description: "Add your website to use the Control Center and review RankBoost actions.",
  },
  "no-data": {
    title: "RankBoost needs more data before it can manage growth actions",
    description:
      "Run an audit or connect Google Search Console so RankBoost can prepare growth actions.",
  },
  "no-approvals": {
    title: "Nothing needs review right now",
    description:
      "RankBoost is monitoring your website and will surface new actions here when they are ready.",
  },
  "no-activity": {
    title: "No recent activity",
    description:
      "No recent activity yet. Run an audit or connect integrations to start building your growth timeline.",
  },
};

export function ControlEmptyState({ variant }: ControlEmptyStateProps) {
  const copy = COPY[variant];

  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
      <Gauge className="mx-auto mb-3 size-8 text-slate-500" />
      <h3 className="font-medium text-white">{copy.title}</h3>
      <p className="mt-1 text-sm text-slate-400">{copy.description}</p>
    </div>
  );
}
