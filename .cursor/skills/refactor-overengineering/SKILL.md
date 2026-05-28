# Skill: Simplify Overengineered Test Architecture

## Goal

Use this skill when tests work, but the test architecture is over-abstracted.

The goal is to remove unnecessary abstractions with minimal changes while keeping test behavior, intent, and coverage unchanged.

This skill simplifies architecture.

It must not change product behavior, test intent, or expected results.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- Core Playwright Rules;
- Page Object and Component Object Core Rules;
- Component Extraction Rules;
- UI Refactoring Rules;
- Fixtures and Test Data Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Examples Policy.

If this skill conflicts with a rule or the project map, follow the project map and the more specific rule.

---

## When To Use

Use this skill when:

- tests pass but architecture is unnecessarily complex;
- a Component Object has single-use scope and no meaningful behavior;
- a helper contains trivial one-off logic;
- a fixture has no meaningful reuse;
- a utility only wraps a simple Playwright action;
- a domain flow was created for simple page or component behavior;
- a client, service, or helper was created "just in case";
- public methods were added for future tests that do not exist;
- component fixtures were added without clear need;
- abstractions make the test harder to read instead of easier.

---

## When NOT To Use

Do not use this skill when:

- tests are failing;
- the task is to heal a broken test;
- the task is to implement a new UI feature;
- the task is to discover whether a new Component Object is needed;
- the task is to split a large Page Object into components;
- the task requires broad redesign;
- expected behavior is unclear.

Use other skills instead:

- use Heal UI Test when tests fail;
- use Discover UI Components when ownership is unclear;
- use UI Refactoring rules when extracting meaningful components;
- use Implement UI Feature From Plan for new feature implementation.

---

## Inputs

Use relevant available context:

- passing specs;
- Page Objects;
- Component Objects;
- fixtures;
- helpers;
- utilities;
- domain flows;
- API clients if affected;
- project map;
- existing rules;
- recent generated changes;
- quality gate command.

Do not modify files before identifying the unnecessary abstraction and replacement plan.

---

## Workflow

### 1. Identify Overengineering Candidate

Find abstractions that may be unnecessary.

Common candidates:

- component with one locator and one trivial method;
- component used by only one Page Object and adding no clarity;
- helper used only once;
- utility wrapping simple Playwright methods;
- fixture exposing a one-off value;
- fixture exposing a Component Object without clear need;
- domain flow for a simple page action;
- public method created for future possible tests;
- generic service with unclear responsibility;
- duplicate abstraction overlapping with an existing one.

Expected output:

- candidate abstraction is identified;
- usage count is known;
- reason for suspicion is clear.

---

### 2. Check Actual Usage

Before removing anything, check where it is used.

Check:

- specs;
- Page Objects;
- Component Objects;
- fixtures;
- imports;
- related helpers;
- project map references.

Do not remove abstractions based on guesswork.

Do not break public APIs without checking usage.

---

### 3. Classify the Abstraction

Classify the candidate as one of:

- justified abstraction;
- unjustified abstraction;
- premature abstraction;
- duplicate abstraction;
- wrong-layer abstraction;
- abstraction with unclear ownership;
- abstraction that should be postponed;
- abstraction that should be simplified but not removed.

If ownership is unclear, use Discover UI Components before changing code.

---

### 4. Decide Simplification Strategy

Choose the smallest safe strategy:

- inline trivial helper back into the caller;
- move simple one-off component behavior back into the owning Page Object;
- remove unused speculative methods;
- remove unjustified fixture exposure;
- replace duplicate abstraction with existing one;
- move project-specific code out of framework core;
- replace generic wrapper with direct Playwright or existing framework API;
- keep the abstraction if removal would reduce clarity.

Do not simplify just for the sake of fewer files.

Simplification must improve clarity, ownership, or maintainability.

---

### 5. Preserve Behavior

Before changing code, identify current behavior that must remain unchanged.

Preserve:

- test names;
- test intent;
- user-visible actions;
- assertions;
- tags;
- setup behavior;
- fixture behavior that is still needed;
- public behavior used by specs.

Do not change expected results.

Do not weaken assertions.

Do not hide actions in hooks or fixtures.

---

### 6. Apply Minimal Change

Apply the smallest safe diff.

Rules:

- remove only the unjustified abstraction;
- do not refactor unrelated files;
- do not rename public methods unless necessary;
- do not add new abstractions while removing old ones;
- do not change test coverage;
- do not change product behavior;
- do not modify unrelated locators;
- do not combine simplification with feature implementation.

---

### 7. Verify

After changes:

1. run the impacted spec or specs;
2. run related specs if shared Page Objects, Components, fixtures, or utilities changed;
3. run the repository quality gate command defined by the project map.

If the project quality gate is `npm run qa:gate`, run it after targeted verification.

If verification cannot be run, state:

- what changed;
- what should be run;
- why it was not run.

---

## Simplification Rules

### Components

Remove or avoid Component Objects when:

- the component wraps a single locator;
- the component is used only once;
- the component has no meaningful behavior;
- extraction makes code harder to read;
- the component only renames Playwright methods;
- there is no semantic UI boundary;
- there is no reuse, complexity, or Page Object growth problem.

Keep Component Objects when:

- they represent meaningful UI blocks;
- they reduce duplication;
- they isolate real complexity;
- they prevent God Page Objects;
- they improve AI change locality;
- they have clear ownership through a Page Object.

Do not expose Component Objects as fixtures by default.

Remove component fixtures when direct fixture access is not clearly justified.

---

### Fixtures

Remove or avoid fixtures when:

- they provide one-off values;
- they hide the action under test;
- they duplicate simple object creation;
- they expose components without clear need;
- they create fixture bloat;
- they bypass the final fixture entry point;
- they make test setup harder to understand.

Keep fixtures when:

- they provide reusable dependency wiring;
- they provide shared setup;
- they expose Page Objects through the approved fixture entry point;
- they improve consistency across specs;
- they remain thin and focused.

---

### Utilities and Helpers

Remove or avoid utilities when:

- they are used only once;
- they wrap one Playwright method;
- they hide user intent;
- they mix unrelated logic;
- they have vague names such as `helper`, `utils`, `common`, or `manager`;
- they belong in a Page Object, Component Object, builder, generator, or fixture instead.

Keep utilities when:

- they contain pure reusable non-UI logic;
- they are domain-neutral if placed in framework core;
- they have a clear responsibility;
- they reduce meaningful duplication.

---

### Domain Flows

Remove or avoid domain flows when:

- the behavior belongs to one Page Object;
- the behavior belongs to one Component Object;
- the flow is used by only one test;
- the flow only renames existing page methods;
- the flow hides the action under test;
- the flow was created before reuse or complexity appeared.

Keep domain flows when:

- repeated cross-page business workflows exist;
- multiple suites share the same workflow;
- Page Objects would otherwise orchestrate unrelated pages;
- the flow stays in the project layer;
- the flow does not contain selectors or low-level UI logic.

---

### API Clients and Services

Remove or avoid API clients or services when:

- the endpoint is used only once and raw request is clearer;
- the client hides assertions;
- the client hides workflows;
- the client duplicates existing client responsibility;
- a service hierarchy was created without real need.

Keep API clients when:

- endpoint calls are reused;
- grouping improves clarity;
- request composition is duplicated;
- clients stay thin;
- clients return response or typed data without hiding assertions.

---

## Guardrails

Do not:

- change expected behavior;
- weaken assertions;
- remove meaningful test coverage;
- introduce new abstractions while simplifying old ones;
- perform broad refactoring;
- modify unrelated files;
- move business flows into Page Objects;
- move scenario assertions into Page Objects or Components;
- expose Component Objects as fixtures by default;
- remove a useful abstraction only because it is used once if it clearly improves readability;
- violate the project map;
- put project-specific code into framework core.

---

## Output Format

When reporting the simplification, use this structure:

### 1. Candidate

- abstraction:
- current location:
- current usage:
- suspected issue:

### 2. Classification

- justified or unjustified:
- reason:
- affected layer:

### 3. Simplification Applied

- files changed:
- what was removed:
- what was kept:
- behavior preservation notes:

### 4. Verification

- impacted specs:
- related specs:
- quality gate:
- not run reason, if any:

### 5. Result

- architecture became simpler because:
- no behavior changed:
- remaining follow-up, if any:

---

## Done Criteria

This skill is complete when:

- unnecessary abstraction was identified through usage evidence;
- simplification strategy was chosen;
- behavior and test intent stayed unchanged;
- minimal diff was applied;
- no unrelated refactor was introduced;
- impacted specs were run or documented as not run;
- quality gate was run or documented as not run;
- architecture became simpler and clearer.

---

## Anti-Patterns

Avoid:

- deleting abstractions without checking usage;
- simplifying based only on file count;
- replacing clear components with huge Page Objects;
- removing useful abstractions that isolate real complexity;
- turning Page Objects into utility classes;
- turning helpers into dumping grounds;
- keeping fixtures with no meaningful reuse;
- keeping components that only wrap one locator;
- keeping domain flows for one simple action;
- broad cleanup during a targeted simplification;
- changing assertions while simplifying architecture.

---

## Main Principle

Simplify only when abstraction does not earn its cost.

Keep behavior unchanged.

Remove premature abstractions.

Keep justified abstractions.

Prefer clarity over cleverness.