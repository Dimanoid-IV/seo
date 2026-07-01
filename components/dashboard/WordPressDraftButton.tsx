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
            "Could not create WordPress draft"
          )
        );
        return;
      }

      const body = (await response.json()) as WordPressDraftResponse;
      setEditUrl(body.data.editUrl);
      onSuccess?.();
    } catch {
      setError("Network error while creating WordPress draft");
    } finally {
      setLoading(false);
    }
  }

  if (editUrl) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-emerald-300">WordPress draft created</p>
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200"
        >
          Open in WordPress
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
          className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating draft…
            </>
          ) : (
            "Create WordPress draft"
          )}
        </Button>
      </FeatureGate>
      <TrustNote variant="wordpress" className="mt-2" />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
