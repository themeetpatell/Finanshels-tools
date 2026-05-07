# Finanshels-tools

**Finance Navigator** (Finanshels) — Next.js App Router lead funnel for UAE operators: routed assessment, AED-native calculators, optional Supabase persistence, and CRM-shaped logging. Mobile CTAs use safe-area padding; result pages emphasize score clarity and conversion rows.

## Getting started

```bash
cd finance-navigator
npm install
cp .env.example .env.local
npm run dev
```

Production check:

```bash
npm run test
npm run lint
npm run build
npm start
```

## Environment variables

See `.env.example`.

| Key | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (`metadataBase`, OG URLs). |
| `NEXT_PUBLIC_WHATSAPP_E164` | WhatsApp CTAs (`wa.me`). |
| `NEXT_PUBLIC_CONSULTATION_URL` | “Book review” CTA destination. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client when used. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side inserts from API routes. |
| `NEXT_PUBLIC_LEAD_MAGNET_TOOL_SLUG` | Optional featured calculator on the homepage (`registry` slug). |

### Lead identification (mandatory)

- **Assessment, toolkit hub, and every calculator page** are wrapped in `LeadIdentifyGate` (`src/components/lead/lead-identify-gate.tsx`). Visitors submit name, work email, company, headcount band, and consent once; the profile is stored in `localStorage` (`finance-navigator_lead_identity_v2`) and posted to `/api/leads/identify` (Supabase `leads` row with `source_tool_slug` prefixed `identify:…`).
- **Promo deep links still require identification first** (`?promo=1` runs after the gate on each tool page).
- **Clear profile for testing:** remove the `localStorage` key above or use devtools “clear site data”.

### Promoting one calculator (marketing)

- **Any tool, any campaign:** send traffic to `/tools/<slug>?promo=1`. That **session** bypasses the sequential gate for that slug only (see `PromoToolCapture` + `sessionStorage` via `PROMO_UNLOCK_KEY` in `src/lib/toolkit-progress.ts`). Append your own `utm_source`, `utm_medium`, `utm_campaign` as usual.
- **Clear bypass:** open the same URL with `?promo=0` or clear site data for this origin.
- **Homepage hero strip:** set `NEXT_PUBLIC_LEAD_MAGNET_TOOL_SLUG` to mirror the tool you’re amplifying (must match a slug in `registry.ts`).

SEO: `src/app/sitemap.ts` and `src/app/robots.ts` expose all public routes; enrich page copy in each route’s `metadata` and in `src/lib/seo/`.

If Supabase env is incomplete, persistence falls back to **mock** paths while structured payloads still log to `stdout`.

Apply [`supabase/schema.sql`](supabase/schema.sql) when deploying persistence.

## Source layout

```
src/app/(marketing)/          # Pages: home, assessment, tools
src/components/tools/         # Tool clients, assessment, sequential toolkit UI
src/components/forms/         # Shared form primitives (FormField, LabeledSlot)
src/components/results/       # Charts, score highlight, print helpers
src/components/lead/          # Lead capture
src/components/layout/        # Header / footer
src/lib/tools/                # registry, tracks, recommendations, canonical-sequence
src/lib/scoring/              # Pure calculators + assessment router
src/lib/seo/                  # tool-page metadata factory, homepage JSON-LD
src/lib/config/               # site, UAE rules, AED benchmarks
src/lib/data/                 # Persistence (Supabase + mock)
src/lib/forms/                # Shared form helpers (e.g. first field error)
supabase/schema.sql
```

**Toolkit order** lives in [`src/lib/tools/canonical-sequence.ts`](src/lib/tools/canonical-sequence.ts): two **visitor-facing parts** (“Understand your position” → maturity, health, cashflow; “Plan your next moves” → tax timing, hire vs outsource). The flat `CANONICAL_TOOL_SEQUENCE` is concatenated for unlock order. `FUNNEL_PHASES[].visitor*` strings are marketing copy; `funnelLabel` / `crmStages` are **internal only** (analytics + integrators — not rendered on the site). Registry slugs must match `src/app/(marketing)/tools/<slug>/page.tsx`.

Per-tool SEO is centralized in [`src/lib/seo/tool-metadata.ts`](src/lib/seo/tool-metadata.ts).

## Analytics

[`src/lib/analytics/track.ts`](src/lib/analytics/track.ts) — mirrors to `window.dataLayer` when present.

- `assessment_started` / `assessment_completed`
- `tool_started` / `tool_completed` (include `funnelPhase` + `funnelStageLabel` from each tool)
- `lead_identification_submitted` (`funnelContext`, optional `sourceToolSlug`)
- `lead_capture_submitted`
- `whatsapp_cta_clicked` / `consultation_cta_clicked`

## Adding a tool

1. Register in [`src/lib/tools/registry.ts`](src/lib/tools/registry.ts) (slug = route segment).
2. Track in [`src/lib/tools/tracks.ts`](src/lib/tools/tracks.ts).
3. Next-tool chain in [`src/lib/tools/recommendations.ts`](src/lib/tools/recommendations.ts).
4. Optional: append slug to [`CANONICAL_TOOL_SEQUENCE`](src/lib/tools/canonical-sequence.ts) if it belongs in the default funnel.
5. Scoring in `src/lib/scoring/<name>.ts` (pure functions; validate inputs).
6. Client UI in `src/components/tools/<name>-client.tsx`.
7. Route `src/app/(marketing)/tools/<slug>/page.tsx` with `toolPageMetadata("<slug>")`.

Optional: POST `/api/tool-session` on completion for anonymous diagnostics.

## Salary & outsourcing presets

[`src/lib/config/benchmarks.ts`](src/lib/config/benchmarks.ts) — `ROLE_SALARY_BENCHMARKS_AED`, `OUTSOURCING_PACKAGE_BANDS_AED`.

## UAE rules & compliance copy

[`src/lib/config/uaeRules.ts`](src/lib/config/uaeRules.ts) — corporate tax estimator offsets, revenue bands, disclaimers.

## API routes

| Route | Role |
| --- | --- |
| `POST /api/leads` | Validates lead payload + snapshots. |
| `POST /api/assessment` | Stores assessment routing payload. |
| `POST /api/tool-session` | Anonymous tool completion logging; accepts optional `funnelPhase` / `funnelStageLabel` stored on `tool_sessions.metadata`. |

## npm audit

Avoid `npm audit fix --force` if it tries to pin **Next.js** to an ancient major. This repo targets **Next 16** + **React 19**; use `overrides` in `package.json` for transitive advisories when needed.

## Tests

```bash
npm run test
```

Vitest covers scoring modules (maturity, corporate tax calendar math, hiring vs outsourcing, cashflow chart dimensions).

---

Built for Finanshels — escalate finance conversations from signal to accountable advisory.
