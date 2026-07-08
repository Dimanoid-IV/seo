import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

type HermesRequestBody = {
  model: string;
  messages: Array<{ role: "user"; content: string }>;
  tools?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.HERMES_API_KEY;
    const apiSecret = process.env.HERMES_API_SECRET;
    const apiUrl = process.env.HERMES_API_URL;

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: "HERMES_API_KEY and HERMES_API_URL must be set" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const model = typeof body?.model === "string" ? body.model : "tencent/hy3:free";
    const tools = body?.tools;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const requestBody: HermesRequestBody = {
      model,
      messages: [{ role: "user", content: message }],
    };

    if (tools) {
      requestBody.tools = tools;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (apiSecret) {
      const timestamp = Date.now().toString();
      const payload = JSON.stringify(requestBody);
      const signature = createHmac("sha256", apiSecret)
        .update(`${timestamp}:${payload}`)
        .digest("hex");

      headers["X-Timestamp"] = timestamp;
      headers["X-Signature"] = signature;
    }

    const baseUrl = apiUrl.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Hermes API error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Hermes API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
