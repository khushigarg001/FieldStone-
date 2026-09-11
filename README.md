# Fieldstone — Real-Time Client Project Dashboard

Internal tool for a small agency: manage client projects, track task
progress, and watch team activity update live, with three strictly
separated access levels (Admin / Project Manager / Developer) enforced at
the API — not just hidden in the UI.

## Stack

- **Frontend:** React + TypeScript (Vite), React Router, Socket.io client
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL via Prisma
- **Real-time:** Socket.io
- **Background jobs:** node-cron
- **Auth:** JWT access token (15m, in-memory on the client) + JWT refresh
  token (7d, HttpOnly cookie)

---

## Local setup (Docker — preferred)

```bash
cp backend/.env.example backend/.env     
cp frontend/.env.example frontend/.env
docker compose up --build
```

This starts Postgres, runs migrations, seeds the database, and starts both
servers:

- API + WebSocket: `http://localhost:4000`
- Frontend: `http://localhost:5173`

Seed accounts (password for all: `Password123!`):

| Role | Email |
|---|---|
| Admin | admin@fieldstone.dev |
| PM | marcus.pm@fieldstone.dev, elena.pm@fieldstone.dev |
| Developer | sana.dev@fieldstone.dev, tobias.dev@fieldstone.dev, ravi.dev@fieldstone.dev, nadia.dev@fieldstone.dev |

### Without Docker

```bash
# Postgres running locally, then:
cd backend
cp .env.example .env   # point DATABASE_URL at your local Postgres
npm install
npx prisma migrate dev
npm run seed
npm run dev             # http://localhost:4000

# separate terminal
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

---

## Database schema

```
Client 1───* Project 1───* Task *───1 User (assignedTo)
                │              │
                │              *
                │          TaskActivity *───1 User (actor)
                │
                *
            (createdBy: User)

User 1───* Notification
Task 1───* Notification (relatedTask, optional)
```

- **User** — `role` (ADMIN/PM/DEVELOPER), `tokenVersion` for refresh-token
  revocation.
- **Project** — `createdById` is the owning PM (or Admin); this single
  column is what "a PM can only manage projects they created" is built on.
- **Task** — `status`, `priority`, `dueDate`, `assignedToId`, `isOverdue`
  (set only by the background job, never on read).
- **TaskActivity** — append-only log. One row per status change, written
  in the same DB transaction as the task update. This is the literal
  source of truth for the activity feed — never derived/recomputed.
- **Notification** — per-user, `isRead` boolean, optional link back to the
  task that caused it.

### Indexing decisions

| Table | Index | Why |
|---|---|---|
| `Task` | `projectId` | every project page loads its task list |
| `Task` | `assignedToId` | a Developer's dashboard is "my tasks", every load |
| `Task` | `status`, `priority` | the required filter params hit these directly |
| `Task` | `(status, dueDate)` composite | the overdue sweep's exact query shape: `status != DONE AND dueDate < now` |
| `TaskActivity` | `(projectId, createdAt)` | the feed and its catch-up query are always "latest N for project X" |
| `TaskActivity` | `(userId, createdAt)` | a Developer's/PM's own feed slice |
| `Notification` | `(userId, isRead)` | unread badge count, every page load and every socket reconnect |
| `Project` | `createdById` | a PM's entire project scope is `WHERE createdById = me` |

---

## Architectural decisions

**Why Socket.io over a raw `ws` server.** Two requirements point at
Socket.io specifically: room-based broadcast (a task update needs to reach
several different audiences — the project's viewers, the owning PM, the
assignee, all admins — simultaneously and without hand-rolled fan-out) and
automatic reconnection with a clean `connect`/`disconnect` lifecycle, which
the presence count and the "missed events" catch-up flow both depend on.
Raw `ws` would mean re-implementing rooms and reconnection bookkeeping by
hand for no real benefit here.

**Room design.** Every connection joins `user:<id>` (their own
notifications, and for Developers, their own activity scope) and a role
room (`role:admin` for Admins, `pm:<id>` for PMs). It also explicitly
joins/leaves `project:<id>` rooms as the user navigates to and away from a
project page — authorization for that join is re-checked against the DB
every time, not cached. A task-status broadcast fans out once to the exact
union of rooms it's relevant to
(`project:<id>`, `role:admin`, `pm:<ownerId>`, `user:<assigneeId>`), so a
single connected socket in multiple matching rooms still only receives the
event once.

**A deliberate scope distinction:** the *project page* shows every task
move in that project to anyone authorized to view the project (including a
Developer who only owns one task there) — that's what "everyone currently
viewing the project sees updates live" requires. The *dashboard activity
widget*, by contrast, is strictly role-scoped (a Developer's dashboard feed
only ever shows their own tasks). Both read from the same `TaskActivity`
table; they differ only in which room(s) the query/broadcast is scoped to.

**Why node-cron over Bull/BullMQ for the overdue sweep.** The job has no
per-item payload, no retry/backoff semantics, and nothing worth persisting
to a queue — it's a single periodic SQL statement on a timer. Bull would
add a Redis dependency to run a query every 5 minutes. If the job grew
per-task side effects with real failure modes (e.g., "send each assignee a
reminder email, retry on failure"), that's the point where Bull/BullMQ
would earn its keep — noted as a natural next step below.

**Why Express over Fastify.** Plain familiarity/ecosystem size for a
team-of-one build under a deadline — Fastify's schema-first validation is
attractive but zod + a small `validate()` middleware gets equivalent
server-side validation without committing to a new framework.

**Refresh token storage.** The refresh token is set as an `HttpOnly`,
`SameSite=Strict` cookie scoped to `/api/auth`, never returned in a JSON
body and never touched by client JS. The access token is the opposite: it
lives only in an in-memory JS variable (`api/client.ts`), never
localStorage — lost on a hard refresh by design, silently re-established
via `/api/auth/refresh` against the cookie on app boot. This means an XSS
payload that can run `fetch()` still cannot read either token directly
(the cookie is invisible to JS; the access token isn't in any
JS-readable storage — it would have to intercept the in-memory variable at
runtime, a materially harder bar than reading `localStorage`).

**Role enforcement is server-side, in two layers.** `requireRole()`
middleware is the coarse gate ("can this role even hit this route"). Actual
row-level access — a PM only seeing *their* projects, a Developer only
their *assigned* tasks — is enforced in the service layer via a `*ScopeWhere()`
function per resource, ANDed into every Prisma query regardless of which
filters the client also requested. A request for `/api/tasks/:id` with a
task id belonging to someone else's project returns `404`, not `403` —
deliberately, so a forged/guessed id doesn't even confirm the resource
exists to an unauthorized caller.

---

## Known limitations

- **Single-counter token revocation.** Logout bumps `User.tokenVersion`,
  invalidating *every* outstanding refresh token for that user — simple,
  but it means logging out on your phone also logs out your laptop. A
  proper multi-device model needs a `RefreshToken` table (one row per
  issued token, revocable individually) instead of one counter per user.
- **Socket.io and the REST API share one Node process/port.** Simpler to
  deploy, but WS and HTTP traffic compete for the same event loop. At
  real scale this wants a Socket.io Redis adapter and horizontal scaling
  behind a load balancer with sticky sessions (or a dedicated WS tier).
- **The overdue sweep runs in-process on a 5-minute cron tick.** Fine for
  one server instance; if this is horizontally scaled, the job needs a
  leader-election guard (or move it to Bull's repeatable jobs, which
  dedupe across workers) so it doesn't run N times per interval.
- **Notification delivery is best-effort over the socket.** The DB write
  is always durable; the live push is skipped if the recipient isn't
  connected. That's intentional (no message queue for this app's size),
  but it means "connect → immediately expect a backlog of pushes" isn't
  the model — the client fetches current state on connect instead.
- **No email/SMS notification channel** — in-app only, per the spec.
- **No test suite included** given the timeframe; the service layer is
  written so each `*ScopeWhere()`/permission function is unit-testable in
  isolation from Express, which is where I'd start.

---

## Deploying

I can't push to a GitHub/GitLab account or deploy to Vercel on your
behalf — those need your own accounts — but this repo is ready to:

1. `git init && git add -A && git commit -m "Initial commit"`, push to a
   new repo on GitHub/GitLab.
2. **Database:** provision managed Postgres (Vercel Postgres, Neon,
   Supabase, or Railway all work) and set `DATABASE_URL`.
3. **Backend:** Vercel's serverless functions don't hold a persistent
   WebSocket connection, so deploy the backend to a long-running host —
   Railway, Render, or Fly.io are the simplest fits for an Express +
   Socket.io process. Set the env vars from `backend/.env.example`
   (`COOKIE_SECURE=true` in production).
4. **Frontend:** deploy `frontend/` to Vercel as a static Vite build, with
   `VITE_API_URL` pointing at the backend host from step 3.
5. Run `npx prisma migrate deploy && npm run seed` once against the
   production database (the Docker image's `CMD` already does this on
   boot).

---

## Explanation (draft — 150–250 words)

*(Written to describe the actual technical approach — personalize with
your own account of the process before submitting.)*

The hardest problem was making the activity feed correctly role-filtered
in real time *and* consistent with what a client fetches after being
offline — two paths writing the same data shape had to actually agree.
I solved it by treating `TaskActivity` rows as the single source of truth:
every status change writes one row in the same transaction as the task
update, and both the live Socket.io broadcast and the REST catch-up
endpoint read from that same table through the same `activityScopeWhere()`
function, so a reconnecting client's "last 20 missed events" query can
never disagree with what would have been pushed live. The second-hardest
part was reconciling two different notions of "scope" for the feed: a
project page needs to show *all* activity in that project to anyone
authorized to view it, while a Developer's personal dashboard feed needs
to show *only* their own tasks — I resolved this by giving Socket.io rooms
a different granularity for each (`project:<id>` vs `user:<id>`/`pm:<id>`/
`role:admin`) rather than trying to force one filtering rule to serve both
UIs.

One thing I'd do differently: build the `RefreshToken` table (per-device,
individually revocable) from the start instead of the single
`tokenVersion` counter — it's a small schema difference now, but retrofitting
per-device logout later would touch both the auth service and every client
session-handling assumption.
