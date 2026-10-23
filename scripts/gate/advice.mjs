import fs from "node:fs";
import { at, inProgress, read, workingStatementsOf } from "./context.mjs";

/**
 * Warnings, never failures: smells a reviewer weighs (.cursor/rules/code.mdc, specs.mdc).
 * The readability and structure ones look only at what is being written now — committed tests are
 * not reworked for a later rule.
 */

const TEST_LINES_GUIDE = 25;
const SPEC_LINES_GUIDE = 250;
const CLIENT_LINES_GUIDE = 200;
const CLIENT_REQUEST_LINES_GUIDE = 100;

/** A client's text without its response types (interfaces and type aliases): what is left are its requests. */
function withoutTypes(text) {
  const kept = [];
  let depth = 0;
  for (const line of text.split(/\r?\n/)) {
    const startsType = depth === 0 && /^(?:export\s+)?(?:interface|type)\s/.test(line);
    if (depth > 0 || startsType) {
      depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

function adviseCodeWeight(files, report) {
  for (const spec of [...files.ui, ...files.api, ...files.smoke]) {
    const lines = read(spec).split(/\r?\n/);
    // Sizes count statements that do something: where a line breaks, comments and closing lines do not count.
    const statements = workingStatementsOf(lines.join("\n"));
    if (statements.length > SPEC_LINES_GUIDE) report.warn(spec, `${statements.length} statements (guide ≤ ${SPEC_LINES_GUIDE}) — look for repeated calls and cleanup blocks`);

    // A test runs from its `test(` to the next test or describe.
    const starts = lines.flatMap((line, index) => (/^\s*test(\.describe)?\(/.test(line) ? [{ index, isTest: !line.includes("test.describe") }] : []));
    starts.forEach((start, i) => {
      const end = i + 1 < starts.length ? starts[i + 1].index : lines.length;
      const size = statements.filter(({ line }) => line > start.index && line <= end).length;
      if (start.isTest && size > TEST_LINES_GUIDE) report.warn(spec, `the test at line ${start.index + 1} has ~${size} statements (guide ≤ ${TEST_LINES_GUIDE})`);
    });

    if (/\}\s*finally\s*\{/.test(lines.join("\n"))) report.warn(spec, "try/finally in a spec — register created data with cleanup.add(…) instead");
  }

  for (const file of [...files.ui, ...files.api, ...files.smoke, ...files.support]) {
    if (/(\/\/|\/\*|^\s*\*).*\b20\d\d-\d\d-\d\d\b/m.test(read(file))) report.warn(file, "a comment carries a date — history belongs in the plan's change log");
  }

  // A client is the requests of one API area and the types of their bodies — nothing else
  // (.cursor/rules/code.mdc): dates, screen formats and counting helpers live where they are used.
  for (const client of files.clients) {
    const text = read(client);
    // Response types may be long; the requests show whether one client holds several API areas.
    const requestLines = workingStatementsOf(withoutTypes(text)).length;
    if (requestLines > CLIENT_REQUEST_LINES_GUIDE) {
      report.warn(client, `${requestLines} statements of requests, response types aside (guide ≤ ${CLIENT_REQUEST_LINES_GUIDE}) — one client per API area (e.g. projects, reports), each with its own response types`);
    }
    const exported = text.split(/^(?=export\s)/m).filter((part) => /^export\s+(?:async\s+)?(?:function|const)\s/.test(part));
    const noRequest = exported.filter((part) => !/\brequest\.\w+\(|\bfetch\(/.test(part)).map((part) => /^export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z0-9_]+)/.exec(part)?.[1]);
    if (noRequest.length) {
      report.warn(client, `${noRequest.join(", ")} send no request — a client holds requests only: periods and test values → data/generators|datasets/<app>/, how the screen shows a value → assertions/<app>/, lookups on the stand → setup/<app>/`);
    }
  }

  // An app's setup file holds one subject (.cursor/rules/data-and-fixtures.mdc): the stand items its tests need, one prepared object's upkeep.
  for (const file of files.support.filter((support) => /[\\/]src[\\/]setup[\\/](?!auth[\\/])[^\\/]+[\\/][^\\/]+\.ts$/.test(support))) {
    const size = workingStatementsOf(read(file)).length;
    if (size > CLIENT_LINES_GUIDE) report.warn(file, `${size} statements (guide ≤ ${CLIENT_LINES_GUIDE}) — one subject per setup file (the stand items the tests need; one prepared object's upkeep)`);
  }

  // Product code nobody uses (pages, clients, builders). The template's own toolbox (fixtures,
  // setup, reporting, assertions/shared) is not checked, nor are types.
  const productCode = /[\\/]src[\\/](pages|components|api[\\/]clients|data)[\\/]/;
  const sources = files.testCode.map((file) => ({ file, text: read(file) }));
  for (const { file, text } of sources.filter(({ file }) => productCode.test(file))) {
    for (const [, name] of text.matchAll(/^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_]+)/gm)) {
      const used = sources.some((other) => other.file !== file && new RegExp(`\\b${name}\\b`).test(other.text));
      if (!used) report.warn(file, `export '${name}' is not used anywhere — delete it until a test needs it`);
    }
  }
}

/** Arguments of the call that opens at `start` (the index of its "("), split at top-level commas. */
function callArguments(source, start) {
  let depth = 0;
  let current = "";
  const args = [];
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if ("([{".includes(char)) depth += 1;
    if (")]}".includes(char)) depth -= 1;
    if (depth === 0) break;
    if (char === "," && depth === 1) {
      args.push(current);
      current = "";
    } else if (index > start) {
      current += char;
    }
  }
  if (current.trim()) args.push(current);
  return args;
}

function adviseReadability(files, report) {
  const changed = inProgress();
  for (const spec of files.specs.filter((file) => !changed || changed.has(file))) {
    const content = read(spec);
    // A check without a name reads in the report as "expect(locator)…" (.cursor/rules/specs.mdc).
    const unnamed = [...content.matchAll(/(?<![.\w])expect\(/g)].filter((m) => callArguments(content, m.index + "expect".length).length < 2).length;
    if (unnamed > 0) report.warn(spec, `${unnamed} check(s) without a name — expect(x, "<what the user sees>"), .cursor/rules/specs.mdc`);

    const longestComment = content.split(/\r?\n/).reduce(
      (state, line) => {
        const run = /^\s*\/\//.test(line) ? state.run + 1 : 0;
        return { run, longest: Math.max(state.longest, run) };
      },
      { run: 0, longest: 0 },
    ).longest;
    if (longestComment > 2) report.warn(spec, `a ${longestComment}-line comment — keep the "why" to 1–2 lines, findings go to the plan's change log`);
  }
}

function adviseStructure(files, report) {
  // .cursor/rules/code.mdc: hand-rolled lookups and app addresses built in a spec (copied lines:
  // repeats.mjs).
  const changed = inProgress();
  for (const spec of files.specs.filter((file) => !changed || changed.has(file))) {
    const lines = read(spec).split(/\r?\n/).map((line) => line.trim());

    if (lines.some((line) => /\.find\(.*\)!/.test(line))) report.warn(spec, 'a lookup with ".find(…)!" — use the helper that fails with a readable message');

    if (lines.some((line) => /\.(open|goto)\(\s*[`'"][^`'"]*[?&][^`'"]*=/.test(line))) {
      report.warn(spec, "an app address with a query is built in the spec — give the Page Object a typed open(…) that owns the format");
    }
  }
}

// The files a project tunes (allurerc.mjs, playwright.config.ts) are not brought in with the template's
// fixes — a test home made before a fix gets its one line from here.
function adviseTunedFiles(files, report) {
  const allurerc = at("allurerc.mjs");
  if (fs.existsSync(allurerc) && !read(allurerc).includes("report-categories.mjs")) {
    report.warn(allurerc, 'the report sorts no failure by its likely cause — add import { categories } from "./src/reporting/report-categories.mjs" and categories, to the exported config');
  }
  const tsconfig = at("tsconfig.json");
  if (fs.existsSync(tsconfig) && !/"noUnusedLocals"\s*:\s*true[\s\S]*"noUnusedParameters"\s*:\s*true|"noUnusedParameters"\s*:\s*true[\s\S]*"noUnusedLocals"\s*:\s*true/.test(read(tsconfig))) {
    report.warn(tsconfig, 'an unused import, variable or fixture passes the type check — add "noUnusedLocals": true and "noUnusedParameters": true to compilerOptions');
  }
  const config = at("playwright.config.ts");
  if (fs.existsSync(config) && /^\s*retries:\s*process\.env\.CI \? 2 : 0,/m.test(read(config))) {
    report.warn(config, "a failed test is not retried locally — retries: process.env.CI ? 2 : 1 (a pass on the retry is reported unstable, not red)");
  }
}

export const adviceRules = [adviseCodeWeight, adviseReadability, adviseStructure, adviseTunedFiles];
