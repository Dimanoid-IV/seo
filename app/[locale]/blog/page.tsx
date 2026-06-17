import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import { generatePageMetadata } from "@/lib/seo";
import { getBlogPosts } from "@/data/blog-posts";
import { BlogList } from "@/components/blog/BlogList";
import { CTASection } from "@/components/sections/CTASection";
import { LocaleLink } from "@/components/ui/LocaleLink";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: dict.meta.blog.title,
    description: dict.meta.blog.description,
    path: "/blog",
    locale,
  });
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const posts = getBlogPosts(locale as Locale);

  return (
    <>
      <div className="border-b border-white/5 bg-gradient-to-b from-cyan-600/10 to-transparent py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            {dict.blog.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            {dict.blog.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <LocaleLink
              locale={locale as Locale}
              href="/services"
              className="text-blue-400 hover:text-cyan-400"
            >
              {dict.nav.services} →
            </LocaleLink>
            <LocaleLink
              locale={locale as Locale}
              href="/pricing"
              className="text-blue-400 hover:text-cyan-400"
            >
              {dict.nav.pricing} →
            </LocaleLink>
          </div>
        </div>
      </div>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <BlogList
              posts={posts}
              locale={locale as Locale}
              readMore={dict.blog.readMore}
              minLabel={dict.blog.min}
              allLabel={dict.blog.allCategories}
            />
          ) : (
            <p className="text-center text-slate-400">{dict.blog.noArticles}</p>
          )}
        </div>
      </section>
      <CTASection locale={locale as Locale} dict={dict} />
    </>
  );
}
