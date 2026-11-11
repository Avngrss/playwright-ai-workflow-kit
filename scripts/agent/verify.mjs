/**
 * Verify in one command — the verify skill's targeted run (agents/skills/verify/SKILL.md): the gate,
 * then each check this run wrote proven able to fail, then one run of the tests with their neighbours,
 * then one block to paste, every number copied from the run's own result files.
 *
 *   npm run verify -- <app> <spec[:line]…> [--also <spec[:line]…>] [--can-fail <spec>:<line>=<the line as spoiled>…] [--with-browsers]
 *   npm run verify -- --restore      only put back what a verify cut off left spoiled
 *
 * A line anywhere inside a test names that test; a line in no test stops the call before anything runs.
 * A spec named with a line runs whole when a file it imports under src/ changed against HEAD (in the
 * index or the working tree) — its other tests may call what changed; the block says so. --also stays
 * for other specs.
 *
 * 1. Gate — npm run qa:gate (its type check included). Failing, its findings are printed; nothing runs.
 * 2. Can fail — each --can-fail line is swapped for its spoiled text (one per test), exactly the tests
 *    holding them run once (--retries=0) in their app's own projects (never another browser), every
 *    line is put back and each file's hash proven as before.
 *    Each reads: red at its line · red elsewhere — <the cause, where> · green — blind · not run — <why>.
 *    Anything but "red at its line" stops before the run.
 * 3. Run — the specs and --also (other features' tests, other apps' too) together, once, --retries=0,
 *    through scripts/run-tests.mjs (the stand's second pass included). --with-browsers: the tests tagged
 *    @cross-browser / @responsive also run in Firefox, WebKit and the phone (firefox:, webkit:, mobile:
 *    <app> — Firefox and WebKit installed when missing), in the same one run. A phase whose sign-in smoke
 *    failed runs once more.
 * 4. Block — the gate, can fail, the run's counts (reports/run-summary.json) and each test's verdict in
 *    each project it ran in (that file and the Allure results), the stand-slow ones, the coverage of the
 *    cases the specs link (scripts/agent/suite-coverage.mjs) and each phase's time; then the same as JSON.
 *    Both are kept in test-results/verify.json, the runs' own output in test-results/verify.log. A named
 *    spec none of whose tests ran reads "Not run" — never green.
 *
 * 5. State — reports/verify-state.json (writeState): the result, how many verifies of these specs in a row
 *    came out red and whether the automatic heal after a fresh implement is owed; a red run of specs this
 *    session wrote ends "now the automatic heal: <spec>:<line> …", the next red one "still red after the
 *    automatic heal".
 *
 * Exit 0: all green · 1: not green, the last line says why · 2: a wrong call · 3: a spoiled line not put
 * back (named; fix it by hand). While lines are spoiled they are listed in reports/verify-spoils.json:
 * a verify cut off leaves it, the gate fails while it is there, and the next verify (or --restore) puts
 * them back first. Prints no value of .env or state/.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { CASE_PREFIX } from "../gate/plans.mjs";
import { appsOfMap } from "../run-tests.mjs";

const ROOT = process.cwd();
const SPOILS_FILE = path.join(ROOT, "reports", "verify-spoils.json");
const STATE_FILE = path.join(ROOT, "reports", "verify-state.json");
const SUMMARY_FILE = path.join(ROOT, "reports", "run-summary.json");
const RESULTS_DIR = path.join(ROOT, "reports", "allure", "results");
const OUT_DIR = path.join(ROOT, "test-results");
const PLAYWRIGHT = path.join(ROOT, "node_modules", "@playwright", "test", "cli.js");
const USAGE = "npm run verify -- <app> <spec[:line]…> [--also <spec[:line]…>] [--can-fail <spec>:<line>=<the line as spoiled>…] [--with-browsers] | --restore";
// Causes that are the stand's, not the check's (src/reporting/failure-cause.ts); "test code" and
// "screenshot without a baseline" are a spoil that broke the test, not its check catching a wrong value.
const NOT_THE_CHECK = new Set(["stand unavailable", "out of time", "sign-in or access", "server error", "stand data", "cleanup", "test code", "screenshot without a baseline"]);
// The other-browser projects of playwright.config.ts (firefox:<app>, webkit:<app>, mobile:<app>) — only --with-browsers runs them.
const browserOf = (project) => /^(firefox|webkit|mobile)(?::|$)/.exec(project ?? "")?.[1];
const BIG = 256 * 1024 * 1024;
const log = [];

// ── Output: masked, never a .env secret or a session token ────────────────────────────────────────
const SECRET_NAME = /PASSWORD|SECRET|TOKEN|(^|_)KEY$/;
const secrets = (() => {
  try {
    const values = Object.entries(dotenv.parse(fs.readFileSync(path.join(ROOT, ".env"))));
    return values.filter(([name, value]) => SECRET_NAME.test(name) && value.length >= 4).map(([, value]) => value).sort((a, b) => b.length - a.length);
  } catch {
    return [];
  }
})();
const mask = (text) =>
  secrets
    .reduce((out, value) => out.split(value).join("[secret]"), String(text))
    .replace(/(\bBearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, "$1[token]")
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "[token]");
const say = (text = "") => console.log(mask(text));

const posix = (file) => file.replace(/\\/g, "/");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}`;
const appOf = (file) => file.split("/")[2];
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function wrong(message) {
  say(`Verify: wrong call — ${message}\n${USAGE}`);
  process.exit(2);
}

// ── The call ──────────────────────────────────────────────────────────────────────────────────────
/** "tests/x.spec.ts:12" → { file, line, arg }, the path from the test home with forward slashes. */
function specOf(given) {
  const [, file, line] = /^(.*?)(?::(\d+))?$/.exec(given);
  const relative = posix(path.relative(ROOT, path.resolve(ROOT, file)));
  return { file: relative, line: line ? Number(line) : undefined, arg: line ? `${relative}:${line}` : relative };
}

function parse(argv) {
  const [app, ...rest] = argv;
  const call = { app, specs: [], also: [], spoils: [], withBrowsers: false };
  let into = call.specs;
  for (const arg of rest) {
    if (arg === "--with-browsers") call.withBrowsers = true;
    else if (arg === "--also") into = call.also;
    else if (arg === "--can-fail") into = call.spoils;
    else if (arg.startsWith("--")) wrong(`unknown option "${arg}" (specs first, then --also, then --can-fail; --with-browsers anywhere)`);
    else if (into === call.spoils) {
      const match = /^(.+?):(\d+)=([\s\S]*)$/.exec(arg);
      if (!match) wrong(`--can-fail takes <spec>:<line>=<the line as spoiled>, not "${arg}"`);
      call.spoils.push({ file: specOf(match[1]).file, line: Number(match[2]), text: match[3].replace(/\r?\n$/, "") });
    } else into.push(specOf(arg));
  }
  const apps = appsOfMap();
  if (!app || !apps.includes(app)) wrong(`which app? apps in specs/project-map.md: ${apps.join(", ") || "none yet"}`);
  if (!call.specs.length) wrong("name the specs this run wrote or changed");
  for (const { file } of [...call.specs, ...call.also, ...call.spoils]) {
    if (!/^tests\/(api|ui|e2e)\/[^/]+\/.+\.spec\.ts$/.test(file)) wrong(`${file} is not a spec of tests/<api|ui|e2e>/<app>/`);
    if (!fs.existsSync(path.join(ROOT, file))) wrong(`no such file: ${file}`);
  }
  for (const { file } of call.specs) if (appOf(file) !== app) wrong(`${file} is ${appOf(file)}'s, not ${app}'s — another app's specs go after --also`);
  const verified = new Set([...call.specs, ...call.also].map(({ file }) => file));
  for (const { file } of call.spoils) if (!verified.has(file)) wrong(`--can-fail ${file} is not among the specs`);
  call.apps = [...new Set([app, ...call.also.map(({ file }) => appOf(file))])];
  return call;
}

// ── Reading a spec: where a call closes, which test holds a line, which step ──────────────────────
const lineStarts = (source) => [0, ...[...source.matchAll(/\n/g)].map((match) => match.index + 1)];
const lineAt = (starts, offset) => starts.findLastIndex((start) => start <= offset) + 1;

/** The offset where the first bracket opened at or after `from` closes — strings, comments and template literals skipped. */
function closeOf(source, from) {
  const templates = []; // the depth each open `${` of a template literal returns to
  let depth = 0;
  let mode = null; // inside: "//", "/*", a quote, or "`"
  for (let at = from; at < source.length; at += 1) {
    const char = source[at];
    const next = source[at + 1];
    if (mode === "//") {
      if (char === "\n") mode = null;
    } else if (mode === "/*") {
      if (char === "*" && next === "/") {
        mode = null;
        at += 1;
      }
    } else if (mode === "'" || mode === '"') {
      if (char === "\\") at += 1;
      else if (char === mode || char === "\n") mode = null;
    } else if (mode === "`") {
      if (char === "\\") at += 1;
      else if (char === "`") mode = null;
      else if (char === "$" && next === "{") {
        templates.push(depth);
        depth += 1;
        mode = null;
        at += 1;
      }
    } else if (char === "/" && (next === "/" || next === "*")) {
      mode = `/${next}`;
      at += 1;
    } else if (char === "'" || char === '"' || char === "`") mode = char;
    else if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) {
      depth -= 1;
      if (templates.length && depth === templates.at(-1)) {
        templates.pop();
        mode = "`";
      } else if (depth === 0) return at;
    }
  }
  return source.length - 1;
}

/** The tests of the files, as Playwright lists them: file, title, line and column of each. */
function listedTests(files) {
  const listed = spawnSync(process.execPath, [PLAYWRIGHT, "test", "--list", "--reporter=json", ...files], { cwd: ROOT, encoding: "utf8", maxBuffer: BIG });
  let data;
  try {
    data = JSON.parse(listed.stdout);
  } catch {
    say(`Verify: stopped — Playwright could not list ${files.join(", ")}:\n${listed.stderr || listed.stdout}`);
    process.exit(1);
  }
  // A test tagged for other browsers is listed once per project (ui:, firefox:, webkit:) — it is one test here.
  const tests = new Map();
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      const test = { file: `tests/${posix(spec.file)}`, title: spec.title, line: spec.line, column: spec.column };
      tests.set(`${test.file}:${test.line}:${test.column}|${test.title}`, test);
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of data.suites ?? []) walk(suite);
  return [...tests.values()];
}

/** The test(s) of a file holding a line: the innermost `test(` whose call spans it. */
function testsHolding(tests, source, file, line) {
  const starts = lineStarts(source);
  const spans = tests
    .filter((test) => test.file === file)
    .map((test) => ({ ...test, end: lineAt(starts, closeOf(source, starts[test.line - 1] + test.column - 1)) }))
    .filter((test) => test.line <= line && line <= test.end);
  const innermost = Math.max(...spans.map((test) => test.line));
  return spans.filter((test) => test.line === innermost);
}

/**
 * Files under `dir` (src/ by default) changed against HEAD — in the index or the working tree, new ones too —
 * from the test home, with forward slashes. None without git. git names files from the repository's root; the
 * test home may be a folder inside it.
 */
function changedSources(dir = "src") {
  const git = (args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  const prefix = git(["rev-parse", "--show-prefix"]);
  const status = git(["status", "--porcelain", "-z", "--untracked-files=all", "--", dir]);
  if (prefix.status !== 0 || status.status !== 0) return new Set();
  const home = prefix.stdout.trim();
  const files = new Set();
  const records = status.stdout.split("\0");
  for (let at = 0; at < records.length; at += 1) {
    const record = records[at];
    if (!record) continue;
    if (record.startsWith(home, 3)) files.add(record.slice(3 + home.length));
    if (/[RC]/.test(record.slice(0, 2))) at += 1; // a rename's old path follows
  }
  return files;
}

/** The files under src/ a spec imports itself (`src/…` or a relative path), with forward slashes. */
function importsOf(file) {
  const source = read(file);
  const named = [...source.matchAll(/^\s*(?:import|export)\b[^;'"`]*?\bfrom\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm)].map((match) => match[1] ?? match[2]);
  return named.flatMap((name) => {
    const base = name.startsWith("src/") ? name : name.startsWith(".") ? posix(path.relative(ROOT, path.resolve(ROOT, path.dirname(file), name))) : undefined;
    if (!base?.startsWith("src/")) return [];
    const found = [base, `${base}.ts`, `${base}.mts`, `${base}.js`, `${base}.mjs`, `${base}/index.ts`].find((candidate) => fs.existsSync(path.join(ROOT, candidate)) && fs.statSync(path.join(ROOT, candidate)).isFile());
    return found ? [found] : [];
  });
}

/**
 * Each named spec with the tests it means. A line anywhere inside a test is that test — taken by its
 * `test(` line, the only line Playwright selects by; a line in no test stops the call before anything runs.
 * A spec narrowed to a line runs whole when a file it imports under src/ changed: its other tests may
 * call what changed (`widened` names the files).
 */
function resolveNamed(entries) {
  if (!entries.length) return entries;
  const tests = listedTests([...new Set(entries.map(({ file }) => file))]);
  let changed;
  return entries.map((entry) => {
    const whole = tests.filter(({ file }) => file === entry.file);
    if (entry.line === undefined) return { ...entry, tests: whole };
    const held = testsHolding(tests, read(entry.file), entry.file, entry.line);
    if (!held.length) wrong(`${entry.file}:${entry.line} is in no test — give a line inside the test, or the spec without a line`);
    changed ??= changedSources();
    const widened = [...new Set(importsOf(entry.file))].filter((file) => changed.has(file));
    if (widened.length && whole.length > held.length) return { ...entry, line: undefined, arg: entry.file, tests: whole, widened: { named: `${entry.file}:${held[0].line}`, changed: widened } };
    return { ...entry, line: held[0].line, arg: `${entry.file}:${held[0].line}`, tests: held };
  });
}

/** Each spoil with the test(s) holding its line and the step around it; a wrong one stops the call before anything is spoiled. */
function holders(spoils) {
  const tests = listedTests([...new Set(spoils.map(({ file }) => file))]);
  const seen = new Map();
  return spoils.map((spoil) => {
    const source = read(spoil.file);
    const starts = lineStarts(source);
    const lines = source.split("\n");
    const original = lines[spoil.line - 1];
    if (original === undefined) wrong(`${spoil.file} has no line ${spoil.line}`);
    if (original.replace(/\r$/, "").trim() === spoil.text.trim()) wrong(`${spoil.file}:${spoil.line} already reads so — give the line as spoiled`);
    const spans = tests
      .filter(({ file }) => file === spoil.file)
      .map((test) => ({ ...test, end: lineAt(starts, closeOf(source, starts[test.line - 1] + test.column - 1)) }))
      .filter(({ line, end }) => line <= spoil.line && spoil.line <= end);
    const innermost = Math.max(...spans.map(({ line }) => line));
    const held = spans.filter(({ line }) => line === innermost);
    if (!held.length) wrong(`${spoil.file}:${spoil.line} is in no test — spoil the expected value inside the test's own assertion`);
    const key = `${spoil.file}:${innermost}`;
    if (seen.has(key)) wrong(`${spoil.file}:${seen.get(key)} and :${spoil.line} are in one test — one spoiled check per test`);
    seen.set(key, spoil.line);
    // The test.step around the line: the fallback when a helper's await loses the spec's own frame.
    const [lineStart, lineEnd] = [starts[spoil.line - 1], (starts[spoil.line] ?? source.length + 1) - 1];
    const steps = [...source.slice(0, starts[held[0].end] ?? source.length).matchAll(/test\.step\(\s*("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`$]*`)/g)]
      .filter((match) => match.index >= starts[held[0].line - 1])
      .map((match) => ({ at: match.index, title: match[1].slice(1, -1).replace(/\\(.)/g, "$1"), line: lineAt(starts, match.index) }))
      .filter(({ at }) => at <= lineEnd && closeOf(source, at + "test.step".length) >= lineStart);
    return { ...spoil, original, lines, tests: held, step: steps.at(-1) };
  });
}

/** Whether lines a and b are one statement: no line between them ends one (";") or opens a block ("=> {", ") {"). */
function oneStatement(lines, a, b) {
  const [from, to] = a < b ? [a, b] : [b, a];
  for (let at = from; at < to; at += 1) {
    const text = (lines[at - 1] ?? "").replace(/(^|\s)\/\/.*$/, "").trimEnd();
    if (/;$/.test(text) || /(=>|\)|\belse|\btry|\bfinally|\bdo)\s*\{$/.test(text)) return false;
  }
  return true;
}

// ── Spoiling and putting back, every file's hash proven ───────────────────────────────────────────
let spoiledNow = null;

function spoil(items) {
  const files = [];
  for (const file of new Set(items.map((item) => item.file))) {
    const bytes = fs.readFileSync(path.join(ROOT, file));
    const lines = bytes.toString("utf8").split("\n");
    const entry = { file, sha256: sha(bytes), lines: [] };
    for (const item of items.filter((each) => each.file === file)) {
      entry.lines.push({ line: item.line, original: item.original, spoiled: item.text });
      lines[item.line - 1] = `${item.text}${item.original.endsWith("\r") ? "\r" : ""}`;
    }
    files.push({ entry, text: lines.join("\n") });
  }
  // The list first: a verify cut off between here and the end leaves it for the next one.
  fs.mkdirSync(path.dirname(SPOILS_FILE), { recursive: true });
  fs.writeFileSync(SPOILS_FILE, JSON.stringify({ files: files.map(({ entry }) => entry) }, null, 2));
  spoiledNow = files.map(({ entry }) => entry);
  for (const { entry, text } of files) fs.writeFileSync(path.join(ROOT, entry.file), text);
}

/** Every spoiled line put back and each file's hash proven as before — or a loud stop naming what to fix. */
function putBack(entries) {
  const proofs = entries.map((entry) => {
    try {
      const full = path.join(ROOT, entry.file);
      const lines = fs.readFileSync(full, "utf8").split("\n");
      for (const { line, original, spoiled } of entry.lines) if (lines[line - 1]?.replace(/\r$/, "") === spoiled) lines[line - 1] = original;
      fs.writeFileSync(full, lines.join("\n"));
      return { file: entry.file, sha256: entry.sha256, unchanged: sha(fs.readFileSync(full)) === entry.sha256 };
    } catch (error) {
      return { file: entry.file, sha256: entry.sha256, unchanged: false, error: error.message };
    }
  });
  spoiledNow = null;
  const left = entries.filter((entry) => !proofs.find((proof) => proof.file === entry.file).unchanged);
  if (left.length) {
    fs.writeFileSync(SPOILS_FILE, JSON.stringify({ files: left }, null, 2));
    say("\n!!! VERIFY COULD NOT PROVE A SPOILED SPEC PUT BACK — fix it by hand before anything else:");
    for (const entry of left) {
      const lines = fs.existsSync(path.join(ROOT, entry.file)) ? read(entry.file).split("\n") : [];
      const still = entry.lines.filter(({ line, original }) => lines[line - 1] !== original);
      for (const { line, original } of still) say(`!!!   ${entry.file}:${line} must read: ${original.replace(/\r$/, "").trim()}`);
      if (!still.length) say(`!!!   ${entry.file}: its lines read as before, yet the file changed since the spoil — compare it with git (git diff ${entry.file})`);
    }
    say("!!! Then delete reports/verify-spoils.json — until then every verify stops here.");
    process.exit(3);
  }
  fs.rmSync(SPOILS_FILE, { force: true });
  return proofs;
}

function restoreLeftovers() {
  if (!fs.existsSync(SPOILS_FILE)) return [];
  let files;
  try {
    ({ files = [] } = JSON.parse(fs.readFileSync(SPOILS_FILE, "utf8")));
  } catch {
    say("!!! reports/verify-spoils.json is unreadable — a verify was cut off with spoiled lines: compare the specs with git (git diff tests/), put them back by hand, then delete the file.");
    process.exit(3);
  }
  const proofs = putBack(files);
  say(`A verify was cut off with spoiled lines — put back: ${proofs.map(({ file }) => file).join(", ")}, each file's hash as before.`);
  return proofs;
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
  process.on(signal, () => {
    if (spoiledNow) putBack(spoiledNow);
    process.exit(130);
  });
}

// ── Running and reading the run ───────────────────────────────────────────────────────────────────
/** A command of the test home, its output kept for test-results/verify.log: an npm script through the shell, a node script without one. */
function exec(command, args) {
  const result = args ? spawnSync(process.execPath, [command, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: BIG }) : spawnSync(command, { cwd: ROOT, encoding: "utf8", shell: true, maxBuffer: BIG });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  log.push(`$ ${args ? `node ${[command, ...args].join(" ")}` : command}\n${out}`);
  return { status: result.status ?? 1, out, stdout: result.stdout ?? "" };
}

/**
 * The run's result files: reports/run-summary.json when this run wrote it, and the latest Allure result
 * of each test in each project it ran in (a @cross-browser test with --with-browsers: ui:, firefox:, webkit:).
 */
function results(since) {
  let summary;
  try {
    summary = fs.statSync(SUMMARY_FILE).mtimeMs >= since ? JSON.parse(fs.readFileSync(SUMMARY_FILE, "utf8")) : undefined;
  } catch {
    summary = undefined;
  }
  const latest = new Map();
  for (const name of fs.existsSync(RESULTS_DIR) ? fs.readdirSync(RESULTS_DIR).filter((each) => each.endsWith("-result.json")) : []) {
    const result = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, name), "utf8"));
    const project = (result.parameters ?? []).find((parameter) => parameter.name === "Project")?.value;
    const key = `${result.fullName ?? result.name}|${project ?? ""}`;
    if ((latest.get(key)?.stop ?? -1) < (result.stop ?? 0)) latest.set(key, { ...result, project, file: `tests/${(result.fullName ?? "").split(" › ")[0]}` });
  }
  return { summary, tests: [...latest.values()] };
}
const smokeFailed = ({ tests }) => tests.some(({ file, status }) => file.startsWith("tests/smoke/") && (status === "failed" || status === "broken"));

/**
 * One run through the runner (its second pass included); once more when the app's sign-in smoke failed.
 * `withBrowsers` adds the apps' firefox:, webkit: and mobile: projects (scripts/run-tests.mjs --with-browsers).
 */
function runTests(apps, paths, withBrowsers = false) {
  const browsers = withBrowsers ? ["--with-browsers"] : [];
  const command = `npm run test:app -- ${apps.join(",")} ${paths.join(" ")} --retries=0${withBrowsers ? " --with-browsers" : ""}`;
  for (let attempt = 1; ; attempt += 1) {
    const since = Date.now();
    const { status, out } = exec(path.join("scripts", "run-tests.mjs"), ["app", apps.join(","), ...paths, "--retries=0", ...browsers]);
    const read = results(since);
    if (!smokeFailed(read) || attempt === 2) return { command, status, out, ...read, smokeAgain: attempt === 2 };
  }
}

const causeOf = (result) => /^Cause: (.+)$/m.exec(result.statusDetails?.message ?? "")?.[1];
const failedSteps = (steps = []) => steps.flatMap((step) => (step.status === "failed" || step.status === "broken" ? [step.name, ...failedSteps(step.steps)] : []));
// A test Playwright did not run (its app's sign-in smoke failed, the run was cut off) still gets a
// "skipped" Allure result — one without a reason: a skip on purpose always gives one (the gate refuses
// test.skip() without it) and a known bug carries its verdict. Such a result is no run.
const ran = (result) => result.status !== "skipped" || !!result.statusDetails?.message;

/** A test's result when it ran — in its app's own project when it also ran in another browser. */
const resultOf = (run, file, title) => {
  const of = run.tests.filter((result) => result.file === file && result.name === title && ran(result));
  return of.find(({ project }) => !browserOf(project)) ?? of[0];
};

/** What a spoiled check did: red at its line, red elsewhere, green (blind) or not run. */
function readSpoil(item, run) {
  const outcomes = item.tests.map(({ title }) => {
    const result = resultOf(run, item.file, title);
    if (!result) {
      const why = smokeFailed(run)
        ? "the app's sign-in smoke failed"
        : /SyntaxError|Unexpected token|Transform failed/.test(run.out ?? "")
          ? "the spoiled spec does not load (a syntax error) — give the whole line, its brackets kept"
          : "it did not run — test-results/verify.log says why";
      return { result: "not run", why };
    }
    const message = result.statusDetails?.message ?? "";
    if (result.status === "passed") return { result: "green — blind", why: "it passes with the spoiled line" };
    if (result.status === "skipped" && !/^Known bug/.test(message)) return { result: "not run", why: "skipped" };
    const cause = causeOf(result);
    // The innermost frame inside the test itself — a helper's frames (another file, or the spec's own
    // functions outside the test) are passed over: the test's line that called it is the one that counts.
    const [{ line: from, end: to }] = item.tests;
    const frame = [...(result.statusDetails?.trace ?? "").matchAll(/([^\s()]+?\.[cm]?[jt]s):(\d+):\d+/g)]
      .filter(([, file]) => posix(file).endsWith(item.file))
      .map(([, , line]) => Number(line))
      .find((line) => from <= line && line <= to);
    const steps = failedSteps(result.steps);
    const inItsStep = item.step !== undefined && steps.includes(item.step.title);
    const onLine = frame ? oneStatement(item.lines, frame, item.line) || (frame === item.step?.line && inItsStep) : inItsStep;
    const where = frame ? `${item.file}:${frame}` : steps.length ? `step "${steps.at(-1)}"` : "before its first step";
    if (onLine && !NOT_THE_CHECK.has(cause)) return { result: "red at its line", failedAt: where, cause };
    return { result: "red elsewhere", failedAt: where, cause, why: `${cause ?? "failed"} at ${where}` };
  });
  return outcomes.find(({ result }) => result !== "red at its line") ?? outcomes[0];
}

/** The run's counts as reports/run-summary.json words them (src/reporting/run-summary.ts). */
function countsLine(counts) {
  return [
    `${counts.passed} passed`,
    counts.slow && `${counts.slow} passed alone — the stand was slow`,
    counts.needLook && `${counts.needLook} need a look`,
    counts.knownBugs && `${counts.knownBugs} known bug${counts.knownBugs > 1 ? "s" : ""}`,
    counts.unstable && `${counts.unstable} unstable`,
    counts.skipped && `${counts.skipped} skipped`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Each test of the run (the sign-in smoke aside) in each project it ran in, with its verdict, from the
 * summary — passes from the Allure results.
 */
function verdicts(run, also) {
  const listed = (entries) => (entries ?? []).map((entry) => ({ ...entry, file: posix(path.relative(ROOT, entry.file)) }));
  const [failed, slow] = [listed(run.summary?.tests), listed(run.summary?.slow)];
  // The summary names each test's project (ui:shop, firefox:shop): a test failing in Firefox only is red there only.
  const same = (entry, result) => entry.file === result.file && entry.title === result.name && (!entry.project || !result.project || entry.project === result.project);
  return run.tests
    .filter(({ file }) => !file.startsWith("tests/smoke/"))
    .map((result) => {
      const base = { title: result.name, file: result.file, project: result.project, also: also.has(result.file) || undefined };
      if (!ran(result)) return { ...base, outcome: "not run", green: false, verdict: "did not run" };
      const wasSlow = slow.find((entry) => same(entry, result));
      if (wasSlow) return { ...base, outcome: "slow", green: true, verdict: `passed alone — the stand was slow (first pass: ${wasSlow.cause}${wasSlow.step ? ` — step "${wasSlow.step}"` : ""})` };
      const entry = failed.find((each) => same(each, result));
      if (entry?.outcome === "flaky") return { ...base, outcome: "unstable", green: false, verdict: "unstable — passed on a retry" };
      if (entry) return { ...base, line: entry.line, outcome: entry.cause === "known bug" ? "known bug" : "failed", green: false, verdict: entry.verdict, cause: entry.cause, step: entry.step, ticket: entry.ticket };
      return { ...base, outcome: result.status, green: result.status === "passed", verdict: result.status };
    })
    .sort((a, b) => Number(!!a.also) - Number(!!b.also) || a.file.localeCompare(b.file) || a.title.localeCompare(b.title) || Number(!!browserOf(a.project)) - Number(!!browserOf(b.project)) || (a.project ?? "").localeCompare(b.project ?? ""));
}

/** The cases the specs link, as scripts/agent/suite-coverage.mjs reads them after this run. */
function coverage(app, files) {
  const { status, stdout } = exec(path.join("scripts", "agent", "suite-coverage.mjs"), ["--app", app]);
  let data;
  try {
    data = JSON.parse(stdout);
  } catch {
    return { error: `suite:coverage gave no data (exit ${status})` };
  }
  const cases = Object.entries(data.cases ?? {})
    .filter(([, known]) => known.tests.some(({ file }) => files.has(file)))
    .map(([key, known]) => {
      const prefix = known.tests.map(({ title }) => new RegExp(`^(${CASE_PREFIX})${key}\\b`).exec(title)?.[1]).find(Boolean) ?? "";
      return { case: `${prefix}${key}`, coverage: known.coverage, lastRun: known.lastRun, ran: known.ran, missing: known.missing?.length ? known.missing : undefined, rework: known.rework?.length ? known.rework : undefined };
    });
  // A plan with no TMS ids: its own counts (suite:coverage withoutTmsSummary), for each plan whose tests are among these specs.
  const plans = [...new Set((data.withoutTms ?? []).filter(({ tests }) => tests.some(({ file }) => files.has(file))).map(({ plan }) => plan))];
  const own = plans.flatMap((plan) => {
    const counts = data.withoutTmsSummary?.byPlan?.[plan];
    return counts ? [{ plan, feature: path.basename(plan, ".md"), ...counts }] : [];
  });
  return own.length ? [...cases, ...own] : cases;
}

/** A plan's own counts as the Coverage line words them. */
const planWords = (item) =>
  [`plan "${item.feature}" — ${item.cases} cases`, `automated ${item.automated}`, item["to rework"] && `to rework ${item["to rework"]}`, `not automated ${item["not automated"]}`, item.inconsistent && `inconsistent ${item.inconsistent}`]
    .filter(Boolean)
    .join(" · ");

/**
 * reports/verify-state.json — what this verify leaves for the next one and for an agent's stop hook: the
 * specs, whether this session wrote them (changed against HEAD), the result (passed · failed — tests red ·
 * stopped — the gate, can-fail or a run that did not run them), how many verifies of these specs in a row
 * came out red, the red tests, and whether the one automatic heal after a fresh implement is still owed
 * (the verify skill §5). A verify of the same specs (or some of them) after a red one counts on.
 */
function writeState(report, result) {
  let previous;
  try {
    previous = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    previous = undefined;
  }
  const same = previous?.result !== "passed" && report.files.every((file) => previous?.specs?.includes(file));
  const before = same ? (previous.attempt ?? 0) : 0;
  const attempt = result === "failed" ? before + 1 : result === "stopped" ? before : 0;
  const state = { at: new Date().toISOString(), specs: report.files, fresh: report.fresh, result, attempt, red: report.red ?? [], healOwed: report.fresh && result === "failed" && attempt === 1 };
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

// ── The command ───────────────────────────────────────────────────────────────────────────────────
const PHASES = { gate: "gate", canFail: "can fail", run: "run", coverage: "coverage" };

function finish(report, reason, code) {
  report.state ??= writeState(report, code === 0 ? "passed" : "stopped");
  const block = [];
  const at = new Date(report.startedAt);
  block.push(`## Verify — ${report.apps.join(", ")} · ${at.toISOString().slice(0, 10)} ${at.toTimeString().slice(0, 5)}`);
  const gate = report.gate;
  const gateWords = gate ? `qa:gate ${gate.passed ? (gate.warnings ? `passed, ${gate.warnings} warning(s)` : "passed") : "failed"}` : "qa:gate not run";
  const run = report.run;
  if (run) {
    const unran = run.listed.filter(({ outcome }) => outcome === "not run");
    const word = run.notRun?.length ? "Not run" : run.of === 0 ? "Not run" : run.green + run.knownBugs === run.of && !unran.length ? "Passed" : run.green === 0 ? "Failed" : "Partly passed";
    block.push(`**${word}** — ${run.green} of ${run.of} tests green${run.knownBugs ? `, ${run.knownBugs} known bug(s)` : ""}${unran.length ? `, ${unran.length} did not run` : ""}, no retry; ${gateWords}.`);
    if (run.notRun?.length) block.push(`- Did not run: ${run.notRun.join(", ")} — none of its tests ran`);
  } else block.push(`**Not run** — ${gateWords}.`);
  if (report.canFail.length) {
    const red = report.canFail.filter(({ result }) => result === "red at its line").length;
    block.push(
      `- Can fail: ${red} of ${report.canFail.length} red on purpose · ${report.canFail.map((item) => `${item.test} (${item.at}): ${item.result}${item.result === "red at its line" ? "" : ` — ${item.why}`}`).join(" · ")}`,
    );
    if (report.canFail.some(({ result }) => result === "red elsewhere")) block.push("  - Red elsewhere: the test does not reach its check — test-results/verify.log holds the error");
    block.push(`- Put back: ${report.restored.map(({ file }) => file).join(", ")} — each file's hash as before (sha256)`);
  }
  if (run) {
    const smoke = run.tests.length - run.listed.length;
    block.push(`- Run: ${run.counts ? `${run.counts.total} tests: ${countsLine(run.counts)}` : "no summary written"} — reports/run-summary.json${smoke ? ` (the sign-in smoke included: ${smoke})` : ""}${run.smokeAgain ? "; the sign-in smoke failed once, the run went again" : ""}`);
    block.push(`  \`${run.command}\``);
    for (const { named, changed } of report.widened) block.push(`  - ${named} — whole spec: ${changed.join(", ")} changed`);
    // [app] with several apps, [firefox] / [webkit] / [mobile] for a run in another browser.
    const tag = (test) => {
      const parts = [report.apps.length > 1 && appOf(test.file), browserOf(test.project)].filter(Boolean);
      return parts.length ? `[${parts.join(" · ")}] ` : "";
    };
    for (const test of run.listed) block.push(`  - ${tag(test)}${test.title} — ${test.verdict}${test.cause && test.outcome !== "slow" ? ` · ${test.cause}` : ""}${test.step && test.outcome !== "slow" ? ` — step "${test.step}"` : ""}${test.also ? " (also)" : ""}`);
    if (report.withBrowsers) {
      const elsewhere = run.listed.filter(({ project }) => browserOf(project));
      const where = [...new Set(elsewhere.map(({ project }) => browserOf(project)))];
      block.push(
        `- Other browsers: ${elsewhere.length ? `${elsewhere.length} run(s) in ${where.join(", ")} — the tests tagged @cross-browser / @responsive` : "none — no test of these specs is tagged @cross-browser or @responsive"}`,
      );
    }
    const slow = run.listed.filter(({ outcome }) => outcome === "slow");
    block.push(`- Stand was slow: ${slow.length ? slow.map((test) => `${tag(test)}${test.title}`).join(" · ") : "none"}`);
  }
  if (report.coverage) {
    const items = Array.isArray(report.coverage) ? report.coverage : [];
    const words = items
      .filter((item) => item.case)
      .map((item) => `${item.case} ${item.coverage}, last run ${item.lastRun}${item.ran ? ` (${item.ran})` : ""}${item.missing ? `, missing ${item.missing.join(", ")}` : ""}`);
    const plans = items.filter((item) => item.plan).map(planWords);
    const said = [words.join(" · "), ...plans].filter(Boolean).join("; ");
    block.push(`- Coverage (${report.app}): ${report.coverage.error ?? (said || "no case links these specs")}`);
  }
  const times = Object.entries(report.ms).map(([phase, ms]) => `${PHASES[phase]} ${clock(ms)}`);
  block.push(`- Time: ${times.join(" · ")} · total ${clock(Date.now() - report.startedAt)}`);

  const data = {
    verify: code === 0 ? "passed" : "not green",
    reason,
    app: report.app,
    specs: report.specs,
    also: report.also,
    widened: report.widened.length ? report.widened : undefined,
    withBrowsers: report.withBrowsers || undefined,
    gate: report.gate,
    canFail: report.canFail,
    restored: report.restored,
    run: run && { command: run.command, status: run.status, counts: run.counts, green: run.green, of: run.of, knownBugs: run.knownBugs, notRun: run.notRun, tests: run.listed.map(({ green, ...test }) => test) },
    coverage: report.coverage,
    attempt: report.state.attempt || undefined,
    healOwed: report.state.healOwed || undefined,
    seconds: { ...Object.fromEntries(Object.entries(report.ms).map(([phase, ms]) => [phase, Math.round(ms / 1000)])), total: Math.round((Date.now() - report.startedAt) / 1000) },
  };
  say(`\n${block.join("\n")}\n\n\`\`\`json\n${JSON.stringify(data)}\n\`\`\``);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "verify.json"), mask(JSON.stringify({ block: block.join("\n"), ...data }, null, 2)));
  fs.writeFileSync(path.join(OUT_DIR, "verify.log"), mask(log.join("\n")));
  say(`\nVerify: ${reason}`);
  process.exit(code);
}

function main(argv) {
  if (argv[0] === "--restore") {
    const proofs = restoreLeftovers();
    if (!proofs.length) say("Nothing to put back — no spoiled line is listed (reports/verify-spoils.json).");
    process.exit(0);
  }
  const call = parse(argv);
  restoreLeftovers();
  const named = resolveNamed([...call.specs, ...call.also]);
  [call.specs, call.also] = [named.slice(0, call.specs.length), named.slice(call.specs.length)];
  // A named spec changed against HEAD is this session's: written or changed now, not verified before.
  const changedSpecs = changedSources("tests");
  const report = {
    startedAt: Date.now(),
    app: call.app,
    apps: call.apps,
    files: [...new Set(call.specs.map(({ file }) => file))],
    fresh: call.specs.some(({ file }) => changedSpecs.has(file)),
    specs: call.specs.map(({ arg }) => arg),
    also: call.also.map(({ arg }) => arg),
    widened: named.flatMap(({ widened }) => (widened ? [widened] : [])),
    withBrowsers: call.withBrowsers,
    canFail: [],
    restored: [],
    ms: {},
  };
  const phase = (name, work) => {
    const started = Date.now();
    try {
      return work();
    } finally {
      report.ms[name] = (report.ms[name] ?? 0) + Date.now() - started;
    }
  };

  // A wrong --can-fail stops the call before anything runs.
  const items = call.spoils.length ? holders(call.spoils) : [];

  // 1. The gate.
  const gate = phase("gate", () => exec("npm run qa:gate"));
  const warnings = gate.out.split("\n").filter((line) => line.startsWith("! "));
  report.gate = { passed: gate.status === 0, warnings: warnings.length };
  if (gate.status !== 0) {
    say(gate.out.trim());
    finish(report, "stopped — the gate failed: fix what it says, then run verify again (nothing ran)", 1);
  }
  if (warnings.length) say(`qa:gate warnings to weigh:\n${warnings.slice(0, 10).join("\n")}${warnings.length > 10 ? `\n… ${warnings.length - 10} more in test-results/verify.log` : ""}`);

  // 2. Can fail — in the app's own projects only: a spoil needs one red, not one per browser.
  if (items.length) {
    const run = phase("canFail", () => {
      spoil(items);
      // A spoiled run says nothing of the tests as written: their last results (reports/last-results.json) stay.
      process.env.AQA_SPOILED_RUN = "1";
      try {
        const locations = [...new Set(items.flatMap((item) => item.tests.map(({ file, line }) => `${file}:${line}`)))];
        return runTests([...new Set(items.map(({ file }) => appOf(file)))], locations);
      } finally {
        delete process.env.AQA_SPOILED_RUN;
        report.restored = putBack(spoiledNow);
      }
    });
    report.canFail = items.map((item) => ({ at: `${item.file}:${item.line}`, test: item.tests.map(({ title }) => title).join(" | "), ...readSpoil(item, run) }));
    const unproven = report.canFail.filter(({ result }) => result !== "red at its line");
    if (unproven.length) {
      finish(report, `stopped — ${unproven.length} of ${report.canFail.length} spoiled check(s) not red at their line: ${unproven.map(({ at, result }) => `${at} ${result}`).join("; ")} — the run was not started`, 1);
    }
  }

  // 3. The run.
  const paths = [...new Set([...call.specs, ...call.also].map(({ arg }) => arg))];
  const also = new Set(call.also.map(({ file }) => file).filter((file) => !call.specs.some((spec) => spec.file === file)));
  const run = phase("run", () => runTests(call.apps, paths, call.withBrowsers));
  const listed = verdicts(run, also);
  // A test skipped on purpose or one that did not run is not among those counted green or red.
  const counted = listed.filter(({ outcome }) => outcome !== "skipped" && outcome !== "not run");
  report.run = {
    command: run.command,
    status: run.status,
    counts: run.summary?.counts,
    tests: run.tests,
    listed,
    green: counted.filter(({ green }) => green).length,
    knownBugs: counted.filter(({ outcome }) => outcome === "known bug").length,
    of: counted.length,
    smokeAgain: run.smokeAgain,
    // A named spec none of whose tests ran never reads as green, whatever else passed.
    notRun: named.filter((entry) => !entry.tests.some(({ title }) => resultOf(run, entry.file, title))).map(({ arg }) => arg),
  };

  // 4. The coverage of the cases the specs link.
  report.coverage = phase("coverage", () => coverage(call.app, new Set(call.specs.map(({ file }) => file))));

  // A test that did not run proves nothing: it is never green.
  const red = [...counted.filter(({ green, outcome }) => !green && outcome !== "known bug"), ...listed.filter(({ outcome }) => outcome === "not run")];
  if (!run.summary) finish(report, "failed — the run wrote no reports/run-summary.json (test-results/verify.log says why)", 1);
  if (report.run.notRun.length) finish(report, `failed — the named tests did not run: ${report.run.notRun.join(", ")} (test-results/verify.log says why)`, 1);
  if (run.status !== 0 || red.length) {
    report.red = [...new Set(red.map(({ file, line }) => (line ? `${file}:${line}` : file)))];
    report.state = writeState(report, "failed");
    const failed = `failed — ${red.length || "some"} test(s) not green: reports/run-summary.md has each verdict`;
    // The one automatic heal after a fresh implement (the verify skill §5): owed now, or spent.
    if (report.state.healOwed) finish(report, `${failed} · now the automatic heal (the verify skill §5, §8): ${report.red.join(" ")} — then this command again on them`, 1);
    if (report.fresh && report.state.attempt > 1) finish(report, `${failed} · still red after the automatic heal: report the real state (the verify skill §5, §7) — no further heal unless the user asks`, 1);
    finish(report, failed, 1);
  }
  finish(report, "passed", 0);
}

main(process.argv.slice(2));
