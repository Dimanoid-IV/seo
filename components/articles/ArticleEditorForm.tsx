"use client";

import { useMemo, useState } from "react";
import { Archive, ExternalLink, Loader2 } from "lucide-react";

import { ArticleMetaPreview } from "@/components/articles/ArticleMetaPreview";
import { ArticlePublishPanel } from "@/components/articles/ArticlePublishPanel";
import { ArticleQualityPanel } from "@/components/articles/ArticleQualityPanel";
import { ArticleStatusBadge } from "@/components/articles/ArticleStatusBadge";
import { WordPressDraftButton } from "@/components/dashboard/WordPressDraftButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { ArticleResponse, SerializedArticle } from "@/lib/articles/types";
import { cn } from "@/lib/utils";

type ArticleEditorFormProps = {
  article: SerializedArticle;
  onUpdated: (article: SerializedArticle) => void;
};

type FormState = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  contentHtml: string;
};

function toFormState(article: SerializedArticle): FormState {
  return {
    title: article.title,
    slug: article.slug ?? "",
    metaTitle: article.metaTitle ?? "",
    metaDescription: article.metaDescription ?? "",
    contentHtml: article.contentHtml ?? "",
  };
}

function buildPreviewUrl(article: SerializedArticle, slug: string): string {
  const slugPart = slug.trim() || article.slug || "article";
  return `example.com/${slugPart}`;
}

const ARTICLE_EDITOR_COPY = {
  ru: {
    aiDraftSafety:
      "RankBoost готовит черновики и рекомендации. Вы решаете, что публиковать или отправлять.",
    qualitySafety:
      "RankBoost проверяет и улучшает AI-черновики до вашей проверки.",
    htmlSanitized:
      "Перед отправкой на WordPress или custom-сайт HTML очищается и подготавливается к публикации.",
    qualityLabels: {
      title: "Оценка качества",
      passed: "Проверено RankBoost",
      failed: "Требует проверки",
      showIssues: "Показать замечания",
    },
    metaLabels: {
      title: "Предпросмотр в Google",
      fallbackTitle: "SEO-заголовок",
      fallbackDescription: "SEO-описание появится здесь.",
    },
  },
  en: {
    aiDraftSafety:
      "RankBoost prepares drafts and recommendations. You decide what gets published or sent.",
    qualitySafety:
      "RankBoost checks and improves AI drafts before you review them.",
    htmlSanitized:
      "Before sending to WordPress or a custom site, HTML is cleaned and prepared for publishing.",
    qualityLabels: {
      title: "Quality score",
      passed: "Checked by RankBoost",
      failed: "Needs review",
      showIssues: "Show notes",
    },
    metaLabels: {
      title: "Google preview",
      fallbackTitle: "SEO title",
      fallbackDescription: "SEO description will appear here.",
    },
  },
  et: {
    aiDraftSafety:
      "RankBoost valmistab mustandid ja soovitused. Teie otsustate, mida avaldada või saata.",
    qualitySafety:
      "RankBoost kontrollib ja parandab AI-mustandeid enne teie ülevaatust.",
    htmlSanitized:
      "Enne WordPressi või kohandatud saidile saatmist HTML puhastatakse ja valmistatakse avaldamiseks ette.",
    qualityLabels: {
      title: "Kvaliteediskoor",
      passed: "RankBoost kontrollitud",
      failed: "Vajab ülevaatust",
      showIssues: "Näita märkusi",
    },
    metaLabels: {
      title: "Google'i eelvaade",
      fallbackTitle: "SEO pealkiri",
      fallbackDescription: "SEO kirjeldus ilmub siia.",
    },
  },
} as const;

export function ArticleEditorForm({ article, onUpdated }: ArticleEditorFormProps) {
  const { locale } = useSaasTranslations();
  const copy = ARTICLE_EDITOR_COPY[locale] ?? ARTICLE_EDITOR_COPY.en;
  const [form, setForm] = useState<FormState>(() => toFormState(article));
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewTitle = form.metaTitle.trim() || form.title.trim();
  const previewDescription = form.metaDescription.trim();
  const previewUrl = useMemo(
    () => buildPreviewUrl(article, form.slug),
    [article, form.slug]
  );

  const canApprove =
    article.qualityPassed !== false &&
    (article.status === "WAITING_REVIEW" || article.status === "DRAFT");

  const canArchive =
    article.status !== "ARCHIVED" &&
    article.status !== "WORDPRESS_DRAFT_CREATED" &&
    article.status !== "PUBLISHED";

  const canCreateWordPressDraft =
    article.wordpressConnected &&
    !article.wordpressEditUrl &&
    (article.status === "DRAFT" || article.status === "APPROVED");

  async function patchArticle(
    payload: Record<string, string | null | undefined>,
    mode: "save" | "approve" | "archive"
  ) {
    if (mode === "save") {
      setSaving(true);
    } else if (mode === "approve") {
      setApproving(true);
    } else {
      setArchiving(true);
    }
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, "Не удалось сохранить статью")
        );
        return;
      }

      const body = (await response.json()) as ArticleResponse;
      onUpdated(body.data);
      setForm(toFormState(body.data));
      setSuccess(
        mode === "approve"
          ? "Статья одобрена"
          : mode === "archive"
            ? "Черновик отправлен в архив"
            : "Изменения сохранены"
      );
    } catch {
      setError("Сетевая ошибка при сохранении статьи");
    } finally {
      setSaving(false);
      setApproving(false);
      setArchiving(false);
    }
  }

  function handleSave() {
    void patchArticle(
      {
        title: form.title,
        slug: form.slug.trim() || null,
        metaTitle: form.metaTitle.trim() || null,
        metaDescription: form.metaDescription.trim() || null,
        contentHtml: form.contentHtml,
      },
      "save"
    );
  }

  function handleApprove() {
    void patchArticle(
      {
        title: form.title,
        slug: form.slug.trim() || null,
        metaTitle: form.metaTitle.trim() || null,
        metaDescription: form.metaDescription.trim() || null,
        contentHtml: form.contentHtml,
        status: "APPROVED",
      },
      "approve"
    );
  }

  function handleArchive() {
    void patchArticle({ status: "ARCHIVED" }, "archive");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ArticleStatusBadge status={article.status} />
            {article.generatedByAIJobId ? (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                Создано AI, проверьте перед публикацией
              </span>
            ) : null}
            <span className="text-xs text-slate-500">{article.language}</span>
            {article.targetKeyword ? (
              <span className="text-xs text-slate-500">
                · {article.targetKeyword}
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {article.title}
          </h1>
          {article.topic ? (
            <p className="text-sm text-slate-600">{article.topic}</p>
          ) : null}
          <p className="text-xs text-violet-700">{copy.aiDraftSafety}</p>
          {article.generatedByAIJobId ? (
            <p className="text-xs text-slate-600">{copy.qualitySafety}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {article.wordpressEditUrl ? (
            <a
              href={article.wordpressEditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                className:
                  "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              })}
            >
              Открыть в WordPress
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          {canCreateWordPressDraft ? (
            <WordPressDraftButton
              articleId={article.id}
              onSuccess={() => {
                void authFetch(`/api/articles/${article.id}`)
                  .then(async (response) => {
                    if (!response.ok) {
                      return;
                    }
                    const body = (await response.json()) as ArticleResponse;
                    onUpdated(body.data);
                    setForm(toFormState(body.data));
                    setSuccess("Черновик создан в WordPress");
                  })
                  .catch(() => undefined);
              }}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="article-title" className="text-sm font-medium text-slate-800">
              Заголовок
            </label>
            <input
              id="article-title"
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="article-slug" className="text-sm font-medium text-slate-800">
              Адрес страницы (slug)
            </label>
            <input
              id="article-slug"
              type="text"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="local-seo-estonia"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="article-meta-title"
              className="text-sm font-medium text-slate-800"
            >
              SEO-заголовок (meta title)
            </label>
            <input
              id="article-meta-title"
              type="text"
              value={form.metaTitle}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  metaTitle: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="article-meta-description"
              className="text-sm font-medium text-slate-800"
            >
              SEO-описание (meta description)
            </label>
            <textarea
              id="article-meta-description"
              value={form.metaDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  metaDescription: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="article-content-html"
              className="text-sm font-medium text-slate-800"
            >
              Текст статьи (HTML)
            </label>
            <textarea
              id="article-content-html"
              value={form.contentHtml}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contentHtml: event.target.value,
                }))
              }
              rows={16}
              className={cn(
                "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              )}
            />
            <p className="text-xs text-amber-700">
              {copy.htmlSanitized}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {article.generatedByAIJobId ? (
            <ArticleQualityPanel
              qualityScore={article.qualityScore}
              qualityPassed={article.qualityPassed}
              qualityIssuesJson={article.qualityIssuesJson}
              labels={copy.qualityLabels}
            />
          ) : null}

          <ArticleMetaPreview
            title={previewTitle}
            description={previewDescription}
            url={previewUrl}
            labels={copy.metaLabels}
          />

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || approving || archiving}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Сохраняем…
                </>
              ) : (
                "Сохранить"
              )}
            </Button>

            {canApprove ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleApprove}
                disabled={saving || approving || archiving}
                className="w-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              >
                {approving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Одобряем…
                  </>
                ) : (
                  "Одобрить"
                )}
              </Button>
            ) : null}

            {article.qualityPassed === false ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Черновик нельзя одобрить, пока он не пройдёт проверку качества.
              </p>
            ) : null}

            {canArchive ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleArchive}
                disabled={saving || approving || archiving}
                className="w-full border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                {archiving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Отправляем в архив…
                  </>
                ) : (
                  <>
                    <Archive className="size-4" />
                    В архив
                  </>
                )}
              </Button>
            ) : null}

            {error ? <p className="text-xs text-red-700">{error}</p> : null}
            {success ? <p className="text-xs text-emerald-700">{success}</p> : null}
          </div>

          <ArticlePublishPanel
            articleId={article.id}
            wordpressConnected={article.wordpressConnected}
            articleStatus={article.status}
            wordpressPostId={article.wordpressPostId}
            wordpressPublishedUrl={article.wordpressPublishedUrl}
            wordpressEditUrl={article.wordpressEditUrl}
            onRolledBack={() => {
              void (async () => {
                const response = await authFetch(`/api/articles/${article.id}`);
                if (!response.ok) return;
                const body = (await response.json()) as {
                  data: typeof article;
                };
                onUpdated(body.data);
              })();
            }}
          />
        </div>
      </div>
    </div>
  );
}
