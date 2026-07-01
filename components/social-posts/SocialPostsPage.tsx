"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/billing/FeatureGate";
import {
  isUsageLimitReached,
  useBillingOverview,
} from "@/components/billing/useBillingOverview";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { SocialPostViewModel } from "@/lib/social-posts/types";

import {
  SocialPostCard,
  SocialPostEditor,
  SocialPostGenerateDialog,
} from "./SocialPostCard";
import { SocialPostEmptyState } from "./SocialPostEmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { TrustNote } from "@/components/shared/TrustNote";
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";

type SocialPostsResponse = {
  data: {
    posts: SocialPostViewModel[];
    nextCursor: string | null;
    websiteId: string | null;
  };
};

function buildCopyText(post: SocialPostViewModel): string {
  const parts = [post.content.trim()];
  if (post.cta?.trim()) {
    parts.push(post.cta.trim());
  }
  if (post.hashtags.length > 0) {
    parts.push(post.hashtags.join(" "));
  }
  return parts.join("\n\n");
}

export function SocialPostsPage() {
  const { data: billing } = useBillingOverview();
  const socialLimit = isUsageLimitReached(billing, "social_post");
  const aiLimit = isUsageLimitReached(billing, "ai_generation");
  const generateBlocked = socialLimit.blocked || aiLimit.blocked;
  const generateReason = socialLimit.blocked
    ? socialLimit.message
    : aiLimit.message;
  const [posts, setPosts] = useState<SocialPostViewModel[]>([]);
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionPostId, setActionPostId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPostViewModel | null>(
    null
  );

  const loadPosts = useCallback(async () => {
    setError(null);

    try {
      const response = await authFetch("/api/social-posts?limit=30");

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Failed to load social posts"));
        return;
      }

      const body = (await response.json()) as SocialPostsResponse;
      setPosts(body.data.posts);
      setWebsiteId(body.data.websiteId);
    } catch {
      setError("Network error while loading social posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPosts() {
      setLoading(true);
      try {
        const response = await authFetch("/api/social-posts?limit=30");
        if (!response.ok) {
          if (!cancelled) {
            setError(
              await parseApiErrorMessage(response, "Failed to load social posts")
            );
            setLoading(false);
          }
          return;
        }
        const body = (await response.json()) as SocialPostsResponse;
        if (!cancelled) {
          setPosts(body.data.posts);
          setWebsiteId(body.data.websiteId);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Network error while loading social posts");
          setLoading(false);
        }
      }
    }

    void loadInitialPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCopy(post: SocialPostViewModel) {
    setActionPostId(post.id);
    setSuccess(null);
    setError(null);

    try {
      await navigator.clipboard.writeText(buildCopyText(post));

      const response = await authFetch(`/api/social-posts/${post.id}/copy`, {
        method: "POST",
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Failed to mark post as copied"));
        return;
      }

      const body = (await response.json()) as { data: SocialPostViewModel };
      setPosts((current) =>
        current.map((item) => (item.id === post.id ? body.data : item))
      );
      setSuccess(
        "Post copied. You can now paste it into your social media account."
      );
    } catch {
      setError("Failed to copy post to clipboard");
    } finally {
      setActionPostId(null);
    }
  }

  async function handleArchive(post: SocialPostViewModel) {
    setActionPostId(post.id);
    setError(null);

    try {
      const response = await authFetch(`/api/social-posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Failed to archive post"));
        return;
      }

      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch {
      setError("Network error while archiving post");
    } finally {
      setActionPostId(null);
    }
  }

  if (loading) {
    return <PageLoadingState message="Loading social posts…" />;
  }

  if (error) {
    return (
      <PageErrorState
        message={error || PAGE_ERROR_FALLBACK}
        onRetry={() => void loadPosts()}
      />
    );
  }

  if (!websiteId) {
    return (
      <main className="app-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          title="Social Posts"
          subtitle="Turn website growth opportunities into ready-to-review social media drafts."
        />
        <SocialPostEmptyState variant="no-website" />
      </main>
    );
  }

  return (
    <main className="app-content mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        title="Social Posts"
        subtitle="Turn website growth opportunities into ready-to-review social media drafts."
        actions={
          <>
            <FeatureGate blocked={generateBlocked} reason={generateReason}>
              <Button
                type="button"
                disabled={generateBlocked}
                onClick={() => setGenerateOpen(true)}
              >
                <Sparkles className="size-4" />
                Generate post
              </Button>
            </FeatureGate>
            <Button type="button" variant="outline" onClick={() => setManualOpen(true)}>
              <Plus className="size-4" />
              Create manually
            </Button>
          </>
        }
      />

      <TrustNote variant="ai" />

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              onEdit={setEditingPost}
              onCopy={handleCopy}
              onArchive={handleArchive}
              actionLoading={actionPostId === post.id}
            />
          ))}
        </div>
      ) : (
        <SocialPostEmptyState variant="no-posts" />
      )}

      <SocialPostGenerateDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerated={(post) => {
          setPosts((current) => [post, ...current]);
          void loadPosts();
        }}
      />

      {manualOpen ? (
        <ManualCreateDialog
          onClose={() => setManualOpen(false)}
          onCreated={(post) => {
            setPosts((current) => [post, ...current]);
            setManualOpen(false);
          }}
        />
      ) : null}

      {editingPost ? (
        <SocialPostEditor
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={(post) => {
            setPosts((current) =>
              current.map((item) => (item.id === post.id ? post : item))
            );
          }}
        />
      ) : null}
    </main>
  );
}

function ManualCreateDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (post: SocialPostViewModel) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("LINKEDIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, platform }),
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Failed to create post"));
        return;
      }

      const body = (await response.json()) as { data: SocialPostViewModel };
      onCreated(body.data);
    } catch {
      setError("Network error while creating post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="max-h-[min(90vh,100dvh)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white">Create manually</h3>
        <div className="mt-5 space-y-4">
          <input
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
          <textarea
            placeholder="Post content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={6}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
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
        </div>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleCreate()} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
