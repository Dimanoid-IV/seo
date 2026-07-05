"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type PreparedForYouCardProps = {
  monthlyPlanStatus?: string;
  articleDraftsCount: number;
  socialPostsCount: number;
  emailApprovalsCount: number;
};

function formatPlanStatus(status?: string): string {
  if (!status) {
    return "Not created";
  }
  if (status === "approved" || status === "APPROVED") {
    return "Approved";
  }
  if (status === "ready" || status === "READY") {
    return "Ready";
  }
  return "Draft";
}

export function PreparedForYouCard({
  monthlyPlanStatus,
  articleDraftsCount,
  socialPostsCount,
  emailApprovalsCount,
}: PreparedForYouCardProps) {
  const rows = [
    { label: "Monthly plan", value: formatPlanStatus(monthlyPlanStatus) },
    { label: "Article drafts", value: String(articleDraftsCount) },
    { label: "Social posts", value: String(socialPostsCount) },
    { label: "Emails", value: String(emailApprovalsCount) },
  ];

  return (
    <section className="glass-card p-6">
      <h3 className="text-base font-semibold text-white">Prepared for you</h3>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <dt className="text-slate-400">{row.label}</dt>
            <dd className="font-medium text-slate-200">{row.value}</dd>
          </div>
        ))}
      </dl>
      <Link
        href="/app/autopilot-control"
        className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-blue-300 hover:text-blue-200"
      >
        Open Control Center
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
