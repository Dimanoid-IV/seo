import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/data/blog-posts";
import { BlogCard } from "@/components/blog/BlogCard";

type RelatedArticlesProps = {
  posts: BlogPost[];
  locale: Locale;
  title: string;
  readMore: string;
  minLabel: string;
};

export function RelatedArticles({
  posts,
  locale,
  title,
  readMore,
  minLabel,
}: RelatedArticlesProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-white/10 pt-16">
      <h2 className="mb-8 text-2xl font-bold text-white">{title}</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <BlogCard
            key={post.slug}
            post={post}
            locale={locale}
            readMore={readMore}
            minLabel={minLabel}
          />
        ))}
      </div>
    </section>
  );
}
