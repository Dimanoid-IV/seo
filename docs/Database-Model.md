# Database Model — RankBoost.eu

> Логическая модель данных для MVP SaaS-платформы RankBoost.
> Документ описывает **что** хранится и **как связано**, без Prisma, SQL и TypeScript.
>
> **Версия:** 1.0 · Июнь 2026  
> **Основа:** [Product-Bible.md](./Product-Bible.md) · [System-Architecture.md](./System-Architecture.md) · [User-Flows.md](./User-Flows.md)  
> **СУБД (целевая):** PostgreSQL

---

## Принципы модели данных

1. **Website — центр домена.** Аудиты, задачи, контент, интеграции и отчёты привязаны к сайту, не к пользователю напрямую.
2. **История не перезаписывается.** Growth Score, AI Readiness, Activity, отчёты — append-only.
3. **Секреты не в открытом виде.** OAuth tokens, API keys — только encrypted или hashed.
4. **Soft delete по умолчанию.** Жёсткое удаление — только по GDPR pipeline.
5. **Multi-tenant через Organization.** В MVP у большинства клиентов одна org = один user, но схема готова к росту.
6. **JSON для гибкости, реляции для целостности.** Результаты Hermes и breakdown scores — JSON; FK — для связей.
7. **Идемпотентность.** Stripe event ID, Hermes job ID, idempotency keys — уникальные constraints.

---

## Общая карта связей

```
User
 ├── Organization (0..1 owner, N members через membership — V2)
 │     └── Website (1..N)
 │           ├── Audit → AuditCheck
 │           ├── GrowthScoreSnapshot
 │           ├── AIReadinessSnapshot
 │           ├── Task
 │           ├── Activity
 │           ├── MonthlyPlan → PlanItem → Article / SocialPost
 │           ├── Article
 │           ├── SocialPost
 │           ├── Report
 │           ├── Integration → GoogleIntegrationData
 │           └── WordPressConnection
 ├── Subscription → Payment
 ├── PlanLimit (effective limits per billing period)
 ├── AIJob → AIUsage (line items)
 ├── EmailLog
 └── AdminNote (admin → user)

ErrorLog (system-wide, optional FK to entities)
```

---

## 1. User

### Назначение

Учётная запись человека, который входит в RankBoost: владелец бизнеса, маркетолог или сотрудник команды RankBoost (admin/support).

### Основные поля

- **id** — уникальный идентификатор (UUID).
- **email** — уникальный, логин и канал коммуникации.
- **passwordHash** — хеш пароля; пусто, если только OAuth-вход.
- **name** — отображаемое имя.
- **avatarUrl** — опционально, из Google OAuth.
- **role** — роль в системе: `user`, `support`, `analyst`, `admin`.
- **locale** — язык интерфейса: `ru`, `et`, `en`.
- **timezone** — для отправки отчётов (например `Europe/Tallinn`).
- **emailVerified** — подтверждён ли email.
- **emailVerifiedAt** — дата подтверждения.
- **googleAuthId** — внешний ID для входа через Google (отдельно от Google Integrations).
- **stripeCustomerId** — ID клиента в Stripe.
- **onboardingCompletedAt** — когда завершён onboarding.
- **lastLoginAt** — последний вход.
- **createdAt**, **updatedAt**, **deletedAt** — аудит и soft delete.

### Связи

- User **1 → 0..1** Organization (как владелец; в MVP часто создаётся автоматически при регистрации).
- User **1 → N** Subscription (история подписок; активна одна).
- User **1 → N** Payment.
- User **1 → N** AIUsage, AIJob, EmailLog.
- User **1 → N** Activity (кто инициировал действие).
- User **1 → N** AdminNote (как субъект или объект заметки).

### Статусы

Отдельного статуса User нет. Активность определяется через `deletedAt` и Subscription.

### Чувствительные данные

| Поле | Хранение |
|---|---|
| passwordHash | bcrypt, никогда в логах |
| email | PII, экспорт/удаление по GDPR |
| googleAuthId | PII-adjacent |
| stripeCustomerId | не секрет, но не публичный |

### Индексы

- Уникальный: `email` (where deletedAt is null).
- `stripeCustomerId`.
- `role` (для admin-запросов).
- `deletedAt` (фильтрация активных).

### Масштабирование

- Партиционирование не нужно до 100K+ users.
- `lastLoginAt` — для аналитики DAU/MAU без тяжёлых join.

---

## 2. Organization

### Назначение

Контейнер для multi-tenant: компания клиента, владеющая одним или несколькими сайтами. В MVP создаётся автоматически при регистрации (1 user = 1 org), но модель готова к командному доступу в V2.

### Основные поля

- **id** — UUID.
- **name** — название компании («Beauty Studio Tallinn»).
- **slug** — опционально, для URL/white-label (V2).
- **country** — страна (Эстония, и т.д.).
- **city** — город.
- **ownerUserId** — FK → User, владелец.
- **billingUserId** — FK → User, кто платит (в MVP = owner).
- **createdAt**, **updatedAt**, **deletedAt**.

### Связи

- Organization **1 → N** Website.
- Organization **1 → 1** активная Subscription (через owner/billing user или прямую FK — на выбор при реализации; логически подписка на уровне org).

### Статусы

- `active`, `suspended` (неоплата), `deleted` (через deletedAt).

### Чувствительные данные

- Название компании — бизнес-данные, не секрет.

### Индексы

- `ownerUserId`.
- `deletedAt`.

### Масштабирование

- V2: таблица `OrganizationMember` (userId, organizationId, role) — заложить в roadmap, не в MVP.

### MVP vs V2

- **MVP:** Organization всегда создаётся, 1:1 с user. UI не показывает «организацию» отдельно.
- **V2:** несколько users в org, передача владения, agency mode.

---

## 3. Website

### Назначение

Конкретный сайт клиента — центральная сущность продукта. Все продуктовые данные (аудит, задачи, score) привязаны к Website.

### Основные поля

- **id** — UUID.
- **organizationId** — FK → Organization.
- **url** — нормализованный URL (canonical domain, lowercase, без trailing slash).
- **displayName** — человекочитаемое имя (опционально).
- **niche** — ниша: `beauty`, `restaurant`, `ecommerce`, `b2b`, `other`.
- **cms** — `wordpress`, `shopify`, `webflow`, `tilda`, `nextjs`, `other`.
- **primaryLanguage** — основной язык контента: `ru`, `et`, `en`.
- **contentLanguages** — список языков (по тарифу: 1–3).
- **businessGoals** — JSON: выбранные цели из onboarding.
- **status** — `active`, `paused`, `archived`.
- **lastAuditAt** — дата последнего завершённого аудита.
- **currentGrowthScore** — денормализованное текущее значение (для быстрого dashboard; источник правды — GrowthScoreSnapshot).
- **currentAIReadinessScore** — аналогично.
- **createdAt**, **updatedAt**, **deletedAt**.

### Связи

- Website **N → 1** Organization.
- Website **1 → N** Audit, Task, Activity, Article, SocialPost, Report, Integration, WordPressConnection, GrowthScoreSnapshot, AIReadinessSnapshot, MonthlyPlan.

### Статусы

| Статус | Когда |
|---|---|
| active | Нормальная работа |
| paused | Подписка истекла, read-only |
| archived | Сайт удалён пользователем или заменён |

### Чувствительные данные

- URL — не секрет, но персонализированные данные клиента.

### Индексы

- Уникальный: `(organizationId, url)` where deletedAt is null.
- `organizationId`.
- `status`.
- `currentGrowthScore` (для admin-рейтингов V2).
- `lastAuditAt`.

### Масштабирование

- Лимит сайтов на org enforced через PlanLimit, не через DB.
- При 10K+ websites — индекс по `organizationId` + partition Activity по websiteId (V2).

---

## 4. Audit

### Назначение

Сессия анализа сайта: бесплатный preview, полный платный аудит или экспресс-перескан.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **type** — `preview`, `full`, `express`.
- **status** — жизненный цикл (см. ниже).
- **triggeredBy** — `user`, `cron`, `system`, `onboarding`.
- **triggeredByUserId** — FK → User, nullable.
- **aiJobId** — FK → AIJob, связь с Hermes.
- **growthScore** — итоговый score после завершения (денормализация).
- **aiReadinessScore** — итоговый AI Readiness.
- **summary** — краткое текстовое резюме для UI.
- **resultPayload** — JSON: полный результат Hermes (категории, findings).
- **pagesScanned** — количество просканированных страниц.
- **errorMessage** — человекочитаемая ошибка при failed.
- **startedAt**, **completedAt**.
- **createdAt**.

### Связи

- Audit **N → 1** Website.
- Audit **1 → N** AuditCheck.
- Audit **1 → N** Task (задачи, сгенерированные из этого аудита).
- Audit **1 → 0..1** AIJob.
- Audit **1 → 0..N** GrowthScoreSnapshot, AIReadinessSnapshot (при завершении).

### Статусы

```
queued → processing → completed
                   ↘ failed
                   ↘ cancelled
```

| Статус | UX |
|---|---|
| queued | «В очереди» |
| processing | «Анализируем сайт…» |
| completed | Результат на экране |
| failed | Retry + сообщение |
| cancelled | Пользователь отменил / timeout |

### Чувствительные данные

- resultPayload может содержать URL внутренних страниц — не публичный.

### Индексы

- `websiteId` + `createdAt` DESC (история аудитов).
- `status` (для admin/monitoring).
- `aiJobId`.
- `type` + `websiteId` (лимит preview: 1/URL/день).

### Масштабирование

- Старые resultPayload (> 12 мес) — архив в object storage, в DB только summary (V2).
- Не хранить полный HTML crawl в DB.

---

## 5. AuditCheck

### Назначение

Отдельная проверка внутри аудита. Вместо «100 ошибок» — структурированные findings, из которых генерируются Task.

### Основные поля

- **id** — UUID.
- **auditId** — FK → Audit.
- **category** — `technical`, `content`, `structure`, `local`, `ai_readiness`, `visibility`.
- **checkCode** — машинный код (`missing_meta_description`, `slow_lcp`, …).
- **severity** — `critical`, `high`, `medium`, `low`, `info`.
- **title** — заголовок для UI.
- **description** — объяснение «зачем важно».
- **recommendation** — что делать.
- **affectedUrl** — URL страницы, если применимо.
- **isVisibleInPreview** — показывалось ли в бесплатном аудите.
- **taskId** — FK → Task, если создана задача.
- **rawData** — JSON: технические детали для admin.
- **createdAt**.

### Связи

- AuditCheck **N → 1** Audit.
- AuditCheck **0..1 → 1** Task.

### Статусы

Нет отдельного статуса. Закрытие через связанную Task.

### Чувствительные данные

- Нет, кроме URL.

### Индексы

- `auditId`.
- `auditId` + `severity`.
- `checkCode` (аналитика: топ проблем по нише).

### Масштабирование

- Preview audit: максимум 5–10 AuditCheck с `isVisibleInPreview = true`.
- Full audit: до 100–200 checks; пагинация в UI.

---

## 6. GrowthScoreSnapshot

### Назначение

Историческая точка Growth Score. **Никогда не обновляется** — только вставка новых записей.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **score** — 0–100, итоговое значение.
- **previousScore** — предыдущее значение (для delta в UI).
- **delta** — изменение (+6, −2).
- **breakdown** — JSON:
  - `technical` (0–100)
  - `content` (0–100)
  - `structure` (0–100)
  - `local` (0–100)
  - `visibility` (0–100)
  - `tasks` (0–100)
- **trigger** — `audit_completed`, `task_completed`, `gsc_sync`, `cron_reconcile`, `manual`.
- **triggerEntityType** — `audit`, `task`, `integration`, null.
- **triggerEntityId** — UUID связанной сущности.
- **auditId** — FK → Audit, nullable.
- **recordedAt** — момент фиксации (может отличаться от createdAt).

### Связи

- GrowthScoreSnapshot **N → 1** Website.
- Опционально **N → 1** Audit.

### Статусы

Нет.

### Чувствительные данные

Нет.

### Индексы

- `websiteId` + `recordedAt` DESC — главный запрос (график, отчёты).
- `websiteId` + `score` (admin analytics V2).

### Масштабирование

- Append-only: ~4–12 записей/месяц на сайт → 50K записей при 5K сайтов — OK.
- Retention policy: хранить все в MVP; V2 — rollup по месяцам старше 24 мес.

### Логика (важно)

1. После каждого значимого события — **новая строка**, не UPDATE.
2. `Website.currentGrowthScore` обновляется синхронно для dashboard.
3. Email-отчёт читает snapshot на начало и конец периода.

---

## 7. AIReadinessSnapshot

### Назначение

История AI Readiness Score — отдельно от Growth Score.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **score** — 0–100.
- **previousScore**, **delta**.
- **breakdown** — JSON:
  - `structuredData`
  - `expertise`
  - `clarity`
  - `crawlability`
  - `entities`
  - `freshness`
- **trigger** — аналогично GrowthScoreSnapshot.
- **triggerEntityId**, **auditId**.
- **recordedAt**.

### Связи

- AIReadinessSnapshot **N → 1** Website.

### Индексы

- `websiteId` + `recordedAt` DESC.

### Масштабирование

- Те же принципы, что GrowthScoreSnapshot.

---

## 8. Task

### Назначение

AI Task — приоритизированное действие для клиента. Главный рабочий инструмент дашборда.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **auditId** — FK → Audit, источник.
- **auditCheckId** — FK → AuditCheck, nullable.
- **title** — заголовок.
- **description** — «зачем» (2–3 предложения).
- **instructions** — JSON: массив шагов `{ step, text }`.
- **priority** — `critical`, `high`, `medium`, `low`.
- **category** — `technical`, `content`, `local`, `ai_readiness`, `social`.
- **status** — см. ниже.
- **expectedScoreImpact** — ожидаемый прирост Growth Score (3–5).
- **canAutoFix** — доступна ли кнопка «Исправить автоматически».
- **autoFixType** — `generate_article`, `generate_social`, `generate_faq`, `generate_meta`, null.
- **requiresDeveloper** — нужен ли разработчик.
- **dueDate** — рекомендуемый срок.
- **sortOrder** — порядок в списке.
- **completedAt**, **skippedAt**.
- **skipReason** — `not_relevant`, `too_complex`, `later`, null.
- **linkedArticleId**, **linkedSocialPostId** — FK, если auto-fix создал контент.
- **createdAt**, **updatedAt**.

### Связи

- Task **N → 1** Website, Audit.
- Task **0..1 → 1** Article, SocialPost.

### Статусы

```
todo → in_progress → done
                  ↘ skipped
```

### Чувствительные данные

Нет.

### Индексы

- `websiteId` + `status` + `priority` (главный список задач).
- `websiteId` + `completedAt` (отчёты).
- `auditId`.
- Partial index: `status = 'todo'` для подсчёта active tasks (лимит тарифа).

### Масштабирование

- Лимит active tasks enforced в приложении (10/20/unlimited).
- Архив done/skipped старше 12 мес — optional collapse в Activity only (V2).

---

## 9. Activity

### Назначение

Лента активности — хронологический лог всех значимых событий для UX и email-отчётов.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **userId** — FK → User, кто инициировал (nullable для system/cron).
- **type** — тип события (см. ниже).
- **title** — человекочитаемый заголовок для UI.
- **body** — опциональное описание.
- **metadata** — JSON: контекст (oldScore, newScore, taskTitle, articleId, …).
- **entityType** — `audit`, `task`, `article`, `integration`, `report`, `subscription`, …
- **entityId** — UUID для deep link.
- **isPinned** — закрепить вверху (V2).
- **createdAt**.

### Типы событий (type)

- `audit_started`, `audit_completed`, `audit_failed`
- `task_completed`, `task_skipped`
- `growth_score_changed`, `ai_readiness_changed`
- `article_created`, `article_sent_to_wordpress`
- `social_post_created`
- `integration_connected`, `integration_disconnected`, `integration_sync_failed`
- `report_sent`, `report_viewed`
- `subscription_created`, `subscription_upgraded`, `subscription_canceled`
- `payment_succeeded`, `payment_failed`
- `onboarding_completed`

### Связи

- Activity **N → 1** Website.
- Activity **N → 0..1** User.

### Статусы

Нет. Append-only.

### Индексы

- `websiteId` + `createdAt` DESC — лента.
- `websiteId` + `type` (фильтры).
- `entityType` + `entityId` (обратный поиск).

### Масштабирование

- Самая быстрорастущая таблица. При 10K clients — partition по `createdAt` (месяц).
- UI показывает 50 последних; полная история в Reports.

### Правило

**Каждое важное действие создаёт Activity** — в одном месте приложения (`ActivityService.log`), не разбросано по сервисам.

---

## 10. MonthlyPlan

### Назначение

Контент-план на календарный месяц для сайта.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **yearMonth** — `2026-06` (YYYY-MM).
- **status** — `generating`, `ready`, `active`, `archived`.
- **aiJobId** — FK → AIJob, если генерировался через Hermes.
- **generatedAt**.
- **createdAt**, **updatedAt**.

### Связи

- MonthlyPlan **N → 1** Website.
- MonthlyPlan **1 → N** PlanItem (логически; в документе PlanItem может быть полем или отдельной сущностью — здесь как вложенные записи через отдельную таблицу **PlanItem** или JSON-массив `items` в MonthlyPlan).

**Рекомендация для Prisma:** отдельная сущность **PlanItem**:

- **id**, **monthlyPlanId**, **type** (`article`, `social_post`), **topic**, **targetKeyword**, **status** (`planned`, `in_progress`, `done`), **linkedArticleId**, **linkedSocialPostId**, **sortOrder**.

### Индексы

- Уникальный: `(websiteId, yearMonth)`.
- `websiteId` + `status`.

---

## 11. Article

### Назначение

SEO-статья, сгенерированная AI или отредактированная пользователем.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **monthlyPlanId** / **planItemId** — FK, nullable.
- **aiJobId** — FK → AIJob.
- **title**, **slug**, **metaDescription**.
- **content** — HTML или Markdown.
- **contentFormat** — `html`, `markdown`.
- **targetKeyword**.
- **wordCount**.
- **language** — `ru`, `et`, `en`.
- **status** — см. ниже.
- **wpPostId** — ID поста в WordPress.
- **wpEditUrl** — ссылка на редактор WP.
- **approvedAt**, **approvedByUserId**.
- **sentToWpAt**.
- **publishedAt** — когда клиент отметил «опубликовано» (honor system в MVP).
- **version** — номер версии при перегенерации.
- **createdAt**, **updatedAt**, **deletedAt**.

### Статусы

```
generating → draft → review → approved → sent_to_wp → published
          ↘ failed
```

### Связи

- Article **N → 1** Website.
- Article **0..1 → 1** AIJob, PlanItem, Task.

### Индексы

- `websiteId` + `status`.
- `websiteId` + `createdAt` DESC.
- `aiJobId`.

---

## 12. SocialPost

### Назначение

Пост для соцсетей (Instagram, Facebook, LinkedIn).

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **planItemId**, **aiJobId** — FK, nullable.
- **platform** — `instagram`, `facebook`, `linkedin`.
- **content** — текст поста.
- **hashtags** — строка или JSON-массив.
- **visualIdea** — описание визуала.
- **language**.
- **status** — `generating`, `draft`, `approved`, `published`.
- **relatedTaskId** — FK → Task.
- **scheduledFor** — nullable, рекомендация (не реальное расписание в MVP).
- **createdAt**, **updatedAt**.

### Индексы

- `websiteId` + `createdAt` DESC.
- `websiteId` + `platform`.

---

## 13. Report

### Назначение

Сохранённый ежемесячный (или mid-month) отчёт для архива в дашборде и повторной отправки.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **userId** — FK → User (получатель).
- **type** — `monthly`, `mid_month`, `audit_summary`, `custom`.
- **periodStart**, **periodEnd** — границы отчётного периода.
- **title** — «Ваш прогресс за май 2026».
- **growthScoreStart**, **growthScoreEnd**, **growthScoreDelta**.
- **aiReadinessStart**, **aiReadinessEnd**, **aiReadinessDelta**.
- **trafficSummary** — JSON: клики, delta %, top queries.
- **tasksCompleted** — JSON: список выполненных задач.
- **upcomingTasks** — JSON: топ-3 на следующий период.
- **contentSummary** — JSON: articles count, posts count.
- **htmlContent** — отрендеренный HTML отчёта.
- **emailLogId** — FK → EmailLog, если отправлен.
- **status** — `generating`, `ready`, `sent`, `failed`.
- **generatedAt**, **sentAt**.
- **createdAt**.

### Связи

- Report **N → 1** Website, User.
- Report **0..1 → 1** EmailLog.

### Индексы

- `websiteId` + `periodEnd` DESC.
- `userId` + `type`.

### Масштабирование

- htmlContent может быть большим — V2: хранить в S3, в DB только URL.

---

## 14. Integration

### Назначение

Подключение внешнего сервиса к сайту. В MVP — Google (GSC, GA4, GBP). Одна запись на пару (website, provider).

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website.
- **provider** — `google_gsc`, `google_ga4`, `google_gbp`.
- **status** — `pending`, `connected`, `expired`, `error`, `disconnected`.
- **encryptedCredentials** — AES-256: access_token, refresh_token, expiry.
- **scopes** — JSON-массив granted scopes.
- **externalAccountId** — Google account email или ID (для отображения).
- **externalPropertyId** — выбранный GSC property / GA4 property / GBP location ID.
- **externalPropertyName** — отображаемое имя («beautystudio.ee»).
- **lastSyncAt** — последняя успешная синхронизация.
- **lastSyncStatus** — `success`, `partial`, `failed`.
- **lastError** — текст ошибки для UI (не stack trace).
- **lastErrorAt**.
- **connectedAt**, **disconnectedAt**.
- **createdAt**, **updatedAt**.

### Связи

- Integration **N → 1** Website.
- Integration **1 → N** GoogleIntegrationData.

### Статусы

| Статус | UI |
|---|---|
| pending | OAuth начат, не завершён |
| connected | Зелёная галочка |
| expired | «Переподключите» |
| error | Жёлтый/красный, retry |
| disconnected | Пользователь отключил |

### Чувствительные данные

| Поле | Хранение |
|---|---|
| encryptedCredentials | AES-256-GCM, ключ в KMS/env |
| externalAccountId | PII, не в логах |

**Никогда не хранить:** plaintext tokens, refresh tokens в логах.

### Индексы

- Уникальный: `(websiteId, provider)` where status != disconnected.
- `status` + `lastSyncAt` (cron: кому нужен sync).
- `lastErrorAt` (admin monitoring).

---

## 15. GoogleIntegrationData

### Назначение

Периодические снимки метрик из Google-интеграций. Отдельно от Integration, чтобы не перезаписывать историю.

### Основные поля

- **id** — UUID.
- **integrationId** — FK → Integration.
- **websiteId** — FK → Website (денормализация для быстрых запросов).
- **dataType** — `gsc_queries`, `gsc_traffic`, `gsc_indexing`, `ga4_sessions`, `ga4_sources`, `gbp_insights`, `gbp_reviews`.
- **periodStart**, **periodEnd** — период данных.
- **metrics** — JSON: структура зависит от dataType.
  - GSC traffic: `{ clicks, impressions, ctr, position }`
  - Top queries: `[{ query, clicks, impressions }]`
  - GA4: `{ sessions, users, conversions }`
  - GBP: `{ views, actions, reviewCount, averageRating }`
- **syncedAt**.
- **createdAt**.

### Связи

- GoogleIntegrationData **N → 1** Integration, Website.

### Индексы

- `websiteId` + `dataType` + `periodEnd` DESC.
- `integrationId` + `syncedAt` DESC.

### Масштабирование

- Retention: 90 дней детальных snapshots в MVP; старше — monthly rollup (V2).
- metrics JSON — не больше 500KB на запись; агрегировать top N queries.

---

## 16. WordPressConnection

### Назначение

Связь между Website в RankBoost и WordPress-сайтом клиента через плагин.

### Основные поля

- **id** — UUID.
- **websiteId** — FK → Website (уникальный — один WP на сайт в MVP).
- **wpSiteUrl** — URL WordPress-инсталляции.
- **encryptedApiKey** — зашифрованный API key для плагина.
- **apiKeyPrefix** — первые 8 символов для идентификации в UI (`rb_live_abcd…`).
- **apiKeyHash** — SHA-256 для верификации без расшифровки.
- **pluginVersion** — версия RankBoost Connector.
- **status** — `pending`, `active`, `error`, `disconnected`.
- **lastHealthCheckAt** — последняя успешная проверка `/health`.
- **lastPushAt** — последняя отправка черновика.
- **lastError**.
- **connectedAt**, **disconnectedAt**.
- **createdAt**, **updatedAt**.

### Связи

- WordPressConnection **1 → 1** Website (MVP).

### Чувствительные данные

| Поле | Хранение |
|---|---|
| encryptedApiKey | AES-256; показан пользователю 1 раз при создании |
| apiKeyHash | для аутентификации запросов от WP |

### Индексы

- Уникальный: `websiteId`.
- `status`.
- `apiKeyHash` (lookup при verify).

---

## 17. Subscription

### Назначение

Подписка клиента на тарифный план. Синхронизируется со Stripe.

### Основные поля

- **id** — UUID.
- **organizationId** — FK → Organization (рекомендуется).
- **userId** — FK → User (billing contact).
- **plan** — `free`, `audit`, `start`, `growth`, `pro`, `partner`.
- **status** — см. ниже.
- **stripeCustomerId** — денормализация из User.
- **stripeSubscriptionId** — уникальный ID подписки Stripe.
- **stripePriceId** — текущий price в Stripe.
- **amountEur** — сумма в EUR (без VAT).
- **currency** — `EUR`.
- **interval** — `month`, `one_time` (для audit-only).
- **currentPeriodStart**, **currentPeriodEnd**.
- **minTermEndsAt** — дата окончания минимального срока (3 мес).
- **cancelAtPeriodEnd** — boolean.
- **canceledAt**, **endedAt**.
- **trialEndsAt** — nullable.
- **createdAt**, **updatedAt**.

### Статусы

| Статус | Описание |
|---|---|
| trialing | Пробный период |
| active | Оплачено, доступ полный |
| past_due | Ошибка оплаты, grace period |
| canceled | Отменена, активна до period end |
| expired | Период закончился |
| incomplete | Checkout начат, не завершён |

### Связи

- Subscription **N → 1** Organization, User.
- Subscription **1 → N** Payment.
- Subscription **1 → 1** PlanLimit (текущий период).

### Индексы

- Уникальный: `stripeSubscriptionId`.
- `organizationId` + `status`.
- `currentPeriodEnd` (cron: renewal reminders).
- `status` = `past_due` (dunning).

---

## 18. Payment

### Назначение

Отдельный платёж — разовый аудит или ежемесячное списание подписки.

### Основные поля

- **id** — UUID.
- **subscriptionId** — FK → Subscription, nullable (разовый аудит без подписки).
- **userId** — FK → User.
- **organizationId** — FK → Organization.
- **stripePaymentIntentId** — или `stripeInvoiceId`.
- **stripeCheckoutSessionId** — для первого платежа.
- **amountEur**, **currency**.
- **vatAmountEur** — nullable.
- **status** — `pending`, `succeeded`, `failed`, `refunded`.
- **failureReason** — текст для admin.
- **paidAt**.
- **invoiceUrl** — ссылка на PDF в Stripe.
- **idempotencyKey** — защита от дублей webhook.
- **createdAt**.

### Индексы

- Уникальный: `stripePaymentIntentId`, `idempotencyKey`.
- `userId` + `paidAt` DESC.
- `subscriptionId`.
- `status`.

---

## 19. PlanLimit

### Назначение

Эффективные лимиты тарифа на текущий биллинг-период. Отдельная сущность, чтобы не хардкодить в коде и поддерживать overrides (partner, promo).

### Основные поля

- **id** — UUID.
- **subscriptionId** — FK → Subscription.
- **organizationId** — FK → Organization.
- **plan** — копия plan на момент периода.
- **periodStart**, **periodEnd** — границы периода.
- **limits** — JSON:
  - `auditsPerMonth`
  - `expressScansPerMonth`
  - `activeTasksMax`
  - `taskGenerationsPerMonth`
  - `articlesPerMonth`
  - `socialPostsPerMonth`
  - `websitesMax`
  - `contentLanguagesMax`
  - `wpApiCallsPerDay`
  - `emailReportsPerMonth`
  - `googleIntegrations` — массив: `gsc`, `ga4`, `gbp`
- **usage** — JSON (текущее потребление, дублирует AIUsage для быстрого check):
  - те же ключи с текущими счётчиками.
- **createdAt**, **updatedAt**.

### Связи

- PlanLimit **1 → 1** Subscription (на период).
- Синхронизируется с **AIUsage** (детализация по job).

### Индексы

- `organizationId` + `periodEnd` DESC.
- `subscriptionId`.

### Логика

- Создаётся при `invoice.paid` / начале периода.
- `usage` инкрементируется при каждой операции.
- 1-го числа cron сбрасывает usage (новая PlanLimit или reset).

---

## 20. AIJob

### Назначение

Запись о задаче, отправленной в Hermes. Трассировка, статус, стоимость.

### Основные поля

- **id** — UUID.
- **externalJobId** — ID job в Hermes (уникальный).
- **idempotencyKey** — уникальный ключ запроса.
- **jobType** — `audit.preview`, `audit.full`, `audit.express`, `tasks.generate`, `content.article`, `content.social`, `content.plan`, `score.growth`, `score.ai_readiness`, `report.compile`, `competitors.snapshot`.
- **status** — `queued`, `processing`, `completed`, `failed`, `cancelled`.
- **websiteId** — FK → Website.
- **userId** — FK → User.
- **organizationId** — FK → Organization.
- **relatedEntityType** — `audit`, `article`, `social_post`, `monthly_plan`, `report`.
- **relatedEntityId** — UUID.
- **locale** — `ru`, `et`, `en`.
- **inputParams** — JSON: параметры запроса (без секретов).
- **resultSummary** — JSON: краткий результат.
- **model** — использованная LLM (`gpt-4o`, `claude-3-5-sonnet`, …).
- **tokensInput**, **tokensOutput**.
- **estimatedCostEur** — расчётная стоимость.
- **durationMs**.
- **retryCount**.
- **errorCode**, **errorMessage**.
- **queuedAt**, **startedAt**, **completedAt**.
- **createdAt**.

### Связи

- AIJob **N → 1** Website, User, Organization.
- AIJob **1 → 0..N** AIUsage (агрегация).
- AIJob referenced by Audit, Article, SocialPost, MonthlyPlan, Report.

### Индексы

- Уникальный: `externalJobId`, `idempotencyKey`.
- `websiteId` + `createdAt` DESC.
- `status` + `queuedAt` (worker polling).
- `organizationId` + `completedAt` (COGS отчёты).
- `jobType` + `createdAt` (analytics).

### Масштабирование

- Самая важная таблица для unit economics.
- Partition по `createdAt` при > 1M rows.

---

## 21. AIUsage

### Назначение

Агрегированный учёт потребления AI и лимитов за биллинг-период. Для dashboard «2/4 статьи» и admin COGS.

### Основные поля

- **id** — UUID.
- **organizationId** — FK → Organization.
- **userId** — FK → User.
- **websiteId** — FK → Website, nullable (org-level ops).
- **planLimitId** — FK → PlanLimit.
- **yearMonth** — `2026-06` или точный `periodStart`/`periodEnd`.
- **counters** — JSON:
  - `audits`, `expressScans`, `taskGenerations`
  - `articles`, `socialPosts`
  - `hermesJobsTotal`
  - `wpApiCalls`
  - `tokensInputTotal`, `tokensOutputTotal`
- **estimatedCostEur** — суммарная стоимость за период.
- **lastAIJobId** — последний job (debug).
- **updatedAt**.

### Связь с AIJob

Каждый завершённый AIJob **инкрементирует** соответствующий счётчик в AIUsage и добавляет к `estimatedCostEur`.

Детализация по модели — в AIJob; AIUsage — rollup.

### Индексы

- Уникальный: `(organizationId, websiteId, yearMonth)` или `(planLimitId)`.
- `organizationId` + `estimatedCostEur` (admin: high COGS accounts).

---

## 22. EmailLog

### Назначение

Лог всех отправленных писем: отчёты, transactional, alerts.

### Основные поля

- **id** — UUID.
- **userId** — FK → User.
- **websiteId** — FK → Website, nullable.
- **reportId** — FK → Report, nullable.
- **type** — `report_monthly`, `report_mid_month`, `audit_ready`, `welcome`, `payment_receipt`, `payment_failed`, `subscription_canceled`, `email_verification`, `password_reset`, `integration_error`, `alert_pro`.
- **toEmail**.
- **subject**.
- **provider** — `resend`.
- **providerMessageId** — ID в Resend.
- **status** — `queued`, `sent`, `delivered`, `bounced`, `failed`, `complained`.
- **failureReason**.
- **openedAt**, **clickedAt** — nullable, если tracking доступен.
- **sentAt**.
- **createdAt**.

### Индексы

- `userId` + `sentAt` DESC.
- `providerMessageId`.
- `websiteId` + `type`.
- `status` = `failed` (retry queue).

---

## 23. AdminNote

### Назначение

Внутренние заметки команды RankBoost о клиенте. Не видны пользователю.

### Основные поля

- **id** — UUID.
- **authorUserId** — FK → User (admin/support).
- **targetUserId** — FK → User.
- **targetOrganizationId** — FK → Organization, nullable.
- **targetWebsiteId** — FK → Website, nullable.
- **content** — текст заметки.
- **isPinned**.
- **createdAt**, **updatedAt**.

### Индексы

- `targetUserId` + `createdAt` DESC.
- `targetOrganizationId`.

---

## 24. ErrorLog

### Назначение

Системный лог ошибок для admin и отладки. Не показывается клиенту напрямую.

### Основные поля

- **id** — UUID.
- **severity** — `warning`, `error`, `critical`.
- **source** — `hermes`, `stripe_webhook`, `google_sync`, `wordpress_push`, `email`, `cron`, `api`.
- **code** — машинный код ошибки.
- **message** — краткое описание.
- **stackTrace** — только в non-production или truncated.
- **context** — JSON: requestId, userId, websiteId, aiJobId (без PII и секретов).
- **userId**, **websiteId**, **aiJobId**, **integrationId** — nullable FK.
- **resolvedAt**, **resolvedByUserId** — для admin workflow.
- **createdAt**.

### Индексы

- `createdAt` DESC.
- `source` + `severity`.
- `resolvedAt` IS NULL (открытые ошибки).
- `websiteId` (support: проблемы клиента).

### Retention

- 90 дней в hot storage; архив после (V2).

---

## Отдельные разделы

### 1. Multi-tenant логика

```
User (владелец)
  └── Organization (1:1 в MVP, 1:N users в V2)
        └── Website (1..N, лимит по тарифу)
              ├── Audit / AuditCheck
              ├── GrowthScoreSnapshot / AIReadinessSnapshot
              ├── Task
              ├── Activity
              ├── MonthlyPlan / Article / SocialPost
              ├── Report
              ├── Integration / GoogleIntegrationData
              └── WordPressConnection
```

**Правила доступа:**

- User видит только Organizations, где он owner (MVP) или member (V2).
- Все запросы к Website проверяют `organizationId` через membership.
- Subscription и PlanLimit — на уровне Organization (один счёт на компанию).
- AIUsage агрегируется на org + опционально website.

**Автосоздание в MVP:**

При регистрации: User → Organization (name = email или имя) → Website (из free audit URL).

---

### 2. Логика подписок

| Поле | Где | Зачем |
|---|---|---|
| plan | Subscription | `start`, `growth`, `pro`, … |
| status | Subscription | доступ к фичам |
| stripeCustomerId | User + Subscription | Stripe Customer |
| stripeSubscriptionId | Subscription | webhook matching |
| limits | PlanLimit | enforcement |
| usage | PlanLimit + AIUsage | счётчики |

**Жизненный цикл:**

1. Free audit → без Subscription или `plan = free`.
2. Checkout → `incomplete` → webhook → `active`.
3. Каждый месяц `invoice.paid` → новый PlanLimit period / reset usage.
4. `past_due` → grace 3 дня → email → `expired` + Website.status = paused.
5. Cancel → `cancelAtPeriodEnd = true` → до `currentPeriodEnd` доступ есть.

**Разовый аудит (99€):**

- Subscription с `plan = audit`, `interval = one_time`, `currentPeriodEnd` = +30 дней.
- PlanLimit с урезанными лимитами (5 tasks, no content).

---

### 3. Логика AI-расходов

**На уровне AIJob (детально):**

- `model` — какая модель.
- `tokensInput`, `tokensOutput`.
- `estimatedCostEur` — по UnitCostConfig.
- `websiteId`, `userId`, `organizationId` — кому списать.
- `relatedEntityType/Id` — к какой задаче/аудиту относится.

**На уровне AIUsage (агрегат):**

- Сумма `estimatedCostEur` за период.
- Счётчики по типам операций.

**Admin алерт:**

- IF `AIUsage.estimatedCostEur` > 50% `Subscription.amountEur` → flag account.

**Не хранить:**

- Полные промпты с PII в ErrorLog/AIJob (только hash или truncate).

---

### 4. Логика Growth Score

1. **Только INSERT** в GrowthScoreSnapshot.
2. Триггеры: audit_completed, task_completed, gsc_sync, cron_reconcile.
3. `previousScore` и `delta` — вычисляются при вставке из последнего snapshot.
4. `Website.currentGrowthScore` — кэш для dashboard.
5. График в UI: SELECT по `websiteId ORDER BY recordedAt`.
6. Email Report: snapshot на `periodStart` vs `periodEnd`.
7. Score не падает больше чем на 5 за раз — бизнес-правило в сервисе, не в DB.

---

### 5. Логика Activity Feed

**Обязательные события:**

| Действие | type |
|---|---|
| Аудит завершён | audit_completed |
| Задача выполнена | task_completed |
| Score изменился | growth_score_changed |
| Статья создана / в WP | article_created, article_sent_to_wordpress |
| Интеграция | integration_connected, integration_sync_failed |
| Отчёт | report_sent |
| Оплата | payment_succeeded, payment_failed |
| Подписка | subscription_upgraded, subscription_canceled |

**Поля metadata примеры:**

- score_changed: `{ "from": 58, "to": 62, "trigger": "task_completed" }`
- task_completed: `{ "taskId", "taskTitle", "scoreImpact": 3 }`

---

### 6. Логика интеграций

| Данные | Хранение |
|---|---|
| Google OAuth tokens | Integration.encryptedCredentials (AES-256) |
| WordPress API key | WordPressConnection.encryptedApiKey + apiKeyHash |
| Статус | Integration.status, WordPressConnection.status |
| Последний sync | Integration.lastSyncAt, lastSyncStatus |
| Метрики | GoogleIntegrationData (snapshots) |

**При disconnect:**

- status → `disconnected`
- encryptedCredentials → NULL (или soft wipe)
- GoogleIntegrationData — сохраняется для истории отчётов (до GDPR delete)

**При token refresh:**

- UPDATE encryptedCredentials только; новый Activity не нужен (слишком шумно).

---

### 7. Логика удаления данных

**Soft delete (`deletedAt`):**

- User, Organization, Website, Article.

**GDPR delete request:**

1. User запрашивает в Settings.
2. Подтверждение email.
3. `User.deletedAt = now`, anonymize: email → `deleted_{id}@rankboost.eu`, name → «Deleted User».
4. Cascade anonymize/wipe:
   - Integration.encryptedCredentials → NULL
   - WordPressConnection.encryptedApiKey → NULL
   - Stripe — delete customer via API (или anonymize)
5. Hard delete через 30 дней (cron job): PII fields, credentials.
6. Оставить anonymized aggregates для billing/accounting (Payment records без PII) — юридическое требование.

**Website delete:**

- Soft delete Website; Tasks, Articles — soft delete или orphan с archived status.
- Activity — сохранять anonymized для admin analytics (V2 policy).

---

### 8. MVP vs V2

#### Нужны сразу (MVP)

| Сущность | MVP |
|---|---|
| User | ✓ |
| Organization | ✓ (auto 1:1) |
| Website | ✓ |
| Audit, AuditCheck | ✓ |
| GrowthScoreSnapshot, AIReadinessSnapshot | ✓ |
| Task, Activity | ✓ |
| MonthlyPlan + PlanItem | ✓ |
| Article, SocialPost | ✓ |
| Report, EmailLog | ✓ |
| Integration, GoogleIntegrationData | ✓ |
| WordPressConnection | ✓ |
| Subscription, Payment, PlanLimit | ✓ |
| AIJob, AIUsage | ✓ |
| AdminNote, ErrorLog | ✓ (minimal admin) |

#### Заложить поля сейчас, использовать в V2

| Сущность | Поле | V2 use |
|---|---|---|
| Organization | slug | white-label, agency |
| User | — | OrganizationMember table |
| Website | — | public rating opt-in |
| Integration | — | Shopify, Webflow providers |
| AIJob | jobType | `ai.visibility.check`, `backlinks.analyze` |
| Report | type | `partner_summary` |
| Subscription | plan | `partner` custom limits |
| Activity | isPinned | dashboard highlights |
| ErrorLog | — | alerting integrations |

#### Не создавать в MVP

- OrganizationMember (командный доступ)
- Referral / Partner / Commission
- BacklinkProfile
- AIVisibilitySnapshot (отдельная таблица — V2; пока можно в GoogleIntegrationData-like)
- PublicRating
- Experiment / AB test

---

## Проверочный список перед созданием Prisma Schema

### Целостность и связи

- [ ] У каждой сущности есть первичный ключ (UUID).
- [ ] Все FK имеют ON DELETE правила (RESTRICT для Payment, CASCADE для AuditCheck при Audit delete запрещён — soft delete only).
- [ ] Website — центр; нет «висячих» Task без websiteId.
- [ ] Organization вставлена между User и Website; subscription на org, не на user.
- [ ] Уникальные constraints: email, (organizationId, url), (websiteId, provider), stripeSubscriptionId, externalJobId, idempotencyKey.

### Безопасность

- [ ] Нет plaintext полей для tokens, API keys, passwords.
- [ ] encryptedCredentials / encryptedApiKey — отдельные поля, не JSON mixed with public data.
- [ ] ErrorLog.context — документирован список запрещённых полей (tokens, passwords, full prompts).
- [ ] apiKey показывается пользователю 1 раз — в DB только encrypted + hash.

### Индексы

- [ ] Все FK проиндексированы.
- [ ] Activity: (websiteId, createdAt DESC).
- [ ] GrowthScoreSnapshot: (websiteId, recordedAt DESC).
- [ ] AIJob: (status, queuedAt) для workers.
- [ ] Integration: (status, lastSyncAt) для cron.
- [ ] Partial unique indexes для soft delete (email WHERE deletedAt IS NULL).

### Бизнес-правила в схеме vs приложении

- [ ] Лимиты тарифа — PlanLimit JSON, не hardcoded в schema.
- [ ] Score history — append-only, нет updatedAt на GrowthScoreSnapshot.
- [ ] Статусы — enum в Prisma, синхронизированы с User-Flows.md.
- [ ] Минимальный срок подписки — minTermEndsAt, enforcement в Billing Service.

### Масштабирование

- [ ] JSON columns (resultPayload, metrics, breakdown) — осознанный выбор; лимит размера документирован.
- [ ] План partition для Activity и AIJob при > 1M rows.
- [ ] Denormalization (currentGrowthScore, amountEur) — помечена как cache, источник правды — snapshot.

### GDPR

- [ ] deletedAt на User, Organization, Website, Article.
- [ ] EmailLog хранит toEmail — включить в delete pipeline.
- [ ] GoogleIntegrationData — политика retention 90 дней.
- [ ] Payment records — retention для accounting отдельно от PII.

### Stripe

- [ ] stripeCustomerId на User.
- [ ] stripeSubscriptionId уникален на Subscription.
- [ ] Payment.idempotencyKey уникален для webhook dedup.
- [ ] Payment связан с Subscription и Organization.

### Hermes / AI

- [ ] AIJob.externalJobId уникален.
- [ ] AIJob → relatedEntity polymorphic (type + id) или явные nullable FK.
- [ ] AIUsage синхронизируется с PlanLimit.usage — определить single source of truth.
- [ ] estimatedCostEur precision (DECIMAL 10,4).

### Тестовые данные

- [ ] Seed: 1 org, 1 user, 1 website, 1 subscription start, sample audit + 5 tasks + 3 snapshots.
- [ ] Seed не содержит real tokens.

### Согласованность с документацией

- [ ] Статусы Task = User-Flows §8.
- [ ] Статусы Article = User-Flows §10.
- [ ] Тарифы и лимиты = Product-Bible §21.
- [ ] Типы Activity = User-Flows §9.
- [ ] Job types = System-Architecture §6.4.

### Миграции

- [ ] Первая миграция — все MVP таблицы (не по одной).
- [ ] Enum changes — strategy documented (add value, never rename in prod).
- [ ] Backfill plan для Organization (create from existing Users).

---

*RankBoost.eu · Database Model v1.0 · Июнь 2026*
