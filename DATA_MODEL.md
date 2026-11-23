# Healthlist data model

PostgreSQL, accessed through Drizzle ORM. The database image is ParadeDB so search can use `pg_search` BM25 indexes alongside regular relational queries.

## Tables

| Table | Purpose |
| --- | --- |
| `users` | Patients and doctors, with a `role` enum (`PATIENT`, `DOCTOR`). |
| `auth_sessions` | One active session per user, referenced by the httpOnly `sid` cookie. |
| `assessments` | One assessment per user. |
| `assessment_questions` | Typed questions with options, required flags, and an `is_preliminary` flag. |
| `assessment_answers` | Typed answers linked to an assessment and a question. |
| `listings` | Product shell: brand, reviews, image, and the keys of any extra questions it needs. |
| `listing_documents` | Versioned listing content: name, excerpt, body, metadata (price/category), search tags. Exactly one active version per listing. |
| `intakes` | A request for review: random key, owner, status, doctor remark, timestamps. |
| `intake_listings` | The products attached to an intake. |

## Intake statuses

| Status | Meaning |
| --- | --- |
| `PENDING` | Created by the assistant, not submitted yet. May be unclaimed (`user_id` null). |
| `IN_REVIEW` | Submitted by the patient and waiting for a doctor. |
| `APPROVED` | A doctor approved the request. |
| `REJECTED` | A doctor declined the request. |

## Assessment questions

Questions carry a `type` that drives the UI and the stored answer shape:

| Type | Stored as |
| --- | --- |
| `MULTI_SELECT` | Array of option keys |
| `YES_NO` | Boolean |
| `YES_NO_TEXT` | String (empty string means “No”) |
| `TEXT_LIST` | Array of strings |

`is_preliminary` separates the general health assessment from listing-specific questions. `listings.additional_questions` holds the keys of the extra questions a product needs; those are asked on the intake page before submission.

## Listing documents and search

Listings are split into a stable shell (`listings`) and versioned content (`listing_documents`). Only one document per listing is active, enforced by a partial unique index. This lets product copy change without changing intake history.

Search uses ParadeDB's BM25 operators over active documents:

- Name: fuzzy match, boosted 3×
- Search tags: fuzzy match, boosted 1.5×
- Excerpt: boosted 1.25×
- Body: unboosted
- Optional filters: minimum price, maximum price, categories (JSONB containment)

The `vector` extension is enabled in the database for future semantic retrieval, but the current search is lexical/BM25 only.
