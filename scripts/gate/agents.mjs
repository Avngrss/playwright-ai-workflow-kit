import { drift } from "../agent/agents-sync.mjs";
import { at } from "./context.mjs";

/**
 * The agents' copies match agents/ and the agents chosen (agents/agents.json): a rule, skill, command or the MCP
 * config is edited in agents/ and copied by `npm run agents:sync` — a copy edited by hand, not written again after
 * its source changed, or left of an agent no longer chosen fails here.
 */
function checkAgentCopies(_files, report) {
  for (const { file, problem, source } of drift()) {
    const what =
      problem === "missing" ? `missing — the copy of ${source}` : problem === "stale" ? "a copy whose source in agents/ is gone, or of an agent not chosen (agents/agents.json)" : `differs from its source ${source} — edit the source, never the copy`;
    report.fail(at(...file.split("/")), `${what}: npm run agents:sync`);
  }
}

export const agentRules = [checkAgentCopies];
