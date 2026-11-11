/**
 * The update's plan and its application — `npm run kit:test`. Each case: the kit's file as installed, as the kit has
 * it now, and as the test home has it; then what the update does, and what it leaves on disk.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { applyUpdate, NEW_SUFFIX, planUpdate, sameContent } from "../update.mjs";

// One file each case; a kit file (ownerOf "kit") unless the case is about another owner.
const RULE = "agents/rules/plans.md";
const planOf = (old, next, mine, file = RULE) =>
  planUpdate({ old: old === undefined ? {} : { [file]: old }, next: next === undefined ? {} : { [file]: next }, project: (asked) => (asked === file ? mine : undefined) });

test("a file the test home never changed takes the kit's new version", () => {
  assert.deepEqual(planOf("v1", "v2", "v1"), [{ file: RULE, action: "replace" }]);
});

test("a file the test home changed and the kit did not is kept", () => {
  assert.deepEqual(planOf("v1", "v1", "mine"), [{ file: RULE, action: "kept", why: "yours is changed; the kit did not change it" }]);
});

test("a file both changed is a conflict; changed alike, it is nothing", () => {
  assert.deepEqual(planOf("v1", "v2", "mine"), [{ file: RULE, action: "conflict", why: "both changed it" }]);
  assert.deepEqual(planOf("v1", "v2", "v2"), []);
});

test("a new kit file is added; one the test home has already is a conflict", () => {
  assert.deepEqual(planOf(undefined, "new", undefined), [{ file: RULE, action: "add" }]);
  assert.deepEqual(planOf(undefined, "new", "mine"), [{ file: RULE, action: "conflict", why: "the kit adds a file the test home has already" }]);
});

test("a file the kit dropped goes when unchanged, stays when changed", () => {
  assert.deepEqual(planOf("v1", undefined, "v1"), [{ file: RULE, action: "remove" }]);
  assert.deepEqual(planOf("v1", undefined, "mine"), [{ file: RULE, action: "kept", why: "the kit dropped it; yours is changed" }]);
});

test("a file the test home removed stays removed, unless the kit changed it", () => {
  assert.deepEqual(planOf("v1", "v1", undefined), []);
  assert.deepEqual(planOf("v1", "v2", undefined), [{ file: RULE, action: "conflict", why: "you removed it; the kit changed it" }]);
});

test("line ends do not make a file changed; bytes do for a binary", () => {
  assert.ok(sameContent("a\r\nb\r\n", "a\nb\n"));
  assert.deepEqual(planOf("a\nb\n", "a\nc\n", "a\r\nb\r\n"), [{ file: RULE, action: "replace" }]);
  assert.ok(!sameContent(Buffer.from([0, 13, 10]), Buffer.from([0, 10])));
});

test("a project's file, an agent's copy and the kit's own are never in the plan", () => {
  for (const file of ["specs/project-map.md", "package.json", "agents/agents.json", ".claude/rules/plans.md", ".mcp.json", "bin/install.mjs"]) {
    assert.deepEqual(planOf("v1", "v2", "v1", file), [], file);
  }
});

test("the plan carried out: replaced, added, removed with its empty folder, conflict beside the file, yours untouched", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kit-update-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  };
  const read = (file) => (fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), "utf8") : undefined);
  const old = { "scripts/a.mjs": "a1", "scripts/gone/b.mjs": "b1", "docs/c.md": "c1", "src/setup/d.ts": "d1" };
  const next = { "scripts/a.mjs": "a2", "docs/c.md": "c2", "src/setup/d.ts": "d1", "scripts/new.mjs": "n1" };
  put("scripts/a.mjs", "a1");
  put("scripts/gone/b.mjs", "b1");
  put("docs/c.md", "mine");
  put("src/setup/d.ts", "mine too");
  put("tests/ui/app/x.ui.spec.ts", "my test");
  const plan = applyUpdate(planUpdate({ old, next, project: read }), { root, next });
  assert.deepEqual(
    plan.map(({ file, action }) => `${action} ${file}`),
    ["conflict docs/c.md", "replace scripts/a.mjs", "remove scripts/gone/b.mjs", "add scripts/new.mjs", "kept src/setup/d.ts"],
  );
  assert.equal(read("scripts/a.mjs"), "a2");
  assert.equal(read("scripts/new.mjs"), "n1");
  assert.ok(!fs.existsSync(path.join(root, "scripts", "gone")));
  assert.equal(read("docs/c.md"), "mine");
  assert.equal(read(`docs/c.md${NEW_SUFFIX}`), "c2");
  assert.equal(read("src/setup/d.ts"), "mine too");
  assert.equal(read("tests/ui/app/x.ui.spec.ts"), "my test");
});
