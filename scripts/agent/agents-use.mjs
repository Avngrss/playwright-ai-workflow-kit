/**
 * Which agents this test home works with — `npm run agents:use -- <agents>`: writes agents/agents.json, then the
 * chosen agents' copies (npm run agents:sync), and removes the copies of an agent no longer chosen (only what
 * agents:sync wrote and nobody changed since).
 *
 *   npm run agents:use -- claude           Claude Code only
 *   npm run agents:use -- cursor           Cursor only
 *   npm run agents:use -- cursor,claude    both
 *   npm run agents:use                     say which are chosen
 */
import fs from "node:fs";
import path from "node:path";
import { AGENTS, chosenAgents, sync } from "./agents-sync.mjs";

// How each agent is opened once its copies are there.
const OPEN = {
  cursor: "Cursor — open this folder, turn on the playwright MCP (Cursor Settings → MCP), then /setup in the chat",
  claude: "Claude Code — open this folder (`claude` in it, or VS Code with the Claude Code extension), approve the playwright MCP when asked, then /setup",
};
const ALIASES = { "claude-code": "claude", claudecode: "claude" };

/** "Cursor, claude-code" → ["cursor", "claude"]; an unknown name stops the call. */
export function agentsOf(text) {
  const named = text
    .split(/[\s,]+/)
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
    .map((name) => ALIASES[name] ?? name);
  const unknown = named.filter((name) => !(name in AGENTS));
  if (unknown.length) throw new Error(`unknown agent ${unknown.join(", ")} — one or more of: ${Object.keys(AGENTS).join(", ")}`);
  return [...new Set(named)];
}

/** Writes the choice and the copies; returns what agents:sync did. */
export function useAgents(agents) {
  fs.writeFileSync(path.join(process.cwd(), "agents", "agents.json"), `${JSON.stringify({ agents }, null, 2)}\n`);
  return sync();
}

function main(argv) {
  const text = argv.join(" ");
  if (!text.trim()) {
    console.log(`Agents: ${chosenAgents().map((id) => AGENTS[id]).join(", ")} — change with npm run agents:use -- cursor | claude | cursor,claude`);
    return;
  }
  let agents;
  try {
    agents = agentsOf(text);
  } catch (error) {
    console.error(`agents:use — ${error.message}`);
    process.exit(2);
  }
  const done = useAgents(agents);
  const removed = done.filter(({ problem }) => problem === "stale").length;
  console.log(`Agents: ${agents.map((id) => AGENTS[id]).join(", ")} — ${done.length - removed} copy(ies) written, ${removed} removed.`);
  for (const id of agents) console.log(`- ${OPEN[id]}`);
}

if (process.argv[1]?.endsWith("agents-use.mjs")) main(process.argv.slice(2));
