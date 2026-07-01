import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lightbulb,
  Mail,
  Plug,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  AUDIT_COMPLETED: Search,
  SCORE_CHANGED: TrendingUp,
  TASK_CREATED: Lightbulb,
  TASK_COMPLETED: CheckCircle2,
  GSC_INSIGHT_FOUND: Search,
  GSC_OPPORTUNITY_FOUND: TrendingUp,
  CONTENT_IDEA_CREATED: Lightbulb,
  ARTICLE_DRAFT_CREATED: FileText,
  WORDPRESS_DRAFT_CREATED: FileText,
  REPORT_CREATED: FileText,
  INTEGRATION_CONNECTED: Plug,
  INTEGRATION_ERROR: AlertTriangle,
  AI_RECOMMENDATION_CREATED: Sparkles,
  SOCIAL_POST_DRAFT_CREATED: Sparkles,
  MONTHLY_AUTOPILOT_PLAN_CREATED: Sparkles,
  EMAIL_APPROVAL_CREATED: Mail,
  DAILY_SUMMARY: Sparkles,
  SYSTEM_NOTE: AlertTriangle,
};

const SEVERITY_ICONS: Record<string, LucideIcon> = {
  WARNING: TrendingDown,
  ERROR: AlertTriangle,
  SUCCESS: CheckCircle2,
};

type TimelineEventIconProps = {
  type: string;
  severity: string;
  className?: string;
};

export function TimelineEventIcon({
  type,
  severity,
  className = "size-4",
}: TimelineEventIconProps) {
  const Icon =
    severity === "WARNING" || severity === "ERROR"
      ? (SEVERITY_ICONS[severity] ?? ICONS[type] ?? Sparkles)
      : (ICONS[type] ?? Sparkles);

  return <Icon className={className} aria-hidden />;
}
