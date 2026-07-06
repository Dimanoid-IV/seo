"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

import { OnboardingAuditStep } from "@/components/onboarding/OnboardingAuditStep";
import { OnboardingBillingNotice } from "@/components/onboarding/OnboardingBillingNotice";
import { OnboardingCompleteCard } from "@/components/onboarding/OnboardingCompleteCard";
import { OnboardingGscStep } from "@/components/onboarding/OnboardingGscStep";
import { OnboardingPlanStep } from "@/components/onboarding/OnboardingPlanStep";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingResultsStep } from "@/components/onboarding/OnboardingResultsStep";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { OnboardingWebsiteStep } from "@/components/onboarding/OnboardingWebsiteStep";
import { useOnboarding } from "@/components/onboarding/useOnboarding";
import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { OnboardingStepViewModel, OnboardingViewModel } from "@/lib/onboarding/types";

function renderStepContent(
  step: OnboardingStepViewModel,
  input: {
    websiteId?: string;
    results?: OnboardingViewModel["results"];
    reload: () => Promise<OnboardingViewModel | null>;
    setActionError: (message: string) => void;
  }
) {
  const disabled = step.status === "LOCKED" || step.status === "DONE";

  switch (step.key) {
    case "ADD_WEBSITE":
      return step.status === "DONE" ? null : (
        <OnboardingWebsiteStep
          disabled={disabled}
          onSuccess={async () => {
            await input.reload();
          }}
          onError={input.setActionError}
        />
      );
    case "RUN_AUDIT":
      return step.status === "DONE" ? null : (
        <OnboardingAuditStep
          websiteId={input.websiteId}
          disabled={disabled}
          onSuccess={async () => {
            await input.reload();
          }}
          onError={input.setActionError}
        />
      );
    case "CONNECT_GSC":
      return step.status === "DONE" || step.status === "SKIPPED" ? null : (
        <OnboardingGscStep
          disabled={disabled}
          onSkip={async () => {
            await input.reload();
          }}
          onError={input.setActionError}
        />
      );
    case "REVIEW_RESULTS":
      return (
        <OnboardingResultsStep
          results={input.results}
          disabled={disabled}
          onViewed={async () => {
            await input.reload();
          }}
        />
      );
    case "GENERATE_PLAN":
      return step.status === "DONE" ? null : (
        <OnboardingPlanStep
          disabled={disabled}
          onSuccess={async () => {
            await input.reload();
          }}
          onError={input.setActionError}
        />
      );
    default:
      return null;
  }
}

export function OnboardingPage() {
  const { dict } = useSaasTranslations();
  const o = dict.onboarding;
  const { data, loading, error, reload } = useOnboarding();
  const [actionError, setActionError] = useState<string | null>(null);
  const [skippingAll, setSkippingAll] = useState(false);

  async function handleSkipAll() {
    setSkippingAll(true);
    setActionError(null);
    try {
      const response = await authFetch("/api/onboarding/skip", { method: "POST" });
      if (!response.ok) {
        setActionError(
          await parseApiErrorMessage(response, o.errors.skipSetupFailed)
        );
        return;
      }
      await reload();
    } catch {
      setActionError(o.errors.skipSetupNetworkError);
    } finally {
      setSkippingAll(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (data?.status === "COMPLETED") {
    return (
      <div className="app-content mx-auto min-w-0 max-w-3xl space-y-8 overflow-x-hidden p-4 sm:p-6 lg:p-10">
        <section className="saas-card-success text-center">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {o.setupCompleteTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            {o.setupCompletePageSubtitle}
          </p>
          <Link href="/app/autopilot-control" className="mt-7 inline-block">
            <Button type="button" className="min-h-11 rounded-xl px-6">
              {o.openControlCenter}
            </Button>
          </Link>
        </section>
      </div>
    );
  }

  const showCompleteCard =
    data?.currentStep === "COMPLETE" ||
    (data != null &&
      data.progress.completed === data.progress.total &&
      data.progress.total > 0);

  return (
    <div className="app-content mx-auto min-w-0 max-w-6xl space-y-8 overflow-x-hidden p-4 sm:p-6 lg:p-10">
      <header className="saas-card-hero border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.1] to-blue-500/[0.05]">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 ring-1 ring-violet-500/20">
            <Sparkles className="size-5 text-violet-300" />
          </div>
          <div>
            <p className="saas-eyebrow text-violet-400/80">{o.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[1.875rem]">
              {o.pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              {o.pageSubtitle}
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          {actionError}
        </p>
      ) : null}

      {data ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <OnboardingProgress {...data.progress} />

            {data.steps.map((step) => (
              <OnboardingStepCard key={step.key} step={step}>
                {renderStepContent(step, {
                  websiteId: data.website?.id,
                  results: data.results,
                  reload,
                  setActionError,
                })}
              </OnboardingStepCard>
            ))}

            {showCompleteCard ? (
              <OnboardingCompleteCard
                onComplete={async () => {
                  await reload();
                }}
              />
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={skippingAll}
                onClick={() => void handleSkipAll()}
                className="text-slate-400 hover:text-slate-200"
              >
                {skippingAll ? <Loader2 className="size-4 animate-spin" /> : null}
                {o.skipSetupForNow}
              </Button>
              <Link href="/app">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-white/10 bg-transparent text-slate-300"
                >
                  {o.goToDashboard}
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <aside className="space-y-5">
            <section className="saas-card-muted">
              <h2 className="text-sm font-semibold text-white">
                {o.sidebarNextTitle}
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
                {o.sidebarNextItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            {data.results ? (
              <section className="saas-card-muted">
                <h2 className="text-sm font-semibold text-white">
                  {o.sidebarResultsTitle}
                </h2>
                {data.results.growthScore != null ? (
                  <div className="mt-3 grid gap-2 text-sm">
                    <p className="text-slate-300">
                      {o.growthScoreLabel}{" "}
                      <span className="font-medium text-white">
                        {data.results.growthScore}
                      </span>
                    </p>
                    <p className="text-slate-300">
                      {o.openTasksLabel}{" "}
                      <span className="font-medium text-white">
                        {data.results.tasksCount ?? 0}
                      </span>
                    </p>
                    {data.results.monthlyPlanStatus ? (
                      <p className="text-slate-300">
                        {o.monthlyPlanLabel}{" "}
                        <span className="font-medium capitalize text-white">
                          {data.results.monthlyPlanStatus}
                        </span>
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">{o.resultsPending}</p>
                )}
              </section>
            ) : null}

            {data.billing ? (
              <OnboardingBillingNotice
                billing={data.billing}
                actionLimitMessage={actionError}
              />
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
