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

- Current auth/library data is in-memory (Map-based), not persisted across API restarts.
- Prisma/PostgreSQL/Redis/MinIO are scaffolded in repo, but current core flow does not yet persist library/auth state to database.
- Online featured tracks depend on network availability to iTunes API.
