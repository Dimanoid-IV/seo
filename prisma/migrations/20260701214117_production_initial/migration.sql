-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPPORT', 'ANALYST', 'ADMIN');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('RU', 'ET', 'EN');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "WebsiteStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WebsiteNiche" AS ENUM ('BEAUTY', 'RESTAURANT', 'ECOMMERCE', 'B2B', 'OTHER');

-- CreateEnum
CREATE TYPE "WebsiteCms" AS ENUM ('WORDPRESS', 'SHOPIFY', 'WEBFLOW', 'TILDA', 'NEXTJS', 'OTHER');

-- CreateEnum
CREATE TYPE "WebsiteLanguage" AS ENUM ('RU', 'ET', 'EN');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'AUDIT', 'START', 'STARTER', 'GROWTH', 'PRO', 'AGENCY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION', 'REFUND');

-- CreateEnum
CREATE TYPE "UsageKey" AS ENUM ('AUDIT_RUN', 'AI_GENERATION', 'ARTICLE_DRAFT', 'SOCIAL_POST', 'MONTHLY_AUTOPILOT', 'EMAIL_APPROVAL', 'REPORT');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('ADD_WEBSITE', 'RUN_AUDIT', 'CONNECT_GSC', 'REVIEW_RESULTS', 'GENERATE_PLAN', 'COMPLETE');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('PREVIEW', 'FULL', 'EXPRESS');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('QUEUED', 'CRAWLING', 'ANALYZING', 'SCORING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AuditTriggeredBy" AS ENUM ('USER', 'CRON', 'SYSTEM', 'ONBOARDING');

-- CreateEnum
CREATE TYPE "AuditCheckCategory" AS ENUM ('TECHNICAL', 'CONTENT', 'LOCAL_SEO', 'PERFORMANCE', 'ACCESSIBILITY', 'AI_READINESS', 'SECURITY', 'CONVERSION', 'SOCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditCheckSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditCheckStatus" AS ENUM ('PASS', 'WARNING', 'FAIL', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ScoreSource" AS ENUM ('AUDIT', 'MANUAL', 'SYSTEM', 'CRON', 'IMPORT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('AUDIT_STARTED', 'AUDIT_COMPLETED', 'AUDIT_FAILED', 'GROWTH_SCORE_UPDATED', 'AI_READINESS_UPDATED', 'TASK_CREATED', 'TASK_COMPLETED', 'ARTICLE_CREATED', 'ARTICLE_DRAFT_CREATED', 'ARTICLE_VALIDATED', 'ARTICLE_REPAIRED', 'GROWTH_OPPORTUNITY_FOUND', 'SOCIAL_POST_CREATED', 'INTEGRATION_CONNECTED', 'INTEGRATION_DISCONNECTED', 'REPORT_SENT', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'PAYMENT_RECEIVED', 'SYSTEM_NOTICE');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('AUDIT_COMPLETED', 'SCORE_CHANGED', 'TASK_CREATED', 'TASK_COMPLETED', 'GSC_INSIGHT_FOUND', 'GSC_OPPORTUNITY_FOUND', 'CONTENT_IDEA_CREATED', 'ARTICLE_DRAFT_CREATED', 'WORDPRESS_DRAFT_CREATED', 'REPORT_CREATED', 'INTEGRATION_CONNECTED', 'INTEGRATION_ERROR', 'AI_RECOMMENDATION_CREATED', 'SOCIAL_POST_DRAFT_CREATED', 'MONTHLY_AUTOPILOT_PLAN_CREATED', 'EMAIL_APPROVAL_CREATED', 'DAILY_SUMMARY', 'SYSTEM_NOTE');

-- CreateEnum
CREATE TYPE "TimelineEventSource" AS ENUM ('AUDIT_ENGINE', 'RULE_ENGINE', 'GROWTH_SCORE', 'TASKS', 'CONTENT_PLAN', 'REPORTS', 'GSC', 'WORDPRESS', 'HERMES', 'AI_QUALITY_PIPELINE', 'CONTINUOUS_IMPROVEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TimelineEventSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'OPPORTUNITY');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('TECHNICAL', 'CONTENT', 'LOCAL_SEO', 'PERFORMANCE', 'ACCESSIBILITY', 'AI_READINESS', 'SECURITY', 'CONVERSION', 'SOCIAL', 'INTEGRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_REVIEW', 'COMPLETED', 'DISMISSED', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskEffort" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('AUDIT', 'AI', 'SYSTEM', 'USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MonthlyPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MonthlyAutopilotStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailApprovalType" AS ENUM ('MONTHLY_PLAN_REVIEW', 'CONTENT_REVIEW', 'SOCIAL_POST_REVIEW', 'GROWTH_ALERT', 'INTEGRATION_ALERT', 'GENERAL_REVIEW');

-- CreateEnum
CREATE TYPE "EmailApprovalStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'SENT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailApprovalSource" AS ENUM ('MONTHLY_AUTOPILOT', 'ARTICLE', 'SOCIAL_POST', 'TIMELINE', 'GSC', 'INTEGRATION', 'MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PlanItemType" AS ENUM ('TASK', 'ARTICLE', 'SOCIAL_POST', 'REPORT', 'INTEGRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PlanItemStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('IDEA', 'DRAFT', 'WAITING_REVIEW', 'APPROVED', 'WORDPRESS_DRAFT_CREATED', 'PUBLISHED', 'ARCHIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'X', 'GOOGLE_BUSINESS', 'GENERIC', 'OTHER');

-- CreateEnum
CREATE TYPE "SocialPostSource" AS ENUM ('TASK', 'ARTICLE', 'CONTENT_IDEA', 'GSC_INSIGHT', 'TIMELINE_EVENT', 'GROWTH_SCORE', 'CONTINUOUS_IMPROVEMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'READY', 'COPIED', 'APPROVED', 'SCHEDULED', 'PUBLISHED_EXTERNALLY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('MONTHLY', 'AUDIT', 'MID_MONTH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'READY', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE_SEARCH_CONSOLE', 'GOOGLE_ANALYTICS', 'GOOGLE_BUSINESS_PROFILE', 'WORDPRESS', 'STRIPE', 'OTHER');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR', 'REVOKED');

-- CreateEnum
CREATE TYPE "WordPressConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "AIJobType" AS ENUM ('AUDIT_PREVIEW', 'AUDIT_FULL', 'GENERATE_TASKS', 'GENERATE_MONTHLY_PLAN', 'GENERATE_ARTICLE', 'GENERATE_SOCIAL_POSTS', 'QUALITY_CHECK', 'GENERATE_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED', 'RETRYING');

-- CreateEnum
CREATE TYPE "AIUsagePurpose" AS ENUM ('AUDIT', 'TASK_GENERATION', 'CONTENT_GENERATION', 'QUALITY_REPAIR', 'SOCIAL_GENERATION', 'REPORT_GENERATION', 'QUALITY_CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('VERIFY_EMAIL', 'PASSWORD_RESET', 'AUDIT_READY', 'MONTHLY_REPORT', 'PAYMENT_RECEIPT', 'SYSTEM_ALERT', 'MARKETING');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'OPENED', 'CLICKED');

-- CreateEnum
CREATE TYPE "AdminNoteVisibility" AS ENUM ('INTERNAL', 'SUPPORT', 'ADMIN_ONLY');

-- CreateEnum
CREATE TYPE "ErrorArea" AS ENUM ('API', 'AUTH', 'BILLING', 'HERMES', 'WORDPRESS', 'GOOGLE', 'EMAIL', 'DATABASE', 'CRON', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "locale" "Locale" NOT NULL DEFAULT 'RU',
    "timezone" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "googleAuthId" TEXT,
    "stripeCustomerId" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "country" TEXT,
    "city" TEXT,
    "ownerUserId" UUID NOT NULL,
    "billingUserId" UUID,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "websites" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "displayName" TEXT,
    "niche" "WebsiteNiche",
    "cms" "WebsiteCms",
    "primaryLanguage" "WebsiteLanguage" NOT NULL DEFAULT 'RU',
    "contentLanguages" JSONB NOT NULL DEFAULT '[]',
    "businessGoals" JSONB,
    "status" "WebsiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastAuditAt" TIMESTAMP(3),
    "currentGrowthScore" INTEGER,
    "currentAIReadinessScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "websites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID,
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "stripeEventId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "PaymentType" NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_limits" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "auditsLimit" INTEGER NOT NULL DEFAULT 0,
    "auditsUsed" INTEGER NOT NULL DEFAULT 0,
    "articlesLimit" INTEGER NOT NULL DEFAULT 0,
    "articlesUsed" INTEGER NOT NULL DEFAULT 0,
    "socialPostsLimit" INTEGER NOT NULL DEFAULT 0,
    "socialPostsUsed" INTEGER NOT NULL DEFAULT 0,
    "aiCreditsLimitCents" INTEGER,
    "aiCreditsUsedCents" INTEGER NOT NULL DEFAULT 0,
    "websitesLimit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_counters" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "websiteId" UUID,
    "organizationId" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "key" "UsageKey" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "type" "AuditType" NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'QUEUED',
    "triggeredBy" "AuditTriggeredBy" NOT NULL,
    "triggeredByUserId" UUID,
    "growthScore" INTEGER,
    "aiReadinessScore" INTEGER,
    "summaryJson" JSONB,
    "rawResultJson" JSONB,
    "visiblePreviewJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_checks" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "category" "AuditCheckCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "AuditCheckSeverity" NOT NULL,
    "status" "AuditCheckStatus" NOT NULL,
    "scoreImpact" INTEGER,
    "isVisibleInPreview" BOOLEAN NOT NULL DEFAULT false,
    "recommendationJson" JSONB,
    "evidenceJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_score_snapshots" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "auditId" UUID,
    "score" INTEGER NOT NULL,
    "previousScore" INTEGER,
    "delta" INTEGER,
    "breakdownJson" JSONB NOT NULL,
    "reason" TEXT,
    "source" "ScoreSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_readiness_snapshots" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "auditId" UUID,
    "score" INTEGER NOT NULL,
    "previousScore" INTEGER,
    "delta" INTEGER,
    "breakdownJson" JSONB NOT NULL,
    "reason" TEXT,
    "source" "ScoreSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_readiness_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "websiteId" UUID,
    "userId" UUID,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "auditId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "impactScore" INTEGER,
    "effort" "TaskEffort",
    "source" "TaskSource" NOT NULL,
    "recommendationJson" JSONB,
    "resultJson" JSONB,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_plans" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "status" "MonthlyPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "goalsJson" JSONB,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "monthly_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_autopilot_plans" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "status" "MonthlyAutopilotStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "focusAreasJson" JSONB,
    "metricsJson" JSONB,
    "taskIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "articleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "socialPostIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timelineEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendationsJson" JSONB,
    "risksJson" JSONB,
    "nextActionsJson" JSONB,
    "generatedBy" TEXT DEFAULT 'system',
    "approvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_autopilot_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_approvals" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" "EmailApprovalType" NOT NULL,
    "status" "EmailApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "language" TEXT,
    "source" "EmailApprovalSource" NOT NULL,
    "sourceId" UUID,
    "relatedPlanId" UUID,
    "relatedArticleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedSocialPostIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedTaskIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedTimelineEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_items" (
    "id" UUID NOT NULL,
    "monthlyPlanId" UUID NOT NULL,
    "type" "PlanItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlanItemStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "linkedTaskId" UUID,
    "linkedArticleId" UUID,
    "linkedSocialPostId" UUID,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "monthlyPlanId" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "language" "WebsiteLanguage" NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'IDEA',
    "topic" TEXT,
    "targetKeyword" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "contentHtml" TEXT,
    "contentJson" JSONB,
    "faqJson" JSONB,
    "schemaJson" JSONB,
    "wordpressPostId" TEXT,
    "wordpressEditUrl" TEXT,
    "generatedByAIJobId" UUID,
    "qualityScore" INTEGER,
    "qualityPassed" BOOLEAN,
    "qualityIssuesJson" JSONB,
    "qualityRepairAttempts" INTEGER NOT NULL DEFAULT 0,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "articleId" UUID,
    "monthlyPlanId" UUID,
    "platform" "SocialPlatform" NOT NULL,
    "language" "WebsiteLanguage" NOT NULL,
    "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "text" TEXT NOT NULL,
    "hook" TEXT,
    "hashtagsJson" JSONB,
    "cta" TEXT,
    "imagePrompt" TEXT,
    "source" "SocialPostSource" NOT NULL DEFAULT 'MANUAL',
    "sourceId" UUID,
    "qualityScore" INTEGER,
    "qualityIssuesJson" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "copiedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedExternallyAt" TIMESTAMP(3),
    "generatedByAIJobId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" "ReportType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "reportJson" JSONB NOT NULL,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "displayName" TEXT,
    "scopesJson" JSONB,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "apiKeyEncrypted" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_integration_data" (
    "id" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "propertyId" TEXT,
    "siteUrl" TEXT,
    "searchConsoleSiteUrl" TEXT,
    "businessProfileAccountId" TEXT,
    "businessProfileLocationId" TEXT,
    "analyticsPropertyId" TEXT,
    "metricsJson" JSONB,
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_integration_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordpress_connections" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "status" "WordPressConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "siteUrl" TEXT NOT NULL,
    "pluginVersion" TEXT,
    "apiKeyHash" TEXT NOT NULL,
    "apiSecretEncrypted" TEXT,
    "permissionsJson" JSONB NOT NULL,
    "lastPingAt" TIMESTAMP(3),
    "lastDraftCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "wordpress_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" UUID NOT NULL,
    "websiteId" UUID,
    "organizationId" UUID,
    "userId" UUID,
    "type" "AIJobType" NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "costCents" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usages" (
    "id" UUID NOT NULL,
    "aiJobId" UUID,
    "websiteId" UUID,
    "organizationId" UUID,
    "userId" UUID,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "costCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "purpose" "AIUsagePurpose" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "websiteId" UUID,
    "userId" UUID,
    "toEmail" TEXT NOT NULL,
    "fromEmail" TEXT,
    "subject" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "resendId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notes" (
    "id" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "targetUserId" UUID,
    "organizationId" UUID,
    "websiteId" UUID,
    "note" TEXT NOT NULL,
    "visibility" "AdminNoteVisibility" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" UUID NOT NULL,
    "requestId" TEXT,
    "organizationId" UUID,
    "websiteId" UUID,
    "userId" UUID,
    "area" "ErrorArea" NOT NULL,
    "severity" "ErrorSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "metadataJson" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "source" "TimelineEventSource" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "details" JSONB,
    "severity" "TimelineEventSeverity" NOT NULL DEFAULT 'INFO',
    "relatedTaskId" UUID,
    "relatedArticleId" UUID,
    "relatedReportId" UUID,
    "relatedIntegration" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_user_states" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "timelineLastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_user_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_preview_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "inputUrl" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "finalUrl" TEXT NOT NULL,
    "statusCode" INTEGER,
    "rawScore" INTEGER NOT NULL,
    "estimatedFixMinutes" INTEGER NOT NULL,
    "summaryJson" JSONB NOT NULL,
    "previewIssuesJson" JSONB NOT NULL,
    "checksJson" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_preview_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_states" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "websiteId" UUID,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentStep" "OnboardingStep" NOT NULL DEFAULT 'ADD_WEBSITE',
    "addWebsiteCompletedAt" TIMESTAMP(3),
    "firstAuditCompletedAt" TIMESTAMP(3),
    "gscStepCompletedAt" TIMESTAMP(3),
    "growthScoreViewedAt" TIMESTAMP(3),
    "firstTasksViewedAt" TIMESTAMP(3),
    "firstPlanGeneratedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_stripeCustomerId_idx" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "users_googleAuthId_idx" ON "users"("googleAuthId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "organizations_ownerUserId_idx" ON "organizations"("ownerUserId");

-- CreateIndex
CREATE INDEX "organizations_billingUserId_idx" ON "organizations"("billingUserId");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "organizations_deletedAt_idx" ON "organizations"("deletedAt");

-- CreateIndex
CREATE INDEX "websites_organizationId_idx" ON "websites"("organizationId");

-- CreateIndex
CREATE INDEX "websites_status_idx" ON "websites"("status");

-- CreateIndex
CREATE INDEX "websites_lastAuditAt_idx" ON "websites"("lastAuditAt");

-- CreateIndex
CREATE INDEX "websites_currentGrowthScore_idx" ON "websites"("currentGrowthScore");

-- CreateIndex
CREATE INDEX "websites_deletedAt_idx" ON "websites"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "websites_organizationId_url_key" ON "websites"("organizationId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_organizationId_idx" ON "subscriptions"("organizationId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions"("plan");

-- CreateIndex
CREATE INDEX "subscriptions_currentPeriodEnd_idx" ON "subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "subscriptions_deletedAt_idx" ON "subscriptions"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeInvoiceId_key" ON "payments"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeEventId_key" ON "payments"("stripeEventId");

-- CreateIndex
CREATE INDEX "payments_organizationId_idx" ON "payments"("organizationId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_paidAt_idx" ON "payments"("paidAt");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "plan_limits_subscriptionId_idx" ON "plan_limits"("subscriptionId");

-- CreateIndex
CREATE INDEX "plan_limits_organizationId_idx" ON "plan_limits"("organizationId");

-- CreateIndex
CREATE INDEX "plan_limits_periodStart_periodEnd_idx" ON "plan_limits"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "usage_counters_userId_idx" ON "usage_counters"("userId");

-- CreateIndex
CREATE INDEX "usage_counters_websiteId_idx" ON "usage_counters"("websiteId");

-- CreateIndex
CREATE INDEX "usage_counters_organizationId_idx" ON "usage_counters"("organizationId");

-- CreateIndex
CREATE INDEX "usage_counters_month_idx" ON "usage_counters"("month");

-- CreateIndex
CREATE INDEX "usage_counters_key_idx" ON "usage_counters"("key");

-- CreateIndex
CREATE UNIQUE INDEX "usage_counters_organizationId_userId_month_key_key" ON "usage_counters"("organizationId", "userId", "month", "key");

-- CreateIndex
CREATE INDEX "audits_websiteId_idx" ON "audits"("websiteId");

-- CreateIndex
CREATE INDEX "audits_status_idx" ON "audits"("status");

-- CreateIndex
CREATE INDEX "audits_type_idx" ON "audits"("type");

-- CreateIndex
CREATE INDEX "audits_createdAt_idx" ON "audits"("createdAt");

-- CreateIndex
CREATE INDEX "audits_completedAt_idx" ON "audits"("completedAt");

-- CreateIndex
CREATE INDEX "audits_deletedAt_idx" ON "audits"("deletedAt");

-- CreateIndex
CREATE INDEX "audit_checks_auditId_idx" ON "audit_checks"("auditId");

-- CreateIndex
CREATE INDEX "audit_checks_websiteId_idx" ON "audit_checks"("websiteId");

-- CreateIndex
CREATE INDEX "audit_checks_category_idx" ON "audit_checks"("category");

-- CreateIndex
CREATE INDEX "audit_checks_severity_idx" ON "audit_checks"("severity");

-- CreateIndex
CREATE INDEX "audit_checks_status_idx" ON "audit_checks"("status");

-- CreateIndex
CREATE INDEX "audit_checks_isVisibleInPreview_idx" ON "audit_checks"("isVisibleInPreview");

-- CreateIndex
CREATE INDEX "audit_checks_code_idx" ON "audit_checks"("code");

-- CreateIndex
CREATE INDEX "growth_score_snapshots_websiteId_idx" ON "growth_score_snapshots"("websiteId");

-- CreateIndex
CREATE INDEX "growth_score_snapshots_auditId_idx" ON "growth_score_snapshots"("auditId");

-- CreateIndex
CREATE INDEX "growth_score_snapshots_createdAt_idx" ON "growth_score_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "growth_score_snapshots_score_idx" ON "growth_score_snapshots"("score");

-- CreateIndex
CREATE INDEX "ai_readiness_snapshots_websiteId_idx" ON "ai_readiness_snapshots"("websiteId");

-- CreateIndex
CREATE INDEX "ai_readiness_snapshots_auditId_idx" ON "ai_readiness_snapshots"("auditId");

-- CreateIndex
CREATE INDEX "ai_readiness_snapshots_createdAt_idx" ON "ai_readiness_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "ai_readiness_snapshots_score_idx" ON "ai_readiness_snapshots"("score");

-- CreateIndex
CREATE INDEX "activities_organizationId_idx" ON "activities"("organizationId");

-- CreateIndex
CREATE INDEX "activities_websiteId_idx" ON "activities"("websiteId");

-- CreateIndex
CREATE INDEX "activities_userId_idx" ON "activities"("userId");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "tasks_websiteId_idx" ON "tasks"("websiteId");

-- CreateIndex
CREATE INDEX "tasks_organizationId_idx" ON "tasks"("organizationId");

-- CreateIndex
CREATE INDEX "tasks_auditId_idx" ON "tasks"("auditId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_category_idx" ON "tasks"("category");

-- CreateIndex
CREATE INDEX "tasks_dueAt_idx" ON "tasks"("dueAt");

-- CreateIndex
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");

-- CreateIndex
CREATE INDEX "tasks_deletedAt_idx" ON "tasks"("deletedAt");

-- CreateIndex
CREATE INDEX "monthly_plans_websiteId_idx" ON "monthly_plans"("websiteId");

-- CreateIndex
CREATE INDEX "monthly_plans_organizationId_idx" ON "monthly_plans"("organizationId");

-- CreateIndex
CREATE INDEX "monthly_plans_month_idx" ON "monthly_plans"("month");

-- CreateIndex
CREATE INDEX "monthly_plans_status_idx" ON "monthly_plans"("status");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_plans_websiteId_month_key" ON "monthly_plans"("websiteId", "month");

-- CreateIndex
CREATE INDEX "monthly_autopilot_plans_userId_idx" ON "monthly_autopilot_plans"("userId");

-- CreateIndex
CREATE INDEX "monthly_autopilot_plans_websiteId_idx" ON "monthly_autopilot_plans"("websiteId");

-- CreateIndex
CREATE INDEX "monthly_autopilot_plans_organizationId_idx" ON "monthly_autopilot_plans"("organizationId");

-- CreateIndex
CREATE INDEX "monthly_autopilot_plans_month_idx" ON "monthly_autopilot_plans"("month");

-- CreateIndex
CREATE INDEX "monthly_autopilot_plans_status_idx" ON "monthly_autopilot_plans"("status");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_autopilot_plans_websiteId_month_key" ON "monthly_autopilot_plans"("websiteId", "month");

-- CreateIndex
CREATE INDEX "email_approvals_userId_idx" ON "email_approvals"("userId");

-- CreateIndex
CREATE INDEX "email_approvals_websiteId_idx" ON "email_approvals"("websiteId");

-- CreateIndex
CREATE INDEX "email_approvals_organizationId_idx" ON "email_approvals"("organizationId");

-- CreateIndex
CREATE INDEX "email_approvals_status_idx" ON "email_approvals"("status");

-- CreateIndex
CREATE INDEX "email_approvals_type_idx" ON "email_approvals"("type");

-- CreateIndex
CREATE INDEX "email_approvals_source_idx" ON "email_approvals"("source");

-- CreateIndex
CREATE INDEX "email_approvals_createdAt_idx" ON "email_approvals"("createdAt");

-- CreateIndex
CREATE INDEX "plan_items_monthlyPlanId_idx" ON "plan_items"("monthlyPlanId");

-- CreateIndex
CREATE INDEX "plan_items_type_idx" ON "plan_items"("type");

-- CreateIndex
CREATE INDEX "plan_items_status_idx" ON "plan_items"("status");

-- CreateIndex
CREATE INDEX "plan_items_scheduledFor_idx" ON "plan_items"("scheduledFor");

-- CreateIndex
CREATE INDEX "articles_websiteId_idx" ON "articles"("websiteId");

-- CreateIndex
CREATE INDEX "articles_organizationId_idx" ON "articles"("organizationId");

-- CreateIndex
CREATE INDEX "articles_monthlyPlanId_idx" ON "articles"("monthlyPlanId");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_language_idx" ON "articles"("language");

-- CreateIndex
CREATE INDEX "articles_targetKeyword_idx" ON "articles"("targetKeyword");

-- CreateIndex
CREATE INDEX "articles_publishedAt_idx" ON "articles"("publishedAt");

-- CreateIndex
CREATE INDEX "articles_deletedAt_idx" ON "articles"("deletedAt");

-- CreateIndex
CREATE INDEX "social_posts_websiteId_idx" ON "social_posts"("websiteId");

-- CreateIndex
CREATE INDEX "social_posts_organizationId_idx" ON "social_posts"("organizationId");

-- CreateIndex
CREATE INDEX "social_posts_userId_idx" ON "social_posts"("userId");

-- CreateIndex
CREATE INDEX "social_posts_articleId_idx" ON "social_posts"("articleId");

-- CreateIndex
CREATE INDEX "social_posts_platform_idx" ON "social_posts"("platform");

-- CreateIndex
CREATE INDEX "social_posts_status_idx" ON "social_posts"("status");

-- CreateIndex
CREATE INDEX "social_posts_source_idx" ON "social_posts"("source");

-- CreateIndex
CREATE INDEX "social_posts_scheduledFor_idx" ON "social_posts"("scheduledFor");

-- CreateIndex
CREATE INDEX "social_posts_createdAt_idx" ON "social_posts"("createdAt");

-- CreateIndex
CREATE INDEX "social_posts_deletedAt_idx" ON "social_posts"("deletedAt");

-- CreateIndex
CREATE INDEX "reports_websiteId_idx" ON "reports"("websiteId");

-- CreateIndex
CREATE INDEX "reports_organizationId_idx" ON "reports"("organizationId");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("type");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_periodStart_idx" ON "reports"("periodStart");

-- CreateIndex
CREATE INDEX "reports_periodEnd_idx" ON "reports"("periodEnd");

-- CreateIndex
CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");

-- CreateIndex
CREATE INDEX "integrations_websiteId_idx" ON "integrations"("websiteId");

-- CreateIndex
CREATE INDEX "integrations_organizationId_idx" ON "integrations"("organizationId");

-- CreateIndex
CREATE INDEX "integrations_provider_idx" ON "integrations"("provider");

-- CreateIndex
CREATE INDEX "integrations_status_idx" ON "integrations"("status");

-- CreateIndex
CREATE INDEX "integrations_lastSyncAt_idx" ON "integrations"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_websiteId_provider_key" ON "integrations"("websiteId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "google_integration_data_integrationId_key" ON "google_integration_data"("integrationId");

-- CreateIndex
CREATE INDEX "wordpress_connections_websiteId_idx" ON "wordpress_connections"("websiteId");

-- CreateIndex
CREATE INDEX "wordpress_connections_organizationId_idx" ON "wordpress_connections"("organizationId");

-- CreateIndex
CREATE INDEX "wordpress_connections_status_idx" ON "wordpress_connections"("status");

-- CreateIndex
CREATE INDEX "wordpress_connections_siteUrl_idx" ON "wordpress_connections"("siteUrl");

-- CreateIndex
CREATE UNIQUE INDEX "wordpress_connections_websiteId_siteUrl_key" ON "wordpress_connections"("websiteId", "siteUrl");

-- CreateIndex
CREATE INDEX "ai_jobs_websiteId_idx" ON "ai_jobs"("websiteId");

-- CreateIndex
CREATE INDEX "ai_jobs_organizationId_idx" ON "ai_jobs"("organizationId");

-- CreateIndex
CREATE INDEX "ai_jobs_userId_idx" ON "ai_jobs"("userId");

-- CreateIndex
CREATE INDEX "ai_jobs_type_idx" ON "ai_jobs"("type");

-- CreateIndex
CREATE INDEX "ai_jobs_status_idx" ON "ai_jobs"("status");

-- CreateIndex
CREATE INDEX "ai_jobs_createdAt_idx" ON "ai_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_jobs_nextRetryAt_idx" ON "ai_jobs"("nextRetryAt");

-- CreateIndex
CREATE INDEX "ai_usages_aiJobId_idx" ON "ai_usages"("aiJobId");

-- CreateIndex
CREATE INDEX "ai_usages_websiteId_idx" ON "ai_usages"("websiteId");

-- CreateIndex
CREATE INDEX "ai_usages_organizationId_idx" ON "ai_usages"("organizationId");

-- CreateIndex
CREATE INDEX "ai_usages_userId_idx" ON "ai_usages"("userId");

-- CreateIndex
CREATE INDEX "ai_usages_provider_idx" ON "ai_usages"("provider");

-- CreateIndex
CREATE INDEX "ai_usages_model_idx" ON "ai_usages"("model");

-- CreateIndex
CREATE INDEX "ai_usages_purpose_idx" ON "ai_usages"("purpose");

-- CreateIndex
CREATE INDEX "ai_usages_createdAt_idx" ON "ai_usages"("createdAt");

-- CreateIndex
CREATE INDEX "email_logs_organizationId_idx" ON "email_logs"("organizationId");

-- CreateIndex
CREATE INDEX "email_logs_websiteId_idx" ON "email_logs"("websiteId");

-- CreateIndex
CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");

-- CreateIndex
CREATE INDEX "email_logs_type_idx" ON "email_logs"("type");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_notes_adminUserId_idx" ON "admin_notes"("adminUserId");

-- CreateIndex
CREATE INDEX "admin_notes_targetUserId_idx" ON "admin_notes"("targetUserId");

-- CreateIndex
CREATE INDEX "admin_notes_organizationId_idx" ON "admin_notes"("organizationId");

-- CreateIndex
CREATE INDEX "admin_notes_websiteId_idx" ON "admin_notes"("websiteId");

-- CreateIndex
CREATE INDEX "admin_notes_createdAt_idx" ON "admin_notes"("createdAt");

-- CreateIndex
CREATE INDEX "admin_notes_deletedAt_idx" ON "admin_notes"("deletedAt");

-- CreateIndex
CREATE INDEX "error_logs_requestId_idx" ON "error_logs"("requestId");

-- CreateIndex
CREATE INDEX "error_logs_organizationId_idx" ON "error_logs"("organizationId");

-- CreateIndex
CREATE INDEX "error_logs_websiteId_idx" ON "error_logs"("websiteId");

-- CreateIndex
CREATE INDEX "error_logs_userId_idx" ON "error_logs"("userId");

-- CreateIndex
CREATE INDEX "error_logs_area_idx" ON "error_logs"("area");

-- CreateIndex
CREATE INDEX "error_logs_severity_idx" ON "error_logs"("severity");

-- CreateIndex
CREATE INDEX "error_logs_code_idx" ON "error_logs"("code");

-- CreateIndex
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");

-- CreateIndex
CREATE INDEX "error_logs_resolvedAt_idx" ON "error_logs"("resolvedAt");

-- CreateIndex
CREATE INDEX "timeline_events_userId_idx" ON "timeline_events"("userId");

-- CreateIndex
CREATE INDEX "timeline_events_websiteId_idx" ON "timeline_events"("websiteId");

-- CreateIndex
CREATE INDEX "timeline_events_type_idx" ON "timeline_events"("type");

-- CreateIndex
CREATE INDEX "timeline_events_source_idx" ON "timeline_events"("source");

-- CreateIndex
CREATE INDEX "timeline_events_isRead_idx" ON "timeline_events"("isRead");

-- CreateIndex
CREATE INDEX "timeline_events_createdAt_idx" ON "timeline_events"("createdAt");

-- CreateIndex
CREATE INDEX "timeline_events_websiteId_userId_createdAt_idx" ON "timeline_events"("websiteId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "website_user_states_websiteId_idx" ON "website_user_states"("websiteId");

-- CreateIndex
CREATE UNIQUE INDEX "website_user_states_userId_websiteId_key" ON "website_user_states"("userId", "websiteId");

-- CreateIndex
CREATE UNIQUE INDEX "audit_preview_tokens_token_key" ON "audit_preview_tokens"("token");

-- CreateIndex
CREATE INDEX "audit_preview_tokens_token_idx" ON "audit_preview_tokens"("token");

-- CreateIndex
CREATE INDEX "audit_preview_tokens_expiresAt_idx" ON "audit_preview_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_preview_tokens_usedAt_idx" ON "audit_preview_tokens"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_states_userId_key" ON "onboarding_states"("userId");

-- CreateIndex
CREATE INDEX "onboarding_states_websiteId_idx" ON "onboarding_states"("websiteId");

-- CreateIndex
CREATE INDEX "onboarding_states_status_idx" ON "onboarding_states"("status");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_billingUserId_fkey" FOREIGN KEY ("billingUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "websites" ADD CONSTRAINT "websites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_checks" ADD CONSTRAINT "audit_checks_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_checks" ADD CONSTRAINT "audit_checks_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_score_snapshots" ADD CONSTRAINT "growth_score_snapshots_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_score_snapshots" ADD CONSTRAINT "growth_score_snapshots_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_readiness_snapshots" ADD CONSTRAINT "ai_readiness_snapshots_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_readiness_snapshots" ADD CONSTRAINT "ai_readiness_snapshots_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_plans" ADD CONSTRAINT "monthly_plans_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_plans" ADD CONSTRAINT "monthly_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_autopilot_plans" ADD CONSTRAINT "monthly_autopilot_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_autopilot_plans" ADD CONSTRAINT "monthly_autopilot_plans_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_autopilot_plans" ADD CONSTRAINT "monthly_autopilot_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_approvals" ADD CONSTRAINT "email_approvals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_approvals" ADD CONSTRAINT "email_approvals_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_approvals" ADD CONSTRAINT "email_approvals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_monthlyPlanId_fkey" FOREIGN KEY ("monthlyPlanId") REFERENCES "monthly_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_linkedTaskId_fkey" FOREIGN KEY ("linkedTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_linkedArticleId_fkey" FOREIGN KEY ("linkedArticleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_linkedSocialPostId_fkey" FOREIGN KEY ("linkedSocialPostId") REFERENCES "social_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_monthlyPlanId_fkey" FOREIGN KEY ("monthlyPlanId") REFERENCES "monthly_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_generatedByAIJobId_fkey" FOREIGN KEY ("generatedByAIJobId") REFERENCES "ai_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_monthlyPlanId_fkey" FOREIGN KEY ("monthlyPlanId") REFERENCES "monthly_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_generatedByAIJobId_fkey" FOREIGN KEY ("generatedByAIJobId") REFERENCES "ai_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_integration_data" ADD CONSTRAINT "google_integration_data_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_connections" ADD CONSTRAINT "wordpress_connections_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_connections" ADD CONSTRAINT "wordpress_connections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "ai_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_user_states" ADD CONSTRAINT "website_user_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_user_states" ADD CONSTRAINT "website_user_states_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
