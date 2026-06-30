# MVP Build Plan — RankBoost.eu

> Пошаговый план разработки коммерческого MVP с production-промптами для Cursor.
> Каждый промпт — один небольшой, проверяемый этап.
>
> **Версия:** 1.0 · Июнь 2026  
> **Документация:** Product-Bible · System-Architecture · User-Flows · Database-Model · API-Design

---

## Как использовать этот документ

1. Выполняй промпты **строго по порядку** внутри блока; между блоками — по зависимостям (см. диаграмму).
2. Копируй текст промпта в Cursor целиком, добавляя `@docs/...` на релевантные файлы.
3. После каждого этапа — прогоняй acceptance criteria перед следующим.
4. **Не объединяй** несколько промптов в один, если не уверен в стабильности.

### Зависимости блоков

```
[1 Setup] → [2 Design] → [3 DB] → [4 Auth]
                                    ↓
[5 Landing] → [6 Free Audit] → [7 Public Report] → [8 Registration]
                                                      ↓
                                              [9 Stripe]
                                                      ↓
                    [14 Hermes] ←────────── [10 Onboarding]
                         ↓                        ↓
              [6–7 audit] [13 Tasks] [12 Score] [11 Dashboard]
                         ↓
        [15 Plan] → [16 Articles] → [17 Social] → [18 WordPress]
                         ↓
              [19 Google] → [20 Email] → [21 Admin] → [22 Economics]
                         ↓
              [23 Security] → [24 Deploy]
```

### Глобальные ограничения MVP

- ❌ Backlinks / authority engine
- ❌ Публичные рейтинги сайтов
- ❌ Автопубликация в WordPress / соцсети без проверки
- ❌ Shopify / Webflow плагины
- ❌ White-label / partner program
- ✅ Draft Autopilot для WordPress
- ✅ Hermes как внешний AI-worker
- ✅ Stripe подписки Start / Growth / Pro + разовый аудит

### Файлы, которые почти никогда не трогаем

- `data/blog/posts/**` — контент блога (кроме явного промпта)
- `scripts/generate-blog-articles.mjs` — генератор блога
- `AGENTS.md`, `CLAUDE.md` — только при изменении правил проекта
- `docs/**` — только при явном запросе обновить документацию

---

## Блок 1. Project audit & setup

### Промпт 1.1 — Аудит репозитория и карта расширения

**Цель:** зафиксировать текущее состояние лендинга и план папок для SaaS без изменения поведения.

**Можно менять:**
- `README.md` (секция MVP roadmap)
- `docs/MVP-Build-Plan.md` (только если нашёл расхождения)
- `.env.example`

**Нельзя менять:**
- `app/**`, `components/**`, `lib/**`, `data/**`
- `package.json` (на этом этапе)

**Создать:**
- `docs/engineering/REPO-MAP.md` — дерево текущих папок + планируемые (`app/app/`, `prisma/`, `lib/services/`)

**Acceptance criteria:**
- REPO-MAP описывает marketing vs app vs admin зоны
- `.env.example` дополнен переменными из System-Architecture (пустые placeholder)
- `npm run build` проходит без изменений

**Проверка:** `npm run build && npm run lint`

**Риски:** случайные правки кода — держать read-only аудит.

**НЕ делать:** не добавлять зависимости, не создавать страницы.

---

### Промпт 1.2 — Установка базовых зависимостей MVP

**Цель:** добавить Prisma, Stripe, JWT, bcrypt, queue client без функционала.

**Можно менять:**
- `package.json`, `package-lock.json`
- `.env.example`
- `.gitignore` (добавить `prisma/migrations` если нужно)

**Нельзя менять:**
- Существующие страницы и компоненты
- `middleware.ts` (пока)

**Создать:**
- `lib/env.ts` — валидация env (zod), список required для MVP
- `lib/errors.ts` — единый формат ошибок API (из API-Design)

**Acceptance criteria:**
- Зависимости установлены: `@prisma/client`, `prisma`, `stripe`, `jose` или `jsonwebtoken`, `bcryptjs`
- `lib/env.ts` падает с понятной ошибкой без DATABASE_URL
- Существующий build не сломан

**Проверка:** `npm install && npm run build`

**Риски:** конфликт версий Next.js 16 — проверить совместимость Prisma.

**НЕ делать:** не писать schema, не трогать UI.

---

## Блок 2. Design system

### Промпт 2.1 — Dashboard UI primitives

**Цель:** компоненты для дашборда, не ломая marketing UI.

**Можно менять:**
- `app/globals.css` (добавить CSS variables для dashboard)
- `components/ui/**` (новые файлы)

**Нельзя менять:**
- `components/sections/**` (marketing)
- `components/layout/Header.tsx`, `Footer.tsx`

**Создать:**
- `components/ui/score-gauge.tsx`
- `components/ui/task-card.tsx`
- `components/ui/activity-item.tsx`
- `components/ui/integration-status.tsx`
- `components/ui/plan-badge.tsx`
- `components/ui/usage-meter.tsx`
- `components/dashboard/` (пустая папка с index export)

**Acceptance criteria:**
- Storybook не требуется; компоненты рендерятся в isolation page или временной `/app/dev/ui` (удалить в 2.2)
- Соответствуют токенам из System-Architecture (navy, gradients)
- Responsive на 375px

**Проверка:** временная dev-страница или unit smoke render

**Риски:** дублирование с shadcn — расширять, не переписывать button/input.

**НЕ делать:** не подключать к реальным данным.

---

### Промпт 2.2 — App layout shell (пустой)

**Цель:** sidebar + header для `/app` без бизнес-логики.

**Можно менять:**
- `middleware.ts` (добавить matcher для `/app`, пока без auth guard)

**Нельзя менять:**
- `app/[locale]/**` marketing routes

**Создать:**
- `app/app/layout.tsx`
- `app/app/page.tsx` (placeholder «Dashboard»)
- `components/layout/AppSidebar.tsx`
- `components/layout/AppHeader.tsx`
- `i18n/dictionaries/*.ts` — ключи `dashboard.nav.*` (ru, et, en)

**Acceptance criteria:**
- `/app` открывается, sidebar с пунктами из User-Flows §6
- Marketing `/ru` не затронут
- Mobile: bottom tab bar (User-Flows §17)

**Проверка:** `npm run dev` → `/app`, `/ru`

**Риски:** конфликт с locale middleware — `/app` вне `[locale]`.

**НЕ делать:** auth guard, реальные данные.

---

## Блок 3. Database & Prisma

### Промпт 3.1 — Prisma schema: core entities

**Цель:** User, Organization, Website, Subscription, PlanLimit — по Database-Model.

**Можно менять:**
- `prisma/schema.prisma`
- `package.json` (prisma scripts)

**Нельзя менять:**
- `app/**`, `components/**`

**Создать:**
- `prisma/schema.prisma` — User, Organization, Website, Subscription, Payment, PlanLimit
- `lib/db.ts` — Prisma client singleton
- `prisma/seed.ts` — минимальный seed (1 admin, 1 test user)

**Acceptance criteria:**
- Schema соответствует Database-Model §1–3, 17–19
- Soft delete: deletedAt на User, Organization, Website
- Unique: email, stripeSubscriptionId

**Проверка:** `npx prisma validate && npx prisma migrate dev --name init_core`

**Риски:** перегрузить schema — только core на этом этапе.

**НЕ делать:** Audit, Task, Hermes tables — следующий промпт.

---

### Промпт 3.2 — Prisma schema: audit & scores

**Цель:** Audit, AuditCheck, GrowthScoreSnapshot, AIReadinessSnapshot, Activity.

**Можно менять:**
- `prisma/schema.prisma`

**Создать:**
- migration `audit_scores_activity`

**Acceptance criteria:**
- Append-only snapshots (нет updatedAt на GrowthScoreSnapshot)
- Audit statuses enum
- Activity indexes (websiteId, createdAt)

**Проверка:** `prisma migrate dev`, seed расширен 1 audit + 2 snapshots

**НЕ делать:** content tables, integrations.

---

### Промпт 3.3 — Prisma schema: content, integrations, AI, admin

**Цель:** оставшиеся сущности Database-Model.

**Можно менять:**
- `prisma/schema.prisma`
- `prisma/seed.ts`

**Создать:**
- migration `content_integrations_ai`
- Entities: Task, MonthlyPlan, PlanItem, Article, SocialPost, Report, Integration, GoogleIntegrationData, WordPressConnection, AIJob, AIUsage, EmailLog, AdminNote, ErrorLog

**Acceptance criteria:**
- Database-Model checklist (§ «Проверочный список») — все пункты schema
- Seed: полный demo dataset для dashboard dev

**Проверка:** `prisma migrate dev && npx prisma db seed`

**Риски:** JSON field size — document in comments.

**НЕ делать:** не писать API пока.

---

## Блок 4. Auth

### Промпт 4.1 — Auth service + register/login API

**Цель:** email регистрация и login по API-Design §1.

**Можно менять:**
- `lib/**` (auth, services)
- `app/api/auth/**`
- `middleware.ts` (JWT verify helper, не guard yet)

**Нельзя менять:**
- Marketing pages
- `app/api/contact/route.ts`

**Создать:**
- `lib/auth/jwt.ts`, `lib/auth/password.ts`
- `lib/services/auth-service.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/refresh/route.ts`
- `app/api/auth/me/route.ts`
- `app/api/auth/logout/route.ts`

**Acceptance criteria:**
- Register создаёт User + Organization + Website (если url в body)
- Unified error format
- Rate limit login (basic in-memory или Redis stub)

**Проверка:** curl/Postman register → login → me

**НЕ делать:** Google OAuth, UI forms.

---

### Промпт 4.2 — Google OAuth login

**Цель:** «Продолжить с Google» для регистрации/входа.

**Создать:**
- `app/api/auth/google/route.ts`
- `app/api/auth/google/callback/route.ts`
- Расширить auth-service

**Acceptance criteria:**
- Отдельные OAuth credentials от Google Integrations
- Новый user → org + website optional
- API-Design Auth § Google

**Проверка:** OAuth flow в dev с Google Cloud test app

**НЕ делать:** не путать с GSC integration scopes.

---

### Промпт 4.3 — Auth UI + middleware guard

**Цель:** страницы login/register, защита `/app/*`.

**Создать:**
- `app/(auth)/login/page.tsx`, `register/page.tsx` (или `app/auth/`)
- `components/forms/LoginForm.tsx`, `RegisterForm.tsx`
- `middleware.ts` — guard `/app`, `/admin`
- `lib/auth/session.ts` — client helpers

**Acceptance criteria:**
- Неавторизованный → redirect `/login`
- User-Flows §3 поля и ошибки
- Существующий marketing не сломан

**Проверка:** manual E2E register → попадаю в `/app`

**НЕ делать:** Stripe, onboarding.

---

## Блок 5. Landing upgrade

### Промпт 5.1 — Hero URL input + CTA к аудиту

**Цель:** главный CTA «Проверить сайт бесплатно» с полем URL.

**Можно менять:**
- `components/sections/Hero.tsx`
- `i18n/dictionaries/*.ts` (hero keys)
- `app/[locale]/page.tsx` (если нужно)

**Нельзя менять:**
- `app/app/**`
- Pricing logic

**Создать:**
- `components/forms/SiteUrlForm.tsx`
- `lib/url/normalize.ts` — normalize URL client-side

**Acceptance criteria:**
- User-Flows §1: URL field + CTA
- Submit → navigate `/audit/check?url=...` (страница в блоке 6)
- RU/ET/EN тексты

**Проверка:** visual + mobile 375px

**НЕ делать:** не запускать реальный аудит.

---

### Промпт 5.2 — Landing CTA consistency

**Цель:** все CTA лендинга ведут к free audit flow.

**Можно менять:**
- `components/sections/CTASection.tsx`
- `components/layout/Header.tsx`
- `app/[locale]/pricing/page.tsx` (CTA links)

**Acceptance criteria:**
- User-Flows §19 landing CTAs
- Header «SEO-аудит» → audit flow
- Ни один CTA не ведёт на мёртвую ссылку

**Проверка:** клик по всем CTA на `/ru`

**НЕ делать:** не менять тарифные цены.

---

## Блок 6. Free audit engine

### Промпт 6.1 — SSRF-safe URL validator + preview API

**Цель:** POST `/api/audit/preview` с валидацией URL.

**Создать:**
- `lib/security/ssrf.ts`
- `lib/services/audit-service.ts` (preview start)
- `app/api/audit/preview/route.ts`
- `lib/services/plan-limit-service.ts` (stub)

**Acceptance criteria:**
- API-Design § бесплатный аудит
- Блок localhost, private IP
- Rate limit 3/hour/IP
- Создаёт Audit type=preview, status=queued

**Проверка:** curl valid URL → 202; localhost → 400 SSRF_BLOCKED

**НЕ делать:** Hermes call — следующий промпт.

---

### Промпт 6.2 — Hermes stub для preview audit

**Цель:** локальный stub Hermes или mock до реального сервиса.

**Создать:**
- `lib/hermes/client.ts` — interface + env HERMES_API_URL
- `lib/hermes/mock.ts` — dev mock возвращает фиксированный preview
- `lib/queue/audit-queue.ts` — in-process или Redis
- Worker: `lib/workers/audit-preview-worker.ts`

**Acceptance criteria:**
- Preview audit завершается за <60s (mock)
- Audit status transitions: queued → processing → completed
- AIJob record created

**Проверка:** POST preview → poll status → completed

**НЕ делать:** full audit, не показывать 100 checks.

---

### Промпт 6.3 — Audit progress UI

**Цель:** экран ожидания аудита User-Flows §2.1.

**Создать:**
- `app/audit/check/page.tsx` (или `app/[locale]/audit/check`)
- `components/audit/AuditProgress.tsx`
- Polling `GET /api/audits/:id/status`

**Acceptance criteria:**
- Animated steps «Проверяем…»
- Redirect на report when completed
- Error state + retry

**Проверка:** E2E URL → progress → report page

**НЕ делать:** registration, paywall content.

---

## Блок 7. Public report

### Промпт 7.1 — Preview report API (scoped)

**Цель:** GET public report с previewToken, max 5 issues.

**Создать:**
- `lib/auth/preview-token.ts` — HMAC signed token
- `app/api/audit/preview/[auditId]/report/route.ts`
- `app/api/audits/[auditId]/status/route.ts` (public with token)
- Populate AuditCheck with isVisibleInPreview

**Acceptance criteria:**
- API-Design: no full checks, no instructions
- Growth Score + AI Readiness preview
- 3–5 issues + quick wins
- Token required, rate limited

**Проверка:** report без token → 401; с token → scoped data

**НЕ делать:** paid content leak.

---

### Промпт 7.2 — Public report UI + paywall

**Цель:** экран результата бесплатного аудита.

**Создать:**
- `app/audit/report/[auditId]/page.tsx`
- `components/audit/AuditPreview.tsx`
- `components/audit/UpgradePaywall.tsx`

**Acceptance criteria:**
- User-Flows §2 полностью
- CTA «Получить полный аудит» → register with claimToken
- `POST /api/audit/preview/:id/claim`

**Проверка:** visual + CTA navigates to register

**НЕ делать:** Stripe checkout с этой страницы напрямую.

---

## Блок 8. Registration flow

### Промпт 8.1 — Claim token при регистрации

**Цель:** связать preview audit с новым аккаунтом.

**Можно менять:**
- `lib/services/auth-service.ts`
- `app/api/auth/register/route.ts`
- `RegisterForm.tsx`

**Acceptance criteria:**
- claimToken / auditToken при register → Website.url + Audit привязаны
- User-Flows §2.5 path A

**Проверка:** free audit → register → audit visible in DB for user org

**НЕ делать:** payment.

---

### Промпт 8.2 — Email verification flow

**Цель:** подтверждение email (Resend).

**Создать:**
- `app/api/auth/verify-email/route.ts`
- `app/api/auth/forgot-password/route.ts`, `reset-password/route.ts`
- Email template: verification
- Расширить `lib/services/email-service.ts`

**Acceptance criteria:**
- User-Flows §3.4
- Resend только server-side
- Unverified user может оплатить, но reports требуют verify (banner)

**Проверка:** register → email → verify link works

**НЕ делать:** full transactional suite.

---

## Блок 9. Stripe billing

### Промпт 9.1 — Stripe Checkout + products setup

**Цель:** создать checkout session для планов audit/start/growth/pro.

**Создать:**
- `lib/stripe/client.ts`
- `lib/services/billing-service.ts`
- `lib/config/plans.ts` — limits из Product-Bible §21
- `app/api/billing/checkout/route.ts`
- `app/api/billing/subscription/route.ts`

**Acceptance criteria:**
- API-Design billing § checkout
- Metadata: userId, organizationId, plan
- Success/cancel URLs

**Проверка:** Stripe test mode → checkout URL opens

**НЕ делать:** webhook yet.

---

### Промпт 9.2 — Stripe webhooks + subscription activation

**Цель:** обработка checkout.session.completed, invoice.paid, etc.

**Создать:**
- `app/api/webhooks/stripe/route.ts`
- `lib/services/subscription-service.ts`
- Idempotency by stripe event id
- PlanLimit creation on payment

**Acceptance criteria:**
- API-Design § подписка webhook table
- Payment + Subscription records
- Activity: subscription_created, payment_succeeded
- Trigger full audit AIJob on first payment

**Проверка:** Stripe CLI `stripe listen` → test checkout → subscription active

**НЕ делать:** Customer portal (next).

---

### Промпт 9.3 — Billing UI + cancel/upgrade

**Цель:** страница выбора тарифа и billing settings.

**Создать:**
- `app/app/settings/billing/page.tsx`
- `app/(marketing)/checkout/page.tsx` или post-register pricing step
- `app/api/billing/cancel/route.ts`, `portal/route.ts`, `upgrade/route.ts`
- `components/billing/PricingCheckout.tsx`, `UsageMeter` wired

**Acceptance criteria:**
- User-Flows §4, §14
- Success page polls subscription status
- Cancel at period end works

**Проверка:** upgrade Start → Growth in test mode

**НЕ делать:** VAT invoicing logic (manual note).

---

## Блок 10. Onboarding

### Промпт 10.1 — Onboarding wizard UI

**Цель:** 6 шагов User-Flows §5.

**Создать:**
- `app/app/onboarding/page.tsx`
- `components/dashboard/OnboardingWizard.tsx`
- `app/api/onboarding/status/route.ts`
- `app/api/onboarding/complete/route.ts`

**Acceptance criteria:**
- Steps: site, goals, GSC, GA4/GBP, WP skip, dashboard intro
- Progress bar
- Skip optional steps
- PATCH website for goals/languages

**Проверка:** new paid user → forced onboarding → complete → dashboard

**НЕ делать:** real Google OAuth (block 19) — stubs «Подключить позже».

---

### Промпт 10.2 — Onboarding completion triggers

**Цель:** complete → full audit + content plan job.

**Можно менять:**
- `lib/services/onboarding-service.ts`
- `onboarding/complete` route

**Acceptance criteria:**
- onboardingCompletedAt set
- Full audit queued if none running
- Activity: onboarding_completed
- Redirect with firstTaskId placeholder

**Проверка:** complete → Audit type=full in DB queued

**НЕ делать:** WordPress setup.

---

## Блок 11. Dashboard

### Промпт 11.1 — Dashboard aggregate API

**Цель:** GET `/api/websites/:id/dashboard` одним запросом.

**Создать:**
- `app/api/websites/[websiteId]/dashboard/route.ts`
- `lib/services/dashboard-service.ts`

**Acceptance criteria:**
- API-Design §5 response shape
- Empty states для GSC, tasks, content
- planUsage from PlanLimit

**Проверка:** API returns valid JSON for seed user

**НЕ делать:** frontend yet.

---

### Промпт 11.2 — Dashboard Overview UI

**Цель:** главный экран `/app` с реальными данными.

**Можно менять:**
- `app/app/page.tsx`
- `components/dashboard/*`

**Acceptance criteria:**
- User-Flows §6 hierarchy: Score → Tasks → Activity → Quick actions → Traffic
- Loading skeletons
- Mobile bottom nav

**Проверка:** login → dashboard shows seed data

**НЕ делать:** drill-down pages (partial OK as links).

---

## Блок 12. Growth Score

### Промпт 12.1 — Growth Score service + history API

**Цель:** snapshots, history, current score.

**Создать:**
- `lib/services/growth-score-service.ts`
- `lib/services/ai-readiness-service.ts`
- `app/api/websites/[websiteId]/growth-score/route.ts`
- `app/api/websites/[websiteId]/growth-score/history/route.ts`
- AI readiness routes

**Acceptance criteria:**
- Append-only snapshots
- Delta calculation
- Trigger on task complete (hook stub)

**Проверка:** complete task → new snapshot with delta

**НЕ делать:** ML model — rule-based from audit data.

---

### Промпт 12.2 — Growth Score UI widgets

**Цель:** gauge + detail page.

**Создать:**
- `components/dashboard/GrowthScoreCard.tsx`
- `components/dashboard/AIReadinessCard.tsx`
- `app/app/growth/page.tsx` (detail)

**Acceptance criteria:**
- User-Flows §7 tooltips, coach mark (once)
- Category breakdown bars
- History chart 90 days

**Проверка:** visual + score matches API

**НЕ делать:** promise «топ Google».

---

## Блок 13. AI Tasks

### Промпт 13.1 — Tasks API + list UI

**Цель:** CRUD tasks, filters, priorities.

**Создать:**
- `lib/services/task-service.ts`
- `app/api/websites/[websiteId]/tasks/route.ts`
- `app/api/tasks/[taskId]/route.ts`
- `app/app/tasks/page.tsx`
- `components/dashboard/TasksList.tsx`

**Acceptance criteria:**
- User-Flows §8 card design
- Filters: status, priority, category
- Max active tasks from plan

**Проверка:** seed tasks display, filter works

**НЕ делать:** auto-fix, Hermes generate.

---

### Промпт 13.2 — Task detail + complete flow

**Цель:** slide-over, mark done, score update.

**Создать:**
- `components/dashboard/TaskDetail.tsx`
- PATCH task status → Activity + GrowthScore job
- Skip with reason

**Acceptance criteria:**
- User-Flows §8.4–8.6
- Toast on complete
- Celebration on score up (subtle)

**Проверка:** mark done → Activity feed + score delta

**НЕ делать:** auto-fix button logic (next block with Hermes).

---

## Блок 14. Hermes API integration

### Промпт 14.1 — Hermes client + callback endpoint

**Цель:** production path RankBoost ↔ Hermes.

**Создать:**
- `lib/hermes/client.ts` (real HTTP)
- `lib/hermes/signature.ts`
- `app/api/internal/hermes/callback/route.ts`
- `lib/services/ai-job-service.ts`
- `app/api/ai-jobs/[jobId]/route.ts`

**Acceptance criteria:**
- API-Design §17, § Hermes раздел
- HMAC verify callback
- AIJob status lifecycle
- AIUsage increment with cost

**Проверка:** mock Hermes POST callback → audit completed in DB

**НЕ делать:** deploy Hermes — может быть mock server в dev.

---

### Промпт 14.2 — Full audit via Hermes

**Цель:** replace mock with real full audit pipeline.

**Можно менять:**
- `audit-service.ts`, workers
- `app/api/websites/[websiteId]/audits/route.ts`

**Acceptance criteria:**
- audit.full job → AuditChecks → Tasks generated
- GrowthScoreSnapshot on complete
- Email «аудит готов»
- Plan limit enforced

**Проверка:** paid user → run audit → tasks appear

**НЕ делать:** content generation.

---

### Промпт 14.3 — Task generation + auto-fix dispatch

**Цель:** tasks.generate, auto-fix → content jobs.

**Создать:**
- `app/api/websites/[websiteId]/tasks/generate/route.ts`
- `app/api/tasks/[taskId]/auto-fix/route.ts`
- Hermes jobs: tasks.generate

**Acceptance criteria:**
- Max 10 active tasks
- canAutoFix flags respected
- 503 HERMES_UNAVAILABLE user message

**Проверка:** generate → new tasks; auto-fix article task → article job queued

**НЕ делать:** social posts.

---

## Блок 15. Content plan

### Промпт 15.1 — Monthly plan API + generation

**Цель:** content.plan Hermes job, PlanItems.

**Создать:**
- `lib/services/content-plan-service.ts`
- `app/api/websites/[websiteId]/content-plans/route.ts`
- `app/api/websites/[websiteId]/content-plans/generate/route.ts`
- Cron hook stub for 1st of month

**Acceptance criteria:**
- User-Flows §10 plan list UI data
- MonthlyPlan + PlanItems in DB
- Growth plan: 4 articles + 8 posts planned

**Проверка:** generate → plan items in DB

**НЕ делать:** article bodies.

---

### Промпт 15.2 — Content plan UI

**Создать:**
- `app/app/content/page.tsx` (plan tab)
- `components/dashboard/ContentPlanList.tsx`

**Acceptance criteria:**
- Month selector
- Status icons ○ ● ✓
- Links to create article from plan item

**Проверка:** UI shows seed plan

**НЕ делать:** editor.

---

## Блок 16. Articles

### Промпт 16.1 — Article generation API + editor

**Цель:** create, generate via Hermes, edit, approve.

**Создать:**
- `lib/services/article-service.ts`
- `app/api/websites/[websiteId]/articles/route.ts`
- `app/api/articles/[articleId]/route.ts`
- `app/api/articles/[articleId]/approve/route.ts`
- `app/api/articles/[articleId]/regenerate/route.ts`
- `app/app/content/articles/[articleId]/page.tsx`
- `components/content/ArticleEditor.tsx`

**Acceptance criteria:**
- User-Flows §10 full flow
- Plan limit articles/month
- Status: generating → draft → approved
- Human review disclaimer

**Проверка:** create article → mock Hermes → edit → approve

**НЕ делать:** WordPress push.

---

### Промпт 16.2 — Article list + dashboard content widget

**Можно менять:**
- `app/app/content/page.tsx`
- Dashboard content section

**Acceptance criteria:**
- Last 2 articles on dashboard
- Empty state CTA

**Проверка:** dashboard widget populated

**НЕ делать:** autopublish.

---

## Блок 17. Social posts

### Промпт 17.1 — Social posts API + UI

**Цель:** generate, edit, copy, approve — no autopublish.

**Создать:**
- `lib/services/social-post-service.ts`
- API routes mirroring articles
- `app/app/content/social/[postId]/page.tsx`
- `components/content/SocialPostEditor.tsx`
- Tab «Соцсети» in content page

**Acceptance criteria:**
- User-Flows §10.5
- Copy to clipboard
- Platforms: instagram, facebook, linkedin
- Plan limits

**Проверка:** generate → copy → approved

**НЕ делать:** Instagram API integration.

---

## Блок 18. WordPress connector

### Промпт 18.1 — RankBoost WordPress API (server)

**Цель:** connect, verify, push draft — API-Design §14.

**Создать:**
- `lib/services/wordpress-service.ts`
- `lib/auth/wordpress-signature.ts`
- `app/api/websites/[websiteId]/wordpress/connect/route.ts`
- `app/api/wordpress/verify/route.ts`
- `app/api/articles/[articleId]/push-to-wordpress/route.ts`
- `app/app/integrations/page.tsx` (WP section)

**Acceptance criteria:**
- API key shown once, encrypted storage
- Push only if article approved
- Draft only — never publish
- Activity: article_sent_to_wordpress
- wpApiCallsPerDay limit

**Проверка:** push to test WP with plugin installed

**НЕ делать:** plugin ZIP yet.

---

### Промпт 18.2 — WordPress plugin RankBoost Connector v1

**Цель:** отдельный пакет плагина (можно `wordpress-plugin/` в repo).

**Создать:**
- `wordpress-plugin/rankboost-connector/` — PHP plugin
- REST routes: health, drafts CRUD
- HMAC verification
- `wp_insert_post` status=draft only
- README install instructions

**Acceptance criteria:**
- User-Flows §11 install flow
- WP 6.0+, reject publish requests
- RankBoost verify + health check pass

**Проверка:** install on local WP → full push E2E

**НЕ делать:** autopublish, multisite.

---

## Блок 19. Google OAuth integrations

### Промпт 19.1 — Google OAuth GSC + property picker

**Цель:** connect Search Console, first sync.

**Создать:**
- `lib/google/oauth.ts`
- `lib/services/integration-service.ts`
- `app/api/integrations/google/authorize/route.ts`
- `app/api/integrations/google/callback/route.ts`
- `app/api/integrations/google/select-property/route.ts`
- Encrypt tokens at rest

**Acceptance criteria:**
- API-Design Google §
- GSC only for audit plan; all for Start+
- Integration + initial GoogleIntegrationData
- Activity: integration_connected

**Проверка:** OAuth test → property select → data in DB

**НЕ делать:** GA4, GBP (next).

---

### Промпт 19.2 — GA4 + GBP + sync cron + traffic widget

**Создать:**
- GA4, GBP OAuth flows
- `app/api/cron/google-sync/route.ts`
- `app/api/cron/token-refresh/route.ts`
- Dashboard traffic chart component wired to GSC data
- `app/app/integrations/page.tsx` complete

**Acceptance criteria:**
- User-Flows §12
- Daily sync cron
- Expired token → reconnect UI
- Visibility score category uses GSC when connected

**Проверка:** dashboard chart shows GSC clicks

**НЕ делать:** auto-edit GBP.

---

## Блок 20. Email / Resend reports

### Промпт 20.1 — Email service + transactional templates

**Цель:** welcome, audit ready, payment receipt, verify email.

**Создать:**
- `lib/services/email-service.ts` (extend resend)
- `lib/email/templates/*`
- `app/api/user/email-preferences/route.ts`
- EmailLog on every send

**Acceptance criteria:**
- Resend server-only
- User-Flows §13 preference toggles
- Unsubscribe signed token

**Проверка:** trigger each template in dev

**НЕ делать:** monthly report yet.

---

### Промпт 20.2 — Monthly report generator + cron

**Создать:**
- `lib/services/report-service.ts`
- `app/api/cron/monthly-reports/route.ts`
- `app/api/websites/[websiteId]/reports/route.ts`
- `app/api/reports/[reportId]/route.ts`
- `app/app/reports/page.tsx`
- HTML email template User-Flows §13.2

**Acceptance criteria:**
- Report entity with htmlContent
- Cron 1st of month
- Activity: report_sent
- Start: 1/month; Growth: 2/month

**Проверка:** manual cron trigger → email received → archive in app

**НЕ делать:** open tracking requirement.

---

## Блок 21. Admin panel

### Промпт 21.1 — Admin API + role guard

**Цель:** admin endpoints API-Design §18.

**Создать:**
- `lib/auth/require-admin.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/metrics/route.ts`
- `app/api/admin/ai-jobs/route.ts`
- `app/api/admin/errors/route.ts`
- `app/admin/layout.tsx` + guard

**Acceptance criteria:**
- role admin/support/analyst
- user role → 403 on /api/admin
- Impersonate endpoint with AdminNote log

**Проверка:** seed admin login → list users

**НЕ делать:** full admin UI all pages.

---

### Промпт 21.2 — Admin UI dashboards

**Создать:**
- `app/admin/page.tsx` — metrics
- `app/admin/users/[userId]/page.tsx`
- `app/admin/jobs/page.tsx`
- `app/admin/errors/page.tsx`

**Acceptance criteria:**
- MRR, active subs, Hermes spend (from AIUsage)
- Retry failed AI job button
- Resolve error button

**Проверка:** admin sees seed metrics

**НЕ делать:** 2FA implementation (document as post-MVP if complex).

---

## Блок 22. Unit economics

### Промпт 22.1 — COGS tracking + admin alerts

**Цель:** AIUsage, cost per org, margin alerts.

**Создать:**
- `lib/services/unit-economics-service.ts`
- `lib/config/unit-costs.ts` — € per 1K tokens
- Extend Hermes callback to record cost
- Admin metric: avg COGS per plan
- Alert when COGS > 50% revenue (ErrorLog + admin flag)

**Acceptance criteria:**
- Database-Model AIUsage + AIJob cost fields populated
- Product-Bible §20 metrics computable from DB
- Admin /metrics includes gross margin estimate

**Проверка:** run 5 article jobs → COGS visible in admin

**НЕ делать:** billing automation based on COGS.

---

## Блок 23. Security hardening

### Промпт 23.1 — Rate limits + security middleware

**Цель:** production rate limits, request ID, headers.

**Создать:**
- `lib/middleware/rate-limit.ts` (Redis/Upstash)
- `lib/middleware/request-id.ts`
- Apply to public audit, auth, API routes
- Security headers in `next.config.ts`

**Acceptance criteria:**
- API-Design rate limit table
- 429 with Retry-After
- X-Request-Id on all responses

**Проверка:** burst requests → 429

**НЕ делать:** WAF vendor integration.

---

### Промпт 23.2 — GDPR delete + audit security review

**Создать:**
- `app/api/user/delete-account/route.ts`
- `lib/services/gdpr-service.ts` — soft delete + schedule purge
- `app/api/cron/gdpr-purge/route.ts`
- Security checklist doc update

**Acceptance criteria:**
- User-Flows §15.7 delete flow
- Credentials wiped on Integration, WordPressConnection
- Database-Model §7 deletion logic

**Проверка:** delete test user → cannot login → tokens null

**НЕ делать:** legal docs rewrite.

---

## Блок 24. Production deployment

### Промпт 24.1 — Production env + Vercel + Neon

**Цель:** staging + production infrastructure.

**Можно менять:**
- `.env.example`
- `README.md` deployment section
- `vercel.json` if needed

**Создать:**
- `docs/engineering/DEPLOYMENT.md`
- Neon Postgres production DB
- Upstash Redis
- Vercel env vars checklist

**Acceptance criteria:**
- API MVP Acceptance Checklist § security env
- Migrations run on deploy
- Stripe live/test separation documented

**Проверка:** deploy preview → smoke test register → audit

**НЕ делать:** multi-region.

---

### Промпт 24.2 — E2E smoke suite + launch checklist

**Создать:**
- `docs/engineering/LAUNCH-CHECKLIST.md`
- `scripts/smoke-test.sh` — curl-based critical paths
- Optional: Playwright 3 tests (audit, register, checkout)

**Acceptance criteria:**
- Full funnel works on production staging:
  1. Preview audit
  2. Register
  3. Checkout (test card)
  4. Onboarding
  5. Dashboard with tasks
  6. Generate article
  7. Push WP draft
- `npm run build` passes
- Existing blog/marketing pages intact

**Проверка:** run smoke script against staging URL

**НЕ делать:** load testing.

---

## Сводная таблица промптов (51)

| # | ID | Блок |
|---|---|---|
| 1 | 1.1 | Project audit |
| 2 | 1.2 | Dependencies |
| 3 | 2.1 | Dashboard UI kit |
| 4 | 2.2 | App layout shell |
| 5 | 3.1 | Prisma core |
| 6 | 3.2 | Prisma audit/scores |
| 7 | 3.3 | Prisma full schema |
| 8 | 4.1 | Auth API |
| 9 | 4.2 | Google login |
| 10 | 4.3 | Auth UI + guard |
| 11 | 5.1 | Hero URL CTA |
| 12 | 5.2 | Landing CTAs |
| 13 | 6.1 | Preview API + SSRF |
| 14 | 6.2 | Hermes stub preview |
| 15 | 6.3 | Audit progress UI |
| 16 | 7.1 | Preview report API |
| 17 | 7.2 | Public report UI |
| 18 | 8.1 | Claim token register |
| 19 | 8.2 | Email verification |
| 20 | 9.1 | Stripe checkout |
| 21 | 9.2 | Stripe webhooks |
| 22 | 9.3 | Billing UI |
| 23 | 10.1 | Onboarding wizard |
| 24 | 10.2 | Onboarding triggers |
| 25 | 11.1 | Dashboard API |
| 26 | 11.2 | Dashboard UI |
| 27 | 12.1 | Growth Score API |
| 28 | 12.2 | Growth Score UI |
| 29 | 13.1 | Tasks API + list |
| 30 | 13.2 | Task complete flow |
| 31 | 14.1 | Hermes callback |
| 32 | 14.2 | Full audit Hermes |
| 33 | 14.3 | Task gen + auto-fix |
| 34 | 15.1 | Content plan API |
| 35 | 15.2 | Content plan UI |
| 36 | 16.1 | Articles API + editor |
| 37 | 16.2 | Article list widget |
| 38 | 17.1 | Social posts |
| 39 | 18.1 | WP server API |
| 40 | 18.2 | WP plugin |
| 41 | 19.1 | Google GSC |
| 42 | 19.2 | GA4/GBP + cron |
| 43 | 20.1 | Email transactional |
| 44 | 20.2 | Monthly reports |
| 45 | 21.1 | Admin API |
| 46 | 21.2 | Admin UI |
| 47 | 22.1 | Unit economics |
| 48 | 23.1 | Rate limits |
| 49 | 23.2 | GDPR delete |
| 50 | 24.1 | Deploy infra |
| 51 | 24.2 | E2E smoke |

*Итого 51 промпт в 24 блоках — каждый рассчитан на 1–3 часа работы.*

---

## Definition of Done for Commercial MVP

Коммерческий MVP RankBoost считается **готовым к продаже**, когда выполнены **все** критерии ниже.

### Продукт и воронка

- [ ] Пользователь без регистрации вводит URL и получает бесплатный preview за < 60 секунд
- [ ] Preview показывает Growth Score, 3–5 проблем, quick wins — **не** 100 ошибок
- [ ] Paywall ведёт к регистрации и оплате
- [ ] Регистрация: email + Google OAuth
- [ ] Оплата: разовый аудит (99€) и подписки Start / Growth / Pro через Stripe test+live
- [ ] После оплаты: onboarding → полный аудит → dashboard с задачами
- [ ] Минимальный срок подписки 3 месяца отражён в UI и Stripe

### Dashboard и ценность

- [ ] Growth Score и AI Readiness с историей и delta
- [ ] AI Tasks: приоритеты, done/skip, auto-fix где применимо
- [ ] Activity Feed логирует ключевые события
- [ ] Лимиты тарифа отображаются и enforced (403 PLAN_LIMIT_EXCEEDED)

### Контент (Draft Autopilot)

- [ ] Контент-план на месяц генерируется
- [ ] SEO-статьи: generate → edit → approve — **без** автопубликации
- [ ] Соцпосты: generate → copy — **без** автопостинга
- [ ] WordPress: plugin + push draft + ручная публикация в WP

### Интеграции

- [ ] Google Search Console OAuth + трафик на dashboard
- [ ] Google Analytics 4 и Business Profile (Growth+)
- [ ] Токены encrypted, refresh cron работает
- [ ] Disconnect очищает credentials

### Hermes и AI

- [ ] Hermes callback интегрирован (или staging Hermes)
- [ ] Preview, full audit, tasks, content, scores — через AIJob
- [ ] AIUsage и COGS видны в admin
- [ ] Hermes down → 503 с понятным UX, не crash

### Email

- [ ] Transactional: verify, welcome, audit ready, payment
- [ ] Ежемесячный отчёт по email + архив в app
- [ ] Unsubscribe работает

### Admin

- [ ] Admin: users, subscriptions, AI jobs, errors, metrics (MRR, COGS)
- [ ] Impersonate для support (logged)

### Безопасность

- [ ] JWT auth на всех `/app` и protected API
- [ ] SSRF protection на audit URL
- [ ] Rate limits на public audit и auth
- [ ] Stripe + Hermes webhook signatures verified
- [ ] GDPR delete account flow
- [ ] Нет secrets в client bundle

### Marketing (существующий сайт)

- [ ] `/ru`, `/et`, `/en` лендинг работает
- [ ] Блог, контактная форма, sitemap — без регрессий
- [ ] `npm run build` — 0 errors

### Документация и ops

- [ ] `.env.example` полный
- [ ] DEPLOYMENT.md + LAUNCH-CHECKLIST.md
- [ ] Smoke test проходит на staging
- [ ] Production: rankboost.eu + SSL + Neon + Vercel

### Явно вне scope (не блокирует launch)

- Backlinks / authority engine
- Публичные рейтинги
- AI Visibility monitor
- Partner program
- Shopify/Webflow
- Autopublish
- Mobile native app
- 2FA admin (желательно, не blocker)

### Бизнес-готовность

- [ ] Stripe products/prices настроены в live mode
- [ ] Resend domain verified (rankboost.eu)
- [ ] Privacy Policy / Terms актуальны для SaaS + подписок
- [ ] info@rankboost.eu поддержка указана
- [ ] Первые 3 платящих клиента могут пройти путь без ручной помощи разработчика

---

## Шаблон промпта для Cursor (копировать)

```
Контекст: RankBoost.eu MVP. Прочитай @docs/MVP-Build-Plan.md промпт [X.X].
Также: @docs/API-Design.md @docs/Database-Model.md @docs/User-Flows.md

Задача: [скопировать «Цель» из промпта]

Ограничения:
- Можно менять: [список]
- Нельзя менять: [список]
- НЕ делать: [список]

Acceptance criteria: [скопировать из промпта]

После завершения: npm run build && npm run lint
Опиши что проверить вручную.
```

---

*RankBoost.eu · MVP Build Plan v1.0 · Июнь 2026*
