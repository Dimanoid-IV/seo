"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Globe2, Loader2, ArrowRight } from "lucide-react";
import { ActivationProgressCard } from "@/components/dashboard/ActivationProgressCard";
import { OnboardingWebsiteStep } from "./OnboardingWebsiteStep";
import { useOnboarding } from "./useOnboarding";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { getLaunchCopy } from "@/lib/onboarding/launch-copy";

export function OnboardingPage() {
  const { locale } = useSaasTranslations();
  const t = getLaunchCopy(locale);
  const { data, loading, error, reload } = useOnboarding();
  const [actionError, setActionError] = useState<string | null>(null);
  const ready = data?.status === "COMPLETED" && data.results?.monthlyPlanStatus === "approved";

  return (
    <main className="app-content mx-auto w-full max-w-3xl space-y-7 px-4 py-8 sm:px-8 sm:py-12">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">RankBoost / {t.progress}</p>
        <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">{ready ? t.ready : data?.website ? t.working : t.title}</h1>
        <p className="max-w-xl text-base leading-relaxed text-slate-600">{ready ? t.readyBody : data?.website ? t.background : t.subtitle}</p>
      </header>
      {(error || actionError) && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{actionError || error}</p>}
      {loading && !data ? <div role="status" className="flex items-center gap-3 py-12 text-slate-600"><Loader2 className="size-5 animate-spin motion-reduce:animate-none" />{t.waiting}</div> : null}
      {data?.website ? (
        <div className="flex min-w-0 items-center gap-3 border-y border-slate-200 py-5">
          <Globe2 className="size-6 shrink-0 text-violet-600" />
          <div className="min-w-0"><p className="text-xs text-slate-500">{t.website}</p><p className="break-all text-lg font-semibold text-slate-900">{data.website.domain}</p></div>
          {ready && <CheckCircle2 className="ml-auto size-6 shrink-0 text-emerald-600" />}
        </div>
      ) : data ? <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><OnboardingWebsiteStep onSuccess={async () => { await reload(); }} onError={setActionError} /></section> : null}
      {data?.website && !ready ? <ActivationProgressCard key={data.website.id} initialActivation={{ version: 1, websiteId: data.website.id, status: "running", steps: {} }} onSettled={reload} /> : null}
      {ready ? <section className="space-y-6">
        <dl className="grid grid-cols-2 gap-4"><div><dt className="text-sm text-slate-500">{t.tasks}</dt><dd className="mt-1 text-3xl font-semibold text-slate-950">{data?.results?.tasksCount ?? 0}</dd></div><div><dt className="text-sm text-slate-500">{t.plan}</dt><dd className="mt-1 text-3xl font-semibold text-emerald-700">{t.done}</dd></div></dl>
        <div className="flex flex-wrap gap-3"><Link href="/app/autopilot" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">{t.details}<ArrowRight className="size-4" /></Link><Link href="/app/integrations" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50">{t.connect}</Link></div>
      </section> : null}
      <footer className="space-y-3 border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-500"><p>{t.safety}</p><p>{t.later}</p>{data?.website && <Link href="/app" className="inline-block py-2 font-medium text-violet-700 underline underline-offset-4">{t.dashboard}</Link>}</footer>
    </main>
  );
}
