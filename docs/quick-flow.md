# Quick flow

Typical implementation: one feature, API and/or UI, no full user journey.

If this app needs a session, tell the agent **how** first and let it update the project map. Then plan features. Details: [Auth strategy](auth-strategy.md).

```text
/plan-feature
→ review specs/<feature>/<feature>.md
→ /implement-api-batch     (ready API only, skip if none)
→ /implement-ui-batch      (ready UI only, skip if none)
→ npm run test:api  and/or  test:ui
→ npm run qa:gate
→ /review-generated
```

Do not run API and UI in the same agent run. Do not implement items marked blocked or postponed.

Templates: [Commands](commands.md).

---

## When this is the right path

This is the default. Use it whenever you implement API/UI for a feature.

[Long flow](long-flow.md) is not the other path. It is a menu of extra commands (TMS, collection, audit, screenshot, extra browser, E2E, heal). After most of them you come back here to implement.

---

## Plan

`/plan-feature` writes `specs/<feature>/<feature>.md`.

The plan must choose a level per scenario:

| Level | Use for |
|-------|---------|
| API | Status, body, schema, backend rules |
| UI | Page, form, visible feedback |
| Schema | Response shape, with API |
| Not automated | Not worth automating, or unclear |

E2E does **not** belong in this plan. If a full journey shows up, note it and plan it later in long flow.

Each scenario is **ready to implement now**, **blocked/postponed**, or **not automated**.

Every plan has **Auth Strategy**. The map holds the mechanism; the plan picks `none`, `action`, or `precondition` and a role. Details: [Auth strategy](auth-strategy.md).

Stop after the plan file. Recommended next commands in the plan are a hint, not a green light to code.

---

## When the product changed

If requirements, locators, API contract, or UI flow changed — refresh the plan **before** healing or adding tests.

Exact delta is helpful but not required. `What changed: unknown` plus failing tests is enough; the agent discovers observed differences.

If only API or only UI changed, set `Layer to refresh`. The agent still checks the other layer for side effects.

E2E failures use `/plan-e2e-journey`, not `/update-feature-plan`. If a feature step also drifted, update the feature plan first.

```text
/update-feature-plan
→ review specs/<feature>/<feature>.md
→ /implement-api-batch and/or /implement-ui-batch (ready items only)
→ /heal-ui-test or /heal-api-test (technical drift only)
→ npm run qa:gate
→ /review-generated
```

Use `/heal-*` alone only when the plan is still correct and the failure is technical (locator rename, timing, fixture, config).

Rule: `.cursor/rules/feature-change-lifecycle.rules.mdc`

---

## Implement

Only **ready** rows.

- API: `/implement-api-batch` → `tests/api/**`
- UI: `/implement-ui-batch` → `tests/ui/**`

API owns contracts and data predicates. UI owns what the user sees. Do not copy the same check into both layers.

Tags on a typical spec: `@api` or `@ui`, plus `@smoke` or `@regression`.

After each layer:

```bash
npm run test:api    # or test:ui
npm run qa:gate
```

Then `/review-generated`. Review is read-only.

---

## Do not

- Implement without a reviewed plan
- Invent status codes, messages, tags, or env names
- Use `waitForTimeout`
- Add screenshots or `@cross-browser` “while you are here”
- Hide the action under test in a fixture or helper
