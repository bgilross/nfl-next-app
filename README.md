# next-app

A clean Next.js (Pages + TypeScript) scaffold for migrating the NFL project.

## Setup
1. Copy `.env.example` to `.env` and fill `DATABASE_URL` and `DIRECT_URL`.
2. Install deps and run:

```
npm install
npm run dev
```

## API
- GET /api/health
- GET /api/debug/env
- GET /api/debug/db-info
- GET /api/teams
- GET /api/team/[name]
- GET /api/team-debug?name=...

## Deploy
- Root should be `next-app/` in Vercel
- Build Command: `npm run vercel-build`
- Env vars: `DATABASE_URL`, `DIRECT_URL`
