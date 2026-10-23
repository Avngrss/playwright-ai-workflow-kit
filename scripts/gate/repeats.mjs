import path from "node:path";
import { appOfPath, at, inProgress, read, registeredPlatforms, rel, statementsOf } from "./context.mjs";
import { caseLinksIn } from "./plans.mjs";
import { testsOf } from "./specs.mjs";

/**
 * The same thing twice (.cursor/rules/code.mdc "No repeats"), checked for what is being written now
 * against the whole suite: two lines copied within a file, between files of one app or out of shared
 * code; the same code in two apps; one manual case automated by two tests.
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
      hits.push({ kind: sharedHome ? "apps" : "apps-weigh", ...place, others: places.filter(({ file }) => file !== place.file), apps: appsWithIt, quote });
    }
  }

  const runOf = (hit) => `${hit.kind}|${hit.file}|${[...new Set(hit.others.map(({ file }) => file))].sort().join(",")}`;
  const runs = new Map();
  for (const hit of hits.sort((a, b) => a.line - b.line)) {
    const open = runs.get(runOf(hit))?.at(-1);
    if (open && hit.line <= open.last + 1) open.last = hit.line;
    else runs.set(runOf(hit), [...(runs.get(runOf(hit)) ?? []), { ...hit, last: hit.line }]);
  }
  for (const hit of [...runs.values()].flat()) {
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
  // A manual case has one test — or one per part when it is split, each part named after " — " for
  // what it checks (the implement skill, Naming). Two tests of one case with the same part automate it twice:
  // usually a case another feature already covers, written again (the plan skill, "Already automated").
  // A split case's parts live in its one feature (API and UI alike), so the same case in a second
  // feature is written again whatever its part is called. A journey (tests/e2e) crosses features by
  // design and is left out of that.
  const changed = inProgress("tests");
  const byCase = new Map();
  const byFeature = new Map();
  for (const spec of [...files.api, ...files.ui, ...files.e2e]) {
    const [layer, app, area, feature] = path.relative(at("tests"), spec).split(path.sep);
    const home = feature && !feature.endsWith(".ts") ? `${area}/${feature}` : area;
    for (const { title, options } of testsOf(read(spec))) {
      if (title.includes("${")) continue; // a title built in code: one test per data row
      const part = / — (.+)$/.exec(title)?.[1]?.trim().toLowerCase() ?? "";
      for (const id of caseLinksIn(options)) {
        const key = `${app}|${id}|${part}`;
        byCase.set(key, [...(byCase.get(key) ?? []), { spec, title }]);
        if (layer !== "e2e") byFeature.set(`${app}|${id}`, [...(byFeature.get(`${app}|${id}`) ?? []), { spec, title, home }]);
      }
    }
  }
  const touched = (tests) => !changed || tests.some(({ spec }) => changed.has(spec));
  const listOf = (tests) => tests.map(({ spec, title }) => `"${title}" (${rel(spec)})`).join(", ");
  const reported = new Set();
  for (const [key, tests] of byCase) {
    if (tests.length < 2 || !touched(tests)) continue;
    const [app, id] = key.split("|");
    reported.add(`${app}|${id}`);
    for (const spec of new Set(tests.map(({ spec }) => spec))) {
      report.fail(spec, `case ${id} is automated twice — ${listOf(tests)}: one test per manual case, or one per part of a split case, each named after " — " for what it checks (the implement skill, Naming); a case another feature already automates is not written again (the plan skill, "Already automated")`);
    }
  }
  for (const [key, tests] of byFeature) {
    const homes = new Set(tests.map(({ home }) => home));
    if (homes.size < 2 || reported.has(key) || !touched(tests)) continue;
    const id = key.split("|")[1];
    for (const spec of new Set(tests.map(({ spec }) => spec))) {
      report.fail(spec, `case ${id} is automated in ${homes.size} features — ${listOf(tests)}: a case and its parts belong to one feature; a case another feature already automates is a Not now "Covered by <its spec>" line, never written again (the plan skill, "Already automated")`);
    }
  }
}

export const repeatRules = [checkCopiedLines, checkCaseTwice];
