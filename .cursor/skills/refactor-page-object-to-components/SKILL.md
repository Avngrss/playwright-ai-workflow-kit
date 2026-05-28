# Skill: Refactor Page Object To Components

## Goal

Use this skill when a Page Object has grown too large or mixes unrelated UI areas and needs to be refactored into meaningful Component Objects.

The goal is to improve ownership, readability, and change locality while preserving existing behavior.

This skill is for extraction of justified Component Objects from an existing Page Object.

It must not be used for broad redesign or speculative abstraction.

---

## Related Rules

Follow these rules:

- Page Object and Component Object Core Rules
- Page Object and Component Assertion Rules
- Component Extraction Rules
- UI Refactoring Rules
- UI Component Discovery Rules
- Locator Strategy Rules
- Test Structure and Tags Rules
- Core / Project Boundary and Structure Rules
- Project Map Rules
- Agent Workflow
- Examples Policy

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- a Page Object is becoming too large;
- a Page Object mixes unrelated UI areas;
- related locators and actions naturally group together;
- sorting, filtering, listing, table, modal, header, form, or pagination logic is mixed inside one Page Object;
- repeated UI behavior appears inside a Page Object;
- a meaningful UI block has clear ownership;
- Component Object ownership is already clear;
- Discover UI Components skill recommended extraction;
- extraction will reduce Page Object growth;
- extraction will make future AI-generated changes more predictable and localized.

---

## When NOT To Use

Do not use this skill when:

- component ownership is unclear;
- the proposed component may be overengineered;
- the UI block is a single locator;
- the UI block is a simple one-off control;
- the component would only rename a Playwright method;
- tests are failing and need healing first;
- the goal is to remove unnecessary abstractions;
- the goal is to implement a new feature;
- the task requires broad redesign;
- no current tests require the extraction.

Use another skill instead:

- use Discover UI Components when ownership is unclear;
- use Heal UI Test when tests are failing;
- use Simplify Overengineered Test Architecture when abstraction should be removed;
- use Implement UI Feature From Plan when implementing new feature tests.

---

## Inputs

Use relevant available context:

- target Page Object;
- affected specs;
- existing Component Objects;
- project map;
- UI rules;
- existing locator strategy;
- existing fixture structure;
- recent test failures if related;
- Discover UI Components output, if available.

Do not start moving code before identifying the exact component candidate and affected files.

---

## Workflow

### 1. Identify the Owning Page Object

Identify the Page Object that needs refactoring.

Collect:

- Page Object file;
- route or screen boundary;
- current public methods;
- current locators;
- related specs;
- existing components composed by this Page Object;
- signs of Page Object growth.

Expected output:

- owning Page Object is known;
- route or screen boundary is understood;
- affected specs are known.

---

### 2. Identify Component Candidates

Find meaningful UI blocks inside the Page Object.

Valid candidates may include:

- header;
- sidebar;
- filter panel;
- sorting control;
- result list;
- table;
- modal;
- toast;
- form section;
- pagination;
- search control;
- tab group;
- cart summary;
- data grid.

Do not create Component Objects for:

- single buttons;
- single links;
- single inputs;
- one-off trivial dropdowns;
- wrappers that only rename Playwright methods;
- speculative future behavior.

Expected output:

- one or more component candidates are identified;
- each candidate has related locators and actions.

---

### 3. Confirm Extraction Justification

Before extraction, confirm that the component candidate is justified by at least one of these reasons:

- reuse;
- real UI complexity;
- semantic UI boundary;
- multiple related locators and actions;
- Page Object growth;
- meaningful duplication reduction;
- clearer ownership;
- improved AI change locality.

If none of these are true, do not extract.

Keep the logic inside the Page Object.

---

### 4. Check Existing Components

Before creating a new Component Object, check whether an existing component already covers the behavior.

Prefer reuse over creating a new component.

Do not create duplicate components with overlapping responsibilities.

If an existing component can be extended safely, prefer minimal extension over a new component.

---

### 5. Define Component Ownership

The extracted Component Object must have clear ownership.

The owning Page Object should compose the Component Object.

Specs should normally access the component through the owning Page Object.

Good access pattern:

- `pageObject.sorting.selectByValue("price-desc")`
- `pageObject.results.getVisibleItems()`

These names are illustrative.

Follow the actual project naming conventions.

Do not expose the Component Object through fixtures by default.

---

### 6. Move Related Locators

Move only locators that belong to the component candidate.

Rules:

- move related locators together;
- keep unrelated page-level locators in the Page Object;
- do not move locators used by unrelated methods;
- do not change locator strategy unless required;
- do not replace stable locators with fragile ones;
- do not introduce raw selectors into specs.

If a stable root locator exists, prefer passing the root locator to the Component Object.

If no stable root exists, passing `Page` may be acceptable.

Do not invent fragile CSS only to create a root locator.

---

### 7. Move Related Methods

Move only methods that operate on the component candidate.

Rules:

- move component-level user actions;
- move component-level state readers;
- move parsing logic directly related to component text or values;
- keep page-level navigation in the Page Object;
- keep cross-page workflows out of components;
- keep test data generation out of components;
- keep test runner logic out of components;
- keep `test.step` out of components.

Do not add new behavior during extraction.

Do not add speculative methods.

---

### 8. Update the Owning Page Object

Update the Page Object to compose the new Component Object.

The Page Object should remain the route, screen, or navigation boundary owner.

The Page Object may expose the component as a readonly property or according to the project convention.

Do not turn the Page Object into a generic utility class.

Do not remove meaningful page-level ownership.

---

### 9. Update Specs Minimally

Update only affected specs.

Rules:

- preserve test intent;
- preserve test names;
- preserve tags;
- preserve scenario-specific assertions;
- preserve `test.step` structure;
- do not rewrite unrelated tests;
- do not change expected behavior.

Specs should access the extracted component through the owning Page Object.

Do not introduce component fixtures by default.

---

### 10. Preserve Assertion Ownership

Scenario-specific assertions must remain explicit in specs.

Page Objects and Component Objects must not import or use Playwright `expect`.

They may expose structural locators, markers, parsed values, or state reader methods.

Scenario-specific assertions must be explicit in specs.

Reusable assertion logic may live in dedicated assertion helpers.

Do not use methods that combine action and verification.

---

### 11. Verify Behavior

After refactoring, run verification.

Recommended order:

1. run the smallest impacted spec;
2. run related specs if the Page Object or Component Object is shared;
3. run the repository quality gate command defined by the project map.

Use project map commands.

Do not invent commands.

If verification cannot be run, state:

- what changed;
- what should be run;
- why it was not run.

---

## Refactoring Rules

### Allowed

Allowed during this skill:

- create a justified Component Object;
- move related locators into the Component Object;
- move related component-level methods;
- update the owning Page Object composition;
- update affected specs minimally;
- preserve existing behavior;
- improve ownership and locality.

---

### Not Allowed

Do not:

- change product behavior;
- change expected results;
- add new feature coverage;
- add speculative methods;
- introduce component fixtures by default;
- rewrite unrelated tests;
- rename public methods unless necessary;
- move business flows into components;
- move cross-page workflows into components;
- move test data generation into components;
- add `test.step` inside Page Objects or Components;
- add broad refactoring unrelated to the component extraction.

---

## Component Extraction Criteria

Create a Component Object only when it is justified.

A justified Component Object usually has one or more of:

- meaningful UI block behavior;
- multiple related locators;
- multiple related actions;
- stable semantic boundary;
- reuse across specs, pages, or suites;
- complexity worth isolating;
- repeated patterns;
- Page Object growth reduction.

Do not extract components only because an element exists visually.

---

## Component Fixture Policy

Do not expose Component Objects as fixtures by default.

Use Page Objects as the entry point for components.

Component fixture access is allowed only as a rare exception when:

- direct component access is needed across multiple suites;
- Page Object composition would be less clear;
- fixture access does not create ownership confusion;
- fixture access does not bypass the Page Object model;
- fixture access does not create fixture explosion.

If these conditions are not met, do not create a component fixture.

---

## Output Format

When reporting the refactor, use this structure.

### 1. Refactor Target

- Page Object:
- route or screen:
- reason for refactor:
- affected specs:

### 2. Component Candidate

- component name:
- ownership:
- related locators:
- related methods:
- justification:

### 3. Changes Applied

- files created:
- files updated:
- locators moved:
- methods moved:
- specs updated:

### 4. Behavior Preservation

- test intent unchanged:
- assertions unchanged:
- navigation unchanged:
- tags unchanged:

### 5. Verification

- impacted specs:
- related specs:
- quality gate:
- not run reason, if any:

### 6. Follow-up

- remaining risks:
- postponed extraction:
- cleanup needed:

---

## Done Criteria

This skill is complete when:

- component extraction is justified;
- existing components were checked before creating a new one;
- behavior is unchanged;
- related locators and methods were moved together;
- unrelated code was not refactored;
- owning Page Object composes the component;
- specs access the component through the Page Object;
- no component fixture was added by default;
- no speculative methods were added;
- impacted specs were run or documented as not run;
- quality gate was run or documented as not run.

---

## Anti-Patterns

Avoid:

- extracting components without justification;
- creating components for single locators;
- creating components for one-off buttons or links;
- creating duplicate components;
- moving unrelated locators together;
- moving page navigation into components;
- moving cross-page business flows into components;
- moving scenario assertions into components;
- adding component fixtures by default;
- rewriting specs during extraction;
- changing expected behavior;
- broad cleanup during targeted refactor.

---

## Main Principle

Extract meaningful UI blocks only when they solve a real ownership, reuse, complexity, or maintainability problem.

Keep Page Object as the route or screen owner.

Keep Component Object as the meaningful UI block owner.

Preserve behavior.

Apply the smallest safe refactor.