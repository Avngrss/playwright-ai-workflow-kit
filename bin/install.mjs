#!/usr/bin/env node
/**
 * The kit's installer — puts the Playwright AI Workflow Kit into a folder of your project for the AI agents you
 * work with, installs it (npm ci, Chromium) and prepares its .env. Asks what it is not told; never overwrites a file.
 *
 *   npx github:Avngrss/playwright-ai-workflow-kit [<folder> | <git URL>] [--agent …] [--yes] [--no-install]
 *
 *   <folder>          where the kit goes: qa (the default), . (this folder, when it holds no project yet), any path
 *   <git URL>         clone that repository here first, then the kit into its --dir (qa by default)
 *   --dir <folder>    the folder inside a cloned repository
 *   --agent <list>    claude, cursor, or both: claude,cursor
 *   --ci <name>       github, gitlab or none — the default from the repository's remote (none without one); written
 *                     at the repository's root with the paths to the kit's folder, never over a file that is there
 *   --yes             no questions — the defaults for what is not given (also when there is no terminal to ask in)
 *   --no-install      copy only: no npm ci, no .env
 *
 *   npx github:Avngrss/playwright-ai-workflow-kit --update [<folder>] [--dry-run] [--yes] [--no-install]
 *
 *   --update          bring a test home the kit installed (this folder, or <folder>) to this version: the kit's files
 *                     you never changed are replaced, yours stay with the new version beside them (<file>.kit-new),
 *                     your map, plans, tests and app code are never touched (bin/upgrade.mjs)
 *   --dry-run         with --update: show what would change, change nothing
 *
 * The files come from the kit's git repository at this version's tag (v<version>; the default branch while the tag
 * is not there), or from the checkout the installer runs in — what git tracks, nothing else. The kit's own files
 * stay behind: this installer, its license, its CI templates. A project's own README.md and .gitattributes are
 * kept, its .gitignore gets the kit's lines it lacks; any other file already there stops the install before a
 * single file is written. Nothing is committed: the new files are yours to review and commit.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { ciOfRemote, git, kitSource, npm, say, stop, VERSION, writeCi } from "./kit.mjs";
import { KIT_ONLY } from "./ownership.mjs";
import { runUpdate } from "./upgrade.mjs";

const AGENTS = { claude: "Claude Code", cursor: "Cursor" };
const OPEN = {
  claude: "Claude Code — open the folder (`claude` in it, or VS Code with the Claude Code extension), approve the playwright MCP when asked, then type /setup",
  cursor: "Cursor — open the folder, turn on the playwright MCP (Cursor Settings → MCP), then type /setup",
};
// Files a project may have of its own before the kit comes: kept as they are.
const PROJECT_OWNED = new Set(["README.md", ".gitattributes"]);

const isUrl = (text) => /^(https?:\/\/|git@|ssh:\/\/)/.test(text) || text.endsWith(".git");
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tests";

function parse(argv) {
  const call = { target: undefined, dir: undefined, agents: undefined, ci: undefined, yes: false, install: true, update: false, dryRun: false };
  for (let at = 0; at < argv.length; at += 1) {
    const arg = argv[at];
    if (arg === "--yes" || arg === "-y") call.yes = true;
    else if (arg === "--update") call.update = true;
    else if (arg === "--dry-run") call.dryRun = true;
    else if (arg === "--no-install") call.install = false;
    else if (arg === "--agent" || arg === "--agents") call.agents = argv[(at += 1)];
    else if (arg === "--dir") call.dir = argv[(at += 1)];
    else if (arg === "--ci") call.ci = argv[(at += 1)];
    else if (arg === "--help" || arg === "-h") {
      say(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n\/\*\*\n?/, "").replace(/^ \* ?/gm, ""));
      process.exit(0);
    } else if (arg.startsWith("-")) stop(`unknown option ${arg} — npx github:Avngrss/playwright-ai-workflow-kit --help`, 2);
    else if (call.target === undefined) call.target = arg;
    else stop(`one folder or repository at a time, not "${arg}" too`, 2);
  }
  return call;
}

/** "Cursor, claude-code" or "3" → ["claude", "cursor"]; undefined for what it cannot read. */
function agentsOf(text) {
  const byNumber = { 1: ["claude"], 2: ["cursor"], 3: ["claude", "cursor"] };
  if (byNumber[text?.trim()]) return byNumber[text.trim()];
  const named = (text ?? "")
    .split(/[\s,]+/)
    .map((name) => name.toLowerCase().replace(/^claude-?code$/, "claude"))
    .filter(Boolean);
  return named.length && named.every((name) => name in AGENTS) ? [...new Set(named)] : undefined;
}

/** A folder that holds nothing but a git repository's own folder. */
const isEmpty = (dir) => !fs.existsSync(dir) || fs.readdirSync(dir).every((entry) => entry === ".git");


/**
 * What the copy would do in the target: the files to write, those kept, the .gitignore lines to add, the
 * collisions — a file already there, or a folder of the project's own (src/, tests/, docs/ …) the kit would mix into.
 */
function planCopy(source, target) {
  const plan = { write: [], kept: [], ignoreLines: [], collisions: [] };
  const files = source.files.filter((each) => !KIT_ONLY.some((pattern) => pattern.test(each)));
  for (const dir of new Set(files.filter((file) => file.includes("/")).map((file) => file.split("/")[0]))) {
    if (fs.existsSync(path.join(target, dir))) plan.collisions.push(`${dir}/`);
  }
  for (const file of files) {
    if (plan.collisions.includes(`${file.split("/")[0]}/`)) continue;
    const dest = path.join(target, file);
    if (!fs.existsSync(dest)) plan.write.push(file);
    else if (PROJECT_OWNED.has(file)) plan.kept.push(file);
    else if (file === ".gitignore") {
      const theirs = new Set(fs.readFileSync(dest, "utf8").split(/\r?\n/).map((line) => line.trim()));
      plan.ignoreLines = fs
        .readFileSync(path.join(source.root, file), "utf8")
        .split(/\r?\n/)
        .filter((line) => line.trim() && !line.startsWith("#") && !theirs.has(line.trim()));
    } else plan.collisions.push(file);
  }
  return plan;
}


/**
 * The kit's package.json as the test home's own: its name, no installer, no links to the kit's repository — and
 * `playwrightAiKit: { version, commit }`, the kit it came from (an update starts there).
 */
function ownPackage(target, projectRoot, commit) {
  const file = path.join(target, "package.json");
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const names = projectRoot && path.resolve(projectRoot) !== path.resolve(target) ? [path.basename(projectRoot), path.basename(target)] : [path.basename(target)];
  pkg.name = slug(names.join("-"));
  pkg.version = "0.1.0";
  pkg.description = `Playwright tests written with an AI agent — from the Playwright AI Workflow Kit ${VERSION}`;
  pkg.playwrightAiKit = { version: VERSION, commit };
  for (const key of ["bin", "files", "repository", "bugs", "homepage", "author", "license", "keywords"]) delete pkg[key];
  delete pkg.scripts?.["kit:test"];
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function main(argv) {
  if (Number(process.versions.node.split(".")[0]) < 20) stop(`Node ${process.versions.node} — the kit needs Node 20 or newer (CI uses 22)`);
  const call = parse(argv);
  const interactive = !call.yes && process.stdin.isTTY && process.stdout.isTTY;
  const rl = interactive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : undefined;
  const ask = async (question, fallback) => (rl ? (await rl.question(`? ${question} `)).trim() : "") || fallback;
  if (call.update) {
    await runUpdate(call, ask);
    rl?.close();
    return;
  }

  say(`Playwright AI Workflow Kit ${VERSION}\n`);
  // Where: a folder of this project, or a repository cloned here first.
  let projectRoot = process.cwd();
  let folder = call.target;
  if (folder && isUrl(folder)) {
    const name = path.basename(folder).replace(/\.git$/, "");
    if (fs.existsSync(name)) stop(`${name}/ is here already — clone the repository yourself and run the installer inside it`);
    say(`Cloning ${folder} into ${name}/ …`);
    if (spawnSync("git", ["clone", folder, name], { stdio: "inherit" }).status !== 0) stop(`git clone ${folder} failed`);
    projectRoot = path.resolve(name);
    folder = path.join(name, call.dir ?? (await ask("Folder for the kit inside the repository? (Enter = qa)", "qa")));
  }
  folder ??= await ask(`Folder for the kit? (Enter = ${isEmpty(process.cwd()) ? ". — this folder" : "qa"})`, isEmpty(process.cwd()) ? "." : "qa");
  const target = path.resolve(folder);
  const where = path.relative(process.cwd(), target).split(path.sep).join("/") || ".";
  const place = where === "." ? "this folder" : `${where}/`;

  // Which agents.
  let agents = call.agents ? agentsOf(call.agents) : undefined;
  if (call.agents && !agents) stop(`--agent ${call.agents} — claude, cursor, or claude,cursor`, 2);
  while (!agents) {
    agents = agentsOf(await ask("Which AI do you work with? 1 Claude Code · 2 Cursor · 3 both (Enter = 1)", "1"));
    if (!agents) say("  1, 2 or 3 — or the names: claude, cursor");
  }

  // Which CI — at the repository's root (this folder without git).
  const CIS = ["github", "gitlab", "none"];
  if (call.ci && !CIS.includes(call.ci)) stop(`--ci ${call.ci} — github, gitlab or none`, 2);
  const guess = ciOfRemote(projectRoot);
  let ci = call.ci;
  while (!ci) {
    const answer = (await ask(`CI? 1 GitHub Actions · 2 GitLab CI · 3 none (Enter = ${CIS.indexOf(guess) + 1})`, String(CIS.indexOf(guess) + 1))).toLowerCase();
    ci = CIS[Number(answer) - 1] ?? (CIS.includes(answer) ? answer : undefined);
    if (!ci) say("  1, 2 or 3 — or github, gitlab, none");
  }

  // What would happen — checked before a single file is written.
  const source = kitSource();
  const plan = planCopy(source, target);
  if (plan.collisions.length) {
    source.done();
    const shown = plan.collisions.slice(0, 8).join(", ");
    stop(`${place} already has what the kit would write (${shown}${plan.collisions.length > 8 ? ", …" : ""}) — nothing was written; choose another folder (qa, tests/e2e …)`);
  }
  say(`The kit goes into ${place} for ${agents.map((id) => AGENTS[id]).join(" and ")}, CI: ${ci} — from ${source.from}.`);
  if (plan.kept.length) say(`  kept as they are: ${plan.kept.join(", ")}`);
  if (plan.ignoreLines.length) say(`  .gitignore: ${plan.ignoreLines.length} line(s) of the kit added`);
  if (rl && !/^(y|yes|д|да)?$/i.test(await ask("Install? (Y/n)", ""))) {
    rl.close();
    source.done();
    stop("nothing was written", 0);
  }
  rl?.close();

  for (const file of plan.write) {
    fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
    fs.copyFileSync(path.join(source.root, file), path.join(target, file));
  }
  if (plan.ignoreLines.length) fs.appendFileSync(path.join(target, ".gitignore"), `\n# Playwright AI Workflow Kit\n${plan.ignoreLines.join("\n")}\n`);
  const repoRoot = git(["rev-parse", "--show-toplevel"], target).stdout?.trim() || projectRoot;
  ownPackage(target, repoRoot, source.commit);
  say(`✓ ${plan.write.length} files of the kit copied`);
  if (ci !== "none") say(writeCi(ci, source, path.resolve(repoRoot), target));
  source.done();

  // The chosen agents' copies only (npm run agents:use).
  const use = spawnSync(process.execPath, [path.join("scripts", "agent", "agents-use.mjs"), agents.join(",")], { cwd: target, encoding: "utf8" });
  if (use.status !== 0) stop(`agents:use failed: ${use.stderr || use.stdout}`);
  say(`✓ the rules, skills and commands for ${agents.map((id) => AGENTS[id]).join(" and ")}`);

  if (call.install) {
    say("Installing (npm ci, then Chromium) …");
    if (npm(["ci"], target).status !== 0) stop(`npm ci failed in ${place} — run it there yourself, then npm run env:prepare`);
    say("✓ npm ci");
    if (npm(["run", "env:prepare"], target).status !== 0) stop(`npm run env:prepare failed in ${place}`);
  } else say(`- not installed (--no-install): in ${place} run npm ci, then npm run env:prepare`);

  say(`\nDone. Next, in ${place}:`);
  agents.forEach((id, index) => say(`  ${index + 1}. ${OPEN[id]}`));
  if (git(["rev-parse", "--is-inside-work-tree"], target).stdout?.trim() === "true") say("  The new files are not committed — review them and commit yourself.");
}

main(process.argv.slice(2)).catch((error) => stop(error.message));
