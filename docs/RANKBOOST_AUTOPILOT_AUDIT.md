# RankBoost Autopilot Audit

Last updated: 2026-08-08

## Summary

RankBoost already has a substantial SaaS foundation: Next.js app/API routes, Prisma/Postgres, auth, Stripe billing, audit engine, task generation, Review Queue, monthly autopilot plans, GSC integration, WordPress publishing, custom webhook/export, Hermes article generation, quality gates, activity/timeline, admin funnel analytics, and production Vercel deployment.

The main product gap is not "no features". The gap is that the system is still uneven across the full loop:

`Detect -> Decide -> Execute -> Verify -> Measure -> Improve`

Some flows reach real execution, especially article publishing through WordPress. Many SEO fixes still stop at recommendation or prepared fix. Verification and metric impact are partial. The next work should extend existing execution jobs and adapters rather than create a parallel automation system.

## Feature Audit

| Feature | Current state | Problems | Required changes | Priority |
|---|---|---|---|---|
| Authentication / tenant isolation | Works through app auth helpers and organization ownership checks across main APIs. | Some older/admin routes require continued IDOR review. | Add regression tests for every execution route with wrong org/website IDs. | P0 |
| Stripe billing | Live Stripe is already configured and repeatedly stabilized. | Not related to autopilot execution. Must not be touched casually. | Preserve current env/webhook/price IDs. Add only usage-budget hooks where needed. | P0 guardrail |
| Audit engine | Real scanner/rules exist for technical/content/social/schema/performance checks. | Mostly page-level; does not yet create unified Opportunity records. | Feed audit results into a unified opportunity/action model. | P1 |
| Rule engine | Deterministic rules exist under `lib/audit/rules`. | Some outputs become manual tasks, not executable actions. | Map executable rule families to adapter capabilities. | P1 |
| Growth Score | Existing snapshots and dashboard display exist. | Formula is not yet fully documented by component: technical/content/search/authority/GEO/local/conversion. | Create deterministic score docs and expose breakdown. | P1 |
| Tasks | Real task model exists: OPEN/IN_PROGRESS/WAITING_REVIEW/COMPLETED/DISMISSED/FAILED. | Statuses are simpler than desired execution lifecycle; IN_PROGRESS may not always mean a running job. | Link task state to execution job state; avoid COMPLETED before verification. | P0 |
| Prepared fixes | Stored inside task `recommendationJson.preparedFix`; visible in Review Queue. | Good for preview, but not always executable. | Add capability-aware execution metadata: target URL/object, before/after, verification requirements. | P0 |
| Review Queue | Aggregates articles, social, email, task fixes. Supports approve/edit/reject/apply for custom webhook fixes. | Approving a task fix can mark it approved without applying to CMS unless the specific action path is used. | Separate "approve" from "approve and apply"; surface execution job status. | P0 |
| IntegrationExecutionJob/Event | Exists with idempotency, sanitized previews/results, events, retry fields. | Missing explicit verification status fields; verification stored only ad hoc in result/events. | Standardize verification payload and block SUCCESS for unverifiable live actions. | P0 |
| WordPress connector | Application Password connection, encryption, test, draft, live publish, rollback, pause/rollout controls exist. | Adapter does not yet support metadata update, existing page update, internal links, images, SEO plugin fields. Publish previously trusted API status too much. | Add metadata/update capabilities; verify public URL/object after execution. | P0/P1 |
| WordPress live publish | Real publish through REST exists, gated by plan AUTO_PUBLISH, quality, rollout, pause, kill switch. | Before this audit, success was based on WP returning `status=publish`, not public content verification. | Added publish verification; continue with rollback smoke after changes. | P0 |
| Custom webhook | Exists with SSRF protections, test-first, HMAC support, explicit send. | UX still too advanced for small-business users. | Add "copy-paste endpoint/snippet" simple setup and clearer publish button. | P1 |
| Hosted blog | Basic hosted article routes/sitemap exist. | Not a full custom-domain blog product with DNS/SSL/admin settings. | Architecture/MVP required separately. | P2 |
| GSC OAuth/property | Real OAuth and property selection/auto-match exists. | Strong aggregate insights exist, but query/page opportunity engine is shallow. | Use query/page rows for CTR, position 4-10/11-20, decline, mismatch, cannibalization. | P0/P1 |
| GSC task generation | Rule-based tasks exist from summary insights. | Tasks are broad ("Improve titles") rather than page/query-specific executable opportunities. | Generate actionable opportunities with page URL, query, metric window, proposed title/meta. | P0 |
| Article generation | Hermes pipeline, research brief, brand voice, humanizer, repair, quality score, quota accounting exist. | Needs more measured keyword/competitor evidence before autopublish; media/images not integrated. | Continue evidence-led SEO strategy; add source citations and page-map UI. | P1 |
| AI-assisted SEO strategy | Newly added `seoStrategy` snapshot in research briefs. | Not yet visible enough in UI; not yet connected to keyword provider/SERP API. | Show confidence/data gaps; integrate measured provider later. | P1 |
| Monthly Autopilot | Monthly plan, approval, REVIEW_ONLY/AUTO_PUBLISH choice, schedule, cron runner exist. | User still may not understand plan location; plan quality depends on source data. | Dashboard-first plan card, next actions, and GSC/CMS connection nudges. | P1 |
| Autopilot permissions | Website mode + plan publishing mode + pause/rollout exist. | No full permissions matrix for metadata/internal links/schema/technical fixes. | Add per-website automation policy with category/action allowlist. | P0 |
| Verification | Partial: WP rollback verifies status; publish now verifies URL/content; custom webhook requires applied=true. | No universal verification contract for all job types. | Standardize verification result in job events/resultJson. | P0 |
| Measurement / impact | GSC sync and timeline exist. | Execution jobs are not tied to before/after metric windows. | Add impact snapshots for GSC CTR/rank/page after data delay. | P1 |
| GEO / AI visibility | UI/cards and some AI visibility snapshot concepts exist. | Risk of fake metrics if not backed by measurable providers. | Feature-flag; label source/method; store tracked prompts only when measured. | P3 |
| Backlinks | Future concept only. | Must avoid link-farm promises. | Add intelligence/outreach suggestions only with real provider/user permission. | P5 |
| GA4 | Enum/provider exists, not a complete integration. | No real OAuth/data import. | Add official GA4 OAuth/data API later for business impact. | P4 |
| Shopify/Webflow/Wix | Not implemented. | UI must not imply real execution. | Adapter interface first, then official OAuth integrations. | P2 |
| Admin | Admin dashboard/funnel exists. | Execution observability needs stronger debugging view. | Add execution health/failed jobs/dead-letter style views. | P1 |
| Cron/jobs | Vercel cron routes exist for autopilot and probes. | Long operations still run in request/runtime constraints; no durable queue beyond DB job records. | Use DB job state/idempotency; consider Vercel cron pull-runner before external queue. | P0 |
| Cost control | Usage counters and AIJob exist. | AIJob cost/model tokens not consistently populated. | ModelRouter/AI budget later. | P3 |

## Current RankBoost

- Frontend/backend: Next.js app router with API routes.
- Database: Prisma/Postgres with production Neon.
- Billing: Stripe live flow already stable.
- Detection: audit rules, GSC sync/insights, growth opportunities.
- Decision: monthly autopilot plan, plan items, task capabilities, research briefs.
- Execution: IntegrationExecutionJob/Event foundation; WordPress article publish/rollback; custom webhook explicit send.
- Verification: partial and now improved for WordPress live publish; custom webhook requires `applied=true`.
- Measurement: GSC metrics and dashboard/timeline exist, but impact attribution is not complete.

## Critical Gaps

1. No single opportunity/action lifecycle covering all SEO fix types.
2. GSC opportunities are too broad and not page/query-specific enough.
3. WordPress adapter lacks metadata update, internal links, schema, existing page updates, media.
4. Autopilot permissions are not granular enough for metadata/link/schema/technical actions.
5. Verification is not universal and not tied to task success everywhere.
6. Metric impact is not attached to execution jobs after the GSC delay window.
7. Some UI surfaces can still feel like dashboards to study, not work being done.

## Architecture Direction

Use existing primitives:

- `Task` as user-facing work item.
- `recommendationJson.preparedFix` as preview/diff container.
- `MonthlyAutopilotPlan.planItemsJson` as plan schedule/approval container.
- `IntegrationExecutionJob/Event` as durable execution and observability record.
- WordPress/custom/hosted adapters as execution backends.

Do not create a parallel automation system. Add missing lifecycle and verification fields through normalized JSON first, then migrate to dedicated tables only when needed.

## Integration Status

- WordPress: real connection, draft, live publish, rollback. Needs metadata/update/internal-link/schema/media.
- GSC: real OAuth/property/sync. Needs page/query opportunity engine and impact windows.
- Stripe: production-stable; do not touch except cost-budget features.
- Hermes: real article/prepared-fix generation with health checks. Needs model routing/cost consistency later.
- Custom websites: webhook/export path exists, but UX must become much simpler.
- Shopify/Webflow/Wix/GA4/GBP/backlinks: not production execution features yet.

## P0 Plan

1. Standardize execution verification: external action is not `SUCCEEDED` until verification passes.
2. Add granular autopilot permissions/policy using existing website state/businessGoals or a safe model.
3. Add GSC page/query opportunity detector for high impressions + low CTR.
4. Prepare metadata fix with before/after title/meta and target URL.
5. Add WordPress metadata adapter capability with read/update/verify.
6. Wire Review Queue action: approve and apply metadata fix -> job -> verify -> task completed.
7. Add dashboard work feed: "RankBoost completed X verified actions".

