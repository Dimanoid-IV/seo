"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type Finding = {
  title: string;
  description?: string;
  href?: string;
};

type FindingsCardProps = {
  findings: Finding[];
};

export function FindingsCard({ findings }: FindingsCardProps) {
  const { dict } = useSaasTranslations();
  const { findings: copy } = dict.dashboard;

  if (findings.length === 0) {
    return (
      <SaasCard>
        <SaasSectionHeader title={copy.title} subtitle={copy.empty} />
      </SaasCard>
    );
  }

  return (
    <SaasCard>
      <SaasSectionHeader title={copy.title} />
      <ul className="space-y-1">
        {findings.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            className="flex gap-3 rounded-xl px-3 py-3 transition hover:bg-white"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-400/90" />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-slate-700">
                {item.title}
              </p>
              {item.description ? (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {item.description}
                </p>
              ) : null}
              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-blue-300 transition hover:text-blue-200"
                >
                  {copy.viewDetails}
                  <ChevronRight className="size-3" />
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </SaasCard>
  );
}
