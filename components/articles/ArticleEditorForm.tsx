"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { ArticleMetaPreview } from "@/components/articles/ArticleMetaPreview";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewTitle = form.metaTitle.trim() || form.title.trim();
  const previewDescription = form.metaDescription.trim();
  const previewUrl = useMemo(
    () => buildPreviewUrl(article, form.slug),
    [article, form.slug]
  );

  const canApprove =
    article.status !== "APPROVED" &&
    article.status !== "WORDPRESS_DRAFT_CREATED" &&
    article.status !== "PUBLISHED";

  const canCreateWordPressDraft =
    article.wordpressConnected &&
    !article.wordpressEditUrl &&
    (article.status === "DRAFT" || article.status === "APPROVED");

  async function patchArticle(
    payload: Record<string, string | null | undefined>,
    mode: "save" | "approve"
  ) {
    if (mode === "save") {
      setSaving(true);
    } else {
      setApproving(true);
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
      setSuccess(mode === "approve" ? "Статья одобрена" : "Изменения сохранены");
    } catch {
      setError("Сетевая ошибка при сохранении статьи");
    } finally {
      setSaving(false);
      setApproving(false);
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
              Open in WordPress
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
              Title
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
              Slug
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
              Meta Title
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
              Meta Description
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
              Content HTML
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
              disabled={saving || approving}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Сохраняем…
                </>
              ) : (
                "Save"
              )}
            </Button>

            {canApprove ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleApprove}
                disabled={saving || approving}
                className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
              >
                {approving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Одобряем…
                  </>
                ) : (
                  "Mark as approved"
                )}
              </Button>
            ) : null}

            {error ? <p className="text-xs text-red-300">{error}</p> : null}
            {success ? <p className="text-xs text-emerald-300">{success}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
