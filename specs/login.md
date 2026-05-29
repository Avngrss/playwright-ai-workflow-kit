# Login and Signup UI Test Plan

Target plan file: `specs/login.md`

## Feature Scope
- Validate login and signup entry behavior at `https://automationexercise.com/login`.
- Cover visible login form and signup form controls, required-field and email-format validation, and UI-observable success/error outcomes.
- Cover signup transition to the account-information step (`ENTER ACCOUNT INFORMATION`) and login success state (`Logged in as username`) as user-visible outcomes.
- UI-only coverage for now.

## Out of Scope
- API-level authentication checks.
- Backend user persistence and database validation.
- Password policy/security testing beyond UI-observable behavior.
- Non-functional testing (performance, security scanning, accessibility audits).

## Observable UI Contract (Evidence-Based)
- Page title/area: `Signup / Login`.
- Login section header: `Login to your account`.
- Signup section header: `New User Signup!`.
- Login form controls:
  - `input[data-qa="login-email"]` (`type="email"`, `required`, placeholder `Email Address`)
  - `input[data-qa="login-password"]` (`type="password"`, `required`, placeholder `Password`)
  - `button[data-qa="login-button"]` with text `Login`
- Signup entry controls:
  - `input[data-qa="signup-name"]` (`type="text"`, `required`, placeholder `Name`)
  - `input[data-qa="signup-email"]` (`type="email"`, `required`, placeholder `Email Address`)
  - `button[data-qa="signup-button"]` with text `Signup`
- Documented UI outcomes from official test cases:
  - Invalid login: `Your email or password is incorrect!`
  - Existing signup email: `Email Address already exist!`
  - New signup progression: `ENTER ACCOUNT INFORMATION`
  - Successful login state: `Logged in as username`

## Scenarios

### LG-001 - Login and Signup sections render correctly
- Priority: smoke
- Tags: `@ui`, `@smoke`
- Preconditions:
  - Open `https://automationexercise.com/login`.
- Test data: none
- Steps:
  1. Open login page.
  2. Verify `Login to your account` section is visible.
  3. Verify login email/password inputs and `Login` button are visible.
  4. Verify `New User Signup!` section is visible.
  5. Verify signup name/email inputs and `Signup` button are visible.
- Expected result:
  - Both forms render and are interactable.
- Notes/assumptions:
  - Transient overlays should not block base form visibility checks.

### LG-002 - Login succeeds with valid existing user credentials
- Priority: smoke
- Tags: `@ui`, `@smoke`
- Preconditions:
  - Existing active user is available in test data.
  - User is logged out before test starts.
- Test data:
  - `existingUser.email`
  - `existingUser.password`
- Steps:
  1. Open login page.
  2. Fill valid email and password.
  3. Click `Login`.
- Expected result:
  - User is authenticated and `Logged in as username` is visible.
- Notes/assumptions:
  - Account cleanup strategy is handled by suite setup/teardown rules.

### LG-003 - Signup entry with unique email navigates to account information step
- Priority: smoke
- Tags: `@ui`, `@smoke`
- Preconditions:
  - A unique, unused signup email is prepared.
- Test data:
  - `signupCandidate.name`
  - `signupCandidate.uniqueEmail`
- Steps:
  1. Open login page.
  2. Fill signup name and unique email.
  3. Click `Signup`.
- Expected result:
  - User is navigated to step showing `ENTER ACCOUNT INFORMATION`.
- Notes/assumptions:
  - This scenario validates signup entry transition only.

### LG-004 - Login fails with incorrect credentials
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Login page is open.
- Test data:
  - `invalidUser.email`
  - `invalidUser.password`
- Steps:
  1. Fill incorrect login email/password.
  2. Click `Login`.
- Expected result:
  - Error `Your email or password is incorrect!` is shown.
  - User remains unauthenticated.
- Notes/assumptions:
  - Exact error string follows official test case expectation.

### LG-005 - Signup fails for already registered email
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Existing registered email is available in test data.
- Test data:
  - `signupCandidate.name`
  - `existingUser.email`
- Steps:
  1. Fill signup name and already registered email.
  2. Click `Signup`.
- Expected result:
  - Error `Email Address already exist!` is shown.
  - User remains on signup entry form.
- Notes/assumptions:
  - Existing email account is stable in target environment.

### LG-006 - Login form required-field validation blocks empty submit
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Login page is open.
- Test data: none
- Steps:
  1. Leave login email and/or password empty.
  2. Click `Login`.
- Expected result:
  - Native browser required validation blocks form submission.
  - No authenticated state appears.
- Notes/assumptions:
  - Browser-native validation message text is locale-dependent; assert blocked submit behavior, not exact bubble text.

### LG-007 - Signup form required-field validation blocks empty submit
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Login page is open.
- Test data: none
- Steps:
  1. Leave signup name and/or email empty.
  2. Click `Signup`.
- Expected result:
  - Native browser required validation blocks form submission.
  - `ENTER ACCOUNT INFORMATION` is not shown.
- Notes/assumptions:
  - Validate behavior, not browser-specific validation tooltip text.

### LG-008 - Login email field rejects invalid email format
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Login page is open.
- Test data:
  - Invalid email format (example: `invalid-email`).
  - Any non-empty password.
- Steps:
  1. Fill invalid email format and password.
  2. Click `Login`.
- Expected result:
  - Native email format validation blocks submission.
  - No login error from backend is shown because submit is blocked client-side.
- Notes/assumptions:
  - Assert invalid field state / blocked submission only.

### LG-009 - Signup email field rejects invalid email format
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Login page is open.
- Test data:
  - Name value.
  - Invalid email format (example: `invalid-email`).
- Steps:
  1. Fill signup name and invalid email format.
  2. Click `Signup`.
- Expected result:
  - Native email format validation blocks submission.
  - `ENTER ACCOUNT INFORMATION` is not shown.
- Notes/assumptions:
  - Browser-specific validation bubble text is not asserted.

### LG-010 - Email input edge case with leading/trailing spaces
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Login page is open.
- Test data:
  - Valid existing email padded with spaces (`"  user@example.com  "`).
  - Correct password.
- Steps:
  1. Fill login form with whitespace-padded email.
  2. Click `Login`.
- Expected result:
  - Behavior is captured explicitly (either successful trim-and-login or rejection).
- Notes/assumptions:
  - Mark as exploratory edge assertion until product requirement is confirmed.

## Required Test Data Summary
- Existing user credentials dataset:
  - valid email/password for successful login.
- Existing registered email dataset:
  - used for duplicate-signup negative scenario.
- Unique signup candidate:
  - name and unique email for signup transition scenario.
- Invalid credential dataset:
  - invalid email/password pair.
- Invalid email format samples:
  - for login and signup format validation.

## Candidate Page Objects (for later implementation)
- `LoginPage`
  - Owns `/login` route and both login/signup entry forms.
- `SignupAccountInfoPage`
  - Owns `ENTER ACCOUNT INFORMATION` step verification after signup entry.
- `HeaderNavigationPage` (reuse if already present later)
  - For `Logged in as username` state verification.

## Candidate Component Objects (for later implementation)
- `LoginFormComponent` (optional)
  - Justified only if login interactions are reused across suites.
- `SignupEntryFormComponent` (optional)
  - Justified only if signup-entry interactions are reused across suites.
- Default recommendation now: keep controls in `LoginPage` until reuse/complexity grows.

## Risks and Unknowns
- Playwright MCP browser tools are configured in repo but not exposed in this session; plan evidence came from live page content and observable markup, plus official test-case expectations.
- Successful login and duplicate-signup scenarios require stable seeded users.
- Signup full-flow account creation and cleanup may be environment-sensitive.
- Third-party overlays can intermittently affect clicks/navigation.
- Browser-native validation rendering varies by browser/locale.

## Recommended First Implementation Batch (3-5 Scenarios)
1. `LG-001` (smoke): page and dual-form rendering baseline.
2. `LG-002` (smoke): successful login with existing credentials.
3. `LG-003` (smoke): signup entry to `ENTER ACCOUNT INFORMATION`.
4. `LG-004` (regression): incorrect login error handling.
5. `LG-006` (regression): required-field validation for login.

## Source References
- [Automation Exercise Login page](https://automationexercise.com/login)
- [Automation Exercise Test Cases](https://automationexercise.com/test_cases)
