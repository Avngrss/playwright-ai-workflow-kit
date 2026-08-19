# Skill: Audit Security Posture

## Goal

Detect risks that secrets, tokens, credentials, or sensitive test data may leak into console logs, Allure attachments, Playwright failure artifacts, visual baselines, debug dumps, or git-tracked files.

## Primary entry point (default)

**Security posture review is embedded in Review Generated Code Quality.**

Normal workflow after implementation:

```text
npm run qa:gate → /review-generated
```

Step **15A** and the **Security Posture** report section in `.cursor/skills/review-generated-code-quality/SKILL.md` cover changed-code security review.

Do **not** run this skill separately after `/implement-*-batch` or `/review-generated` unless the user explicitly requests a repository-wide security-only scan.

---

## When To Use This Skill Directly

Use this skill **only** when:

- the user asks for a **security-only** audit without code-quality review;
- a **full-repository** exposure scan is needed (onboarding, pre-CI-artifacts, open-source prep);
- `/audit-security` was invoked for the exception cases above.

---

## When NOT To Use

Do not use when:

- reviewing recent implementation or heal changes → use **Review Generated Code Quality** (`/review-generated`);
- the task is to fix a failing test → use heal skills;
- stability-only review → use Audit Test Stability;
- test-data isolation without exposure focus → use Audit Test Data Strategy.

---

## Related Rules

Follow these rules:

- Security and Sensitive Data Handling Rules;
- Configuration and Secrets Rules;
- Diagnostics and Reporting Rules;
- Reporting Allure Rules;
- Visual Testing Rules;
- Test Data Generation Rules;
- Temporary Debug Artifact Cleanup Rules;
- Authentication Strategy Rules;
- Agent Workflow;
- Project Map Rules;
- Examples Policy.

This is an **audit-only** skill.

Do not modify files unless the user explicitly requests fixes in the same task.

Do not print real secret values in the report — only file paths, line references, and risk categories.

---

## Audit Workflow

Run the same checks documented in **Review Generated Code Quality → step 15A**, plus full-repo scope when paths are empty:

### 1. Policy and helpers

Confirm presence of:

- `.cursor/rules/security-data-handling.rules.mdc`
- `docs/security-data-handling.md`

When the project has sensitive logging, attachments, or `@visual` filled states, confirm implementation-time helpers exist under `src/test/security/**`, `src/test/logging/**`, or `src/test/reporting/**` — populated from feature plans/contracts, not guessed starter lists.

### 2. Static code scan

Search `tests/**` and `src/test/**` for:

- raw `console.log`, `console.debug`, `console.info`;
- `process.env` in specs;
- hardcoded `Bearer`, JWT-like strings, password literals;
- `allure.attachment` / `testInfo.attach` without sanitize/redact helpers;
- raw `JSON.stringify(await response.json())` in diagnostics;
- Page Objects without `visualMaskTargets` where forms show generated email/phone;
- `toHaveScreenshot` on filled forms without explicit `mask:` / plan-backed strategy;
- committed `*.storage-state.json`, tracked `.env`, debug dumps with secrets.

Compare with `scripts/check-conventions.mjs` — report gaps conventions do not catch.

### 3. Playwright artifact configuration

Review `playwright.config.ts` for screenshot/trace/video on failure and Allure env info.

### 4. CI exposure

Review `.github/workflows/**` for artifact uploads and public report publishing.

### 5. Feature plans

Check **Sensitive Data & Visual Masking** in relevant `specs/<feature>/<feature>.md`.

---

## Severity Guide

| Severity | Examples |
|----------|----------|
| **Critical** | committed token; raw Authorization in Allure; console logging login response |
| **Major** | console.log in specs; filled-form `@visual` without masks; trace on auth flow without plan note |
| **Minor** | missing plan section; helpers unused; artifact retention not documented |

---

## Output Format

Same **Security Posture** section as Review Generated Code Quality, plus:

```md
## Security posture audit (standalone)

### Summary
...

### Critical / Major / Minor
...

### Convention gate coverage
...

### Recommended next steps
...
```

Recommended next commands after fixes:

- `/implement-ui-batch` / `/heal-ui-test` / `/heal-api-test`
- `/update-feature-plan` (Sensitive Data section)
- `/review-generated` (normal acceptance review)

---

## Main Principle

Default path: security review lives inside `/review-generated`.

This skill is the exception for security-only, repository-wide scans — not a second mandatory step after every batch.
