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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SERVICE_IDS,
  PLAN_IDS,
  BUDGET_IDS,
  type ServiceId,
  type PlanId,
} from "@/data/contact-options";

type ContactFormProps = {
  locale: Locale;
  dict: Dictionary;
};

type FormStatus = "idle" | "loading" | "success" | "error";

function parseServiceParam(param: string | null): string {
  if (param && SERVICE_IDS.includes(param as ServiceId)) return param;
  return "";
}

function parsePlanParam(param: string | null): string {
  if (param && PLAN_IDS.includes(param as PlanId)) return param;
  return "";
}

export function ContactForm({ locale, dict }: ContactFormProps) {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [service, setService] = useState(() =>
    parseServiceParam(searchParams.get("service"))
  );
  const [selectedPlan, setSelectedPlan] = useState(() =>
    parsePlanParam(searchParams.get("plan"))
  );
  const [budget, setBudget] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [prefillKey, setPrefillKey] = useState(searchKey);

  if (searchKey !== prefillKey) {
    setPrefillKey(searchKey);
    setService(parseServiceParam(searchParams.get("service")));
    setSelectedPlan(parsePlanParam(searchParams.get("plan")));
  }

  useEffect(() => {
    if (window.location.hash === "#contact-form") {
      document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [searchKey]);

  const serviceOptions = SERVICE_IDS.map((id) => ({
    value: id,
    label: dict.contact.serviceTypes[id as keyof typeof dict.contact.serviceTypes],
  }));

  const planOptions = PLAN_IDS.map((id) => ({
    value: id,
    label: dict.contact.plans[id as keyof typeof dict.contact.plans],
  }));

  const budgetOptions = BUDGET_IDS.map((id) => ({
    value: id,
    label: dict.contact.budgets[id as keyof typeof dict.contact.budgets],
  }));

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
      phone: (formData.get("phone") as string)?.trim() ?? "",
      website,
      budget,
      service,
      selectedPlan,
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
      setService("");
      setSelectedPlan("");
      setBudget("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        id="contact-form"
        className="glass-card flex flex-col items-center justify-center p-12 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="mb-4 h-12 w-12 text-emerald-400" />
        <p className="text-lg text-white">{dict.contact.form.success}</p>
        <Button
          variant="outline"
          className="mt-6 border-white/20"
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
      className="glass-card space-y-5 p-8 scroll-mt-24"
      noValidate
    >
      {/* Honeypot — hidden from users */}
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
          <Label htmlFor="name" className="text-slate-300">
            {dict.contact.form.name} *
          </Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={100}
            placeholder={dict.contact.form.namePlaceholder}
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">
            {dict.contact.form.email} *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            placeholder={dict.contact.form.emailPlaceholder}
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-slate-300">
            {dict.contact.form.phone}
          </Label>
          <Input
            id="phone"
            name="phone"
            maxLength={80}
            placeholder={dict.contact.form.phonePlaceholder}
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website" className="text-slate-300">
            {dict.contact.form.website}
          </Label>
          <Input
            id="website"
            name="website"
            maxLength={500}
            placeholder={dict.contact.form.websitePlaceholder}
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-300">{dict.contact.form.budget}</Label>
          <Select value={budget} onValueChange={(v) => setBudget(v ?? "")}>
            <SelectTrigger className="border-white/10 bg-white/5 text-white">
              <SelectValue placeholder={dict.contact.form.budgetPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {budgetOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">{dict.contact.form.service}</Label>
          <Select value={service} onValueChange={(v) => setService(v ?? "")}>
            <SelectTrigger className="border-white/10 bg-white/5 text-white">
              <SelectValue placeholder={dict.contact.form.servicePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {serviceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">{dict.contact.form.plan}</Label>
        <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v ?? "")}>
          <SelectTrigger className="border-white/10 bg-white/5 text-white">
            <SelectValue placeholder={dict.contact.form.planPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {planOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-slate-300">
          {dict.contact.form.message}
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          maxLength={2000}
          placeholder={dict.contact.form.messagePlaceholder}
          className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 resize-none"
        />
        <p className="text-xs text-slate-500">{dict.contact.form.websiteOrMessageHint}</p>
      </div>

      {(status === "error" || fieldError) && (
        <div
          className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {fieldError ?? dict.contact.form.error}
        </div>
      )}

      <Button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500"
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
