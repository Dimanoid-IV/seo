import { AutopilotMode } from "@prisma/client";

export function canEnableCustomWebhookAutoSend(input: {
  hasApprovedAutoPublishPlan: boolean;
  autopilotMode: AutopilotMode | string | null | undefined;
}): boolean {
  return (
    input.hasApprovedAutoPublishPlan === true &&
    input.autopilotMode === AutopilotMode.AUTOPUBLISH
  );
}
