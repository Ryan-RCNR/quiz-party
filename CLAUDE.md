# Quiz Party - Claude Code Context

## Project Overview
Live multiplayer quiz game with mini-games and team competition. Teachers host quiz sessions, students join and compete in real-time with arcade-style mini-games between rounds.

## Tech Stack
- Turborepo monorepo (pnpm)
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS 4
- @rcnr/theme (CSS tokens)
- Clerk authentication (teacher app)
- Token-based auth (student app)
- Playwright (E2E testing)

## Architecture
- **Monorepo structure:**
  - `apps/teacher/` — Teacher dashboard (create quiz sessions, manage rounds, view leaderboards)
  - `apps/student/` — Student game UI (join sessions, answer questions, play mini-games)
  - `packages/shared/` — Shared hooks, types, API client
- **Backend:** rcnr-realtime-api (REST + WebSocket for live multiplayer)
- **Auth:** Clerk for teacher app, token-based for student app
- **Package Manager:** pnpm

## Design System
- Uses @rcnr/theme: `@import "tailwindcss"; @import "@rcnr/theme";`
- RCNR dark brand: bg-midnight, glass-card, text-brand hierarchy

## Commands
- `pnpm install` — Install all dependencies
- `pnpm dev` — Start all apps in dev mode
- `pnpm --filter teacher dev` — Start teacher app only
- `pnpm --filter student dev` — Start student app only
- `pnpm build` — Build all apps
- `pnpm test` — Run Playwright E2E tests

## Deployment
- Vercel (both apps) — https://quizparty.rcnr.net
- Backend: rcnr-realtime-api
