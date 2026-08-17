CREATE TYPE "CrawlPageType" AS ENUM ('HOME', 'ABOUT', 'PRODUCT', 'SERVICE', 'CATEGORY', 'BLOG', 'CONTACT', 'LEGAL', 'OTHER');
CREATE TYPE "SearchIntent" AS ENUM ('INFORMATIONAL', 'COMMERCIAL', 'TRANSACTIONAL', 'NAVIGATIONAL', 'LOCAL', 'COMPARISON', 'MIXED');
CREATE TYPE "ContentActionType" AS ENUM ('CREATE_NEW_PAGE', 'UPDATE_EXISTING', 'ADD_SECTION', 'ADD_FAQ', 'ADD_INTERNAL_LINKS', 'CHANGE_META', 'MERGE_CONTENT', 'NO_ACTION');
CREATE TYPE "AutopilotActionState" AS ENUM ('PLANNED', 'SCHEDULED', 'RESEARCHING', 'GENERATING', 'REVIEWING', 'READY', 'PUBLISHING', 'PUBLISHED', 'MONITORING', 'IMPROVING', 'FAILED', 'CANCELED');
CREATE TYPE "ActionPolicyDecision" AS ENUM ('SAFE_AUTO', 'REVIEW_REQUIRED', 'BLOCKED');
CREATE TYPE "AuthorityOpportunityType" AS ENUM ('UNLINKED_MENTION', 'PARTNER_RESOURCE', 'DIRECTORY', 'COMPETITOR_LINK_GAP', 'DIGITAL_PR', 'OTHER');
CREATE TYPE "AuthorityStatus" AS ENUM ('DISCOVERED', 'QUALIFIED', 'CONTACTED', 'WON', 'LOST', 'BLOCKED');

CREATE TABLE "business_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "businessName" TEXT, "description" TEXT, "niche" TEXT, "country" TEXT,
  "targetMarketsJson" JSONB NOT NULL DEFAULT '[]', "languagesJson" JSONB NOT NULL DEFAULT '[]',
  "servicesJson" JSONB NOT NULL DEFAULT '[]', "productsJson" JSONB NOT NULL DEFAULT '[]', "pricingContextJson" JSONB,
  "targetAudiencesJson" JSONB NOT NULL DEFAULT '[]', "conversionPagesJson" JSONB NOT NULL DEFAULT '[]',
  "commercialIntent" TEXT, "competitorsJson" JSONB NOT NULL DEFAULT '[]', "toneOfVoiceJson" JSONB,
  "brandConstraintsJson" JSONB, "differentiatorsJson" JSONB NOT NULL DEFAULT '[]', "geographyJson" JSONB,
  "evidenceJson" JSONB NOT NULL DEFAULT '[]', "confidence" DOUBLE PRECISION, "lastInferredAt" TIMESTAMP(3),
  "lastConfirmedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crawled_pages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "url" TEXT NOT NULL, "normalizedUrl" TEXT NOT NULL, "urlHash" TEXT NOT NULL, "canonicalUrl" TEXT,
  "pageType" "CrawlPageType" NOT NULL DEFAULT 'OTHER', "locale" TEXT, "hreflangGroup" TEXT,
  "statusCode" INTEGER, "redirectTarget" TEXT, "indexable" BOOLEAN, "robotsDirective" TEXT, "contentHash" TEXT,
  "etag" TEXT, "lastModifiedHeader" TEXT, "inSitemap" BOOLEAN NOT NULL DEFAULT false, "crawlDepth" INTEGER,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastCrawledAt" TIMESTAMP(3), "nextCrawlAt" TIMESTAMP(3), "unchangedCount" INTEGER NOT NULL DEFAULT 0,
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0, "lastErrorCode" TEXT, "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "crawled_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "page_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "crawledPageId" UUID NOT NULL, "contentHash" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL, "title" TEXT, "metaDescription" TEXT, "headingsJson" JSONB NOT NULL DEFAULT '[]',
  "bodyText" TEXT, "internalLinksJson" JSONB NOT NULL DEFAULT '[]', "internalLinkDetailsJson" JSONB NOT NULL DEFAULT '[]', "externalLinksJson" JSONB NOT NULL DEFAULT '[]',
  "canonicalUrl" TEXT, "robotsDirective" TEXT, "indexable" BOOLEAN NOT NULL, "schemaJson" JSONB NOT NULL DEFAULT '[]',
  "hreflangJson" JSONB NOT NULL DEFAULT '[]', "imagesJson" JSONB NOT NULL DEFAULT '[]', "wordCount" INTEGER NOT NULL DEFAULT 0,
  "responseTimeMs" INTEGER, "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "page_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "keywords" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "keyword" TEXT NOT NULL, "normalizedKeyword" TEXT NOT NULL, "locale" TEXT NOT NULL, "country" TEXT NOT NULL,
  "intent" "SearchIntent" NOT NULL, "funnelStage" TEXT, "estimatedDifficulty" DOUBLE PRECISION,
  "trafficPotential" DOUBLE PRECISION, "relevance" DOUBLE PRECISION NOT NULL, "businessValue" DOUBLE PRECISION NOT NULL,
  "opportunityScore" INTEGER NOT NULL, "confidence" DOUBLE PRECISION, "targetUrl" TEXT, "rankingUrl" TEXT,
  "currentPosition" DOUBLE PRECISION, "impressions" INTEGER, "clicks" INTEGER, "ctr" DOUBLE PRECISION,
  "cannibalizationRisk" DOUBLE PRECISION, "recommendedAction" "ContentActionType" NOT NULL,
  "evidenceJson" JSONB NOT NULL DEFAULT '[]', "lastEvaluatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "keyword_metrics" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "keywordId" UUID NOT NULL, "date" DATE NOT NULL,
  "pageUrl" TEXT, "country" TEXT, "device" TEXT, "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0, "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0, "position" DOUBLE PRECISION,
  "source" TEXT NOT NULL DEFAULT 'GSC', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "keyword_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_opportunities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "keywordId" UUID, "action" "ContentActionType" NOT NULL, "targetUrl" TEXT,
  "competingUrlsJson" JSONB NOT NULL DEFAULT '[]', "reason" TEXT NOT NULL, "expectedImpact" DOUBLE PRECISION,
  "confidence" DOUBLE PRECISION, "priorityScore" INTEGER NOT NULL, "evidenceJson" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'OPEN', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "content_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_briefs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "articleId" UUID, "primaryKeyword" TEXT NOT NULL, "secondaryKeywordsJson" JSONB NOT NULL DEFAULT '[]',
  "locale" TEXT NOT NULL, "country" TEXT, "intent" "SearchIntent" NOT NULL, "targetAudience" TEXT,
  "requiredSectionsJson" JSONB NOT NULL DEFAULT '[]', "questionsJson" JSONB NOT NULL DEFAULT '[]',
  "entitiesJson" JSONB NOT NULL DEFAULT '[]', "competitorGapsJson" JSONB NOT NULL DEFAULT '[]',
  "internalLinksJson" JSONB NOT NULL DEFAULT '[]', "sourcesJson" JSONB NOT NULL DEFAULT '[]',
  "conversionGoal" TEXT, "evidenceConfidence" DOUBLE PRECISION, "researchedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "content_briefs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "autopilot_actions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "actionType" TEXT NOT NULL, "policy" "ActionPolicyDecision" NOT NULL,
  "state" "AutopilotActionState" NOT NULL DEFAULT 'PLANNED', "title" TEXT NOT NULL, "reason" TEXT NOT NULL,
  "targetUrl" TEXT, "locale" TEXT, "priority" INTEGER NOT NULL, "expectedImpact" DOUBLE PRECISION,
  "confidence" DOUBLE PRECISION, "reversible" BOOLEAN NOT NULL DEFAULT true,
  "dependenciesJson" JSONB NOT NULL DEFAULT '[]', "evidenceJson" JSONB NOT NULL DEFAULT '[]',
  "scheduledAt" TIMESTAMP(3), "startedAt" TIMESTAMP(3), "publishedAt" TIMESTAMP(3), "publishedUrl" TEXT,
  "externalId" TEXT, "integrationId" UUID, "attemptCount" INTEGER NOT NULL DEFAULT 0, "lastError" TEXT,
  "approvedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "autopilot_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "page_metrics" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID, "crawledPageId" UUID,
  "pageUrl" TEXT NOT NULL, "date" DATE NOT NULL, "country" TEXT, "device" TEXT,
  "impressions" INTEGER NOT NULL DEFAULT 0, "clicks" INTEGER NOT NULL DEFAULT 0,
  "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0, "position" DOUBLE PRECISION, "source" TEXT NOT NULL DEFAULT 'GSC',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "page_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "action_impacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID, "actionId" UUID NOT NULL,
  "pageUrl" TEXT, "metricName" TEXT NOT NULL, "metricBefore" DOUBLE PRECISION, "metricAfter" DOUBLE PRECISION,
  "absoluteChange" DOUBLE PRECISION, "relativeChange" DOUBLE PRECISION, "baselineStart" TIMESTAMP(3),
  "baselineEnd" TIMESTAMP(3), "comparisonStart" TIMESTAMP(3), "comparisonEnd" TIMESTAMP(3),
  "confidence" DOUBLE PRECISION, "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "metadataJson" JSONB,
  CONSTRAINT "action_impacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "authority_opportunities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "type" "AuthorityOpportunityType" NOT NULL, "sourceUrl" TEXT, "targetUrl" TEXT, "domain" TEXT,
  "title" TEXT NOT NULL, "rationale" TEXT, "relevance" DOUBLE PRECISION, "authorityScore" DOUBLE PRECISION,
  "riskScore" DOUBLE PRECISION, "status" "AuthorityStatus" NOT NULL DEFAULT 'DISCOVERED',
  "evidenceJson" JSONB NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "authority_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "backlink_prospects" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "domain" TEXT NOT NULL, "contactJson" JSONB, "relevance" DOUBLE PRECISION, "authorityScore" DOUBLE PRECISION,
  "spamRisk" DOUBLE PRECISION, "status" "AuthorityStatus" NOT NULL DEFAULT 'DISCOVERED', "source" TEXT, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "backlink_prospects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outreach_campaigns" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "name" TEXT NOT NULL, "status" "AuthorityStatus" NOT NULL DEFAULT 'DISCOVERED', "strategyJson" JSONB,
  "prospectIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "outreach_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mentions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "websiteId" UUID NOT NULL, "organizationId" UUID NOT NULL,
  "sourceUrl" TEXT NOT NULL, "domain" TEXT NOT NULL, "anchorText" TEXT, "linked" BOOLEAN NOT NULL DEFAULT false,
  "targetUrl" TEXT, "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "metadataJson" JSONB,
  CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_profiles_websiteId_key" ON "business_profiles"("websiteId");
CREATE INDEX "business_profiles_organizationId_idx" ON "business_profiles"("organizationId");
CREATE INDEX "business_profiles_lastInferredAt_idx" ON "business_profiles"("lastInferredAt");
CREATE UNIQUE INDEX "crawled_pages_websiteId_urlHash_key" ON "crawled_pages"("websiteId", "urlHash");
CREATE INDEX "crawled_pages_websiteId_nextCrawlAt_idx" ON "crawled_pages"("websiteId", "nextCrawlAt");
CREATE INDEX "crawled_pages_websiteId_canonicalUrl_idx" ON "crawled_pages"("websiteId", "canonicalUrl");
CREATE INDEX "crawled_pages_websiteId_pageType_idx" ON "crawled_pages"("websiteId", "pageType");
CREATE INDEX "crawled_pages_websiteId_indexable_idx" ON "crawled_pages"("websiteId", "indexable");
CREATE UNIQUE INDEX "page_snapshots_crawledPageId_contentHash_key" ON "page_snapshots"("crawledPageId", "contentHash");
CREATE INDEX "page_snapshots_crawledPageId_fetchedAt_idx" ON "page_snapshots"("crawledPageId", "fetchedAt");
CREATE UNIQUE INDEX "keywords_websiteId_normalizedKeyword_locale_country_key" ON "keywords"("websiteId", "normalizedKeyword", "locale", "country");
CREATE INDEX "keywords_websiteId_opportunityScore_idx" ON "keywords"("websiteId", "opportunityScore");
CREATE INDEX "keywords_websiteId_intent_idx" ON "keywords"("websiteId", "intent");
CREATE UNIQUE INDEX "keyword_metrics_keywordId_date_pageUrl_country_device_key" ON "keyword_metrics"("keywordId", "date", "pageUrl", "country", "device");
CREATE INDEX "keyword_metrics_keywordId_date_idx" ON "keyword_metrics"("keywordId", "date");
CREATE INDEX "content_opportunities_websiteId_status_priorityScore_idx" ON "content_opportunities"("websiteId", "status", "priorityScore");
CREATE INDEX "content_opportunities_keywordId_idx" ON "content_opportunities"("keywordId");
CREATE INDEX "content_briefs_websiteId_createdAt_idx" ON "content_briefs"("websiteId", "createdAt");
CREATE INDEX "content_briefs_articleId_idx" ON "content_briefs"("articleId");
CREATE UNIQUE INDEX "autopilot_actions_idempotencyKey_key" ON "autopilot_actions"("idempotencyKey");
CREATE INDEX "autopilot_actions_websiteId_state_scheduledAt_idx" ON "autopilot_actions"("websiteId", "state", "scheduledAt");
CREATE INDEX "autopilot_actions_websiteId_policy_idx" ON "autopilot_actions"("websiteId", "policy");
CREATE UNIQUE INDEX "page_metrics_websiteId_pageUrl_date_country_device_key" ON "page_metrics"("websiteId", "pageUrl", "date", "country", "device");
CREATE INDEX "page_metrics_websiteId_date_idx" ON "page_metrics"("websiteId", "date");
CREATE INDEX "page_metrics_crawledPageId_date_idx" ON "page_metrics"("crawledPageId", "date");
CREATE INDEX "action_impacts_websiteId_measuredAt_idx" ON "action_impacts"("websiteId", "measuredAt");
CREATE INDEX "action_impacts_actionId_idx" ON "action_impacts"("actionId");
CREATE INDEX "authority_opportunities_websiteId_status_idx" ON "authority_opportunities"("websiteId", "status");
CREATE INDEX "authority_opportunities_websiteId_type_idx" ON "authority_opportunities"("websiteId", "type");
CREATE UNIQUE INDEX "backlink_prospects_websiteId_domain_key" ON "backlink_prospects"("websiteId", "domain");
CREATE INDEX "backlink_prospects_websiteId_status_idx" ON "backlink_prospects"("websiteId", "status");
CREATE INDEX "outreach_campaigns_websiteId_status_idx" ON "outreach_campaigns"("websiteId", "status");
CREATE UNIQUE INDEX "mentions_websiteId_sourceUrl_key" ON "mentions"("websiteId", "sourceUrl");
CREATE INDEX "mentions_websiteId_linked_idx" ON "mentions"("websiteId", "linked");

ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crawled_pages" ADD CONSTRAINT "crawled_pages_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "page_snapshots" ADD CONSTRAINT "page_snapshots_crawledPageId_fkey" FOREIGN KEY ("crawledPageId") REFERENCES "crawled_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "keyword_metrics" ADD CONSTRAINT "keyword_metrics_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_opportunities" ADD CONSTRAINT "content_opportunities_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_opportunities" ADD CONSTRAINT "content_opportunities_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "keywords"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_briefs" ADD CONSTRAINT "content_briefs_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autopilot_actions" ADD CONSTRAINT "autopilot_actions_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "page_metrics" ADD CONSTRAINT "page_metrics_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "page_metrics" ADD CONSTRAINT "page_metrics_crawledPageId_fkey" FOREIGN KEY ("crawledPageId") REFERENCES "crawled_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "action_impacts" ADD CONSTRAINT "action_impacts_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_impacts" ADD CONSTRAINT "action_impacts_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "autopilot_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "authority_opportunities" ADD CONSTRAINT "authority_opportunities_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "backlink_prospects" ADD CONSTRAINT "backlink_prospects_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "job_leases" (
  "key" TEXT NOT NULL, "owner" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "job_leases_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "job_leases_expiresAt_idx" ON "job_leases"("expiresAt");

CREATE TABLE "cron_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "jobKey" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "status" TEXT NOT NULL, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" TIMESTAMP(3),
  "durationMs" INTEGER, "reportJson" JSONB, "errorCode" TEXT, "errorMessage" TEXT,
  CONSTRAINT "cron_runs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cron_runs_idempotencyKey_key" ON "cron_runs"("idempotencyKey");
CREATE INDEX "cron_runs_jobKey_startedAt_idx" ON "cron_runs"("jobKey", "startedAt");
CREATE INDEX "cron_runs_status_startedAt_idx" ON "cron_runs"("status", "startedAt");

ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crawled_pages" ADD CONSTRAINT "crawled_pages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "content_opportunities" ADD CONSTRAINT "content_opportunities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "content_briefs" ADD CONSTRAINT "content_briefs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "content_briefs" ADD CONSTRAINT "content_briefs_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "autopilot_actions" ADD CONSTRAINT "autopilot_actions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "page_metrics" ADD CONSTRAINT "page_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "action_impacts" ADD CONSTRAINT "action_impacts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "authority_opportunities" ADD CONSTRAINT "authority_opportunities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "backlink_prospects" ADD CONSTRAINT "backlink_prospects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
