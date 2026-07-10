import "server-only";

import { isHermesConfigured } from "@/lib/hermes/client";

import type { ContentResearchBrief } from "./types";
import type { ResearchSourceContext } from "./source-context";

/**
 * Optional Hermes enhancement hook — fails gracefully, never required.
 * Does not expose secrets; only enriches outline/FAQ when Hermes is configured.
 */
export async function tryEnhanceBriefWithHermes(
  brief: ContentResearchBrief,
  context: ResearchSourceContext
): Promise<ContentResearchBrief> {
  void context;

  if (!isHermesConfigured()) {
    return brief;
  }

  // Hermes article-research endpoint is not wired yet (Prompt 11.23).
  // When available, call a lightweight research enrichment here.
  // For now, mark as not enhanced and return the deterministic brief unchanged.
  return {
    ...brief,
    hermesEnhanced: false,
  };
}
