CREATE TABLE "api_rate_limit_buckets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID,
  "scope" TEXT NOT NULL,
  "subjectHash" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "api_rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_rate_limit_buckets_scope_subjectHash_windowStart_key"
  ON "api_rate_limit_buckets"("scope", "subjectHash", "windowStart");
CREATE INDEX "api_rate_limit_buckets_expiresAt_idx" ON "api_rate_limit_buckets"("expiresAt");
ALTER TABLE "api_rate_limit_buckets" ADD CONSTRAINT "api_rate_limit_buckets_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
