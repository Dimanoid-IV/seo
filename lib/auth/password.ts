import bcrypt from "bcryptjs";

import { assertServerOnly } from "@/lib/security";

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Hashes a plaintext password with bcrypt. Never log the password argument.
 */
export async function hashPassword(password: string): Promise<string> {
  assertServerOnly();
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  assertServerOnly();
  if (!hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * Validates password strength for registration / reset flows.
 */
export function validatePasswordStrength(
  password: string
): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
