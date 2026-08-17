export type PublicationLifecycleStatus =
  | "PLANNED"
  | "SCHEDULED"
  | "RESEARCHING"
  | "GENERATING"
  | "REVIEWING"
  | "READY"
  | "PUBLISHING"
  | "PUBLISHED"
  | "MONITORING"
  | "IMPROVING"
  | "FAILED";

export function publicationStatusForTime(input: {
  now: Date;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  currentStatus: PublicationLifecycleStatus;
}): PublicationLifecycleStatus {
  if (input.currentStatus === "FAILED") return "FAILED";
  if (input.publishedAt && input.publishedAt <= input.now) return "PUBLISHED";
  if (input.scheduledAt && input.scheduledAt > input.now) return "SCHEDULED";
  if (input.currentStatus === "PUBLISHED" && !input.publishedAt) return "PUBLISHING";
  return input.currentStatus;
}

export function isPublicPublication(input: {
  now: Date;
  publishedAt: Date | null;
  verified: boolean;
}): boolean {
  return Boolean(input.verified && input.publishedAt && input.publishedAt <= input.now);
}
