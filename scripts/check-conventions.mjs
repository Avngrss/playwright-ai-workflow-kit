import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const UI_TESTS_DIR = path.join(ROOT, "tests", "ui");
const PAGES_DIR = path.join(ROOT, "src", "test", "pages");

function listFiles(dir, filterFn) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(full, filterFn));
    else if (!filterFn || filterFn(full)) result.push(full);
  }
  return result;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function fail(msg) {
  console.error("\nCONVENTION CHECK FAILED:\n" + msg + "\n");
  process.exit(1);
}

function warn(msg) {
  console.warn("\n" + msg + "\n");
}

function ok(msg) {
  console.log(" " + msg);
}

const uiSpecs = fs.existsSync(UI_TESTS_DIR)
  ? listFiles(UI_TESTS_DIR, (f) => f.endsWith(".spec.ts"))
  : [];

if (uiSpecs.length === 0) warn("No UI spec files found under tests/ui.");

for (const spec of uiSpecs) {
  const c = read(spec);
  if (!c.includes("test.step(")) {
    fail(`Spec does not use test.step(): ${path.relative(ROOT, spec)}`);
  }
}
ok("All UI specs use test.step().");

for (const spec of uiSpecs) {
  const c = read(spec);
  if (c.includes("waitForTimeout(")) {
    fail(`Spec uses waitForTimeout(): ${path.relative(ROOT, spec)}`);
  }
}
ok("No UI specs use waitForTimeout().");

if (!fs.existsSync(PAGES_DIR)) {
  warn("src/test/pages does not exist. Skipping Page Object checks.");
} else {
  const pageFiles = listFiles(PAGES_DIR, (f) => f.endsWith(".ts"));
  for (const file of pageFiles) {
    const c = read(file);
    if (c.match(/import\s*{\s*[^}]*\bexpect\b[^}]*}\s*from\s*["']@playwright\/test["']/)) {
      fail(`Page Object imports expect (forbidden): ${path.relative(ROOT, file)}`);
    }
    if (c.includes("expect(")) {
      fail(`Page Object uses expect() (forbidden): ${path.relative(ROOT, file)}`);
    }
  }
  ok("No Page Objects import or use expect().");
}

for (const spec of uiSpecs) {
  const c = read(spec);
  if (c.match(/new\s+\w+Page\s*\(/)) {
    fail(`Spec instantiates Page Objects directly (use fixtures): ${path.relative(ROOT, spec)}`);
  }
}
ok("No UI specs instantiate Page Objects directly (fixtures are used).");
console.log("\nConvention checks passed.\n");