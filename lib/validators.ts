import { z } from "zod";

const localeSchema = z.enum(["ru", "et", "en"]);

const optionalString = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

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

export const contactFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().email("Invalid email address").max(254),
    phone: optionalString(80),
    website: optionalString(500),
    budget: optionalString(50),
    service: optionalString(80),
    selectedPlan: optionalString(80),
    message: optionalString(2000),
    locale: localeSchema,
    sourcePage: optionalString(200),
    honeypot: optionalString(200),
  })
  .superRefine((data, ctx) => {
    if (data.website && !isValidWebsite(data.website)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid website URL",
        path: ["website"],
      });
    }
    const hasWebsite = Boolean(data.website?.trim());
    const hasMessage = Boolean(data.message?.trim());
    if (!hasWebsite && !hasMessage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Website or message is required",
        path: ["message"],
      });
    }
  });

export type ContactFormData = z.infer<typeof contactFormSchema>;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
