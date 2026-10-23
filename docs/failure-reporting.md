# Failure reporting

How to read a red run. Readable failures are built in, so there is nothing to configure. The code is
`src/reporting/failure-cause.ts`, `readable-error.ts` and `run-summary.ts`, behind the reporters
in `playwright.config.ts`. The rules are in `.cursor/rules/code.mdc` (§Failures explain themselves,
§The Allure report, §Flaky tests) and `plans.mdc` §Known bugs; the verify skill §8.1 explains a failure.

## 1. Start with the run's summary

At the end of every run, the summary is printed in the terminal and written to
`reports/run-summary.md`. `reports/run-summary.json` holds the same summary as data, for the agent.

```text
Run 23/10, 14:05 — 42 tests: 38 passed · 2 need a look · 1 known bug · 1 unstable
```

Under that line, every failure is listed in its verdict group, in the order below. Each one names
its cause and step and says what to check by hand. Then come two more lists:

- tests that passed only on a retry;
- tests whose cleanup failed, which may have left data on the stand (`npm run data:sweep` removes
  `AQA`-marked leftovers).

## 2. The verdict comes first

Every failure opens with two lines: the verdict, and `Cause: <cause>`.

| Verdict | Causes |
|---|---|
| **Known bug looks fixed — retest the ticket** | `known bug looks fixed`: a test listed in `specs/known-bugs.md` passed |
| **Possible bug — retest by hand** | `check did not match` · `element not found` · `server error` (a 5xx, also one in the background) |
| **Not a bug — the stand or its data** | `stand data` · `stand unavailable` (no answer, 502–504) · `sign-in or access` (401/403, session ended) · `out of time` · `cleanup` |
| **Not a bug — the test needs fixing** | `test code` (a TypeError or similar in the suite's own code) · `element not found` in a spec not committed yet — a new or changed test has not been green on the stand, so its locator is the first suspect (read from git; without git the failure reads as a possible bug) |
| **Known bug — waiting for the fix** | `known bug`: a test in `specs/known-bugs.md` still failing at its step |

A verdict is a hint for where to look first, never the answer. Only a retest by hand decides
whether something is a bug.

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

Sign-in codes and tokens in URLs are masked. A failed test also gets Playwright's own artifacts:

- a screenshot, a trace and a video;
- a page snapshot in `test-results/**/error-context.md`.

Open a trace with `npx playwright show-trace <trace.zip>`. The call log stays in the trace and in the
Playwright HTML report (`playwright-report/`).

## 4. Colours, retries, known bugs

- **Green** passed. **Red** failed, whatever broke; Allure's yellow "broken" is not used. **Grey**
  means a known bug still failing at its step (Allure calls it "Skipped").
- **Retries:** a failed test is retried once locally and twice on CI. The sign-in smoke is never
  retried. A test that passes on the retry stays green but is marked **unstable**, and is listed in
  the summary and in the Categories tab under "Unstable — passed on a retry". Verification runs use
  `--retries=0`, so a new or healed test must pass without a retry.
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
    one command: `npm run test:app -- <app> <api spec> <ui spec>`.

The report shows real stand data, so share it only with restricted access.

## 6. What a spec adds

Only names and stand-data checks:

- `expect(value, "Add address button")`: the name leads the failure text.
- `standDataMissing(…)` / `expectStandData(…)` from `src/assertions/shared/stand-data.ts`: these
  turn missing stand data into the `stand data` cause, with what to check by hand.
- `expectJson` / `expectStatus` (`src/assertions/shared/http.ts`): an HTTP mismatch then reads
  `/api/… answered 400 instead of 201`, with the body.

## Next step

| Command | What it does |
|---|---|
| `/heal explain` | Explains the last run's failures in the chat |
| `/heal` | Starts from the verdict and fixes the test: UI, E2E or API |

A confirmed bug becomes a `specs/known-bugs.md` row, added on your yes.
