import path from "node:path";
import { apiPlatforms, at, inProgress, read, ROOT, statementsOf } from "./context.mjs";
import { caseLinksIn, ownersOfRoute, readPlans, scenarioOf } from "./plans.mjs";
import { isVisualCheckpoint, testsOf } from "./specs.mjs";

/**
 * One scenario, one owner, one test, proven as its routes say (docs/Layer Routing Algorithm.md).
 * A plan's ready scenario has its `Route:` lines — one, or one per step
 * — that hold the formula and agree with its `Level:`; its test lives in that owner's folder and
 * checks what the routes name: the action's answer (and what it sent) through answerTo / answersTo,
 * no second read of it, nothing listened to when the browser decides alone, a screen check of each
 * kind in each routed step; an API test calls its stand-data rule. The gate checks the
 * test's structure, not which field a helper compares — that stays the review's, against the route.
 * A feature plan says what its owner check found; an app with an API never gets a plan with no API
 * scenario and no word on why. What is being written fails; what was written before routing is warned —
 * listed to rework, never blocking the gate.
 */

const why = "docs/Layer Routing Algorithm.md";

// Where an API scenario comes from when no screen shows the result (plans.md §Layers — the owner check).
const API_PLACES = ["other inputs", "access", "contract"];

function checkOwners(files, report) {
  const changed = inProgress("specs");
  const withApi = apiPlatforms();
  for (const { plan, app, journey, owners, cases, notNow } of readPlans(ROOT)) {
    // A journey plan has no `## Owners`: E2E owns each of its blocks.
    if (journey || (!cases.length && !notNow.length)) continue;
    const file = at(...plan.split("/"));
    const say = (message) => (!changed || changed.has(file) ? report.fail(file, message) : report.warn(file, message));
    if (!owners?.line) {
      say(`no "## Owners" with its "- found: UI <n> · API <n> · E2E <n> — <why>" line — what the owner check found (plans.md §Plan body)`);
      continue;
    }
    if (!owners.counts || owners.why.startsWith("<")) {
      say(`"found: ${owners.line}" does not read as "UI <n> · API <n> · E2E <n> — <why>" with each <…> filled (plans.md §Plan body)`);
      continue;
    }
    if (owners.counts.API > 0 || !withApi.has(app)) continue;
    // An agent that plans every case on the screen says, place by place, why no API scenario exists — a reason
    // of a few words from what it saw ("one role, no ids in the address"), never a bare "none".
    const reasonOf = (place) => new RegExp(`\\b${place}:\\s*([^·]*)`, "i").exec(owners.why)?.[1].trim() ?? "";
    const unsaid = API_PLACES.filter((place) => {
      const reason = reasonOf(place);
      return !reason || reason.startsWith("<") || reason.split(/\s+/).length < 3 || /^(none|n\/a|no|nothing|-|—)\W*$/i.test(reason);
    });
    if (unsaid.length) {
      say(`${app} has an API (specs/project-map.md), and "found:" names no API scenario — say why for each place one comes from, a reason of a few words from the live check, never a bare "none": "API 0 · … — none · other inputs: <why> · access: <why> · contract: <why>" (not said: ${unsaid.join(", ")}) (plans.md §Layers, the owner check)`);
    }
  }
}

function checkPlanRoutes(files, report) {
  const changed = inProgress("specs");
  for (const { plan, cases } of readPlans(ROOT)) {
    const file = at(...plan.split("/"));
    const written = !changed || changed.has(file);
    const say = (message) => (written ? report.fail(file, message) : report.warn(file, message));
    for (const { title, level, needs, routes } of cases.filter((entry) => /^ready/i.test(entry.status))) {
      if (!routes.length) {
        say(
          needs?.length > 1
            ? `"${title}" is planned on ${needs.join("+")} — one expected result proven twice: split the case into scenarios, each with one owner and its "Route:" line (${why} §4, §7); a feature's first refresh routes its whole plan`
            : `"${title}" has no "Route:" line — how its one test proves it: api / intercept / no-request / screen-only (${why} §7); a feature's first refresh routes its whole plan`,
        );
        continue;
      }
      if (!level) say(`"${title}" has no "Level:" — the scenario's one owner: API, UI or E2E (${why} §4)`);
      if (routes.length > 1 && routes.some(({ step }) => step === null)) {
        say(`"${title}" has ${routes.length} routes — label each with its step: "- Route (step 2): …" (${why} §7)`);
      }
      for (const route of routes) {
        for (const problem of route.problems) say(`"${title}" — Route "${route.line}": ${problem} (${why} §7)`);
        if (route.kind && level && !ownersOfRoute(route).includes(level)) {
          say(`"${title}" — Level ${level} with a route starting "${route.kind}": an api route belongs to an API scenario, every other to UI or E2E (${why} §4)`);
        }
      }
    }
  }
}

/** The names a statement gives a step's result: `const x = await test.step(` / `const [a, b] = …` / `const { a, b: c } = …`. */
function namesOf(binding) {
  return binding
    .replace(/^[[{]|[\]}]$/g, "")
    .split(",")
    .map((part) => part.split(":").pop().replace(/=.*$/, "").replace(/^\.\.\./, "").trim())
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
}

/** The steps of a test's text — title and where each starts — in order. */
function stepsOf(body) {
  return [...body.matchAll(/test\.step\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((match) => ({ title: match[2], at: match.index }));
}

const isPrepOrCleanup = (title) => /^(Setup|Cleanup):/.test(title ?? "");
// A named assertion helper (expectToast, expectNoMessage, expectRowsAddUp) stands for the matcher it
// holds; the HTTP and stand-data helpers check no screen.
const HELPER = /\bexpect(?!(?:Json|Status|Answer|StandData)\()[A-Z]\w*\(/;
// The matchers that check each kind on screen; a named helper counts for any kind.
const KIND_PROOF = {
  value: /\.(toEqual|toStrictEqual|toMatchObject|toContainEqual|toContain)\(/g,
  text: /\.(toHaveText|toContainText|toHaveURL|toContain)\(/g,
  state: /\.(toBeDisabled|toBeEnabled|toBeHidden|toBeAttached|toBeFocused|toHaveCount|toHaveLength|toBeChecked|toBeEditable|toHaveAttribute|toHaveValue|toBe|toBeTruthy|toBeFalsy)\(/g,
  visible: /\.toBeVisible\(/g,
};
const KIND_WORDS = {
  value: "a reader compared with shown<Block>(…) (toEqual / toMatchObject / toContainEqual) — a value the case states too: shown<Block>() — or a named check",
  text: "the exact words shown (a message, a label, a control's choice, the address) — expectToast, toHaveText, toHaveURL or a named check",
  state: "a control's state — toBeDisabled / toBeEnabled / toBeHidden / toHaveCount / toHaveAttribute / toBe(true), or a named check",
  visible: "that it appeared — toBeVisible",
};

/** A test's text without its Setup: / Cleanup: steps — where its checks are. */
function checkText(body, steps) {
  if (!steps.length) return body;
  return [body.slice(0, steps[0].at), ...steps.map((step, index) => (isPrepOrCleanup(step.title) ? "" : body.slice(step.at, steps[index + 1]?.at ?? body.length)))].join("\n");
}

/** What a UI or E2E test does against its scenario's routes — the findings, in the gate's words. */
function routeFindings(body, routes) {
  const findings = [];
  const steps = stepsOf(body);
  const stepAt = (index) => [...steps].reverse().find((step) => step.at <= index);
  const listens = /\banswers?To\(/.test(body);
  const intercepts = routes.filter(({ kind }) => kind === "intercept");

  if (intercepts.length && !listens) {
    const first = intercepts[0];
    findings.push(`its route listens to ${first.method} ${first.path} — the action goes through answerTo(<the client's answer path>, () => <page>.<action>(…), { has | check | sent | query | status }) — several answers of one action through answersTo — and the answer is checked there, never read again`);
  }
  if (intercepts.length) {
    if (intercepts.some(({ check }) => check) && !/\bcheck\s*:/.test(body)) findings.push(`its route proves stand data with check: ${intercepts.find(({ check }) => check).check} — hand that rule to answerTo(…, { check })`);
    if (intercepts.some(({ sent }) => sent.length) && !/\bsent\s*:/.test(body)) findings.push(`its route checks what the page sent (sent: ${intercepts.find(({ sent }) => sent.length).sent.join(", ")}) — answerTo(…, { sent: { … } })`);
    if (intercepts.some(({ query }) => query.length) && !/\bquery\s*:/.test(body)) findings.push(`its route checks what the page asked for (query: ${intercepts.find(({ query }) => query.length).query.join(", ")}) — answerTo(…, { query: { … } })`);
    for (const status of new Set(intercepts.map(({ status }) => status).filter(Boolean))) {
      if (!new RegExp(`\\bstatus\\s*:\\s*${status}\\b`).test(body)) findings.push(`its route expects ${status} — answerTo(…, { status: ${status} })`);
    }
  }
  if (routes.every(({ kind }) => kind === "no-request" || kind === "screen-only") && (listens || /\bwhenAnswered\(/.test(body))) {
    findings.push(`its route is ${routes[0].kind} — the browser decides alone: nothing is listened to (no answerTo / whenAnswered)`);
  }

  // A client read in a check step: only the reads the routes name. A read in a Setup step whose result
  // an expectation uses is a check under another name; a Setup step that creates (and cleans up) is not.
  const reads = [...body.matchAll(/\bexpectJson\(/g)].filter((match) => !isPrepOrCleanup(stepAt(match.index)?.title));
  const allowed = routes.filter(({ read }) => read).length;
  if (reads.length > allowed) {
    findings.push(`${reads.length} client read(s) in its checks — ${allowed ? `only the ${allowed} read(s) its routes name` : "none: the action's answer holds the data (answerTo), the screen is checked against the case's data"}; a rule's oracle comes from a fixture or the app's helper, never a spec step (${why} §9)`);
  }
  for (const match of body.matchAll(/(?:const|let)\s+(\[[^\]]*\]|\{[^}]*\}|[\w$]+)\s*=\s*await\s+test\.step\(\s*(["'`])((?:\\.|(?!\2)[^\\])*)\2/g)) {
    if (!/^Setup:/.test(match[3])) continue;
    // The step runs to the next step; after it, the rest of the test.
    const end = steps.find((step) => step.at > match.index + match[0].length)?.at ?? body.length;
    const stepText = body.slice(match.index, end);
    if (!/\bexpectJson\(/.test(stepText) || /\bcleanup\.add\(/.test(stepText)) continue;
    const later = statementsOf(body.slice(end)).map(({ text }) => text).filter((text) => /\bexpect\w*\(|\.to[A-Z]\w*\(/.test(text));
    const checked = namesOf(match[1]).filter((name) => later.some((text) => new RegExp(`(^|[^\\w$.])${name.replace(/\$/g, "\\$")}\\b`).test(text)));
    if (checked.length) {
      findings.push(`step "${match[3]}" reads ${checked.join(", ")} and an expectation checks it — a read whose result is expected is a check, not setup: take it from the action's answer (answerTo), or as the route's one read; a Setup step that creates data registers its cleanup (${why} §6)`);
    }
  }

  // The screen against the answer alone only for stand data (a check: route); known values are expected from the case's data.
  if (!routes.some(({ check }) => check)) {
    for (const match of body.matchAll(/(?:const|let)\s+([\w$]+)\s*=\s*await\s+answerTo\(/g)) {
      if (new RegExp(`\\bshown\\w*\\(\\s*${match[1]}\\s*\\)`).test(body)) findings.push(`shown…(${match[1]}) compares the screen with the answer — expect it from the case's data (shown…(caseData, ${match[1]}) for what only the server knows); the answer alone is shown only for stand data, a check: route (${why} §6)`);
    }
  }

  // Each routed step showing a kind has a check of that kind: one check never stands for every step.
  const checks = checkText(body, steps);
  const helpers = (checks.match(new RegExp(HELPER.source, "g")) ?? []).length;
  for (const kind of Object.keys(KIND_PROOF)) {
    const needed = new Set(routes.filter(({ screen }) => screen.some((token) => token.kind === kind)).map(({ step }) => step ?? 0)).size;
    if (!needed) continue;
    const proved = (checks.match(KIND_PROOF[kind]) ?? []).length + helpers;
    const shown = kind !== "value" || helpers > 0 || /\bshown\w*\(/.test(checks);
    if (proved >= needed && shown) continue;
    findings.push(
      needed > 1
        ? `its routes show a ${kind} in ${needed} steps, the test checks ${proved} — ${KIND_WORDS[kind]}, in each routed step`
        : `its route shows a ${kind} — ${KIND_WORDS[kind]}`,
    );
  }
  return findings;
}

/** An API test against its routes: the stand-data rule it names, a status other than 200. */
function apiRouteFindings(body, routes) {
  const findings = [];
  for (const { check, status } of routes) {
    const rule = check && /^[\w$]+/.exec(check)[0];
    if (rule && !new RegExp(`(^|[^\\w$.])${rule.replace(/\$/g, "\\$")}\\(`).test(body)) findings.push(`its route proves stand data with check: ${check} — the test calls ${rule} on the answer`);
    if (status && status !== 200 && !new RegExp(`\\b${status}\\b`).test(body)) findings.push(`its route expects ${status} — the test checks that status`);
  }
  return findings;
}

function checkTestRoutes(files, report) {
  const plans = readPlans(ROOT);
  if (plans.length === 0) return;
  // A routed ready scenario, by its case id and scenario — or, for a plan without TMS ids, by its title.
  const scenarios = new Map();
  for (const { plan, app, cases } of plans) {
    for (const entry of cases.filter((item) => item.routes.length && /^ready/i.test(item.status))) {
      const keys = entry.ids.length ? entry.ids.map((id) => `${app}|${id}|${entry.scenario}`) : [`${app}|title|${entry.title}`];
      for (const key of keys) scenarios.set(key, { plan, ...entry });
    }
  }
  const changed = inProgress("tests");
  for (const spec of [...files.api, ...files.ui, ...files.e2e]) {
    const [layer, app] = path.relative(at("tests"), spec).split(path.sep);
    const written = !changed || changed.has(spec);
    const say = (message) => (written ? report.fail(spec, message) : report.warn(spec, message));
    for (const { title, options, body, tags } of testsOf(read(spec))) {
      // A screenshot checkpoint of its own file checks how a state looks, not the scenario's route.
      if (isVisualCheckpoint(spec, tags)) continue;
      const ids = caseLinksIn(options);
      const keys = ids.length ? ids.map((id) => `${app}|${id}|${scenarioOf(title)}`) : [`${app}|title|${title}`];
      const scenario = keys.map((key) => scenarios.get(key)).find(Boolean);
      if (!scenario) continue;
      const owner = layer.toUpperCase();
      if (scenario.level && owner !== scenario.level) {
        say(`"${title}" is in tests/${layer}, but ${scenario.plan} gives the scenario to ${scenario.level} — one scenario, one test in its owner's folder (${why} §4)`);
        continue;
      }
      const routeLines = scenario.routes.map(({ line }) => line).join(" | ");
      for (const finding of owner === "API" ? apiRouteFindings(body, scenario.routes) : routeFindings(body, scenario.routes)) say(`"${title}" — ${finding} (${scenario.plan}: Route ${routeLines})`);
    }
  }
}

export const routeRules = [checkOwners, checkPlanRoutes, checkTestRoutes];
