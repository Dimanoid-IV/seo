import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/billing/stripe";
import { handleStripeWebhookEvent } from "@/lib/billing/webhook";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode, createErrorResponse, getRequestId } from "@/lib/errors";
import { safeLogError } from "@/lib/logging";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request.headers.get("x-request-id"));

  try {
    const stripe = getStripeClient();
    const webhookSecret = getServerEnv().STRIPE_WEBHOOK_SECRET?.trim();

    if (!stripe || !webhookSecret) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Stripe webhook is not configured.",
        { statusCode: 503 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Missing Stripe-Signature header."
      );
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const result = await handleStripeWebhookEvent(event);

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    safeLogError("billing.webhook", error, { requestId });
    const { status, body, headers } = createErrorResponse(error, requestId);
    return NextResponse.json(body, { status, headers });
  }
}
