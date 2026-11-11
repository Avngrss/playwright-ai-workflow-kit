/**
 * Whose a file of a test home is — the kit's or the project's — for the installer and its update. A file the kit's
 * git tracks is the kit's, but for: what the kit keeps to itself (KIT_ONLY — never copied into a project), what a
 * project fills in, keeps or merges once it has it (PROJECT_FILES), and the agents' copies (`npm run agents:sync`
 * writes them from agents/). An update replaces a kit file the project never changed; a project's file — and any
 * file the kit does not track — it never replaces.
 */

// The kit's own: this installer and its tests, its license, the template's CI (a project gets its own from the installer).
export const KIT_ONLY = [/^bin\//, /^LICENSE$/, /^\.github\//, /^ci\//];

// A project's once installed: the map, the known bugs and the .env names it fills in; the agents it chose; the
// package and .gitignore the installer merges; the README and .gitattributes a project may have of its own.
export const PROJECT_FILES = new Set(["specs/project-map.md", "specs/known-bugs.md", ".env.example", "agents/agents.json", "package.json", ".gitignore", "README.md", ".gitattributes"]);

// What `npm run agents:sync` writes from agents/ — written again after an update, never compared.
const COPIES = [/^\.cursor\/(rules|commands|skills)\//, /^\.claude\/(rules|commands|skills|agents)\//, /^\.mcp\.json$/, /^\.claude\/settings\.json$/, /^\.cursor\/(mcp|hooks)\.json$/];

/** "none" — never in a project · "copy" — agents:sync writes it · "project" — an update never replaces it · "kit" — an update may. */
export function ownerOf(file) {
  if (KIT_ONLY.some((pattern) => pattern.test(file))) return "none";
  if (COPIES.some((pattern) => pattern.test(file))) return "copy";
  return PROJECT_FILES.has(file) ? "project" : "kit";
}
