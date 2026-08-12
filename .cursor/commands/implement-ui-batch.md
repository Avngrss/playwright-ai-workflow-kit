Use Skill: @.cursor/skills/implement-ui-feature/SKILL.md
<UI coverage items from the feature plan to implement now>

Task:
Implement only the selected UI implementation scope from the UI Implementation Brief.

Input:
- Feature plan with UI Implementation Brief
- existing Page Objects / Components / builders if any

Scope:
- UI tests only
- no API tests
- no visual screenshots unless explicitly requested
- minimal changes

Architecture:
- create/update minimal Page Object only if needed
- prefer Page Object first
- do not create Component Object by default
- use Discover UI Components only if ownership is unclear
- do not create new fixture unless required
- if a new fixture is inferred (not explicitly requested), provide a fixture recommendation first and wait for confirmation
- do not hide the action under test in fixtures/hooks

Data:
- reuse existing builders/generators/datasets when suitable
- do not define reusable buildData/buildFormData functions inside specs
- do not export form data types from Page Objects

Page Object:
- use readonly Locator fields initialized inside the constructor
- do not use getter-based locators by default
- do not put assertions, test.step, builders, generators, or default data into Page Objects

Tests:
- use meaningful test.step
- use required tags from the plan
- avoid raw selector mechanics in specs
- avoid inline random data
- keep assertions in specs or dedicated assertion helpers
- for form/mutation features, keep both plain positive and negative user-facing branches when both are planned ready
- do not treat optional-path success (attachment, optional fields) as the only positive coverage; keep a plain happy path
- move repeated page-open + loaded-marker setup into beforeEach when shared in one describe

If blocked:
stop and report missing locator, data, fixture, page ownership, or behavior details.

After changes:
run impacted UI spec and quality gate from project map.

Report:
- files changed
- tests added/updated
- Page Object/component decisions
- data/setup strategy
- postponed or blocked cases
- verification commands/results
- remaining risks

Feature plan:
<path to feature plan>
