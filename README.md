# Music Platform

Spotify/SoundCloud-style music platform using Electron desktop, React/Vite frontend, NestJS backend, PostgreSQL, Prisma, Redis, and S3-compatible object storage.

## Architecture

```txt
apps/
  desktop/        Electron + React + Vite desktop client
  api/            NestJS backend API
packages/
  shared/         Shared TypeScript types
prisma/
  schema.prisma   Production data model
docker-compose.yml
```

## Tech Stack

- Desktop: Electron, React, Vite, Zustand, TanStack Query, React Router
- API: NestJS, TypeScript, Prisma
- Database: PostgreSQL
- Cache / realtime support: Redis
- Media storage: MinIO locally, compatible with AWS S3 or Cloudflare R2 later
- Packaging: electron-builder

## Required Software

Install these on your machine:

- Node.js 20.19 or newer
- npm 10 or newer
- Docker Desktop
- Git

Optional but useful:

- Prisma VS Code extension
- PostgreSQL client such as TablePlus, DBeaver, or pgAdmin
- MinIO Client (`mc`) if you want to manage buckets from terminal

## Setup

Create your local environment file:

```bash
copy .env.example .env
```

Install dependencies:

```bash
npm install
```

Start infrastructure:

```bash
docker compose up -d
```

Generate Prisma Client:

```bash
npm run db:generate
```

Create database tables:

```bash
npm run db:migrate -- --name init
```

Run the full system:

```bash
npm run dev
```

Or run each side separately:

```bash
npm run dev:api
npm run dev:desktop
```

## Local Services

- API health: `http://localhost:4000/health`
- API routes: `http://localhost:4000/api`
- Vite dev server: `http://127.0.0.1:5173`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

MinIO credentials:

```txt
username: music
password: music12345
```

## Current Features

- Electron desktop shell with secure preload bridge
- Spotify-style UI layout: sidebar, search, content, queue, player bar
- NestJS API skeleton
- Health endpoint
- Auth module placeholder
- Tracks module placeholder
- Shared TypeScript contracts
- Prisma data model for users, tracks, albums, playlists, likes, comments, follows, and listening history
- Docker Compose for PostgreSQL, Redis, and MinIO

## Next Implementation Steps

1. Add real auth: password hashing, JWT access token, refresh token.
2. Add S3/MinIO upload flow for audio and cover images.
3. Persist tracks in PostgreSQL through Prisma.
4. Add frontend login/register screens.
5. Add upload track screen.
6. Add playlist, like, comment, follow APIs.
7. Add signed streaming URLs.
8. Add local/offline cache for desktop playback.

## Build

Build all packages:

```bash
npm run build
```

Package the desktop app:

```bash
npm run package -w @music/desktop
```
