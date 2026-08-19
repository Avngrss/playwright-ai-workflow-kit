# Skill: Run Verification

## Goal

Use this skill after implementation, healing, refactoring, framework changes, or project map updates to verify that changes work and do not break expected quality gates.

The goal is to run the smallest useful verification first, then broader checks when needed.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- Security and Sensitive Data Handling Rules;
- Project Map Rules;
- Temporary Debug Artifact Cleanup Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Core Playwright Rules;
- Examples Policy.

---

## When To Use

Use this skill after:

- UI test implementation;
- API test implementation;
- healing failing tests;
- fixture changes;
- Page Object or Component changes;
- builder or generator changes;
- API client changes;
- framework core changes;
- rule or skill changes;
- project map changes.

---

## Verification Order

Use this order:

1. impacted spec or targeted check;
2. related specs if shared code changed;
3. typecheck or lint if applicable;
4. repository quality gate from project map.

Do not start with the broadest command if a smaller targeted check is available.

---

## Workflow

### 1. Identify Changed Area

Classify change:

- UI spec;
- API spec;
- Page Object;
- Component Object;
- fixture;
- builder;
- generator;
- API client;
- config;
- framework core;
- rules;
- skills;
- project map.

---

### 2. Choose Targeted Verification

Choose the smallest check that validates the change.

Examples:

- impacted UI spec;
- impacted API spec;
- related suite;
- TypeScript check;
- lint;
- unit tests for reusable helpers only when the agent adds or changes non-trivial logic under `src/test/**` (not part of the clean starter baseline).

Use commands from project map.

Do not invent commands.

---

### 3. Choose Related Verification

If shared code changed, run related checks.

Shared code examples:

- fixture;
- Page Object used by many specs;
- Component Object used by many pages;
- builder used by multiple specs;
- auth provider;
- API client;
- config provider.

---

### 4. Run Quality Gate

Run the repository quality gate command defined by the project map.

If the project map defines `npm run qa:gate`, use it.

Static **security convention checks** are part of `qa:gate` (console patterns, hardcoded tokens, etc.).

If no quality gate exists, report that it is missing.

---

### 4A. Review Before Acceptance (default batch completion)

After `qa:gate` passes on an implementation or heal batch, run **Review Generated Code Quality** (`/review-generated`) on changed files unless the user explicitly skipped review.

That review includes **embedded security posture** (step 15A). Do not run `/audit-security` as a second mandatory step.

Skip review only when the user asked for verification-only or the change set is trivial and explicitly out of scope.

---

### 5. Cleanup Temporary Debug Artifacts

After verification, remove temporary discovery/debug files created during the task.

Rule reference:

- `.cursor/rules/temporary-debug-artifact-cleanup.rules.mdc`

Examples to remove:

- `scripts/debug-*.mjs`
- `scripts/discover-*.mjs`
- `discover-*-output.json`

Report removed files in the final summary.

Skip deletion only when the user explicitly asked to keep specific investigation files.

---

### 6. Report Results

Report:

- commands run;
- pass/fail result;
- failures;
- next recommended action.

If verification cannot be run, state:

- what should be run;
- why it was not run;
- risk of not running it.

---

## Guardrails

Do not:

- skip verification silently;
- claim tests passed without running them;
- invent commands;
- run unrelated expensive checks first;
- ignore failing targeted checks;
- proceed to broad checks if targeted check reveals clear failure needing fix;
- hide failures.

---

## Output Format

### Changed Area

- files changed:
- affected layer:
- shared code changed: yes or no:

### Verification Plan

- targeted command:
- related commands:
- quality gate command:

### Results

- targeted result:
- related result:
- quality gate result:

### Not Run

If any check was not run:

- command:
- reason:
- risk:

### Final Status

Use one:

- verified;
- partially verified;
- failed;
- not verified.

---

## Done Criteria

This skill is complete when:

- targeted verification was selected;
- related verification was considered;
- quality gate was run or documented as not run;
- review was run or documented as skipped when acceptance review applies (`/review-generated`, includes security posture);
- temporary debug artifacts were removed or explicitly preserved by user request;
- results are reported clearly;
- failures are not hidden.

---

## Main Principle

Verify the smallest affected area first.

Then verify shared impact.

Then run the project quality gate.

Then cleanup temporary debug artifacts before reporting completion.