/**
 * The stop check — `npm run kit:test`. A temporary clone of this kit with the stop check as it is now; each case
 * changes the tree the way an agent's turn does and calls the hook as Claude Code would.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CHECK = path.join("scripts", "agent", "stop-check.mjs");
const git = (cwd, ...args) => {
  const result = spawnSync("git", ["-c", "user.name=kit-test", "-c", "user.email=kit-test@example.com", ...args], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
};

function clone(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-stop-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  git(dir, "clone", "--quiet", "--local", KIT, "kit");
  const kit = path.join(dir, "kit");
  fs.copyFileSync(path.join(KIT, CHECK), path.join(kit, CHECK));
  git(kit, "commit", "--quiet", "--allow-empty", "-am", "the stop check under test");
  return kit;
}

const write = (root, file, text) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
};
const stop = (kit, hook) => spawnSync(process.execPath, [CHECK, "--agent", "claude"], { cwd: kit, encoding: "utf8", input: JSON.stringify({ stop_hook_active: false, ...hook }) });
const lastLog = (kit) => fs.readFileSync(path.join(kit, "reports", "stop-check.log"), "utf8").trim().split("\n").at(-1);

// A plan the gate fails: a ready case and no `## Owners`.
const BAD_PLAN = ["# Cart — Cart", "", "## Test cases", "", "### 1. Adds an item", "- Level: UI — on this screen · Tag: @regression · Role: none · TMS: —", "- Route: no-request · screen list=value", "- Status: ready to implement now", ""].join("\n");

test("a gate failure in a file the agent changed sends it back with that file", (t) => {
  const kit = clone(t);
  write(kit, "specs/shop/cart/cart/cart.md", BAD_PLAN);
  const result = stop(kit, {});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /qa:gate fails in the files you changed/);
  assert.match(result.stderr, /specs\/shop\/cart\/cart\/cart\.md — no "## Owners"/);
});

test("a stop that asks the user goes through, and the check runs after the answer", (t) => {
  const kit = clone(t);
  write(kit, "specs/shop/cart/cart/cart.md", BAD_PLAN);
  const question = "Plan written.\n\n**Write these 6 now?**\n\n1. Yes, write them\n2. Let me adjust the plan first";
  const asked = stop(kit, { last_assistant_message: question });
  assert.equal(asked.status, 0, asked.stderr);
  assert.match(lastLog(kit), /let through — the agent asks the user/);
  const answered = stop(kit, { last_assistant_message: "Done — the plan is saved." });
  assert.equal(answered.status, 2);
});

test("a failure in a file the agent did not change is the tree's from before: named, not sent back", (t) => {
  const kit = clone(t);
  // Committed before the turn: a copy of agents/ edited by hand.
  write(kit, ".cursor/rules/ui.mdc", `${fs.readFileSync(path.join(kit, ".cursor/rules/ui.mdc"), "utf8")}\nedited by hand\n`);
  git(kit, "commit", "--quiet", "-am", "a copy edited by hand, before the turn");
  write(kit, "src/setup/platforms.ts", `${fs.readFileSync(path.join(kit, "src/setup/platforms.ts"), "utf8")}\n// the agent's change\n`);
  const result = stop(kit, {});
  assert.equal(result.status, 0, result.stderr);
  assert.match(lastLog(kit), /clean — \d+ changed file\(s\) checked \(1 gate failure\(s\) in files the agent did not change\)/);
});

test("a copy of agents/ the agent edited by hand is its own to undo", (t) => {
  const kit = clone(t);
  write(kit, ".cursor/rules/ui.mdc", `${fs.readFileSync(path.join(kit, ".cursor/rules/ui.mdc"), "utf8")}\nedited by hand\n`);
  const result = stop(kit, {});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /\.cursor\/rules\/ui\.mdc — differs from its source agents\/rules\/ui\.md/);
});
