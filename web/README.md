# Healthlist web

The patient-facing and doctor-facing prototype for Healthlist. Everything is
mocked in the browser — there are no API calls and no real accounts, payments,
or health records.

## Run it

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mock flow

1. **Landing** — `Continue` starts sign-in. `Connect to my assistant` opens the
   MCP setup modal with the connector URL.
2. **Sign in** — any email + password works. An unknown email creates a new
   account and sends the user to the assessment.
3. **Assessment** — five steps, saved to the mock store on completion.
4. **Dashboard** — greeting, intake requests, and payment methods.
5. **Intake request** — remove products, view a listing, or request a review.
   If a product needs extra information, the primary action becomes
   `Next: Provide additional info`.
6. **Doctor console** — `/doctor` shows every request, the patient's assessment,
   and approve/decline actions.

Useful demo inputs:

- Returning patient: `amara@example.com` (any password)
- New patient: any unused email
- Doctor console: [http://localhost:3000/doctor](http://localhost:3000/doctor)

Use the demo patient account to see seeded intake requests and payment methods.

## Mock data

Seed data lives in `lib/mock-data.ts`. State is kept in `localStorage` under
`healthlist.mock.v1` so the patient and doctor views stay in sync in the same
browser. Use `Reset demo data` in the dashboard or doctor console to restore the
seed.

Set `NEXT_PUBLIC_MCP_URL` to override the connector URL shown in the assistant
modal.
