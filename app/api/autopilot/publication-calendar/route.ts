import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getPublicationCalendar } from "@/lib/autopilot/get-publication-calendar";
import { currentMonthKey } from "@/lib/autopilot/month-utils";

export async function GET(request: Request) {
  try {
    const currentUser = await requireUser(request);
    const url = new URL(request.url);
    const data = await getPublicationCalendar({
      currentUser,
      month: url.searchParams.get("month") ?? currentMonthKey(),
      websiteId: url.searchParams.get("websiteId"),
    });
    return authJsonResponse({ data });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
