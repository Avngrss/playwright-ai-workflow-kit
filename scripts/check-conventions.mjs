import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const UI_TESTS_DIR = path.join(ROOT, "tests", "ui");
const PAGES_DIR = path.join(ROOT, "src", "test", "pages");
const COMPONENTS_DIR = path.join(ROOT, "src", "test", "components");

function listFiles(dir, filterFn) {
  const result = [];

  if (!fs.existsSync(dir)) {
    return result;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...listFiles(full, filterFn));
    } else if (!filterFn || filterFn(full)) {
      result.push(full);
    }
  }

  return result;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function rel(file) {
  return path.relative(ROOT, file);
}

function fail(message) {
  console.error(`\nCONVENTION CHECK FAILED:\n${message}\n`);
  process.exit(1);
}

function warn(message) {
  console.warn(`\nWARNING:\n${message}\n`);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

function skip(message) {
  console.log(`- SKIP: ${message}`);
}

function checkNoPattern(files, pattern, messageFactory) {
  for (const file of files) {
    const content = read(file);

    if (pattern.test(content)) {
      fail(messageFactory(file));
    }
  }
}

function checkUiSpecs(uiSpecs) {
  if (uiSpecs.length === 0) {
    skip("No UI spec files found under tests/ui. UI spec checks were not executed.");
    return;
  }

  for (const spec of uiSpecs) {
    const content = read(spec);

    if (!content.includes("test.step(")) {
      fail(`UI spec does not use test.step(): ${rel(spec)}`);
    }
  }

  ok("All UI specs use test.step().");

  checkNoPattern(
    uiSpecs,
    /waitForTimeout\s*\(/,
    (file) => `UI spec uses waitForTimeout(): ${rel(file)}`
  );

  ok("No UI specs use waitForTimeout().");

  checkNoPattern(
    uiSpecs,
    /import\s*{\s*[^}]*\btest\b[^}]*}\s*from\s*["']@playwright\/test["']/,
    (file) =>
      `UI spec imports test from @playwright/test directly. Use final fixture entry point: ${rel(file)}`
  );

  ok("No UI specs import test directly from @playwright/test.");

  checkNoPattern(
    uiSpecs,
    /new\s+\w+Page\s*\(/,
    (file) => `UI spec instantiates Page Object directly. Use fixtures: ${rel(file)}`
  );

  ok("No UI specs instantiate Page Objects directly.");

  for (const spec of uiSpecs) {
    const content = read(spec);

    if (!content.includes("@ui")) {
      fail(`UI spec is missing @ui tag coverage: ${rel(spec)}`);
    }

    if (!content.includes("@smoke") && !content.includes("@regression")) {
      fail(`UI spec is missing @smoke or @regression tag coverage: ${rel(spec)}`);
    }
  }

  ok("All UI specs have @ui and @smoke/@regression tag coverage.");
}

function checkUiModelFiles(pageFiles, componentFiles) {
  if (pageFiles.length === 0) {
    skip("No Page Object files found under src/test/pages. Page Object checks were not executed.");
  }

  if (componentFiles.length === 0) {
    skip("No Component Object files found under src/test/components. Component Object checks were not executed.");
  }

  const uiModelFiles = [...pageFiles, ...componentFiles];

  if (uiModelFiles.length === 0) {
    skip("No Page Objects or Components found. UI model checks were not executed.");
    return;
  }

  checkNoPattern(
    uiModelFiles,
    /import\s*{\s*[^}]*\bexpect\b[^}]*}\s*from\s*["']@playwright\/test["']/,
    (file) => `Page/Component imports expect from @playwright/test: ${rel(file)}`
  );

  checkNoPattern(
    uiModelFiles,
    /\bexpect\s*\(/,
    (file) => `Page/Component uses expect() directly: ${rel(file)}`
  );

  ok("No Page Objects or Components import/use expect().");

  checkNoPattern(
    uiModelFiles,
    /test\.step\s*\(/,
    (file) => `Page/Component uses test.step(): ${rel(file)}`
  );

  ok("No Page Objects or Components use test.step().");

  checkNoPattern(
    uiModelFiles,
    /waitForTimeout\s*\(/,
    (file) => `Page/Component uses waitForTimeout(): ${rel(file)}`
  );

  ok("No Page Objects or Components use waitForTimeout().");

  checkNoPattern(
    uiModelFiles,
    /process\.env/,
    (file) => `Page/Component reads process.env directly: ${rel(file)}`
  );

  ok("No Page Objects or Components read process.env directly.");

  checkNoPattern(
    uiModelFiles,
    /Date\.now\s*\(|Math\.random\s*\(/,
    (file) =>
      `Page/Component generates test data inline with Date.now() or Math.random(): ${rel(file)}`
  );

  ok("No Page Objects or Components generate inline random data.");
}

function main() {
  const uiSpecs = listFiles(UI_TESTS_DIR, (file) => file.endsWith(".spec.ts"));
  const pageFiles = listFiles(PAGES_DIR, (file) => file.endsWith(".ts"));
  const componentFiles = listFiles(COMPONENTS_DIR, (file) => file.endsWith(".ts"));

  checkUiSpecs(uiSpecs);
  checkUiModelFiles(pageFiles, componentFiles);

  console.log("\nConvention checks passed.\n");
}

main();
