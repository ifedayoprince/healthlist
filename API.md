# Healthlist API and MCP reference

The API is a NestJS service on port `3001`. The MCP server on port `3005` wraps the marketplace-facing parts of it for AI assistants.

## Authentication and access

- Browser sessions use an httpOnly `sid` cookie (`SameSite=Lax`), valid for 7 days and rotatable up to 30 days.
- A user has one active session row; signing in rotates the token.
- Passwords are hashed with Argon2.
- A global auth guard runs before every route.
- `PATIENT` and `DOCTOR` roles are enforced server-side. The doctor console is not just hidden in the UI.
- Server-to-server calls from the MCP server use the `mcp-token` header. `MCP_SERVER_IP` can optionally restrict those calls to one address.

Routes below require the session cookie unless the access column says otherwise.

## Endpoints

| Area | Method and path | Access |
| --- | --- | --- |
| Auth | `POST /auth/signin` | Public |
| Auth | `POST /auth/signup` | Public |
| Auth | `POST /auth/logout` | Session |
| Auth | `GET /auth/session` | Session |
| Assessment | `GET /assessment` | Session |
| Assessment | `POST /assessment/submit_answer` | Session |
| Assessment | `POST /assessment/update_answer` | Session |
| Intakes | `POST /intake` | MCP token |
| Intakes | `GET /intake` | Session (own submitted intakes, cursor paginated) |
| Intakes | `GET /intake/:key` | Anonymous while unclaimed; otherwise session + owner |
| Intakes | `POST /intake/submit` | Session |
| Listings | `GET /listing/search` | MCP token or session |
| Listings | `GET /listing` | MCP token or session |
| Listings | `GET /listing/:id` | MCP token or session |
| Doctor console | `GET /doctor-console/intakes` | `DOCTOR` role |
| Doctor console | `GET /doctor-console/intakes/:intakeId` | `DOCTOR` role |
| Doctor console | `GET /doctor-console/assessment/:userId` | `DOCTOR` role |
| Doctor console | `POST /doctor-console/intakes/:intakeId/review` | `DOCTOR` role |

### Intake access

`/i/<key>` is a capability URL. An unclaimed intake can be viewed without a session so a user can see what their assistant picked before signing in. Signing in and submitting claims the intake; after that, only the owner (through the patient API) and a doctor (through the doctor console) can open it.

### Review payload

`POST /doctor-console/intakes/:intakeId/review` accepts:

```json
{
  "isApproved": true,
  "remark": "Optional note for the patient"
}
```

Only `IN_REVIEW` intakes can be reviewed.

## MCP tools

The MCP server exposes three tools. It authenticates to the API with the shared MCP token.

| Tool | Input | What it does |
| --- | --- | --- |
| `search_market` | `search`, optional `minPrice`, `maxPrice`, `category[]` | BM25 search over active listing documents. Names are boosted 3×, tags 1.5×, excerpts 1.25×. |
| `fetch_listing` | `listingId` | Returns the active document and metadata for one listing. |
| `create_session` | `products: string[]` | Creates a pending intake and returns a `sessionUrl` for the user. |

Example handoff:

```json
{
  "sessionUrl": "http://localhost:3000/i/6Gg15qz0Q4YEFdIU0ypH1w"
}
```

See [FLOWS.md](FLOWS.md) for how these fit into the product, and [DATA_MODEL.md](DATA_MODEL.md) for the tables behind them.
