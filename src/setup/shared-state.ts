import fs from "node:fs";
import { test } from "@playwright/test";
import { readMap } from "./map-block";

/**
 * Stand items tests change, and the guard against reading one unprotected. A test changing a real
 * item of the stand (a project's settings, a profile) holds its lock (specs/project-map.md
 * §Shared state, the Stand item column names the item); a test reading the same item while it changes
 * sees it half-changed. Lookups find items by their data, so which one comes back is known only at
 * run time: every lookup's result passes this check, and a test that reads such an item without its
 * lock fails at once with what to do, instead of failing now and then (.cursor/rules/specs.mdc).
 */

/** Each stand item tests change, by name → the lock their tests hold. */
function changedItems(): Map<string, string> {
  const section = /^## Shared state \(test locks\)\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(readMap() ?? "")?.[1] ?? "";
  const items = new Map<string, string>();
  for (const row of section.split("\n").filter((line) => line.startsWith("|"))) {
    const [, lockCell = "", , itemCell = ""] = row.split("|");
    const lock = /`([^`]+)`/.exec(lockCell)?.[1];
    if (!lock) continue;
    for (const [, name] of itemCell.matchAll(/`([^`]+)`/g)) items.set(name.trim(), lock);
  }
  return items;
}

/** The `name` of what a lookup found, and of each item it holds (a record or a list of items). */
function namesIn(found: unknown): string[] {
  const nameOf = (value: unknown): string[] => {
    const name = value && typeof value === "object" ? (value as { name?: unknown }).name : undefined;
    return typeof name === "string" ? [name.trim()] : [];
  };
  if (!found || typeof found !== "object") return [];
  return [...nameOf(found), ...Object.values(found).flatMap(nameOf)];
}

/** Locks named in a declaration's text: `lock: "a"` or `lock: ["a", "b"]`. */
function locksIn(text: string): string[] {
  const declared = [...text.matchAll(/\block\s*:\s*(\[[^\]]*\]|["'`][^"'`]+["'`])/g)].map((match) => match[1]);
  return declared.flatMap((value) => [...value.matchAll(/["'`]([^"'`]+)["'`]/g)].map((match) => match[1]));
}

/** The locks the running test holds — on its own `test(…)` and on each `test.describe` around it — read from its spec. */
function locksOfRunningTest(): string[] | undefined {
  let file: string;
  let line: number;
  try {
    ({ file, line } = test.info());
  } catch {
    return undefined; // not inside a test (a worker fixture): nothing to check against
  }
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const indent = (text: string) => text.length - text.trimStart().length;
  // A declaration runs from its call to the line opening its body.
  const declaration = (start: number) => {
    const end = lines.findIndex((text, index) => index >= start && /=>\s*\{\s*$/.test(text));
    return lines.slice(start, end === -1 ? start + 1 : end + 1).join("\n");
  };
  const held = locksIn(declaration(line - 1));
  // Walking up, a line indented less than everything seen so far opens a block around the test.
  let level = indent(lines[line - 1]);
  for (let index = line - 2; index >= 0; index -= 1) {
    const text = lines[index];
    if (!text.trim() || indent(text) >= level) continue;
    level = indent(text);
    if (/\btest\.describe(?:\.\w+)?\(/.test(text)) held.push(...locksIn(declaration(index)));
  }
  return held;
}

/** Fails when `found` is a stand item tests change and the running test does not hold its lock. */
export function checkSharedItems(lookup: string, found: unknown): void {
  const changed = changedItems();
  if (!changed.size) return;
  for (const name of namesIn(found)) {
    const lock = changed.get(name);
    const held = lock ? locksOfRunningTest() : undefined;
    if (!lock || !held || held.includes(lock)) continue;
    throw new Error(
      `${lookup} found "${name}", which tests change (lock "${lock}", specs/project-map.md §Shared state). ` +
        `A test reading it while they run sees it half-changed: declare { lock: "${lock}" } on this test or its describe, ` +
        `or leave the item out of the lookup, or add another item to the stand (.cursor/rules/specs.mdc).`,
    );
  }
}
