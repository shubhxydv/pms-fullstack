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

## P2: Testing, audit logs, RBAC, Docker

Tests run against a completely separate `pms_test` Postgres database (not the dev one), truncated before every test, so tests can never see each other's data. I made each `createApp()` call build its own rate-limit middleware instances instead of sharing module-level singletons — otherwise a login test in one file would eat into the 10-per-15-minutes budget a different file needed, and tests would start failing depending on run order.

I hit a real incident here, worth stating plainly: the test setup's table-truncate first ran against the *dev* database instead of `pms_test`, because `NODE_ENV=test` wasn't actually set before my env-loading code ran — it wiped the seeded demo users. I reseeded and fixed it by forcing `NODE_ENV=test` through the npm script itself (`cross-env`) rather than trusting Vitest's internal env-injection timing, and added a hard guard in the test setup that refuses to run at all unless the resolved `DATABASE_URL` contains `pms_test`. Separately, `docker compose down -v` on the full-stack compose file wiped the *same* dev volume a second time, because neither compose file declared an explicit project `name:`, so they defaulted to the same name and collided on the same Postgres volume. Fixed by naming them `pms-dev` and `pms-full`. No real data was ever at risk (it was local seed data, trivially regenerated), but both are structural fixes, not just "be more careful next time."

Admin RBAC is deliberately boring: the `/admin/*` routes are a separate namespace that only ever queries the `User` and `AuditLog` tables directly — there is no code path where an ADMIN role unlocks a different query against `Project`/`Task`. I wrote a test that proves this: promote a user to ADMIN, then hit the normal `/api/projects/:id` route for *someone else's* project — still 404, same as any other user.

A reviewer is likely to ask: "why not just test the real rate limiter module directly?" Answer: it's a module-level object in Express by convention, so if I hadn't refactored it to a factory, every test file sharing one `loginRateLimit` instance would make test outcomes depend on execution order — a classic flaky-test trap that's worth naming even though it never shipped broken.

Verify: `docker compose -f docker-compose.dev.yml up -d`, then from `backend/`: `cp .env.test.example .env.test` and `npm run test:coverage` (expect 49 tests passing, ~98% statement coverage). For Docker: `docker compose up --build` from the repo root brings up Postgres + the backend from nothing, running migrations automatically; `curl localhost:4000/health`.
