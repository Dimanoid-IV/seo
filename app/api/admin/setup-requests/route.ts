import { z } from "zod";
import { requireAdmin } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse, parseJsonBody, validationErrorFromZod } from "@/lib/auth/responses";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const requests = await getPrisma().assistedSetupRequest.findMany({
      where: { status: { not: "CLOSED" } },
      orderBy: { createdAt: "asc" }, take: 100,
      select: { id: true, name: true, email: true, websiteUrl: true, integrationType: true, issueType: true, comment: true, status: true, createdAt: true },
    });
    return authJsonResponse({ data: { requests } });
  } catch (error) { return authErrorResponse(request, error); }
}

const updateSchema = z.object({ id: z.string().uuid(), status: z.enum(["PENDING", "CONTACTED", "CLOSED"]) });
export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const parsed = updateSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) throw validationErrorFromZod(parsed.error);
    await getPrisma().assistedSetupRequest.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
    return authJsonResponse({ data: { updated: true } });
  } catch (error) { return authErrorResponse(request, error); }
}
