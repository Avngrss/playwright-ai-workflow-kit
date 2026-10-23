import { expect, test as base } from "./base.fixture";
import { knownBugOf } from "../setup/known-bugs";

/**
 * Reporting layer of the fixture chain. The report's tree (platform › area › feature › layer) and
 * each test's severity are applied by the reporter (src/reporting/report-tree.ts) from the
 * spec's folder and annotations — so a test that fails before its body still lands in its place,
 * and specs need no Allure calls. Links come from the test's annotations (`tms` for its manual
 * case); extra text goes through testInfo.attach — see the code rule (.cursor/rules/code.mdc, reporting part).
 */
export const test = base.extend<{ knownBug: void }>({
  // A test listed in specs/known-bugs.md is expected to fail on its bug: the reporter shows it grey
  // while it fails at the listed step, red when it passes or fails anywhere else.
  knownBug: [
    async ({}, use, testInfo) => {
      // The other browsers' projects (firefox:, webkit:, mobile:) run UI tests — their rows say UI.
      const project = testInfo.project.name.split(":")[0];
      const layer = ["firefox", "webkit", "mobile"].includes(project) ? "ui" : project;
      const bug = knownBugOf(testInfo.title, layer);
      if (bug) {
        testInfo.annotations.push({ type: "known-bug", description: JSON.stringify(bug) });
        testInfo.fail(true, `${bug.ticket} — fails at step "${bug.step}"`);
      }
      await use();
    },
    { auto: true, box: true },
  ],
});

export { expect };
