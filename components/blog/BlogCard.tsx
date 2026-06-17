import { Calendar, Clock } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/data/blog-posts";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { Badge } from "@/components/ui/badge";

type BlogCardProps = {
  post: BlogPost;
  locale: Locale;
  readMore: string;
  minLabel: string;
};

export function BlogCard({ post, locale, readMore, minLabel }: BlogCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString(
    locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article className="group glass-card flex h-full flex-col overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:glow-sm">
      <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-500" />
      <div className="flex flex-1 flex-col p-6">
        <Badge
          variant="outline"
          className="mb-4 w-fit border-blue-500/30 bg-blue-500/10 text-blue-300"
        >
          {post.category}
        </Badge>
        <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-blue-300">
          <LocaleLink locale={locale} href={`/blog/${post.slug}`}>
            {post.title}
          </LocaleLink>
        </h3>
        <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400 line-clamp-3">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime} {minLabel}
            </span>
          </div>
          <LocaleLink
            locale={locale}
            href={`/blog/${post.slug}`}
            className="font-medium text-blue-400 hover:text-cyan-400"
          >
            {readMore} →
          </LocaleLink>
        </div>
      </div>
    </article>
  );
}
