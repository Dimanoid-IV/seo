# Audit Engine — Website Scanner

> **RankBoost.eu** · Engineering doc · Prompt 5.1  
> Foundation layer for the future Audit Engine (no AI, no Hermes, no database).

---

## Overview

The website scanner lives in `lib/audit/` and is the first step of every audit pipeline:

```
User URL → normalize → SSRF check → fetch HTML → extractOnPageSeo → runAuditRules → AuditRuleResult[]
```

It is **server-only** (`assertServerOnly`) and uses the native `fetch` API with manual redirect handling.

**Principle: Rule Engine first — AI only for explanation/generation later.** No Hermes, no LLM in this layer.

---

## Module map

| File | Responsibility |
|------|----------------|
| `scanner.ts` | Public entry: `scanWebsite()` orchestrates normalize + fetch + https→http fallback |
| `normalize.ts` | URL normalization (`example.com` → `https://example.com`) |
| `ssrf.ts` | Scheme/host/IP/DNS SSRF protection |
| `fetch.ts` | HTTP fetch, redirects, content-type/body limits |
| `errors.ts` | `AppError` factory + network error classification |
| `types.ts` | Constants and result types |
| `parser.ts` | HTML parsing via Cheerio (`parseHtml`) |
| `extractors.ts` | On-page SEO extraction (`extractOnPageSeo`) |
| `onpage-types.ts` | `OnPageSeoData` and related types |
| `rules-types.ts` | `AuditRuleResult`, categories, severities |
| `rules/` | Modular rule registry (20 checks by category) |
| `rule-engine.ts` | `runAuditRules`, `getPreviewIssues`, `calculateRawRuleScore`, `calculateEstimatedFixTime` |
| `preview-response.ts` | Preview API response builder + error mapping |
| `index.ts` | Public exports |

---

## Scan pipeline

### 1. Normalize (`normalizeUrl`)

- Trims input; rejects empty strings.
- Blocks dangerous schemes immediately (`file://`, `javascript:`, `data:`, …).
- Adds `https://` when no scheme is present.
- Allows only `http:` and `https:`.
- Lowercases hostname, strips fragment, removes default ports.
- Throws `INVALID_URL` or `SSRF_BLOCKED`.

### 2. SSRF protection (`assertSafeUrl`)

Before any network request (and again on **each redirect target**):

1. **Scheme** — only `http` / `https`; no credentials in URL.
2. **Hostname blocklist** — `localhost`, `.local`, `.internal`, `.localhost`, …
3. **Private IP literals** — IPv4 private ranges, `127.*`, `10.*`, `172.16–31.*`, `192.168.*`, `169.254.*`, IPv6 `::1`, ULA, link-local.
4. **DNS resolve** — `dns.lookup({ all: true })`; reject if any resolved address is private (rebinding protection).

### 3. Fetch (`fetchHtmlPage`)

- **Timeout:** 15 seconds total (including redirects).
- **Redirects:** manual follow, max 10; SSRF re-check on each `Location`.
- **User-Agent:** `RankBoostScanner/1.0 (+https://rankboost.eu/bot)`.
- **Accept:** HTML only (`text/html`, `application/xhtml+xml`).
- **Body limit:** 5 MB; streaming read with early abort.
- **Charset:** from `Content-Type` header, default `utf-8`.

### 4. Protocol fallback (`scanWebsite`)

| Input | Attempt order |
|-------|----------------|
| `example.com` | `https` → `http` (if https fails) |
| `https://…` | `https` → `http` |
| `http://…` | `http` only |

Non-retryable errors (SSRF, invalid URL, wrong content type, too large) stop immediately without fallback.

---

## Result shape (`WebsiteScanResult`)

```ts
{
  normalizedUrl: string;   // after normalizeUrl()
  finalUrl: string;        // after redirects
  statusCode: number;
  headers: Record<string, string>;
  contentType: string | null;
  charset: string | null;
  responseTimeMs: number;
  redirectCount: number;
  html: string;
  htmlSize: number;        // bytes
  fetchedAt: string;         // ISO 8601
}
```

---

## Error model

All failures throw `AppError` with `details.scannerError`:

| `scannerError` | Typical `AppError.code` | When |
|----------------|-------------------------|------|
| `INVALID_URL` | `VALIDATION_ERROR` | Malformed / empty URL |
| `SSRF_BLOCKED` | `SSRF_BLOCKED` | Private IP, blocked scheme, DNS → private |
| `BLOCKED_HOST` | `SSRF_BLOCKED` | localhost, `.local`, … |
| `DNS_FAILURE` | `WEBSITE_UNREACHABLE` | NXDOMAIN / DNS timeout |
| `SSL_FAILURE` | `WEBSITE_UNREACHABLE` | TLS certificate errors |
| `TIMEOUT` | `WEBSITE_UNREACHABLE` | > 15s |
| `WEBSITE_UNREACHABLE` | `WEBSITE_UNREACHABLE` | HTTP 4xx/5xx, connection refused |
| `UNSUPPORTED_CONTENT_TYPE` | `VALIDATION_ERROR` | Not HTML (PDF, JSON, images, …) |
| `TOO_LARGE` | `VALIDATION_ERROR` | Body > 5 MB |

---

## Limits (MVP)

| Limit | Value |
|-------|-------|
| Total timeout | 15 s |
| Max HTML size | 5 MB |
| Max redirects | 10 |
| Allowed content | `text/html`, `application/xhtml+xml` |

---

## Usage

```ts
import { scanWebsite } from "@/lib/audit";

const result = await scanWebsite("example.com");
console.log(result.statusCode, result.htmlSize);
```

```ts
import { scanWebsite } from "@/lib/audit";
import { AppError } from "@/lib/errors";

try {
  await scanWebsite("http://127.0.0.1");
} catch (error) {
  if (error instanceof AppError) {
    console.log(error.code, error.details.scannerError);
  }
}
```

---

## HTML Parser & On-page Extractor (prompt 5.2)

After the scanner returns HTML, the parser/extractor module derives structured SEO facts **without AI**.

### Pipeline

```
scanWebsite(url) → html + finalUrl → extractOnPageSeo(html, finalUrl) → OnPageSeoData
```

### `parseHtml(html, finalUrl)`

- Loads HTML with **Cheerio** (tolerates broken markup).
- Resolves `<base href="">` for relative URL resolution.
- Throws `AppError` only for empty HTML or invalid `finalUrl`.

### `extractOnPageSeo(html, finalUrl)`

Pure function — no side effects. Extracts:

| Field | Source |
|-------|--------|
| `title` | `<title>` — text, length, exists |
| `metaDescription` | `meta[name="description"]` |
| `h1` / `h2` | Count + normalized text samples (up to 50 each) |
| `canonical` | `link[rel="canonical"]` — href, absolute flag |
| `robotsMeta` | `meta[name="robots"]` — noindex/nofollow flags |
| `openGraph` | `og:title`, `og:description`, `og:image`, `og:url`, `og:type` |
| `twitterCard` | `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` |
| `images` | All `<img>` — total, missing/empty/with `alt` |
| `links` | All `<a href>` — internal/external (vs `finalUrl` origin), nofollow, broken format |
| `schema` | `script[type="application/ld+json"]` — types, Organization/LocalBusiness/FAQ/Breadcrumb flags |
| `lang` | `<html lang="">` |
| `viewport` | `meta[name="viewport"]` |
| `wordCount` | Visible body text word count |
| `textSample` | First 1000 chars of body text (excludes script/style/noscript) |

### Usage

```ts
import { scanWebsite, extractOnPageSeo } from "@/lib/audit";

const scan = await scanWebsite("example.com");
const onPage = extractOnPageSeo(scan.html, scan.finalUrl);

console.log(onPage.title.text, onPage.h1.count, onPage.schema.types);
```

### Out of scope (5.2)

- Scoring / recommendations → **partially in 5.3** (raw rule score)
- Database persistence
- API routes / UI
- Hermes / AI analysis

---

## Rule Engine (prompt 5.3)

Deterministic audit checks run **after** on-page extraction and **before** any AI layer.

### Pipeline

```
{ scan, onPage } → runAuditRules(context) → AuditRuleResult[]
                 → getPreviewIssues(results)   // free preview (3–5 issues)
                 → calculateRawRuleScore(results) // raw 0–100, not Growth Score
```

### Checks (20 rules)

| Code area | Rules |
|-----------|--------|
| Security / technical | `checkHttps`, `checkStatusCode`, `checkCanonicalExists`, `checkRobotsNoindex`, `checkInternalLinksMinimum` |
| Content | `checkTitleExists`, `checkTitleLength`, `checkMetaDescriptionExists`, `checkMetaDescriptionLength`, `checkSingleH1`, `checkWordCountMinimum` |
| Performance | `checkResponseTime` |
| Accessibility | `checkViewportExists`, `checkHtmlLangExists`, `checkImageAltCoverage` |
| Social | `checkOpenGraphExists`, `checkTwitterCardExists` |
| AI / local readiness | `checkSchemaExists`, `checkFAQSchema`, `checkOrganizationOrLocalBusinessSchema` |

Each rule returns:

- `status`: PASS | WARNING | FAIL | NOT_APPLICABLE
- `severity`: INFO → CRITICAL
- `scoreImpact`: potential improvement points (0 for PASS)
- `isVisibleInPreview`: top issues for free audit funnel
- `estimatedFixMinutes`: rough fix effort (0 for PASS / NOT_APPLICABLE)
- Russian copy: `title`, `description`, `whyItMatters`, `recommendation`

### Raw score

`calculateRawRuleScore`: starts at **100**, subtracts `scoreImpact` for FAIL/WARNING, clamped 0–100. This is **not** the final Growth Score.

### Preview issues

`getPreviewIssues(results, limit=5)`: FAIL/WARNING + `isVisibleInPreview: true`, sorted by impact.

Preview-visible by default: HTTPS missing, title missing, meta description missing, noindex, H1 issues, slow response, thin content, viewport missing.

### Usage

```ts
import {
  scanWebsite,
  extractOnPageSeo,
  runAuditRules,
  getPreviewIssues,
  calculateRawRuleScore,
} from "@/lib/audit";

const scan = await scanWebsite("example.com");
const onPage = extractOnPageSeo(scan.html, scan.finalUrl);
const results = runAuditRules({ scan, onPage });

const preview = getPreviewIssues(results);
const rawScore = calculateRawRuleScore(results);
```

### Out of scope (5.3)

- Final Growth Score calculator
- Database / AuditCheck persistence
- API routes / UI
- Hermes / AI explanations

---

## Modular Rule Engine (prompt 5.4)

The monolithic `rules.ts` was split into a **registry + per-rule modules** so the engine can scale to 100+ checks without a single giant file.

### Rule modules

```
lib/audit/rules/
├── index.ts              # AUDIT_RULES registry (execution order)
├── rule-config.ts        # codes, categories, severities, scoreImpact, previewVisible, estimatedFixMinutes
├── shared/
│   └── create-result.ts  # createRuleResult() — uniform result builder
├── technical/            # HTTPS, status, title, meta, headings, canonical, robots, viewport, lang
├── content/                # word count, internal links, images
├── schema/                 # JSON-LD, FAQ, Organization/LocalBusiness
├── social/                 # Open Graph, Twitter Card
└── performance/            # response time
```

Each module file exports **one** pure function (e.g. `checkTitleExists()`). No arrays or global state inside rule files.

### Rule config

All rule metadata lives in `rules/rule-config.ts` as `RuleConfig` entries:

| Field | Purpose |
|-------|---------|
| `code` | Stable rule outcome identifier |
| `category` | TECHNICAL, CONTENT, SECURITY, … |
| `severity` | INFO → CRITICAL |
| `scoreImpact` | Points subtracted from raw score on FAIL/WARNING |
| `previewVisible` | Shown in free audit preview funnel |
| `estimatedFixMinutes` | Rough fix effort for SMB owners |

Example values: Title 5 min, Meta Description 5, Canonical 10, Viewport 3, HTTPS 30, Schema 20, FAQ 30, Open Graph 15, Twitter 10, Images Alt 20, Word Count 60, Response Time 90.

Rules call `createRuleResult({ config, status, title, … })` from `shared/create-result.ts` so every check produces the same shape.

### Rule engine execution

`rule-engine.ts` does **not** import individual checks — only `AUDIT_RULES` from `rules/index.ts`:

```
for (rule of AUDIT_RULES)
  → execute rule(context)
  → collect AuditRuleResult
  → continue on exception (RULE_EXECUTION_FAILED, NOT_APPLICABLE)
```

### Estimated fix time

`calculateEstimatedFixTime(results)` sums `estimatedFixMinutes` for FAIL and WARNING results. PASS and NOT_APPLICABLE contribute 0.

```ts
import {
  runAuditRules,
  calculateRawRuleScore,
  calculateEstimatedFixTime,
} from "@/lib/audit";

const results = runAuditRules({ scan, onPage });
const rawScore = calculateRawRuleScore(results);
const fixMinutes = calculateEstimatedFixTime(results);
```

### Out of scope (5.4)

- UI / Prisma / Hermes / Growth Score / database persistence

---

## Public Preview API (prompt 6.1)

Stateless public endpoint for the free audit funnel — **no AI, no Hermes, no Prisma, no DB save**.

### Endpoint

**POST `/api/audit/preview`**

**Access:** public (no auth).

**Request:**
```json
{ "url": "https://example.com" }
```

**Pipeline:**
```
validate (zod) → scanWebsite → extractOnPageSeo → runAuditRules
  → calculateRawRuleScore → getPreviewIssues(5) → calculateEstimatedFixTime → JSON
```

**Response 200:** `{ data: { url, score, summary, previewIssues, checksCount, generatedAt } }`

- `score.raw` — 0–100 from rule engine (not Growth Score)
- `score.label` — `poor` | `needs_work` | `good` | `strong`
- `summary` — safe scan/on-page facts (no HTML, no headers, no `textSample`)
- `previewIssues` — up to 5 preview-visible FAIL/WARNING issues
- `checksCount` — pass/warning/fail totals (20 rules)

**Errors:** unified `createErrorResponse` format via `createAuditPreviewErrorResponse`.

| Scanner error | HTTP |
|---------------|------|
| InvalidURL, SSRFBlocked, BlockedHost | 400 |
| Timeout | 408 |
| TooLarge | 413 |
| UnsupportedContentType | 415 |
| WebsiteUnreachable, DNSFailure, SSLFailure | 422 |
| Other | 500 |

**Security:** full HTML, response headers, `textSample`, and stack traces are never returned.

**Rate limit:** not implemented yet — `TODO: Add IP-based rate limiting before public launch.`

### Usage

```ts
const res = await fetch("/api/audit/preview", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "example.com" }),
});
const { data } = await res.json();
```

### Out of scope (6.1)

- Public report page / UI form
- Database persistence / Prisma
- AI / Hermes
- Stripe / auth
- Redis rate limiting (TODO before launch)

---

## Public Audit UI (prompt 6.2)

Client-side page at **`/audit`** that calls `POST /api/audit/preview` — **no AI, no Hermes**. Preview token persisted when DB available (see 6.3).

### Page & components

| Path | Role |
|------|------|
| `app/audit/page.tsx` | Public audit page + SEO metadata |
| `components/audit/AuditUrlForm.tsx` | URL input, API call, error/loading/result states |
| `components/audit/AuditLoadingSteps.tsx` | Visual progress steps during scan |
| `components/audit/AuditPreviewResult.tsx` | Score, stats, issues, register CTA |
| `components/audit/AuditScoreSummary.tsx` | Growth Score preview gauge + label |
| `components/audit/AuditIssueCard.tsx` | Single preview issue card |

### Flow

```
/audit → user enters URL → POST /api/audit/preview → result on same page
       → CTA → /register?website={finalUrl}&previewToken={token}
```

### Marketing integration (minimal)

- Hero: text link «Проверить сайт бесплатно →» → `/audit`
- Header: nav link «SEO-аудит» → `/audit`
- Sitemap: `/audit` entry added

### Out of scope (6.2)

- `/report/[id]`, email, payment, Hermes (preview save → **6.3**)

---

## Preview Token Flow (prompt 6.3)

Bridges stateless `/audit` preview with registration — **no AI, no Hermes**.

### Model

`AuditPreviewToken` (Prisma) stores preview results for **24 hours** until consumed on registration:

| Field | Content |
|-------|---------|
| `token` | `audit_*` via `generateToken("audit")` |
| URL fields | input, normalized, final |
| `rawScore`, `estimatedFixMinutes`, `statusCode` | Score metadata |
| `summaryJson` | Full preview `data` payload |
| `previewIssuesJson` | Top preview issues |
| `checksJson` | All 20 `AuditRuleResult` objects |
| `usedAt` | Set when attached to a new account |

### API flow

```
POST /api/audit/preview
  → scan + rules (unchanged)
  → create AuditPreviewToken (if DB available)
  → { data, previewToken, warning? }

/register?website=...&previewToken=audit_...
  → POST /api/auth/register { previewToken, ... }
  → User + Organization + Website
  → Audit (PREVIEW, COMPLETED) + AuditCheck[] + GrowthScoreSnapshot + Activity
  → Website.currentGrowthScore, lastAuditAt updated
  → token.usedAt = now
```

### Fallback without DB

If `DATABASE_URL` is missing or token persistence fails:

- Preview response still returns `{ data }` (stateless behavior preserved)
- `previewToken: null`
- `warning`: `preview_token_unavailable_no_database` or `preview_token_unavailable`
- Registration works without token; invalid/expired tokens are ignored (registration not blocked)

### Helpers

| File | Functions |
|------|-----------|
| `lib/audit/persist-preview.ts` | `createAuditPreviewToken`, `findValidAuditPreviewToken`, `consumeAuditPreviewTokenForRegistration` |

### Out of scope (6.3)

- Paid full audit, dashboard real data, Stripe, Hermes, email, public report page, AIReadinessSnapshot

---

## Out of scope (prompt 5.1)

- Prisma / Audit records
- API routes → **preview API in 6.1** (`POST /api/audit/preview`)
- HTML parsing / SEO checks → **done in 5.2** (`extractOnPageSeo`)
- Multi-page crawl
- AI / Hermes / LLM
- Dashboard UI

Next steps (MVP Build Plan): public report page, Hermes integration for deeper audits.

---

## Security notes

- Never pass user URLs to fetch without `assertSafeUrl`.
- Redirect targets must be re-validated (open redirect → SSRF vector).
- Scanner logs should not include full HTML in production error logs.
- Rate limiting belongs at the API layer (not implemented here).
