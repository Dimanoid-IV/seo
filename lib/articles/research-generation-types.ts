import type { ContentResearchBrief } from "@/lib/content-research/types";

export type ArticleQualityCheckSeverity = "error" | "warning" | "info";

export type ArticleQualityCheck = {
  key: string;
  label: string;
  passed: boolean;
  severity: ArticleQualityCheckSeverity;
  message: string;
};

/** Full quality report for research-aware article generation (Prompt 11.23). */
export type ArticleQualityReport = {
  score: number;
  passed: boolean;
  checks: ArticleQualityCheck[];
  revisionNotes: string[];
  validatedAt: string;
  threshold: number;
};

export type ArticleGenerationMetadata = {
  source: "AUTOPILOT_PLAN" | "MANUAL_RESEARCH";
  researchBriefId: string;
  researchBriefSummary: {
    primaryKeyword: string;
    buyerQuestion: string;
    geoPromptCount: number;
  };
  monthlyAutopilotPlanId?: string;
  planItemId?: string;
  geoPromptsUsed: string[];
  evidenceNotes: Array<{ label: string; value: string }>;
  qualityReport: ArticleQualityReport;
  humanizedAt?: string;
  humanizerMethod?: "hermes" | "deterministic";
  generatedAt: string;
};

export const RESEARCH_QUALITY_PASS_THRESHOLD = 80;

export function buildEvidenceNotes(
  brief: ContentResearchBrief
): ArticleGenerationMetadata["evidenceNotes"] {
  return brief.evidence.slice(0, 12).map((item) => ({
    label: item.label,
    value: item.value,
  }));
}
