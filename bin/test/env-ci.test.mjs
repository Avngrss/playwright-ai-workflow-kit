/**
 * `npm run env:prepare` keeps GitHub's CI in step with the map — `npm run kit:test`: a repository with the test home
 * in qa/ and the kit's workflow at the root; a map name the call touches joins the workflow's top-level env:
 * (an address as vars, a login as secrets), a name the map lacks does not, and --drop takes one out.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PREPARE = path.join(KIT, "scripts", "agent", "prepare-env.mjs");
const WORKFLOW = path.join(".github", "workflows", "playwright.yml");
const AUTH = ["```auth", "platform: shop", "login url: ${SHOP_UI_URL}/login", "login: ${SHOP_LOGIN}", "password: ${SHOP_PASSWORD}", "```"];

function repository(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kit-env-ci-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  spawnSync("git", ["init", "--quiet"], { cwd: root });
  fs.writeFileSync(path.join(root, ".gitignore"), ".env\nstate/\n");
  fs.mkdirSync(path.join(root, ".github", "workflows"), { recursive: true });
  fs.copyFileSync(path.join(KIT, WORKFLOW), path.join(root, WORKFLOW));
  const qa = path.join(root, "qa");
  fs.mkdirSync(path.join(qa, "specs"), { recursive: true });
  fs.copyFileSync(path.join(KIT, ".env.example"), path.join(qa, ".env.example"));
  const map = fs.readFileSync(path.join(KIT, "specs", "project-map.md"), "utf8").replace(/\r\n/g, "\n");
  const row = "| shop | shop-ui | UI | `SHOP_UI_URL` | — | |";
  fs.writeFileSync(path.join(qa, "specs", "project-map.md"), `${map.replace(/^(\| default \| default-api .*)$/m, `$1\n${row}`)}\n${AUTH.join("\n")}\n`);
  return { root, qa };
}

const prepare = (qa, ...args) => {
  const result = spawnSync(process.execPath, [PREPARE, ...args], { cwd: qa, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
};
const envBlock = (root) => /^env:\n([\s\S]*?)\n(?=\S)/m.exec(fs.readFileSync(path.join(root, WORKFLOW), "utf8").replace(/\r\n/g, "\n"))[1];

test("a map name joins the root workflow's env: — an address as vars, a login as secrets; once", (t) => {
  const { root, qa } = repository(t);
  const said = [prepare(qa, "SHOP_UI_URL=https://shop.example.test"), prepare(qa, "--note", "Test account", "SHOP_LOGIN", "SHOP_PASSWORD")].join("\n");
  const env = envBlock(root);
  assert.match(env, /^ {2}SHOP_UI_URL: \$\{\{ vars\.SHOP_UI_URL \|\| '' \}\}$/m);
  assert.match(env, /^ {2}SHOP_LOGIN: \$\{\{ secrets\.SHOP_LOGIN \|\| '' \}\}$/m);
  assert.match(env, /^ {2}SHOP_PASSWORD: \$\{\{ secrets\.SHOP_PASSWORD \|\| '' \}\}$/m);
  assert.match(said, /SHOP_LOGIN, SHOP_PASSWORD added to \.\.\/\.github\/workflows\/playwright\.yml env: .*\(secrets SHOP_LOGIN, SHOP_PASSWORD\)/);
  assert.doesNotMatch(prepare(qa, "SHOP_LOGIN"), /added to/, "a name the workflow lists is not added again");
  assert.equal(envBlock(root).match(/SHOP_LOGIN:/g).length, 1);
});

test("a name the map lacks stays out of CI; --drop takes a name out of the workflow too", (t) => {
  const { root, qa } = repository(t);
  prepare(qa, "LOCAL_ONLY=1", "SHOP_UI_URL=https://shop.example.test");
  assert.doesNotMatch(envBlock(root), /LOCAL_ONLY/);
  const map = path.join(qa, "specs", "project-map.md");
  fs.writeFileSync(map, fs.readFileSync(map, "utf8").replace(/^\| shop \| .*\n/m, "").replace("login url: ${SHOP_UI_URL}/login\n", ""));
  assert.match(prepare(qa, "--drop", "SHOP_UI_URL"), /SHOP_UI_URL removed from .*env:/);
  assert.doesNotMatch(envBlock(root), /SHOP_UI_URL/);
});
