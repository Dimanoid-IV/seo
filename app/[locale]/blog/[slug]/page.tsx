import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Clock, User, Languages } from "lucide-react";
import Link from "next/link";
import { locales, type Locale } from "@/i18n/config";
import {
  getDictionary,
  isValidLocale,
  getArticleTranslations,
  getLocalizedPath,
} from "@/lib/i18n";
import { siteUrl } from "@/i18n/config";
import {
  getBlogPost,
  getRelatedPosts,
  getAllBlogSlugs,
} from "@/data/blog-posts";
import { faqBlockTitle } from "@/data/blog/helpers";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { BlogContent } from "@/components/blog/BlogContent";
import { BlogArticleFAQ } from "@/components/blog/BlogArticleFAQ";
import { BlogJsonLd } from "@/components/blog/BlogJsonLd";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { Badge } from "@/components/ui/badge";
import { CTASection } from "@/components/sections/CTASection";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const post = getBlogPost(slug, locale);
  if (!post) return {};

  const translations = getArticleTranslations(post.translationKey);
  const languages: Record<string, string> = {};
  for (const [loc, articleSlug] of Object.entries(translations)) {
    if (articleSlug) {
      languages[loc] = `${siteUrl}${getLocalizedPath(loc as Locale, `/blog/${articleSlug}`)}`;
    }
  }
  languages["x-default"] = languages.ru ?? Object.values(languages)[0];

  const canonical = `${siteUrl}${getLocalizedPath(locale, `/blog/${slug}`)}`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: canonical,
      siteName: "RankBoost.eu",
      locale: locale === "ru" ? "ru_RU" : locale === "et" ? "et_EE" : "en_US",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

export async function generateStaticParams() {
  return getAllBlogSlugs().map(({ slug, locale }) => ({ locale, slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const post = getBlogPost(slug, locale);
  if (!post) notFound();

  const dict = await getDictionary(locale);
  const related = getRelatedPosts(slug, locale);
  const translations = getArticleTranslations(post.translationKey);

  const formattedDate = new Date(post.date).toLocaleDateString(
    locale === "ru" ? "ru-RU" : locale === "et" ? "et-EE" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const langLabels: Record<Locale, string> = { ru: "RU", et: "ET", en: "EN" };

  return (
    <div className="marketing-page min-h-screen">
      <BlogJsonLd post={post} locale={locale} />
      <article className="py-12 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            locale={locale}
            theme="marketing"
            items={[
              { label: dict.common.breadcrumbHome, href: "/" },
              { label: dict.nav.blog, href: "/blog" },
              { label: post.title },
            ]}
          />

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700"
            >
              {post.category}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Languages className="h-3.5 w-3.5" />
              {locales
                .filter((l) => translations[l] && l !== locale)
                .map((l) => (
                  <Link
                    key={l}
                    href={getLocalizedPath(l, `/blog/${translations[l]}`)}
                    className="rounded px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {langLabels[l]}
                  </Link>
                ))}
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <p className="mt-4 text-lg text-slate-600">{post.excerpt}</p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime} {dict.blog.min}
            </span>
          </div>

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

          <BlogContent sections={post.content} theme="marketing" />

          <BlogArticleFAQ
            title={faqBlockTitle(locale)}
            items={post.faq}
          />

          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-slate-100 text-slate-600"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t border-slate-200 pt-8">
            <LocaleLink
              locale={locale}
              href="/services"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {dict.nav.services} →
            </LocaleLink>
            <LocaleLink
              locale={locale}
              href="/pricing"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {dict.nav.pricing} →
            </LocaleLink>
            <LocaleLink
              locale={locale}
              href="/blog"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {dict.blog.backToBlog}
            </LocaleLink>
          </div>

          <RelatedArticles
            posts={related}
            locale={locale}
            title={dict.blog.related}
            readMore={dict.blog.readMore}
            minLabel={dict.blog.min}
            theme="marketing"
          />
        </div>
      </article>
      <CTASection locale={locale} dict={dict} source="blog" theme="marketing" />
    </div>
  );
}
