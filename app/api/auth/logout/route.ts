import { authErrorResponse, authNoContentResponse } from "@/lib/auth/responses";

export async function POST(request: Request) {
  try {
    return authNoContentResponse();
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
