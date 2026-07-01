"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { SocialPostViewModel } from "@/lib/social-posts/types";

import { PlatformBadge, SocialPostQualityBadge } from "./PlatformBadge";

type SocialPostCardProps = {
  post: SocialPostViewModel;
  onEdit: (post: SocialPostViewModel) => void;
  onCopy: (post: SocialPostViewModel) => Promise<void>;
  onArchive: (post: SocialPostViewModel) => Promise<void>;
  actionLoading?: boolean;
};

export function SocialPostCard({
  post,
  onEdit,
  onCopy,
  onArchive,
  actionLoading = false,
}: SocialPostCardProps) {
  return (
    <article className="glass-card flex flex-col gap-4 border border-white/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <PlatformBadge platform={post.platform} />
        <SocialPostQualityBadge post={post} />
        <span className="text-xs text-slate-500">{post.source}</span>
      </div>

      <div>
        <h3 className="font-semibold text-white">{post.title}</h3>
        {post.hook ? (
          <p className="mt-1 text-sm text-blue-300/90">{post.hook}</p>
        ) : null}
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-400">
          {post.content}
        </p>
      </div>

      {post.hashtags.length > 0 ? (
        <p className="text-xs text-slate-500">{post.hashtags.join(" ")}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(post)}
          disabled={actionLoading}
        >
          Edit
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void onCopy(post)}
          disabled={actionLoading}
        >
          {actionLoading ? <Loader2 className="size-4 animate-spin" /> : "Copy"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void onArchive(post)}
          disabled={actionLoading}
        >
          Archive
        </Button>
      </div>
    </article>
  );
}

type SocialPostGenerateDialogProps = {
  open: boolean;
  onClose: () => void;
  onGenerated: (post: SocialPostViewModel) => void;
};

export function SocialPostGenerateDialog({
  open,
  onClose,
  onGenerated,
}: SocialPostGenerateDialogProps) {
  const [platform, setPlatform] = useState("LINKEDIN");
  const [source, setSource] = useState("TASK");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/social-posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, source }),
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(
            response,
            "We couldn't generate a social post right now. You can try again or create one manually."
          )
        );
        return;
      }

      const body = (await response.json()) as { data: SocialPostViewModel };
      onGenerated(body.data);
      onClose();
    } catch {
      setError(
        "We couldn't generate a social post right now. You can try again or create one manually."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white">Generate post</h3>
        <p className="mt-1 text-sm text-slate-400">
          RankBoost will use your latest growth data as context. Nothing is published automatically.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Platform</span>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="LINKEDIN">LinkedIn</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="X">X</option>
              <option value="GOOGLE_BUSINESS_PROFILE">Google Business Profile</option>
              <option value="GENERIC">Generic</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Source</span>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="TASK">Latest task</option>
              <option value="ARTICLE">Latest article</option>
              <option value="GSC_INSIGHT">Search Console insight</option>
              <option value="TIMELINE_EVENT">Latest timeline event</option>
              <option value="GROWTH_SCORE">Growth Score change</option>
              <option value="CONTINUOUS_IMPROVEMENT">Latest opportunity</option>
            </select>
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleGenerate()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

type SocialPostEditorProps = {
  post: SocialPostViewModel;
  onClose: () => void;
  onSaved: (post: SocialPostViewModel) => void;
};

export function SocialPostEditor({ post, onClose, onSaved }: SocialPostEditorProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [cta, setCta] = useState(post.cta ?? "");
  const [hashtags, setHashtags] = useState(post.hashtags.join(" "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(`/api/social-posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          cta: cta.trim() || null,
          hashtags: hashtags
            .split(/\s+/)
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Failed to save post"));
        return;
      }

      const body = (await response.json()) as { data: SocialPostViewModel };
      onSaved(body.data);
      onClose();
    } catch {
      setError("Network error while saving post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white">Edit social post</h3>

        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Content</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={8}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">CTA</span>
            <input
              value={cta}
              onChange={(event) => setCta(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Hashtags</span>
            <input
              value={hashtags}
              onChange={(event) => setHashtags(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
