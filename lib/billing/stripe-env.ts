import "server-only";

/** Read Stripe billing env at request time — never from cached getServerEnv(). */
export function readStripeSecretKey(): string | undefined {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  return value || undefined;
}

export function readStripeWebhookSecret(): string | undefined {
  const value = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return value || undefined;
}

export function isStripeBillingConfigured(): boolean {
  return Boolean(
    readStripeSecretKey() &&
      process.env.STRIPE_STARTER_PRICE_ID?.trim() &&
      process.env.STRIPE_PRO_PRICE_ID?.trim() &&
      process.env.STRIPE_AGENCY_PRICE_ID?.trim()
  );
}
