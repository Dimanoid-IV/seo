import { z } from "zod";

const authLocaleSchema = z.enum(["ru", "et", "en"]);

function isValidWebsite(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = value.startsWith("http") ? value : `https://${value}`;
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Некорректный email")
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(8, "Пароль должен содержать минимум 8 символов")
      .max(128),
    name: z
      .string()
      .trim()
      .min(2, "Имя должно содержать минимум 2 символа")
      .max(100),
    locale: authLocaleSchema.optional().default("ru"),
    websiteUrl: z.string().trim().max(500).optional().or(z.literal("")),
    acceptTerms: z.literal(true, {
      message: "Необходимо принять условия использования",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.websiteUrl && !isValidWebsite(data.websiteUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Некорректный URL сайта",
        path: ["websiteUrl"],
      });
    }
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Некорректный email")
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Пароль обязателен").max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Normalizes a website URL for storage (https, no trailing slash on path root).
 */
export function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  const pathname =
    parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
  return `${parsed.origin}${pathname}`;
}
