# Registration Feature Test Coverage Plan

## Feature / Area

- name: Registration (`/auth/register` UI + `POST /users/register` API)
- scope: planning only for UI and API strategy, with visual checkpoints inside UI flows only
- contract source: [Practice Software Testing Swagger UI](https://api.practicesoftwaretesting.com/api/documentation)
- contract JSON source used for planning: `https://api.practicesoftwaretesting.com/docs?api-docs.json`

## Coverage Matrix

| Behavior | Main risk | Recommended level | Priority | Reason | Duplicate coverage risk | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Registration page is reachable and key controls are visible (heading, required fields, submit) | Frontend interaction / broken entry flow | UI | smoke | Purely user-visible risk; cannot be proven at API layer | Low | Keep assertions structural only (visible controls and submit action availability) |
| Required field feedback appears when submitting empty form | Frontend validation UX | UI | regression | User must see actionable feedback; API alone cannot validate UX messaging | Medium | Do not duplicate all backend field validation rules here |
| Successful registration from UI redirects user to login page | User journey integration | UI | smoke | Verifies browser flow and frontend-backend wiring from user perspective | Medium | API separately covers backend success contract; UI should verify redirect and visible success outcome only |
| Duplicate email from UI shows conflict feedback and keeps user on registration page | Error handling UX | UI | regression | User-visible handling of server conflict is a UI concern | Medium | API will own status/body contract for `409`; UI checks only user feedback behavior |
| Default registration form visual layout remains stable | Visual layout regression | visual checkpoint | regression | Stable form layout is meaningful visual risk | Low | Add screenshot checkpoint inside UI page-load scenario (`@visual`), not a standalone visual spec |
| Validation error state layout remains stable after failed submit | Visual layout regression | visual checkpoint | regression | Error summary and field error placement are visual risks | Low | Add screenshot checkpoint inside required-field UI scenario |
| `POST /users/register` accepts contract-defined request and returns `201` | Backend contract / create flow | API | smoke | Lowest reliable level for registration create behavior | Low | Use `UserRequest` required fields: `first_name`, `last_name`, `email`, `password` |
| Request schema constraints are enforced (field lengths, email format, password min length) | Validation contract | schema | regression | Contract constraints belong to schema-first validation coverage | Low | Derive cases from `UserRequest` schema only; no guessed business rules |
| `201` payload matches `UserResponse` shape | Response contract drift | schema | smoke | Fast detection of backend contract regressions | Low | Validate documented fields/types, including nested `address` object shape |
| Duplicate registration returns documented `409` conflict contract | Backend error contract | API | regression | Conflict behavior is explicitly documented in Swagger responses | Low | Validate `DuplicateConflictResponse` oneOf shapes without assuming one specific branch |
| Documented `400` on invalid payload is returned | Error contract for malformed input | API | regression | Contract explicitly documents `400` for bad request | Low | Keep payload invalidity grounded in documented schema constraints |
| Documented `401` / `403` responses for register endpoint | Authorization / policy ambiguity | not automated | regression | Trigger conditions are not defined for unauthenticated register in contract text | None | Keep as open item until contract owners clarify when register should return `401` or `403` |

## Smoke vs Regression Split

### Smoke

- UI: page reachable + critical controls visible
- UI: successful registration redirects to login
- API: successful `POST /users/register` returns `201`
- Schema: `201` response conforms to `UserResponse`

### Regression

- UI: empty-submit validation feedback behavior
- UI: duplicate-email conflict feedback behavior
- Visual checkpoint: default form state
- Visual checkpoint: validation error state
- Schema: request constraints from `UserRequest` (`maxLength`, `format`, `minLength`)
- API: duplicate-email `409` response contract
- API: invalid payload `400`
- Not automated yet: `401` / `403` ambiguity on register endpoint

## First UI Batch

1. **Registration happy path (`@ui`, `@smoke`)**
   - Open `/auth/register`
   - Fill valid data
   - Submit
   - Verify redirect to `/auth/login`
   - Include visual checkpoint for default form before submit

2. **Empty-submit validation (`@ui`, `@regression`)**
   - Submit without filling required fields
   - Verify field-level feedback is shown
   - Include visual checkpoint for validation-error state

3. **Duplicate email handling (`@ui`, `@regression`)**
   - Reuse an already registered email
   - Submit registration
   - Verify user stays on registration page and sees conflict feedback

## First API Batch

1. **Create user success (`@api`, `@smoke`)**
   - `POST /users/register` with contract-valid required payload
   - Assert `201`

2. **`201` response schema contract (`@api`, `@smoke`)**
   - Validate response body against `UserResponse` schema

3. **Duplicate conflict contract (`@api`, `@regression`)**
   - Re-register same email
   - Assert `409`
   - Validate `DuplicateConflictResponse` oneOf schema

4. **Bad request contract (`@api`, `@regression`)**
   - Send payload that violates documented schema constraints
   - Assert `400`

5. **Request schema constraints (`@api`, `@regression`)**
   - Parameterized schema-focused checks for:
     - `first_name` max length
     - `last_name` max length
     - `email` format / max length
     - `password` min length

## Not Automated

- `401`/`403` for registration endpoint: documented but trigger rules are not explicit in the contract description; do not guess behavior until clarified.
