-- Expand integration provider enums for the full publishing / analytics catalog.
-- Additive only: no existing rows or constraints are changed.

ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'CUSTOM_WEBHOOK';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'HOSTED_BLOG';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'WEBFLOW';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'SHOPIFY';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'WIX';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'SQUARESPACE';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GHOST';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GITHUB';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ZAPIER';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'MAKE';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'SITEMAP';

ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'WEBFLOW';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'SHOPIFY';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'WIX';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'SQUARESPACE';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'GHOST';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'GITHUB';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'ZAPIER';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'MAKE';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'SITEMAP';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'GOOGLE_SEARCH_CONSOLE';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'GOOGLE_ANALYTICS';
ALTER TYPE "IntegrationExecutionProvider" ADD VALUE IF NOT EXISTS 'GOOGLE_BUSINESS_PROFILE';
