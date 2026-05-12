# Music Platform

Spotify-like desktop music app built with Electron + React and a NestJS API.

## Monorepo Structure

```txt
apps/
  desktop/        Electron + React + Vite app
  api/            NestJS API
packages/
  shared/         Shared TypeScript types
prisma/
  schema.prisma
docker-compose.yml
```

## Tech Stack

- Desktop: Electron, React, Vite, Zustand, TanStack Query
- API: NestJS, TypeScript, class-validator
- Shared: TypeScript package (`@music/shared`)
- Infra (prepared): PostgreSQL, Redis, MinIO via Docker Compose

## Requirements

- Node.js `>=20.19.0`
- npm
- Docker Desktop (optional for infra services)

## Run Locally

Install dependencies:

```bash
npm install
```

Run both API + desktop:

```bash
npm run dev
```

Run separately:

```bash
npm run dev:api
npm run dev:desktop
```

Build all packages:

```bash
npm run build
```

Package desktop app:

```bash
npm run package -w @music/desktop
```

## Docker Deploy API

The Docker setup deploys the NestJS API. The Electron desktop app is packaged separately as a desktop installer.

Build the API image:

```bash
docker compose -f docker-compose.api.yml build
```

Run the API container:

```bash
docker compose -f docker-compose.api.yml up -d
```

Check the API:

```bash
curl http://localhost:4000/health
```

Stop the API container:

```bash
docker compose -f docker-compose.api.yml down
```

For a VPS deploy, copy the repo to the server, create a production `.env`, apply migrations, then run the same compose command:

```bash
npx prisma migrate deploy
docker compose -f docker-compose.api.yml up -d --build
```

## Supabase PostgreSQL

You can use Supabase instead of a local/Docker PostgreSQL database.

1. Create a Supabase project.
2. In Supabase SQL Editor, create a dedicated Prisma database user:

```sql
create user "prisma" with password 'replace_with_a_strong_password' bypassrls createdb;
grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

3. Copy `.env.supabase.example` to `.env`.
4. In Supabase Dashboard, open **Connect** and copy the Supavisor Session pooler connection string. It should use port `5432`.
5. Replace `[PROJECT-REF]`, `[DB-REGION]`, and `[PRISMA-PASSWORD]` in `DATABASE_URL` and `DIRECT_URL`.
6. Generate Prisma Client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

After these steps, auth and library data are persisted through Prisma/PostgreSQL.

## Local Endpoints

- API base: `http://localhost:4000/api`
- Health check: `http://localhost:4000/health`
- Desktop Vite dev server: `http://127.0.0.1:5173`

## Current Features

### Desktop

- Spotify-style 3-column layout (library, main content, now playing)
- Home feed, search flow, profile view
- Playlist view, like/unlike track, add/remove track to playlist
- Queue panel + player bar controls
- Sort/view controls in library
- Uploads flow: choose local audio files from OS file picker, then add into library state

### API (`/api`)

- `POST /auth/register`
- `POST /auth/login`
- `GET /tracks/featured` (fetches online preview tracks from iTunes, fallback to local seed tracks)
- `POST /tracks` (create draft track payload)
- `GET /library?userId=...`
- `POST /library/likes/toggle`
- `POST /library/playlists`
- `POST /library/playlists/:playlistId/tracks`
- `DELETE /library/playlists/:playlistId/tracks/:trackId?userId=...`
- `PATCH /library/selected-folder`
- `POST /library/uploads`
- `POST /library/follows/toggle`
- `POST /actions/track` (UI action tracking)

## Important Notes

- Auth and library data are persisted through Prisma/PostgreSQL.
- Local upload flow stores track metadata and the local `file:///` audio URL in PostgreSQL. The audio file itself remains on the user's machine.
- Redis and MinIO are scaffolded in repo, but the current core flow does not yet require them.
- Online featured tracks depend on network availability to iTunes API.
