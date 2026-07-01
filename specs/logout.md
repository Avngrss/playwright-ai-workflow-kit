# Logout Feature Test Coverage Plan

## Feature / Area

- name: Logout (authenticated UI navigation + `GET /users/logout` API)
- scope: planning and implementation guidance for UI/API logout coverage only
- source of truth:
  - UI: [Practice Software Testing storefront](https://practicesoftwaretesting.com/)
  - API: [Practice Software Testing Swagger UI](https://api.practicesoftwaretesting.com/api/documentation#/User)
  - contract JSON: `https://api.practicesoftwaretesting.com/docs?api-docs.json`
- in scope:
  - authenticated user signs out through UI navigation;
  - guest navigation markers after logout;
  - protected account route no longer accessible after logout in browser;
  - `GET /users/logout` success contract with valid bearer token;
  - token invalidation after logout (`GET /users/me` returns unauthorized);
  - unauthorized logout requests without or with invalid token
- out of scope:
  - login, registration, forgot-password feature coverage (covered in other feature plans);
  - token refresh (`GET /users/refresh`);
  - password change or profile update flows;
  - security penetration scenarios (session hijacking, CSRF, multi-tab sync);
  - visual baseline approval unless explicitly requested later;
  - E2E journey implementation in this feature plan
- UI target: authenticated areas reachable from storefront (`/account` and global navigation)
- API contract source: `GET /users/logout` under User tag in OpenAPI
- requirements/specs: none beyond OpenAPI and observed storefront behavior

## Coverage Matrix

| Behavior | Main risk | Recommended level | Priority | Reason | Duplicate coverage risk | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Authenticated navigation exposes sign-out control | Frontend interaction / auth nav regression | UI | smoke | User must see logout entry point when signed in | Low | Prefer `data-test="nav-sign-out"`; confirm whether menu expansion is required during discovery |
| User signs out and guest navigation markers return | User-facing session termination | UI | smoke | Browser-visible auth state change cannot be proven by API alone | Medium | Assert `nav-sign-in` visible; authenticated markers such as `nav-my-account` / sign-out hidden |
| Protected account route is no longer accessible after logout | Authorization UX / frontend route guard | UI | regression | Distinct from API token invalidation; verifies browser route protection | Medium | Open `/account` after logout; expect login route or login prompt |
| `GET /users/logout` returns documented success payload for valid bearer token | Backend auth contract | API | smoke | Lowest reliable level for logout endpoint contract | Low | Assert `200` and `message: "Successfully logged out"` |
| Token is rejected by `GET /users/me` after logout | Auth integration / token invalidation | API | smoke | Proves logout invalidates token operationally, not only message text | Low | Reuse login token, call logout, then `/users/me` with same token |
| `GET /users/logout` without bearer token returns unauthorized | Authorization contract | API | regression | Documented `401` response | Low | Reuse existing unauthorized response assertion helper |
| `GET /users/logout` with invalid bearer token returns unauthorized | Authorization contract | API | regression | Documented `401` response | Low | Same helper as other auth-negative API tests |
| `LogoutResponse` shape for `200` payload | Response contract drift | schema/contract | smoke | Fast contract guard for logout response | Low | Schema: `{ message: string }` |
| `400 Bad Request` on logout | Contract ambiguity | not automated | regression | OpenAPI documents `400` but trigger conditions are not defined | None | Do not guess malformed-request behavior |
| Logout control layout/state visual regression | Visual layout | visual checkpoint | regression | Not required for first functional batch | Low | Postpone until baseline approval is requested |
| Full login-to-logout lifecycle as one journey | Critical auth lifecycle | not automated in feature plan | regression | Better handled as separate E2E journey plan if needed | None | See E2E Note |

## Smoke / Regression Split

### Smoke

- UI: authenticated user can sign out and guest navigation returns
- API: successful `GET /users/logout` contract
- API: token invalidation on `GET /users/me` after logout
- Schema/contract: `LogoutResponse` shape for `200`

### Regression

- UI: protected `/account` route is no longer accessible after logout
- API: unauthorized logout without token
- API: unauthorized logout with invalid token
- Not automated: logout `400` until contract clarifies trigger conditions
- Visual checkpoints: postponed

## API Coverage

### Ready to implement now

- scenarios:
  1. `GET /users/logout` with valid bearer token returns `200` and success message
  2. same token returns `401` from `GET /users/me` after logout
  3. `GET /users/logout` without token returns `401`
  4. `GET /users/logout` with invalid token returns `401`
  5. `200` response conforms to `LogoutResponse` schema
- reason: endpoint, success payload, and primary negative auth responses are documented in OpenAPI; setup can reuse existing registration/login patterns
- dependencies:
  - `registrationUserRequestBuilder`
  - existing login token assertion helper
  - existing unauthorized response assertion helper
- blockers: none for listed scenarios
- implementation decisions:
  - no dedicated logout API client for first batch; direct `request.get` is sufficient
  - add reusable logout response schema/assertion helper only if schema validation is non-trivial
  - setup flow per test: register user -> login -> obtain token -> logout action under test

### Blocked or postponed

- scenarios:
  - logout `400 Bad Request` negative case
- reason: OpenAPI lists `400` but does not define request conditions or response body for logout
- blocker or clarification needed: documented trigger for `400` on `GET /users/logout`

## API Implementation Brief

### Scenario A: Logout success contract

- endpoint: `/users/logout`
- method: `GET`
- tags: `@api`, `@smoke`, `@auth`, `@logout`
- payload source: none
- scenario data strategy:
  - register disposable user via `registrationUserRequestBuilder`
  - login via `POST /users/login`
  - send logout with `Authorization: Bearer <access_token>`
- expected status: `200`
- response assertions:
  - body.message equals `Successfully logged out`
- schema validation decision: validate `LogoutResponse` through shared Zod helper
- negative coverage decision: covered by separate unauthorized scenarios
- boundary coverage decision: none documented for logout request body/query
- builder decision: reuse registration/login builders; no logout payload builder
- API client decision: direct request usage for first batch
- assertion helper decision: add `expectLogoutResponse` if schema helper is introduced
- contract gaps/blockers: none for success path

### Scenario B: Token invalidation after logout

- endpoint: `/users/me` after `/users/logout`
- method: `GET`
- tags: `@api`, `@smoke`, `@auth`, `@logout`
- payload source: token from login step in same test
- scenario data strategy: register -> login -> logout -> reuse original token on `/users/me`
- expected status: `401` on `/users/me`
- response assertions:
  - unauthorized response shape via existing helper
  - message/error equals documented unauthorized value used in login API suite
- schema validation decision: reuse unauthorized response helper/schema
- negative coverage decision: this scenario is the primary post-logout negative check
- boundary coverage decision: not applicable
- builder decision: same as Scenario A
- API client decision: direct request usage
- assertion helper decision: reuse `expectUnauthorizedResponse`
- contract gaps/blockers: none

### Scenario C: Logout without token

- endpoint: `/users/logout`
- method: `GET`
- tags: `@api`, `@regression`, `@auth`, `@logout`
- payload source: none
- scenario data strategy: call logout with no `Authorization` header
- expected status: `401`
- response assertions: unauthorized response helper
- schema validation decision: reuse unauthorized helper
- negative coverage decision: primary negative for missing auth
- boundary coverage decision: not applicable
- builder decision: none
- API client decision: direct request usage
- assertion helper decision: reuse unauthorized helper
- contract gaps/blockers: none

### Scenario D: Logout with invalid token

- endpoint: `/users/logout`
- method: `GET`
- tags: `@api`, `@regression`, `@auth`, `@logout`
- payload source: fixed invalid bearer token string (same pattern as login API suite)
- scenario data strategy: `Authorization: Bearer invalid-token`
- expected status: `401`
- response assertions: unauthorized response helper
- schema validation decision: reuse unauthorized helper
- negative coverage decision: primary negative for invalid auth
- boundary coverage decision: not applicable
- builder decision: none
- API client decision: direct request usage
- assertion helper decision: reuse unauthorized helper
- contract gaps/blockers: none

## UI Coverage

### Ready to implement now

- scenarios:
  1. authenticated user signs out from account area and guest navigation returns
  2. account route is no longer accessible after logout
- reason: logout is primarily a browser-visible auth-state transition; existing login coverage does not verify session termination
- dependencies:
  - `registrationApiPreconditionSetup` for deterministic credentials
  - `LoginPage`, `AccountPage`
  - navigation locators for authenticated/guest states (`nav-sign-out`, `nav-sign-in`, optionally `nav-my-account`)
- blockers: none if storefront locators match login plan notes
- implementation decisions:
  - extend existing page objects with auth navigation locators/actions rather than creating a new route Page Object
  - Component Object for header/navigation: postpone unless reuse appears across multiple suites during implementation
  - logout action remains visible in spec steps; do not hide login+logout in fixtures

### Blocked or postponed

- scenarios: none for functional UI coverage
- reason: n/a
- blocker or clarification needed: n/a

## UI Implementation Brief

### Scenario 1: Sign out returns guest navigation

- route/page: `/auth/login` -> `/account` -> logout via global navigation
- tags: `@ui`, `@smoke`, `@auth`, `@logout`
- preconditions:
  - disposable registered user created through approved API precondition setup
  - user authenticated through UI login (same pattern as login smoke UI test)
- test data:
  - email/password from `registrationApiPreconditionSetup.createRegisteredUser()`
- scenario data strategy: one disposable user per test run
- user steps:
  1. open login page and sign in with precondition user
  2. verify account area is loaded (`/account`, account page title)
  3. click sign-out control in navigation
  4. verify guest navigation markers
- expected visible outcome:
  - `nav-sign-in` visible
  - authenticated markers no longer visible (`nav-sign-out`, `nav-my-account` or equivalent)
- unique UI risk: browser session/navigation switches from authenticated to guest state
- why API/schema is not sufficient: API logout does not prove UI nav/session cleanup in browser
- recommended Page Object:
  - extend `LoginPage` or `AccountPage` with auth navigation locators/actions
  - preferred: shared auth navigation readers/actions owned by the page that already exposes account/login boundary (`AccountPage` for post-login state, or a minimal extension on both login/account pages if nav is global)
- Page Object actions/readers:
  - `signOut()`
  - `signInLink`, `signOutLink`, `myAccountLink` (or equivalent readers)
- Component Object decision: postpone header component unless nav logic duplicates across suites
- locator discovery notes:
  - primary contract from login plan: `data-test="nav-sign-out"`, `data-test="nav-sign-in"`
  - confirm during implementation whether a user/account menu must be opened before sign-out is clickable
- assertions in spec:
  - guest marker visible
  - authenticated markers hidden
- not covered in UI:
  - raw token invalidation contract (API owns this)

### Scenario 2: Protected account route blocked after logout

- route/page: `/account` after logout
- tags: `@ui`, `@regression`, `@auth`, `@logout`
- preconditions: same authenticated setup as Scenario 1 through logout click
- test data: same disposable user strategy as Scenario 1
- scenario data strategy: reuse one user per test; no shared mutable account
- user steps:
  1. authenticate through UI
  2. sign out through UI
  3. attempt to open `/account`
- expected visible outcome:
  - user is redirected to login route (`/auth/login`) or sees login page marker
  - account page title/account-only marker is not shown
- unique UI risk: frontend route guard after session termination
- why API/schema is not sufficient: route redirect/guard behavior is browser-visible and not guaranteed by API logout alone
- recommended Page Object: same auth navigation extension as Scenario 1 plus `AccountPage.open()` or page-level navigation to account route
- Page Object actions/readers:
  - `signOut()`
  - `accountPage.open()` or equivalent route entry
  - login readiness marker from `LoginPage`
- Component Object decision: postpone
- locator discovery notes: assert login route and/or `LoginPage` loaded marker after protected-route attempt
- assertions in spec:
  - URL and/or login page marker prove account area is inaccessible
- not covered in UI:
  - exact API status codes during logout

## E2E Note

Potential E2E journey candidate:

- authenticated user login and logout session lifecycle

Suggested journey plan path:

- `specs/e2e/logout-session-lifecycle.md`

Reason:

- a combined login -> account access -> logout -> protected-route denial journey crosses auth state, navigation, and route boundaries beyond isolated API/UI checks

Important:

- do not implement E2E from this feature plan
- create a separate E2E journey plan first with `/plan-e2e-journey`

## Visual Checkpoints

Planned now:

- none (baseline approval not requested)

Postponed:

- target UI state: authenticated navigation with sign-out visible
  - screenshot scope: header/navigation auth area only
  - reason postponed: functional logout coverage first; dynamic nav badges may vary
  - dynamic content risks: cart count, language selector, chat widget
  - recommended tags: `@ui`, `@visual`, `@regression`

- target UI state: guest navigation after logout
  - screenshot scope: header/navigation auth area only
  - reason postponed: avoid baseline churn before functional stabilization
  - dynamic content risks: same as above
  - recommended tags: `@ui`, `@visual`, `@regression`

## Schema / Contract Checks

Planned now:

- checks:
  - `LogoutResponse` for `GET /users/logout` `200` (`message: string`)
- reason: documented response shape is small but contract-critical and reused by API assertions
- dependencies: shared Zod assertion helper pattern used by login/user API suites

Postponed:

- checks: none beyond logout success response
- reason postponed: no additional logout response variants documented

## Not Automated / Blockers

- Logout `400 Bad Request` remains not automated until OpenAPI defines how to trigger it and expected response body.
- Security-focused logout scenarios (forced logout on token expiry UI, multi-tab logout propagation, CSRF) are out of scope and better suited to manual/security testing unless product requirements appear.
- Full login-to-logout lifecycle E2E is intentionally excluded from this feature plan; use the E2E Note path if journey-level coverage is required.

## Recommended Next Commands

Informational only. Do not run automatically from planning.

- `/implement-api-batch` — implement all API coverage marked ready to implement now from this plan
- `/implement-ui-batch` — implement all UI coverage marked ready to implement now from this plan
- `/plan-e2e-journey` — only if the E2E Note journey should be planned at `specs/e2e/logout-session-lifecycle.md`
- `/create-test-data-builder` — not required for first batch; reuse existing registration/login data builders

Do not recommend `/implement-e2e-flow` from this feature plan.
