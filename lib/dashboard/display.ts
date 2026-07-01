import type { TaskPriority } from "@/components/dashboard/TaskCard";

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: "Техническое",
  CONTENT: "Контент",
  LOCAL_SEO: "Local SEO",
  PERFORMANCE: "Скорость",
  ACCESSIBILITY: "Доступность",
  AI_READINESS: "AI Readiness",
  SECURITY: "Безопасность",
  CONVERSION: "Конверсия",
  SOCIAL: "Соцсети",
  OTHER: "Прочее",
};

export function formatCheckCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function taskPriorityToCardPriority(priority: string): TaskPriority {
  const normalized = priority.toLowerCase();
  if (normalized === "critical") {
    return "critical";
  }
  if (normalized === "high") {
    return "high";
  }
  if (normalized === "medium") {
    return "medium";
  }
  return "low";
}

export function taskStatusToCardStatus(
  status: string
): "open" | "in_progress" | "waiting" | "completed" | "dismissed" {
  const normalized = status.toLowerCase();
  if (normalized === "in_progress") {
    return "in_progress";
  }
  if (normalized === "waiting_review") {
    return "waiting";
  }
  if (normalized === "completed") {
    return "completed";
  }
  if (normalized === "dismissed" || normalized === "failed") {
    return "dismissed";
  }
  return "open";
}

export function severityToTaskPriority(severity: string): TaskPriority {
  if (severity === "CRITICAL") {
    return "critical";
  }
  if (severity === "HIGH") {
    return "high";
  }
  if (severity === "MEDIUM") {
    return "medium";
  }
  return "low";
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

export function parseRecommendation(
  recommendationJson: unknown
): string | undefined {
  if (!recommendationJson || typeof recommendationJson !== "object") {
    return undefined;
  }

  const record = recommendationJson as Record<string, unknown>;
  if (typeof record.recommendation === "string") {
    return record.recommendation;
  }

  return undefined;
}
