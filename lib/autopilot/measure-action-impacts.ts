import "server-only";

import { ActionPolicyDecision, AutopilotActionState, Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { impactConfidence, relativeChange, summarizeMetricPoints } from "./action-impact";

const DAY_MS = 86_400_000;

export async function measureDueActionImpacts(input: {
  websiteId: string;
  now?: Date;
}): Promise<{ measured: number; improvementsPlanned: number }> {
  const prisma = getPrisma();
  const now = input.now ?? new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const actions = await prisma.autopilotAction.findMany({
    where: {
      websiteId: input.websiteId,
      state: { in: [AutopilotActionState.PUBLISHED, AutopilotActionState.MONITORING] },
      publishedAt: { lte: sevenDaysAgo },
      targetUrl: { not: null },
      impacts: { none: { measuredAt: { gte: sevenDaysAgo } } },
    },
    take: 25,
  });
  let measured = 0;
  let improvementsPlanned = 0;

  for (const action of actions) {
    if (!action.targetUrl || !action.publishedAt) continue;
    const baselineStart = new Date(action.publishedAt.getTime() - 28 * DAY_MS);
    const comparisonEnd = now;
    const points = await prisma.pageMetric.findMany({
      where: {
        websiteId: input.websiteId,
        pageUrl: action.targetUrl,
        date: { gte: baselineStart, lte: comparisonEnd },
      },
      select: { date: true, impressions: true, clicks: true, position: true },
    });
    const before = summarizeMetricPoints(points.filter((point) => point.date < action.publishedAt!));
    const after = summarizeMetricPoints(points.filter((point) => point.date >= action.publishedAt!));
    if (before.days < 3 || after.days < 3) continue;
    const confidence = impactConfidence(before.days, after.days);
    const metricRows = [
      { name: "impressions", before: before.impressions, after: after.impressions },
      { name: "clicks", before: before.clicks, after: after.clicks },
      { name: "ctr", before: before.ctr, after: after.ctr },
      ...(before.position !== null && after.position !== null
        ? [{ name: "position", before: before.position, after: after.position }]
        : []),
    ];
    await prisma.$transaction([
      ...metricRows.map((metric) => prisma.actionImpact.create({
        data: {
          websiteId: input.websiteId,
          organizationId: action.organizationId,
          actionId: action.id,
          pageUrl: action.targetUrl,
          metricName: metric.name,
          metricBefore: metric.before,
          metricAfter: metric.after,
          absoluteChange: metric.after - metric.before,
          relativeChange: relativeChange(metric.before, metric.after),
          baselineStart,
          baselineEnd: action.publishedAt,
          comparisonStart: action.publishedAt,
          comparisonEnd,
          confidence,
          metadataJson: { beforeDays: before.days, afterDays: after.days } as Prisma.InputJsonValue,
        },
      })),
      prisma.autopilotAction.update({
        where: { id: action.id },
        data: { state: AutopilotActionState.MONITORING },
      }),
    ]);
    measured += 1;

    const ctrChange = relativeChange(before.ctr, after.ctr);
    if (after.days >= 14 && confidence >= 0.6 && after.impressions >= 50 && ctrChange !== null && ctrChange < -0.15) {
      const bucket = Math.floor(now.getTime() / (28 * DAY_MS));
      const created = await prisma.autopilotAction.createMany({
        data: [{
          websiteId: input.websiteId,
          organizationId: action.organizationId,
          actionType: "SMALL_CONTENT_REFRESH",
          policy: ActionPolicyDecision.SAFE_AUTO,
          state: AutopilotActionState.PLANNED,
          title: "Refresh page after verified CTR decline",
          reason: `Observed CTR change ${Math.round(ctrChange * 100)}% across ${after.days} comparison days.`,
          targetUrl: action.targetUrl,
          priority: 70,
          confidence,
          reversible: true,
          evidenceJson: { sourceActionId: action.id, before, after } as Prisma.InputJsonValue,
          scheduledAt: now,
          idempotencyKey: `impact-refresh:${action.id}:${bucket}`,
        }],
        skipDuplicates: true,
      });
      improvementsPlanned += created.count;
    }
  }
  return { measured, improvementsPlanned };
}
