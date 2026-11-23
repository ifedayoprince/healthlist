# Getting started with Healthlist

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for PostgreSQL/ParadeDB)

Three services run in development, plus the database:

| Service | Port |
| --- | --- |
| Web (Next.js) | 3000 |
| API (NestJS) | 3001 |
| MCP server | 3005 |
| PostgreSQL/ParadeDB | 5432 |

## 1. Database and API

```bash
cd api
```

Create `.env`:

```env
POSTGRES_USER=healthlist
POSTGRES_PASSWORD=healthlist
POSTGRES_DB=healthlist

DATABASE_URL=postgresql://healthlist:healthlist@localhost:5432/healthlist
FRONTEND_URL=http://localhost:3000
MCP_SERVER_TOKEN=replace-with-a-32-byte-base64url-token
```

`MCP_SERVER_TOKEN` is the shared secret between the API and the MCP server. `MCP_SERVER_IP` is optional and, when set, restricts MCP traffic to that address.

Start the database, apply the schema, seed it, and run the API:

```bash
docker compose up -d db

pnpm install
pnpm exec drizzle-kit migrate
pnpm db:seed
pnpm start:dev
```

The API listens on `http://localhost:3001`.

To run the whole backend in containers instead:

```bash
docker compose up --build -d
```

The container start command applies migrations before booting (`drizzle-kit migrate && node dist/main`). Seed data still comes from `pnpm db:seed`.

`FRONTEND_URL` must match the web origin (`http://localhost:3000`) because intake links are generated as `${FRONTEND_URL}/i/<key>`.

## 2. MCP server

```bash
cd mcp
```

Create `.env`:

```env
MCP_SERVER_TOKEN=the-same-token-as-the-api
HEALTHLIST_API_URL=http://localhost:3001
```

Then:

```bash
pnpm install
pnpm dev
```

The server listens on `http://localhost:3005/mcp`.

## 3. Web app

```bash
cd web
```

Create `.env.local`:

```env
API_INTERNAL_URL=http://localhost:3001
NEXT_PUBLIC_MCP_URL=http://localhost:3005/mcp
```

Then:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

The web app proxies `/api/*` through Next.js so the httpOnly session cookie stays same-origin. Point `NEXT_PUBLIC_MCP_URL` at your deployed MCP URL when not running locally.

## Seeded demo accounts

The seed script creates fictional users, 27 assessment questions, and 20 listings.

| Role | Email | Password |
| --- | --- | --- |
| Patient | `peter@example.com` | `Strong_Pass1` |
| Patient | `brian@example.com` | `Strong_Pass1` |
| Doctor | `jane@example.com` | `Strong_Pass1` |

Sign in as a patient to walk through the assessment and intake flow. Sign in as the doctor to open `/doctor`.

## Trying the full flow locally

1. Sign in as `peter@example.com`.
2. Complete the preliminary assessment.
3. Use the MCP inspector (`cd mcp && pnpm inspect`) or an MCP client to call `create_session` with a listing ID from `GET /listing`.
4. Open the returned `/i/<key>` link, answer any product-specific questions, and submit it for review.
5. Sign in as `jane@example.com`, open `/doctor`, and review the request.
6. Sign back in as Peter to see the decision and the doctor's note on the intake page.

## Checks

```bash
# API
cd api
pnpm test
pnpm lint
pnpm build

# Web
cd web
pnpm exec tsc --noEmit
pnpm exec eslint .
pnpm build

# MCP
cd mcp
pnpm build
```

## Troubleshooting

- **Sign-in returns a server error:** confirm the latest migrations ran, then rebuild/restart the API so it is not running stale compiled code.
- **Intake links point at the wrong origin:** check `FRONTEND_URL` in the API environment.
- **The assistant cannot find the MCP server:** confirm `MCP_SERVER_TOKEN` is identical in `api/.env` and `mcp/.env`, and that `NEXT_PUBLIC_MCP_URL` points at `/mcp` on port 3005.
- **Search fails:** the database must be the ParadeDB image with the `vector` and `pg_search` extensions created by `api/db/init/001-extensions.sql`.
