import fs from "node:fs";
import path from "node:path";

export const MAP_FILE = path.resolve(__dirname, "..", "..", "specs", "project-map.md");

/** The map's text, or undefined before the map exists. */
export function readMap(): string | undefined {
  return fs.existsSync(MAP_FILE) ? fs.readFileSync(MAP_FILE, "utf8").replace(/\r\n/g, "\n") : undefined;
}

/**
 * Every fenced block of a kind in specs/project-map.md (```auth, ```app-wide) as `key → values` — one
 * `key: value` per line, a repeated key keeps every value in order, `#` lines are comments. One block
 * per app (each says `platform: <slug>`); empty before that product
 * knowledge has been written.
 */
export function readMapBlocks(name: string): Array<Map<string, string[]>> {
  const text = readMap() ?? "";
  return [...text.matchAll(new RegExp("```" + name + "\\n([\\s\\S]*?)```", "g"))].map((match) => {
    const entries = new Map<string, string[]>();
    for (const line of match[1].split("\n").map((entry) => entry.trim())) {
      if (!line || line.startsWith("#")) continue;
      const at = line.indexOf(":");
      if (at === -1) continue;
      const key = line.slice(0, at).trim();
      entries.set(key, [...(entries.get(key) ?? []), line.slice(at + 1).trim()]);
    }
    return entries;
  });
}

/**
 * The block of a kind that belongs to `platform`: the one saying `platform: <slug>`, else the one
 * without a `platform:` line (it serves every app that has no block of its own — a one-app map).
 */
export function readMapBlock(name: string, platform?: string): Map<string, string[]> | undefined {
  const blocks = readMapBlocks(name);
  return blocks.find((block) => platform !== undefined && block.get("platform")?.[0] === platform) ?? blocks.find((block) => !block.has("platform"));
}
