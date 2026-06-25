# 🗺️ Türkiye Travel Map

A personal travel website where **you** drop custom pins on a map and organise them
by category — restaurants, places to see, points of interest, experiences, hotels,
shopping and more. Click anywhere on the map, fill in the details, and your pins are
grouped into a tidy sidebar.

> Pins are created and curated manually — no automated AI queries. You're in full
> control of what gets added and how it's grouped.

## Features

- 🌍 Interactive map (Leaflet + OpenStreetMap, no API key required)
- 📍 Click the map to add a pin with name, address, description, notes, rating & tags
- 🗂️ Pins automatically grouped by category in the sidebar
- ✏️ Edit and delete pins inline
- 🎯 Click a pin (map or list) to fly to it
- 💾 Persisted in PostgreSQL via Prisma

## Tech stack

| Layer    | Choice                                    |
| -------- | ----------------------------------------- |
| Framework| Next.js (App Router, TypeScript)          |
| Styling  | Tailwind CSS                              |
| Map      | Leaflet + react-leaflet + OpenStreetMap   |
| Database | PostgreSQL via Prisma ORM                 |
| Validation | Zod                                     |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Copy the example env file and fill in your PostgreSQL connection string:

```bash
cp .env.example .env
```

```env
# .env  (gitignored — never commit this)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/travelsite"
```

> URL-encode special characters in the password (e.g. `@` → `%40`, `!` → `%21`).
> If your server requires SSL, append `?sslmode=require`.

### 3. Create the database table

```bash
npm run db:push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Production build                     |
| `npm run start`     | Run the production build             |
| `npm run db:push`   | Sync the Prisma schema to the DB     |
| `npm run db:studio` | Open Prisma Studio (DB browser)      |
| `npm run lint`      | Lint the project                     |

## Project structure

```
prisma/
  schema.prisma          # Pin model
src/
  app/
    page.tsx             # Renders the TravelApp
    api/pins/route.ts    # GET (list) / POST (create)
    api/pins/[id]/route.ts # PUT (update) / DELETE
  components/
    TravelApp.tsx        # Client state container
    MapView.tsx          # Leaflet map (client-only)
    Sidebar.tsx          # Pins grouped by category
    PinForm.tsx          # Add / edit pin form
  lib/
    categories.ts        # Category definitions (id, label, icon, color)
    types.ts             # Pin / PinInput types
    prisma.ts            # Prisma client singleton
    api.ts               # Client-side fetch helpers
    validation.ts        # Zod request schemas
```

## Adding a new category

Edit [`src/lib/categories.ts`](src/lib/categories.ts) and add an entry to the
`CATEGORIES` array (`id`, `label`, `icon` emoji, `color`). It will automatically
appear in the pin form, the map markers, and the grouped sidebar.

## Troubleshooting

**`P1001: Can't reach database server`** — the app can't connect to PostgreSQL. Check:

- Postgres is running and listening on the public interface (`listen_addresses = '*'`
  in `postgresql.conf`).
- The firewall allows inbound TCP on port `5432` (e.g. DigitalOcean firewall / `ufw`).
- `pg_hba.conf` permits remote connections for `travelsite_user`.
- If SSL is required, add `?sslmode=require` to `DATABASE_URL`.

## Security notes

- `.env` is gitignored; database credentials are **never** committed.
- All API input is validated with Zod before touching the database.
