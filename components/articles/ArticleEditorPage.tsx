"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { ArticleEditorForm } from "@/components/articles/ArticleEditorForm";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { ArticleResponse, SerializedArticle } from "@/lib/articles/types";

type ArticleEditorPageProps = {
  articleId: string;
};

export function ArticleEditorPage({ articleId }: ArticleEditorPageProps) {
  const [article, setArticle] = useState<SerializedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(`/api/articles/${articleId}`);

        if (!response.ok) {
          if (!cancelled) {
            setError(
              await parseApiErrorMessage(response, "Не удалось загрузить статью")
            );
            setArticle(null);
          }
          return;
        }

        const body = (await response.json()) as ArticleResponse;
        if (!cancelled) {
          setArticle(body.data);
        }
      } catch {
        if (!cancelled) {
          setError("Сетевая ошибка при загрузке статьи");
          setArticle(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadArticle();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (loading) {
    return (
      <main className="app-content mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <Loader2 className="size-8 animate-spin text-blue-400" />
        <p className="mt-3 text-sm text-slate-400">Загружаем статью…</p>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/app/content-plan"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          К плану контента
        </Link>
        <p className="text-sm text-red-300">{error ?? "Статья не найдена"}</p>
      </main>
    );
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link
        href="/app/content-plan"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        К плану контента
      </Link>
      <ArticleEditorForm article={article} onUpdated={setArticle} />
    </main>
  );
}
