import { z } from "zod";

/** Treat empty strings from .env files as unset. */
function emptyToUndefined(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return value;
}

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional()
);

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),

  // Marketing — contact form (required at runtime when sending email, not at build)
  RESEND_API_KEY: optionalString,
  CONTACT_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  FROM_EMAIL: optionalString,
  RESEND_FROM_EMAIL: optionalString,

  // SaaS MVP — optional until the corresponding feature is enabled
  DATABASE_URL: optionalUrl,
  JWT_ACCESS_SECRET: optionalString,
  JWT_REFRESH_SECRET: optionalString,
  NEXTAUTH_SECRET: optionalString,
  GOOGLE_AUTH_CLIENT_ID: optionalString,
  GOOGLE_AUTH_CLIENT_SECRET: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  HERMES_API_URL: optionalUrl,
  HERMES_API_SECRET: optionalString,
  GOOGLE_INTEGRATIONS_CLIENT_ID: optionalString,
  GOOGLE_INTEGRATIONS_CLIENT_SECRET: optionalString,
  GOOGLE_INTEGRATIONS_REDIRECT_URI: optionalUrl,
  WORDPRESS_CONNECTOR_SECRET: optionalString,
  CRON_SECRET: optionalString,
  ENCRYPTION_SECRET: optionalString,
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .preprocess(
      emptyToUndefined,
      z.string().url().optional()
    )
    .default("https://rankboost.eu"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnvKey = keyof ServerEnv;

function parseServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    FROM_EMAIL: process.env.FROM_EMAIL,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_AUTH_CLIENT_ID: process.env.GOOGLE_AUTH_CLIENT_ID,
    GOOGLE_AUTH_CLIENT_SECRET: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    HERMES_API_URL: process.env.HERMES_API_URL,
    HERMES_API_SECRET: process.env.HERMES_API_SECRET,
    GOOGLE_INTEGRATIONS_CLIENT_ID: process.env.GOOGLE_INTEGRATIONS_CLIENT_ID,
    GOOGLE_INTEGRATIONS_CLIENT_SECRET:
      process.env.GOOGLE_INTEGRATIONS_CLIENT_SECRET,
    GOOGLE_INTEGRATIONS_REDIRECT_URI:
      process.env.GOOGLE_INTEGRATIONS_REDIRECT_URI,
    WORDPRESS_CONNECTOR_SECRET: process.env.WORDPRESS_CONNECTOR_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  });
}

function parsePublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
}

let cachedServerEnv: ServerEnv | undefined;
let cachedPublicEnv: PublicEnv | undefined;

/** Parsed server-only environment variables. All SaaS keys are optional at build time. */
export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = parseServerEnv();
  }
  return cachedServerEnv;
}

/** Parsed public environment variables (safe for client bundles). */
export function getPublicEnv(): PublicEnv {
  if (!cachedPublicEnv) {
    cachedPublicEnv = parsePublicEnv();
  }
  return cachedPublicEnv;
}

/** Parsed server-only environment variables (lazy). */
export const serverEnv: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    return getServerEnv()[prop as ServerEnvKey];
  },
});

/** Parsed public environment variables (lazy). */
export const publicEnv: PublicEnv = new Proxy({} as PublicEnv, {
  get(_target, prop: string) {
    return getPublicEnv()[prop as keyof PublicEnv];
  },
});

/**
 * Returns a required server env value for a specific service.
 * Throws a clear error without logging the secret value.
 */
export function getRequiredEnv(name: ServerEnvKey): string {
  const value = getServerEnv()[name];
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable: ${String(name)}. ` +
        "Set it in .env.local or your deployment environment."
    );
  }
  return value;
}

/** Reset cached env (for tests only). */
export function resetEnvCacheForTests(): void {
  cachedServerEnv = undefined;
  cachedPublicEnv = undefined;
}
