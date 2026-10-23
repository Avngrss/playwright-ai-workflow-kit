// Allure 3 report configuration — read by `allure generate` / `allure open` from the repo root.
// The tree groups by epic / feature / story / layer, which the reporter fills for every test from
// the spec's folder (src/reporting/report-tree.ts): app › area › feature › API|UI, smoke and
// user journeys (E2E) as their own groups — the report reads like specs/ and tests/ do.
// A run over several apps also gets one report per app (each test carries its app as the
// `platform` label), next to the report of all of them.
import fs from "node:fs";
import path from "node:path";
// Each failure under its likely cause (src/reporting/report-categories.mjs, part of the template).
import { categories } from "./src/reporting/report-categories.mjs";

const RESULTS = "reports/allure/results";
const GROUP_BY = ["epic", "feature", "story", "layer"];

/** The apps the last run covered, from the `platform` label of its results. */
function appsInResults() {
  if (!fs.existsSync(RESULTS)) return [];
  const apps = new Set();
  for (const file of fs.readdirSync(RESULTS).filter((name) => name.endsWith("-result.json"))) {
    try {
      const { labels = [] } = JSON.parse(fs.readFileSync(path.join(RESULTS, file), "utf8"));
      for (const label of labels) if (label.name === "platform" && label.value !== "default") apps.add(label.value);
    } catch {
      // a result still being written — the next generate reads it
    }
  }
  return [...apps].sort();
}

const apps = appsInResults();
const ofApp = (app) => (result) => result.labels.some((label) => label.name === "platform" && label.value === app);

export default {
  name: apps.length === 1 ? `AQA — ${apps[0]}` : "AQA",
  output: "reports/allure/html",
  // Local run-to-run history (History tab, retries/flaky trends). Gitignored — per machine.
  historyPath: "reports/allure/history.jsonl",
  categories,
  plugins: {
    awesome: { options: { reportName: apps.length > 1 ? "All apps" : undefined, groupBy: GROUP_BY } },
    ...(apps.length > 1
      ? Object.fromEntries(
          apps.map((app) => [`awesome-${app}`, { import: "@allurereport/plugin-awesome", options: { reportName: app, groupBy: GROUP_BY, filter: ofApp(app) } }]),
        )
      : {}),
  },
};
