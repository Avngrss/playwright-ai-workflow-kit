# Skill: Discover UI Components

## Goal

Use this skill when deciding whether a UI block should become a Component Object or stay inside a Page Object.

This skill analyzes the current UI structure, specs, Page Objects, existing Component Objects, fixtures, and relevant rules before introducing new Component Objects.

Do not modify files during discovery.

If Playwright MCP, one-off scripts, or JSON dumps are used to inspect the live UI, those artifacts are temporary investigation tools only.

After downstream implementation or healing completes, remove them.

Rule reference:

- `.cursor/rules/temporary-debug-artifact-cleanup.rules.mdc`

The result of this skill is a recommendation, not code changes.

---

## Relationship With Playwright Planner

This skill does not replace the Playwright planner.

The Playwright planner defines the overall implementation plan.

This skill answers a narrower architecture question:

- should this UI block stay inside the Page Object;
- should this UI block become a Component Object;
- should an existing Component Object be reused;
- should extraction be postponed;
- should an unnecessary abstraction be removed.

The planner may invoke this skill when Page Object and Component Object ownership is unclear.

---

## Related Rules

Follow these rules:

- Page Object and Component Object Core Rules;
- Component Extraction Rules;
- Locator Strategy Rules;
- UI Refactoring Rules;
- UI Patterns Catalog;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Temporary Debug Artifact Cleanup Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- ownership is unclear between Page Object and Component Object;
- a UI block appears reusable;
- a new Component Object is proposed;
- the agent may be overengineering components;
- a Page Object becomes too large;
- multiple related locators or actions appear inside a Page Object;
- UI structure needs inspection;
- route or screen ownership is ambiguous;
- visual structure conflicts with URL or navigation structure;
- Playwright MCP inspection may help clarify UI structure or locators.

---

## When NOT To Use

Do not use this skill when:

- the change is a small locator fix;
- component ownership is already clear;
- an existing Component Object already covers the behavior;
- no new abstraction is being proposed;
- the UI block is a single locator with no meaningful behavior;
- the UI block is a simple one-off control;
- the task is only to update a spec without changing UI architecture;
- the planner already has enough information and no ownership decision is needed.

---

## Inputs

Use relevant available context:

- spec files;
- Page Objects;
- existing Component Objects;
- fixtures;
- project map;
- project rules;
- existing naming conventions;
- existing locator patterns;
- Playwright MCP when UI structure or locators are unclear.

Playwright MCP is optional.

Use it only when repository files are not enough to understand the actual UI structure.

---

## Workflow

### 1. Identify Target Area

Identify the target:

- page;
- screen;
- route;
- user flow;
- UI block;
- proposed Component Object.

Clarify what decision is needed.

Expected output:

- target page or screen is known;
- candidate UI block is known;
- ownership question is clear.

---

### 2. Inspect Existing Specs

Review relevant specs to understand:

- how the UI block is used;
- whether behavior is repeated;
- whether the same interactions appear in multiple tests;
- whether specs contain raw selector mechanics;
- whether tests would become clearer with a Component Object.

Do not modify specs during discovery.

---

### 3. Inspect Existing Page Objects

Review existing Page Objects to understand:

- current page ownership;
- route or screen boundary;
- existing locators;
- existing actions;
- whether the Page Object is growing too large;
- whether unrelated UI areas are mixed together;
- whether locator groups naturally belong together.

---

### 4. Inspect Existing Component Objects

Check whether an existing Component Object already covers the candidate behavior.

Prefer reuse over creating a new component.

Do not create duplicate components with overlapping responsibility.

---

### 5. Inspect UI Structure If Needed

If repository files are not enough, use Playwright MCP to inspect the real UI.

Use MCP to clarify:

- meaningful UI blocks;
- root locator candidates;
- accessible roles and names;
- stable test IDs;
- route or navigation boundaries;
- whether the UI block is visually and semantically independent.

Do not use MCP if ownership is already clear from code and project structure.

---

### 6. Identify Component Candidates

Identify UI blocks that may be Component Objects.

For each candidate, collect:

- candidate name;
- owning Page Object;
- related locators;
- related actions;
- reuse evidence;
- complexity evidence;
- stable root locator availability;
- affected specs;
- existing similar components.

---

### 7. Evaluate Each Candidate

For each candidate, check whether it has one or more valid extraction triggers:

- reuse across multiple pages or suites;
- multiple related locators and actions;
- stable root locator;
- meaningful semantic UI boundary;
- meaningful reduction of duplication;
- Page Object growth reduction;
- clearer ownership;
- more predictable AI-generated changes.

Also check whether extraction would be overengineering.

Do not create components just because a locator exists.

---

### 8. Make Recommendation

For each candidate, choose one recommendation:

- keep inside Page Object;
- extract Component Object now;
- reuse existing Component Object;
- postpone extraction until reuse or complexity appears;
- remove unnecessary abstraction.

Component fixture recommendation is allowed only as a rare exception.

Prefer component ownership through Page Objects by default.

---

## Decision Rules

Prefer Page Object first.

Create a Component Object only when reuse, real complexity, semantic UI boundary, or Page Object growth justifies it.

Do not create components just because a UI block exists visually.

Do not create components for one simple control used only once.

Do not create a new Page Object for a UI block that is part of an existing page layout.

Do not create component fixtures by default.

Do not use discovery as an excuse for large refactoring.

---

## Ownership Guidance

### Page Object Ownership

Choose Page Object ownership when:

- the behavior belongs to one route, page, screen, or navigation boundary;
- the UI block is simple;
- the UI block is used only once;
- extraction would reduce clarity;
- there is no stable semantic boundary.

---

### Component Object Ownership

Choose Component Object ownership when:

- the UI block has meaningful behavior;
- related locators and actions belong together;
- the block has a clear semantic boundary;
- the block is reused;
- the block is complex enough to deserve isolation;
- extraction prevents a God Page Object.

---

### Fixture Ownership

Do not recommend fixture ownership by default.

Component fixtures are allowed only when:

- direct access is needed across multiple suites;
- Page Object composition would be less clear;
- fixture access does not create ownership confusion;
- fixture access does not bypass the Page Object model.

---

## Output Format

Return the discovery result using this structure.

### 1. Target

- page, screen, or route:
- candidate UI block:
- reason discovery was needed:

### 2. Existing Structure

- relevant specs:
- relevant Page Objects:
- relevant Component Objects:
- relevant fixtures:

### 3. Component Candidates

For each candidate:

- name:
- current owner:
- related locators and actions:
- reuse evidence:
- complexity evidence:
- root locator availability:
- affected specs:

### 4. Recommendation

For each candidate, choose one:

- keep inside Page Object;
- extract Component Object now;
- reuse existing Component Object;
- postpone extraction;
- remove unnecessary abstraction.

### 5. Reasoning

Explain why the recommendation is appropriate.

Mention:

- route or screen ownership;
- reuse;
- complexity;
- semantic boundary;
- root locator;
- risk of overengineering;
- impact on Page Object size.

### 6. Suggested Ownership

Use one of:

- Page Object;
- Component Object;
- existing Component Object;
- postpone;
- remove.

Use Fixture only as a rare exception and explain why.

### 7. Minimal Refactor Plan

If extraction is justified, provide a minimal plan:

- files to create;
- files to update;
- methods or locators to move;
- specs affected;
- verification to run.

Do not apply changes.

### 8. Files That Would Be Affected

List files that would likely change if the recommendation is implemented.

### 9. Final Decision

End with one concise decision:

- no component needed now;
- extract component now;
- reuse existing component;
- postpone;
- remove abstraction.

---

## Done Criteria

This skill is complete when:

- no files were modified;
- target ownership question is answered;
- existing Page Objects and Components were checked;
- reuse and complexity were evaluated;
- overengineering risk was considered;
- recommendation is explicit;
- affected files are listed;
- minimal refactor plan is provided if extraction is justified;
- any temporary discovery scripts or dumps created outside this read-only skill were removed after implementation, or preservation was explicitly requested.

---

## Anti-Patterns

Avoid:

- creating components only because elements exist;
- creating components for single buttons or links;
- creating components before checking existing ones;
- creating a Page Object for a UI block inside a page;
- recommending component fixtures by default;
- using discovery to perform code changes;
- leaving temporary `scripts/debug-*.mjs`, `scripts/discover-*.mjs`, or `discover-*-output.json` files in the repository after implementation;
- recommending broad refactors;
- ignoring route or screen boundaries;
- ignoring the project map;
- ignoring existing project conventions.

---

## Main Principle

Discover first when ownership is unclear.

Do not guess architecture.

Do not modify files during discovery.

Prefer Page Object first.

Extract Component Objects only when they solve a real ownership, reuse, complexity, or maintainability problem.