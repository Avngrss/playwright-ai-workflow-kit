# Skill: Implement Visual Test

## Goal

Use this skill when adding screenshot or visual regression coverage for a stable UI page, section, or component.

The goal is to add meaningful visual coverage without creating flaky screenshot tests or replacing functional assertions.

---

## Related Rules

Follow these rules:

- Visual Testing Rules
- Core Playwright Rules
- Test Structure and Tags Rules
- Page Object and Component Object Core Rules
- Page Object and Component Assertion Rules
- Locator Strategy Rules
- Test Isolation, Flakiness, and Diagnostics Rules
- Configuration and Secrets Rules
- Allure Reporting Rules
- Project Map Rules
- Examples Policy

If this skill conflicts with the project map or a more specific rule, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- a stable page needs visual regression coverage;
- a stable form needs layout coverage;
- a modal/dialog visual state matters;
- an empty state or error state needs visual coverage;
- a component layout is important;
- a previous UI change caused visual regression;
- a feature plan explicitly requests visual coverage.

---

## When NOT To Use

Do not use this skill when:

- the task is only functional UI automation;
- the page has uncontrolled dynamic content;
- visual state cannot be stabilized;
- the screenshot would include secrets or sensitive data;
- the screenshot would include random data;
- the test would only duplicate existing functional assertions without visual value;
- baselines cannot be generated in a controlled environment.

Do not add visual tests just because a page exists.

---

## Inputs

Use relevant available context:

- feature plan;
- target page or component;
- existing UI specs;
- Page Objects;
- Component Objects;
- project map;
- Playwright config;
- existing screenshot conventions;
- visual baseline folder if already present.

---

## Workflow

### 1. Identify Visual Target

Identify what should be visually verified.

Choose one:

- whole page;
- page section;
- component;
- modal;
- form;
- empty state;
- error state;
- confirmation state.

Prefer the smallest meaningful target.

Do not default to full-page screenshots.

---

### 2. Confirm Visual Value

Confirm why screenshot coverage is useful.

Valid reasons:

- layout matters;
- styling matters;
- visual regression risk is high;
- component state is hard to verify with text only;
- product/design expects visual stability;
- recent changes affected layout.

If visual value is unclear, do not add a visual test.

---

### 3. Check Existing Coverage

Before adding a visual test, check:

- existing UI functional tests;
- existing visual tests;
- existing Page Objects;
- existing Components;
- existing screenshot naming conventions.

Do not create duplicate visual tests.

Functional tests should already cover behavior.

---

### 4. Stabilize UI State

Before taking a screenshot, ensure the UI is stable.

Use:

- navigation;
- page readiness assertions in spec;
- visible heading or target locator;
- stable deterministic data;
- masked dynamic elements;
- controlled viewport/project.

Do not use `waitForTimeout`.

Do not rely on arbitrary delays.

---

### 5. Handle Dynamic Content

Identify dynamic areas.

Examples:

- timestamps;
- generated IDs;
- random products;
- ads;
- animations;
- third-party widgets;
- user-specific data;
- counters;
- server-driven changing lists.

Choose one strategy:

- mask dynamic locators;
- screenshot smaller stable area;
- use deterministic data;
- skip visual test if stability is impossible.

---

### 6. Choose Screenshot Type

Choose the smallest useful screenshot type.

Preferred:

- locator screenshot for component or section;
- page screenshot only if page-level layout matters;
- full-page screenshot only when explicitly justified.

Do not use full-page screenshots by default.

---

### 7. Add Visual Test

Add or update a spec according to the project map.

The test must:

- use `test.step`;
- use `@visual` tag;
- keep `@ui` tag for UI visual tests;
- include readiness assertions before screenshot;
- keep visual assertion in spec;
- use Page Objects or Components to reach the state;
- avoid raw selector mechanics when Page Object or Component exists.

Page Objects and Components must not call `toHaveScreenshot`.

---

### 8. Visual Checkpoint Workflow

For each visual checkpoint:

1. Reach the target UI state through normal user actions.
2. Assert the state functionally.
3. Ensure dynamic content is masked or avoided.
4. Take a scoped screenshot.
5. Use a stable screenshot name.

Good checkpoint examples:

- `contact-us-form-default.png`;
- `contact-us-form-validation-errors.png`;
- `contact-us-form-filled.png`;
- `contact-us-form-success.png`.

Avoid screenshots after every click or input field.

Capture meaningful UI states only.

## Assertion Policy

Visual assertion belongs in spec.

Page Objects and Components may expose locators needed for screenshot targets.

Page Objects and Components must not:

- import Playwright `expect`;
- call `toHaveScreenshot`;
- update snapshots;
- contain visual assertion logic.

Functional assertions should still verify behavior.

Screenshot assertion verifies appearance only.

---
## Scenario Checkpoint Policy

Visual assertions should normally be added to existing UI scenario tests.

Do not create a separate file unless separate execution is explicitly justified.

Good checkpoints:

- default state;
- filled state;
- validation state;
- success state.

Avoid screenshots after every low-level action.

---
## Screenshot Naming

Use clear and stable screenshot names.

Recommended naming pattern:

- `<area>-<state>.png`
- `<feature>-<scenario>.png`
- `<component>-<state>.png`

Examples:

- `contact-us-form-default.png`
- `login-form-validation-error.png`
- `cart-empty-state.png`

Do not use random names.

Do not include timestamps in screenshot names.

Follow existing project naming convention if one exists.

---

## Tags

Visual tests must include:

- `@visual`

UI visual tests must also include:

- `@ui`

Default execution tag:

- `@regression`

Use `@smoke` with `@visual` only when the feature plan explicitly requires a critical visual smoke checkpoint.

---

## Baseline Handling

Visual baselines must be created or updated only by explicit request.

Use the prompt field:

- Approve baseline: yes
- Approve baseline: no

Default value is:

- Approve baseline: no

When Approve baseline is no:

- add or update the visual checkpoint;
- run the impacted visual test once;
- if baseline is missing, report that baseline approval is required;
- do not update, keep, or commit generated baseline snapshots.

When Approve baseline is yes:

- run the impacted visual test with snapshot update enabled;
- report created or updated snapshot files;
- run the same impacted visual test again without snapshot update;
- report both command results.

Do not update baselines silently.

Do not use snapshot update mode to hide visual failures.

Do not include visual checks in regular quality gate until the baseline environment is stable.

---

## Reporting

Visual test artifacts may appear in Playwright or Allure reports.

Do not attach or screenshot secrets.

Do not screenshot:

- `.env` content;
- tokens;
- passwords;
- cookies;
- storage state;
- sensitive user data.

---

### Dynamic Content Check

Before adding a visual checkpoint:

- identify dynamic areas inside the screenshot target;
- prefer stable state and deterministic data first;
- mask only dynamic elements that are not part of the visual risk;
- do not mask the behavior being verified;
- avoid broad masks that hide meaningful regressions.

Masking must be applied in the spec screenshot assertion.

Page Objects and Components may expose locators needed for masking, but must not contain screenshot assertions.

If dynamic content cannot be stabilized safely, stop and report the visual checkpoint as blocked or postponed.

---

## Verification

Use one of the following verification modes.

### Default Visual Verification Mode

1. run the impacted visual spec only;
2. review screenshot result or diff classification;
3. do not approve/update baselines in this mode.

### Baseline Approval Mode

1. run the impacted visual spec in baseline approval mode;
2. review generated baseline updates intentionally;
3. rerun impacted visual spec to confirm stable pass;
4. run quality gate only when required by project workflow.

If verification cannot be run, report:

- command that should be run;
- reason it was not run;
- risk of not running it.

---

## Output Format

When reporting implementation, use this structure:

### Visual Target

- page/component:
- screenshot scope:
- reason visual coverage is useful:

### Stability

- readiness checks:
- dynamic areas:
- masking strategy:
- viewport/project assumptions:

### Implementation

- spec added or updated:
- screenshot name:
- tags:
- Page Objects/Components used:

### Verification

- impacted visual spec:
- screenshot baseline:
- diff reviewed:
- quality gate:
- not run reason, if any:

---

## Done Criteria

This skill is complete when:

- visual target is justified;
- screenshot scope is minimal and meaningful;
- UI state is stable before screenshot;
- dynamic content is masked or avoided;
- test includes `@visual` tag;
- functional readiness assertions exist before screenshot;
- screenshot assertion lives in spec;
- no `waitForTimeout` was added;
- no visual logic was added to Page Objects or Components;
- dynamic content handling decision is explicit (masked, avoided, or postponed);
- impacted visual test was run or documented as not run;
- baseline approval mode was executed intentionally or explicitly postponed.

---

## Anti-Patterns

Avoid:

- screenshot tests for every page by default;
- full-page screenshots without reason;
- screenshot-only tests with no readiness assertions;
- screenshots of dynamic content;
- screenshots of secrets or personal data;
- `waitForTimeout` before screenshot;
- visual assertions in Page Objects or Components;
- replacing functional assertions with screenshots;
- blind snapshot updates;
- unstable screenshots across uncontrolled environments.

---

## Placement Decision

Prefer adding visual assertions to existing UI scenario tests.

Visual checks should be scenario state checkpoints, not separate tests by default.

Do not create a separate visual spec unless separate execution or isolation is clearly justified.

If a UI scenario already reaches the target state, add the visual assertion there.

Before adding a visual checkpoint, verify:

- the state is meaningful;
- the state is stable;
- functional assertions confirm the state;
- screenshot target is scoped;
- dynamic content is masked or avoided.

---
## Main Principle

Add visual tests only when they provide meaningful visual regression protection.

Keep them stable, scoped, and intentional.

Functional tests prove behavior.

Visual tests catch appearance regressions.