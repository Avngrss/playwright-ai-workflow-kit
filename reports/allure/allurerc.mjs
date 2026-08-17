import { defineConfig } from "allure";

export default defineConfig({
  name: "Playwright AI Workflow Kit",
  output: "./reports/allure/html",
  hideLabels: ["host", "thread", "package"],
  plugins: {
    awesome: {
      options: {
        groupBy: ["feature", "story"],
      },
    },
  },
});
