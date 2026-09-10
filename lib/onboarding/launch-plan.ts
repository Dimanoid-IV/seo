/** Finish setup only after real audited work has entered the scheduler. */
export async function launchPreparedPlan(
  input: { hasAudit: boolean; planId: string | null; planApproved: boolean },
  dependencies: { approve: (planId: string) => Promise<boolean>; complete: () => Promise<unknown> },
): Promise<boolean> {
  if (!input.hasAudit || !input.planId) return false;
  if (!input.planApproved && !await dependencies.approve(input.planId)) return false;
  await dependencies.complete();
  return true;
}
