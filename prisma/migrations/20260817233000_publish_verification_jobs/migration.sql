ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'RESEARCHING';
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'GENERATING';
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'REVIEWING';
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'PUBLISHING';
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'MONITORING';
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'IMPROVING';

ALTER TABLE "integration_execution_jobs"
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "verificationJson" JSONB;

CREATE INDEX "integration_execution_jobs_status_nextAttemptAt_idx"
  ON "integration_execution_jobs"("status", "nextAttemptAt");

CREATE TABLE "publish_attempts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jobId" UUID NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "phase" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "statusCode" INTEGER,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "verificationJson" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),

  CONSTRAINT "publish_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "publish_attempts_jobId_attemptNumber_phase_key"
  ON "publish_attempts"("jobId", "attemptNumber", "phase");

CREATE INDEX "publish_attempts_jobId_startedAt_idx"
  ON "publish_attempts"("jobId", "startedAt");

CREATE INDEX "publish_attempts_outcome_startedAt_idx"
  ON "publish_attempts"("outcome", "startedAt");

ALTER TABLE "publish_attempts"
  ADD CONSTRAINT "publish_attempts_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "integration_execution_jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
