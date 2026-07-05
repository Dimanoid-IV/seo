# REPO-MAP — RankBoost.eu

> Карта репозитория: **текущее состояние** (production marketing site) и **планируемые зоны** SaaS MVP.
>
> **Версия:** 1.0 · Июнь 2026  
> **Шаг:** MVP Build Plan — промпт 1.1 (foundation, без SaaS-кода)

**Связанные документы:** `docs/MASTER-BUILD-PLAN.md` · `docs/Integration-Roadmap.md` · `docs/Current-Code-Audit.md` · `docs/MVP-Build-Plan.md`

---

## 1. Назначение документа

Этот файл фиксирует:

- где сейчас живёт код маркетингового сайта;
- что **нельзя трогать** без явного промпта из build plan;
- куда **добавлять** SaaS без поломки лендинга;
- как проверять, что production-лендинг не сломан после каждого шага.

**Правило:** SaaS добавляется **рядом**, не вместо маркетинга. См. `docs/Integration-Roadmap.md`.

---

## 2. Текущая структура проекта

```
rankboost.eu/  (package name: seoch)
├── app/
│   ├── layout.tsx                 # Root: fonts, GA, dark theme
│   ├── globals.css                # Design system (Tailwind v4 + shadcn)
│   ├── not-found.tsx
│   ├── opengraph-image.tsx        # Dynamic OG 1200×630 (edge)
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── [locale]/                  # ★ MARKETING — все локализованные страницы
│   │   ├── layout.tsx             # Header + Footer + JSON-LD org
│   │   ├── page.tsx               # Home
│   │   ├── services/
│   │   ├── pricing/
│   │   ├── blog/ + blog/[slug]/
│   │   ├── contact/
│   │   ├── privacy/
│   │   └── terms/
│   ├── app/                       # ★ SaaS dashboard shell (prompt 2.1)
│   │   ├── layout.tsx             # AppSidebar + AppHeader + auth guard
│   │   ├── page.tsx               # Dashboard overview
│   │   ├── content-plan/page.tsx  # ★ Content Plan v1 (7.1)
│   │   ├── articles/[articleId]/page.tsx # ★ Article Editor v1 (8.11)
│   │   ├── reports/page.tsx       # ★ Reports v1 (7.2)
│   │   └── integrations/page.tsx  # ★ Integrations Hub v1 (8.1)
│   ├── login/page.tsx             # ★ Auth UI (prompt 4.3)
│   ├── register/page.tsx          # ★ Auth UI (prompt 4.3)
│   ├── audit/page.tsx             # ★ Public free audit UI (prompt 6.2)
│   └── api/
│       ├── contact/route.ts       # ★ Marketing API (Resend lead form)
│       ├── audit/preview/route.ts # ★ Public preview audit API (prompt 6.1)
│       ├── dashboard/overview/route.ts # ★ Dashboard overview API (prompt 6.4)
│       ├── content-plan/overview/route.ts # ★ Content Plan API (7.1)
│       ├── reports/overview/route.ts  # ★ Reports API (7.2)
│       ├── integrations/overview/route.ts # ★ Integrations Hub API (8.1)
│       ├── integrations/google/connect/route.ts   # ★ GSC OAuth start (8.3)
│       ├── integrations/google/callback/route.ts  # ★ GSC OAuth callback (8.3)
│       ├── integrations/google/search-console/sites/route.ts      # ★ GSC sites (8.4)
│       ├── integrations/google/search-console/select-site/route.ts # ★ GSC picker (8.4)
│       ├── integrations/google/search-console/sync/route.ts       # ★ GSC manual sync (8.5)
│       ├── integrations/wordpress/create-connection/route.ts      # ★ WP API key (8.8)
│       ├── articles/generate/route.ts                             # ★ Hermes article gen (9.1)
│       ├── articles/[articleId]/route.ts                          # ★ Article GET/PATCH (8.11)
│       ├── articles/[articleId]/wordpress-draft/route.ts          # ★ WP draft create (8.10)
│       ├── wordpress/ping/route.ts                                # ★ WP plugin ping (8.8)
│       ├── websites/[websiteId]/audits/run/route.ts # ★ Audit rerun (6.5)
│       ├── tasks/[taskId]/complete/route.ts   # ★ Complete task (6.7)
│       ├── tasks/[taskId]/dismiss/route.ts    # ★ Dismiss task (6.7)
│       └── auth/                  # ★ SaaS auth API (prompt 4.2)
│           ├── register/route.ts
│           ├── login/route.ts
│           ├── logout/route.ts
│           ├── refresh/route.ts
│           └── me/route.ts
│
├── components/
│   ├── analytics/                 # GoogleAnalytics
│   ├── blog/                      # Blog UI (7 components)
│   ├── dashboard/                 # ★ SaaS dashboard UI primitives (prompt 2.1)
│   ├── integrations/              # ★ Integrations Hub UI (8.1, 8.2)
│   ├── audit/                     # ★ Public audit UI (prompt 6.2)
│   ├── forms/                     # ContactForm, ContactFormSection
│   ├── layout/                    # Header, Footer, AppSidebar, AppHeader, …
│   ├── sections/                  # ★ MARKETING sections (14 files)
│   ├── seo/                       # JsonLdScript
│   └── ui/                        # shadcn + custom (PricingCard, LocaleLink, …)
│
├── data/
│   ├── blog/posts/                # ★ 66 статей (all-posts.ts + expert-posts-2026.ts)
│   ├── blog-posts.ts              # Blog helpers / exports
│   ├── services.ts
│   ├── pricing.ts
│   ├── faq.ts, pricing-faq.ts
│   └── contact-options.ts
│
├── i18n/
│   ├── config.ts                  # locales: ru, et, en; default: ru
│   └── dictionaries/              # ru.ts (Dictionary type), et.ts, en.ts
│
├── lib/
│   ├── contact-links.ts
│   ├── db.ts                        # ★ Prisma client singleton (server-only)
│   ├── env.ts                       # ★ Server/public env validation (Zod)
│   ├── errors.ts                    # ★ AppError + API error format
│   ├── security.ts                  # ★ safeCompare, hashSecret, tokens
│   ├── auth/                        # ★ JWT, password, cookies, guards (prompt 4.1)
│   ├── i18n.ts
│   ├── json-ld.ts
│   ├── resend.ts
│   ├── seo.ts
│   ├── site.ts
│   ├── utils.ts
│   └── validators.ts              # contactFormSchema + escapeHtml
│
├── scripts/
│   ├── generate-blog-articles.mjs
│   └── blog-content-data.mjs
│
├── public/                        # Minimal SVGs
├── docs/                          # Product & engineering documentation
├── wordpress-plugin/              # ★ WordPress connector plugin (8.9)
│   └── rankboost-connector/
│       ├── rankboost-connector.php
│       └── README.md
├── prisma/
│   ├── schema.prisma                # ★ Core SaaS models (prompt 3.1)
│   └── seed.ts
├── prisma.config.ts                 # Prisma 7 CLI datasource URL
├── middleware.ts                  # Locale routing: / → /ru
├── next.config.ts
├── package.json
└── tsconfig.json
```

### Статистика (июнь 2026)

| Метрика | Значение |
|---------|----------|
| SSG-страниц | ~87 |
| API routes | 6 (`contact` + 5 auth) |
| Локали | ru, et, en |
| Client components | ~17 файлов |
| Dashboard shell | `/app` (public demo) |
| Prisma / Stripe | schema ready · **Auth lib** ✅ (no API yet) |

---

## 3. Зоны репозитория

### 3.1. Marketing site (существует, production)

| Путь | URL | Описание |
|------|-----|----------|
| `app/[locale]/**` | `/ru`, `/et`, `/en`, … | Все маркетинговые страницы |
| `components/sections/**` | — | Hero, Pricing, CTA, Process, … |
| `components/layout/Header.tsx`, `Footer.tsx` | — | Marketing shell |
| `components/blog/**` | `/[locale]/blog` | Блог |
| `components/forms/ContactForm*` | `/[locale]/contact` | Lead form |
| `data/**` (кроме будущих billing maps) | — | Static content |
| `i18n/dictionaries/**` | — | UI strings (marketing) |
| `lib/seo.ts`, `lib/json-ld.ts`, `lib/i18n.ts` | — | SEO & i18n |
| `app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx` | `/sitemap.xml`, … | SEO infra |
| `middleware.ts` | — | Locale redirects + `/app`, `/login`, `/register` bypass |

### 3.2. Shared (существует, расширяется осторожно)

| Путь | Правило |
|------|---------|
| `components/ui/**` | Добавлять новые файлы; не ломать button/input API |
| `app/globals.css` | Append CSS variables; не менять `.glass-card` без причины |
| `lib/validators.ts` | Новые schemas рядом; `contactFormSchema` не менять без нужды |
| `lib/resend.ts` | Расширять для transactional email позже |
| `lib/env.ts` | **Все новые сервисы** читают env через `getServerEnv()` / `getRequiredEnv()` |
| `lib/errors.ts` | **Все новые API routes** возвращают ошибки через `AppError` + `createErrorResponse()` |
| `lib/security.ts` | Общие crypto helpers для API keys, tokens, timing-safe compare |
| `lib/utils.ts` | Stable |
| `app/layout.tsx` | Минимальные изменения (consent wrapper — позже) |

### 3.3. Документация

| Путь | Назначение |
|------|------------|
| `docs/Product-Bible.md` | Продуктовая правда |
| `docs/System-Architecture.md` | Техническая архитектура |
| `docs/User-Flows.md` | UX-сценарии |
| `docs/Database-Model.md` | Логическая модель БД |
| `docs/API-Design.md` | REST API spec |
| `docs/MVP-Build-Plan.md` | 51 промпт разработки |
| `docs/MASTER-BUILD-PLAN.md` | **Точка входа перед кодом** |
| `docs/Integration-Roadmap.md` | Как встраивать SaaS без поломки лендинга |
| `docs/Current-Code-Audit.md` | Аудит текущего кода |
| `docs/engineering/REPO-MAP.md` | Этот файл |

---

## 4. Планируемые SaaS-зоны (ещё не созданы)

Все пути ниже — **целевые**. Создавать по `docs/MVP-Build-Plan.md` и `docs/Integration-Roadmap.md`.

### 4.1. Public audit

| Путь | URL | Статус |
|------|-----|--------|
| `app/audit/page.tsx` | `/audit` | ✅ Public free audit UI (prompt 6.2) |
| `app/api/audit/preview/route.ts` | `POST /api/audit/preview` | ✅ Stateless preview API (prompt 6.1) |
| `components/audit/**` | — | ✅ Form, loading, score, issues (prompt 6.2) |
| `lib/audit/preview-response.ts` | — | ✅ API response builder (prompt 6.1) |
| `lib/audit/persist-preview.ts` | — | ✅ Preview token create/consume (prompt 6.3) |
| `lib/audit/persist-audit.ts` | — | ✅ Dashboard audit rerun persist (prompt 6.5) |
| `lib/audit/generate-tasks.ts` | — | ✅ AuditCheck → Task generation (prompt 6.6) |
| `app/api/websites/[websiteId]/audits/run/route.ts` | `POST /api/websites/:id/audits/run` | ✅ Re-run audit from dashboard (6.5) |
| `lib/audit/client-messages.ts` | — | ✅ UI labels + error messages (prompt 6.2) |
| `app/audit/[auditId]/page.tsx` | `/audit/:id` | ⏳ Saved report (future) |
| `lib/auth/preview-token.ts` | — | ⏳ Signed preview tokens (future) |

> **`/audit`** — публичная страница **вне** `app/[locale]/`, без locale prefix.  
> Preview token (6.3): `AuditPreviewToken` хранит результат 24ч; при регистрации создаётся Audit + checks + snapshot.  
> **Повторные аудиты (6.5):** каждый rerun создаёт **новый** `Audit` + `AuditCheck[]` + `GrowthScoreSnapshot`; старые записи **не перезаписываются и не удаляются**.  
> Fallback: без DB preview работает stateless (`previewToken: null`).  
> CTA ведёт на `/register?website=…&previewToken=…`.

### 4.2. Auth

| Планируемый путь | URL | Статус |
|------------------|-----|--------|
| `lib/auth/password.ts` | — | ✅ bcrypt hash/verify (prompt 4.1) |
| `lib/auth/tokens.ts` | — | ✅ JWT access/refresh via jose (prompt 4.1) |
| `lib/auth/cookies.ts` | — | ✅ httpOnly `rb_refresh` cookie (prompt 4.1) |
| `lib/auth/current-user.ts` | — | ✅ Bearer guards + Prisma lookup (prompt 4.1) |
| `lib/auth/types.ts`, `mappers.ts`, `index.ts` | — | ✅ (prompt 4.1) |
| `app/api/auth/register/route.ts` | `POST /api/auth/register` | ✅ (prompt 4.2) |
| `app/api/auth/login/route.ts` | `POST /api/auth/login` | ✅ (prompt 4.2) |
| `app/api/auth/logout/route.ts` | `POST /api/auth/logout` | ✅ (prompt 4.2) |
| `app/api/auth/refresh/route.ts` | `POST /api/auth/refresh` | ✅ (prompt 4.2) |
| `app/api/auth/me/route.ts` | `GET /api/auth/me` | ✅ (prompt 4.2) |
| `lib/validators/auth.ts` | — | ✅ register/login schemas (prompt 4.2) |
| `lib/auth/responses.ts`, `service.ts`, … | — | ✅ (prompt 4.2) |
| `lib/auth/client-session.ts` | — | ✅ access token + `authFetch` (prompt 4.3) |
| `app/login/page.tsx` | `/login` | ✅ (prompt 4.3) |
| `app/register/page.tsx` | `/register` | ✅ (prompt 4.3) |
| `components/auth/AuthCard.tsx`, `LoginForm.tsx`, … | — | ✅ (prompt 4.3) |
| `components/auth/AuthSessionProvider.tsx` | — | ✅ client-side `/app` guard (prompt 4.3) |

> Auth routes **вне** `app/[locale]/` — без locale prefix.  
> **`/app` guard:** client-side via `AuthSessionProvider` + `/api/auth/me` (MVP; harden before production).  
> **Правило:** все auth API routes используют `lib/auth/*` helpers.  
> **Правило:** refresh token — **только** httpOnly cookie `rb_refresh`; access token — localStorage (MVP, TODO harden).

### 4.3. Dashboard

| Планируемый путь | URL | Статус |
|------------------|-----|--------|
| `app/app/layout.tsx` | `/app` | ✅ App shell + auth + overview provider (6.4) |
| `app/app/page.tsx` | `/app` | ✅ Real user data v1 (prompt 6.4) |
| `app/api/dashboard/overview/route.ts` | `GET /api/dashboard/overview` | ✅ Authenticated overview API (6.4) |
| `lib/dashboard/overview.ts` | — | ✅ `getDashboardOverview()` + `growthHistory` (6.4, 6.8) |
| `components/dashboard/GrowthHistoryCard.tsx` | — | ✅ Growth Score history chart (6.8) |
| `lib/tasks/task-actions.ts` | — | ✅ `completeTask`, `dismissTask` (6.7) |
| `app/api/tasks/[taskId]/complete/route.ts` | `POST /api/tasks/:id/complete` | ✅ Mark task done (6.7) |
| `app/api/tasks/[taskId]/dismiss/route.ts` | `POST /api/tasks/:id/dismiss` | ✅ Hide task (6.7) |
| `app/app/**` | `/app/*` | ⏳ Sub-routes (tasks, billing, …) |
| `components/dashboard/**` | — | ✅ UI + task actions + Growth History (6.4–6.8) |
| `components/layout/AppSidebar.tsx`, `AppHeader.tsx` | — | ✅ App shell layout (real website URL, 6.4) |

> `/app` — **client-side auth guard** + **`GET /api/dashboard/overview`** for real website, audit checks, activity, plan limits.  
> Кнопка «Перепроверить сайт» → `POST /api/websites/:websiteId/audits/run` → refetch overview (6.5).  
> **Tasks (6.6):** после аудита `generateTasksFromAuditChecks` создаёт до 10 OPEN задач; dashboard показывает реальные `Task` из БД (fallback на checks).  
> **Task actions (6.7):** `TaskCard` → `POST complete` / `POST dismiss` → refetch overview; пользователь может менять только задачи своей organization (`ownerUserId`).  
> **Growth History (6.8):** overview возвращает последние 12 `GrowthScoreSnapshot`; `GrowthHistoryCard` — SVG-график без chart library.  
> После регистрации с preview token dashboard показывает сохранённый PREVIEW audit.  
> App shell **не импортирует** `components/sections/**` и marketing layout.

### 4.3.1. Content Plan v1 (prompt 7.1)

| Путь | URL | Статус |
|------|-----|--------|
| `app/app/content-plan/page.tsx` | `/app/content-plan` | ✅ Content Plan page |
| `app/api/content-plan/overview/route.ts` | `GET /api/content-plan/overview` | ✅ Authenticated API |
| `lib/content-plan/overview.ts` | — | ✅ `getContentPlanOverview()` |
| `components/dashboard/ContentPlanPage.tsx` | — | ✅ Page UI |
| `components/dashboard/ContentPlanSection.tsx` | — | ✅ Section wrapper |
| `components/dashboard/ContentIdeaCard.tsx` | — | ✅ Article/social idea card |

> Read-only v1: `MonthlyPlan`, active `Task`, draft/ready `Article`, `SocialPost` из БД. **Без AI/Hermes.**  
> Sidebar + mobile nav → `/app/content-plan`. Если `monthlyPlan` null — EmptyState про первый аудит.

### 4.3.2. Reports v1 (prompt 7.2)

| Путь | URL | Статус |
|------|-----|--------|
| `app/app/reports/page.tsx` | `/app/reports` | ✅ Reports page |
| `app/api/reports/overview/route.ts` | `GET /api/reports/overview` | ✅ Authenticated API |
| `lib/reports/overview.ts` | — | ✅ `getReportsOverview()` |
| `components/dashboard/ReportsPage.tsx` | — | ✅ Page UI |
| `components/dashboard/ReportSummaryCard.tsx` | — | ✅ Summary stat card |
| `components/dashboard/ReportActivityList.tsx` | — | ✅ Activity list |

> Read-only v1: последний аудит, Growth Score, `growthHistory`, task stats, Activity, записи `Report` из БД. **Без AI/email/PDF.**  
> Sidebar → `/app/reports` (enabled).

### 4.3.3. Integrations Hub v1 (prompt 8.1)

| Путь | URL | Статус |
|------|-----|--------|
| `app/app/integrations/page.tsx` | `/app/integrations` | ✅ Integrations page |
| `app/api/integrations/overview/route.ts` | `GET /api/integrations/overview` | ✅ Authenticated API |
| `lib/integrations/overview.ts` | — | ✅ Catalog + DB merge |
| `lib/integrations/catalog.ts` | — | ✅ Provider definitions |
| `components/integrations/**` | — | ✅ Card, grid, badge, timeline, action sheet (8.2) |

> GSC OAuth (8.3): connect → Google → callback → `Integration` CONNECTED + encrypted tokens.  
> `Integration` table → `connected` / `status` / sync timestamps. **Без импорта данных GSC.**

### 4.3.4. Integration Action UX (prompt 8.2)

| Путь | Статус |
|------|--------|
| `components/integrations/IntegrationActionSheet.tsx` | ✅ Sheet при Connect / Manage / Coming Soon |
| `components/integrations/IntegrationBenefitList.tsx` | ✅ Польза интеграции простым языком |
| `components/integrations/IntegrationComingSoonForm.tsx` | ✅ Локальная форма «уведомить меня» |
| `lib/integrations/provider-details.ts` | ✅ Benefits, data, actions, risk, connection path |

> **UI-only (кроме GSC):** кнопки открывают sheet; GSC CTA «Connect Google» → реальный OAuth (8.3).  
> Coming soon → форма email с локальным success state.

### 4.3.5. Google Search Console OAuth (prompt 8.3)

| Путь | URL / роль | Статус |
|------|------------|--------|
| `app/api/integrations/google/connect/route.ts` | `GET` → redirect Google | ✅ |
| `app/api/integrations/google/callback/route.ts` | `GET` → tokens + DB | ✅ |
| `lib/google/oauth.ts` | `buildGoogleOAuthUrl`, `exchangeCodeForTokens`, `getGoogleUser` | ✅ |
| `lib/google/config.ts` | OAuth env resolution | ✅ |
| `lib/security/encryption.ts` | AES-256-GCM для tokens | ✅ |
| `lib/integrations/gsc-connect.ts` | upsert `Integration` | ✅ |
| `lib/auth/session-user.ts` | auth через refresh cookie для redirect | ✅ |

**OAuth Flow:**

```
/app/integrations → Connect Google
  → GET /api/integrations/google/connect?websiteId=…
  → Google consent (openid, email, profile, webmasters.readonly)
  → GET /api/integrations/google/callback?code&state
  → encrypt tokens → Integration CONNECTED
  → redirect /app/integrations?connected=gsc
```

> Токены в `accessTokenEncrypted` / `refreshTokenEncrypted` (AES-256-GCM).  
> **Не сделано (8.3):** GSC data sync, disconnect, token refresh cron.

### 4.3.6. GSC Property Picker (prompt 8.4)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/google/search-console.ts` | `getSearchConsoleSites` → Google Webmasters API | ✅ |
| `lib/integrations/gsc-context.ts` | resolve website + connected integration + decrypt token | ✅ |
| `lib/integrations/gsc-property.ts` | `selectGscSearchConsoleSite` → `GoogleIntegrationData` | ✅ |
| `lib/integrations/gsc-types.ts` | client-safe API types | ✅ |
| `GET /api/integrations/google/search-console/sites` | list properties + `selectedSiteUrl` | ✅ |
| `POST /api/integrations/google/search-console/select-site` | validate + upsert property | ✅ |
| `components/integrations/GoogleSearchConsolePropertyPicker.tsx` | UI picker in Action Sheet | ✅ |

**Flow:** GSC CONNECTED → sheet → load sites from Google → user selects property →  
`GoogleIntegrationData.searchConsoleSiteUrl` saved → overview `selectedProperty` updated.

> **Не сделано:** clicks/impressions import, refresh token, cron, dashboard metrics.

### 4.3.7. GSC Manual Metrics Sync (prompt 8.5)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/google/search-console.ts` | `getSearchConsolePerformance` → Search Analytics API | ✅ |
| `lib/integrations/gsc-sync.ts` | `syncGscPerformanceForWebsite` | ✅ |
| `lib/integrations/gsc-metrics.ts` | parse `metricsJson`, date range helpers | ✅ |
| `POST /api/integrations/google/search-console/sync` | manual 28-day import | ✅ |
| `lib/dashboard/gsc-overview.ts` | GSC block for dashboard API | ✅ |
| `components/integrations/GscMetricsSummary.tsx` | metrics display | ✅ |
| `components/integrations/GoogleSearchConsoleDashboardCard.tsx` | dashboard GSC block | ✅ |

**Flow:** property selected → POST `/sync` → Google `searchAnalytics/query` (28 days) →  
`GoogleIntegrationData.metricsJson` + `Integration.lastSyncAt` + Activity `SYSTEM_NOTICE`.

> **Не сделано:** query/page breakdown, keyword table, cron, refresh token, charts, AI insights.

### 4.3.8. GSC Insights v1 (prompt 8.6)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/integrations/gsc-insights.ts` | `generateGscInsights` — rule-based, no AI | ✅ |
| `components/integrations/GscInsightsList.tsx` | explainer + insights UI | ✅ |
| `lib/dashboard/gsc-overview.ts` | `googleSearchConsole.insights[]` | ✅ |

**Rules:** impressions=0, impressions без кликов, низкий CTR, далёкие позиции, сильные позиции, clicks>20.  
Dashboard + Integration sheet показывают 3–5 выводов и блок «Что это значит».

> **Не сделано:** Task из insights, AI, keyword/page breakdown, charts, cron.

### 4.3.9. GSC → Task Bridge (prompt 8.7)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/integrations/gsc-task-generator.ts` | `generateTasksFromGscInsights` | ✅ |
| `lib/integrations/gsc-sync.ts` | auto-call после sync | ✅ |

**Flow:** GSC sync → insights → actionable insights → `Task` (OPEN, SYSTEM) + `TASK_CREATED` Activity.

| Insight code | Task |
|--------------|------|
| `low_ctr` | Улучшить заголовки страниц (HIGH) |
| `impressions_no_clicks` | Улучшить Title и Meta Description (HIGH) |
| `far_positions` | Добавить новый полезный контент (MEDIUM) |
| `no_impressions` | Начать работу над SEO (HIGH) |

Dedupe: OPEN/IN_PROGRESS с тем же `gscInsightCode` в `recommendationJson`.

> **Не сделано:** AI, Hermes, keyword analysis, content generation.

### 4.3.10. WordPress Connector Foundation (prompt 8.8)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/integrations/wordpress-connector.ts` | create/get/verify connection, ping handler | ✅ |
| `lib/integrations/wordpress-types.ts` | client-safe API types | ✅ |
| `app/api/integrations/wordpress/create-connection/route.ts` | POST — API key (auth user) | ✅ |
| `app/api/wordpress/ping/route.ts` | POST — plugin ping (`X-RankBoost-Key`) | ✅ |
| `components/integrations/WordPressConnectorPanel.tsx` | key + instructions UI | ✅ |
| `lib/integrations/overview.ts` | WordPress status/metadata in hub | ✅ |

**Flow:** user → «Создать ключ» → `WordPressConnection` PENDING → plugin ping → CONNECTED + `Integration` WORDPRESS.

**API key:** `generateToken("wp")` → plaintext **только в response create-connection**; в DB — `apiKeyHash` через `hashSecret`.

**Shared secret:** `generateToken("wpsec")` → plaintext **только при создании**; в DB — `apiSecretEncrypted` через AES-256-GCM.

**Permissions (defaults):** `canCreateDrafts: true`, `canUpdateMeta: false`, `canPublish: false`.

> **Не сделано (8.8):** publish endpoints, HMAC (`X-RankBoost-Signature`), disconnect, regenerate key, permissions UI.

### 4.3.11. WordPress Plugin Skeleton (prompt 8.9)

| Путь | Роль | Статус |
|------|------|--------|
| `wordpress-plugin/rankboost-connector/rankboost-connector.php` | Settings → RankBoost admin page, ping client | ✅ |
| `wordpress-plugin/rankboost-connector/README.md` | Install & usage docs | ✅ |

**Flow:** WP admin → save API URL + key → Check connection → `POST {api_url}/api/wordpress/ping`.

**Options:** `rankboost_api_url`, `rankboost_api_key`, `rankboost_connection_status`, `rankboost_last_ping_at`.

**Security:** `manage_options`, nonces, sanitized input, masked API key in UI (full key never shown after save).

> **Не сделано:** zip packaging, HMAC, WP categories/tags, autopilot, i18n, Gutenberg.

### 4.3.12. WordPress Draft Creation (prompt 8.10)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/integrations/wordpress-drafts.ts` | `createWordPressDraftForArticle` | ✅ |
| `app/api/articles/[articleId]/wordpress-draft/route.ts` | POST — create WP draft (auth user) | ✅ |
| `components/dashboard/WordPressDraftButton.tsx` | Content Plan CTA | ✅ |
| `wordpress-plugin/rankboost-connector/rankboost-connector.php` | REST `POST /wp-json/rankboost/v1/drafts` | ✅ |

**Flow:** Article DRAFT → RankBoost decrypts `apiSecretEncrypted` → `POST {siteUrl}/wp-json/rankboost/v1/drafts` (`X-RankBoost-Secret`) → WP draft post → Article `WORDPRESS_DRAFT_CREATED` + Activity.

**Auth split:** ping = `X-RankBoost-Key` (hash in DB); drafts = `X-RankBoost-Secret` (encrypted in DB).

> **Не сделано:** AI generation, publish, update existing post, HMAC, autopilot, categories/tags.

### 4.3.13. Article Editor v1 (prompt 8.11)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/articles/article-actions.ts` | get/update article with ownership | ✅ |
| `lib/articles/types.ts` | client-safe article types | ✅ |
| `app/api/articles/[articleId]/route.ts` | GET + PATCH | ✅ |
| `app/app/articles/[articleId]/page.tsx` | Article editor page | ✅ |
| `components/articles/ArticleEditorPage.tsx` | load + shell | ✅ |
| `components/articles/ArticleEditorForm.tsx` | edit form + actions | ✅ |
| `components/articles/ArticleStatusBadge.tsx` | status badge | ✅ |
| `components/articles/ArticleMetaPreview.tsx` | SERP snippet preview | ✅ |

**Flow:** Content Plan → `/app/articles/:id` → edit fields → Save / Approve → optional WordPress draft.

**PATCH fields:** title, slug, metaTitle, metaDescription, contentHtml, status (IDEA/DRAFT/WAITING_REVIEW/APPROVED).

**Activity:** `SYSTEM_NOTICE` on update; extra notice on APPROVED (`approvedAt` set).

> **Не сделано:** rich text editor, AI rewrite, autosave, publish, categories/tags, image upload.

### 4.3.14. Hermes Content Generation v1 (prompt 9.1)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/hermes/client.ts` | Hermes HTTP client | ✅ |
| `lib/hermes/types.ts` | payload/response types | ✅ |
| `lib/articles/generate-article.ts` | `generateArticleDraftForWebsite` | ✅ |
| `app/api/articles/generate/route.ts` | POST — generate DRAFT article | ✅ |
| `components/content-plan/GenerateArticleForm.tsx` | Content Plan + task CTA UI | ✅ |

**Flow:** Content Plan / task → `POST /api/articles/generate` → AIJob → Hermes sync → Article DRAFT + AIUsage + PlanLimit.articlesUsed++.

**Env:** `HERMES_API_URL`, `HERMES_API_SECRET` — без них `HERMES_UNAVAILABLE` (503).

**Safety:** AI создаёт только DRAFT в RankBoost; без автопубликации и без auto WordPress draft.

> **Не сделано:** streaming, background queue, auto WordPress, publish, image gen, keyword research, social posts.

### 4.3.15. AI Quality Pipeline v1 (prompt 9.2)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/hermes/article-quality.ts` | Validator + repair loop (`validateGeneratedArticle`, `repairGeneratedArticle`, `runArticleQualityPipeline`) | ✅ |
| `lib/hermes/client.ts` | `repairArticleDraft` → `POST /v1/generate/article/repair` | ✅ |
| `lib/articles/generate-article.ts` | Pipeline после Hermes generate, сохранение quality-полей | ✅ |
| `components/articles/ArticleQualityPanel.tsx` | Score, badges, замечания в Article Editor | ✅ |
| `components/dashboard/ContentIdeaCard.tsx` | Shield (green/orange) в Content Plan | ✅ |

**Flow (sync, без queue):**

```
Hermes Generate → Validator (rules) → passed? → save
                         ↓ errors
              Repair Prompt → Hermes (≤2 attempts) → Validator → save
```

**Validator (не AI):** title 30–70, meta title 30–60, meta description 110–160, content ≥900 слов, H2 ≥3, FAQ ≥3, slug, schema, CTA, keyword ≥3 (warning).

**Article fields:** `qualityScore`, `qualityPassed` (score ≥80), `qualityIssuesJson`, `qualityRepairAttempts`.

**Activity:** `ARTICLE_VALIDATED`, `ARTICLE_REPAIRED`. **AIUsage purpose:** `QUALITY_REPAIR`.

**Badges:** «Проверено RankBoost» (green, score ≥80) / «Требует проверки» (orange, score <80 after repairs).

> **Не сделано:** GPT critic, grammar AI, fact checking, background queue, streaming.

### 4.3.16. Continuous Improvement Engine v1 (prompt 9.3)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/growth/opportunities.ts` | `findGrowthOpportunities(websiteId)` — 10 rule-based rules | ✅ |
| `lib/growth/sync-opportunities.ts` | Activity dedupe + `GROWTH_OPPORTUNITY_FOUND` | ✅ |
| `lib/growth/get-opportunities.ts` | Auth wrapper for API | ✅ |
| `app/api/growth/opportunities/route.ts` | GET — growth opportunities | ✅ |
| `components/dashboard/GrowthOpportunityCard.tsx` | Dashboard card UI | ✅ |
| `components/dashboard/AppDashboardPage.tsx` | «Новые возможности» + header copy | ✅ |

**Flow (sync, без cron/queue/AI):**

```
Audit / GSC sync / Article generate / Task complete / Dashboard load
  → findGrowthOpportunities()
  → recordNewGrowthOpportunityActivities() (dedupe by stable opportunityId)
  → Dashboard Top 5
```

**Rules:** content task без статьи, completed task без follow-up audit, audit >30d, article >180d, CTR <1%, position 11–20, growth score stale 30d, no WordPress, no GSC, no published articles.

**Activity:** `GROWTH_OPPORTUNITY_FOUND` только для новых `opportunityId` (metadataJson).

> **Не сделано:** AI suggestions, auto tasks, auto articles, cron, background jobs.

### 4.3.17. Timeline / Daily Log v1 (prompt 9.4)

| Путь | Роль | Статус |
|------|------|--------|
| `prisma/schema.prisma` | `TimelineEvent`, `WebsiteUserState`, enums | ✅ |
| `lib/timeline/create-event.ts` | `createTimelineEvent` (server-only, non-blocking) | ✅ |
| `lib/timeline/get-timeline.ts` | GET list, mark-read, last seen | ✅ |
| `lib/timeline/get-daily-summary.ts` | «Пока вас не было» summary | ✅ |
| `lib/timeline/hooks.ts` | Integration hooks for audit/tasks/GSC/Hermes/WP | ✅ |
| `app/api/timeline/route.ts` | GET timeline (cursor, filters) | ✅ |
| `app/api/timeline/mark-read/route.ts` | POST mark read | ✅ |
| `components/timeline/*` | Timeline page UI | ✅ |
| `app/app/timeline/page.tsx` | `/app/timeline` | ✅ |

**Flow:** Business events → `createTimelineEvent` (dedupe) → Timeline API → Dashboard page.

**Last seen:** `WebsiteUserState.timelineLastSeenAt` — summary since last visit.

> **Не сделано:** AI-generated daily summary text, Hermes narrative, cron DAILY_SUMMARY job.

### 4.3.18. Social Posts v1 (prompt 9.5)

| Путь | Роль | Статус |
|------|------|--------|
| `prisma/schema.prisma` | Extended `SocialPost` + `SocialPostSource`, platform enums | ✅ |
| `lib/social-posts/*` | CRUD, Hermes generate, quality pipeline, source context | ✅ |
| `lib/hermes/client.ts` | `generateSocialPostDraft` → `/v1/generate/social-post` | ✅ |
| `app/api/social-posts/**` | list, create, generate, patch, archive, copy | ✅ |
| `components/social-posts/*` | Dashboard page, cards, editor, generate dialog | ✅ |
| `app/app/social-posts/page.tsx` | `/app/social-posts` | ✅ |

**Flow:** Growth data source → Hermes draft → rule-based quality → `READY`/`DRAFT` → user edit/copy (no auto-publish).

**Timeline:** `SOCIAL_POST_DRAFT_CREATED`, `SYSTEM_NOTE` on copy.

> **Не сделано:** Facebook/LinkedIn API publish, scheduling automation, email approval.

### 4.3.19. Monthly Autopilot v1 (prompt 9.6)

| Путь | Роль | Статус |
|------|------|--------|
| `prisma/schema.prisma` | `MonthlyAutopilotPlan` + `MonthlyAutopilotStatus`, timeline type | ✅ |
| `lib/autopilot/*` | Source data, deterministic plan generation, format, hooks | ✅ |
| `app/api/autopilot/monthly/**` | GET plan, POST generate, PATCH approve/edit | ✅ |
| `components/autopilot/*` | Dashboard page, metrics, focus areas, actions | ✅ |
| `app/app/autopilot/page.tsx` | `/app/autopilot` | ✅ |

**Flow:** Aggregate audit/tasks/GSC/articles/social/timeline/opportunities → deterministic monthly plan → user review/approve (no auto-execution).

**Timeline:** `MONTHLY_AUTOPILOT_PLAN_CREATED`, `SYSTEM_NOTE` on approve.

> **Не сделано:** Hermes executive summary endpoint, email digest, auto-scheduling, full autopilot execution.

### 4.3.20. Email Approval Flow v1 (prompt 9.7)

| Путь | Роль | Статус |
|------|------|--------|
| `prisma/schema.prisma` | `EmailApproval` + enums, `EMAIL_APPROVAL_CREATED` timeline type | ✅ |
| `lib/email-approvals/*` | CRUD, deterministic generation, optional Resend manual send | ✅ |
| `app/api/email-approvals/**` | list, generate, get, patch, archive, approve, send | ✅ |
| `components/email-approvals/*` | Dashboard page, cards, editor, generate dialog | ✅ |
| `app/app/email-approvals/page.tsx` | `/app/email-approvals` | ✅ |

**Flow:** Source data → deterministic email draft → user edit/approve → optional manual Resend send (no auto-send).

**Timeline:** `EMAIL_APPROVAL_CREATED`, `SYSTEM_NOTE` on approve/send.

> **Не сделано:** Scheduled digests, auto-send, Hermes email polish endpoint.

### 4.3.21. Autopilot Control Center v1 (prompt 9.8)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/autopilot-control/*` | Aggregation layer, status logic, recommended actions | ✅ |
| `app/api/autopilot-control/route.ts` | GET control center data | ✅ |
| `components/autopilot-control/*` | Dashboard command center UI | ✅ |
| `app/app/autopilot-control/page.tsx` | `/app/autopilot-control` | ✅ |

**Flow:** Aggregate monthly plan, emails, articles, social, tasks, timeline, integrations → single control view with links and safe quick actions.

> **Не сделано:** Scheduled runs, auto-send, background workers, dedicated action API.

### 4.3.22. Billing / Plans / Subscription Gate v1 (prompt 9.9)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/billing/*` | Plans config, subscription, usage, Stripe checkout/portal/webhook, feature gates | ✅ |
| `app/api/billing/subscription/route.ts` | GET billing overview | ✅ |
| `app/api/billing/checkout/route.ts` | POST Stripe Checkout | ✅ |
| `app/api/billing/portal/route.ts` | POST Stripe Customer Portal | ✅ |
| `app/api/billing/webhook/route.ts` | POST Stripe webhook (idempotent via `Payment.stripeEventId`) | ✅ |
| `components/billing/*` | Billing page, plan cards, usage, `FeatureGate` | ✅ |
| `app/app/billing/page.tsx` | `/app/billing` | ✅ |

**Flow:** Org-level `Subscription` + `PlanLimit` + `UsageCounter` → server-side gates on generation actions → Stripe sync via webhook.

> **Не сделано:** Report creation gate (no create route yet), marketing pricing sync, live Stripe products.

### 4.3.23. Onboarding v2 (prompt 10.0)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/onboarding/*` | State sync, step resolution, website create, billing-aware VM | ✅ |
| `app/api/onboarding/**` | GET state, step/skip/complete, add website | ✅ |
| `components/onboarding/*` | Guided setup UI, dashboard banner, sidebar link | ✅ |
| `app/app/onboarding/page.tsx` | `/app/onboarding` | ✅ |

**Flow:** Derive progress from real website/audit/GSC/tasks/plan data → resumable steps → optional GSC skip → complete → Control Center.

> **Не сделано:** Hard login redirect for new users (banner + Setup nav instead).

### 4.3.24. Production hardening & QA (prompt 10.1)

| Путь | Роль | Статус |
|------|------|--------|
| `lib/auth/queries.ts` | `resolveOwnedOrganization()` — JWT org hint + owner check | ✅ |
| `lib/logging.ts` | Safe server-side error logging (no secrets) | ✅ |
| `docs/engineering/PRODUCTION-QA.md` | Beta launch checklist, env, migrations, manual QA | ✅ |
| `components/layout/AppSidebar.tsx` | Nav order (Control Center after Dashboard), production footer | ✅ |

**Hardening:** Billing routes no longer trust JWT `organizationId` without ownership verification. Hermes/WordPress/Stripe webhook failures logged safely. Client billing errors show upgrade hint.

> **Pending:** ~~Initial DB migration~~ Applied on Neon dev (`production_initial`, prompt 10.3).

### 4.3.25. UX / Design consistency (prompt 10.2)

| Путь | Роль | Статус |
|------|------|--------|
| `components/shared/*` | PageHeader, PageLoadingState, PageErrorState, TrustNote | ✅ |
| `lib/copy/trust.ts` | Centralized trust/safety copy | ✅ |
| `docs/engineering/DESIGN-SYSTEM.md` | Dashboard design reference | ✅ |

**Polish:** Consistent page headers, empty/loading/error states, trust notes (AI/email/WordPress/billing), sidebar labels, Integrations copy (no auto-publish), mobile dialog fixes.

### 4.3.26. Live DB QA & beta launch fixes (prompt 10.3)

| Путь | Роль | Статус |
|------|------|--------|
| Neon **RankBoost Development** | Dev PostgreSQL (`neondb`, branch `main`) | ✅ |
| `prisma/migrations/20260701214117_production_initial/` | Initial production schema migration | ✅ applied |
| `lib/auth/saas-config.ts` | `assertSaasConfigured()` — DATABASE_URL + JWT secrets | ✅ |
| Auth routes (`register`, `login`, `refresh`, `me`) | 503 when SaaS env incomplete | ✅ |
| `lib/onboarding/resolve-onboarding.ts` | No legacy auto-complete heuristic | ✅ |
| `docs/engineering/PRODUCTION-QA.md` | Live DB QA results, blockers, checklist | ✅ |

**QA:** Full API smoke against Neon — onboarding, audit, autopilot, timeline, billing, social, email approvals. Hermes/Stripe/Resend/GSC fail gracefully when unset.

> **Не сделано:** Systematic responsive viewport QA; Vercel production deploy; Stripe/Hermes/Google OAuth prod secrets.

### 4.3.27. Production Neon + Vercel deploy prep (prompt 10.5)

| Item | Status |
|------|--------|
| Git push `main` → `origin` | ✅ (`246ff20`) |
| Neon **RankBoost Production** | ✅ `wandering-sea-76656755`, region `aws-us-west-2` |
| Dev/prod DB separation | ✅ separate projects |
| `prisma migrate deploy` on production | ✅ `20260701214117_production_initial` |
| Vercel project **seo** | ✅ linked (`prj_xHiSv8d9WV7MBjs7KkQUfS8lNRX1`) |

### 4.3.28. Vercel Production env (prompt 10.5.1)

| Item | Status |
|------|--------|
| Vercel Production `DATABASE_URL` | ✅ Neon pooled (RankBoost Production) |
| Generated secrets (JWT, ENCRYPTION_KEY, WP) | ✅ via Vercel CLI |
| Public URLs (`NEXT_PUBLIC_*`) | ✅ `https://rankboost.eu` |
| `GOOGLE_REDIRECT_URI` | ✅ configured |
| External secrets (Google, Stripe, Hermes) | ⏸ manual |
| Production deploy | ✅ Prompt 10.6 (`www.rankboost.eu`) |

### 4.3.29. Vercel deploy + production smoke test (prompt 10.6)

| Item | Status |
|------|--------|
| Vercel production deploy (latest) | ✅ `dpl_Bv3dsj9NewVMbvhDfm7BDSwQQQ3X` (**2026-07-05**, commit `db724f8`) |
| Prior deploy | `dpl_3Nx2aicKvxjxXtNPmntZNRyg2ixh` (2026-07-02) |
| Build fix | ✅ `prisma generate && next build` |
| Production smoke test | ✅ API + simplified dashboard against Neon Production |
| QA users | `qa-prod@rankboost.test`, `qa-prod-2@rankboost.test` |
| External integrations | ⏸ Google/Stripe/Hermes — secrets not in repo; manual Vercel setup required |

### 4.3.30. Production integrations QA (prompt 10.7)

| Item | Status |
|------|--------|
| `GOOGLE_REDIRECT_URI` → www callback | ✅ |
| `NEXT_PUBLIC_*` → www | ✅ |
| `RESEND_FROM_EMAIL` | ✅ |
| Google OAuth client secrets | ❌ manual blocker |
| Stripe keys + webhook | ❌ manual blocker |
| Hermes URL/secret | ❌ manual blocker |
| Integration QA (live) | ✅ graceful fallbacks verified |
| Deploy after env update | ✅ `dpl_32ppF92McERS6aTCSnTFaFj3uipq` |

### 4.4. Admin

| Планируемый путь | URL | MVP блок |
|------------------|-----|----------|
| `app/admin/**` | `/admin/*` | 21 |
| `components/admin/**` | — | 21 |
| `app/api/admin/**` | `/api/admin/*` | 21 |

### 4.5. API (расширение)

```
app/api/
  contact/route.ts          ← СУЩЕСТВУЕТ — не ломать contract
  auth/                     ← ADD
  audit/                    ← ADD
  dashboard/                ← ADD (overview)
  billing/                  ← ADD
  webhooks/stripe/          ← ADD
  hermes/callback/          ← ADD
  integrations/             ← ADD
  cron/                     ← ADD
```

### 4.6. Services (business logic)

| Планируемый путь | Назначение |
|------------------|------------|
| `lib/services/audit-service.ts` | Preview & full audit |
| `lib/services/auth-service.ts` | Register, login, sessions |
| `lib/services/billing-service.ts` | Stripe, PlanLimit |
| `lib/services/task-service.ts` | AI Tasks |
| `lib/services/score-service.ts` | Growth Score |
| `lib/services/content-service.ts` | Articles, plans |
| `lib/services/integration-service.ts` | Google OAuth |
| `lib/services/email-service.ts` | Reports |

**Системные utilities (созданы, промпт 1.2):**

| Путь | Назначение |
|------|------------|
| `lib/env.ts` | Env validation (Zod); `getServerEnv()`, `getRequiredEnv()` |
| `lib/errors.ts` | `AppError`, `createErrorResponse()` — формат `docs/API-Design.md` |
| `lib/security.ts` | `safeCompare`, `hashSecret`, `generateToken` |

**Правила для нового кода:**

- Новые **сервисы** (`lib/services/*`) читают env только через `lib/env.ts`.
- Новые **API routes** возвращают ошибки через `AppError` + `createErrorResponse()` (не ad-hoc JSON).
- Существующий `POST /api/contact` не менять до отдельного рефакторинга.

### 4.7. Database (core schema — промпт 3.1)

| Путь | Статус | Назначение |
|------|--------|------------|
| `prisma/schema.prisma` | ✅ MVP complete | All Database-Model entities for MVP |
| `prisma.config.ts` | ✅ | Prisma 7 CLI — `DATABASE_URL` для migrate/validate |
| `prisma/migrations/` | ⏳ | Создаётся при `prisma:migrate:dev` |
| `prisma/seed.ts` | ✅ | Dev seed (core + audit + content demo) |
| `lib/db.ts` | ✅ | Prisma client singleton (`@prisma/adapter-pg`) |

**Модели в schema (3.1):** `User`, `Organization`, `Website`, `Subscription`, `Payment`, `PlanLimit`

**Модели в schema (3.2):** `Audit`, `AuditCheck`, `GrowthScoreSnapshot`, `AIReadinessSnapshot`, `Activity`

**Модели в schema (3.3):** `Task`, `MonthlyPlan`, `PlanItem`, `Article`, `SocialPost`, `Report`, `Integration`, `GoogleIntegrationData`, `WordPressConnection`, `AIJob`, `AIUsage`, `EmailLog`, `AdminNote`, `ErrorLog`

**MVP data model:** ✅ complete (prompt 3.3)

**Правила schema:**

- Изменения `prisma/schema.prisma` — **только через отдельный production prompt**.
- **Soft delete** для `User`, `Organization`, `Website`, `Subscription`, `Task`, `Article`, `SocialPost`, `AdminNote`.
- `GrowthScoreSnapshot` / `AIReadinessSnapshot` — **append-only** (без `updatedAt`).
- **Secrets/tokens** — только `*Encrypted` / `*Hash`; **никогда plaintext** в DB.
- **AIUsage** — при каждом платном AI-вызове (`costCents`, `purpose`, link to `AIJob`).
- **ErrorLog** — критичные сбои; **не** для routine `VALIDATION_ERROR`.
- `Activity` — значимые события; **не** каждый UI-клик.
- `Payment` / `PlanLimit` — без soft delete (period/immutable records).
- Не импортировать `lib/db.ts` из `app/[locale]/**`.

### 4.8. Integrations

| Планируемый путь | Назначение |
|------------------|------------|
| `lib/google/**` | GSC, GA4, GBP OAuth & sync |
| `app/api/integrations/**` | OAuth callbacks, data |

### 4.9. WordPress plugin

| Путь | Назначение | Статус |
|------|------------|--------|
| `wordpress-plugin/rankboost-connector/` | MVP skeleton + draft REST endpoint (8.9–8.10) | ✅ |
| `app/api/wordpress/**` | Server-side connector API (8.8) | ✅ |

> Плагин — отдельный релизный цикл; не смешивать с marketing build. Skeleton без draft creation.

### 4.10. Hermes client

| Путь | Назначение | Статус |
|------|------------|--------|
| `lib/hermes/client.ts` | HTTP client — article generation (9.1) | ✅ |
| `lib/hermes/types.ts` | Payload/response types | ✅ |
| `app/api/hermes/callback/route.ts` | Webhook от Hermes | ⏳ |

> Hermes — **внешний сервис** (Railway/Fly). v9.1: sync `POST /v1/generate/article`; callback queue — позже.

---

## 5. Папки и файлы: нельзя трогать без отдельного промпта

Согласно `docs/MVP-Build-Plan.md` (глобальные ограничения) и `docs/Integration-Roadmap.md`:

| Путь | Причина |
|------|---------|
| `data/blog/posts/**` | 66 SEO-статей; merge hell |
| `scripts/generate-blog-articles.mjs` | Генератор блога |
| `app/[locale]/**` | Production pages — только явные промпты (блок 5+) |
| `components/sections/**` | Marketing UI — только блок 5 (CTA) |
| `app/api/contact/route.ts` | Рабочий lead flow — freeze contract |
| `middleware.ts` | До промпта 2.1 — только read; additive `/app` bypass в 2.1 |
| `package.json` | До промпта 1.2 — не менять |

**На шаге 1.1 (текущий):** не менять `app/**`, `components/**`, `lib/**`, `data/**`, `middleware.ts`, `package.json`.

---

## 6. Правила безопасной интеграции

### 6.1. Три правила

1. **Существующее — не трогать**, пока промпт явно не разрешает.
2. **Новое — только в новых папках** (`app/app/`, `app/api/auth/`, `lib/services/`, …).
3. **Общее — расширять**, не переписывать (`lib/validators.ts` → новый export, не refactor contact).

### 6.2. Middleware (будущее)

Порядок веток важен:

1. Bypass static / API (как сейчас)
2. `/app`, `/admin`, `/audit`, `/login`, `/register` — **без locale**
3. Существующая locale-логика для `/ru`, `/et`, `/en`

Marketing paths **никогда** не должны проходить через app auth handlers.

### 6.3. i18n

- Marketing: `app/[locale]/` + `i18n/dictionaries/*.ts`
- Dashboard: `/app` без locale prefix; строки — append `dashboard.*` keys или `i18n/dashboard/`
- **Не переименовывать** существующие dictionary keys

### 6.4. Pricing dual-source (будущее)

- Marketing display: `data/pricing.ts` (start, local-boost, growth, partner)
- Stripe truth: `lib/billing/plans.ts` (start, growth, pro, audit)
- Mapping layer — до live Stripe

### 6.5. PR discipline

- Один MVP-блок = один PR
- Не смешивать Hero changes (блок 5) и dashboard (блок 11)
- После каждого merge — checklist §8

---

## 7. Команды после каждого шага

### Обязательные (каждый PR)

```bash
npm run lint
npm run build
```

### Рекомендуемые (после шагов с UI/API)

```bash
npm run dev
# Manual smoke — см. §8
```

### Будущие (после промпта 1.2+)

```bash
npm run prisma:validate   # skip until prisma/schema.prisma exists (step 3.1)
npm run prisma:generate
npx prisma migrate dev
npx prisma generate
```

### Production deploy (Vercel)

```bash
npm run build   # автоматически на Vercel при push
```

---

## 8. Как проверить, что лендинг не сломан

### 8.1. Автоматические проверки

| Проверка | Ожидание |
|----------|----------|
| `npm run lint` | Exit 0, без errors |
| `npm run build` | Exit 0; ~87+ static pages |
| Build output | `app/[locale]/*` routes listed as SSG |

### 8.2. Ручной smoke (после `npm run dev`)

| URL | Проверка |
|-----|----------|
| `http://localhost:3000/` | Redirect → `/ru` |
| `/ru`, `/et`, `/en` | Home: Hero, Pricing section, Footer |
| `/ru/pricing` | 4 pricing cards + comparison |
| `/ru/contact` | Form visible, submit (если RESEND_API_KEY) |
| `/ru/blog` | List of articles |
| `/ru/blog/seo-prodvizhenie-v-estonii` | Article renders |
| `/sitemap.xml` | Contains locale alternates |
| `/robots.txt` | 200 OK |

### 8.3. API smoke

```bash
# Должен вернуть 400, не 500
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" -d '{}'
# Ожидание: 400
```

### 8.4. Чеклист перед merge

- [ ] `npm run lint` — pass
- [ ] `npm run build` — pass
- [ ] `/ru`, `/et`, `/en` — home OK
- [ ] Contact form не сломан (если трогали API/shared lib)
- [ ] Нет случайных изменений в `data/blog/posts/**`
- [ ] `middleware.ts` — не изменён без явного промпта

---

## 9. Фазы интеграции (краткая ссылка)

| Фаза | MVP блоки | Трогает marketing? |
|------|-----------|-------------------|
| **0** (текущий) | 1.1 REPO-MAP | Нет |
| 1 | 1.2, 2.x, 3.x | Нет (кроме globals.css vars) |
| 2 | 4.x Auth | Нет |
| 3 | 5.x Landing CTA | **Да** (Hero, Header) |
| 4+ | 6–24 | По Integration-Roadmap |

Полная карта: `docs/Integration-Roadmap.md`.

---

## 10. Changelog

| Дата | Версия | Изменение |
|------|--------|-----------|
| 2026-06-29 | 1.0 | Initial REPO-MAP — промпт 1.1 |
| 2026-06-29 | 1.1 | `lib/env.ts`, `lib/errors.ts`, `lib/security.ts` — промпт 1.2 |
| 2026-06-29 | 1.2 | Prisma core schema (6 models), `lib/db.ts`, `prisma/seed.ts` — промпт 3.1 |
| 2026-06-29 | 1.3 | Audit, AuditCheck, snapshots, Activity — промпт 3.2 |
| 2026-06-29 | 2.0 | Full MVP data model (content, integrations, AI, admin) — промпт 3.3 |
| 2026-06-29 | 2.1 | Dashboard UI primitives + `/app` shell (demo preview) — промпт 2.1 |
| 2026-06-29 | 4.1 | Auth foundation (`lib/auth/*`) — JWT, password, cookies, guards — промпт 4.1 |
| 2026-06-29 | 4.2 | Auth API routes (register, login, logout, refresh, me) — промпт 4.2 |
| 2026-06-29 | 8.8 | WordPress Connector Foundation — API key, ping, hub UI — промпт 8.8 |
| 2026-06-29 | 8.9 | WordPress Plugin Skeleton — admin settings + ping client — промпт 8.9 |
| 2026-06-29 | 8.10 | WordPress Draft Creation — shared secret + REST drafts + Content Plan CTA — промпт 8.10 |
| 2026-06-29 | 8.11 | Article Editor v1 — GET/PATCH article + editor UI — промпт 8.11 |
| 2026-06-29 | 9.1 | Hermes Content Generation v1 — sync article draft generation — промпт 9.1 |
| 2026-06-29 | 9.2 | AI Quality Pipeline v1 — rule validator + Hermes repair loop — промпт 9.2 |
| 2026-06-29 | 9.3 | Continuous Improvement Engine v1 — rule-based growth opportunities — промпт 9.3 |
| 2026-06-29 | 9.4 | Timeline / Daily Log — growth activity feed + «Пока вас не было» — промпт 9.4 |
| 2026-06-29 | 9.5 | Social Posts — Hermes drafts + quality pipeline + dashboard — промпт 9.5 |
| 2026-06-29 | 10.1 | Production hardening — ownership, logging, PRODUCTION-QA.md — промпт 10.1 |
| 2026-06-29 | 10.2 | UX / design consistency — shared components, DESIGN-SYSTEM.md — промпт 10.2 |
| 2026-07-01 | 10.3 | Live DB QA — Neon dev, production_initial migration, saas-config, PRODUCTION-QA — промпт 10.3 |
| 2026-07-01 | 10.4 | Commit hygiene — schema, SaaS backend/UI, integrations, docs — промпт 10.4 |
| 2026-07-01 | 10.5 | Production Neon + Vercel deploy prep — prod DB, migrate deploy, env checklist — промпт 10.5 |
| 2026-07-01 | 10.5.1 | Vercel Production env — Neon pooled DATABASE_URL, generated secrets — промпт 10.5.1 |
| 2026-07-02 | 10.6 | Vercel deploy + production smoke test — промпт 10.6 |
| 2026-07-05 | 10.6 | Redeploy + smoke test after dashboard simplification (`db724f8`, `dpl_Bv3dsj9NewVMbvhDfm7BDSwQQQ3X`) |
| 2026-07-02 | 10.7 | Production integrations QA — www URLs, Resend alias, blocked secrets documented — промпт 10.7 |
