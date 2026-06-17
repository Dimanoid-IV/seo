import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ?? "seoagenth@gmail.com";

export const FROM_EMAIL =
  process.env.FROM_EMAIL ??
  process.env.RESEND_FROM_EMAIL ??
  "RankBoost <onboarding@resend.dev>";

export const EMAIL_SUBJECT = "Новая заявка с RankBoost.eu / New lead from RankBoost.eu";
