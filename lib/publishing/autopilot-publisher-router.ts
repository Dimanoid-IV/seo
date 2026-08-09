import type {
  AutopilotPlanItemPipelineState,
  AutopilotPlanItemPublishingPath,
  AutopilotPlanItemStatus,
} from "@/lib/autopilot/plan-item-types";

export type AutopilotPublishingProvider =
  | "wordpress"
  | "webflow"
  | "shopify"
  | "wix"
  | "ghost"
  | "custom_webhook"
  | "github_pr"
  | "squarespace"
  | "hosted_blog"
  | "universal_package";

export type AutopilotPublishingConnections = {
  wordpressConnected: boolean;
  webflowConnected: boolean;
  shopifyConnected: boolean;
  wixConnected: boolean;
  ghostConnected: boolean;
  customWebhookReady: boolean;
  githubPrConnected: boolean;
  squarespaceConnected: boolean;
  hostedBlogAvailable: boolean;
};

export type AutopilotPublishingTarget = {
  provider: AutopilotPublishingProvider;
  path: AutopilotPlanItemPublishingPath;
  pipelineState: AutopilotPlanItemPipelineState;
  nextAutomatedStep: string;
  status: AutopilotPlanItemStatus;
  summaryKey: string;
  dryRunSummaryKey: string;
};

const TARGETS: Record<AutopilotPublishingProvider, AutopilotPublishingTarget> = {
  wordpress: {
    provider: "wordpress",
    path: "wordpress_draft",
    pipelineState: "WORDPRESS_DRAFT_CREATED",
    nextAutomatedStep: "review_wordpress_draft",
    status: "executed",
    summaryKey: "wordpressDraftCreated",
    dryRunSummaryKey: "wouldCreateWordPressDraft",
  },
  webflow: {
    provider: "webflow",
    path: "webflow",
    pipelineState: "WEBFLOW_ITEM_CREATED",
    nextAutomatedStep: "review_connected_platform",
    status: "executed",
    summaryKey: "webflowItemCreated",
    dryRunSummaryKey: "wouldCreateWebflowItem",
  },
  shopify: {
    provider: "shopify",
    path: "shopify",
    pipelineState: "SHOPIFY_ARTICLE_CREATED",
    nextAutomatedStep: "review_connected_platform",
    status: "executed",
    summaryKey: "shopifyArticleCreated",
    dryRunSummaryKey: "wouldCreateShopifyArticle",
  },
  wix: {
    provider: "wix",
    path: "wix",
    pipelineState: "WIX_DRAFT_CREATED",
    nextAutomatedStep: "review_connected_platform",
    status: "executed",
    summaryKey: "wixDraftCreated",
    dryRunSummaryKey: "wouldCreateWixDraft",
  },
  ghost: {
    provider: "ghost",
    path: "ghost",
    pipelineState: "GHOST_POST_CREATED",
    nextAutomatedStep: "review_connected_platform",
    status: "executed",
    summaryKey: "ghostPostCreated",
    dryRunSummaryKey: "wouldCreateGhostPost",
  },
  custom_webhook: {
    provider: "custom_webhook",
    path: "webhook",
    pipelineState: "WEBHOOK_READY",
    nextAutomatedStep: "send_webhook_when_allowed",
    status: "prepared",
    summaryKey: "webhookReady",
    dryRunSummaryKey: "wouldPrepareWebhookReady",
  },
  github_pr: {
    provider: "github_pr",
    path: "github_pr",
    pipelineState: "GITHUB_PR_CREATED",
    nextAutomatedStep: "review_connected_platform",
    status: "executed",
    summaryKey: "githubPrCreated",
    dryRunSummaryKey: "wouldCreateGitHubPr",
  },
  squarespace: {
    provider: "squarespace",
    path: "squarespace",
    pipelineState: "SQUARESPACE_PACKAGE_READY",
    nextAutomatedStep: "copy_or_send_package",
    status: "prepared",
    summaryKey: "squarespacePackageReady",
    dryRunSummaryKey: "wouldPrepareSquarespacePackage",
  },
  hosted_blog: {
    provider: "hosted_blog",
    path: "hosted_blog",
    pipelineState: "HOSTED_BLOG_PUBLISHED",
    nextAutomatedStep: "done",
    status: "published",
    summaryKey: "hostedBlogPublished",
    dryRunSummaryKey: "wouldPublishHostedBlog",
  },
  universal_package: {
    provider: "universal_package",
    path: "universal_package",
    pipelineState: "UNIVERSAL_PACKAGE_READY",
    nextAutomatedStep: "copy_or_send_package",
    status: "prepared",
    summaryKey: "universalPackageReady",
    dryRunSummaryKey: "wouldPrepareUniversalPackage",
  },
};

const PATH_TO_PROVIDER: Partial<
  Record<AutopilotPlanItemPublishingPath, AutopilotPublishingProvider>
> = {
  wordpress_draft: "wordpress",
  webflow: "webflow",
  shopify: "shopify",
  wix: "wix",
  ghost: "ghost",
  webhook: "custom_webhook",
  github_pr: "github_pr",
  squarespace: "squarespace",
  hosted_blog: "hosted_blog",
  universal_package: "universal_package",
};

const DEFAULT_PRIORITY: AutopilotPublishingProvider[] = [
  "wordpress",
  "webflow",
  "shopify",
  "wix",
  "ghost",
  "custom_webhook",
  "github_pr",
  "squarespace",
  "hosted_blog",
  "universal_package",
];

function isProviderAvailable(
  provider: AutopilotPublishingProvider,
  connections: AutopilotPublishingConnections
): boolean {
  switch (provider) {
    case "wordpress":
      return connections.wordpressConnected;
    case "webflow":
      return connections.webflowConnected;
    case "shopify":
      return connections.shopifyConnected;
    case "wix":
      return connections.wixConnected;
    case "ghost":
      return connections.ghostConnected;
    case "custom_webhook":
      return connections.customWebhookReady;
    case "github_pr":
      return connections.githubPrConnected;
    case "squarespace":
      return connections.squarespaceConnected;
    case "hosted_blog":
      return connections.hostedBlogAvailable;
    case "universal_package":
      return true;
  }
}

export function resolveAutopilotPublishingTarget(input: {
  connections: AutopilotPublishingConnections;
  preferredPath?: AutopilotPlanItemPublishingPath | null;
}): AutopilotPublishingTarget {
  const preferredProvider = input.preferredPath
    ? PATH_TO_PROVIDER[input.preferredPath]
    : undefined;

  if (
    preferredProvider &&
    isProviderAvailable(preferredProvider, input.connections)
  ) {
    return TARGETS[preferredProvider];
  }

  const provider =
    DEFAULT_PRIORITY.find((candidate) =>
      isProviderAvailable(candidate, input.connections)
    ) ?? "universal_package";

  return TARGETS[provider];
}

