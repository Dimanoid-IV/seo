import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

type AutopilotEmptyStateProps = {
  variant: "no-website" | "no-data" | "no-plan";
};

const COPY: Record<
  AutopilotEmptyStateProps["variant"],
  { title: string; description: string; action?: { label: string; href: string } }
> = {
  "no-website": {
    title: "Add a website first",
    description: "Add a website to generate your monthly growth plan.",
  },
  "no-data": {
    title: "More growth data needed",
    description:
      "RankBoost needs growth data before creating a useful monthly plan. Run an audit or connect Google Search Console first.",
    action: { label: "Open integrations", href: "/app/integrations" },
  },
  "no-plan": {
    title: "No monthly plan yet",
    description:
      "Generate a plan to let RankBoost organize this month's SEO, content, and social growth actions.",
  },
};

export function AutopilotEmptyState({ variant }: AutopilotEmptyStateProps) {
  const copy = COPY[variant];

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-violet-500/10">
        {variant === "no-plan" ? (
          <Sparkles className="size-7 text-violet-400" />
        ) : (
          <CalendarDays className="size-7 text-slate-400" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-white">{copy.title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">{copy.description}</p>
      {copy.action ? (
        <Link
          href={copy.action.href}
          className="mt-6 text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          {copy.action.label}
        </Link>
      ) : null}
    </div>
  );
}
