"use client";

import { useState, useMemo } from "react";
import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/data/blog/types";
import { BlogCard } from "@/components/blog/BlogCard";
import { cn } from "@/lib/utils";

type BlogListProps = {
  posts: BlogPost[];
  locale: Locale;
  readMore: string;
  minLabel: string;
  allLabel: string;
};

export function BlogList({ posts, locale, readMore, minLabel, allLabel }: BlogListProps) {
  const categories = useMemo(() => {
    const cats = [...new Set(posts.map((p) => p.category))].sort();
    return [allLabel, ...cats];
  }, [posts, allLabel]);

  const [active, setActive] = useState(allLabel);

  const filtered =
    active === allLabel ? posts : posts.filter((p) => p.category === active);

  return (
    <>
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              active === cat
                ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                : "border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <BlogCard
            key={post.slug}
            post={post}
            locale={locale}
            readMore={readMore}
            minLabel={minLabel}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-slate-400">No articles in this category.</p>
      )}
    </>
  );
}
