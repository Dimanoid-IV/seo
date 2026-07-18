import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { fetchHtmlPage } from "@/lib/audit/fetch";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { detectSiteTech, type SiteTechDetection } from "@/lib/site-tech/detect-site-tech";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

const UNKNOWN_DETECTION: SiteTechDetection = {
  platform: "unknown",
  confidence: 0,
  signals: [],
  candidates: [],
  canPublishNatively: false,
  recommendedPublishing: "universal",
};

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const websiteId =
      body && typeof body === "object" && "websiteId" in body
        ? String((body as { websiteId: unknown }).websiteId ?? "")
        : "";

    if (!websiteId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Не указан websiteId");
    }

    const prisma = getPrisma();
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        deletedAt: null,
        organization: { ownerUserId: currentUser.id, deletedAt: null },
      },
      select: { id: true, url: true },
    });

    if (!website) {
      throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден или недоступен");
    }

    // Fetch failures must not hang or dead-end the UI: fall back to "unknown"
    // (which recommends the Universal Publishing path).
    try {
      const page = await fetchHtmlPage(website.url);
      const detection = detectSiteTech({
        html: page.html,
        headers: page.headers,
        url: page.finalUrl,
      });
      return authJsonResponse({ data: { detection, reachable: true } });
    } catch {
      return authJsonResponse({
        data: { detection: UNKNOWN_DETECTION, reachable: false },
      });
    }
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
