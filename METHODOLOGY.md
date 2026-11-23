# Healthlist: A telehealth MCP (a PoC)

Healthlist helps patients/users browse the marketplace without discovery happens in the assistant, sensitive steps happen on a secure page.

The MCP exposes 3 tools:
- search: Takes in `query` and finds listings from brands that best match semantically. Uses RAG with versioned documents (eventually, add decision model for reranking).
- fetch: Takes in `listingId` and fetches data about just that listing, so the assistant can compare products.
- create_session: Creates a checkout session where the user:
    - Lands on the site, logs in if not already done (uses magic link login via betterauth).
    - Completes a preliminary assessment if not already done.
    - Fills in their shipping/delivery information.
    - If the particular listing being purchased requires some extra information, they are asked to provide it.
    - User subscribes to the product (no charge initially). And leaves, we'll notify them once approved via WhatsApp/Telegram.
    - A doctor approves them for purchase by that particular user, and they are notified that the product will be delivered to them in less than 7 days.

Assistant never handles the user's health data providing privacy.


## Flows
### Create Intake Session
1. User discusses with their agent "Find me products for weightloss on Healthlist"
2. Agent calls `search_market` tool and gets a list of top 5 product listings.
3. Agent informs the user of the product and asks if they want to add it to their Healthlist.
4. User gives go ahead and agent calls `create_intake_session` tool which returns a link.
5. User lands on the "Request Intake" page. 
    - User can view the details of the products.
    - If they are not signed in, a button prompts to sign in first before.
    - Once user is signed in, Healthlist checks if any product from Intake plan needs to collect any additional info to better inform the review process.
6. User fills in additional info.
7. If no saved payment info, user is prompted to add one. Then they submit for review.
8. An authorized doctor reviews the plan and the user's assessment result and uses it to APPROVE or REJECT the plan, providing feedback.
9. On approval, their saved payment method is charged and a pharmacy packs and ships the prescription.

### First Time Signup
1. User lands on homepage, and clicks "Continue"
2. User signs up with email and password only.
3. User takes their preliminary assessment test.
4. User clicks the "Connect my Assistant" to get instructions to connect their assistant to Healthlist.


## Known Gaps and Improvements
Details intentionally set aside as they are outside the scope of this PoC.

1. Email verification during sign-up.
2. Have a more robust assessment test flow that brings up questions dynamically based on the user's current answers. We could use a Decision tree to know which question to bring up next.


## Tech Stack
- NestJS
- DrizzleORM
- TypeScript
- PostgreSQL (via ParadeDB for BM25 support)
- NextJS
