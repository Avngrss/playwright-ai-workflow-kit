import { inProgress, read, statementsOf, workingStatementsOf } from "./context.mjs";

/**
 * A UI test reads as its case (.cursor/rules/specs.mdc): it acts through Page
 * Object methods and compares readers with shown<Block>(…), shaping no data itself. A spec being
 * written fails; a committed one is warned, not reworked for a later rule.
 */

const STEP_GUIDE = 8;

// What a reader would have to decode, each with the words the message uses.
const SHAPING = [
  // A function with parameters; an action handed over (`() => …`), a test's or hook's fixtures and a
  // mock's route handler are not.
  ["a function with parameters", /(?<!\basync\s*)(\((?=[^()]*[^\s()])[^()]*\)|\b[A-Za-z_$][\w$]*)\s*=>/],
  ["a list shaped", /\.(map|filter|flatMap|flat|reduce|some|every|find|findIndex|sort|slice)\(|new Set\(|Object\.(fromEntries|keys|values|entries|groupBy)\(/],
  ["a value converted", /\.(toFixed|toUpperCase|toLowerCase|trim|padStart|padEnd|split|join|replace)\(/],
  ["?? or ! on data", /\?\?|[\w\])]!(?=[.),;\]\s])/],
  ["a value picked from (await …)", /(^|[^\w)\]$])\(\s*await\s/],
];

// Words inside a text are not code; a mock's route handler is the one function with a parameter a spec keeps.
const asCode = (text) => text.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""').replace(/\(\s*route\s*\)\s*=>/g, "() =>");
const isComment = (text) => /^(\/\/|\/\*|\*)/.test(text);

function readsAsItsCase(files, report) {
  const changed = inProgress();
  for (const spec of [...files.ui, ...files.e2e]) {
    const written = !changed || changed.has(spec);
    const statements = statementsOf(asCode(read(spec))).filter(({ text }) => !isComment(text) && !text.startsWith("import "));

    const found = SHAPING.map(([words, pattern]) => [words, statements.filter(({ text }) => pattern.test(text)).map(({ line }) => line)]).filter(([, lines]) => lines.length);
    if (found.length) {
      const where = found.map(([words, lines]) => `${words} (line${lines.length > 1 ? "s" : ""} ${lines.slice(0, 4).join(", ")}${lines.length > 4 ? ", …" : ""})`).join("; ");
      const message = `the test shapes data itself: ${where} — a UI test reads as its case: an action of the case is a Page Object method, a block is one check of its read() against shown<Block>(…) in src/assertions/<app>/ (.cursor/rules/specs.mdc §A UI test reads as its case)`;
      if (written) report.fail(spec, message);
      else report.warn(spec, message);
    }

    if (!written) continue;
    // A step runs from its `test.step(…, … => {` to the closing line at the same indentation.
    const lines = read(spec).split(/\r?\n/);
    const working = workingStatementsOf(read(spec));
    const indent = (line) => /^\s*/.exec(line)[0].length;
    for (const step of statements.filter(({ text }) => /\btest\.step\(/.test(text) && text.endsWith("{"))) {
      const start = step.line - 1;
      const end = lines.findIndex((line, index) => index > start && line.trim().startsWith("}") && indent(line) <= indent(lines[start]));
      const size = working.filter(({ line }) => line > step.line && line <= end).length;
      if (size > STEP_GUIDE) report.warn(spec, `the step at line ${step.line} has ~${size} statements (guide ≤ ${STEP_GUIDE}) — a step is one action of the case and its checks`);
    }
  }
}

export const readingRules = [readsAsItsCase];
