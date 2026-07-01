import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import type { AutopilotNextStep } from "@/lib/autopilot/types";

type AutopilotNextStepsProps = {
  steps: AutopilotNextStep[];
};

export function AutopilotNextSteps({ steps }: AutopilotNextStepsProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="font-semibold text-white">Next steps</h3>
      <ul className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.title} className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <div>
              {step.href ? (
                <Link
                  href={step.href}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  {step.title}
                </Link>
              ) : (
                <p className="font-medium text-white">{step.title}</p>
              )}
              <p className="text-sm text-slate-400">{step.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
