---
name: travel-pins
description: >-
  Domain knowledge for the Türkiye Travel Map app. USE WHEN working on map pins,
  categories, the pin CRUD API, the Leaflet map, the grouped sidebar, or the
  Prisma/PostgreSQL persistence layer. Covers data model, conventions, and how to
  add categories or pin fields safely.
---

# Travel Pins — working in this codebase

A personal travel map. The user manually drops pins on a Leaflet map and groups them
by category (restaurants, sights, POIs, experiences, hotels, shopping, other). There
is **no automated AI** — pins are curated by hand.

## Architecture

- **Next.js App Router + TypeScript + Tailwind.**
- **Map is client-only.** `MapView.tsx` uses Leaflet (`window` required) and is loaded
  via `next/dynamic` with `ssr: false` from `TravelApp.tsx`. Never import it directly
  into a server component.
- **State lives in `TravelApp.tsx`** (client). It owns the pins array, selection,
  draft (new pin location), and editing state. Child components are presentational.
- **Persistence:** Prisma (v6, classic `datasource.url`) → PostgreSQL. Pin model in
  `prisma/schema.prisma`. Client singleton in `src/lib/prisma.ts`.

## Data model (`Pin`)

`id, name, category, description?, notes?, address?, latitude, longitude, rating?(1-5),
tags[], createdAt, updatedAt`. `category` is a free string keyed to `CATEGORIES`.

## API routes

- `src/app/api/pins/route.ts` — `GET` (list, optional `?category=`), `POST` (create).
- `src/app/api/pins/[id]/route.ts` — `PUT` (update), `DELETE`. `params` is a Promise
  (`await context.params`).
- All bodies are validated with Zod in `src/lib/validation.ts` before DB access.
- Client calls go through helpers in `src/lib/api.ts` — use these, don't `fetch` inline.

## Conventions

- **Add a category:** append to `CATEGORIES` in `src/lib/categories.ts` (`id`, `label`,
  `icon` emoji, `color` hex). It auto-propagates to the form, markers, and sidebar.
  Update the `CategoryId` union too.
- **Add a pin field:** update `prisma/schema.prisma`, `src/lib/types.ts`,
  `src/lib/validation.ts`, the POST/PUT data mapping, and `PinForm.tsx`. Run
  `npm run db:push`.
- **Markers** are emoji `divIcon`s styled in `globals.css` (`.travel-pin__bubble`).
  Don't use Leaflet's default PNG marker (breaks under bundlers).

## Prisma note

Pinned to **Prisma 6** deliberately. Prisma 7 removed `datasource.url` and requires
driver adapters + `prisma.config.ts`. Stay on 6 unless migrating intentionally.

## Secrets

`.env` (with `DATABASE_URL`) is gitignored. Never commit credentials. `.env.example`
holds placeholders only.
