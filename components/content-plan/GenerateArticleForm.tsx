"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/billing/FeatureGate";
import {
  isUsageLimitReached,
  useBillingOverview,
} from "@/components/billing/useBillingOverview";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { AI_DRAFT_SAFETY_COPY } from "@/lib/articles/constants";
import type { SerializedArticle } from "@/lib/articles/types";
import { cn } from "@/lib/utils";

type GenerateArticleFormProps = {
  websiteId: string;
  taskId?: string;
  defaultTopic?: string;
  defaultTargetKeyword?: string;
  defaultLanguage?: "RU" | "ET" | "EN";
  submitLabel?: string;
  className?: string;
  onSuccess?: (articleId: string) => void;
};

type GenerateArticleResponse = {
  data: {
    article: SerializedArticle;
  };
};

export function GenerateArticleForm({
  websiteId,
  taskId,
  defaultTopic = "",
  defaultTargetKeyword = "",
  defaultLanguage = "RU",
  submitLabel = "Generate",
  className,
  onSuccess,
}: GenerateArticleFormProps) {
  const router = useRouter();
  const { data: billing } = useBillingOverview();
  const articleLimit = isUsageLimitReached(billing, "article_draft");
  const aiLimit = isUsageLimitReached(billing, "ai_generation");
  const generationBlocked = articleLimit.blocked || aiLimit.blocked;
  const generationReason = articleLimit.blocked
    ? articleLimit.message
    : aiLimit.message;
  const [topic, setTopic] = useState(defaultTopic);
  const [targetKeyword, setTargetKeyword] = useState(defaultTargetKeyword);
  const [language, setLanguage] = useState<"RU" | "ET" | "EN">(defaultLanguage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          ...(taskId ? { taskId } : {}),
          ...(topic.trim() ? { topic: topic.trim() } : {}),
          ...(targetKeyword.trim()
            ? { targetKeyword: targetKeyword.trim() }
            : {}),
          language,
        }),
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(
            response,
            "Не удалось сгенерировать статью"
          )
        );
        return;
      }

      const body = (await response.json()) as GenerateArticleResponse;
      const articleId = body.data.article.id;

      if (onSuccess) {
        onSuccess(articleId);
      } else {
        router.push(`/app/articles/${articleId}`);
      }
    } catch {
      setError("Сетевая ошибка при генерации статьи");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-400" />
        <p className="text-xs text-violet-100/90">{AI_DRAFT_SAFETY_COPY}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="generate-topic" className="text-sm font-medium text-white">
          {taskId ? "Content topic (business keyword)" : "Topic"}
        </label>
        <input
          id="generate-topic"
          type="text"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
          placeholder={
            taskId
              ? "Например: SEO-аудит для малого бизнеса в Таллинне"
              : "Например: локальное SEO для малого бизнеса"
          }
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="generate-keyword"
          className="text-sm font-medium text-white"
        >
          Target keyword (optional)
        </label>
        <input
          id="generate-keyword"
          type="text"
          value={targetKeyword}
          onChange={(event) => setTargetKeyword(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
          placeholder="local seo estonia"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="generate-language"
          className="text-sm font-medium text-white"
        >
          Language
        </label>
        <select
          id="generate-language"
          value={language}
          onChange={(event) =>
            setLanguage(event.target.value as "RU" | "ET" | "EN")
          }
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
        >
          <option value="RU">RU</option>
          <option value="ET">ET</option>
          <option value="EN">EN</option>
        </select>
      </div>

      <FeatureGate blocked={generationBlocked} reason={generationReason}>
        <Button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={
            loading ||
            generationBlocked ||
            (!topic.trim() && !targetKeyword.trim())
          }
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Генерируем…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </FeatureGate>

      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
