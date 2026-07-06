"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AuditUrlForm } from "@/components/audit/AuditUrlForm";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type AuditPageContentProps = {
  initialUrl?: string;
};

export function AuditPageContent({ initialUrl = "" }: AuditPageContentProps) {
  const { dict } = useSaasTranslations();
  const a = dict.publicAudit;

  return (
    <main className="marketing-page min-h-screen">
      <div className="border-b border-slate-200/80 bg-gradient-to-b from-blue-50/80 to-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/en" className="flex items-center gap-2.5 font-bold text-slate-900">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="text-lg tracking-tight">
              Rank<span className="text-blue-600">Boost</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="auth" />
            <Link
              href="/register"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {a.loginRegister}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {a.pageTitle}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            {a.pageSubtitle}
          </p>
        </div>

        <div className="mt-10">
          <AuditUrlForm initialUrl={initialUrl} />
        </div>
      </div>
    </main>
  );
}
