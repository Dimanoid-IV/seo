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
          await parseApiErrorMessage(response, "Could not skip setup")
        );
        return;
      }
      await reload();
    } catch {
      setActionError("Network error while skipping setup");
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
      <div className="mx-auto max-w-3xl space-y-6 p-4 pb-24 lg:p-8">
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <h2 className="text-xl font-semibold text-white">Setup complete</h2>
          <p className="mt-2 text-sm text-slate-300">
            Your RankBoost workspace is ready. Continue in the Control Center.
          </p>
          <Link href="/app/autopilot-control" className="mt-5 inline-block">
            <Button type="button">Open Control Center</Button>
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
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-24 lg:p-8">
      <header className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-blue-500/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20">
            <Sparkles className="size-5 text-violet-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Set up RankBoost</h1>
            <p className="mt-1 text-sm text-slate-400">
              Get your first website audit, Growth Score, and monthly growth plan.
            </p>
            <p className="mt-3 max-w-2xl text-sm text-violet-100/90">
              Let&apos;s set up your first growth workspace. Add your website, run
              your first audit, and let RankBoost prepare your first growth plan.
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
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
                Skip setup for now
              </Button>
              <Link href="/app">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-white/10 bg-transparent text-slate-300"
                >
                  Go to dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold text-white">
                What RankBoost will do next
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>Turn audit findings into prioritized tasks</li>
                <li>Surface Search Console opportunities when connected</li>
                <li>Prepare a monthly SEO, content, and social plan</li>
                <li>Keep everything in your Control Center</li>
              </ul>
            </section>

            {data.results ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-white">Your results</h2>
                {data.results.growthScore != null ? (
                  <div className="mt-3 grid gap-2 text-sm">
                    <p className="text-slate-300">
                      Growth Score:{" "}
                      <span className="font-medium text-white">
                        {data.results.growthScore}
                      </span>
                    </p>
                    <p className="text-slate-300">
                      Open tasks:{" "}
                      <span className="font-medium text-white">
                        {data.results.tasksCount ?? 0}
                      </span>
                    </p>
                    {data.results.monthlyPlanStatus ? (
                      <p className="text-slate-300">
                        Monthly plan:{" "}
                        <span className="font-medium capitalize text-white">
                          {data.results.monthlyPlanStatus}
                        </span>
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    Your first results will appear after the audit is complete.
                  </p>
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
