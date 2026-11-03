# drGarage

Car status tracking for a small auto repair shop. Mechanics register cars and update their status from a phone; clients follow progress through a private link, with no app or sign-up.

**Live demo:** https://drgarage.vercel.app
**Demo client links:** `/auto/demo-recibido`, `/auto/demo-en-proceso`, `/auto/demo-cotizacion`, `/auto/demo-listo`

> The shop view (`/`) has no access control in this version. Use demo data only.

## Features

- Register a car (client name, WhatsApp, plate, model, reported problem)
- Change status: Recibido, En proceso, Cotización enviada, Listo
- Prefilled WhatsApp message with the client's private link (`wa.me`)
- Public client page: plate, model, status, 4-step progress and last update; refreshes every ~17 s
- Connection errors never show unsaved data as saved (retry button)

## Stack

Next.js 16 (App Router), TypeScript, Supabase (Postgres, server-only access), Vitest + fast-check.

## Run locally

1. `npm install`
2. Create a Supabase project and run `supabase/migrations/*.sql` in order in the SQL Editor.
3. Copy `.env.example` to `.env.local` and fill `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (a secret key, server only) and `NEXT_PUBLIC_SITE_URL`.
4. `npm run dev`

## Scripts

| Command | What it does |
|---|---|
| `npm test` | Domain unit and property tests |
| `npm run lint` / `npm run build` | Lint and production build |
| `npm run seed:demo` | Recreate the 4 demo cars |
| `npm run seed:clear` | Delete only demo data (`demo-` tokens) |

## How it was built

Spec-driven: steering in `.kiro/steering/`, feature spec in `.kiro/specs/001-seguimiento-por-enlace/` (requirements, design, tasks), implemented with Claude Code following `AGENTS.md`. The visual design in `design/` (tokens, components, prototype and screens) was made with Claude Design. Brand rules: `.kiro/skills/marca-drgarage/`.

## Known limits

- No access control on the shop view; Server Actions can be called directly.
- The "Auto registrado" notice reappears on reload.
- Demo tokens (`demo-…`) are guessable on purpose; never use them with real data.