import { inProgress, read, workingStatementsOf } from "./context.mjs";

/**
 * Page Objects and components (.cursor/rules/ui.mdc): locators as
 * `readonly` fields, actions and readers of what is shown — nothing else. These rules look only at
 * the files being written: committed code is not reworked for a later rule.
 */

const MODIFIERS = String.raw`(?:(?:public|protected|private|static|override|abstract|async|readonly)\s+)*`;

/** A file's classes: name, the class it extends and its body. Strings and comments are skipped while the braces are counted. */
function classesOf(source) {
  const classes = [];
  for (const match of source.matchAll(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?[^{]*\{/gm)) {
    let depth = 1;
    let index = match.index + match[0].length;
    const start = index;
    while (index < source.length && depth > 0) {
      const [char, next] = [source[index], source[index + 1]];
      if (char === "/" && (next === "/" || next === "*")) {
        const end = source.indexOf(next === "/" ? "\n" : "*/", index + 2);
        index = end === -1 ? source.length : end + (next === "/" ? 0 : 1);
      } else if (char === '"' || char === "'" || char === "`") {
        for (index += 1; index < source.length && source[index] !== char; index += 1) if (source[index] === "\\") index += 1;
      } else if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
      index += 1;
    }
    classes.push({ name: match[1], base: match[2], body: source.slice(start, index - 1) });
  }
  return classes;
}

/** The members declared in a class body (fields, getters, methods), constructor aside. */
const memberNames = (body) =>
  [...body.matchAll(new RegExp(String.raw`^ {2}${MODIFIERS}(?:get\s+(\w+)\s*\(|(\w+)\s*\??\s*(?:<[^>]*>)?\s*[:=(])`, "gm"))]
    .map((m) => m[1] ?? m[2])
    .filter((name) => name && name !== "constructor");

function checkModels(files, report) {
  const changed = inProgress("src");
  const writing = (file) => !changed || changed.has(file);
  const sources = files.testCode.map((file) => ({ file, text: read(file) }));
  const classes = files.uiModels.flatMap((file) => classesOf(read(file)).map((model) => ({ ...model, file })));

  for (const file of files.uiModels.filter(writing)) {
    const content = read(file);
    const own = classes.filter((model) => model.file === file);
    const bodies = own.map(({ body }) => body).join("\n");

    // Past ~15 locators / ~150 lines it holds a block of its own. Locators only: a field holding a component is a block already moved out.
    const locatorMember = String.raw`^ {2}${MODIFIERS}(?:\w+\s*:\s*Locator\b|get\s+\w+\s*\(\s*\)[^{]*\{(?!\s*return\s+new\b))`;
    const locators = (bodies.match(new RegExp(locatorMember, "gm")) ?? []).length;
    const lines = workingStatementsOf(content).length;
    if (locators > 15 || lines > 150) {
      const move = files.components.includes(file)
        ? "look for a part with actions of its own (a tab you work) to make its own component; plain fields stay"
        : "look for a self-contained block with actions of its own, or a block repeated per item, to make a component; plain fields stay";
      report.warn(file, `${locators} locators / ${lines} statements (guide ~15 / ~150) — ${move}`);
    }

    // It keeps no state: every field is readonly, set once.
    const changing = [...bodies.matchAll(/^ {2}(?:(?:public|protected|private|static|override)\s+)*(?!readonly\b|get\b|set\b|async\b|abstract\b|constructor\b)(\w+)\s*\??\s*[:=](?!=)/gm)].map((m) => m[1]);
    if (changing.length) report.warn(file, `${changing.join(", ")} — a field that changes keeps state; a Page Object holds locators, actions and readers (every field readonly)`);

    // One name per locator.
    const aliases = [...bodies.matchAll(new RegExp(String.raw`^\s*this\.(\w+)\s*=\s*this\.(\w+);|^ {2}${MODIFIERS}(\w+)\s*=\s*this\.(\w+);|^ {2}get\s+(\w+)\s*\(\s*\)[^{]*\{\s*return\s+this\.(\w+);?\s*\}`, "gm"))];
    for (const alias of aliases) {
      const [name, other] = [alias[1] ?? alias[3] ?? alias[5], alias[2] ?? alias[4] ?? alias[6]];
      report.warn(file, `'${name}' is a second name for '${other}' — one name per locator`);
    }

    // Nothing kept that no test uses: read as `.name` (not only set) or destructured anywhere.
    const unused = [...new Set(memberNames(bodies))].filter((name) => {
      const usedAt = new RegExp(String.raw`\.${name}\b(?!\s*=[^=])|\{[^{}]*\b${name}\b[^{}]*\}\s*=[^=]`);
      return !sources.some(({ text }) => usedAt.test(text));
    });
    if (unused.length) report.fail(file, `${unused.join(", ")} used nowhere — delete until a test needs it`);
  }

  // Pages built alike share a base that acts; a public method written again in two of its subclasses is the base's.
  const siblings = new Map();
  for (const model of classes.filter(({ base, file }) => base && files.pages.includes(file))) {
    const publicMethods = [...model.body.matchAll(/^ {2}(?:async\s+)?(?!get\b|set\b|constructor\b)(\w+)\s*(?:<[^>]*>)?\s*\(/gm)].map((m) => m[1]);
    for (const method of publicMethods) {
      const key = `${model.base}.${method}`;
      siblings.set(key, [...(siblings.get(key) ?? []), model]);
    }
  }
  for (const [key, models] of siblings) {
    if (models.length < 2 || !models.some(({ file }) => writing(file))) continue;
    const [base, method] = key.split(".");
    report.warn(models.find(({ file }) => writing(file)).file, `${method}() is written in ${models.map(({ name }) => name).join(", ")}, all extending ${base} — pages built alike: the base does it, each page declares what differs (.cursor/rules/ui.mdc)`);
  }
}

export const modelRules = [checkModels];
