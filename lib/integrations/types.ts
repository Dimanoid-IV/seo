import type { GscConnectionState } from "./gsc-state";
import type { GscMetricsSummary } from "./gsc-types";
import type { WordPressConnectionMetadata } from "./wordpress-types";

export type { GscMetricsSummary };

export type IntegrationOverviewItem = {
  provider: string;
  title: string;
  description: string;
  connected: boolean;
  status: string;
  available: boolean;
  comingSoon: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  /** GSC only: canonical connection state (partial vs fully connected) */
  gscState?: GscConnectionState;
  /** GSC only: Google OAuth token exists (even if no property selected yet) */
  googleConnected?: boolean;
  /** GSC only: selected Search Console property URL */
  selectedProperty?: string | null;
  /** GSC only: last 28-day metrics summary */
  metricsSummary?: GscMetricsSummary | null;
  /** GSC only: when metrics were last fetched from Google */
  lastFetchedAt?: string | null;
  /** WordPress connector metadata */
  wordpress?: WordPressConnectionMetadata | null;
  /** Hermes AI — platform-managed engine (not user OAuth) */
  platformManaged?: boolean;
  hermesConfigured?: boolean;
};

export type IntegrationsOverviewData = {
  website: {
    id: string;
    url: string;
  } | null;
  integrations: IntegrationOverviewItem[];
  /** Host-only custom webhook status — never includes URL/secret. */
  customPublishing?: {
    endpointConfigured: boolean;
    endpointHost: string | null;
    testedAt: string | null;
    hasSharedSecret: boolean;
    connectedBanner: string | null;
  } | null;
};

export type IntegrationsOverviewResponse = {
  data: IntegrationsOverviewData;
};
