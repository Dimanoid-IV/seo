import "server-only";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

import { normalizeMonthKey } from "./month-utils";
import { resolvePlanItemsDocumentFromPlan } from "./plan-items";
import {
  collectPublicationCalendarEntries,
  type PublicationCalendarData,
} from "./publication-calendar";
import { resolveWebsiteForAutopilot } from "./resolve-website";

export async function getPublicationCalendar(input: {
  currentUser: CurrentUser;
  month: string;
  websiteId?: string | null;
}): Promise<PublicationCalendarData> {
  const month = normalizeMonthKey(input.month);
  const { website } = await resolveWebsiteForAutopilot(
    input.currentUser.id,
    input.currentUser.organizationId,
    input.websiteId
  );

  const plans = await getPrisma().monthlyAutopilotPlan.findMany({
    where: { websiteId: website.id, archivedAt: null },
    orderBy: [{ updatedAt: "desc" }, { month: "desc" }],
    take: 24,
    select: {
      id: true,
      month: true,
      status: true,
      planItemsJson: true,
      recommendationsJson: true,
      taskIds: true,
      articleIds: true,
      socialPostIds: true,
    },
  });

  const parsedPlans = plans.flatMap((plan) => {
    const document = resolvePlanItemsDocumentFromPlan({
      planItemsJson: plan.planItemsJson,
      recommendationsJson: plan.recommendationsJson,
      taskIds: plan.taskIds,
      articleIds: plan.articleIds,
      socialPostIds: plan.socialPostIds,
    });
    if (!document) return [];
    return [{
      id: plan.id,
      month: plan.month,
      status: String(plan.status),
      items: document.items,
    }];
  });

  const entries = collectPublicationCalendarEntries(parsedPlans, month);

  return {
    month,
    websiteId: website.id,
    websiteUrl: website.url,
    entries,
    approvedPlanCount: new Set(
      entries
        .filter((entry) => entry.planStatus === "approved")
        .map((entry) => entry.planId)
    ).size,
  };
}

