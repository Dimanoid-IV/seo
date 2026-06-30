# Current Code Audit — RankBoost.eu

> Технический аудит **существующего кода** в репозитории (не документации SaaS).
>
> **Дата:** 29 июня 2026  
> **Версия кода:** `seoch@0.1.0`  
> **Статус:** production-ready **маркетинговый сайт** SEO-агентства; SaaS-платформа **не начата**

---

## 1. Executive Summary

Репозиторий содержит **полноценный мультиязычный маркетинговый сайт** RankBoost.eu на Next.js 16 App Router. Сборка проходит успешно (~87 статических страниц), ESLint без ошибок. Реализованы: лендинг, услуги, тарифы, блог (66 статей), контактная форма с email через Resend, SEO-инфраструктура (sitemap, hreflang, JSON-LD, OG image).

**Не реализовано** (всё из `docs/MVP-Build-Plan.md`): Prisma, auth, dashboard `/app`, Stripe, Hermes, очереди, аудит, Growth Score, admin, WordPress plugin.

**Вердикт:** код — **сильная база для маркетинга и дизайн-системы**, которую можно расширять под SaaS. Переписывать с нуля не нужно. Критично синхронизировать `data/pricing.ts` с Product-Bible перед запуском биллинга и добавить инфраструктуру (DB, auth, API) рядом с существующим `app/[locale]/`.

| Метрика | Значение |
|---------|----------|
| Файлов TS/TSX (без docs) | ~95 |
| Страниц (SSG) | ~87 |
| API routes | 1 (`POST /api/contact`) |
| Локали | ru, et, en |
| Client components | 15 файлов |
| Тесты | 0 |
| CI/CD | нет |

---

## 2. Что уже реализовано

### 2.1. Маршрутизация и i18n

| Компонент | Реализация |
|-----------|------------|
| Locale routing | `middleware.ts` — `/` → `/ru`, префикс `/ru\|et\|en` |
| Словари UI | `i18n/dictionaries/{ru,et,en}.ts` (~560 строк каждый) |
| Типизация | `Dictionary` из `ru.ts` как source of truth |
| Lazy load словарей | `lib/i18n.ts` — dynamic import по локали |
| Ссылки | `LocaleLink`, `getLocalizedPath`, `switchLocalePath` |
| `lang` на `<html>` | `LangSetter` (client) |

### 2.2. Страницы (`app/[locale]/`)

| Маршрут | Файл | Особенности |
|---------|------|-------------|
| `/` | `page.tsx` | Hero, TrustBadges, WhatWeDo, ForWhom, Process, Pricing, CTA |
| `/services` | `services/page.tsx` | 8 услуг, JSON-LD ItemList |
| `/pricing` | `pricing/page.tsx` | 4 тарифа, comparison table, FAQ + JSON-LD |
| `/blog` | `blog/page.tsx` | Список статей по локали |
| `/blog/[slug]` | `blog/[slug]/page.tsx` | Статья, FAQ, related, hreflang по `translationKey` |
| `/contact` | `contact/page.tsx` | Форма + sidebar с info |
| `/privacy` | `privacy/page.tsx` | Юридический текст из словаря |
| `/terms` | `terms/page.tsx` | Юридический текст из словаря |

Дополнительно:

- `app/not-found.tsx` — 404
- `app/sitemap.ts` — sitemap с hreflang alternates
- `app/robots.ts` — robots.txt
- `app/opengraph-image.tsx` — динамический OG 1200×630 (edge)

### 2.3. API

**`POST /api/contact`** (`app/api/contact/route.ts`):

- Валидация Zod (`lib/validators.ts`)
- Honeypot-поле `company_url`
- `escapeHtml` для email template
- Отправка HTML через Resend
- Поля: name, email, phone, website, budget, service, plan, message, locale, sourcePage

### 2.4. Контент и данные

| Источник | Содержимое |
|----------|------------|
| `data/services.ts` | 8 SEO-услуг (ru/et/en) |
| `data/pricing.ts` | 4 плана: start, local-boost, growth, partner |
| `data/faq.ts` | FAQ главной |
| `data/pricing-faq.ts` | FAQ страницы pricing |
| `data/contact-options.ts` | ID услуг, планов, бюджетов для формы |
| `data/blog/posts/all-posts.ts` | ~60 статей (20 тем × 3 локали), **7452 строки** |
| `data/blog/posts/expert-posts-2026.ts` | +6 экспертных статей 2026 |
| `scripts/generate-blog-articles.mjs` | Генератор контента блога |

### 2.5. SEO

- `lib/seo.ts` — metadata, canonical, hreflang, OG/Twitter
- `lib/json-ld.ts` — Organization, LocalBusiness, ProfessionalService, FAQ, Services
- `components/seo/JsonLdScript.tsx`
- `components/blog/BlogJsonLd.tsx` — BlogPosting schema
- Keywords per locale (`SEO_KEYWORDS`)
- `GoogleAnalytics` — gtag `G-4N6GD6LHFZ`

### 2.6. UI / Design System

- Tailwind CSS v4 + `tw-animate-css` + shadcn (`style: base-nova`)
- Тёмная тема: `#050816`, glass-card, gradient-text, glow utilities
- Шрифты: Geist Sans + Geist Mono (cyrillic subset)
- shadcn/ui: button, input, textarea, label, select, badge, accordion, sheet, separator
- Кастомные: PricingCard, PricingTable, ServiceCard, SectionHeading, FAQAccordion, ProcessSteps, TestimonialCard, ButtonLink, LocaleLink

### 2.7. Инфраструктура разработки

- TypeScript strict
- ESLint 9 + `eslint-config-next` (core-web-vitals + typescript)
- `.env.example` с документированными переменными
- `README.md` — deploy, Resend, структура, how-to для блога и переводов
- `components.json` — shadcn config (aliases: `@/components`, `@/lib`, `@/hooks` — **hooks папки нет**)

---

## 3. Что можно использовать при переходе к SaaS

### 3.1. Без изменений или с минимальной адаптацией

| Актив | Применение в SaaS |
|-------|-------------------|
| `middleware.ts` | Расширить: `/app` без locale, marketing с locale |
| `i18n/config.ts`, `lib/i18n.ts` | Dashboard locale из User settings; marketing — как есть |
| `lib/seo.ts`, `lib/json-ld.ts` | Публичные страницы + landing audit |
| `lib/validators.ts` + Zod patterns | Все API forms |
| `lib/resend.ts` | Transactional email (reports, onboarding) |
| `lib/utils.ts` (`cn`) | Везде |
| `lib/contact-links.ts` | Паттерн query-prefill → позже audit URL prefill |
| `app/globals.css` | Design tokens для dashboard (уже есть sidebar/chart CSS vars) |
| shadcn/ui components | Dashboard forms, tables |
| `components/layout/Header.tsx` / `Footer.tsx` | Marketing shell; dashboard — новый sidebar |
| `HeroDashboard.tsx` | **Визуальный референс** для SaaS dashboard (mock metrics) |
| `PricingSection`, `PricingCard` | Marketing pricing; SaaS tariffs — новый data source |
| `SectionHeading`, `CTASection` | Marketing + upgrade CTAs в app |
| `ContactForm` patterns | Honeypot, client validation, Suspense — шаблон для register |
| `app/sitemap.ts`, `robots.ts` | Расширить при новых public routes |
| Resend contact API pattern | Шаблон для `app/api/*` route handlers |

### 3.2. Контент и SEO-активы

- **66 блог-статей** — органический трафик, E-E-A-T, internal linking к `/pricing` и будущему `/audit`
- **Мультиязычность ru/et/en** — соответствует ICP (Эстония)
- **JSON-LD** — готовая schema.org инфраструктура

### 3.3. Архитектурные паттерны для сохранения

```
app/
  [locale]/          ← marketing (оставить)
  app/               ← будущий dashboard (добавить)
  api/               ← расширить
components/
  ui/                ← shared
  sections/          ← marketing only
  forms/             ← shared patterns
data/                ← marketing static; SaaS → DB
lib/                 ← shared utilities
i18n/                ← marketing + позже app strings
```

---

## 4. Что лучше переписать (не ломая маркетинг)

| Область | Почему | Рекомендация |
|---------|--------|--------------|
| **`data/pricing.ts`** | Slugs `local-boost`, `growth` (599€) не совпадают с Product-Bible (`start`, `growth` 349€, `pro` 599€) | Переименовать/синхронизировать **до** Stripe; не дублировать в двух местах после SaaS |
| **`data/blog/posts/all-posts.ts`** | 7452 строки в одном файле; долгий parse при build | MDX, Contentlayer, или split по `translationKey`; генератор уже есть |
| **Contact API** | Нет rate limit, нет CAPTCHA | Добавить Upstash rate limit + Turnstile при росте спама |
| **`middleware.ts`** | Нет `Accept-Language`; все без locale → `/ru` | Добавить geo/lang detection для ET/EN (опционально) |
| **`GoogleAnalytics.tsx`** | Hardcoded ID, нет consent | env var + cookie consent для GDPR |
| **`package.json` name** | `"seoch"` vs бренд RankBoost | Переименовать при публикации npm/workspace |
| **Legal pages** | Agency-era privacy/terms | Юридический review для SaaS billing, subprocessors, AI |
| **Hero as client** | Framer Motion на каждой загрузке home | Dynamic import или CSS-only animation для LCP |
| **Pricing CTA flow** | Все ведут на contact form, не на Stripe/audit | Новые CTA routes при SaaS launch |

**Не переписывать:** App Router structure, dictionary i18n, SEO helpers, shadcn setup, layout composition.

---

## 5. Страницы — оценка качества

| Страница | Оценка | Сильные стороны | Слабые места |
|----------|--------|-----------------|--------------|
| **Home** (`/[locale]`) | ★★★★★ | Полная воронка, Hero + mock dashboard, pricing teaser, CTA | Hero — client + motion (LCP); нет CTA на free audit |
| **Pricing** | ★★★★★ | Comparison table, FAQ, JSON-LD, prefill plan в contact | Тарифы agency, не SaaS; 4 колонки на mobile tight |
| **Services** | ★★★★☆ | 8 карточек, JSON-LD, detailed mode | Дублирует home «what we do» |
| **Blog list** | ★★★★☆ | Категории, карточки | Нет pagination при >20 статей |
| **Blog article** | ★★★★★ | Breadcrumbs, hreflang, FAQ block, related, schema | Длинные статьи — только static text blocks |
| **Contact** | ★★★★★ | Prefill из URL, honeypot, Suspense, sidebar | Нет rate limit на submit |
| **Privacy / Terms** | ★★★☆☆ | Локализованы, lastUpdated | Не покрывают SaaS, AI, Stripe |
| **404** | ★★★☆☆ | Есть | Без locale-aware ссылок |

**Лучшие страницы для reuse как образец:** Pricing, Blog article, Contact.

---

## 6. Компоненты — оценка качества

### 6.1. Отличные (готовы к production и расширению)

| Компонент | Путь | Почему |
|-----------|------|--------|
| `ContactForm` | `components/forms/ContactForm.tsx` | Validation, honeypot, a11y, prefill, error states |
| `PricingCard` | `components/ui/PricingCard.tsx` | Чистый presentational, i18n, highlighted state |
| `PricingTable` | `components/ui/PricingTable.tsx` | Feature comparison matrix |
| `LocaleLink` | `components/ui/LocaleLink.tsx` | Централизованная locale-aware навигация |
| `ButtonLink` | `components/ui/ButtonLink.tsx` | CVA variants + locale paths |
| `SectionHeading` | `components/ui/SectionHeading.tsx` | Переиспользуемый заголовок секций |
| `FAQAccordion` | `components/ui/FAQAccordion.tsx` | Accessible accordion |
| `BlogContent` | `components/blog/BlogContent.tsx` | Рендер structured content types |
| `BlogJsonLd` | `components/blog/BlogJsonLd.tsx` | Article schema |
| `JsonLdScript` | `components/seo/JsonLdScript.tsx` | Safe JSON-LD injection |
| `Header` | `components/layout/Header.tsx` | Sticky, mobile sheet, CTA |
| `Footer` | `components/layout/Footer.tsx` | Rich footer, blog links, services |

### 6.2. Хорошие с оговорками

| Компонент | Замечание |
|-----------|-----------|
| `Hero` | Качественный UX; client-only из-за framer-motion |
| `HeroDashboard` | Отличный **mock** для будущего dashboard; hardcoded metrics; много infinite animations |
| `LanguageSwitcher` | Работает; нет флагов/полных названий в mobile |
| `ServiceCard` | Solid; привязан к `data/services.ts` |
| `CTASection` | Reusable; client component без явной причины |
| shadcn `select`, `sheet` | Base UI; проверить a11y при dashboard forms |

### 6.3. Marketing-only (не тащить в dashboard as-is)

`TrustBadges`, `TestimonialsSection`, `ProcessSection`, `ForWhomSection`, `WhatWeDoSection`, `SEOStatsBlock`, `ServicesSection`, `PricingFAQSection`

---

## 7. Используемые библиотеки

### 7.1. Production dependencies

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `next` | 16.2.9 | App Router, SSG, API routes, OG image |
| `react` / `react-dom` | 19.2.4 | UI |
| `typescript` | ^5 (5.9.3) | Типизация |
| `tailwindcss` | ^4 (4.3.1) | Стили |
| `@tailwindcss/postcss` | ^4 | PostCSS integration |
| `shadcn` | ^4.11.0 | UI kit tooling + tailwind.css import |
| `@base-ui/react` | ^1.5.0 | Headless primitives (select, etc.) |
| `class-variance-authority` | ^0.7.1 | Button variants |
| `clsx` + `tailwind-merge` | latest | `cn()` utility |
| `lucide-react` | ^1.20.0 | Icons |
| `framer-motion` | ^12.40.0 | Hero animations |
| `zod` | ^4.4.3 | Form/API validation |
| `resend` | ^6.14.0 | Transactional email |
| `tw-animate-css` | ^1.4.0 | Animation utilities |

### 7.2. Dev dependencies

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.9 | Next.js rules |
| `@types/node` | ^20 | Node types |
| `@types/react` / `react-dom` | ^19 | React types |

### 7.3. Отсутствующие (нужны для SaaS по MVP-Build-Plan)

Prisma, `@prisma/client`, Stripe, bcrypt/argon2, jose/jsonwebtoken, BullMQ/ioredis, `@upstash/ratelimit`, Playwright/Vitest, next-auth или custom auth

---

## 8. Зависимости — актуальность

По `npm outdated` (29.06.2026):

| Пакет | Current | Latest | Рекомендация |
|-------|---------|--------|--------------|
| `next` | 16.2.9 | — | **Актуален** (latest 16.x) |
| `react` | 19.2.4 | 19.2.7 | Patch update — безопасно |
| `zod` | 4.4.3 | — | **v4** — современная major |
| `tailwindcss` | 4.3.1 | 4.3.2 | Patch |
| `framer-motion` | 12.40.0 | 12.42.1 | Minor |
| `resend` | 6.14.0 | 6.16.0 | Minor |
| `lucide-react` | 1.20.0 | 1.22.0 | Minor |
| `@base-ui/react` | 1.5.0 | 1.6.0 | Minor |
| `@types/node` | 20.x | 26.x | **Оставить 20** до осознанного upgrade |
| `eslint` | 9.x | 10.x | **Не спешить** — major |
| `typescript` | 5.9.x | 6.0.x | **Не спешить** — major |

**Критически устаревших зависимостей нет.** Стек современный (Next 16, React 19, Tailwind 4, Zod 4).

**Замечание:** `shadcn` как npm dependency (^4) — CLI/tooling пакет; компоненты уже скопированы в `components/ui/`. Это нормальная практика shadcn v4.

---

## 9. Проблемы структуры проекта

### 9.1. Соответствие целевой архитектуре

```
Текущее                          План (System-Architecture)
─────────────────────────────────────────────────────────
app/[locale]/                    app/[locale]/  ✅
app/api/contact/                 app/api/*      ⚠️ 1 из ~50 routes
—                                app/app/       ❌
—                                lib/services/  ❌
—                                prisma/        ❌
components/sections/             marketing      ✅
data/*.ts                        → DB           ⚠️ static only
```

### 9.2. Конкретные structural issues

| # | Проблема | Severity |
|---|----------|----------|
| 1 | **Нет тестов** (unit, e2e) | High для SaaS |
| 2 | **Нет CI** (.github/workflows) | Medium |
| 3 | **Blog monolith** `all-posts.ts` 7452 lines | Medium (DX, build time) |
| 4 | **`hooks/` alias без папки** | Low |
| 5 | **Имя пакета `seoch`** vs RankBoost | Low (брендинг) |
| 6 | **Дублирование `generateStaticParams`** на каждой page | Low (boilerplate) |
| 7 | **Client boundaries** — Hero на home тянет framer-motion bundle | Medium |
| 8 | **Нет shared `types/`** | Low (появится с Prisma) |
| 9 | **Scripts не в npm scripts** (`generate-blog-articles.mjs` manual) | Low |
| 10 | **Pricing IDs ≠ SaaS docs** | High при интеграции Stripe |

### 9.3. Разделение marketing / app

Сейчас всё — marketing. При добавлении `/app` нужно:

- Отдельный layout без Header/Footer маркетинга
- Middleware: не редиректить `/app` на `/ru/app`
- Разделить `components/sections/` (marketing) от `components/app/` (dashboard)

Текущая структура **не мешает** — она просто ещё не содержит app-слоя.

---

## 10. Проблемы производительности

### 10.1. Build time

- **66 blog pages × 3 locales** + static pages — build ~13s (локально)
- Парсинг `all-posts.ts` (~7500 строк) увеличивает memory/time при `next build`
- **Рекомендация:** split blog data до роста контента

### 10.2. Runtime / Client bundle

| Issue | Impact | Detail |
|-------|--------|--------|
| Framer Motion on Home | Medium | `Hero` + `HeroDashboard` — client components с animations |
| Infinite CSS animations | Low | `animate-pulse`, motion loops в HeroDashboard |
| Google Fonts | Low | Geist с subset latin+cyrillic — OK |
| Footer `getBlogPosts` | Negligible | Server component, slice(0,3) |
| No `next/image` for blog | N/A | Blog без изображений |

### 10.3. Положительные perf-практики

- **SSG** для всех marketing pages (`generateStaticParams`)
- **Dynamic import** словарей по locale
- **Edge runtime** для OG image
- **Middleware matcher** исключает static files
- Tailwind v4 — smaller CSS pipeline

### 10.4. Отсутствует

- `loading.tsx` / `error.tsx` per route
- Image optimization strategy (нет картинок в контенте)
- Bundle analyzer
- Caching headers для API (contact — stateless POST)

---

## 11. Проблемы безопасности

### 11.1. Реализованные меры

| Мера | Где |
|------|-----|
| Server-only Resend API key | `lib/resend.ts`, API route |
| Zod input validation | `contactFormSchema` |
| Honeypot anti-bot | form + API silent success |
| HTML escaping in email | `escapeHtml()` |
| `maxLength` on inputs | form fields |
| No secrets in client | env vars server-side |

### 11.2. Уязвимости и gaps

| # | Risk | Severity | Detail |
|---|------|----------|--------|
| 1 | **No rate limiting** on `/api/contact` | High | Spam / Resend quota exhaustion |
| 2 | **No CAPTCHA** | Medium | Honeypot недостаточен для bots |
| 3 | **GA without consent banner** | Medium | GDPR/ePrivacy для EU visitors |
| 4 | **PII in email logs** | Low | `console.error` on contact failure |
| 5 | **`.env.example` contains real email** | Low | `seoagenth@gmail.com` — не секрет, но PII in repo |
| 6 | **No security headers** | Medium | CSP, HSTS, X-Frame-Options не в `next.config.ts` |
| 7 | **No CSRF token** | Low | JSON API — сниженный риск |
| 8 | **Website URL validation weak** | Low | `new URL()` only — нет SSRF risk (server doesn't fetch) |
| 9 | **robots.txt allows all** | OK | Intended for marketing |
| 10 | **Dependencies** | Low | `npm audit` не запускался; мало deps = малый attack surface |

### 11.3. Перед SaaS обязательно

- Rate limiting (Upstash)
- Auth secrets management
- Stripe webhook signature verification
- Encrypted OAuth tokens
- CSP для dashboard
- Cookie consent + privacy policy update

---

## 12. Соответствие документации SaaS

| Документ | Соответствие коду |
|----------|-------------------|
| Product-Bible | Маркетинг ✅; SaaS features ❌ |
| MVP-Build-Plan prompt 1.1+ | **Не начат** |
| System-Architecture | Target state; current = subset «Marketing Site» |
| API-Design | 1/50+ endpoints |
| Database-Model | 0 entities in code |

### Расхождения код ↔ docs

| Код | Docs SaaS |
|-----|-----------|
| `local-boost` @ 349€ | `growth` @ 349€ |
| `growth` @ 599€ | `pro` @ 599€ |
| Contact form lead | Stripe checkout |
| Agency services | AI Tasks platform |
| `HeroDashboard` mock | Real Growth Score |

---

## 13. Карта файлов (фактическая)

```
seoch/
├── app/
│   ├── layout.tsx                 # Root: fonts, GA, dark theme
│   ├── globals.css                # Design system
│   ├── [locale]/                  # 7 routes × 3 locales
│   ├── api/contact/route.ts       # Единственный API
│   ├── sitemap.ts, robots.ts
│   └── opengraph-image.tsx
├── components/
│   ├── analytics/                 # GA
│   ├── blog/                      # 7 components
│   ├── forms/                     # ContactForm + Section
│   ├── layout/                    # Header, Footer, LangSetter, LanguageSwitcher
│   ├── sections/                  # 14 marketing sections
│   ├── seo/                       # JsonLdScript
│   └── ui/                        # shadcn + custom (14 files)
├── data/                          # Static content
├── i18n/                          # config + 3 dictionaries
├── lib/                           # 8 utility modules
├── scripts/                       # Blog generators (manual)
├── public/                        # Minimal SVGs
├── docs/                          # Product + architecture docs
├── middleware.ts
└── package.json                   # name: "seoch"
```

**Нет:** `prisma/`, `tests/`, `.github/`, `hooks/`, `app/app/`, `lib/services/`

---

## 14. Рекомендуемый порядок интеграции SaaS (без переписывания маркетинга)

1. **Добавить** `app/(marketing)/[locale]/` или оставить `app/[locale]/` как есть
2. **Добавить** `app/app/` с отдельным layout (dashboard)
3. **Расширить** `middleware.ts` для `/app`, `/api/auth`, `/audit`
4. **Добавить** `prisma/`, `lib/db.ts` — не трогая marketing data
5. **Синхронизировать** `data/pricing.ts` с Product-Bible **или** вынести SaaS pricing в DB и оставить marketing pricing отдельно до cutover
6. **Reuse** `lib/validators.ts`, shadcn forms, `globals.css` tokens
7. **Позаимствовать UX** из `HeroDashboard` для dashboard widgets

---

## 15. Итоговые оценки (текущий код)

| Критерий | Балл | Комментарий |
|----------|------|-------------|
| Качество кода | **8/10** | Clean TS, strict, consistent patterns |
| Marketing readiness | **9/10** | Production-ready site |
| SaaS readiness | **2/10** | Только фундамент |
| SEO implementation | **9/10** | Comprehensive |
| Security (as-is) | **6/10** | OK for static site; API gaps |
| Performance | **7.5/10** | SSG good; motion on home |
| Maintainability | **7/10** | Blog monolith; no tests |
| Alignment with docs | **5/10** | Pricing naming drift |

---

## 16. Checklist перед стартом MVP-Build-Plan

- [ ] Зафиксировать pricing slug mapping (marketing vs Stripe)
- [ ] Добавить rate limit на contact API (quick win)
- [ ] Cookie consent для GA
- [ ] Создать `app/app/` route group без поломки `[locale]`
- [ ] Prisma schema — не трогать marketing pages
- [ ] CI: `lint` + `build` on PR
- [ ] Переименовать package `seoch` → `rankboost` (optional)

---

*Документ описывает состояние репозитория на момент аудита. Код не изменялся.*
