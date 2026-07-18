import assert from "node:assert/strict";

import {
  buildUniversalExport,
  htmlToMarkdown,
  normalizeSlug,
} from "./universal-export";

// Slug normalization: transliterate Cyrillic, fall back to title.
assert.equal(normalizeSlug("my-post", "Ignored"), "my-post");
assert.equal(normalizeSlug(null, "SEO аудит в Таллине"), "seo-audit-v-talline");
assert.equal(normalizeSlug("", "  "), "article");

// htmlToMarkdown handles common article tags.
const md = htmlToMarkdown(
  `<h2>Заголовок</h2><p>Первый абзац с <strong>жирным</strong> и <a href="/x">ссылкой</a>.</p>` +
    `<ul><li>Пункт 1</li><li>Пункт 2</li></ul>`
);
assert.ok(md.includes("## Заголовок"));
assert.ok(md.includes("**жирным**"));
assert.ok(md.includes("[ссылкой](/x)"));
assert.ok(md.includes("- Пункт 1"));
assert.ok(md.includes("- Пункт 2"));

assert.equal(htmlToMarkdown(""), "");
assert.equal(htmlToMarkdown("   "), "");

// Full export package.
const pkg = buildUniversalExport(
  {
    title: "Как выбрать SEO-подрядчика",
    slug: null,
    metaTitle: "Как выбрать SEO-подрядчика в 2026",
    metaDescription: "Практическое руководство по выбору SEO-агентства.",
    contentHtml: "<h2>Введение</h2><p>Текст статьи.</p>",
    language: "ru",
  },
  { websiteUrl: "https://example.com/some/path" }
);

assert.equal(pkg.slug, "kak-vybrat-seo-podryadchika");
assert.equal(pkg.canonicalUrl, "https://example.com/blog/kak-vybrat-seo-podryadchika");
assert.ok(pkg.html.startsWith("<!doctype html>"));
assert.ok(pkg.html.includes("<title>Как выбрать SEO-подрядчика в 2026</title>"));
assert.ok(pkg.html.includes('name="description"'));
assert.ok(pkg.html.includes('rel="canonical"'));
assert.ok(pkg.markdown.includes("## Введение"));
assert.equal(pkg.copy.metaTitle, "Как выбрать SEO-подрядчика в 2026");
assert.equal(pkg.copy.articleHtml, "<h2>Введение</h2><p>Текст статьи.</p>");
assert.ok(pkg.developerEmail.subject.includes("Как выбрать SEO-подрядчика"));
assert.ok(pkg.developerEmail.body.includes(pkg.canonicalUrl));
assert.ok(pkg.developerEmail.body.includes("## Введение"));

// Missing meta title falls back to the article title; missing description omitted.
const pkg2 = buildUniversalExport(
  { title: "Plain", contentHtml: "<p>Body</p>" },
  { websiteUrl: "not a url", blogPathSegment: "/news/" }
);
assert.equal(pkg2.metaTitle, "Plain");
assert.equal(pkg2.metaDescription, "");
assert.ok(!pkg2.html.includes('name="description"'));
assert.ok(pkg2.canonicalUrl.includes("/news/plain"));

console.log("universal export checks passed");
