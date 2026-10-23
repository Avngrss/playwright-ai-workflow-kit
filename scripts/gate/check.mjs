/**
 * qa:gate — the suite's conventions, checked before every commit (`npm run qa:gate`, then tsc). Every
 * problem is listed at once and says how to fix it; warnings never fail the gate. The rules live by
 * topic in this folder (scripts/gate/):
 *   patterns.mjs  one-line rules: what specs, Page Objects, clients and all test code may not do
 *   layout.mjs    where plans, specs and support code live
 *   specs.mjs     tags and scope, quarantine reasons, hooks, mocks, case links
 *   support.mjs   the fixture chain, roles from the map, a sweep for every disposable fixture
 *   models.mjs    Page Objects and components: size, state, second names, unused members, siblings repeating their base
 *   repeats.mjs   the same thing twice: copied lines, the same code in two apps, a case automated twice
 *   cases.mjs     a manual case automated whole or not at all, on the layers its plan says it needs
 *   reading.mjs   a UI test reads as its case: no data shaped in the spec, a step is one action and its checks
 *   pointers.mjs  every rule and skill the code names exists in .cursor/
 *   advice.mjs    warnings: size, readability
 */
import { adviceRules } from "./advice.mjs";
import { caseRules } from "./cases.mjs";
import { collectFiles, createReport } from "./context.mjs";
import { layoutRules } from "./layout.mjs";
import { checkPatterns } from "./patterns.mjs";
import { repeatRules } from "./repeats.mjs";
import { specRules } from "./specs.mjs";
import { supportRules } from "./support.mjs";
import { modelRules } from "./models.mjs";
import { readingRules } from "./reading.mjs";
import { pointerRules } from "./pointers.mjs";

const files = collectFiles();
const report = createReport();
for (const rule of [checkPatterns, ...layoutRules, ...specRules, ...supportRules, ...modelRules, ...repeatRules, ...caseRules, ...readingRules, ...pointerRules, ...adviceRules]) rule(files, report);

console.log(`qa:gate — ${files.specs.length} spec(s), ${files.support.length} support file(s)`);
for (const warning of report.warnings) console.log(`! ${warning}`);
for (const failure of report.failures) console.log(`✗ ${failure}`);

if (report.failures.length > 0) {
  console.log(`\n${report.failures.length} problem(s) — fix them and run the gate again.`);
  process.exit(1);
}
console.log(`\nConventions hold${report.warnings.length ? ` (${report.warnings.length} warning(s) to weigh)` : ""}.`);
