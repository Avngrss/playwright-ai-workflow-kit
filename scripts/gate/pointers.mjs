import fs from "node:fs";
import path from "node:path";
import { at, listFiles, read } from "./context.mjs";

/**
 * What the code tells the agent to read must exist: every `.cursor/rules/<name>.mdc`, every
 * `.cursor/skills/<name>/` and every "the <name> skill" named in scripts/, src/, tests/ and specs/
 * is a real rule or skill. A rule or skill renamed or merged without its pointers fails here
 * instead of sending the agent to a file that is gone.
 */
const SKILLS_DIR = at(".cursor", "skills");
const skillNames = () => (fs.existsSync(SKILLS_DIR) ? fs.readdirSync(SKILLS_DIR).filter((name) => fs.existsSync(path.join(SKILLS_DIR, name, "SKILL.md"))) : []);

function checkPointers(_files, report) {
  const skills = new Set(skillNames());
  const sources = ["scripts", "src", "tests", "specs"].flatMap((dir) => listFiles(at(dir), (file) => /\.(ts|mjs|md)$/.test(file)));
  for (const file of sources) {
    const text = read(file);
    for (const [, rule] of text.matchAll(/\.cursor\/rules\/([a-z0-9/._-]+?\.mdc)/g)) {
      if (!fs.existsSync(at(".cursor", "rules", rule))) report.fail(file, `points to .cursor/rules/${rule}, which does not exist — name a rule of .cursor/rules/`);
    }
    for (const [, skill] of text.matchAll(/\.cursor\/skills\/([a-z0-9-]+)\//g)) {
      if (!skills.has(skill)) report.fail(file, `points to .cursor/skills/${skill}/, which does not exist — name a skill of .cursor/skills/`);
    }
    // A comment may wrap the name onto its next line ("the setup\n * skill's"): read it as one line.
    const flat = text.replace(/\s*\r?\n\s*(?:\*(?!\/)|\/\/)?\s*/g, " ");
    for (const [, skill] of flat.matchAll(/\bthe ([a-z][a-z0-9-]*) skill\b/g)) {
      if (skills.size && !skills.has(skill)) report.fail(file, `names "the ${skill} skill", which does not exist — skills: ${[...skills].join(", ")}`);
    }
  }
}

export const pointerRules = [checkPointers];
