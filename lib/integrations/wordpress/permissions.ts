/**
 * WordPress connection permission / auth-mode helpers (stored in permissionsJson).
 */

export type WordPressAuthMode = "plugin" | "application_password";

export type WordPressPermissionsExtended = {
  canCreateDrafts: boolean;
  canUpdateMeta: boolean;
  canPublish: boolean;
  authMode: WordPressAuthMode;
  username?: string | null;
  defaultCategoryIds?: number[];
  defaultAuthorId?: number | null;
  httpsWarning?: boolean;
};

export const DEFAULT_WORDPRESS_PERMISSIONS_EXTENDED: WordPressPermissionsExtended =
  {
    canCreateDrafts: true,
    canUpdateMeta: true,
    canPublish: false,
    authMode: "plugin",
    username: null,
    defaultCategoryIds: [],
    defaultAuthorId: null,
    httpsWarning: false,
  };

export function parseWordPressPermissionsExtended(
  value: unknown
): WordPressPermissionsExtended {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_WORDPRESS_PERMISSIONS_EXTENDED };
  }
  const record = value as Record<string, unknown>;
  const authMode =
    record.authMode === "application_password" ? "application_password" : "plugin";

  const categoryIds = Array.isArray(record.defaultCategoryIds)
    ? record.defaultCategoryIds
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((n) => Number.isFinite(n) && n > 0)
        .slice(0, 20)
    : [];

  return {
    canCreateDrafts:
      typeof record.canCreateDrafts === "boolean"
        ? record.canCreateDrafts
        : true,
    canUpdateMeta:
      typeof record.canUpdateMeta === "boolean" ? record.canUpdateMeta : true,
    canPublish: false, // never allow live publish from stored permissions
    authMode,
    username: typeof record.username === "string" ? record.username : null,
    defaultCategoryIds: categoryIds,
    defaultAuthorId:
      typeof record.defaultAuthorId === "number" &&
      Number.isFinite(record.defaultAuthorId)
        ? record.defaultAuthorId
        : null,
    httpsWarning: record.httpsWarning === true,
  };
}

export function isApplicationPasswordAuth(
  permissions: WordPressPermissionsExtended
): boolean {
  return permissions.authMode === "application_password";
}
