import type { CheerioAPI } from "cheerio";

export type TextFieldStat = {
  text: string | null;
  length: number;
  exists: boolean;
};

export type HeadingStat = {
  count: number;
  texts: string[];
};

export type CanonicalStat = {
  href: string | null;
  exists: boolean;
  isAbsolute: boolean;
};

export type RobotsMetaStat = {
  content: string | null;
  noindex: boolean;
  nofollow: boolean;
};

export type OpenGraphStat = {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  type: string | null;
  exists: boolean;
};

export type TwitterCardStat = {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  exists: boolean;
};

export type ImagesStat = {
  total: number;
  missingAlt: number;
  emptyAlt: number;
  withAlt: number;
};

export type LinksStat = {
  total: number;
  internal: number;
  external: number;
  nofollow: number;
  brokenFormat: number;
};

export type SchemaStat = {
  jsonLdCount: number;
  types: string[];
  hasOrganization: boolean;
  hasLocalBusiness: boolean;
  hasFAQ: boolean;
  hasBreadcrumb: boolean;
};

export type LangStat = {
  htmlLang: string | null;
  exists: boolean;
};

export type ViewportStat = {
  content: string | null;
  exists: boolean;
};

/** Structured on-page SEO facts extracted from a single HTML document. */
export type OnPageSeoData = {
  title: TextFieldStat;
  metaDescription: TextFieldStat;
  h1: HeadingStat;
  h2: HeadingStat;
  canonical: CanonicalStat;
  robotsMeta: RobotsMetaStat;
  openGraph: OpenGraphStat;
  twitterCard: TwitterCardStat;
  images: ImagesStat;
  links: LinksStat;
  schema: SchemaStat;
  lang: LangStat;
  viewport: ViewportStat;
  wordCount: number;
  textSample: string;
};

export type ParsedHtmlDocument = {
  /** Cheerio root instance for further inspection. */
  root: CheerioAPI;
  /** Base URL used to resolve relative links (respects `<base href>`). */
  baseUrl: string;
  /** Final page URL passed into the parser. */
  finalUrl: string;
};
