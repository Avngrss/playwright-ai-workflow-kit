# Feature Coverage Plan: Contact Us

## Feature / Area

- name: Contact Us
- scope: Guest contact form submission on the Contact page and public contact-message API behavior
- source of truth:
  - UI route: `https://practicesoftwaretesting.com/contact`
  - API contract: `https://api.practicesoftwaretesting.com/docs?api-docs.json`
- in scope:
  - contact page rendering and core form controls
  - guest contact form validation feedback
  - successful plain contact submit without attachment
  - successful contact submit with valid empty `.txt` attachment
  - invalid attachment feedback for non-`.txt` or non-zero-byte files
  - public `POST /messages` happy path and documented validation boundaries
  - public `POST /messages/{messageId}/attach-file` for valid and invalid uploads
  - request/response schema checks for contact message creation response
- out of scope:
  - authenticated contact submit (`ContactRequestAuthenticated`)
  - admin/user message retrieval (`GET /messages`, `GET /messages/{messageId}`)
  - message reply (`POST /messages/{messageId}/reply`)
  - message status updates (`PUT /messages/{messageId}/status`)
  - email delivery or mailbox verification
  - chat widget behavior
  - language switcher behavior

## Feature Targets

- UI/application target: `UI_BASE_URL` (route `/contact`)
- API/service target: `API_BASE_URL` (endpoints `POST /messages`, `POST /messages/{messageId}/attach-file`)
- setup/cleanup target (only when needed): none required; contact messages are disposable and do not need cleanup for automation safety
- external/partner target(s): none

## Test Assets

- valid upload file:
  - path: `src/test/assets/files/contact-empty-attachment.txt`
  - format: `.txt`
  - size: `0` bytes
  - purpose: valid attachment upload for UI and API attach-file scenarios
- rules:
  - do not upload files from project root or config locations
  - do not use secrets, `.env`, or credential files as upload assets

## Coverage Matrix

- behavior: Contact page renders with required controls and attachment guidance
  - risk: frontend interaction and missing controls
  - recommended level: UI
  - priority: smoke
  - reason: users must see and interact with the contact form
  - duplicate coverage risk: low (API cannot prove visible form structure)
  - notes: verify heading, first/last name, email, subject, message, attachment control, send button, and attachment rule text (`txt`, `0kb`)

- behavior: Empty submit shows required-field validation state
  - risk: visible validation feedback
  - recommended level: UI
  - priority: smoke
  - reason: required-field feedback is user-facing browser behavior
  - duplicate coverage risk: low
  - notes: assert invalid/required state for first name, last name, email, subject, and message; do not rely only on backend rejection

- behavior: Invalid email format shows visible validation feedback
  - risk: visible validation feedback
  - recommended level: UI
  - priority: regression
  - reason: email-format feedback is a UI concern
  - duplicate coverage risk: low
  - notes: keep assertions on visible alert/validation text or invalid control state

- behavior: Message shorter than 50 characters is rejected in UI
  - risk: frontend validation boundary
  - recommended level: UI
  - priority: regression
  - reason: live UI enforces `Message must be minimal 50 characters`, which is not documented in OpenAPI
  - duplicate coverage risk: medium if only API max-length is tested
  - notes: exact observed message: `Message must be minimal 50 characters`

- behavior: Supported subject options can be selected
  - risk: frontend interaction and option mapping
  - recommended level: UI
  - priority: regression
  - reason: subject selection is browser-visible and maps to API payload values
  - duplicate coverage risk: low
  - notes: use one parameterized/dataset case for labels `Customer service`, `Webmaster`, `Return`, `Payments`, `Warranty`, `Status of my order`; observed mapping example: `Customer service` -> `customer-service`

- behavior: Successful plain submit shows success confirmation
  - risk: frontend/backend integration visible to user
  - recommended level: UI
  - priority: smoke
  - reason: API success does not prove visible success feedback
  - duplicate coverage risk: low
  - notes: observed success alert text: `Thanks for your message! We will contact you shortly.`; use message length >= 50 characters

- behavior: Successful submit with valid empty `.txt` attachment
  - risk: file-upload integration and optional success path
  - recommended level: UI
  - priority: regression
  - reason: attachment upload is a distinct UI/file-input risk beyond plain submit
  - duplicate coverage risk: low
  - notes: use `src/test/assets/files/contact-empty-attachment.txt`; keep plain no-attachment success as separate smoke scenario

- behavior: Invalid attachment shows visible rejection feedback
  - risk: visible upload validation/error feedback
  - recommended level: UI
  - priority: regression
  - reason: upload constraints are shown in UI and must be enforced visibly
  - duplicate coverage risk: low
  - notes: cover at least one non-`.txt` file and one non-zero-byte `.txt` file; exact UI error text to be pinned during implementation

- behavior: Valid guest contact payload creates message
  - risk: backend contract and persistence
  - recommended level: API
  - priority: smoke
  - reason: API is the cheapest reliable layer for message creation contract
  - duplicate coverage risk: low
  - notes: live `200` returns full contact message object, not only `{ success: true }`

- behavior: Missing required API fields are rejected
  - risk: backend validation contract
  - recommended level: API
  - priority: regression
  - reason: required-field behavior belongs primarily to backend contract
  - duplicate coverage risk: low
  - notes: observed `422` for missing `subject` and missing `message`

- behavior: Invalid email format is rejected by API
  - risk: backend validation contract
  - recommended level: API
  - priority: regression
  - reason: email validation is backend-exposed contract behavior
  - duplicate coverage risk: low
  - notes: observed `422` for invalid email

- behavior: Message longer than 250 characters is rejected by API
  - risk: backend boundary validation
  - recommended level: API
  - priority: regression
  - reason: documented `maxLength: 250` boundary
  - duplicate coverage risk: low
  - notes: observed `422` with `The message field must not be greater than 250 characters.`

- behavior: Valid empty `.txt` file can be attached to created message
  - risk: backend file-upload contract
  - recommended level: API
  - priority: regression
  - reason: attach endpoint has distinct upload contract from message creation
  - duplicate coverage risk: low
  - notes: create message first, then `POST /messages/{messageId}/attach-file`; observed `200` `{ "success": true }`

- behavior: Non-empty attachment is rejected by API
  - risk: backend upload boundary
  - recommended level: API
  - priority: regression
  - reason: live API enforces empty-file-only uploads
  - duplicate coverage risk: low
  - notes: observed `400` with `Currently we only allow empty files.`

- behavior: Contact create response shape remains stable
  - risk: schema/contract drift
  - recommended level: schema/contract
  - priority: regression
  - reason: runtime schema validation reduces weak manual assertions
  - duplicate coverage risk: low
  - notes: validate live create response against reusable contact message schema; document OpenAPI drift

- behavior: Contact form visual layout remains stable
  - risk: visual regression
  - recommended level: visual checkpoint
  - priority: regression
  - reason: form layout is a meaningful visual risk
  - duplicate coverage risk: low
  - notes: postpone until explicit baseline approval

## Smoke / Regression Split

Smoke:

- UI: contact page controls and attachment guidance are visible
- UI: empty submit shows required validation state
- UI: successful plain submit shows success confirmation
- API: `POST /messages` valid guest payload returns `200` and contact message response shape

Regression:

- UI: invalid email validation feedback
- UI: message minimum-length validation feedback
- UI: supported subject options can be selected
- UI: successful submit with valid empty `.txt` attachment
- UI: invalid attachment visible rejection feedback
- API: missing required field rejection
- API: invalid email rejection
- API: message max-length boundary rejection
- API: valid empty `.txt` attach-file success
- API: non-empty attach-file rejection
- schema: contact create response runtime validation
- visual: postponed checkpoints

## API Coverage

### Ready to implement now

- scenarios:
  - `POST /messages` happy path (`200`)
  - `POST /messages` missing `subject` rejection
  - `POST /messages` missing `message` rejection
  - `POST /messages` invalid email rejection
  - `POST /messages` message length above `250` rejection
  - `POST /messages/{messageId}/attach-file` with valid empty `.txt` file (`200`)
  - `POST /messages/{messageId}/attach-file` with non-empty file rejection
- reason:
  - covers public contact creation and attachment contract at the most reliable layer
- dependencies:
  - unique message content or email values per run when useful for traceability
  - test asset `src/test/assets/files/contact-empty-attachment.txt`
- blockers:
  - none for listed scenarios
- implementation decisions:
  - direct request/response style first
  - optional thin contact API client only if endpoint reuse grows
  - reusable Zod schema for contact create response
  - feature-specific assertion helper calling shared Zod helper

### Blocked or postponed

- scenarios:
  - strict schema validation for all `422` validation error bodies on `POST /messages`
  - API rejection for missing guest `email` or `name`
  - non-`.txt` extension attach-file rejection as a strict documented contract case
  - authenticated/admin message management endpoints
- reason:
  - negative error-body schema is not fully specified in OpenAPI for contact create
  - live API currently accepts missing guest `email`/`name` with `200`, which conflicts with OpenAPI description (`email` required when not authenticated)
  - attach-file extension rejection was not clearly isolated during planning; only empty-file rejection was confirmed
- blocker or clarification needed:
  - confirm whether missing guest email/name should remain untested due to contract drift
  - confirm exact non-`.txt` attach-file status/body before automating strict extension-negative API coverage

## API Implementation Brief

- scenario: successful guest contact message creation
  - endpoint: `/messages`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@smoke`, `@contact`
  - payload source: contact message builder or deterministic inline payload
  - scenario data strategy:
    - use safe non-routable email such as `contact-<unique>@example.test`
    - message body can be deterministic and >= 50 chars if mirroring UI constraints, but API happy path does not require 50 chars
  - expected status: `200`
  - response assertions:
    - `id` present and non-empty
    - `status` is `NEW`
    - request `name`, `email`, `subject`, `message` are reflected in response
    - `created_at` present and non-empty
  - schema validation decision: planned now via reusable contact message response schema
  - negative coverage decision: separate dedicated scenarios
  - boundary coverage decision: max-length covered in separate scenario
  - builder decision: yes, reusable contact message builder is justified
  - API client decision: optional
  - assertion helper decision: yes (`expectContactSendMessageResponse` or equivalent)
  - contract gaps/blockers:
    - OpenAPI documents `{ success: boolean }`, but live response matches `ContactResponse`

- scenario: missing required field rejection
  - endpoint: `/messages`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@regression`, `@contact`
  - payload source: partial payloads missing one required field
  - scenario data strategy: table-driven cases for missing `subject` and missing `message`
  - expected status: `422`
  - response assertions:
    - field-level validation errors present for missing field
  - schema validation decision: minimal behavior assertions only; strict error schema postponed
  - negative coverage decision: planned now
  - boundary coverage decision: required-field boundary covered
  - builder decision: optional overrides on contact builder
  - API client decision: optional
  - assertion helper decision: minimal inline assertions acceptable
  - contract gaps/blockers: OpenAPI does not clearly document `422` response shape for this endpoint

- scenario: invalid email rejection
  - endpoint: `/messages`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@regression`, `@contact`
  - payload source: valid payload with invalid `email`
  - scenario data strategy: one deterministic invalid email such as `not-an-email`
  - expected status: `422`
  - response assertions:
    - response indicates email validation failure
  - schema validation decision: postponed for strict error schema
  - negative coverage decision: planned now
  - boundary coverage decision: n/a
  - builder decision: optional
  - API client decision: optional
  - assertion helper decision: minimal
  - contract gaps/blockers: none for status-level coverage

- scenario: message max-length boundary rejection
  - endpoint: `/messages`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@regression`, `@contact`
  - payload source: valid payload with `251`-character message
  - scenario data strategy: deterministic generated string of exact length
  - expected status: `422`
  - response assertions:
    - message length validation error present
  - schema validation decision: postponed for strict error schema
  - negative coverage decision: planned now
  - boundary coverage decision: documented max length covered
  - builder decision: optional
  - API client decision: optional
  - assertion helper decision: minimal
  - contract gaps/blockers: none

- scenario: attach valid empty `.txt` file
  - endpoint: `/messages/{messageId}/attach-file`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@regression`, `@contact`
  - payload source: multipart upload using `src/test/assets/files/contact-empty-attachment.txt`
  - scenario data strategy:
    - create message in same test via `POST /messages`
    - use returned `id` as `messageId`
  - expected status: `200`
  - response assertions:
    - `success` is `true`
  - schema validation decision: optional small schema for `{ success: boolean }`
  - negative coverage decision: separate scenario
  - boundary coverage decision: valid empty-file boundary covered
  - builder decision: n/a
  - API client decision: optional
  - assertion helper decision: minimal
  - contract gaps/blockers: none

- scenario: reject non-empty attachment
  - endpoint: `/messages/{messageId}/attach-file`
  - method: `POST`
  - API service target: `API_BASE_URL`
  - env name (from project map): `API_BASE_URL`
  - tags: `@api`, `@regression`, `@contact`
  - payload source: multipart upload with non-zero-byte `.txt` file created in test setup
  - scenario data strategy:
    - create message first
    - upload temporary non-empty `.txt` file
  - expected status: `400`
  - response assertions:
    - error indicates only empty files are allowed
  - schema validation decision: postponed
  - negative coverage decision: planned now
  - boundary coverage decision: empty-file boundary covered
  - builder decision: n/a
  - API client decision: optional
  - assertion helper decision: minimal
  - contract gaps/blockers: exact error schema not documented in OpenAPI

## UI Coverage

### Ready to implement now

- scenarios:
  - contact page render and controls
  - empty submit required validation state
  - invalid email validation feedback
  - message minimum-length validation feedback
  - supported subject options can be selected
  - successful plain submit confirmation
  - successful submit with valid empty `.txt` attachment
  - invalid attachment visible rejection feedback
- reason:
  - each scenario covers distinct browser-visible behavior not fully proven by API coverage alone
- dependencies:
  - `ContactPage` Page Object
  - contact form builder for reusable valid form data
  - upload asset `src/test/assets/files/contact-empty-attachment.txt`
  - register `@contact` in project map tag registry before implementation if not already present
- blockers:
  - none for listed scenarios
- implementation decisions:
  - keep locator mechanics in Page Object using discovered `data-test` attributes
  - keep assertions in spec
  - keep submit/upload actions visible in test steps

### Blocked or postponed

- scenarios:
  - visual screenshot checkpoints for default, validation, filled, and success states
  - authenticated contact submit UX
- reason:
  - baseline approval was not requested
  - authenticated contact flow is out of feature scope
- blocker or clarification needed:
  - explicit visual baseline approval request

## UI Implementation Brief

- scenario: contact page render
  - route/page: `/contact`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@smoke`, `@contact`
  - preconditions: unauthenticated guest user
  - test data: none
  - scenario data strategy: deterministic static checks
  - user steps:
    - open contact page
    - verify heading and form controls
    - verify attachment guidance text
  - expected visible outcome: complete interactive contact form is visible
  - unique UI risk: missing or broken form controls
  - why API/schema is not sufficient: API cannot verify visible page structure
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers:
    - `open()`
    - `firstNameInput`, `lastNameInput`, `emailInput`, `subjectSelect`, `messageInput`, `attachmentInput`, `submitButton`
    - `attachmentHelpText` or equivalent reader
  - Component Object decision: not needed initially
  - locator discovery notes:
    - discovered stable test ids: `first-name`, `last-name`, `email`, `subject`, `message`, `attachment`, `contact-submit`
  - assertions in spec:
    - heading/control visibility
    - attachment rule mentions `txt` and `0kb`
  - not covered in UI: backend response schema details

- scenario: empty submit required validation
  - route/page: `/contact`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@smoke`, `@contact`
  - preconditions: empty/default form state
  - test data: none
  - scenario data strategy: single deterministic empty-submit case
  - user steps:
    - open contact page
    - click send without filling required fields
  - expected visible outcome: required fields show validation state and submit does not succeed
  - unique UI risk: required-field feedback not shown to user
  - why API/schema is not sufficient: UI must prove visible validation before/at submit
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers:
    - `submit()`
    - invalid-state readers for required controls
  - Component Object decision: not needed initially
  - locator discovery notes: use control invalid/touched state or visible alerts if present
  - assertions in spec:
    - required controls remain invalid/unsubmitted
    - no success confirmation shown
  - not covered in UI: exact backend `422` matrix

- scenario: invalid email validation feedback
  - route/page: `/contact`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@regression`, `@contact`
  - preconditions: otherwise valid form data except email
  - test data:
    - invalid email such as `not-an-email`
    - message length >= 50 characters
  - scenario data strategy: one deterministic invalid-email case
  - user steps:
    - open contact page
    - fill valid fields except email
    - submit form
  - expected visible outcome: email validation feedback is visible and success confirmation is not shown
  - unique UI risk: invalid email not surfaced clearly in browser
  - why API/schema is not sufficient: API negative coverage does not prove visible field feedback
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers:
    - fill methods for form fields
    - email validation alert/invalid-state reader
  - Component Object decision: not needed initially
  - locator discovery notes: pin exact alert text during implementation
  - assertions in spec:
    - visible invalid email feedback
    - success confirmation absent
  - not covered in UI: backend validation error body shape

- scenario: message minimum-length validation feedback
  - route/page: `/contact`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@regression`, `@contact`
  - preconditions: otherwise valid form except short message
  - test data:
    - message shorter than 50 characters
  - scenario data strategy: one deterministic short-message case
  - user steps:
    - open contact page
    - fill valid fields with short message
    - submit form
  - expected visible outcome: alert text `Message must be minimal 50 characters`
  - unique UI risk: undocumented UI-only minimum length not enforced visibly
  - why API/schema is not sufficient: UI min-length rule is not represented in OpenAPI
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers:
    - fill message
    - message validation alert reader
  - Component Object decision: not needed initially
  - locator discovery notes: observed alert under message field
  - assertions in spec:
    - exact or stable partial match for minimum-length message
    - success confirmation absent
  - not covered in UI: API max-length boundary

- scenario: supported subject options can be selected
  - route/page: `/contact`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@regression`, `@contact`
  - preconditions: contact page open
  - test data:
    - subject labels: `Customer service`, `Webmaster`, `Return`, `Payments`, `Warranty`, `Status of my order`
  - scenario data strategy: parameterized/dataset-driven option selection inside one scenario
  - user steps:
    - open contact page
    - select each supported subject option
  - expected visible outcome: each supported option is selectable and reflected in the control
  - unique UI risk: broken subject dropdown or incorrect option mapping
  - why API/schema is not sufficient: option visibility/selectability is browser behavior
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers:
    - `selectSubject(label)`
    - `selectedSubject()` reader
  - Component Object decision: not needed initially
  - locator discovery notes: subject control uses `data-test="subject"`
  - assertions in spec:
    - option exists and can be selected
  - not covered in UI: backend persistence for every subject value

- scenario: successful plain submit confirmation
  - route/page: `/contact`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@smoke`, `@contact`
  - preconditions: guest user on contact page
  - test data:
    - valid first name, last name, email, subject, message (>= 50 chars)
  - scenario data strategy:
    - contact form builder with valid defaults
    - unique email suffix optional for traceability
  - user steps:
    - open contact page
    - fill required fields
    - submit form
  - expected visible outcome:
    - success alert `Thanks for your message! We will contact you shortly.`
  - unique UI risk: backend success not reflected to user
  - why API/schema is not sufficient: only UI proves visible confirmation after submit
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers:
    - fill form helpers
    - `submit()`
    - success alert reader
  - Component Object decision: not needed initially
  - locator discovery notes:
    - observed API payload combines first/last name into `name`
    - observed subject mapping example: `Customer service` -> `customer-service`
  - assertions in spec:
    - success alert visible
    - form remains on contact route unless product redirects elsewhere
  - not covered in UI: full response schema validation

- scenario: successful submit with valid empty `.txt` attachment
  - route/page: `/contact`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@regression`, `@contact`
  - preconditions: guest user on contact page
  - test data:
    - valid form payload
    - upload file `src/test/assets/files/contact-empty-attachment.txt`
  - scenario data strategy:
    - reuse contact form builder
    - keep attachment path centralized in test asset helper or dataset constant
  - user steps:
    - open contact page
    - fill required fields
    - upload valid empty `.txt` file
    - submit form
  - expected visible outcome:
    - success alert `Thanks for your message! We will contact you shortly.`
  - unique UI risk: optional attachment path breaks otherwise valid submit
  - why API/schema is not sufficient: file input and upload UX are browser-only risks
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers:
    - `uploadAttachment(filePath)`
    - success alert reader
  - Component Object decision: not needed initially
  - locator discovery notes: attachment control uses `data-test="attachment"`
  - assertions in spec:
    - upload succeeds without blocking submit
    - success confirmation visible
  - not covered in UI: attach endpoint response schema

- scenario: invalid attachment visible rejection feedback
  - route/page: `/contact`
  - UI/application Feature Target: `UI_BASE_URL`
  - setup/cleanup Feature Target (if needed): none
  - env names (from project map): `UI_BASE_URL`
  - tags: `@ui`, `@regression`, `@contact`
  - preconditions: otherwise valid form
  - test data:
    - one invalid non-`.txt` file
    - one invalid non-zero-byte `.txt` file generated in test setup
  - scenario data strategy: table-driven invalid upload cases
  - user steps:
    - open contact page
    - fill valid fields
    - attempt invalid upload and submit or observe immediate upload validation
  - expected visible outcome: user-visible rejection feedback for invalid attachment
  - unique UI risk: invalid files appear accepted or fail without clear feedback
  - why API/schema is not sufficient: upload control behavior and immediate UI feedback are browser-facing
  - recommended Page Object: `ContactPage`
  - Page Object actions/readers:
    - `uploadAttachment(filePath)`
    - attachment error reader
  - Component Object decision: not needed initially
  - locator discovery notes: pin exact UI error text during implementation
  - assertions in spec:
    - invalid upload feedback visible
    - success confirmation absent for rejected case
  - not covered in UI: full backend attach error matrix

## Cross-Browser Coverage

If not needed:

- reason no extra cross-browser coverage is required:
  - no documented browser-specific contact-form defect or interaction risk in current scope
  - default `ui-chromium` coverage is sufficient for initial implementation

## Responsive Coverage

If not needed:

- reason no extra responsive coverage is required:
  - no explicit viewport-specific contact-form requirement in this request
  - responsive expansion should be added only when a documented viewport/layout risk exists

## E2E Note

Potential E2E journey candidate:
- none for current scope

Reason:
- contact submit is a focused single-page form flow already covered by API and UI layers
- no additional multi-page or persisted-state journey value requires a separate E2E plan in this feature scope

Important:
- do not implement E2E from this feature plan

## Visual Checkpoints

Planned now:

- none

Postponed:

- target UI state: default contact form state
  - reason postponed: visual baseline approval was not requested
- target UI state: required-field validation state
  - reason postponed: visual baseline approval was not requested
- target UI state: success confirmation state
  - reason postponed: visual baseline approval was not requested
- target UI state: attachment validation state
  - reason postponed: visual baseline approval was not requested

## Schema / Contract Checks

Planned now:

- checks:
  - contact create `200` response shape validation (`id`, `name`, `email`, `subject`, `message`, `status`, `created_at`)
  - optional small schema for attach-file `{ success: boolean }`
- reason:
  - live create response is contract-critical and reused across API tests
  - OpenAPI create response documentation appears stale relative to live behavior
- dependencies:
  - Zod schema under `src/test/schemas/api/contact.schema.ts`
  - shared schema assertion helper under `src/test/assertions/api/`

Postponed:

- checks:
  - strict schema validation for all contact `422`/`400` error bodies
- reason postponed:
  - negative error schemas are not clearly defined in OpenAPI for all contact endpoints

## Not Automated / Blockers

- authenticated contact submit and admin message management are out of scope
- email delivery/inbox verification is not automated (external dependency)
- strict negative error-body schema checks are postponed (contract gap)
- API missing guest `email`/`name` rejection is not automated because live behavior currently accepts missing values with `200` despite OpenAPI wording; treat as contract drift, not a guessed assertion
- `@contact` tag must be registered in the project map before implementation if not already present
- visual baselines require explicit approval before implementation

## Recommended Next Commands

- update project map to register `@contact` domain tag if implementation will start soon
- `/create-test-data-builder` (contact form builder for reusable valid/invalid form data)
- `/create-page-object` (Contact page)
- `/implement-api-batch` (ready contact API coverage)
- `/implement-ui-batch` (ready contact UI coverage)
- `/implement-visual-checkpoint` (only after explicit baseline approval)
