# User Onboarding E2E Journey

## Goal

Verify that an anonymous user can complete onboarding by registering, logging in, and reaching the authenticated account area.

## Journey Summary

A new disposable user account is created through the registration UI, then the same user signs in through the login UI and lands on the account page.

## Business Value

This journey proves the core acquisition-to-authenticated-access path works end-to-end across multiple pages and state transitions, not just as isolated UI checks.

## E2E Boundary

Covered by E2E:
- registration through UI;
- login through UI with the newly created credentials;
- final authenticated account/dashboard-visible outcome.

Not covered by E2E:
- registration and login API contract/schema validation (covered by feature-level API/schema plans);
- detailed field-level validation matrices and error-state permutations (covered by feature-level UI plans);
- visual checkpoint coverage.

## Entry Point

Anonymous user at the registration page with no authenticated session.

## Expected Outcome

User reaches authenticated account area and sees account page marker after completing registration and login.

## Data Strategy

Use disposable/generated user data (unique email and password) to keep isolation and avoid shared-state conflicts.

## Setup / Preconditions

No API shortcut for core business actions. Registration and login must remain UI actions in the journey.

No pre-created authenticated state is allowed for this flow.

API may be used only for optional environment sanity checks, never to replace registration or login journey steps.

## Cleanup Strategy

Prefer isolated disposable users that do not require destructive cleanup.

If cleanup is needed later, API cleanup may be used when available and safe, but it is not required when disposable data is accepted by environment policy.

## External Dependencies And Blockers

Current blocker status: not blocked.

Conditional blocker:
- if environment requires external mailbox/email confirmation or another unstable third-party dependency to complete registration, mark this journey blocked and temporarily prefer an existing-user login-to-account E2E path.

## Implementation Target

Test location:
- tests/e2e/auth/user-onboarding.e2e.spec.ts

Tags:
- @e2e
- @regression

## Implementation Notes

Status:
- ready to implement now

Implementation constraints:
- keep business actions in UI (register + login);
- API may be used only for setup/preconditions/cleanup;
- do not convert short UI checks into E2E;
- during implementation, include required execution-scope tag with @e2e (for example @regression).
