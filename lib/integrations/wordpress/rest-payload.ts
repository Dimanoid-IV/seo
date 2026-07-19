/**
 * Pure WP REST draft payload mapping — always forces status=draft.
 */

export function mapArticleToWpRestDraftPayload(input: {
  title: string;
  contentHtml: string;
  metaDescription?: string | null;
  slug?: string | null;
  categories?: number[];
  author?: number | null;
}): Record<string, unknown> {
  return {
    title: input.title,
    content: input.contentHtml,
    status: "draft",
    excerpt: input.metaDescription ?? "",
    ...(input.slug ? { slug: input.slug } : {}),
    ...(input.categories?.length ? { categories: input.categories } : {}),
    ...(input.author && input.author > 0 ? { author: input.author } : {}),
  };
}
