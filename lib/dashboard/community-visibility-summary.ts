import type {
  CommunityVisibilityChannel,
  CommunityVisibilitySnapshot,
} from "@/lib/autopilot/community-visibility";

export type DashboardCommunityVisibilitySummary = {
  href: string;
  opportunityCount: number;
  sourceKeywords: string[];
  queries: Array<{
    channel: CommunityVisibilityChannel;
    query: string;
    searchUrl: string;
  }>;
  hasEnoughSignal: boolean;
};

export function buildDashboardCommunityVisibilitySummary({
  snapshot,
  href,
}: {
  snapshot: CommunityVisibilitySnapshot | null | undefined;
  href: string;
}): DashboardCommunityVisibilitySummary | undefined {
  if (!snapshot || snapshot.opportunities.length === 0) return undefined;

  return {
    href,
    opportunityCount: snapshot.opportunities.length,
    sourceKeywords: snapshot.sourceKeywords.slice(0, 3),
    queries: snapshot.opportunities.slice(0, 3).map((item) => ({
      channel: item.channel,
      query: item.query,
      searchUrl: item.searchUrl,
    })),
    hasEnoughSignal: snapshot.hasEnoughSignal,
  };
}
