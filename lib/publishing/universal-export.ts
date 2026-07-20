/**
 * Universal Publishing export.
 *
 * Produces a copy/paste- and download-ready package for an article so that a
 * site without a native RankBoost integration (custom / unknown platform) is
 * never a dead-end. Pure and dependency-light (cheerio only) so it can be unit
 * tested without a database or network.
 */

import * as cheerio from "cheerio";

export interface UniversalExportArticleInput {
  title: string;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  contentHtml?: string | null;
  targetKeyword?: string | null;
  language?: string | null;
  coverImageUrl?: string | null;
}

export interface UniversalExportSiteInput {
  /** Base URL of the target website (e.g. https://example.com). */
  websiteUrl: string;
  /** Path segment articles live under; defaults to "blog". */
  blogPathSegment?: string;
  brandKit?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    palette?: string[];
  } | null;
}

export interface UniversalExportCopyBlocks {
  articleHtml: string;
  articleMarkdown: string;
  metaTitle: string;
  metaDescription: string;
}

export interface UniversalExportDeveloperEmail {
  subject: string;
  body: string;
}

export interface UniversalExportPackage {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  coverImagePlaceholder: string | null;
  /** Full standalone HTML document (includes <head> meta). */
  html: string;
  /** Just the article body HTML. */
  bodyHtml: string;
  markdown: string;
  copy: UniversalExportCopyBlocks;
  developerEmail: UniversalExportDeveloperEmail;
  brandKit?: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    palette: string[];
  } | null;
}

export function buildUniversalExport(
  article: UniversalExportArticleInput,
  site: UniversalExportSiteInput
): UniversalExportPackage {
  const title = (article.title ?? "").trim() || "Untitled";
  const metaTitle = (article.metaTitle ?? "").trim() || title;
  const metaDescription = (article.metaDescription ?? "").trim();
  const slug = normalizeSlug(article.slug, title);
  const bodyHtml = (article.contentHtml ?? "").trim();
  const canonicalUrl = buildCanonicalUrl(site, slug);
  const coverImagePlaceholder = article.coverImageUrl?.trim() || null;

  const markdown = htmlToMarkdown(bodyHtml);
  const html = buildStandaloneHtml({
    title,
    metaTitle,
    metaDescription,
    canonicalUrl,
    language: article.language ?? "ru",
    bodyHtml,
    brandKit: site.brandKit ?? null,
  });

  return {
    slug,
    metaTitle,
    metaDescription,
    canonicalUrl,
    coverImagePlaceholder,
    html,
    bodyHtml,
    markdown,
    copy: {
      articleHtml: bodyHtml,
      articleMarkdown: markdown,
      metaTitle,
      metaDescription,
    },
    developerEmail: buildDeveloperEmail({
      title,
      metaTitle,
      metaDescription,
      canonicalUrl,
      markdown,
      brandKit: site.brandKit ?? null,
    }),
    brandKit: site.brandKit
      ? {
          primaryColor: site.brandKit.primaryColor ?? null,
          secondaryColor: site.brandKit.secondaryColor ?? null,
          accentColor: site.brandKit.accentColor ?? null,
          palette: site.brandKit.palette ?? [],
        }
      : null,
  };
}

/** Builds a canonical URL suggestion under the site's blog path. */
function buildCanonicalUrl(site: UniversalExportSiteInput, slug: string): string {
  const segment = (site.blogPathSegment ?? "blog").replace(/^\/+|\/+$/g, "");
  let base: string;
  try {
    base = new URL(site.websiteUrl).origin;
  } catch {
    base = (site.websiteUrl ?? "").replace(/\/+$/g, "");
  }
  return `${base}/${segment}/${slug}`.replace(/([^:]\/)\/+/g, "$1");
}

const CYRILLIC_TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function normalizeSlug(existing: string | null | undefined, fallbackTitle: string): string {
  const source = (existing ?? "").trim() || fallbackTitle;
  const transliterated = source
    .toLowerCase()
    .split("")
    .map((ch) => (ch in CYRILLIC_TRANSLIT ? CYRILLIC_TRANSLIT[ch] : ch))
    .join("");

  const slug = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || "article";
}

interface StandaloneHtmlInput {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  language: string;
  bodyHtml: string;
  brandKit?: UniversalExportSiteInput["brandKit"];
}

function buildStandaloneHtml(input: StandaloneHtmlInput): string {
  const lang = escapeAttr((input.language || "ru").toLowerCase());
  const brandStyle = buildBrandStyle(input.brandKit ?? null);
  return [
    "<!doctype html>",
    `<html lang="${lang}">`,
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escapeHtml(input.metaTitle)}</title>`,
    input.metaDescription
      ? `  <meta name="description" content="${escapeAttr(input.metaDescription)}" />`
      : null,
    `  <link rel="canonical" href="${escapeAttr(input.canonicalUrl)}" />`,
    brandStyle,
    "</head>",
    "<body>",
    "  <article>",
    `    <h1>${escapeHtml(input.title)}</h1>`,
    input.bodyHtml,
    "  </article>",
    "</body>",
    "</html>",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function safeCssColor(value: string | null | undefined): string | null {
  const color = value?.trim().toLowerCase();
  if (!color) return null;
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(color)) return color;
  return null;
}

function buildBrandStyle(
  brandKit: UniversalExportSiteInput["brandKit"]
): string {
  const primary =
    safeCssColor(brandKit?.primaryColor) ??
    safeCssColor(brandKit?.palette?.[0]) ??
    "#2563eb";
  const secondary =
    safeCssColor(brandKit?.secondaryColor) ??
    safeCssColor(brandKit?.palette?.[1]) ??
    "#0f172a";
  const accent =
    safeCssColor(brandKit?.accentColor) ??
    safeCssColor(brandKit?.palette?.[2]) ??
    primary;

  return [
    "  <style>",
    `    :root { --rb-brand-primary: ${primary}; --rb-brand-secondary: ${secondary}; --rb-brand-accent: ${accent}; }`,
    "    body { margin: 0; background: #ffffff; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; }",
    "    article { box-sizing: border-box; width: min(760px, calc(100% - 32px)); margin: 48px auto; }",
    "    h1 { color: var(--rb-brand-secondary); font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.08; margin: 0 0 28px; }",
    "    h2, h3 { color: var(--rb-brand-secondary); margin-top: 2rem; line-height: 1.2; }",
    "    h2::after { content: ''; display: block; width: 56px; height: 3px; margin-top: 10px; background: var(--rb-brand-accent); border-radius: 999px; }",
    "    a { color: var(--rb-brand-primary); font-weight: 600; }",
    "    blockquote { border-left: 4px solid var(--rb-brand-accent); margin-left: 0; padding-left: 1rem; color: #334155; }",
    "    img { max-width: 100%; height: auto; border-radius: 8px; }",
    "  </style>",
  ].join("\n");
}

interface DeveloperEmailInput {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  markdown: string;
  brandKit?: UniversalExportSiteInput["brandKit"];
}

function buildDeveloperEmail(input: DeveloperEmailInput): UniversalExportDeveloperEmail {
  const subject = `Новая статья для публикации: ${input.title}`;
  const body = [
    "Здравствуйте!",
    "",
    "Подготовлена новая статья для публикации на сайте. Ниже — всё необходимое.",
    "",
    `SEO-заголовок (title): ${input.metaTitle}`,
    input.metaDescription ? `Meta description: ${input.metaDescription}` : null,
    `Рекомендуемый адрес страницы (canonical): ${input.canonicalUrl}`,
    input.brandKit?.primaryColor
      ? `Основной цвет бренда: ${input.brandKit.primaryColor}`
      : null,
    input.brandKit?.palette?.length
      ? `Палитра бренда: ${input.brandKit.palette.join(", ")}`
      : null,
    "",
    "Инструкция:",
    "1. Создайте новую страницу/пост в блоге.",
    "2. Установите заголовок, meta title и meta description из полей выше.",
    "3. Вставьте текст статьи (ниже в формате Markdown).",
    "4. Опубликуйте страницу по указанному адресу.",
    "",
    "--- ТЕКСТ СТАТЬИ (Markdown) ---",
    "",
    input.markdown,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return { subject, body };
}

/** Minimal, deterministic HTML → Markdown conversion for common article tags. */
export function htmlToMarkdown(html: string): string {
  if (!html.trim()) {
    return "";
  }

  const $ = cheerio.load(html, null, false);
  const blocks: string[] = [];

  $.root()
    .contents()
    .each((_, node) => {
      const md = renderNode($, node);
      if (md.trim()) {
        blocks.push(md.trim());
      }
    });

  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderNode($: cheerio.CheerioAPI, node: any): string {
  if (node.type === "text") {
    return collapseWhitespace(node.data ?? "");
  }
  if (node.type !== "tag") {
    return "";
  }

  const tag = node.name?.toLowerCase();
  const inner = inlineChildren($, node);

  switch (tag) {
    case "h1":
      return `# ${inner}`;
    case "h2":
      return `## ${inner}`;
    case "h3":
      return `### ${inner}`;
    case "h4":
      return `#### ${inner}`;
    case "h5":
    case "h6":
      return `##### ${inner}`;
    case "p":
      return inner;
    case "br":
      return "\n";
    case "blockquote":
      return inner
        .split("\n")
        .map((line) => `> ${line}`.trimEnd())
        .join("\n");
    case "ul":
      return listItems($, node, false);
    case "ol":
      return listItems($, node, true);
    case "pre":
    case "code":
      return "```\n" + $(node).text().trim() + "\n```";
    case "hr":
      return "---";
    default:
      // Wrapper tags (div/section/article/etc.): recurse into children.
      return renderBlockChildren($, node);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBlockChildren($: cheerio.CheerioAPI, node: any): string {
  const parts: string[] = [];
  $(node)
    .contents()
    .each((_, child) => {
      const md = renderNode($, child);
      if (md.trim()) {
        parts.push(md.trim());
      }
    });
  return parts.join("\n\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function listItems($: cheerio.CheerioAPI, node: any, ordered: boolean): string {
  const items: string[] = [];
  $(node)
    .children("li")
    .each((index, li) => {
      const text = inlineChildren($, li);
      const marker = ordered ? `${index + 1}.` : "-";
      items.push(`${marker} ${text}`.trim());
    });
  return items.join("\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inlineChildren($: cheerio.CheerioAPI, node: any): string {
  let out = "";
  $(node)
    .contents()
    .each((_, child) => {
      out += renderInline($, child);
    });
  return collapseWhitespace(out).trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderInline($: cheerio.CheerioAPI, node: any): string {
  if (node.type === "text") {
    return node.data ?? "";
  }
  if (node.type !== "tag") {
    return "";
  }

  const tag = node.name?.toLowerCase();
  const inner = inlineChildren($, node);

  switch (tag) {
    case "strong":
    case "b":
      return `**${inner}**`;
    case "em":
    case "i":
      return `*${inner}*`;
    case "a": {
      const href = $(node).attr("href") ?? "";
      return href ? `[${inner}](${href})` : inner;
    }
    case "code":
      return `\`${inner}\``;
    case "br":
      return "\n";
    default:
      return inner;
  }
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
