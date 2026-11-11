/**
 * The stop check — each agent's stop hook (`.claude/settings.json` Stop, `.cursor/hooks.json` stop, written by
 * `npm run agents:sync` from agents/hooks.json). Before the agent ends its turn it looks for what a rule asks and
 * an agent can skip: the automatic heal a red verify of fresh specs still owes (reports/verify-state.json, the
 * verify skill §5) and the gate's conventions on the work in the tree (scripts/gate/check.mjs — the plan's owners,
 * routes, a copy of agents/ edited by hand …; not tsc, verify runs it). Found → the agent is sent back once with
 * what to do; its next stop goes through (a question the user must answer first). A tree unchanged since the
 * last check is never reported twice. Any error of its own → silent: the hook never stands in the agent's way.
 *
 *   node scripts/agent/stop-check.mjs --agent claude|cursor     the hook's JSON on stdin
 *
 * Claude Code: exit 2, the message on stderr. Cursor: {"followup_message": "…"} on stdout.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const STATE = path.join(ROOT, "reports", "verify-state.json");
const SEEN = path.join(ROOT, "reports", "stop-check.json");
// The folders an agent's work lands in.
const WORK = ["specs", "tests", "src", "agents", "scripts"];
const agent = process.argv[process.argv.indexOf("--agent") + 1];

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
};
const lines = (args) => {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.split("\n").filter(Boolean) : null;
};

/** The hook's input: Claude Code { stop_hook_active }, Cursor { status, loop_count }. */
function hookInput() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

/** A stop right after the hook sent the agent back, or one the person cut short, goes through. */
function secondTry(hook) {
  if (agent === "cursor") return (hook.loop_count ?? 0) > 0 || (hook.status !== undefined && hook.status !== "completed");
  return hook.stop_hook_active === true;
}

/** The work in the tree: the files changed against HEAD (new ones too) under WORK, and one fingerprint of them and the verify state. */
function workNow() {
  const changed = lines(["diff", "--name-only", "--relative", "HEAD", "--", ...WORK]);
  const added = lines(["ls-files", "--others", "--exclude-standard", "--", ...WORK]);
  if (!changed || !added) return null;
  const files = [...new Set([...changed, ...added])].sort();
  const stamp = (file) => {
    try {
      const stat = fs.statSync(path.join(ROOT, file));
      return `${stat.size}:${stat.mtimeMs}`;
    } catch {
      return "gone";
    }
  };
  const fingerprint = createHash("sha256")
    .update([...files.map((file) => `${file} ${stamp(file)}`), `state ${stamp(path.relative(ROOT, STATE))}`].join("\n"))
    .digest("hex");
  return { files, fingerprint };
}

function findingsOf(work) {
  const findings = [];
  const state = readJson(STATE);
  if (state?.healOwed) {
    findings.push(`the automatic heal after a fresh implement is owed (the verify skill §5, §8): ${state.red.join(" ")} — heal, then \`npm run verify\` again on them`);
  }
  if (work.files.length) {
    const gate = spawnSync(process.execPath, [path.join(ROOT, "scripts", "gate", "check.mjs")], { cwd: ROOT, encoding: "utf8" });
    const failures = (gate.stdout ?? "").split("\n").filter((line) => line.startsWith("✗ ")).map((line) => line.slice(2));
    if (failures.length) {
      const shown = failures.slice(0, 8).map((failure) => `  - ${failure}`);
      findings.push(`qa:gate fails (${failures.length}):\n${shown.join("\n")}${failures.length > shown.length ? `\n  … ${failures.length - shown.length} more: npm run qa:gate` : ""}`);
    }
  }
  return findings;
}

function main() {
  const hook = hookInput();
  if (!["claude", "cursor"].includes(agent) || secondTry(hook)) return;
  const work = workNow();
  if (!work) return;
  // The same tree as at the last check: what it found was said then.
  if (readJson(SEEN)?.fingerprint === work.fingerprint) return;
  const findings = findingsOf(work);
  fs.mkdirSync(path.dirname(SEEN), { recursive: true });
  fs.writeFileSync(SEEN, `${JSON.stringify({ at: new Date().toISOString(), fingerprint: work.fingerprint, findings: findings.length })}\n`);
  if (!findings.length) return;
  const message = [
    "Before you stop — the kit's stop check found:",
    ...findings.map((finding) => `- ${finding}`),
    "Do it now, then stop. Stopped for a question the user must answer first → ask it and stop again.",
  ].join("\n");
  if (agent === "cursor") process.stdout.write(JSON.stringify({ followup_message: message }));
  else {
    process.stderr.write(`${message}\n`);
    process.exitCode = 2;
  }
}

try {
  main();
} catch {
  process.exitCode = 0;
}
