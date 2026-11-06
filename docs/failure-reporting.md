# Failure reporting

How to read a red run. Readable failures are built in, so there is nothing to configure. The code is
`src/reporting/failure-cause.ts`, `product-change.ts`, `readable-error.ts` and `run-summary.ts`,
behind the reporters in `playwright.config.ts`. The rules are in `.cursor/rules/code.mdc` (§Failures
explain themselves, §The Allure report, §Flaky tests) and `plans.mdc` §Known bugs; the verify skill §8.1
explains a failure, §8 heals one or two, §10 triages a red run.

## 1. Start with the run's summary

At the end of every run, the summary is printed in the terminal and written to
`reports/run-summary.md`. `reports/run-summary.json` holds the same summary as data, for the agent.

```text
Run 23/10, 14:05 — 42 tests: 38 passed · 2 need a look · 1 known bug · 1 unstable
```

Under that line, every failure is listed in its verdict group, in the order below. Each one names
its cause and step and says what to check by hand. Then come more lists:

- tests that passed only on a retry;
- tests the stand alone failed that passed on their second pass (below): "Stand was slow — passed
  alone on a second pass";
- tests whose cleanup failed, which may have left data on the stand (`npm run data:sweep` removes
  `AQA`-marked leftovers);
- `Plans to refresh: …` — the plans of the tests the product changed under.

The last line names the one thing to tell the agent, by how many tests need a look (a test that
passed only on a retry counts, a known bug still failing at its step does not): none → no line;
one or two → `Next — tell the agent in this test home: heal the red tests: <spec>:<line> …`; three or
more → `… triage the run <link>` (on CI the job's page, on a machine `reports/run-summary.json`). The
JSON holds the same choice as `nextPath` (`heal`, `triage` or `null`). A product or rule change you can
name comes first, whatever the line says: `/plan <plan> — <what changed>`.

**The stand's second pass.** A run started through an npm script (`scripts/run-tests.mjs`) runs the
tests it failed for the stand alone — `stand unavailable` or `out of time` — once more at the end,
one at a time, without a retry, in the project each failed in. Passed now → listed as the stand was
slow, and the run is not red for it; failed again → red, as the first pass said. Every such failure
says which: `passed on its second pass`, `failed again on its second pass` (with the new cause when
it differs) or `no second pass — <why>` — the sign-in smoke never runs again (a dead stand stops the
run), `stand data`, `sign-in or access`, `server error` and `cleanup` are never rerun, and a run
started with `npx playwright test` gets none. Its traces and HTML report go to
`test-results/second-pass/` and `playwright-report/second-pass/`, so the first pass's stay.
`npm run test:failed` reruns only the last run's failures and the tests it left unrun (after their
app's smoke); a test the second pass passed is no longer among them. It reproduces a failure before a
change; the rerun after a change is `npm run verify` of the touched tests.

## 2. The verdict comes first

Every failure opens with two lines: the verdict, and `Cause: <cause>`.

| Verdict | Causes |
|---|---|
| **Known bug looks fixed — retest the ticket** | `known bug looks fixed`: a test listed in `specs/known-bugs.md` passed |
| **Possible bug — retest by hand** | `check did not match` · `element not found` · `server error` (a 5xx, also one in the background) · `request did not match` (the page sent other data than the case expects) · `answer did not match` (the server answered the action with another status or other data) · `screenshot differs` |
| **Not a bug — the product changed: refresh the plan** | `API changed`: a 404/405 on a path the app's contract (the Docs cell of its API row in `specs/project-map.md`) no longer lists — with the path most like it — or a field the tests read missing or retyped in the answer (its schema names it; `npm run api:types`, then `npm run typecheck` names every place) · `screen changed`: the page shows the expected text reworded (another case or spacing, a letter or two). Read only under a committed spec: a new or changed one cannot see the product change under it, so its failure keeps its usual verdict with the finding as a note |
| **Not a bug — the stand or its data** | `stand data` · `stand unavailable` (no answer, 502–504) · `sign-in or access` (401/403, session ended) · `out of time` · `cleanup` |
| **Not a bug — the test needs fixing** | `test code` (a TypeError or similar in the suite's own code) · `element not found` in a spec not committed yet — a new or changed test has not been green on the stand, so its locator is the first suspect (read from git; without git the failure reads as a possible bug) · `screenshot without a baseline` (look at the image; right → `/implement <plan> Layer: visual · Approve baseline: yes`) |
| **Known bug — waiting for the fix** | `known bug`: a test in `specs/known-bugs.md` still failing at its step |

A verdict is a hint for where to look first, never the answer. Only a retest by hand decides
whether something is a bug, and only a quoted source (a ticket, the product's code, a commit) makes a
changed value intended — without one, triage asks you.

## 3. The rest of the failure

The message continues in this order:

- **The check's name and what it compared.** For example `Dashboard heading`, then `Expected:` /
  `Received:`. A long object shows its shape, not its data. Playwright's phrases become sentences,
  such as "Could not click the element within 5 s" or "The test ran out of time (limit 30 s)".
- **`Page: <url>`.** The page the UI test was on when it failed.
- **`Messages the app showed during the test`.** The toasts it saw.
- **`Background errors during the test`.** Server 5xx answers, page errors and console errors.
  These are also attached to passing tests.
- **`Check by hand: …`.** One concrete thing to do, for example: "Open <page>: is <element> there?
  Under another name → update the locator; not there → a bug or a changed requirement."

Sign-in codes and tokens in URLs are masked, and so is every session token by its shape (a Bearer
value, a JWT, Basic credentials) — in the summary, the report, the test's errors and output and its
trace. A failed test also gets Playwright's own artifacts:

- a screenshot, a trace and a video;
- a page snapshot in `test-results/**/error-context.md`.

Open a trace with `npx playwright show-trace <trace.zip>`. The call log stays in the trace and in the
Playwright HTML report (`playwright-report/`).

## 4. Colours, retries, known bugs

- **Green** passed. **Red** failed, whatever broke; Allure's yellow "broken" is not used. **Grey**
  means a known bug still failing at its step (Allure calls it "Skipped").
- **Retries:** a failed test is retried once locally and twice on CI. The sign-in smoke is never
  retried. A test that passes on the retry stays green but is marked **unstable**, and is listed in
  the summary and in the Categories tab under "Unstable — passed on a retry". `npm run verify` runs
  once with `--retries=0`, so a new or healed test must pass without a retry.
- **Quarantine:** a flaky test whose cause cannot be fixed now gets `@flaky` with a reason and runs
  only in `npm run test:flaky`.
- **Known bugs** (`specs/known-bugs.md`): add a row once you have confirmed the bug by hand and a
  ticket exists. The row holds the test, its layer, the ticket, the step it fails at, and the date.
  The test's code stays as it is. The run then marks the test itself:
  - while it fails at that step, it is grey: "Known bug — waiting for the fix";
  - when it passes, it is red: "Known bug looks fixed — retest the ticket";
  - when it fails anywhere else, it is red with the real cause, plus a note that the known bug is
    not what failed it this time.

  Never use `test.fail`, `test.skip` or `@flaky` for a known bug; `qa:gate` fails `test.fail`. The
  row leaves once the ticket is retested and closed.

## 5. The Allure report

```bash
npm run allure:open     # generates from reports/allure/results, serves on a local port, opens the browser
npm run allure:report   # only writes reports/allure/html
```

- **The tree** follows the folders: `<App> › <Area> › <Feature> › API | UI › test`,
  `<App> › User journeys (E2E) › <Area>`, and `<App> › Smoke · is the stand alive`.
- **The Categories tab** lists the verdicts in the order above, split by cause.
- **Several apps in one run** produce one report per app (`reports/allure/html/awesome-<app>/`),
  next to the all-apps report.
- **Two traps:**
  - A `--reporter` on the command line replaces the configured reporters, and Allure results
    silently stop being written.
  - Every npm test script clears the last run's results. To see API and UI side by side, run them in
    one command: `npm run verify -- <app> <api spec> <ui spec>` to check them, or `npm run test:app --
    <app> <api spec> <ui spec>` to only run them.

The report shows real stand data, so share it only with restricted access.

## 6. What a spec adds

Only names, stand-data checks and the shared HTTP checks:

- `expect(value, "Add address button")`: the name leads the failure text.
- `standDataMissing(…)` / `expectStandData(…)` from `src/assertions/shared/stand-data.ts`: these
  turn missing stand data into the `stand data` cause, with what to check by hand.
- `expectJson` / `expectStatus` (`src/assertions/shared/http.ts`): an HTTP mismatch then reads
  `/api/… answered 400 instead of 201`, with the body. A client's answer schema adds "a field the
  tests read is missing or retyped", naming the field.
- `answerTo` / `answersTo` (the `pages` fixture): the answer a UI action got, checked as its route
  says. A mismatch reads `The server's answer to the action — …` or `The request the action sent — …`,
  so the run tells the server's part (`answer did not match`) from the page's (`request did not
  match`).

## Next step

The summary's last line says what to tell the agent (§1).

| Command | What it does |
|---|---|
| `/heal explain` | Explains the last run's failures in the chat |
| `/heal <spec>:<line> …` | One or two red tests: starts from each verdict and fixes the test — UI, E2E or API — then `npm run verify` of the healed tests |
| `/triage` | Three or more red tests, or a CI run: every failure sorted by its verdict, every changed expectation traced to a quoted source, one message with what was fixed and what to answer |
| `/plan <plan> — <what changed>` | Refreshes a plan the product changed under (the summary's `Plans to refresh`) |

A confirmed bug becomes a `specs/known-bugs.md` row, added on your yes.
