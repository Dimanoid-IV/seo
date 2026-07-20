import * as cheerio from "cheerio";

import { fetchHtmlPage } from "@/lib/audit/fetch";

import type { BrandKitConfidence, BrandKitProfile } from "./types";

const COLOR_RE = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi;
const RGB_RE = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
const PAGE_FETCH_TIMEOUT_MS = 8_000;

function normalizeHex(value: string): string | null {
  const raw = value.trim().toLowerCase();
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(raw)) return null;
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }
  return raw;
}

function rgbToHex(r: number, g: number, b: number): string | null {
  if ([r, g, b].some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return null;
  }
  return `#${[r, g, b]
    .map((n) => Math.round(n).toString(16).padStart(2, "0"))
    .join("")}`;
}

function colorDistanceFromGray(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const avg = (r + g + b) / 3;
  return Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg);
}

function isUsefulBrandColor(hex: string): boolean {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max < 24 || min > 245) return false;
  if (max - min < 12 && colorDistanceFromGray(hex) < 35) return false;
  return true;
}

function addColor(
  counts: Map<string, number>,
  color: string | null,
  weight = 1
): void {
  if (!color || !isUsefulBrandColor(color)) return;
  counts.set(color, (counts.get(color) ?? 0) + weight);
}

function collectColorsFromHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const counts = new Map<string, number>();

  $("meta[name='theme-color'], meta[name='msapplication-TileColor']").each(
    (_, el) => {
      addColor(counts, normalizeHex($(el).attr("content") ?? ""), 8);
    }
  );

  $("[style]").each((_, el) => {
    const style = $(el).attr("style") ?? "";
    for (const match of style.matchAll(COLOR_RE)) {
      addColor(counts, normalizeHex(match[0]), 3);
    }
    for (const match of style.matchAll(RGB_RE)) {
      addColor(
        counts,
        rgbToHex(Number(match[1]), Number(match[2]), Number(match[3])),
        3
      );
    }
  });

  for (const match of html.matchAll(COLOR_RE)) {
    addColor(counts, normalizeHex(match[0]), 1);
  }
  for (const match of html.matchAll(RGB_RE)) {
    addColor(
      counts,
      rgbToHex(Number(match[1]), Number(match[2]), Number(match[3])),
      1
    );
  }

  return [...counts.entries()]
    .sort((a, b) => {
      const scoreDiff = b[1] - a[1];
      if (scoreDiff !== 0) return scoreDiff;
      return colorDistanceFromGray(b[0]) - colorDistanceFromGray(a[0]);
    })
    .map(([color]) => color)
    .slice(0, 6);
}

function confidenceForPalette(palette: string[]): BrandKitConfidence {
  if (palette.length >= 3) return "high";
  if (palette.length >= 1) return "medium";
  return "low";
}

export function extractBrandKitFromHtml(input: {
  websiteUrl: string;
  html: string;
}): BrandKitProfile {
  const palette = collectColorsFromHtml(input.html);
  return {
    palette,
    primaryColor: palette[0] ?? null,
    secondaryColor: palette[1] ?? null,
    accentColor: palette[2] ?? null,
    confidence: confidenceForPalette(palette),
    sourceUrls: [input.websiteUrl],
    updatedAt: new Date().toISOString(),
  };
}

export async function extractBrandKitFromWebsite(input: {
  websiteUrl: string;
  homepageHtml?: string;
}): Promise<BrandKitProfile> {
  const websiteUrl = input.websiteUrl.replace(/\/$/, "");
  const html =
    input.homepageHtml ??
    (await fetchHtmlPage(websiteUrl, PAGE_FETCH_TIMEOUT_MS).then(
      (result) => result.html
    ));
  if (!html) {
    return {
      palette: [],
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      confidence: "low",
      sourceUrls: [websiteUrl],
      updatedAt: new Date().toISOString(),
    };
  }
  return extractBrandKitFromHtml({ websiteUrl, html });
}
