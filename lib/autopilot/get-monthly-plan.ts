import "server-only";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

import { formatMonthlyAutopilotPlan } from "./format";
import { currentMonthKey, normalizeMonthKey } from "./month-utils";
import { resolveWebsiteForAutopilot } from "./resolve-website";
import { getMonthlyAutopilotSourceData } from "./source-data";
import type { MonthlyAutopilotGetResponse } from "./types";

export async function getMonthlyAutopilotPlan(input: {
  currentUser: CurrentUser;
  month?: string;
  websiteId?: string | null;
}): Promise<MonthlyAutopilotGetResponse> {
  const month = input.month ? normalizeMonthKey(input.month) : currentMonthKey();

  try {
    const { organization, website } = await resolveWebsiteForAutopilot(
      input.currentUser.id,
      input.currentUser.organizationId,
      input.websiteId
    );

    const prisma = getPrisma();

    const plan = await prisma.monthlyAutopilotPlan.findUnique({
      where: {
        websiteId_month: {
          websiteId: website.id,
          month,
        },
      },
    });

    const sourceData = await getMonthlyAutopilotSourceData({
      userId: input.currentUser.id,
      websiteId: website.id,
      organizationId: organization.id,
      month,
    });

    return {
      plan: plan && !plan.archivedAt ? formatMonthlyAutopilotPlan(plan) : null,
      month,
      websiteId: website.id,
      websiteUrl: website.url,
      sourceSummary: sourceData.sourceSummary,
    };
  } catch {
    return {
      plan: null,
      month,
      websiteId: null,
      websiteUrl: null,
      sourceSummary: null,
    };
  }
}
