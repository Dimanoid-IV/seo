# Growth Score

Last updated: 2026-08-08

## Goal

Growth Score must be deterministic and explainable. It should not be an AI-made number.

RankBoost should eventually show a breakdown:

- Technical SEO
- Content
- Search performance
- Authority
- GEO / AI visibility
- Local SEO
- Conversion

## Current State

RankBoost stores growth score snapshots and displays a score in the dashboard. Audit findings, tasks, GSC data, integrations, articles, and timeline events already influence product decisions in different modules.

The formula needs to be centralized and documented before it becomes a major customer-facing promise.

## Scoring Rules

All score inputs must be one of:

- measured data: audit result, GSC metric, verified execution, integration health;
- deterministic derived value: counts, status, thresholds;
- explicitly labeled estimate.

Do not use ungrounded LLM output as a direct score input.

## Proposed Breakdown

| Component | Inputs | Notes |
|---|---|---|
| Technical SEO | audit checks: indexability, title/meta, canonical, robots, sitemap, status, headings | Deterministic rule output. |
| Content | thin content, missing FAQ/schema, article quality, content freshness, internal links | Use verified content state. |
| Search performance | GSC clicks, impressions, CTR, position, declines, query/page opportunities | Requires connected GSC. |
| Authority | backlinks/referring domains/provider data | Not active until real provider exists. |
| GEO | measurable AI visibility prompts, schema/entity readiness, llms.txt | No fake AI visibility percentage. |
| Local | GBP/local SEO provider data | Future. |
| Conversion | CTA/lead form/engagement/conversions where configured | Future with GA4/lead tracking. |

## Product Copy Rule

If a component has no real data source, the UI should say "not connected yet" or "not enough data", not show a fabricated percentage.

