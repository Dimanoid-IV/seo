import { NextResponse } from "next/server";
import { contactFormSchema, escapeHtml } from "@/lib/validators";
import {
  getResendClient,
  CONTACT_EMAIL,
  FROM_EMAIL,
  EMAIL_SUBJECT,
} from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          message: parsed.error.issues[0]?.message ?? "Invalid form data",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Honeypot — silently accept but do not send email
    if (data.honeypot?.trim()) {
      return NextResponse.json({ success: true });
    }

    const {
      name,
      email,
      phone,
      website,
      budget,
      service,
      selectedPlan,
      message,
      locale,
      sourcePage,
    } = data;

    const now = new Date().toISOString();
    const resend = getResendClient();

    const row = (label: string, value: string) =>
      value.trim()
        ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;width:160px;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(value)}</td></tr>`
        : "";

    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: EMAIL_SUBJECT,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;color:#111;max-width:600px;">
          <h2 style="color:#2563eb;">New lead from RankBoost.eu</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            ${row("Name", name)}
            ${row("Email", email)}
            ${row("Phone", phone ?? "")}
            ${row("Website", website ?? "")}
            ${row("Budget", budget ?? "")}
            ${row("Selected service", service ?? "")}
            ${row("Selected plan", selectedPlan ?? "")}
            ${row("Language", locale.toUpperCase())}
            ${row("Source page", sourcePage ?? "")}
            ${row("Date", now)}
          </table>
          ${
            message?.trim()
              ? `<div style="margin-top:24px;"><strong>Message:</strong><p style="margin-top:8px;line-height:1.6;">${escapeHtml(message).replace(/\n/g, "<br />")}</p></div>`
              : ""
          }
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
