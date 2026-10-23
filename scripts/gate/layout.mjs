import fs from "node:fs";
import path from "node:path";
import { appOfPath, at, listFiles, PER_APP_KINDS, read, registeredPlatforms, SPECS_OWN_FILES } from "./context.mjs";

/**
 * Where things live — the folder scheme, mirrored between specs/ and tests/:
 *
 *   specs/<platform>/<area>/<feature>/<feature>.md          feature plan (API + UI rows)
 *   specs/e2e/<platform>/<area>/<journey>.md                E2E journey plan
 *   tests/api/<platform>/<area>/<feature>/<feature>.api.spec.ts
 *   tests/ui/<platform>/<area>/<feature>/<feature>.ui.spec.ts
 *   tests/e2e/<platform>/<area>/<journey>.e2e.spec.ts
 *   tests/smoke/sign-in.smoke.spec.ts                       the template's "is the stand alive?" — the only smoke file
 *
 * <platform> = product/app (crm, order-desk), <area> = a product area grouping features (account),
 * <feature> = one feature/tab/section of it (addresses). E2E has no <feature> level: a journey
 * crosses several features of one area by definition.
 */

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GENERIC_NAMES = new Set(["misc", "common", "shared", "all", "other", "temp", "helpers", "tests"]);
const SIGN_IN_SMOKE = "sign-in.smoke.spec.ts";

function checkSegments(report, file, segments) {
  for (const segment of segments) {
    if (!KEBAB.test(segment)) report.fail(file, `folder '${segment}' must be kebab-case`);
    if (GENERIC_NAMES.has(segment)) report.fail(file, `generic folder name '${segment}' — name the product area or feature`);
  }
}

/** The file is named after its folder: `<feature>.md`, or `<feature>-<more>.md`. */
function namedAfter(stem, folder) {
  return stem === folder || stem.startsWith(`${folder}-`);
}

function checkPlans(files, report) {
  const specsDir = at("specs");
  if (!fs.existsSync(specsDir)) return;

  for (const entry of fs.readdirSync(specsDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md") && !SPECS_OWN_FILES.has(entry.name)) {
      report.fail(path.join(specsDir, entry.name), "a feature plan lives at specs/<platform>/<area>/<feature>/<feature>.md, not flat in specs/");
    }
    if (!entry.isDirectory()) continue;

    const e2e = entry.name === "e2e";
    const plans = listFiles(path.join(specsDir, entry.name), (file) => file.endsWith(".md"));
    if (!e2e && plans.length === 0) report.fail(null, `specs/${entry.name}/ holds no plan — remove the empty platform folder`);

    for (const plan of plans) {
      const parts = path.relative(e2e ? path.join(specsDir, "e2e") : specsDir, plan).split(path.sep);
      const shape = e2e ? "specs/e2e/<platform>/<area>/<journey>.md" : "specs/<platform>/<area>/<feature>/<feature>.md";
      if (parts.length !== (e2e ? 3 : 4)) {
        report.fail(plan, `a plan lives at ${shape} (exactly that depth)`);
        continue;
      }
      checkSegments(report, plan, parts.slice(0, -1));
      const folder = parts[parts.length - 2];
      if (!e2e && !namedAfter(parts[parts.length - 1].slice(0, -3), folder)) {
        report.fail(plan, `the plan is named after its feature folder: ${folder}.md or ${folder}-<more>.md`);
      }
    }
  }
}

function checkSpecPlacement(files, report) {
  for (const layer of ["api", "ui", "e2e"]) {
    const suffix = `.${layer}.spec.ts`;
    const e2e = layer === "e2e";
    const shape = e2e ? `tests/e2e/<platform>/<area>/<journey>${suffix}` : `tests/${layer}/<platform>/<area>/<feature>/<feature>${suffix}`;

    for (const spec of files[layer]) {
      const parts = path.relative(at("tests", layer), spec).split(path.sep);
      if (parts.length !== (e2e ? 3 : 4)) {
        report.fail(spec, `a ${layer.toUpperCase()} spec lives at ${shape} (exactly that depth)`);
        continue;
      }
      const fileName = parts[parts.length - 1];
      checkSegments(report, spec, parts.slice(0, -1));
      if (!fileName.endsWith(suffix)) report.fail(spec, `the file name ends with ${suffix}`);
      const folder = parts[parts.length - 2];
      if (!e2e && !namedAfter(fileName.slice(0, -suffix.length), folder)) {
        report.fail(spec, `the spec is named after its feature folder: ${folder}${suffix} or ${folder}-<more>${suffix}`);
      }
    }
  }

  for (const spec of files.smoke) {
    const parts = path.relative(at("tests", "smoke"), spec).split(path.sep);
    if (parts.length === 1 && parts[0] === SIGN_IN_SMOKE) continue; // the template's, app-wide
    // Smoke is the sign-in check; a feature joins it with one test of its own tagged @smoke (§Smoke).
    report.fail(spec, "smoke has no files of its own besides the template's sign-in check — a feature joins smoke with one of its own API or UI tests tagged @smoke (specs/project-map.md §Smoke)");
  }
}

// One home per kind of support code (.cursor/rules/code.mdc "The same thing twice"): a <platform>
// (or shared) folder where the kind is product-specific, the kind in the file name.
const SOURCE_LAYOUT = [
  /^api\/clients\/[a-z0-9-]+\/[a-z0-9-]+\.client\.ts$/,
  /^pages\/[a-z0-9-]+\/[a-z0-9-]+\.page\.ts$/,
  /^components\/[a-z0-9-]+\/[a-z0-9-]+\.component\.ts$/,
  /^data\/(builders|generators|datasets)\/[a-z0-9-]+\/[a-z0-9-]+\.(builder|generator|dataset)\.ts$/,
  /^data\/sweeps\.ts$/,
  /^assertions\/[a-z0-9-]+\/[a-z0-9-]+\.ts$/,
  /^setup\/([a-z0-9-]+\/)?[a-z0-9.-]+\.ts$/,
  /^fixtures\/([a-z0-9-]+\.fixture|test)\.ts$/,
  /^fixtures\/[a-z0-9-]+\/([a-z0-9-]+\.fixture|test)\.ts$/,
  /^(reporting|logging|security)\/[a-z0-9.-]+\.ts$/,
  // The report's categories, plain JavaScript for allurerc.mjs to import.
  /^reporting\/[a-z0-9.-]+\.mjs$/,
];

function checkSourceLayout(files, report) {
  for (const file of listFiles(at("src"))) {
    const relative = path.relative(at("src"), file).split(path.sep).join("/");
    if (!SOURCE_LAYOUT.some((pattern) => pattern.test(relative))) {
      report.fail(
        file,
        "outside the support-code layout — api/clients/<platform>/*.client.ts, pages/<platform>/*.page.ts, " +
          "components/<platform>/*.component.ts, data/builders|generators|datasets/<platform>/ (generators and datasets no app owns: shared/), data/sweeps.ts, " +
          "assertions/<shared|platform>/, setup/, fixtures/*.fixture.ts, fixtures/<platform>/*.fixture.ts; no utils/, helpers/ or other folders (.cursor/rules/code.mdc)",
      );
    }
  }
}

function checkSessionFiles(files, report) {
  // listFiles skips state/ — the one place sessions are kept (gitignored).
  for (const file of listFiles(at(), (name) => /(?:storage-state|storageState)\.json$/i.test(name))) {
    report.fail(file, "a saved browser session outside state/ — sessions are kept only in the gitignored state/ folder");
  }
}

function checkPlatformFolders(files, report) {
  // Each app runs in its own Playwright projects, built from the map: a folder naming an app the map
  // does not list belongs to no project, and its tests would silently never run.
  const apps = registeredPlatforms();
  if (apps.length === 0) return;
  const appOf = (file, root) => path.relative(root, file).split(path.sep)[0];
  const placed = [
    ...["api", "ui", "e2e"].flatMap((layer) => files[layer].map((spec) => [spec, appOf(spec, at("tests", layer))])),
    ...listFiles(at("specs"), (file) => file.endsWith(".md") && !SPECS_OWN_FILES.has(path.basename(file))).map((plan) => [plan, appOf(plan, at("specs")) === "e2e" ? appOf(plan, at("specs", "e2e")) : appOf(plan, at("specs"))]),
  ];
  for (const [file, app] of placed) {
    if (!apps.includes(app)) report.fail(file, `app folder '${app}' is not in specs/project-map.md §Apps and services (apps: ${apps.join(", ")}) — its tests would run in no project`);
  }
  // Page Objects, clients, builders and an app's own setup open that app's pages and call its API:
  // they live under it. Only components (locators inside a root — a design system several apps
  // share), assertions/shared/ and values no app owns (data/generators|datasets/shared/) may sit in a
  // folder of their own.
  for (const file of listFiles(at("src"), (name) => name.endsWith(".ts"))) {
    const parts = path.relative(at("src"), file).split(path.sep);
    const kind = PER_APP_KINDS.filter(([first]) => first !== "assertions" && first !== "components").find((segments) => segments.every((segment, index) => parts[index] === segment));
    if (!kind || parts.length <= kind.length + 1) continue;
    const folder = parts[kind.length];
    if (kind[0] === "setup" && folder === "auth") continue;
    if (folder === "shared" && (kind[1] === "generators" || kind[1] === "datasets")) continue;
    if (!apps.includes(folder)) {
      report.fail(file, `folder '${folder}' is not an app of specs/project-map.md §Apps and services (apps: ${apps.join(", ")}) — ${kind.join("/")} live under their app (src/${kind.join("/")}/<app>/); only components several apps share get a folder of their own (src/components/<library>/), and values no app owns go to data/generators/shared/ or data/datasets/shared/`);
    }
  }
  // Every app has its own fixtures from the start, so its specs import the same `test` forever.
  for (const app of apps.filter((slug) => !fs.existsSync(at("src", "fixtures", slug, "test.ts")))) {
    report.fail(at("specs", "project-map.md"), `app '${app}' has no fixtures of its own — npm run app:add -- ${app} creates src/fixtures/${app}/ (its specs import test from there)`);
  }
}

/** What a file imports: each local name with the file or folder it comes from (packages left out). */
function importsOf(file) {
  const found = [];
  for (const match of read(file).matchAll(/import\s+(?:type\s+)?([\w\s{},*]*?)\s*from\s*["']([^"']+)["']/g)) {
    const [, names, spec] = match;
    const target = spec.startsWith("src/") ? at(...spec.split("/")) : spec.startsWith(".") ? path.resolve(path.dirname(file), spec) : undefined;
    if (!target) continue;
    const locals = names.replace(/[{}]/g, ",").split(",").map((name) => name.trim().split(/\s+as\s+/).pop().replace(/^type\s+/, "").trim()).filter((name) => /^\w+$/.test(name));
    found.push({ spec, target, locals });
  }
  return found;
}

const SHARED_TEST = at("src", "fixtures", "test");

function checkAppBoundaries(files, report) {
  // From the first app on, everything of an app stays with it: a test of app X runs on X's address
  // with X's session, so another app's Page Object, client or fixture would open X's pages with the
  // other app's paths. Its specs take `test` from X's own fixtures — the ones only X's tests see.
  const apps = registeredPlatforms();
  if (apps.length === 0) return;
  const appCode = [...files.specs, ...listFiles(at("src"), (file) => file.endsWith(".ts"))].map((file) => [file, appOfPath(file, apps)]).filter(([, app]) => app);
  for (const [file, app] of appCode) {
    for (const { spec, target } of importsOf(file)) {
      const other = appOfPath(target, apps);
      if (other && other !== app) {
        report.fail(file, `code of app '${app}' imports "${spec}" — code of app '${other}'. A test, Page Object or client of one app uses only its own app's code (src/<kind>/${app}/…) and the shared folders`);
      }
      if (file.endsWith(".spec.ts") && target === SHARED_TEST) {
        report.fail(file, `a test of '${app}' takes test from the shared chain — import { test, expect } from "src/fixtures/${app}/test" (its app's fixtures; npm run app:add -- ${app} creates them)`);
      }
    }
  }
  // The shared chain is the same for every app: product code in it would reach every app's tests.
  // Other shared code (a design-system component, assertions/shared/, data/…/shared/) serves every
  // app the same way, so it depends on none.
  for (const file of listFiles(at("src"), (name) => name.endsWith(".ts")).filter((name) => !appOfPath(name, apps))) {
    const chain = path.dirname(file) === at("src", "fixtures");
    for (const { spec, target } of importsOf(file)) {
      const owner = appOfPath(target, apps);
      if (owner && chain) report.fail(file, `the shared fixture chain imports "${spec}" — code of app '${owner}'. An app's fixtures go to src/fixtures/${owner}/ (data.fixture.ts, pages.fixture.ts), never edited into the shared chain`);
      else if (owner) report.fail(file, `shared code imports "${spec}" — code of app '${owner}'. Shared code serves every app and depends on none: what it needs moves to a shared home too, or the file moves under ${owner}`);
    }
  }
}

export const layoutRules = [checkPlans, checkSpecPlacement, checkPlatformFolders, checkAppBoundaries, checkSourceLayout, checkSessionFiles];
