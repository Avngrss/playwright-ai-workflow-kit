# Forgot Password UI Test Plan (Playwright TypeScript, POM-ready)

## Scope

- Application: `https://practicesoftwaretesting.com/`
- Entry point: home page -> `Sign in` -> `Forgot your password?`
- Forgot password URL: `https://practicesoftwaretesting.com/auth/forgot-password`
- Goal: validate forgot-password request flow with stable UI selectors and deterministic assertions.

## Verified Locators (live UI check)

### Navigation

- Sign in nav link: `[data-test="nav-sign-in"]`
- Forgot password link on login page: `[data-test="forgot-password-link"]`

### Forgot Password Form

- Form container: `[data-test="forgot-password-form"]`
- Email input: `[data-test="email"]`
- Submit button: `[data-test="forgot-password-submit"]`
- Field validation block: `[data-test="email-error"]` (required validation text)
- Server feedback alert: `getByRole("alert")`

## Observed Message Behavior (important for assertions)

- Empty/blank email submit: `[data-test="email-error"]` -> `Email is required`
- Invalid email format (e.g. `invalid-email`): browser native email validation message appears on input; `email-error` text stays empty
- Registered email submit: role `alert` appears with text `page.forgot-password.confirm` in current environment
- Unknown email submit: role `alert` appears with text `The selected email is invalid.`

## Required Test Architecture

- Keep one suite for forgot-password flow in a UI spec under `tests/ui/**`.
- Use `test.beforeEach` only for safe navigation and page-loaded checks.
- Keep assertions in spec files only.
- Use `test.step` for every test.
- Prefer `getByTestId` for `data-test` selectors.

## Required Page Objects / Fixture Updates

1. `src/test/pages/ForgotPasswordPage.ts` (new)
   - Locators:
     - `forgotPasswordForm`
     - `emailInput`
     - `submitButton`
     - `emailError`
     - `feedbackAlert` (role alert)
   - Actions:
     - `fillEmail(email: string)`
     - `submit()`
     - `requestReset(email: string)` (fill + submit)

2. `src/test/pages/LoginPage.ts` (extend only if needed)
   - Ensure an action exists to open forgot-password page (`openForgotPassword()`).

3. `src/test/fixtures/ui.fixture.ts` (extend)
   - Add `forgotPasswordPage` fixture wired from Playwright `page`.

## Scenario Set

### Happy Path

#### FP-P1 - Request password reset with registered email

- Preconditions:
  - User is logged out.
  - User is on `/auth/forgot-password`.
- Steps:
  1. Enter known registered email in `[data-test="email"]`.
  2. Click `[data-test="forgot-password-submit"]`.
- Expected:
  - Stay on `/auth/forgot-password`.
  - Role alert is visible.
  - Alert text equals `page.forgot-password.confirm` (current env behavior).
  - No `email-error` required message is shown.

#### FP-P2 - Registered email with leading/trailing spaces is normalized

- Preconditions:
  - User is on `/auth/forgot-password`.
- Steps:
  1. Enter email with spaces around value (e.g. `  customer@practicesoftwaretesting.com  `).
  2. Submit forgot-password form.
- Expected:
  - Request is accepted (same success alert behavior as FP-P1).
  - Input value is trimmed by the UI before/at submit.

### Negative Cases

#### FP-N1 - Unknown email shows backend validation error

- Preconditions:
  - User is on `/auth/forgot-password`.
- Steps:
  1. Enter unknown but valid-format email.
  2. Submit form.
- Expected:
  - Stay on `/auth/forgot-password`.
  - Role alert is visible with text `The selected email is invalid.`
  - User is not redirected to account/authenticated area.

### Validation Cases

#### FP-V1 - Submit with empty email

- Preconditions:
  - User is on `/auth/forgot-password`.
- Steps:
  1. Click submit without entering email.
- Expected:
  - `[data-test="email-error"]` visible with `Email is required`.
  - No success alert shown.
  - URL remains `/auth/forgot-password`.

#### FP-V2 - Submit with spaces-only email

- Preconditions:
  - User is on `/auth/forgot-password`.
- Steps:
  1. Enter only spaces in email field.
  2. Submit form.
- Expected:
  - `[data-test="email-error"]` visible with `Email is required`.
  - No success alert shown.

#### FP-V3 - Invalid email format is blocked by browser validation

- Preconditions:
  - User is on `/auth/forgot-password`.
- Steps:
  1. Enter malformed email (e.g. `invalid-email`).
  2. Submit form.
- Expected:
  - Input reports native validation error (`validationMessage` contains missing `@` semantics).
  - URL remains `/auth/forgot-password`.
  - No success alert shown.

### Navigation / Edge Cases

#### FP-NV1 - Navigate from login page to forgot-password page

- Preconditions:
  - User is on `/auth/login`.
- Steps:
  1. Click `[data-test="forgot-password-link"]`.
- Expected:
  - URL changes to `/auth/forgot-password`.
  - Forgot-password form is visible.

#### FP-E1 - Re-submit after success does not create duplicate alerts

- Preconditions:
  - User is on `/auth/forgot-password`.
- Steps:
  1. Submit valid registered email.
  2. Click submit again.
- Expected:
  - Only one alert instance remains visible.
  - Flow stays stable (no redirect/crash).

## Execution Notes

- Keep scenarios isolated and order-independent.
- Assert only stable, flow-relevant outcomes (URL, validation block, role alert).
- Because feedback text appears environment-localized/implementation-specific (`page.forgot-password.confirm`), keep one assertion that validates current production behavior and revisit if i18n rendering changes.
- Use test data module(s) for known registered email where available; avoid hardcoding credentials in specs.
