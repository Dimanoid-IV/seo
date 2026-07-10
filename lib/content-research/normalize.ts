const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "to",
  "in",
  "on",
  "at",
  "of",
  "is",
  "are",
  "как",
  "для",
  "и",
  "или",
  "на",
  "в",
  "что",
  "это",
  "ja",
  "või",
  "ning",
  "on",
  "et",
]);

/**
 * Normalizes a keyword phrase for deduplication and matching.
 */
export function normalizeKeyword(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s\-+]/gu, "")
    .trim();
}

export function dedupeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of keywords) {
    const normalized = normalizeKeyword(raw);
    if (!normalized || normalized.length < 2) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(raw.trim());
  }

  return result;
}

/**
 * Extracts candidate keyword phrases from free text (title, description).
 */
export function extractKeywordCandidates(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const candidates: string[] = [trimmed];

  const quoted = trimmed.match(/[«""]([^«""]+)[»""]/g);
  if (quoted) {
    for (const match of quoted) {
      candidates.push(match.replace(/[«""»""]/g, "").trim());
    }
  }

  const withoutPrefix = trimmed
    .replace(/^(review|continue|finish|create|создать|продолжить|jätkake):\s*/i, "")
    .trim();
  if (withoutPrefix && withoutPrefix !== trimmed) {
    candidates.push(withoutPrefix);
  }

  const words = normalizeKeyword(trimmed).split(" ").filter(Boolean);
  if (words.length >= 2 && words.length <= 8) {
    const filtered = words.filter((w) => !STOP_WORDS.has(w));
    if (filtered.length >= 2) {
      candidates.push(filtered.join(" "));
    }
  }

  return dedupeKeywords(candidates);
}

export function extractDomainFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function extractDomainsFromText(text: string): string[] {
  const domains: string[] = [];
  const urlPattern =
    /(?:https?:\/\/)?(?:www\.)?([a-z0-9][-a-z0-9]*(?:\.[a-z0-9][-a-z0-9]*)+\.[a-z]{2,})/gi;

  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(text)) !== null) {
    const domain = match[1]?.toLowerCase();
    if (domain && !domains.includes(domain)) {
      domains.push(domain);
    }
  }

  return domains;
}
