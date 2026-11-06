/**
 * A test's skeleton from its plan block — the implement skill (Naming) and .cursor/rules/specs.mdc (the
 * shape of a test, Titles, Steps, Tags and annotations): the title, its tags and case link, the role
 * (`test.use({ role })` when not the app's default), one `test.step` per plan step in the case's words —
 * the check step reading "verify", Setup: / Cleanup: steps as the block has them — and in each step its
 * route and expectation as comments, for the agent to replace with the code. Nothing beyond the block.
 * Written into the owner's spec: appended in its test.describe (a role's tests in that role's
 * describe), or the file created with the imports it uses. It type-checks; it checks nothing yet — the
 * gate says so until each step is written.
 *
 *   npm run spec:draft -- <plan> <#>
 *
 * Exit 0: written · 1: nothing written, the last line says why (a field still holding the template's
 * placeholder, a test of that title already written, …).
 */
import fs from "node:fs";
import path from "node:path";
import { caseIds } from "../gate/plans.mjs";
import { isVisualCheckpoint, testsOf } from "../gate/specs.mjs";
import { PLACEHOLDER, planPlace, posix } from "./plan-block.mjs";

const ROOT = process.cwd();
const USAGE = "npm run spec:draft -- <plan> <#>";
const LAYER = { API: "api", UI: "ui", E2E: "e2e" };
const isPrep = (title) => /^(Setup|Cleanup):/.test(title);
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const quote = (text) => JSON.stringify(text);
const notes = [];

function stop(message) {
  console.log(`spec:draft: nothing written — ${message}`);
  process.exit(1);
}

// ── The block ──────────────────────────────────────────────────────────────────────────────────────
/** Block #n of the plan's ## Test cases: title, fields (a field's wrapped lines joined) and steps with their expect. */
function readBlock(text, number) {
  const section = /^## Test cases[ \t]*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text)?.[1];
  if (section === undefined) stop('the plan has no "## Test cases" section');
  const raw = section.split(/^### /m).slice(1).find((block) => new RegExp(`^${number}\\.\\s`).test(block));
  if (!raw) stop(`the plan has no block #${number} — its blocks: ${[...section.matchAll(/^### (\d+)\./gm)].map(([, n]) => `#${n}`).join(", ") || "none yet"}`);
  const [first, ...lines] = raw.replace(/\s+$/, "").split("\n");
  const block = { title: first.replace(/^\d+\.\s*/, "").trim(), fields: [], steps: [] };
  let field = null;
  let step = null;
  for (const line of lines) {
    const named = /^- ([A-Za-z][\w ]*?(?: \(step \d+\))?):\s?(.*)$/.exec(line);
    if (named) {
      field = { key: named[1], value: named[2].trim() };
      block.fields.push(field);
      step = null;
      continue;
    }
    if (field?.key === "Steps") {
      const numbered = /^\s+(\d+)\.\s+(.*)$/.exec(line);
      const expect = /^\s+- expect:\s*(.*)$/.exec(line);
      if (numbered) block.steps.push((step = { n: Number(numbered[1]), text: numbered[2].trim(), expect: "", inExpect: false }));
      else if (expect && step) Object.assign(step, { expect: expect[1].trim(), inExpect: true });
      else if (step && line.trim()) step[step.inExpect ? "expect" : "text"] += ` ${line.trim()}`;
    } else if (field && /^\s+\S/.test(line)) field.value += ` ${line.trim()}`;
  }
  const value = (key) => block.fields.find((each) => each.key === key)?.value;
  const level = Object.fromEntries(
    (value("Level") ?? "")
      .split(/\s+·\s+/)
      .map((segment, index) => (index === 0 ? ["Level", segment] : /^(\w+):\s*(.*)$/.exec(segment)?.slice(1) ?? []))
      .filter((pair) => pair.length === 2),
  );
  const routes = block.fields.flatMap(({ key, value: line }) => {
    const route = /^Route(?: \(step (\d+)\))?$/.exec(key);
    return route ? [{ step: route[1] ? Number(route[1]) : null, line }] : [];
  });
  return { ...block, value, level, routes };
}

/** What the skeleton takes from the block, or the fields still holding the template's words. */
function draftOf(block) {
  const { level, value } = block;
  const unfilled = [];
  if (/^<Title\b/.test(block.title)) unfilled.push("the title");
  const owner = /^(API|UI|E2E)\b/.exec(level.Level ?? "")?.[1];
  if (!owner || (level.Level ?? "").startsWith(PLACEHOLDER.owner)) unfilled.push("Level (its one owner)");
  const role = /^[a-z0-9]+(?:-[a-z0-9]+)*/.exec(level.Role ?? "")?.[0];
  if (!role) unfilled.push("Role");
  if (!level.TMS || level.TMS === PLACEHOLDER.tms) unfilled.push("TMS (the case id, not yet documented, or —)");
  const severity = /Severity:\s*(Critical|Major|Minor)\b(?!\s*\|)/.exec(value("Value") ?? "")?.[1];
  // A choice left anywhere on the line ("Core | Common | …", a TMS word beside it) — a drafted block fills only what its source gives.
  if (!severity || (value("Value") ?? "").includes("|")) unfilled.push("Value · Severity · Priority");
  if (!block.routes.length || block.routes.some(({ line }) => line.startsWith(PLACEHOLDER.routeOfStep.slice(0, -1)))) unfilled.push("Route");
  if (!block.steps.length || block.steps.some(({ text, expect }) => text === PLACEHOLDER.step || expect === PLACEHOLDER.expect)) unfilled.push("Steps (each and its expect)");
  const data = value("Data");
  if (!data || data === PLACEHOLDER.data) unfilled.push("Data");
  const cleanup = value("Cleanup");
  if (!cleanup || cleanup === PLACEHOLDER.cleanup) unfilled.push("Cleanup");
  if (unfilled.length) stop(`block "${block.title}" still holds the plan template's words in: ${unfilled.join("; ")} — fill them from the live check first (the plan skill §5)`);
  const status = value("Status") ?? "";
  if (!/^ready/i.test(status)) stop(`"${block.title}" is ${status || "without a Status"} — only a scenario ready to implement now gets its test`);
  const tags = [...new Set([`@${LAYER[owner]}`, ...[...(level.Tag ?? "").replace(/\[[^\]]*\]/g, "").matchAll(/@[a-z0-9-]+/gi)].map(([tag]) => tag.toLowerCase())])];
  return { title: block.title, owner, layer: LAYER[owner], role, ids: caseIds(level.TMS), severity: severity.toLowerCase(), tags, data, cleanup, steps: block.steps, routes: block.routes };
}

// ── The map: the app's default role, its case link ────────────────────────────────────────────────
const mapText = () => {
  const file = path.join(ROOT, "specs", "project-map.md");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : "";
};

/** The app's ```auth block as key → values (src/setup/map-block.ts): its own, else the one without `platform:`. */
function authBlock(app) {
  const blocks = [...mapText().matchAll(/```auth\n([\s\S]*?)```/g)].map(([, body]) => {
    const entries = new Map();
    for (const line of body.split("\n").map((each) => each.trim()).filter((each) => each && !each.startsWith("#") && each.includes(":"))) {
      const at = line.indexOf(":");
      const key = line.slice(0, at).trim();
      entries.set(key, [...(entries.get(key) ?? []), line.slice(at + 1).trim()]);
    }
    return entries;
  });
  return blocks.find((block) => block.get("platform")?.[0] === app) ?? blocks.find((block) => !block.has("platform"));
}

/** The role a test runs as without test.use — src/setup/auth/auth-config.ts's defaultRole, `sign-in like` followed. */
function defaultRoleOf(app) {
  const chain = [];
  for (let name = app; name && !chain.some(({ platform }) => platform === name); ) {
    const block = authBlock(name);
    if (!block) break;
    chain.push({ platform: name, block });
    name = block.get("sign-in like")?.[0];
  }
  const one = (key) => chain.map(({ block }) => block.get(key)?.[0]).find((each) => each !== undefined);
  const listed = (one("roles") ?? "").split(",").map((role) => role.trim()).filter(Boolean);
  const signsIn = [one("ui"), one("api")].some((mode) => mode !== undefined && mode !== "none");
  const accounts = chain.flatMap(({ block }) => [...block.keys()].map((key) => /^login ([a-z0-9-]+)$/.exec(key)?.[1]).filter(Boolean));
  return one("default role") ?? listed[0] ?? (signsIn ? "user" : accounts[0]) ?? "none";
}

/** What caseLinks() takes: the cases' folder when the app's case link has {folder} — from the specs beside, else the plan's folder link. */
function folderArg(app, plan, specDirs) {
  const links = Object.fromEntries([...mapText().matchAll(/^- case link(?: ([a-z0-9-]+))?:[ \t]*(\S+)/gm)].map(([, owner, link]) => [owner ?? "", link]));
  const link = links[app] ?? links[""];
  if (!link) {
    notes.push(`specs/project-map.md §Test cases (TMS) has no "case link ${app}:" line — caseLinks() throws until it has (the plan skill adds it from the first case link pasted)`);
    return "";
  }
  if (!link.includes("{folder}")) return "";
  for (const dir of specDirs.filter((each) => fs.existsSync(each))) {
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".spec.ts"))) {
      const given = /\bcaseLinks\(([^)]+)\)/.exec(fs.readFileSync(path.join(dir, file), "utf8"))?.[1];
      if (given) return given.trim();
    }
  }
  const prefix = link.slice(0, link.indexOf("{folder}")).replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
  const named = new RegExp(`${prefix}([^/?#\\s)\`]+)`).exec(plan)?.[1];
  if (named) return /^\d+$/.test(named) ? named : quote(named);
  notes.push(`${app}'s case link has {folder} and neither the plan nor the specs beside it name the cases' folder — fill caseLinks("<folder>")`);
  return quote("<folder>");
}

// ── The test ───────────────────────────────────────────────────────────────────────────────────────
/** A plan step as a step title: the case's words, its looking verb ("review", "look at", "check", "compare") reading "verify". */
function stepTitle(text) {
  let title = capital(text.replace(/`([^`]*)`/g, "$1").replace(/\s+/g, " ").trim().replace(/[.;,]\s*$/, ""));
  if (isPrep(title)) return title;
  title = title.replace(/^(?:Review|Look at|Check|Compare)\s+/, "Verify ");
  const joins = [...title.matchAll(/(?:;|,\s*then)\s+(?:review|look at|check|compare)\s+/gi)];
  const last = joins.at(-1);
  if (last) title = `${title.slice(0, last.index)} and verify ${title.slice(last.index + last[0].length)}`;
  return title;
}

const comment = (label, text) => `// ${label}: ${text.replace(/\s+/g, " ").trim()}`;

/** The test, as its lines from column 0. */
function testLines(draft) {
  const steps = draft.steps.map((step) => ({ ...step, title: stepTitle(step.text), lines: [] }));
  const acting = steps.filter(({ title }) => !isPrep(title));
  if (acting.length && !acting.some(({ title }) => /\bverify\b/i.test(title))) {
    acting.at(-1).title += " and verify <…>";
    notes.push(`step ${acting.at(-1).n} reads "… and verify <…>" — name what it verifies (the implement skill, Naming)`);
  }
  const top = [];
  for (const { step, line } of draft.routes) {
    const into = step === null ? acting[0] : steps.find(({ n }) => n === step);
    (into ? into.lines : top).push(comment(into || step === null ? "Route" : `Route (step ${step}, which the plan lacks)`, line));
  }
  for (const step of steps) if (step.expect) step.lines.push(comment("expect", step.expect));
  const annotation = [`severity.${draft.severity}`, ...draft.ids.map((id) => `tms(${id})`)];
  const options = `{ tag: [${draft.tags.map(quote).join(", ")}], annotation: ${annotation.length > 1 ? `[${annotation.join(", ")}]` : annotation[0]} }`;
  const head = [...(/^none\b/i.test(draft.data) ? [] : [comment("Data", draft.data)]), ...(/^none\b/i.test(draft.cleanup) ? [] : [comment("Cleanup", draft.cleanup)]), ...top];
  return [
    "test(",
    `  ${quote(draft.title)},`,
    `  ${options},`,
    "  async () => {",
    ...head.map((line) => `    ${line}`),
    ...steps.flatMap(({ title, lines }) => [`    await test.step(${quote(title)}, async () => {`, ...lines.map((line) => `      ${line}`), "    });"]),
    "  },",
    ");",
  ];
}

/** A role's tests sit in a describe of their own, so the tests after them keep the default role. */
const roleDescribe = (role, test) => [`test.describe(${quote(role === "none" ? "Signed out" : `As ${role}`)}, () => {`, `  test.use({ role: ${quote(role)} });`, "", ...test.map((line) => (line ? `  ${line}` : line)), "});"];
const indented = (lines, by) => lines.map((line) => (line ? `${" ".repeat(by)}${line}` : line)).join("\n");

// ── The spec ───────────────────────────────────────────────────────────────────────────────────────
/** The offset where the bracket opened at `from` closes — strings, comments and template literals skipped. */
function closeOf(source, from) {
  const templates = [];
  let depth = 0;
  let mode = null;
  for (let at = from; at < source.length; at += 1) {
    const [char, next] = [source[at], source[at + 1]];
    if (mode === "//") {
      if (char === "\n") mode = null;
    } else if (mode === "/*") {
      if (char === "*" && next === "/") [mode, at] = [null, at + 1];
    } else if (mode === "'" || mode === '"') {
      if (char === "\\") at += 1;
      else if (char === mode || char === "\n") mode = null;
    } else if (mode === "`") {
      if (char === "\\") at += 1;
      else if (char === "`") mode = null;
      else if (char === "$" && next === "{") {
        templates.push(depth);
        [depth, mode, at] = [depth + 1, null, at + 1];
      }
    } else if (char === "/" && (next === "/" || next === "*")) [mode, at] = [`/${next}`, at + 1];
    else if (char === "'" || char === '"' || char === "`") mode = char;
    else if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) {
      depth -= 1;
      if (templates.length && depth === templates.at(-1)) {
        templates.pop();
        mode = "`";
      } else if (depth === 0) return at;
    }
  }
  return -1;
}

const lineStartAt = (source, offset) => source.lastIndexOf("\n", offset - 1) + 1;
const indentAt = (source, offset) => /^[ \t]*/.exec(source.slice(lineStartAt(source, offset)))[0].length;

/** Each test.describe of the spec: where it starts, its indentation, and where its body's closing line starts. */
function describesOf(source) {
  return [...source.matchAll(/\btest\.describe\(/g)].flatMap((match) => {
    const close = closeOf(source, match.index + "test.describe".length);
    const brace = source.slice(0, close).search(/\}\s*,?\s*$/);
    return close === -1 || brace === -1 ? [] : [{ start: match.index, close, indent: indentAt(source, match.index), bodyEnd: lineStartAt(source, brace) }];
  });
}

/** The end of the import statements (offset), 0 when there are none. */
const importsEnd = (source) => [...source.matchAll(/^import\b(?:[\s\S]*?\bfrom\s*)?["'][^"'\n]+["'];?[ \t]*$/gm)].reduce((end, match) => match.index + match[0].length, 0);

function withImports(source, draft, app, tmsLine) {
  let text = source;
  const fixtures = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']src/fixtures/${app}/test["'];?`);
  if (draft.ids.length && !/\bconst\s+tms\s*=\s*caseLinks\(/.test(text)) {
    const found = fixtures.exec(text);
    if (found) {
      const names = [...new Set([...found[1].split(",").map((name) => name.trim()).filter(Boolean), "caseLinks"])].sort();
      text = text.replace(found[0], `import { ${names.join(", ")} } from "src/fixtures/${app}/test";`);
    } else text = `import { caseLinks } from "src/fixtures/${app}/test";\n${text}`;
  }
  if (!/from\s*["']src\/reporting\/severity["']/.test(text)) {
    const end = importsEnd(text);
    text = `${text.slice(0, end)}${end ? "\n" : ""}import { severity } from "src/reporting/severity";${end ? "" : "\n"}${text.slice(end)}`;
  }
  if (draft.ids.length && !/\bconst\s+tms\s*=\s*caseLinks\(/.test(text)) {
    const end = importsEnd(text);
    text = `${text.slice(0, end)}\n\n${tmsLine()}${text.slice(end)}`;
  }
  return text;
}

/** The test put into the spec's text: in the describe of its role, else at the end of the top describe (or the file). */
function appended(source, draft, test, defaultRole) {
  const describes = describesOf(source);
  const inner = (offset) => describes.filter(({ start, close }) => start < offset && offset < close).sort((a, b) => b.start - a.start)[0];
  const insert = (offset, text) => `${source.slice(0, offset)}\n${text}\n${source.slice(offset)}`;
  if (draft.role !== defaultRole) {
    const use = new RegExp(`test\\.use\\(\\s*\\{[^}]*\\brole\\s*:\\s*["'\`]${draft.role}["'\`]`).exec(source);
    const home = use && inner(use.index);
    if (home) return { text: insert(home.bodyEnd, indented(test, indentAt(source, use.index))), where: `appended in its role's test.describe` };
  }
  const lines = draft.role === defaultRole ? test : roleDescribe(draft.role, test);
  const top = describes.find(({ indent }) => indent === 0);
  if (top) return { text: insert(top.bodyEnd, indented(lines, 2)), where: "appended in its test.describe" };
  return { text: `${source.replace(/\s+$/, "")}\n\n${indented(lines, 0)}\n`, where: "appended at its end" };
}

/** How a route's answer is read in the test (docs/Layer Routing Algorithm.md §7) — one line per kind the block's routes use. */
function routeNotes(routes) {
  const kinds = new Set(routes.map(({ line }) => /^(api|intercept|no-request|screen-only)\b/.exec(line)?.[1]).filter(Boolean));
  return [
    ...(kinds.has("intercept") ? ["an intercept route: the action's answer through answerTo / answersTo (src/fixtures/pages.fixture.ts) — never a second read of it"] : []),
    ...(kinds.has("api") ? ["an api route: the call through the app's bound client, its answer through expectJson / expectStatus (src/assertions/shared/http.ts)"] : []),
    ...(kinds.has("no-request") || kinds.has("screen-only") ? ["a no-request / screen-only route listens to nothing — the screen's checks only"] : []),
  ];
}

function main(argv) {
  const [given, number, ...rest] = argv;
  if (!given || !/^\d+$/.test(number ?? "") || rest.length) stop(`name the plan and the block's number\n${USAGE}`);
  const place = planPlace(given);
  if (!place) stop(`${posix(given)} is not a plan — specs/<app>/<area>/<feature>/<feature>.md, or a journey's specs/e2e/<app>/<area>/<journey>.md`);
  if (!fs.existsSync(path.join(ROOT, place.file))) stop(`no plan at ${place.file}`);
  const plan = fs.readFileSync(path.join(ROOT, place.file), "utf8").replace(/\r\n/g, "\n");
  const draft = draftOf(readBlock(plan, Number(number)));
  const app = place.platform;

  if (place.kind === "journey" && draft.owner !== "E2E") stop(`a journey plan's scenario is E2E — "${draft.title}" says ${draft.owner}`);
  if (place.kind === "feature" && draft.owner === "E2E") stop(`an E2E scenario has a journey plan of its own (specs/e2e/${app}/${place.area}/<journey>.md) and its spec tests/e2e/${app}/${place.area}/<journey>.e2e.spec.ts (.cursor/rules/plans.mdc §E2E journeys)`);
  if (!fs.existsSync(path.join(ROOT, "src", "fixtures", app, "test.ts"))) stop(`${app} has no fixtures of its own yet — npm run app:add -- ${app}, then draft again`);
  const spec =
    place.kind === "journey" ? `tests/e2e/${app}/${place.area}/${place.name}.e2e.spec.ts` : `tests/${draft.layer}/${app}/${place.area}/${place.name}/${place.name}.${draft.layer}.spec.ts`;

  // A scenario's test is written once: never again in its own spec, nor anywhere else in the app. A
  // screenshot checkpoint in its own -visual spec is not a second test of it (.cursor/rules/specs.mdc).
  for (const layer of ["api", "ui", "e2e"]) {
    const dir = path.join(ROOT, "tests", layer, app);
    const specs = fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).map(String).filter((name) => name.endsWith(".spec.ts")) : [];
    for (const name of specs) {
      const tests = testsOf(fs.readFileSync(path.join(dir, name), "utf8")).filter(({ tags }) => !isVisualCheckpoint(posix(name), tags));
      if (tests.some(({ title }) => title === draft.title)) stop(`"${draft.title}" is written already — tests/${layer}/${app}/${posix(name)}`);
    }
  }

  const full = path.join(ROOT, spec);
  const specDirs = [...new Set(["api", "ui", "e2e"].map((layer) => path.dirname(path.join(ROOT, spec.replace(/^tests\/(api|ui|e2e)\//, `tests/${layer}/`)))))];
  const tmsLine = () => `const tms = caseLinks(${folderArg(app, plan, specDirs)});`;
  const defaultRole = defaultRoleOf(app);
  const test = testLines(draft);
  let text;
  let where;
  if (fs.existsSync(full)) {
    const original = fs.readFileSync(full, "utf8");
    const eol = original.includes("\r\n") ? "\r\n" : "\n";
    ({ text, where } = appended(withImports(original.replace(/\r\n/g, "\n"), draft, app, tmsLine), draft, test, defaultRole));
    text = text.replace(/\n/g, eol);
  } else {
    const heading = /^# (.+)$/m.exec(plan)?.[1]?.trim() ?? place.name;
    const imports = [`import { ${draft.ids.length ? "caseLinks, " : ""}test } from "src/fixtures/${app}/test";`, 'import { severity } from "src/reporting/severity";'];
    const body = draft.role === defaultRole ? test : roleDescribe(draft.role, test);
    text = [...imports, "", ...(draft.ids.length ? [tmsLine(), ""] : []), `test.describe(${quote(heading)}, () => {`, indented(body, 2), "});", ""].join("\n");
    where = "a new spec";
    fs.mkdirSync(path.dirname(full), { recursive: true });
  }
  fs.writeFileSync(full, text);
  console.log(
    [
      `spec:draft — #${number} "${draft.title}" → ${spec} (${where}${draft.role === defaultRole ? "" : `, as ${draft.role}`})`,
      "",
      indented(test, 0),
      "",
      ...notes.map((note) => `! ${note}`),
      ...routeNotes(draft.routes).map((note) => `· ${note}`),
      `Next: write each step — its comments name the route and what it proves; the code replaces them. Until then qa:gate fails the test (still a skeleton, checks nothing, its route).`,
    ].join("\n"),
  );
}

main(process.argv.slice(2));
