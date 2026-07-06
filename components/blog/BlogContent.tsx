"use client";

import type { ContentSection } from "@/data/blog/types";
import Link from "next/link";
import { normalizeContactHref } from "@/lib/contact-links";
import { cn } from "@/lib/utils";

function renderInline(text: string, isMarketing: boolean): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={i}
          className={cn("font-semibold", isMarketing ? "text-slate-900" : "text-white")}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

type BlogContentProps = {
  sections: ContentSection[];
  theme?: "dark" | "marketing";
};

export function BlogContent({ sections, theme = "dark" }: BlogContentProps) {
  const isMarketing = theme === "marketing";

  return (
    <div className="prose-blog max-w-none space-y-4">
      {sections.map((section, i) => {
        switch (section.type) {
          case "h2":
            return <h2 key={i}>{renderInline(section.text, isMarketing)}</h2>;
          case "h3":
            return <h3 key={i}>{renderInline(section.text, isMarketing)}</h3>;
          case "p":
            return <p key={i}>{renderInline(section.text, isMarketing)}</p>;
          case "ul":
            return (
              <ul key={i}>
                {section.items.map((item, j) => (
                  <li key={j}>{renderInline(item, isMarketing)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {section.items.map((item, j) => (
                  <li key={j}>{renderInline(item, isMarketing)}</li>
                ))}
              </ol>
            );
          case "links":
            return (
              <div
                key={i}
                className={cn(
                  "my-8 rounded-xl border p-5",
                  isMarketing
                    ? "border-slate-200 bg-slate-50"
                    : "border-white/10 bg-white/[0.03]"
                )}
              >
                <p
                  className={cn(
                    "mb-3 text-sm font-semibold uppercase tracking-wider",
                    isMarketing ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  {section.title}
                </p>
                <div className="flex flex-wrap gap-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={normalizeContactHref(item.href, { source: "blog-links" })}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm transition-colors",
                        isMarketing
                          ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-white"
                      )}
                    >
                      {item.label} →
                    </Link>
                  ))}
                </div>
              </div>
            );
          case "cta":
            return (
              <div
                key={i}
                className={cn(
                  "my-10 rounded-2xl border p-8 text-center",
                  isMarketing
                    ? "border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50"
                    : "border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-violet-600/10 glow-sm"
                )}
              >
                <h3
                  className={cn(
                    "text-xl font-bold",
                    isMarketing ? "text-slate-900" : "text-white"
                  )}
                >
                  {section.title}
                </h3>
                <p
                  className={cn(
                    "mx-auto mt-3 max-w-lg",
                    isMarketing ? "text-slate-600" : "text-slate-300"
                  )}
                >
                  {section.description}
                </p>
                <Link
                  href={
                    section.href.startsWith("/")
                      ? section.href
                      : normalizeContactHref(section.href, {
                          service: "seo-audit",
                          source: "blog-cta",
                        })
                  }
                  className="mt-6 inline-flex h-11 items-center rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-8 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-violet-500"
                >
                  {section.buttonLabel}
                </Link>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
