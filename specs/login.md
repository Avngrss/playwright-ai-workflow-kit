# Login UI Test Plan (Playwright TypeScript, POM-ready)

## Scope

- Application: `https://practicesoftwaretesting.com/`
- Entry point: `https://practicesoftwaretesting.com/` -> `Sign in`
- Login page URL: `https://practicesoftwaretesting.com/auth/login`
- Goal: Validate login UI flow with stable selectors verified from the live app.

## Verified Locators (observed via Playwright MCP)

### Header / Navigation

- Sign in nav link: `[data-test="nav-sign-in"]`
- Authenticated user menu button: `[data-test="nav-menu"]`
- Sign out action: `[data-test="nav-sign-out"]`
- Mobile nav toggle: `getByRole('button', { name: 'Toggle navigation' })`

### Login Form

- Form container: `[data-test="login-form"]`
- Email input: `[data-test="email"]`
- Password input: `[data-test="password"]`
- Submit/Login button: `[data-test="login-submit"]`
- Register link: `[data-test="register-link"]`
- Forgot password link: `[data-test="forgot-password-link"]`
- Social button: `getByRole('button', { name: 'Sign in with Google' })`

### Error and Validation Blocks

- Email validation block: `[data-test="email-error"]` (text varies, e.g. `Email is required`, `Email format is invalid`)
- Password validation block: `[data-test="password-error"]` (e.g. `Password is required`)
- Authentication error block: `[data-test="login-error"]` (text: `Invalid email or password`, class `alert alert-danger`, `aria-live="assertive"`)

### Verified Post-login Signal

- URL after successful login: `https://practicesoftwaretesting.com/account`
- Account page heading: `getByRole('heading', { name: 'My account' })`

## Reusable Component Candidates (for future POM structure)

1. Header component
   - Responsibilities: navigate to login, open user menu, sign out.
   - Core selectors: `nav-sign-in`, `nav-menu`, `nav-sign-out`, toggle navigation button.

2. Login form component
   - Responsibilities: fill credentials, submit, navigate to register/forgot-password.
   - Core selectors: `login-form`, `email`, `password`, `login-submit`, links.

3. Error message block component
   - Responsibilities: read field and auth-level errors, assert text and visibility.
   - Core selectors: `email-error`, `password-error`, `login-error`.

4. Toast component (candidate, not detected on login page during this exploration)
   - Detection query used: `[data-test*="toast" i], .toast, [class*="toast" i]`
   - Result on login page: not present.

5. Modal component (candidate, not detected on login page during this exploration)
   - Detection query used: `[role="dialog"], [aria-modal="true"], .modal, [class*="modal" i], [data-test*="modal" i]`
   - Result on login page: not present.

## POM Architecture Notes (for generated tests)

- Use Playwright TypeScript with at least:
  - `HeaderComponent`
  - `LoginPage`
  - `ErrorAlertComponent`
- Keep scenarios independent:
  - Start from logged-out state.
  - If session exists, sign out through `HeaderComponent` before each scenario.
- Centralize test data:
  - Valid credentials via fixture/env, plus known invalid datasets.

## Scenario Set

### Positive Scenarios

#### P1 - Login with valid credentials

- Type: Positive
- Start state: user is logged out on `/auth/login`.
- Test data: valid user credential pair.
- Steps:
  1. Open home page.
  2. Navigate via header sign-in link.
  3. Enter valid email in `[data-test="email"]`.
  4. Enter valid password in `[data-test="password"]`.
  5. Submit using `[data-test="login-submit"]`.
- Expected:
  - User is redirected to `/account`.
  - `My account` heading is visible.
  - Header shows authenticated menu (`[data-test="nav-menu"]`) and sign-in link is no longer primary action.

#### P2 - Sign out after successful login (state reset check)

- Type: Positive
- Start state: authenticated user on `/account` (or any authenticated page).
- Steps:
  1. Open user menu `[data-test="nav-menu"]`.
  2. Click `[data-test="nav-sign-out"]`.
- Expected:
  - User is returned to login page (`/auth/login`) in this environment.
  - Login form is visible (`[data-test="login-form"]`).

### Negative Scenarios

#### N1 - Valid email format + wrong password

- Type: Negative (authentication failure)
- Start state: logged out on `/auth/login`.
- Steps:
  1. Enter valid-format email in `[data-test="email"]`.
  2. Enter incorrect password in `[data-test="password"]`.
  3. Submit.
- Expected:
  - Stay on `/auth/login`.
  - Auth error block `[data-test="login-error"]` appears with text `Invalid email or password`.
  - User is not redirected to `/account`.

#### N2 - Unknown user with valid-format email

- Type: Negative (authentication failure)
- Start state: logged out on `/auth/login`.
- Steps:
  1. Enter non-existing but valid-format email.
  2. Enter any password.
  3. Submit.
- Expected:
  - Same error behavior as N1 (`[data-test="login-error"]` visible).
  - No authenticated header state appears.

### Validation Scenarios

#### V1 - Submit empty form

- Type: Validation
- Start state: logged out on `/auth/login`, both fields empty.
- Steps:
  1. Click `[data-test="login-submit"]` with no input.
- Expected:
  - `[data-test="email-error"]` visible with `Email is required`.
  - `[data-test="password-error"]` visible with `Password is required`.
  - No navigation away from login page.

#### V2 - Invalid email format

- Type: Validation
- Start state: logged out on `/auth/login`.
- Steps:
  1. Enter invalid email format in `[data-test="email"]` (for example, no `@`).
  2. Enter any non-empty password.
  3. Submit.
- Expected:
  - `[data-test="email-error"]` visible with `Email format is invalid`.
  - No redirect to `/account`.

#### V3 - Missing password only

- Type: Validation
- Start state: logged out on `/auth/login`.
- Steps:
  1. Enter valid email in `[data-test="email"]`.
  2. Leave password empty.
  3. Submit.
- Expected:
  - `[data-test="password-error"]` visible with `Password is required`.
  - No auth call success / no redirect.

#### V4 - Missing email only

- Type: Validation
- Start state: logged out on `/auth/login`.
- Steps:
  1. Leave email empty.
  2. Enter any password in `[data-test="password"]`.
  3. Submit.
- Expected:
  - `[data-test="email-error"]` visible with `Email is required`.
  - No redirect.

### Navigation Scenarios Related to Login UI

#### NV1 - Register link from login page

- Type: Navigation
- Start state: logged out on `/auth/login`.
- Steps:
  1. Click `[data-test="register-link"]`.
- Expected:
  - Navigate to `/auth/register`.

#### NV2 - Forgot password link from login page

- Type: Navigation
- Start state: logged out on `/auth/login`.
- Steps:
  1. Click `[data-test="forgot-password-link"]`.
- Expected:
  - Navigate to `/auth/forgot-password`.

## Execution Notes

- Keep each scenario isolated and runnable in any order.
- Use dedicated test data per scenario to avoid account lock/rate-limit side effects.
- Prefer `data-test` selectors first; use role/name only as fallback where no `data-test` exists.
- Do not couple assertions to cosmetic content outside the login flow.
