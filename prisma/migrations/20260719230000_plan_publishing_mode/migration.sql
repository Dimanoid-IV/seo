-- CreateEnum
CREATE TYPE "PlanPublishingMode" AS ENUM ('REVIEW_ONLY', 'AUTO_PUBLISH');

-- AlterTable
ALTER TABLE "monthly_autopilot_plans"
  ADD COLUMN "publishingMode" "PlanPublishingMode" NOT NULL DEFAULT 'REVIEW_ONLY';
