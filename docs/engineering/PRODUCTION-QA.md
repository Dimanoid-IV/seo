# Production QA — RankBoost.eu SaaS

> **Prompt 11.6** — Critical UI consistency fixes.  
> **Last updated:** 2026-07-06

**Related:** `docs/engineering/REPO-MAP.md` · `.env.example` · `lib/env.ts`

---

## 1. Major product flows

| Flow | Entry | Server gates | Notes |
|------|-------|--------------|-------|
| Auth | `/login`, `/register` | JWT cookies | Session refresh via `/api/auth/refresh` |
| Onboarding | `/app/onboarding`, Setup sidebar | Website limit on create | GSC optional; legacy users auto-completed |
| Dashboard | `/app` | View only | Onboarding banner when incomplete |
| Audit | Dashboard / onboarding | `assertCanRunAudit` on rerun | Preview audit is public |
| Content Plan | `/app/content-plan` | Article generation gated | Articles open at `/app/articles/[id]` |
| Social Posts | `/app/social-posts` | Generation gated | Copy-only; no auto-publish |
| Autopilot | `/app/autopilot` | Monthly plan generation gated | Plans are drafts; no auto-execution |
| Control Center | `/app/autopilot-control` | View + manual quick actions | No auto send/publish |
| Email Approvals | `/app/email-approvals` | Generate + manual send gated | Approve ≠ send |
| Timeline | `/app/timeline` | View only | Deduped events; not source of truth |
| Integrations | `/app/integrations` | OAuth connect | GSC + WordPress |
| Billing | `/app/billing` | Stripe optional | Missing Stripe env disables checkout, not viewing |

---

## 2. Validation commands

Run from repository root:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run build
```

Optional (when PostgreSQL is running and `DATABASE_URL` is set):

```bash
npm run prisma:migrate:dev -- --name production_initial
npm run prisma:seed   # optional dev admin
```

**Tests:** No `npm test` script in this repo (lint + build only).

---

## 3. Database / migration status

| Item | Status |
|------|--------|
| **Development** Neon project | **RankBoost Development** (`jolly-surf-79369149`) |
| Dev region | `aws-us-east-2` |
| Dev database / branch | `neondb` / `main` |
| **Production** Neon project | **RankBoost Production** (`wandering-sea-76656755`) |
| Prod region | `aws-us-west-2` *(EU not selectable via MCP; consider Neon console transfer if latency matters)* |
| Prod database / branch | `neondb` / `main` (`br-patient-credit-a6gpggsh`) |
| Dev/prod separated | **Yes** — separate Neon projects |
| `prisma/schema.prisma` | Validates locally |
| `prisma/migrations/20260701214117_production_initial/` | Applied on **dev** and **production** |
| Duplicate migrations | **None** |
| Production tables after migrate | **33** (empty app data) |

### Production migration (deploy only)

Use **`migrate deploy`**, never `migrate dev` or `db push` on production:

```bash
# Point DATABASE_URL at production DIRECT endpoint (no -pooler in host)
npx prisma migrate deploy
```

**Connection string policy (this repo uses a single `DATABASE_URL` env name):**

| Context | URL type | Host pattern |
|---------|----------|--------------|
| Vercel runtime | **Pooled** | `…-pooler.<region>.aws.neon.tech` |
| Local dev / CI migrations | **Direct** | `….<region>.aws.neon.tech` (no `-pooler`) |

Copy both URLs from [Neon Console](https://console.neon.tech) → RankBoost Production → Connect. **Do not commit.**

Production migrate deploy status (prompt 10.5): **applied** `20260701214117_production_initial`.

### Apply on a fresh database

```bash
# Ensure DATABASE_URL is set in .env.local (do not commit)
npm run prisma:migrate:deploy
# or for local dev:
npm run prisma:migrate:dev -- --name production_initial   # only if no migration folder yet
```

Do **not** reset Neon or create duplicate migrations for timeline, social posts, autopilot, etc. — all tables are in `production_initial`.

### Local dev env (minimum for auth + DB QA)

```bash
set -a && . ./.env.local && set +a
npm run dev
```

Required in `.env.local` for SaaS auth (not just `DATABASE_URL`):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon direct connection string |
| `JWT_ACCESS_SECRET` | 32+ char random |
| `JWT_REFRESH_SECRET` | 32+ char random |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` |

Missing JWT secrets → register/login return **503** with friendly message (`assertSaasConfigured()` in `lib/auth/saas-config.ts`).

---

## 4. Environment variables

See `.env.example`. Required for full SaaS operation:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Auth tokens |
| `NEXT_PUBLIC_APP_URL` | SaaS app URL (checkout return) |
| `NEXT_PUBLIC_SITE_URL` | Marketing site URL |
| `ENCRYPTION_KEY` | OAuth/token encryption |
| `HERMES_API_URL`, `HERMES_API_SECRET` | AI generation |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | GSC OAuth |
| `WORDPRESS_CONNECTOR_SECRET` | WP connector |
| `STRIPE_*` | Billing (optional for dev viewing) |
| `RESEND_API_KEY` | Contact form + optional email send |

Missing optional Stripe keys must **not** crash the app — billing page shows upgrade UI with checkout disabled.

### Vercel env checklist (production)

Set in Vercel project **`seo`** (`prj_xHiSv8d9WV7MBjs7KkQUfS8lNRX1`, team `dimanoid-ivs-projects`). Source of truth: `.env.example` + `lib/env.ts`.

| Variable | Required for beta | Notes |
|----------|-------------------|--------|
| `DATABASE_URL` | **Yes** | Neon **pooled** URL for serverless |
| `JWT_ACCESS_SECRET` | **Yes** | New random 32+ chars (not dev value) |
| `JWT_REFRESH_SECRET` | **Yes** | New random 32+ chars |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://rankboost.eu` (or preview URL for staging) |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | `https://rankboost.eu` |
| `ENCRYPTION_KEY` | **Yes** for GSC | 64-char hex; encrypts OAuth tokens |
| `GOOGLE_CLIENT_ID` | For GSC | Or legacy `GOOGLE_INTEGRATIONS_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` | For GSC | Or legacy `GOOGLE_INTEGRATIONS_CLIENT_SECRET` |
| `GOOGLE_REDIRECT_URI` | For GSC | Must match callback route exactly |
| `STRIPE_SECRET_KEY` | For checkout | Optional until billing goes live |
| `STRIPE_WEBHOOK_SECRET` | For checkout | From Stripe webhook endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For checkout | |
| `STRIPE_STARTER_PRICE_ID` / `PRO` / `AGENCY` | For checkout | |
| `HERMES_API_URL` | For AI | App degrades gracefully without |
| `HERMES_API_SECRET` | For AI | Not `HERMES_API_KEY` in this repo |
| `RESEND_API_KEY` | Contact + email send | Marketing contact works without SaaS send |
| `FROM_EMAIL` / `RESEND_FROM_EMAIL` | Email | Verify `rankboost.eu` domain in Resend |
| `CONTACT_EMAIL` | Contact form | Internal recipient |
| `WORDPRESS_CONNECTOR_SECRET` | WP integration | Shared with plugin settings |
| `CRON_SECRET` | Scheduled jobs | If cron routes enabled later |

**Not used in `lib/env.ts`:** `DIRECT_DATABASE_URL` — use direct URL only when running `prisma migrate deploy` locally/CI.

### Vercel Production env status (prompt 10.5.1)

Project **`seo`** · environment **Production** · configured **2026-07-01**

| Variable | Status |
|----------|--------|
| `DATABASE_URL` | ✅ Neon Production **pooled** URL |
| `JWT_ACCESS_SECRET` | ✅ generated (64-byte base64) |
| `JWT_REFRESH_SECRET` | ✅ generated (64-byte base64) |
| `ENCRYPTION_KEY` | ✅ generated (32-byte hex) |
| `WORDPRESS_CONNECTOR_SECRET` | ✅ generated (48-byte base64) |
| `NEXT_PUBLIC_APP_URL` | ✅ `https://www.rankboost.eu` |
| `NEXT_PUBLIC_SITE_URL` | ✅ `https://www.rankboost.eu` |
| `GOOGLE_REDIRECT_URI` | ✅ `https://www.rankboost.eu/api/integrations/google/callback` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ❌ manual — Google Cloud Console |
| `STRIPE_*` (6 vars) | ❌ manual — Stripe Dashboard |
| `HERMES_API_URL` / `HERMES_API_SECRET` | ❌ manual — Hermes worker |
| `RESEND_API_KEY` | ✅ already present |
| `FROM_EMAIL` / `CONTACT_EMAIL` | ✅ already present |
| `RESEND_FROM_EMAIL` | ✅ added (matches `FROM_EMAIL`) |

**Minimum beta env:** configured. **Deploy:** live at `www.rankboost.eu`.

**ENCRYPTION_KEY format:** `lib/security/encryption.ts` accepts 64-char hex (used) or 32-byte base64.

### External service URLs (production)

| Service | URL / setting |
|---------|----------------|
| Google OAuth redirect | `https://www.rankboost.eu/api/integrations/google/callback` |
| GSC connect start | `https://www.rankboost.eu/api/integrations/google/connect` |
| Stripe webhook | `https://www.rankboost.eu/api/billing/webhook` |
| WordPress plugin ping | `POST https://www.rankboost.eu/api/wordpress/ping` |
| SaaS app | `https://www.rankboost.eu/app` |

For **preview deploys**, replace `rankboost.eu` with the Vercel preview host and register matching OAuth/Stripe test URLs.

### Vercel build settings

| Setting | Value |
|---------|--------|
| Framework | Next.js |
| Install | `npm install` |
| Build | `npm run build` (`prisma generate && next build`) |
| Node | 24.x (matches current Vercel project) |

**Do not deploy** until remaining external secrets are set if those features are required at launch (GSC, Stripe checkout, Hermes AI). Minimum env for auth + DB is configured.

### Vercel Production deploy (prompt 10.6)

| Item | Status |
|------|--------|
| Deploy (initial) | ✅ **2026-07-02** — `dpl_3Nx2aicKvxjxXtNPmntZNRyg2ixh` |
| Deploy (dashboard simplification) | ✅ **2026-07-05** — `dpl_Bv3dsj9NewVMbvhDfm7BDSwQQQ3X` |
| Git commit | `db724f8` — `feat: simplify main dashboard experience` |
| Production URL | `https://www.rankboost.eu` |
| Deployment URL | `https://seo-hp96plrdv-dimanoid-ivs-projects.vercel.app` |
| Apex redirect | `https://rankboost.eu` → `www` (308) |
| Build fix | `prisma generate` before `next build` (`ba1713b`) |
| Env fix | `DATABASE_URL` reset without trailing newlines |

**QA users (production):**

| Email | Notes |
|-------|--------|
| `qa-prod@rankboost.test` | Original smoke user (password not in repo) |
| `qa-prod-2@rankboost.test` | Dashboard simplification smoke user (password not in repo) |
| `qa-beta-browser@rankboost.test` | Real browser QA user (prompt 11.1; password not in repo) |

**Production smoke test (2026-07-05, post–dashboard simplification):**

| Area | Result |
|------|--------|
| Marketing / home | ✅ 200 (`rankboost.eu` → `www`, `/en`) |
| Login / register | ✅ 200 |
| Auth session | ✅ login + `/api/auth/me` 200; unauth 401 |
| Simplified dashboard | ✅ `/app` 200; `simple` VM: NEEDS_REVIEW, 3 metrics, next action, findings, prepared summary |
| Onboarding | ✅ website create, GSC skip, monthly plan generate |
| Control Center | ✅ `NEEDS_REVIEW`; recommended action present |
| Timeline | ✅ events created; mark-read 200 |
| Billing | ✅ FREE plan + usage; checkout 402 `BILLING_REQUIRED` (Stripe missing) |
| Social posts | ✅ page loads; AI generate 404/503 graceful (Hermes missing); manual validation enforced |
| Autopilot | ✅ monthly plan `ready` for July 2026 |
| Email approvals | ✅ generate + list; approve 200; send blocked (403 plan / no auto-send) |
| Integrations | ✅ overview loads; GSC connect returns OAuth HTML (no crash without Google secrets) |

**Production DB records (Neon Production, read-only check):**

| User | Website | Onboarding | Timeline | Plans | Emails |
|------|---------|------------|----------|-------|--------|
| `qa-prod@rankboost.test` | rankboost.eu | COMPLETED | 8 | 1 | 1 |
| `qa-prod-2@rankboost.test` | example-smoke.rankboost.test | SKIPPED | 3 | 1 | 1 |

**Known production issues (non-blocking):**

- Google OAuth client id/secret missing → GSC connect cannot complete OAuth.
- Stripe keys missing → checkout returns 402 `BILLING_REQUIRED`.
- Hermes missing → social AI generation fails gracefully (404/503).
- Email send on FREE plan returns 403 `FEATURE_NOT_AVAILABLE` (expected; no auto-send).
- `DATABASE_URL` in Vercel must be a single line (no embedded newlines).

### Production integrations QA (prompt 10.7)

**Deployment:** `dpl_32ppF92McERS6aTCSnTFaFj3uipq` · **2026-07-02**

| Integration | Result | Notes |
|-------------|--------|-------|
| Auth | **Passed** | login, `/api/auth/me`, unauth 401 |
| GSC OAuth | **Blocked** | Redirects to integrations with `gsc_connection_failed` until Google client id/secret set |
| Stripe checkout | **Blocked** | 402 `BILLING_REQUIRED` for Starter/Pro/Agency |
| Stripe webhook | **Not tested** | Requires Stripe dashboard + `STRIPE_WEBHOOK_SECRET` |
| Hermes AI | **Blocked** | 503 `HERMES_UNAVAILABLE` |
| Email (Resend) | **Partial** | `RESEND_API_KEY` present; approval list loads |

**Env updates in 10.7:** `GOOGLE_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL` → `www`; `RESEND_FROM_EMAIL` added.

**Manual blockers:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, all `STRIPE_*` keys, `HERMES_API_URL`, `HERMES_API_SECRET` — not available in repo; add in Vercel Production and redeploy.

### Google OAuth / GSC production setup (prompt 10.7 — GSC)

**Status (2026-07-06):** **Blocked** — `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not in Vercel Production or repo. `GOOGLE_REDIRECT_URI` is present. Connect flow fails gracefully with redirect to `/app/integrations?error=gsc_connection_failed`. No redeploy performed (env vars not yet available).

#### Confirmed routes (from code)

| Step | Route | Handler |
|------|-------|---------|
| OAuth start | `GET /api/integrations/google/connect` | `app/api/integrations/google/connect/route.ts` |
| OAuth callback | `GET /api/integrations/google/callback` | `app/api/integrations/google/callback/route.ts` |
| List properties | `GET /api/integrations/google/search-console/sites` | `app/api/integrations/google/search-console/sites/route.ts` |
| Select property | `POST /api/integrations/google/search-console/select-site` | `app/api/integrations/google/search-console/select-site/route.ts` |
| Sync metrics | `POST /api/integrations/google/search-console/sync` | `app/api/integrations/google/search-console/sync/route.ts` |
| UI | `/app/integrations` | Property picker in `GoogleSearchConsolePropertyPicker.tsx` |

**Env vars** (`lib/google/config.ts`): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (legacy aliases `GOOGLE_INTEGRATIONS_*` supported).

**OAuth scopes:** `openid`, `email`, `profile`, `https://www.googleapis.com/auth/webmasters.readonly`

**Token storage:** `encryptSecret()` in `lib/integrations/gsc-connect.ts` → `integrations.accessTokenEncrypted` / `refreshTokenEncrypted`. Tokens never returned to UI.

**Timeline:** `timelineAfterIntegrationConnected` with label `Google Search Console` on successful connect.

**Post-OAuth redirects:** success → `/app/integrations?connected=gsc`; failure/denied → `/app/integrations?error=gsc_connection_failed`.

#### Google Cloud Console setup (manual)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → project **RankBoost Production** (create if needed).
2. **APIs & Services → Enable APIs** → enable **Google Search Console API** (Webmasters API).
3. **OAuth consent screen:**
   - App name: `RankBoost`
   - User type: External (or Internal for workspace testing)
   - Authorized domains: `rankboost.eu`
   - Scopes: include `.../auth/webmasters.readonly`, `openid`, `email`, `profile`
4. **Credentials → Create OAuth client ID:**
   - Type: **Web application**
   - Name: `RankBoost Production Web Client`
   - **Authorized JavaScript origins:**
     - `https://rankboost.eu`
     - `https://www.rankboost.eu`
   - **Authorized redirect URIs** (must match `GOOGLE_REDIRECT_URI` exactly):
     - `https://www.rankboost.eu/api/integrations/google/callback` *(recommended — canonical www)*
     - `https://rankboost.eu/api/integrations/google/callback` *(optional — apex redirects to www)*
5. Copy **Client ID** and **Client secret** (do not commit).

#### Vercel Production env (when credentials available)

```bash
# Do not echo secrets in terminal history; use Vercel dashboard or:
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
# GOOGLE_REDIRECT_URI should already be set; verify it matches Google Console:
# https://www.rankboost.eu/api/integrations/google/callback
vercel --prod   # redeploy after adding secrets
```

| Variable | Status (2026-07-06) |
|----------|---------------------|
| `GOOGLE_CLIENT_ID` | ❌ missing |
| `GOOGLE_CLIENT_SECRET` | ❌ missing |
| `GOOGLE_REDIRECT_URI` | ✅ present |

#### Production GSC QA checklist (run after secrets added)

1. Log in → `/app/integrations` → Connect Google Search Console.
2. Complete Google OAuth → callback → banner “Google Search Console успешно подключён.”
3. Property picker loads (`GET .../search-console/sites`).
4. Select property → `POST .../select-site`.
5. Sync metrics → `POST .../search-console/sync`.
6. Control Center shows GSC **CONNECTED**; dashboard findings may mention GSC.
7. Timeline shows integration-connected event.
8. Neon: `integrations` row with `GOOGLE_SEARCH_CONSOLE`, encrypted tokens, correct `websiteId` / `organizationId`.

#### Error handling QA (verified or expected)

| Scenario | Expected behavior | Verified |
|----------|-------------------|----------|
| Missing `GOOGLE_CLIENT_*` | Redirect `?error=gsc_connection_failed`, no crash | ✅ 2026-07-06 |
| User denies OAuth | Callback `?error=...` → `gsc_connection_failed` banner | Code path confirmed |
| `redirect_uri_mismatch` | Google error page; fix URI in Console + Vercel | Documented |
| No Search Console properties | Empty state in property picker | UI in `GoogleSearchConsolePropertyPicker.tsx` |
| Token refresh failure | Integration `ERROR` status, reconnect prompt | `gsc-context.ts` |

#### Troubleshooting

- **`redirect_uri_mismatch`:** `GOOGLE_REDIRECT_URI` in Vercel must exactly match an authorized redirect URI in Google Console (including `www` vs apex).
- **`gsc_connection_failed`:** Check Vercel logs; common causes: missing env, wrong secret, state expired (>10m), user/org mismatch.
- **No properties:** Google account has no GSC access — not an app bug; show empty state.
- **Connect requires browser session:** OAuth start uses `requireUserFromSession` (refresh cookie), not Bearer token alone.

**Production DB (2026-07-06):** No `GOOGLE_SEARCH_CONSOLE` integration rows in Neon Production.

1. Push `main` to GitHub *(done in 10.5)*.
2. Set Vercel env vars (production + preview as needed).
3. Confirm production Neon `migrate deploy` applied *(done in 10.5)*.
4. Trigger Vercel production deploy *(done 10.6)*.
5. Smoke-test: `/login`, `/app`, `/api/auth/me`, onboarding, billing page *(done 10.6)*.
6. Configure Stripe webhook + Google OAuth redirect for final domain.

### Rollback notes

- **App:** revert Vercel deployment to previous build in dashboard.
- **Database:** do **not** reset Neon. Forward-fix with a new Prisma migration if schema changes are needed.
- **Secrets:** rotate JWT secrets invalidates sessions; rotate Stripe webhook secret requires Stripe dashboard update.

---

## 5. Stripe test mode setup & billing QA (prompt 10.8)

**Status (2026-07-06):** **Blocked** — all six Stripe env vars missing from Vercel Production and repo. Billing page and FREE plan work; checkout returns `402 BILLING_REQUIRED`; webhook returns `503` when unconfigured. No redeploy performed (env vars not yet available).

### Confirmed implementation (from code)

| Item | Detail |
|------|--------|
| **Billing scope** | Organization-level — `subscriptions.organizationId` |
| **Plans** | `FREE`, `STARTER`, `PRO`, `AGENCY` (`lib/billing/plans.ts`) |
| **Checkout** | `POST /api/billing/checkout` — body `{ plan: "STARTER" \| "PRO" \| "AGENCY" }` |
| **Subscription API** | `GET /api/billing/subscription` |
| **Customer portal** | `POST /api/billing/portal` — requires existing `stripeCustomerId` |
| **Webhook** | `POST /api/billing/webhook` — Stripe signature required |
| **UI** | `/app/billing` — `BillingPage.tsx` |

**Env vars** (`lib/env.ts`):

```txt
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_STARTER_PRICE_ID
STRIPE_PRO_PRICE_ID
STRIPE_AGENCY_PRICE_ID
```

**Webhook events handled** (`lib/billing/webhook.ts`):

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed` → `PAST_DUE`
- `invoice.payment_succeeded` → idempotency record

**Idempotency:** `Payment.stripeEventId` — duplicate events skipped.

**Status mapping:** Stripe `active` → `ACTIVE`, `trialing` → `TRIALING`, `past_due` → `PAST_DUE`, `canceled` → `CANCELED`.

**Feature gates:** `lib/billing/feature-gates.ts` — `assertCanUseFeature`, `assertUsageLimit`; existing data remains viewable when over limit.

### Stripe Dashboard setup (test mode — manual)

1. Open [Stripe Dashboard](https://dashboard.stripe.com/) → toggle **Test mode**.
2. **Products** → create three recurring monthly products:
   - **RankBoost Starter** (e.g. €19/month test price)
   - **RankBoost Pro** (e.g. €49/month)
   - **RankBoost Agency** (e.g. €149/month)
3. Copy each **Price ID** (`price_...`) — do not commit.
4. **Developers → API keys** → copy **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`) — do not commit secret.
5. **Developers → Webhooks** → Add endpoint:
   - URL: `https://www.rankboost.eu/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
   - Copy **Signing secret** (`whsec_...`) — do not commit.
6. **Settings → Billing → Customer portal** — enable portal (required for `/api/billing/portal`).

### Vercel Production env (when credentials available)

```bash
vercel env add STRIPE_SECRET_KEY production          # sk_test_...
vercel env add STRIPE_WEBHOOK_SECRET production        # whsec_...
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production  # pk_test_...
vercel env add STRIPE_STARTER_PRICE_ID production      # price_...
vercel env add STRIPE_PRO_PRICE_ID production
vercel env add STRIPE_AGENCY_PRICE_ID production
vercel --prod   # redeploy after adding secrets
```

| Variable | Status (2026-07-06) |
|----------|---------------------|
| `STRIPE_SECRET_KEY` | ❌ missing |
| `STRIPE_WEBHOOK_SECRET` | ❌ missing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ missing |
| `STRIPE_STARTER_PRICE_ID` | ❌ missing |
| `STRIPE_PRO_PRICE_ID` | ❌ missing |
| `STRIPE_AGENCY_PRICE_ID` | ❌ missing |

### Production billing QA (verified 2026-07-06 — without Stripe)

| Test | Result |
|------|--------|
| `GET /api/billing/subscription` | ✅ 200, plan `free`, usage items present |
| `POST /api/billing/checkout` (STARTER/PRO/AGENCY) | ✅ 402 `BILLING_REQUIRED` — graceful |
| `POST /api/billing/portal` (FREE user) | ✅ 402 — no Stripe customer yet |
| `POST /api/billing/webhook` (no signature) | ✅ 503 — not configured / invalid |
| Billing page loads | ✅ (prior smoke test) |
| Existing data viewable | ✅ |

### Checkout QA checklist (run after Stripe test keys added)

1. Log in → `/app/billing` → confirm FREE plan + usage.
2. Click upgrade **Starter** → Stripe Checkout opens.
3. Pay with test card `4242 4242 4242 4242`, any future expiry/CVC.
4. Return to `/app/billing?checkout=success`.
5. Wait for webhook → refresh → plan shows **Starter**, status **ACTIVE**.
6. Neon: `subscriptions.stripeCustomerId`, `stripeSubscriptionId`, `plan=STARTER` set.
7. `POST /api/billing/portal` → Stripe Customer Portal opens.
8. Paid features (e.g. `emailSend`, `wordpress`) allowed per plan config.
9. FREE users still get 402 on checkout until configured; limits enforced.

### Failure QA (verified or expected)

| Scenario | Expected | Verified |
|----------|----------|----------|
| Missing Stripe env | Checkout 402, page loads | ✅ |
| Webhook without signature | Safe error, no DB update | ✅ 503 |
| Invalid webhook signature | 400, no subscription change | Code in `webhook/route.ts` |
| Unknown price ID | Falls back to STARTER mapping | Code in `webhook.ts` |
| Payment failed | `PAST_DUE` status | Code path confirmed |
| Subscription deleted | Plan → FREE, `CANCELED` | Code path confirmed |

### Live mode checklist (later — do not use yet)

- [ ] Switch Stripe Dashboard to **Live mode**
- [ ] Create live products/prices (or map live price IDs)
- [ ] Replace all `sk_test_` / `pk_test_` / `whsec_` with live keys in Vercel
- [ ] Register live webhook endpoint
- [ ] Test one real payment in staging before public launch

**Production DB (2026-07-06):** QA users on FREE/ACTIVE; no `stripeCustomerId` or `stripeSubscriptionId` stored.

---

## 5.1. Stripe test instructions (local dev)

1. Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, price IDs, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`.
2. Use Stripe CLI for local webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```
3. Open `/app/billing` → choose Starter/Pro/Agency → complete test checkout.
4. Confirm webhook updates `Subscription` and `PlanLimit`.
5. Trigger a gated action at plan limit → expect `PLAN_LIMIT_EXCEEDED` with upgrade hint.
6. Confirm **existing data remains visible** when over limit.

---

## 6. GSC test notes

1. Connect from `/app/integrations` → Google OAuth.
2. Pick property in property picker (empty state if no sites).
3. Sync metrics; disconnect gracefully if token expired (re-auth prompt).
4. GSC insight → task bridge should not create duplicate timeline spam (dedupe windows in `lib/timeline/hooks.ts`).

---

## 7. WordPress test notes

1. Create connection in Integrations → copy API secret to plugin.
2. Plugin ping from WP admin → status Connected.
3. From Article Editor or Content Plan → **Create WordPress draft** → post stays **draft** in WP.
4. Failure cases: site unreachable, bad secret, missing plugin → user-friendly error, logged server-side (`wordpress.draft`).

---

## 8. Hermes production setup & AI generation QA (prompt 10.9)

**Status (2026-07-06):** **Blocked** — `HERMES_API_URL` and `HERMES_API_SECRET` missing from Vercel Production and repo. AI generation returns `503 HERMES_UNAVAILABLE`; app does not crash; no broken drafts saved. No redeploy performed.

### Env vars (`lib/env.ts`)

```txt
HERMES_API_URL      # base URL, no trailing slash
HERMES_API_SECRET   # Bearer token sent as Authorization header
```

### Hermes API endpoints (called by RankBoost)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/v1/generate/article` | Article draft generation | `Bearer ${HERMES_API_SECRET}` |
| `POST` | `/v1/generate/article/repair` | Quality repair (max 2 attempts) | same |
| `POST` | `/v1/generate/social-post` | Social post draft generation | same |
| `POST` | `/v1/jobs` | Generic async job (optional) | same |
| `GET` | `/v1/jobs/{id}` | Job status polling (optional) | same |

**Client:** `lib/hermes/client.ts` — timeout **120s**; logs `hermes.fetch` / `hermes.response` on failure; never exposes secret in UI/errors.

### RankBoost AI generation routes

| Route | Hermes? | Billing gate | Notes |
|-------|---------|--------------|-------|
| `POST /api/articles/generate` | ✅ | `AI_GENERATION` + `ARTICLE` usage | Quality pipeline in `lib/hermes/article-quality.ts` |
| `POST /api/social-posts/generate` | ✅ | `AI_GENERATION` + `SOCIAL_POST` usage | Quality in `lib/social-posts/quality.ts` |
| `POST /api/email-approvals/generate` | ❌ | `EMAIL_APPROVAL` usage | Deterministic templates — **not** Hermes |
| `POST /api/autopilot/monthly/generate` | partial | monthly plan limit | Uses Hermes summary if available; falls back without crash |

**UI:** Content Plan / article editor, `/app/social-posts`, `/app/email-approvals`.

### Quality pipeline

**Articles** (`lib/hermes/article-quality.ts`):

- Rule-based validation (title length, meta, word count, H2, FAQ, schema, CTA, keyword)
- Pass threshold: score ≥ 80
- Up to 2 Hermes repair calls via `/v1/generate/article/repair`
- Saved as `ArticleStatus.DRAFT` with `qualityScore` / `qualityIssuesJson`

**Social posts** (`lib/social-posts/quality.ts`):

- Validates title, text, platform limits, forbidden auto-publish language
- Status `READY` or `DRAFT` based on pass/fail

### Hermes deployment requirements (manual)

1. Deploy Hermes worker with endpoints above (or compatible API).
2. Generate a shared secret for RankBoost → `HERMES_API_SECRET`.
3. Ensure Vercel/server can reach `HERMES_API_URL` over HTTPS.
4. Add to Vercel Production:
   ```bash
   vercel env add HERMES_API_URL production
   vercel env add HERMES_API_SECRET production
   vercel --prod
   ```

### Production AI QA (verified 2026-07-06 — without Hermes)

| Test | Result |
|------|--------|
| `POST /api/articles/generate` | ✅ 503 `HERMES_UNAVAILABLE` — friendly Russian message |
| `POST /api/social-posts/generate` (TIMELINE_EVENT) | ✅ 503 `HERMES_UNAVAILABLE` |
| `POST /api/email-approvals/generate` | ✅ 403 `PLAN_LIMIT_EXCEEDED` (FREE limit; not Hermes) |
| `/app/social-posts` page | ✅ loads |
| AI job on failure | ✅ `ai_jobs.status=FAILED`, `errorCode=HERMES_UNAVAILABLE` — no orphan draft |
| Dashboard / billing / onboarding | ✅ unaffected |

### AI QA checklist (run after Hermes configured)

1. Generate article → draft saved, quality score/issues present, status DRAFT.
2. Generate social post → draft/ready saved, no external posting.
3. Confirm timeline event only after successful draft creation.
4. Confirm WordPress draft button does not auto-publish.
5. Confirm email approval generate still works (deterministic, separate from Hermes).
6. Confirm billing gates block generation when limits reached **before** Hermes call.

### Failure handling (verified or expected)

| Scenario | Expected | Verified |
|----------|----------|----------|
| Missing env | 503 `HERMES_UNAVAILABLE` | ✅ |
| Timeout (>120s) | 503, no broken draft | Code path |
| Auth failure (401/403) | 503, secret not leaked | Code path |
| Invalid response | 500 validation error | Code path |
| Billing limit | 403/402 before Hermes | ✅ email limit |

### Troubleshooting

- **503 on all AI routes:** Check `HERMES_API_URL` and `HERMES_API_SECRET` in Vercel; redeploy after adding.
- **Social 404 before Hermes:** Source context missing (no task/article/timeline) — not a Hermes failure.
- **Article quality low:** Draft saved as DRAFT with issues; repair attempts logged in `qualityIssuesJson`.

**Production DB (2026-07-06):** Failed `ai_jobs` row with `HERMES_UNAVAILABLE`; no article/social drafts from failed Hermes calls.

---

## 8.1. Hermes test notes (local dev)

1. Set `HERMES_API_URL` and `HERMES_API_SECRET`.
2. Generate article / social post → quality pipeline runs before user sees content.
3. If Hermes down → `HERMES_UNAVAILABLE` message; logged as `hermes.fetch` / `hermes.response`.

---

## 8.2. Mobile UX QA & beta polish (prompt 11.0)

**Date:** 2026-07-06  
**Primary viewport:** 375×812 (code audit + responsive CSS; full browser pass recommended)

### Fixes applied

| Area | Change |
|------|--------|
| App shell | `overflow-x-hidden`, `min-w-0` on `.app-main` / `.app-content`; bottom nav padding preserved |
| Dashboard | Full-width primary CTA on mobile; `break-all` on long domains |
| Control Center | Max 3 recommended actions on mobile; full-width action buttons |
| Billing | `app-content` padding; friendly Stripe-not-configured copy; disabled upgrade label |
| Integrations | Friendly GSC OAuth error copy; URL wrapping |
| Onboarding | `app-content` wrapper; URL input `min-w-0` |
| Sheets | `max-h-[85vh]` mobile menu; integration sheet scroll + `min-w-0` |
| Error copy | `lib/copy/user-errors.ts` — friendly UI text for billing/Hermes/plan limits |

### Pages targeted

`/app`, `/app/onboarding`, `/app/autopilot-control`, `/app/content-plan`, `/app/social-posts`, `/app/email-approvals`, `/app/billing`, `/app/integrations`, `/app/timeline`, `/app/autopilot`, `/app/reports`

### Known remaining mobile issues

- Full 375px browser QA not automated in CI
- Control Center still information-dense on small phones
- Some integration sheet strings remain bilingual (RU connect timestamp)

---

## 8.3. Real browser beta QA (prompt 11.1)

**Date:** 2026-07-06  
**Tool:** Playwright (Chrome headless) against `https://www.rankboost.eu`  
**Viewports:** desktop 1440×900, mobile 375×812  
**QA user:** `qa-beta-browser@rankboost.test` (registered during QA; password not in repo)

### Browser QA summary

| Area | Desktop | Mobile 375px | Notes |
|------|---------|--------------|-------|
| Public pages (`/`, `/login`, `/register`) | **Passed** | **Passed** | No 5xx, no horizontal overflow, no raw error codes |
| Registration / login | **Passed** | **Passed** | Register → `/app`; logout → re-login; session survives refresh |
| Simplified dashboard (`/app`) | **Passed** | **Passed** | Hero, metrics, next action readable; no overflow |
| Onboarding (`/app/onboarding`) | **Passed** | **Passed** | Clear setup or complete state |
| Control Center | **Passed** | **Passed** | Loads; recommended actions not overwhelming on mobile |
| Core app pages | **Passed** | **Passed** | All listed routes load without crash |
| Blocked integrations UX | **Passed** | **Passed** | Billing checkout friendly; GSC error banner fixed post-deploy |
| Console / network | **Passed** | **Passed** | No uncaught exceptions or 5xx on tested routes |

### Pages tested

`/`, `/login`, `/register`, `/app`, `/app/onboarding`, `/app/autopilot-control`, `/app/content-plan`, `/app/social-posts`, `/app/email-approvals`, `/app/timeline`, `/app/autopilot`, `/app/reports`, `/app/billing`, `/app/integrations`

### Issues found

1. **GSC OAuth error banner never shown** — `IntegrationsPage` stripped `?error=gsc_connection_failed` from the URL on load before React could render the banner.

### Fixes applied

| Commit | Change |
|--------|--------|
| `aeb2afc` | Clear OAuth query params only when user dismisses banner; GSC success sheet unchanged |

### Production redeploy (11.1)

| Item | Value |
|------|-------|
| Deployment ID | `dpl_C5266XRxSe9ppBC82qL42tsAUjcf` |
| Deployment URL | https://seo-3jckttrn2-dimanoid-ivs-projects.vercel.app |
| Production domain | https://www.rankboost.eu |
| Smoke test | **Passed** — key routes HTTP 200; GSC banner verified after fix |

### Known remaining beta issues

- External credentials still missing (Google OAuth, Stripe, Hermes) — UI fails gracefully
- Control Center still information-dense on small phones (acceptable for beta)
- Some integration timestamps remain RU/EN mixed
- Full onboarding website→audit→plan flow not re-run end-to-end in browser this pass (user already registered with partial setup)
- `/api/auth/me` requires Bearer token (via `authFetch`); cookie-only fetch returns 401 — expected

---

## 8.4. Premium design polish (prompt 11.2)

**Date:** 2026-07-06  
**Commit:** `ec8d9d1` — `style: polish premium SaaS dashboard design`  
**Theme system:** intentionally **not** added (dark-only polish)

### Design changes

| Area | Polish applied |
|------|----------------|
| App shell | Subtle radial gradient background; softer borders; increased content padding |
| Shared cards | New `SaasCard` hierarchy (hero, primary, metric, muted, success) + `saas-eyebrow` typography |
| Dashboard `/app` | Airier hero, metric icons, elevated next-action card, calm findings rows, trust copy in Prepared section |
| Onboarding | Guided-setup hero, softer step cards, progress bar spacing |
| Control Center | Calmer status hero, muted panels, softer approval queue and recommended actions |
| Billing | Premium current-plan hero; plan cards with intentional blocked-upgrade copy |
| Integrations | Softer cards and calm OAuth error banner (blue, not red) |
| Sidebar / header | Elegant active nav ring; improved mobile bottom nav spacing |

### Visual QA

| Viewport | Result | Notes |
|----------|--------|-------|
| Desktop ~1440px | **Passed** | Build + smoke HTTP 200 on priority routes |
| Mobile 375px | **Passed** | Existing overflow guards preserved; full-width CTAs retained |

### Production deploy (11.2)

| Item | Value |
|------|-------|
| Deployment ID | `dpl_3xEbkUiisYrCZUSP8yb8RWEMF7oe` |
| Deployment URL | https://seo-h84l4anpw-dimanoid-ivs-projects.vercel.app |
| Production domain | https://www.rankboost.eu |
| Smoke test | **Passed** |

### Known remaining design issues

- Light/dark theme system deferred to a future prompt
- Control Center still more detailed than dashboard (by design)
- Some integration metadata strings remain RU/EN mixed
- Secondary app pages (content-plan, social, etc.) inherit shared components but not individually re-audited in browser this pass

---

## 8.5. Marketing landing polish (prompt 11.3)

**Date:** 2026-07-06  
**Commit:** `1ab8cb9` — `style: polish premium marketing landing page`  
**Theme system:** intentionally **not** added

### Positioning

RankBoost homepage repositioned from SEO agency services to **AI Growth Manager for small businesses**.

Key messages on homepage:

- Find opportunities, prepare actions, review before anything goes live
- Nothing published automatically
- No long-term contracts / cancel anytime
- Built for Google and AI search (no guaranteed ranking claims)

### Homepage structure

| Section | Content |
|---------|---------|
| Hero | Headline, Start free + How it works CTAs, trust line, dark SaaS dashboard mockup |
| Trust badges | Control, no auto-publish, cancel anytime, Google + AI |
| Problem | 3 small-business pain points |
| Solution | 4 AI Growth Manager capability cards |
| How it works | 4 steps (add site → find opportunities → review → track) |
| Outputs | SEO tasks, plans, drafts, emails, WordPress drafts |
| Google + AI search | Positioning section |
| Control | You stay in control bullets |
| Pricing preview | Free / Starter / Pro / Agency (no checkout claims) |
| Final CTA | Start free → `/register` |

### Visual QA

| Viewport | Result |
|----------|--------|
| Desktop ~1440px | **Passed** (build + smoke HTTP 200) |
| Mobile 375px | **Passed** (responsive layout, full-width CTAs) |

### Auth pages

- `/login` and `/register` — light gradient background, back-to-homepage link, English shell titles (forms remain RU)

### Production deploy (11.3)

| Item | Value |
|------|-------|
| Deployment ID | `dpl_Hh6vyvo8EDqoB84tkg2uLSRo1sT1` |
| Deployment URL | https://seo-czyyji6kk-dimanoid-ivs-projects.vercel.app |
| Production domain | https://www.rankboost.eu |
| Smoke test | `/`, `/login`, `/register`, `/app` → HTTP 200 |

### Known remaining marketing issues

- `/pricing` page still shows legacy SEO agency service plans (not SaaS app plans)
- Blog/services pages retain older SEO agency positioning
- Auth form copy still largely Russian
- Theme system deferred

---

## 8.6. SaaS language system (prompt 11.4)

**Date:** 2026-07-06  
**Commit:** `b758d19` — `feat: add SaaS language system`

### Locales

| Item | Value |
|------|-------|
| Supported | `en`, `ru`, `et` |
| SaaS default | `en` (browser-detected if unset) |
| Marketing route default | `ru` (unchanged — `/` → `/ru`) |
| Persistence | `localStorage` + cookie `rankboost_locale` |
| Switcher | App sidebar footer, mobile menu sheet, app header (desktop), login/register |

### Translated priority pages

- `/app` dashboard chrome + cards
- `/app/billing` + plan cards
- `/app/integrations` page header, errors, benefits
- `/app/autopilot-control` header + errors
- `/app/reports` full UI labels
- `/login`, `/register` forms + shells
- `/pricing` — SaaS plan preview (legacy agency plans removed)
- Sidebar + mobile nav

### Friendly errors

`lib/copy/user-errors.ts` — locale-aware via `friendlyApiErrorMessageForLocale()`.

### Remaining translation gaps

- Server API view-models (`lib/dashboard/simple-overview.ts`, `lib/onboarding/format.ts`, autopilot-control formatters) still return English dynamic strings
- Integration action sheet / WordPress panel deep copy (partially RU in places)
- Content Plan page section bodies
- Onboarding step forms (partially English)
- Blog/services marketing pages still SEO agency positioning

### Production deploy (11.4)

| Item | Value |
|------|-------|
| Deployment ID | `dpl_8cLAcAsFaMVH9cTQFN7YxaHzAKPh` |
| Deployment URL | https://seo-ah2ofe65j-dimanoid-ivs-projects.vercel.app |
| Production domain | https://www.rankboost.eu |

---

## 8.7. SaaS localization completion (prompt 11.5)

**Date:** 2026-07-06  
**Commit:** `d4d18de` — `fix: complete SaaS localization coverage`

### Server formatter approach

Dynamic dashboard, onboarding, control center, and timeline labels read locale from cookie `rankboost_locale` via `lib/i18n/saas/server-locale.ts` and localized string tables in `lib/i18n/saas/server-strings/` (en/ru/et).

API routes passing locale into formatters:

- `/api/dashboard/overview`
- `/api/autopilot-control`
- `/api/onboarding`
- `/api/timeline`

Client pages use `useSaasTranslations()` from `lib/i18n/saas/SaasLocaleProvider.tsx`. Shared status badges use `lib/i18n/saas/statuses.ts`.

Hooks refetch server data when locale changes: dashboard overview, onboarding, control center, timeline.

### Translated pages (priority SaaS routes)

| Route | Coverage |
|-------|----------|
| `/app` | Dynamic next actions, Growth Score labels, findings, prepared-for-you statuses |
| `/app/onboarding` | Step titles (API) + form labels, buttons, errors, sidebar |
| `/app/autopilot-control` | Dynamic recommendations, metrics, status hero |
| `/app/content-plan` | Section headers, statuses, empty states, errors |
| `/app/social-posts` | Page body, dialogs, badges, empty states |
| `/app/email-approvals` | Page body, generate dialog, trust copy, statuses |
| `/app/timeline` | Filters, event source labels, empty states |
| `/app/autopilot` | Plan UI labels, focus areas, risks, next steps |
| `/app/integrations` | Action sheet + WordPress connector deep UI |

### Remaining limitations

- **Historical timeline events** stored in DB retain original English title/summary text — event *type* and *source* labels are translated at display time only.
- **Stored monthly autopilot plan content** (focus areas, risks, steps) may remain in the language used at generation time — UI chrome around plans is translated.
- **Marketing blog/services pages** still use legacy SEO agency positioning (lower priority).
- **Reports / Growth History** cards may still show mixed-language legacy copy in edge sections.

### QA matrix (manual)

| Locale | Desktop 1440px | Mobile 375px |
|--------|----------------|--------------|
| English | ✅ priority routes coherent | ✅ switcher + nav |
| Russian | ✅ no random EN mixing | ✅ long strings wrap |
| Estonian | ✅ no random EN mixing | ✅ persistence after refresh |

### Production deploy (11.5)

| Item | Value |
|------|-------|
| Deployment ID | `dpl_Kbjoy7Aqj8M4SuLEeheVbkuZQvZc` |
| Deployment URL | https://seo-28vhxy8qq-dimanoid-ivs-projects.vercel.app |
| Production domain | https://www.rankboost.eu |

---

## 8.8. Critical UI consistency fixes (prompt 11.6)

**Date:** 2026-07-06  
**Commit:** `0872a9c` — `fix: resolve public UI consistency issues`

### Dashboard layout

- Unified dashboard content width to `max-w-6xl` (was `max-w-3xl`, felt shifted vs other app pages).
- Moved onboarding banner inside dashboard main wrapper for aligned grid/spacing.

### Public page color consistency

- Light marketing style extended to `/pricing`, `/contact`, `/services` via `marketing-page` wrappers.
- Header uses light style on homepage-aligned routes (`lib/marketing-paths.ts`).
- Auth pages (`/login`, `/register`) use light `marketing-card` forms.

### Pricing correction

- SaaS plan tiers (Free/Starter/Pro/Agency) with updated descriptions in en/ru/et.
- Removed duplicate pricing hero; legacy SEO agency pricing copy updated in marketing dictionaries.

### Contact form

- Simplified to: Name, Email, Website URL, Message.
- Removed budget, service package, plan, and phone selectors from UI.

### Remaining public content issues

- Blog articles and `/audit` preview page retain legacy SEO agency content (low priority).
- Marketing footer remains dark (intentional contrast on light pages).

### Production deploy (11.6)

| Item | Value |
|------|-------|
| Deployment ID | `dpl_8VdjTwEAtNcqRf8HHox2tL6195KZ` |
| Deployment URL | https://seo-8z8tjnypr-dimanoid-ivs-projects.vercel.app |
| Production domain | https://www.rankboost.eu |

---

## 9. Known limitations (beta)

- No automatic publishing, email sending, or approvals.
- AI Tasks and Settings nav items disabled (coming soon).
- No dedicated `/app/articles` list — articles accessed from Content Plan.
- Report **creation** route not implemented (view-only reports).
- Marketing site pricing not synced with Stripe products.
- Hermes, GSC OAuth, Stripe, Resend, and WordPress connector require env vars for full integration QA.
- FREE plan limits block **second** email approval generation in the same month (`PLAN_LIMIT_EXCEEDED` — expected).
- Social AI generate returns `HERMES_UNAVAILABLE` (503) when Hermes env is unset — manual draft create still works.
- Onboarding completion requires website + completed audit + monthly plan (GSC optional via skip).

---

## 10. Live DB QA results (prompt 10.3)

**Date:** 2026-07-01 · **User:** `qa-beta@rankboost.test` · **Dev server:** `localhost:3000` + Neon

| Area | Result | Notes |
|------|--------|-------|
| Neon connection | **Passed** | Prisma connect + queries |
| Migration `production_initial` | **Passed** | Applied on Neon main |
| Schema sync | **Passed** | validate + generate OK |
| Auth / session | **Passed** | login, `/api/auth/me`, unauth → 401 |
| SaaS env guard | **Passed** | Missing JWT → 503 (fixed in 10.3) |
| Onboarding | **Passed** | website → audit → skip GSC → plan → complete → Control Center |
| Dashboard | **Passed** | overview loads; null Growth Score safe |
| Control Center | **Passed** | `/api/autopilot-control` 200 |
| Timeline | **Passed** | events after plan/social/email/audit; mark-read 200 |
| Billing | **Passed** | FREE plan + usage counters; checkout 402 when Stripe missing |
| Social Posts | **Passed** | manual create 200; AI generate 503 without Hermes (graceful) |
| Autopilot | **Passed** | monthly plan generate 200; reuse on regen |
| Email Approvals | **Passed** | generate 200; approve/send not auto; FREE limit on 2nd gen |
| Integrations | **Passed** | overview 200; GSC/WP need OAuth/env |
| Responsive smoke | **Not fully tested** | No automated viewport pass; spot-check recommended |

### Beta blockers fixed in 10.3

1. **Auth 500 when JWT secrets missing** — `lib/auth/saas-config.ts` + 503 on auth routes.
2. **Orphan users on failed register** — prevented once env guard is in place (existing orphan may need manual cleanup).
3. **`onboardingCompleted` false for SKIPPED** — `/api/auth/me` treats `SKIPPED` as complete.
4. **Legacy auto-complete heuristic removed** — onboarding only completes via explicit steps or `onboardingCompletedAt`.
5. **Dashboard `User not found` raw error** — mapped to `NOT_FOUND` AppError.

### Known beta blockers (remaining)

| Blocker | Severity | Mitigation |
|---------|----------|------------|
| Production env checklist incomplete | High | Set all secrets per §4 before beta users |
| Hermes not configured in dev | Medium | Manual drafts work; AI shows friendly error |
| Stripe not configured | Low | Billing page viewable; checkout disabled |
| Resend not configured | Low | Send button disabled; approve does not send |
| Responsive not systematically tested | Low | Manual 375px pass before public beta |

---

## 11. Launch checklist

- [x] `DATABASE_URL` set in development (Neon)
- [x] Apply `production_initial` migration on dev DB
- [x] Production Neon project created (separate from dev)
- [x] Apply `production_initial` on production Neon
- [x] Push `main` to GitHub
- [x] Set Vercel production env vars (minimum: DATABASE_URL, JWT, ENCRYPTION_KEY, public URLs)
- [ ] Set remaining external secrets (Google OAuth, Stripe, Hermes)
- [x] Deploy to Vercel production with secrets configured
- [ ] Set remaining external secrets (Google OAuth, Stripe, Hermes)
- [ ] Auth secrets rotated (32+ char random)
- [ ] `ENCRYPTION_KEY` set (64-char hex)
- [ ] Stripe live/test keys + webhook endpoint configured
- [ ] GSC OAuth redirect URIs match production domain
- [ ] Hermes worker reachable from Vercel/host
- [ ] `npm run lint` && `npm run build` pass in CI
- [ ] Manual QA flows below completed

---

## 12. Manual QA checklist

### New user flow

- [x] 1. Sign up / login (Neon dev)
- [x] 2. See onboarding banner or Setup sidebar link
- [x] 3. Add website (respects website limit on free plan)
- [x] 4. Run audit
- [x] 5. See Growth Score / tasks on dashboard
- [x] 6. Skip or connect GSC
- [x] 7. Generate monthly plan
- [x] 8. Open Control Center
- [ ] 9. See recommended actions (no auto-execution) — API OK; UI spot-check pending

### Existing user flow

- [ ] 1. Existing user logs in
- [ ] 2. No forced onboarding redirect
- [ ] 3. Existing data visible
- [ ] 4. Billing gates only block **new generation** actions

### Billing flow

- [x] 1. Billing page loads without Stripe env
- [x] 2. Checkout disabled when Stripe missing (402 `BILLING_REQUIRED`)
- [ ] 3. Checkout works when Stripe configured
- [ ] 4. Webhook updates subscription
- [x] 5. Usage limits block generation after limit reached
- [x] 6. Existing data remains visible when limited

### AI draft flow

- [ ] 1. Generate article
- [ ] 2. Quality pipeline runs
- [ ] 3. Draft appears in Content Plan / editor
- [ ] 4. WordPress draft creation remains draft-only

### Social flow

- [x] 1. Generate social post (503 graceful without Hermes)
- [ ] 2. Quality checks run (needs Hermes)
- [x] 3. Manual create + copy path available
- [x] 4. No external publishing

### Email approval flow

- [x] 1. Generate email approval draft
- [ ] 2. Edit subject/body (UI spot-check)
- [ ] 3. Approve email (does not send) — API route exists
- [x] 4. Send only via explicit manual click (if Resend configured)
- [x] 5. Approval alone does not send

### Autopilot flow

- [x] 1. Generate monthly plan
- [x] 2. Open Control Center
- [ ] 3. Generate approval email from queue (UI spot-check)
- [x] 4. No actions execute automatically

### Integrations flow

- [ ] 1. GSC connect + property picker
- [ ] 2. GSC metrics load or graceful empty/error
- [ ] 3. WordPress connect + ping
- [ ] 4. WordPress draft failure handled gracefully

### Responsive UI (spot check)

- [x] Dashboard, Control Center, Timeline, Content Plan usable at 375px width (prompt 11.1 browser QA)
- [x] Mobile bottom nav + “More” sheet work (spot-check via page load + layout CSS)
- [x] Tables/cards do not overflow horizontally on tested routes (375px)

---

## 13. UX checklist (prompt 10.2)

See also `docs/engineering/DESIGN-SYSTEM.md`.

### Visual consistency

- [ ] Dashboard pages use consistent headers (`PageHeader`)
- [ ] Cards have consistent spacing and glass styling
- [ ] Status badges are consistent across modules
- [ ] Empty states are helpful and action-oriented
- [ ] Trust notes appear on billing, AI content, email, WordPress flows
- [ ] No technical logs or internal terms in user-facing UI

### Mobile

- [ ] Main dashboard pages usable at ~375px width
- [ ] Dialogs fit viewport (`max-h`, scroll)
- [ ] Cards stack correctly on small screens
- [ ] Buttons remain tappable (44px-ish targets)
- [ ] Bottom nav does not block primary content (`pb-24`)

### Safety copy

- [ ] AI drafts clearly require review
- [ ] WordPress described as drafts only
- [ ] Email approval does not imply sending
- [ ] Billing says cancel anytime + existing data stays available
- [ ] Integrations page does not promise auto-publishing

---

## 15. Security / ownership audit (10.1 + 10.3)

- `resolveOwnedOrganization()` in `lib/auth/queries.ts` — verifies JWT org hint against `ownerUserId`.
- Used in: billing, dashboard/reports/content-plan overviews, GSC context, timeline website resolution, `/api/auth/me`.
- Website-scoped API routes use ownership helpers (`resolveActiveWebsiteForUser`, article/org checks).
- API errors use `AppError` + `createErrorResponse()` — no stack traces in responses.
- Server logging via `lib/logging.ts` — no secrets in logs.
- Stale JWT `X-Organization-Id` / org hint does not leak other orgs — server resolves owned org only (verified 10.3).

---
