import Link from "next/link";
import { ArrowRight, Clock, FileText, Gauge, Heading1 } from "lucide-react";

import { AuditIssueCard } from "@/components/audit/AuditIssueCard";
import { AuditScoreSummary } from "@/components/audit/AuditScoreSummary";
import { buttonVariants } from "@/components/ui/button";
import { formatFixMinutes } from "@/lib/audit/client-messages";
import type { AuditPreviewResponseData } from "@/lib/audit/preview-response";
import { cn } from "@/lib/utils";

type AuditPreviewResultProps = {
  data: AuditPreviewResponseData;
  previewToken?: string | null;
  onCheckAnother: () => void;
};

export function AuditPreviewResult({
  data,
  previewToken,
  onCheckAnother,
}: AuditPreviewResultProps) {
  const registerParams = new URLSearchParams({
    website: data.url.final,
  });
  if (previewToken) {
    registerParams.set("previewToken", previewToken);
  }
  const registerHref = `/register?${registerParams.toString()}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <AuditScoreSummary rawScore={data.score.raw} label={data.score.label} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Gauge}
          label="Время ответа"
          value={`${data.summary.responseTimeMs} мс`}
        />
        <StatTile
          icon={FileText}
          label="Слов на странице"
          value={String(data.summary.wordCount)}
        />
        <StatTile
          icon={Heading1}
          label="Заголовков H1"
          value={String(data.summary.h1Count)}
        />
        <StatTile
          icon={Clock}
          label="Оценка исправлений"
          value={formatFixMinutes(data.summary.estimatedFixMinutes)}
        />
      </div>

      {data.previewIssues.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Главные препятствия для роста
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Показаны до {data.previewIssues.length} проблем, которые сильнее всего
              мешают получать клиентов из Google
            </p>
          </div>
          <div className="space-y-4">
            {data.previewIssues.map((issue) => (
              <AuditIssueCard key={`${issue.code}-${issue.title}`} issue={issue} />
            ))}
          </div>
        </section>
      ) : (
        <div className="glass-card border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-slate-300">
          Критичных проблем для бесплатного preview не найдено. Полный аудит покажет
          больше возможностей для роста.
        </div>
      )}

      <div className="glass-card flex flex-col items-start gap-4 border border-blue-500/20 bg-blue-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">
            Хотите полный план роста?
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {previewToken
              ? "Создайте аккаунт — сохраним результат проверки и покажем все рекомендации"
              : "Создайте аккаунт — сохраним сайт и покажем все проверки с приоритетами"}
          </p>
        </div>
        <Link
          href={registerHref}
          className={cn(
            buttonVariants(),
            "h-11 shrink-0 bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-white hover:from-blue-500 hover:to-violet-500"
          )}
        >
          Создать аккаунт и получить полный план
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2 text-center text-xs text-slate-500">
        <p>
          Проверен адрес:{" "}
          <span className="text-slate-400">{data.url.final}</span>
        </p>
        <button
          type="button"
          onClick={onCheckAnother}
          className="text-blue-400 transition-colors hover:text-cyan-400"
        >
          Проверить другой сайт
        </button>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card flex flex-col gap-2 border border-white/5 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </div>
      <p className="text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
