"use client";

import type { ContentSection } from "@/data/blog/types";
import Link from "next/link";
import { normalizeContactHref } from "@/lib/contact-links";

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

type BlogContentProps = {
  sections: ContentSection[];
};

export function BlogContent({ sections }: BlogContentProps) {
  return (
    <div className="prose-blog max-w-none space-y-4">
      {sections.map((section, i) => {
        switch (section.type) {
          case "h2":
            return <h2 key={i}>{renderInline(section.text)}</h2>;
          case "h3":
            return <h3 key={i}>{renderInline(section.text)}</h3>;
          case "p":
            return <p key={i}>{renderInline(section.text)}</p>;
          case "ul":
            return (
              <ul key={i}>
                {section.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {section.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          case "links":
            return (
              <div key={i} className="my-8 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                <div className="flex flex-wrap gap-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={normalizeContactHref(item.href, { source: "blog-links" })}
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300 transition-colors hover:bg-blue-500/20 hover:text-white"
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
                className="my-10 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-violet-600/10 p-8 text-center glow-sm"
              >
                <h3 className="text-xl font-bold text-white">{section.title}</h3>
                <p className="mx-auto mt-3 max-w-lg text-slate-300">{section.description}</p>
                <Link
                  href={normalizeContactHref(section.href, {
                    service: "seo-audit",
                    source: "blog-cta",
                  })}
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
