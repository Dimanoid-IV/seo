/** JWT / API auth role (lowercase, matches API-Design.md). */
export type AuthRole = "user" | "support" | "analyst" | "admin";

/** User-facing locale in tokens (lowercase, matches i18n config). */
export type AuthLocale = "ru" | "et" | "en";

/** Signed JWT payload for access and refresh tokens. */
export type AuthTokenPayload = {
  userId: string;
  organizationId: string | null;
  role: AuthRole;
  locale: AuthLocale;
  iat?: number;
  exp?: number;
};

/** Claims passed when creating a new token (no iat/exp). */
export type AuthTokenClaims = Omit<AuthTokenPayload, "iat" | "exp">;

/** Authenticated user resolved for API route handlers. */
export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: AuthRole;
  locale: AuthLocale;
  organizationId: string | null;
  emailVerified: boolean;
};
