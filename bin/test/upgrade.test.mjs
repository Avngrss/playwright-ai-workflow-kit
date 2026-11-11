/**
 * `--update` end to end — `npm run kit:test`. A temporary copy of this kit is version A; a test home is installed
 * from it and changed the way a team changes one; the kit then moves to version B and the test home is updated
 * from it. Nothing reaches the network or npm (--no-install; the kit's git is local).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const run = (cwd, command, args) => spawnSync(command, args, { cwd, encoding: "utf8" });
const git = (cwd, ...args) => {
  const result = run(cwd, "git", ["-c", "user.name=kit-test", "-c", "user.email=kit-test@example.com", ...args]);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

/** A kit of its own: this checkout's files as they are now (the installer included), committed as version A. */
function kitCopy(dir) {
  const kit = path.join(dir, "kit");
  git(dir, "clone", "--quiet", "--local", KIT, kit);
  for (const file of run(KIT, "git", ["ls-files", "--cached", "--others", "--exclude-standard", "bin"]).stdout.split("\n").filter(Boolean)) {
    fs.mkdirSync(path.dirname(path.join(kit, file)), { recursive: true });
    fs.copyFileSync(path.join(KIT, file), path.join(kit, file));
  }
  git(kit, "add", "-A");
  git(kit, "commit", "--quiet", "--allow-empty", "-m", "version A");
  return kit;
}

const edit = (root, file, change) => {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, change(fs.existsSync(full) ? fs.readFileSync(full, "utf8") : ""));
};
const read = (root, file) => (fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), "utf8") : undefined);
const update = (kit, home, ...args) => run(path.dirname(home), process.execPath, [path.join(kit, "bin", "install.mjs"), "--update", home, "--no-install", ...args]);

test("--update: untouched kit files take B, yours stay with B beside them, the project's own are never replaced", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-upgrade-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const kit = kitCopy(dir);
  const home = path.join(dir, "project", "qa");
  fs.mkdirSync(path.dirname(home));
  const installed = run(path.dirname(home), process.execPath, [path.join(kit, "bin", "install.mjs"), "qa", "--agent", "claude", "--ci", "none", "--yes", "--no-install"]);
  assert.equal(installed.status, 0, installed.stderr || installed.stdout);
  const versionA = git(kit, "rev-parse", "HEAD");

  // The team's changes in its test home.
  edit(home, "docs/workflow.md", (text) => `${text}\nOur team's note.\n`);
  edit(home, "src/setup/platforms.ts", (text) => `${text}\n// our tweak\n`);
  edit(home, "tests/ui/shop/cart/cart.ui.spec.ts", () => "// our test\n");
  edit(home, "specs/project-map.md", (text) => `${text}\n| shop | shop-web | UI | \`UI_BASE_URL\` | — | ours |\n`);

  // Version B of the kit.
  edit(kit, "agents/rules/plans.md", (text) => `${text}\nA rule of version B.\n`);
  edit(kit, "docs/workflow.md", (text) => `${text}\nA doc line of version B.\n`);
  edit(kit, "scripts/agent/new-tool.mjs", () => "// new in version B\n");
  fs.rmSync(path.join(kit, "docs", "security-data-handling.md"));
  edit(kit, "specs/project-map.md", (text) => `${text}\n<!-- a map field of version B -->\n`);
  edit(kit, ".gitignore", (text) => `${text}\nversion-b-cache/\n`);
  edit(kit, "package.json", (text) => {
    const pkg = JSON.parse(text);
    pkg.scripts["b:tool"] = "node scripts/agent/new-tool.mjs";
    return `${JSON.stringify(pkg, null, 2)}\n`;
  });
  git(kit, "add", "-A");
  git(kit, "commit", "--quiet", "-m", "version B");
  const versionB = git(kit, "rev-parse", "HEAD");

  const before = fs.readFileSync(path.join(home, "docs", "workflow.md"), "utf8");
  const dry = update(kit, home, "--dry-run");
  assert.equal(dry.status, 0, dry.stderr || dry.stdout);
  assert.match(dry.stdout, /1 replaced · 1 added · 1 removed · 1 beside yours \(\.kit-new\) · 1 yours kept/);
  assert.equal(read(home, "docs/workflow.md"), before, "--dry-run changes nothing");
  assert.ok(!read(home, "scripts/agent/new-tool.mjs"));

  const updated = update(kit, home, "--yes");
  assert.equal(updated.status, 0, updated.stderr || updated.stdout);
  // The kit's, untouched by the team: version B.
  assert.match(read(home, "agents/rules/plans.md"), /A rule of version B\./);
  assert.match(read(home, ".claude/rules/plans.md"), /A rule of version B\./, "the agent's copy written again");
  assert.equal(read(home, "scripts/agent/new-tool.mjs"), "// new in version B\n");
  assert.ok(!read(home, "docs/security-data-handling.md"));
  // Changed by both: the team's stays, B beside it.
  assert.match(read(home, "docs/workflow.md"), /Our team's note\./);
  assert.doesNotMatch(read(home, "docs/workflow.md"), /version B/);
  assert.match(read(home, "docs/workflow.md.kit-new"), /A doc line of version B\./);
  // Changed by the team only: kept, nothing beside it.
  assert.match(read(home, "src/setup/platforms.ts"), /our tweak/);
  assert.ok(!read(home, "src/setup/platforms.ts.kit-new"));
  // The project's own: never replaced; a changed template's new version beside it.
  assert.equal(read(home, "tests/ui/shop/cart/cart.ui.spec.ts"), "// our test\n");
  assert.match(read(home, "specs/project-map.md"), /\| ours \|/);
  assert.doesNotMatch(read(home, "specs/project-map.md"), /version B/);
  assert.match(read(home, "specs/project-map.md.kit-new"), /a map field of version B/);
  // package.json and .gitignore merged; the record moves to B.
  const pkg = JSON.parse(read(home, "package.json"));
  assert.equal(pkg.scripts["b:tool"], "node scripts/agent/new-tool.mjs");
  assert.equal(pkg.scripts["kit:test"], undefined);
  assert.equal(pkg.playwrightAiKit.commit, versionB);
  assert.notEqual(versionA, versionB);
  assert.match(read(home, ".gitignore"), /^version-b-cache\/$/m);

  const again = update(kit, home, "--yes");
  assert.equal(again.status, 0, again.stderr || again.stdout);
  assert.match(again.stdout, /nothing to update/);
});

test("--update of a test home that recorded its version only finds the commit it came from by its files", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-upgrade-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const kit = kitCopy(dir);
  // The kit moves on before this test home is installed: the version's tag would not be its commit.
  edit(kit, "docs/getting-started.md", (text) => `${text}\nBetween two versions.\n`);
  git(kit, "commit", "--quiet", "-am", "between the tags");
  const home = path.join(dir, "home");
  const installed = run(dir, process.execPath, [path.join(kit, "bin", "install.mjs"), "home", "--agent", "cursor", "--ci", "none", "--yes", "--no-install"]);
  assert.equal(installed.status, 0, installed.stderr || installed.stdout);
  edit(home, "package.json", (text) => `${JSON.stringify({ ...JSON.parse(text), playwrightAiKit: "1.3.0" }, null, 2)}\n`);
  edit(home, "docs/workflow.md", (text) => `${text}\nOur note.\n`);
  edit(kit, "docs/getting-started.md", (text) => `${text}\nVersion B.\n`);
  git(kit, "commit", "--quiet", "-am", "version B");

  const updated = update(kit, home, "--yes");
  assert.equal(updated.status, 0, updated.stderr || updated.stdout);
  // getting-started replaced (with the tag as its base it would read as changed here, and stay); workflow is ours.
  assert.match(updated.stdout, /1 replaced · 0 added · 0 removed · 0 beside yours \(\.kit-new\) · 1 yours kept/);
  assert.match(updated.stdout, /docs\/workflow\.md — yours is changed; the kit did not change it/);
  assert.match(read(home, "docs/getting-started.md"), /Version B\./);
  assert.match(read(home, "docs/workflow.md"), /Our note\./);
  assert.equal(JSON.parse(read(home, "package.json")).playwrightAiKit.commit, git(kit, "rev-parse", "HEAD"));
});

test("--update in a folder the kit did not install stops before a change", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-upgrade-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), '{ "name": "not-a-kit" }\n');
  const result = run(dir, process.execPath, [path.join(KIT, "bin", "install.mjs"), "--update", "--yes", "--no-install"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /is not a test home the kit installed/);
  assert.equal(fs.readFileSync(path.join(dir, "package.json"), "utf8"), '{ "name": "not-a-kit" }\n');
});
