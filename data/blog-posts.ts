import type { Locale } from "@/i18n/config";
import type { BlogPost, BlogFAQItem, ContentSection } from "@/data/blog/types";
import { allPosts } from "@/data/blog/posts/all-posts";

export type { BlogPost, BlogFAQItem, ContentSection };

export const blogPosts: BlogPost[] = allPosts;

export function getBlogPosts(locale?: Locale): BlogPost[] {
  const posts = locale ? blogPosts.filter((p) => p.locale === locale) : blogPosts;
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getBlogPost(slug: string, locale: Locale): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug && p.locale === locale);
}

export function getBlogCategories(locale: Locale): string[] {
  const cats = new Set(getBlogPosts(locale).map((p) => p.category));
  return [...cats].sort();
}

export function getRelatedPosts(
  currentSlug: string,
  locale: Locale,
  limit = 3
): BlogPost[] {
  const current = getBlogPost(currentSlug, locale);
  return getBlogPosts(locale)
    .filter((p) => p.slug !== currentSlug)
    .filter((p) =>
      current
        ? p.category === current.category ||
          p.tags.some((t) => current.tags.includes(t))
        : true
    )
    .slice(0, limit);
}

export function getAllBlogSlugs(): { slug: string; locale: Locale }[] {
  return blogPosts.map((p) => ({ slug: p.slug, locale: p.locale }));
}

export function getArticleSlugsByTranslationKey(
  translationKey: string
): Partial<Record<Locale, string>> {
  const related = blogPosts.filter((p) => p.translationKey === translationKey);
  return related.reduce(
    (acc, post) => {
      acc[post.locale] = post.slug;
      return acc;
    },
    {} as Partial<Record<Locale, string>>
  );
}
