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
import { AI_DRAFT_SAFETY_COPY, QUALITY_PIPELINE_SAFETY_COPY } from "@/lib/articles/constants";
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

export function ArticleEditorForm({ article, onUpdated }: ArticleEditorFormProps) {
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
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
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
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {article.title}
          </h1>
          {article.topic ? (
            <p className="text-sm text-slate-400">{article.topic}</p>
          ) : null}
          <p className="text-xs text-violet-300/90">{AI_DRAFT_SAFETY_COPY}</p>
          {article.generatedByAIJobId ? (
            <p className="text-xs text-slate-400">{QUALITY_PIPELINE_SAFETY_COPY}</p>
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
                  "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10",
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
            <label htmlFor="article-title" className="text-sm font-medium text-white">
              Заголовок
            </label>
            <input
              id="article-title"
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="article-slug" className="text-sm font-medium text-white">
              Адрес страницы (slug)
            </label>
            <input
              id="article-slug"
              type="text"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
              placeholder="local-seo-estonia"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="article-meta-title"
              className="text-sm font-medium text-white"
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
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="article-meta-description"
              className="text-sm font-medium text-white"
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
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="article-content-html"
              className="text-sm font-medium text-white"
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
                "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-blue-500/50"
              )}
            />
            <p className="text-xs text-amber-400/90">
              HTML будет очищен WordPress Connector при создании черновика.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {article.generatedByAIJobId ? (
            <ArticleQualityPanel
              qualityScore={article.qualityScore}
              qualityPassed={article.qualityPassed}
              qualityIssuesJson={article.qualityIssuesJson}
            />
          ) : null}

          <ArticleMetaPreview
            title={previewTitle}
            description={previewDescription}
            url={previewUrl}
          />

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
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
                className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
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
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Черновик нельзя одобрить, пока он не пройдёт проверку качества.
              </p>
            ) : null}

            {canArchive ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleArchive}
                disabled={saving || approving || archiving}
                className="w-full border-slate-500/30 bg-slate-500/10 text-slate-200 hover:bg-slate-500/20"
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

            {error ? <p className="text-xs text-red-300">{error}</p> : null}
            {success ? <p className="text-xs text-emerald-300">{success}</p> : null}
          </div>

          <ArticlePublishPanel
            articleId={article.id}
            wordpressConnected={article.wordpressConnected}
          />
        </div>
      </div>
    </div>
  );
}
