# How To Use AI Automation System

## Purpose

This file explains how to use the project AI automation system in daily work.

The system consists of:

- Project Map
- Rules
- Skills
- Scripts
- Prompts

---

## 1. Project Map

Project Map is the source of truth.

Use it to understand:

- where files should be created;
- which fixture entry point to use;
- where Page Objects and Components live;
- where test data lives;
- which aliases are allowed;
- which commands should be executed;
- which tags are allowed.

Main file:

- `.cursor/rules/00-project-map.mdc`

Before creating files or folders, check the Project Map first.

---

## 2. Rules

Rules are always-on guardrails.

They define what is allowed and what is forbidden.

Examples:

- do not use `waitForTimeout`;
- do not use fake assertions;
- do not put project-specific logic into framework core;
- do not create fixtures for one-off values;
- do not use `expect` inside Page Objects or Components;
- do not generate inline random data in specs.

You do not manually run rules.

Cursor/AI agents use them as background constraints.

---

## 3. Skills

Skills are task-specific workflows.

Use a skill when the task matches the skill purpose.

Examples:

- new UI feature -> `Implement UI Feature From Plan`;
- failing UI test -> `Heal UI Test`;
- reusable test data -> `Create Test Data Builder`;
- unclear component ownership -> `Discover UI Components`;
- new fixture -> `Create Fixture`;
- new API endpoint test -> `Implement API Feature`;
- framework review -> `Review Framework Change`;
- after changes -> `Run Verification`.

Do not use all skills for every task.

Use the smallest skill that matches the current problem.

---

## 4. Scripts

### Update Project Map

Run this after changing repository structure, rules, skills, folders, or important files.

Command:

- `npm run project-map:update`

What it does:

- updates repository tree inside `.cursor/rules/00-project-map.mdc`;
- updates only the section between `PROJECT_MAP_START` and `PROJECT_MAP_END`;
- does not make architecture decisions.

---

### Check Conventions

Run this after changing UI specs, Page Objects, Components, or framework conventions.

Command:

- `npm run conventions:check`

What it checks:

- UI specs use `test.step`;
- UI specs do not use `waitForTimeout`;
- UI specs do not import `test` directly from `@playwright/test`;
- UI specs do not instantiate Page Objects directly;
- UI specs have `@ui` and `@smoke` or `@regression` tags;
- Page Objects and Components do not use `expect`;
- Page Objects and Components do not use `test.step`;
- Page Objects and Components do not read `process.env`;
- Page Objects and Components do not generate random data inline.

---

### Quality Gate

Run this before considering work complete.

Command:

- `npm run qa:gate`

At minimum, it runs convention checks.

Later it may also include:

- typecheck;
- lint;
- impacted tests;
- other project checks.

---

## 5. Typical Workflows

### New UI Feature

Use this flow:

1. Playwright Planner creates or validates the feature plan.
2. Use `Implement UI Feature From Plan`.
3. Use `Create Test Data Builder` if reusable data is needed.
4. Use `Discover UI Components` if component ownership is unclear.
5. Use `Create Page Object` if a new route or screen is needed.
6. Use `Create Fixture` only if reusable fixture wiring is needed.
7. Run `npm run conventions:check`.
8. Run `npm run qa:gate`.
9. If tests fail, use `Heal UI Test`.

---

### Failing UI Test

Use this flow:

1. Use `Heal UI Test`.
2. Identify root cause.
3. Apply minimal fix at the correct layer.
4. Run impacted spec.
5. Run `npm run qa:gate`.
6. If the problem is recurring, use `Harden Rules From Failure`.

Do not fix failures by:

- adding `waitForTimeout`;
- weakening assertions;
- changing expected behavior without requirement confirmation;
- hiding actions in hooks or fixtures.

---

### Unclear Component Ownership

Use this flow:

1. Use `Discover UI Components`.
2. Do not modify files during discovery.
3. Get recommendation:
   - keep inside Page Object;
   - extract Component Object;
   - reuse existing Component Object;
   - postpone extraction;
   - remove unnecessary abstraction.
4. If extraction is justified, use `Refactor Page Object To Components`.
5. Run verification.

---

### New API Test

Use this flow:

1. Use `Implement API Feature`.
2. Identify endpoint, method, auth, payload, expected status, and essential response fields.
3. Use `Create Test Data Builder` if reusable payload data is needed.
4. Use `Create API Client` only if reuse or request composition justifies it.
5. Run impacted API spec.
6. Run `npm run qa:gate`.

API tests must not use:

- Page Objects;
- Component Objects;
- UI fixtures;
- browser page interactions.

---

## 6. Prompt Usage

Use prompt templates from:

- `.cursor/AI_AGENT_PROMPTS.md`
- `.cursor/AI_AGENT_PROMPTS_RU.md`

Use workflow reference from:

- `.cursor/AI_WORKFLOW_MAP.md`
- `.cursor/AI_WORKFLOW_MAP_RU.md`

Recommended prompt structure:

1. Start with global prompt prefix.
2. Specify the skill to use.
3. Provide task context.
4. Provide files or failure output.
5. Ask for verification summary.

---

## 7. Simple Rule Of Thumb

Use this decision model:

- Need to add UI feature -> `Implement UI Feature From Plan`.
- UI test failed -> `Heal UI Test`.
- Need reusable data -> `Create Test Data Builder`.
- Need fixture -> `Create Fixture`.
- Need new page abstraction -> `Create Page Object`.
- Unsure about component -> `Discover UI Components`.
- Page Object too large -> `Refactor Page Object To Components`.
- Architecture too complex -> `Simplify Overengineered Test Architecture`.
- Need API test -> `Implement API Feature`.
- Need API client -> `Create API Client`.
- Need review -> `Review UI Suite` or `Review Framework Change`.
- Structure changed -> `Update Project Map`.
- Repeated issue -> `Harden Rules From Failure`.
- Any code change -> `Run Verification`.

---

## 8. Final Principle

Do not use everything at once.

Use the smallest matching skill.

Rules always apply.

Project Map decides structure and commands.

Scripts enforce basic conventions.

Verification follows every change.
