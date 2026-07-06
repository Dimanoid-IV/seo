"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type ContactFormProps = {
  locale: Locale;
  dict: Dictionary;
};

type FormStatus = "idle" | "loading" | "success" | "error";

export function ContactForm({ locale, dict }: ContactFormProps) {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash === "#contact-form") {
      document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [searchKey]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError(null);
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const website = (formData.get("website") as string)?.trim() ?? "";
    const message = (formData.get("message") as string)?.trim() ?? "";

    if (!website && !message) {
      setFieldError(dict.contact.form.websiteOrMessageError);
      setStatus("idle");
      return;
    }

    const sourcePage =
      searchParams.get("source") ??
      (typeof document !== "undefined" ? document.referrer : "") ??
      "";

    const data = {
      name: (formData.get("name") as string).trim(),
      email: (formData.get("email") as string).trim(),
      website,
      message,
      locale,
      sourcePage,
      honeypot: (formData.get("company_url") as string) ?? "",
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFieldError(result.message ?? dict.contact.form.error);
        setStatus("error");
        return;
      }

      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        id="contact-form"
        className="marketing-card flex flex-col items-center justify-center p-12 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="mb-4 h-12 w-12 text-emerald-600" />
        <p className="text-lg text-slate-800">{dict.contact.form.success}</p>
        <Button
          variant="outline"
          className="mt-6 border-slate-300 text-slate-700"
          onClick={() => setStatus("idle")}
        >
          OK
        </Button>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit}
      className="marketing-card space-y-5 p-8 scroll-mt-24"
      noValidate
    >
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="company_url">Company URL</label>
        <input
          type="text"
          id="company_url"
          name="company_url"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-700">
            {dict.contact.form.name} *
          </Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={100}
            placeholder={dict.contact.form.namePlaceholder}
            className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700">
            {dict.contact.form.email} *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            placeholder={dict.contact.form.emailPlaceholder}
            className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website" className="text-slate-700">
          {dict.contact.form.website}
        </Label>
        <Input
          id="website"
          name="website"
          maxLength={500}
          placeholder={dict.contact.form.websitePlaceholder}
          className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-slate-700">
          {dict.contact.form.message}
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          maxLength={2000}
          placeholder={dict.contact.form.messagePlaceholder}
          className="resize-none border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
        />
        <p className="text-xs text-slate-500">{dict.contact.form.websiteOrMessageHint}</p>
      </div>

      {(status === "error" || fieldError) && (
        <div
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {fieldError ?? dict.contact.form.error}
        </div>
      )}

      <Button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500"
      >
        {status === "loading" ? (
          dict.contact.form.submitting
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {dict.contact.form.submit}
          </>
        )}
      </Button>
    </form>
  );
}
