---
description: "Use when working on registrations, campaign list/edit, or workflow actions. Enforces consistent handling for missing registration IDs and prevents generic Failed to fetch outcomes."
name: "Registration Not Found Handling"
applyTo:
  - "backend/src/modules/registrations/**"
  - "backend/src/db/**"
  - "frontend/src/screens/registrations/**"
  - "frontend/src/api/**"
---
# Registration Not Found Handling

When changing registration features, apply these rules:

- Treat missing registration IDs as a first-class case, not a generic server failure.
- Keep one consistent backend message for 404 cases: `Registration not found`.
- Return HTTP 404 for missing registration records in detail/read, update, and workflow-action routes.
- Validate route ID lookups before any workflow transition logic.

Frontend behavior rules:

- If a registration request returns 404, show a clear user message (`Registration not found`) instead of a generic `Failed to fetch`.
- After a 404 on edit or workflow action, refresh the campaigns list and clear stale selected action state for that row.
- Do not leave loading spinners active after 404 responses.

Mock/fallback rules in this repo:

- If registrations queries are added in routes, add matching query handlers in the mock database path used by development fallback.
- Ensure fallback behavior for both query-based and connect-based DB access patterns so missing Postgres does not crash the backend.

Quality checks before finishing registration changes:

- Verify `GET /registrations` returns data in dev fallback mode.
- Verify `GET /registrations/:id` returns 404 with `Registration not found` for missing IDs.
- Verify `POST /registrations/:id/workflow-action` returns 404 with `Registration not found` for missing IDs.
- Verify the registrations screen does not show `Failed to fetch` for expected 404 cases.
