import path from "node:path";
import { appOfPath, at, inProgress, read, registeredPlatforms, rel, statementsOf } from "./context.mjs";
import { caseLinksIn, scenarioOf } from "./plans.mjs";
import { isVisualCheckpoint, testsOf } from "./specs.mjs";

/**
 * The same thing twice (.cursor/rules/code.mdc "No repeats"), checked for what is being written now
 * against the whole suite: two lines copied within a file, between files of one app or out of shared
 * code; the same code in two apps; one scenario of a manual case automated by two tests.
 */

// Lines that look alike without being copied: comments, imports, a test's skeleton and its look-alike
// checks, a name for a part (`const dialog = page.dialog;`), declared fields and types, and the parts
// a Page Object composes (`this.sidebar = new Sidebar(page);` — every page reaches the app-wide parts
// the same way).
const IDIOM = [
  /^(\/\/|\/\*|\*)/,
  /^(import\b|export \{[^}]*\} from|export \* from|\} from )/,
  /^test(\.describe|\.beforeEach|\.afterEach|\.beforeAll|\.afterAll|\.use)?\(/,
  /^(await )?test\.step\(/,
  /^\{ tag:/,
  /^async \(/,
  /^(await )?expect(\.\w+)?\(/,
  /^const (\{[\w\s,]+\}|\w+) = [\w.]+;$/,
  /^(readonly |private |protected |public |static )*[\w$]+\??\s*:\s*[^=;(]+;$/,
  /^(constructor|super)\(/,
  /^this\.\w+ = new [A-Z]\w*\(/,
];
const substantial = (line) => line.length >= 25 && !IDIOM.some((pattern) => pattern.test(line));

// Across apps, a short block made only of the kit's own calls is the kit's idiom, not a copy: a Page
// Object's prescribed opening (`await this.page.goto("./"); await appReady(this.page);`, .cursor/rules/ui.mdc
// §Opening a page) or ≤ 3 lines each calling a helper the shared code exports. No app can share it with
// another without importing across apps.
const KIT_IDIOM_LINES = 3;
const NAVIGATION = /^(?:await )?(?:this\.)?page\.(?:goto|reload)\(.*\);?$/;
const KIT_CALL = /^(?:return )?(?:await )?([A-Za-z_$][\w$]*)\(.*\);?$/;
// The method around them (`async open(): Promise<void> {`) — every Page Object declares its own.
const SIGNATURE = /^(?:(?:public|private|protected|static) )*(?:async )?[\w$]+\([^)]*\)(?: ?: ?[^={;]+)? ?\{$/;

/** The names the kit's shared code exports — what an app's code calls without owning. */
function kitHelpers(files, apps) {
  const names = new Set();
  for (const file of files.support.filter((each) => !appOfPath(each, apps))) {
    for (const [, name] of read(file).matchAll(/^export (?:async )?(?:function\*? |const |let )([A-Za-z_$][\w$]*)/gm)) names.add(name);
  }
  return names;
}

/** Each statement a navigation or a call of a kit helper (in the method holding them), and no more of them than an idiom has. */
const isKitIdiom = (statements, helpers) => {
  const calls = statements.filter((text, index) => !(index === 0 && SIGNATURE.test(text)));
  return calls.length > 0 && statements.length <= KIT_IDIOM_LINES && calls.every((text) => NAVIGATION.test(text) || helpers.has(KIT_CALL.exec(text)?.[1]));
};

/** The suite's own code — what authors write: specs, an app's code, components, data no app owns — not the kit's shared mechanism nor the sweep list. */
function ownCode(files, apps) {
  const written = (file) => file.endsWith(".spec.ts") || Boolean(appOfPath(file, apps)) || /[\\/]src[\\/](components|data[\\/](generators|datasets)[\\/]shared)[\\/]/.test(file);
  return [...files.specs, ...files.support].filter((file) => rel(file) !== "src/data/sweeps.ts" && written(file));
}

/** Where the repeat goes instead, by the kind of file it was found in. */
function homeFor(file) {
  if (file.endsWith(".spec.ts")) return "one thing in its home, never copied: what tests stand on is a fixture of the app, the same steps one method of the Page Object";
  if (/[\\/]src[\\/](pages|components)[\\/]/.test(file)) return "one thing in its home, never copied: a block on 2+ pages is one component (.cursor/rules/ui.mdc)";
  return "one thing in its home, never copied";
}

function checkCopiedLines(files, report) {
  const apps = registeredPlatforms();
  const code = ownCode(files, apps);
  const [changedTests, changedCode] = [inProgress("tests"), inProgress("src")];
  const isNew = (file) => !changedTests || !changedCode || changedTests.has(file) || changedCode.has(file);
  // The app a file belongs to; shared code has none (null); a test home with no app listed yet is one app ("").
  const ownerOf = (file) => (apps.length ? (appOfPath(file, apps) ?? null) : "");

  const seen = new Map();
  for (const file of code) {
    const statements = statementsOf(read(file));
    for (let index = 0; index + 1 < statements.length; index += 1) {
      const [first, second] = [statements[index], statements[index + 1]];
      if (!substantial(first.text) || !substantial(second.text)) continue;
      const block = `${first.text}\n${second.text}`;
      seen.set(block, [...(seen.get(block) ?? []), { file, line: first.line }]);
    }
  }

  // Each copy found: in which file and line, with which other places, and what it is. A copied block of
  // several lines is several overlapping pairs — they join into one range below, one message per copy.
  const hits = [];
  const where = (places) => [...new Set(places.map(({ file, line }) => `${rel(file)}:${line}`))].slice(0, 3).join(", ");
  for (const [block, places] of seen) {
    if (places.length < 2 || !places.some(({ file }) => isNew(file))) continue;
    const quote = `"${block.split("\n")[0].slice(0, 80)}…"`;
    const inFiles = [...new Set(places.map(({ file }) => file))];
    if (inFiles.length === 1) {
      report.fail(inFiles[0], `the same two lines at lines ${places.map(({ line }) => line).join(", ")} — ${quote}: one thing in its home, never copied (.cursor/rules/code.mdc "No repeats")`);
      continue;
    }
    const byOwner = new Map();
    for (const place of places) byOwner.set(ownerOf(place.file), [...(byOwner.get(ownerOf(place.file)) ?? []), place]);
    const shared = byOwner.get(null) ?? [];
    // Copied within one app, or out of shared code into it (shared code with itself counts too).
    for (const [owner, own] of byOwner) {
      const group = owner === null ? own : [...own, ...shared];
      if (new Set(group.map(({ file }) => file)).size < 2) continue;
      for (const place of own.filter(({ file }) => isNew(file))) {
        hits.push({ kind: "copy", ...place, others: group.filter(({ file }) => file !== place.file), quote });
      }
    }
    // The same code in two apps: where a shared home exists (data, assertions, setup), it goes there;
    // elsewhere a reviewer weighs it — two apps may show the same block without sharing its code.
    const appsWithIt = [...byOwner.keys()].filter(Boolean);
    if (appsWithIt.length < 2 || shared.length) continue;
    const sharedHome = places.some(({ file }) => /[\\/]src[\\/](data|assertions|setup)[\\/]/.test(file));
    for (const place of places.filter(({ file }) => isNew(file))) {
      hits.push({ kind: sharedHome ? "apps" : "apps-weigh", ...place, others: places.filter(({ file }) => file !== place.file), apps: appsWithIt, quote, statements: block.split("\n") });
    }
  }

  const runOf = (hit) => `${hit.kind}|${hit.file}|${[...new Set(hit.others.map(({ file }) => file))].sort().join(",")}`;
  const runs = new Map();
  for (const hit of hits.sort((a, b) => a.line - b.line)) {
    const open = runs.get(runOf(hit))?.at(-1);
    if (open && hit.line <= open.last + 1) {
      open.last = hit.line;
      open.statements?.push(hit.statements[1]);
    } else runs.set(runOf(hit), [...(runs.get(runOf(hit)) ?? []), { ...hit, last: hit.line, statements: hit.statements && [...hit.statements] }]);
  }
  let helpers;
  for (const hit of [...runs.values()].flat()) {
    if (hit.kind !== "copy" && isKitIdiom(hit.statements, (helpers ??= kitHelpers(files, apps)))) continue;
    const lines = `lines ${hit.line}–${hit.last + 1}`;
    if (hit.kind === "copy") {
      report.fail(hit.file, `${lines} are the same as ${where(hit.others)} — ${hit.quote}: ${homeFor(hit.file)} (.cursor/rules/code.mdc "No repeats")`);
    } else if (hit.kind === "apps") {
      report.fail(hit.file, `${lines}: the same code in ${hit.apps.join(" and ")} (${where(hit.others)}) — ${hit.quote}: what no app owns has one copy in a shared home every app imports — src/data/generators/shared/, data/datasets/shared/, assertions/shared/ (.cursor/rules/code.mdc "No repeats")`);
    } else {
      report.warn(hit.file, `${lines}: the same lines in ${hit.apps.join(" and ")} (${where(hit.others)}) — ${hit.quote}: a block both apps show is one component in src/components/<library>/ when they share a design system; a check no app owns goes to assertions/shared/`);
    }
  }
}

function checkCaseTwice(files, report) {
  // One scenario, one test (docs/Layer Routing Algorithm.md): a case is one scenario or several
  // ("TC-101 · S2 · …"), each automated by one test in its owner's folder. Two tests of one
  // scenario — an API and a UI one included — prove it twice; the old part after " — " no longer
  // tells them apart. A screenshot checkpoint in a file of its own (-visual.ui.spec.ts) checks how a
  // state looks, not the scenario, and is no second test of it. A case's scenarios live in its one
  // feature, so the same case in a second feature is written again whatever its scenario. A journey
  // (tests/e2e) crosses features by design and is left out of that. A pair no spec being written
  // touches was written before routing: it is listed to rework (a warning), never blocking the gate —
  // a new or changed one fails.
  const changed = inProgress("tests");
  const byScenario = new Map();
  const byFeature = new Map();
  for (const spec of [...files.api, ...files.ui, ...files.e2e]) {
    const [layer, app, area, feature] = path.relative(at("tests"), spec).split(path.sep);
    const home = feature && !feature.endsWith(".ts") ? `${area}/${feature}` : area;
    for (const { title, options, tags } of testsOf(read(spec))) {
      if (title.includes("${")) continue; // a title built in code: one test per data row
      const visual = isVisualCheckpoint(spec, tags);
      for (const id of caseLinksIn(options)) {
        const key = `${app}|${id}|${scenarioOf(title)}`;
        if (!visual) byScenario.set(key, [...(byScenario.get(key) ?? []), { spec, title }]);
        if (layer !== "e2e") byFeature.set(`${app}|${id}`, [...(byFeature.get(`${app}|${id}`) ?? []), { spec, title, home }]);
      }
    }
  }
  const touched = (tests) => !changed || tests.some(({ spec }) => changed.has(spec));
  const listOf = (tests) => tests.map(({ spec, title }) => `"${title}" (${rel(spec)})`).join(", ");
  const reported = new Set();
  for (const [key, tests] of byScenario) {
    if (tests.length < 2) continue;
    const [app, id, scenario] = key.split("|");
    const which = scenario ? `scenario ${scenario} of case ${id}` : `case ${id}`;
    reported.add(`${app}|${id}`);
    for (const spec of new Set(tests.map(({ spec }) => spec))) {
      if (touched(tests)) {
        report.fail(spec, `${which} is automated twice — ${listOf(tests)}: one scenario, one test in its owner's folder — the UI test checks the answer of its own action, never an API twin (docs/Layer Routing Algorithm.md §6); a case of several obligations is split into scenarios "<case id> · S<n> · …"; a case another feature already automates is not written again (the plan skill, "Already automated")`);
      } else {
        report.warn(spec, `${which} is tested twice, written before routing — ${listOf(tests)}: to rework — a refresh of its feature merges the pair into the owner's one test (the plan skill, "A later pass, an alignment, a refresh")`);
      }
    }
  }
  for (const [key, tests] of byFeature) {
    const homes = new Set(tests.map(({ home }) => home));
    if (homes.size < 2 || reported.has(key) || !touched(tests)) continue;
    const id = key.split("|")[1];
    for (const spec of new Set(tests.map(({ spec }) => spec))) {
      report.fail(spec, `case ${id} is automated in ${homes.size} features — ${listOf(tests)}: a case and its scenarios belong to one feature; a case another feature already automates is a Not now "Covered by <its spec>" line, never written again (the plan skill, "Already automated")`);
    }
  }
}

export const repeatRules = [checkCopiedLines, checkCaseTwice];
