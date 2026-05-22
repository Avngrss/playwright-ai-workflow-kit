# Registration UI Test Plan (Playwright TypeScript, POM-ready)

## Scope

- Application: `https://practicesoftwaretesting.com/`
- Entry point: home page -> `Sign in` -> `Register your account`
- Registration URL: `https://practicesoftwaretesting.com/auth/register`
- Goal: validate customer registration flow end-to-end at UI level with stable selectors and deterministic checks.

## Verified Locators (observed on live app)

### Navigation

- Sign in nav link: `[data-test="nav-sign-in"]`
- Register link on login page: `[data-test="register-link"]`

### Registration Form

- Form container: `[data-test="register-form"]`
- Submit button: `[data-test="register-submit"]`
- First name: `[data-test="first-name"]`
- Last name: `[data-test="last-name"]`
- Date of birth: `[data-test="dob"]`
- Street: `[data-test="street"]`
- House number: `[data-test="house_number"]`
- Postcode: `[data-test="postal_code"]`
- City: `[data-test="city"]`
- State: `[data-test="state"]`
- Country select: `[data-test="country"]`
- Phone: `[data-test="phone"]`
- Email: `[data-test="email"]`
- Password: `[data-test="password"]`

### Error / Feedback Blocks

- Field errors (examples):
  - `[data-test="first-name-error"]` -> `First name is required`
  - `[data-test="email-error"]` -> `Email is required`
  - `[data-test="password-error"]` -> includes password rule messages
- Registration-level backend error:
  - `[data-test="register-error"]` -> `A customer with this email address already exists.`
- Generic alert region:
  - `getByRole("alert")` (used for some validation/server responses)

## Observed Runtime Behavior (important for assertions)

- Empty submit shows visible field error blocks for required fields.
- Duplicate email submit keeps user on `/auth/register` and shows `[data-test="register-error"]`.
- Successful registration redirects to `/auth/login`.
- Country field is a `<select>`; use select interactions (not text fill).
- Phone field rejects non-numeric symbols in server-side validation (`Only numbers are allowed.`).
- Password rules are strict; a known-valid example observed in live checks: `aA1#2345`.

## Required Test Architecture

- UI-only tests (no API registration shortcuts).
- Use `test.step` in every scenario.
- Keep assertions in spec files only.
- `beforeEach` only does safe navigation + page loaded checks.
- Use `getByTestId` for `data-test` selectors.
- Isolate navigation-path tests into a dedicated `describe` block to avoid setup duplication.

## Required Page Objects / Fixture Updates

1. `src/test/pages/RegistrationPage.ts` (new)
   - Locators:
     - `registerForm`, `registerSubmitButton`
     - all registration inputs/select
     - `registerError`
     - key field errors (at least `emailError`, `passwordError`, `firstNameError`)
   - Actions:
     - `fillRequiredFields(data)`
     - `selectCountryByIndex(index)` or `selectCountryByLabel(label)`
     - `submit()`
     - `register(data)` (fill + submit)
   - Helpers:
     - `getInputValue(field)`
     - `getNativeValidationMessage(field)` (for browser-level checks if needed)

2. `src/test/pages/LoginPage.ts` (extend only if needed)
   - Ensure `openRegister()` is available for navigation.

3. `src/test/fixtures/ui.fixture.ts` (extend)
   - Add `registrationPage` fixture.

## Test Data Strategy

- Use unique email per run to avoid collisions:
  - format: `qa+<timestamp>@example.com`
- Keep one duplicate-email scenario that intentionally reuses an email created earlier in the same test.
- For positive flow, use known-valid password format observed on live app: `aA1#2345`.

## Scenario Set

### Happy Path

#### R-P1 - Register successfully with valid required data

- Preconditions:
  - User is logged out.
  - User is on `/auth/register`.
- Steps:
  1. Fill all required fields with valid values.
  2. Select a valid country option.
  3. Submit registration form.
- Expected:
  - User is redirected to `/auth/login`.
  - No registration error block is visible.

#### R-P2 - Register with trimmed values for text fields

- Preconditions:
  - User is on `/auth/register`.
- Steps:
  1. Enter leading/trailing spaces for text inputs (first name, last name, street, city).
  2. Fill remaining required fields with valid values.
  3. Submit.
- Expected:
  - Registration succeeds (redirect to `/auth/login`), or
  - fields are normalized and accepted with no field-level required errors.

### Negative Cases

#### R-N1 - Duplicate email is rejected

- Preconditions:
  - User is on `/auth/register`.
  - A customer already exists with target email (create one in test setup steps of this scenario).
- Steps:
  1. Submit registration with an email already used by an existing customer.
- Expected:
  - User stays on `/auth/register`.
  - `[data-test="register-error"]` visible with `A customer with this email address already exists.`
  - No redirect to login/account.

#### R-N2 - Non-numeric phone is rejected

- Preconditions:
  - User is on `/auth/register`.
- Steps:
  1. Fill all required fields validly except phone includes symbols (e.g. `+1234567890`).
  2. Submit.
- Expected:
  - User stays on `/auth/register`.
  - Alert/error indicates numeric-only phone constraint (`Only numbers are allowed.`).

### Validation Cases

#### R-V1 - Submit empty form

- Preconditions:
  - User is on `/auth/register`.
- Steps:
  1. Click submit without entering data.
- Expected:
  - Required field errors are visible (e.g. first name, last name, dob, country, postcode, house number, street, city, state, phone, email, password).
  - URL remains `/auth/register`.

#### R-V2 - Missing one required field (parameterized set)

- Preconditions:
  - User is on `/auth/register`.
- Steps:
  1. Fill all required fields except one target field (run for each required field in data-driven way).
  2. Submit.
- Expected:
  - Target field error is visible.
  - User remains on `/auth/register`.

#### R-V3 - Invalid email format

- Preconditions:
  - User is on `/auth/register`.
- Steps:
  1. Fill form with invalid email (e.g. `invalid-email`).
  2. Submit.
- Expected:
  - Email validation state is invalid (native and/or field error message, based on current app behavior).
  - No redirect to login.

#### R-V4 - Weak/invalid password format

- Preconditions:
  - User is on `/auth/register`.
- Steps:
  1. Fill form with password that violates rules (short, missing required classes, or invalid characters).
  2. Submit.
- Expected:
  - `[data-test="password-error"]` is visible and contains rule text.
  - No redirect to login.

### Navigation Cases

#### R-NV1 - Navigate from login page to registration page

- Preconditions:
  - User is on `/auth/login`.
- Steps:
  1. Click `[data-test="register-link"]`.
- Expected:
  - URL becomes `/auth/register`.
  - `[data-test="register-form"]` is visible.

#### R-NV2 - Registration page reachable from main sign-in path

- Preconditions:
  - User is on home page.
- Steps:
  1. Click `nav-sign-in`.
  2. Click `register-link`.
- Expected:
  - User reaches `/auth/register`.
  - Registration form is loaded and interactive.

### Edge / Stability Cases

#### R-E1 - Double submit does not create duplicate backend errors

- Preconditions:
  - User is on `/auth/register`.
- Steps:
  1. Submit invalid duplicate-email registration.
  2. Click submit again without changing data.
- Expected:
  - One stable registration-level error state is shown.
  - No UI crash, no unexpected redirect.

#### R-E2 - Country required enforcement

- Preconditions:
  - User is on `/auth/register`.
- Steps:
  1. Fill all required fields but keep country at default placeholder (`Your country *`).
  2. Submit.
- Expected:
  - Country required error (`[data-test="country-error"]`) is visible.
  - User remains on `/auth/register`.

## Suggested Suite Structure (for future generation)

1. `describe("Registration page", ...)`
   - `beforeEach`: home -> login -> register, plus page loaded checks
   - includes happy/validation/negative/edge scenarios starting from register page
2. `describe("Registration navigation", ...)`
   - isolated navigation-path checks where `beforeEach` does not already execute the navigation under test

## Execution Notes

- Keep tests isolated and order-independent.
- Use generated unique email in tests that create accounts.
- Avoid repeating page-loaded assertions in tests when already covered by `beforeEach`, except when validating stay-on-page or redirects.
- Keep assertions focused on user-visible behavior and stable selectors only.
