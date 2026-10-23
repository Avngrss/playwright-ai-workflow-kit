import fs from "node:fs";
import path from "node:path";
import { at, read, rel } from "./context.mjs";

/** What a spec declares: its layer and scope tags, its quarantine reasons, hooks, mocks and case links. */

// The suite's own vocabulary; anything else must be registered in specs/project-map.md §Allowed tags.
const BUILT_IN_TAGS = ["@api", "@ui", "@e2e", "@smoke", "@regression", "@wip", "@flaky"];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The `code` values in the first column of a table in the map's section (prose examples do not count). */
function registered(sectionTitle) {
  const map = at("specs", "project-map.md");
  if (!fs.existsSync(map)) return [];
  const heading = sectionTitle.replace(/[()]/g, "\\$&");
  const section = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(read(map).replace(/\r\n/g, "\n"))?.[1] ?? "";
  const firstCells = section.split("\n").filter((line) => line.startsWith("|")).map((line) => line.split("|")[1] ?? "");
  return firstCells.flatMap((cell) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1].toLowerCase()));
}

const registeredTags = () => new Set([...BUILT_IN_TAGS, ...registered("Allowed tags").filter((value) => value.startsWith("@"))]);

/** Tags a spec gives its tests: `tag: ["@ui", "@regression"]` or `tag: "@smoke"`. */
function tagsOf(content) {
  const lists = [...content.matchAll(/tag\s*:\s*\[([^\]]*)\]/g)].map((m) => m[1]);
  const single = [...content.matchAll(/tag\s*:\s*["'`](@[a-z0-9-]+)["'`]/gi)].map((m) => m[1]);
  return new Set([...lists.flatMap((list) => [...list.matchAll(/["'`](@[a-z0-9-]+)["'`]/gi)].map((m) => m[1])), ...single].map((tag) => tag.toLowerCase()));
}

function checkTags(files, report) {
  const allowed = registeredTags();
  for (const spec of files.specs) {
    for (const tag of tagsOf(read(spec))) {
      if (!allowed.has(tag)) report.fail(spec, `tag ${tag} is not registered — add it to specs/project-map.md §Allowed tags with its "apply when" first`);
    }
  }

  for (const layer of ["api", "ui", "e2e"]) {
    for (const spec of files[layer]) {
      const content = read(spec);
      if (layer === "e2e" && content.includes("@ui")) report.fail(spec, "an E2E spec is tagged @e2e, not @ui");
      // Tags on a describe reach its tests — then the file as a whole is checked.
      if (/\.describe\([^)]*\{\s*tag\s*:/.test(content)) {
        if (!content.includes(`@${layer}`)) report.fail(spec, `the tests carry the layer tag @${layer}`);
        if (!/@regression|@wip|@flaky/.test(content)) report.fail(spec, "no scope tag — add @regression, or quarantine with @wip / @flaky");
        continue;
      }
      // Otherwise every test on its own: one without @regression never runs in test:regression.
      for (const { title, tags } of testsOf(content)) {
        if (!tags.has(`@${layer}`)) report.fail(spec, `"${title}" has no layer tag @${layer}`);
        if (!["@regression", "@wip", "@flaky"].some((tag) => tags.has(tag))) {
          report.fail(spec, `"${title}" has no scope tag — add @regression, or quarantine with @wip / @flaky (without it test:regression never runs it)`);
        }
      }
    }
  }

  for (const spec of files.smoke) {
    const content = read(spec);
    if (!content.includes("@smoke")) report.fail(spec, "a smoke spec tags its tests @smoke");
    if (content.includes("@regression")) report.fail(spec, "a smoke spec carries only @smoke — regression lives in the feature folders");
  }
}

/** Each test a spec declares: its title, its own options (tags, annotations), the tags in them, and its line. */
export function testsOf(content) {
  const starts = [...content.matchAll(/\btest\(\s*(?=["'`])/g)].map((match) => match.index);
  return starts.map((start, index) => {
    const chunk = content.slice(start, starts[index + 1]).replace(/^test\(\s*/, "");
    const title = /^["'`]([^"'`]+)["'`]/.exec(chunk)?.[1] ?? "";
    const options = chunk.slice(0, chunk.search(/\basync\b|=>/) + 1 || undefined);
    return { title, options, tags: tagsOf(options), line: content.slice(0, start).split("\n").length - 1 };
  });
}

/** The role a test runs as: the nearest `test.use({ role })` above it in a block still open there (indentation tells). */
function roleAt(lines, line) {
  const indent = (text) => text.length - text.trimStart().length;
  let floor = indent(lines[line]);
  for (let index = line - 1; index >= 0; index--) {
    if (!lines[index].trim()) continue;
    const role = /test\.use\(\s*\{[^}]*\brole\s*:\s*["'`]([^"'`]+)["'`]/.exec(lines[index]);
    if (role && indent(lines[index]) <= floor) return role[1];
    floor = Math.min(floor, indent(lines[index]));
  }
  return undefined;
}

/** The app's first account — the role its ```auth block lists first (`user` when it lists none), following `sign-in like`. */
function firstRoleOf(app, seen = []) {
  const map = at("specs", "project-map.md");
  if (!fs.existsSync(map)) return "user";
  const blocks = [...read(map).replace(/\r\n/g, "\n").matchAll(/```auth\n([\s\S]*?)```/g)].map((match) => match[1]);
  const block = blocks.find((text) => new RegExp(`^platform:\\s*${app}\\s*$`, "m").test(text)) ?? "";
  const roles = /^roles:\s*([^,\n]+)/m.exec(block)?.[1]?.trim();
  const like = /^sign-in like:\s*(\S+)/m.exec(block)?.[1];
  if (roles) return roles;
  return like && !seen.includes(like) ? firstRoleOf(like, [...seen, app]) : "user";
}

function checkKeySmoke(files, report) {
  // Smoke = the template's sign-in check + at most one test per feature: its main scenario, under
  // the app's first account, tagged @smoke besides @regression (the plan skill, Smoke). It may be many
  // tests across many features — never more per feature, never a role of its own.
  for (const spec of files.e2e) {
    if (tagsOf(read(spec)).has("@smoke")) report.fail(spec, "an E2E journey is too long for smoke — the smoke of a feature is one API or UI test of it");
  }
  const perFeature = new Map();
  for (const spec of [...files.api, ...files.ui]) {
    const content = read(spec);
    if (/\.describe\([^)]*tag\s*:[^)]*@smoke/.test(content)) report.fail(spec, "tags a whole group @smoke — a feature's smoke is one test, tagged on its own");
    const [, app, area, feature] = path.relative(at("tests"), spec).split(path.sep);
    const lines = content.split("\n");
    for (const { title, tags, line } of testsOf(content).filter(({ tags }) => tags.has("@smoke"))) {
      const key = `${app}/${area}/${feature}`;
      perFeature.set(key, [...(perFeature.get(key) ?? []), [spec, title]]);
      if (tags.has("@wip") || tags.has("@flaky")) report.fail(spec, `"${title}" is quarantined — smoke must be dependable; drop @smoke until it is healed`);
      if (!tags.has("@regression")) report.fail(spec, `"${title}" is in smoke and still a regression test — tag it @regression too`);
      const role = roleAt(lines, line);
      if (role && role !== "none" && role !== firstRoleOf(app)) {
        report.fail(spec, `"${title}" runs as role "${role}" — smoke signs in only the app's first account (${firstRoleOf(app)}); a role's feature is checked by its regression`);
      }
    }
  }
  for (const [feature, tests] of perFeature) {
    if (tests.length > 1) report.fail(tests[0][0], `${feature} has ${tests.length} smoke tests (${tests.map(([, title]) => `"${title}"`).join(", ")}) — a feature has one: its main scenario`);
  }
}

function checkRepeatedSetup(files, report) {
  // What several tests stand on is a fixture of the app: the same `Setup:` step — the same call — in
  // two tests of an app, in one spec or in several, is a repeat (.cursor/rules/code.mdc).
  const byApp = new Map();
  for (const spec of [...files.api, ...files.ui, ...files.e2e]) {
    const app = path.relative(at("tests"), spec).split(path.sep)[1];
    const flat = read(spec).replace(/\s+/g, " ");
    // `test.step("Setup: …", () => <one call>)` — the title up to its own closing quote, the call holding no other step.
    for (const [, , call] of flat.matchAll(/test\.step\( ?(["'`])Setup:(?:(?!\1).)*\1 ?, ?\(\) ?=> ?((?:(?!test\.step\().)+?) ?,? ?\) ?;/g)) {
      const calls = byApp.get(app) ?? new Map();
      calls.set(call, [...(calls.get(call) ?? []), spec]);
      byApp.set(app, calls);
    }
  }
  for (const calls of byApp.values()) {
    for (const [call, specs] of [...calls].filter(([, specs]) => specs.length > 1)) {
      const where = [...new Set(specs.map((spec) => path.basename(spec)))].join(", ");
      for (const spec of new Set(specs)) {
        report.fail(spec, `"${call.slice(0, 90)}" is the Setup of ${specs.length} tests (${where}) — what tests stand on is a fixture of the app (src/fixtures/<app>/data.fixture.ts), taken as a parameter (.cursor/rules/code.mdc)`);
      }
    }
  }
}

function checkQuarantineReasons(files, report) {
  // A quarantined test says why, so it can be healed and released (docs/test-strategy.md §8a).
  for (const spec of files.specs) {
    const content = read(spec);
    for (const tag of ["flaky", "wip"]) {
      if (content.includes(`@${tag}`) && !new RegExp(`//\\s*${tag}\\s*:\\s*\\S`).test(content)) {
        report.fail(spec, `@${tag} without its reason — add \`// ${tag}: <cause> — <ticket or plan note>\` above the test`);
      }
    }
  }
}

/** Locks a spec declares: `lock: "name"` or `lock: ["a", "b"]`, on a test or a describe. */
function locksOf(content) {
  const lists = [...content.matchAll(/\block\s*:\s*\[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((v) => v[1]));
  const single = [...content.matchAll(/\block\s*:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
  return new Set([...lists, ...single]);
}

function checkLocks(files, report) {
  // Tests that share a state on the account declare the same lock (Playwright never runs them at
  // once); the map names each lock, so two specs never spell one state two ways.
  const allowed = new Set(registered("Shared state (test locks)"));
  for (const spec of files.specs) {
    for (const lock of locksOf(read(spec))) {
      if (!KEBAB.test(lock)) report.fail(spec, `lock "${lock}" — a lock is named after the state it protects, in kebab-case`);
      else if (!allowed.has(lock)) report.fail(spec, `lock "${lock}" is not registered — add it to specs/project-map.md §Shared state (test locks) with the state it protects`);
    }
  }
}

function checkHooksAndRunMode(files, report) {
  for (const spec of files.specs) {
    const content = read(spec);
    const sharedHooks = /test\.(beforeAll|afterAll)\s*\(/.test(content);
    const serial = /describe\.configure\(\s*\{[^}]*mode\s*:\s*["'`]serial["'`]/.test(content);
    // Serial skips the rest of the file after one failure — only shared setup (beforeAll/afterAll) needs it.
    if (sharedHooks && !serial) report.fail(spec, 'beforeAll/afterAll share state between tests — add test.describe.configure({ mode: "serial" })');
    if (serial && !sharedHooks) report.fail(spec, 'mode: "serial" without beforeAll/afterAll — the tests are independent, drop it');
    if (/describe\.configure\(\s*\{[^}]*mode\s*:\s*["'`]default["'`]/.test(content)) {
      report.fail(spec, 'mode: "default" runs the whole file in one worker — tests that share a state declare the same lock instead (specs/project-map.md §Shared state)');
    }

    const loginFeature = /\/(login|auth|sign-in)(\/|$)/.test(rel(spec));
    if (!loginFeature && /test\.beforeEach[\s\S]*?\.login\s*\(/.test(content)) {
      report.fail(spec, "signs in through the UI in beforeEach — tests start signed in through the role option (test.use({ role }))");
    }
  }
}

function checkUiSpecs(files, report) {
  for (const spec of [...files.ui, ...files.e2e]) {
    const content = read(spec);
    if (content.includes("toHaveScreenshot(") && !content.includes("@visual")) {
      report.fail(spec, "compares screenshots without the @visual tag — register @visual in specs/project-map.md §Allowed tags first");
    }
    // The same page opened the same way by two tests of a file is opened once, in a test.beforeEach of
    // their describe. A test's opening is its first `<x>Page.open…(…)` call before its first check;
    // navigating later in the test, or opening a dialog again, is the test's own action.
    const lines = content.split(/\r?\n/);
    const openings = new Map();
    for (const { title, line } of testsOf(content)) {
      const after = lines.slice(line + 1);
      const end = after.findIndex((text) => /^\s*test(\.describe|\.beforeEach|\.afterEach|\.beforeAll|\.afterAll)?\(/.test(text));
      const body = (end === -1 ? after : after.slice(0, end)).join("\n");
      const firstCheck = body.search(/\bexpect\w*\(/);
      const opening = openingCallIn(firstCheck === -1 ? body : body.slice(0, firstCheck));
      if (opening) openings.set(opening, [...(openings.get(opening) ?? []), title]);
    }
    for (const [opening, titles] of [...openings].filter(([, titles]) => titles.length > 1)) {
      report.fail(spec, `"${opening}" opens ${titles.length} tests (${titles.map((title) => `"${title}"`).join(", ")}) — open it once in a test.beforeEach of their describe (.cursor/rules/code.mdc "No repeats")`);
    }
  }
}

/** The first `<x>Page.open…(…)` call in the text, arguments and all (`ordersPage.openInProject(id, lastMonths(3))`). */
function openingCallIn(text) {
  const match = /\b[\w$]+Page\.open\w*\(/.exec(text);
  if (!match) return undefined;
  let depth = 0;
  for (let index = match.index + match[0].length - 1; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1;
    if (text[index] === ")") depth -= 1;
    if (depth === 0) return text.slice(match.index, index + 1).replace(/\s+/g, " ");
  }
  return undefined;
}

function checkMocks(files, report) {
  // A mocked response tests how the UI shows a state, not the product — the reader of the spec must see it.
  for (const file of [...files.uiModels, ...files.clients]) {
    if (/\.route\s*\(/.test(read(file))) report.fail(file, 'mocks a server response out of the spec\'s sight — move page.route into the spec with a "// mocked: <why>" comment');
  }
  for (const spec of files.specs) {
    const content = read(spec);
    if (/\.route\s*\(/.test(content) && !/\/\/\s*mocked\s*:\s*\S/.test(content)) {
      report.fail(spec, 'mocks a server response without saying why — add "// mocked: <why the real state is unreachable>" above it');
    }
  }
}

function checkCaseLinks(files, report) {
  // A test written from a manual case links it — `tms(101)` from its app's `caseLinks`, which builds
  // the URL from the map (specs/project-map.md §Test cases (TMS)); a URL spelled in the spec still
  // works, but repeats the map in every spec.
  const caseAnnotation = /type:\s*["'`]tms["'`]\s*,\s*description:\s*["'`]([^"'`]*)["'`]/g;
  for (const spec of [...files.ui, ...files.api]) {
    const content = read(spec);
    const links = [...content.matchAll(caseAnnotation)].map((m) => m[1]);
    const helper = /\bcaseLinks\(/.test(content) && /\btms\(\s*["'`]?[\w-]+/.test(content);
    if (links.length) {
      report.warn(spec, `spells ${links.length} case URL(s) — take "const tms = caseLinks(<folder>)" from the app's test.ts and link each test with tms(<case id>)`);
    }
    // A value built in code (`${CASE_FOLDER}/tc/${id}`) is checked by the run, not here.
    for (const link of links.filter((value) => !/^https?:\/\//.test(value) && !value.includes("${"))) {
      report.fail(spec, `TMS link "${link}" is not a URL — use the case's full URL (template in specs/project-map.md §Test cases (TMS))`);
    }
    // A test from a TMS case is named after it — `TC-101 · <the case's title>` — so the report, the
    // code and the TMS read the same. A case split over layers names what each part checks, after
    // " — ": two tests named alike but for "(API)" / "(UI)" read as one test run twice.
    if (links.length || helper || /type:\s*["'`]tms["'`]/.test(content)) {
      const titles = [...content.matchAll(/\btest\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
      for (const title of titles.filter((value) => !/^[A-Z][A-Z0-9]*-\d+ · /.test(value))) {
        report.warn(spec, `"${title}" links a TMS case but is not named after it — "<case id> · <the case's title>" (the implement skill, Naming)`);
      }
      for (const title of titles.filter((value) => /\((?:API|UI|E2E)\)\s*$/i.test(value))) {
        report.warn(spec, `"${title}" names the layer instead of what it checks — "<case id> · <the case's title> — <what this part checks>" (the implement skill, Naming)`);
      }
      // The part after " — " tells the parts of a case apart; the report shows the title on one line.
      for (const title of titles) {
        const words = / — (.+)$/.exec(title)?.[1].split(/\s+/).length ?? 0;
        if (words > 10) report.warn(spec, `"${title}" — ${words} words after " — "; name what this part checks in a few (≤ 8) (the implement skill, Naming)`);
      }
    }
    // tests/<layer>/<platform>/<area>/<feature>/<file> → specs/<platform>/<area>/<feature>/<feature>.md
    const parts = path.relative(at("tests"), spec).split(path.sep);
    const plan = parts.length === 5 ? at("specs", parts[1], parts[2], parts[3], `${parts[3]}.md`) : undefined;
    if (links.length === 0 && !helper && plan && fs.existsSync(plan) && /^- .*TMS:\s*(?:TC-)?\d/m.test(read(plan))) {
      report.warn(spec, "the plan is built from TMS cases, but the tests do not link them — const tms = caseLinks(<folder>) from the app's test.ts, then annotation: tms(<case id>) on each test");
    }
  }
}

function checkSessionEndings(files, report) {
  // Signing out, changing the password or ending sessions on the shared session signs out every test
  // running alongside — such a test works on a session of its own. An action, not a mention: a
  // click on such a control or a Page Object method that does it.
  const action = [
    /\.(signOut|signout|logOut|logout|changePassword|endAllSessions|endSessions|endOtherSessions)\s*\(/,
    /getBy\w+\([^)]*(sign\s*-?\s*out|log\s*-?\s*out|change password|end all sessions)[^)]*\)[^;\n]*\.click\(/i,
  ];
  const ownSession = /session\s*:\s*["'`](own|signed-out)["'`]/;
  for (const spec of [...files.ui, ...files.e2e]) {
    const content = read(spec);
    if (action.some((pattern) => pattern.test(content)) && !ownSession.test(content)) {
      report.fail(spec, 'ends its session (signs out, changes the password, ends sessions) on the shared one — every test running alongside would be signed out too. test.use({ session: "own" }) gives it a session of its own (or "signed-out", then signIn())');
    }
  }
}

/**
 * specs/known-bugs.md names tests that exist, in their layer, each with its ticket and the step it fails
 * at — a row nobody's test matches would mark nothing, and a test would stay red for a filed bug.
 */
function checkKnownBugs(files, report) {
  const registry = at("specs", "known-bugs.md");
  if (!fs.existsSync(registry)) return;
  const rows = read(registry)
    .split(/\r?\n/)
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/^`|`$/g, "")))
    .filter(([test]) => test && test !== "Test" && !/^-+$/.test(test));
  for (const [test, layer = "", ticket, step] of rows) {
    const specs = files[layer.toLowerCase()] ?? [];
    const named = specs.some((spec) => read(spec).includes(`"${test}"`) || read(spec).includes(`"${test} · `));
    if (!["api", "ui", "e2e"].includes(layer.toLowerCase())) report.fail(registry, `"${test}" — Layer is API, UI or E2E, not "${layer}"`);
    else if (!named) report.fail(registry, `"${test}" — no ${layer} test is titled so (or starts with it as its case id): fix the row, or remove it`);
    if (!ticket || !step) report.fail(registry, `"${test}" — a row names its Ticket and the step it Fails at`);
  }
}

export const specRules = [checkTags, checkKeySmoke, checkRepeatedSetup, checkLocks, checkQuarantineReasons, checkHooksAndRunMode, checkUiSpecs, checkMocks, checkCaseLinks, checkSessionEndings, checkKnownBugs];
