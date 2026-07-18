"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { FeatureGate } from "@/components/billing/FeatureGate";
import {
  isFeatureAvailable,
  useBillingOverview,
} from "@/components/billing/useBillingOverview";
import { Button } from "@/components/ui/button";
import { TrustNote } from "@/components/shared/TrustNote";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";

type WordPressDraftButtonProps = {
  articleId: string;
  onSuccess?: () => void;
};

type WordPressDraftResponse = {
  data: {
    postId: string;
    editUrl: string;
    articleId: string;
    status: string;
  };
};

export function WordPressDraftButton({
  articleId,
  onSuccess,
}: WordPressDraftButtonProps) {
  const { data: billing } = useBillingOverview();
  const wordpressGate = isFeatureAvailable(billing, "wordpress");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState<string | null>(null);

  async function handleCreateDraft() {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `/api/articles/${articleId}/wordpress-draft`,
        { method: "POST" }
      );

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(
            response,
            "Не удалось создать черновик в WordPress"
          )
        );
        return;
      }

      const body = (await response.json()) as WordPressDraftResponse;
      setEditUrl(body.data.editUrl);
      onSuccess?.();
    } catch {
      setError("Сетевая ошибка при создании черновика в WordPress");
    } finally {
      setLoading(false);
    }
  }

  if (editUrl) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-emerald-300">Черновик создан в WordPress</p>
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200"
        >
          Открыть в WordPress
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FeatureGate blocked={wordpressGate.blocked} reason={wordpressGate.message}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || wordpressGate.blocked}
          onClick={() => void handleCreateDraft()}
          className="border-slate-300 bg-white/5 text-slate-700 hover:bg-slate-100"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Создаём черновик…
            </>
          ) : (
            "Создать черновик в WordPress"
          )}
        </Button>
      </FeatureGate>
      <TrustNote variant="wordpress" className="mt-2" />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
