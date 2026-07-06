"use client";

import { Mail } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type EmailApprovalEmptyStateProps = {
  variant: "no-website" | "no-emails" | "no-data";
};

export function EmailApprovalEmptyState({
  variant,
}: EmailApprovalEmptyStateProps) {
  const { dict } = useSaasTranslations();
  const e = dict.emailApprovals;

  const copy =
    variant === "no-website"
      ? { title: e.emptyNoWebsiteTitle, description: e.emptyNoWebsiteDescription }
      : variant === "no-data"
        ? { title: e.emptyNoDataTitle, description: e.emptyNoDataDescription }
        : { title: e.emptyNoEmailsTitle, description: e.emptyNoEmailsDescription };

  return (
    <EmptyState icon={Mail} title={copy.title} description={copy.description} />
  );
}
