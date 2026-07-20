import { publicEnv } from "@/lib/env";
import { normalizeSlug } from "@/lib/publishing/universal-export";

export function buildHostedArticleSlug({
  slug,
  title,
}: {
  slug?: string | null;
  title: string;
}): string {
  return normalizeSlug(slug, title);
}

export function buildHostedArticlePath({
  articleId,
  slug,
  title,
}: {
  articleId: string;
  slug?: string | null;
  title: string;
}): string {
  return `/hosted/articles/${encodeURIComponent(articleId)}/${buildHostedArticleSlug({
    slug,
    title,
  })}`;
}

export function buildHostedArticleUrl(input: {
  articleId: string;
  slug?: string | null;
  title: string;
}): string {
  const baseUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/g, "");
  return `${baseUrl}${buildHostedArticlePath(input)}`;
}
