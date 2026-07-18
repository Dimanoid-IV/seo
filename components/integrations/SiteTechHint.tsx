"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";

import { authFetch } from "@/lib/auth/client-session";
import type { SiteTechDetection, SiteTechPlatform } from "@/lib/site-tech/detect-site-tech";

type DetectResponse = {
  data: {
    detection: SiteTechDetection;
    reachable: boolean;
  };
};

type SiteTechHintProps = {
  websiteId: string;
  /** Where the "connect WordPress" CTA should point. */
  wordpressConnectHref?: string;
};

const PLATFORM_LABEL: Record<Exclude<SiteTechPlatform, "unknown">, string> = {
  wordpress: "WordPress",
  shopify: "Shopify",
  webflow: "Webflow",
  wix: "Wix",
  tilda: "Tilda",
};

/**
 * Suggests the most relevant integration based on detected site technology.
 * Never a dead-end: unknown/custom platforms are pointed to Universal Publishing.
 */
export function SiteTechHint({
  websiteId,
  wordpressConnectHref = "/app/integrations",
}: SiteTechHintProps) {
  const [detection, setDetection] = useState<SiteTechDetection | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      try {
        const response = await authFetch("/api/websites/detect-tech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteId }),
          signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) {
          if (!cancelled) setDone(true);
          return;
        }
        const body = (await response.json()) as DetectResponse;
        if (!cancelled) {
          setDetection(body.data.detection);
          setDone(true);
        }
      } catch {
        if (!cancelled) setDone(true);
      }
    }
    void detect();
    return () => {
      cancelled = true;
    };
  }, [websiteId]);

  if (!done || !detection) {
    return null;
  }

  const isWordPress = detection.platform === "wordpress";
  const knownPlatform =
    detection.platform !== "unknown" ? PLATFORM_LABEL[detection.platform] : null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
      <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
      <div className="space-y-1">
        {isWordPress ? (
          <p>
            Похоже, сайт сделан на WordPress —{" "}
            <Link
              href={wordpressConnectHref}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              подключите WordPress
            </Link>{" "}
            для автоматической публикации.
          </p>
        ) : knownPlatform ? (
          <p>
            Похоже, сайт сделан на {knownPlatform}. Автоподключение для этой
            платформы пока недоступно — можно публиковать через универсальный
            способ (скопировать/скачать статью или отправить разработчику).
          </p>
        ) : (
          <p>
            Мы не смогли точно определить платформу сайта. Ничего страшного —
            статьи можно публиковать через универсальный способ:
            скопировать/скачать готовый материал или отправить разработчику.
          </p>
        )}
      </div>
    </div>
  );
}
