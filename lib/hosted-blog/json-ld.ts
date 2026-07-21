import type { HostedPublicArticle } from "./public-article";

function siteNameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Customer website";
  }
}

export function buildHostedArticleJsonLd(article: HostedPublicArticle) {
  const customerSiteName = siteNameFromUrl(article.websiteUrl);
  const keywords = article.targetKeyword?.trim()
    ? [article.targetKeyword.trim()]
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription || undefined,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    inLanguage: article.language,
    url: article.hostedUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.hostedUrl,
    },
    author: {
      "@type": "Organization",
      name: customerSiteName,
      url: article.websiteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "RankBoost.eu",
      url: "https://www.rankboost.eu",
    },
    isPartOf: {
      "@type": "Blog",
      name: `${customerSiteName} articles by RankBoost`,
      url: article.websiteUrl,
    },
    keywords,
  };
}
