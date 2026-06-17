import type { Locale } from "@/i18n/config";

export type BlogFAQItem = {
  question: string;
  answer: string;
};

export type ContentSection =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "links"; title: string; items: { label: string; href: string }[] }
  | {
      type: "cta";
      title: string;
      description: string;
      buttonLabel: string;
      href: string;
    };

export type BlogPost = {
  locale: Locale;
  translationKey: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  date: string;
  author: "RankBoost Team";
  category: string;
  excerpt: string;
  content: ContentSection[];
  faq: BlogFAQItem[];
  tags: string[];
  readTime: number;
};

export type ArticleInput = Omit<BlogPost, "readTime" | "author"> & {
  author?: "RankBoost Team";
};

export function calculateReadTime(sections: ContentSection[], faq: BlogFAQItem[]): number {
  let words = 0;
  for (const s of sections) {
    if (s.type === "h2" || s.type === "h3" || s.type === "p") words += s.text.split(/\s+/).length;
    if (s.type === "ul" || s.type === "ol") words += s.items.join(" ").split(/\s+/).length;
    if (s.type === "cta") words += (s.title + s.description).split(/\s+/).length;
    if (s.type === "links") words += s.items.map((i) => i.label).join(" ").split(/\s+/).length;
  }
  for (const f of faq) words += (f.question + f.answer).split(/\s+/).length;
  return Math.max(4, Math.ceil(words / 200));
}

export function buildPost(input: ArticleInput): BlogPost {
  return {
    ...input,
    author: input.author ?? "RankBoost Team",
    readTime: calculateReadTime(input.content, input.faq),
  };
}

export const BLOG_CATEGORIES = [
  "General SEO",
  "Local SEO",
  "E-commerce SEO",
  "Technical SEO",
  "SEO Strategy",
  "Content SEO",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
