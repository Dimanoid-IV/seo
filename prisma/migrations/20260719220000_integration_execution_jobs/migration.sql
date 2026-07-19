-- CreateEnum
CREATE TYPE "IntegrationExecutionSourceType" AS ENUM (
  'ARTICLE',
  'TASK',
  'PREPARED_FIX',
  'AUTOPILOT_PLAN_ITEM',
  'MANUAL'
);

-- CreateEnum
CREATE TYPE "IntegrationExecutionAction" AS ENUM (
  'CREATE_DRAFT',
  'PUBLISH',
  'UPDATE_ARTICLE',
  'APPLY_SEO_FIX',
  'SEND_WEBHOOK',
  'PREPARE_PACKAGE',
  'ROLLBACK',
  'TEST_CONNECTION'
);

-- CreateEnum
CREATE TYPE "IntegrationExecutionProvider" AS ENUM (
  'WORDPRESS',
  'CUSTOM_WEBHOOK',
  'HOSTED_BLOG',
  'MANUAL',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "IntegrationExecutionMode" AS ENUM (
  'REVIEW_ONLY',
  'AUTO_DRAFT',
  'AUTO_PUBLISH'
);

-- CreateEnum
CREATE TYPE "IntegrationExecutionStatus" AS ENUM (
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'PARTIALLY_APPLIED',
  'WAITING',
  'RETRYING',
  'CANCELED'
);

-- CreateTable
CREATE TABLE "integration_execution_jobs" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "websiteId" UUID NOT NULL,
  "integrationId" UUID,
  "wordpressConnectionId" UUID,
  "requestedByUserId" UUID,
  "approvedByUserId" UUID,
  "sourceType" "IntegrationExecutionSourceType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "action" "IntegrationExecutionAction" NOT NULL,
  "provider" "IntegrationExecutionProvider" NOT NULL,
  "mode" "IntegrationExecutionMode" NOT NULL DEFAULT 'REVIEW_ONLY',
  "status" "IntegrationExecutionStatus" NOT NULL DEFAULT 'QUEUED',
  "idempotencyKey" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "requestPreviewJson" JSONB,
  "resultJson" JSONB,
  "externalId" TEXT,
  "externalUrl" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),

  CONSTRAINT "integration_execution_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_execution_events" (
  "id" UUID NOT NULL,
  "jobId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "status" "IntegrationExecutionStatus",
  "message" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "integration_execution_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_execution_jobs_idempotencyKey_key"
  ON "integration_execution_jobs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "integration_execution_jobs_organizationId_createdAt_idx"
  ON "integration_execution_jobs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "integration_execution_jobs_websiteId_createdAt_idx"
  ON "integration_execution_jobs"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "integration_execution_jobs_status_createdAt_idx"
  ON "integration_execution_jobs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "integration_execution_jobs_provider_action_idx"
  ON "integration_execution_jobs"("provider", "action");

-- CreateIndex
CREATE INDEX "integration_execution_jobs_sourceType_sourceId_idx"
  ON "integration_execution_jobs"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "integration_execution_events_jobId_createdAt_idx"
  ON "integration_execution_events"("jobId", "createdAt");

-- AddForeignKey
ALTER TABLE "integration_execution_jobs"
  ADD CONSTRAINT "integration_execution_jobs_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "integration_execution_jobs"
  ADD CONSTRAINT "integration_execution_jobs_websiteId_fkey"
  FOREIGN KEY ("websiteId") REFERENCES "websites"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "integration_execution_jobs"
  ADD CONSTRAINT "integration_execution_jobs_integrationId_fkey"
  FOREIGN KEY ("integrationId") REFERENCES "integrations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "integration_execution_jobs"
  ADD CONSTRAINT "integration_execution_jobs_wordpressConnectionId_fkey"
  FOREIGN KEY ("wordpressConnectionId") REFERENCES "wordpress_connections"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "integration_execution_jobs"
  ADD CONSTRAINT "integration_execution_jobs_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "integration_execution_jobs"
  ADD CONSTRAINT "integration_execution_jobs_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "integration_execution_events"
  ADD CONSTRAINT "integration_execution_events_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "integration_execution_jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
