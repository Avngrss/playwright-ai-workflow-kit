/**
 * The installer and whose each file is — `npm run kit:test`. Each install runs the real installer from this
 * checkout into a fresh temporary folder (--yes --no-install), so nothing reaches the network or npm.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ownerOf } from "../ownership.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const INSTALLER = path.join(KIT, "bin", "install.mjs");
const tracked = spawnSync("git", ["ls-files"], { cwd: KIT, encoding: "utf8" }).stdout.split("\n").filter(Boolean);
const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: KIT, encoding: "utf8" }).stdout.trim();

function tempFolder(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const install = (cwd, ...args) => spawnSync(process.execPath, [INSTALLER, ...args, "--yes", "--no-install"], { cwd, encoding: "utf8" });
const filesIn = (dir, from = dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(full, from) : [path.relative(from, full).split(path.sep).join("/")];
  });

test("whose a file is: the kit's own, an agent's copy, the project's, or the kit's to update", () => {
  for (const file of ["bin/install.mjs", "bin/test/install.test.mjs", "LICENSE", ".github/workflows/playwright.yml", "ci/gitlab/gitlab-ci.yml"]) assert.equal(ownerOf(file), "none", file);
  for (const file of [".cursor/rules/plans.mdc", ".cursor/commands/plan.md", ".claude/skills/plan/SKILL.md", ".claude/agents/reviewer.md", ".mcp.json", ".claude/settings.json", ".cursor/hooks.json"]) {
    assert.equal(ownerOf(file), "copy", file);
  }
  for (const file of ["specs/project-map.md", "specs/known-bugs.md", ".env.example", "agents/agents.json", "package.json", ".gitignore"]) assert.equal(ownerOf(file), "project", file);
  for (const file of ["agents/rules/plans.md", "agents/permissions.json", "scripts/gate/check.mjs", "src/setup/platforms.ts", "tests/smoke/sign-in.smoke.spec.ts", "playwright.config.ts", "docs/workflow.md"]) {
    assert.equal(ownerOf(file), "kit", file);
  }
});

test("every file the kit tracks has an owner, and the kit's own stay out of a project", (t) => {
  const dir = tempFolder(t);
  const result = install(dir, ".", "--agent", "claude", "--ci", "none");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const installed = new Set(filesIn(dir));
  for (const file of tracked) {
    const owner = ownerOf(file);
    assert.ok(["none", "copy", "project", "kit"].includes(owner), file);
    if (owner === "none") assert.ok(!installed.has(file), `${file} is the kit's own, not a project's`);
  }
});

test("an install records the kit it came from and keeps only the chosen agent's copies", (t) => {
  const dir = tempFolder(t);
  const result = install(dir, "qa", "--agent", "claude", "--ci", "none");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "qa", "package.json"), "utf8"));
  assert.deepEqual(pkg.playwrightAiKit, { version: JSON.parse(fs.readFileSync(path.join(KIT, "package.json"), "utf8")).version, commit: head });
  assert.equal(pkg.scripts["kit:test"], undefined);
  for (const key of ["bin", "files", "repository"]) assert.equal(pkg[key], undefined, key);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, "qa", "agents", "agents.json"), "utf8")).agents, ["claude"]);
  assert.ok(fs.existsSync(path.join(dir, "qa", ".claude", "skills", "plan", "SKILL.md")));
  assert.ok(!fs.existsSync(path.join(dir, "qa", ".cursor")));
});

test("a folder of the project's own stops the install before a file is written", (t) => {
  const dir = tempFolder(t);
  fs.mkdirSync(path.join(dir, "src"));
  fs.writeFileSync(path.join(dir, "src", "app.py"), "print('mine')\n");
  const result = install(dir, ".", "--agent", "cursor", "--ci", "none");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /already has what the kit would write \(.*src\//);
  assert.deepEqual(filesIn(dir), ["src/app.py"]);
});
