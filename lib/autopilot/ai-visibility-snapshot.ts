import type {
  AutopilotPlanItem,
  AutopilotPlanItemsDocument,
} from "./plan-item-types";

export type AiVisibilityPlatform =
  | "CHATGPT"
  | "CLAUDE"
  | "PERPLEXITY"
  | "GEMINI"
  | "GOOGLE_AI"
  | "GENERIC";

export type AutopilotAiVisibilityStatus =
  | "no_data"
  | "needs_work"
  | "building"
  | "ready";

export type AutopilotAiVisibilitySnapshot = {
  readinessScore: number | null;
  promptCount: number;
  platforms: AiVisibilityPlatform[];
  prompts: string[];
  mentionAngles: string[];
  coverage: Record<AiVisibilityPlatform, boolean>;
  status: AutopilotAiVisibilityStatus;
};

const KNOWN_PLATFORMS: AiVisibilityPlatform[] = [
  "CHATGPT",
  "CLAUDE",
  "PERPLEXITY",
  "GEMINI",
  "GOOGLE_AI",
  "GENERIC",
];

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePlatform(value: unknown): AiVisibilityPlatform {
  const raw = stringValue(value)?.toUpperCase().replace(/[\s-]+/g, "_");
  if (raw === "CHAT_GPT") return "CHATGPT";
  if (raw === "GOOGLE" || raw === "GOOGLE_AI_MODE") return "GOOGLE_AI";
  if (raw && KNOWN_PLATFORMS.includes(raw as AiVisibilityPlatform)) {
    return raw as AiVisibilityPlatform;
  }
  return "GENERIC";
}

function uniqueFirst(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value.trim());
    if (result.length >= limit) break;
  }
  return result;
}

function collectGeoPrompt(
  prompt: unknown,
  platforms: Set<AiVisibilityPlatform>,
  prompts: string[],
  angles: string[]
) {
  if (typeof prompt === "string") {
    const value = stringValue(prompt);
    if (value) {
      platforms.add("GENERIC");
      prompts.push(value);
    }
    return;
  }

  if (!prompt || typeof prompt !== "object" || Array.isArray(prompt)) return;
  const record = prompt as Record<string, unknown>;
  const text = stringValue(record.prompt);
  if (!text) return;

  platforms.add(normalizePlatform(record.platform));
  prompts.push(text);

  const angle = stringValue(record.desiredMentionAngle);
  if (angle) angles.push(angle);
}

function collectArticlePrompts(
  item: AutopilotPlanItem,
  platforms: Set<AiVisibilityPlatform>,
  prompts: string[],
  angles: string[]
) {
  if (item.type !== "ARTICLE") return;
  const brief = item.researchBrief;
  if (!brief || typeof brief !== "object" || Array.isArray(brief)) return;
  const record = brief as Record<string, unknown>;
  const geoPrompts = record.geoPrompts;
  if (!Array.isArray(geoPrompts)) return;

  for (const prompt of geoPrompts) {
    collectGeoPrompt(prompt, platforms, prompts, angles);
  }
}

function resolveStatus(input: {
  readinessScore: number | null;
  promptCount: number;
  platformCount: number;
}): AutopilotAiVisibilityStatus {
  if (input.promptCount === 0 && input.readinessScore === null) return "no_data";
  if (input.promptCount === 0) return "needs_work";
  if (
    (input.readinessScore === null || input.readinessScore >= 70) &&
    input.promptCount >= 3 &&
    input.platformCount >= 3
  ) {
    return "ready";
  }
  if (input.readinessScore !== null && input.readinessScore < 45) {
    return "needs_work";
  }
  return "building";
}

export function buildAutopilotAiVisibilitySnapshot(input: {
  document: AutopilotPlanItemsDocument | null | undefined;
  readinessScore?: number | null;
}): AutopilotAiVisibilitySnapshot | null {
  const score =
    typeof input.readinessScore === "number" &&
    Number.isFinite(input.readinessScore)
      ? Math.max(0, Math.min(100, Math.round(input.readinessScore)))
      : null;

  const platforms = new Set<AiVisibilityPlatform>();
  const prompts: string[] = [];
  const angles: string[] = [];

  for (const item of input.document?.items ?? []) {
    collectArticlePrompts(item, platforms, prompts, angles);
  }

  const platformList = KNOWN_PLATFORMS.filter((platform) =>
    platforms.has(platform)
  );
  const promptCount = uniqueFirst(prompts, Number.MAX_SAFE_INTEGER).length;
  const coverage = Object.fromEntries(
    KNOWN_PLATFORMS.map((platform) => [platform, platforms.has(platform)])
  ) as Record<AiVisibilityPlatform, boolean>;

  if (promptCount === 0 && score === null) return null;

  return {
    readinessScore: score,
    promptCount,
    platforms: platformList,
    prompts: uniqueFirst(prompts, 4),
    mentionAngles: uniqueFirst(angles, 4),
    coverage,
    status: resolveStatus({
      readinessScore: score,
      promptCount,
      platformCount: platformList.filter((p) => p !== "GENERIC").length,
    }),
  };
}
