# Healthlist web

The patient-facing and clinician-facing app for Healthlist.

- **Real API:** auth/session, assessment, intake review, doctor console.
- **Mocked for now:** payment methods.

## Run it

The web app proxies `/api/*` to the API so the httpOnly `sid` cookie stays
same-origin. The API runs on **3001** by default while the web app uses **3000**.

```bash
# API (from /api)
pnpm start:dev

# Web (from /web)
pnpm install
pnpm dev
```

Override the proxy target with `web/.env.local` if needed:

```bash
API_INTERNAL_URL=http://localhost:3001
NEXT_PUBLIC_MCP_URL=https://mcp.healthlist.app/mcp
```

`FRONTEND_URL` in the API environment must point at the web origin
(`http://localhost:3000`) so assistant intake links are generated as `/i/:key`.

## Flow

1. **Landing** — `Continue` starts sign-in. `Connect to my assistant` opens the
   MCP setup modal with the connector URL.
2. **Sign in / create an account** — real `POST /auth`. New patients complete
   the assessment. Deep links such as an assistant intake link are preserved
   across login and assessment. Doctor accounts go straight to the console.
3. **Assessment** — questions come from `GET /assessment` and are rendered by
   type (`MULTI_SELECT`, `YES_NO`, `YES_NO_TEXT`, `TEXT_LIST`). Answers are
   saved one at a time through the API.
4. **Intake review** — the assistant-owned URL uses `/i/[key]`. The page loads
   `GET /intake/:key`, removes products locally, asks any remaining required
   questions, and submits through `POST /intake/submit`.
5. **Dashboard** — real account and `GET /intake` list. Payment methods remain
   locally mocked.
6. **Doctor console** — `/doctor` uses the real `/doctor-console` endpoints:
   review queue, patient assessment, and approve/decline with an optional note.
   The account must have the `DOCTOR` role.

## Backend requirements

- The API must be rebuilt after source changes (`docker compose up --build`).
- Run the current Drizzle schema/migrations so columns for user roles,
  preliminary questions, submitted timestamps, and additional listing questions
  exist.
- Seed assessment questions and listings.
- Give the test clinician account the `DOCTOR` role.
