# Security and sensitive data handling

This guide explains how the Playwright AI Workflow Kit keeps tokens, credentials, and sensitive test data out of console logs, reports, and artifacts.

**Source of truth for agents:** `.cursor/rules/security-data-handling.rules.mdc`

---

## What we protect

| Type | Examples |
|------|----------|
| Secrets | passwords, API keys, Bearer tokens, cookies, storage state |
| Session data | Authorization headers, refresh tokens |
| PII in tests | generated emails, phones, names shown in UI |
| Config leaks | `.env` contents, committed session files |

---

## Clean starter vs project helpers

The **clean kit** does not ship security helper files or guessed sensitive-field lists.

During implementation, agents create helpers under `src/test/security/**`, `src/test/logging/**`, and `src/test/reporting/**` only when a scenario needs them.

Field names, headers, and visual mask locators must come from:

- the feature plan section **Sensitive Data & Visual Masking**;
- API contract / OpenAPI / Bruno (when available);
- UI discovery (pinned Page Object locators).

Do not invent JSON keys, headers, or CSS/test-id selectors in the starter baseline.

---

## Daily rules for authors

### Logging

- Do **not** use raw `console.log` in specs or helpers for API/UI diagnostics.
- When logging is intentional, create and use `safe-logger.helper.ts` with redaction.
- Never log `process.env` values.

### Allure attachments

- When attaching HTTP diagnostics, create sanitize helpers and use them.
- Never attach raw Authorization headers or login response bodies.

### Visual tests (`@visual`)

- Expose `visualMaskTargets` on Page Objects for fields listed in the plan.
- Use explicit `mask:` locators in `toHaveScreenshot()` for filled/generated data.
- Prefer empty/default form states when possible.

### Failure artifacts

Playwright saves screenshots, traces, and videos on failure. These can include:

- filled password/email fields;
- network headers in traces.

Mitigations:

- plan sensitive flows in `specs/<feature>/<feature>.md` (section **Sensitive Data & Visual Masking**);
- avoid unnecessary post-auth screens in failing paths;
- restrict CI artifact access/retention in real projects.

---

## Quality gate

```bash
npm run qa:gate
```

Includes security convention checks (console patterns, hardcoded tokens, etc.) when specs exist.

---

## Review (default — includes security)

After `qa:gate`, run **`/review-generated`** on changed files.

That review **embeds security posture** (step 15A): logs, attachments, visual masks, trace/artifact notes. You do **not** need `/audit-security` in the normal quick flow.

---

## Security audit (standalone exception)

Use **`/audit-security`** only for a **full-repository security-only scan** without code-quality review (onboarding, CI artifact policy):

```text
/audit-security
```

Skill: `.cursor/skills/audit-security-posture/SKILL.md` — never prints real secret values.

---

## If a secret leaked

1. Rotate the credential immediately.
2. Remove it from git history if committed (team process).
3. Delete local debug dumps and stale artifacts.
4. Do not paste the secret into issues, Allure, or chat.

---

## Related docs

- `docs/auth-strategy.md` — authentication mechanisms
- `.env.example` — env placeholders (never commit `.env`)
- Project map — CI variables vs secrets
