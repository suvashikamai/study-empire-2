# Study Empire

Real-life study progress = empire progress. Plan subjects and topics, run focus
sessions, and watch a persistent city grow, decay, and recover based on how
consistently you actually study.

This is the **Phase 1 MVP** (see [Roadmap](#roadmap)): authentication, subjects
& topics, a study scheduler, a focus timer, a server-authoritative XP/streak
system, and a basic empire with a Town Hall, data-driven buildings, and a 3D
city viewer.

## Quick start

```bash
npm install
cp .env.example .env
# put a real random string in .env's AUTH_SECRET — see below
npm run dev
```

Open http://localhost:3000, create an account, and your starter city (a Town
Hall, three houses, and a library) is waiting. Add a subject, add a topic,
start a focus session, and complete it — XP, Empire XP, and Construction
Points all flow from that one session.

### Generating `AUTH_SECRET`

```bash
openssl rand -base64 48
```

Paste the result into `.env` as `AUTH_SECRET="..."`. The app refuses to start
sessions with the placeholder value, on purpose — see [Security](#security).

## Architecture

```
study-empire/
├── src/
│   ├── app/                      Next.js App Router
│   │   ├── (app)/                 Authenticated shell: dashboard, study,
│   │   │                          schedule, focus, empire, profile
│   │   ├── api/                   Route handlers (REST-ish JSON API)
│   │   ├── login/, register/      Public auth pages
│   │   └── page.tsx                Landing page
│   ├── components/                UI components (design system, 3D city viewer)
│   ├── game-engine/
│   │   ├── config/                 Data-driven progression tables
│   │   │                          (xp, townhall, buildings, achievements,
│   │   │                          quests, decay, assets)
│   │   └── services/               Server-authoritative game logic
│   │                              (XP/streak/empire/building/decay/
│   │                              achievements/quests)
│   ├── lib/
│   │   ├── auth/                   Password hashing, JWT sessions, validation
│   │   ├── db/                     SQLite client, schema, repositories
│   │   ├── mappers.ts               DB row -> API DTO mapping
│   │   └── api-helpers.ts           Shared route-handler helpers
│   ├── middleware.ts               Route protection (redirects unauthed users)
│   └── types/                      Shared TypeScript types
├── tests/                          Vitest unit tests for game logic
├── public/models/                  Bundled 3D building assets (see below)
└── docs/architecture.md            Deeper design notes + scaling path
```

### The core loop, end to end

1. `POST /api/focus/start` opens a `study_sessions` row.
2. `POST /api/focus/:id/complete` is the single most important code path in
   the app (`StudyRewardService.completeSession`): it clamps the claimed
   study duration to real wall-clock elapsed time, computes XP via
   `xp.config.ts`'s rules, then in one pass updates the topic's progress,
   the daily/weekly goal, the user's streak and level, the empire's XP and
   Town Hall level, the current construction project's progress, city
   condition recovery, today's quests, and achievements — all server-side.
3. Nothing about XP, levels, Town Hall level, or building level is ever
   accepted from the client (see [Security](#security)).

### Data-driven game content

Building types, their per-level stats, achievements, quests, and Town Hall
tiers all live in `src/game-engine/config/*.ts` as plain data tables, not
inside components or scattered through services (spec requirement: no
building progression hard-coded in React). Adding a new building or
achievement is a config change, not a refactor. Town Hall levels are
explicitly *not* capped — `townhall.config.ts` generates levels beyond its
curated table from a formula.

## Why SQLite via `node:sqlite` instead of Prisma/Postgres

This sandbox's network policy blocks `binaries.prisma.sh`, which `prisma
generate` needs to download its query engine — so Prisma couldn't be used
here. Rather than fight that, the data layer uses Node's built-in
`node:sqlite` module (stable enough for this MVP; flagged experimental
upstream) with hand-written repository functions in `src/lib/db/repo/`. No
native binary download, no cloud account, `npm install && npm run dev` just
works.

This is a real architectural trade-off, not a toy shortcut — see
[docs/architecture.md](docs/architecture.md) for exactly what moving to a
managed Postgres (Supabase, Neon, Cloud SQL, RDS) at real multi-instance
scale would involve. The schema (`src/lib/db/schema.sql`) is close to
portable ANSI SQL on purpose.

## Security

- Passwords are hashed with bcrypt (12 rounds) — never stored in plain text.
- Sessions are JWTs in an httpOnly, sameSite=lax cookie — inaccessible to
  client-side JS, not sent cross-site.
- Every route handler re-validates input with `zod` server-side, regardless
  of what the client UI already checked.
- **The server is the sole authority for XP, Empire XP, Town Hall level, and
  Building level.** A completed session's duration is clamped to the actual
  wall-clock time elapsed since it started — a client cannot claim more
  study time than physically passed. See `StudyRewardService` and
  `ANTI_CHEAT` in `xp.config.ts`.
- `middleware.ts` redirects unauthenticated requests at the edge; every
  server component under `(app)/` and every API route *also* re-checks the
  session — defense in depth, not "trust the middleware ran."

## 3D empire viewer & asset provenance

The Empire screen renders a lightweight React Three Fiber scene
(`src/components/empire3d/`). Building types map to `.glb` files via
`src/game-engine/config/assets.config.ts` — the only file that knows a
filename, so swapping art later never touches game logic.

**What's bundled vs. not:** the uploaded asset pack ranged from ~200KB to
~250MB per file. To keep this repository a reasonable download, only five
small/medium models are bundled in `public/models/` (house, hospital,
skyscraper, a generic low-poly building, and a small aircraft — ~15MB
total). The larger set (railway station, airport, temple, police station,
hotel — 35MB to 250MB each) is wired up in `assets.config.ts` but **not**
copied in; drop your original files into `public/models/` under the
filenames listed there and they'll render automatically. Until then, those
building types render as simple colored placeholder geometry, which is a
deliberate fallback (see `BuildingMesh.tsx`), not a bug.

**Deliberately excluded:** two files in the original upload were a named
Marvel character (Black Widow) and a named Transformers character
(Shockwave) — real third-party IP. This project's own design brief says
never to ship copyrighted characters/logos/artwork, so those two files are
not referenced anywhere in the app. If you want animated city "citizens,"
use a generic or properly licensed people pack instead.

## Testing

```bash
npm test
```

25 Vitest unit tests cover the parts of the game logic that are easiest to
get subtly wrong and hardest to notice in manual testing: XP/level curve
math, streak continuity across day boundaries, the Town Hall level formula
(including the uncapped generated levels), building progression config
integrity, and the decay/recovery status thresholds. These are pure
functions with no DB — fast and deterministic.

Manual end-to-end verification performed for this build: register → login →
create subject/topic → start focus session → complete session → confirm XP,
Empire XP, Construction Points, streak, quest, and achievement all update
correctly in one request; confirmed the anti-cheat wall-clock clamp rejects
an immediately-completed session as abandoned.

## Development commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (migrates the DB first) |
| `npm run build` | Production build (migrates the DB first) |
| `npm start` | Run a production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:migrate` | Apply `schema.sql` (idempotent) |
| `npm run db:seed` | (stub — see below) |

`npm run db:seed` is wired up but currently a placeholder — there's no
canned demo dataset yet. The starter empire is created automatically at
registration instead (see `EmpireProgressionService.createStarterEmpire`).

## Roadmap

Built now (**Phase 1**): auth, profile, subjects/topics, scheduler, focus
timer, server-validated XP/streak/level, daily/weekly goals, daily quests,
achievements, a data-driven empire with Town Hall + buildings + construction
+ decay/recovery, and a basic 3D city viewer.

**Not built yet, and why:**

- **Friends, friend requests, leaderboards, real-time empire visits (Phase
  2).** The database schema already has `friend_requests` and
  `friendships` tables and a `friendCode` on every user specifically so
  this phase doesn't need a migration — but the service layer and UI for
  it don't exist yet. `LeaderboardService` doesn't exist; ranking would
  read straight off the `users` table's rollup columns.
- **NPCs, roads, traffic, weather, LOD/instancing/culling (Phase 3).** The
  current city viewer places static building meshes on a grid. A living,
  optimized city sim is a substantial project on its own — the renderer is
  structured (one component per building, asset config data-driven) so
  this can be layered in without a rewrite.
- **Guilds, classrooms, quizzes, AI study planning (Phase 4).** Not started.
- **Google login, forgot-password email flow.** Email/password auth is
  fully implemented; OAuth and transactional email need a provider
  (Google OAuth credentials, an email service) that wasn't available to
  wire up in this environment. `docs/architecture.md` notes where they'd
  plug in.
- **Managed cloud auth/DB (Firebase, Postgres).** See the SQLite section
  above — this is an environment constraint, not a design preference, and
  `docs/architecture.md` covers the migration path.

## License

Not specified — add one before distributing.
