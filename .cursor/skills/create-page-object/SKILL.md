# Skill: Create Page Object

## Goal

Use this skill when a new Page Object is needed for a page, screen, route, or navigation boundary.

The goal is to create a minimal, correct Page Object without speculative methods, business flows, test data generation, or test runner logic.

---

## Related Rules

Follow these rules:

- Page Object and Component Object Core Rules;
- Page Object and Component Assertion Rules;
- Component Extraction Rules;
- Locator Strategy Rules;
- Visual Testing Rules;
- Security and Sensitive Data Handling Rules;
- Fixtures and Test Data Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Examples Policy.

---

## When To Use

Use this skill when:

- a new route needs UI automation;
- a new screen needs Page Object ownership;
- a new navigation boundary appears;
- feature plan identifies a missing Page Object;
- existing UI block is actually a page or screen, not a component.

---

## When NOT To Use

Do not create a Page Object when:

- the UI block is only part of an existing page;
- the behavior belongs to a Component Object;
- the object would represent one button, input, modal, or list only;
- route or screen ownership is unclear;
- no current test requires it;
- it is created just in case.

Use Discover UI Components when ownership is unclear.

---

## Workflow

### 1. Confirm Page Boundary

Confirm that the target represents:

- page;
- screen;
- route;
- navigation boundary.

Do not create a Page Object for a small UI block.

---

### 2. Check Existing Page Objects

Check whether an existing Page Object already owns the route or screen.

Do not create duplicate Page Objects.

---

### 3. Check Project Map

Find:

- Page Object folder;
- naming convention;
- path aliases;
- pages fixture location;
- final fixture entry point.

---

### 4. Create Minimal Page Object

Page Object may include:

- constructor dependencies;
- page-level locators;
- navigation method if needed;
- structural readiness method if project policy allows it;
- user actions required by current tests;
- component composition when justified.

Page Object must not include:

- `test.step`;
- hooks;
- test runner logic;
- test data generation;
- direct `process.env` access;
- cross-page business flows;
- speculative methods;
- scenario-specific assertions.

---

### 5. Add Components Only If Justified

Do not create components by default.

Create components only when reuse, complexity, semantic UI boundary, or Page Object growth justifies it.

---

### 5A. Visual Mask Targets (forms with generated or sensitive data)

When the page has a form or fields that may show **generated email/phone/id** or **sensitive values** in `@visual` checkpoints, expose readonly mask locators for specs:

```ts
readonly visualMaskTargets = [
  this.emailInput,
  this.confirmationCode,
];
```

Rules:

- locators only — no `toHaveScreenshot`, no `expect`;
- specs use `mask: page.visualMaskTargets` (or a project mask helper created during implementation);
- omit `visualMaskTargets` when visual coverage is empty-state-only (document in feature plan);
- default password/OTP masks come from `screenshot-masks.helper.ts` when `{ page }` is passed.

---

### 6. Add Fixture If Needed

Expose Page Object through pages fixture only if this matches project convention.

Specs should use the final fixture entry point.

Do not manually create Page Objects in specs when fixture convention exists.

---

### 7. Verify

Run impacted spec after Page Object usage is added.

Run quality gate from project map when applicable.

---

## Output Format

### Page Object

- name:
- route or screen:
- reason:
- file:

### Ownership

- existing owner checked:
- component candidates:
- fixture exposure:

### Verification

- impacted specs:
- quality gate:

---

## Done Criteria

This skill is complete when:

- route or screen ownership is confirmed;
- no duplicate Page Object exists;
- Page Object is minimal;
- no speculative methods were added;
- no business flow is hidden;
- fixture integration follows project map;
- impacted tests are verified or documented as not run.

---

## Main Principle

Page Objects own page boundaries.

They do not own business workflows.

Start minimal.