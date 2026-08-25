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

const FORBIDDEN_FEATURE_FOLDERS = new Set([
  "misc",
  "common",
  "shared",
  "all",
  "other",
  "temp",
  "helpers",
  "tests",
]);

function checkFeaturePlanPlacement() {
  const SPECS_DIR = path.join(ROOT, "specs");
  const E2E_PLANS_DIR = path.join(SPECS_DIR, "e2e");

  if (!fs.existsSync(SPECS_DIR)) {
    skip("No specs/ directory. Feature plan placement checks were not executed.");
    return;
  }

  const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const entry of fs.readdirSync(SPECS_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    fail(
      `Feature plan must live at specs/<feature>/<feature>.md, not flat at specs/: specs/${entry.name}`,
    );
  }

  for (const entry of fs.readdirSync(SPECS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "e2e") {
      continue;
    }

    const featureDir = path.join(SPECS_DIR, entry.name);
    const plans = fs
      .readdirSync(featureDir, { withFileTypes: true })
      .filter((item) => item.isFile() && item.name.endsWith(".md"));

    if (plans.length === 0) {
      fail(`Feature plan folder has no .md plan: specs/${entry.name}/`);
    }

    if (!kebab.test(entry.name)) {
      fail(`Feature plan folder must be kebab-case: specs/${entry.name}/`);
    }

    if (FORBIDDEN_FEATURE_FOLDERS.has(entry.name)) {
      fail(`Do not dump feature plans into generic folder '${entry.name}'.`);
    }

    for (const plan of plans) {
      const stem = plan.name.slice(0, -3);

      if (stem !== entry.name && !stem.startsWith(`${entry.name}-`)) {
        fail(
          `Feature plan filename must match folder '${entry.name}' or start with '${entry.name}-': specs/${entry.name}/${plan.name}`,
        );
      }
    }
  }

  if (fs.existsSync(E2E_PLANS_DIR)) {
    for (const entry of fs.readdirSync(E2E_PLANS_DIR, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        fail(
          `E2E journey plan must live at specs/e2e/<area>/<journey>.md, not flat: specs/e2e/${entry.name}`,
        );
      }
    }
  }

  ok("All feature plans live in specs/<feature>/<feature>.md folders.");
}

function checkSpecFeaturePlacement(specs, layerDir, layer) {
  if (specs.length === 0) {
    skip(
      `No ${layer.toUpperCase()} spec files found. Feature-folder placement checks were not executed.`,
    );
    return;
  }

  const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const suffix = `.${layer}.spec.ts`;

  for (const spec of specs) {
    const relFromLayer = path.relative(layerDir, spec);
    const parts = relFromLayer.split(path.sep);

    if (parts.length !== 2) {
      fail(
        `${layer.toUpperCase()} spec must live at tests/${layer}/<feature>/<name>.${layer}.spec.ts, not flat or deeper: ${rel(spec)}`,
      );
    }

    const [featureFolder, fileName] = parts;

    if (!kebab.test(featureFolder)) {
      fail(`Feature folder must be kebab-case: ${rel(spec)}`);
    }

    if (FORBIDDEN_FEATURE_FOLDERS.has(featureFolder)) {
      fail(
        `Do not dump specs into generic folder '${featureFolder}': ${rel(spec)}`,
      );
    }

    if (!fileName.endsWith(suffix)) {
      fail(`Spec filename must end with ${suffix}: ${rel(spec)}`);
    }

    if (layer !== "e2e") {
      const stem = fileName.slice(0, -suffix.length);

      if (stem !== featureFolder && !stem.startsWith(`${featureFolder}-`)) {
        fail(
          `Spec filename must match feature folder '${featureFolder}' or start with '${featureFolder}-': ${rel(spec)}`,
        );
      }
    }
  }

  ok(`All ${layer.toUpperCase()} specs live in tests/${layer}/<feature>/ folders.`);
}

function checkNoPattern(files, pattern, messageFactory) {
  for (const file of files) {
    const content = read(file);

    if (pattern.test(content)) {
      fail(messageFactory(file));
    }
  }
}

function validateExecutionScopeTags(content, filePath, layerTag) {
  const hasSmoke = content.includes("@smoke");
  const hasRegression = content.includes("@regression");
  const hasWip = content.includes("@wip");
  const hasFlaky = content.includes("@flaky");

  if (hasSmoke && hasRegression) {
    fail(
      `${layerTag.toUpperCase()} spec must not use both @smoke and @regression in the same file: ${filePath}`,
    );
  }

  if (!hasSmoke && !hasRegression && !hasWip && !hasFlaky) {
    fail(
      `${layerTag.toUpperCase()} spec is missing execution-scope coverage. Add @smoke or @regression, or quarantine with @wip/@flaky: ${filePath}`,
    );
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

    validateExecutionScopeTags(content, rel(spec), "ui");

    if (content.includes("toHaveScreenshot(") && !content.includes("@visual")) {
      fail(`UI spec uses toHaveScreenshot() but is missing @visual tag: ${rel(spec)}`);
    }
  }

  ok("All UI specs have @ui and valid execution-scope or quarantine tags.");
  ok("All UI specs with toHaveScreenshot() have @visual tag.");

  for (const spec of uiSpecs) {
    const content = read(spec);

    if (!content.includes("toHaveScreenshot(")) {
      continue;
    }

    if (!content.includes(".fill(")) {
      continue;
    }

    const hasMaskStrategy =
      content.includes("buildVisualMasks") ||
      content.includes("mask:") ||
      content.includes("visual-empty-state-no-mask");

    if (!hasMaskStrategy) {
      fail(
        `UI spec uses form fill and toHaveScreenshot() without mask strategy. Use explicit mask: locators from Page Object visualMaskTargets, or document empty-state-only with visual-empty-state-no-mask: ${rel(spec)}`,
      );
    }
  }

  ok("UI specs with fill + toHaveScreenshot() declare a visual mask strategy.");

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

  for (const spec of apiSpecs) {
    const content = read(spec);

    if (!content.includes("@api")) {
      fail(`API spec is missing @api tag coverage: ${rel(spec)}`);
    }

    validateExecutionScopeTags(content, rel(spec), "api");
  }

  ok("All API specs have @api and valid execution-scope or quarantine tags.");
}

function checkE2eSpecs(e2eSpecs) {
  if (e2eSpecs.length === 0) {
    skip("No E2E spec files found under tests/e2e. E2E spec checks were not executed.");
    return;
  }

  for (const spec of e2eSpecs) {
    const content = read(spec);

    if (!content.includes("test.step(")) {
      fail(`E2E spec does not use test.step(): ${rel(spec)}`);
    }

    if (!content.includes("@e2e")) {
      fail(`E2E spec is missing @e2e tag coverage: ${rel(spec)}`);
    }

    if (content.includes("@ui")) {
      fail(`E2E spec must not use @ui layer tag. Use @e2e: ${rel(spec)}`);
    }

    validateExecutionScopeTags(content, rel(spec), "e2e");
  }

  checkNoPattern(
    e2eSpecs,
    /waitForTimeout\s*\(/,
    (file) => `E2E spec uses waitForTimeout(): ${rel(file)}`,
  );

  ok("All E2E specs use test.step().");
  ok("All E2E specs have @e2e and valid execution-scope or quarantine tags.");
  ok("No E2E specs use waitForTimeout().");
}

function checkHookPolicy(specFiles) {
  if (specFiles.length === 0) {
    skip("No spec files found for hook policy checks.");
    return;
  }

  for (const spec of specFiles) {
    const content = read(spec);
    const specPath = rel(spec).replace(/\\/g, "/");
    const hasBeforeAll = /test\.beforeAll\s*\(/.test(content);
    const hasAfterAll = /test\.afterAll\s*\(/.test(content);
    const hasSerialConfigure = /describe\.configure\s*\(\s*\{\s*mode:\s*["']serial["']\s*\}/.test(
      content,
    );

    if ((hasBeforeAll || hasAfterAll) && !hasSerialConfigure) {
      fail(
        `Spec uses beforeAll/afterAll without describe.configure({ mode: 'serial' }): ${specPath}`,
      );
    }

    const isLoginOrAuthFeature = /\/(login|auth|sign-in)(\/|$)/.test(specPath);

    if (
      !isLoginOrAuthFeature &&
      /test\.beforeEach\s*\([\s\S]*?\)\s*;/.test(content) &&
      /test\.beforeEach[\s\S]*?\.login\s*\(/.test(content)
    ) {
      fail(
        `Spec appears to perform UI login in beforeEach outside login/auth feature: ${specPath}`,
      );
    }
  }

  ok("Specs follow hook policy (beforeAll/afterAll require serial; no hidden login in beforeEach).");
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

function checkDeprecatedAllureImports(specFiles) {
  if (specFiles.length === 0) {
    skip("No spec files found for deprecated Allure import checks.");
    return;
  }

  checkNoPattern(
    specFiles,
    /from\s*["']allure-playwright["']/,
    (file) =>
      `Spec imports deprecated allure-playwright runtime API. Use applyAllureMetadata() from src/test/reporting/allure-metadata.helper.ts: ${rel(file)}`,
  );

  ok("No specs import deprecated allure-playwright runtime API.");
}

const SRC_TEST_DIR = path.join(ROOT, "src", "test");
const FIXTURE_ENTRY_POINT = path.join(SRC_TEST_DIR, "fixtures", "test.ts");

const SECURITY_HELPER_ALLOWLIST = new Set(
  listFiles(path.join(SRC_TEST_DIR, "logging"), (f) => f.endsWith(".ts"))
    .concat(listFiles(path.join(SRC_TEST_DIR, "security"), (f) => f.endsWith(".ts"))),
);

function listSecurityScanFiles(specFiles, pageFiles, componentFiles, dataFiles, apiClientFiles) {
  const extraDirs = [
    path.join(SRC_TEST_DIR, "assertions"),
    path.join(SRC_TEST_DIR, "setup"),
    path.join(SRC_TEST_DIR, "reporting"),
    path.join(SRC_TEST_DIR, "fixtures"),
  ];

  const files = new Set([
    ...specFiles,
    ...pageFiles,
    ...componentFiles,
    ...dataFiles,
    ...apiClientFiles,
  ]);

  for (const dir of extraDirs) {
    for (const file of listFiles(dir, (candidate) => candidate.endsWith(".ts"))) {
      files.add(file);
    }
  }

  return [...files].filter((file) => !SECURITY_HELPER_ALLOWLIST.has(file));
}

function checkSecurityConventions(
  specFiles,
  pageFiles,
  componentFiles,
  dataFiles,
  apiClientFiles,
) {
  const scanFiles = listSecurityScanFiles(
    specFiles,
    pageFiles,
    componentFiles,
    dataFiles,
    apiClientFiles,
  );

  if (scanFiles.length === 0) {
    skip("No spec or src/test files found for security convention checks.");
  } else {
    checkNoPattern(
      scanFiles,
      /console\.(log|debug|info)\s*\(/,
      (file) =>
        `Forbidden console diagnostics. Use safeLogger (create src/test/logging/safe-logger.helper.ts when logging is needed): ${rel(file)}`,
    );

    ok("No forbidden raw console.log/debug/info in tests or project helpers.");
  }

  if (specFiles.length === 0) {
    skip("No spec files found for spec-level security checks.");
  } else {
    checkNoPattern(
      specFiles,
      /process\.env/,
      (file) =>
        `Spec reads process.env directly. Resolve env through fixtures/config: ${rel(file)}`,
    );

    ok("No specs read process.env directly.");

    checkNoPattern(
      specFiles,
      /(?:Bearer\s+eyJ[A-Za-z0-9\-._~+/]+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/,
      (file) =>
        `Spec appears to contain a hardcoded token or JWT. Use config/auth providers: ${rel(file)}`,
    );

    ok("No specs contain hardcoded Bearer/JWT-like secrets.");
  }

  const attachmentFiles = scanFiles.filter((file) => {
    const content = read(file);
    return /(?:allure\.attachment|testInfo\.attach)\s*\(/.test(content);
  });

  for (const file of attachmentFiles) {
    const content = read(file);

    if (
      !/(?:sanitize|redact|buildSanitizedHttpSnapshot|formatSanitizedHttpForAttachment|attachSanitized|attachTestFailureDiagnostics|attachReadableTextAttachment|attachReadableFailure)/.test(
        content,
      )
    ) {
      fail(
        `Attachment usage must go through sanitize/redact helpers (create under src/test/reporting/ or src/test/security/ when attachments are needed): ${rel(file)}`,
      );
    }
  }

  if (attachmentFiles.length === 0) {
    skip("No custom attachment usage found for sanitize helper checks.");
  } else {
    ok("Custom attachments reference sanitize/redact helpers.");
  }

  const committedStorageStateFiles = listFiles(ROOT, (file) =>
    /(?:storage-state|storageState)\.json$/i.test(file),
  ).filter((file) => !file.includes("node_modules"));

  if (committedStorageStateFiles.length > 0) {
    fail(
      `Committed storage state files are forbidden. Keep sessions in gitignored state/: ${committedStorageStateFiles
        .map(rel)
        .join(", ")}`,
    );
  }

  ok("No committed storage-state JSON files at repository root.");
}

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
  const reportingFixturePath = path.join(SRC_TEST_DIR, "fixtures", "reporting.fixture.ts");
  const apiFixturePath = path.join(SRC_TEST_DIR, "fixtures", "api.fixture.ts");
  const dataFixturePath = path.join(SRC_TEST_DIR, "fixtures", "data.fixture.ts");
  const pagesFixturePath = path.join(SRC_TEST_DIR, "fixtures", "pages.fixture.ts");
  const authFixturePath = path.join(SRC_TEST_DIR, "fixtures", "auth.fixture.ts");

  if (fs.existsSync(baseFixturePath)) {
    const baseFixtureContent = read(baseFixturePath);

    if (baseFixtureContent.includes("../pages/")) {
      fail(
        "base.fixture.ts must not import Page Objects. Move page wiring to pages.fixture.ts.",
      );
    }
  }

  if (fs.existsSync(reportingFixturePath)) {
    const reportingFixtureContent = read(reportingFixturePath);

    if (
      !reportingFixtureContent.includes('"./base.fixture"') &&
      !reportingFixtureContent.includes("'./base.fixture'")
    ) {
      fail("reporting.fixture.ts must import from ./base.fixture.ts");
    }

    if (reportingFixtureContent.includes("../pages/")) {
      fail("reporting.fixture.ts must not import Page Objects. Use pages.fixture.ts.");
    }
  }

  if (fs.existsSync(apiFixturePath)) {
    const apiFixtureContent = read(apiFixturePath);
    const expectedApiParent = fs.existsSync(reportingFixturePath)
      ? "./reporting.fixture"
      : "./base.fixture";

    if (
      !apiFixtureContent.includes(`"${expectedApiParent}"`) &&
      !apiFixtureContent.includes(`'${expectedApiParent}'`)
    ) {
      fail(`api.fixture.ts must import from ${expectedApiParent}.ts`);
    }

    if (apiFixtureContent.includes("../pages/")) {
      fail("api.fixture.ts must not import Page Objects. Use pages.fixture.ts.");
    }
  }

  if (fs.existsSync(dataFixturePath)) {
    const dataFixtureContent = read(dataFixturePath);

    if (
      !dataFixtureContent.includes('"./api.fixture"') &&
      !dataFixtureContent.includes("'./api.fixture'")
    ) {
      fail("data.fixture.ts must import from ./api.fixture.ts");
    }

    if (dataFixtureContent.includes("../pages/")) {
      fail("data.fixture.ts must not import Page Objects. Use pages.fixture.ts.");
    }
  }

  if (fs.existsSync(pagesFixturePath)) {
    const pagesFixtureContent = read(pagesFixturePath);

    if (fs.existsSync(dataFixturePath)) {
      if (
        !pagesFixtureContent.includes('"./data.fixture"') &&
        !pagesFixtureContent.includes("'./data.fixture'")
      ) {
        fail("pages.fixture.ts must import from ./data.fixture.ts when data.fixture.ts exists");
      }
    } else if (
      !pagesFixtureContent.includes('"./api.fixture"') &&
      !pagesFixtureContent.includes("'./api.fixture'")
    ) {
      fail("pages.fixture.ts must import from ./api.fixture.ts when data.fixture.ts is absent");
    }
  }

  if (fs.existsSync(authFixturePath)) {
    const authFixtureContent = read(authFixturePath);

    if (
      !authFixtureContent.includes('"./pages.fixture"') &&
      !authFixtureContent.includes("'./pages.fixture'")
    ) {
      fail("auth.fixture.ts must import from ./pages.fixture.ts");
    }

    if (!content.includes("./auth.fixture")) {
      fail(
        "auth.fixture.ts exists but test.ts does not re-export from ./auth.fixture — update src/test/fixtures/test.ts",
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

  checkFeaturePlanPlacement();
  checkSpecFeaturePlacement(uiSpecs, UI_TESTS_DIR, "ui");
  checkSpecFeaturePlacement(apiSpecs, API_TESTS_DIR, "api");
  checkSpecFeaturePlacement(e2eSpecs, E2E_TESTS_DIR, "e2e");
  checkUiSpecs(uiSpecs);
  checkApiSpecs(apiSpecs);
  checkE2eSpecs(e2eSpecs);
  checkHookPolicy([...uiSpecs, ...apiSpecs, ...e2eSpecs]);
  checkRegisteredTags([...uiSpecs, ...apiSpecs, ...e2eSpecs]);
  checkUiModelFiles(pageFiles, componentFiles);

  checkNoAllureInForbiddenLayers([
    ...pageFiles,
    ...componentFiles,
    ...dataFiles,
    ...apiClientFiles,
  ]);

  checkDeprecatedAllureImports([...uiSpecs, ...apiSpecs, ...e2eSpecs]);

  checkSecurityConventions(
    [...uiSpecs, ...apiSpecs, ...e2eSpecs],
    pageFiles,
    componentFiles,
    dataFiles,
    apiClientFiles,
  );

  console.log("\nConvention checks passed.\n");
}

main();