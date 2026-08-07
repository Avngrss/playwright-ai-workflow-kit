import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const UI_TESTS_DIR = path.join(ROOT, "tests", "ui");
const API_TESTS_DIR = path.join(ROOT, "tests", "api");
const E2E_TESTS_DIR = path.join(ROOT, "tests", "e2e");
const PROJECT_MAP_PATH = path.join(ROOT, ".cursor", "rules", "00-project-map.mdc");

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

function extractRegisteredTagsFromProjectMap() {
  if (!fs.existsSync(PROJECT_MAP_PATH)) {
    return new Set();
  }

  const content = read(PROJECT_MAP_PATH);
  const tags = new Set();
  const tagPattern = /`(@[a-z0-9-]+)`/gi;
  let match = tagPattern.exec(content);

  while (match) {
    tags.add(match[1].toLowerCase());
    match = tagPattern.exec(content);
  }

  return tags;
}

function extractTagsFromSpecContent(content) {
  const tags = new Set();
  const tagArrayPattern = /tag\s*:\s*\[([^\]]*)\]/gms;
  let arrayMatch = tagArrayPattern.exec(content);

  while (arrayMatch) {
    const values = arrayMatch[1];
    const valuePattern = /["'](@[a-z0-9-]+)["']/gi;
    let valueMatch = valuePattern.exec(values);

    while (valueMatch) {
      tags.add(valueMatch[1].toLowerCase());
      valueMatch = valuePattern.exec(values);
    }

    arrayMatch = tagArrayPattern.exec(content);
  }

  return tags;
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

  for (const spec of uiSpecs) {
    const content = read(spec);
    const hasBeforeEach = /test\.beforeEach\s*\(/.test(content);
    const openCalls = content.match(/await\s+[a-zA-Z_$][\w$]*\.open\(\);/g) ?? [];

    if (!hasBeforeEach && openCalls.length >= 3) {
      fail(
        `UI spec repeats page open setup (${openCalls.length} times) without beforeEach(): ${rel(spec)}`,
      );
    }
  }

  ok("UI specs avoid repeated page-open setup without beforeEach().");
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

function checkRegisteredTags(specFiles) {
  if (specFiles.length === 0) {
    skip("No spec files found for tag registry checks.");
    return;
  }

  const registeredTags = extractRegisteredTagsFromProjectMap();
  const baseAllowedTags = new Set([
    "@api",
    "@ui",
    "@e2e",
    "@visual",
    "@smoke",
    "@regression",
    "@cross-browser",
    "@responsive",
  ]);

  for (const tag of registeredTags) {
    baseAllowedTags.add(tag);
  }

  for (const spec of specFiles) {
    const content = read(spec);
    const usedTags = extractTagsFromSpecContent(content);

    for (const tag of usedTags) {
      if (!baseAllowedTags.has(tag)) {
        fail(
          `Spec uses unregistered tag ${tag}. Register it in .cursor/rules/00-project-map.mdc: ${rel(spec)}`,
        );
      }
    }
  }

  ok("All spec tags are registered in project map.");
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
  const finalFixtureLayers = ["./pages.fixture", "./auth.fixture"];
  const reExportsFinalLayer = finalFixtureLayers.some((layer) =>
    content.includes(`"${layer}"`) || content.includes(`'${layer}'`),
  );

  if (!reExportsFinalLayer) {
    fail(
      "Final fixture entry point must re-export from the last fixture layer (pages.fixture or auth.fixture): src/test/fixtures/test.ts",
    );
  }

  if (content.includes("@playwright/test")) {
    fail(
      "Final fixture entry point must not import directly from @playwright/test: src/test/fixtures/test.ts",
    );
  }

  if (!/\btest\b/.test(content) || !/\bexpect\b/.test(content)) {
    fail(
      "Final fixture entry point must export test and expect: src/test/fixtures/test.ts",
    );
  }

  const baseFixturePath = path.join(SRC_TEST_DIR, "fixtures", "base.fixture.ts");
  if (fs.existsSync(baseFixturePath)) {
    const baseFixtureContent = read(baseFixturePath);

    if (baseFixtureContent.includes("../pages/")) {
      fail(
        "base.fixture.ts must not import Page Objects. Move page wiring to pages.fixture.ts.",
      );
    }
  }

  ok("Final fixture entry point re-exports test and expect from the fixture chain.");
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
  const e2eSpecs = listFiles(E2E_TESTS_DIR, (file) => file.endsWith(".spec.ts"));

  const pageFiles = listFiles(PAGES_DIR, (file) => file.endsWith(".ts"));
  const componentFiles = listFiles(COMPONENTS_DIR, (file) => file.endsWith(".ts"));
  const dataFiles = listFiles(DATA_DIR, (file) => file.endsWith(".ts"));
  const apiClientFiles = listFiles(API_CLIENTS_DIR, (file) => file.endsWith(".ts"));

  checkUiSpecs(uiSpecs);
  checkApiSpecs(apiSpecs);
  checkRegisteredTags([...uiSpecs, ...apiSpecs, ...e2eSpecs]);
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