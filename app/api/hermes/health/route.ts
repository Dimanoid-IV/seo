import { NextResponse } from "next/server";

import { getHermesAvailability } from "@/lib/hermes/config";

export async function GET() {
  const availability = getHermesAvailability();

  return NextResponse.json({
    service: "Hermes Agent API",
    version: "1.0.0",
    endpoints: {
      "/api/hermes": "Chat with Hermes (POST)",
      "/api/hermes/health": "Health check (GET)",
    },
    generation: {
      configured: availability.generationConfigured,
      hasApiUrl: availability.hasApiUrl,
      hasApiSecret: availability.hasApiSecret,
    },
    chat: {
      hasApiKey: availability.hasApiKey,
    },
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
