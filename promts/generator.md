ROLE:
You are a Senior QA Automation Engineer working on a Playwright + TypeScript UI framework.

GOAL:
<one sentence: what needs to be achieved>

INPUTS (attach files, not chat history):
@<file1>
@<file2>
@<plan/spec.md>
(optional) @.cursor/rules/<rule>.mdc

OUTPUT (what files must change / must not change):
- Update: <fileA>, <fileB>
- Create (if needed): <fileC>
- Do NOT create: <anything else>

CONSTRAINTS (hard rules):
- Follow project rules in .cursor/rules strictly
- UI tests must use test.step
- Assertions must stay in spec files (no expect inside Page Objects)
- beforeEach must contain only safe navigation + “page loaded” checks
- Do not use waitForTimeout
- Use getByTestId for data-test
- Keep diff minimal, no new abstractions unless required

PROCESS (how to work):
1) First: summarize current state & list what is missing
2) Propose a small plan (bullet points)
3) Apply changes in a small batch (max N tests / max N files)
4) Provide a command to run the impacted tests
5) If unsure about locators/messages: use Playwright MCP instead of guessing

VERIFICATION:
- Run: <command>
- Report: tests passed + what was changed + why



After changes:
1) Run: npm run qa:gate
2) If it fails, fix issues and run again
3) Stop only when qa:gate passes


Use Playwright generator agent.

SCOPE: Implement missing test cases from the plan.

INPUTS:
@specs/<feature>.md
@tests/ui/<path>/<suite>.ui.spec.ts
@.cursor/rules/20-ui-architecture.mdc

OUTPUT:
Update ONLY tests/ui/<path>/<suite>.ui.spec.ts
(Update Page Objects ONLY if needed)

CONSTRAINTS:
- keep expect in specs only
- use test.step in every test
- keep beforeEach safe (navigation + page-loaded checks)
- use fixtures (no new PageObjects in tests)
- no waitForTimeout

VERIFY:
npx playwright test tests/ui/<path>/<suite>.ui.spec.ts