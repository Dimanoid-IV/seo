import type { MetadataRoute } from "next";
import { locales, siteUrl } from "@/i18n/config";
import { getLocalizedPath } from "@/lib/i18n";
import { blogPosts } from "@/data/blog-posts";

const staticPages = [
  "",
  "/services",
  "/pricing",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
];

function buildHreflangAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${siteUrl}${getLocalizedPath(l, path)}`;
  }
  languages["x-default"] = `${siteUrl}${getLocalizedPath("ru", path)}`;
  return languages;
}

function buildBlogAlternates(translationKey: string): Record<string, string> {
  const related = blogPosts.filter((p) => p.translationKey === translationKey);
  const languages: Record<string, string> = {};
  for (const post of related) {
    languages[post.locale] = `${siteUrl}${getLocalizedPath(post.locale, `/blog/${post.slug}`)}`;
  }
  languages["x-default"] = languages.ru ?? Object.values(languages)[0];
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${siteUrl}${getLocalizedPath(locale, page)}`,
        lastModified: new Date(),
        changeFrequency:
          page === "" ? "weekly" : page === "/blog" ? "daily" : "monthly",
        priority: page === "" ? 1 : page === "/contact" ? 0.9 : 0.8,
        alternates: {
          languages: buildHreflangAlternates(page),
        },
      });
    }
  }

  const seenKeys = new Set<string>();
  for (const post of blogPosts) {
    if (seenKeys.has(`${post.locale}-${post.slug}`)) continue;
    entries.push({
      url: `${siteUrl}${getLocalizedPath(post.locale, `/blog/${post.slug}`)}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: buildBlogAlternates(post.translationKey),
      },
    });
  }

  return entries;
}
