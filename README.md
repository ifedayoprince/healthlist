# Healthlist

**A telehealth marketplace that feels like a small world — just you, your assistant, and your doctor.**

Healthlist is a proof of concept for a different kind of marketplace. Instead of a giant storefront with a catalogue to scroll, discovery happens inside the user's AI assistant. The products land on one quiet, personal page where the user reviews them, answers a few health questions, and sends the request to a doctor.

Inspired by the vision behind **Bask.Health's acquisition of Telehealth.com**.

> This is a proof of concept. It uses fictional products and is not a medical service or a production-ready health platform.

## The idea

- The assistant does the searching and comparison.
- The user sees only the few products that matter to them.
- Sensitive health data never goes to the assistant.
- A doctor reviews the final plan with both the products and the patient's answers in one view.
- The whole experience is one continuous flow, not a catalogue with a checkout bolted on.

The MCP server is the front door to the market. The web app is the private room where the important parts happen.

## What is in this repo

| Directory | What it is |
| --- | --- |
| `api/` | NestJS API: auth, assessments, listings, intakes, doctor console, Drizzle schema, migrations, seed data. Hand-written. |
| `mcp/` | MCP server exposing `search_market`, `fetch_listing`, and `create_session` to an AI assistant. Hand-written. |
| `web/` | Next.js patient and clinician app. Built with a coding agent from Figma reference designs. |
| `mock/` | The original Figma/design references and a Sketch draft used to build the web app. |
| `METHODOLOGY.md` | The original thinking behind the PoC, flows, and known gaps. |

## Architecture

```text
Assistant (ChatGPT, Claude, or any MCP client)
        │
        │  MCP tools: search_market / fetch_listing / create_session
        ▼
   mcp/  (MCP server, :3005/mcp)
        │
        │  server-to-server, mcp-token header
        ▼
   api/  (NestJS, :3001) ──────────  PostgreSQL + ParadeDB (:5432)
        ▲
        │  /api/* proxy, httpOnly `sid` cookie
        │
   web/  (Next.js, :3000)
```

- The assistant talks to the MCP server, never directly to the API.
- The MCP server authenticates to the API with a shared token and an optional IP allowlist.
- The web app proxies `/api/*` through Next.js so the session cookie stays same-origin.
- Search runs in PostgreSQL via ParadeDB's `pg_search` BM25 indexes.

## Documentation

| Document | Contents |
| --- | --- |
| [FLOWS.md](FLOWS.md) | The full product flow: discovery, handoff, assessment, intake, clinical review, decision. |
| [DATA_MODEL.md](DATA_MODEL.md) | Tables, intake statuses, question types, listing documents, and search indexing. |
| [API.md](API.md) | Endpoint reference, access rules, authentication, and MCP tools. |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Local setup, environment variables, demo accounts, checks, and troubleshooting. |
| [METHODOLOGY.md](METHODOLOGY.md) | The original PoC thinking and known gaps. |

## Tech stack

| Layer | Stack |
| --- | --- |
| API | NestJS 12, TypeScript, Drizzle ORM, PostgreSQL via ParadeDB, Argon2, Winston, class-validator, envsafe |
| Search | ParadeDB `pg_search` with BM25, fuzzy matching, field boosts, and JSONB metadata filters |
| MCP | TypeScript, `@modelcontextprotocol/server`, Express transport, Zod, Axios |
| Web | Next.js 16.4 (App Router, Turbopack), React 19.3, Tailwind CSS 4, TypeScript |
| Tooling | pnpm, Docker Compose, Vitest, oxlint, ESLint |

## What is mocked or out of scope

- **Payment methods** are stored in browser local storage and never charged.
- **Listings** are seeded. There is no seller, admin, or CMS flow yet.
- **Assessment logic** is a fixed question set, not a decision tree.
- **Notifications** to WhatsApp/Telegram are not implemented.
- **Shipping, pharmacy fulfilment, and charging** do not exist.
- **Email verification, password reset, and account recovery** are not implemented.
- The platform is not production-compliant for real health data. Use fictional data only.
- **Improved search algorithm** using pgvector and reranking.

## Design references

The web app was built from Figma designs. The exported references live in [`mock/`](mock): home, join, assessment, and intake request screens.

## Credits

- Concept, API, and MCP server: hand-coded.
- Web app: built with a coding agent from the author's Figma designs.
- Inspired by the vision behind Bask.Health's acquisition of Telehealth.com.

---

**Healthlist is a proof of concept.** It explores how a marketplace can feel personal, how an assistant can act as the front door, and where the human clinician still belongs.
