import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { recoverStalledActivations } from "@/lib/onboarding/recover-activations";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json({ data: await recoverStalledActivations() });
  } catch {
    return Response.json({ error: "Activation recovery failed" }, { status: 500 });
  }
}
