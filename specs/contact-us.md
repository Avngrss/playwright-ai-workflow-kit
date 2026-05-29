# Contact Us UI Test Plan

Target plan file: `specs/contact-us.md`

## Feature Scope
- Validate Contact Us page UI and Contact form behavior at `https://automationexercise.com/contact_us`.
- Cover visible form structure, field interaction, submit flow, confirm dialog behavior, success state, and post-submit navigation.
- Cover UI-observable validation and required-field behavior only.

## Out of Scope
- API-level checks and backend persistence.
- Email delivery/content verification.
- DB/state verification.
- Security/performance/non-UI concerns.
- Cross-browser visual differences not tied to functional UI behavior.

## Observable UI Contract (Evidence-Based)
- Page heading present: `Contact Us` and section heading `Get In Touch`.
- Form fields visible:
  - `input[name="name"]` with placeholder `Name`
  - `input[name="email"]` with placeholder `Email` and `required`
  - `input[name="subject"]` with placeholder `Subject`
  - `textarea[name="message"]` with placeholder `Your Message Here`
  - `input[name="upload_file"][type="file"]`
  - `input[name="submit"][type="submit"]` with value `Submit`
- Submit triggers confirm dialog with text `Press OK to proceed!`.
- On confirm OK, success message is shown: `Success! Your details have been submitted successfully.` and form area is replaced with `Home` button.
- No dedicated Reset button is visible on the form.

## Scenarios

### CU-001 - Contact Us page and form render
- Priority: smoke
- Tags: `@ui`, `@smoke`
- Preconditions:
  - Browser opens `https://automationexercise.com/contact_us`.
- Test data: none
- Steps:
  1. Open Contact Us page.
  2. Verify page heading and `Get In Touch` section are visible.
  3. Verify Name, Email, Subject, Message, File Upload, and Submit controls are visible.
- Expected result:
  - All required UI controls are rendered and interactable.
- Notes/assumptions:
  - UI ads/popups (if any) are non-blocking or handled by generic test setup.

### CU-002 - Successful submit with all fields and file (happy path)
- Priority: smoke
- Tags: `@ui`, `@smoke`
- Preconditions:
  - Contact form is visible.
- Test data:
  - name: `QA Contact`
  - email: `qa.contact@example.com`
  - subject: `Contact Form Test`
  - message: `Please confirm receipt.`
  - file: small local file (for example, `.txt`)
- Steps:
  1. Fill Name, Email, Subject, Message.
  2. Upload a file.
  3. Click Submit.
  4. Accept confirm dialog (`Press OK to proceed!`).
  5. Verify success message appears.
- Expected result:
  - Confirm dialog appears with expected text.
  - Success message is visible.
  - Form section changes to show `Home` button.
- Notes/assumptions:
  - File type restrictions are not visible in UI attributes.

### CU-003 - Home button navigation after successful submit
- Priority: smoke
- Tags: `@ui`, `@smoke`
- Preconditions:
  - Form submitted successfully and post-submit `Home` button is visible.
- Test data: none
- Steps:
  1. Click post-submit `Home` button.
- Expected result:
  - User lands on home page (`/`) and home page is visibly loaded.
- Notes/assumptions:
  - Home load can be validated by URL and prominent home content.

### CU-004 - Cancel confirm dialog keeps user on form
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Form is filled with valid values.
- Test data:
  - Valid email and minimal valid text in other fields.
- Steps:
  1. Fill form.
  2. Click Submit.
  3. Dismiss/cancel confirm dialog.
- Expected result:
  - Success message is not shown.
  - Form remains visible for further editing/submission.
- Notes/assumptions:
  - Based on observable submit handler behavior for cancel path.

### CU-005 - Required field validation: email empty
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Form is visible.
- Test data:
  - name/subject/message optionally filled; email empty.
- Steps:
  1. Leave Email field empty.
  2. Click Submit.
- Expected result:
  - Native browser required validation blocks submission.
  - Confirm dialog does not appear.
  - Success message is not shown.
- Notes/assumptions:
  - Validation message text is browser/locale-dependent, so assert behavior, not exact message string.

### CU-006 - Email format validation: invalid email value
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Form is visible.
- Test data:
  - email: `invalid-email`
- Steps:
  1. Fill email with invalid format.
  2. Click Submit.
- Expected result:
  - Native email format validation blocks submission.
  - Confirm dialog does not appear.
  - Success message is not shown.
- Notes/assumptions:
  - Native validation UI text is not asserted exactly.

### CU-007 - Submit without file upload
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Form visible with valid required data.
- Test data:
  - Valid Name/Email/Subject/Message, no file.
- Steps:
  1. Fill form except file input.
  2. Click Submit and accept confirm.
- Expected result:
  - Submit succeeds and success message appears.
- Notes/assumptions:
  - File upload appears optional (no required attribute observed).

### CU-008 - File input selection behavior
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Form visible.
- Test data:
  - One local file path.
- Steps:
  1. Upload file in file input.
  2. Verify selected file is reflected by input state (filename/value).
- Expected result:
  - File chooser accepts selection and field reflects selected file.
- Notes/assumptions:
  - Assertion should not depend on full absolute path formatting.

### CU-009 - Non-restricted file type upload acceptance (UI-level)
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Form visible.
- Test data:
  - Valid text file (for example, `.txt`) and valid required form fields.
- Steps:
  1. Upload `.txt` file.
  2. Submit form and accept confirm.
- Expected result:
  - UI allows selection and successful submission flow proceeds.
- Notes/assumptions:
  - No `accept` restriction observed in file input attributes.

### CU-010 - Boundary-like long message still submittable
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Form visible.
- Test data:
  - Long message string (for example, 1,000+ chars), valid email.
- Steps:
  1. Fill form with long message.
  2. Submit and accept confirm.
- Expected result:
  - UI accepts input and reaches success state.
- Notes/assumptions:
  - No max length is visibly defined for message field.

### CU-011 - Post-submit state replaces form controls
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Successful submit completed.
- Test data: none
- Steps:
  1. Observe form region after success.
- Expected result:
  - Form controls are replaced by `Home` button in form section.
  - Success message remains visible.
- Notes/assumptions:
  - Post-submit state is non-editable unless page is reloaded.

### CU-012 - No reset control is exposed in form UI
- Priority: regression
- Tags: `@ui`, `@regression`
- Preconditions:
  - Form visible before submit.
- Test data: none
- Steps:
  1. Inspect available action controls in form.
- Expected result:
  - Only Submit action is available; no explicit Reset button/control exists.
- Notes/assumptions:
  - Covers reset/post-submit requirement via observable absence plus post-submit replacement behavior.

## Required Test Data Summary
- Valid contact data set:
  - Name, Email, Subject, Message.
- Invalid/negative data set:
  - Empty email.
  - Invalid email format.
- Edge data set:
  - Long message string.
- File data set:
  - Small valid local file (`.txt` baseline).
  - Optional second extension sample if needed (`.png`/`.pdf`) for compatibility checks.

## Candidate Page Objects (for later implementation)
- `ContactUsPage`
  - Owns route-level behaviors and top-level headings.
- `HomePage`
  - Used only for post-submit navigation verification.

## Candidate Component Objects (for later implementation)
- `ContactUsFormComponent`
  - Encapsulates field interactions and submit action.
- `ContactUsSuccessPanelComponent`
  - Encapsulates success message and `Home` button state.

## Risks and Unknowns
- Playwright MCP was not exposed in the current session; UI behavior was derived from live page content and observable client-side script.
- Native HTML5 validation bubble text differs by browser/OS locale.
- Third-party overlays/popups may intermittently affect clickability.
- Backend outcome cannot be verified in UI-only scope.
- File upload server-side restrictions may exist but are not visible in UI attributes.

## Recommended First Implementation Batch (3-5 Scenarios)
1. `CU-001` (smoke): baseline UI rendering.
2. `CU-002` (smoke): end-to-end happy path with file, confirm, and success.
3. `CU-003` (smoke): post-submit Home navigation.
4. `CU-005` (regression): required email validation.
5. `CU-004` (regression): confirm cancel negative path.

## Source References
- [Contact Us page](https://automationexercise.com/contact_us)
- [Automation Exercise test cases](https://automationexercise.com/test_cases)
