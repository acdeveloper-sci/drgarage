# drGarage

Car status tracking and repair-quote approval for a small auto repair shop. Mechanics register cars and update their status from a phone; clients follow progress through a private link and approve or reject extra repairs, with the date and time on record. No app or sign-up for clients.

**Live demo:** https://drgarage.vercel.app/conoce
**Demo client links:** `/auto/demo-recibido`, `/auto/demo-en-proceso`, `/auto/demo-cotizacion` (pending quote: try Approve or Reject), `/auto/demo-listo`

> The shop view (`/`) has no access control in this version. Use demo data only.

## Who it is for

Small independent auto repair shops (2 to 8 mechanics) in mid-size Colombian cities, where WhatsApp is the main channel with clients. ICP and personas: [`docs/producto/icp-y-personas.md`](docs/producto/icp-y-personas.md).

## Features

**Tracking by link (feature 01)**

- Register a car (client name, WhatsApp, plate, model, reported problem)
- Change status: Recibido, En proceso, Cotización enviada, Listo
- Prefilled WhatsApp message with the client's private link (`wa.me`)
- Public client page: plate, model, status, 4-step progress and last update; refreshes every ~17 s
- Connection errors never show unsaved data as saved (retry button)

**Quotes with client approval (feature 02)**

- The mechanic adds an extra-repair quote (description and cost in COP) from the car page; a previous pending quote is annulled, never deleted
- WhatsApp message with the quote and its cost
- The client approves or rejects from the same link; a rejection takes an optional note (up to 140 characters, with quick options)
- The decision is final: it is validated on the server, repeating it changes nothing, and a token from another car cannot touch the quote
- Quote history with decision date and the client's note on the car page, and quote chips in the car list

**Landing page (for the ICP)**

- Public page at `/conoce` for shop owners: what drGarage does, how it works and a link to the demo

## Success metrics (pilot)

Defined in the quotes spec: median decision time under 2 h, at least 80 % of quotes decided within 24 h, at least 90 % response rate, first value within 48 h and at least 3 active weeks out of 4. Queries in [`docs/metricas.sql`](docs/metricas.sql); demo cars are excluded.

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
| `npm run seed:demo` | Recreate the 4 demo cars, with demo quotes |
| `npm run seed:clear` | Delete only demo data (`demo-` tokens) |

## How it was built

Spec-driven: steering in `.kiro/steering/`, one spec per feature in `.kiro/specs/` (requirements, design, tasks), implemented with Claude Code following `AGENTS.md`. The visual design in `design/` (tokens, components, prototype and screens) was made with Claude Design. Brand rules: `.kiro/skills/marca-drgarage/`.

## Repository layout

| Area | Location |
|---|---|
| Persistent agent context | `AGENTS.md` (root), `CLAUDE.md`, `.kiro/steering/` |
| Feature specs | `.kiro/specs/001-seguimiento-por-enlace/`, `.kiro/specs/002-cotizaciones/` |
| Spec inputs: problem, solution design, acceptance criteria, metrics | `docs/specs-entrada/` |
| ICP and personas | `docs/producto/icp-y-personas.md` |
| Brand design skill | `.kiro/skills/marca-drgarage/` (Claude Code stub in `.claude/skills/`) |
| Implementation | `app/`, `components/`, `lib/`, `supabase/migrations/`; tests in `lib/dominio/*.test.ts` |
| Spec change history | `git log --oneline -- .kiro/specs` |

## Known limits

- No access control on the shop view: quote amounts are visible to anyone with the address, and Server Actions can be called directly.
- The public decision endpoint has no attempt limit; its protection is the unguessable token and the single, final decision.
- Quote photos are not implemented.
- The "Auto registrado" notice reappears on reload.
- Demo tokens (`demo-…`) are guessable on purpose; never use them with real data.