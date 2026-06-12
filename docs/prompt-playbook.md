# AI Prompt Playbook for Playwright UI Automation

This playbook contains reusable prompt templates for working with Playwright Planner, Generator, Healer, Review and Data Builder workflows.

---

## 1. General Principle

Every good prompt should answer five questions:

1. What should the agent do?
2. Which files should the agent read?
3. Which files may the agent create or update?
4. What must the agent NOT do?
5. How should the result be verified?

Universal structure:

```text
Use Playwright <planner/generator/healer> agent.

SCOPE:
<What needs to be done>

INPUTS:
@<plan/spec/rules/related files>

OUTPUT:
Create/Update ONLY:
- <file 1>
- <file 2>

Do NOT create:
- <forbidden files/folders>

CONSTRAINTS:
- Follow project rules strictly
- Use test.step in every UI test
- Keep expect only in spec files
- Page Objects and Components contain locators + actions only
- Use fixtures instead of manual Page Object creation
- beforeEach must contain only safe navigation + page-loaded checks
- Do not use waitForTimeout
- Use getByTestId for data-test attributes
- Keep diff minimal

VERIFY:
1) Run: <specific test command>
2) Run: npm run qa:gate
Stop only when both pass.
```

---

## 2. Decision Rule

```text
No plan yet                         -> Planner
Plan exists, code needed             -> Generator
Test is failing                      -> Healer
Code works but architecture is weak  -> Review, then Refactor
Need reusable test data              -> Data Builder prompt
```

---

## 3. Planner Prompt Template

Use this when a feature has no test plan yet.

```text
Use Playwright planner agent.

SCOPE:
Create a UI test plan for <FEATURE_NAME>.

INPUTS:
@.cursor/rules/20-ui-architecture.mdc
@.cursor/rules/00-project-map.mdc

TARGET:
Go to <URL or use configured baseURL>.
Explore the app UI where needed.
Use Playwright MCP if needed to inspect real UI behavior.

OUTPUT:
Create and save the plan as:
specs/<feature-name>.md

CONSTRAINTS:
- UI-only for now
- Include happy path, negative cases, validation cases and edge cases
- Do not include API tests
- Do not include visual/performance tests unless explicitly required
- Keep the plan consistent with current project structure

PLAN REQUIREMENTS:
For each scenario include:
- Preconditions
- Steps
- Expected results

Also include:
- Required Page Objects
- Required Components if any
- Test data requirements
- Notes about stable locators
- Risks or assumptions

VERIFY:
No code generation yet.
```
Use Playwright Planner.

TASK:
Go to https://automationexercise.com/contact_us  and create a development-ready UI test plan for the Contact Us form.

Use Playwright MCP to inspect the real page UI and form behavior.

Follow the project map and repository rules.

Read available requirements from:
- visible page UI;
- form fields;
- labels/placeholders;
- buttons;
- validation behavior;
- success/error messages;
- required fields;
- file upload behavior, if present.

If explicit requirements are not available, infer only from observable UI behavior and clearly mark assumptions.

CONSTRAINTS:
- UI-only for now.
- Do not include API tests.
- Do not implement code.
- Do not create Page Objects, Components, fixtures, builders, or specs yet.
- Do not modify any files except the requested plan file.
- Do not invent hidden business requirements.
- Do not include scenarios that cannot be validated through UI behavior.

PLAN REQUIREMENTS:
Create scenarios covering:
- positive cases;
- negative cases;
- edge cases;
- validation cases;
- file upload behavior, if applicable;
- required field behavior;
- form reset or post-submit state, if observable.

For each scenario include:
- scenario ID;
- title;
- priority: smoke or regression;
- tags: @ui and @smoke or @regression;
- preconditions;
- test data;
- steps;
- expected result;
- notes or assumptions, if any.

Also include:
- feature scope;
- out of scope;
- required test data summary;
- candidate Page Objects;
- candidate Component Objects;
- risks and unknowns;
- recommended first implementation batch of 3-5 scenarios.

SAVE PLAN AS:
specs/contact-us.md

Do not implement automation code yet.

The plan must be ready for development.
---

## 4. Generator Prompt Template

Use this when a plan already exists and code needs to be created or updated.

```text
Use Playwright generator agent.

SCOPE:
Implement UI tests for <FEATURE_NAME> based on the existing test plan.

INPUTS:
@specs/<feature-name>.md
@.cursor/rules/20-ui-architecture.mdc
@.cursor/rules/00-project-map.mdc
@src/test/fixtures/ui.fixture.ts
@src/test/data/<relevant-data-files-if-needed>

OUTPUT:
Create/Update ONLY:
- src/test/pages/<FeaturePage>.ts
- src/test/components/<ComponentName>.ts if needed
- src/test/utils/<feature>.utils.ts if needed
- tests/ui/<area>/<feature>.ui.spec.ts
- src/test/fixtures/ui.fixture.ts only if a new Page Object fixture is needed

Do NOT create other spec files.
Do NOT add new dependencies.

CONSTRAINTS:
- Use the test plan as the source of truth
- Do not invent scenarios outside the plan
- Implement first batch of 3-5 tests only
- Use test.step in every test
- Keep expect only in spec files
- Page Objects and Components must contain locators + actions only
- Use fixtures instead of manual Page Object instantiation
- beforeEach must contain only safe navigation + page-loaded checks
- Do not use waitForTimeout
- Use getByTestId for data-test attributes
- Keep diff minimal

PROCESS:
1) List which scenarios from the plan will be implemented in this batch
2) Create/update Page Objects and Components if needed
3) Create/update the spec file
4) Run the generated spec
5) Fix failures if needed

VERIFY:
1) Run: npx playwright test tests/ui/<area>/<feature>.ui.spec.ts
2) Run: npm run qa:gate
Stop only when both pass.
```

---

## 5. Sorting / Filtering Generator Prompt

Use this for sorting/filtering when API seed is not available yet.

```text
Use Playwright generator agent.

SCOPE:
Implement first batch of UI tests for product sorting/filtering using invariant-based assertions.

INPUTS:
@specs/<sorting-or-filtering-plan>.md
@.cursor/rules/20-ui-architecture.mdc
@.cursor/rules/00-project-map.mdc
@src/test/fixtures/ui.fixture.ts

OUTPUT:
Create/Update ONLY:
- src/test/pages/ProductsPage.ts
- src/test/components/SortDropdownComponent.ts if needed
- src/test/components/ProductListComponent.ts if needed
- src/test/components/FilterPanelComponent.ts if needed
- src/test/utils/sorting.utils.ts if needed
- src/test/utils/filtering.utils.ts if needed
- tests/ui/products/<feature>.ui.spec.ts
- src/test/fixtures/ui.fixture.ts only if ProductsPage fixture is needed

Do NOT create other spec files.
Do NOT add new dependencies.

CONSTRAINTS:
- Use the plan as the source of truth
- Implement first batch of 3 tests only
- Do not assert exact fixed product counts
- Use invariant-based assertions:
  - ascending price must be non-decreasing for first N visible products
  - descending price must be non-increasing for first N visible products
  - filtering must ensure visible products satisfy the selected predicate
  - reset should restore a broader state when applicable
- Use test.step in every test
- Keep expect only in spec files
- Page Objects and Components must contain locators + actions only
- Use fixtures instead of manual Page Object instantiation
- beforeEach must contain only safe navigation + page-loaded checks
- Do not use waitForTimeout
- Use getByTestId where possible
- Keep diff minimal

VERIFY:
1) Run: npx playwright test tests/ui/products/<feature>.ui.spec.ts
2) Run: npm run qa:gate
Stop only when both pass.
```

---

## 6. Healer Prompt Template

Use this when a test fails.

```text
Use Playwright healer agent.

SCOPE:
Fix failing UI test without masking real product behavior.

INPUTS:
@tests/ui/<area>/<feature>.ui.spec.ts
@src/test/pages/<FeaturePage>.ts
@src/test/components/<Component>.ts if relevant
@.cursor/rules/20-ui-architecture.mdc
@.cursor/rules/00-project-map.mdc

PROBLEM:
Test is failing:
<PASTE ERROR OUTPUT / STACKTRACE>

Expected behavior:
<WHAT SHOULD HAPPEN>

Actual behavior:
<WHAT HAPPENED>

CONSTRAINTS:
- Do not use waitForTimeout
- Do not blindly increase timeouts or retries
- Do not change expected behavior unless the spec is wrong
- Keep expect only in spec files
- Keep test.step structure
- Keep beforeEach safe
- Prefer fixing locator, wait strategy, test data or flow at the correct level
- Keep diff minimal

PROCESS:
1) Identify the failing step
2) Classify root cause:
   - locator issue
   - timing issue
   - navigation issue
   - data issue
   - environment issue
   - product behavior changed
3) Explain root cause in 2-5 bullets
4) Apply minimal fix
5) Re-run the failing spec

STOP CONDITIONS:
If the application behavior changed or the test plan is wrong, stop and explain instead of forcing the test to pass.

VERIFY:
Run: npx playwright test tests/ui/<area>/<feature>.ui.spec.ts
Then run: npm run qa:gate
Stop only when both pass.
```

---

## 7. Review Prompt Template

Use this when code works but architecture may be wrong.

```text
Act as a Senior QA Automation Architect.

SCOPE:
Review current implementation for compliance with project UI testing rules.

INPUTS:
@.cursor/rules/20-ui-architecture.mdc
@.cursor/rules/00-project-map.mdc
@tests/ui/<area>/<feature>.ui.spec.ts
@src/test/pages/<FeaturePage>.ts
@src/test/components/<Component>.ts if relevant
@src/test/fixtures/ui.fixture.ts

TASK:
Review only. Do not modify code.

CHECK:
- UI tests use test.step
- expect is only in spec files
- Page Objects and Components contain locators + actions only
- beforeEach contains only safe navigation + page-loaded checks
- tests use fixtures instead of manual Page Object creation
- no waitForTimeout
- getByTestId is used for data-test attributes
- test data is not hardcoded inline when builder/dataset exists
- tests have required tags if tagging policy exists
- no duplicated navigation already handled by beforeEach

OUTPUT:
Return:
1) Findings
2) Severity: critical / major / minor
3) Suggested minimal fixes
4) Do not apply changes
```

---

## 8. Refactor Prompt Template

Use this after review has identified concrete issues.

```text
Act as a Senior QA Automation Engineer.

SCOPE:
Apply minimal refactor based on the review findings.

INPUTS:
@tests/ui/<area>/<feature>.ui.spec.ts
@src/test/pages/<FeaturePage>.ts
@src/test/components/<Component>.ts if relevant
@src/test/fixtures/ui.fixture.ts
@.cursor/rules/20-ui-architecture.mdc

TASK:
Apply only the agreed fixes.

CONSTRAINTS:
- Keep diff minimal
- Do not rewrite the whole file
- Do not change test intent
- Do not add new abstractions unless required
- Keep expect only in spec files
- Keep test.step structure
- Do not use waitForTimeout

VERIFY:
1) Run impacted spec
2) Run npm run qa:gate
Stop only when both pass.
```

---

## 9. Data Builder Prompt Template

Use this when a feature requires generated data.

```text
Use Playwright generator agent.

SCOPE:
Create a reusable test data builder for <ENTITY_NAME>.

INPUTS:
@.cursor/rules/20-ui-architecture.mdc
@.cursor/rules/00-project-map.mdc
@src/test/data if relevant

OUTPUT:
Create/Update ONLY:
- src/test/data/types/<entity>.ts
- src/test/data/generators/unique.ts if needed
- src/test/data/builders/<entity>Builder.ts

Do NOT create tests.
Do NOT modify Page Objects.
Do NOT add dependencies.

CONSTRAINTS:
- Builder must return a valid object by default
- Builder must support overrides via Partial<T>
- Unique fields must be generated centrally
- Do not generate test data inline in spec files
- Keep implementation simple and reusable
- No API calls here

PROCESS:
1) Define type
2) Add unique generators if needed
3) Add builder with valid defaults
4) Show example usage

VERIFY:
Run typecheck or qa:gate if available.
```

---

## 10. Quick Checklist

Before sending any prompt, answer:

```text
1. What do I want the agent to do?
2. Which files should the agent read?
3. Which files is the agent allowed to create/update?
4. What must the agent NOT do?
5. How should the result be verified?
```

---

## 11. Golden Rule

```text
Plan -> Data -> POM/Components -> Tests -> Verify -> Heal -> Harden rules/gate
```

Every new feature should follow this cycle.

##  12. Standard Prompt Structure

All prompts must follow this structure:

SCOPE:
What needs to be done

INPUTS:
Files and context

OUTPUT or TASK:
Expected result

CONSTRAINTS:
Restrictions and rules

VERIFY:
Commands to validate result

## Rules

- Always use full code blocks (no partial prompts)
- Never mix explanations inside prompts
- Never place INPUTS outside the INPUTS section
- Never place SCOPE at the end
- Keep prompts minimal and explicit

## API Prompt Guidelines

API interactions are simpler than UI and should use minimal prompts.

### Core Principle

Do not over-specify. API prompts should be short and focused.

The agent should rely on existing rules and minimal input.

---

## Standard API Prompt Pattern

Use the following structure:

- What to implement
- Endpoint
- Optional payload

### Example

```text
Implement login API test.

Endpoint:
POST /users/login

Payload:
{
  "email": "...",
  "password": "..."
}
```

## Rules for API Prompts

- Keep prompts short (ideally 2–5 lines)
- Do NOT describe architecture in the prompt
- Do NOT include unnecessary explanations
- Do NOT include full URLs (use relative endpoints)
- Prefer environment variables for base URL (`API_BASE_URL`)
- Let the agent create a minimal API client if needed

---

## API Test Design Principles

- One test = one request + assertions
- Start with a positive case, then add negative cases

### Always validate:
- Response status
- Response body (only essential fields)

---

## Avoid Over-Engineering

- Do not over-abstract early
- Keep implementation simple
- Introduce structure only when duplication appears

---

## API Architecture Guidance

- Use simple API clients to group endpoints
- Do NOT introduce complex abstraction layers
- Do NOT reuse UI patterns (no components)
- Fixtures are optional — add only when necessary

---

## Negative Testing Guidelines

Always include cases for:

- Invalid credentials
- Missing fields
- Invalid formats
- Unauthorized access (e.g., invalid token)

---

## When to Keep It Simple

For small or new API features:

- Write tests directly using request calls
- Introduce API client only when duplication appears

---

## Guiding Principle

**Prompt = trigger**  
**Rules = behavior**

Do NOT move logic into prompts.  
Keep prompts minimal and rely on the system.

---

## Think

Новая UI-фича?
-> Planner -> Generator + implement-ui-feature

Падает тест?
-> Healer + heal-ui-test

Нужны данные?
-> create-test-data-builder

Нужен Page Object?
-> create-page-object

Нужен Component?
-> сначала discover-ui-components

Новый API endpoint?
-> implement-api-feature

Нужен API client?
-> create-api-client

Нужен Allure?
-> configure-allure-reporting

Изменилась структура?
-> update-project-map

После любых изменений?
-> run verification / qa:gate


Не пытаться помнить всё.

1 задача = 1 основной skill.

Project Map решает где.
Rules решают что нельзя.
Skill решает как.
Agent выполняет.
Scripts проверяют.