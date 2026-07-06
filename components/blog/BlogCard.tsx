import { Calendar, Clock } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/data/blog-posts";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BlogCardProps = {
  post: BlogPost;
  locale: Locale;
  readMore: string;
  minLabel: string;
  theme?: "dark" | "marketing";
};

export function BlogCard({
  post,
  locale,
  readMore,
  minLabel,
  theme = "dark",
}: BlogCardProps) {
  const isMarketing = theme === "marketing";
  const formattedDate = new Date(post.date).toLocaleDateString(
    locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden transition-all duration-300",
        isMarketing
          ? "marketing-card hover:border-blue-300 hover:shadow-[0_12px_40px_-16px_rgba(59,130,246,0.2)]"
          : "glass-card hover:border-blue-500/30 hover:glow-sm"
      )}
    >
      <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-500" />
      <div className="flex flex-1 flex-col p-6">
        <Badge
          variant="outline"
          className={cn(
            "mb-4 w-fit",
            isMarketing
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-blue-500/30 bg-blue-500/10 text-blue-300"
          )}
        >
          {post.category}
        </Badge>
        <h3
          className={cn(
            "mb-3 text-xl font-semibold transition-colors",
            isMarketing
              ? "text-slate-900 group-hover:text-blue-700"
              : "text-white group-hover:text-blue-300"
          )}
        >
          <LocaleLink locale={locale} href={`/blog/${post.slug}`}>
            {post.title}
          </LocaleLink>
        </h3>
        <p
          className={cn(
            "mb-4 flex-1 text-sm leading-relaxed line-clamp-3",
            isMarketing ? "text-slate-600" : "text-slate-400"
          )}
        >
          {post.excerpt}
        </p>
        <div
          className={cn(
            "flex items-center justify-between border-t pt-4 text-xs",
            isMarketing ? "border-slate-200 text-slate-500" : "border-white/10 text-slate-500"
          )}
        >
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
            className={cn(
              "font-medium",
              isMarketing ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-cyan-400"
            )}
          >
            {readMore} →
          </LocaleLink>
        </div>
      </div>
    </article>
  );
}
