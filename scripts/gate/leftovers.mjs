import path from "node:path";
import { listFiles, ROOT } from "./context.mjs";

/**
 * Temporary artifacts left behind — a debug or discovery script, a dump, a scratch copy, a probe — are deleted before
 * a task is called done (agents/rules/01-workflow.md §Cleanup before "done"). Only a name that says it is temporary
 * fails; every other file is the agent's to judge.
 */
const TEMPORARY = /^(debug|discover|scratch|probe)[-_.]|-discovery\.json$/i;
// Runtime output of the browser tools and the report: theirs, not the agent's leftovers.
const RUNTIME = /(^|\/)(\.playwright-mcp|\.playwright-cli|allure-results|allure-report)\//;

function checkLeftovers(_files, report) {
  for (const file of listFiles(ROOT, (full) => TEMPORARY.test(path.basename(full)))) {
    if (RUNTIME.test(path.relative(ROOT, file).split(path.sep).join("/"))) continue;
    report.fail(file, "a temporary artifact — move what it found to its home (a locator to its Page Object, a decision to the plan), then delete it; kept on purpose → name it after what it does");
  }
}

export const leftoverRules = [checkLeftovers];
