/**
 * The CI the installer writes for a kit in a folder of the repository — `npm run kit:test`: the kit's GitHub and
 * GitLab templates rendered for `qa`, read as text (the paths CI reads from the repository's root, the folder every
 * script runs in) and for the repository's root (as they are).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { githubWorkflow, gitlabCi } from "../kit.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const github = fs.readFileSync(path.join(KIT, ".github", "workflows", "playwright.yml"), "utf8");
const gitlab = fs.readFileSync(path.join(KIT, "ci", "gitlab", "gitlab-ci.yml"), "utf8");
const lines = (text, pattern) => text.split("\n").filter((line) => pattern.test(line));

test("GitHub for a kit in qa/: every run there, the cache's lock, the paths it reads from the root, the baselines job", () => {
  const ci = githubWorkflow(github, "qa");
  assert.match(ci, /^defaults:\n {2}run:\n {4}working-directory: qa\n/m);
  const setups = lines(ci, /uses: actions\/setup-node/).length;
  assert.equal(lines(ci, /cache-dependency-path: qa\/package-lock\.json$/).length, setups);
  for (const line of lines(ci, /^\s+path: /)) assert.match(line, /path: (qa\/|\|)/, line);
  for (const line of lines(ci, /hashFiles\(/)) for (const [, file] of line.matchAll(/'([^']+)'/g)) assert.ok(file.startsWith("qa/"), line);
  assert.match(ci, /^\s+qa\/reports\/run-summary\.md$/m);
  assert.match(ci, /^\s+path: qa\/tests\/\*\*\/\*-linux\.png$/m);
  assert.match(ci, /^\s+workflow_dispatch:$/m);
  assert.match(ci, /^# The tests live in qa\/ — installed by the Playwright AI Workflow Kit\.$/m);
});

test("GitHub at the root: the template as it is, its note, the baselines job only by hand", () => {
  const ci = githubWorkflow(github, "");
  assert.doesNotMatch(ci, /working-directory/);
  assert.match(ci, /^# The tests live at the repository's root/m);
  assert.match(ci, /if: github\.event_name == 'workflow_dispatch'/);
  assert.match(ci, /if: needs\.baseline\.outputs\.has_tests == 'true' && github\.event_name != 'workflow_dispatch'/);
  assert.match(ci, /--update-snapshots=\$\{\{ inputs\.baselines \}\}/);
  assert.match(ci, /permissions:\n\s+contents: write/);
});

test("GitLab for a kit in qa/: cd before each job's scripts (the secret scan stays at the root), its paths under qa/", () => {
  const ci = gitlabCi(gitlab, "qa");
  const scriptOf = (job, key) => new RegExp(`^${job.replace(/[.:]/g, "\\$&")}:\\n(?:(?!^\\S).*\\n)*?\\s+${key}:\\n\\s+- (.+)$`, "m").exec(ci)?.[1];
  assert.equal(scriptOf("baseline", "script"), "cd qa");
  assert.equal(scriptOf(".playwright-job", "before_script"), "cd qa");
  assert.equal(scriptOf(".playwright-job", "after_script"), "cd qa");
  assert.equal(scriptOf("gitleaks", "script"), "gitleaks detect --source . --verbose --redact");
  assert.match(ci, /^\s+dotenv: qa\/has-tests\.env$/m);
  assert.match(ci, /^\s+- \.npm\/$/m);
  assert.match(ci, /^\s+- qa\/node_modules\/$/m);
  assert.match(ci, /^\s+- qa\/tests\/\*\*\/\*-linux\.png$/m);
  assert.match(ci, /^test:visual-baselines:\n\s+extends: \.playwright-job\n\s+when: manual/m);
});
