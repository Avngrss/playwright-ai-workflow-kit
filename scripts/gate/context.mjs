import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** What every rule module shares: the test home, its files by kind, and the report the rules write to. */

export const ROOT = process.cwd();
export const at = (...parts) => path.join(ROOT, ...parts);
export const read = (file) => fs.readFileSync(file, "utf8");
export const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");

/** The files of specs/ itself — every other Markdown file there is a feature plan. */
export const SPECS_OWN_FILES = new Set(["project-map.md", "known-bugs.md"]);

// Generated, dependency and session folders are never the suite's own code.
const NOT_SOURCE = new Set(["node_modules", ".git", "state", "reports", "test-results", "playwright-report"]);

/** Files under `dir` (recursively) that pass `keep`. */
export function listFiles(dir, keep = () => true) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return NOT_SOURCE.has(entry.name) ? [] : listFiles(full, keep);
    return keep(full) ? [full] : [];
  });
}

/** The suite's files by kind — the groups the rules name ("specs", "uiModels", "testCode", …). */
export function collectFiles() {
  const specs = (layer) => listFiles(at("tests", layer), (file) => file.endsWith(".spec.ts"));
  const code = (...dir) => listFiles(at("src", ...dir), (file) => file.endsWith(".ts"));
  const [ui, api, e2e, smoke] = ["ui", "api", "e2e", "smoke"].map(specs);
  const [pages, components, clients] = [code("pages"), code("components"), code("api", "clients")];
  const support = code();
  return {
    ui,
    api,
    e2e,
    smoke,
    specs: [...ui, ...api, ...e2e, ...smoke],
    pages,
    components,
    clients,
    uiModels: [...pages, ...components],
    support,
    testCode: [...ui, ...api, ...e2e, ...smoke, ...support],
  };
}

/** The map's §Apps and services rows: { platform, kind } each. */
function appRows() {
  const map = at("specs", "project-map.md");
  if (!fs.existsSync(map)) return [];
  const section = /^## Apps and services\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(read(map).replace(/\r\n/g, "\n"))?.[1] ?? "";
  return section
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .filter(([, slug]) => slug && slug !== "Platform" && !/^-+$/.test(slug))
    .map(([, platform, , kind]) => ({ platform, kind: kind ?? "" }));
}

/** The apps the map lists (§Apps and services, `Platform` column) — empty while it holds only the template's `default` rows. */
export function registeredPlatforms() {
  const unique = [...new Set(appRows().map(({ platform }) => platform))];
  return unique.length === 1 && unique[0] === "default" ? [] : unique;
}

/** The apps with an API row in the map (its `Kind` names API) — the apps an API scenario can be planned for. */
export function apiPlatforms() {
  return new Set(appRows().filter(({ kind }) => /\bAPI\b/i.test(kind)).map(({ platform }) => platform));
}

// Support-code folders split by app (agents/rules/00-project-map.md): <kind>/<app>/….
export const PER_APP_KINDS = [["fixtures"], ["pages"], ["components"], ["api", "clients"], ["data", "builders"], ["data", "datasets"], ["data", "generators"], ["assertions"], ["setup"]];

/** The app a file or folder belongs to — by its place under tests/<layer>/<app>/ or src/<kind>/<app>/ — or undefined for shared code. */
export function appOfPath(file, apps) {
  const testsPart = path.relative(at("tests"), file).split(path.sep);
  if (!testsPart[0].startsWith("..") && testsPart.length > 2 && apps.includes(testsPart[1])) return testsPart[1];
  const parts = path.relative(at("src"), file).split(path.sep);
  if (parts[0].startsWith("..")) return undefined;
  // setup/auth/ is the template's universal login, shared by every app (even one called "auth").
  if (parts[0] === "setup" && parts[1] === "auth") return undefined;
  for (const kind of PER_APP_KINDS) {
    const app = parts[kind.length];
    if (kind.every((segment, index) => parts[index] === segment) && parts.length > kind.length + 1 && apps.includes(app)) return app;
  }
  return undefined;
}

const git = (args) => execSync(`git ${args}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

/**
 * Where this branch left the default branch: the merge base with AQA_BASE_BRANCH, origin's HEAD, main or
 * master — the first that exists. None (no such branch, a clone that fetched only this branch, no commit
 * yet) → null. On the default branch itself it is HEAD: nothing there is being written.
 */
function branchBase() {
  const candidates = [process.env.AQA_BASE_BRANCH, "origin/HEAD", "main", "master", "origin/main", "origin/master"].filter(Boolean);
  for (const ref of candidates) {
    try {
      return git(`merge-base ${ref} HEAD`).trim() || null;
    } catch {
      // that branch does not exist here — the next one
    }
  }
  return null;
}

/**
 * Files under `dir` being written now: changed on this branch since it left the default branch —
 * committed or not, so a commit never turns a failure into a warning and CI (where everything is
 * committed) judges the branch's work as strictly as the working copy — plus the working tree's new and
 * changed ones. With no base to compare with, the working tree's only. null without git.
 */
export function inProgress(dir = "tests") {
  try {
    // git names files from the repository's root; the test home may be a folder inside it.
    const prefix = git("rev-parse --show-prefix").trim();
    const inHome = (file) => path.join(ROOT, file.slice(prefix.length));
    // NUL-separated: a path with spaces comes unquoted, a rename as its new path (its old one follows).
    const files = new Set();
    const records = git(`status --porcelain -z --untracked-files=all -- ${dir}`).split("\0");
    for (let at = 0; at < records.length; at += 1) {
      if (!records[at]) continue;
      files.add(inHome(records[at].slice(3)));
      if (/[RC]/.test(records[at].slice(0, 2))) at += 1;
    }
    const base = branchBase();
    if (base) for (const file of git(`diff --name-only -z ${base} HEAD -- ${dir}`).split("\0").filter(Boolean)) files.add(inHome(file));
    return files;
  } catch {
    return null;
  }
}

/** Failures fail the gate; warnings are smells a reviewer weighs. Every line says how to fix it. */
export function createReport() {
  const failures = [];
  const warnings = [];
  const line = (file, message) => (file ? `${rel(file)} — ${message}` : message);
  return {
    failures,
    warnings,
    fail: (file, message) => failures.push(line(file, message)),
    warn: (file, message) => warnings.push(line(file, message)),
  };
}

// A line ending in an opener, a comma or an operator — or starting with a closer, a dot or an
// operator — continues the statement before it. A `{` ending a line opens an object only after `(`,
// `[`, `,`, `=`, `:`, `?` or `return`; otherwise it opens a block (a function body, a branch, a class),
// and the block's lines are statements of their own.
const OBJECT_OPENER = /(^|[([,=:?]|\breturn)\s*\{$/;
const opensBlock = (text) => text.endsWith("{") && !OBJECT_OPENER.test(text);
const CONTINUED = /[([{,=?:&|+*/-]$/;
const CONTINUING = /^[.)\]}?:&|]/;
const isComment = (text) => /^(\/\/|\/\*|\*)/.test(text);
// The same code laid out on one line or on several: no space inside brackets, no trailing comma.
const normalized = (text) => text.replace(/([([{])\s+/g, "$1").replace(/\s+([)\]}])/g, "$1").replace(/,([)\]}])/g, "$1").replace(/\s+\./g, ".");

/**
 * The file's statements, one line each, with the line each starts on — a call or an object the
 * formatter laid over several lines reads as it would on one, so a copy is found however it is laid out.
 */
export function statementsOf(text) {
  const statements = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const previous = statements.at(-1);
    const joins =
      previous &&
      !isComment(line) &&
      !isComment(previous.text) &&
      !opensBlock(previous.text) &&
      !previous.text.endsWith(";") &&
      (CONTINUED.test(previous.text) || CONTINUING.test(line));
    if (joins) previous.text = `${previous.text} ${line}`;
    else statements.push({ text: line, line: index + 1 });
  });
  return statements.map(({ text: statement, line }) => ({ text: isComment(statement) ? statement : normalized(statement), line }));
}

/** The statements that do something — what sizes count: comments and lines that only close a block (`});`) left out. */
export const workingStatementsOf = (text) => statementsOf(text).filter(({ text: statement }) => !isComment(statement) && !/^[)\]}][)\]};,]*$/.test(statement));
