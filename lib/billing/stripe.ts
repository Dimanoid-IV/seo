import "server-only";

import Stripe from "stripe";

import { getPublicEnv } from "@/lib/env";

import { readStripeSecretKey } from "./stripe-env";

let stripeClient: Stripe | null = null;
let stripeClientSecretKey: string | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = readStripeSecretKey();
  if (!secretKey) {
    return null;
  }

  if (!stripeClient || stripeClientSecretKey !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeClientSecretKey = secretKey;
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
