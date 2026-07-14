-- CreateEnum
CREATE TYPE "AssistedSetupIntegrationType" AS ENUM ('GOOGLE_SEARCH_CONSOLE');

-- CreateEnum
CREATE TYPE "AssistedSetupIssueType" AS ENUM ('NO_PROPERTY_FOUND', 'NO_ACCESS', 'NOT_VERIFIED', 'NOT_SURE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssistedSetupRequestStatus" AS ENUM ('PENDING', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "assisted_setup_requests" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "websiteId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "integrationType" "AssistedSetupIntegrationType" NOT NULL DEFAULT 'GOOGLE_SEARCH_CONSOLE',
    "issueType" "AssistedSetupIssueType" NOT NULL,
    "comment" TEXT,
    "consentGiven" BOOLEAN NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'RU',
    "sourcePage" TEXT,
    "status" "AssistedSetupRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assisted_setup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assisted_setup_requests_email_idx" ON "assisted_setup_requests"("email");

-- CreateIndex
CREATE INDEX "assisted_setup_requests_status_idx" ON "assisted_setup_requests"("status");

-- CreateIndex
CREATE INDEX "assisted_setup_requests_integrationType_idx" ON "assisted_setup_requests"("integrationType");

-- CreateIndex
CREATE INDEX "assisted_setup_requests_createdAt_idx" ON "assisted_setup_requests"("createdAt");

-- AddForeignKey
ALTER TABLE "assisted_setup_requests" ADD CONSTRAINT "assisted_setup_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assisted_setup_requests" ADD CONSTRAINT "assisted_setup_requests_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
