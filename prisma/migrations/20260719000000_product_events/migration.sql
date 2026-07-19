-- CreateTable
CREATE TABLE "product_events" (
    "id" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "userId" UUID,
    "organizationId" UUID,
    "websiteId" UUID,
    "route" TEXT,
    "locale" TEXT,
    "propertiesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_events_event_createdAt_idx" ON "product_events"("event", "createdAt");

-- CreateIndex
CREATE INDEX "product_events_createdAt_idx" ON "product_events"("createdAt");

-- CreateIndex
CREATE INDEX "product_events_organizationId_createdAt_idx" ON "product_events"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "product_events_websiteId_createdAt_idx" ON "product_events"("websiteId", "createdAt");
