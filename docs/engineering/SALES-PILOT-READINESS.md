# Sales & First Pilot Readiness — RankBoost

> **Prompt 11.56** — Sales positioning and pilot preparation.  
> **Do not** enable rollout for any website yet.  
> **Do not** clear `LIVE_PUBLISH_KILL_SWITCH` globally.  
> **Do not** publish to customer sites from this document alone.

**Production:** https://www.rankboost.eu  
**Ops checklist:** `docs/engineering/FIRST-CUSTOMER-LIVE-AUTOPILOT.md`

---

## What can be sold today

1. **Website audit + Growth Score + task list**
2. **Monthly Autopilot plan** (articles + improvements) for customer confirmation
3. **Brand-voice article drafts** (Hermes-backed)
4. **Review Queue** — review-first workflow
5. **WordPress connection** — drafts always; **auto-publish after plan confirmation** when site is pilot-enabled
6. **Custom sites** — export / webhook package (not the same as WordPress live publish)
7. **Pause + rollback** for RankBoost WordPress publishes
8. **GSC insights** when connected
9. **RU / EN / ET** product UI

## What must be said honestly

- No Google ranking, traffic, or revenue guarantees.
- Backlinks / partner network are **not** included yet.
- Auto-publish is **not** on for every customer by default.
- Custom CMS ≠ WordPress live publish (package/webhook instead).
- Customer confirms the monthly plan; can pause Autopilot; can roll published WP posts back to draft.
- First live auto-publish customers are **pilot / scoped enablement**.

## What remains beta / pilot

- Per-website live Autopilot enablement (allowlist / DB flag)
- First-rollout limits (max 1/day, max 1 first article)
- Broad multi-customer live publish without owner gate
- SEO_FIX / existing page live updates (still review-only)
- Backlinks / mentions marketplace

## Exact first pilot steps (owner)

1. Select one cooperative WordPress customer; get written approval for that website UUID.
2. Verify WordPress CONNECTED.
3. Approve monthly plan with **Auto-publish** + Autopublish mode; one quality-passed ARTICLE.
4. Enable **only that site** (`livePublishRolloutEnabled` and/or allowlist) — keep global kill switch engaged.
5. Confirm in-app pilot checklist: WP, plan, auto-publish enabled, next date, pause, rollback, support.
6. Owner approves first publish; monitor Activity/Timeline; ready to pause/rollback.
7. See `FIRST-CUSTOMER-LIVE-AUTOPILOT.md` for disable steps.

## Risk checklist

| Risk | Mitigation |
|------|------------|
| Accidental global enable | Kill switch stays engaged; no `OPEN_TO_ALL` |
| Wrong site enabled | UUID allowlist / DB flag only |
| Bad article quality | Quality gate + score threshold |
| Customer panic | Pause + rollback + support email |
| Overpromise in ads | Use recommended ad copy below |
| Custom-site confusion | Explicit WordPress vs package language |

## Recommended ad copy

**EN (short):**  
RankBoost analyzes your site, builds a monthly article plan, writes in your brand voice, and can publish to WordPress after you confirm the plan. Pause anytime. No ranking guarantees.

**RU (short):**  
RankBoost анализирует сайт, готовит месячный план статей, пишет в стиле бренда и может публиковать на WordPress после подтверждения плана. Автопилот можно остановить. Без гарантий позиций.

**ET (short):**  
RankBoost analüüsib saiti, koostab kuuplaani, kirjutab brändi stiilis ja saab WordPressis avaldada pärast plaani kinnitamist. Autopiloodi saab peatada. Ilma positsioonide garantiita.

## Recommended onboarding call script (10–12 min)

1. **Goal:** “We prepare a monthly plan and articles in your brand voice. You confirm once a month.”
2. **WordPress vs custom:** “Auto-publish is for WordPress. Custom sites get a package or webhook.”
3. **Safety:** “You can pause. We can move a RankBoost publish back to draft. No ranking promise.”
4. **Pilot honesty:** “First live auto-publish is a controlled pilot for your site — we enable it together.”
5. **Next steps:** Connect WP → generate plan → confirm Auto-publish → owner enables site → watch first article.
6. **Support:** info@rankboost.eu

## In-app pilot checklist (user-facing)

Shown on Autopilot when Auto-publish / Autopublish is relevant:

- WordPress connected  
- Monthly plan approved  
- Auto-publish enabled for this site (or pending)  
- Next publish date  
- Pause available  
- Rollback available  
- Support contact  

No env var / kill-switch jargon for normal users.
