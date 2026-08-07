# Feature Coverage Plan: Registration

## Feature / Area

- name: Registration
- scope: Customer self-registration on the register page with backend user creation
- source of truth:
  - UI route: `https://practicesoftwaretesting.com/auth/register`
  - API contract: `https://api.practicesoftwaretesting.com/docs?api-docs.json`
- in scope:
  - registration form rendering and required controls
  - field-level validation and visible error feedback
  - password policy validation
  - postcode autofill integration behavior
  - successful user creation via `POST /users/register`
  - duplicate email conflict behavior (`409`)
  - request/response contract checks for registration endpoint
- out of scope:
  - login flow implementation
  - forgot-password and password reset flows
  - authenticated profile behavior after login
  - admin-side user management endpoints

## Feature Targets

- UI/application target: `UI_BASE_URL` (route `/auth/register`)
- API/service target: `API_BASE_URL` (endpoint `POST /users/register`)
- setup/cleanup target (only when needed): `API_BASE_URL` for duplicate-email precondition setup
- external/partner target(s): none

## Coverage Matrix

- behavior: Register page loads with complete registration form
  - risk: frontend interaction and missing critical controls
  - recommended level: UI
  - priority: smoke
  - reason: user must be able to enter all required fields and submit
  - duplicate coverage risk: low (API cannot verify visible form completeness)
  - notes: verify key controls by role/label and submit CTA visibility

- behavior: Empty submit shows required validation messages
  - risk: visible validation feedback
  - recommended level: UI
  - priority: regression
  - reason: API validates backend state, but user-facing error visibility is a UI risk
  - duplicate coverage risk: low if assertions focus on UI messages
  - notes: validate required errors for first/last name, dob, country, postal code, house number, street, city, state, phone, email, password

- behavior: Date input rejects invalid format and missing value
  - risk: frontend validation plus data quality
  - recommended level: UI
  - priority: regression
  - reason: format feedback (`YYYY-MM-DD`) is user-facing
  - duplicate coverage risk: medium if only backend status is asserted
  - notes: keep UI assertion focused on visible message text/state

- behavior: Password policy is enforced before submit
  - risk: frontend validation and weak credentials acceptance
  - recommended level: UI
  - priority: regression
  - reason: policy hint and client feedback are visible behavior
  - duplicate coverage risk: medium; backend policy also needs API validation
  - notes: assert visible password guidance and validation feedback

- behavior: Country + postcode + house number autofill fills street/city/state
  - risk: frontend/backend integration visible to user
  - recommended level: UI
  - priority: regression
  - reason: this is browser-visible integration, not pure backend contract
  - duplicate coverage risk: low
  - notes: assert populated address fields after entering country/postcode/house number

- behavior: Register valid customer payload
  - risk: backend contract and persistence
  - recommended level: API
  - priority: smoke
  - reason: fastest reliable proof of user creation contract (`201` + response shape)
  - duplicate coverage risk: low
  - notes: use unique email data per run

- behavior: Duplicate email returns conflict
  - risk: backend uniqueness and conflict handling
  - recommended level: API
  - priority: regression
  - reason: uniqueness is backend rule and must not be validated only through UI
  - duplicate coverage risk: low
  - notes: validate `409` and oneOf conflict body shape

- behavior: Invalid registration payload is rejected
  - risk: backend validation and boundary enforcement
  - recommended level: API
  - priority: regression
  - reason: contract-level validation is best proven at API level
  - duplicate coverage risk: low
  - notes: cover missing required fields and weak/invalid password cases

- behavior: Request and response schema consistency for registration
  - risk: contract drift and false positives from weak assertions
  - recommended level: schema/contract
  - priority: regression
  - reason: typed runtime schema validation prevents incomplete assertions
  - duplicate coverage risk: low
  - notes: validate `UserResponse` and conflict payload schema variants

- behavior: Visual consistency of registration form states
  - risk: layout regressions
  - recommended level: visual checkpoint
  - priority: regression
  - reason: appearance risk exists but baseline approval was not requested
  - duplicate coverage risk: low
  - notes: postpone until explicit baseline approval

## Smoke / Regression Split

Smoke:

- API: `POST /users/register` valid payload returns `201` and valid `UserResponse`
- UI: register page renders and can be submitted with valid data path entry points present

Regression:

- API: duplicate email conflict (`409`)
- API: invalid payload validation (`400`)
- UI: empty submit required errors
- UI: DOB format validation message
- UI: password validation feedback
- UI: postcode autofill integration
- schema: runtime validation of success and conflict bodies
- visual: postponed checkpoints

## API Coverage

### Ready to implement now

- scenarios:
  - `POST /users/register` happy path (`201`)
  - `POST /users/register` duplicate email (`409`)
  - `POST /users/register` missing required fields (`400|422`, contract drift)
  - `POST /users/register` invalid password boundary (`400|422`, contract drift)
- reason:
  - directly verifies backend contract, validation, and uniqueness
- dependencies:
  - unique email generator strategy
  - deterministic payload strategy (valid-by-default plus overrides)
- blockers:
  - none for listed scenarios
- implementation decisions:
  - use direct request/response API tests
  - add feature-specific response assertion helper(s)
  - add Zod schemas for `UserResponse` and `DuplicateConflictResponse` oneOf body

### Blocked or postponed

- scenarios:
  - `401` and `403` response paths for `POST /users/register`
- reason:
  - endpoint is public registration; authorization-specific paths are not a feature-value priority and are unclear for deterministic triggering
- blocker or clarification needed:
  - explicit product/security requirement defining expected `401/403` registration behavior

## API Implementation Brief

- scenario: successful registration
  - endpoint: `/users/register`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name: `API_BASE_URL`
  - tags: `@api`, `@smoke`, `@register`
  - payload source: local deterministic object or builder (valid by default)
  - scenario data strategy: unique disposable email per run
  - expected status: `201`
  - response assertions:
    - contains created user fields (`id`, `email`, `first_name`, `last_name`, address object, flags)
    - excludes password in response
  - schema validation decision: planned now (`UserResponse`)
  - negative coverage decision: separate scenarios
  - boundary coverage decision: password and required field checks handled in dedicated negative cases
  - builder decision: optional now, create only if payload reuse appears
  - API client decision: optional now, direct request in spec is sufficient initially
  - assertion helper decision: yes, feature-specific response helper delegating to shared Zod assertion helper
  - contract gaps/blockers: none

- scenario: duplicate email conflict
  - endpoint: `/users/register`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name: `API_BASE_URL`
  - tags: `@api`, `@regression`, `@register`
  - payload source: same valid payload reused with same email twice
  - scenario data strategy: create first user, then submit duplicate
  - expected status: `409`
  - response assertions:
    - body matches conflict oneOf (`{ message: string }` or field-level MessageBag)
  - schema validation decision: planned now (`DuplicateConflictResponse`)
  - negative coverage decision: planned now
  - boundary coverage decision: n/a
  - builder decision: optional
  - API client decision: optional
  - assertion helper decision: yes, conflict response helper
  - contract gaps/blockers: conflict field name is example-based; assert generic oneOf contract, not specific key names

- scenario: invalid payload rejection
  - endpoint: `/users/register`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name: `API_BASE_URL`
  - tags: `@api`, `@regression`, `@register`
  - payload source: valid payload with targeted invalid overrides
  - scenario data strategy: table-driven invalid cases
  - expected status: `400` by OpenAPI, `422` observed in live API (temporary `400|422` acceptance)
  - response assertions:
    - status only when response body contract is undocumented
    - add body assertions only where contract evidence exists
  - schema validation decision: postponed for validation-error body until explicit contract shape is documented
  - negative coverage decision: planned now
  - boundary coverage decision:
    - password min length (`>= 8` per API schema)
    - required fields (`first_name`, `last_name`, `email`, `password`)
  - builder decision: optional unless invalid-case matrix grows
  - API client decision: optional
  - assertion helper decision: minimal; avoid inventing undocumented error body schema
  - contract gaps/blockers:
    - validation-error payload shape is not specified
    - OpenAPI documents `400`, while live API currently returns `422` for validation failures

## UI Coverage

### Ready to implement now

- scenarios:
  - render registration page with all required controls
  - valid registration submit redirects user to login page
  - empty submit shows required field errors
  - invalid DOB format message is shown
  - password policy feedback and invalid-password error state
  - postcode lookup populates street/city/state after country + postal code + house number
  - duplicate email submit shows visible conflict feedback
- reason:
  - all are user-facing behaviors not sufficiently proven by API-only tests
- dependencies:
  - deterministic UI data generation for unique emails
  - stable locators for form controls and error messages
- blockers:
  - none for listed scenarios
- implementation decisions:
  - keep selector mechanics in Page Object
  - assertions remain in UI specs
  - avoid hidden setup flows in fixtures/hooks

### Blocked or postponed

- scenarios:
  - successful submit final marker visual verification snapshot
- reason:
  - visual baseline approval not requested yet
- blocker or clarification needed:
  - explicit baseline approval before screenshot assertion is added/approved

## UI Implementation Brief

- scenario: page render and controls
  - route/page: `/auth/register`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target: none
  - env names: `UI_BASE_URL`
  - tags: `@ui`, `@smoke`, `@register`
  - preconditions: guest (logged-out) state
  - test data: none
  - scenario data strategy: deterministic
  - user steps:
    - open register route
    - verify heading and required form controls are visible
  - expected visible outcome: form is interactive with register CTA visible
  - unique UI risk: missing or broken controls block registration journey
  - why API/schema is not sufficient: API cannot validate browser form rendering
  - recommended Page Object: `RegisterPage` (project layer)
  - Page Object actions/readers:
    - `open()`
    - form field locators/readers
    - `submit()`
  - Component Object decision: no separate component by default (single focused form)
  - locator discovery notes: prefer role/label/test-id locators
  - assertions in spec: visible heading, fields, and submit button
  - not covered in UI: backend contract details and response schema

- scenario: empty submit validation
  - route/page: `/auth/register`
  - UI/application Feature Target: `UI_BASE_URL`
  - env names: `UI_BASE_URL`
  - tags: `@ui`, `@regression`, `@register`
  - preconditions: guest state
  - test data: none
  - scenario data strategy: deterministic
  - user steps:
    - open page
    - click Register without entering data
  - expected visible outcome: required-field errors are shown for mandatory inputs
  - unique UI risk: users do not get actionable feedback
  - why API/schema is not sufficient: message visibility and placement are UI-specific
  - recommended Page Object: `RegisterPage`
  - Page Object actions/readers:
    - `submit()`
    - error locator readers by field
  - Component Object decision: not needed initially
  - locator discovery notes: assert specific visible error text/state
  - assertions in spec: required errors displayed
  - not covered in UI: backend validation contract internals

- scenario: postcode autofill integration
  - route/page: `/auth/register`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target: `API_BASE_URL` indirectly via app integration
  - env names: `UI_BASE_URL`, `API_BASE_URL`
  - tags: `@ui`, `@regression`, `@register`
  - preconditions: guest state
  - test data: known valid country/postcode/house number combination
  - scenario data strategy: deterministic values maintained in spec-local constants or dataset
  - user steps:
    - select country
    - enter postcode and house number
    - verify street/city/state are populated
  - expected visible outcome: address fields are auto-filled
  - unique UI risk: backend integration must update visible form fields
  - why API/schema is not sufficient: integration result is visible in browser form state
  - recommended Page Object: `RegisterPage`
  - Page Object actions/readers:
    - select country
    - fill postcode/house number
    - read street/city/state values
  - Component Object decision: not needed initially
  - locator discovery notes: wait via web-first assertions for populated values, no fixed timeout
  - assertions in spec: populated non-empty address fields
  - not covered in UI: postcode API full contract matrix

- scenario: duplicate email UI feedback
  - route/page: `/auth/register`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target: `API_BASE_URL` (create pre-existing user via API precondition)
  - env names: `UI_BASE_URL`, `API_BASE_URL`
  - tags: `@ui`, `@regression`, `@register`
  - preconditions: existing user with target email
  - test data: deterministic duplicate email value
  - scenario data strategy: create disposable user via API setup, then submit same email in UI
  - user steps:
    - open register page
    - fill valid data using duplicate email
    - submit form
  - expected visible outcome: conflict/duplicate feedback shown to user
  - unique UI risk: backend conflict must be translated into understandable UI feedback
  - why API/schema is not sufficient: API can prove conflict, but not user-facing error rendering
  - recommended Page Object: `RegisterPage`
  - Page Object actions/readers:
    - fill registration form
    - submit
    - read global/field conflict feedback
  - Component Object decision: not needed initially
  - locator discovery notes: lock final visible error marker during implementation discovery
  - assertions in spec: duplicate error visible and submit not treated as success
  - not covered in UI: API conflict schema variants

## Cross-Browser Coverage

If not needed:

- reason no extra cross-browser coverage is required:
  - no documented browser-engine-specific risk for this feature yet
  - default `ui-chromium` coverage is sufficient for first implementation batch

## Responsive Coverage

If not needed:

- reason no extra responsive coverage is required:
  - no explicit viewport-specific requirement or known responsive defect in scope
  - prioritize functional registration behavior first

## E2E Note

Potential E2E journey candidate:

- registration-to-login

Suggested journey plan path:

- `specs/e2e/registration-to-login.md`

Reason:

- only a full journey can prove end-to-end user lifecycle: register new account, authenticate, and reach authenticated area

Important:

- do not implement E2E from this feature plan
- create a separate E2E journey plan first

## Visual Checkpoints

Planned now:

- none

Postponed:

- target UI state: default registration form layout
  - reason postponed: baseline approval not requested
- target UI state: empty-submit validation layout
  - reason postponed: baseline approval not requested
- target UI state: duplicate-email error state
  - reason postponed: baseline approval not requested

## Schema / Contract Checks

Planned now:

- checks:
  - validate `201` body against `UserResponse` runtime schema
  - validate `409` body against oneOf conflict schema (`message` object or field-message bag)
  - validate request object shape used in tests matches `UserRequest` required/typed fields
- reason:
  - prevents drift and weak/manual response assertions
- dependencies:
  - Zod schema modules and shared schema assertion helper

Postponed:

- checks:
  - strict schema validation for `400` error payload body
- reason postponed:
  - `400` response body contract is not specified in API doc

## Not Automated / Blockers

- `POST /users/register` `401/403` paths are not automated now (low feature value and unclear deterministic trigger for this scope)
- exhaustive country-value matrix is not automated (high cost, low incremental risk)
- exhaustive postcode datasets by locale are not automated (covered by one representative integration case)

## Ready Scenario Traceability

UI (ready now):

- render registration page with all required controls
  - implemented test: `tests/ui/register.ui.spec.ts` -> "shows registration form controls"
  - status: implemented
- valid registration submit redirects user to login page
  - implemented test: `tests/ui/register.ui.spec.ts` -> "submits valid registration form and opens login page"
  - status: implemented
- empty submit shows required field errors
  - implemented test: `tests/ui/register.ui.spec.ts` -> "shows required field validation on empty submit"
  - status: implemented
- invalid DOB format message is shown
  - implemented test: `tests/ui/register.ui.spec.ts` -> "shows date format validation for invalid date of birth"
  - status: implemented
- password policy feedback and invalid-password error state
  - implemented test: `tests/ui/register.ui.spec.ts` -> "shows password policy guidance and invalid password state"
  - status: implemented
- postcode lookup populates street/city/state after country + postal code + house number
  - implemented test: `tests/ui/register.ui.spec.ts` -> "autofills address fields from postcode lookup"
  - status: implemented
- duplicate email submit shows visible conflict feedback
  - implemented test: `tests/ui/register.ui.spec.ts` -> "shows duplicate email conflict feedback"
  - status: implemented

API (ready now):

- `POST /users/register` happy path (`201`)
  - implemented test: `tests/api/register.api.spec.ts` -> "creates a user with valid payload"
  - status: implemented
- `POST /users/register` duplicate email (`409`)
  - implemented test: `tests/api/register.api.spec.ts` -> "returns 409 for duplicate email registration"
  - status: implemented
- `POST /users/register` missing required fields (`400|422`)
  - implemented test: `tests/api/register.api.spec.ts` -> "returns 400 or 422 for missing required fields"
  - status: implemented
- `POST /users/register` invalid password boundary (`400|422`)
  - implemented test: `tests/api/register.api.spec.ts` -> "returns 400 or 422 for invalid password boundary"
  - status: implemented

Schema / contract (ready now):

- validate `201` body against `UserResponse` runtime schema
  - implemented in: `tests/api/register.api.spec.ts` via `expectRegisterUserResponse`
  - status: implemented
- validate `409` body against oneOf conflict schema
  - implemented in: `tests/api/register.api.spec.ts` via `expectRegisterDuplicateConflictResponse`
  - status: implemented
- validate request object shape used in tests matches `UserRequest`
  - implemented in: `tests/api/register.api.spec.ts` via `expectRegisterUserRequestPayload`
  - status: implemented

## Recommended Next Commands

- `/implement-api-batch` (implement all ready API coverage from this plan)
- `/implement-ui-batch` (implement all ready UI coverage from this plan)
- `/plan-e2e-journey` (for `specs/e2e/registration-to-login.md`)
- `/implement-visual-checkpoint` (only after explicit baseline approval)
