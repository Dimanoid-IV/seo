import type { Locale as PrismaLocale, UserRole as PrismaUserRole } from "@prisma/client";

import type { AuthLocale, AuthRole } from "./types";

const AUTH_ROLE_TO_PRISMA: Record<AuthRole, PrismaUserRole> = {
  user: "USER",
  support: "SUPPORT",
  analyst: "ANALYST",
  admin: "ADMIN",
};

const PRISMA_ROLE_TO_AUTH: Record<PrismaUserRole, AuthRole> = {
  USER: "user",
  SUPPORT: "support",
  ANALYST: "analyst",
  ADMIN: "admin",
};

const AUTH_LOCALE_TO_PRISMA: Record<AuthLocale, PrismaLocale> = {
  ru: "RU",
  et: "ET",
  en: "EN",
};

const PRISMA_LOCALE_TO_AUTH: Record<PrismaLocale, AuthLocale> = {
  RU: "ru",
  ET: "et",
  EN: "en",
};

export function userRoleToAuthRole(role: PrismaUserRole): AuthRole {
  return PRISMA_ROLE_TO_AUTH[role];
}

export function authRoleToUserRole(role: AuthRole): PrismaUserRole {
  return AUTH_ROLE_TO_PRISMA[role];
}

export function localeToAuthLocale(locale: PrismaLocale): AuthLocale {
  return PRISMA_LOCALE_TO_AUTH[locale];
}

export function authLocaleToPrismaLocale(locale: AuthLocale): PrismaLocale {
  return AUTH_LOCALE_TO_PRISMA[locale];
}
