# Guitar Hero Party — Setlist & Queue

SSR web app for browsing a party setlist, reserving songs with band roles, and displaying a live stage queue. Built with **Bun**, **Astro**, **Tailwind CSS**, **Turso (LibSQL)**, and **Vercel**.

## Setup

```bash
bun install
cp .env.example .env
```

Configure Turso (or local LibSQL):

| Variable | Description |
| --- | --- |
| `TURSO_DATABASE_URL` | Turso URL (`libsql://...`) or local `file:local.db` |
| `TURSO_AUTH_TOKEN` | Turso auth token (optional for `file:` URLs) |

Seed the database (creates schema + sample songs from `songs.json` when empty):

```bash
bun scripts/seed.ts
# or
bun run seed
```

Start dev:

```bash
bun run dev
```

## Views

| Path | Description |
| --- | --- |
| `/` | Catalog grouped by band, sticky client-side search, reserve modal |
| `/queue` | TV/tablet stage queue with 3s polling |

## API

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/api/reserve` | `{ id, singer?, guitar_1?, guitar_2?, drums? }` | `{ song }` |
| `GET` | `/api/queue` | — | `Song[]` |
| `POST` | `/api/status` | `{ id, status: "PLAYED" \| "AVAILABLE" }` | `{ song }` |

`AVAILABLE` clears player fields and `reserved_at`. `PLAYED` marks the song played.

## Deploy (Vercel)

Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel project settings. Run `bun run seed` against production once (or seed via Turso shell) before the party.
