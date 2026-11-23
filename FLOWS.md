# Healthlist flows

The end-to-end product flow, from the assistant's first search to a doctor's decision.

## 1. Discovery, in the assistant

The user asks their assistant for what they need. The assistant calls the Healthlist MCP server:

- `search_market` — free-text search plus optional price range and categories. Returns the top 10 listings ranked with BM25 field boosts.
- `fetch_listing` — full details for one listing, so the assistant can compare options.

The assistant is the discovery layer. It never receives the user's health data.

## 2. The handoff

When the user is ready, the assistant calls `create_session` with the chosen listing IDs. It returns a single link:

```text
https://healthlist.example/i/<key>
```

That link is the whole intake. It is a capability URL: anyone holding it can view the request, but any account or medical action requires signing in.

## 3. Sign in and assessment

- Existing users sign in; new users create an account with name, email, and password.
- New patients complete a preliminary assessment.
- The assessment is typed (`MULTI_SELECT`, `YES_NO`, `YES_NO_TEXT`, `TEXT_LIST`) and saved question by question.
- Deep links survive authentication: after signing in, and after the assessment, the user returns to the intake they came from.
- Doctor accounts skip the assessment and go straight to the clinician console.

## 4. Intake review

- The user sees the products their assistant selected.
- They can remove products before submitting.
- Some listings require extra information. Those questions come from the listing itself and are asked before the request is sent.
- Submitting claims the intake for the signed-in user and moves it from `PENDING` to `IN_REVIEW`.

## 5. Clinical review

Doctors get a queue of requests. Each request opens a dedicated review page:

- **Left:** every product, with the full listing available in a modal.
- **Right:** the patient's assessment answers, mapped back to readable option labels.
- **Decision:** approve or decline, with an optional note for the patient.

## 6. The decision

- The request moves to `APPROVED` or `REJECTED`.
- The patient sees the status and the doctor's note on `/i/<key>` and in their dashboard.
- Payment is mocked in this PoC. Nothing is charged, and there is no pharmacy or fulfilment integration yet.

## Status transitions

```text
PENDING ──submit──▶ IN_REVIEW ──approve──▶ APPROVED
                         └─────decline──▶ REJECTED
```

`PENDING` intakes are editable by their owner and viewable anonymously while unclaimed. Once submitted, only the owner and the reviewing doctor can open the full request.
