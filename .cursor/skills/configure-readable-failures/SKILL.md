# Skill: Configure Readable Allure Failures

## Goal

Wire readable failure diagnostics **once per project**, when the first UI or API specs are implemented — not in the empty starter.

---

## When To Use

- first UI or API spec is about to be implemented in a new project clone;
- team wants Allure failures readable for QA / dev / support;
- readable failure helpers do not exist yet under `src/test/reporting/` or `reporting.fixture.ts`.

Do **not** run again if helpers and `reporting.fixture.ts` already exist.

---

## When NOT To Use

- empty starter with zero specs and no imminent implementation;
- only updating Allure metadata in existing specs (use `configure-allure-reporting` skill);
- project already has `reporting.fixture.ts` in the fixture chain.

---

## Outcome

After this skill:

```text
base.fixture.ts → reporting.fixture.ts → api.fixture.ts → data.fixture.ts → pages.fixture.ts → test.ts
```

Plus:

- `src/test/reporting/failure-summary.helper.ts`
- `src/test/reporting/failure-context.helper.ts`
- `src/test/reporting/allure-failure-diagnostics.helper.ts`
- `src/test/fixtures/reporting.fixture.ts`

Every failed test attaches **Failure summary (readable)** to Allure automatically.

`src/test/reporting/allure-metadata.helper.ts` already ships in the starter — do not duplicate.

---

## Implementation Steps

### 1. Create failure-summary.helper.ts

Domain-neutral formatting: expected/actual blocks, list preview, Playwright error parsing, `buildReadableFailureSummary`.

No product-specific selectors or endpoints.

### 2. Create failure-context.helper.ts

Export `FailureContext` class with:

- `noteScenario`, `noteSubject`, `noteExpected`, `noteActual`
- `addFact`, `addHint`
- `toReadableSummary(headline)`

No secrets or PII storage.

### 3. Create allure-failure-diagnostics.helper.ts

Export `attachTestFailureDiagnostics({ testInfo, failureContext?, page? })`:

- attach on failure only;
- Allure parameters: project, layer, viewport, retry_attempt, current_url (UI/E2E);
- attachment: **Failure summary (readable)**;
- optional **Scenario notes** when `failureContext` has data;
- text-only — no raw HTTP bodies, tokens, or passwords.

Uses `allure-js-commons` only.

### 4. Create reporting.fixture.ts

```ts
// Extends base.fixture.ts
// Fixtures: failureContext
// Auto: _failureDiagnostics → attachTestFailureDiagnostics on failure
```

Must not import Page Objects or perform business flows.

### 5. Update fixture chain

- `api.fixture.ts` imports from `./reporting.fixture` (not `./base.fixture`)
- update `test.ts` comment and `fixtures/README.md`

### 6. Do not create yet

- `readable-assertion-message.helper.ts` — only when first custom assertion helper needs it;
- `sanitize-http.helper.ts` — only when API diagnostics attachments are planned.

---

## Spec Usage (after wiring)

Specs keep importing from `src/test/fixtures/test.ts` only.

Optional in complex tests:

```ts
async ({ failureContext }) => {
  failureContext.noteScenario("...").addFact("...", "...");
}
```

All specs should use `applyAllureMetadata()` from `allure-metadata.helper.ts`.

---

## Verification

1. `npm run qa:gate`
2. Run one failing smoke test locally (temporary) or verify TypeScript compiles
3. Confirm Allure report shows **Failure summary (readable)** on failure

---

## Rules

- `.cursor/rules/diagnostics-reporting.rules.mdc`
- `.cursor/rules/reporting-allure.mdc`
- `.cursor/rules/security-data-handling.rules.mdc`
- `.cursor/rules/fixtures-data.mdc`

Guide: `docs/failure-reporting.md`

---

## Anti-Patterns

- wiring reporting.fixture in empty starter with zero specs;
- putting failure attachment logic in specs instead of fixture;
- storing secrets in `failureContext`;
- creating readable-assertion helper before any assertion helper exists;
- skipping `applyAllureMetadata` because diagnostics exist.
