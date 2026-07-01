import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const UI_TESTS_DIR = path.join(ROOT, "tests", "ui");
const API_TESTS_DIR = path.join(ROOT, "tests", "api");

const PAGES_DIR = path.join(ROOT, "src", "test", "pages");
const COMPONENTS_DIR = path.join(ROOT, "src", "test", "components");
const DATA_DIR = path.join(ROOT, "src", "test", "data");
const API_CLIENTS_DIR = path.join(ROOT, "src", "test", "api", "clients");

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

  checkNoPattern(
    uiSpecs,
    /path\.resolve\s*\(\s*(process\.cwd\(\)|__dirname)\s*,\s*["'][^"']*\.env["']\s*\)|setInputFiles\s*\(\s*["'][^"']*\.env["']\s*\)|["'][^"']*\.env["']/,
    (file) =>
      `UI spec references .env file. Do not use secrets/config files as upload/test assets: ${rel(file)}`
  );

  ok("No UI specs reference .env as test asset.");

  for (const spec of uiSpecs) {
    const content = read(spec);

    if (!content.includes("@ui")) {
      fail(`UI spec is missing @ui tag coverage: ${rel(spec)}`);
    }

    if (!content.includes("@smoke") && !content.includes("@regression")) {
      fail(`UI spec is missing @smoke or @regression tag coverage: ${rel(spec)}`);
    }

    if (content.includes("toHaveScreenshot(") && !content.includes("@visual")) {
      fail(`UI spec uses toHaveScreenshot() but is missing @visual tag: ${rel(spec)}`);
    }
  }

  ok("All UI specs have @ui and @smoke/@regression tag coverage.");
  ok("All UI specs with toHaveScreenshot() have @visual tag.");
}

function checkApiSpecs(apiSpecs) {
  if (apiSpecs.length === 0) {
    skip("No API spec files found under tests/api. API spec checks were not executed.");
    return;
  }

  checkNoPattern(
    apiSpecs,
    /waitForTimeout\s*\(/,
    (file) => `API spec uses waitForTimeout(): ${rel(file)}`
  );

  ok("No API specs use waitForTimeout().");

  checkNoPattern(
    apiSpecs,
    /path\.resolve\s*\(\s*(process\.cwd\(\)|__dirname)\s*,\s*["'][^"']*\.env["']\s*\)|["'][^"']*\.env["']/,
    (file) =>
      `API spec references .env file. Do not use secrets/config files as test assets: ${rel(file)}`
  );

  ok("No API specs reference .env as test asset.");
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

  checkNoPattern(
    uiModelFiles,
    /toHaveScreenshot\s*\(/,
    (file) =>
      `Page/Component uses toHaveScreenshot(). Visual assertions belong in specs: ${rel(file)}`
  );

  ok("No Page Objects or Components use toHaveScreenshot().");
}

function checkNoAllureInForbiddenLayers(files) {
  if (files.length === 0) {
    skip("No files found in forbidden Allure layers. Allure layer checks were not executed.");
    return;
  }

  checkNoPattern(
    files,
    /from\s*["']allure-js-commons["']|from\s*["']allure-playwright["']|allure\./,
    (file) =>
      `Forbidden Allure usage outside spec/reporting layer: ${rel(file)}`
  );

  ok("No forbidden Allure usage in pages, components, data, or API clients.");
}

const SRC_TEST_DIR = path.join(ROOT, "src", "test");
const FIXTURE_ENTRY_POINT = path.join(SRC_TEST_DIR, "fixtures", "test.ts");

function hasProjectImplementationLayer() {
  return fs.existsSync(SRC_TEST_DIR);
}

function checkFinalFixtureEntryPoint() {
  if (!fs.existsSync(FIXTURE_ENTRY_POINT)) {
    skip(
      "No final fixture entry point at src/test/fixtures/test.ts. Fixture entry point checks were not executed."
    );
    return;
  }

  const content = read(FIXTURE_ENTRY_POINT);

  if (content.includes("./pages.fixture")) {
    fail(
      "Final fixture entry point must not import from pages.fixture: src/test/fixtures/test.ts",
    );
  }

  if (!content.includes("./base.fixture")) {
    fail(
      "Final fixture entry point must re-export from ./base.fixture: src/test/fixtures/test.ts",
    );
  }

  if (!/\btest\b/.test(content) || !/\bexpect\b/.test(content)) {
    fail(
      "Final fixture entry point must export test and expect: src/test/fixtures/test.ts",
    );
  }

  ok("Final fixture entry point re-exports test and expect from base.fixture.");
}

function main() {
  if (!hasProjectImplementationLayer()) {
    skip(
      "src/test/ is absent. Clean starter — project implementation layer checks were not executed."
    );
  } else {
    checkFinalFixtureEntryPoint();
  }

  const uiSpecs = listFiles(UI_TESTS_DIR, (file) => file.endsWith(".spec.ts"));
  const apiSpecs = listFiles(API_TESTS_DIR, (file) => file.endsWith(".spec.ts"));

  const pageFiles = listFiles(PAGES_DIR, (file) => file.endsWith(".ts"));
  const componentFiles = listFiles(COMPONENTS_DIR, (file) => file.endsWith(".ts"));
  const dataFiles = listFiles(DATA_DIR, (file) => file.endsWith(".ts"));
  const apiClientFiles = listFiles(API_CLIENTS_DIR, (file) => file.endsWith(".ts"));

  checkUiSpecs(uiSpecs);
  checkApiSpecs(apiSpecs);
  checkUiModelFiles(pageFiles, componentFiles);

  checkNoAllureInForbiddenLayers([
    ...pageFiles,
    ...componentFiles,
    ...dataFiles,
    ...apiClientFiles,
  ]);

  console.log("\nConvention checks passed.\n");
}

main();