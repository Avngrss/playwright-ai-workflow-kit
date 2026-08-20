# Readable failures in Allure

How the kit turns test failures into reports that QA, developers, and support can read — not only automation engineers.

---

## Starter vs first feature

| Layer | In empty kit | On first UI/API batch |
|-------|----------------|------------------------|
| Allure reporter + `allurerc.mjs` | yes | — |
| `allure-metadata.helper.ts` | yes | use in every spec |
| Rules + this guide | yes | — |
| `reporting.fixture.ts` + failure diagnostics helpers | no | **wire once** |
| `readable-assertion-message.helper.ts` | no | when first custom assertion helper appears |

The clean starter stays small. Readable failure **mechanism** is added when the first real specs are implemented — not before.

Skill: `.cursor/skills/configure-readable-failures/SKILL.md`

---

## Goals

A good failure report should answer, without opening a trace first:

1. **What happened** — plain-language headline
2. **What was checked** — user-facing behavior or business rule
3. **Expected vs actual** — readable mismatch
4. **Scenario context** — sort key, query, endpoint, form state
5. **Where to look next** — screenshot, trace, retry hint
6. **Environment** — project, layer, viewport, URL at failure

Playwright still captures screenshot, trace, and video on failure. Allure adds a structured text summary on top.

---

## From day one of testing (metadata)

Use `applyAllureMetadata()` so failures appear under the right feature/story:

```ts
import {
  applyAllureMetadata,
  buildAllureSuitePath,
} from "../../../src/test/reporting/allure-metadata.helper";

const FEATURE = "Catalog";
const ROOT_SUITE = "UI / Catalog";

test.beforeEach(async () => {
  await applyAllureMetadata({
    feature: FEATURE,
    suite: ROOT_SUITE,
    layer: "ui",
    owner: "qa-catalog",
  });
});

test("sorts products by price", async ({ catalogPage }) => {
  await applyAllureMetadata({
    story: "Sort by price ascending",
    severity: "critical",
  });

  // test body with meaningful test.step names
});
```

Metadata improves **navigation**. Failure diagnostics (below) improve **comprehension**.

---

## First UI/API batch (wire once)

When implementing the **first** UI or API spec in a project, run the readable-failures skill once:

```text
/configure-readable-failures
```

It creates:

- `src/test/reporting/failure-summary.helper.ts`
- `src/test/reporting/failure-context.helper.ts`
- `src/test/reporting/allure-failure-diagnostics.helper.ts`
- `src/test/fixtures/reporting.fixture.ts`
- inserts `reporting.fixture` into the fixture chain (`base → reporting → api → …`)

After wiring, **every failed test** automatically gets Allure attachment **Failure summary (readable)**.

---

## Optional scenario notes (`failureContext`)

Use after readable failures are wired — when the error message alone does not explain business intent:

```ts
test("sorts products by price", async ({ catalogPage, failureContext }) => {
  failureContext
    .noteScenario("Customer sorts catalog by lowest price first")
    .addFact("Sort option", "Price: Low to High");

  await test.step("Verify visible products are sorted by price", async () => {
    const prices = await catalogPage.results.getVisiblePrices();
    failureContext
      .noteExpected("Ascending numeric order")
      .noteActual(prices.join(", "));

    await expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
```

Do not store secrets, passwords, tokens, or unsanitized PII in `failureContext`.

---

## Custom assertion helpers

When the first sort/filter/search assertion helper is created, add readable messages via `failure-summary.helper.ts` (`buildAssertionMessage`, `formatListPreview`).

Create `src/test/assertions/shared/readable-assertion-message.helper.ts` only when reuse across helpers is proven — not in the empty starter.

Playwright `expect` remains the source of truth. Readable messages supplement, not replace, real assertions.

---

## Flaky tests and retries

When CI retries a test, failure summaries should include:

- Allure parameter `retry_attempt` (e.g. `2/3`)
- hint to compare trace/video across attempts

If a test passes only after retry, treat it as a stability signal — do not mask with longer timeouts.

Rule: `.cursor/rules/flakiness-policy.rules.mdc`

---

## API failures

Automatic diagnostics work for API specs after wiring. For request/response bodies, use **sanitized** attachments only — create `sanitize-http.helper.ts` when the feature plan requires HTTP diagnostics.

Rule: `.cursor/rules/security-data-handling.rules.mdc`

---

## Viewing reports

```bash
npm run test:report
```

Open a failed test → **Failure summary (readable)** → screenshot / trace / video.

---

## Checklist

**Empty kit / planning**

- [ ] Team knows readable failure policy (`docs/failure-reporting.md`)

**First implement batch**

- [ ] `/configure-readable-failures` or equivalent skill step executed once
- [ ] Allure metadata in specs (`feature`, `story`, `suite`, `severity`)
- [ ] Meaningful `test.step` names

**Ongoing**

- [ ] Complex scenarios use `failureContext`
- [ ] Custom assertion helpers use readable messages
- [ ] No secrets in context or attachments

Related:

- `.cursor/rules/diagnostics-reporting.rules.mdc`
- `.cursor/rules/reporting-allure.mdc`
- `.cursor/skills/configure-allure-reporting/SKILL.md`
