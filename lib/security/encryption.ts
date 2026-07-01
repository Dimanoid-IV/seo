import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { assertServerOnly } from "@/lib/security";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION_PREFIX = "v1";

function resolveEncryptionKey(): Buffer {
  assertServerOnly();

  const raw =
    getServerEnv().ENCRYPTION_KEY?.trim() ||
    getServerEnv().ENCRYPTION_SECRET?.trim();

  if (!raw) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "ENCRYPTION_KEY не настроен. Установите ENCRYPTION_KEY в окружении."
    );
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length === 32) {
    return decoded;
  }

  return createHash("sha256").update(raw).digest();
}

/**
 * Encrypts a secret with AES-256-GCM. Output format: v1:<iv>:<tag>:<ciphertext> (base64url).
 */
export function encryptSecret(plaintext: string): string {
  assertServerOnly();

  const key = resolveEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

/**
 * Decrypts a value produced by {@link encryptSecret}.
 */
export function decryptSecret(ciphertext: string): string {
  assertServerOnly();

  const parts = ciphertext.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Некорректный формат зашифрованного значения");
  }

  const [, ivPart, tagPart, dataPart] = parts;
  const key = resolveEncryptionKey();
  const iv = Buffer.from(ivPart, "base64url");
  const authTag = Buffer.from(tagPart, "base64url");
  const encrypted = Buffer.from(dataPart, "base64url");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
