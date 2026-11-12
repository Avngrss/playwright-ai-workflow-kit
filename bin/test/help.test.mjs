/**
 * `npm run help` — the list the agent reads instead of a table in an always-on rule: it names every npm script of
 * the test home and no script that is gone.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { namesOf, SCRIPTS } from "../../scripts/agent/help.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
// The kit's own development and npm's hook — never typed in a test home.
const NOT_LISTED = new Set(["kit:test", "postinstall"]);

test("npm run help lists every script of package.json, and only those", () => {
  const scripts = Object.keys(JSON.parse(fs.readFileSync(path.join(KIT, "package.json"), "utf8")).scripts).filter((name) => !NOT_LISTED.has(name));
  const listed = SCRIPTS.flatMap(([, entries]) => entries.flatMap(([names]) => namesOf(names)));
  assert.deepEqual(scripts.filter((name) => !listed.includes(name)), [], "scripts help does not list");
  assert.deepEqual([...new Set(listed)].filter((name) => !scripts.includes(name)), [], "help lists scripts package.json lacks");
});
