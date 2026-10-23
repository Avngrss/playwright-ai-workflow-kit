# Test Automation Strategy — <product>

<!-- Template from the automation setup. Replace every <…> with the project's own values; delete
what does not apply. It describes principles and process for the people working with the
tests — the exact rules are applied by the kit's skills and checked by `npm run qa:gate`. -->

How automated tests are planned, written, run and kept alive in this repository, and how they
relate to manual QA, stories and CI. For QA engineers, developers and leads.

Scope: <product> — the platforms (apps) registered in `specs/project-map.md`; with several, each
has its own addresses, sign-in, smoke, report and tag, and its tests live under its own folders.
Stack: TypeScript +
Playwright (API, UI, E2E), Allure reports, one convention gate (`npm run qa:gate`).

## 1. Goals and principles

- **Regression safety on the QA stand.** Tests run against `<qa-stand>`, the stand releases go out
  from — never against feature branches or developer sandboxes.
- **Automation follows manual QA by one step.** A story is tested manually first (its test cases in
  `<TMS>`, exploratory), accepted, and only then automated. Automation locks in behaviour already
  agreed to be correct; it does not discover it.
- **Every test earns its place.** It exists because a user needs that scenario to work, or because
  a breakage there is expensive — and its plan says which.
- **Pyramid, not a UI wall.** Rules, permissions and negatives through the API; what a user sees and
  does through the UI; a handful of critical journeys end to end. The cheapest layer that covers
  the risk wins.
- **Grounded in reality.** Requirements are candidates; a case is written only after a live check
  on the stand. Drift from the documentation is recorded, never transcribed.
- **Traceable.** Every test sits in its feature's folder and links back to its story and, when
  there is one, its manual test case.
- **Readable by people who never open the code.** Test titles are outcomes, steps are what a person
  does, a failure says in plain words what was expected and what happened.

## 2. Layers and what belongs where

| Layer | Covers | Does not |
|---|---|---|
| **API** (`tests/api`) | contracts, business rules, permissions per role, validation, negatives | drive a browser; replace checks of what the user sees |
| **UI** (`tests/ui`) | one page or screen: what renders, actions, dialogs, messages, role-dependent visibility | log in through the form (the session is a precondition); re-check server rules covered by API |
| **E2E** (`tests/e2e`) | one journey across pages or roles with a user-visible outcome | be a single-page check; hide the journey in a helper |
| **Smoke** (`tests/smoke` + one test per feature tagged `@smoke`) | "is the stand alive — does each feature work at all?" | more than one test per feature; roles of their own; stop the run for one feature |

Where a case belongs follows from where its failure would point: at the server → API; at the
screen → UI; at the seam between features, roles or apps → E2E. An E2E case names what it connects;
with nothing to connect it is a UI case. **API + UI** is not a fourth layer but a choice for one
feature: both layers, each covering its own side — server rules in API tests, the screen in UI
tests — never the same thing twice.

### Coverage — how much is tested

The source given for a feature decides what enters its plan:

| Source | What enters the plan |
|---|---|
| test cases in `<TMS>` | exactly those cases; gaps are shown, the engineer decides |
| a story or requirements doc | every documented rule and acceptance criterion |
| only a description | the user scenarios and risks found on the live stand, rated by value and risk |

Every case carries a value (main / frequent / rare scenario, or a risk), a severity (Critical /
Major / Minor — how bad a breakage is) and a priority (P1 / P2 / P3 — which failure to look at
first). P1 and P2 are written; P3 is recorded as "not now". Priority is for triage, not for
choosing a run: every feature test is regression.

### Smoke

Smoke is never stretched by roles. **Sign-in** (the template's check, per app, the first account
only, seconds) runs first; when it is red the app's other tests do not run, instead of failing by
the hundred. **Features** — at most one test per feature: its main scenario under the first
account, read-only or cleaning up, tagged `@smoke` besides `@regression` and marked in the feature's
plan. Many features → many such tests, never more per feature. They run with `npm run test:smoke`
and in the regression; a red one never stops the others.

### Tags

Layer (`@api` / `@ui` / `@e2e`) and scope (`@smoke`, `@regression`, quarantine `@wip` / `@flaky`).
No feature or area tags — the folder carries them; select by path (`npx playwright test
tests/ui/<platform>/<area>`). A cross-cutting tag (e.g. `@permissions`) exists only when registered
in `specs/project-map.md` §Allowed tags with its meaning.

### Naming

A test title is the outcome in one sentence (`Adding a duplicate entry is rejected`); its steps are
what a person does, 2–5, the check step starting with **Verify**. No implementation words (API,
request, locator, payload, id) in titles or steps. Tests are independent and run in parallel; the
few that change a state other tests see on the shared account (a saved view, a "newest entries"
widget) declare the same lock, registered in `specs/project-map.md` §Shared state, and never run at
the same time.

## 3. Structure

```
specs/project-map.md                                apps, URL env names, auth, roles, tags — the single source of truth
specs/<platform>/<area>/<feature>/<feature>.md      the feature's plan: cases, what is not automated and why
tests/<api|ui>/<platform>/<area>/<feature>/         the feature's tests
tests/e2e/<platform>/<area>/                        journeys of an area
tests/smoke/sign-in.smoke.spec.ts                   smoke's sign-in check (the template's); a feature's smoke test is tagged @smoke in its own folder
src/                                           support code — clients, Page Objects, data, fixtures, reporting
src/data/sweeps.ts                             what the sweep removes after an interrupted run
scripts/run-tests.mjs, auth.mjs                     running the tests; the accounts (auth:check, auth:sign-in)
scripts/gate/                                       the gate (qa:gate): check.mjs and its rules by topic
scripts/agent/                                      what the kit's skills run: env:prepare, app:add, suite:coverage
```

Folders are by **feature**, never by ticket: stories come and go, features stay; tickets are links.

## 4. Process — from story to regression

```
1. The story is developed                                    (dev)
2. It is deployed to the QA stand and tested manually         (QA, test cases in <TMS>)
3. It is accepted                                             (QA)
4. The feature's plan is written or refreshed                 (QA + the plan skill)
   from: the test cases / the story / a description → live check on the stand
   result: what will be written, what will not, and why — confirmed by the engineer
5. Ready cases are implemented, checked by the gate, run, reported   (QA + the implement and verify skills)
6. Merge request → review → merge                             (QA + reviewer)
7. The tests join the smoke / regression runs in CI           (§7)
```

**Not stable or not deployed — not automated.** A feature missing from the stand, or contradicting
its requirements in more than isolated places, is reported as not ready; no plan is written. What
stays manual by design: exploratory testing, visual judgement, flows that need systems or accounts
we do not control, anything the plan marks "cannot be automated" with a reason.

## 5. Traceability

| Link | How | Visible in |
|---|---|---|
| story ↔ plan | the plan header carries `Ticket: <KEY>-…` | the plan |
| manual case ↔ test | the case id is in the plan; the test links the case URL | the plan; the report's links |
| epic ↔ area | an epic is a product area | folders; the report tree |

The manual case and the autotest are one row: written first by hand, then automated. The test
follows the case in meaning, not word for word.

**A TMS suite's coverage** is a table built fresh from the suite in `<TMS>`, the tests' case links,
the plans and the last run: what is automated (by which layer, how it ended last time) and what is
not and why — blocked (and what unblocks it), postponed, cannot be automated, planned but not
written yet, not planned yet — with the date each reason was recorded. It is shown at the end of
writing tests and on request; the Allure report shows only what ran. No TMS → no coverage table.

## 6. Environments, roles and data

- **Environment** — the QA stand only. Hosts and secrets come from `.env` / CI variables; their
  **names** are registered in `specs/project-map.md`, values never leave `.env`.
- **Roles** — listed in `specs/project-map.md` §Auth with the default role; the tests read them
  from there. A role is added or changed by editing the map and `.env`; a role missing from the
  map is never invented.
- **Data** — every test creates what it needs and removes it, with a recognisable marker in its
  name; leftovers of interrupted runs are swept at the start and the end of every run. A test never
  assumes how much data a shared account holds. A state the stand cannot give honestly is shown
  with a faked server answer, and the test says so.
- **Accounts** — <shared QA accounts | dedicated test users>. Shared accounts mean runs on one stand
  must not overlap.

## 7. Continuous integration

<CI system> in this repository, a runner with network access to the QA stand, secrets as masked
CI variables named as in `.env.example`.

| Trigger | Runs | Purpose |
|---|---|---|
| merge request | gate + smoke + regression of the changed area | keep conventions and touched features green |
| deploy to QA | smoke | is the stand alive after the deployment |
| nightly | regression (without `@wip`, `@flaky`) | full regression |
| nightly, allowed to fail | `@flaky` only | keep quarantined tests visible (§8a) |
| manual | a chosen suite | on demand |

The report (Allure HTML, history between runs) is published with **restricted access**:
screenshots, videos and traces show real data from the stand. Runs on a shared stand are
serialised (<the CI's lock on the stand>).

## 8. Definition of done

A test is done when its case is ready in the plan and was live-checked; the gate passes; it passed
twice in a row on the stand; it cleans up what it created; the report shows it in the right place
with readable steps; the plan and, when there is one, the manual case are updated.

A failing test is first **healed** (locator, timing or data — the assertion stays); behaviour that
contradicts the plan goes back to planning. A requirement change is never "fixed" in the test.

### 8a. Flaky tests — detection, quarantine, exit

A flaky test passes and fails on the same code and stand. It is a defect of the test, the data or
the stand — never hidden with waits, retries in the test body or a softened assertion.

| Stage | Rule |
|---|---|
| **Detect** | A failed test is retried once locally, twice on CI (smoke never); one that passed on the retry shows as unstable (flaky) in the report and the run's summary, not red. A new or healed test proves itself with `--retries=0` or `--repeat-each 5`. |
| **Quarantine** | Flaky in 2 consecutive nightly runs → `@flaky` with a reason comment (`// flaky: <cause> — <ticket>`); it leaves regression (and smoke) and runs in its own nightly job. |
| **Heal** | Classify the cause first — timing / locator, data collision, the stand — and fix only that cause, keeping the assertion. |
| **Exit** | 5 consecutive green runs → back to `@regression`, the fix noted in the plan. |
| **Never** | `@flaky` without a reason, a fixed wait, a `try/catch` around an assertion, a quarantine older than two sprints without a ticket. |

### 8b. Known bugs — a test failing on a filed bug

A test that fails on a bug confirmed by hand and filed keeps its expectation and its code. Its row in
`specs/known-bugs.md` (test, layer, ticket, the step it fails at) makes the run mark it: grey while it
fails at that step, red "known bug looks fixed" once it passes, red with the real cause when anything
else fails it. The row goes when the ticket is retested and closed.

## 9. Reporting

Allure: a tree by platform → area → feature → API / UI, smoke and journeys as their own groups;
steps per test; severity; failures in plain text with the page, trace, screenshot and video;
links to the manual case and to a known bug's ticket. Product findings made while automating (missing test ids,
inaccessible controls, contract drift) go to the owning team as tickets — they are product issues,
not test issues.

## 10. Ownership

- The QA engineer who covers a feature owns its plan and tests; the plan's "not now" cases are the
  backlog of what the team must provide (accounts, data, decisions).
- `specs/project-map.md` changes only when a new app, role or tag is genuinely needed — every plan
  reads it.
- Conventions live in this file and the gate; a convention change comes with a gate change.
