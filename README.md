# RankBoost.eu

Production-ready SEO Autopilot SaaS platform and multilingual marketing site for Estonia and Europe.

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Resend, Zod.

**Languages:** Russian (`/ru`), Estonian (`/et`), English (`/en`) — default locale is Russian.

---

## RankBoost SaaS MVP Development

This repository will grow from the **production marketing site** into a **SaaS MVP** (AI Growth Platform). The marketing site must keep working on every commit.

| Document | Purpose |
|----------|---------|
| [`docs/Product-Bible.md`](docs/Product-Bible.md) | Product vision, tariffs, MVP scope |
| [`docs/System-Architecture.md`](docs/System-Architecture.md) | Technical architecture (frontend, API, Hermes, queue) |
| [`docs/MASTER-BUILD-PLAN.md`](docs/MASTER-BUILD-PLAN.md) | **Start here before writing code** — master entry point |
| [`docs/MVP-Build-Plan.md`](docs/MVP-Build-Plan.md) | Step-by-step prompts (51 blocks) |
| [`docs/Integration-Roadmap.md`](docs/Integration-Roadmap.md) | How to add SaaS without breaking the landing |
| [`docs/engineering/REPO-MAP.md`](docs/engineering/REPO-MAP.md) | Repo zones: marketing vs planned SaaS paths |

**Rules:**

- Do **not** break the existing marketing site (`/ru`, `/et`, `/en`, blog, contact form).
- SaaS is added **alongside** the current site — new routes (`/app`, `/audit`, `/api/auth`, …), not a rewrite of `app/[locale]/`.
- Follow `docs/MASTER-BUILD-PLAN.md` and `docs/MVP-Build-Plan.md` prompt order.
- After each step: `npm run lint` && `npm run build`.

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes (for contact form) | API key from [Resend](https://resend.com) |
| `CONTACT_EMAIL` | No | Inbox for form submissions (default: `seoagenth@gmail.com`) |
| `FROM_EMAIL` | No | Sender address (default: `RankBoost <onboarding@resend.dev>`) |
| `NEXT_PUBLIC_SITE_URL` | No | Public URL for SEO (default: `https://www.rankboost.eu`) |

Example `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_EMAIL=seoagenth@gmail.com
FROM_EMAIL=RankBoost <noreply@rankboost.eu>
NEXT_PUBLIC_SITE_URL=https://www.rankboost.eu
```

> **Note:** Until your domain is verified in Resend, use the test sender:
> `FROM_EMAIL=RankBoost <onboarding@resend.dev>`

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/ru`.

### 4. Production build

```bash
npm run build
npm start
```

---

## Resend setup

1. Create an account at [resend.com](https://resend.com).
2. Generate an API key under **API Keys**.
3. Add `RESEND_API_KEY` to `.env.local` (and Vercel env vars on deploy).
4. **Verify your domain** (`rankboost.eu`) under **Domains** to send from `noreply@rankboost.eu`.
5. Until verified, emails are sent from `onboarding@resend.dev` (Resend sandbox).

Contact form flow:

- Client submits to `POST /api/contact` (server-only — API key never exposed to browser).
- Server validates with Zod, checks honeypot, sends HTML email via Resend.
- Recipient: `CONTACT_EMAIL` (default `seoagenth@gmail.com`).

---

## Deploy on Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Framework preset: **Next.js** (auto-detected).
4. Add environment variables in **Project → Settings → Environment Variables**:

   ```
   RESEND_API_KEY
   CONTACT_EMAIL
   FROM_EMAIL
   NEXT_PUBLIC_SITE_URL=https://www.rankboost.eu
   ```

5. Deploy. Vercel will run `npm run build` automatically.

6. Connect custom domain `rankboost.eu` in **Domains** settings.

7. After domain is live, verify `rankboost.eu` in Resend and update `FROM_EMAIL`.

---

## Project structure

```
app/
  [locale]/           # Localized pages (ru, et, en)
    page.tsx          # Home
    services/         # Services
    pricing/          # Pricing plans
    blog/             # Blog list + articles
    contact/          # Contact form
    privacy/          # Privacy policy
    terms/            # Terms of service
  api/contact/        # Resend API route
  sitemap.ts          # Dynamic sitemap with hreflang
  robots.ts           # robots.txt
components/           # UI, sections, forms, blog, SEO
data/
  blog/posts/         # 60 blog articles (20 × 3 locales)
  services.ts         # 8 SEO services
  pricing.ts          # 4 pricing plans
i18n/
  dictionaries/       # ru.ts, et.ts, en.ts
lib/                  # SEO, i18n, validators, Resend, JSON-LD
middleware.ts         # Locale routing (/ → /ru)
```

---

## Add a new blog article

Articles live in `data/blog/posts/all-posts.ts`.

1. Open `all-posts.ts` and add a new entry to the `articles` array using `buildPost()`:

```ts
buildPost({
  locale: "ru",
  translationKey: "my-new-topic",   // same key for all language versions
  slug: "my-article-slug",
  title: "Article title",
  metaTitle: "SEO title | RankBoost.eu",
  metaDescription: "Meta description for search engines.",
  date: "2025-06-17",
  category: "Local SEO",
  excerpt: "Short preview text.",
  tags: ["SEO", "Estonia"],
  content: [
    { type: "h2", text: "Section heading" },
    { type: "p", text: "Paragraph text." },
    // types: h2, h3, p, ul, ol, links, cta
  ],
  faq: [
    { question: "Question?", answer: "Answer." },
  ],
}),
```

2. Add Estonian and English versions with the **same `translationKey`** but different `slug` and `locale`.
3. Rebuild — Next.js generates static pages via `generateStaticParams`.
4. Sitemap updates automatically (hreflang alternates via `translationKey`).

Content section types are defined in `data/blog/types.ts`.

---

## Add or update a translation

UI strings are in `i18n/dictionaries/`:

- `ru.ts` — Russian (source of truth for `Dictionary` type)
- `et.ts` — Estonian
- `en.ts` — English

To change any UI text:

1. Edit the relevant key in all three dictionary files.
2. Keep the same structure — TypeScript will flag missing keys.

To add a new locale (advanced):

1. Add locale code to `i18n/config.ts` → `locales`.
2. Create `i18n/dictionaries/xx.ts` matching the `Dictionary` type.
3. Register it in `lib/i18n.ts` → `dictionaries`.
4. Add dictionary content for services, pricing, blog articles.

---

## Change the contact email

**Option A — environment variable (recommended for production):**

```env
CONTACT_EMAIL=your-new-email@example.com
```

Set this in `.env.local` locally and in Vercel **Environment Variables** on deploy.

**Option B — code default:**

Edit `lib/resend.ts`:

```ts
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ?? "your-new-email@example.com";
```

Also update the email shown in error messages in `i18n/dictionaries/{ru,et,en}.ts` → `contact.form.error` and legal pages if needed.

---

## SEO features

| Feature | Location |
|---------|----------|
| Page metadata (title, description, keywords) | `lib/seo.ts`, each `page.tsx` |
| OpenGraph & Twitter cards | `generatePageMetadata()` |
| Canonical URLs & hreflang | `lib/seo.ts` → `alternates` |
| Sitemap | `app/sitemap.ts` → `/sitemap.xml` |
| Robots | `app/robots.ts` → `/robots.txt` |
| JSON-LD Organization / LocalBusiness | `app/[locale]/layout.tsx` |
| JSON-LD Service | `app/[locale]/services/page.tsx` |
| JSON-LD FAQPage | `app/[locale]/pricing/page.tsx` |
| JSON-LD BlogPosting | `components/blog/BlogJsonLd.tsx` |

> OpenGraph image is generated dynamically at `/opengraph-image` (1200×630).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (87 static pages) |
| `npm start` | Start production server |
| `npm run lint` | ESLint |

---

## Production checklist

- [ ] `RESEND_API_KEY` set on Vercel
- [ ] Domain verified in Resend → `FROM_EMAIL=RankBoost <noreply@rankboost.eu>`
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.rankboost.eu`
- [ ] Contact form tested on production
- [ ] `/sitemap.xml` and `/robots.txt` accessible
- [ ] All three locales load: `/ru`, `/et`, `/en`

---

## License

Private project — RankBoost.eu © 2025.
