import type {
  PreparedFix,
  PreparedFixGeneratedBy,
  PreparedFixIntegrationRequirement,
  PreparedFixRiskLevel,
  PreparedFixStatus,
} from "@/lib/review-queue/types";
import type { HermesTaskPreparedFixResult } from "@/lib/hermes/types";

export type ParsedTaskRecommendationWithFix = {
  whyItMatters: string | null;
  recommendation: string | null;
  estimatedFixMinutes: number | null;
  auditCheckCode: string | null;
  preparedFix: PreparedFix | null;
};

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseRiskLevel(value: unknown): PreparedFixRiskLevel | undefined {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return undefined;
}

function parseIntegrationRequirement(
  value: unknown
): PreparedFixIntegrationRequirement | undefined {
  if (
    value === "none" ||
    value === "wordpress" ||
    value === "gsc" ||
    value === "manual"
  ) {
    return value;
  }
  return undefined;
}

function parseGeneratedBy(value: unknown): PreparedFixGeneratedBy {
  return value === "HERMES" ? "HERMES" : "TEMPLATE";
}

export function parsePreparedFix(value: unknown): PreparedFix | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const status = record.status;
  const type = record.type;

  if (
    status !== "AWAITING_REVIEW" &&
    status !== "APPROVED" &&
    status !== "REJECTED"
  ) {
    return null;
  }

  if (type !== "META_FIX" && type !== "SEO_FIX" && type !== "TASK_FIX") {
    return null;
  }

  const id = readString(record.id);
  const title = readString(record.title);
  const preview = readString(record.preview);
  const suggestedValue = readString(record.suggestedValue);
  const createdAt = readString(record.createdAt);
  const updatedAt = readString(record.updatedAt);
  const generatedAt =
    readString(record.generatedAt) ?? createdAt ?? updatedAt ?? null;

  if (!id || !title || !preview || !suggestedValue || !createdAt || !updatedAt) {
    return null;
  }

  return {
    id,
    type,
    status,
    field: readString(record.field) ?? undefined,
    title,
    preview,
    suggestedValue,
    summary: readString(record.summary) ?? undefined,
    whyItMatters: readString(record.whyItMatters) ?? undefined,
    implementationNotes: readString(record.implementationNotes) ?? undefined,
    riskLevel: parseRiskLevel(record.riskLevel),
    requiresIntegration: parseIntegrationRequirement(record.requiresIntegration),
    approvalRequired: readBoolean(record.approvalRequired, true),
    generatedBy: parseGeneratedBy(record.generatedBy),
    generatedAt: generatedAt ?? createdAt,
    fallbackUsed: readBoolean(record.fallbackUsed, parseGeneratedBy(record.generatedBy) === "TEMPLATE"),
    createdAt,
    updatedAt,
  };
}

export function parseTaskRecommendationWithFix(
  value: unknown
): ParsedTaskRecommendationWithFix {
  if (!value || typeof value !== "object") {
    return {
      whyItMatters: null,
      recommendation: null,
      estimatedFixMinutes: null,
      auditCheckCode: null,
      preparedFix: null,
    };
  }

  const record = value as Record<string, unknown>;

  return {
    whyItMatters: readString(record.whyItMatters),
    recommendation: readString(record.recommendation),
    estimatedFixMinutes:
      typeof record.estimatedFixMinutes === "number"
        ? record.estimatedFixMinutes
        : null,
    auditCheckCode: readString(record.auditCheckCode),
    preparedFix: parsePreparedFix(record.preparedFix),
  };
}

export function mergePreparedFixIntoRecommendation(
  recommendationJson: unknown,
  preparedFix: PreparedFix
): Record<string, unknown> {
  const base =
    recommendationJson && typeof recommendationJson === "object"
      ? { ...(recommendationJson as Record<string, unknown>) }
      : {};

  return {
    ...base,
    preparedFix,
  };
}

export function updatePreparedFixStatus(
  recommendationJson: unknown,
  status: PreparedFixStatus,
  updates?: Partial<
    Pick<PreparedFix, "preview" | "suggestedValue" | "summary" | "implementationNotes">
  >
): Record<string, unknown> | null {
  const parsed = parseTaskRecommendationWithFix(recommendationJson);
  if (!parsed.preparedFix) {
    return null;
  }

  const now = new Date().toISOString();
  const preparedFix: PreparedFix = {
    ...parsed.preparedFix,
    ...updates,
    status,
    updatedAt: now,
  };

  return mergePreparedFixIntoRecommendation(recommendationJson, preparedFix);
}

export function resolveFixType(
  auditCheckCode: string | null
): PreparedFix["type"] {
  if (!auditCheckCode) {
    return "TASK_FIX";
  }

  const code = auditCheckCode.toLowerCase();
  if (code.startsWith("title_") || code.startsWith("meta_description_")) {
    return "META_FIX";
  }

  if (
    code.startsWith("open_graph") ||
    code.startsWith("twitter_") ||
    code.startsWith("canonical_") ||
    code.startsWith("schema_")
  ) {
    return "SEO_FIX";
  }

  return "TASK_FIX";
}

export function resolveFixField(auditCheckCode: string | null): string | undefined {
  if (!auditCheckCode) {
    return undefined;
  }

  const code = auditCheckCode.toLowerCase();
  if (code.startsWith("title_")) {
    return "meta_title";
  }
  if (code.startsWith("meta_description_")) {
    return "meta_description";
  }
  if (code.startsWith("open_graph")) {
    return "open_graph";
  }
  if (code.startsWith("twitter_")) {
    return "twitter_card";
  }

  return undefined;
}

function buildSuggestedFix(input: {
  taskTitle: string;
  recommendation: string | null;
  whyItMatters: string | null;
  auditCheckCode: string | null;
}): {
  title: string;
  preview: string;
  suggestedValue: string;
  summary: string;
  whyItMatters: string;
  implementationNotes: string;
} {
  const field = resolveFixField(input.auditCheckCode);
  const recommendation =
    input.recommendation?.trim() ||
    input.whyItMatters?.trim() ||
    "Apply the recommended SEO improvement on your website.";
  const whyItMatters =
    input.whyItMatters?.trim() ||
    "This improvement helps search engines and visitors understand your page better.";

  if (field === "meta_title") {
    const suggested = input.taskTitle.replace(/^Fix\s+/i, "").slice(0, 60);
    return {
      title: "Prepared meta title",
      preview: `Suggested title: ${suggested}`,
      suggestedValue: suggested,
      summary: "Template meta title suggestion based on the audit task.",
      whyItMatters,
      implementationNotes:
        "Update the page title in your CMS or HTML <title> tag after review.",
    };
  }

  if (field === "meta_description") {
    const suggested = recommendation.slice(0, 155);
    return {
      title: "Prepared meta description",
      preview: suggested,
      suggestedValue: suggested,
      summary: "Template meta description suggestion based on the audit task.",
      whyItMatters,
      implementationNotes:
        "Update the meta description in your CMS after review.",
    };
  }

  return {
    title: `Prepared fix: ${input.taskTitle}`,
    preview: recommendation,
    suggestedValue: recommendation,
    summary: recommendation.slice(0, 180),
    whyItMatters,
    implementationNotes:
      "Review this recommendation and apply the change manually on your website.",
  };
}

export function buildPreparedFixForTask(input: {
  taskId: string;
  taskTitle: string;
  recommendationJson: unknown;
  fallbackUsed?: boolean;
}): PreparedFix {
  const parsed = parseTaskRecommendationWithFix(input.recommendationJson);
  const now = new Date().toISOString();
  const fixType = resolveFixType(parsed.auditCheckCode);
  const suggested = buildSuggestedFix({
    taskTitle: input.taskTitle,
    recommendation: parsed.recommendation,
    whyItMatters: parsed.whyItMatters,
    auditCheckCode: parsed.auditCheckCode,
  });

  return {
    id: `fix-${input.taskId}`,
    type: fixType,
    status: "AWAITING_REVIEW",
    field: resolveFixField(parsed.auditCheckCode),
    title: suggested.title,
    preview: suggested.preview,
    suggestedValue: suggested.suggestedValue,
    summary: suggested.summary,
    whyItMatters: suggested.whyItMatters,
    implementationNotes: suggested.implementationNotes,
    riskLevel: "low",
    requiresIntegration: "manual",
    approvalRequired: true,
    generatedBy: "TEMPLATE",
    generatedAt: now,
    fallbackUsed: input.fallbackUsed ?? true,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildPreparedFixFromHermes(input: {
  taskId: string;
  recommendationJson: unknown;
  hermes: HermesTaskPreparedFixResult;
}): PreparedFix {
  const parsed = parseTaskRecommendationWithFix(input.recommendationJson);
  const now = new Date().toISOString();
  const fixType = resolveFixType(parsed.auditCheckCode);

  return {
    id: `fix-${input.taskId}`,
    type: fixType,
    status: "AWAITING_REVIEW",
    field: resolveFixField(parsed.auditCheckCode),
    title: input.hermes.title,
    preview: input.hermes.proposedFix,
    suggestedValue: input.hermes.proposedFix,
    summary: input.hermes.summary,
    whyItMatters: input.hermes.whyItMatters,
    implementationNotes: input.hermes.implementationNotes,
    riskLevel: input.hermes.riskLevel,
    requiresIntegration: input.hermes.requiresIntegration,
    approvalRequired: input.hermes.approvalRequired,
    generatedBy: "HERMES",
    generatedAt: now,
    fallbackUsed: false,
    createdAt: now,
    updatedAt: now,
  };
}
