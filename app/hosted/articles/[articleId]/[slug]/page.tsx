import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getHostedPublicArticle } from "@/lib/hosted-blog/public-article";

type PageProps = {
  params: Promise<{ articleId: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { articleId, slug } = await params;
  const article = await getHostedPublicArticle({ articleId, slug });
  if (!article) return {};

  return {
    title: article.metaTitle,
    description: article.metaDescription || undefined,
    alternates: {
      canonical: article.canonicalUrl,
    },
    openGraph: {
      type: "article",
      title: article.metaTitle,
      description: article.metaDescription || undefined,
      url: article.canonicalUrl,
      publishedTime: article.publishedAt.toISOString(),
    },
  };
}

export default async function HostedArticlePage({ params }: PageProps) {
  const { articleId, slug } = await params;
  const article = await getHostedPublicArticle({ articleId, slug });
  if (!article) notFound();

  const formattedDate = article.publishedAt.toLocaleDateString(
    article.language === "et" ? "et-EE" : article.language === "en" ? "en-GB" : "ru-RU",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          RankBoost Hosted Blog
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">
          {article.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
          <span>{formattedDate}</span>
          <a
            href={article.websiteUrl}
            className="text-blue-600 hover:text-blue-700"
          >
            {article.websiteUrl}
          </a>
        </div>
        <div className="my-8 h-px bg-slate-200" />
        <div
          className="prose prose-slate max-w-none prose-a:text-blue-600 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
        />
      </article>
    </main>
  );
}
