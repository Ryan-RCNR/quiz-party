# Quiz Party

Live multiplayer quiz game with mini-games and team competition. A Turborepo monorepo with separate teacher and student apps.

## Structure

```
quiz-party/
├── apps/
│   ├── teacher/          # Teacher dashboard → quizparty.rcnr.ai
│   └── student/          # Student game UI  → quizparty.rcnr.net
├── packages/
│   └── shared/           # Shared hooks, types, API client
├── turbo.json
└── pnpm-workspace.yaml
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run both apps in development
pnpm dev

# Run individual apps
pnpm dev:teacher    # http://localhost:5173
pnpm dev:student    # http://localhost:5174

# Build all
pnpm build
```

## Environment Variables

### Teacher App (`apps/teacher/.env`)
```
VITE_API_URL=https://realtime.rcnr.ai
VITE_WS_URL=wss://realtime.rcnr.ai
VITE_CLERK_PUBLISHABLE_KEY=pk_xxxxx
```

### Student App (`apps/student/.env`)
```
VITE_API_URL=https://realtime.rcnr.ai
VITE_WS_URL=wss://realtime.rcnr.ai
```

## Mini-Games

| Game | Description |
|------|-------------|
| Speed Race | First correct answer wins the most points |
| Sharpshooter | Wrong answers cost big - skip if unsure |
| High Stakes | See category, place wager, then answer |
| Knockout | One wrong and you're out |
| Team Up | Paired with teammate - both must be correct |
| Marathon | 60 seconds of rapid fire |
| Steal | Wrong answers open steal window |

## Deployment

Both apps deploy to Vercel from this monorepo:

- **Teacher App**: `quizparty.rcnr.ai`
- **Student App**: `quizparty.rcnr.net` (school-friendly domain)

Each app has its own `vercel.json` configuration.

## Backend

Both apps connect to the `rcnr-realtime-api` service:
- REST API: `https://realtime.rcnr.ai/api/quizparty/*`
- WebSocket: `wss://realtime.rcnr.ai/ws/quizparty/{session_code}`
