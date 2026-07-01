import { Mail } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

type EmailApprovalEmptyStateProps = {
  variant: "no-website" | "no-emails" | "no-data";
};

const COPY: Record<
  EmailApprovalEmptyStateProps["variant"],
  { title: string; description: string }
> = {
  "no-website": {
    title: "Add a website to start tracking growth opportunities",
    description: "Add your website to prepare review emails from your growth plan and drafts.",
  },
  "no-emails": {
    title: "No review emails yet",
    description:
      "Generate an email draft from your monthly plan, content drafts, or growth timeline.",
  },
  "no-data": {
    title: "Nothing needs review right now",
    description:
      "Generate a monthly plan or create content drafts first, then RankBoost can prepare a review email.",
  },
};

export function EmailApprovalEmptyState({
  variant,
}: EmailApprovalEmptyStateProps) {
  const copy = COPY[variant];

  return (
    <EmptyState icon={Mail} title={copy.title} description={copy.description} />
  );
}
