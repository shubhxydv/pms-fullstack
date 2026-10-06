# Design decisions

## P0: Foundation

I set up the monorepo as npm workspaces (`shared`, `backend`, `web`, with `mobile` joining in P5) outside OneDrive at `C:\dev\pms-fullstack`, since OneDrive's file-sync churns constantly on large `node_modules` trees and causes file-lock errors on Windows. I pinned Prisma to `6.19.3` instead of the newest `prisma` npm tag, because that tag is actually a v7 release-candidate that makes driver adapters mandatory and changes the client output path — a bigger surface of new API than I want to risk under a hard deadline. v6 keeps the generator syntax and `@prisma/client` import I already know well. I also moved `express-rate-limit` to v8 after checking its changelog — its only breaking change is IPv6 /56 subnet masking, which doesn't affect our per-IP login/register limits.

The `/shared` package holds every Zod schema (auth, project, task, pagination, notifications) so the backend, web, and mobile apps validate with identical rules — one password-byte-length check, one calendar-date validator that rejects things like `2026-02-31`, written once. I built it as dual ESM+CJS output via `tsup` so it's consumable from Expo's Metro bundler later without module-format fights.

A reviewer is likely to ask: "why Prisma 6 and not whatever the latest is?" Answer: the `latest` npm dist-tag for `prisma` currently points at an 8.0 release candidate, and I confirmed via the official upgrade guide that v7 introduces mandatory driver adapters and a relocated client — a deliberate, researched choice to stay on the newest *stable* major instead of chasing the tag.

Verify: `docker compose -f docker-compose.dev.yml up -d`, `npm install`, `npm run build -w shared`, `npm run dev -w backend`, then `curl http://localhost:4000/health`.
