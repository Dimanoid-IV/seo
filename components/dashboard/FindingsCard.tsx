"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Finding = {
  title: string;
  description?: string;
  href?: string;
};

type FindingsCardProps = {
  findings: Finding[];
};

export function FindingsCard({ findings }: FindingsCardProps) {
  if (findings.length === 0) {
    return (
      <section className="glass-card p-6">
        <h3 className="text-base font-semibold text-white">
          What RankBoost found
        </h3>
        <p className="mt-3 text-sm text-slate-400">
          Your first growth activity will appear after an audit or integration
          sync.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-card p-6">
      <h3 className="text-base font-semibold text-white">
        What RankBoost found
      </h3>
      <ul className="mt-4 space-y-3">
        {findings.map((item, index) => (
          <li key={`${item.title}-${index}`} className="flex gap-2 text-sm">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
            <div className="min-w-0 flex-1">
              <p className="text-slate-200">{item.title}</p>
              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-1 inline-flex items-center gap-0.5 text-xs text-blue-300 hover:text-blue-200"
                >
                  View
                  <ChevronRight className="size-3" />
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
