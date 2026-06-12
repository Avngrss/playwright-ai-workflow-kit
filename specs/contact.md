# Contact Us Feature Coverage Plan

## Feature / Area

- name: Contact Us (`/contact` UI + Contact API)
- scope: planning only; no implementation in this step
- UI target: [https://practicesoftwaretesting.com/contact](https://practicesoftwaretesting.com/contact)
- API contract source: [https://api.practicesoftwaretesting.com/api/documentation#/Contact](https://api.practicesoftwaretesting.com/api/documentation#/Contact)
- API contract JSON used for planning: [https://api.practicesoftwaretesting.com/docs?api-docs.json](https://api.practicesoftwaretesting.com/docs?api-docs.json)
- requirements/specs: none provided
- existing pattern references:
  - [`specs/login.md`](specs/login.md)
  - [`specs/registration.md`](specs/registration.md)
  - [`tests/ui/login/login.ui.spec.ts`](tests/ui/login/login.ui.spec.ts)
  - [`tests/api/login/login.api.spec.ts`](tests/api/login/login.api.spec.ts)

## Coverage Matrix

- behavior: Contact page opens and required controls are visible (`subject`, `message`, `attachment`, submit)
  - risk: frontend route/render regression
  - recommended level: UI
  - priority: smoke
  - reason: purely user-visible and cannot be proven via API
  - duplicate coverage risk: low
  - notes: use stable `data-test` locators (`subject`, `message`, `attachment`, `contact-submit`)

- behavior: guest required-field validation on empty submit (`first_name`, `last_name`, `email`, `subject`, `message`)
  - risk: validation UX
  - recommended level: UI
  - priority: regression
  - reason: message visibility and placement are UI concerns
  - duplicate coverage risk: medium
  - notes: API should not own UI wording checks

- behavior: email format validation feedback (`email-error`)
  - risk: frontend validation feedback
  - recommended level: UI
  - priority: regression
  - reason: visible feedback is user-facing behavior
  - duplicate coverage risk: low
  - notes: keep assertion on visible error state, not backend status

- behavior: message min-length validation (minLength 50 observed in UI logic)
  - risk: frontend validation rule drift
  - recommended level: UI
  - priority: regression
  - reason: rule is enforced in form behavior before submit
  - duplicate coverage risk: medium
  - notes: contract gap because OpenAPI documents maxLength only

- behavior: successful guest contact submission shows confirmation alert
  - risk: end-to-end user journey breakage
  - recommended level: UI
  - priority: smoke
  - reason: verifies real browser flow to successful user outcome
  - duplicate coverage risk: medium
  - notes: assert visible confirmation state, not internal API payload details

- behavior: attachment file type validation (`.txt` only accept + `attachment-error`)
  - risk: user upload UX regression
  - recommended level: UI
  - priority: regression
  - reason: selection and feedback are UI-level behavior
  - duplicate coverage risk: low
  - notes: validate incorrect type feedback; avoid API duplication

- behavior: signed-in user variant (`known-user` state)
  - risk: conditional UI state regression
  - recommended level: UI
  - priority: regression
  - reason: conditional form behavior is user-facing
  - duplicate coverage risk: low
  - notes: requires authenticated precondition and stable account setup

- behavior: `POST /messages` accepts valid payload and returns success object
  - risk: backend contract drift
  - recommended level: API
  - priority: smoke
  - reason: lowest reliable layer for request/response contract
  - duplicate coverage risk: low
  - notes: assert documented `200` and `{ success: boolean }`

- behavior: contact authenticated management endpoints (`GET /messages`, `GET /messages/{messageId}`, `POST /messages/{messageId}/reply`, `PUT /messages/{messageId}/status`)
  - risk: backend auth/role and lifecycle regressions
  - recommended level: API
  - priority: regression
  - reason: endpoint behavior belongs to API layer
  - duplicate coverage risk: low
  - notes: requires role-capable auth setup

- behavior: contract shape checks for `ContactRequest`, `ContactResponse*`, `ContactReplyResponse`
  - risk: schema contract drift
  - recommended level: schema-contract
  - priority: regression
  - reason: explicit contract verification without coupling to UI
  - duplicate coverage risk: low
  - notes: focus on documented fields and enum values

- behavior: undocumented/ambiguous negative responses for `POST /messages` and upload size threshold
  - risk: flaky or assumption-based assertions
  - recommended level: not automated
  - priority: regression
  - reason: contract ambiguity and unstable trigger conditions
  - duplicate coverage risk: none
  - notes: postpone until contract/product clarification

## Smoke / Regression Split

- smoke:
  - UI: contact page render and controls visibility
  - UI: successful guest submit and confirmation
  - API: `POST /messages` success contract (`200` + `success`)

- regression:
  - UI: required validation on empty submit
  - UI: invalid email format feedback
  - UI: message minlength feedback
  - UI: invalid attachment type feedback
  - UI: signed-in known-user variant
  - API: authenticated message management endpoints
  - schema-contract: contact request/response shape checks

## API Coverage Backlog

### First Batch

- scenario A: `POST /messages` happy path (guest)
- scenario B: response contract assertion helper for send-message response
- reason: highest-value contract confidence for Contact Us submit flow
- dependencies: none beyond API base URL config
- blockers: none for success path

### Later Batch

- scenario C: authenticated `GET /messages` list behavior (role-aware)
- scenario D: `GET /messages/{messageId}` contract checks
- scenario E: `POST /messages/{messageId}/reply` contract checks
- scenario F: `PUT /messages/{messageId}/status` with allowed enum values (`NEW`, `ON_HOLD`, `IN_PROGRESS`, `RESOLVED`)
- scenario G: `POST /messages/{messageId}/attach-file` for valid text file
- dependencies: reliable authenticated test user(s), message ownership strategy
- blockers: message lifecycle data setup and role expectations need deterministic setup

### Postponed

- negative status-code contract checks for `POST /messages` (undocumented 4xx for validation)
- upload-size boundary contract checks (threshold not documented; current frontend behavior appears ambiguous)
- strict auth matrix for admin vs user on message retrieval/update/reply

## UI Coverage Backlog

### First Batch

- scenario 1 (`@ui`, `@smoke`): page render and core controls visible
- scenario 2 (`@ui`, `@smoke`): guest successful submission shows confirmation
- scenario 3 (`@ui`, `@regression`): empty-submit required-field feedback
- scenario 4 (`@ui`, `@regression`): invalid email + short message validation feedback
- reason: highest user-facing confidence with minimal setup
- dependencies: new `ContactPage` page object + fixture wiring
- blockers: confirmation text should be asserted via stable marker/translation-safe locator

### Later Batch

- scenario 5 (`@ui`, `@regression`): invalid attachment type feedback (`attachment-error`)
- scenario 6 (`@ui`, `@regression`): signed-in known-user state and successful submit
- scenario 7 (`@ui`, `@regression`): subject option coverage (`customer-service`, `webmaster`, `return`, `payments`, `warranty`, `status-of-order`)
- dependencies: deterministic auth precondition for signed-in flow
- blockers: avoid brittle text-only assertions in multi-locale UI

### Postponed

- attachment size-error UI scenario (requires clarified product behavior and deterministic fixture asset)
- locale-specific wording assertions across multiple translations
- network/server-error rendering checks unless stable and reproducible trigger is defined

## Visual Checkpoints

### Planned Now

- none (baseline approval not requested)

### Postponed

- target state: default contact form state
  - screenshot scope: form container only (exclude navbar/chat/footer)
  - reason useful: catches structural layout regressions in core form fields
  - dynamic content risks: notification/chat widget overlays, locale changes
  - recommended tags: `@ui`, `@visual`, `@regression`

- target state: validation error state (empty submit)
  - screenshot scope: form with visible field-level alerts
  - reason useful: catches spacing/order/styling regressions in error presentation
  - dynamic content risks: translated text length differences by locale
  - recommended tags: `@ui`, `@visual`, `@regression`

- target state: success confirmation state
  - screenshot scope: success alert + submit area
  - reason useful: catches confirmation styling/visibility regressions
  - dynamic content risks: backend timing, transient notifications
  - recommended tags: `@ui`, `@visual`, `@regression`

## Schema / Contract Checks

- first batch:
  - verify `POST /messages` success payload shape (`success: boolean`)

- later batch:
  - verify `ContactResponse` / `ContactResponseAuthenticated` shape from authenticated retrieval endpoints
  - verify `ContactReplyResponse` shape from reply endpoint
  - verify `ContactStatusRequest.status` allowed enum contract

- postponed:
  - negative schema checks for request validation failures where status/body contract is not documented

## Not Automated / Blockers

- undocumented negative contract for `POST /messages` (no explicit validation error responses in Contact endpoint docs)
- unclear, potentially unstable attachment size behavior from observed frontend logic; defer boundary assertions until requirement confirmation
- role matrix ambiguity for admin/user behavior on authenticated Contact endpoints without explicit test credentials and expected dataset ownership

## API Implementation Brief

- scenario A: send message happy path
  - endpoint: `/messages`
  - method: `POST`
  - tags: `@api`, `@smoke`
  - payload source: deterministic inline payload constants (name/email/subject/message) for first batch
  - expected status: `200`
  - response assertions: response body has boolean `success === true`
  - builder decision: no dedicated builder in first batch unless multiple payload variants are added
  - API client decision: direct `request.post` in spec is sufficient for first batch
  - assertion helper decision: add `expectContactSendMessageResponse` helper for contract readability/reuse
  - contract gaps/blockers: none for happy path

- scenario B: contract helper usage
  - endpoint: `/messages` response schema
  - method: assertion-only companion check
  - tags: `@api`, `@smoke`
  - payload source: reuse scenario A payload
  - expected status: `200`
  - response assertions: strict type checks for documented fields only
  - builder/client/helper decisions: helper introduced only if used in at least 2 assertions/tests
  - contract gaps/blockers: avoid asserting undocumented metadata fields

## UI Implementation Brief

- scenario 1: page render and controls visibility
  - route/page: `/contact`
  - tags: `@ui`, `@smoke`
  - preconditions: none
  - test data: none
  - user steps: open contact page, wait for form readiness, verify core controls
  - expected visible outcome: `subject`, `message`, `attachment`, `contact-submit` visible
  - recommended Page Object: new `ContactPage` in [`src/test/pages/contact.page.ts`](src/test/pages/contact.page.ts)
  - Page Object actions/readers: `open()`, `waitForReady()`, field locators, `submit()`
  - Component Object decision: not needed initially
  - locator discovery notes: prefer `data-test` (`subject`, `message`, `attachment`, `contact-submit`, `*-error`)
  - assertions in spec: route + visibility + form readiness
  - not covered in UI: API payload/response schema details

- scenario 2: guest successful submit
  - route/page: `/contact`
  - tags: `@ui`, `@smoke`
  - preconditions: none
  - test data: deterministic first/last/email + valid subject + message length >= 50
  - user steps: fill fields, choose subject, enter message, submit
  - expected visible outcome: success confirmation alert rendered
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers: `fillGuestIdentity()`, `selectSubject()`, `fillMessage()`, `submit()`, `successAlert`
  - Component Object decision: postpone
  - locator discovery notes: avoid brittle full-text assertions when stable alert container/role exists
  - assertions in spec: confirmation visible and no error alert
  - not covered in UI: backend response payload schema

- scenario 3: empty submit required validation
  - route/page: `/contact`
  - tags: `@ui`, `@regression`
  - preconditions: none
  - test data: none
  - user steps: open page, submit without input
  - expected visible outcome: required errors for guest fields + subject + message
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers: error locators (`first-name-error`, `last-name-error`, `email-error`, `subject-error`, `message-error`)
  - Component Object decision: not needed
  - locator discovery notes: assert visibility of error containers before text-specific checks
  - assertions in spec: validation errors visible and submit not treated as success
  - not covered in UI: API validation status contract

- scenario 4: invalid email and short message validation
  - route/page: `/contact`
  - tags: `@ui`, `@regression`
  - preconditions: none
  - test data: invalid email + message under 50 chars
  - user steps: fill fields with invalid values, trigger blur/submit
  - expected visible outcome: `email-error` and `message-error` visible
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers: setters for identity/email/message + submit/blur helpers
  - Component Object decision: not needed
  - locator discovery notes: message validation uses blur-based update behavior
  - assertions in spec: specific error states shown; no success alert
  - not covered in UI: server-side validation response format

## Recommended Implementation Order

1. Use this plan file at [`specs/contact.md`](specs/contact.md).
2. Implement first API batch only (`POST /messages` smoke contract).
3. Implement first UI batch only (4 scenarios above).
4. Run targeted API and UI specs, then quality gate.
5. Add later-batch authenticated and attachment scenarios once auth/data strategy is stable.
6. Add visual checkpoints only when baseline approval is explicitly requested.

## Recommended Next Commands (Manual)

- ` /implement-api-batch ` with:
  - Feature plan: `specs/contact.md`
  - Batch: `First API Batch`
  - API contract: `https://api.practicesoftwaretesting.com/api/documentation#/Contact`

- ` /implement-ui-batch ` with:
  - Feature plan: `specs/contact.md`
  - Batch: `First UI Batch`

- targeted verification after implementation:
  - `npx playwright test tests/api/contact/contact.api.spec.ts --project=api`
  - `npx playwright test tests/ui/contact/contact.ui.spec.ts --project=ui-chromium`
  - `npm run qa:gate`
