# API Design — RankBoost.eu

> Спецификация REST API для MVP SaaS-платформы RankBoost.
> Основана на Product Bible, System Architecture, User Flows и Database Model.
>
> **Версия:** 1.0 · Июнь 2026  
> **Base URL:** `https://rankboost.eu/api`  
> **Формат:** JSON · UTF-8 · `Content-Type: application/json`

---

## Общие соглашения

### Аутентификация

| Контекст | Механизм |
|---|---|
| Клиентский API | `Authorization: Bearer <access_token>` (JWT, TTL 15 мин) |
| Refresh | HttpOnly cookie `rb_refresh` или `POST /api/auth/refresh` |
| WordPress Plugin | `X-RankBoost-Key` + `X-RankBoost-Signature` + `X-RankBoost-Timestamp` |
| Hermes callback | `X-Hermes-Signature` (HMAC) |
| Stripe webhook | `Stripe-Signature` header |
| Cron | `Authorization: Bearer <CRON_SECRET>` |
| Admin | JWT + `role: admin|support|analyst` + 2FA (admin) |

### Идентификаторы

Все ID — UUID v4, строка. Даты — ISO 8601 UTC.

### Пагинация

Query: `?page=1&limit=20` (default limit 20, max 100).

Ответ:
```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 87, "hasMore": true }
}
```

### Идемпотентность

Для `POST` с побочными эффектами (оплата, аудит, Hermes dispatch): заголовок `Idempotency-Key: <uuid>`.

---

## Единый формат ошибок

```json
{
  "error": {
    "code": "PLAN_LIMIT_EXCEEDED",
    "message": "Вы исчерпали лимит SEO-статей на этот месяц.",
    "details": { "limit": 2, "used": 2, "plan": "start" },
    "requestId": "req_abc123"
  }
}
```

| HTTP | Когда |
|---|---|
| 400 | Невалидные входные данные |
| 401 | Нет или просрочен токен |
| 403 | Нет прав на ресурс / тариф не позволяет |
| 404 | Ресурс не найден |
| 409 | Конфликт (дубликат, идемпотентность) |
| 429 | Rate limit |
| 500 | Внутренняя ошибка |
| 503 | Hermes / внешний сервис недоступен |

**Коды ошибок (примеры):** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `PLAN_LIMIT_EXCEEDED`, `RATE_LIMIT_EXCEEDED`, `HERMES_UNAVAILABLE`, `INTEGRATION_ERROR`, `PAYMENT_FAILED`, `WEBSITE_UNREACHABLE`, `SSRF_BLOCKED`.

---

# 1. Auth API

### POST `/api/auth/register`

**Назначение:** регистрация по email.

**Доступ:** публичный.

**Вход:**
- `email` (обязательно)
- `password` (обязательно, min 8)
- `name` (обязательно)
- `locale` (`ru`|`et`|`en`, опционально)
- `auditToken` (опционально — привязка бесплатного аудита)
- `acceptTerms` (boolean, обязательно true)

**Ответ 201:**
- `user`: id, email, name, locale, emailVerified
- `accessToken`, `expiresIn`
- `organization`: id
- `website`: id, url (если auditToken передан)

**Ошибки:** 400 validation, 409 email exists, 429 rate limit.

**Activity:** нет (до верификации).

**Rate limit:** 5 / hour / IP.

---

### POST `/api/auth/login`

**Доступ:** публичный.

**Вход:** `email`, `password`

**Ответ 200:** `user`, `accessToken`, `expiresIn`, refresh cookie.

**Ошибки:** 401 invalid credentials, 429.

**Rate limit:** 10 / min / IP.

---

### POST `/api/auth/logout`

**Доступ:** authenticated user.

**Ответ 204.**

---

### POST `/api/auth/refresh`

**Доступ:** refresh token (cookie или body).

**Ответ 200:** новая пара access + refresh.

**Ошибки:** 401 invalid refresh.

---

### GET `/api/auth/google`

**Назначение:** начать OAuth login (не путать с Google Integrations).

**Доступ:** публичный.

**Query:** `redirectUri`, `auditToken` (опционально)

**Ответ:** 302 redirect на Google.

---

### GET `/api/auth/google/callback`

**Доступ:** публичный (Google redirect).

**Query:** `code`, `state`

**Ответ:** 302 redirect в app с tokens или 201 register.

---

### POST `/api/auth/forgot-password`

**Вход:** `email`

**Ответ 200:** всегда `{ "success": true }` (не раскрывать существование email).

**Rate limit:** 3 / hour / email.

---

### POST `/api/auth/reset-password`

**Вход:** `token`, `password`

**Ответ 200:** success.

---

### POST `/api/auth/verify-email`

**Вход:** `token` (из письма)

**Ответ 200:** `emailVerified: true`.

---

### GET `/api/auth/me`

**Доступ:** authenticated.

**Ответ 200:**
- user profile
- `organization`
- `subscription`: plan, status, currentPeriodEnd
- `onboardingCompleted`

---

# 2. Website API

### GET `/api/websites`

**Доступ:** authenticated user (org member).

**Ответ 200:** список websites организации.

---

### POST `/api/websites`

**Назначение:** добавить сайт (лимит по тарифу).

**Вход:** `url`, `niche`, `cms`, `primaryLanguage`, `displayName`

**Ответ 201:** website object.

**Ошибки:** 403 plan limit (websitesMax), 400 invalid URL, 409 duplicate.

**Activity:** `website_created` (V2; в MVP один сайт при регистрации).

**Rate limit:** 5 / day / org.

---

### GET `/api/websites/:websiteId`

**Ответ 200:** website + `currentGrowthScore`, `currentAIReadinessScore`, `lastAuditAt`.

---

### PATCH `/api/websites/:websiteId`

**Вход:** `niche`, `cms`, `primaryLanguage`, `contentLanguages`, `businessGoals`, `displayName`

**Ответ 200:** updated website.

**Activity:** нет (minor update).

---

### DELETE `/api/websites/:websiteId`

**Ответ 204:** soft delete.

**Activity:** нет.

---

# 3. Audit API

### POST `/api/audit/preview` (публичный бесплатный аудит)

См. раздел «Бесплатный аудит» ниже.

---

### POST `/api/websites/:websiteId/audits`

**Назначение:** запустить полный или express аудит.

**Доступ:** authenticated, active subscription.

**Вход:**
- `type`: `full` | `express`

**Ответ 202:**
- `audit`: id, status `queued`, type
- `aiJob`: id, status

**Ошибки:** 403 PLAN_LIMIT_EXCEEDED, 409 audit already running, 503 HERMES_UNAVAILABLE.

**Activity:** `audit_started`

**AIJob:** `audit.full` или `audit.express`

**Rate limit:** по тарифу (PlanLimit).

---

### GET `/api/websites/:websiteId/audits`

**Query:** `type`, `status`, pagination.

**Ответ 200:** список аудитов.

---

### GET `/api/audits/:auditId`

**Доступ:** owner org или public (если preview + token).

**Ответ 200:**
- audit metadata
- `growthScore`, `aiReadinessScore`
- `summary`
- `checks` (для full — paginated; для preview — только visible)
- `status`

---

### GET `/api/audits/:auditId/status`

**Назначение:** polling для UI (preview и full).

**Ответ 200:**
```json
{
  "status": "processing",
  "progress": { "step": "analyzing_content", "percent": 45 },
  "estimatedSecondsRemaining": 30
}
```

**Rate limit:** 60 / min / auditId (polling).

---

### GET `/api/audits/:auditId/checks`

**Query:** `severity`, `category`, `visibleOnly`, pagination.

**Ответ 200:** список AuditCheck.

---

# 4. Report API

### GET `/api/websites/:websiteId/reports`

**Доступ:** authenticated, plan with reports.

**Query:** `type` (`monthly`|`mid_month`), pagination.

**Ответ 200:** список отчётов (metadata без html).

---

### GET `/api/reports/:reportId`

**Ответ 200:** полный report + `htmlContent`.

---

### POST `/api/reports/:reportId/resend`

**Назначение:** повторная отправка на email.

**Ответ 200:** `{ "emailLogId": "..." }`

**Activity:** `report_sent`

**Rate limit:** 3 / day / report.

---

### POST `/api/websites/:websiteId/reports/generate` (admin/cron only в MVP)

**Доступ:** cron или admin.

**Вход:** `type`, `periodStart`, `periodEnd`

**Ответ 202:** report id, AIJob `report.compile`.

---

# 5. Dashboard API

### GET `/api/websites/:websiteId/dashboard`

**Назначение:** агрегированный ответ для Overview (один запрос вместо 5).

**Доступ:** authenticated.

**Ответ 200:**
- `growthScore`: current, delta, breakdown summary
- `aiReadiness`: current, delta
- `tasks`: top 5 active (preview)
- `activity`: last 7 events
- `traffic`: GSC summary (if connected) или null + `connectGscPrompt: true`
- `content`: last 2 articles
- `integrations`: status summary
- `planUsage`: limits vs usage
- `alerts`: past_due, integration errors, audit in progress

**Rate limit:** 120 / min / user.

---

# 6. Growth Score API

### GET `/api/websites/:websiteId/growth-score`

**Ответ 200:**
- `current`: score, recordedAt
- `delta30d`
- `breakdown`: 6 categories с labels на языке user

---

### GET `/api/websites/:websiteId/growth-score/history`

**Query:** `from`, `to`, `limit` (default 90 points)

**Ответ 200:** массив snapshots `{ score, delta, trigger, recordedAt }`.

---

### GET `/api/websites/:websiteId/ai-readiness`

**Аналогично Growth Score.**

---

### GET `/api/websites/:websiteId/ai-readiness/history`

**Аналогично history.**

---

# 7. AI Tasks API

### GET `/api/websites/:websiteId/tasks`

**Query:** `status`, `priority`, `category`, pagination.

**Ответ 200:** tasks + `activeCount`, `maxActive` (from plan).

---

### GET `/api/tasks/:taskId`

**Ответ 200:** полная задача с instructions (steps).

---

### PATCH `/api/tasks/:taskId`

**Вход:**
- `status`: `in_progress` | `done` | `skipped`
- `skipReason` (если skipped)

**Ответ 200:** updated task.

**При status=done:**
- Activity: `task_completed`
- Триггер пересчёта Growth Score (async AIJob `score.growth`)

**AIJob:** `score.growth` (при done).

---

### POST `/api/websites/:websiteId/tasks/generate`

**Назначение:** запросить новые задачи у Hermes.

**Доступ:** authenticated, plan limit.

**Ответ 202:** AIJob `tasks.generate`

**Ошибки:** 403 limit, 409 too many active tasks.

**Activity:** нет (до завершения job).

**AIJob:** `tasks.generate` → при completion Activity `audit_completed` не создаётся; создаются Task records + optional Activity с новыми задачами.

---

### POST `/api/tasks/:taskId/auto-fix`

**Назначение:** «Исправить автоматически».

**Доступ:** task.canAutoFix === true.

**Ответ 202:**
- `action`: `redirect_to_article` | `redirect_to_social` | `copy_meta` | `copy_faq`
- `articleId` / `socialPostId` (если создан)
- `aiJobId` (если генерация)

**AIJob:** `content.article`, `content.social` и т.д.

---

# 8. Content Plan API

### GET `/api/websites/:websiteId/content-plans`

**Query:** `yearMonth` (опционально)

**Ответ 200:** monthly plans list.

---

### GET `/api/content-plans/:planId`

**Ответ 200:** plan + `items[]` (PlanItem).

---

### POST `/api/websites/:websiteId/content-plans/generate`

**Доступ:** active subscription.

**Вход:** `yearMonth` (default current)

**Ответ 202:** plan id, status `generating`, AIJob `content.plan`.

**Activity:** нет до ready.

**AIJob:** `content.plan`

---

# 9. Articles API

### GET `/api/websites/:websiteId/articles`

**Query:** `status`, pagination.

---

### POST `/api/websites/:websiteId/articles`

**Вход:**
- `topic` (опционально)
- `targetKeyword` (опционально)
- `planItemId` (опционально)
- `language`

**Ответ 202:** article id, status `generating`, AIJob.

**Ошибки:** 403 articlesPerMonth limit.

**Activity:** нет до completion.

**AIJob:** `content.article`

---

### GET `/api/articles/:articleId`

**Ответ 200:** full article content.

---

### PATCH `/api/articles/:articleId`

**Вход:** `title`, `slug`, `metaDescription`, `content`, `status` (`draft`|`review`)

**Ответ 200:** updated.

---

### POST `/api/articles/:articleId/approve`

**Ответ 200:** status `approved`, `approvedAt`.

**Activity:** нет (до WP push).

---

### POST `/api/articles/:articleId/regenerate`

**Ответ 202:** new version, AIJob.

**Ошибки:** 403 limit.

**AIJob:** `content.article`

---

### DELETE `/api/articles/:articleId`

**Ответ 204:** soft delete.

---

# 10. Social Posts API

### GET `/api/websites/:websiteId/social-posts`

**Query:** `platform`, `status`, pagination.

---

### POST `/api/websites/:websiteId/social-posts`

**Вход:** `platform` (`instagram`|`facebook`|`linkedin`), `topic`, `planItemId`, `relatedTaskId`

**Ответ 202:** socialPost, AIJob `content.social`.

**Ошибки:** 403 socialPostsPerMonth.

**AIJob:** `content.social`

---

### GET `/api/social-posts/:postId`

---

### PATCH `/api/social-posts/:postId`

**Вход:** `content`, `hashtags`, `status`

---

### POST `/api/social-posts/:postId/approve`

**Activity:** нет.

---

### POST `/api/social-posts/:postId/regenerate`

**AIJob:** `content.social`

---

# 11. Activity Feed API

### GET `/api/websites/:websiteId/activity`

**Query:** `type`, `from`, `to`, pagination.

**Ответ 200:** events с `entityType`, `entityId` для deep links.

**Доступ:** authenticated org member.

**Rate limit:** 60 / min.

---

### GET `/api/activity/:activityId`

**Ответ 200:** single event + expanded metadata.

---

# 12. Integrations API

### GET `/api/websites/:websiteId/integrations`

**Ответ 200:**
```json
{
  "googleGsc": { "status": "connected", "lastSyncAt": "...", "propertyName": "..." },
  "googleGa4": { "status": "disconnected" },
  "googleGbp": { "status": "error", "lastError": "..." },
  "wordpress": { "status": "active", "pluginVersion": "1.0.0" }
}
```

---

### DELETE `/api/integrations/:integrationId`

**Ответ 204.**

**Activity:** `integration_disconnected`

---

### POST `/api/integrations/:integrationId/sync`

**Назначение:** ручной resync.

**Ответ 202:** sync queued.

**Rate limit:** 5 / hour / integration.

**Activity:** нет (только при error: `integration_sync_failed`).

---

### GET `/api/websites/:websiteId/integrations/google/data`

**Query:** `dataType`, `periodStart`, `periodEnd`

**Ответ 200:** GoogleIntegrationData metrics.

---

# 13. Google OAuth API

См. раздел «Google OAuth» ниже.

### GET `/api/integrations/google/authorize`

**Query:** `websiteId`, `service` (`gsc`|`ga4`|`gbp`), `returnUrl`

**Ответ:** 302 Google consent.

---

### GET `/api/integrations/google/callback`

**Query:** `code`, `state`

**Ответ:** 302 returnUrl + `?integration=connected` или JSON для popup flow.

**Activity:** `integration_connected`

---

### POST `/api/integrations/google/select-property`

**Вход:** `integrationId`, `propertyId`, `propertyName`

**Ответ 200:** integration updated, initial sync queued.

---

# 14. WordPress Connector API

RankBoost-side endpoints. WP plugin endpoints — в разделе WordPress Plugin.

### POST `/api/websites/:websiteId/wordpress/connect`

**Назначение:** сгенерировать API key.

**Ответ 201:**
- `apiKey` (показан **один раз**)
- `connectionId`
- `instructions`

**Activity:** нет.

---

### POST `/api/wordpress/verify`

**Доступ:** WordPress plugin (API key auth).

**Вход:** `siteUrl`, `pluginVersion`

**Ответ 200:** `{ "status": "active", "websiteId": "..." }`

---

### POST `/api/articles/:articleId/push-to-wordpress`

**Назначение:** Draft Autopilot.

**Ответ 200:**
- `wpPostId`, `wpEditUrl`, `status`: `sent_to_wp`

**Ошибки:** 403 WP not connected, 403 plan, 502 WP unreachable.

**Activity:** `article_sent_to_wordpress`

**Rate limit:** wpApiCallsPerDay.

---

### POST `/api/wordpress/health` (от plugin)

**Вход:** plugin heartbeat.

**Ответ 200.**

---

### DELETE `/api/websites/:websiteId/wordpress`

**Ответ 204.**

**Activity:** `integration_disconnected`

---

# 15. Billing / Stripe API

См. раздел «Подписка» ниже.

### GET `/api/billing/subscription`

**Ответ 200:** current subscription + plan limits + usage.

---

### POST `/api/billing/checkout`

**Вход:**
- `plan`: `audit`|`start`|`growth`|`pro`
- `successUrl`, `cancelUrl`

**Ответ 200:** `{ "checkoutUrl": "https://checkout.stripe.com/..." }`

---

### POST `/api/billing/portal`

**Ответ 200:** `{ "portalUrl": "..." }` — Stripe Customer Portal.

---

### POST `/api/billing/cancel`

**Вход:** `reason` (опционально), `cancelAtPeriodEnd` (default true)

**Ответ 200:** subscription with `cancelAtPeriodEnd: true`.

**Activity:** `subscription_canceled`

---

### POST `/api/billing/upgrade`

**Вход:** `newPlan`

**Ответ 200:** checkout or immediate upgrade confirmation.

**Activity:** `subscription_upgraded`

---

### GET `/api/billing/payments`

**Ответ 200:** payment history.

---

### GET `/api/billing/usage`

**Ответ 200:** PlanLimit usage counters.

---

# 16. Email / Resend API

Внутренний сервис; публичных endpoints минимум.

### POST `/api/internal/email/send` (internal only)

**Доступ:** server / cron.

**Вход:** `userId`, `type`, `template`, `data`, `websiteId`

**Ответ 200:** `emailLogId`

---

### GET `/api/user/email-preferences`

**Ответ 200:** toggles для report, alerts, audit_ready.

---

### PATCH `/api/user/email-preferences`

**Вход:** toggles.

---

### POST `/api/unsubscribe` (public, tokenized)

**Query:** `token` (signed)

**Ответ 200:** unsubscribe specific type.

---

# 17. Hermes AI Worker API

RankBoost → Hermes (исходящие). См. раздел «Hermes» ниже.

### POST `/api/internal/hermes/dispatch` (internal)

**Вход:** `jobType`, `websiteId`, `userId`, `locale`, `params`, `relatedEntityType`, `relatedEntityId`, `idempotencyKey`

**Ответ 202:** `aiJobId`, `externalJobId`, `status: queued`

---

### POST `/api/internal/hermes/callback` (incoming from Hermes)

**Доступ:** HMAC signature.

**Вход:** `jobId`, `status`, `result`, `metadata` (tokens, cost, model)

**Ответ 200:** `{ "received": true }`

---

### GET `/api/ai-jobs/:jobId` (authenticated, own org)

**Ответ 200:** job status + resultSummary if completed.

---

# 18. Admin API

**Prefix:** `/api/admin`  
**Доступ:** role `admin`, `support`, `analyst` (read-only для analyst).

### GET `/api/admin/users`

**Query:** search, plan, status, pagination.

---

### GET `/api/admin/users/:userId`

**Ответ:** user + org + websites + subscription + AIUsage.

---

### POST `/api/admin/users/:userId/impersonate`

**Доступ:** admin, support only.

**Ответ 200:** short-lived impersonation token.

**Activity:** admin audit log (не user Activity).

---

### GET `/api/admin/websites/:websiteId`

---

### GET `/api/admin/ai-jobs`

**Query:** status, jobType, pagination.

---

### POST `/api/admin/ai-jobs/:jobId/retry`

---

### GET `/api/admin/errors`

**Query:** severity, resolved, pagination.

---

### PATCH `/api/admin/errors/:errorId/resolve`

---

### POST `/api/admin/users/:userId/notes`

**Вход:** `content`, `websiteId`

---

### GET `/api/admin/metrics`

**Ответ:** MRR, active subs, churn, Hermes spend, queue depth.

---

### PATCH `/api/admin/subscriptions/:id` (override)

**Доступ:** admin only.

**Вход:** `plan`, `status`, custom limits.

---

**Rate limit:** 300 / min / admin user.

**Security:** 2FA required for admin role; IP allowlist optional.

---

# 19. Cron API

**Prefix:** `/api/cron`  
**Доступ:** `Authorization: Bearer CRON_SECRET`

### POST `/api/cron/monthly-reports`

Запуск Report Generator для всех active subscriptions.

---

### POST `/api/cron/google-sync`

Sync всех Integration где `status=connected` и `lastSyncAt` stale.

---

### POST `/api/cron/token-refresh`

Refresh Google OAuth tokens.

---

### POST `/api/cron/score-reconcile`

Weekly Growth Score reconcile.

---

### POST `/api/cron/usage-reset`

1-е число: reset PlanLimit usage / new period.

---

### POST `/api/cron/subscription-check`

Past due reminders, grace period expiry.

---

### POST `/api/cron/ai-job-cleanup`

Mark stale jobs failed, alert admin.

---

### POST `/api/cron/gdpr-purge`

Hard delete users past 30-day soft delete.

---

**Ответ всех cron:** 200 `{ "processed": N, "errors": M }`

**Idempotency:** cron jobs safe to retry (use date bucket in logs).

---

# 20. Webhooks

### POST `/api/webhooks/stripe`

См. раздел «Подписка».

**Доступ:** Stripe signature verification.

**События:**
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Ответ:** 200 `{ "received": true }` (быстро, обработка async).

**Идемпотентность:** Stripe event id в Payment / idempotency table.

---

### POST `/api/webhooks/resend` (опционально MVP)

**События:** `email.delivered`, `email.bounced`, `email.complained`

**Действие:** update EmailLog status.

---

### POST `/api/internal/hermes/callback`

Дублирует §17 — входящий webhook от Hermes.

---

# Подробные разделы

## 1. Бесплатный аудит

### Старт аудита

**POST `/api/audit/preview`**

**Доступ:** публичный (без auth).

**Вход:**
- `url` (обязательно) — нормализуется, валидируется
- `locale` (опционально)
- `email` (опционально — для отправки результата)

**Валидация URL:**
- Только `http`/`https`
- Не localhost, не private IP (SSRF protection)
- DNS resolve + HTTP HEAD check
- Max redirect chain: 3

**Ответ 202:**
```json
{
  "auditId": "uuid",
  "previewToken": "signed_token_abc",
  "status": "queued",
  "pollUrl": "/api/audits/{id}/status"
}
```

**AIJob:** `audit.preview`

**Rate limit:**
- 3 / hour / IP
- 1 / day / normalized URL
- 10 / day / IP total

**Activity:** нет (анонимный).

---

### Статус аудита

**GET `/api/audits/:auditId/status`**

**Доступ:**
- Публичный если `preview` + valid `previewToken` query или signed cookie
- Иначе authenticated owner

**Ответы по status:**

| status | UI |
|---|---|
| queued | прогресс «В очереди» |
| processing | progress steps |
| completed | redirect to report |
| failed | retry CTA |

---

### Публичный отчёт

**GET `/api/audit/preview/:auditId/report`**

**Доступ:** `previewToken` в query (HMAC signed, TTL 7 дней) ИЛИ cookie `rb_preview_{auditId}`.

**Ответ 200 (только preview scope):**
- `growthScore` (preview)
- `aiReadinessScore` (preview)
- `issues`: max 5 AuditCheck где `isVisibleInPreview=true`
- `quickWins`: max 2
- `url`
- `upgradeCta`: `{ "label": "...", "registerUrl": "..." }`
- **НЕ включать:** full checks, instructions, competitor data

**Защита public report:**
- Token привязан к auditId + url hash
- Нельзя перебором получить чужой отчёт без token
- Rate limit: 30 / min / IP
- Noindex заголовок для SEO

---

### Переход к регистрации

**POST `/api/audit/preview/:auditId/claim`**

**Назначение:** связать preview с будущим аккаунтом.

**Вход:** `previewToken`

**Ответ 200:**
```json
{
  "claimToken": "uuid",
  "registerUrl": "/register?claim=uuid",
  "expiresAt": "..."
}
```

При **POST `/api/auth/register`** передать `claimToken` → Website и Audit привязываются к новому User/Org.

**Activity:** после регистрации — `audit_completed` (если audit уже done).

---

## 2. Подписка

### Создание Stripe Checkout

**POST `/api/billing/checkout`**

1. Проверить user authenticated, email verified (soft — warning if not).
2. Create or reuse Stripe Customer (`stripeCustomerId`).
3. Create Checkout Session:
   - `mode`: `subscription` или `payment` (audit one-time)
   - `line_items`: price_id по plan
   - `metadata`: userId, organizationId, plan
   - `success_url`, `cancel_url`
   - `subscription_data.metadata` для recurring
4. Return checkout URL.

**Ответ:** `{ "checkoutUrl", "sessionId" }`

**Ошибки:** 400 invalid plan, 409 already active subscription (offer portal).

---

### Обработка Stripe webhook

**POST `/api/webhooks/stripe`**

1. Verify `Stripe-Signature` с `STRIPE_WEBHOOK_SECRET`.
2. Parse event; check idempotency (event.id seen → 200 skip).
3. Async queue processing (не блокировать Stripe > 5s).

**checkout.session.completed:**
- Create Payment (status succeeded)
- Create/update Subscription (plan from metadata)
- Create PlanLimit for period
- If first payment: trigger full audit AIJob
- Activity: `subscription_created`, `payment_succeeded`
- Email: welcome + receipt

**invoice.paid:**
- Extend `currentPeriodEnd`
- New PlanLimit period / reset usage
- Activity: `payment_succeeded`

**invoice.payment_failed:**
- Subscription.status → `past_due`
- Activity: `payment_failed`
- Email: update card
- Grace: 3 days full access

**customer.subscription.updated:**
- Sync plan, status, period dates

**customer.subscription.deleted:**
- status → `expired`
- Website.status → `paused`
- Activity: `subscription_canceled`

---

### Активация тарифа

Логически происходит в webhook handler:

1. Subscription.status = `active`
2. PlanLimit создан с limits из plan config
3. User gains access to dashboard endpoints (403 без active sub → 200)

**GET `/api/billing/subscription`** — клиент polling после checkout success page.

**Success page flow:**
- Poll `GET /api/billing/subscription` каждые 2s до 30s
- Если webhook delay — показать «Обрабатываем оплату…»
- Кнопка «Обновить статус»

---

### Отмена тарифа

**POST `/api/billing/cancel`**

1. Stripe API: `cancel_at_period_end = true`
2. Update Subscription locally
3. Activity: `subscription_canceled`
4. Email confirmation

**Доступ после отмены:** до `currentPeriodEnd` полный; после — read-only dashboard.

---

## 3. Onboarding

### POST `/api/onboarding/step`

Универсальный endpoint или отдельные — ниже логические шаги.

### Шаг 1–2: сайт и цели

**PATCH `/api/websites/:websiteId`**

**Вход:**
- `niche`, `cms`
- `businessGoals`: `["more_leads", "google_maps", ...]`
- `primaryLanguage`, `contentLanguages`

**Ответ 200.**

---

### Шаг 3–5: интеграции

Через Google OAuth API и WordPress connect (§13, §14). Onboarding UI только отслеживает прогресс.

**GET `/api/onboarding/status`**

**Ответ:**
```json
{
  "steps": {
    "websiteConfirmed": true,
    "goalsSet": true,
    "gscConnected": false,
    "ga4Connected": false,
    "gbpConnected": false,
    "wordpressConnected": false
  },
  "completedPercent": 40
}
```

---

### Завершение onboarding

**POST `/api/onboarding/complete`**

**Действия:**
1. Set `user.onboardingCompletedAt`
2. If no full audit running — trigger `audit.full`
3. Trigger `content.plan` for current month (if Growth+)
4. Activity: `onboarding_completed`

**Ответ 200:** `{ "redirectTo": "/app", "firstTaskId": "..." }`

---

### Запуск первого месячного плана

Автоматически в `onboarding/complete` или cron 1-го числа:

**POST `/api/websites/:websiteId/content-plans/generate`** (internal trigger)

**AIJob:** `content.plan`

---

## 4. Hermes

### Создание задачи (RankBoost → Hermes)

1. Client вызывает RankBoost API (e.g. POST audits).
2. RankBoost создаёт `AIJob` (status `queued`).
3. Internal `POST` Hermes `/v1/jobs`:
   - Headers: `X-RankBoost-Key`, `X-RankBoost-Signature`
   - Body: jobType, site_id, locale, params, callback_url, idempotency_key
4. Hermes returns `externalJobId`.
5. AIJob updated: `externalJobId`, status `queued`.
6. Client получает 202 с `aiJobId` для polling.

### Получение результата

**Вариант A (preferred):** Hermes POST `/api/internal/hermes/callback`

1. Verify HMAC signature.
2. Find AIJob by externalJobId.
3. Update AIJob: status, result, tokens, cost.
4. Dispatch domain logic:
   - `audit.*` → update Audit, create AuditChecks, Tasks, Snapshots
   - `content.*` → update Article/SocialPost
   - `tasks.generate` → create Task records
5. Create Activity events.
6. Increment AIUsage.
7. Optional: send email (audit ready).

**Вариант B (fallback):** RankBoost worker polls `GET Hermes /v1/jobs/{id}` every 5s, max 10 min.

### Retry-логика

| Уровень | Политика |
|---|---|
| Hermes internal | 3 retries, exponential backoff 30s→2m→10m |
| RankBoost → Hermes dispatch | 2 retries on network error |
| Callback processing | 3 retries on DB error; dead letter → ErrorLog |
| Client | «Попробовать снова» создаёт новый AIJob с new idempotency key |

**Non-retryable:** SSRF blocked URL, content policy violation, invalid URL → AIJob `failed` immediately.

### Статусы AIJob

`queued` → `processing` → `completed` | `failed` | `cancelled`

Клиентский polling: **GET `/api/ai-jobs/:jobId`**

### Hermes недоступен

1. Dispatch fails → AIJob `failed`, errorCode `HERMES_UNAVAILABLE`
2. Client response: **503** с message и retry CTA
3. ErrorLog severity `critical` if > 5 min downtime
4. Admin alert
5. Optional: queue job locally in Redis for retry when Hermes back (max 1 hour)
6. User message: «Сейчас не удалось завершить анализ. Попробуйте через несколько минут.» — **не** показывать «Hermes»

---

## 5. WordPress Plugin

### RankBoost endpoints (см. §14)

### WordPress Plugin endpoints (на стороне WP)

**Base:** `/wp-json/rankboost/v1/`

#### GET `/health`

**Auth:** API key.

**Ответ:** `{ "status": "ok", "pluginVersion": "1.0.0" }`

RankBoost вызывает при «Проверить соединение».

---

#### POST `/drafts`

**Auth:** HMAC signature от RankBoost.

**Вход:**
- `title`, `slug`, `content`, `metaDescription`
- `categories`, `tags`
- `featuredImageUrl` (optional)
- `rankboostArticleId`

**Действие:** `wp_insert_post({ post_status: 'draft' })`

**Ответ 201:**
```json
{
  "wpPostId": 123,
  "editUrl": "https://site.ee/wp-admin/post.php?post=123&action=edit",
  "status": "draft"
}
```

**Публикация:** **запрещена в MVP.** Plugin отклоняет `post_status: publish'`.

---

#### PUT `/drafts/:id`

**Назначение:** обновить черновик если пользователь отредактировал в RankBoost и re-push.

**Auth:** HMAC.

---

#### GET `/drafts/:id`

**Статус черновика.**

---

### Проверка соединения (flow)

1. User: POST `/api/websites/:id/wordpress/connect` → apiKey
2. User pastes key in WP plugin settings
3. Plugin: POST `/api/wordpress/verify` with key
4. User clicks «Проверить» in RankBoost → RankBoost calls WP GET `/health`
5. Both sides status `active`

### Тарифные ограничения

- `push-to-wordpress` → 403 if plan doesn't include WP (all paid subs in MVP include)
- Rate limit: wpApiCallsPerDay per PlanLimit
- Article must be `approved` before push

---

## 6. Google OAuth

### Старт OAuth

**GET `/api/integrations/google/authorize`**

1. Validate user owns websiteId.
2. Check plan allows service (audit plan: gsc only).
3. Generate `state` = signed JWT: `{ userId, websiteId, service, nonce, exp }`.
4. Redirect to Google with minimal scopes:
   - GSC: `webmasters.readonly`
   - GA4: `analytics.readonly`
   - GBP: `business.manage`

### Callback

**GET `/api/integrations/google/callback`**

1. Verify `state` signature + expiry.
2. Exchange `code` for tokens.
3. Encrypt tokens → Integration record (status `connected`).
4. Redirect to `returnUrl` or onboarding step.
5. Enqueue initial sync job.
6. Activity: `integration_connected`

### Select property

После callback если несколько properties:

**POST `/api/integrations/google/select-property`**

### Refresh token

**Cron:** POST `/api/cron/token-refresh`

- For each Integration with expiring token
- Google OAuth refresh
- Update encryptedCredentials
- On `invalid_grant` → status `expired`, email user

**Не expose refresh token to client ever.**

### Отключение

**DELETE `/api/integrations/:integrationId`**

1. Revoke token at Google (best effort)
2. Clear encryptedCredentials
3. status → `disconnected`
4. Activity: `integration_disconnected`

---

## 7. Безопасность

### Авторизация

- JWT access token: 15 min, contains `userId`, `role`, `organizationIds[]`, `sessionId`
- Every request: verify JWT → load user → check org membership for website resources

### Роли

| Role | Доступ |
|---|---|
| user | Свои org/websites |
| support | Admin read + impersonate |
| analyst | Admin read-only |
| admin | Full admin API |

### Защита public report

- Signed `previewToken` (HMAC-SHA256, secret + auditId + url)
- TTL 7 days
- Rate limit per IP
- No enumeration: 404 for invalid auditId without token

### Защита admin API

- Separate middleware `requireAdmin`
- 2FA enforced for `admin` role
- Impersonation logged in AdminNote/audit log
- Impersonation token TTL 15 min

### Webhook signature verification

| Webhook | Method |
|---|---|
| Stripe | `stripe.webhooks.constructEvent(rawBody, sig, secret)` |
| Hermes | HMAC-SHA256 of raw body with `HERMES_CALLBACK_SECRET` |
| WordPress → RankBoost | API key hash + HMAC |
| Resend | signing secret (if enabled) |

**Важно:** raw body для Stripe, не parsed JSON.

### Rate limits (сводка)

| Endpoint group | Limit |
|---|---|
| Public preview audit | 3/h IP, 1/day URL |
| Auth login | 10/min IP |
| Auth register | 5/h IP |
| Authenticated API | 100/min user |
| Dashboard | 120/min user |
| Audit status poll | 60/min audit |
| Admin | 300/min |
| WordPress push | Plan daily limit |
| Cron | 1/min per endpoint (Vercel) |

Implementation: Redis sliding window. Response 429 + `Retry-After` header.

### SSRF protection при аудите

1. Parse URL → block: localhost, 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1, metadata IPs
2. DNS resolve → reject private IPs
3. HTTP client: no redirect to private IP
4. Max response size: 10MB per page
5. Timeout: 30s per page
6. Max pages crawl: 500 (plan), 20 (preview)
7. Block `file://`, `ftp://`
8. Log blocked attempts → ErrorLog (potential abuse)

---

## 8. Ошибки

Все endpoints возвращают единый формат (см. начало документа).

### Маппинг типичных сценариев

| Сценарий | HTTP | code |
|---|---|---|
| Невалидный email | 400 | VALIDATION_ERROR |
| Нет токена | 401 | UNAUTHORIZED |
| Чужой website | 403 | FORBIDDEN |
| Audit не найден | 404 | NOT_FOUND |
| Аудит уже идёт | 409 | AUDIT_IN_PROGRESS |
| Лимит статей | 403 | PLAN_LIMIT_EXCEEDED |
| Rate limit | 429 | RATE_LIMIT_EXCEEDED |
| Hermes down | 503 | HERMES_UNAVAILABLE |
| SSRF URL | 400 | SSRF_BLOCKED |
| Stripe declined | 402 | PAYMENT_FAILED |
| WP unreachable | 502 | INTEGRATION_ERROR |

### requestId

Каждый response (включая ошибки) содержит `X-Request-Id` header для support.

---

# API MVP Acceptance Checklist

## Auth & Users

- [ ] Register with email creates User + Organization + Website (with claimToken)
- [ ] Google login/register works
- [ ] JWT refresh rotation
- [ ] GET /me returns subscription state
- [ ] Forgot/reset password flow
- [ ] Email verification

## Public Funnel

- [ ] POST /audit/preview with SSRF protection
- [ ] Preview status polling without auth (with token)
- [ ] Public report shows max 5 issues, no full data
- [ ] claimToken links audit to registration
- [ ] Rate limits enforced on preview

## Websites & Onboarding

- [ ] CRUD website with org scope
- [ ] PATCH businessGoals, languages
- [ ] GET /onboarding/status
- [ ] POST /onboarding/complete triggers full audit

## Audits

- [ ] Full audit creates AIJob, returns 202
- [ ] GET audit with checks (paginated)
- [ ] Plan limit blocks excess audits
- [ ] Preview vs full data scope separation

## Dashboard & Scores

- [ ] GET /dashboard aggregated response
- [ ] Growth score history append-only
- [ ] AI readiness history
- [ ] Score updates on task complete (async)

## Tasks

- [ ] List/filter tasks
- [ ] PATCH status done/skipped
- [ ] Auto-fix dispatches correct content job
- [ ] Active task limit per plan
- [ ] Activity on task complete

## Content

- [ ] Generate article → AIJob → article ready
- [ ] Approve + push to WordPress
- [ ] Social post generate + copy
- [ ] Content plan generate monthly
- [ ] Plan limits on articles/posts

## Integrations

- [ ] Google OAuth flow GSC/GA4/GBP
- [ ] Property selection
- [ ] Token refresh cron
- [ ] Disconnect clears credentials
- [ ] GET google data metrics
- [ ] WordPress connect/verify/push draft
- [ ] WP plugin cannot publish

## Billing

- [ ] Checkout session for all plans
- [ ] Stripe webhook signature verified
- [ ] checkout.session.completed activates subscription
- [ ] invoice.paid resets usage
- [ ] payment_failed → past_due + email
- [ ] Cancel at period end
- [ ] Customer portal link
- [ ] GET usage vs limits

## Reports & Email

- [ ] Monthly report cron generates Report
- [ ] Email sent via Resend, EmailLog created
- [ ] GET reports archive
- [ ] Resend report endpoint
- [ ] Email preferences PATCH
- [ ] Unsubscribe token works

## Hermes

- [ ] Dispatch creates AIJob
- [ ] Callback verifies HMAC
- [ ] Callback updates domain entities
- [ ] AIUsage incremented with cost
- [ ] Retry on transient failure
- [ ] 503 when Hermes unavailable
- [ ] GET /ai-jobs/:id for polling

## Activity

- [ ] All key actions create Activity (see Database Model list)
- [ ] GET activity feed paginated
- [ ] Deep links via entityType/entityId

## Admin

- [ ] Role guard on /api/admin/*
- [ ] User search, impersonate with audit log
- [ ] AI jobs list + retry
- [ ] Error log view + resolve
- [ ] Metrics endpoint

## Cron

- [ ] All cron endpoints require CRON_SECRET
- [ ] monthly-reports, google-sync, token-refresh, usage-reset work
- [ ] Idempotent cron runs

## Security

- [ ] JWT on all protected routes
- [ ] Org-scoped access (cannot read other user's website)
- [ ] previewToken cannot be forged
- [ ] Stripe raw body verification
- [ ] Hermes callback HMAC
- [ ] WordPress HMAC on push
- [ ] SSRF blocks on audit URL
- [ ] Rate limits return 429
- [ ] No secrets in API responses
- [ ] requestId on all responses

## Errors

- [ ] Unified error JSON format
- [ ] Correct HTTP status codes
- [ ] PLAN_LIMIT_EXCEEDED includes upgrade hint in details
- [ ] User-facing messages in user locale (ru/et/en)

## Documentation & Consistency

- [ ] Endpoints match User Flows screens
- [ ] Response fields match Database Model entities
- [ ] Job types match System Architecture Hermes list
- [ ] Plan limits match Product Bible tariffs
- [ ] Existing POST /api/contact unchanged (marketing lead form)

## Non-goals MVP (не блокируют acceptance)

- [ ] Shopify/Webflow integrations
- [ ] Public API keys for third parties
- [ ] Organization multi-member
- [ ] Resend webhook (optional)
- [ ] Autopublish to WordPress

---

*RankBoost.eu · API Design v1.0 · Июнь 2026*
