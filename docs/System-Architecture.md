# System Architecture — RankBoost.eu

> Главный технический документ проекта.
> RankBoost — AI Growth Platform для малого бизнеса (коммерческий MVP SaaS).
>
> **Версия:** 1.0 · Июнь 2026  
> **Связанные документы:** [Product-Bible.md](./Product-Bible.md)  
> **Аудитория:** Senior Developer, Architect, DevOps

---

## Состояние проекта

| Слой | Сейчас (репозиторий) | Целевое состояние (MVP) |
|---|---|---|
| Frontend | Маркетинговый лендинг (RU/ET/EN) | Лендинг + Auth + Dashboard + Admin |
| Backend | Один API-route (контактная форма) | Полноценный API-слой + сервисы |
| Database | Нет | PostgreSQL (основное хранилище) |
| Hermes | Нет | Отдельный AI-worker сервис |
| Queue | Нет | Redis + worker processes |
| Billing | Нет | Stripe |
| Integrations | Нет | Google OAuth, WordPress Plugin |

Этот документ описывает **целевую архитектуру MVP**. Текущий лендинг остаётся публичным слоем и расширяется, а не переписывается.

---

## 1. Общая архитектура

### 1.1. Высокоуровневая схема

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              КЛИЕНТЫ                                        │
│  Браузер (Desktop / Mobile)          WordPress (Plugin)                     │
└───────────────┬──────────────────────────────────────┬──────────────────────┘
                │ HTTPS                                │ HTTPS (API Key)
                ▼                                      ▼
┌───────────────────────────────┐      ┌──────────────────────────────────────┐
│         FRONTEND              │      │         BACKEND (RankBoost API)       │
│  Next.js 16 · App Router      │◄────►│  Orchestrator + Domain Services       │
│  ─────────────────────────    │      │  ────────────────────────────────   │
│  · Marketing (лендинг)        │      │  · Auth Service                     │
│  · App (дашборд)              │      │  · Audit Service                    │
│  · Admin Panel                │      │  · Task Service                     │
│                               │      │  · Growth Score Service             │
│                               │      │  · AI / Content Service             │
│                               │      │  · Billing Service                  │
│                               │      │  · Integration Service              │
│                               │      │  · Email Service                    │
│                               │      │  · Report Generator                 │
│                               │      │  · Content Planner                  │
└───────────────────────────────┘      └───────────┬──────────────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────┐
                    │                              │                          │
                    ▼                              ▼                          ▼
         ┌──────────────────┐         ┌──────────────────┐       ┌──────────────────┐
         │    DATABASE      │         │      QUEUE       │       │     HERMES       │
         │   PostgreSQL     │         │  Redis + Workers │       │  AI-worker API   │
         │                  │         │                  │       │                  │
         │  Users, Sites,   │         │  Audits, Content,│       │  LLM, Crawler,   │
         │  Audits, Tasks,  │         │  Reports, Sync   │       │  Scoring, NLP    │
         │  Subscriptions   │         │                  │       │                  │
         └──────────────────┘         └──────────────────┘       └──────────────────┘
                    │                              │                          │
                    └──────────────────────────────┼──────────────────────────┘
                                                   │
         ┌─────────────────┬───────────────────────┼───────────────┬─────────────────┐
         ▼                 ▼                       ▼               ▼                 ▼
  ┌────────────┐   ┌────────────┐         ┌────────────┐  ┌────────────┐   ┌────────────┐
  │   Stripe   │   │   Resend   │         │   Google   │  │  WordPress │   │   Cron     │
  │  Billing   │   │   Email    │         │   OAuth    │  │   Sites    │   │ Scheduler  │
  │  Webhooks  │   │  Delivery  │         │  GSC·GA·GBP│  │  (клиенты) │   │ (Vercel /  │
  └────────────┘   └────────────┘         └────────────┘  └────────────┘   │  external) │
                                                                            └────────────┘
```

### 1.2. Frontend

**Роль:** единая точка входа для маркетинга, продукта и администрирования.

| Зона | Назначение | Доступ |
|---|---|---|
| Marketing | Лендинг, блог, тарифы, бесплатный аудит | Публичный |
| App (Dashboard) | Личный кабинет клиента | Авторизованный user |
| Admin Panel | Управление платформой | role: admin / support / analyst |

**Технологии:** Next.js 16, App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion.

**Принципы:**
- Server Components для SEO-страниц и начальной загрузки.
- Client Components для интерактивного дашборда.
- API Routes / Server Actions как BFF-слой к backend-сервисам.
- i18n: RU (default), ET, EN.

**Хостинг:** Vercel (edge middleware для локализации, serverless functions для API).

### 1.3. Backend

**Роль:** оркестратор бизнес-логики. Клиент и WordPress Plugin общаются только с RankBoost API, не с Hermes напрямую.

**Структура:** модульный монолит в рамках Next.js API + выделенные worker-процессы для очереди. На этапе 1000+ клиентов — возможность вынести Hermes и workers в отдельные сервисы без смены контрактов.

**Границы ответственности:**
- Валидация, авторизация, rate limiting — Backend.
- Тяжёлый AI, краулинг, скоринг — Hermes.
- Персистентность — Database.
- Асинхронные операции — Queue.

### 1.4. Database

**Роль:** единый источник правды для пользователей, сайтов, подписок, аудитов, задач, контента, интеграций, метрик.

**СУБД:** PostgreSQL (Neon / Supabase / RDS — managed).

**Принципы:**
- Нормализованная схема для транзакционных данных.
- JSONB для гибких результатов аудита и Hermes-ответов.
- Отдельные таблицы истории для Growth Score и Activity (append-only).
- Шифрование чувствительных полей на уровне приложения (OAuth tokens, API keys).

**Кэш:** Redis — сессии, rate limits, очередь, hot-read кэш (последний audit summary, dashboard snapshot).

### 1.5. Hermes

**Роль:** изолированный AI-worker. Выполняет всё, что требует LLM, краулинга или длительных вычислений.

**Почему отдельный сервис:**
- Независимое масштабирование AI-нагрузки.
- Изоляция LLM-ключей и промптов.
- Разные SLA и retry-политики.
- Возможность смены LLM-провайдера без затрагивания основного API.

**Коммуникация:** HTTP REST (sync для лёгких запросов) + callback/webhook или polling (для долгих jobs).

### 1.6. WordPress Plugin

**Роль:** мост между RankBoost и CMS клиента. Только Draft Autopilot — создание черновиков, не публикация.

**Расположение:** отдельный репозиторий / пакет `rankboost-connector`, устанавливается клиентом на свой WordPress.

**Аутентификация:** API Key (выдаётся в дашборде) + HMAC-подпись запросов.

### 1.7. Google OAuth

**Роль:** подключение Search Console, Analytics 4, Business Profile для обогащения дашборда реальными данными.

**Поток:** OAuth 2.0 Authorization Code → Backend сохраняет encrypted tokens → Integration Service периодически синхронизирует данные.

### 1.8. Stripe

**Роль:** биллинг — разовый аудит (one-time payment) и подписки (recurring).

**Интеграция:**
- Stripe Checkout — оплата.
- Customer Portal — управление подпиской клиентом.
- Webhooks — события `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated/deleted`.
- Billing Service — единственный потребитель webhook'ов, обновляет Subscription в DB.

### 1.9. Resend

**Роль:** транзакционная и маркетинговая email-доставка.

**Типы писем:**
- Подтверждение регистрации, сброс пароля.
- Уведомление о готовности аудита.
- Ежемесячный отчёт (Report Generator → Email Service → Resend).
- Алерты (Pro-тариф).
- Lead-форма с лендинга (уже реализовано).

### 1.10. Queue

**Роль:** асинхронное выполнение тяжёлых и отложенных задач.

**Брокер:** Redis (BullMQ / аналог).

**Почему не синхронно:** полный аудит сайта (краулинг 500 страниц + LLM-анализ) занимает 1–5 минут. UI не должен блокироваться.

### 1.11. Cron

**Роль:** планировщик периодических задач.

| Job | Расписание | Действие |
|---|---|---|
| Monthly reports | 1-е число, 08:00 UTC | Report Generator → Email |
| GSC/GA sync | Ежедневно, 03:00 UTC | Integration Service |
| Subscription renewal check | Ежедневно | Billing Service |
| Score recalculation | Еженедельно | Growth Score Service |
| Task regeneration | Еженедельно | Task Service → Hermes |
| Token refresh | Каждые 6 часов | Integration Service |
| Usage reset | 1-е число | Billing / AIUsage counters |
| Failed job cleanup | Ежедневно | Queue maintenance |

**Реализация MVP:** Vercel Cron → API endpoint `/api/cron/*` с secret header. При масштабировании — выделенный scheduler (Railway / Fly.io worker).

### 1.12. Admin Panel

**Роль:** внутренний инструмент команды RankBoost.

**Расположение:** `/admin/*` в том же Next.js-приложении, отдельный layout, middleware с role-check.

**Функции:** users, sites, subscriptions, hermes jobs, content moderation, integrations health, email logs, analytics, feature flags.

**Безопасность:** отдельная role-модель, 2FA обязательна, audit log всех admin-действий, impersonate с логированием.

---

## 2. Как взаимодействуют сервисы

### 2.1. Главная воронка: от визита до подписки

```
Пользователь
     │
     ▼
┌─────────┐
│ Landing │  ← публичный лендинг, ввод URL
└────┬────┘
     │ POST /api/audit/preview
     ▼
┌─────────────┐
│ Audit Svc   │  ← создаёт preview job
└────┬────────┘
     │ enqueue
     ▼
┌─────────┐     ┌─────────┐
│  Queue  │────►│ Hermes  │  ← экспресс-скан (30–60 сек)
└─────────┘     └────┬────┘
                     │ callback: preview result
                     ▼
              ┌─────────────┐
              │  Database   │  ← Audit (type=preview), GrowthScore preview
              └────┬────────┘
                   │
     ┌─────────────┘
     ▼
┌──────────────┐
│ Preview UI   │  ← 3–5 проблем, Growth Score teaser
└──────┬───────┘
       │ CTA «Получить полный аудит»
       ▼
┌──────────────┐
│ Registration │  ← Auth Service
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Stripe     │  ← Checkout (audit 99€ или подписка)
└──────┬───────┘
       │ webhook: payment success
       ▼
┌──────────────┐
│ Billing Svc  │  ← Subscription / Purchase
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Onboarding  │  ← wizard: ниша, язык, интеграции
└──────┬───────┘
       │ trigger full audit
       ▼
┌─────────────┐     ┌─────────┐     ┌─────────┐
│ Audit Svc   │────►│  Queue  │────►│ Hermes  │  ← полный аудит (2–5 мин)
└─────────────┘     └─────────┘     └────┬────┘
                                         │
                     ┌───────────────────┤
                     ▼                   ▼
              ┌─────────────┐     ┌─────────────┐
              │ Task Svc    │     │ Growth Score│
              │ (AI Tasks)  │     │   Service   │
              └──────┬──────┘     └──────┬──────┘
                     │                   │
                     └─────────┬─────────┘
                               ▼
                        ┌─────────────┐
                        │  Dashboard  │
                        └─────────────┘
```

### 2.2. Ежедневная работа клиента в дашборде

```
Клиент (Dashboard)
     │
     ├──► Task Service        → отметить задачу Done → Growth Score пересчёт
     │
     ├──► AI Service          → «Создать статью» → Queue → Hermes → Article
     │                                                    │
     │                                                    ▼
     ├──► WordPress Plugin ◄──── POST draft ──── Content Service
     │
     ├──► Integration Service → OAuth connect → Google APIs
     │                              │
     │                              ▼
     │                         GSC / GA / GBP data → Dashboard charts
     │
     └──► Activity Service    → лог всех событий → Activity Feed
```

### 2.3. Ежемесячный отчёт

```
Cron (1-е число)
     │
     ▼
Report Generator
     │
     ├── читает: GrowthScoreHistory, Tasks (done), AIUsage, GSC snapshots
     │
     ▼
Email Service
     │
     ├── рендер HTML-шаблон
     │
     ▼
Resend ──► клиент inbox
     │
     ▼
EmailHistory (DB) + Activity event
```

### 2.4. Stripe webhook flow

```
Stripe
  │  checkout.session.completed
  │  invoice.paid
  │  customer.subscription.updated
  │  customer.subscription.deleted
  ▼
POST /api/webhooks/stripe  (signature verify)
  │
  ▼
Billing Service
  │
  ├──► Subscription (create / update / cancel)
  ├──► User.plan (sync)
  ├──► Activity (payment event)
  └──► trigger: full audit (если первый платёж)
```

### 2.5. Hermes job lifecycle

```
RankBoost API
     │  POST /hermes/jobs
     ▼
Hermes API
     │  validate + enqueue internal
     ▼
Hermes Worker
     │  processing (crawl / LLM / score)
     │
     ├── success ──► POST /api/internal/hermes/callback
     │                      │
     │                      ▼
     │               RankBoost: persist result, notify user
     │
     └── failure ──► retry (exponential backoff)
                          │
                          └── max retries ──► status=failed, alert admin
```

### 2.6. WordPress Draft Autopilot

```
Dashboard: «Отправить в WordPress»
     │
     ▼
Content Service
     │  validate: WP integration active, tariff limit OK
     ▼
POST https://client-site.com/wp-json/rankboost/v1/drafts
     │  Header: X-RankBoost-Key, X-RankBoost-Signature
     ▼
WordPress Plugin
     │  verify key + signature
     │  wp_insert_post(status=draft)
     ▼
Response: { wp_post_id, edit_url }
     │
     ▼
Article.wpPostId = ... + Activity event
```

### 2.7. Google OAuth connect

```
Dashboard: «Подключить Search Console»
     │
     ▼
GET /api/integrations/google/authorize?service=gsc
     │
     ▼
Google OAuth Consent Screen
     │
     ▼
GET /api/integrations/google/callback?code=...
     │
     ▼
Integration Service
     │  exchange code → tokens
     │  encrypt + save Integration record
     │  initial sync (enqueue)
     ▼
Queue → sync job → Google APIs → IntegrationSnapshot (DB)
     │
     ▼
Dashboard: график трафика появляется
```

---

## 3. Frontend

### 3.1. Next.js и App Router

**Версия:** Next.js 16, App Router, React Server Components.

**Стратегия рендеринга:**

| Зона | Стратегия | Причина |
|---|---|---|
| Marketing pages | SSG / ISR | SEO, скорость |
| Blog | SSG | 60+ статей, статика |
| Dashboard | SSR + Client | Персональные данные, интерактив |
| Admin | SSR + Client | Защищённый доступ |
| API routes | Serverless | Backend endpoints |

**Middleware** (существует): locale routing `/` → `/ru`, валидация locale prefix.

**Расширение для MVP:** middleware добавит auth-guard для `/app/*` и `/admin/*` без изменения marketing routes.

### 3.2. Структура страниц

```
app/
├── layout.tsx                          # Root layout
├── globals.css
├── sitemap.ts
├── robots.ts
├── opengraph-image.tsx
├── not-found.tsx
│
├── [locale]/                           # MARKETING (существует)
│   ├── layout.tsx                      # Header, Footer, JSON-LD
│   ├── page.tsx                        # Home / Landing
│   ├── services/page.tsx
│   ├── pricing/page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── contact/page.tsx
│   ├── privacy/page.tsx
│   └── terms/page.tsx
│
├── audit/                              # NEW: публичный аудит
│   └── [token]/page.tsx                # Результат бесплатного аудита
│
├── app/                                # NEW: клиентский дашборд
│   ├── layout.tsx                      # Sidebar, auth guard
│   ├── page.tsx                        # Overview (Growth Score, tasks)
│   ├── tasks/page.tsx
│   ├── audit/page.tsx
│   ├── content/
│   │   ├── page.tsx                    # Статьи + соцпосты
│   │   └── [id]/page.tsx
│   ├── integrations/page.tsx
│   ├── reports/page.tsx
│   ├── settings/
│   │   ├── page.tsx
│   │   ├── billing/page.tsx
│   │   └── profile/page.tsx
│   └── onboarding/page.tsx
│
├── admin/                              # NEW: Admin Panel
│   ├── layout.tsx                      # Admin sidebar, 2FA guard
│   ├── page.tsx                        # Dashboard metrics
│   ├── users/
│   ├── sites/
│   ├── subscriptions/
│   ├── jobs/                           # Hermes jobs
│   ├── content/
│   ├── integrations/
│   ├── emails/
│   └── settings/
│
└── api/                                # API Routes
    ├── contact/route.ts                # (существует)
    ├── auth/                           # login, register, logout, refresh
    ├── audit/                          # preview, full, status
    ├── tasks/
    ├── content/
    ├── integrations/
    │   └── google/
    ├── billing/
    │   └── webhooks/stripe/
    ├── wordpress/
    ├── internal/
    │   └── hermes/callback/
    └── cron/
```

### 3.3. Структура компонентов

```
components/
├── layout/                 # Header, Footer, Sidebar, LangSetter
│   ├── Header.tsx          # (существует) — marketing
│   ├── Footer.tsx          # (существует)
│   ├── AppSidebar.tsx      # NEW — dashboard nav
│   └── AdminSidebar.tsx    # NEW — admin nav
│
├── sections/               # Marketing sections (существуют)
│   ├── Hero.tsx
│   ├── ServicesSection.tsx
│   ├── PricingSection.tsx
│   └── ...
│
├── dashboard/              # NEW
│   ├── GrowthScoreCard.tsx
│   ├── AIReadinessCard.tsx
│   ├── TasksList.tsx
│   ├── ActivityFeed.tsx
│   ├── TrafficChart.tsx
│   ├── ContentList.tsx
│   ├── IntegrationCard.tsx
│   └── OnboardingWizard.tsx
│
├── audit/                  # NEW
│   ├── AuditPreview.tsx
│   ├── AuditReport.tsx
│   └── AuditCategoryBreakdown.tsx
│
├── forms/                  # (существует + расширение)
│   ├── ContactForm.tsx
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── SiteUrlForm.tsx
│
├── blog/                   # (существует)
├── seo/                    # (существует)
├── analytics/              # (существует)
│
└── ui/                     # shadcn/ui kit (существует)
    ├── button.tsx
    ├── input.tsx
    ├── accordion.tsx
    └── ...
```

### 3.4. UI Kit

**База:** shadcn/ui + Tailwind CSS v4.

**Дизайн-система:**

| Токен | Значение |
|---|---|
| Background | `#050816` (navy dark) |
| Accent | Blue → Cyan → Violet gradients |
| Cards | Glassmorphism, `border-white/5` |
| Typography | System font stack, gradient text для акцентов |
| Icons | Lucide React |
| Animation | Framer Motion (subtle, dashboard transitions) |

**Принципы UI:**
- Marketing и Dashboard — единая визуальная ДНК, но Dashboard функциональнее, меньше декора.
- Growth Score — крупный визуальный элемент (gauge / progress bar).
- Задачи — карточки с приоритетом (цветовая кодировка).
- Пустые состояния — всегда с CTA (подключить интеграцию, создать контент).
- Responsive: mobile-first для dashboard.

**Компоненты для добавления в UI Kit (MVP):**
- ScoreGauge (0–100)
- TaskCard (priority, status, category)
- ActivityItem (icon, timestamp, description)
- IntegrationStatus (connected / error / pending)
- PlanBadge (Start / Growth / Pro)
- UsageMeter (лимиты тарифа)

### 3.5. i18n

**Конфиг:** `i18n/config.ts` — locales: `ru` (default), `et`, `en`.

**Словари:** `i18n/dictionaries/{ru,et,en}.ts` — тип `Dictionary` из `ru.ts`.

**Расширение для MVP:** отдельные namespace для dashboard (`dashboard.*`) и admin (`admin.*`) в тех же словарях.

**URL-стратегия:**
- Marketing: `/{locale}/...` (как сейчас).
- Dashboard: `/app/...` (без locale prefix, язык из user settings).
- Admin: `/admin/...` (английский UI).

---

## 4. Backend

### 4.1. Карта сервисов

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│  Auth middleware · Rate limiter · Request validation (Zod)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────────────────┐
    │                      │                                  │
    ▼                      ▼                                  ▼
┌─────────┐  ┌──────────────────────────┐  ┌─────────────────────────┐
│  Auth   │  │     Core Domain          │  │    External Adapters    │
│ Service │  │                          │  │                         │
└─────────┘  │  Audit Service           │  │  Stripe Adapter         │
             │  Task Service            │  │  Google OAuth Adapter   │
             │  Growth Score Service    │  │  Resend Adapter         │
             │  AI Readiness Service    │  │  Hermes Client          │
             │  Content Service         │  │  WordPress Client       │
             │  Content Planner         │  └─────────────────────────┘
             │  Report Generator        │
             │  Activity Service        │
             │  Integration Service     │
             │  Billing Service         │
             │  Email Service           │
             │  Usage / Limits Service  │
             └──────────────────────────┘
```

### 4.2. Auth Service

**Ответственность:** регистрация, логин, сессии, OAuth (Google login), роли, API keys для WordPress.

| Endpoint (концепт) | Действие |
|---|---|
| POST /api/auth/register | Email + password → User |
| POST /api/auth/login | → JWT access + refresh token |
| POST /api/auth/logout | Invalidate refresh token |
| POST /api/auth/refresh | Rotate tokens |
| GET /api/auth/google | OAuth login (не путать с integrations) |
| POST /api/auth/api-keys | Создать WP API key |

**Модель доступа:**
- `user` — клиент, доступ к `/app/*` своих сайтов.
- `support` — admin read + impersonate.
- `analyst` — admin read-only analytics.
- `admin` — полный доступ.

### 4.3. Audit Service

**Ответственность:** запуск, отслеживание и хранение аудитов.

| Операция | Тип | Hermes job |
|---|---|---|
| Preview audit | Бесплатный, до регистрации | `audit.preview` |
| Full audit | Платный / по подписке | `audit.full` |
| Re-scan | По расписанию / вручную | `audit.full` |
| Express scan | Быстрый перескан | `audit.express` |

**Логика:**
1. Проверить лимиты тарифа (Usage Service).
2. Создать запись Audit (status: `queued`).
3. Enqueue Hermes job.
4. По callback — сохранить результат, запустить Task Service + Growth Score Service.
5. Создать Activity event.
6. Отправить email «Аудит готов» (Email Service).

### 4.4. Task Service

**Ответственность:** CRUD AI Tasks, смена статусов, генерация новых задач.

**Генерация:** после полного аудита → Hermes job `tasks.generate` → парсинг → создание Task records (макс. 10 active).

**При закрытии задачи (Done):**
1. Обновить Task.status.
2. Триггер Growth Score Service (пересчёт категории «выполнение задач»).
3. Activity event.
4. Если active tasks < 3 → запросить новые у Hermes.

### 4.5. Growth Score Service

**Ответственность:** расчёт, хранение истории, отдача на дашборд.

**Триггеры пересчёта:**
- Завершение аудита (полный пересчёт).
- Закрытие задачи (частичный).
- Синхронизация GSC (категория «видимость»).
- Cron (еженедельный reconcile).

**Результат:** число 0–100 + breakdown по категориям → `GrowthScoreHistory`.

### 4.6. AI Readiness Service

**Ответственность:** расчёт AI Readiness Score (0–100), отдельно от Growth Score.

**Источник данных:** результаты аудита (structured data, E-E-A-T, clarity) + Hermes NLP-анализ.

### 4.7. AI Service (Content)

**Ответственность:** генерация SEO-статей и соцпостов через Hermes.

| Операция | Hermes job | Результат |
|---|---|---|
| Generate article | `content.article` | Article record |
| Generate social post | `content.social` | SocialPost record |
| Content calendar | `content.plan` | MonthlyPlan items |

**Пайплайн статьи:**
1. Проверить лимит (Usage Service).
2. Content Planner предлагает тему (или клиент вводит).
3. Hermes генерирует → Content Safety Filter.
4. Article (status: `draft`) → клиент review → optional WordPress push.

### 4.8. Content Planner

**Ответственность:** планирование контента на месяц.

**Вход:** ниша, язык, результаты аудита, закрытые/открытые задачи, GSC queries.

**Выход:** `MonthlyPlan` — список тем для статей и постов с привязкой к ключевым словам.

**Cron:** генерируется 1-го числа для активных подписчиков.

### 4.9. Integration Service

**Ответственность:** OAuth flows, хранение tokens, синхронизация данных Google.

**Подсервисы:**
- GSC Sync — queries, clicks, impressions, indexing issues.
- GA4 Sync — sessions, sources, conversions.
- GBP Sync — profile info, reviews count, insights.

**Хранение:** `Integration` (credentials) + `IntegrationSnapshot` (периодические снимки метрик).

### 4.10. Billing Service

**Ответственность:** Stripe, подписки, лимиты, одноразовые покупки.

**События:**
- `checkout.session.completed` → создать Subscription или AuditPurchase.
- `invoice.paid` → продлить период.
- `customer.subscription.deleted` → downgrade to free, freeze dashboard.
- `invoice.payment_failed` → grace period 3 дня → email alert.

**Связь с Usage Service:** при смене тарифа — пересчитать лимиты.

### 4.11. Email Service

**Ответственность:** шаблоны, отправка, логирование.

**Типы:** transactional (auth, audit ready), reports (monthly), alerts (Pro).

**Адаптер:** Resend API. Шаблоны — HTML + plaintext fallback.

### 4.12. Report Generator

**Ответственность:** сбор данных за период → структурированный отчёт → HTML email.

**Вход:** User, Website, period (month).

**Собирает:** GrowthScoreHistory delta, AI Readiness delta, Tasks completed, Articles/Posts created, GSC traffic delta, top 3 upcoming tasks.

### 4.13. Activity Service

**Ответственность:** единый event log для ленты активности.

**Паттерн:** все сервисы публикуют события в Activity Service (не пишут в Activity напрямую из разных мест — только через единый метод `logActivity()`).

### 4.14. Usage / Limits Service

**Ответственность:** счётчики потребления по тарифу, enforcement.

**Считает:** audits, articles, social posts, hermes jobs, API calls (WP).

**Хранение:** `AIUsage` (помесячные счётчики per user/site).

**Enforcement:** перед каждой дорогой операцией — `checkLimit(userId, action)` → allow / deny + upgrade CTA.

---

## 5. Database

### 5.1. ER-диаграмма (логическая)

```
User ─────────────┬──────────── Website ────────────┬──────────── Audit
  │               │                │                │
  │               │                ├──── Task       │
  │               │                │                │
  │               │                ├──── Article    │
  │               │                │                │
  │               │                ├──── SocialPost │
  │               │                │                │
  │               │                ├──── Integration│
  │               │                │       │        │
  │               │                │       ▼        │
  │               │                │  IntegrationSnapshot
  │               │                │                │
  │               │                ├──── GrowthScoreHistory
  │               │                │
  │               │                ├──── AIReadinessHistory
  │               │                │
  │               │                ├──── Activity
  │               │                │
  │               │                ├──── MonthlyPlan
  │               │                │       │
  │               │                │       └── PlanItem
  │               │                │
  │               │                └──── WordPressConnection
  │               │
  ├──── Subscription (Stripe)
  │
  ├──── AIUsage (monthly counters)
  │
  ├──── EmailHistory
  │
  ├──── ApiKey (WordPress)
  │
  └──── AdminAuditLog
```

### 5.2. Сущности

#### User

| Поле | Описание |
|---|---|
| id | UUID |
| email | Уникальный |
| passwordHash | Nullable (если OAuth-only) |
| name | |
| role | user / support / analyst / admin |
| locale | ru / et / en |
| stripeCustomerId | |
| emailVerified | boolean |
| createdAt, updatedAt | |
| deletedAt | Soft delete (GDPR) |

#### Website

| Поле | Описание |
|---|---|
| id | UUID |
| userId | FK → User |
| url | Нормализованный домен |
| niche | Категория бизнеса |
| primaryLanguage | ru / et / en |
| cms | wordpress / shopify / other |
| status | active / paused / archived |
| createdAt | |

**Связи:** User 1→N Website (лимит по тарифу: 1 или 3).

#### Subscription

| Поле | Описание |
|---|---|
| id | UUID |
| userId | FK → User |
| stripeSubscriptionId | |
| plan | free / audit / start / growth / pro / partner |
| status | active / past_due / canceled / trialing |
| currentPeriodStart, currentPeriodEnd | |
| cancelAtPeriodEnd | boolean |

#### Audit

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| type | preview / full / express |
| status | queued / processing / completed / failed |
| hermesJobId | |
| growthScore | Nullable, итоговый |
| aiReadinessScore | Nullable |
| result | JSON: категории, findings, recommendations |
| startedAt, completedAt | |
| createdAt | |

#### Task

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| auditId | FK → Audit (источник) |
| title | |
| description | «Зачем» |
| instructions | «Как сделать», JSON steps |
| priority | critical / high / medium / low |
| category | technical / content / local / ai_readiness / social |
| status | todo / in_progress / done / skipped |
| expectedScoreImpact | Число |
| dueDate | Nullable |
| completedAt | Nullable |

#### Article

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| title, slug, metaDescription | |
| content | HTML / Markdown |
| status | generating / draft / review / sent_to_wp / published |
| wpPostId | Nullable |
| wpEditUrl | Nullable |
| targetKeyword | |
| wordCount | |
| hermesJobId | |
| createdAt | |

#### SocialPost

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| platform | instagram / facebook / linkedin |
| content | |
| hashtags | |
| visualIdea | |
| status | draft / approved / published |
| scheduledFor | Nullable |
| relatedTaskId | Nullable FK → Task |

#### GrowthScoreHistory

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| score | 0–100 |
| breakdown | JSON: { technical, content, structure, local, visibility, tasks } |
| trigger | audit / task_completed / gsc_sync / cron |
| recordedAt | |

#### AIReadinessHistory

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| score | 0–100 |
| breakdown | JSON: { structuredData, expertise, clarity, crawlability, entities, freshness } |
| recordedAt | |

#### Integration

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| provider | google_gsc / google_ga4 / google_gbp |
| status | connected / expired / error / disconnected |
| encryptedTokens | AES-256 encrypted JSON |
| scopes | |
| lastSyncAt | Nullable |
| lastError | Nullable |

#### IntegrationSnapshot

| Поле | Описание |
|---|---|
| id | UUID |
| integrationId | FK → Integration |
| periodStart, periodEnd | |
| metrics | JSON: clicks, impressions, sessions, etc. |
| createdAt | |

#### MonthlyPlan

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| month | YYYY-MM |
| status | generating / ready / active |
| createdAt | |

#### PlanItem

| Поле | Описание |
|---|---|
| id | UUID |
| monthlyPlanId | FK → MonthlyPlan |
| type | article / social_post |
| topic | |
| targetKeyword | Nullable |
| status | planned / in_progress / done |
| linkedArticleId | Nullable |
| linkedSocialPostId | Nullable |

#### Activity

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| userId | FK → User |
| type | audit_completed / task_done / score_changed / content_created / integration_connected / report_sent / ... |
| title | Человекочитаемый заголовок |
| metadata | JSON |
| createdAt | |

#### AIUsage

| Поле | Описание |
|---|---|
| id | UUID |
| userId | FK → User |
| websiteId | Nullable |
| month | YYYY-MM |
| audits | Счётчик |
| articles | Счётчик |
| socialPosts | Счётчик |
| hermesJobs | Общий счётчик |
| wpApiCalls | Счётчик |
| estimatedCostEur | Агрегированная стоимость LLM |

#### EmailHistory

| Поле | Описание |
|---|---|
| id | UUID |
| userId | FK → User |
| type | report / transactional / alert |
| subject | |
| resendId | |
| status | sent / delivered / bounced / failed |
| sentAt | |

#### WordPressConnection

| Поле | Описание |
|---|---|
| id | UUID |
| websiteId | FK → Website |
| siteUrl | URL WordPress |
| apiKeyId | FK → ApiKey |
| pluginVersion | |
| status | active / error / disconnected |
| lastPushAt | Nullable |

#### ApiKey

| Поле | Описание |
|---|---|
| id | UUID |
| userId | FK → User |
| keyHash | Хеш ключа (сам ключ показывается 1 раз) |
| name | «WordPress Main» |
| permissions | JSON: [drafts.create, drafts.read] |
| lastUsedAt | |
| revokedAt | Nullable |

#### AdminAuditLog

| Поле | Описание |
|---|---|
| id | UUID |
| adminUserId | FK → User |
| action | impersonate / user_update / plan_override / ... |
| targetUserId | Nullable |
| metadata | JSON |
| createdAt | |

---

## 6. Hermes

### 6.1. Роль в системе

Hermes — **stateless AI-worker** с внутренней очередью. RankBoost API — единственный клиент Hermes (кроме Admin debug).

Клиентский браузер **никогда** не обращается к Hermes напрямую.

### 6.2. Коммуникация RankBoost ↔ Hermes

**Аутентификация:** service-to-service API key + HMAC signature + IP allowlist.

**Два режима:**

| Режим | Когда | Поток |
|---|---|---|
| Sync | Express preview, score recalc < 10s | Request → Response |
| Async | Full audit, article generation | Request → job_id → callback |

### 6.3. API Hermes (концептуальный)

#### POST /v1/jobs

Создать job.

**Request:**
- `type` — тип job (см. ниже)
- `site_id`, `user_id` — для трассировки
- `locale` — ru / et / en
- `params` — job-specific параметры
- `callback_url` — URL для async callback
- `idempotency_key` — защита от дублей

**Response:**
- `job_id`
- `status`: `queued`

#### GET /v1/jobs/{job_id}

Статус и результат (для polling fallback).

#### POST /v1/jobs/{job_id}/cancel

Отмена (если ещё в очереди).

### 6.4. Типы jobs

| type | Описание | Среднее время | LLM |
|---|---|---|---|
| `audit.preview` | Экспресс-скан, 3–5 проблем | 30–60 сек | Да |
| `audit.full` | Полный аудит 100+ параметров | 2–5 мин | Да |
| `audit.express` | Быстрый перескан | 1–2 мин | Да |
| `tasks.generate` | Генерация AI Tasks | 30–60 сек | Да |
| `content.article` | SEO-статья | 1–3 мин | Да |
| `content.social` | Пост для соцсети | 10–30 сек | Да |
| `content.plan` | Контент-план на месяц | 1–2 мин | Да |
| `score.growth` | Пересчёт Growth Score | 5–15 сек | Нет |
| `score.ai_readiness` | Пересчёт AI Readiness | 10–30 сек | Да |
| `report.compile` | Сборка данных отчёта | 10–30 сек | Да (summary) |
| `competitors.snapshot` | Анализ 3–5 конкурентов | 2–3 мин | Да |

### 6.5. Статусы jobs

```
queued → processing → completed
                   ↘ failed
                   ↘ cancelled
```

| Статус | Описание |
|---|---|
| `queued` | В очереди Hermes |
| `processing` | Worker взял в работу |
| `completed` | Результат готов |
| `failed` | Ошибка после всех retry |
| `cancelled` | Отменён вручную / timeout |

### 6.6. Callback в RankBoost

**POST /api/internal/hermes/callback**

Headers: `X-Hermes-Signature` (HMAC).

Body:
- `job_id`
- `status`
- `result` — JSON (структура зависит от type)
- `metadata` — tokens used, duration, model, cost

RankBoost:
1. Верифицирует подпись.
2. Находит связанный Audit / Article / etc.
3. Сохраняет result.
4. Триггерит downstream (Task Service, Growth Score, Email, Activity).
5. Обновляет AIUsage.estimatedCostEur.

### 6.7. Retries

| Параметр | Значение |
|---|---|
| Max retries | 3 |
| Backoff | Exponential: 30s → 2min → 10min |
| Retryable errors | LLM timeout, rate limit, crawler timeout |
| Non-retryable | Invalid URL, site unreachable (4xx), content policy violation |
| Dead letter | После 3 failures → status=failed, alert Admin, user видит «Попробуйте позже» |

### 6.8. Внутренняя архитектура Hermes

```
Hermes API (gateway)
     │
     ▼
Internal Queue
     │
     ├── Crawler Worker     → Playwright / fetch, sitemap parse
     ├── Audit Worker       → rule engine + LLM analysis
     ├── Content Worker     → LLM generation + safety filter
     ├── Score Worker       → deterministic scoring
     └── Report Worker      → data aggregation + LLM summary
     │
     ▼
LLM Provider (OpenAI / Anthropic — abstracted)
```

### 6.9. Content Safety Filter

Перед возвратом результата Content Worker:
- Проверка на harmful content.
- Medical / legal claims → flag или block.
- Spam patterns → reject.
- Качество: min word count, readability score.

Заблокированный контент → job `failed` с reason `content_policy`, Admin уведомление.

---

## 7. Queue

### 7.1. Почему очередь

| Проблема без очереди | Решение с очередью |
|---|---|
| HTTP timeout (Vercel: 60s max) | Worker без лимита времени |
| Блокировка UI | Async: «обрабатывается» → push/poll |
| Spike нагрузки | Backpressure, приоритеты |
| Retry logic | Централизованные retries |
| Масштабирование | N workers |

### 7.2. Две очереди

| Очередь | Где | Назначение |
|---|---|---|
| RankBoost Queue | Redis (основное приложение) | Оркестрация: вызов Hermes, email, sync, cron jobs |
| Hermes Internal Queue | Redis (Hermes) | AI/crawl workers |

RankBoost Queue **не дублирует** Hermes Queue — RankBoost ставит задачу «вызвать Hermes и дождаться callback», Hermes управляет своими workers.

### 7.3. Задачи в RankBoost Queue

| Job | Приоритет | Timeout |
|---|---|---|
| `hermes.dispatch` | high | 10s (только dispatch) |
| `email.send` | normal | 30s |
| `integration.sync.gsc` | normal | 120s |
| `integration.sync.ga4` | normal | 120s |
| `integration.sync.gbp` | normal | 120s |
| `report.generate` | low | 300s |
| `usage.reset` | low | 60s |
| `activity.compact` | low | 300s |

### 7.4. Жизненный цикл задачи в RankBoost Queue

```
created → waiting → active → completed
                          ↘ failed → (retry) → waiting
                          ↘ failed → dead (max retries)
```

**Персистентность:** job state в Redis + `JobLog` в PostgreSQL для Admin Panel.

**Мониторинг:** Admin → Jobs: waiting / active / failed counts, avg duration.

---

## 8. WordPress Plugin

### 8.1. Обзор

**Название:** RankBoost Connector  
**Версия MVP:** 1.0  
**Минимум:** WordPress 6.0+, PHP 8.0+

### 8.2. Установка и соединение

```
1. Клиент устанавливает плагин (WP Admin → Plugins → Upload)
2. В RankBoost Dashboard → Integrations → WordPress → «Сгенерировать API Key»
3. Клиент копирует API Key + Site ID в настройки плагина
4. Плагин → POST /api/wordpress/verify → RankBoost проверяет
5. WordPressConnection.status = active
```

### 8.3. Права в WordPress

Плагин требует минимальные capabilities:
- `edit_posts` — создание черновиков.
- `upload_files` — опционально, для featured image.

Плагин **не требует** `manage_options` в MVP.

### 8.4. API плагина (WP REST)

Base: `/wp-json/rankboost/v1/`

| Method | Endpoint | Действие |
|---|---|---|
| GET | /health | Проверка связи, версия плагина |
| POST | /drafts | Создать черновик |
| GET | /drafts/{id} | Статус черновика |
| PUT | /drafts/{id} | Обновить черновик (если edit в RankBoost) |

### 8.5. Аутентификация запросов

**От RankBoost к WordPress:**
- Header `X-RankBoost-Key`: API key.
- Header `X-RankBoost-Signature`: HMAC-SHA256(body, secret).
- Header `X-RankBoost-Timestamp`: защита от replay (±5 min).

**От WordPress к RankBoost:**
- Header `X-RankBoost-Key`: тот же key.
- При verify: POST `/api/wordpress/verify` с site URL + plugin version.

### 8.6. Draft Autopilot flow

```
RankBoost Content Service
     │
     │ POST /wp-json/rankboost/v1/drafts
     │ Body: { title, slug, content, meta_description, categories, tags, featured_image_url }
     ▼
WP Plugin: rankboost_create_draft()
     │
     │ wp_insert_post({ post_status: 'draft', ... })
     │ set meta: _rankboost_article_id, _rankboost_meta_description
     ▼
Response: { wp_post_id, edit_url, status: 'draft' }
     │
     ▼
RankBoost: Article.status = sent_to_wp, Activity event
```

**Клиент** открывает `edit_url` в WordPress и публикует вручную.

### 8.7. Ограничения

| Ограничение | Значение |
|---|---|
| Drafts / день (Start) | 10 API calls |
| Drafts / день (Growth) | 30 |
| Drafts / день (Pro) | 100 |
| Max content size | 100 KB per request |
| Autopublish | Запрещено в MVP |
| Multisite WP | Не поддерживается в MVP |
| Custom post types | Только `post` в MVP |

### 8.8. Обработка ошибок

| Ошибка | Действие |
|---|---|
| 401 Invalid key | WordPressConnection.status = error, email клиенту |
| 403 Insufficient permissions | Инструкция в dashboard |
| 500 WP error | Retry 2 times, then fail with Activity event |
| Plugin deactivated | Health check fails → notification |

---

## 9. Google

### 9.1. OAuth 2.0 Flow

**Общий для GSC, GA4, GBP:**

```
1. User clicks «Подключить» в Dashboard
2. GET /api/integrations/google/authorize
     ?service=gsc|ga4|gbp
     &website_id=...
3. Redirect → Google Consent Screen
4. Redirect back → /api/integrations/google/callback?code=...&state=...
5. state = signed { userId, websiteId, service, nonce }
6. Exchange code → access_token + refresh_token
7. Encrypt → Integration record
8. Enqueue initial sync
```

**state parameter:** подписанный JWT с TTL 10 min, защита от CSRF.

### 9.2. Search Console

| Параметр | Значение |
|---|---|
| Scope | `https://www.googleapis.com/auth/webmasters.readonly` |
| API | Search Console API v1 |
| Sync data | Queries, clicks, impressions, CTR, position, indexing issues, sitemaps |
| Sync frequency | Daily (cron) + on connect |
| Dashboard use | Traffic chart, top queries table, indexing alerts |

**Привязка:** пользователь выбирает property (domain / URL prefix) после OAuth.

### 9.3. Google Analytics 4

| Параметр | Значение |
|---|---|
| Scope | `https://www.googleapis.com/auth/analytics.readonly` |
| API | GA4 Data API |
| Sync data | Sessions, users, conversions, traffic sources, landing pages |
| Sync frequency | Daily |
| Dashboard use | Traffic overview, conversion metrics |

**Привязка:** выбор GA4 property после OAuth.

### 9.4. Google Business Profile

| Параметр | Значение |
|---|---|
| Scope | `https://www.googleapis.com/auth/business.manage` |
| API | Business Profile API |
| Sync data | Profile completeness, reviews count/rating, insights (views, actions) |
| Sync frequency | Daily |
| Dashboard use | Local visibility card, review summary |

**MVP ограничение:** только чтение + рекомендации. Автоматическое редактирование GBP — V2.

### 9.5. Token Management

- Access token TTL: ~1 час.
- Refresh token: хранится encrypted, используется Integration Service.
- Cron `token-refresh` каждые 6 часов: проактивный refresh.
- При `invalid_grant` → Integration.status = `expired`, email клиенту «Переподключите».

### 9.6. Данные и приватность

- Данные Google хранятся только в `IntegrationSnapshot` (агрегаты).
- Сырые API-ответы не хранятся дольше 90 дней.
- При disconnect → удаление tokens + snapshots по запросу.

---

## 10. Growth Score

### 10.1. Формула

**Growth Score** = взвешенная сумма 6 категорий. Шкала 0–100.

| Категория | Вес | Источник данных |
|---|---|---|
| Техническое здоровье | 25% | Audit (crawler): скорость, HTTPS, mobile, индексация, CWV |
| Контент | 25% | Audit + Hermes NLP: покрытие тем, уникальность, E-E-A-T |
| Структура и UX | 15% | Audit: навигация, внутренние ссылки, CTA, глубина |
| Локальное SEO | 15% | Audit + GBP integration (если подключён) |
| Видимость | 10% | GSC integration (если подключён), иначе оценка из аудита |
| Выполнение задач | 10% | Task Service: % закрытых задач за 30 дней |

### 10.2. Модули, влияющие на Score

| Модуль | Влияет | Как |
|---|---|---|
| Audit Service | Да | Основной источник 4 категорий |
| Hermes (score.growth) | Да | Агрегация и нормализация |
| Task Service | Да | Категория «выполнение задач» |
| Integration Service (GSC) | Да | Категория «видимость» (реальные данные) |
| Integration Service (GBP) | Да | Категория «локальное SEO» |
| Content Service | Косвенно | Опубликованный контент → следующий аудит |
| WordPress Plugin | Нет напрямую | Влияет через опубликованный контент |

### 10.3. Модули, НЕ влияющие напрямую

| Модуль | Почему |
|---|---|
| Stripe / Billing | Только gating доступа |
| Email Service | Только доставка |
| Resend | Транспорт |
| SocialPost | В MVP не влияет на score (V2: social signals) |
| Admin Panel | Только управление |

### 10.4. Пересчёт

| Триггер | Тип пересчёта |
|---|---|
| Full audit completed | Полный |
| Task marked Done | Частичный (tasks + возможно content/technical) |
| GSC sync (new data) | Частичный (visibility) |
| Weekly cron | Reconcile (полный если > 7 дней без аудита) |

### 10.5. Правила нормализации

- Каждая категория: 0–100, затем × вес.
- Локальное SEO: если бизнес не локальный (niche != local), вес перераспределяется: +10% контент, +5% структура.
- Видимость без GSC: оценка из аудита (max 50 из 100 в этой категории) — мотивация подключить GSC.
- Score никогда не падает более чем на 5 пунктов за раз (защита от демотивации при пересчёте).

---

## 11. AI Readiness

### 11.1. Назначение

Отдельный показатель (0–100), независимый от Growth Score. Отвечает на вопрос: **«Насколько сайт понятен для AI-поисковых систем?»**

### 11.2. Категории

| Категория | Вес | Что оценивается |
|---|---|---|
| Structured Data | 20% | Schema.org: Organization, FAQ, HowTo, Product, LocalBusiness |
| Expertise (E-E-A-T) | 25% | Авторы, about page, credentials, sources, trust signals |
| Content Clarity | 25% | Прямые ответы на вопросы, определения, FAQ-формат, headings |
| Crawlability | 15% | Robots, sitemap, canonical, не блокируется AI crawlers |
| Entity Clarity | 10% | Чёткое «кто, что, где» — NAP, brand consistency |
| Freshness | 5% | Даты обновлений, актуальность контента |

### 11.3. Источники

- **Crawler** (Hermes): HTML, meta, schema, robots.
- **LLM analysis** (Hermes): readability, answer quality, entity extraction.
- **Audit rules**: deterministic checks (schema present, FAQ exists).

### 11.4. Отличие от Growth Score

| | Growth Score | AI Readiness |
|---|---|---|
| Фокус | Бизнес-рост, трафик, конверсии | Понятность для AI |
| GSC data | Влияет (visibility) | Не влияет |
| Tasks completion | Влияет (10%) | Не влияет |
| Structured data | Часть technical (25%) | Главный фактор (20%) + влияет на clarity |

---

## 12. Unit Economics

### 12.1. События, которые считаются

| Событие | Где фиксируется | Влияние на экономику |
|---|---|---|
| `subscription.created` | Subscription + Stripe | +MRR |
| `subscription.canceled` | Subscription | −MRR, churn event |
| `invoice.paid` | Stripe webhook | Revenue recognized |
| `hermes.job.completed` | AIUsage + Hermes metadata | +COGS (LLM cost) |
| `audit.completed` | AIUsage | +COGS (crawl + LLM) |
| `article.generated` | AIUsage | +COGS |
| `email.sent` | EmailHistory | +COGS (~0.01€) |
| `user.registered` | User | Funnel metric |
| `free_audit.completed` | Audit | CAC input (infra cost) |
| `checkout.completed` | Stripe | Conversion event |

### 12.2. Хранение стоимости

**AIUsage** (per user, per month):
- `estimatedCostEur` — агрегат из Hermes metadata (`tokens_input`, `tokens_output`, `model`, `duration`).

**Hermes metadata** (per job):
- `cost_eur` — расчёт по прайсу LLM-провайдера.
- `tokens_used`, `model`, `duration_ms`.

**UnitCostConfig** (admin settings):
- Цена за 1K tokens (по модели).
- Цена crawl per page.
- Resend per email.
- Stripe fee percentage.

### 12.3. Расчёт прибыли

```
Revenue (user, month) = plan_price_eur

COGS (user, month) =
    AIUsage.estimatedCostEur
  + crawl_cost
  + email_count × email_unit_cost
  + revenue × stripe_fee_rate

Gross Profit = Revenue − COGS

Gross Margin % = Gross Profit / Revenue × 100
```

**Целевые маржи (из Product Bible):**

| Тариф | Revenue | COGS | Margin |
|---|---|---|---|
| Start | 199 € | ~27 € | ~86% |
| Growth | 349 € | ~51 € | ~85% |
| Pro | 599 € | ~95 € | ~84% |

### 12.4. Агрегаты для Admin

| Метрика | Формула |
|---|---|
| MRR | Sum(active subscriptions × plan price) |
| ARR | MRR × 12 |
| ARPU | MRR / active subscribers |
| Churn Rate | Canceled this month / active start of month |
| LTV | ARPU / churn rate |
| CAC | Marketing spend / new paid users |
| LTV/CAC | LTV / CAC |
| Avg COGS per user | Sum(COGS) / active users |
| Platform Gross Margin | (MRR − total COGS) / MRR |

### 12.5. Алерты

- User COGS > 50% revenue → flag in Admin (abuse or wrong plan).
- Hermes daily spend > budget → throttle non-critical jobs.
- Free audit cost > €0.50 → review crawler efficiency.

---

## 13. Безопасность

### 13.1. JWT

| Token | TTL | Хранение клиента |
|---|---|---|
| Access token | 15 min | Memory (не localStorage) |
| Refresh token | 30 days | HttpOnly secure cookie |

**Payload:** `userId`, `role`, `sessionId`.

**Rotation:** при refresh — новая пара tokens, старый refresh invalidated.

### 13.2. OAuth

| OAuth | Назначение |
|---|---|
| Google Login | Аутентификация пользователя в RankBoost |
| Google Integrations | Доступ к GSC / GA4 / GBP (отдельные tokens) |

Раздельные OAuth clients, раздельные scopes, раздельные token stores.

### 13.3. Encryption

| Данные | Метод |
|---|---|
| Passwords | bcrypt (cost 12) |
| Google OAuth tokens | AES-256-GCM, key в env / KMS |
| WordPress API keys | SHA-256 hash (ключ показывается 1 раз) |
| Hermes callback | HMAC-SHA256 |
| WP plugin requests | HMAC-SHA256 + timestamp |

### 13.4. Secrets

| Secret | Где хранится |
|---|---|
| DATABASE_URL | Vercel env / KMS |
| STRIPE_SECRET_KEY | Vercel env |
| STRIPE_WEBHOOK_SECRET | Vercel env |
| RESEND_API_KEY | Vercel env |
| GOOGLE_OAUTH_CLIENT_SECRET | Vercel env |
| HERMES_API_KEY | Vercel env (RankBoost) + Hermes env |
| ENCRYPTION_KEY | KMS / Vercel env |
| CRON_SECRET | Vercel env (header validation) |
| JWT_SECRET | Vercel env |

**Правила:** никаких secrets в коде, никаких secrets на клиенте, rotation каждые 90 дней.

### 13.5. Rate Limits

| Endpoint | Лимит |
|---|---|
| POST /api/audit/preview | 3 / hour per IP, 1 / day per URL |
| POST /api/auth/login | 10 / min per IP |
| POST /api/auth/register | 5 / hour per IP |
| Authenticated API | 100 / min per user |
| WordPress API calls | По тарифу (10–100 / day) |
| Hermes dispatch | По тарифу (AIUsage) |

**Реализация:** Redis sliding window.

### 13.6. Roles

| Role | Доступ |
|---|---|
| user | Свои сайты, dashboard, billing |
| support | Admin read + impersonate (logged) |
| analyst | Admin read-only (analytics, reports) |
| admin | Full admin + settings + user management |

**Impersonate:** support/admin может войти как user. Обязательный audit log. Баннер «Вы просматриваете как [user]».

### 13.7. Дополнительно

- CSP headers на всех страницах.
- Honeypot на публичных формах (уже реализовано).
- Stripe webhook signature verification.
- Hermes callback signature verification.
- Input validation на всех API endpoints.
- SQL injection: ORM / parameterized queries only.
- GDPR: export data, delete account, cookie consent.
- Logging: no PII in application logs.

---

## 14. Масштабирование

### 14.1. 100 клиентов

**Инфраструктура:**
- Vercel Pro (1 Next.js app).
- Neon PostgreSQL (free / launch tier).
- Redis: Upstash (1 instance).
- Hermes: 1 instance (2 workers).
- Resend: free tier.

**Нагрузка (оценка):**
- ~30 audits/day.
- ~50 Hermes jobs/day.
- ~100 emails/day.
- ~20 GB DB/year.

**Архитектура:** монолит, без изменений. Cron на Vercel.

**Узкие места:** Hermes single instance. Мониторить queue depth.

### 14.2. 1 000 клиентов

**Инфраструктура:**
- Vercel Pro (возможно Enterprise).
- Neon PostgreSQL (Pro, read replica).
- Redis: Upstash Pro (отдельные instances для queue и cache).
- Hermes: 3 instances (auto-scale по queue depth).
- Resend: Pro plan.
- CDN для статики и blog.

**Нагрузка (оценка):**
- ~300 audits/day.
- ~500 Hermes jobs/day.
- ~1 000 emails/day.
- ~200 GB DB.

**Изменения архитектуры:**
- Вынести Cron на выделенный worker (Railway).
- Hermes — отдельный deploy, horizontal scaling.
- Database read replica для dashboard queries.
- Кэш dashboard snapshot (Redis, TTL 5 min).
- Batch GSC sync (ночью, staggered).

**Узкие места:** LLM costs. Оптимизация промптов, кэширование crawl results.

### 14.3. 10 000 клиентов

**Инфраструктура:**
- Next.js: возможно разделение Marketing (SSG, CDN) и App (SSR).
- PostgreSQL: managed (RDS / Neon Enterprise), partitioning по `websiteId`.
- Redis Cluster.
- Hermes: Kubernetes / auto-scaling group, 10+ workers.
- Message queue: рассмотреть migration Redis → SQS / Pub/Sub для durability.
- Object storage (S3): crawl results, audit archives.
- Monitoring: Datadog / Grafana + PagerDuty.

**Нагрузка (оценка):**
- ~3 000 audits/day.
- ~5 000 Hermes jobs/day.
- ~10 000 emails/day.
- ~2 TB DB.

**Изменения архитектуры:**
- Event-driven: сервисы общаются через events (не только HTTP).
- CQRS для dashboard (read model отдельно).
- Sharding Hermes jobs по priority (paid > free).
- Multi-region consideration (EU primary).
- Dedicated team for on-call.

**Узкие места:** DB write throughput, LLM rate limits, Google API quotas.

### 14.4. Принципы масштабирования

1. **Модульность** — каждый сервис можно вынести без переписывания.
2. ** Stateless API** — horizontal scaling frontend/backend.
3. **Async by default** — тяжёлое в очередь.
4. **Cache aggressively** — dashboard, audit results, GSC data.
5. **Cost-aware** — LLM budget per user, per plan.

---

## 15. Roadmap

### 15.1. V2 (без изменения базовой архитектуры)

Новые модули подключаются как дополнительные сервисы и сущности. Ядро (Auth, Audit, Hermes, Queue, Billing) не меняется.

| Фича | Новые компоненты | Новые сущности |
|---|---|---|
| Backlinks / Authority Engine | `AuthorityService`, Hermes job `backlinks.analyze` | `BacklinkProfile`, `BacklinkOpportunity` |
| Публичные рейтинги | `PublicRatingService`, SEO-страницы | `PublicRating`, `RatingOptIn` |
| AI Visibility Monitor | `AIVisibilityService`, Hermes job `ai.visibility.check` | `AIVisibilitySnapshot` |
| Партнёрская программа | `PartnerService`, Stripe Connect | `Partner`, `Referral`, `Commission` |
| Approval Workflow | Расширение Content Service | `Article.approvalStatus`, `ApprovalRule` |
| Autopublish (opt-in) | Расширение WP Plugin | `PublishPolicy` |
| Shopify / Webflow | Новые adapters | `ShopifyConnection`, `WebflowConnection` |
| Slack / Telegram alerts | `NotificationService` | `NotificationChannel` |

**Архитектурный принцип V2:** каждая фича = новый adapter/service + новые таблицы. Существующие API endpoints не ломаются.

### 15.2. V3 (расширение платформы)

| Фича | Архитектурное решение |
|---|---|
| White-label для агентств | Multi-tenant: `Organization` entity, subdomain routing |
| API для разработчиков | Public API + API keys + rate limits (отдельный gateway) |
| Mobile app (PWA) | Тот же API, нативная оболочка |
| A/B Testing | `ExperimentService` + Hermes job `experiment.analyze` |
| Competitive Intelligence | Real-time monitoring worker + alerts |
| Multi-region | EU + US deploys, data residency |
| ML scoring model | Замена rule-based Growth Score на trained model (Hermes ML worker) |

### 15.3. Порядок реализации MVP → V2

```
MVP (сейчас)
  ├── Core: Auth, Audit, Dashboard, Growth Score, AI Tasks
  ├── Hermes: preview + full audit, content, scoring
  ├── Billing: Stripe subscriptions
  ├── Integrations: Google OAuth (GSC, GA4, GBP)
  ├── WordPress Plugin: Draft Autopilot
  ├── Email: monthly reports
  └── Admin Panel: basic

V2 (после PMF, ~6–12 мес)
  ├── Authority Engine
  ├── AI Visibility Monitor
  ├── Public Ratings
  ├── Partner Program
  ├── Approval Workflow + opt-in Autopublish
  └── Shopify / Webflow adapters

V3 (масштаб, ~12–24 мес)
  ├── White-label
  ├── Public API
  ├── ML Scoring
  └── Multi-region
```

---

## Приложение A. Environment Variables (MVP)

| Variable | Сервис |
|---|---|
| DATABASE_URL | PostgreSQL |
| REDIS_URL | Queue + Cache |
| JWT_SECRET | Auth |
| ENCRYPTION_KEY | Token encryption |
| STRIPE_SECRET_KEY | Billing |
| STRIPE_WEBHOOK_SECRET | Billing |
| RESEND_API_KEY | Email |
| GOOGLE_CLIENT_ID / SECRET | OAuth |
| HERMES_API_URL | Hermes |
| HERMES_API_KEY | Hermes |
| CRON_SECRET | Cron endpoints |
| NEXT_PUBLIC_SITE_URL | Frontend |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe Checkout |

## Приложение B. Glossary

| Термин | Определение |
|---|---|
| Hermes | Изолированный AI-worker сервис |
| Growth Score | Показатель готовности сайта к органическому росту (0–100) |
| AI Readiness | Показатель понятности сайта для AI-поиска (0–100) |
| AI Task | Приоритизированное действие для клиента |
| Draft Autopilot | Отправка черновиков в WordPress без автопубликации |
| MRR | Monthly Recurring Revenue |
| COGS | Cost of Goods Sold |
| BFF | Backend-for-Frontend (API routes в Next.js) |

---

*RankBoost.eu · System Architecture v1.0 · Июнь 2026*
