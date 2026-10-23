import path from "node:path";
import { at, read, ROOT } from "./context.mjs";
import { caseLinksIn, keepsOut, readPlans } from "./plans.mjs";
import { testsOf } from "./specs.mjs";

/**
 * A manual case is automated whole or not at all, on the layers its plan says it needs (the plan skill,
 * "Whole case"): no test links a case its plan keeps in Not now — blocked,
 * postponed, a layer not in this run; only "Covered by …" leaves it written — and a case its tests
 * cover on one needed layer is covered on every one.
 */
function checkWholeCases(files, report) {
  const plans = readPlans(ROOT);
  if (plans.length === 0) return;
  const testsOfCase = new Map();
  for (const spec of [...files.api, ...files.ui, ...files.e2e]) {
    const [layer, app] = path.relative(at("tests"), spec).split(path.sep);
    for (const { title, options } of testsOf(read(spec))) {
      for (const id of caseLinksIn(options)) {
        const key = `${app}|${id}`;
        testsOfCase.set(key, [...(testsOfCase.get(key) ?? []), { spec, title, layer: layer.toUpperCase() }]);
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
    // A case planned as several blocks (its API and UI sides) repeats its Needs line: one finding.
    const seen = new Set();
    for (const { ids, needs } of cases.filter((entry) => entry.needs && /^ready/i.test(entry.status))) {
      for (const id of ids.filter((value) => !seen.has(value))) {
        seen.add(id);
        const tests = testsOfCase.get(`${app}|${id}`) ?? [];
        const missing = tests.length ? needs.filter((layer) => !tests.some((test) => test.layer === layer)) : [];
        if (missing.length) {
          report.fail(
            at(...plan.split("/")),
            `case ${id} needs ${needs.join("+")}, and no ${missing.join("+")} test links it — write it, or move the case to Not now "Needs ${needs.join("+")}" (not in this run) and drop its other tests' link (the plan skill, "Whole case")`,
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
        `has UI cases but no ${missing.map((name) => `"${name}:"`).join(", ")} line in "## Browsers, phone, screenshots" — run the probe of live-app.mdc on its screens and record each decision, or "none — <what was checked>" (the plan skill, "Browsers, phone, screenshots")`,
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

export const caseRules = [checkWholeCases, checkBrowsersPhoneScreens];
