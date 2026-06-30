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
│   │   └── page.tsx               # Demo preview (static)
│   ├── login/page.tsx             # ★ Auth UI (prompt 4.3)
│   ├── register/page.tsx          # ★ Auth UI (prompt 4.3)
│   ├── audit/page.tsx             # ★ Public free audit UI (prompt 6.2)
│   └── api/
│       ├── contact/route.ts       # ★ Marketing API (Resend lead form)
│       ├── audit/preview/route.ts # ★ Public preview audit API (prompt 6.1)
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
| `lib/audit/client-messages.ts` | — | ✅ UI labels + error messages (prompt 6.2) |
| `app/audit/[auditId]/page.tsx` | `/audit/:id` | ⏳ Saved report (future) |
| `lib/auth/preview-token.ts` | — | ⏳ Signed preview tokens (future) |

> **`/audit`** — публичная страница **вне** `app/[locale]/`, без locale prefix.  
> Preview token (6.3): `AuditPreviewToken` хранит результат 24ч; при регистрации создаётся Audit + checks + snapshot.  
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
| `lib/dashboard/overview.ts` | — | ✅ `getDashboardOverview()` (6.4) |
| `app/app/**` | `/app/*` | ⏳ Sub-routes (tasks, billing, …) |
| `components/dashboard/**` | — | ✅ UI primitives + real data page (6.4) |
| `components/layout/AppSidebar.tsx`, `AppHeader.tsx` | — | ✅ App shell layout (real website URL, 6.4) |

> `/app` — **client-side auth guard** + **`GET /api/dashboard/overview`** for real website, audit checks, activity, plan limits.  
> После регистрации с preview token dashboard показывает сохранённый PREVIEW audit.  
> App shell **не импортирует** `components/sections/**` и marketing layout.

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

| Планируемый путь | Назначение |
|------------------|------------|
| `wordpress/rankboost-connector/` | **Отдельный track** — plugin repo или monorepo subfolder (MVP блок 18) |
| `app/api/wordpress/**` | Server-side connector API |

> Плагин — отдельный релизный цикл; не смешивать с marketing build.

### 4.10. Hermes client

| Планируемый путь | Назначение |
|------------------|------------|
| `lib/hermes/client.ts` | HTTP client к Hermes worker |
| `lib/hermes/types.ts` | Job types, callbacks |
| `app/api/hermes/callback/route.ts` | Webhook от Hermes |

> Hermes — **внешний сервис** (Railway/Fly); не в этом репозитории как worker.

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
| 2026-06-29 | 4.3 | Auth UI (`/login`, `/register`) + client `/app` guard — промпт 4.3 |
