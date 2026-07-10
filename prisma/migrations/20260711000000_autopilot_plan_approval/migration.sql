-- CreateEnum
CREATE TYPE "AutopilotMode" AS ENUM ('OFF', 'REVIEW_FIRST', 'APPROVED_PLAN_AUTOPILOT', 'AUTOPUBLISH');

-- AlterTable
ALTER TABLE "website_user_states" ADD COLUMN "autopilotMode" "AutopilotMode" NOT NULL DEFAULT 'REVIEW_FIRST';

-- AlterTable
ALTER TABLE "monthly_autopilot_plans" ADD COLUMN "planItemsJson" JSONB;
