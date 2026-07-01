# Design System — RankBoost SaaS Dashboard

> **Prompt 10.2** — UX and design consistency reference for the `/app` dashboard.  
> Marketing site styles live separately under `app/[locale]/`.

**Related:** `lib/copy/trust.ts` · `components/shared/*` · `components/dashboard/EmptyState.tsx`

---

## 1. Product voice

RankBoost is an **AI Growth Manager** — proactive, calm, and user-controlled.

- Prefer: growth opportunities, drafts for review, actions waiting for approval
- Avoid: scanner jargon, cron/webhook/row language, passive “no data” messages

---

## 2. Visual direction

- Dark navy background (`#050816`, `#0a0f1e`)
- Glass cards (`.glass-card`) with soft borders (`border-white/10`)
- Rounded corners (`rounded-xl` / `rounded-2xl`)
- Lucide icons, restrained blue/violet gradients
- Responsive spacing: `p-4 pb-24 lg:p-8` on main pages (room for mobile nav)

---

## 3. Page header pattern

Use `components/shared/PageHeader.tsx`:

```tsx
<PageHeader
  title="Growth Timeline"
  subtitle="See what RankBoost found while monitoring your website."
  actions={<Button>…</Button>}
/>
```

Every main SaaS page should have **title + product-focused subtitle**. Optional primary action on the right (stacks on mobile).

---

## 4. Loading & error states

| Component | Use |
|-----------|-----|
| `PageLoadingState` | Full-page fetch on first load |
| `PageErrorState` | Failed load with **Try again** + link to dashboard |
| Inline banners | Action errors (checkout, save, generate) |

Default error copy: `PAGE_ERROR_FALLBACK` in `lib/copy/trust.ts`.

---

## 5. Empty states

Use `components/dashboard/EmptyState.tsx` (icon + title + description + optional action).

Rules:

1. Explain what is missing
2. Explain why it matters
3. Offer a next step (button or link)

Avoid bare “No data” / “Empty”.

---

## 6. Trust notes

Use `components/shared/TrustNote.tsx` at decision points (not on every card):

| Variant | When |
|---------|------|
| `billing` | Billing page — cancel anytime + data stays available |
| `ai` | Article / social generation — drafts only |
| `email` | Email approvals — approve ≠ send |
| `wordpress` | WordPress draft creation |
| `info` | Stripe not configured, general info |

Copy lives in `lib/copy/trust.ts`.

---

## 7. Navigation order

Sidebar (`components/layout/AppSidebar.tsx`):

1. Dashboard  
2. Setup (conditional — `OnboardingSidebarLink`)  
3. Control Center  
4. Timeline  
5. Growth Tasks (disabled)  
6. Content Plan  
7. Social Posts  
8. Autopilot  
9. Email Approvals  
10. Reports  
11. Integrations  
12. Billing  

Mobile: first four items in bottom bar + “More” sheet.

---

## 8. CTA naming

| Action | Label |
|--------|-------|
| Audit | Run audit |
| Monthly plan | Generate plan |
| Social | Generate post |
| Email | Generate email |
| WordPress | Create WordPress draft |
| Email send | Send email manually |
| Billing | Upgrade plan / Manage billing |
| Copy social | Copy post (marks copied) |

Never: Publish automatically, Execute, Submit (for product actions).

---

## 9. Status badges (guidance)

Use existing badge components; map consistently:

| Status | Tone |
|--------|------|
| READY / CONNECTED / APPROVED | Green / success |
| DRAFT | Neutral |
| NEEDS_REVIEW / WARNING | Amber |
| ERROR / HIGH priority | Red |
| ARCHIVED / MISSING | Muted |

---

## 10. AI & publishing safety

- AI creates **drafts only** — user reviews before anything goes live
- Email **approval does not send**
- WordPress creates **drafts only**
- Monthly Autopilot **does not execute** actions automatically
- No automatic publishing or email sending in UI or API

---

## 11. Mobile layout notes

- Main content: `pb-24` for bottom nav clearance
- Dialogs: `max-h-[min(90vh,100dvh)]` + `overflow-y-auto`
- Grids: `sm:grid-cols-2`, stack on narrow viewports
- Long URLs: `truncate` / `break-all` on meta lines
- Tables/lists: wrap in `overflow-x-auto` when needed

---

## 12. Shared components (10.2)

| Path | Role |
|------|------|
| `components/shared/PageHeader.tsx` | Title + subtitle + actions |
| `components/shared/PageLoadingState.tsx` | Centered spinner |
| `components/shared/PageErrorState.tsx` | Error + retry |
| `components/shared/TrustNote.tsx` | Safety / billing trust copy |
| `components/dashboard/EmptyState.tsx` | Empty states |
| `lib/copy/trust.ts` | Centralized user-facing trust strings |

---

## 13. Pages updated in 10.2

Dashboard, Control Center, Timeline, Content Plan, Social Posts, Autopilot, Email Approvals, Reports, Integrations, Billing, Onboarding GSC step, WordPress draft button.

Marketing site (`app/[locale]/`) unchanged except where noted in release notes.
