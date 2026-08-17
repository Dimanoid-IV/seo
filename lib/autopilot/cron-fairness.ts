export type CronPlanCandidate = {
  id: string;
  userId: string;
  websiteId: string;
  organizationId: string;
  month: string;
};

/**
 * Selects one latest approved plan per website and rotates the daily window.
 * This stays stateless, so a broken website cannot monopolize the cron queue.
 */
export function selectFairCronPlans<T extends CronPlanCandidate>(input: {
  plans: T[];
  limit: number;
  now?: Date;
}): T[] {
  if (input.limit <= 0 || input.plans.length === 0) return [];

  const sorted = [...input.plans].sort((a, b) => {
    const websiteOrder = a.websiteId.localeCompare(b.websiteId);
    if (websiteOrder !== 0) return websiteOrder;
    const monthOrder = b.month.localeCompare(a.month);
    return monthOrder !== 0 ? monthOrder : b.id.localeCompare(a.id);
  });
  const latestByWebsite: T[] = [];
  const seen = new Set<string>();
  for (const plan of sorted) {
    if (seen.has(plan.websiteId)) continue;
    seen.add(plan.websiteId);
    latestByWebsite.push(plan);
  }

  if (latestByWebsite.length <= input.limit) return latestByWebsite;
  const now = input.now ?? new Date();
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  const start = (dayIndex * input.limit) % latestByWebsite.length;
  return Array.from(
    { length: input.limit },
    (_, index) => latestByWebsite[(start + index) % latestByWebsite.length]
  );
}
