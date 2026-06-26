# Forgot Password Feature Test Coverage Plan

## Feature / Area

- name: Forgot password (`/auth/forgot-password` UI + `POST /users/forgot-password` API)
- scope: planning only for forgot-password request initiation coverage (no implementation)
- source of truth:
  - UI route: `https://practicesoftwaretesting.com/auth/forgot-password`
  - API contract: `https://api.practicesoftwaretesting.com/api/documentation#/User`
  - contract JSON used for planning: `https://api.practicesoftwaretesting.com/docs?api-docs.json`
- in scope:
  - forgot-password page availability and user-facing feedback
  - request submission behavior for valid/invalid email inputs
  - API success contract for forgot-password request endpoint
  - documented API negative statuses (`400`, `401`, `403`) as plan items
  - response schema validation for documented success shape
- out of scope:
  - reset-link email delivery pipeline and mailbox checks
  - password reset completion flow (token page/new password submit)
  - login, registration, profile, and change-password feature coverage
  - security penetration testing beyond documented API/UI behavior
- UI target: `https://practicesoftwaretesting.com/auth/forgot-password`
- API contract source: `https://api.practicesoftwaretesting.com/api/documentation#/User`
- requirements/specs: none provided beyond target links

## Coverage Matrix

| Behavior | Main risk | Recommended level | Priority | Reason | Duplicate coverage risk | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Forgot-password page is reachable and primary controls are visible | Frontend route/interaction | UI | smoke | User-facing entry flow cannot be proven by API checks | Low | Verify form heading, email input, submit control |
| Empty submit shows required email validation feedback | Frontend validation UX | UI | regression | User must get actionable client-side feedback | Medium | Keep assertion focused on visible feedback, not backend validation details |
| Invalid email format shows validation feedback (if implemented by UI) | Frontend validation UX | UI | regression | Browser-visible form validation behavior is unique UI risk | Medium | If UI does not validate format, scenario moves to blocked/contract-gap |
| Valid submit shows non-crashing confirmation state | User journey integration | UI | smoke | Verifies end-to-end browser interaction path | Medium | Assert stable post-submit state and user-visible result |
| UI feedback does not leak account-existence details | Security UX / anti-enumeration | UI | regression | Distinct user-facing risk if different messages reveal user presence | Medium | Compare visible feedback for existing vs non-existing email inputs |
| `POST /users/forgot-password` returns documented success contract | Backend contract | API | smoke | Lowest reliable level for endpoint contract | Low | OpenAPI lists `200` with `UpdateResponse` (`success: boolean`) |
| `POST /users/forgot-password` returns documented `400` for bad request | Backend validation contract | API | regression | Negative contract is documented and should be checked | Low | Response body schema for `400` is not documented; status-focused assertion |
| `POST /users/forgot-password` documented `401` and `403` behavior | Auth/authorization ambiguity | not automated | regression | Trigger conditions are undocumented for this endpoint | None | Keep blocked until contract clarifies when these statuses occur |
| Request payload boundary rules (`email` required/format/length) | Contract boundary clarity | schema/contract | regression | OpenAPI request schema only exposes `email: string` with no constraints | None | Boundary assertions blocked until constraints are documented |

## Smoke vs Regression Split

### Smoke

- UI: forgot-password page render and control visibility
- UI: valid submit reaches user-visible post-submit state
- API: `POST /users/forgot-password` success (`200`) and `UpdateResponse` schema

### Regression

- UI: empty-submit required feedback
- UI: invalid-email format feedback (if present)
- UI: anti-enumeration UX consistency (existing vs non-existing email)
- API: documented `400` bad-request status
- Schema/contract: payload boundary clarification item
- Not automated: `401`/`403` until trigger rules are clarified

## API Coverage

### Ready to implement now

- scenarios:
  - `POST /users/forgot-password` success response contract (`200`)
  - `POST /users/forgot-password` bad-request status contract (`400`)
- reason:
  - operation and statuses are documented in OpenAPI User section
- dependencies:
  - no auth precondition required by documented operation
  - use isolated emails to avoid mutating shared user credentials
- blockers:
  - none for status-level contract checks above
- implementation decisions:
  - use direct `request.post` first; no dedicated API client needed in first batch
  - add feature-specific response assertion helper and schema helper for `UpdateResponse`

### Blocked or postponed

- scenarios:
  - `401` unauthorized behavior validation
  - `403` forbidden behavior validation
  - request-boundary validation (required email, format constraints, max length)
  - side-effect verification that password actually becomes `welcome02`
- reason:
  - contract does not define trigger conditions for auth errors or payload boundaries
  - side-effect validation mutates credentials and needs isolated setup strategy
- blocker or clarification needed:
  - explicit contract documentation for `401`/`403` preconditions
  - explicit request field constraints (required/format/length)
  - approved strategy for safe side-effect verification and cleanup

## API Implementation Brief

### Scenario A: Forgot-password success contract

- endpoint: `/users/forgot-password`
- method: `POST`
- tags: `@api`, `@smoke`
- payload source: local scenario payload `{ email: <isolated email> }`
- scenario data strategy: prefer unique, non-shared email value per run
- expected status: `200`
- response assertions:
  - body matches `UpdateResponse` shape (`success` boolean)
  - no undocumented strict-field enforcement unless contract requires it
- schema validation decision: planned now (add response schema + feature assertion helper)
- negative coverage decision: handled in Scenarios B/C as separate contract checks
- boundary coverage decision: postponed until request constraints are documented
- builder decision: no dedicated builder required for first batch
- API client decision: direct request usage for initial coverage
- assertion helper decision: add `forgot-password-response` helper delegating to shared Zod helper
- contract gaps/blockers: none for this positive contract scenario

### Scenario B: Forgot-password bad request status contract

- endpoint: `/users/forgot-password`
- method: `POST`
- tags: `@api`, `@regression`
- payload source: malformed payload case(s) in spec-local dataset
- scenario data strategy: parameterized malformed inputs that are clearly invalid JSON shape
- expected status: `400`
- response assertions:
  - status assertion only unless `400` body schema becomes documented
- schema validation decision: postponed for `400` body (missing schema)
- negative coverage decision: planned now for status-level contract
- boundary coverage decision: postponed (missing request constraints)
- builder decision: not needed
- API client decision: direct request usage
- assertion helper decision: optional lightweight status helper only if reused
- contract gaps/blockers: unclear which exact malformed payloads are guaranteed to map to `400`

### Scenario C: Auth/forbidden and side-effect behavior

- endpoint: `/users/forgot-password`
- method: `POST`
- tags: `@api`, `@regression`
- payload source: blocked until contract clarifies prerequisites
- scenario data strategy: n/a (blocked)
- expected status: documented `401`/`403` but trigger conditions unknown
- response assertions: postponed
- schema validation decision: postponed
- negative coverage decision: blocked
- boundary coverage decision: blocked
- builder decision: n/a
- API client decision: n/a
- assertion helper decision: n/a
- contract gaps/blockers:
  - auth requirements for this endpoint are unclear
  - endpoint description indicates password mutation; safe verification strategy required

## UI Coverage

### Ready to implement now

- scenarios:
  - page render and control visibility
  - empty-submit validation feedback
  - valid-email submit user-visible result
- reason:
  - all are direct user-facing risks on the forgot-password page
- dependencies:
  - route availability at `/auth/forgot-password`
  - stable page-level locators for email input, submit, and feedback area
- blockers:
  - none for baseline UI behavior checks
- implementation decisions:
  - use dedicated `ForgotPasswordPage` Page Object
  - keep assertions in spec; Page Object exposes locators/actions/readers only

### Blocked or postponed

- scenarios:
  - anti-enumeration UI consistency (existing vs non-existing emails)
  - invalid-email format feedback (if no deterministic frontend validation exists)
- reason:
  - requires confirmed feedback contract and deterministic existing-user precondition
- blocker or clarification needed:
  - expected message behavior for unknown vs known email
  - confirmation whether format validation is frontend-driven or backend-driven in this UI

## UI Implementation Brief

### Scenario 1: Forgot-password page render

- route/page: `/auth/forgot-password`
- tags: `@ui`, `@smoke`
- preconditions: none
- test data: none
- scenario data strategy: n/a
- user steps:
  - open forgot-password route
  - wait for page-ready marker
  - verify visible form controls
- expected visible outcome:
  - email input and submit action are visible and enabled
- unique UI risk:
  - broken route or missing controls blocks account recovery entry point
- why API/schema is not sufficient:
  - API does not validate route render and browser form readiness
- recommended Page Object: `ForgotPasswordPage`
- Page Object actions/readers: `open()`, `emailInput`, `submitButton`, `feedbackMessage`, `submit(email)`
- Component Object decision: not needed initially
- locator discovery notes: prefer semantic locators or project test IDs
- assertions in spec: route + control visibility and enabled state
- not covered in UI: exact API response payload contract

### Scenario 2: Empty submit validation feedback

- route/page: `/auth/forgot-password`
- tags: `@ui`, `@regression`
- preconditions: none
- test data: none
- scenario data strategy: n/a
- user steps:
  - open page
  - submit without entering email
- expected visible outcome:
  - email-required feedback is visible and actionable
- unique UI risk:
  - missing validation causes poor UX and hidden form errors
- why API/schema is not sufficient:
  - backend contract cannot verify browser-visible validation messaging
- recommended Page Object: `ForgotPasswordPage`
- Page Object actions/readers: `submitEmpty()`, `requiredEmailMessage`
- Component Object decision: not needed
- locator discovery notes: prefer stable form validation locators
- assertions in spec: required feedback visibility, route unchanged
- not covered in UI: backend status/body contract details

### Scenario 3: Valid submit feedback state

- route/page: `/auth/forgot-password`
- tags: `@ui`, `@smoke`
- preconditions: none
- test data: valid-format email string
- scenario data strategy: use isolated synthetic email value
- user steps:
  - open page
  - enter valid email
  - submit form
- expected visible outcome:
  - user sees stable post-submit confirmation state
- unique UI risk:
  - frontend/backend wiring may fail even when API endpoint is healthy
- why API/schema is not sufficient:
  - API cannot verify what users actually see after submit
- recommended Page Object: `ForgotPasswordPage`
- Page Object actions/readers: `fillEmail()`, `submit()`, `feedbackMessage`
- Component Object decision: not needed
- locator discovery notes: assert feedback region by role/test-id if available
- assertions in spec: confirmation visibility and no unexpected navigation crash
- not covered in UI: response schema fields and status-code matrix

## Visual Checkpoints

### Planned now

- none (baseline approval was not requested)

### Postponed

- target UI state: default forgot-password form state
  - screenshot scope: forgot-password form container
  - reason postponed: baseline creation/update was not explicitly requested

- target UI state: post-submit confirmation state
  - screenshot scope: form + feedback region only
  - reason postponed: establish functional stability before visual baselines

## Schema / Contract Checks

### Planned now

- checks:
  - `200` response body matches `UpdateResponse` shape (`success: boolean`)
- reason:
  - contract-critical and reusable with low maintenance cost
- dependencies:
  - add `forgot-password` response schema in `src/test/schemas/api/`
  - add feature assertion helper in `src/test/assertions/api/`

### Postponed

- checks:
  - request schema constraints for `email` (required/format/length)
  - `400` body schema validation
- reason postponed:
  - OpenAPI operation currently lacks explicit request constraints and `400` response schema

## Not Automated / Blockers

- `401` and `403` scenarios are blocked by missing trigger-condition contract details.
- End-to-end mailbox delivery and reset-link verification are out of scope for this feature plan.
- Direct verification that the endpoint resets password to `welcome02` is postponed due destructive side effects without an approved isolation/cleanup strategy.

## Recommended Next Commands

- `/implement-api-feature` (scope: forgot-password API ready-now items only)
- `/implement-ui-feature` (scope: forgot-password UI ready-now items only)
- `/review-generated` (review implementation PRs against this plan)
- `/implement-visual-test` (only after explicit baseline approval request)
