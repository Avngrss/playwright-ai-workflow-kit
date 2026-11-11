/**
 * What the installer and its update share: where the kit comes from (this checkout, the commit npx fetched, a
 * version's tag), git and npm, and the CI the kit writes at a repository's root for a kit in a folder of it.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const REPO = "https://github.com/Avngrss/playwright-ai-workflow-kit.git";
export const VERSION = JSON.parse(fs.readFileSync(path.join(KIT, "package.json"), "utf8")).version;

export const say = (line = "") => console.log(line);
export const stop = (message, code = 1) => {
  console.error(`✗ ${message}`);
  process.exit(code);
};
export const git = (args, cwd) => spawnSync("git", args, { cwd, encoding: "utf8" });
export const npm = (args, cwd) => spawnSync("npm", args, { cwd, stdio: "inherit", shell: process.platform === "win32" });

/**
 * The commit npx fetched this installer from — its lock records it ("…playwright-ai-workflow-kit.git#<sha>"). npm
 * leaves .gitignore and package-lock.json out of a package, so the files come from git at that commit.
 */
export function fetchedCommit() {
  for (const lock of [path.join(KIT, "..", ".package-lock.json"), path.join(KIT, "..", "..", "package-lock.json")]) {
    try {
      const { packages } = JSON.parse(fs.readFileSync(lock, "utf8"));
      const resolved = Object.entries(packages).find(([key]) => key.endsWith("node_modules/playwright-ai-workflow-kit"))?.[1]?.resolved;
      const sha = /#([0-9a-f]{40})$/.exec(resolved ?? "")?.[1];
      if (sha) return sha;
    } catch {
      // Not run through npx, or another layout: the version's tag below.
    }
  }
  return undefined;
}

/**
 * The kit's files: { root, files, commit, from, done } — the checkout this installer runs in, or the kit's git at
 * npx's commit or this version. `commit` is the kit's commit they come from: a test home records it, so an update
 * knows which of its files the project changed since.
 */
export function kitSource() {
  const head = (root) => git(["rev-parse", "HEAD"], root).stdout?.trim() || undefined;
  if (fs.existsSync(path.join(KIT, ".git"))) {
    const listed = git(["ls-files"], KIT);
    if (listed.status === 0) return { root: KIT, files: listed.stdout.split("\n").filter(Boolean), commit: head(KIT), from: `the kit at ${KIT}`, done() {} };
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "playwright-ai-kit-"));
  const done = () => fs.rmSync(root, { recursive: true, force: true });
  const listed = () => git(["ls-files"], root).stdout.split("\n").filter(Boolean);
  const sha = fetchedCommit();
  if (sha && git(["init", "--quiet"], root).status === 0 && git(["fetch", "--quiet", "--depth", "1", REPO, sha], root).status === 0 && git(["checkout", "--quiet", "FETCH_HEAD"], root).status === 0) {
    return { root, files: listed(), commit: sha, from: `${REPO} at ${sha.slice(0, 7)}`, done };
  }
  for (const ref of [`v${VERSION}`, null]) {
    fs.rmSync(root, { recursive: true, force: true });
    fs.mkdirSync(root);
    if (git(["clone", "--quiet", "--depth", "1", ...(ref ? ["--branch", ref] : []), REPO, root]).status === 0) return { root, files: listed(), commit: head(root), from: `${REPO} (${ref ?? "its default branch"})`, done };
  }
  done();
  return stop(`could not fetch the kit — git clone ${REPO} failed (the network, a proxy?)`);
}

/** The CI the project's git remote points to: github, gitlab, or none. */
export function ciOfRemote(dir) {
  const remote = git(["remote", "get-url", "origin"], dir).stdout ?? "";
  return /github/i.test(remote) ? "github" : /gitlab/i.test(remote) ? "gitlab" : "none";
}

export const prefixed = (prefix, value) => (prefix ? `${prefix}/${value}` : value);
export const ciNote = (prefix) => `# The tests live ${prefix ? `in ${prefix}/` : "at the repository's root"} — installed by the Playwright AI Workflow Kit.\n\n`;

/**
 * The kit's GitHub workflow for a kit in a folder of the repository: every `run` in that folder, setup-node's cache
 * keyed by its lock, and the paths GitHub reads from the repository's root (hashFiles, artifacts) under it.
 */
export function githubWorkflow(text, prefix) {
  const body = text.replace(/^# The test home in a folder[\s\S]*?\n\n/m, ciNote(prefix));
  if (!prefix) return body;
  const out = [];
  let block = null;
  for (const line of body.split("\n")) {
    const indent = /^\s*/.exec(line)[0].length;
    if (block !== null && line.trim() && indent > block) {
      out.push(`${" ".repeat(indent)}${prefixed(prefix, line.trim())}`);
      continue;
    }
    block = null;
    if (/^jobs:/.test(line)) out.push("defaults:", "  run:", `    working-directory: ${prefix}`, "");
    const pathLine = /^(\s*)path: (.+)$/.exec(line);
    if (pathLine && pathLine[2].trim() === "|") block = pathLine[1].length;
    else if (pathLine) {
      out.push(`${pathLine[1]}path: ${prefixed(prefix, pathLine[2].trim())}`);
      continue;
    }
    out.push(line.replace(/hashFiles\(([^)]*)\)/g, (_, args) => `hashFiles(${args.replace(/'([^']+)'/g, (__, file) => `'${prefixed(prefix, file)}'`)})`));
    const cache = /^(\s*)cache: npm\s*$/.exec(line);
    if (cache) out.push(`${cache[1]}cache-dependency-path: ${prefixed(prefix, "package-lock.json")}`);
  }
  return out.join("\n");
}

/**
 * The kit's GitLab CI for a kit in a folder of the repository: `cd` into it before each job's scripts (the secret
 * scan stays at the root), and the cache, artifact and dotenv paths under it.
 */
export function gitlabCi(text, prefix) {
  const body = text.replace(/^# This path is the etalon template[\s\S]*?\n\n/m, ciNote(prefix));
  if (!prefix) return body;
  const out = [];
  let job = "";
  let list = null;
  for (const line of body.split("\n")) {
    const top = /^([.\w:-]+):\s*$/.exec(line);
    if (top) job = top[1];
    const indent = /^\s*/.exec(line)[0].length;
    if (list !== null) {
      if (line.trim().startsWith("- ") && indent >= list) {
        const item = line.trim().slice(2);
        out.push(item === ".npm/" || item.startsWith("#") ? line : `${" ".repeat(indent)}- ${prefixed(prefix, item)}`);
        continue;
      }
      if (line.trim().startsWith("#") && indent >= list) {
        out.push(line);
        continue;
      }
      list = null;
    }
    const key = /^(\s*)(script|before_script|after_script|paths|dotenv):\s*(.*)$/.exec(line);
    if (key?.[2] === "dotenv") {
      out.push(`${key[1]}dotenv: ${prefixed(prefix, key[3].trim())}`);
      continue;
    }
    out.push(line);
    if (!key) continue;
    if (key[2] === "paths") list = key[1].length;
    else if (key[2] !== "script" || (job === "baseline")) out.push(`${key[1]}  - cd ${prefix}`);
  }
  return out.join("\n");
}

/** Writes the chosen CI at the repository's root, for the kit in `prefix`; never over a file that is there. */
export function writeCi(ci, source, repoRoot, target) {
  const prefix = path.relative(repoRoot, target).split(path.sep).join("/");
  const at = (...parts) => path.join(repoRoot, ...parts);
  const shown = (file) => path.relative(process.cwd(), file).split(path.sep).join("/");
  if (ci === "github") {
    const file = at(".github", "workflows", "playwright.yml");
    if (fs.existsSync(file)) return `! CI: ${shown(file)} is there already — not touched; the kit's workflow: github.com/Avngrss/playwright-ai-workflow-kit/blob/main/.github/workflows/playwright.yml`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, githubWorkflow(fs.readFileSync(path.join(source.root, ".github", "workflows", "playwright.yml"), "utf8"), prefix));
    return `✓ CI: ${shown(file)} — add the app's addresses and logins in GitHub (Settings → Secrets and variables → Actions) and to its env: block`;
  }
  const template = gitlabCi(fs.readFileSync(path.join(source.root, "ci", "gitlab", "gitlab-ci.yml"), "utf8"), prefix);
  const root = at(".gitlab-ci.yml");
  if (!prefix) {
    if (fs.existsSync(root)) return `! CI: ${shown(root)} is there already — not touched; the kit's: github.com/Avngrss/playwright-ai-workflow-kit/blob/main/ci/gitlab/gitlab-ci.yml`;
    fs.writeFileSync(root, template);
    return `✓ CI: ${shown(root)} — add the app's addresses and logins as GitLab CI/CD variables`;
  }
  const own = path.join(target, "ci", "gitlab-ci.yml");
  fs.mkdirSync(path.dirname(own), { recursive: true });
  fs.writeFileSync(own, template);
  const include = `include:\n  - local: ${prefix}/ci/gitlab-ci.yml\n`;
  if (!fs.existsSync(root)) {
    fs.writeFileSync(root, include);
    return `✓ CI: ${shown(own)}, included by ${shown(root)} — add the app's addresses and logins as GitLab CI/CD variables`;
  }
  return `! CI: ${shown(own)} written; ${shown(root)} is there already — add to it:\n${include}`;
}

/**
 * The kit's CI files for a kit in `target` of the repository at `repoRoot` — [{ file, text }]: GitHub's workflow, or
 * GitLab's (the kit folder's own, which the root file includes — or the root file itself for a kit at the root),
 * rendered from a template `read(<the kit's path>)` gives. The update compares them as installed and as now.
 */
export function ciFiles(ci, read, repoRoot, target) {
  const prefix = path.relative(repoRoot, target).split(path.sep).join("/");
  if (ci === "github") {
    const text = read(".github/workflows/playwright.yml");
    return text === undefined ? [] : [{ file: path.join(repoRoot, ".github", "workflows", "playwright.yml"), text: githubWorkflow(text, prefix) }];
  }
  const text = read("ci/gitlab/gitlab-ci.yml");
  if (ci !== "gitlab" || text === undefined) return [];
  return [{ file: prefix ? path.join(target, "ci", "gitlab-ci.yml") : path.join(repoRoot, ".gitlab-ci.yml"), text: gitlabCi(text, prefix) }];
}

/** The CI the installer wrote for this test home — those of its files that carry the installer's note. */
export function installedCi(repoRoot, target) {
  const ours = (file) => fs.existsSync(file) && fs.readFileSync(file, "utf8").includes("installed by the Playwright AI Workflow Kit");
  return ["github", "gitlab"].filter((ci) => ciFiles(ci, () => "", repoRoot, target).some(({ file }) => ours(file)));
}

/** The kit's .gitignore lines a project's .gitignore lacks (comments and blank lines left out). */
export function missingIgnoreLines(kit, theirs) {
  const have = new Set(theirs.split(/\r?\n/).map((line) => line.trim()));
  return kit.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith("#") && !have.has(line.trim()));
}
