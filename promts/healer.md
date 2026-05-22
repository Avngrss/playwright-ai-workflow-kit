Use the Playwright healer agent.

FILES:
@tests/ui/<path>/<spec>.spec.ts
(optional) @src/test/pages/<Page>.ts
(optional) @src/test/fixtures/<fixture>.ts
@.cursor/rules/20-ui-architecture.mdc

PROBLEM:
The test "<test name>" is failing.
Observed symptom:
- <paste error message / stack trace>
- Expected: <expected behavior>
- Actual: <actual behavior>

TASK:
Find the root cause and fix the test with minimal changes.

HARD CONSTRAINTS:
- Do NOT use waitForTimeout.
- Do NOT blindly increase timeouts or retries.
- Do NOT change expected behavior unless the spec/requirements are wrong.
- Keep assertions in spec files only (no expect in Page Objects).
- Keep test.step structure.
- Keep beforeEach safe: no "action under test" inside beforeEach.
- Prefer fixing locators/waits/flow at the correct level (Page Object vs spec).

REQUIRED APPROACH:
1) Identify the failing step and classify the failure:
   locator issue / timing issue / navigation issue / data issue / environment issue.
2) Explain the root cause in 2-5 bullet points.
3) Apply a minimal fix and show the diff.
4) Provide the exact command to re-run only this spec.
5) Re-run until it passes.

STOP CONDITIONS:
If the app behavior changed (not a test bug), stop and explain what changed instead of forcing the test to pass.


Use Playwright healer agent.

SCOPE: Fix failing UI test without masking real issues.

INPUTS:
@tests/ui/<path>/<suite>.ui.spec.ts
@.cursor/rules/20-ui-architecture.mdc

CONSTRAINTS:
- no waitForTimeout
- no blind timeout/retry increases
- do not change expected behavior unless spec is wrong
- keep expect in specs only; keep test.step
- minimal diff, explain root cause

VERIFY:
npx playwright test tests/ui/<path>/<suite>.ui.spec.ts
