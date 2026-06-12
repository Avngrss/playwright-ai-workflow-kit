# Login Feature Test Coverage Plan

## Feature / Area

- name: Login (`/auth/login` UI + `POST /users/login` API)
- scope: planning and implementation guidance for UI/API login coverage only
- contract source: [Practice Software Testing Swagger UI](https://api.practicesoftwaretesting.com/api/documentation#/User)
- contract JSON source used for planning: `https://api.practicesoftwaretesting.com/docs?api-docs.json`

## Coverage Matrix

| Behavior | Main risk | Recommended level | Priority | Reason | Duplicate coverage risk | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Login page is reachable and key controls are visible (`email`, `password`, submit) | Frontend interaction / route breakage | UI | smoke | Purely user-visible risk | Low | Use `data-test` locators only |
| Successful login from UI redirects to account area and shows authenticated navigation | User journey integration | UI | smoke | Browser-visible auth flow must be verified in UI | Medium | Assert `/account` URL and authenticated nav markers |
| Required-field feedback appears when submitting empty login form | Frontend validation UX | UI | regression | Validation messaging is user-facing | Low | Verify both required messages are visible |
| Invalid credentials show login error and keep user on login page | Error handling UX | UI | regression | UI must show clear auth failure feedback | Medium | Use `login-error` locator and route assertion |
| `POST /users/login` accepts valid payload and returns token fields | Backend contract | API | smoke | Lowest reliable level for login token contract | Low | Assert `access_token`, `token_type`, `expires_in` |
| Login token works on protected endpoint (`GET /users/me`) | Auth integration | API | smoke | Verifies token is operational, not only syntactically valid | Low | Assert `200` and matching user email |
| Non-200 login responses (invalid credentials / malformed payload) | Contract ambiguity | not automated | regression | `/users/login` contract documents only `200` | None | Do not lock tests to undocumented negative behavior yet |

## Smoke vs Regression Split

### Smoke

- UI: login page render and controls visibility
- UI: successful login redirects to `/account`
- API: successful `POST /users/login` token response contract
- API: token usability on `GET /users/me`

### Regression

- UI: empty-submit required validation feedback
- UI: invalid-credentials error feedback
- Not automated: negative API login responses until contract clarification

## First API Batch

1. **Login success contract (`@api`, `@smoke`)**
   - `POST /users/login` with contract-valid payload
   - Assert `200` and token response shape

2. **Token usability (`@api`, `@smoke`)**
   - Use login token in `Authorization: Bearer <access_token>`
   - Call `GET /users/me`
   - Assert `200` and user response shape

## API Implementation Brief

### Scenario A: Login success contract

- endpoint: `/users/login`
- method: `POST`
- tags: `@api`, `@smoke`
- payload source: build user via `registrationUserRequestBuilder`, then send `{ email, password }`
- expected status: `200`
- response assertions:
  - `access_token` is string
  - `token_type` is string
  - `expires_in` is number
- builder decision: no dedicated login builder needed for first batch
- API client decision: direct `request.post` usage is acceptable for first batch
- assertion helper decision: add reusable token response assertion helper
- contract gaps/blockers: no documented non-200 contract for `/users/login`

### Scenario B: Token usability on protected endpoint

- endpoint: `/users/me`
- method: `GET`
- tags: `@api`, `@smoke`
- payload source: token from Scenario A
- expected status: `200`
- response assertions:
  - response matches user response schema helper
  - response email equals login email
- builder decision: same as Scenario A
- API client decision: direct request usage for first batch
- assertion helper decision: reuse existing user schema helper
- contract gaps/blockers: none for success path

## First UI Batch

1. **Login page render (`@ui`, `@smoke`)**
   - Open login page
   - Assert visible controls and form readiness

2. **Successful login (`@ui`, `@smoke`)**
   - Create deterministic user via API precondition
   - Submit valid credentials
   - Assert account route and authenticated nav markers

3. **Invalid credentials (`@ui`, `@regression`)**
   - Submit wrong password
   - Assert `login-error` and stay on login route

4. **Empty submit validation (`@ui`, `@regression`)**
   - Submit empty form
   - Assert required validation feedback

## UI Implementation Brief

### Scenario 1: Login page render

- route/page: `/auth/login`
- tags: `@ui`, `@smoke`
- preconditions: none
- test data: none
- user steps: open page, wait for ready state, verify form controls
- expected visible outcome: `email`, `password`, `login-submit` visible
- recommended Page Object: `LoginPage`
- Page Object actions/readers: `open()`, `waitForReady()`, control locators
- Component Object decision: postpone
- locator discovery notes: use `data-test` attributes only
- assertions in spec: route and control visibility
- not covered in UI: token contract fields

### Scenario 2: Successful login

- route/page: `/auth/login` to `/account`
- tags: `@ui`, `@smoke`
- preconditions: API registration of user for deterministic credentials
- test data: email/password from precondition user
- user steps: fill credentials and submit login
- expected visible outcome: `/account` URL and authenticated nav markers visible
- recommended Page Object: `LoginPage`
- Page Object actions/readers: `login()`, `submit()`, authenticated nav locators
- Component Object decision: postpone
- locator discovery notes: assert `nav-sign-out`, `nav-my-account`
- assertions in spec: URL + marker visibility
- not covered in UI: backend token semantics

### Scenario 3: Invalid credentials error

- route/page: `/auth/login`
- tags: `@ui`, `@regression`
- preconditions: none
- test data: valid-format email + invalid password
- user steps: submit wrong credentials
- expected visible outcome: `login-error` visible and still on `/auth/login`
- recommended Page Object: `LoginPage`
- Page Object actions/readers: `loginError`, `login()`, `submit()`
- Component Object decision: not needed
- locator discovery notes: use `login-error`
- assertions in spec: route stays on login and error visible
- not covered in UI: exact API status code

### Scenario 4: Empty-submit validation

- route/page: `/auth/login`
- tags: `@ui`, `@regression`
- preconditions: none
- test data: none
- user steps: submit login form without input
- expected visible outcome: `Email is required` and `Password is required`
- recommended Page Object: `LoginPage`
- Page Object actions/readers: required-error locators and submit action
- Component Object decision: not needed
- locator discovery notes: text-based required message assertions are acceptable
- assertions in spec: required messages and route unchanged
- not covered in UI: backend validation contract

## Visual Checkpoints

Planned now:

- none (baseline approval not requested)

Postponed:

- target UI state: default login form
  - screenshot scope: login form container (`login-form`)
  - reason postponed: functional coverage first; no explicit baseline update request
  - dynamic content risks: locale switcher, notification bar, chat widget

- target UI state: invalid-credentials error state
  - screenshot scope: login form with `login-error`
  - reason postponed: avoid baseline churn before functional stabilization
  - dynamic content risks: external page chrome and runtime overlays

## Not Automated

- Negative `/users/login` contract coverage is postponed because non-200 behavior is not documented for the endpoint in Swagger.
- Live negative responses exist but payload/status are not contract-defined for this operation.
- `UnauthorizedResponse` component shape differs from observed login failure payload (`message` vs `error`), requiring contract clarification first.

## Recommended Implementation Order

1. Implement API smoke login success contract.
2. Implement API token usability check on `/users/me`.
3. Implement UI smoke (login render + successful login).
4. Implement UI regression (invalid credentials + empty submit validation).
5. Revisit visual checkpoints only after explicit baseline approval.
6. Add API negative login tests after contract clarification.
