/**
 * The kit's update of a test home — a plan, then its application — from three versions of each of the kit's files:
 * the kit's at the commit the test home was installed from (`old`), the kit's now (`next`) and the test home's own
 * (`project`). A file the test home never changed takes the kit's new version; one it changed is kept, the kit's
 * version beside it as <file>.kit-new; a project's file, an agent's copy and anything the kit never tracked are not
 * in the plan at all (bin/ownership.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import { ownerOf } from "./ownership.mjs";

export const NEW_SUFFIX = ".kit-new";

/** The same content — text whatever its line ends (a Windows checkout writes CRLF), anything else byte for byte; a missing file only as missing. */
export function sameContent(a, b) {
  if (a === undefined || b === undefined) return a === b;
  const [left, right] = [Buffer.from(a), Buffer.from(b)];
  if (left.includes(0) || right.includes(0)) return left.equals(right);
  return left.toString("utf8").replace(/\r\n/g, "\n") === right.toString("utf8").replace(/\r\n/g, "\n");
}

/**
 * What an update does to each of the kit's files that is not already as the kit has it now — [{ file, action, why? }]:
 *   add       new in the kit, not in the test home
 *   replace   the test home has it as the kit had it; the kit changed it
 *   remove    the kit dropped it; the test home has it as the kit had it
 *   conflict  the kit's version goes beside it as <file>.kit-new: both changed it, the test home has another file at
 *             a path the kit adds, or it removed a file the kit changed
 *   kept      the test home changed it and the kit did not, or the kit dropped it and the test home changed it
 * A file the test home removed and the kit left as it was stays removed (not listed).
 * `old` and `next` map a file to its content; `project(file)` gives the test home's, undefined when it has none.
 */
export function planUpdate({ old, next, project }) {
  const files = [...new Set([...Object.keys(old), ...Object.keys(next)])].filter((file) => ownerOf(file) === "kit").sort();
  const plan = [];
  for (const file of files) {
    const [was, now, mine] = [old[file], next[file], project(file)];
    if (sameContent(mine, now)) continue;
    if (was === undefined) plan.push(mine === undefined ? { file, action: "add" } : { file, action: "conflict", why: "the kit adds a file the test home has already" });
    else if (now === undefined) plan.push(sameContent(mine, was) ? { file, action: "remove" } : { file, action: "kept", why: "the kit dropped it; yours is changed" });
    else if (mine === undefined) {
      if (!sameContent(was, now)) plan.push({ file, action: "conflict", why: "you removed it; the kit changed it" });
    } else if (sameContent(mine, was)) plan.push({ file, action: "replace" });
    else if (sameContent(was, now)) plan.push({ file, action: "kept", why: "yours is changed; the kit did not change it" });
    else plan.push({ file, action: "conflict", why: "both changed it" });
  }
  return plan;
}

/** A folder a removal left empty goes too, up to the test home. */
function pruneEmpty(dir, root) {
  for (let at = dir; path.relative(root, at) && !path.relative(root, at).startsWith(".."); at = path.dirname(at)) {
    if (!fs.existsSync(at) || fs.readdirSync(at).length) return;
    fs.rmdirSync(at);
  }
}

/** Carries the plan out in the test home `root` with the kit's new contents `next`; returns the plan. */
export function applyUpdate(plan, { root, next }) {
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  for (const { file, action } of plan) {
    const full = path.join(root, file);
    if (action === "add" || action === "replace") write(full, next[file]);
    else if (action === "conflict") write(`${full}${NEW_SUFFIX}`, next[file]);
    else if (action === "remove") {
      fs.rmSync(full, { force: true });
      pruneEmpty(path.dirname(full), root);
    }
  }
  return plan;
}
