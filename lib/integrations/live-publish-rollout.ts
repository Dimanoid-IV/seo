/**
 * First-customer scoped live-publish rollout (Prompt 11.55).
 *
 * Global LIVE_PUBLISH_KILL_SWITCH stays engaged by default on Vercel.
 * Allowlisted websites (env and/or DB flag) may bypass the kill switch
 * without enabling live publish for all customers.
 *
 * Never prints secrets. No network I/O.
 */

export const LIVE_PUBLISH_ROLLOUT_DEFAULTS = {
  /** Minimum article.qualityScore for live publish during rollout. */
  minQualityScore: 70,
  /** Max SUCCEEDED WordPress PUBLISH jobs per website per UTC day. */
  maxPerDay: 1,
  /** Max total SUCCEEDED WordPress PUBLISH jobs per website in first rollout. */
  firstRolloutMaxArticles: 1,
} as const;

/**
 * Parse LIVE_PUBLISH_ALLOWED_WEBSITE_IDS (comma/space/semicolon separated UUIDs).
 */
export function parseLivePublishAllowedWebsiteIds(
  raw: string | undefined | null = process.env.LIVE_PUBLISH_ALLOWED_WEBSITE_IDS
): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((id) => id.trim().toLowerCase())
    .filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      )
    );
}

export function isWebsiteOnLivePublishAllowlist(
  websiteId: string | null | undefined,
  options?: {
    envAllowlist?: string[];
    /** DB-backed Website.livePublishRolloutEnabled */
    dbRolloutEnabled?: boolean | null;
  }
): boolean {
  if (!websiteId) return false;
  const normalized = websiteId.trim().toLowerCase();
  if (options?.dbRolloutEnabled === true) return true;
  const ids = options?.envAllowlist ?? parseLivePublishAllowedWebsiteIds();
  return ids.includes(normalized);
}

/** Explicit open mode for controlled tests — never set on Vercel for all customers. */
export function isLivePublishOpenToAll(): boolean {
  const raw = process.env.LIVE_PUBLISH_OPEN_TO_ALL?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export function getLivePublishMinQualityScore(): number {
  const raw = process.env.LIVE_PUBLISH_MIN_QUALITY_SCORE?.trim();
  if (!raw) return LIVE_PUBLISH_ROLLOUT_DEFAULTS.minQualityScore;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    return LIVE_PUBLISH_ROLLOUT_DEFAULTS.minQualityScore;
  }
  return Math.floor(n);
}

export function getLivePublishMaxPerDay(): number {
  const raw = process.env.LIVE_PUBLISH_MAX_PER_DAY?.trim();
  if (!raw) return LIVE_PUBLISH_ROLLOUT_DEFAULTS.maxPerDay;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return LIVE_PUBLISH_ROLLOUT_DEFAULTS.maxPerDay;
  return Math.floor(n);
}

export function getLivePublishFirstRolloutMaxArticles(): number {
  const raw = process.env.LIVE_PUBLISH_FIRST_ROLLOUT_MAX_ARTICLES?.trim();
  if (!raw) return LIVE_PUBLISH_ROLLOUT_DEFAULTS.firstRolloutMaxArticles;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return LIVE_PUBLISH_ROLLOUT_DEFAULTS.firstRolloutMaxArticles;
  }
  return Math.floor(n);
}

export type LivePublishScopeDecision = {
  /** True when this website may attempt live publish under scoped policy. */
  allowed: boolean;
  /** Website is on env allowlist or DB rollout flag. */
  allowlisted: boolean;
  /** Allowlist bypassed the global kill switch. */
  scopedKillSwitchBypass: boolean;
  blockedReason:
    | "kill_switch_engaged"
    | "website_not_allowlisted"
    | null;
};

/**
 * Scoped kill-switch / allowlist policy.
 *
 * - Allowlisted (env or DB) → may proceed even when global kill switch is engaged.
 * - Not allowlisted + kill switch engaged → blocked.
 * - Not allowlisted + kill switch cleared → still blocked unless OPEN_TO_ALL.
 */
export function resolveLivePublishScope(input: {
  websiteId: string | null | undefined;
  dbRolloutEnabled?: boolean | null;
  /** Override for tests; when omitted reads process.env. */
  killSwitchEngaged?: boolean;
  envAllowlist?: string[];
}): LivePublishScopeDecision {
  const allowlisted = isWebsiteOnLivePublishAllowlist(input.websiteId, {
    envAllowlist: input.envAllowlist,
    dbRolloutEnabled: input.dbRolloutEnabled,
  });

  if (allowlisted) {
    return {
      allowed: true,
      allowlisted: true,
      scopedKillSwitchBypass: true,
      blockedReason: null,
    };
  }

  const killEngaged =
    typeof input.killSwitchEngaged === "boolean"
      ? input.killSwitchEngaged
      : (() => {
          const raw = process.env.LIVE_PUBLISH_KILL_SWITCH?.trim().toLowerCase();
          if (
            raw === "0" ||
            raw === "false" ||
            raw === "cleared" ||
            raw === "off" ||
            raw === "disabled"
          ) {
            return false;
          }
          if (
            raw === "1" ||
            raw === "true" ||
            raw === "engaged" ||
            raw === "on" ||
            raw === "enabled"
          ) {
            return true;
          }
          return true;
        })();

  if (killEngaged) {
    return {
      allowed: false,
      allowlisted: false,
      scopedKillSwitchBypass: false,
      blockedReason: "kill_switch_engaged",
    };
  }

  if (isLivePublishOpenToAll()) {
    return {
      allowed: true,
      allowlisted: false,
      scopedKillSwitchBypass: false,
      blockedReason: null,
    };
  }

  return {
    allowed: false,
    allowlisted: false,
    scopedKillSwitchBypass: false,
    blockedReason: "website_not_allowlisted",
  };
}

export function utcDayBounds(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      -1
    )
  );
  return { start, end };
}
