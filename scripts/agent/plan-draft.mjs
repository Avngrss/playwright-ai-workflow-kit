/**
 * `npm run plan:block` with a source: a plan's next case block drafted from a TMS case or a confirmed
 * bug, saved by the agent from what the TMS or tracker tool returned — through plan:block's writer
 * (plan-block.mjs, which loads this module for `--case` and `--bug`): the same shape, numbering and
 * exits. Copied from the source, in its words: the title, the case id (TMS:, Why:), its priority and
 * severity on the Value line (a word outside the plan's scale beside the template's choice:
 * `Priority: P1 | P2 | P3 (TMS: "High")`), the precondition, each step and its expected result as that
 * step's expect line. What the agent decides stays the template's <…> and choices — owner and why
 * (unless given), route, data, rules, cleanup — so spec:draft refuses the block until the agent fills
 * it from the live check. A value a step names stays the source's words: rule or example is the plan's
 * call (its Data: line), never this command's.
 *
 *   npm run plan:block -- <plan> --case <file.json> [--scenario S<k> --title "<what it proves>" [--take <n>[-<m>]]] [--owner API|UI|E2E] [--why "<≤ 8 words>"] [--role <slug>]
 *   npm run plan:block -- <plan> --bug <file.json> [--title "<the outcome it expects>"] [--owner API|UI|E2E] [--why "<≤ 8 words>"] [--role <slug>]
 *
 * The file: one source, kept in the test home's gitignored state/ — state/sources/<id>.json. A
 * neutral shape, never a vendor's:
 *
 *   case  { "id": "TC-101", "title": "…", "precondition"?: "…", "priority"?: "P2", "severity"?: "Major",
 *           "steps": [ { "action": "…", "expected"?: "…" } | "…" ]  or one text "1. …\n2. …",
 *           "expected"?: "…" }  the expected result kept apart from the steps: its numbered lines go to
 *                                those steps, an unnumbered text to the last step
 *   bug   { "id": "SHOP-512", "title": "…", "precondition"?, "priority"?, "severity"?, "steps": as a case's,
 *           "expected": "…", "actual": "…" }
 *   ("tags", as the TMS returns them, is ignored; any other field stops the command.)
 *
 *   --case      the block proves the case: title "<id> · <its title>", TMS: <id>, Why: case <id>
 *   --scenario  one scenario of the case (docs/Layer Routing Algorithm.md §18): title
 *               "<id> · S<k> · <--title>"; --take its steps n..m of the case, renumbered from 1, Why:
 *               "case <id> steps n–m"
 *   --bug       the block proves the expected result the bug names: its steps, its expected result as
 *               the last step's expect, TMS: not yet documented, Why: bug <id>, Rules: the ticket; its
 *               actual result is the block's Seen line, never an expect. The title is the outcome it
 *               expects (--title), else the template's <Title …> for the agent
 *   --owner, --why, --role, --tag, --rules  as plan:block's
 *
 * Exit 0: added · 1: nothing written, the last line says why (a missing or malformed field named).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { caseIds, scenarioOf } from "../gate/plans.mjs";
import { PLACEHOLDER, USAGE, addTag, appendBlock, posix, stopper } from "./plan-block.mjs";

const stop = stopper("plan:block");
const OPTIONS = { "--case": "case", "--bug": "bug", "--scenario": "scenario", "--take": "take", "--title": "title", "--owner": "owner", "--why": "why", "--role": "role", "--rules": "rules" };
const FIELDS = {
  case: ["id", "title", "precondition", "priority", "severity", "steps", "expected", "tags"],
  bug: ["id", "title", "precondition", "priority", "severity", "steps", "expected", "actual", "tags"],
};
const SHAPE = {
  case: '{ "id", "title", "precondition"?, "priority"?, "severity"?, "steps": [{ "action", "expected"? } | "<text>"] or "1. …\\n2. …", "expected"? }',
  bug: '{ "id", "title", "precondition"?, "priority"?, "severity"?, "steps": as a case\'s, "expected", "actual" }',
};
const one = (text) => String(text).replace(/\s+/g, " ").trim();

function parse(argv) {
  const [plan, ...rest] = argv;
  if (!plan || plan.startsWith("--")) stop(`name the plan first\n${USAGE}`);
  const call = { plan };
  for (let at = 0; at < rest.length; at += 2) {
    if (rest[at] === "--tag") {
      addTag(call, rest[at + 1]);
      continue;
    }
    const key = OPTIONS[rest[at]];
    if (!key) stop(`unknown option "${rest[at]}" with a source — --tms and --steps make an empty block, --case/--bug take theirs from the source\n${USAGE}`);
    const value = rest[at + 1];
    if (value === undefined || value.startsWith("--")) stop(`${rest[at]} takes a value\n${USAGE}`);
    call[key] = one(value);
  }
  if (!call.case === !call.bug) stop(`one source: --case <file.json> or --bug <file.json>\n${USAGE}`);
  if (call.bug && (call.scenario || call.take)) stop("a bug is one block, its expected result — --scenario and --take split a TMS case");
  if (call.take && !call.scenario) stop('a part of a case is one of its scenarios — --scenario S<k> --title "<what it proves>" --take <n>-<m>');
  if (call.scenario && !/^S\d+$/.test(call.scenario)) stop(`--scenario is S<k> (S2), not "${call.scenario}"`);
  if (call.scenario && !call.title) stop('a scenario\'s title says what it proves, ≤ 8 words — --title "<what it proves>" (the implement skill, Naming)');
  if (call.case && !call.scenario && call.title) stop("a case's block takes the case's own title — --title names a scenario (with --scenario) or a bug's expected outcome");
  return call;
}

/** "1. …\n2. …" → [{ n, text }], a line without a number joining the item above; undefined when the first line has no number. */
function numbered(text) {
  const items = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const item = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (item) items.push({ n: Number(item[1]), text: item[2] });
    else if (items.length) items.at(-1).text += ` ${line}`;
    else return undefined;
  }
  return items.map(({ n, text: words }) => ({ n, text: one(words) }));
}

/** The source file, checked against its shape: { id, title, precondition, priority, severity, steps: [{ action, expected }], actual }. */
function readSource(file, kind) {
  const shown = posix(path.relative(process.cwd(), path.resolve(file)));
  const full = path.resolve(file);
  if (!fs.existsSync(full)) stop(`no source at ${shown} — save the ${kind === "bug" ? "ticket" : "case"} there first, in this shape: ${SHAPE[kind]}`);
  let source;
  try {
    source = JSON.parse(fs.readFileSync(full, "utf8").replace(/^﻿/, ""));
  } catch (error) {
    stop(`${shown} is not JSON — ${error.message}`);
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) stop(`${shown} holds one ${kind} as an object — ${SHAPE[kind]}`);
  const bad = (field, want) => stop(`${shown}: "${field}" ${want} — the ${kind}'s shape: ${SHAPE[kind]}`);
  for (const key of Object.keys(source)) if (!FIELDS[kind].includes(key)) bad(key, "is not a field of the shape");
  const textOf = (field, { required = false, number = false } = {}) => {
    const value = source[field];
    if (value === undefined || value === null) return required ? bad(field, "is missing") : undefined;
    if (typeof value !== "string" && !(number && typeof value === "number")) bad(field, `is a text${number ? " or a number" : ""}`);
    const flat = one(value);
    if (!flat && required) bad(field, "is empty");
    return flat || undefined;
  };

  const id = textOf("id", { required: true, number: true });
  if (!/^[A-Za-z0-9][\w.-]*$/.test(id)) bad("id", `is the ${kind === "bug" ? "ticket's id as the tracker shows it (SHOP-512)" : "case's id as the TMS shows it (TC-101)"}, not "${id}"`);
  const steps = stepsOf(source.steps, bad);
  const expected = textOf("expected", { required: kind === "bug" });
  if (kind === "bug") {
    if (steps.at(-1).expected) bad(`steps[${steps.length - 1}].expected`, "and the bug's expected both give the last step's expected result — keep one");
    steps.at(-1).expected = expected;
  } else if (expected) {
    const lines = numbered(source.expected);
    if (!lines) {
      if (steps.at(-1).expected) bad("expected", `is one text for the last step, which has its own expected too — keep one`);
      steps.at(-1).expected = expected;
    } else {
      let last = 0;
      for (const { n, text } of lines) {
        if (n <= last || n > steps.length) bad("expected", `numbers its lines by step — "${n}." is ${n > steps.length ? `past the last step (${steps.length})` : "out of order"}`);
        if (steps[n - 1].expected) bad("expected", `line "${n}." and steps[${n - 1}].expected both give step ${n}'s expected result — keep one`);
        if (!text) bad("expected", `line "${n}." is empty`);
        steps[n - 1].expected = text;
        last = n;
      }
    }
  }
  return {
    shown,
    id,
    title: textOf("title", { required: true }),
    precondition: textOf("precondition"),
    priority: textOf("priority", { number: true }),
    severity: textOf("severity"),
    steps,
    actual: kind === "bug" ? textOf("actual", { required: true }) : undefined,
  };
}

/** A source's steps: a list of texts or { action, expected? }, or one text of numbered lines. */
function stepsOf(value, bad) {
  if (typeof value === "string") {
    const items = numbered(value);
    if (!items?.length || items.some(({ n }, index) => n !== index + 1)) bad("steps", 'as one text is numbered lines in order — "1. …", "2. …"');
    if (items.some(({ text }) => !text)) bad("steps", "has an empty numbered line");
    return items.map(({ text }) => ({ action: text }));
  }
  if (!Array.isArray(value) || !value.length) bad("steps", "is missing or empty — a list of steps, or one text of numbered lines");
  return value.map((step, index) => {
    const at = `steps[${index}]`;
    if (typeof step === "string") return one(step) ? { action: one(step) } : bad(at, "is empty");
    if (!step || typeof step !== "object" || Array.isArray(step)) bad(at, 'is a text or { "action", "expected"? }');
    for (const key of Object.keys(step)) if (!["action", "expected"].includes(key)) bad(`${at}.${key}`, 'is not a field of a step — { "action", "expected"? }');
    if (typeof step.action !== "string" || !one(step.action)) bad(`${at}.action`, "is missing — the step in the source's words");
    if (step.expected !== undefined && step.expected !== null && typeof step.expected !== "string") bad(`${at}.expected`, "is a text");
    return { action: one(step.action), expected: step.expected ? one(step.expected) || undefined : undefined };
  });
}

/**
 * The Value line: what the source gives (severity, priority), the rest the template's choices. A word
 * outside the plan's scale stays the choice, the source's word beside it — `Priority: P1 | P2 | P3
 * (TMS: "High")` — so spec:draft refuses the block until the agent picks.
 */
function valueOf({ severity, priority }, source) {
  const [value, severities, priorities] = PLACEHOLDER.value.split(" · ");
  const pick = (given, scale, choice) => (!given ? choice : scale.test(given) ? `${choice.split(":")[0]}: ${given}` : `${choice} (${source}: "${given}")`);
  return [value, pick(severity, /^(Critical|Major|Minor)$/, severities), pick(priority, /^P[123]$/, priorities)].join(" · ");
}

export function main(argv) {
  const call = parse(argv);
  const kind = call.bug ? "bug" : "case";
  const source = readSource(call[kind], kind);
  const notes = [];
  if (source.severity && !/^(Critical|Major|Minor)$/.test(source.severity)) notes.push(`! Severity "${source.severity}" is the source's word — left as the plan's choice Critical | Major | Minor (.cursor/rules/01-workflow.mdc §Severity): pick its match`);
  if (source.priority && !/^P[123]$/.test(source.priority)) notes.push(`! Priority "${source.priority}" is the source's word — left as the plan's choice P1 | P2 | P3 (.cursor/rules/plans.mdc §Rating): pick its match`);
  if (!source.shown.startsWith("state/")) notes.push(`! ${source.shown} is outside state/ — a source is kept in the gitignored state/sources/, never committed`);
  notes.push(`! The values its steps name are the ${kind}'s words — each a rule or an example (.cursor/rules/data-and-fixtures.mdc §Data sources); Data: says which`);

  let steps = source.steps;
  const draft = { plan: call.plan, owner: call.owner, why: call.why, role: call.role, tags: call.tags, rules: call.rules, preconditions: source.precondition, value: valueOf(source, kind === "bug" ? "tracker" : "TMS") };
  if (kind === "case") {
    let basis = `case ${source.id}`;
    if (call.take) {
      const [, from, to = from] = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(call.take) ?? [];
      if (!from) stop(`--take is <n> or <n>-<m>, steps of the case — not "${call.take}"`);
      const [first, last] = [Number(from), Number(to)];
      if (first < 1 || last < first || last > steps.length) stop(`--take ${call.take}: the case has steps 1–${steps.length}`);
      steps = steps.slice(first - 1, last);
      basis = `case ${source.id} ${first === last ? `step ${first}` : `steps ${first}–${last}`}`;
    }
    Object.assign(draft, { ids: [source.id], title: call.scenario ? `${call.scenario} · ${call.title}` : source.title, basis });
  } else {
    Object.assign(draft, {
      ids: [],
      title: call.title ?? `<Title — the outcome ${source.id} expects, in one sentence>`,
      tmsWord: "not yet documented",
      basis: `bug ${source.id}`,
      rules: call.rules ?? `<each check: rule of the routes> — ${source.id} (its expected result)`,
      after: [`- Seen: ${source.actual} — ${source.id} "${source.title}": the bug's behaviour, never an expect`],
    });
    notes.push(`! While ${source.id} is open its test fails at its step — then a row in specs/known-bugs.md (.cursor/rules/plans.mdc §Known bugs); fixed, it passes`);
  }
  Object.assign(draft, { steps: steps.map(({ action }) => action), expects: steps.map(({ expected }) => expected) });

  const [number] = caseIds(String(source.id));
  const held = (blocks) => {
    if (kind === "bug") {
      const found = blocks.find(({ text }) => new RegExp(`^- Why:\\s*bug ${source.id.replace(/[.]/g, "\\.")}\\b`, "m").test(text));
      return found && `bug ${source.id} is block #${found.n} already ("${found.title}") — a source given again is never written again`;
    }
    const mine = blocks.filter(({ text }) => number !== undefined && caseIds(/TMS:\s*([^\n·]+)/.exec(text)?.[1] ?? "").includes(number));
    if (!call.scenario) {
      const found = mine[0];
      return found && `${source.id} is block #${found.n} already ("${found.title}") — a case given again is never written again; another scenario of it: --scenario S<k> --title "<what it proves>" [--take <n>-<m>]`;
    }
    const whole = mine.find(({ title }) => !scenarioOf(title));
    if (whole) return `${source.id} is block #${whole.n} as one scenario ("${whole.title}") — splitting it reworks that block (.cursor/rules/plans.mdc §When the product changes), not a block more`;
    const same = mine.find(({ title }) => scenarioOf(title) === call.scenario);
    return same && `${source.id} · ${call.scenario} is block #${same.n} already ("${same.title}")`;
  };
  appendBlock(draft, { held, notes });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
