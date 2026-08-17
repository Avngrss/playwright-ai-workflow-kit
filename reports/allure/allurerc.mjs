import { defineConfig } from "allure";

export default defineConfig({
  name: "Playwright AI Workflow Kit",
  output: "./reports/allure/html",
  hideLabels: [
    "host",
    "thread",
    "package",
    "language",
    "framework",
    "titlePath",
    "_fallbackTestCaseId",
  ],
  plugins: {
    awesome: {
      options: {
        singleFile: true,
        reportLanguage: "en",
        groupBy: ["layer", "feature", "story"],
        charts: [
          {
            type: "currentStatus",
            title: "Results overview",
            statuses: ["passed", "failed", "broken", "skipped"],
            metric: "passed",
          },
          {
            type: "testResultSeverities",
            title: "Results by priority",
            levels: ["critical", "normal", "minor"],
            statuses: ["passed", "failed", "broken", "skipped"],
            includeUnset: true,
          },
        ],
      },
    },
  },
});
