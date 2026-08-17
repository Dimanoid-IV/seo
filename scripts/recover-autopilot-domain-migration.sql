-- Recovery for the production migration that stopped after creating the new
-- domain tables but before adding the final organization foreign keys.
-- Every statement is additive and idempotent.

ALTER TABLE "page_metrics" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
ALTER TABLE "action_impacts" ADD COLUMN IF NOT EXISTS "organizationId" UUID;

DO $repair$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_metrics_organizationId_fkey') THEN
    ALTER TABLE "page_metrics" ADD CONSTRAINT "page_metrics_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_impacts_organizationId_fkey') THEN
    ALTER TABLE "action_impacts" ADD CONSTRAINT "action_impacts_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'authority_opportunities_organizationId_fkey') THEN
    ALTER TABLE "authority_opportunities" ADD CONSTRAINT "authority_opportunities_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backlink_prospects_organizationId_fkey') THEN
    ALTER TABLE "backlink_prospects" ADD CONSTRAINT "backlink_prospects_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outreach_campaigns_organizationId_fkey') THEN
    ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mentions_organizationId_fkey') THEN
    ALTER TABLE "mentions" ADD CONSTRAINT "mentions_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$repair$;
