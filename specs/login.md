# Feature Coverage Plan: Login

## Feature / Area

- name: Login
- scope: Customer authentication through login UI and login API token issuance
- source of truth:
  - UI route: `https://practicesoftwaretesting.com/auth/login`
  - API contract: `https://api.practicesoftwaretesting.com/docs?api-docs.json` (`POST /users/login`)
- in scope:
  - login page rendering and core controls
  - successful login flow using disposable credentials
  - invalid credential feedback behavior
  - token issuance contract for `POST /users/login`
  - token usability against authenticated endpoint (`GET /users/me`)
  - request/response schema checks for happy path
- out of scope:
  - social login (`Sign in with Google`)
  - forgot password feature implementation
  - logout and refresh token feature implementation
  - full account-area E2E journey implementation
  - brute-force/rate-limit security stress checks without explicit product contract

## Feature Targets

- UI/application target: `UI_BASE_URL` (route `/auth/login`)
- API/service target: `API_BASE_URL` (endpoints `POST /users/login`, `GET /users/me`, `POST /users/register` for setup)
- setup/cleanup target (only when needed): `API_BASE_URL` for creating disposable users
- external/partner target(s): Google auth provider (out of scope)

## Coverage Matrix

- behavior: Login page renders with required controls and auth links
  - risk: frontend interaction and missing controls
  - recommended level: UI
  - priority: smoke
  - reason: users must be able to input credentials and access auth-related navigation
  - duplicate coverage risk: low (API cannot prove UI control visibility)
  - notes: verify heading, email/password inputs, login button, register link, forgot-password link

- behavior: Valid credentials return token
  - risk: backend authentication contract
  - recommended level: API
  - priority: smoke
  - reason: API is the cheapest reliable layer for auth contract
  - duplicate coverage risk: low
  - notes: do not use Swagger sample credentials; use newly registered disposable user

- behavior: Issued token can access protected customer endpoint
  - risk: auth integration between login and protected API
  - recommended level: API
  - priority: smoke
  - reason: validates token usability, not only token shape
  - duplicate coverage risk: medium if repeated at many layers
  - notes: call `GET /users/me` with bearer token from login

- behavior: Invalid password is rejected
  - risk: backend negative auth behavior
  - recommended level: API
  - priority: regression
  - reason: auth rejection is backend behavior and should be validated directly
  - duplicate coverage risk: low
  - notes: live behavior expected as `401`; error-body schema is not clearly documented in OpenAPI for login

- behavior: Missing required login field is rejected
  - risk: backend boundary/validation behavior
  - recommended level: API
  - priority: regression
  - reason: required-field boundary belongs primarily to backend contract behavior
  - duplicate coverage risk: low
  - notes: validate deterministic rejection status from live endpoint and document contract drift if any

- behavior: Successful login transitions user out of login page and into authenticated UI state
  - risk: frontend/backend integration visible to user
  - recommended level: UI
  - priority: smoke
  - reason: API success does not prove browser-authenticated UX state
  - duplicate coverage risk: low
  - notes: precondition user created by API setup or reusable fixture

- behavior: Invalid credentials show user-visible feedback
  - risk: visible error handling UX
  - recommended level: UI
  - priority: regression
  - reason: error visibility and messaging are UI concerns
  - duplicate coverage risk: low
  - notes: assert visible error and ensure user remains unauthenticated

- behavior: Login contract shape remains stable
  - risk: schema/contract drift
  - recommended level: schema/contract
  - priority: regression
  - reason: schema assertions reduce weak manual checks
  - duplicate coverage risk: low
  - notes: strict negative error schema postponed until contract is explicit

- behavior: Login form visual layout remains stable
  - risk: visual regression
  - recommended level: visual checkpoint
  - priority: regression
  - reason: meaningful layout risk exists
  - duplicate coverage risk: low
  - notes: postpone because baseline approval was not requested

## Smoke / Regression Split

Smoke:

- UI: login page controls and auth links are visible
- UI: successful login using disposable user reaches authenticated UI marker
- API: `POST /users/login` successful auth token response
- API: login token works with `GET /users/me`

Regression:

- API: invalid password rejection
- API: missing required field rejection
- UI: invalid credentials visible feedback and unauthenticated state remains
- schema: login request and token response runtime validation
- visual: postponed checkpoints

## API Coverage

### Ready to implement now

- scenarios:
  - `POST /users/login` happy path (`200`)
  - `GET /users/me` succeeds with token from login (`200`)
  - `POST /users/login` invalid password rejection
  - `POST /users/login` missing required field rejection
- reason:
  - validates auth contract, token usability, and key negative behavior at the most reliable level
- dependencies:
  - disposable user strategy via `POST /users/register`
  - unique email generator or fixture-provided fresh credentials
- blockers:
  - none for listed scenarios
- implementation decisions:
  - direct request/response style first
  - optional thin API client only if endpoint reuse grows
  - feature-specific assertion helper plus shared Zod schema helper

### Blocked or postponed

- scenarios:
  - strict schema assertions for login error response bodies
  - lockout/rate-limit threshold behavior
- reason:
  - login negative response schema is not clearly specified in OpenAPI for this endpoint
  - lockout/throttling acceptance criteria are not explicitly documented for deterministic automation
- blocker or clarification needed:
  - explicit contract for negative login responses
  - explicit product/security requirements for lockout/throttling

## API Implementation Brief

- scenario: successful login token response
  - endpoint: `/users/login`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@smoke`, `@login`
  - payload source: deterministic payload with disposable user credentials
  - scenario data strategy:
    - create user in setup via `POST /users/register`
    - do not use Swagger example credentials (`customer@practicesoftwaretesting.com` / `welcome01`)
  - expected status: `200`
  - response assertions:
    - `access_token` is present and non-empty
    - `token_type` is present and non-empty
    - `expires_in` is numeric and positive
  - schema validation decision: planned now
  - negative coverage decision: separate dedicated scenarios
  - boundary coverage decision: required-field boundary covered in separate negative scenario
  - builder decision: optional unless payload reuse increases
  - API client decision: optional
  - assertion helper decision: yes (feature-specific helper calling shared Zod helper)
  - contract gaps/blockers: none for happy path

- scenario: token usability with protected endpoint
  - endpoint: `/users/me`
  - method: `GET`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@smoke`, `@login`
  - payload source: bearer token from prior successful login in same scenario
  - scenario data strategy: keep login+me in one test flow as behavior pair
  - expected status: `200`
  - response assertions:
    - user identity/email matches login setup user
  - schema validation decision: optional now (can reuse existing `UserResponse` schema)
  - negative coverage decision: n/a for this scenario
  - boundary coverage decision: n/a
  - builder decision: n/a
  - API client decision: optional
  - assertion helper decision: optional, lightweight
  - contract gaps/blockers: none

- scenario: invalid password rejection
  - endpoint: `/users/login`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@regression`, `@login`
  - payload source: disposable user email + wrong password
  - scenario data strategy: create disposable user first, then login with incorrect password
  - expected status: `401` (validate live behavior; document any drift)
  - response assertions:
    - response indicates auth failure
  - schema validation decision: postponed for strict error body schema
  - negative coverage decision: planned now
  - boundary coverage decision: n/a
  - builder decision: optional
  - API client decision: optional
  - assertion helper decision: minimal helper acceptable; avoid over-asserting undocumented fields
  - contract gaps/blockers: negative login response schema undocumented

- scenario: missing required login field rejection
  - endpoint: `/users/login`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@regression`, `@login`
  - payload source: partial payload missing `email` or `password`
  - scenario data strategy: table-driven missing-field variants
  - expected status: `401` (validate live behavior; document any drift)
  - response assertions:
    - response indicates invalid login request
  - schema validation decision: postponed for strict error body schema
  - negative coverage decision: planned now
  - boundary coverage decision: required fields boundary covered
  - builder decision: optional
  - API client decision: optional
  - assertion helper decision: minimal helper acceptable
  - contract gaps/blockers: negative login response schema undocumented

## UI Coverage

### Ready to implement now

- scenarios:
  - login page render and controls
  - successful login with disposable user precondition
  - invalid credential visible feedback
- reason:
  - each scenario covers unique user-facing behavior not provable by API alone
- dependencies:
  - `LoginPage` locators/actions
  - deterministic disposable-user setup (API precondition or reusable fixture)
- blockers:
  - none for listed scenarios
- implementation decisions:
  - keep locator mechanics in page object
  - keep assertions in spec
  - keep login action visible in test steps

### Blocked or postponed

- scenarios:
  - screenshot assertions for login visual states
- reason:
  - baseline approval mode was not requested
- blocker or clarification needed:
  - explicit visual baseline approval request

## UI Implementation Brief

- scenario: login page render
  - route/page: `/auth/login`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@smoke`, `@login`
  - preconditions: unauthenticated user
  - test data: none
  - scenario data strategy: deterministic static checks
  - user steps:
    - open login page
    - verify heading and fields
    - verify login submit and auth links
  - expected visible outcome: complete, interactive login form
  - unique UI risk: missing/broken controls
  - why API/schema is not sufficient: API cannot verify page structure and visible controls
  - recommended Page Object: `LoginPage`
  - Page Object actions/readers:
    - `open()`
    - `emailInput`, `passwordInput`, `loginButton`, `registerLink`, `forgotPasswordLink`
  - Component Object decision: not needed initially
  - locator discovery notes: use role/label/test-id locators only
  - assertions in spec: visibility and availability assertions
  - not covered in UI: token contract details

- scenario: successful login UX flow
  - route/page: `/auth/login`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): `API_BASE_URL` for user setup
  - env names (from project map): `UI_BASE_URL`, `API_BASE_URL`
  - tags: `@ui`, `@smoke`, `@login`
  - preconditions: disposable registered user
  - test data: unique email/password from setup
  - scenario data strategy:
    - preferred: register user through API precondition in the test
    - optional: reusable fixture providing fresh login user
  - user steps:
    - open login page
    - fill credentials
    - submit login
  - expected visible outcome: user transitions to authenticated state marker
  - unique UI risk: API auth success not reflected correctly in browser UX/session
  - why API/schema is not sufficient: only UI can prove real user-facing login transition
  - recommended Page Object: `LoginPage` (+ destination marker in owning page/header object if needed)
  - Page Object actions/readers:
    - `fillCredentials(email, password)`
    - `submit()`
    - reader for authenticated-state marker
  - Component Object decision: postpone unless auth header/menu becomes reused and complex
  - locator discovery notes: lock a stable authenticated marker before implementing assertions
  - assertions in spec:
    - no longer stuck on login form
    - authenticated marker visible
  - not covered in UI: backend auth error matrix

- scenario: invalid credentials feedback
  - route/page: `/auth/login`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): optional `API_BASE_URL` setup for wrong-password variant
  - env names (from project map): `UI_BASE_URL`, `API_BASE_URL`
  - tags: `@ui`, `@regression`, `@login`
  - preconditions: invalid credential input variant selected
  - test data:
    - non-existing email, or existing email + wrong password
  - scenario data strategy: table-driven invalid variants
  - user steps:
    - open login page
    - submit invalid credentials
  - expected visible outcome: login error is visible, user remains unauthenticated
  - unique UI risk: auth failure not clearly surfaced to end user
  - why API/schema is not sufficient: API cannot validate visual error feedback
  - recommended Page Object: `LoginPage`
  - Page Object actions/readers:
    - fill and submit
    - error alert/message locator
  - Component Object decision: not needed initially
  - locator discovery notes: assert stable visible error container/text
  - assertions in spec:
    - error visible
    - authenticated marker absent
  - not covered in UI: full backend negative-contract schema

## Cross-Browser Coverage

If not needed:

- reason no extra cross-browser coverage is required:
  - no documented browser-specific login defect/risk in current scope
  - default `ui-chromium` coverage is sufficient for initial implementation

## Responsive Coverage

If not needed:

- reason no extra responsive coverage is required:
  - no explicit viewport-specific requirement for login in this request
  - responsive expansion should be added only when a documented viewport risk exists

## E2E Note

Potential E2E journey candidate:
- registration-login-authenticated-access

Suggested journey plan path:
- `specs/e2e/registration-login-authenticated-access.md`

Reason:
- lower-level API/UI coverage does not fully prove end-to-end account lifecycle (register -> login -> authenticated area)

Important:
- do not implement E2E from this feature plan;
- create a separate E2E journey plan first.

## Visual Checkpoints

Planned now:

- none

Postponed:

- target UI state: default login form state
  - reason postponed: visual baseline approval was not requested
- target UI state: invalid-credentials error state
  - reason postponed: visual baseline approval was not requested
- target UI state: authenticated post-login state marker area
  - reason postponed: visual baseline approval was not requested

## Schema / Contract Checks

Planned now:

- checks:
  - login request shape validation (`email`, `password` required)
  - `200` token response shape validation (`access_token`, `token_type`, `expires_in`)
  - optional reuse of `UserResponse` for `/users/me` response checks
- reason:
  - contract-hardening for auth happy path and token usability validation
- dependencies:
  - Zod schemas under `src/test/schemas/api/`
  - shared schema assertion helper under `src/test/assertions/api/`

Postponed:

- checks:
  - strict schema validation for login negative responses
- reason postponed:
  - OpenAPI does not clearly define negative login response schema for this endpoint

## Not Automated / Blockers

- Google OAuth login flow is not automated (external dependency; out of feature scope)
- lockout/rate-limit stress scenarios are postponed (missing stable requirements)
- strict negative-login body schema checks are postponed (contract gap)

## Recommended Next Commands

- `/implement-api-batch` (ready login API coverage)
- `/implement-ui-batch` (ready login UI coverage)
- `/create-fixture` (optional if reusable disposable-login-user fixture is preferred across auth specs)
- `/plan-e2e-journey` (for `specs/e2e/registration-login-authenticated-access.md`)
