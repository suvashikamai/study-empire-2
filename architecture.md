# Architecture notes

## Scaling the database off SQLite

`src/lib/db/client.ts` opens one `node:sqlite` connection per process and
`src/lib/db/repo/*.ts` hold hand-written SQL. This is fine for a single dev
instance or a small single-server deployment, but SQLite does not support
multiple app server instances writing concurrently, which real "thousands
to millions of users" scale (spec section 4) requires.

To move to Postgres (Supabase, Neon, Cloud SQL, RDS — any managed option):

1. Stand up a Postgres instance and put its connection string in
   `DATABASE_URL`.
2. Rewrite `schema.sql`'s dialect: SQLite's `TEXT` primary keys are fine as
   Postgres `text`, but swap `datetime('now')` for `now()`, and consider
   native Postgres enums instead of the `TEXT` + application-level enum
   pattern used here (kept deliberately simple for SQLite portability).
3. Swap `client.ts`'s internals for a Postgres driver (`pg`, `postgres.js`,
   or an ORM). The repository functions in `src/lib/db/repo/` are the only
   other place that touches SQL directly — most of their queries are
   already close to portable ANSI SQL, so this is a contained change, not a
   rewrite of the app.
4. Everything above `src/lib/db/repo/` (game-engine services, API routes,
   UI) does not know or care what database is underneath — that boundary
   was deliberate.

An ORM (Drizzle, Prisma once its engine is reachable, etc.) is optional at
that point — the current repo-function style was chosen for this
environment's constraints (see the README's "Why SQLite" section), not
because it's the only viable pattern going forward.

## Auth provider migration

`src/lib/auth/password.ts` and `src/lib/auth/session.ts` implement
password hashing and session issuance directly. To move to a managed
provider (Firebase Auth, Auth0, Clerk):

1. Replace the `/api/auth/*` route handlers' internals with the provider's
   SDK calls; keep the routes' request/response shape the same so the
   frontend doesn't change.
2. Replace `getSessionUserId()` in `session.ts` with the provider's
   session/token verification.
3. `middleware.ts` and every `requireUser()` call site stay the same — they
   depend only on "is there a valid session," not on how that session was
   issued.

Google OAuth and a forgot-password email flow both slot into this same
`/api/auth/*` surface; they weren't implemented here because this
environment had no OAuth client credentials or transactional email provider
to wire up against, not because the architecture doesn't support them.

## Real-time (Phase 2+)

Friends seeing each other's empire updates without a full refresh (spec
section 37) is not implemented. The cleanest path with the current stack is
Server-Sent Events or WebSockets from a small notification service that
`StudyRewardService` publishes to after a completed session — or, if the DB
migration above lands on Postgres, `LISTEN`/`NOTIFY`. A managed realtime
DB (Firestore, Supabase Realtime) is the other reasonable option and was
the spec's own suggestion.

## Leaderboards

Deliberately not stored as their own table — `docs` and the README both
note this as a Phase 2 stub. Ranking by XP, streak, or study hours is a
straight `ORDER BY` over the `users` table's already-denormalized rollup
columns (`total_xp`, `current_streak`, `total_study_minutes`), scoped to a
user's friend list once friendships exist. No separate `leaderboards` table
should be needed unless a specific ranking needs pre-computation at scale.
