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
