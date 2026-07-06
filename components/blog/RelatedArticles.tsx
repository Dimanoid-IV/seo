import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/data/blog-posts";
import { BlogCard } from "@/components/blog/BlogCard";
import { cn } from "@/lib/utils";

type RelatedArticlesProps = {
  posts: BlogPost[];
  locale: Locale;
  title: string;
  readMore: string;
  minLabel: string;
  theme?: "dark" | "marketing";
};

export function RelatedArticles({
  posts,
  locale,
  title,
  readMore,
  minLabel,
  theme = "dark",
}: RelatedArticlesProps) {
  if (posts.length === 0) return null;

  const isMarketing = theme === "marketing";

  return (
    <section
      className={cn(
        "mt-16 border-t pt-16",
        isMarketing ? "border-slate-200" : "border-white/10"
      )}
    >
      <h2
        className={cn(
          "mb-8 text-2xl font-bold",
          isMarketing ? "text-slate-900" : "text-white"
        )}
      >
        {title}
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <BlogCard
            key={post.slug}
            post={post}
            locale={locale}
            readMore={readMore}
            minLabel={minLabel}
            theme={theme}
          />
        ))}
      </div>
    </section>
  );
}
