# First Customer Live Autopilot — Operational Checklist

> **Prompt 11.55** — Scoped live Autopilot for one real WordPress customer.  
> **Do not** clear `LIVE_PUBLISH_KILL_SWITCH` globally.  
> **Do not** publish to any customer site until explicit owner approval for that website ID.  
> **Do not** touch Stripe/Hermes secrets. **Do not** run broad cron for this rollout.

**Production:** https://www.rankboost.eu  
**Related:** `lib/integrations/live-publish-rollout.ts`, `lib/integrations/adapters/wordpress/can-live-publish.ts`

---

## A. Readiness audit (what must be true)

| Control | Where | Expected |
|---------|--------|----------|
| Global kill switch | Vercel `LIVE_PUBLISH_KILL_SWITCH` | Engaged (unset or `engaged`). Not cleared for all customers. |
| Scoped allowlist | `LIVE_PUBLISH_ALLOWED_WEBSITE_IDS` and/or `Website.livePublishRolloutEnabled` | Only the chosen website ID |
| Per-website pause | `Website.autopilotLivePublishPaused` + UI Pause | Pause overrides allowlist |
| Rollback | Article “Move back to draft” / Integrations history | Available for RankBoost-published posts (draft/private, never delete) |
| Execution history | `IntegrationExecutionJob` | PUBLISH / ROLLBACK jobs visible |
| WordPress health | Integrations → WordPress CONNECTED + credentials | Required before enable |
| Article quality gate | `qualityPassed` + `qualityScore >= LIVE_PUBLISH_MIN_QUALITY_SCORE` (default 70) | Required |
| Monthly plan | Status `APPROVED`, mode `AUTO_PUBLISH` | Required |
| Autopilot mode | `AUTOPUBLISH` | Required |
| Duplicate protection | Gate blocks existing `wordpressPostId` / duplicate external ID | On |
| Quota | Feature `wordpress` + `ARTICLE_DRAFT` usage limit | Must allow |
| Activity / Timeline | On successful live publish | `supportNotify` + `firstCustomerRollout` in metadata |
| Review fallback | Plan `REVIEW_ONLY` or Autopilot not AUTOPUBLISH | Live publish blocked; Review Queue still works |
| Scope limits | Max 1/day, max 1 first-rollout article, ARTICLE only, no SEO_FIX | Enforced in gate |

---

## B. First-customer enablement policy

- **One website only** (env allowlist UUID and/or DB flag).
- **Max 1 live publish / UTC day** (`LIVE_PUBLISH_MAX_PER_DAY`, default 1).
- **Max 1 first-rollout article total** (`LIVE_PUBLISH_FIRST_ROLLOUT_MAX_ARTICLES`, default 1).
- **WordPress only** — no other CMS live publish.
- **New ARTICLE only** — no SEO_FIX, no TASK_FIX, no existing page updates.
- **qualityScore ≥ threshold** (default 70).
- **Rollback available** after publish.
- **Pause button** visible in Autopilot status block.
- **Support notification** via Activity + Timeline (`supportNotify: true`).

Allowlisted sites **bypass** the global kill switch without enabling all customers.  
Non-allowlisted sites stay blocked even if the kill switch is cleared, unless `LIVE_PUBLISH_OPEN_TO_ALL=true` (tests only — never on production).

---

## C. How to select the first customer

1. Prefer a cooperative WordPress site with a durable Application Password and low content risk.
2. Confirm the customer understands: no ranking/traffic/revenue guarantee; publish is operational assist only.
3. Confirm they accept Pause + Rollback as the emergency path.
4. Record the **website UUID** from the DB / app (not the public domain alone).
5. Explicit owner written approval for **that website ID** before any enablement or publish.

**Do not** use popart.ee (`ab7c514d-0e09-41fc-b0da-845479c6c382`) unless separately and explicitly approved.

---

## D. How to verify WordPress connection

1. Open **Integrations → WordPress** for that website.
2. Status must be **CONNECTED**; credentials present; no `disconnectedAt`.
3. Prefer a dry health/test call already used by the connector (no live publish).
4. Confirm Autopilot UI shows WordPress health as connected.

---

## E. How to approve monthly plan AUTO_PUBLISH

1. Generate/open the monthly Autopilot plan for the website.
2. Approve only the ARTICLE item(s) intended for the first rollout (ideally one).
3. Choose publishing mode **AUTO_PUBLISH** (not Review before publish).
4. Set Autopilot mode to **Autopublish** via the explicit plan confirmation path (never silent toggle).
5. Confirm quality gate passed and score ≥ threshold on the article.

---

## F. How to enable scoped live publish

**Preferred (DB):**

```sql
UPDATE websites
SET "livePublishRolloutEnabled" = true
WHERE id = '<website-uuid>' AND "deletedAt" IS NULL;
```

**And/or (Vercel env — scoped, not global kill-switch clear):**

1. Set `LIVE_PUBLISH_ALLOWED_WEBSITE_IDS=<website-uuid>` on the production project.
2. Leave `LIVE_PUBLISH_KILL_SWITCH` engaged / unset.
3. Do **not** set `LIVE_PUBLISH_OPEN_TO_ALL`.
4. Redeploy or wait for env propagation.
5. Optional: `LIVE_PUBLISH_MIN_QUALITY_SCORE=70`, `LIVE_PUBLISH_MAX_PER_DAY=1`, `LIVE_PUBLISH_FIRST_ROLLOUT_MAX_ARTICLES=1`.

Apply migration first if needed:

```bash
npx prisma migrate deploy
```

Migration: `20260720010000_live_publish_rollout_flag`.

---

## G. How to monitor the job

1. Autopilot → next live publish date / due items.
2. Integrations → execution history for `WORDPRESS` / `PUBLISH`.
3. Activity + Timeline for “WordPress live publish” / published URL.
4. Article record: `wordpressPublishedUrl`, `wordpressPostId`, status `PUBLISHED`.

---

## H. How to rollback

1. Open the published article → **Move back to draft** (or Integrations history rollback).
2. Confirm WordPress post becomes draft/private (never deleted).
3. Confirm Activity/Timeline rollback event and `wordpressRolledBackAt`.

---

## I. How to pause

1. Autopilot status block → **Pause live publish**.
2. Confirm banner: live publish paused; research/drafts/review continue.
3. Gate reason for due items: `website_paused` (overrides allowlist).

---

## J. How to disable scoped live publish

1. Pause the website (immediate).
2. Clear DB flag:

```sql
UPDATE websites
SET "livePublishRolloutEnabled" = false
WHERE id = '<website-uuid>';
```

3. Remove the UUID from `LIVE_PUBLISH_ALLOWED_WEBSITE_IDS` (or clear the env var).
4. Keep global `LIVE_PUBLISH_KILL_SWITCH` engaged.
5. Optionally set plan publishing mode back to **REVIEW_ONLY**.

---

## K. Manual steps before first real publish (owner gate)

1. Complete sections C–F for **one** website only.
2. Owner explicitly approves publish for that website ID.
3. Confirm Pause + Rollback UI visible.
4. Confirm only one approved ARTICLE is due.
5. Then either wait for scheduled Autopilot due run **or** run due for that website only (never broad cron for all customers).
6. Watch Activity/Timeline + WP post URL; be ready to Pause/Rollback.

Until step 2, **no customer publish**.
