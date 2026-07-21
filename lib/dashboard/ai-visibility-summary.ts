import type {
  AiVisibilityPlatform,
  AutopilotAiVisibilitySnapshot,
} from "@/lib/autopilot/ai-visibility-snapshot";

export type DashboardAiVisibilitySummary = {
  href: string;
  readinessScore: number | null;
  promptCount: number;
  status: "no_data" | "needs_work" | "building" | "ready";
  prompts: string[];
  platformCount: number;
};

export function buildDashboardAiVisibilitySummary({
  snapshot,
  href,
}: {
  snapshot: AutopilotAiVisibilitySnapshot | null | undefined;
  href: string;
}): DashboardAiVisibilitySummary | undefined {
  if (!snapshot) return undefined;

  return {
    href,
    readinessScore: snapshot.readinessScore,
    promptCount: snapshot.promptCount,
    status: snapshot.status,
    prompts: snapshot.prompts.slice(0, 2),
    platformCount: snapshot.platforms.filter(isNamedAiPlatform).length,
  };
}

function isNamedAiPlatform(platform: AiVisibilityPlatform): boolean {
  return platform !== "GENERIC";
}
