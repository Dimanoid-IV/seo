import { siteUrl } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/data/blog/types";
import { getLocalizedPath } from "@/lib/i18n";

type BlogJsonLdProps = {
  post: BlogPost;
  locale: Locale;
};

export function BlogJsonLd({ post, locale }: BlogJsonLdProps) {
  const url = `${siteUrl}${getLocalizedPath(locale, `/blog/${post.slug}`)}`;

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "RankBoost.eu",
      url: siteUrl,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: post.category,
    keywords: post.tags.join(", "),
  };

  const faqPage =
    post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting) }}
      />
      {faqPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
        />
      )}
    </>
  );
}
