import "server-only";

import Stripe from "stripe";

import { getPublicEnv, getServerEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = getServerEnv().STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function requireStripeClient(): Stripe {
  const client = getStripeClient();
  if (!client) {
    throw new Error("Stripe is not configured");
  }
  return client;
}

export function getBillingAppUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    getPublicEnv().NEXT_PUBLIC_APP_URL?.trim() ??
    getPublicEnv().NEXT_PUBLIC_SITE_URL?.trim();

  if (!appUrl) {
    return "http://localhost:3000";
  }

  return appUrl.replace(/\/$/, "");
}
