import { readMap } from "../setup/map-block";

export type CaseLink = { type: "tms"; description: string };

/**
 * A test's link to its manual case — `annotation: [severity.major, tms(101)]` — built from the
 * app's case link in specs/project-map.md §Test cases (TMS) (`- case link <app>: <URL with {id}>`,
 * and `{folder}` when the TMS needs it), so no spec spells a case URL. A spec takes it once from its
 * app's test.ts: `const tms = caseLinks(12)` — the folder only when the link has `{folder}`.
 */
export function caseLinksOf(app: string, folder?: string | number): (id: string | number) => CaseLink {
  const lines = [...(readMap() ?? "").matchAll(/^- case link(?: ([a-z0-9-]+))?:[ \t]*(\S+)/gm)];
  const template = (lines.find((line) => line[1] === app) ?? lines.find((line) => !line[1]))?.[2];
  if (!template) throw new Error(`specs/project-map.md §Test cases (TMS) has no "case link ${app}:" line — the plan skill adds it from the first case link pasted`);
  if (template.includes("{folder}") && folder === undefined) throw new Error(`${app}'s case link has {folder} — give the cases' folder: caseLinks(<folder>)`);
  // "TC-101" and 101 name the same case; the link takes the number.
  return (id) => ({ type: "tms", description: template.replace("{folder}", String(folder)).replace("{id}", String(id).replace(/^[A-Z][A-Z0-9]*-/, "")) });
}
