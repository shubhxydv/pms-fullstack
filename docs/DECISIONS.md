# Design decisions

## P0: Foundation

I set up the monorepo as npm workspaces (`shared`, `backend`, `web`, with `mobile` joining in P5) outside OneDrive at `C:\dev\pms-fullstack`, since OneDrive's file-sync churns constantly on large `node_modules` trees and causes file-lock errors on Windows. I pinned Prisma to `6.19.3` instead of the newest `prisma` npm tag, because that tag is actually a v7 release-candidate that makes driver adapters mandatory and changes the client output path — a bigger surface of new API than I want to risk under a hard deadline. v6 keeps the generator syntax and `@prisma/client` import I already know well. I also moved `express-rate-limit` to v8 after checking its changelog — its only breaking change is IPv6 /56 subnet masking, which doesn't affect our per-IP login/register limits.

The `/shared` package holds every Zod schema (auth, project, task, pagination, notifications) so the backend, web, and mobile apps validate with identical rules — one password-byte-length check, one calendar-date validator that rejects things like `2026-02-31`, written once. I built it as dual ESM+CJS output via `tsup` so it's consumable from Expo's Metro bundler later without module-format fights.

A reviewer is likely to ask: "why Prisma 6 and not whatever the latest is?" Answer: the `latest` npm dist-tag for `prisma` currently points at an 8.0 release candidate, and I confirmed via the official upgrade guide that v7 introduces mandatory driver adapters and a relocated client — a deliberate, researched choice to stay on the newest *stable* major instead of chasing the tag.

Verify: `docker compose -f docker-compose.dev.yml up -d`, `npm install`, `npm run build -w shared`, `npm run dev -w backend`, then `curl http://localhost:4000/health`.

## P1: Backend core

Auth uses JWT (HS256, 15 min) only for the access token; the refresh token is a random 32-byte opaque string, never a JWT, hashed with SHA-256 before it touches the database — so a stolen database dump can't be turned back into usable tokens. Refresh rotates on every use and tracks a `familyId`: if a refresh token is presented twice (meaning one copy was stolen and someone is racing the legitimate client), the whole family is revoked immediately, logging out every device at once rather than just the one token. Logout and the auth middleware both check `session.revokedAt` in the database on every request — a JWT's own expiry can't be revoked early, but the session-table check means a logout takes effect instantly instead of waiting out the 15-minute token lifetime.

Project/task ownership is enforced by querying `WHERE id = ? AND ownerId = ?` (or, for tasks, `project.ownerId = ?`) and returning 404 when it doesn't match — the same 404 a nonexistent id would produce. I verified this with curl: Bob can't fetch, nor create a task inside, Alice's project; both come back as a plain 404, not a 403 that would confirm the id exists.

I hit one real bug worth remembering: Express 5 turned `req.query` into a getter-only property (no setter), so my Zod-validation middleware's old `req.query = parsed` line threw `Cannot set property query` on every query-validated route. Fixed with `Object.defineProperty` to override the instance property. This is a genuine Express 5 breaking change, not a mistake specific to this code — worth checking for in any Express 4 tutorial code ported to 5.

A reviewer is likely to ask: "why 404 instead of 403 for another user's project?" Answer: 403 would confirm the id exists and just isn't yours, letting someone enumerate valid project ids by status code alone; 404 leaks nothing.

Verify: with the server running, `curl -X POST localhost:4000/api/auth/login -H "Content-Type: application/json" -H "X-Client: mobile" -d '{"email":"alice@example.com","password":"Password123"}'`, then reuse the `accessToken` as `Authorization: Bearer <token>` against `/api/projects`, `/api/tasks`, `/api/dashboard`. Full API docs at `http://localhost:4000/docs`.
