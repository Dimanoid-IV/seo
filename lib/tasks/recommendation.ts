export type ParsedTaskRecommendation = {
  whyItMatters: string | null;
  recommendation: string | null;
  estimatedFixMinutes: number | null;
  auditCheckCode: string | null;
};

export function parseTaskRecommendation(
  value: unknown
): ParsedTaskRecommendation {
  if (!value || typeof value !== "object") {
    return {
      whyItMatters: null,
      recommendation: null,
      estimatedFixMinutes: null,
      auditCheckCode: null,
    };
  }

  const record = value as Record<string, unknown>;

  return {
    whyItMatters:
      typeof record.whyItMatters === "string" ? record.whyItMatters : null,
    recommendation:
      typeof record.recommendation === "string" ? record.recommendation : null,
    estimatedFixMinutes:
      typeof record.estimatedFixMinutes === "number"
        ? record.estimatedFixMinutes
        : null,
    auditCheckCode:
      typeof record.auditCheckCode === "string" ? record.auditCheckCode : null,
  };
}
