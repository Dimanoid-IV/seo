export function isPubliclyPublished(input: {
  status: string;
  publishedAt: Date | string | null | undefined;
  now?: Date;
}): boolean {
  if (input.status !== "PUBLISHED" || !input.publishedAt) return false;
  const publishedAt =
    input.publishedAt instanceof Date
      ? input.publishedAt
      : new Date(input.publishedAt);
  if (!Number.isFinite(publishedAt.getTime())) return false;
  return publishedAt.getTime() <= (input.now ?? new Date()).getTime();
}
