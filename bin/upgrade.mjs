/**
 * The kit's update of a test home it installed — `npx github:Avngrss/playwright-ai-workflow-kit --update [<folder>]`,
 * run in the test home or naming it. The kit's files the test home never changed take the kit's new version; those
 * it changed stay, the new one beside them as <file>.kit-new; its own files are never replaced (bin/update.mjs,
 * bin/ownership.mjs). package.json takes the kit's new scripts and packages where the test home kept the kit's,
 * .gitignore the kit's new lines, a template the test home filled in (the map, .env.example) its new version beside
 * it, the CI the installer wrote its new version the same way as a kit file. Then the agents' copies are written
 * again (npm run agents:sync), npm install runs and the gate says how the test home stands. --dry-run shows the plan.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ciFiles, git, installedCi, kitSource, missingIgnoreLines, npm, REPO, say, stop, VERSION } from "./kit.mjs";
import { ownerOf, PROJECT_FILES } from "./ownership.mjs";
import { applyUpdate, NEW_SUFFIX, planUpdate, sameContent } from "./update.mjs";

// The package.json sections the kit owns entry by entry; its own test script never goes into a test home.
const PACKAGE_SECTIONS = ["scripts", "devDependencies", "dependencies", "overrides"];
const KIT_ONLY_SCRIPTS = new Set(["kit:test"]);
// The templates a test home fills in: a new version of the kit's goes beside them, never over them.
const TEMPLATES = [...PROJECT_FILES].filter((file) => !["package.json", ".gitignore", "agents/agents.json", "README.md", ".gitattributes"].includes(file));

const readIn = (root, file) => (fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file)) : undefined);
const text = (content) => (content === undefined ? undefined : Buffer.from(content).toString("utf8"));

/** The kit's files at a commit of its git in `root`: { file: content }. */
function treeAt(root, commit) {
  const listed = git(["ls-tree", "-r", "--name-only", commit], root);
  if (listed.status !== 0) return undefined;
  const tree = {};
  for (const file of listed.stdout.split("\n").filter(Boolean)) tree[file] = spawnSync("git", ["show", `${commit}:${file}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 }).stdout;
  return tree;
}

/** A file's git blob id from its content, line ends as the kit's git keeps them (LF) — a binary as it is. */
function blobId(content) {
  let bytes = Buffer.from(content);
  if (!bytes.includes(0)) bytes = Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"));
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

/**
 * The commit the test home came from, made present in `root`'s git. The one recorded; for a test home that recorded
 * only its version (installed before the kit kept its commit), the kit's commit up to `tip` whose files the test
 * home has most of as they were — its version's tag would miss a test home installed between two tags.
 */
function installedCommit(root, record, tip, project) {
  const commit = typeof record === "object" ? record.commit : undefined;
  if (commit) {
    if (git(["cat-file", "-e", `${commit}^{commit}`], root).status === 0) return commit;
    if (git(["fetch", "--quiet", "--depth", "1", REPO, commit], root).status === 0) return commit;
    return undefined;
  }
  say("The test home recorded its version only: finding the kit's commit it came from, by its files …");
  // A shallow fetch (npx) holds the tip alone: the history before it, to search.
  if (git(["rev-parse", "--is-shallow-repository"], root).stdout?.trim() === "true") git(["fetch", "--quiet", "--depth", "300", REPO, tip], root);
  const ids = new Map();
  let best;
  for (const candidate of git(["rev-list", "--max-count=300", tip], root).stdout.split("\n").filter(Boolean)) {
    let same = 0;
    for (const line of git(["ls-tree", "-r", candidate], root).stdout.split("\n")) {
      const [, blob, file] = /^\d+ blob ([0-9a-f]{40})\t(.+)$/.exec(line) ?? [];
      if (!file || ownerOf(file) !== "kit") continue;
      if (!ids.has(file)) {
        const content = project(file);
        ids.set(file, content === undefined ? undefined : blobId(content));
      }
      if (ids.get(file) === blob) same += 1;
    }
    if (!best || same > best.same) best = { candidate, same };
  }
  return best?.candidate;
}

/**
 * package.json's kit sections, entry by entry: the kit's new value where the test home kept the kit's old one (or
 * had none), removed where the kit dropped one the test home kept; a value the test home changed stays.
 */
function mergePackage(oldPkg, newPkg, pkg) {
  const changed = [];
  const kept = [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const section of PACKAGE_SECTIONS) {
    const [was, now] = [oldPkg[section] ?? {}, newPkg[section] ?? {}];
    for (const key of new Set([...Object.keys(was), ...Object.keys(now)])) {
      if (KIT_ONLY_SCRIPTS.has(key) || same(pkg[section]?.[key], now[key])) continue;
      if (!same(pkg[section]?.[key], was[key])) {
        kept.push(`${section}.${key}`);
        continue;
      }
      pkg[section] ??= {};
      if (now[key] === undefined) delete pkg[section][key];
      else pkg[section][key] = now[key];
      changed.push(`${section}.${key}`);
    }
  }
  return { changed, kept };
}

export async function runUpdate(call, ask) {
  const target = path.resolve(call.target ?? ".");
  const where = path.relative(process.cwd(), target).split(path.sep).join("/") || "this folder";
  const pkgFile = path.join(target, "package.json");
  const pkg = fs.existsSync(pkgFile) ? JSON.parse(fs.readFileSync(pkgFile, "utf8")) : {};
  if (!pkg.playwrightAiKit) stop(`${where} is not a test home the kit installed (its package.json has no playwrightAiKit) — run the update in that folder, or name it: --update qa`);
  say(`Playwright AI Workflow Kit ${VERSION} — updating ${where}\n`);

  const source = kitSource();
  const from = installedCommit(source.root, pkg.playwrightAiKit, source.commit, (file) => readIn(target, file));
  if (!from) {
    source.done();
    stop(`the kit this test home came from (${JSON.stringify(pkg.playwrightAiKit)}) is not in ${REPO} — nothing was changed`);
  }
  if (from === source.commit) {
    source.done();
    say(`Already the kit's ${VERSION} (${from.slice(0, 7)}) — nothing to update.`);
    return;
  }
  const old = treeAt(source.root, from);
  const next = Object.fromEntries(source.files.map((file) => [file, readIn(source.root, file)]));
  const plan = planUpdate({ old, next, project: (file) => readIn(target, file) });

  // The project's own files: package.json by entry, .gitignore by line, a filled-in template's new version beside it.
  const merged = mergePackage(JSON.parse(text(old["package.json"])), JSON.parse(text(next["package.json"])), pkg);
  const ignoreLines = missingIgnoreLines(text(next[".gitignore"]) ?? "", text(readIn(target, ".gitignore")) ?? "");
  const templates = TEMPLATES.filter((file) => next[file] !== undefined && !sameContent(old[file], next[file]) && !sameContent(readIn(target, file), next[file]));
  // The CI the installer wrote, as a kit file: replaced when the test home kept it as written, else beside it.
  const repoRoot = git(["rev-parse", "--show-toplevel"], target).stdout?.trim() || target;
  const ci = installedCi(repoRoot, target).flatMap((name) => {
    const was = ciFiles(name, (file) => text(old[file]), repoRoot, target);
    return ciFiles(name, (file) => text(next[file]), repoRoot, target).flatMap(({ file, text: now }) => {
      const mine = readIn(path.dirname(file), path.basename(file));
      if (sameContent(mine, now)) return [];
      const before = was.find((each) => each.file === file)?.text;
      return [{ file, now, action: sameContent(mine, before) ? "replace" : "conflict" }];
    });
  });

  const count = (action) => plan.filter((step) => step.action === action);
  say(`From ${source.from}, the test home's kit ${from.slice(0, 7)} → ${source.commit?.slice(0, 7)}:`);
  say(`  ${count("replace").length} replaced · ${count("add").length} added · ${count("remove").length} removed · ${count("conflict").length} beside yours (${NEW_SUFFIX}) · ${count("kept").length} yours kept`);
  for (const { file, why } of [...count("conflict"), ...count("kept")]) say(`  - ${file} — ${why}`);
  if (merged.changed.length) say(`  package.json: ${merged.changed.join(", ")}`);
  if (merged.kept.length) say(`  package.json, yours kept: ${merged.kept.join(", ")}`);
  if (ignoreLines.length) say(`  .gitignore: ${ignoreLines.length} line(s) added`);
  for (const file of templates) say(`  ${file}: the kit's template changed — its new version goes beside yours (${file}${NEW_SUFFIX})`);
  for (const { file, action } of ci) say(`  CI ${path.relative(process.cwd(), file).split(path.sep).join("/")}: ${action === "replace" ? "replaced" : `changed by you — the new one beside it (${NEW_SUFFIX})`}`);
  if (call.dryRun) {
    source.done();
    say("\n--dry-run: nothing was changed.");
    return;
  }
  if (!/^(y|yes|д|да)?$/i.test(await ask("Update? (Y/n)", ""))) {
    source.done();
    stop("nothing was changed", 0);
  }

  applyUpdate(plan, { root: target, next });
  pkg.playwrightAiKit = { version: VERSION, commit: source.commit };
  fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
  if (ignoreLines.length) fs.appendFileSync(path.join(target, ".gitignore"), `\n# Playwright AI Workflow Kit ${VERSION}\n${ignoreLines.join("\n")}\n`);
  for (const file of templates) fs.writeFileSync(path.join(target, `${file}${NEW_SUFFIX}`), next[file]);
  for (const { file, now, action } of ci) fs.writeFileSync(action === "replace" ? file : `${file}${NEW_SUFFIX}`, now);
  source.done();
  say("✓ the kit's files updated");

  const sync = spawnSync(process.execPath, [path.join("scripts", "agent", "agents-sync.mjs")], { cwd: target, encoding: "utf8" });
  say(sync.status === 0 ? "✓ the agents' copies written again" : `! npm run agents:sync failed: ${sync.stderr || sync.stdout}`);
  if (call.install) {
    say("Installing (npm install) …");
    if (npm(["install"], target).status !== 0) say(`! npm install failed in ${where} — run it there yourself`);
  } else say(`- not installed (--no-install): in ${where} run npm install`);
  const gate = spawnSync(process.execPath, [path.join("scripts", "gate", "check.mjs")], { cwd: target, encoding: "utf8" });
  const failures = (gate.stdout ?? "").split("\n").filter((line) => line.startsWith("✗ "));
  say(gate.status === 0 ? "✓ qa:gate passes" : `! qa:gate: ${failures.length} problem(s) — npm run qa:gate in ${where} lists them`);

  const beside = [...count("conflict").map(({ file }) => file), ...templates, ...ci.filter(({ action }) => action === "conflict").map(({ file }) => path.relative(target, file))];
  say(`\nDone — the kit ${VERSION} in ${where}.`);
  if (beside.length) say(`  Compare each with its ${NEW_SUFFIX}, keep what you want, then delete the ${NEW_SUFFIX}: ${beside.join(", ")}`);
  say("  Nothing is committed — review the changes and commit yourself.");
}
