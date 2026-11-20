import fs from "node:fs";
import path from "node:path";
import { at, atBase, inProgress, read, ROOT } from "./context.mjs";
import { ANSWER_STEP, CASE_PREFIX, caseIds, caseLinksIn, casesOf, keepsOut, numberedLines, readPlans, scenarioOf, stepRangeOf } from "./plans.mjs";
import { isVisualCheckpoint, testsOf } from "./specs.mjs";

/**
 * A manual case is automated whole or not at all (the plan skill, "Whole case"): no test links a case
 * its plan keeps in Not now — blocked, postponed, an owner not in this run; only "Covered by …" leaves
 * it written — and every scenario of a written case has its test. A plan written before routing
 * (`Needs:` instead of `Route:`) is held to its layers, as it was written.
 */
function checkWholeCases(files, report) {
  const plans = readPlans(ROOT);
  if (plans.length === 0) return;
  const testsOfCase = new Map();
  for (const spec of [...files.api, ...files.ui, ...files.e2e]) {
    const [layer, app] = path.relative(at("tests"), spec).split(path.sep);
    for (const { title, options, tags } of testsOf(read(spec))) {
      for (const id of caseLinksIn(options)) {
        const key = `${app}|${id}`;
        // A screenshot checkpoint of its own file links the case, but proves none of its scenarios.
        const scenario = isVisualCheckpoint(spec, tags) ? null : scenarioOf(title);
        testsOfCase.set(key, [...(testsOfCase.get(key) ?? []), { spec, title, layer: layer.toUpperCase(), scenario }]);
      }
    }
  }
  for (const { plan, app, cases, notNow } of plans) {
    const keptOut = new Map();
    for (const line of notNow.filter(keepsOut)) {
      for (const id of line.ids) keptOut.set(id, [...new Set([...(keptOut.get(id) ?? []), line.status])]);
    }
    for (const [id, reasons] of keptOut) {
      for (const test of testsOfCase.get(`${app}|${id}`) ?? []) {
        report.fail(
          test.spec,
          `"${test.title}" links case ${id}, which ${plan} keeps in Not now (${reasons.join(", ")}) — a case is written whole or not at all: drop the link, and the test when it checks nothing else, or cover every step and take the case out of Not now (the plan skill, "Whole case")`,
        );
      }
    }
    // A routed case: every ready scenario has its test (one test, its owner's — routes.mjs and
    // repeats.mjs check which and how many). A case with a scenario written has them all.
    const ready = cases.filter((entry) => entry.route && /^ready/i.test(entry.status));
    for (const { ids, scenario, title } of ready) {
      for (const id of ids) {
        const tests = testsOfCase.get(`${app}|${id}`) ?? [];
        if (!tests.length || tests.some((test) => test.scenario === scenario)) continue;
        report.fail(
          at(...plan.split("/")),
          `case ${id} is written in part — "${title}" has no test, while ${tests.length} test(s) link the case: write it, or move the case to Not now (not in this run, or what blocks it) and drop its tests' link (the plan skill, "Whole case")`,
        );
      }
    }
    // A plan written before routing: a case planned as several blocks (its API and UI sides) repeats its Needs line — one finding.
    const seen = new Set();
    for (const { ids, needs } of cases.filter((entry) => !entry.route && entry.needs && /^ready/i.test(entry.status))) {
      for (const id of ids.filter((value) => !seen.has(value))) {
        seen.add(id);
        const tests = testsOfCase.get(`${app}|${id}`) ?? [];
        const missing = tests.length ? needs.filter((layer) => !tests.some((test) => test.layer === layer)) : [];
        if (missing.length) {
          report.fail(
            at(...plan.split("/")),
            `case ${id} needs ${needs.join("+")}, and no ${missing.join("+")} test links it — write it, or move the case to Not now and drop its other tests' link (the plan skill, "Whole case"); a refresh of the feature routes its scenarios (docs/Layer Routing Algorithm.md)`,
          );
        }
      }
    }
  }
}

/**
 * A feature plan with UI cases has decided browsers, phone and screenshots from the stand's evidence (the plan
 * skill, "Browsers, phone, screenshots"), and its cases' tags say the same as its decisions.
 */
function checkBrowsersPhoneScreens(_files, report) {
  const kinds = [
    ["browsers", "@cross-browser"],
    ["phone", "@responsive"],
  ];
  for (const { plan, journey, cases, otherChecks } of readPlans(ROOT)) {
    if (journey || !cases.some((entry) => entry.level === "UI")) continue;
    const file = at(...plan.split("/"));
    const missing = ["browsers", "phone", "screenshots"].filter((name) => !otherChecks?.[name]);
    if (missing.length) {
      report.fail(
        file,
        `has UI cases but no ${missing.map((name) => `"${name}:"`).join(", ")} line in "## Browsers, phone, screenshots" — run the probe of live-app.md on its screens and record each decision, or "none — <what was checked>" (the plan skill, "Browsers, phone, screenshots")`,
      );
      continue;
    }
    for (const [name, tag] of kinds) {
      const decision = otherChecks[name];
      const named = new Set([...decision.matchAll(new RegExp(`#(\\d+)\\s*${tag}`, "g"))].map((match) => match[1]));
      for (const entry of cases.filter((each) => each.tags.includes(tag) && !named.has(each.number))) {
        report.fail(file, `case #${entry.number} is tagged ${tag}, but "${name}:" does not name it ("#${entry.number} ${tag} — <why>") — the decision and the tag say the same`);
      }
      for (const number of named) {
        if (!cases.some((each) => each.number === number && each.tags.includes(tag))) report.fail(file, `"${name}:" names #${number} ${tag}, but that case's Tag line has no ${tag}`);
      }
    }
  }
}

/**
 * A case is Blocked only after the search (the plan skill, "Searched before blocked"): its Not now
 * reason ends " · searched: <place>; <place>" or " · searched: none (<why>)". A warning while plans
 * written before the rule catch up.
 */
function checkBlockedSearched(files, report) {
  for (const { plan, notNow } of readPlans(ROOT)) {
    const unsearched = notNow.filter(({ status, searched }) => status === "blocked" && !searched);
    if (!unsearched.length) continue;
    const named = unsearched.map(({ ids, title }) => (ids.length ? ids.join(", ") : `"${title}"`)).join("; ");
    report.warn(
      at(...plan.split("/")),
      `${unsearched.length} Blocked line(s) do not say where the tests looked (${named}) — end the reason with " · searched: <place>; <place>", or " · searched: none (<why>)" where no search lifts it (the plan skill, "Searched before blocked")`,
    );
  }
}

/**
 * A plan with a case ready to implement holds none of the plan body's `<…>` (plans.md §Plan body): each is
 * filled from the live check and the sources, or its line is dropped — never a ready case shown to the user over
 * "<what was checked>". A code span (`<script>`) is not one.
 */
function checkPlanPlaceholders(files, report) {
  const changed = inProgress("specs");
  for (const { plan, cases } of readPlans(ROOT)) {
    if (!cases.some(({ status }) => /^ready/i.test(status))) continue;
    const file = at(...plan.split("/"));
    const lines = read(file).replace(/\r\n/g, "\n").replace(/^```[\s\S]*?^```/gm, (block) => block.replace(/[^\n]/g, " ")).split("\n");
    const left = lines.flatMap((line, index) => [...line.replace(/`[^`]*`/g, "").matchAll(/<[^\s<>][^<>]*>/g)].map(([text]) => `${index + 1}: ${text}`));
    if (!left.length) continue;
    const say = !changed || changed.has(file) ? report.fail : report.warn;
    say(file, `holds ${left.length} <…> of the plan template (${left.slice(0, 4).join(" · ")}${left.length > 4 ? " …" : ""}) — fill each from the live check and the sources, or drop its line (plans.md §Plan body)`);
  }
}

/** A block's key across versions: its case ids and scenario (a title may be retold), else its title. */
const keyOf = ({ ids, scenario, title }) => (ids.length ? `${ids.join(",")}|${scenario}` : title);
/** A block's text without its "### <n>." line: a block moved down a number is the same block. */
const bodyOf = (text) => text.split("\n").slice(1).join("\n").trimEnd();

/** A plan text's `## API brief`, its lines trimmed — "" without it. */
const briefOf = (text) => (/^## API brief\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text.replace(/\r\n/g, "\n"))?.[1] ?? "").trim();

let progress;
/**
 * The plans being written on this branch (new or changed since the default branch, or in the working tree),
 * each with `isNew` (no such plan where the branch began; a plan renamed on the branch is read at its old name),
 * its blocks that are new (`fresh`: no block of that case and scenario there) or changed (`touched`: new, or its
 * text differs, its number aside), and `briefChanged` (its `## API brief` differs). A plan the branch left alone
 * — renamed, or only its change log touched — keeps what it had. Read once per run.
 */
function plansInProgress() {
  if (progress) return progress;
  const changed = inProgress("specs");
  progress = !changed
    ? []
    : readPlans(ROOT)
        .filter(({ file }) => changed.has(file))
        .map((plan) => {
          const before = atBase(plan.file);
          // Two blocks may share a key (a case planned twice): each keeps its own text.
          const was = new Map();
          for (const block of before ? casesOf(before) : []) was.set(keyOf(block), [...(was.get(keyOf(block)) ?? []), bodyOf(block.text)]);
          const fresh = plan.cases.filter((block) => !was.has(keyOf(block)));
          const touched = plan.cases.filter((block) => !was.get(keyOf(block))?.includes(bodyOf(block.text)));
          return { ...plan, isNew: !before, fresh, touched, briefChanged: !before || briefOf(before) !== plan.brief.trim() };
        });
  return progress;
}

/** A plan in progress by its file — undefined for a plan the branch left alone. */
const inProgressPlan = (file) => plansInProgress().find((plan) => plan.file === file);

/** The case ids a `- Drafted from:` source holds: its JSON's id when the file is here, else its file name's — [] when neither says. */
function sourceIds(drafted) {
  const file = path.resolve(ROOT, drafted);
  try {
    const { id } = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
    if (id !== undefined && id !== null) return caseIds(String(id));
  } catch {
    // not here (state/ is never committed) or not JSON — the file's name says it
  }
  return caseIds(path.basename(drafted));
}

/** A header naming the plan's cases — `- Cases: <TMS> <links>`; "none" and the template's own <…> name none. */
const BUILT_FROM_CASES = /^- Cases:[ \t]*(?!none\b|<)\S/im;

/** A saved TMS case's steps (state/sources/<id>.json, plan:block --case's shape), each with its expected result: [{ n, text }]. */
function sourceSteps(file) {
  let source;
  try {
    source = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
  } catch {
    return null;
  }
  const steps = Array.isArray(source.steps)
    ? source.steps.map((step, index) => ({ n: index + 1, text: typeof step === "string" ? step : `${step.action ?? ""} ${step.expected ?? ""}` }))
    : (numberedLines(source.steps) ?? []);
  const expected = numberedLines(source.expected);
  for (const { n, text } of expected ?? []) {
    const step = steps.find((each) => each.n === n);
    if (step) step.text = `${step.text} ${text}`;
  }
  if (source.expected && !expected && steps.length) steps.at(-1).text = `${steps.at(-1).text} ${source.expected}`;
  return steps;
}

/**
 * A TMS case's block is drafted from its saved source (plans.md §TMS cases): `plan:block --case` copies the
 * case's words and marks the steps that read the server's answer; a block typed by hand loses both. In a plan
 * built from TMS cases — its header's `- Cases: <TMS> <location>`, any TMS — a new block of a case carries the
 * command's `- Drafted from:` line, naming that case's source. A new plan whose blocks are TMS cases says where
 * they come from on that line (`none` when it only links them) — the guard is never skipped by leaving it out.
 */
function checkDraftedFromSource(_files, report) {
  for (const { plan, header, cases, fresh, isNew } of plansInProgress()) {
    const where = at(...plan.split("/"));
    if (!/^- Cases:/im.test(header)) {
      const titled = cases.filter(({ title }) => new RegExp(`^${CASE_PREFIX}\\d+\\s*·`).test(title));
      if (isNew && titled.length) {
        report.fail(
          where,
          `${titled.length} block(s) are TMS cases (${titled.map(({ title }) => title.split(" · ")[0]).join(", ")}), and the header does not say where they come from — add "- Cases: <TMS> <the folder's or the cases' links>" under the title, or "- Cases: none" when the plan only links them (plans.md §TMS cases)`,
        );
      }
      continue;
    }
    if (!BUILT_FROM_CASES.test(header)) continue;
    const typed = fresh.filter(({ ids, drafted }) => ids.length && !drafted);
    if (typed.length) {
      report.fail(
        where,
        `${typed.length} block(s) of TMS cases were not drafted from their source (${typed.map(({ title }) => `"${title.split(" · ")[0]}"`).join(", ")}) — remove each typed block, save its case as state/sources/<id>.json and add it with npm run plan:block -- ${plan} --case state/sources/<id>.json: the command copies the case's words and marks its answer steps (plans.md §TMS cases)`,
      );
    }
    const borrowed = fresh.filter(({ ids, drafted }) => {
      const named = ids.length && drafted ? sourceIds(drafted) : [];
      return named.length > 0 && !named.some((id) => ids.includes(id));
    });
    if (borrowed.length) {
      report.fail(where, `${borrowed.length} block(s) name another case's source on "- Drafted from:" (${borrowed.map(({ title, drafted }) => `"${title.split(" · ")[0]}" ← ${drafted}`).join(", ")}) — a block is drafted from its own case: npm run plan:block -- ${plan} --case state/sources/<its id>.json`);
    }
  }
}

/**
 * A case step that reads the server's answer itself (DevTools, a response — `ANSWER_STEP`) says who proves it
 * (plans.md §Layers "the answer itself"): `- Answer steps: <n> — API: …` when the answer's own fields are the
 * result (another block of the case is API), `— UI check: …` when the answer is held to the screen (this block
 * listens to it). Read in the block's steps and, when it is on this machine, in its saved source too — a block
 * retelling the step keeps it; a line present is held to its owner either way. An API block is the answer's own
 * scenario: nothing to say. A step only worded like one (a "payload limit" message on screen) is
 * `— none: <why>` — the reason in a few words.
 */
function checkAnswerSteps(_files, report) {
  for (const { plan, cases, touched } of plansInProgress()) {
    for (const block of touched) {
      const decision = block.answer ?? "";
      if (block.level === "API" && !decision) continue;
      const source = block.drafted ? path.resolve(ROOT, block.drafted) : null;
      const fromSource = source && fs.existsSync(source) ? (sourceSteps(source) ?? []) : [];
      const range = stepRangeOf(block.why);
      const reading = [...block.steps, ...fromSource.filter(({ n }) => !range || (n >= range[0] && n <= range[1]))].filter(({ text }) => ANSWER_STEP.test(text));
      if (!reading.length && !decision) continue;
      const where = at(...plan.split("/"));
      const named = reading.length
        ? `"${block.title}" — step(s) ${[...new Set(reading.map(({ n }) => n))].join(", ")} read the server's answer itself ("${ANSWER_STEP.exec(reading[0].text)[0]}")`
        : `"${block.title}" — "- Answer steps: ${decision}"`;
      const [, owner, why = ""] = /^[\d,\s–-]*?[—–-]\s*(API|UI check|none)\b[\s:—–-]*(.*)$/.exec(decision) ?? [];
      if (!decision || decision.includes("<")) {
        report.fail(where, `${named}: say who proves them — "- Answer steps: <n> — API: the answer's own fields" (an API scenario of the case) or "— UI check: the answer against the screen" (this block listens to it), or "— none: <why>" when the step does not read the answer (plans.md §Layers)`);
      } else if (owner === "API") {
        const api = block.level === "API" || cases.some((other) => other !== block && other.level === "API" && other.ids.some((id) => block.ids.includes(id)));
        if (!api) report.fail(where, `${named}: "- Answer steps" gives them to API, and no API scenario of the case is in the plan — add it (the answer's own fields are the contract, plans.md §Layers), or say "UI check" when the answer is only held to the screen`);
      } else if (owner === "UI check") {
        const listens = block.level !== "API" && block.routes.some(({ kind }) => kind === "intercept");
        if (!listens) report.fail(where, `${named}: "- Answer steps" says "UI check", and no route of the block listens to the answer — an intercept route (docs/Layer Routing Algorithm.md §7), or give them to an API scenario`);
      } else if (owner === "none") {
        if (why.split(/\s+/).filter(Boolean).length < 3) report.fail(where, `${named}: "- Answer steps: ${decision}" — say in a few words why the step does not read the server's answer ("— none: the message on screen names the payload limit")`);
      } else {
        report.fail(where, `${named}: "- Answer steps: ${decision}" names neither "API", "UI check" nor "none" right after its step numbers ("<n> — API: …")`);
      }
    }
  }
}

/**
 * An example value tested by its criterion (`Data: … case says "<value>" → <criterion>`) is a case to rewrite in
 * the TMS: the plan's `## Manual case corrections` names the case by its id as written there (plans.md §TMS cases,
 * "Case drift" 3).
 */
function checkExampleCorrections(_files, report) {
  for (const { plan, corrections, touched } of plansInProgress()) {
    // The id as a whole word (TC-101, C101), never inside another id or a date; a bare number only at a line's ids.
    const named = ({ ids, written }) =>
      written.length
        ? written.some((id) => new RegExp(`(?<![\\w-])${id}(?!\\d)`).test(corrections))
        : ids.some((id) => new RegExp(`^- (?:[^\\n—]*,\\s*)?${id}(?!\\d)`, "m").test(corrections));
    const missing = touched.filter((block) => block.ids.length && /case says "(?!<value>)/i.test(block.data ?? "") && !named(block));
    if (!missing.length) continue;
    report.fail(
      at(...plan.split("/")),
      `${missing.length} block(s) test an example value by its criterion, and "## Manual case corrections" does not name their case (${missing.map(({ title }) => title.split(" · ")[0]).join(", ")}) — add "<case id> step <n> — data "<the case's value>" → "<the criterion>"" for each (plans.md §TMS cases)`,
    );
  }
}

/**
 * A plan of more than 8 ready scenarios that is new on this branch or gains new blocks has had an independent
 * review (plans.md §Confirm before any code, `/review <plan>`) no older than its last change: its header's
 * `- Review: independent <YYYY-MM-DD> — …`. A heal or a refresh changing its blocks needs none.
 */
function checkPlanReview(_files, report) {
  for (const { plan, cases, review, newestChange, isNew, fresh } of plansInProgress()) {
    const ready = cases.filter(({ status }) => /^ready/i.test(status));
    if (ready.length <= 8 || (!isNew && !fresh.length)) continue;
    const where = at(...plan.split("/"));
    if (!review) {
      report.fail(where, `${ready.length} ready scenarios and no independent review — run /review ${plan} in a new chat before the confirm (plans.md §Confirm before any code), answer each finding, then add "- Review: independent <YYYY-MM-DD> — <n> findings, each fixed or answered" under the plan's title`);
    } else if (newestChange && newestChange > review) {
      report.fail(where, `changed on ${newestChange}, after its independent review of ${review} — review the change again (/review ${plan}) and update the "- Review:" line`);
    }
  }
}

/** A P3 case ready while the plan is written — P1 and P2 are written, P3 goes to Not now "Postponed" (plans.md §Rating). */
function checkP3Postponed(_files, report) {
  for (const { plan, touched } of plansInProgress()) {
    const p3 = touched.filter(({ status, priority }) => /^ready/i.test(status) && priority === "P3");
    if (!p3.length) continue;
    report.warn(
      at(...plan.split("/")),
      `${p3.length} P3 case(s) ready (${p3.map(({ title }) => title.split(" · ")[0]).join(", ")}) — P1 and P2 are written, a P3 case goes to Not now "Postponed" unless the user chose it (plans.md §Rating)`,
    );
  }
}

/**
 * "<METHOD> <path>" pairs a text names: `GET /api/orders/{id}`, `POST api/cart`, `GET …/orders` (a path cut short
 * with "…"), `**GET** /api/x`, a table's `| GET | /api/x |`. A path has a "/" — "a second GET with a wrong id" names none.
 */
const CALL = /\b(GET|POST|PUT|PATCH|DELETE|QUERY|HEAD|OPTIONS)\b[*`|\s]+((?:…|\.\.\.)?[\w{}<>:.-]*\/[\w{}<>:.\/-]*[\w}>])/g;
/**
 * A path as one key: no query, every parameter (`{id}`, `:id`) `{}`, a family placeholder (`<section>`) `*`, no
 * leading slash, any case; `…` kept as "a path ending so".
 */
const pathKey = (path) =>
  path
    .replace(/[?#].*$/, "")
    .replace(/<[^>]*>/g, "*")
    .replace(/\{[^}]*\}|:\w+/g, "{}")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
const callsIn = (text) => [...String(text ?? "").matchAll(CALL)].map(([, method, path]) => ({ method, key: pathKey(path.replace(/^(?:…|\.\.\.)\/?/, "")), cut: /^(?:…|\.\.\.)/.test(path) }));
/** A named call's key as a pattern: `*` — a family — one or more segments; a cut path any start. */
const keyPattern = ({ key, cut }) =>
  new RegExp(`^${cut ? "(?:.+/)?" : ""}${key.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^/]+(?:/[^/]+)*")}$`);
/** A brief's call is a route's: the same method and path — a family (`GET /api/x/<section>`) covered by any one of its members. */
const sameCall = (named, { method, key }) => named.method === method && keyPattern(named).test(key);
/** A brief's call a Not now line names — either one's path may be the other's cut short. */
const parkedCall = (named, call) => call.method === named.method && (keyPattern({ ...named, cut: true }).test(call.key) || keyPattern({ ...call, cut: true }).test(named.key));
/**
 * A call's own mark that only setup, cleanup or a lookup makes it — "— setup", "(cleanup)", "- the lookup" right
 * after it, before the next call of the line: no scenario of its own owes it.
 */
const AID = /[—–(-]\s*(?:(?:a|an|the|its|for|by)\s+)*(setup|cleanup|lookups?|look-?up|oracle|seed|sweep|undo|sign-?in)\b/i;
/** The brief's calls no mark exempts, each judged on its own part of its line. */
const briefCalls = (brief) =>
  brief.split("\n").flatMap((line) => {
    const found = [...line.matchAll(CALL)];
    return found.filter((match, index) => !AID.test(line.slice(match.index + match[0].length, found[index + 1]?.index ?? line.length))).flatMap(([text]) => callsIn(text));
  });
/** No git here: every plan is being written. Asked once. */
let gitless;
const withoutGit = () => (gitless ??= inProgress("specs") === null);

/**
 * Every call the plan's `## API brief` names is accounted for (plans.md §Plan body, §TMS cases "Gap"): a route
 * of the plan sends or reads it, a Not now line names it (a contract call no case covers is a `Gap`), or its
 * own mark says only setup, cleanup or a lookup makes it. A call left only in the brief is coverage nobody sees
 * is missing. Fails in a plan new on the branch, or whose brief or blocks the branch changed; warns in the rest.
 */
function checkApiBrief(_files, report) {
  for (const { plan, file, brief, cases, notNow } of readPlans(ROOT)) {
    const routed = cases.flatMap(({ routes }) => routes.flatMap((route) => [route, ...(route.read ? [route.read] : [])])).filter(({ method, path: route }) => method && route).map(({ method, path: route }) => ({ method, key: pathKey(route) }));
    const parked = notNow.flatMap(({ line }) => callsIn(line));
    const loose = briefCalls(brief).filter((named) => !routed.some((call) => sameCall(named, call)) && !parked.some((call) => parkedCall(named, call)));
    if (!loose.length) continue;
    const names = [...new Set(loose.map(({ method, key, cut }) => `${method} ${cut ? "…/" : "/"}${key.replace(/\*/g, "<…>")}`))];
    const writing = inProgressPlan(file);
    const say = withoutGit() || (writing && (writing.isNew || writing.briefChanged || writing.touched.length)) ? report.fail : report.warn;
    say(
      at(...plan.split("/")),
      `"## API brief" names ${names.join(", ")}, which no route sends and no Not now line names — a call no case covers is a Not now "Gap" (the user decides), a call only setup, cleanup or a lookup makes says so on its brief line (plans.md §Plan body)`,
    );
  }
}

/**
 * A later step showing a value of an earlier answer is that answer's (docs/Layer Routing Algorithm.md §7):
 * `no-request · screen …` on that step — a reopen from the front end's cache and a value the browser works out of
 * the answer (a masked card, a client-side total) too — its check or fields on the answer's line; `screen-only`
 * holds what no answer does (a message, a label). Fails in a block being written, warns in one the branch left alone.
 */
function checkLaterScreenOnly(_files, report) {
  for (const { plan, file, cases } of readPlans(ROOT)) {
    const writing = new Set((inProgressPlan(file)?.touched ?? []).map(keyOf));
    for (const block of cases.filter(({ status }) => /^ready/i.test(status))) {
      const heard = block.routes.filter(({ kind }) => kind === "intercept").map(({ step }) => step ?? 0);
      if (!heard.length) continue;
      const first = Math.min(...heard);
      const say = withoutGit() || writing.has(keyOf(block)) ? report.fail : report.warn;
      for (const shown of block.routes.filter(({ kind, step, screen }) => kind === "screen-only" && (step ?? 0) > first && screen.some(({ kind: shownAs }) => shownAs === "value"))) {
        say(
          at(...plan.split("/")),
          `"${block.title}" — Route (step ${shown.step}) "${shown.line}": a value shown after the answer of step ${first} is that answer's — "no-request · screen …" on this step (a reopen from cache, a value the browser works out of it), its check or fields on step ${first}'s line; screen-only only for what no answer holds (a message, a label) (docs/Layer Routing Algorithm.md §7)`,
        );
      }
    }
  }
}

export const caseRules = [
  checkWholeCases,
  checkBrowsersPhoneScreens,
  checkBlockedSearched,
  checkPlanPlaceholders,
  checkDraftedFromSource,
  checkAnswerSteps,
  checkExampleCorrections,
  checkPlanReview,
  checkP3Postponed,
  checkApiBrief,
  checkLaterScreenOnly,
];
