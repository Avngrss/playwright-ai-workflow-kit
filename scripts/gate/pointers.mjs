import fs from "node:fs";
import path from "node:path";
import { at, listFiles, read } from "./context.mjs";

/**
 * What the code tells the agent to read must exist: every `agents/rules/<name>.md`, every
 * `agents/skills/<name>/` and every "the <name> skill" named in scripts/, src/, tests/ and specs/
 * is a real rule or skill. A rule or skill renamed or merged without its pointers fails here
 * instead of sending the agent to a file that is gone; so does a pointer into an agent's own copy
 * (`.cursor/rules/…`) — the texts live in agents/, the copies are written by `npm run agents:sync`.
 */
const SKILLS_DIR = at("agents", "skills");
const skillNames = () => (fs.existsSync(SKILLS_DIR) ? fs.readdirSync(SKILLS_DIR).filter((name) => fs.existsSync(path.join(SKILLS_DIR, name, "SKILL.md"))) : []);
// The scripts that write or check the agents' copies name them on purpose.
const COPY_SCRIPTS = new Set(["agents-sync.mjs", "agents.mjs", "pointers.mjs"]);

function checkPointers(_files, report) {
  const skills = new Set(skillNames());
  const sources = ["scripts", "src", "tests", "specs"].flatMap((dir) => listFiles(at(dir), (file) => /\.(ts|mjs|md)$/.test(file)));
  for (const file of sources) {
    const text = read(file);
    if (!COPY_SCRIPTS.has(path.basename(file))) {
      for (const [pointer] of text.matchAll(/\.cursor\/(?:rules|skills|commands)\/[a-z0-9/._-]*|\b[a-z0-9-]+\.mdc\b/g)) {
        report.fail(file, `points to ${pointer} — an agent's own copy; name the source: agents/rules/<name>.md, agents/skills/<name>/`);
      }
    }
    for (const [, rule] of text.matchAll(/agents\/rules\/([a-z0-9/._-]+?\.md)\b/g)) {
      if (!fs.existsSync(at("agents", "rules", rule))) report.fail(file, `points to agents/rules/${rule}, which does not exist — name a rule of agents/rules/`);
    }
    for (const [, skill] of text.matchAll(/agents\/skills\/([a-z0-9-]+)\//g)) {
      if (!skills.has(skill)) report.fail(file, `points to agents/skills/${skill}/, which does not exist — name a skill of agents/skills/`);
    }
    // A comment may wrap the name onto its next line ("the setup\n * skill's"): read it as one line.
    const flat = text.replace(/\s*\r?\n\s*(?:\*(?!\/)|\/\/)?\s*/g, " ");
    for (const [, skill] of flat.matchAll(/\bthe ([a-z][a-z0-9-]*) skill\b/g)) {
      if (skills.size && !skills.has(skill)) report.fail(file, `names "the ${skill} skill", which does not exist — skills: ${[...skills].join(", ")}`);
    }
  }
}

export const pointerRules = [checkPointers];
