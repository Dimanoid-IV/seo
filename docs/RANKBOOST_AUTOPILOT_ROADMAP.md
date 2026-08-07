# RankBoost Autopilot Roadmap

Last updated: 2026-08-08

## Product Principle

RankBoost should feel like:

> I connected my site, and SEO started getting done.

The implementation principle is:

`Detect -> Decide -> Execute -> Verify -> Measure -> Improve`

No feature is complete unless UI, backend, persistence, real API execution, permissions, logs, verification, and error handling exist.

## P0 — Foundation

### P0.1 Execution Verification Contract

- Goal: prevent false success.
- Files: `lib/integrations/execution-*`, WordPress adapter runners.
- Data: store sanitized verification result in `IntegrationExecutionEvent.metadataJson` and `IntegrationExecutionJob.resultJson`.
- Acceptance: live actions can be `SUCCEEDED` only after verification.
- Risk: verification can fail for cache/CDN delays; use `PARTIALLY_APPLIED`, not fake success.

### P0.2 Autopilot Permissions Matrix

- Goal: plan/site-level permissions for content, metadata, internal links, schema, technical fixes.
- Data: start in website/user-state JSON for backward compatibility; migrate later if needed.
- UI: simple wizard with Review first / Automatic / Manual per category.
- Acceptance: dangerous actions disabled by default; executor checks permissions server-side.

### P0.3 GSC Page/Query Opportunity Engine

- Goal: create specific opportunities from real GSC data.
- Detect:
  - high impressions + low CTR;
  - position 4-10;
  - position 11-20;
  - declining pages/queries;
  - query/page mismatch.
- Output: task with target URL, query, metric window, before metrics, proposed action.
- Acceptance: no invented metrics; every value labeled measured or estimate.

### P0.4 Metadata Review -> Apply -> Verify E2E

- Goal: prove first non-article SEO automation.
- Flow:
  1. GSC finds low CTR page/query.
  2. RankBoost creates Task.
  3. RankBoost prepares title/meta diff.
  4. User approves.
  5. WordPress adapter updates metadata.
  6. RankBoost reads page/API and verifies changed value.
  7. Task becomes COMPLETED only after verification.
- Acceptance: idempotency prevents duplicate updates.

## P1 — Autopilot

- Expand executable actions: metadata, schema, FAQ, internal links, content updates.
- Add recurring scan/analyze/prioritize/execute/verify/measure loop.
- Dashboard: show work completed this week and next best action.
- Impact: attach GSC post-change windows to execution jobs.

## P2 — CMS Integrations

- WordPress production-grade:
  - read posts/pages;
  - update SEO metadata;
  - Yoast/Rank Math/AIOSEO support where possible;
  - internal links;
  - featured image/alt;
  - schema;
  - diagnostics.
- Shopify/Webflow/Wix:
  - official OAuth only;
  - capability-based UI;
  - no fake execute buttons.
- Custom:
  - simpler endpoint setup;
  - SDK/snippet exploration;
  - no arbitrary code executor.

## P3 — Intelligence

- Keyword discovery/clustering with evidence labels.
- Competitor gap and page map.
- Priority engine:
  - impact;
  - confidence;
  - effort;
  - risk;
  - expected value.
- Content calendar by expected impact.

## P4 — GEO

- Honest AI visibility tracking only where technically/legally measurable.
- llms.txt, schema, entity, citation, comparison content tasks.
- Historical tracked prompt results with clear method/source labels.

## P5 — Expansion

- Backlink intelligence without link-farm automation.
- Local SEO / GBP.
- Lead optimization opt-in.
- Agency reporting and white label.

## First E2E Milestone

The first real milestone should be:

`GSC low CTR -> metadata task -> review approval -> WordPress metadata update -> verification -> task completed -> later GSC impact measurement`

Article publishing is already close; the metadata flow proves RankBoost is not only a content generator.

