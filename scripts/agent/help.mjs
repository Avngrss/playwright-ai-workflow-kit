/**
 * Every npm script of the test home with its arguments and what it does — read on demand instead of a table the
 * agent would carry in an always-on rule.
 *
 *   npm run help                 every script, grouped
 *   npm run help -- verify auth  only the scripts whose name holds one of the words
 */
import path from "node:path";

export const SCRIPTS = [
  ["Run tests", [
    ["test", "", "every layer of every app"],
    ["test:api · test:ui · test:e2e", "", "one layer of every app (never narrowed with --project)"],
    ["test:app", "-- <app>[,<app>…] [layer] [targets] [--with-browsers]", "one app or several; --with-browsers adds their @cross-browser / @responsive tests in Firefox, WebKit and the phone (installed when missing)"],
    ["test:smoke · test:regression · test:flaky", "", "the sign-in smoke + each feature's @smoke test · every @regression test · only @flaky ones"],
    ["test:visual · test:cross-browser · test:responsive", "", "the tests tagged @visual · @cross-browser · @responsive"],
    ["test:failed", "", "only the last run's failures and what it left unrun — to reproduce before a change, never the rerun after one (that is verify)"],
    ["test:list", "", "list the tests without running them"],
  ]],
  ["Check", [
    ["verify", "-- <app> <spec[:line]…> [--also …] [--can-fail <spec>:<line>=<spoiled line>…] [--with-browsers]", "the gate, each new check proven able to fail, one run with --retries=0, one block of results from the result files (test-results/verify.json)"],
    ["verify", "-- --restore", "put back what a cut-off verify left spoiled"],
    ["qa:gate", "", "the conventions, then tsc — after every change, before every commit; each finding says how to fix it"],
    ["typecheck", "", "tsc only — the second half of the gate"],
    ["suite:coverage", "-- --app <app>", "each TMS case: automated · to rework · not automated · inconsistent"],
  ]],
  ["Plan and write", [
    ["plan:block", "-- <plan> [--case <link>] [--bug state/sources/<id>.json]", "a plan's next case block — empty, or filled from the case or bug"],
    ["spec:draft", "-- <plan> <#>", "a test's skeleton from a filled case block"],
    ["api:types", "[-- <app>]", "the app's answer types from its contract → src/api/clients/<app>/contract.client.ts"],
  ]],
  ["Apps, sign-in and data", [
    ["app:add", "-- <app>", "an app's own fixtures, after its map rows"],
    ["env:prepare", "-- NAME=<address> · -- --note \"<what>\" NAME… · -- NAME… · -- --tidy · -- --drop NAME", "create and fill .env without showing it: set a non-secret value · add empty entries the user fills · report filled/empty · lay .env out by app · remove a name no map row uses. A map name new to the GitHub workflow joins its env: too"],
    ["auth:check", "[-- <role>…]", "the empty login entries of .env, names only"],
    ["auth:sign-in", "-- <app> <role|all>", "sign roles in; sessions go to state/"],
    ["stand:find", "-- <app> --in \"GET <path>\" --where \"<condition>\"", "every account × tenant searched for stand data before a case is blocked"],
    ["data:sweep", "", "remove the AQA leftovers of earlier runs"],
  ]],
  ["Report and browsers", [
    ["allure:report · allure:open", "", "build · open the Allure report"],
    ["browsers:install · browsers:install:all", "", "Chromium · every browser"],
  ]],
  ["Agents", [
    ["agents:sync", "", "write the chosen agents' copies of agents/ — after an edit of a rule, skill, command or agents/mcp.json"],
    ["agents:use", "-- <claude|cursor|copilot>[,…]", "change which agents this test home works with"],
    ["help", "[-- <word>…]", "this list"],
  ]],
];

/** The script names an entry covers: "test:api · test:ui" → ["test:api", "test:ui"]. */
export const namesOf = (entry) => entry.split(" · ");

const command = (name) => (name === "test" ? "npm test" : `npm run ${name}`);

function print(words) {
  const out = [];
  for (const [group, entries] of SCRIPTS) {
    const shown = entries.filter(([names]) => !words.length || words.some((word) => namesOf(names).some((name) => name.includes(word))));
    if (!shown.length) continue;
    out.push(group);
    for (const [names, args, what] of shown) {
      out.push(`  ${namesOf(names).map(command).join(" · ")}${args ? ` ${args}` : ""}`, `      ${what}`);
    }
    out.push("");
  }
  return out;
}

if (path.basename(process.argv[1] ?? "") === "help.mjs") {
  const words = process.argv.slice(2);
  const lines = print(words);
  console.log(lines.length ? lines.join("\n").trimEnd() : `No script named ${words.join(", ")} — npm run help lists them all.`);
}
