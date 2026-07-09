"use client";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { HomeGeneratedFix } from "@/lib/dashboard/home";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type GeneratedFixPreviewProps = {
  fix: HomeGeneratedFix;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GeneratedFixPreview({
  fix,
  open,
  onOpenChange,
}: GeneratedFixPreviewProps) {
  const { dict } = useSaasTranslations();
  const h = dict.dashboard.homeFlow;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-lg overflow-y-auto border-white/10 bg-[#0a0f1e] sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle className="text-left text-white">{fix.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5 px-1 text-sm">
          {fix.metaTitle ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {h.metaTitleLabel}
              </p>
              <p className="mt-1 text-slate-200">{fix.metaTitle}</p>
            </div>
          ) : null}
          {fix.metaDescription ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {h.metaDescriptionLabel}
              </p>
              <p className="mt-1 text-slate-200">{fix.metaDescription}</p>
            </div>
          ) : null}
          {fix.contentHtml ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {h.contentLabel}
              </p>
              <div
                className="prose prose-invert prose-sm mt-2 max-w-none rounded-xl border border-white/10 bg-white/[0.03] p-4"
                dangerouslySetInnerHTML={{ __html: fix.contentHtml }}
              />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
