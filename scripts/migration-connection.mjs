/**
 * Prisma migration locks need a session-bound connection. Keep the pooled
 * DATABASE_URL for application traffic; derive only Neon's documented direct
 * endpoint for migration commands. Never rewrite unknown database providers.
 * @param {string} pooledUrl
 * @param {string} [directUrl]
 */
export function migrationConnectionString(pooledUrl, directUrl = undefined) {
  if (directUrl?.trim()) return directUrl.trim();
  const url = new URL(pooledUrl);
  if (url.hostname.endsWith(".neon.tech") && url.hostname.split(".")[0].endsWith("-pooler")) {
    url.hostname = url.hostname.replace("-pooler.", ".");
    return url.toString();
  }
  return pooledUrl;
}
