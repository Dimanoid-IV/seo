import "server-only";

import type { Locale as PrismaLocale } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import {
  CONTACT_EMAIL,
  FROM_EMAIL,
  getResendClient,
} from "@/lib/resend";
import type { AssistedSetupFormData } from "@/lib/validators";
import { escapeHtml } from "@/lib/validators";

const ISSUE_LABELS: Record<AssistedSetupFormData["issueType"], string> = {
  NO_PROPERTY_FOUND: "No property found",
  NO_ACCESS: "No access",
  NOT_VERIFIED: "Not verified",
  NOT_SURE: "Not sure",
  OTHER: "Other",
};

function mapLocale(locale: AssistedSetupFormData["locale"]): PrismaLocale {
  switch (locale) {
    case "en":
      return "EN";
    case "et":
      return "ET";
    default:
      return "RU";
  }
}

export async function createAssistedSetupRequest(input: {
  data: AssistedSetupFormData;
  userId?: string | null;
  websiteId?: string | null;
}): Promise<{ id: string }> {
  const prisma = getPrisma();
  const { data } = input;

  const record = await prisma.assistedSetupRequest.create({
    data: {
      userId: input.userId ?? null,
      websiteId: input.websiteId ?? data.websiteId ?? null,
      name: data.name,
      email: data.email,
      websiteUrl: data.websiteUrl,
      integrationType: data.integrationType,
      issueType: data.issueType,
      comment: data.comment?.trim() || null,
      consentGiven: data.consentGiven,
      locale: mapLocale(data.locale),
      sourcePage: data.sourcePage?.trim() || null,
    },
    select: { id: true },
  });

  try {
    await sendAssistedSetupEmail({
      id: record.id,
      data,
    });
  } catch (error) {
    console.error("Assisted setup email failed:", error);
  }

  return { id: record.id };
}

async function sendAssistedSetupEmail(input: {
  id: string;
  data: AssistedSetupFormData;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    return;
  }

  const { data, id } = input;
  const resend = getResendClient();
  const now = new Date().toISOString();

  const row = (label: string, value: string) =>
    value.trim()
      ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;width:180px;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(value)}</td></tr>`
      : "";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: CONTACT_EMAIL,
    replyTo: data.email,
    subject: `GSC assisted setup request #${id.slice(0, 8)} — RankBoost.eu`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;color:#111;max-width:600px;">
        <h2 style="color:#2563eb;">Assisted Search Console setup request</h2>
        <p style="color:#666;">Request ID: ${escapeHtml(id)}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          ${row("Name", data.name)}
          ${row("Email", data.email)}
          ${row("Website", data.websiteUrl)}
          ${row("Integration", data.integrationType)}
          ${row("Issue", ISSUE_LABELS[data.issueType])}
          ${row("Language", data.locale.toUpperCase())}
          ${row("Source page", data.sourcePage ?? "")}
          ${row("Date", now)}
        </table>
        ${
          data.comment?.trim()
            ? `<div style="margin-top:24px;"><strong>Comment:</strong><p style="margin-top:8px;line-height:1.6;">${escapeHtml(data.comment).replace(/\n/g, "<br />")}</p></div>`
            : ""
        }
      </body>
      </html>
    `,
  });
}
